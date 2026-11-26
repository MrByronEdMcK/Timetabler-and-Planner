/* ==========================================================================
   Auto-Scheduler, Pacing Engine & Non-Destructive Conflict Resolver
   ========================================================================== */

import { state } from './state.js';
import { TermManager } from './termManager.js';
import { TimetableManager, formatTimeRange } from './timetableManager.js';

export const Scheduler = {
  reanalysisStats: {
    unpinnedLessons: [],
    omittedRevisions: [],
    omittedFloats: [],
    mergedLessons: [],
    clear() {
      this.unpinnedLessons = [];
      this.omittedRevisions = [];
      this.omittedFloats = [];
      this.mergedLessons = [];
    },
    hasChanges() {
      return this.unpinnedLessons.length > 0 ||
             this.omittedRevisions.length > 0 ||
             this.omittedFloats.length > 0 ||
             this.mergedLessons.length > 0;
    },
    addUnpinned(className, lessonTitle, lessonId) {
      const id = lessonId || lessonTitle;
      if (!this.unpinnedLessons.some(x => x.lessonId === id && x.className === className)) {
        this.unpinnedLessons.push({ className, lessonTitle, lessonId: id });
      }
    },
    addOmittedFloat(className, lessonTitle, lessonId) {
      const id = lessonId || lessonTitle;
      if (!this.omittedFloats.some(x => x.lessonId === id && x.className === className)) {
        this.omittedFloats.push({ className, lessonTitle, lessonId: id });
      }
    },
    addOmittedRevision(className, lessonTitle, lessonId) {
      const id = lessonId || lessonTitle;
      if (!this.omittedRevisions.some(x => x.lessonId === id && x.className === className)) {
        this.omittedRevisions.push({ className, lessonTitle, lessonId: id });
      }
    },
    addMerged(className, title1, title2, mergedId) {
      const id = mergedId || `${title1}_${title2}`;
      if (!this.mergedLessons.some(x => x.mergedId === id && x.className === className)) {
        this.mergedLessons.push({ className, title1, title2, mergedId: id });
      }
    },
    getSummaryMessage() {
      const parts = [];
      if (this.unpinnedLessons.length > 0) {
        parts.push(`📌 ${this.unpinnedLessons.length} pinned lesson(s) unpinned due to upstream insertion`);
      }
      if (this.omittedRevisions.length > 0) {
        parts.push(`⭐ ${this.omittedRevisions.length} revision session(s) hidden`);
      }
      if (this.omittedFloats.length > 0) {
        parts.push(`🎈 ${this.omittedFloats.length} float lesson(s) hidden`);
      }
      if (this.mergedLessons.length > 0) {
        parts.push(`🔀 ${this.mergedLessons.length} lesson pair(s) combined into single periods`);
      }
      return parts.join(' • ');
    }
  },

  /**
   * Builds a non-destructive merged lesson representation from two adjacent lessons.
   * Format: "Merged: {Title 1}, {Title 2}"
   * Preserves tasks in lesson order (Lesson 1 tasks first, then Lesson 2 tasks)
   * and clearly splits teaching notes by lesson with titling.
   */
  buildMergedLessonObject(l1, l2, isManualMerge = false) {
    const cw1 = Array.isArray(l1.classwork) ? JSON.parse(JSON.stringify(l1.classwork)) : [];
    const cw2 = Array.isArray(l2.classwork) ? JSON.parse(JSON.stringify(l2.classwork)) : [];
    const combinedClasswork = [...cw1, ...cw2];

    const notes1 = (l1.content && l1.content.trim()) ? l1.content.trim() : '(No teaching notes)';
    const notes2 = (l2.content && l2.content.trim()) ? l2.content.trim() : '(No teaching notes)';
    const combinedContent = `=== 1. ${l1.title} ===\n${notes1}\n\n=== 2. ${l2.title} ===\n${notes2}`;

    return {
      id: `merged_${l1.id}_${l2.id}`,
      title: `Merged: ${l1.title}, ${l2.title}`,
      unit: l1.unit || l2.unit || 'General Curriculum',
      isMerged: true,
      isManualMerge: Boolean(isManualMerge),
      isRevision: Boolean(l1.isRevision && l2.isRevision),
      mergedLessonIds: [l1.id, l2.id],
      mergedTitles: [l1.title, l2.title],
      classwork: combinedClasswork,
      content: combinedContent
    };
  },

  /**
   * Applies non-destructive manual schedule adjustments (manual revision omissions
   * and manual adjacent lesson merges) while keeping original lessons intact in state.lessonPlans.
   * Automatically clears stale merge flags if lessons were rearranged so they are no longer adjacent.
   */
  applyManualScheduleAdjustments(lessonsList) {
    if (!Array.isArray(lessonsList) || lessonsList.length === 0) return [];
    const result = [];
    let i = 0;
    while (i < lessonsList.length) {
      const curr = lessonsList[i];
      if (!curr) {
        i++;
        continue;
      }
      if (curr.isOmittedFromSchedule) {
        i++;
        continue;
      }
      if (curr.mergeWithNextId) {
        const next = lessonsList[i + 1];
        if (next && !next.isOmittedFromSchedule && next.id === curr.mergeWithNextId && !curr.isTestMilestone && !next.isTestMilestone) {
          result.push(this.buildMergedLessonObject(curr, next, true));
          i += 2;
          continue;
        } else {
          // Schedule/sequence was rearranged so these two lessons are no longer adjacent — auto-unmerge!
          delete curr.mergeWithNextId;
        }
      }
      result.push(curr);
      i++;
    }
    return result;
  },

  /**
   * Resolves a lesson ID (either a direct lesson ID in state.lessonPlans or a synthetic merged_l1_l2 ID)
   * into its lesson object so clicking any regular or merged card in View 4 or View 5 works seamlessly.
   */
  resolveLessonOrMerged(classId, lessonId) {
    if (!classId || !lessonId) return null;
    const rawLessons = state.lessonPlans[classId] || [];
    const direct = rawLessons.find(l => l.id === lessonId);
    if (direct) return direct;

    if (String(lessonId).startsWith('merged_')) {
      const { schedule } = this.generateScheduleForClass(classId);
      const fromSched = schedule.find(s => s.lesson && s.lesson.id === lessonId);
      if (fromSched && fromSched.lesson) return fromSched.lesson;

      // Fallback: match by constituent IDs
      for (let i = 0; i < rawLessons.length - 1; i++) {
        const l1 = rawLessons[i];
        const l2 = rawLessons[i + 1];
        if (`merged_${l1.id}_${l2.id}` === lessonId) {
          return this.buildMergedLessonObject(l1, l2, l1.mergeWithNextId === l2.id);
        }
      }
    }
    return null;
  },

  getAllClassSlotsForYear(classId) {
    if (!classId) {
      console.error('[SCHEDULER ENGINE ERROR] getAllClassSlotsForYear called with invalid classId:', classId);
      return [];
    }

    const schoolDays = TermManager.getAllTermSchoolDays();
    const periods = state.periods.filter(p => !p.isBreak);
    const slots = [];
    const currentDateStr = state.currentDate;

    schoolDays.forEach(day => {
      const weekCycle = TimetableManager.getWeekCycleNumber(day.date);
      const isPast = day.date <= currentDateStr;

      periods.forEach(period => {
        const assignedClass = TimetableManager.getClassForSlot(weekCycle, day.dayOfWeek, period.id);
        if (assignedClass && (classId === 'ALL' || assignedClass.id === classId)) {
          const blockout = TermManager.getBlockoutForDate(day.date, assignedClass.id, period.id);
          slots.push({
            date: day.date,
            termId: day.termId,
            termName: day.termName,
            dayOfWeek: day.dayOfWeek,
            periodId: period.id,
            periodName: period.name,
            timeFormatted: formatTimeRange(period.startTime, period.endTime),
            weekCycle: weekCycle,
            assignedClass: assignedClass,
            isPast: isPast,
            blockout: blockout || null
          });
        }
      });
    });

    return slots;
  },

  getAvailableSlots(classId) {
    return this.getAllClassSlotsForYear(classId).filter(slot => !slot.blockout);
  },

  generateScheduleForClass(classId) {
    const rawLessons = state.lessonPlans[classId] || [];
    const lessons = this.applyManualScheduleAdjustments(rawLessons);
    const availableSlots = this.getAvailableSlots(classId);

    if (availableSlots.length === 0 || lessons.length === 0) {
      return {
        schedule: availableSlots.map(slot => ({ slot: slot, lesson: null, isLocked: slot.isPast })),
        totalSlots: availableSlots.length,
        totalLessons: lessons.length,
        unassignedLessons: lessons
      };
    }

    // 1. Find all milestone/anchored test lessons or pinned lessons with target dates/slot keys
    const candidateMilestones = [];
    lessons.forEach((lesson, index) => {
      const isExplicitTest = lesson.isTestMilestone && (lesson.testSlotKey || lesson.testDate);
      const isPinnedLesson = lesson.isPinned && (lesson.pinnedSlotKey || lesson.pinnedDate);

      if (isExplicitTest || isPinnedLesson) {
        let key = isExplicitTest ? lesson.testSlotKey : lesson.pinnedSlotKey;
        const targetDate = isExplicitTest ? lesson.testDate : lesson.pinnedDate;
        const targetPeriodId = isExplicitTest ? lesson.testPeriodId : lesson.pinnedPeriodId;

        if (!key && targetDate && targetPeriodId) {
          key = `${targetDate}_${targetPeriodId}`;
        }

        let slotIdx = -1;
        if (key) {
          slotIdx = availableSlots.findIndex(s => `${s.date}_${s.periodId}` === key);
        }
        if (slotIdx === -1 && targetDate) {
          if (targetPeriodId) {
            slotIdx = availableSlots.findIndex(s => s.date === targetDate && s.periodId === targetPeriodId);
          }
          if (slotIdx === -1) {
            slotIdx = availableSlots.findIndex(s => s.date === targetDate);
          }
          if (slotIdx === -1) {
            slotIdx = availableSlots.findIndex(s => s.date >= targetDate);
          }
        }

        if (slotIdx >= 0) {
          candidateMilestones.push({
            lessonIndex: index,
            lesson: lesson,
            targetSlotIdx: slotIdx,
            isPinned: isPinnedLesson && !isExplicitTest,
            targetDate: targetDate
          });
        }
      }
    });

    candidateMilestones.sort((a, b) => a.lessonIndex - b.lessonIndex);

    // Filter milestones: Unpin pinned lessons ONLY IF upstream insertion created a slot deficit prior to their pinned date
    const milestones = [];
    let currentLessonCheckStart = 0;
    let currentSlotCheckStart = 0;

    candidateMilestones.forEach(m => {
      const windowLessons = lessons.slice(currentLessonCheckStart, m.lessonIndex);
      const windowSlotsCount = Math.max(0, m.targetSlotIdx - currentSlotCheckStart);
      const isOutOfOrder = m.targetSlotIdx < currentSlotCheckStart;

      if (isOutOfOrder || windowLessons.length > windowSlotsCount) {
        if (m.isPinned) {
          m.lesson.isPinned = false;
          delete m.lesson.pinnedDate;
          delete m.lesson.pinnedPeriodId;
          delete m.lesson.pinnedSlotKey;

          const classObj = state.classes.find(c => c.id === classId);
          this.reanalysisStats.addUnpinned(classObj ? classObj.name : classId, m.lesson.title, m.lesson.id);
        } else if (isOutOfOrder && m.lesson.isTestMilestone) {
          delete m.lesson.testDate;
          delete m.lesson.testPeriodId;
          delete m.lesson.testSlotKey;

          const classObj = state.classes.find(c => c.id === classId);
          this.reanalysisStats.addUnpinned(classObj ? classObj.name : classId, `${m.lesson.title} (Test Date Cleared)`, m.lesson.id);
        } else {
          milestones.push(m);
          currentLessonCheckStart = m.lessonIndex + 1;
          currentSlotCheckStart = Math.max(currentSlotCheckStart, m.targetSlotIdx + 1);
        }
      } else {
        milestones.push(m);
        currentLessonCheckStart = m.lessonIndex + 1;
        currentSlotCheckStart = Math.max(currentSlotCheckStart, m.targetSlotIdx + 1);
      }
    });

    const slotToLesson = new Array(availableSlots.length).fill(null);

    if (milestones.length === 0) {
      const prioritizedLessons = this.getPrioritizedLessonsForCapacity(lessons, availableSlots.length, 'Full Term Window', classId);
      prioritizedLessons.forEach((l, idx) => {
        if (idx < availableSlots.length) {
          slotToLesson[idx] = l;
        }
      });
    } else {
      let currentLessonStart = 0;
      let currentSlotStart = 0;

      milestones.forEach((m, mIdx) => {
        const milestoneLessonIdx = m.lessonIndex;
        const milestoneSlotIdx = m.targetSlotIdx;

        slotToLesson[milestoneSlotIdx] = m.lesson;

        const windowLessons = lessons.slice(currentLessonStart, milestoneLessonIdx);
        const windowSlotsCount = Math.max(0, milestoneSlotIdx - currentSlotStart);
        const windowName = `Topic Window #${mIdx + 1} (${m.lesson.unit || 'Topic'} - before ${m.lesson.testDate || m.lesson.pinnedDate || 'Anchor'})`;

        const prioritizedWindow = this.getPrioritizedLessonsForCapacity(windowLessons, windowSlotsCount, windowName, classId);

        let fillSlotIdx = currentSlotStart;
        prioritizedWindow.forEach((l) => {
          while (fillSlotIdx < milestoneSlotIdx && slotToLesson[fillSlotIdx] !== null) {
            fillSlotIdx++;
          }
          if (fillSlotIdx < milestoneSlotIdx) {
            slotToLesson[fillSlotIdx] = l;
            fillSlotIdx++;
          }
        });

        currentLessonStart = milestoneLessonIdx + 1;
        currentSlotStart = Math.max(currentSlotStart, milestoneSlotIdx + 1);
      });

      if (currentLessonStart < lessons.length && currentSlotStart < availableSlots.length) {
        const remainingLessons = lessons.slice(currentLessonStart);
        const remainingSlotsCount = availableSlots.length - currentSlotStart;
        const windowName = `Post-Assessment Window (Slots ${currentSlotStart} to ${availableSlots.length - 1})`;

        const prioritizedRemaining = this.getPrioritizedLessonsForCapacity(remainingLessons, remainingSlotsCount, windowName, classId);

        let fillSlotIdx = currentSlotStart;
        prioritizedRemaining.forEach((l) => {
          while (fillSlotIdx < availableSlots.length && slotToLesson[fillSlotIdx] !== null) {
            fillSlotIdx++;
          }
          if (fillSlotIdx < availableSlots.length) {
            slotToLesson[fillSlotIdx] = l;
            fillSlotIdx++;
          }
        });
      }
    }

    const schedule = availableSlots.map((slot, idx) => ({
      slot: slot,
      lesson: slotToLesson[idx] || null,
      isLocked: slot.isPast
    }));

    const assignedSet = new Set();
    slotToLesson.filter(l => l !== null).forEach(l => {
      assignedSet.add(l.id);
      if (Array.isArray(l.mergedLessonIds)) {
        l.mergedLessonIds.forEach(id => assignedSet.add(id));
      }
    });
    const unassignedLessons = rawLessons.filter(l => !l.isOmittedFromSchedule && !assignedSet.has(l.id));

    return {
      schedule: schedule,
      totalSlots: availableSlots.length,
      totalLessons: rawLessons.length,
      unassignedLessons: unassignedLessons
    };
  },

  /**
   * 3-Pass Priority Resolution when slot capacity is tight:
   * Pass 1: Omit Float lessons (`isFloat`) FIRST working backwards from test milestone.
   * Pass 2: Omit Revision lessons (`isRevision`) SECOND working backwards from test milestone.
   * Pass 3: Combine/Merge adjacent regular Content lessons into single period slots THIRD ("Merged: {Title 1}, {Title 2}")
   *         preserving tasks in order and splitting teaching notes with titles.
   */
  getPrioritizedLessonsForCapacity(lessonsList, targetCapacity, windowName = 'Schedule', classId = null) {
    if (lessonsList.length <= targetCapacity) return lessonsList;

    let deficit = lessonsList.length - targetCapacity;
    const result = [...lessonsList];
    const classObj = state.classes.find(c => c.id === classId);
    const className = classObj ? classObj.name : 'Class';

    // Pass 1: Omit Float lessons FIRST (working backwards from closest to test milestone)
    for (let i = result.length - 1; i >= 0 && deficit > 0; i--) {
      if (result[i] && result[i].isFloat) {
        const removed = result.splice(i, 1)[0];
        deficit--;
        this.reanalysisStats.addOmittedFloat(className, removed.title, removed.id);
      }
    }

    // Pass 2: Omit Revision lessons SECOND if deficit still remains (working backwards)
    for (let i = result.length - 1; i >= 0 && deficit > 0; i--) {
      if (result[i] && result[i].isRevision && !result[i].isFloat) {
        const removed = result.splice(i, 1)[0];
        deficit--;
        this.reanalysisStats.addOmittedRevision(className, removed.title, removed.id);
      }
    }

    // Pass 3: Combine/Merge adjacent Content lessons into single period slots if deficit still remains
    if (deficit > 0 && result.length > 1) {
      let i = result.length - 2;
      while (i >= 0 && deficit > 0) {
        const l1 = result[i];
        const l2 = result[i + 1];
        if (l1 && l2 && !l1.isTestMilestone && !l2.isTestMilestone && !l1.isMerged && !l2.isMerged) {
          const mergedLesson = this.buildMergedLessonObject(l1, l2, false);
          result.splice(i, 2, mergedLesson);
          deficit--;
          this.reanalysisStats.addMerged(className, l1.title, l2.title, mergedLesson.id);
        }
        i--;
      }
    }

    if (result.length > targetCapacity) {
      return result.slice(0, targetCapacity);
    }

    return result;
  },

  checkSlotActionType(classId, targetDate, targetPeriodId, precalculatedSchedule = null) {
    if (!classId || !targetDate || !targetPeriodId) {
      console.error('[SCHEDULER ENGINE ERROR] checkSlotActionType called with missing arguments:', { classId, targetDate, targetPeriodId });
      return { type: 'MAX_CAPACITY', message: 'Invalid slot parameters' };
    }

    const availableSlots = this.getAvailableSlots(classId);
    const slotIdx = availableSlots.findIndex(s => s.date === targetDate && s.periodId === targetPeriodId);
    if (slotIdx === -1) return { type: 'MAX_CAPACITY', message: 'Slot unavailable' };

    const schedule = precalculatedSchedule || this.generateScheduleForClass(classId).schedule;
    const mappedEntry = schedule.find(m => m.slot.date === targetDate && m.slot.periodId === targetPeriodId);

    if (mappedEntry && mappedEntry.lesson && mappedEntry.lesson.isFloat) {
      return { type: 'REMOVE_FLOAT', lessonId: mappedEntry.lesson.id };
    }

    const currentSchedIdx = schedule.findIndex(m => m.slot.date === targetDate && m.slot.periodId === targetPeriodId);
    let nextMilestoneSchedIdx = schedule.length;
    let nextMilestoneDate = 'End of Term';

    for (let i = currentSchedIdx + 1; i < schedule.length; i++) {
      if (schedule[i].lesson && schedule[i].lesson.isTestMilestone) {
        nextMilestoneSchedIdx = i;
        nextMilestoneDate = schedule[i].slot.date;
        break;
      }
    }

    const downstreamEntries = schedule.slice(currentSchedIdx, nextMilestoneSchedIdx);
    const downstreamRevisions = downstreamEntries.filter(m => m.lesson && m.lesson.isRevision && !m.lesson.isFloat);
    const emptySlotsCount = downstreamEntries.filter(m => m.lesson === null).length;

    if (emptySlotsCount === 0 && downstreamRevisions.length > 0) {
      const nextRevision = downstreamRevisions[0].lesson;
      return {
        type: 'REVISION_SHIFT',
        targetRevisionId: nextRevision.id,
        message: `Move revision class "${nextRevision.title}" to this slot`
      };
    }

    if (emptySlotsCount === 0 && downstreamRevisions.length === 0) {
      return {
        type: 'MAX_CAPACITY',
        message: `Schedule is maximally filled prior to test on ${nextMilestoneDate}. Adjust sequence in Curriculum section to combine classes.`
      };
    }

    return { type: 'FLOAT' };
  },

  analyzeConflicts(classId) {
    if (!classId || classId === 'ALL') return [];
    const rawLessons = state.lessonPlans[classId] || [];
    const effectiveLessons = this.applyManualScheduleAdjustments(rawLessons);
    const availableSlots = this.getAvailableSlots(classId);
    const conflicts = [];

    effectiveLessons.forEach((lesson, index) => {
      if (lesson.isTestMilestone && lesson.testDate) {
        const testDate = lesson.testDate;
        const requiredCount = index + 1;
        let slotsBeforeTest = 0;
        if (lesson.testSlotKey) {
          const exactIdx = availableSlots.findIndex(s => `${s.date}_${s.periodId}` === lesson.testSlotKey);
          slotsBeforeTest = exactIdx >= 0 ? (exactIdx + 1) : availableSlots.filter(s => s.date <= testDate).length;
        } else {
          slotsBeforeTest = availableSlots.filter(s => s.date <= testDate).length;
        }

        if (slotsBeforeTest < requiredCount) {
          const deficit = requiredCount - slotsBeforeTest;
          const revisionLessons = effectiveLessons.slice(0, requiredCount).filter(l => l.isRevision && !l.isMerged);
          conflicts.push({
            classId: classId,
            testLesson: lesson,
            testDate: testDate,
            requiredLessons: requiredCount,
            availableSlots: slotsBeforeTest,
            deficit: deficit,
            revisionLessons: revisionLessons
          });
        }
      }
    });

    if (availableSlots.length < effectiveLessons.length) {
      const deficit = effectiveLessons.length - availableSlots.length;
      const revisionLessons = effectiveLessons.filter(l => l.isRevision && !l.isMerged);
      conflicts.push({
        classId: classId,
        testLesson: { title: 'End of Curriculum Completion' },
        testDate: 'End of Year',
        requiredLessons: effectiveLessons.length,
        availableSlots: availableSlots.length,
        deficit: deficit,
        revisionLessons: revisionLessons,
        isOverallCapacity: true
      });
    }

    return conflicts;
  },

  /**
   * Non-destructively omits a revision lesson from the active schedule projection
   * while preserving it in state.lessonPlans (View 3 curriculum list & backend)
   * so it can be restored anytime.
   */
  dropRevisionLesson(classId, lessonId) {
    const lessons = state.lessonPlans[classId] || [];
    const target = lessons.find(l => l.id === lessonId);
    if (!target) return false;
    target.isOmittedFromSchedule = true;
    state.saveState();
    return true;
  },

  restoreRevisionLesson(classId, lessonId) {
    const lessons = state.lessonPlans[classId] || [];
    const target = lessons.find(l => l.id === lessonId);
    if (!target) return false;
    delete target.isOmittedFromSchedule;
    state.saveState();
    return true;
  },

  /**
   * Non-destructively flags two adjacent lessons in state.lessonPlans to merge
   * into a single period slot ("Merged: {Title 1}, {Title 2}") in the schedule projection,
   * while maintaining the original two separate lessons in the View 3 curriculum list and backend.
   */
  mergeLessons(classId, lessonId1, lessonId2) {
    const lessons = state.lessonPlans[classId] || [];
    const idx1 = lessons.findIndex(l => l.id === lessonId1);
    const idx2 = lessons.findIndex(l => l.id === lessonId2);

    if (idx1 === -1 || idx2 === -1 || Math.abs(idx1 - idx2) !== 1) return false;

    const firstIdx = Math.min(idx1, idx2);
    const secondIdx = Math.max(idx1, idx2);
    const l1 = lessons[firstIdx];
    const l2 = lessons[secondIdx];

    if (l1.isTestMilestone || l2.isTestMilestone) return false;

    l1.mergeWithNextId = l2.id;
    state.saveState();
    return true;
  },

  unmergeLessons(classId, lessonId1) {
    const lessons = state.lessonPlans[classId] || [];
    const target = lessons.find(l => l.id === lessonId1 || `merged_${l.id}_${l.mergeWithNextId}` === lessonId1);
    if (!target) return false;
    delete target.mergeWithNextId;
    state.saveState();
    return true;
  }
};

if (typeof window !== 'undefined') {
  window.Scheduler = Scheduler;
}
