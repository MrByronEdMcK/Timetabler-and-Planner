/* ==========================================================================
   Class Timer & Break Pacer (Device Clock Synced with Double Lesson Detection)
   ========================================================================== */

const ClassTimer = {
  numBreaks: 1,
  breakDurationMinutes: 3,
  soundEnabled: true,
  isPinned: false,
  isHidden: false,
  selectedClassId: null,
  activeSchedule: null,
  timerInterval: null,
  lastSectionType: null,
  isInitialized: false,
  isDraggingBreak: false,
  draggedBreakIndex: null,
  trackRenderedKey: null,

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Load saved preferences if available
    try {
      const saved = localStorage.getItem('aus_teacher_wb_timer_prefs');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.numBreaks !== undefined) this.numBreaks = p.numBreaks;
        if (p.breakDurationMinutes !== undefined) this.breakDurationMinutes = (p.breakDurationMinutes === 5) ? 5 : 3;
        if (p.soundEnabled !== undefined) this.soundEnabled = p.soundEnabled;
        if (p.isPinned !== undefined) this.isPinned = p.isPinned;
        if (p.isHidden !== undefined) this.isHidden = p.isHidden;
      }
      const savedSched = localStorage.getItem('aus_teacher_wb_active_schedule');
      if (savedSched) {
        const s = JSON.parse(savedSched);
        if (s && s.endMs && s.endMs > Date.now() && s.isPinned) {
          this.activeSchedule = s;
          this.selectedClassId = s.classId || this.selectedClassId;
        }
      }
    } catch (e) {
      // Fallback to defaults
    }

    // Start continuous background ticking (keeps ticking even when whiteboard view is closed)
    this.startTicking();
    this.bindEvents();
    this.bindDragEvents();
  },

  startTicking() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => this.tick(), 1000);
    // Initial immediate tick
    this.tick();
  },

  /**
   * Helper to parse 'HH:MM' string to minutes from midnight
   */
  parseTimeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':');
    if (parts.length < 2) return 0;
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  },

  /**
   * Detects the currently active or upcoming lesson block for a given class,
   * automatically recognising double lessons (contiguous back-to-back periods).
   */
  detectCurrentLessonBlock(classId, now = new Date()) {
    const currentState = (typeof state !== 'undefined' && state.periods)
      ? state
      : (window.state || { periods: [], timetableSlots: {}, classes: [] });

    if (!classId || !currentState.periods || currentState.periods.length === 0) {
      return { active: false, reason: 'no_class_or_periods' };
    }

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { active: false, reason: 'weekend', todayStr, dayOfWeek };
    }

    const tm = (typeof TimetableManager !== 'undefined' && TimetableManager.getWeekCycleNumber)
      ? TimetableManager
      : (window.TimetableManager || {});
    const weekCycle = tm.getWeekCycleNumber ? tm.getWeekCycleNumber(todayStr) : 1;

    // Check all-day blockouts
    const termMgr = (typeof TermManager !== 'undefined' && TermManager.getBlockoutForDate)
      ? TermManager
      : (window.TermManager || {});
    if (termMgr.getBlockoutForDate) {
      const allDayBlock = termMgr.getBlockoutForDate(todayStr, classId, null);
      if (allDayBlock && allDayBlock.blockAllDay) {
        return { active: false, reason: 'blocked_all_day', eventTitle: allDayBlock.title };
      }
    }

    // Filter teaching periods (non-break)
    const teachingPeriods = currentState.periods.filter(p => !p.isBreak && p.startTime && p.endTime);

    // Find periods assigned to classId today
    const assignedPeriods = [];
    teachingPeriods.forEach(p => {
      let isMatch = false;
      if (tm.getClassForSlot) {
        const slotClass = tm.getClassForSlot(weekCycle, dayOfWeek, p.id);
        if (slotClass && slotClass.id === classId) {
          isMatch = true;
        }
      }

      // Check timetableSlots directly as fallback
      if (!isMatch && currentState.timetableSlots) {
        const key = `${weekCycle}_${dayOfWeek}_${p.id}`;
        const val = currentState.timetableSlots[key];
        const assignedId = typeof val === 'string' ? val : (val ? val.classId : null);
        if (assignedId === classId) {
          isMatch = true;
        } else if (currentState.getLinkedClasses) {
          const linked = currentState.getLinkedClasses(classId);
          if (linked && linked.some(l => l.id === assignedId)) {
            isMatch = true;
          }
        }
      }

      if (isMatch) {
        // Verify period is not blocked by a blockout event
        let periodBlocked = false;
        if (termMgr.getBlockoutForDate) {
          const pb = termMgr.getBlockoutForDate(todayStr, classId, p.id);
          if (pb) periodBlocked = true;
        }
        if (!periodBlocked) {
          assignedPeriods.push(p);
        }
      }
    });

    if (assignedPeriods.length === 0) {
      return { active: false, reason: 'no_lessons_today', todayStr, dayOfWeek, weekCycle };
    }

    // Sort assigned periods chronologically by start time
    assignedPeriods.sort((a, b) => this.parseTimeToMinutes(a.startTime) - this.parseTimeToMinutes(b.startTime));

    // Group contiguous periods into lesson blocks (Double / Triple Lessons)
    const blocks = [];
    let currentBlock = null;

    assignedPeriods.forEach(p => {
      const pStart = this.parseTimeToMinutes(p.startTime);
      const pEnd = this.parseTimeToMinutes(p.endTime);

      if (!currentBlock) {
        currentBlock = {
          periods: [p],
          startTime: p.startTime,
          endTime: p.endTime,
          startMinutes: pStart,
          endMinutes: pEnd
        };
      } else {
        // Consecutive / Contiguous check
        const isBackToBack = (pStart === currentBlock.endMinutes);
        if (isBackToBack) {
          currentBlock.periods.push(p);
          currentBlock.endTime = p.endTime;
          currentBlock.endMinutes = pEnd;
        } else {
          blocks.push(currentBlock);
          currentBlock = {
            periods: [p],
            startTime: p.startTime,
            endTime: p.endTime,
            startMinutes: pStart,
            endMinutes: pEnd
          };
        }
      }
    });
    if (currentBlock) blocks.push(currentBlock);

    // Annotate blocks with labels and duration
    blocks.forEach(b => {
      b.isDouble = (b.periods.length > 1);
      if (b.isDouble) {
        b.label = `Double Lesson (${b.periods.map(p => p.name).join(' & ')})`;
      } else {
        b.label = b.periods[0].name;
      }
      b.durationMinutes = b.endMinutes - b.startMinutes;
    });

    // Device clock time in minutes from midnight
    const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    // Check if any block is currently in session
    const activeBlock = blocks.find(b => nowMinutes >= b.startMinutes && nowMinutes < b.endMinutes);

    if (activeBlock) {
      const remainingMinutes = activeBlock.endMinutes - nowMinutes;
      const remainingSeconds = Math.max(0, Math.round(remainingMinutes * 60));
      return {
        active: true,
        block: activeBlock,
        remainingMinutes,
        remainingSeconds,
        todayBlocks: blocks,
        nowMinutes,
        todayStr
      };
    }

    // Not in session: find upcoming block today
    const upcomingBlock = blocks.find(b => nowMinutes < b.startMinutes);
    return {
      active: false,
      reason: upcomingBlock ? 'upcoming' : 'past',
      upcomingBlock,
      todayBlocks: blocks,
      nowMinutes,
      todayStr
    };
  },

  /**
   * Generates a timeline schedule dividing remaining lesson time into even
   * Work intervals interspersed with the specified number and duration of Breaks.
   */
  calculateSchedule(remainingSeconds, numBreaks = 1, breakDurationMinutes = 3, nowMs = Date.now()) {
    remainingSeconds = Math.max(0, Math.round(remainingSeconds));
    numBreaks = Math.max(0, parseInt(numBreaks, 10) || 0);
    breakDurationMinutes = Math.max(1, parseInt(breakDurationMinutes, 10) || 1);

    const endMs = nowMs + (remainingSeconds * 1000);

    // Single work segment if 0 breaks or very short duration
    if (numBreaks === 0 || remainingSeconds <= 60) {
      return {
        startMs: nowMs,
        endMs: endMs,
        totalSeconds: remainingSeconds,
        numBreaks: 0,
        breakDurationMinutes,
        segments: [
          {
            id: 0,
            type: 'work',
            name: 'Work',
            startMs: nowMs,
            endMs: endMs,
            durationSec: remainingSeconds
          }
        ]
      };
    }

    let breakDurationSec = breakDurationMinutes * 60;
    let totalBreakSec = numBreaks * breakDurationSec;

    // Guard: Ensure total breaks don't crowd out work time (preserve at least 30% for work)
    if (totalBreakSec >= remainingSeconds * 0.7) {
      breakDurationSec = Math.max(30, Math.floor((remainingSeconds * 0.3) / numBreaks));
      totalBreakSec = numBreaks * breakDurationSec;
    }

    const totalWorkSec = Math.max(0, remainingSeconds - totalBreakSec);
    const numWorkChunks = numBreaks + 1;
    const workChunkSec = totalWorkSec / numWorkChunks;

    const segments = [];
    let curMs = nowMs;

    // First Work chunk
    const firstWorkMs = Math.round(workChunkSec * 1000);
    segments.push({
      id: 0,
      type: 'work',
      name: 'Work',
      startMs: curMs,
      endMs: curMs + firstWorkMs,
      durationSec: Math.round(workChunkSec)
    });
    curMs += firstWorkMs;

    // Evenly place Breaks and subsequent Work chunks
    for (let i = 1; i <= numBreaks; i++) {
      const breakMs = Math.round(breakDurationSec * 1000);
      segments.push({
        id: segments.length,
        type: 'break',
        breakIndex: i - 1,
        name: `Break ${numBreaks > 1 ? i : ''}`.trim(),
        startMs: curMs,
        endMs: curMs + breakMs,
        durationSec: breakDurationSec
      });
      curMs += breakMs;

      // Last work chunk ends at exact endMs
      const nextWorkEnd = (i === numBreaks) ? endMs : curMs + Math.round(workChunkSec * 1000);
      segments.push({
        id: segments.length,
        type: 'work',
        name: 'Work',
        startMs: curMs,
        endMs: nextWorkEnd,
        durationSec: Math.round((nextWorkEnd - curMs) / 1000)
      });
      curMs = nextWorkEnd;
    }

    return {
      startMs: nowMs,
      endMs: endMs,
      totalSeconds: remainingSeconds,
      numBreaks,
      breakDurationMinutes,
      segments
    };
  },

  /**
   * Evaluates the active schedule at a given point in time (nowMs)
   */
  getCurrentStatus(nowMs = Date.now()) {
    if (!this.activeSchedule) {
      return { hasSchedule: false, isEnded: false, remainingClassSec: 0, type: 'idle' };
    }

    const { endMs, segments } = this.activeSchedule;
    const remainingClassSec = Math.max(0, Math.round((endMs - nowMs) / 1000));

    if (nowMs >= endMs) {
      return {
        hasSchedule: true,
        isEnded: true,
        remainingClassSec: 0,
        activeSegment: null,
        type: 'finished',
        title: 'CLASS COMPLETE',
        remainingSec: 0
      };
    }

    // Find currently active segment
    const activeSegment = segments.find(s => nowMs >= s.startMs && nowMs < s.endMs) || segments[segments.length - 1];
    const remainingSec = Math.max(0, Math.round((activeSegment.endMs - nowMs) / 1000));

    return {
      hasSchedule: true,
      isEnded: false,
      remainingClassSec,
      activeSegment,
      type: activeSegment.type, // 'work' or 'break'
      name: activeSegment.name,
      remainingSec
    };
  },

  /**
   * Starts or updates schedule for a class session.
   * If a timer is pinned or already actively running and not forceRestarted, preserves it!
   */
  startLessonTimer(classId, customSeconds = null, customLabel = null, forceRestart = false) {
    this.selectedClassId = classId;
    const now = new Date();
    const nowMs = now.getTime();

    // 1. Detect if a class is actually currently running on the timetable
    const detection = this.detectCurrentLessonBlock(classId, now);

    if (detection.active && !customSeconds) {
      // Non-manual timed class: start & end times should ALWAYS be the start & end of the class period!
      const periodStartMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(),
                                     Math.floor(detection.block.startMinutes / 60),
                                     Math.round(detection.block.startMinutes % 60), 0, 0).getTime();
      const periodEndMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(),
                                   Math.floor(detection.block.endMinutes / 60),
                                   Math.round(detection.block.endMinutes % 60), 0, 0).getTime();

      // For classes in progress, reopening should always just reopen back into the current timer!
      if (!forceRestart && this.activeSchedule && !this.activeSchedule.isManual &&
          this.activeSchedule.classId === classId &&
          this.activeSchedule.startMs === periodStartMs &&
          this.activeSchedule.endMs === periodEndMs &&
          this.activeSchedule.endMs > nowMs) {
        this.trackRenderedKey = null;
        this.savePrefs();
        this.updateDOM();
        return;
      }

      const totalSec = Math.round((periodEndMs - periodStartMs) / 1000);
      const schedule = this.calculateSchedule(totalSec, this.numBreaks, this.breakDurationMinutes, periodStartMs);
      schedule.classId = classId;
      schedule.label = detection.block.label;
      schedule.isManual = false;
      this.isPinned = false; // Pinning is only for manually started timers!

      this.activeSchedule = schedule;
      this.lastSectionType = schedule.segments[0]?.type || 'work';
      this.trackRenderedKey = null;
      this.savePrefs();
      this.updateDOM();
      return;
    }

    // 2. Class is NOT currently running (or custom seconds requested): Manual timer
    // If pinned manual timer is already running for this class, keep it!
    if (!forceRestart && this.activeSchedule && this.activeSchedule.isManual && this.isPinned) {
      if (this.activeSchedule.endMs > nowMs) {
        this.trackRenderedKey = null;
        this.savePrefs();
        this.updateDOM();
        return;
      }
    }

    // Fresh 50-minute manual timer (or custom specified)
    const durationSec = customSeconds || (50 * 60);
    const label = customLabel || 'Class Session (Manual)';
    const schedule = this.calculateSchedule(durationSec, this.numBreaks, this.breakDurationMinutes, nowMs);
    schedule.classId = classId;
    schedule.label = label;
    schedule.isManual = true;

    this.activeSchedule = schedule;
    this.lastSectionType = schedule.segments[0]?.type || 'work';
    this.trackRenderedKey = null;
    this.savePrefs();
    this.updateDOM();
  },

  togglePin() {
    // Pinning is only for manually started timers, not for classes in progress!
    if (this.activeSchedule && !this.activeSchedule.isManual) {
      return;
    }
    this.isPinned = !this.isPinned;
    this.savePrefs();
    this.updateDOM();
    if (typeof window !== 'undefined' && window.showToastNotification) {
      window.showToastNotification(this.isPinned ? '📌 Class Timer Pinned! Keeps running in background without resetting.' : '📌 Class Timer Unpinned');
    }
  },

  /**
   * Re-spaces breaks. When a timer is pinned or for a class in progress, start and end times
   * NEVER change, only the breaks are respaced within the fixed window.
   * When unpinned, respacing starts from now.
   */
  respaceBreaks() {
    if (!this.activeSchedule) {
      if (this.selectedClassId) {
        this.startLessonTimer(this.selectedClassId, null, null, true);
      }
      return;
    }

    const nowMs = Date.now();
    const isPinnedOrClassInProgress = this.isPinned || !this.activeSchedule.isManual;

    if (isPinnedOrClassInProgress) {
      // KEEP start and end times completely fixed! Only respace breaks within the lesson window.
      const totalSec = Math.round((this.activeSchedule.endMs - this.activeSchedule.startMs) / 1000);
      if (totalSec <= 0) return;

      const newSchedule = this.calculateSchedule(totalSec, this.numBreaks, this.breakDurationMinutes, this.activeSchedule.startMs);
      newSchedule.classId = this.activeSchedule.classId;
      newSchedule.label = this.activeSchedule.label;
      newSchedule.isManual = this.activeSchedule.isManual;

      this.activeSchedule = newSchedule;
    } else {
      // Unpinned manual timer: respacing can change start time to now and respace across remaining time
      const remainingSec = Math.max(0, Math.round((this.activeSchedule.endMs - nowMs) / 1000));
      if (remainingSec <= 0) return;

      const newSchedule = this.calculateSchedule(remainingSec, this.numBreaks, this.breakDurationMinutes, nowMs);
      newSchedule.classId = this.activeSchedule.classId;
      newSchedule.label = this.activeSchedule.label;
      newSchedule.isManual = true;

      this.activeSchedule = newSchedule;
    }

    this.trackRenderedKey = null;
    this.savePrefs();
    this.updateDOM();
  },

  addTimer() {
    let classId = this.selectedClassId;
    if (!classId && typeof HomeworkUI !== 'undefined' && HomeworkUI.selectedClassId) {
      classId = HomeworkUI.selectedClassId;
      this.selectedClassId = classId;
    }
    this.isHidden = false;
    this.startLessonTimer(classId, null, null, true);
    this.savePrefs();
    this.updateDOM();
    if (typeof window !== 'undefined' && window.showToastNotification) {
      window.showToastNotification('⏱️ Class timer added');
    }
  },

  removeTimer() {
    this.activeSchedule = null;
    this.isPinned = false;
    this.isHidden = false;
    this.trackRenderedKey = null;
    this.lastSectionType = null;
    this.savePrefs();
    this.updateDOM();
    if (typeof window !== 'undefined' && window.showToastNotification) {
      window.showToastNotification('Class timer removed');
    }
  },

  onEndTimeChanged(newTimeStr) {
    if (!this.activeSchedule || !this.activeSchedule.isManual) return;
    if (!newTimeStr) return;
    const parts = newTimeStr.split(':');
    if (parts.length < 2) return;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return;

    const targetEnd = new Date(this.activeSchedule.startMs);
    targetEnd.setHours(h, m, 0, 0);

    // End time must be strictly after start time
    if (targetEnd.getTime() <= this.activeSchedule.startMs) {
      if (typeof window !== 'undefined' && window.showToastNotification) {
        window.showToastNotification('⚠️ End time must be after the start time', 'warning');
      }
      this.updateDOM();
      return;
    }

    const newEndMs = targetEnd.getTime();
    const newTotalSec = Math.round((newEndMs - this.activeSchedule.startMs) / 1000);
    if (newTotalSec < 60) return; // at least 1 minute

    const newSchedule = this.calculateSchedule(newTotalSec, this.numBreaks, this.breakDurationMinutes, this.activeSchedule.startMs);
    newSchedule.classId = this.activeSchedule.classId;
    newSchedule.label = this.activeSchedule.label;
    newSchedule.isManual = true;

    this.activeSchedule = newSchedule;
    this.trackRenderedKey = null;
    this.savePrefs();
    this.updateDOM();

    if (typeof window !== 'undefined' && window.showToastNotification) {
      window.showToastNotification(`⏱️ End time updated to ${this.formatTimeOfDay(targetEnd)}`);
    }
  },

  formatTime24(date) {
    if (!date) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  },

  hideTimer() {
    this.isHidden = true;
    this.soundEnabled = false; // Mutes the timer
    this.savePrefs();
    this.updateDOM();
    if (typeof window !== 'undefined' && window.showToastNotification) {
      window.showToastNotification('Timer hidden & muted');
    }
  },

  showTimer() {
    this.isHidden = false;
    this.soundEnabled = true; // Unmutes the timer
    this.savePrefs();
    this.updateDOM();
  },

  onExitWhiteboardView() {
    // Exiting the view for an unpinned timer discards the timer session
    if (this.activeSchedule && !this.isPinned) {
      this.activeSchedule = null;
      this.lastSectionType = null;
      this.trackRenderedKey = null;
      this.savePrefs();
    }
  },

  setBreaksCount(count) {
    this.numBreaks = Math.max(0, Math.min(6, parseInt(count, 10) || 0));
    const input = document.getElementById('wb-input-breaks-count');
    if (input) input.value = this.numBreaks;
    this.respaceBreaks();
  },

  setBreakDuration(minutes) {
    const val = parseInt(minutes, 10);
    this.breakDurationMinutes = (val === 5) ? 5 : 3;
    const select = document.getElementById('wb-select-break-dur');
    if (select) select.value = String(this.breakDurationMinutes);
    this.savePrefs();
    this.respaceBreaks();
  },

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.savePrefs();
    const btn = document.getElementById('btn-timer-chime-toggle');
    if (btn) {
      btn.textContent = this.soundEnabled ? '🔔' : '🔕';
      btn.title = this.soundEnabled ? 'Audio chime alert enabled' : 'Audio chime alert muted';
    }
  },

  savePrefs() {
    try {
      localStorage.setItem('aus_teacher_wb_timer_prefs', JSON.stringify({
        numBreaks: this.numBreaks,
        breakDurationMinutes: this.breakDurationMinutes,
        soundEnabled: this.soundEnabled,
        isPinned: this.isPinned,
        isHidden: this.isHidden
      }));
      if (this.isPinned && this.activeSchedule) {
        localStorage.setItem('aus_teacher_wb_active_schedule', JSON.stringify(this.activeSchedule));
      } else {
        localStorage.removeItem('aus_teacher_wb_active_schedule');
      }
    } catch (e) {}
  },

  formatSeconds(totalSec) {
    totalSec = Math.max(0, Math.round(totalSec));
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const mStr = String(mins).padStart(2, '0');
    const sStr = String(secs).padStart(2, '0');
    if (hours > 0) {
      return `${hours}:${mStr}:${sStr}`;
    }
    return `${mStr}:${sStr}`;
  },

  formatTimeOfDay(date) {
    let hours = date.getHours();
    const mins = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${mins} ${ampm}`;
  },

  playChime(type) {
    if (!this.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === 'break') {
        this.emitTone(ctx, 523.25, now, 0.2);        // C5
        this.emitTone(ctx, 659.25, now + 0.14, 0.25); // E5
        this.emitTone(ctx, 783.99, now + 0.28, 0.45); // G5
      } else {
        this.emitTone(ctx, 783.99, now, 0.2);        // G5
        this.emitTone(ctx, 523.25, now + 0.14, 0.35); // C5
      }
    } catch (e) {}
  },

  emitTone(ctx, freq, startTime, duration) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  },

  /**
   * Regular 1-second background tick
   */
  tick() {
    const now = new Date();
    const nowMs = now.getTime();

    if (this.activeSchedule) {
      const status = this.getCurrentStatus(nowMs);

      // Section transition chime detection
      if (status.type && status.type !== 'idle' && status.type !== 'finished') {
        if (this.lastSectionType && this.lastSectionType !== status.type) {
          this.playChime(status.type);
        }
        this.lastSectionType = status.type;
      } else if (status.isEnded && this.lastSectionType !== 'finished') {
        this.playChime('break');
        this.lastSectionType = 'finished';
      }
    }

    // Update DOM if present
    this.updateDOM();
  },

  /**
   * Refreshes the DOM elements inside the Whiteboard footer
   */
  updateDOM() {
    const root = document.getElementById('wb-class-timer');
    const showBtn = document.getElementById('btn-timer-show');
    const emptyState = document.getElementById('wb-timer-empty-state');

    // By default no timer: show Add Timer button
    if (!this.activeSchedule) {
      if (root) root.classList.add('hidden');
      if (showBtn) showBtn.style.display = 'none';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (this.isHidden) {
      if (root) root.classList.add('hidden');
      if (showBtn) showBtn.style.display = 'inline-flex';
      if (emptyState) emptyState.classList.add('hidden');
      return;
    } else {
      if (emptyState) emptyState.classList.add('hidden');
      if (root) root.classList.remove('hidden');
      if (showBtn) showBtn.style.display = 'none';
    }

    if (!root) return;

    const now = new Date();
    const nowMs = now.getTime();

    // 1. Clock badge
    const clockBadge = document.getElementById('wb-timer-clock-badge');
    if (clockBadge) {
      clockBadge.textContent = this.formatTimeOfDay(now);
    }

    // 2. Chime button icon & Pin button state
    const chimeBtn = document.getElementById('btn-timer-chime-toggle');
    if (chimeBtn) {
      chimeBtn.textContent = this.soundEnabled ? '🔔' : '🔕';
    }
    const isClassInProgress = this.activeSchedule && !this.activeSchedule.isManual;
    const pinBtn = document.getElementById('btn-timer-pin');
    if (pinBtn) {
      if (isClassInProgress) {
        pinBtn.style.display = 'none';
      } else {
        pinBtn.style.display = 'inline-flex';
        pinBtn.classList.toggle('active', !!this.isPinned);
        pinBtn.textContent = this.isPinned ? 'Pinned' : 'Pin';
      }
    }

    // 3. Inputs sync
    const breaksInput = document.getElementById('wb-input-breaks-count');
    if (breaksInput && breaksInput.value != this.numBreaks) {
      breaksInput.value = this.numBreaks;
    }
    const durSelect = document.getElementById('wb-select-break-dur');
    if (durSelect && durSelect.value != this.breakDurationMinutes) {
      durSelect.value = this.breakDurationMinutes;
    }

    // If no schedule exists, check if lesson is scheduled
    if (!this.activeSchedule) {
      const detection = this.selectedClassId ? this.detectCurrentLessonBlock(this.selectedClassId, now) : null;
      const speechBubble = document.getElementById('wb-timer-speech-bubble');
      const bubbleIcon = document.getElementById('wb-bubble-icon');
      const bubbleTag = document.getElementById('wb-bubble-tag');
      const bubbleCountdown = document.getElementById('wb-bubble-countdown');
      const lessonTag = document.getElementById('wb-timer-lesson-tag');
      const endsDigits = document.getElementById('wb-timer-ends-digits');
      const fallback = document.getElementById('wb-timer-fallback');

      if (fallback) fallback.style.display = 'flex';

      if (detection && detection.upcomingBlock) {
        if (lessonTag) lessonTag.textContent = `Upcoming: ${detection.upcomingBlock.label} (${detection.upcomingBlock.startTime})`;
        if (endsDigits) endsDigits.textContent = `Starts at ${detection.upcomingBlock.startTime}`;
      } else {
        if (lessonTag) lessonTag.textContent = 'Off-timetable';
        if (endsDigits) endsDigits.textContent = '--:--';
      }

      if (speechBubble) {
        speechBubble.className = 'wb-speech-bubble idle';
        speechBubble.style.left = '50%';
      }
      if (bubbleIcon) bubbleIcon.textContent = '⏱️';
      if (bubbleTag) bubbleTag.textContent = 'CLASS TIMER';
      if (bubbleCountdown) bubbleCountdown.textContent = 'Ready';
      return;
    }

    // Active schedule exists
    const status = this.getCurrentStatus(nowMs);
    const speechBubble = document.getElementById('wb-timer-speech-bubble');
    const bubbleIcon = document.getElementById('wb-bubble-icon');
    const bubbleTag = document.getElementById('wb-bubble-tag');
    const bubbleCountdown = document.getElementById('wb-bubble-countdown');
    const lessonTag = document.getElementById('wb-timer-lesson-tag');
    const endsDigits = document.getElementById('wb-timer-ends-digits');
    const fallback = document.getElementById('wb-timer-fallback');
    const track = document.getElementById('wb-timer-track');
    const startTimeEl = document.getElementById('wb-timeline-start-time');
    const endTimeEl = document.getElementById('wb-timeline-end-time');

    if (fallback) fallback.style.display = 'none';

    // Update lesson tag
    if (lessonTag) {
      lessonTag.textContent = this.activeSchedule.label || 'Active Lesson';
    }

    // Update start & end times
    if (startTimeEl && this.activeSchedule.startMs) {
      startTimeEl.textContent = this.formatTimeOfDay(new Date(this.activeSchedule.startMs));
    }
    const endEditLabel = document.getElementById('wb-timeline-end-edit-label');
    const endInput = document.getElementById('wb-timeline-end-input');

    if (this.activeSchedule.endMs) {
      const endDate = new Date(this.activeSchedule.endMs);
      if (this.activeSchedule.isManual) {
        if (endTimeEl) endTimeEl.style.display = 'none';
        if (endEditLabel) endEditLabel.classList.remove('hidden');
        if (endInput && document.activeElement !== endInput) {
          endInput.value = this.formatTime24(endDate);
        }
      } else {
        if (endEditLabel) endEditLabel.classList.add('hidden');
        if (endTimeEl) {
          endTimeEl.style.display = 'inline';
          endTimeEl.textContent = this.formatTimeOfDay(endDate);
        }
      }
    }

    // Update total countdown
    if (endsDigits) {
      if (status.isEnded) {
        endsDigits.textContent = '00:00 (Dismissed)';
        endsDigits.style.color = '#94a3b8';
      } else {
        endsDigits.textContent = this.formatSeconds(status.remainingClassSec);
        endsDigits.style.color = 'var(--primary)';
      }
    }

    // Update Speech Bubble Indicator (Fixed width, stable numbers)
    if (speechBubble) {
      if (status.isEnded) {
        speechBubble.className = 'wb-speech-bubble finished';
        if (bubbleIcon) bubbleIcon.textContent = '🎉';
        if (bubbleTag) bubbleTag.textContent = 'CLASS FINISHED';
        if (bubbleCountdown) bubbleCountdown.textContent = '00:00';
      } else if (status.type === 'break') {
        speechBubble.className = 'wb-speech-bubble break';
        if (bubbleIcon) bubbleIcon.textContent = '☕';
        if (bubbleTag) bubbleTag.textContent = `${(status.name || 'Break').toUpperCase()} TIME`;
        if (bubbleCountdown) bubbleCountdown.textContent = `${this.formatSeconds(status.remainingSec)} left`;
      } else {
        speechBubble.className = 'wb-speech-bubble work';
        if (bubbleIcon) bubbleIcon.textContent = '✏️';
        if (bubbleTag) bubbleTag.textContent = 'WORK TIME';
        if (bubbleCountdown) bubbleCountdown.textContent = `${this.formatSeconds(status.remainingSec)} left`;
      }
    }

    // Calculate Playhead Position and Move Speech Bubble Along the Progress Bar
    const totalSpan = this.activeSchedule.endMs - this.activeSchedule.startMs;
    const elapsed = totalSpan > 0 ? Math.max(0, Math.min(totalSpan, nowMs - this.activeSchedule.startMs)) : 0;
    const progPct = totalSpan > 0 ? Math.max(0, Math.min(100, (elapsed / totalSpan) * 100)) : 0;

    // 1. Render Timeline Track Segments only when needed (not every tick, preserving drag!)
    if (track && this.activeSchedule.segments && !this.isDraggingBreak) {
      const currentKey = `${this.activeSchedule.segments.length}_${this.activeSchedule.segments.map(s => s.startMs + '-' + s.endMs).join(',')}`;
      if (this.trackRenderedKey !== currentKey) {
        this.trackRenderedKey = currentKey;
        this.renderSegmentsHTML(track, totalSpan, progPct);
      }
    }

    // 2. Move Playhead and Speech Bubble in lockstep across the progress bar!
    if (totalSpan > 0) {
      const playhead = document.getElementById('wb-timer-playhead');
      if (playhead) {
        playhead.style.left = `${progPct.toFixed(2)}%`;
      }

      // Bubble strictly follows the black indicator (playhead) across the progress bar
      if (speechBubble) {
        speechBubble.style.left = `${progPct.toFixed(2)}%`;
      }
    }
  },

  renderSegmentsHTML(track, totalSpan, progPct = 0) {
    if (!track || !this.activeSchedule || totalSpan <= 0) return;
    let segHtml = '';
    let breakCount = 0;
    this.activeSchedule.segments.forEach(seg => {
      const segDuration = seg.endMs - seg.startMs;
      const pct = Math.max(0, (segDuration / totalSpan) * 100);
      if (seg.type === 'break') {
        const breakStartStr = this.formatTimeOfDay(new Date(seg.startMs));
        const breakEndStr = this.formatTimeOfDay(new Date(seg.endMs));
        const durMins = Math.round(seg.durationSec / 60);
        const breakRange = `${breakStartStr} – ${breakEndStr}`;
        segHtml += `<div class="wb-timer-seg-bar break" data-seg-id="${seg.id}" data-break-index="${breakCount}" data-start-time="${breakStartStr}" data-end-time="${breakEndStr}" style="width: ${pct.toFixed(2)}%;" title="☕ ${seg.name}: ${breakRange} (${durMins} min)"></div>`;
        breakCount++;
      } else {
        segHtml += `<div class="wb-timer-seg-bar work" data-seg-id="${seg.id}" style="width: ${pct.toFixed(2)}%;" title="${seg.name}: ${this.formatSeconds(seg.durationSec)}"></div>`;
      }
    });
    segHtml += `<div class="wb-timer-playhead" id="wb-timer-playhead" style="left: ${Number(progPct).toFixed(2)}%;"></div>`;
    track.innerHTML = segHtml;
  },

  showBreakTooltip(breakEl, customStartMs = null, customEndMs = null) {
    const tooltip = document.getElementById('wb-break-tooltip');
    const tooltipText = document.getElementById('wb-break-tooltip-text');
    if (!tooltip || !tooltipText || !this.activeSchedule) return;

    let startMs = customStartMs;
    let endMs = customEndMs;

    if (startMs === null || endMs === null) {
      const segId = breakEl?.getAttribute('data-seg-id');
      const seg = this.activeSchedule.segments?.find(s => s.id === segId && s.type === 'break');
      if (seg) {
        startMs = seg.startMs;
        endMs = seg.endMs;
      }
    }

    if (startMs === null || endMs === null) return;

    const startStr = this.formatTimeOfDay(new Date(startMs));
    const endStr = this.formatTimeOfDay(new Date(endMs));
    const durMins = Math.round((endMs - startMs) / 60000);
    tooltipText.textContent = `☕ ${startStr} – ${endStr} (${durMins}m)`;

    // Position tooltip horizontally at the center of the break segment
    const totalSpan = this.activeSchedule.endMs - this.activeSchedule.startMs;
    if (totalSpan > 0) {
      const centerMs = (startMs + endMs) / 2;
      const centerPct = Math.max(0, Math.min(100, ((centerMs - this.activeSchedule.startMs) / totalSpan) * 100));
      tooltip.style.left = `${centerPct.toFixed(2)}%`;
    }

    tooltip.classList.add('visible');
  },

  hideBreakTooltip() {
    if (this.isDraggingBreak) return;
    const tooltip = document.getElementById('wb-break-tooltip');
    if (tooltip) {
      tooltip.classList.remove('visible');
    }
  },

  /**
   * Drag-and-drop interactive repositioning of breaks on the timeline track
   */
  bindDragEvents() {
    let activeBreak = null;
    let trackEl = null;

    // Hover events on break segments showing start and end time
    document.addEventListener('pointerover', (e) => {
      const breakEl = e.target.closest('.wb-timer-seg-bar.break');
      if (breakEl) {
        this.showBreakTooltip(breakEl);
      }
    });

    document.addEventListener('pointerout', (e) => {
      const breakEl = e.target.closest('.wb-timer-seg-bar.break');
      if (breakEl && !this.isDraggingBreak) {
        const related = e.relatedTarget;
        if (!related || !breakEl.contains(related)) {
          this.hideBreakTooltip();
        }
      }
    });

    const onPointerDown = (e) => {
      const breakEl = e.target.closest('.wb-timer-seg-bar.break');
      if (!breakEl || !this.activeSchedule) return;

      e.preventDefault();
      const breakIdx = parseInt(breakEl.getAttribute('data-break-index'), 10);
      const segments = this.activeSchedule.segments;
      const breakSegIndex = segments.findIndex(s => s.type === 'break' && s.breakIndex === breakIdx);
      if (breakSegIndex === -1) return;

      activeBreak = {
        segIndex: breakSegIndex,
        seg: segments[breakSegIndex],
        prevWork: segments[breakSegIndex - 1],
        nextWork: segments[breakSegIndex + 1],
        prevBreak: segments.slice(0, breakSegIndex).reverse().find(s => s.type === 'break'),
        nextBreak: segments.slice(breakSegIndex + 1).find(s => s.type === 'break'),
        breakDurMs: segments[breakSegIndex].endMs - segments[breakSegIndex].startMs,
        el: breakEl
      };

      trackEl = document.getElementById('wb-timer-track');
      breakEl.classList.add('dragging');
      this.isDraggingBreak = true;
      this.showBreakTooltip(breakEl, activeBreak.seg.startMs, activeBreak.seg.endMs);

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!activeBreak || !trackEl || !this.activeSchedule) return;

      const rect = trackEl.getBoundingClientRect();
      const totalSpan = this.activeSchedule.endMs - this.activeSchedule.startMs;
      if (rect.width <= 0 || totalSpan <= 0) return;

      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const targetCenterMs = this.activeSchedule.startMs + (relX / rect.width) * totalSpan;

      const minBufferMs = 45000; // at least 45 sec of work between breaks/ends
      const minStartMs = activeBreak.prevBreak ? (activeBreak.prevBreak.endMs + minBufferMs) : (this.activeSchedule.startMs + minBufferMs);
      const maxEndMs = activeBreak.nextBreak ? (activeBreak.nextBreak.startMs - minBufferMs) : (this.activeSchedule.endMs - minBufferMs);
      const maxStartMs = maxEndMs - activeBreak.breakDurMs;

      if (maxStartMs < minStartMs) return;

      const newStartMs = Math.max(minStartMs, Math.min(maxStartMs, targetCenterMs - (activeBreak.breakDurMs / 2)));
      const newEndMs = newStartMs + activeBreak.breakDurMs;

      // Update segment timestamps
      activeBreak.seg.startMs = newStartMs;
      activeBreak.seg.endMs = newEndMs;

      if (activeBreak.prevWork) {
        activeBreak.prevWork.endMs = newStartMs;
        activeBreak.prevWork.durationSec = Math.round((newStartMs - activeBreak.prevWork.startMs) / 1000);
      }
      if (activeBreak.nextWork) {
        activeBreak.nextWork.startMs = newEndMs;
        activeBreak.nextWork.durationSec = Math.round((activeBreak.nextWork.endMs - newEndMs) / 1000);
      }

      // Live update widths of segments
      this.activeSchedule.segments.forEach(seg => {
        const segEl = trackEl.querySelector(`[data-seg-id="${seg.id}"]`);
        if (segEl) {
          const dur = seg.endMs - seg.startMs;
          const pct = (dur / totalSpan) * 100;
          segEl.style.width = `${pct.toFixed(2)}%`;
        }
      });

      // Live update break tooltip during drag!
      this.showBreakTooltip(activeBreak.el, newStartMs, newEndMs);

      this.updateDOM();
    };

    const onPointerUp = () => {
      if (activeBreak && activeBreak.el) {
        activeBreak.el.classList.remove('dragging');
      }
      this.isDraggingBreak = false;
      this.isPinned = true; // Auto-pin when user customizes break locations so it doesn't get wiped
      this.trackRenderedKey = null;
      this.savePrefs();
      this.updateDOM();
      this.hideBreakTooltip();

      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      activeBreak = null;
    };

    document.addEventListener('pointerdown', onPointerDown);
  },

  bindEvents() {
    document.addEventListener('click', (e) => {
      // Breaks Stepper Dec
      if (e.target.id === 'btn-timer-dec-breaks' || e.target.closest('#btn-timer-dec-breaks')) {
        this.setBreaksCount(this.numBreaks - 1);
      }
      // Breaks Stepper Inc
      else if (e.target.id === 'btn-timer-inc-breaks' || e.target.closest('#btn-timer-inc-breaks')) {
        this.setBreaksCount(this.numBreaks + 1);
      }
      // Re-space Breaks
      else if (e.target.id === 'btn-timer-respace' || e.target.closest('#btn-timer-respace')) {
        this.respaceBreaks();
      }
      // Pin Toggle
      else if (e.target.id === 'btn-timer-pin' || e.target.closest('#btn-timer-pin')) {
        this.togglePin();
      }
      // Hide Timer
      else if (e.target.id === 'btn-timer-hide' || e.target.closest('#btn-timer-hide')) {
        this.hideTimer();
      }
      // Show Timer
      else if (e.target.id === 'btn-timer-show' || e.target.closest('#btn-timer-show')) {
        this.showTimer();
      }
      // Add Timer
      else if (e.target.id === 'btn-timer-add' || e.target.closest('#btn-timer-add')) {
        this.addTimer();
      }
      // Remove Timer
      else if (e.target.id === 'btn-timer-remove' || e.target.closest('#btn-timer-remove')) {
        this.removeTimer();
      }
      // Sound Toggle
      else if (e.target.id === 'btn-timer-chime-toggle' || e.target.closest('#btn-timer-chime-toggle')) {
        this.toggleSound();
      }
      // Quick Timer Preset buttons
      else if (e.target.classList.contains('wb-quick-timer-btn')) {
        const mins = parseInt(e.target.getAttribute('data-minutes'), 10) || 45;
        this.startLessonTimer(this.selectedClassId, mins * 60, `Manual Session (${mins}m)`, true);
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.id === 'wb-select-break-dur') {
        this.setBreakDuration(e.target.value);
      } else if (e.target.id === 'wb-timeline-end-input') {
        this.onEndTimeChanged(e.target.value);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.target.id === 'wb-timeline-end-input' && e.key === 'Enter') {
        e.target.blur();
      }
    });
  }
};


if (typeof window !== 'undefined') {
  window.ClassTimer = ClassTimer;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ClassTimer };
}
