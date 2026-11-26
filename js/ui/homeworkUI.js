/* ==========================================================================
   Weekly Homework, Classwork Summary & Whiteboard Display UI (View 5)
   ========================================================================== */

import { state, getClassCellStyles, showToastNotification, escapeHtml } from '../state.js';
import { Scheduler } from '../scheduler.js';
import { TermManager } from '../termManager.js';
import '../timer.js';

const ClassTimer = (typeof window !== 'undefined' && window.ClassTimer) ? window.ClassTimer : undefined;

export const HomeworkUI = {
  selectedClassId: null,
  selectedTermId: 't1',
  selectedWeekNum: 1,
  coveredLessonLimit: null,
  whiteboardFontScale: 1.0,
  isManualFontScale: false,
  whiteboardLayoutMode: 'bubbles', // 'bubbles' | 'list'
  isProgressBarCollapsed: false,

  toggleProgressBar(forceCollapsed = null) {
    this.isProgressBarCollapsed = (forceCollapsed !== null) ? Boolean(forceCollapsed) : !this.isProgressBarCollapsed;
    const bar = document.getElementById('whiteboard-progress-bar') || document.querySelector('.whiteboard-bar');
    const expandWrapper = document.getElementById('wb-bar-expand-wrapper');
    if (bar) {
      bar.classList.toggle('collapsed', this.isProgressBarCollapsed);
      bar.style.display = this.isProgressBarCollapsed ? 'none' : '';
    }
    if (expandWrapper) {
      expandWrapper.classList.toggle('hidden', !this.isProgressBarCollapsed);
      expandWrapper.style.display = this.isProgressBarCollapsed ? 'block' : 'none';
    }
  },

  get groupingMode() {
    return state.homeworkGroupingMode || 'category';
  },
  set groupingMode(mode) {
    state.setHomeworkGroupingMode(mode);
  },

  setGroupingMode(mode) {
    this.groupingMode = (mode === 'lesson') ? 'lesson' : 'category';
    this.renderMainContent();
    const wbBackdrop = document.getElementById('modal-whiteboard-backdrop');
    if (wbBackdrop && wbBackdrop.classList.contains('active')) {
      this.renderWhiteboardContent();
    }
  },

  toggleGroupingMode() {
    const nextMode = (this.groupingMode === 'lesson') ? 'category' : 'lesson';
    this.setGroupingMode(nextMode);
  },

  toggleWhiteboardLayout() {
    this.whiteboardLayoutMode = (this.whiteboardLayoutMode === 'bubbles') ? 'list' : 'bubbles';
    const btn = document.getElementById('btn-toggle-wb-layout');
    if (btn) {
      btn.innerHTML = (this.whiteboardLayoutMode === 'bubbles') ? 'Bubbles' : 'List';
      btn.title = (this.whiteboardLayoutMode === 'bubbles') ? 'Switch to Vertical List view' : 'Switch to Bubbled Grid view';
    }
    this.renderWhiteboardContent();
  },

  updateWhiteboardFontScale(scale, isManual = true) {
    this.whiteboardFontScale = Math.max(0.7, Math.min(3.0, Math.round(scale * 20) / 20));
    if (isManual) this.isManualFontScale = true;

    const backdrop = document.getElementById('modal-whiteboard-backdrop');
    if (backdrop) {
      backdrop.style.setProperty('--wb-font-scale', this.whiteboardFontScale);
    }

    const label = document.getElementById('wb-zoom-label');
    if (label) {
      const pct = Math.round(this.whiteboardFontScale * 100);
      label.textContent = `${pct}%${this.isManualFontScale ? '' : ' (Auto)'}`;
    }
  },

  calculateAutoFontScale(totalItems, categoryCount = 1) {
    const isBubbles = (this.whiteboardLayoutMode !== 'list');
    if (isBubbles) {
      if (totalItems <= 4) return 1.6;
      if (totalItems <= 8) return 1.4;
      if (totalItems <= 14) return 1.25;
      if (totalItems <= 20) return 1.1;
      return 1.0;
    } else {
      if (totalItems <= 3) return 1.5;
      if (totalItems <= 6) return 1.3;
      if (totalItems <= 10) return 1.15;
      return 1.0;
    }
  },

  init() {
    if (state.classes.length > 0 && (!this.selectedClassId || this.selectedClassId === 'ALL')) {
      this.selectedClassId = state.classes[0].id;
    }
    this.ensureDefaultTermAndWeek();
    this.renderClassSelector();
    this.renderTermAndWeekPicker();
    this.renderMainContent();
    this.bindEvents();

    if (typeof ClassTimer !== 'undefined') {
      ClassTimer.init();
      if (this.selectedClassId) {
        ClassTimer.selectedClassId = this.selectedClassId;
      }
    }
  },

  ensureDefaultTermAndWeek() {
    const currentDate = state.currentDate || '2026-07-22';
    const currentTerm = TermManager.getTermForDate(currentDate) || state.terms[0];
    if (currentTerm) {
      this.selectedTermId = currentTerm.id;
      const termStart = TermManager.parseLocalDate(currentTerm.startDate);
      const curr = TermManager.parseLocalDate(currentDate);
      if (termStart && curr) {
        const diffDays = Math.round((curr - termStart) / (1000 * 60 * 60 * 24));
        this.selectedWeekNum = Math.max(1, Math.min(TermManager.getTermWeeks(currentTerm), Math.floor(diffDays / 7) + 1));
      }
    }

    try {
      if (typeof window !== 'undefined' && window.location) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('testSeed') === '1') {
          this.selectedTermId = 't1';
          this.selectedWeekNum = 1;
          this.selectedClassId = 'c_white';
        }
      }
    } catch (e) {}
  },

  renderClassSelector() {
    const container = document.getElementById('homework-class-selector');
    if (!container) return;

    if (state.classes.length > 0 && (!this.selectedClassId || !state.classes.some(c => c.id === this.selectedClassId))) {
      this.selectedClassId = state.classes[0].id;
    }

    let html = '';

    state.classes.forEach(c => {
      const active = c.id === this.selectedClassId ? 'active' : '';
      const cellStyle = getClassCellStyles(c.color, state.theme === 'dark');
      html += `
        <button class="nav-btn ${active}" data-id="${escapeHtml(c.id)}" style="padding: 0.35rem 0.75rem; font-size: 0.85rem;">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${cellStyle.dotBg}; border:${cellStyle.dotBorder}; margin-right:4px;"></span>
          ${escapeHtml(c.name)}
        </button>
      `;
    });

    container.innerHTML = html;
  },

  renderTermAndWeekPicker() {
    const termSelect = document.getElementById('homework-term-select');
    const weekSelect = document.getElementById('homework-week-select');
    if (!termSelect || !weekSelect) return;

    termSelect.innerHTML = state.terms.map(t => {
      const selected = t.id === this.selectedTermId ? 'selected' : '';
      return `<option value="${escapeHtml(t.id)}" ${selected}>${escapeHtml(t.name)}</option>`;
    }).join('');

    const term = state.terms.find(t => t.id === this.selectedTermId) || state.terms[0];
    const totalWeeks = term ? TermManager.getTermWeeks(term) : 10;

    let weekHtml = '';
    for (let w = 1; w <= totalWeeks; w++) {
      const selected = w === this.selectedWeekNum ? 'selected' : '';
      weekHtml += `<option value="${w}" ${selected}>Week ${w}</option>`;
    }
    weekSelect.innerHTML = weekHtml;
  },

  getSelectedWeekDateRange() {
    const term = state.terms.find(t => t.id === this.selectedTermId) || state.terms[0];
    if (!term) return { startDateStr: '', endDateStr: '', label: '' };

    const termStart = TermManager.parseLocalDate(term.startDate);
    if (!termStart) return { startDateStr: '', endDateStr: '', label: '' };

    const weekStart = new Date(termStart);
    weekStart.setDate(termStart.getDate() + (this.selectedWeekNum - 1) * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4);

    const startDateStr = TermManager.formatLocalDate(weekStart);
    const endDateStr = TermManager.formatLocalDate(weekEnd);

    const label = `${term.name}, Week ${this.selectedWeekNum} (${TermManager.formatDisplayDate(startDateStr)} - ${TermManager.formatDisplayDate(endDateStr)})`;

    return { startDateStr, endDateStr, label, weekStart, weekEnd };
  },

  getScheduledLessonsForSelectedWeek() {
    const { startDateStr, endDateStr } = this.getSelectedWeekDateRange();
    if (!startDateStr || !endDateStr) return [];

    if (state.classes.length > 0 && (!this.selectedClassId || !state.classes.some(c => c.id === this.selectedClassId))) {
      this.selectedClassId = state.classes[0].id;
    }

    const targetClass = state.classes.find(c => c.id === this.selectedClassId);
    if (!targetClass) return [];

    const results = [];

    const { schedule } = Scheduler.generateScheduleForClass(targetClass.id);
    schedule.forEach(entry => {
      if (entry.slot && entry.slot.date >= startDateStr && entry.slot.date <= endDateStr && entry.lesson) {
        results.push({
          slot: entry.slot,
          lesson: entry.lesson,
          classObj: targetClass
        });
      }
    });

    results.sort((a, b) => {
      if (a.slot.date !== b.slot.date) return a.slot.date.localeCompare(b.slot.date);

      const pA = state.periods.find(p => p.id === a.slot.periodId);
      const pB = state.periods.find(p => p.id === b.slot.periodId);

      if (pA && pB) {
        if (pA.startTime && pB.startTime && pA.startTime !== pB.startTime) {
          return pA.startTime.localeCompare(pB.startTime);
        }
        const idxA = state.periods.findIndex(p => p.id === a.slot.periodId);
        const idxB = state.periods.findIndex(p => p.id === b.slot.periodId);
        if (idxA !== -1 && idxB !== -1 && idxA !== idxB) {
          return idxA - idxB;
        }
      }

      return (a.slot.periodId || '').localeCompare(b.slot.periodId || '', undefined, { numeric: true });
    });

    return results;
  },

  getFormattedClassworkForLesson(lesson) {
    if (!lesson || !lesson.classwork || !Array.isArray(lesson.classwork)) return [];
    return lesson.classwork.filter(item => item && ((item.work && item.work.trim()) || (item.link && item.link.trim())));
  },

  isLessonAssessment(lesson) {
    if (!lesson) return false;
    if (lesson.isTestMilestone || lesson.isAssessment || lesson.isTest) return true;
    const title = (lesson.title || '').trim().toLowerCase();
    const unit = (lesson.unit || '').trim().toLowerCase();
    const regex = /\b(assessment|test|exam|sac|quiz)\b/i;
    return regex.test(title) || regex.test(unit);
  },

  aggregateTaskObjects(taskList) {
    if (!Array.isArray(taskList) || taskList.length === 0) return [];

    const chapters = {};
    const chapterOrder = [];
    const simpleItems = [];

    taskList.forEach(raw => {
      if (!raw) return;
      const workStr = (typeof raw === 'string' ? raw : raw.work || '').trim();
      const linkStr = (typeof raw === 'object' && raw.link) ? raw.link.trim() : '';

      if (!workStr) return;

      const colonIdx = workStr.indexOf(':');
      if (colonIdx > 0) {
        const prefix = workStr.substring(0, colonIdx).trim();
        const rest = workStr.substring(colonIdx + 1).trim();

        if (!chapters[prefix]) {
          chapters[prefix] = [];
          chapterOrder.push(prefix);
        }
        if (rest) {
          const existing = chapters[prefix].find(x => x.work === rest);
          if (!existing) {
            chapters[prefix].push({ work: rest, link: linkStr });
          } else if (!existing.link && linkStr) {
            existing.link = linkStr;
          }
        }
      } else {
        const existing = simpleItems.find(x => x.work === workStr);
        if (!existing) {
          simpleItems.push({ work: workStr, link: linkStr });
        } else if (!existing.link && linkStr) {
          existing.link = linkStr;
        }
      }
    });

    const results = [];

    chapterOrder.forEach(prefix => {
      const qList = chapters[prefix];
      results.push({
        type: 'chapter',
        prefix: prefix,
        items: qList
      });
    });

    if (simpleItems.length > 0) {
      results.push({
        type: 'simple',
        items: simpleItems
      });
    }

    return results;
  },

  aggregateTaskItems(taskList) {
    if (!Array.isArray(taskList) || taskList.length === 0) return [];
    const structured = this.aggregateTaskObjects(taskList);

    return structured.map(bullet => {
      if (bullet.type === 'chapter') {
        if (bullet.items.length === 0) return bullet.prefix;
        const sub = bullet.items.map(i => i.work).join(', ');
        return `${bullet.prefix}${sub ? ': ' : ''}${sub}`;
      } else {
        return bullet.items.map(i => i.work).join(', ');
      }
    });
  },

  renderMainContent() {
    const container = document.getElementById('homework-main-content');
    if (!container) return;

    const weekRange = this.getSelectedWeekDateRange();
    const scheduledEntries = this.getScheduledLessonsForSelectedWeek();
    const selectedClass = state.classes.find(c => c.id === this.selectedClassId);
    const selectedClassName = selectedClass ? selectedClass.name : 'Selected Class';

    if (scheduledEntries.length === 0) {
      container.innerHTML = `
        <div class="homework-empty-state">
          <div style="font-size:2.5rem; margin-bottom:0.75rem;">📅</div>
          <h3 style="font-weight:700; font-size:1.1rem; margin-bottom:0.4rem;">No Scheduled Classes Found for ${escapeHtml(selectedClassName)} in ${escapeHtml(weekRange.label)}</h3>
          <p style="font-size:0.85rem; max-width:500px; margin:0 auto;">
            Ensure class timetable slots are set up in <strong>"2. Timetable Rotation"</strong> and curriculum lesson plans are defined in <strong>"3. Curriculum & Lessons"</strong>.
          </p>
        </div>
      `;
      return;
    }

    let cardsHtml = '';
    scheduledEntries.forEach((entry, idx) => {
      const { slot, lesson, classObj } = entry;
      const classworkItems = this.getFormattedClassworkForLesson(lesson);

      let classworkHtml = '';
      const hasSpecificWork = classworkItems.some(it => it && it.work && it.work.trim());
      const isAssessmentLesson = this.isLessonAssessment(lesson);

      if (classworkItems.length === 0 || !hasSpecificWork) {
        if (!isAssessmentLesson) {
          classworkHtml = `<div style="margin-bottom:0.4rem; font-size:0.88rem;"><span class="cw-badge cw-badge-default">Task</span> <strong>Catch Up</strong></div>`;
        } else {
          classworkHtml = `<div style="font-size:0.82rem; color:var(--text-dim); font-style:italic;">🎯 Assessment / Test Milestone</div>`;
        }
      } else {
        classworkHtml = classworkItems.map(cw => {
          const typeLower = (cw.type || '').toLowerCase();
          let badgeClass = 'cw-badge-default';
          if (typeLower.includes('note')) badgeClass = 'cw-badge-notes';
          else if (typeLower.includes('text') || typeLower.includes('book')) badgeClass = 'cw-badge-textbook';
          else if (typeLower.includes('sheet') || typeLower.includes('work')) badgeClass = 'cw-badge-worksheets';
          else if (typeLower.includes('hand') || typeLower.includes('print')) badgeClass = 'cw-badge-handout';

          const workText = escapeHtml(cw.work || '(No description)');
          const contentHtml = cw.link ? `<a href="${escapeHtml(cw.link)}" target="_blank" class="homework-material-link" title="Open material link">${workText}</a>` : workText;

          return `
            <div style="margin-bottom:0.4rem; font-size:0.88rem;">
              <span class="cw-badge ${badgeClass}">${escapeHtml(cw.type || 'Task')}</span>
              <strong>${contentHtml}</strong>
            </div>
          `;
        }).join('');
      }

      const days = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const dayName = days[slot.dayOfWeek] || '';

      const linkedClasses = state.getLinkedClasses(classObj.id);
      const hasLinked = linkedClasses.length > 0;
      const syncTileBtn = hasLinked ? `
        <button type="button" class="btn btn-secondary btn-xs hw-card-sync-btn" data-class="${escapeHtml(classObj.id)}" data-lesson-id="${escapeHtml(lesson.id)}" style="font-size:0.75rem; padding:0.2rem 0.5rem; font-weight:700;" title="Sync homework tasks to ${escapeHtml(linkedClasses.map(l => l.name).join(', '))}">
          🔄 Sync Tile
        </button>
      ` : '';

      const cellStyle = getClassCellStyles(classObj.color, state.theme === 'dark');

      cardsHtml += `
        <div class="homework-lesson-card" data-class="${escapeHtml(classObj.id)}" data-lesson-id="${escapeHtml(lesson.id)}" data-date="${escapeHtml(slot.date)}" data-period="${escapeHtml(slot.periodId)}" style="cursor:pointer;" title="Click to view/edit lesson plan & classwork">
          <div class="homework-card-header">
            <div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${cellStyle.dotBg}; border:${cellStyle.dotBorder};"></span>
                <span style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">${escapeHtml(classObj.name)}</span>
              </div>
              <div class="homework-lesson-title" style="margin-top:0.25rem;">${idx + 1}. ${escapeHtml(lesson.title)}</div>
              <div style="font-size:0.75rem; color:var(--text-dim);">${escapeHtml(lesson.unit || 'General Curriculum')}</div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.35rem;">
              <div class="homework-slot-badge" style="text-align: right; line-height: 1.35; white-space: nowrap; padding: 0.35rem 0.75rem;">
                <div>${dayName} ${escapeHtml(slot.periodName)}</div>
                <div style="font-size:0.75rem; opacity:0.9; font-weight:500;">(${TermManager.formatDisplayDate(slot.date)})</div>
              </div>
              ${syncTileBtn ? `<div style="display:flex; justify-content:flex-end; margin-top:0.25rem;">${syncTileBtn}</div>` : ''}
            </div>
          </div>
          <div>${classworkHtml}</div>
        </div>
      `;
    });

    const renderedMarkdownHTML = this.generateSummaryHTML(scheduledEntries);

    container.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <h4 class="homework-section-title">
          Scheduled Lessons & Classwork for ${escapeHtml(selectedClassName)} — ${escapeHtml(weekRange.label)} (${scheduledEntries.length} Lesson Period/s)
        </h4>
        <div class="homework-grid">
          ${cardsHtml}
        </div>
      </div>

      <div class="homework-summary-wrapper">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
          <div style="font-weight:700; font-size:0.95rem; color:var(--text-main); display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
            <span>Formatted Homework Summary for ${escapeHtml(selectedClassName)}</span>
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
            <div style="display:inline-flex; border-radius:6px; overflow:hidden; border:1px solid var(--border-color); background:var(--bg-subtle, rgba(15,23,42,0.4));">
              <button type="button" class="btn ${this.groupingMode === 'category' ? 'btn-primary' : 'btn-secondary'} btn-xs" id="btn-hw-group-category" style="font-size:0.78rem; padding:0.3rem 0.65rem;" title="Collate all homework tasks by category across the week">
                Category
              </button>
              <button type="button" class="btn ${this.groupingMode === 'lesson' ? 'btn-primary' : 'btn-secondary'} btn-xs" id="btn-hw-group-lesson" style="font-size:0.78rem; padding:0.3rem 0.65rem;" title="Show homework tasks broken down by lesson">
                Lesson
              </button>
            </div>
          </div>
        </div>

        <div id="homework-summary-markdown-box" class="homework-summary-rendered-box">
          ${renderedMarkdownHTML}
        </div>
      </div>
    `;
  },

  openWhiteboardModal() {
    if (!this.selectedClassId || !state.classes.some(c => c.id === this.selectedClassId)) {
      if (state.classes.length > 0) {
        this.selectedClassId = state.classes[0].id;
        this.renderClassSelector();
      } else {
        alert('Please create at least one class in "Timetable Rotation" before opening the Whiteboard display.');
        return;
      }
    }

    const backdrop = document.getElementById('modal-whiteboard-backdrop');
    if (!backdrop) return;

    this.isManualFontScale = false;
    this.coveredLessonLimit = null;
    this.hiddenLessonIds = new Set();
    this.renderWhiteboardContent();
    backdrop.classList.add('active');

    if (typeof ClassTimer !== 'undefined') {
      ClassTimer.selectedClassId = this.selectedClassId;
      ClassTimer.updateDOM();
    }
  },

  renderWhiteboardContent() {
    const titleEl = document.getElementById('whiteboard-modal-title');
    const subtitleEl = document.getElementById('whiteboard-modal-subtitle');
    const progressButtonsContainer = document.getElementById('whiteboard-progress-buttons');
    const progressLabel = document.getElementById('whiteboard-progress-label');
    const bodyEl = document.getElementById('whiteboard-modal-body');

    const weekRange = this.getSelectedWeekDateRange();
    const scheduledEntries = this.getScheduledLessonsForSelectedWeek();
    const selectedClass = state.classes.find(c => c.id === this.selectedClassId);
    const selectedClassName = selectedClass ? selectedClass.name : 'Class';

    if (titleEl) titleEl.textContent = `Classwork & Homework — ${selectedClassName}`;
    if (subtitleEl) subtitleEl.textContent = weekRange.label;

    if (scheduledEntries.length === 0) {
      if (progressButtonsContainer) progressButtonsContainer.innerHTML = '';
      if (bodyEl) {
        bodyEl.innerHTML = `<div style="text-align:center; padding:4rem; font-size:1.5rem; color:#94a3b8;">No scheduled lessons or classwork found for ${escapeHtml(selectedClassName)} this week.</div>`;
      }
      return;
    }

    this.hiddenLessonIds = this.hiddenLessonIds || new Set();

    scheduledEntries.forEach((entry, i) => {
      entry.weekLessonIndex = i + 1;
    });

    const totalLessons = scheduledEntries.length;
    let visibleEntries = (this.coveredLessonLimit === null)
      ? scheduledEntries
      : scheduledEntries.slice(0, this.coveredLessonLimit);

    const hiddenCount = scheduledEntries.filter(entry => this.hiddenLessonIds.has(entry.lesson.id)).length;
    visibleEntries = visibleEntries.filter(entry => !this.hiddenLessonIds.has(entry.lesson.id));

    let btnHtml = `
      <button class="btn ${this.coveredLessonLimit === null ? 'btn-primary' : 'btn-secondary'} btn-sm wb-progress-btn" data-limit="all">
        All Lessons (${totalLessons}/${totalLessons})
      </button>
    `;

    for (let i = 1; i <= totalLessons; i++) {
      const active = this.coveredLessonLimit === i ? 'btn-primary' : 'btn-secondary';
      btnHtml += `
        <button class="btn ${active} btn-sm wb-progress-btn" data-limit="${i}">
          Up to Lesson ${i}
        </button>
      `;
    }
    if (hiddenCount > 0) {
      btnHtml += `
        <button type="button" class="btn btn-warning btn-sm btn-wb-unhide-all" id="btn-wb-unhide-all" style="font-weight:700;" title="Restore hidden lesson(s)">
          Restore ${hiddenCount} Hidden
        </button>
      `;
    }
    if (progressButtonsContainer) progressButtonsContainer.innerHTML = btnHtml;

    if (progressLabel) {
      const baseLabel = (this.coveredLessonLimit === null)
        ? `Showing All ${totalLessons} Lessons`
        : `Showing Lessons 1 to ${this.coveredLessonLimit} of ${totalLessons}`;
      progressLabel.textContent = hiddenCount > 0 ? `${baseLabel} (${hiddenCount} Hidden)` : baseLabel;
    }

    const wbGroupBtn = document.getElementById('btn-toggle-wb-grouping');
    if (wbGroupBtn) {
      const isLessonGrouping = (this.groupingMode === 'lesson');
      wbGroupBtn.innerHTML = isLessonGrouping ? 'Lesson' : 'Category';
      wbGroupBtn.title = isLessonGrouping ? 'Switch to Category view' : 'Switch to Lesson view';
    }

    // Lesson Grouping Display Mode
    if (this.groupingMode === 'lesson') {
      let totalWorkItemsCount = 0;
      let anyTasksInWeek = false;
      const isBubbleLayout = (this.whiteboardLayoutMode !== 'list');
      let wbHtml = `<div class="whiteboard-cards-grid ${isBubbleLayout ? 'layout-bubbles' : 'layout-list'}">`;

      const cardsData = visibleEntries.map(entry => {
        const { slot, lesson } = entry;
        const classworkItems = this.getFormattedClassworkForLesson(lesson);

        const days = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const dayName = days[slot.dayOfWeek] || '';
        const lessonNumber = entry.weekLessonIndex || (scheduledEntries.indexOf(entry) + 1);
        const lessonDisplayTitle = `Lesson ${lessonNumber}`;

        const lessonGrouped = {};
        classworkItems.forEach(item => {
          const typeKey = (item.type || 'General Work').trim();
          if (!lessonGrouped[typeKey]) lessonGrouped[typeKey] = [];
          if (item.work && item.work.trim()) {
            lessonGrouped[typeKey].push({
              work: item.work.trim(),
              link: item.link || ''
            });
          }
        });

        const catKeys = Object.keys(lessonGrouped);
        const hasWork = catKeys.length > 0;
        const isAssessment = this.isLessonAssessment(lesson);
        const isCompact = !hasWork || isAssessment;
        const cardClass = `whiteboard-card ${isCompact ? 'wb-card-compact' : ''} ${isAssessment ? 'wb-card-test' : ''} ${!hasWork && !isAssessment ? 'wb-card-no-tasks' : ''}`.trim();
        let cardBodyHtml = '';

        if (!hasWork) {
          if (!isAssessment) {
            anyTasksInWeek = true;
            totalWorkItemsCount += 1;
            cardBodyHtml = `
              <div class="wb-compact-badge wb-catchup-badge">Catch Up</div>
            `;
          } else {
            anyTasksInWeek = true;
            const testTitle = (lesson.title && !lesson.title.toLowerCase().startsWith('lesson')) ? lesson.title : 'Test';
            cardBodyHtml = `
              <div class="wb-compact-badge wb-test-badge">${escapeHtml(testTitle)}</div>
            `;
          }
        } else {
          anyTasksInWeek = true;
          let testHeaderHtml = '';
          if (isAssessment) {
            const testTitle = (lesson.title && !lesson.title.toLowerCase().startsWith('lesson')) ? lesson.title : 'Test';
            testHeaderHtml = `<div class="wb-compact-badge wb-test-badge" style="margin-bottom:calc(0.4rem * var(--wb-font-scale, 1));">${escapeHtml(testTitle)}</div>`;
          }

          if (isBubbleLayout) {
            const bubbleGroups = catKeys.map(catKey => {
              const items = lessonGrouped[catKey];
              const structured = this.aggregateTaskObjects(items);
              totalWorkItemsCount += structured.length;

              const chipsHtml = structured.map(bullet => {
                if (bullet.type === 'chapter') {
                  const subChips = bullet.items.map(it => {
                    if (it.link) {
                      return `<span class="wb-subitem-chip"><a href="${escapeHtml(it.link)}" target="_blank" class="wb-link" title="Open link">${escapeHtml(it.work)}</a></span>`;
                    }
                    return `<span class="wb-subitem-chip">${escapeHtml(it.work)}</span>`;
                  }).join('');
                  return `
                    <div class="whiteboard-bubble-group wb-chapter-bubble">
                      <div class="wb-group-prefix wb-chapter-title">${escapeHtml(bullet.prefix)}</div>
                      <div class="wb-chips-row">${subChips}</div>
                    </div>
                  `;
                } else {
                  return bullet.items.map(it => {
                    if (it.link) {
                      return `<span class="wb-subitem-chip"><a href="${escapeHtml(it.link)}" target="_blank" class="wb-link" title="Open link">${escapeHtml(it.work)}</a></span>`;
                    }
                    return `<span class="wb-subitem-chip">${escapeHtml(it.work)}</span>`;
                  }).join('');
                }
              }).join('');

              return `
                <div class="whiteboard-bubble-group">
                  <div class="wb-group-prefix">${escapeHtml(catKey)}</div>
                  <div class="wb-chips-row">${chipsHtml}</div>
                </div>
              `;
            }).join('');

            cardBodyHtml = `${testHeaderHtml}<div class="whiteboard-items-flow">${bubbleGroups}</div>`;
          } else {
            let itemsListHtml = '';
            catKeys.forEach(catKey => {
              const items = lessonGrouped[catKey];
              const structured = this.aggregateTaskObjects(items);
              totalWorkItemsCount += structured.length;

              structured.forEach(bullet => {
                let lineContent = '';
                if (bullet.type === 'chapter') {
                  const formattedSubItems = bullet.items.map(it => {
                    if (it.link) {
                      return `<a href="${escapeHtml(it.link)}" target="_blank" class="wb-link" title="Open link for ${escapeHtml(it.work)}">${escapeHtml(it.work)}</a>`;
                    }
                    return `<span>${escapeHtml(it.work)}</span>`;
                  }).join(', ');
                  lineContent = `<span>${escapeHtml(bullet.prefix)}${bullet.items.length > 0 ? ': ' : ''}</span>${formattedSubItems}`;
                } else {
                  lineContent = bullet.items.map(it => {
                    if (it.link) {
                      return `<a href="${escapeHtml(it.link)}" target="_blank" class="wb-link" title="Open link for ${escapeHtml(it.work)}">${escapeHtml(it.work)}</a>`;
                    }
                    return `<span>${escapeHtml(it.work)}</span>`;
                  }).join(', ');
                }

                itemsListHtml += `
                  <div class="whiteboard-work-item">
                    <span class="wb-bullet">•</span>
                    <div><strong style="color:var(--text-main);">${escapeHtml(catKey)}</strong> - ${lineContent}</div>
                  </div>
                `;
              });
            });

            cardBodyHtml = `${testHeaderHtml}<div>${itemsListHtml}</div>`;
          }
        }

        const cardHtml = `
          <div class="${cardClass}">
            <button type="button" class="wb-tile-hide-btn" data-lesson-id="${escapeHtml(lesson.id)}" title="Hide this lesson" aria-label="Hide lesson">✕</button>
            <div class="whiteboard-type-header">
              <div style="display:flex; align-items:center; gap:0.5rem; white-space:nowrap;" title="${escapeHtml(lesson.title ? lesson.title.trim() : lessonDisplayTitle)}">
                <span>${lessonDisplayTitle}</span>
              </div>
              <div style="display:flex; align-items:center; white-space:nowrap;">
                <span class="wb-card-slot-badge" title="${TermManager.formatDisplayDate(slot.date)}">
                  ${dayName} ${escapeHtml(slot.periodName)}
                </span>
              </div>
            </div>
            ${cardBodyHtml}
          </div>
        `;

        return {
          isCompact,
          cardHtml
        };
      });

      let i = 0;
      while (i < cardsData.length) {
        const current = cardsData[i];
        const next = cardsData[i + 1];
        if (isBubbleLayout && current.isCompact && next && next.isCompact) {
          wbHtml += `
            <div class="wb-compact-stack">
              ${current.cardHtml}
              ${next.cardHtml}
            </div>
          `;
          i += 2;
        } else {
          wbHtml += current.cardHtml;
          i += 1;
        }
      }

      wbHtml += '</div>';

      if (!anyTasksInWeek && visibleEntries.length > 0 && totalWorkItemsCount === 0) {
        if (bodyEl) {
          bodyEl.innerHTML = `<div style="text-align:center; padding:4rem; font-size:1.4rem; color:#94a3b8;">No classwork tasks recorded for ${escapeHtml(selectedClassName)} for the selected lesson(s).</div>`;
        }
        return;
      }

      if (bodyEl) bodyEl.innerHTML = wbHtml;

      if (!this.isManualFontScale) {
        const autoScale = this.calculateAutoFontScale(totalWorkItemsCount, visibleEntries.length);
        this.updateWhiteboardFontScale(autoScale, false);
      } else {
        this.updateWhiteboardFontScale(this.whiteboardFontScale, true);
      }
      return;
    }

    // Category Grouping Display Mode (Default)
    const groupedByType = {};

    visibleEntries.forEach(entry => {
      const items = this.getFormattedClassworkForLesson(entry.lesson);
      items.forEach(item => {
        const typeKey = (item.type || 'General Work').trim();
        if (!groupedByType[typeKey]) groupedByType[typeKey] = [];
        if (item.work && item.work.trim()) {
          groupedByType[typeKey].push({
            work: item.work || '',
            link: item.link || '',
            lessonTitle: entry.lesson.title,
            className: entry.classObj.name
          });
        }
      });
    });

    const typeKeys = Object.keys(groupedByType);

    if (typeKeys.length === 0) {
      if (bodyEl) {
        bodyEl.innerHTML = `<div style="text-align:center; padding:4rem; font-size:1.4rem; color:#94a3b8;">No classwork tasks recorded for ${escapeHtml(selectedClassName)} for the selected lesson(s).</div>`;
      }
      return;
    }

    let totalWorkItemsCount = 0;
    const isBubbleLayout = (this.whiteboardLayoutMode !== 'list');
    let wbHtml = `<div class="whiteboard-cards-grid ${isBubbleLayout ? 'layout-bubbles' : 'layout-list'}">`;

    typeKeys.forEach(typeKey => {
      const items = groupedByType[typeKey];
      const structured = this.aggregateTaskObjects(items);
      totalWorkItemsCount += structured.length;

      let itemsContentHtml = '';

      if (isBubbleLayout) {
        const bubblesHtml = structured.map(bullet => {
          if (bullet.type === 'chapter') {
            const chipsHtml = bullet.items.map(it => {
              if (it.link) {
                return `<span class="wb-subitem-chip"><a href="${escapeHtml(it.link)}" target="_blank" class="wb-link" title="Open link">${escapeHtml(it.work)}</a></span>`;
              }
              return `<span class="wb-subitem-chip">${escapeHtml(it.work)}</span>`;
            }).join('');

            return `
              <div class="whiteboard-bubble-group wb-chapter-bubble">
                <div class="wb-group-prefix wb-chapter-title">${escapeHtml(bullet.prefix)}</div>
                <div class="wb-chips-row">${chipsHtml}</div>
              </div>
            `;
          } else {
            const tasksHtml = bullet.items.map(it => {
              const workContent = it.link
                ? `<a href="${escapeHtml(it.link)}" target="_blank" class="wb-link" title="Open link">${escapeHtml(it.work)}</a>`
                : `<span>${escapeHtml(it.work)}</span>`;
              return `
                <div class="whiteboard-task-bubble">
                  <span class="wb-bullet">•</span>
                  <div>${workContent}</div>
                </div>
              `;
            }).join('');
            return tasksHtml;
          }
        }).join('');

        itemsContentHtml = `<div class="whiteboard-items-flow">${bubblesHtml}</div>`;
      } else {
        let itemsListHtml = '';
        structured.forEach(bullet => {
          let lineContent = '';
          if (bullet.type === 'chapter') {
            const formattedSubItems = bullet.items.map(it => {
              if (it.link) {
                return `<a href="${escapeHtml(it.link)}" target="_blank" class="wb-link" title="Open link for ${escapeHtml(it.work)}">${escapeHtml(it.work)}</a>`;
              }
              return `<span>${escapeHtml(it.work)}</span>`;
            }).join(', ');

            lineContent = `<span>${escapeHtml(bullet.prefix)}${bullet.items.length > 0 ? ': ' : ''}</span>${formattedSubItems}`;
          } else {
            lineContent = bullet.items.map(it => {
              if (it.link) {
                return `<a href="${escapeHtml(it.link)}" target="_blank" class="wb-link" title="Open link for ${escapeHtml(it.work)}">${escapeHtml(it.work)}</a>`;
              }
              return `<span>${escapeHtml(it.work)}</span>`;
            }).join(', ');
          }

          itemsListHtml += `
            <div class="whiteboard-work-item">
              <span class="wb-bullet">•</span>
              <div>${lineContent}</div>
            </div>
          `;
        });

        itemsContentHtml = `<div>${itemsListHtml}</div>`;
      }

      wbHtml += `
        <div class="whiteboard-card">
          <div class="whiteboard-type-header">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span>${escapeHtml(typeKey)}</span>
            </div>
          </div>
          ${itemsContentHtml}
        </div>
      `;
    });

    wbHtml += '</div>';

    if (bodyEl) bodyEl.innerHTML = wbHtml;

    if (!this.isManualFontScale) {
      const autoScale = this.calculateAutoFontScale(totalWorkItemsCount, typeKeys.length);
      this.updateWhiteboardFontScale(autoScale, false);
    } else {
      this.updateWhiteboardFontScale(this.whiteboardFontScale, true);
    }
  },

  generateSummaryText(scheduledEntries = null, formatMode = null) {
    const mode = formatMode || this.groupingMode;
    const entries = scheduledEntries || this.getScheduledLessonsForSelectedWeek();
    if (entries.length === 0) return '(No classwork recorded for this week)';

    const selectedClass = state.classes.find(c => c.id === this.selectedClassId);
    const selectedClassName = selectedClass ? selectedClass.name : 'Class';

    if (mode === 'lesson') {
      const lessonBlocks = [];
      const links = [];
      let totalTasksCount = 0;

      entries.forEach((entry, idx) => {
        const items = this.getFormattedClassworkForLesson(entry.lesson);
        const hasWork = items.some(it => it && it.work && it.work.trim());
        const isAssessment = this.isLessonAssessment(entry.lesson);

        // Strict lesson numbering with lesson titles removed: Lesson 1, Lesson 2, etc.
        const headerText = `Lesson ${idx + 1}`;

        if (!hasWork) {
          totalTasksCount++;
          if (isAssessment) {
            lessonBlocks.push(`${headerText}\nTest`);
          } else {
            lessonBlocks.push(`${headerText}\nCatch Up`);
          }
          return;
        }

        const groupedForLesson = {};
        items.forEach(item => {
          const typeKey = (item.type || 'General').trim();
          if (!groupedForLesson[typeKey]) groupedForLesson[typeKey] = [];
          if (item.work && item.work.trim()) {
            groupedForLesson[typeKey].push({
              work: item.work.trim(),
              link: item.link || ''
            });
            if (item.link && item.link.trim()) {
              links.push({
                type: typeKey,
                name: item.work.trim(),
                url: item.link.trim()
              });
            }
          }
        });

        const catKeys = Object.keys(groupedForLesson);
        if (catKeys.length === 0) {
          totalTasksCount++;
          if (isAssessment) {
            lessonBlocks.push(`${headerText}\nTest`);
          } else {
            lessonBlocks.push(`${headerText}\nCatch Up`);
          }
          return;
        }
        totalTasksCount += catKeys.length;

        const blockLines = [headerText];
        catKeys.forEach(cat => {
          const aggWorks = this.aggregateTaskItems(groupedForLesson[cat]);
          blockLines.push(`${cat} - ${aggWorks.join(' | ')}`);
        });

        lessonBlocks.push(blockLines.join('\n'));
      });

      if (totalTasksCount === 0 || lessonBlocks.length === 0) {
        return '(No classwork tasks recorded for this week)';
      }

      const lines = [];
      if (selectedClassName) {
        lines.push(`${selectedClassName} Homework:`);
        lines.push('');
      }
      lines.push(lessonBlocks.join('\n\n'));

      if (links.length > 0) {
        const uniqueLinks = [];
        links.forEach(l => {
          if (!uniqueLinks.some(u => u.url === l.url)) {
            uniqueLinks.push(l);
          }
        });

        lines.push('');
        lines.push('Links:');
        uniqueLinks.forEach(l => {
          lines.push(`• ${l.type} (${l.name}): ${l.url}`);
        });
      }

      return lines.join('\n').trim();
    }

    // Category Mode (Default)
    const grouped = {};
    const links = [];

    entries.forEach(entry => {
      const items = this.getFormattedClassworkForLesson(entry.lesson);
      items.forEach(item => {
        const typeKey = (item.type || 'General').trim();
        if (!grouped[typeKey]) {
          grouped[typeKey] = [];
        }
        if (item.work && item.work.trim()) {
          grouped[typeKey].push({
            work: item.work.trim(),
            link: item.link || ''
          });
          if (item.link && item.link.trim()) {
            links.push({
              type: typeKey,
              name: item.work.trim(),
              url: item.link.trim()
            });
          }
        }
      });
    });

    const keys = Object.keys(grouped);
    if (keys.length === 0) return '(No classwork tasks recorded for this week)';

    const lines = [`${selectedClassName} Homework:`];
    keys.forEach(key => {
      lines.push(`${key}:`);
      lines.push('');
      const structured = this.aggregateTaskObjects(grouped[key]);
      structured.forEach(bullet => {
        if (bullet.type === 'chapter') {
          const subContent = bullet.items.map(it => it.work).join(', ');
          lines.push(`• ${bullet.prefix}${bullet.items.length > 0 ? ': ' : ''}${subContent}`);
        } else {
          const subContent = bullet.items.map(it => it.work).join(', ');
          lines.push(`• ${subContent}`);
        }
      });
      lines.push('');
    });

    if (links.length > 0) {
      const uniqueLinks = [];
      links.forEach(l => {
        if (!uniqueLinks.some(u => u.url === l.url)) {
          uniqueLinks.push(l);
        }
      });

      lines.push('Links:');
      uniqueLinks.forEach(l => {
        lines.push(`• ${l.type} (${l.name}): ${l.url}`);
      });
    }

    return lines.join('\n').trim();
  },

  generateSummaryHTML(scheduledEntries = null, formatMode = null) {
    const mode = formatMode || this.groupingMode;
    const entries = scheduledEntries || this.getScheduledLessonsForSelectedWeek();
    if (entries.length === 0) return '<div>(No classwork recorded for this week)</div>';

    const selectedClass = state.classes.find(c => c.id === this.selectedClassId);
    const selectedClassName = selectedClass ? selectedClass.name : 'Class';

    if (mode === 'lesson') {
      const lessonBlocksHtml = [];
      const links = [];
      let totalTasksCount = 0;

      entries.forEach((entry, idx) => {
        const items = this.getFormattedClassworkForLesson(entry.lesson);
        const hasWork = items.some(it => it && it.work && it.work.trim());
        const isAssessment = this.isLessonAssessment(entry.lesson);

        // Strict lesson numbering with lesson titles removed: Lesson 1, Lesson 2, etc.
        const headerText = `Lesson ${idx + 1}`;

        if (!hasWork) {
          totalTasksCount++;
          let blockHtml = `<div style="margin-top: 0.65rem; margin-bottom: 0.65rem;">`;
          blockHtml += `<div style="font-weight: 700; font-size: 1.02em; margin-bottom: 0.25rem;">${headerText}</div>`;
          blockHtml += `<div style="margin-bottom: 0.2rem; padding-left: 0.25rem;">${isAssessment ? 'Test' : 'Catch Up'}</div>`;
          blockHtml += `</div>`;
          lessonBlocksHtml.push(blockHtml);
          return;
        }

        const groupedForLesson = {};
        items.forEach(item => {
          const typeKey = (item.type || 'General').trim();
          if (!groupedForLesson[typeKey]) groupedForLesson[typeKey] = [];
          if (item.work && item.work.trim()) {
            groupedForLesson[typeKey].push({
              work: item.work.trim(),
              link: item.link || ''
            });
            if (item.link && item.link.trim()) {
              links.push({
                type: typeKey,
                name: item.work.trim(),
                url: item.link.trim()
              });
            }
          }
        });

        const catKeys = Object.keys(groupedForLesson);
        if (catKeys.length === 0) {
          totalTasksCount++;
          let blockHtml = `<div style="margin-top: 0.65rem; margin-bottom: 0.65rem;">`;
          blockHtml += `<div style="font-weight: 700; font-size: 1.02em; margin-bottom: 0.25rem;">${headerText}</div>`;
          blockHtml += `<div style="margin-bottom: 0.2rem; padding-left: 0.25rem;">${isAssessment ? 'Test' : 'Catch Up'}</div>`;
          blockHtml += `</div>`;
          lessonBlocksHtml.push(blockHtml);
          return;
        }
        totalTasksCount += catKeys.length;

        let blockHtml = `<div style="margin-top: 0.65rem; margin-bottom: 0.65rem;">`;
        blockHtml += `<div style="font-weight: 700; font-size: 1.02em; margin-bottom: 0.25rem;">${headerText}</div>`;

        catKeys.forEach(cat => {
          const itemsInCat = groupedForLesson[cat];
          const structured = this.aggregateTaskObjects(itemsInCat);
          const tasksFormatted = structured.map(bullet => {
            if (bullet.type === 'chapter') {
              const sub = bullet.items.map(it => {
                if (it.link) {
                  return `<a href="${escapeHtml(it.link)}" target="_blank" class="homework-summary-link" style="color: #0284c7; text-decoration: underline; font-weight: 500;">${escapeHtml(it.work)}</a>`;
                }
                return escapeHtml(it.work);
              }).join(', ');
              return `${escapeHtml(bullet.prefix)}${bullet.items.length > 0 ? ': ' : ''}${sub}`;
            } else {
              return bullet.items.map(it => {
                if (it.link) {
                  return `<a href="${escapeHtml(it.link)}" target="_blank" class="homework-summary-link" style="color: #0284c7; text-decoration: underline; font-weight: 500;">${escapeHtml(it.work)}</a>`;
                }
                return escapeHtml(it.work);
              }).join(', ');
            }
          }).join(' | ');

          blockHtml += `<div style="margin-bottom: 0.2rem; padding-left: 0.25rem;"><strong>${escapeHtml(cat)}</strong> - ${tasksFormatted}</div>`;
        });

        blockHtml += `</div>`;
        lessonBlocksHtml.push(blockHtml);
      });

      if (totalTasksCount === 0 || lessonBlocksHtml.length === 0) {
        return '<div>(No classwork tasks recorded for this week)</div>';
      }

      let html = '<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.6;">';
      html += `<div style="margin-bottom: 0.35rem; font-weight: 700;">${escapeHtml(selectedClassName)} Homework:</div>`;
      html += lessonBlocksHtml.join('');

      if (links.length > 0) {
        const uniqueLinks = [];
        links.forEach(l => {
          if (!uniqueLinks.some(u => u.url === l.url)) {
            uniqueLinks.push(l);
          }
        });

        html += '<div style="margin-top: 0.65rem; margin-bottom: 0.25rem; font-weight: 700;">Links:</div>';
        uniqueLinks.forEach(l => {
          html += `<div style="margin-bottom: 0.2rem;">• ${escapeHtml(l.type)} (${escapeHtml(l.name)}): <a href="${escapeHtml(l.url)}" target="_blank" class="homework-summary-link" style="color: #0284c7; text-decoration: underline; font-weight: 500;">${escapeHtml(l.url)}</a></div>`;
        });
      }

      html += '</div>';
      return html;
    }

    // Category Mode (Default)
    const grouped = {};
    const links = [];

    entries.forEach(entry => {
      const items = this.getFormattedClassworkForLesson(entry.lesson);
      items.forEach(item => {
        const typeKey = (item.type || 'General').trim();
        if (!grouped[typeKey]) {
          grouped[typeKey] = [];
        }
        if (item.work && item.work.trim()) {
          grouped[typeKey].push({
            work: item.work.trim(),
            link: item.link || ''
          });
          if (item.link && item.link.trim()) {
            links.push({
              type: typeKey,
              name: item.work.trim(),
              url: item.link.trim()
            });
          }
        }
      });
    });

    const keys = Object.keys(grouped);
    if (keys.length === 0) return '<div>(No classwork tasks recorded for this week)</div>';

    let html = '<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.6;">';
    html += `<div style="margin-bottom: 0.25rem; font-weight: 700;">${escapeHtml(selectedClassName)} Homework:</div>`;

    keys.forEach((key) => {
      html += `<div style="margin-top: 0.5rem; margin-bottom: 0.35rem; font-weight: 700;">${escapeHtml(key)}:</div>`;
      const structured = this.aggregateTaskObjects(grouped[key]);
      structured.forEach(bullet => {
        if (bullet.type === 'chapter') {
          const subContent = bullet.items.map(it => escapeHtml(it.work)).join(', ');
          html += `<div style="margin-bottom: 0.2rem;">• ${escapeHtml(bullet.prefix)}${bullet.items.length > 0 ? ': ' : ''}${subContent}</div>`;
        } else {
          const subContent = bullet.items.map(it => escapeHtml(it.work)).join(', ');
          html += `<div style="margin-bottom: 0.2rem;">• ${subContent}</div>`;
        }
      });
      html += '<div style="height: 0.5rem;"></div>';
    });

    if (links.length > 0) {
      const uniqueLinks = [];
      links.forEach(l => {
        if (!uniqueLinks.some(u => u.url === l.url)) {
          uniqueLinks.push(l);
        }
      });

      html += '<div style="margin-top: 0.5rem; margin-bottom: 0.25rem; font-weight: 700;">Links:</div>';
      uniqueLinks.forEach(l => {
        html += `<div style="margin-bottom: 0.2rem;">• ${escapeHtml(l.type)} (${escapeHtml(l.name)}): <a href="${escapeHtml(l.url)}" target="_blank" class="homework-summary-link" style="color: #0284c7; text-decoration: underline; font-weight: 500;">${escapeHtml(l.url)}</a></div>`;
      });
    }

    html += '</div>';
    return html;
  },

  copySummaryToClipboard() {
    const plainText = this.generateSummaryText();
    const htmlText = this.generateSummaryHTML();

    if (navigator.clipboard && window.ClipboardItem) {
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      const htmlBlob = new Blob([htmlText], { type: 'text/html' });
      const item = new ClipboardItem({
        'text/plain': textBlob,
        'text/html': htmlBlob
      });

      navigator.clipboard.write([item]).then(() => {
        showToastNotification('📋 Homework summary copied with hyperlinked materials!');
      }).catch(() => {
        this.fallbackCopyText(plainText);
      });
    } else {
      this.fallbackCopyText(plainText);
    }
  },

  fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToastNotification('📋 Homework summary copied to clipboard!');
    } catch (err) {
      alert('Copy failed. Please copy text manually.');
    }
    document.body.removeChild(textArea);
  },

  navigateToPrevWeek() {
    if (this.selectedWeekNum > 1) {
      this.selectedWeekNum--;
    } else {
      const termIdx = state.terms.findIndex(t => t.id === this.selectedTermId);
      if (termIdx > 0) {
        const prevTerm = state.terms[termIdx - 1];
        this.selectedTermId = prevTerm.id;
        this.selectedWeekNum = TermManager.getTermWeeks(prevTerm);
      }
    }
    this.renderTermAndWeekPicker();
    this.renderMainContent();
  },

  navigateToNextWeek() {
    const term = state.terms.find(t => t.id === this.selectedTermId) || state.terms[0];
    const maxWeeks = term ? TermManager.getTermWeeks(term) : 10;

    if (this.selectedWeekNum < maxWeeks) {
      this.selectedWeekNum++;
    } else {
      const termIdx = state.terms.findIndex(t => t.id === this.selectedTermId);
      if (termIdx !== -1 && termIdx < state.terms.length - 1) {
        const nextTerm = state.terms[termIdx + 1];
        this.selectedTermId = nextTerm.id;
        this.selectedWeekNum = 1;
      }
    }
    this.renderTermAndWeekPicker();
    this.renderMainContent();
  },

  bindEvents() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#homework-class-selector .nav-btn');
      if (btn) {
        this.selectedClassId = btn.getAttribute('data-id');
        this.renderClassSelector();
        this.renderMainContent();
        if (typeof ClassTimer !== 'undefined') {
          ClassTimer.selectedClassId = this.selectedClassId;
          if (ClassTimer.activeSchedule && !ClassTimer.isPinned) {
            ClassTimer.activeSchedule = null;
            ClassTimer.updateDOM();
          } else {
            ClassTimer.updateDOM();
          }
        }
        return;
      }

      if (e.target.id === 'btn-toggle-wb-layout' || e.target.closest('#btn-toggle-wb-layout')) {
        this.toggleWhiteboardLayout();
        return;
      }
      if (e.target.id === 'btn-toggle-wb-grouping' || e.target.closest('#btn-toggle-wb-grouping')) {
        this.toggleGroupingMode();
        return;
      }
      if (e.target.id === 'btn-wb-zoom-in' || e.target.closest('#btn-wb-zoom-in')) {
        this.updateWhiteboardFontScale(this.whiteboardFontScale + 0.2, true);
        return;
      }
      if (e.target.id === 'btn-wb-zoom-out' || e.target.closest('#btn-wb-zoom-out')) {
        this.updateWhiteboardFontScale(this.whiteboardFontScale - 0.2, true);
        return;
      }
      if (e.target.id === 'btn-wb-zoom-auto' || e.target.closest('#btn-wb-zoom-auto')) {
        this.isManualFontScale = false;
        this.renderWhiteboardContent();
        return;
      }
      if (e.target.id === 'btn-wb-collapse-bar' || e.target.closest('#btn-wb-collapse-bar')) {
        this.toggleProgressBar(true);
        return;
      }
      if (e.target.id === 'btn-wb-expand-bar' || e.target.closest('#btn-wb-expand-bar')) {
        this.toggleProgressBar(false);
        return;
      }
      if (e.target.closest('#btn-hw-group-category')) {
        this.setGroupingMode('category');
        return;
      }
      if (e.target.closest('#btn-hw-group-lesson')) {
        this.setGroupingMode('lesson');
        return;
      }

      // Tile Sync Button Handler
      const syncBtn = e.target.closest('.hw-card-sync-btn');
      if (syncBtn) {
        e.preventDefault();
        e.stopPropagation();
        const classId = syncBtn.getAttribute('data-class');
        const lessonId = syncBtn.getAttribute('data-lesson-id');
        if (classId && lessonId) {
          const lesson = Scheduler.resolveLessonOrMerged(classId, lessonId);
          const linked = state.getLinkedClasses(classId);
          if (lesson && linked.length > 0) {
            if (lesson.isMerged && Array.isArray(lesson.mergedLessonIds)) {
              const rawLessons = state.lessonPlans[classId] || [];
              lesson.mergedLessonIds.forEach(mId => {
                const subL = rawLessons.find(l => l.id === mId);
                if (subL) {
                  linked.forEach(targetClass => state.syncLinkedLesson(classId, subL, targetClass.id));
                }
              });
            } else {
              linked.forEach(targetClass => {
                state.syncLinkedLesson(classId, lesson, targetClass.id);
              });
            }
            const names = linked.map(l => l.name).join(', ');
            showToastNotification(`✅ Synced "${lesson.title}" to ${names}!`);
            syncBtn.disabled = true;
            syncBtn.innerHTML = `✅ Synced`;
            syncBtn.style.opacity = '0.6';
            syncBtn.style.cursor = 'not-allowed';
          }
        }
        return;
      }

      // Click on homework lesson card: open LessonViewer for merged lessons (with 2 edit buttons) or Edit Modal for single lessons
      const card = e.target.closest('.homework-lesson-card');
      if (card && !e.target.closest('a')) {
        const classId = card.getAttribute('data-class');
        const lessonId = card.getAttribute('data-lesson-id');
        const dateStr = card.getAttribute('data-date');
        const periodId = card.getAttribute('data-period');
        if (classId && lessonId) {
          const classObj = state.classes.find(c => c.id === classId);
          const lesson = Scheduler.resolveLessonOrMerged(classId, lessonId);
          if (lesson && classObj) {
            if (window.LessonUI) window.LessonUI.selectedClassId = classId;
            if (lesson.isMerged && window.LessonViewer) {
              const periodObj = state.periods.find(p => p.id === periodId);
              const term = TermManager.getTermForDate(dateStr);
              window.LessonViewer.open(lesson, classObj, {
                date: dateStr || '',
                termName: term ? term.name : '',
                periodId: periodId || '',
                periodName: periodObj ? periodObj.name : ''
              });
            } else if (window.LessonUI) {
              window.LessonUI.openEditLessonModal(lesson.id);
            }
          }
        }
        return;
      }

      // Whiteboard hide tile & restore buttons handler
      const hideBtn = e.target.closest('.wb-tile-hide-btn');
      if (hideBtn) {
        e.stopPropagation();
        const lessonId = hideBtn.getAttribute('data-lesson-id');
        if (lessonId) {
          this.hiddenLessonIds = this.hiddenLessonIds || new Set();
          this.hiddenLessonIds.add(lessonId);
          this.renderWhiteboardContent();
        }
        return;
      }

      const unhideBtn = e.target.closest('#btn-wb-unhide-all, .btn-wb-unhide-all');
      if (unhideBtn) {
        e.stopPropagation();
        if (this.hiddenLessonIds) this.hiddenLessonIds.clear();
        this.renderWhiteboardContent();
        return;
      }

      const limitBtn = e.target.closest('.wb-progress-btn');
      if (limitBtn) {
        const limitVal = limitBtn.getAttribute('data-limit');
        this.coveredLessonLimit = (limitVal === 'all') ? null : parseInt(limitVal, 10);
        if (limitVal === 'all' && this.hiddenLessonIds) {
          this.hiddenLessonIds.clear();
        }
        this.renderWhiteboardContent();
        return;
      }

      const exitBtn = e.target.closest('#btn-exit-whiteboard') || e.target.closest('#modal-whiteboard-backdrop .modal-close');
      const backdrop = document.getElementById('modal-whiteboard-backdrop');
      if (exitBtn || (e.target === backdrop && backdrop && backdrop.classList.contains('active'))) {
        if (typeof ClassTimer !== 'undefined' && ClassTimer.onExitWhiteboardView) {
          ClassTimer.onExitWhiteboardView();
        }
      }
    });

    const syncWeekBtn = document.getElementById('btn-homework-sync-week');
    if (syncWeekBtn) {
      syncWeekBtn.addEventListener('click', () => {
        const linked = state.getLinkedClasses(this.selectedClassId);
        const currentClass = state.classes.find(c => c.id === this.selectedClassId);
        const currentClassName = currentClass ? currentClass.name : 'this class';

        if (linked.length === 0) {
          alert(`No linked classes configured for ${currentClassName}. Click "🔗 Manage Class Links" in View 3 to link parallel classes.`);
          return;
        }

        const entries = this.getScheduledLessonsForSelectedWeek();
        if (entries.length === 0) {
          alert(`No scheduled lessons in ${currentClassName} for the selected week.`);
          return;
        }

        const linkedNames = linked.map(l => l.name).join(', ');
        if (confirm(`🔄 Sync all ${entries.length} scheduled lesson(s) for this week from ${currentClassName} to ${linkedNames}?`)) {
          entries.forEach(entry => {
            if (entry.lesson.isMerged && Array.isArray(entry.lesson.mergedLessonIds)) {
              const rawLessons = state.lessonPlans[this.selectedClassId] || [];
              entry.lesson.mergedLessonIds.forEach(mId => {
                const subL = rawLessons.find(l => l.id === mId);
                if (subL) {
                  linked.forEach(targetClass => state.syncLinkedLesson(this.selectedClassId, subL, targetClass.id));
                }
              });
            } else {
              linked.forEach(targetClass => {
                state.syncLinkedLesson(this.selectedClassId, entry.lesson, targetClass.id);
              });
            }
          });
          showToastNotification(`✅ Synced Week homework to ${linkedNames}!`);
          this.renderMainContent();
        }
      });
    }

    const termSelect = document.getElementById('homework-term-select');
    if (termSelect) {
      termSelect.addEventListener('change', (e) => {
        this.selectedTermId = e.target.value;
        this.selectedWeekNum = 1;
        this.renderTermAndWeekPicker();
        this.renderMainContent();
      });
    }

    const weekSelect = document.getElementById('homework-week-select');
    if (weekSelect) {
      weekSelect.addEventListener('change', (e) => {
        this.selectedWeekNum = parseInt(e.target.value, 10);
        this.renderMainContent();
      });
    }

    const prevBtn = document.getElementById('btn-homework-prev-week');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.navigateToPrevWeek();
      });
    }

    const nextBtn = document.getElementById('btn-homework-next-week');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.navigateToNextWeek();
      });
    }

    const wbBtn = document.getElementById('btn-open-whiteboard-modal');
    if (wbBtn) {
      wbBtn.addEventListener('click', () => {
        this.openWhiteboardModal();
      });
    }

    const fsBtn = document.getElementById('btn-fullscreen-whiteboard');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        const backdrop = document.getElementById('modal-whiteboard-backdrop');
        if (!document.fullscreenElement) {
          if (backdrop.requestFullscreen) backdrop.requestFullscreen();
          else if (backdrop.webkitRequestFullscreen) backdrop.webkitRequestFullscreen();
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
      });
    }
  }
};

if (typeof window !== 'undefined') {
  window.HomeworkUI = HomeworkUI;
}
