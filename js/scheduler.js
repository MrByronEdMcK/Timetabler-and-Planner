/* ==========================================================================
   Auto-Scheduler, Pacing Engine & Conflict Resolver
   ========================================================================== */

import { state } from './state.js';
import { TermManager } from './termManager.js';
import { TimetableManager } from './timetableManager.js';

function formatSingleTime(timeStr) {
  if (!timeStr) return '';
  if (state.timeFormat === '24h') return timeStr;
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr || '00'} ${ampm}`;
}

function formatTimeRange(startStr, endStr) {
  if (!startStr && !endStr) return '';
  return `${formatSingleTime(startStr)} - ${formatSingleTime(endStr)}`;
}

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
    const lessons = state.lessonPlans[classId] || [];
    const availableSlots = this.getAvailableSlots(classId);

    if (availableSlots.length === 0 || lessons.length === 0) {
      return {
        schedule: availableSlots.map(slot => ({ slot: slot, lesson: null, isLocked: slot.isPast })),
        totalSlots: availableSlots.length,
        totalLessons: lessons.length,
        unassignedLessons: lessons
      };
    }

    console.warn(`==================================================`);
    console.warn(`[SCHEDULER TROUBLESHOOTING] Generating schedule for Class ${classId}: ${lessons.length} lessons mapped onto ${availableSlots.length} slots.`);

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

    // Sort candidate milestones by lessonIndex ascending
    candidateMilestones.sort((a, b) => a.lessonIndex - b.lessonIndex);

    // Filter milestones: Unpin pinned lessons ONLY IF upstream insertion created a slot deficit prior to their pinned date!
    const milestones = [];
    let currentLessonCheckStart = 0;
    let currentSlotCheckStart = 0;

    candidateMilestones.forEach(m => {
      const windowLessons = lessons.slice(currentLessonCheckStart, m.lessonIndex);
      const windowSlotsCount = Math.max(0, m.targetSlotIdx - currentSlotCheckStart);

      if (m.isPinned && windowLessons.length > windowSlotsCount) {
        // Upstream insertion created a slot deficit! Auto-unpin this downstream lesson!
        m.lesson.isPinned = false;
        delete m.lesson.pinnedDate;
        delete m.lesson.pinnedPeriodId;
        delete m.lesson.pinnedSlotKey;

        const classObj = state.classes.find(c => c.id === classId);
        this.reanalysisStats.addUnpinned(classObj ? classObj.name : classId, m.lesson.title, m.lesson.id);
        console.warn(`[SCHEDULER UNPIN] Lesson "${m.lesson.title}" was automatically unpinned because upstream insertion required ${windowLessons.length} lessons for ${windowSlotsCount} available slots.`);
      } else {
        milestones.push(m);
        currentLessonCheckStart = m.lessonIndex + 1;
        currentSlotCheckStart = Math.max(currentSlotCheckStart, m.targetSlotIdx + 1);
      }
    });

    const slotToLesson = new Array(availableSlots.length).fill(null);

    // If no valid milestones remain, process whole sequence as a single scope
    if (milestones.length === 0) {
      const prioritizedLessons = this.getPrioritizedLessonsForCapacity(lessons, availableSlots.length, 'Full Term Window', classId);
      prioritizedLessons.forEach((l, idx) => {
        if (idx < availableSlots.length) {
          slotToLesson[idx] = l;
        }
      });
    } else {
      // Divide sequence into self-contained Topic Windows bounded by scheduled anchors!
      let currentLessonStart = 0;
      let currentSlotStart = 0;

      milestones.forEach((m, mIdx) => {
        const milestoneLessonIdx = m.lessonIndex;
        const milestoneSlotIdx = m.targetSlotIdx;

        // Place milestone lesson strictly at its anchored slot
        slotToLesson[milestoneSlotIdx] = m.lesson;

        // Topic Window lessons before this milestone
        const windowLessons = lessons.slice(currentLessonStart, milestoneLessonIdx);

        // Available slots before this milestone slot
        const windowSlotsCount = Math.max(0, milestoneSlotIdx - currentSlotStart);

        const windowName = `Topic Window #${mIdx + 1} (${m.lesson.unit || 'Topic'} - before ${m.lesson.testDate || m.lesson.pinnedDate || 'Anchor'})`;
        console.warn(`[Topic Window Range] "${windowName}": ${windowLessons.length} lesson(s) mapped to ${windowSlotsCount} available slot(s) (Slots ${currentSlotStart} to ${milestoneSlotIdx - 1}).`);

        const prioritizedWindow = this.getPrioritizedLessonsForCapacity(windowLessons, windowSlotsCount, windowName, classId);

        // Map prioritized window lessons to slots within this window
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

      // Process remaining lessons after the last milestone
      if (currentLessonStart < lessons.length && currentSlotStart < availableSlots.length) {
        const remainingLessons = lessons.slice(currentLessonStart);
        const remainingSlotsCount = availableSlots.length - currentSlotStart;
        const windowName = `Post-Assessment Window (Slots ${currentSlotStart} to ${availableSlots.length - 1})`;
        console.warn(`[Topic Window Range] "${windowName}": ${remainingLessons.length} lesson(s) mapped to ${remainingSlotsCount} remaining slot(s).`);

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

    const assignedSet = new Set(slotToLesson.filter(l => l !== null).map(l => l.id));
    const unassignedLessons = lessons.filter(l => !assignedSet.has(l.id));

    console.warn(`[SCHEDULER SUCCESS] Completed schedule generation for Class ${classId}. Assigned ${assignedSet.size} lesson(s).`);
    console.warn(`==================================================`);

    return {
      schedule: schedule,
      totalSlots: availableSlots.length,
      totalLessons: lessons.length,
      unassignedLessons: unassignedLessons
    };
  },

  getPrioritizedLessonsForCapacity(lessonsList, targetCapacity, windowName = 'Schedule', classId = null) {
    if (lessonsList.length <= targetCapacity) return lessonsList;

    let deficit = lessonsList.length - targetCapacity;
    const result = [...lessonsList];
    const classObj = state.classes.find(c => c.id === classId);
    const className = classObj ? classObj.name : 'Class';

    console.warn(`[Topic Window Scoped Resolution] Scope "${windowName}" has ${lessonsList.length} lessons for ${targetCapacity} available slots. Capacity deficit: ${deficit} lesson(s).`);

    // Pass 1: Omit Float lessons FIRST (working backwards from closest to test milestone)
    for (let i = result.length - 1; i >= 0 && deficit > 0; i--) {
      if (result[i] && result[i].isFloat) {
        const removed = result.splice(i, 1)[0];
        deficit--;
        this.reanalysisStats.addOmittedFloat(className, removed.title, removed.id);
        console.warn(`[Topic Window Hiding PASS 1] Omitted Float lesson "${removed.title}" (${removed.unit || 'General'}) from "${windowName}". Remaining deficit: ${deficit}`);
      }
    }

    // Pass 2: Omit Revision lessons SECOND if deficit still remains (working backwards)
    for (let i = result.length - 1; i >= 0 && deficit > 0; i--) {
      if (result[i] && result[i].isRevision && !result[i].isFloat) {
        const removed = result.splice(i, 1)[0];
        deficit--;
        this.reanalysisStats.addOmittedRevision(className, removed.title, removed.id);
        console.warn(`[Topic Window Hiding PASS 2] Omitted low-priority Revision lesson "${removed.title}" (${removed.unit || 'General'}) from "${windowName}". Remaining deficit: ${deficit}`);
      }
    }

    // Pass 3: Combine/Merge adjacent Content lessons into single period slots if deficit still remains!
    if (deficit > 0 && result.length > 1) {
      console.warn(`[Topic Window Merging PASS 3] Merging content lessons to fit ${targetCapacity} slots (Deficit: ${deficit}).`);
      let i = result.length - 2;
      while (i >= 0 && deficit > 0) {
        const l1 = result[i];
        const l2 = result[i + 1];
        if (l1 && l2 && !l1.isTestMilestone && !l2.isTestMilestone) {
          const mergedLesson = {
            id: `merged_${l1.id}_${l2.id}`,
            title: `${l1.title} + ${l2.title}`,
            unit: l1.unit || l2.unit || 'General Curriculum',
            isMerged: true,
            mergedTitles: [l1.title, l2.title],
            content: `COMBINED LESSON PERIOD:\n\n1. ${l1.title}:\n${l1.content || '(No notes)'}\n\n2. ${l2.title}:\n${l2.content || '(No notes)'}`
          };
          result.splice(i, 2, mergedLesson);
          deficit--;
          this.reanalysisStats.addMerged(className, l1.title, l2.title, mergedLesson.id);
          console.warn(`[Topic Window Merged] Combined "${l1.title}" and "${l2.title}" into single period slot "${mergedLesson.title}". Remaining deficit: ${deficit}`);
        }
        i--;
      }
    }

    // Safety fallback
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

    // Only require REVISION_SHIFT if capacity is full (no empty slots to absorb a float shift)
    if (emptySlotsCount === 0 && downstreamRevisions.length > 0) {
      const nextRevision = downstreamRevisions[0].lesson;
      return {
        type: 'REVISION_SHIFT',
        targetRevisionId: nextRevision.id,
        message: `Move revision class "${nextRevision.title}" to this slot`
      };
    }

    // If no empty slots and no downstream revisions, capacity is maximally filled
    if (emptySlotsCount === 0 && downstreamRevisions.length === 0) {
      return {
        type: 'MAX_CAPACITY',
        message: `Schedule is maximally filled prior to test on ${nextMilestoneDate}. Adjust sequence in Curriculum section to combine classes.`
      };
    }

    // Otherwise, free slots exist to absorb the float shift!
    return { type: 'FLOAT' };
  },

  analyzeConflicts(classId) {
    if (classId === 'ALL') return [];
    const lessons = state.lessonPlans[classId] || [];
    const availableSlots = this.getAvailableSlots(classId);
    const conflicts = [];

    lessons.forEach((lesson, index) => {
      if (lesson.isTestMilestone && lesson.testDate) {
        const testDate = lesson.testDate;
        const requiredCount = index + 1;
        const slotsBeforeTest = availableSlots.filter(s => s.date <= testDate).length;

        if (slotsBeforeTest < requiredCount) {
          const deficit = requiredCount - slotsBeforeTest;
          const revisionLessons = lessons.slice(0, requiredCount).filter(l => l.isRevision);
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

    if (availableSlots.length < lessons.length) {
      const deficit = lessons.length - availableSlots.length;
      const revisionLessons = lessons.filter(l => l.isRevision);
      conflicts.push({
        classId: classId,
        testLesson: { title: 'End of Curriculum Completion' },
        testDate: 'End of Year',
        requiredLessons: lessons.length,
        availableSlots: availableSlots.length,
        deficit: deficit,
        revisionLessons: revisionLessons,
        isOverallCapacity: true
      });
    }

    return conflicts;
  },

  dropRevisionLesson(classId, lessonId) {
    const lessons = state.lessonPlans[classId] || [];
    state.lessonPlans[classId] = lessons.filter(l => l.id !== lessonId);
    state.saveState();
  },

  mergeLessons(classId, lessonId1, lessonId2) {
    const lessons = state.lessonPlans[classId] || [];
    const idx1 = lessons.findIndex(l => l.id === lessonId1);
    const idx2 = lessons.findIndex(l => l.id === lessonId2);

    if (idx1 === -1 || idx2 === -1) return false;

    const l1 = lessons[idx1];
    const l2 = lessons[idx2];

    const mergedLesson = {
      id: `merged_${Date.now()}`,
      title: `${l1.title} + ${l2.title}`,
      unit: l1.unit || l2.unit,
      isRevision: l1.isRevision || l2.isRevision,
      isMerged: true,
      mergedTitles: [l1.title, l2.title]
    };

    const firstIdx = Math.min(idx1, idx2);
    lessons.splice(firstIdx, 2, mergedLesson);
    state.lessonPlans[classId] = lessons;
    state.saveState();
    return true;
  }
};

