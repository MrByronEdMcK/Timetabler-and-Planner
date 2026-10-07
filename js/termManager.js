/* ==========================================================================
   Term Calendar & Date Utilities - Local Computer Time & Date Engine
   ========================================================================== */

import { state } from './state.js';

export const TermManager = {
  /**
   * Helper to parse YYYY-MM-DD or Date to local noon Date object
   */
  parseLocalDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) {
      return new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate(), 12, 0, 0);
    }
    const parts = String(dateStr).split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  },

  /**
   * Helper to format a Date object as local YYYY-MM-DD
   */
  formatLocalDate(d = new Date()) {
    if (!d) return '';
    if (typeof d === 'string') {
      const parts = d.split('-');
      if (parts.length === 3) return d;
      d = new Date(d);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  getLocalDateString(d = new Date()) {
    return this.formatLocalDate(d);
  },

  /**
   * Check if a given date string (YYYY-MM-DD) falls within school term dates
   */
  getTermForDate(dateStr) {
    if (!dateStr) return null;
    const target = this.parseLocalDate(dateStr);
    if (!target) return null;

    for (const term of state.terms) {
      const start = this.parseLocalDate(term.startDate);
      const end = this.parseLocalDate(term.endDate);
      if (start && end && target >= start && target <= end) {
        return term;
      }
    }
    return null;
  },

  /**
   * Calculate ISO day of week: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
   */
  getDayOfWeek(dateStr) {
    if (!dateStr) return 1;
    const d = this.parseLocalDate(dateStr);
    if (!d) return 1;
    const day = d.getDay();
    return day === 0 ? 7 : day;
  },

  /**
   * Format date for display (e.g. "Mon 24 Aug 2026")
   */
  formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const d = this.parseLocalDate(dateStr);
    if (!d) return '';
    return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  },

  /**
   * Get all school days (Mon-Fri) for all 4 terms in chronological order using local timezone
   */
  getAllTermSchoolDays() {
    const schoolDays = [];

    state.terms.forEach(term => {
      const current = this.parseLocalDate(term.startDate);
      const end = this.parseLocalDate(term.endDate);
      if (!current || !end) return;

      while (current <= end) {
        const dayOfWeek = current.getDay();
        // Mon-Fri are 1-5
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          const dateStr = this.formatLocalDate(current);
          schoolDays.push({
            date: dateStr,
            termId: term.id,
            termName: term.name,
            dayOfWeek: dayOfWeek
          });
        }
        current.setDate(current.getDate() + 1);
      }
    });

    return schoolDays;
  },

  /**
   * Find blockout event for a specific date if any exists
   */
  getBlockoutForDate(dateStr, classId = null, periodId = null) {
    return state.events.find(ev => {
      if (ev.date !== dateStr) return false;
      if (ev.affectedClassId && ev.affectedClassId !== classId) return false;
      if (ev.blockAllDay) return true;
      if (periodId && ev.blockedPeriod === periodId) return true;
      return false;
    });
  }
};
