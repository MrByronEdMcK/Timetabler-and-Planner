/* ==========================================================================
   Timetable Manager (X-Week Cycle Rotation)
   ========================================================================== */

import { state } from './state.js';
import { TermManager } from './termManager.js';

export const TimetableManager = {
  /**
   * Get the timetable rotation week number (e.g. 1 for Week A, 2 for Week B) for a given date
   */
  getWeekCycleNumber(dateStr) {
    const term = TermManager.getTermForDate(dateStr);
    if (!term) return 1;
    const termStart = TermManager.parseLocalDate(term.startDate);
    const targetDate = TermManager.parseLocalDate(dateStr);
    if (!termStart || !targetDate) return 1;

    // Calculate difference in weeks from the start of the term
    const diffTime = Math.abs(targetDate - termStart);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(diffDays / 7);

    const cycleWeeks = state.timetableCycleWeeks || 2;
    return (weekIndex % cycleWeeks) + 1;
  },

  /**
   * Get timetable slot key for a given rotation week, day of week, and period
   */
  getSlotKey(weekCycleNum, dayOfWeek, periodId) {
    return `${weekCycleNum}_${dayOfWeek}_${periodId}`;
  },

  /**
   * Get the assigned class for a specific slot in the timetable
   */
  getClassForSlot(weekCycleNum, dayOfWeek, periodId) {
    const key = this.getSlotKey(weekCycleNum, dayOfWeek, periodId);
    const slotVal = state.timetableSlots[key];
    if (!slotVal) return null;

    let classId = typeof slotVal === 'string' ? slotVal : slotVal.classId;
    const classObj = state.classes.find(c => c.id === classId);
    if (!classObj) return null;

    const customDetails = (typeof slotVal === 'object' && slotVal.customDetails !== undefined)
      ? slotVal.customDetails
      : (state.data.timetableSlotDetails ? state.data.timetableSlotDetails[key] : null);

    if (customDetails !== null && customDetails !== undefined) {
      return {
        ...classObj,
        details: customDetails
      };
    }

    return classObj;
  },

  /**
   * Set or update a class assignment for a timetable slot
   */
  setSlotClass(weekCycleNum, dayOfWeek, periodId, classId, customDetails = null) {
    const key = this.getSlotKey(weekCycleNum, dayOfWeek, periodId);
    if (!classId) {
      delete state.timetableSlots[key];
      if (state.data.timetableSlotDetails) delete state.data.timetableSlotDetails[key];
    } else {
      if (!state.data.timetableSlotDetails) state.data.timetableSlotDetails = {};
      if (customDetails !== null) {
        state.data.timetableSlotDetails[key] = customDetails;
      } else {
        delete state.data.timetableSlotDetails[key];
      }
      state.timetableSlots[key] = classId;
    }
    state.saveState();
  }
};
