/* ==========================================================================
   Timetable Builder UI, Period Configurator & A4 Landscape Print (View 2)
   ========================================================================== */

import { state, getClassCellStyles, escapeHtml, showToastNotification } from '../state.js';
import { TimetableManager, formatTimeRange, getWeekLetter } from '../timetableManager.js';

function triggerRefresh(force = false, isScheduleEdit = true) {
  if (typeof window !== 'undefined' && typeof window.refreshAllViews === 'function') {
    window.refreshAllViews(force, isScheduleEdit);
  } else if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('planner:stateChanged'));
  }
}

export const PeriodConfigUI = {
  open() {
    const backdrop = document.getElementById('modal-period-backdrop');
    if (!backdrop) return;
    this.renderPeriodTable();
    backdrop.classList.add('active');
  },

  renderPeriodTable() {
    const container = document.getElementById('period-config-container');
    if (!container) return;

    const formatSelect = document.getElementById('time-format-select');
    if (formatSelect) formatSelect.value = state.timeFormat;

    let html = `
      <table class="period-config-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    state.periods.forEach((p, idx) => {
      html += `
        <tr data-index="${idx}">
          <td>
            <input type="text" class="form-control period-name-input" data-index="${idx}" value="${escapeHtml(p.name)}">
          </td>
          <td>
            <input type="time" class="form-control period-starttime-input" data-index="${idx}" value="${escapeHtml(p.startTime || '09:00')}">
          </td>
          <td>
            <input type="time" class="form-control period-endtime-input" data-index="${idx}" value="${escapeHtml(p.endTime || '10:00')}">
          </td>
          <td>
            ${p.isBreak ? '<span class="tag tag-revision">Break</span>' : '<span class="tag tag-locked">Period</span>'}
          </td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm move-period-up" data-index="${idx}">⬆️</button>
            <button type="button" class="btn btn-secondary btn-sm move-period-down" data-index="${idx}">⬇️</button>
            <button type="button" class="btn btn-danger btn-sm delete-period-btn" data-index="${idx}">🗑️</button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  },

  bindEvents() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('period-name-input')) {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        if (state.periods[idx]) {
          state.periods[idx].name = e.target.value.trim() || state.periods[idx].name;
          state.saveState();
          triggerRefresh(false, true);
        }
      }
      if (e.target.classList.contains('period-starttime-input')) {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        if (state.periods[idx]) {
          state.periods[idx].startTime = e.target.value;
          state.saveState();
          triggerRefresh(false, true);
        }
      }
      if (e.target.classList.contains('period-endtime-input')) {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        if (state.periods[idx]) {
          state.periods[idx].endTime = e.target.value;
          state.saveState();
          triggerRefresh(false, true);
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('move-period-up')) {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        if (idx > 0) {
          const temp = state.periods[idx];
          state.periods[idx] = state.periods[idx - 1];
          state.periods[idx - 1] = temp;
          state.saveState();
          this.renderPeriodTable();
          triggerRefresh(false, true);
        }
      }
      if (e.target.classList.contains('move-period-down')) {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        if (idx < state.periods.length - 1) {
          const temp = state.periods[idx];
          state.periods[idx] = state.periods[idx + 1];
          state.periods[idx + 1] = temp;
          state.saveState();
          this.renderPeriodTable();
          triggerRefresh(false, true);
        }
      }
      if (e.target.classList.contains('delete-period-btn')) {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        const period = state.periods[idx];
        if (period) {
          const teachingPeriodsCount = state.periods.filter(p => !p.isBreak).length;
          if (!period.isBreak && teachingPeriodsCount <= 1) {
            showToastNotification('⚠️ Cannot delete the last remaining teaching period.');
            return;
          }
          state.deletePeriodById(period.id);
          this.renderPeriodTable();
          triggerRefresh(false, true);
        }
      }
    });

    const formatSelect = document.getElementById('time-format-select');
    if (formatSelect) {
      formatSelect.addEventListener('change', (e) => {
        state.setTimeFormat(e.target.value);
        triggerRefresh(false, false);
      });
    }

    const addPeriodBtn = document.getElementById('btn-add-new-period');
    if (addPeriodBtn) {
      addPeriodBtn.addEventListener('click', () => {
        const count = state.periods.filter(p => !p.isBreak).length + 1;
        state.periods.push({
          id: `p_${Date.now()}`,
          name: `Period ${count}`,
          startTime: '14:15',
          endTime: '15:15'
        });
        state.saveState();
        this.renderPeriodTable();
        triggerRefresh(false, true);
      });
    }

    const addBreakBtn = document.getElementById('btn-add-new-break');
    if (addBreakBtn) {
      addBreakBtn.addEventListener('click', () => {
        state.periods.push({
          id: `break_${Date.now()}`,
          name: 'Recess / Break',
          startTime: '11:00',
          endTime: '11:30',
          isBreak: true
        });
        state.saveState();
        this.renderPeriodTable();
        triggerRefresh(false, true);
      });
    }
  }
};

export const TimetableUI = {
  currentWeekTab: 1,

  init() {
    this.renderWeekTabs();
    this.renderGrid();
    this.bindEvents();
    PeriodConfigUI.bindEvents();
  },

  renderWeekTabs() {
    const container = document.getElementById('timetable-week-tabs');
    if (!container) return;

    const cycleWeeks = state.timetableCycleWeeks || 2;
    let html = '';

    for (let w = 1; w <= cycleWeeks; w++) {
      const label = getWeekLetter(w);
      const activeClass = w === this.currentWeekTab ? 'active' : '';
      html += `<button class="week-tab-btn ${activeClass}" data-week="${w}">${escapeHtml(label)}</button>`;
    }

    container.innerHTML = html;

    const cycleSelect = document.getElementById('timetable-cycle-select');
    if (cycleSelect) {
      cycleSelect.value = cycleWeeks;
    }
  },

  renderGrid() {
    const container = document.getElementById('timetable-grid-container');
    if (!container) return;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periods = state.periods;
    const week = this.currentWeekTab;

    let html = `
      <table class="timetable-grid">
        <thead>
          <tr>
            <th class="period-header-col">Period / Time</th>
            ${days.map(day => `<th>${day}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    periods.forEach(period => {
      const formattedTime = formatTimeRange(period.startTime, period.endTime);

      if (period.isBreak) {
        html += `
          <tr class="tt-recess-row">
            <td class="period-header-col">
              <div class="period-name">${escapeHtml(period.name)}</div>
              <div class="period-time">${escapeHtml(formattedTime)}</div>
            </td>
            <td colspan="5">${escapeHtml(period.name)} (${escapeHtml(formattedTime)})</td>
          </tr>
        `;
      } else {
        html += `
          <tr>
            <td class="period-header-col">
              <div class="period-name">${escapeHtml(period.name)}</div>
              <div class="period-time">${escapeHtml(formattedTime)}</div>
            </td>
        `;

        for (let dayIdx = 1; dayIdx <= 5; dayIdx++) {
          const assignedClass = TimetableManager.getClassForSlot(week, dayIdx, period.id);

          if (assignedClass) {
            const isDark = (state.theme === 'dark');
            const cellStyle = getClassCellStyles(assignedClass.color, isDark);
            const detailsHtml = assignedClass.details ? `<div class="tt-class-details" style="color:${cellStyle.detailsColor} !important; font-weight:700;">${escapeHtml(assignedClass.details)}</div>` : '';
            html += `
              <td class="tt-cell" data-week="${week}" data-day="${dayIdx}" data-period="${escapeHtml(period.id)}"
                  style="background:${cellStyle.bg} !important; border:${cellStyle.border} !important; text-align:center; vertical-align:middle; padding:6px 4px;">
                <div class="tt-class-name" style="color:${cellStyle.textColor}; font-weight:800; font-size:1.05rem;">${escapeHtml(assignedClass.name)}</div>
                ${detailsHtml}
              </td>
            `;
          } else {
            html += `
              <td class="tt-cell" data-week="${week}" data-day="${dayIdx}" data-period="${escapeHtml(period.id)}">
                <div class="tt-cell-empty">+ Assign</div>
              </td>
            `;
          }
        }
        html += `</tr>`;
      }
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  },

  printMultiWeekTimetable() {
    const container = document.getElementById('print-multiweek-container');
    if (!container) {
      window.print();
      return;
    }
    const maxWeeks = state.timetableCycleWeeks || 1;
    let printHtml = '';
    const periods = state.periods;

    for (let w = 1; w <= maxWeeks; w++) {
      const weekLabel = getWeekLetter(w);
      let gridHtml = `
        <div class="print-week-page">
          <h2 class="print-week-header">${escapeHtml(weekLabel)}</h2>
          <table class="timetable-grid">
            <thead>
              <tr>
                <th class="period-header-col">Period / Time</th>
                <th>Monday</th>
                <th>Tuesday</th>
                <th>Wednesday</th>
                <th>Thursday</th>
                <th>Friday</th>
              </tr>
            </thead>
            <tbody>
      `;

      periods.forEach(period => {
        const formattedTime = formatTimeRange(period.startTime, period.endTime);
        if (period.isBreak) {
          gridHtml += `
            <tr class="tt-recess-row">
              <td class="period-header-col">
                <div class="period-name">${escapeHtml(period.name)}</div>
                <div class="period-time">${escapeHtml(formattedTime)}</div>
              </td>
              <td colspan="5">${escapeHtml(period.name)} (${escapeHtml(formattedTime)})</td>
            </tr>
          `;
        } else {
          gridHtml += `
            <tr>
              <td class="period-header-col">
                <div class="period-name">${escapeHtml(period.name)}</div>
                <div class="period-time">${escapeHtml(formattedTime)}</div>
              </td>
          `;
          for (let dayIdx = 1; dayIdx <= 5; dayIdx++) {
            const assignedClass = TimetableManager.getClassForSlot(w, dayIdx, period.id);
            if (assignedClass) {
              const cellStyle = getClassCellStyles(assignedClass.color, false);
              const detailsHtml = assignedClass.details ? `<div class="tt-class-details" style="color:#334155 !important; font-weight:700;">${escapeHtml(assignedClass.details)}</div>` : '';
              gridHtml += `
                <td class="tt-cell" style="background:${cellStyle.bg} !important; border:${cellStyle.border} !important; text-align:center; vertical-align:middle; padding:6px 4px;">
                  <div class="tt-class-name" style="color:${cellStyle.textColor}; font-weight:800;">${escapeHtml(assignedClass.name)}</div>
                  ${detailsHtml}
                </td>
              `;
            } else {
              gridHtml += `<td class="tt-cell"><div class="tt-cell-empty"></div></td>`;
            }
          }
          gridHtml += `</tr>`;
        }
      });

      gridHtml += `</tbody></table></div>`;
      printHtml += gridHtml;
    }

    container.innerHTML = printHtml;
    window.print();
  },

  bindEvents() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    document.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('.week-tab-btn');
      if (tabBtn) {
        this.currentWeekTab = parseInt(tabBtn.getAttribute('data-week'), 10);
        this.renderWeekTabs();
        this.renderGrid();
      }
    });

    const cycleSelect = document.getElementById('timetable-cycle-select');
    if (cycleSelect) {
      cycleSelect.addEventListener('change', (e) => {
        const weeks = parseInt(e.target.value, 10);
        state.setTimetableCycleWeeks(weeks);
        if (this.currentWeekTab > weeks) this.currentWeekTab = 1;
        this.renderWeekTabs();
        this.renderGrid();
        triggerRefresh(false, true);
      });
    }

    document.addEventListener('click', (e) => {
      const cell = e.target.closest('#timetable-grid-container .tt-cell');
      if (cell) {
        const week = parseInt(cell.getAttribute('data-week'), 10);
        const day = parseInt(cell.getAttribute('data-day'), 10);
        const periodId = cell.getAttribute('data-period');
        this.openSlotAssignmentModal(week, day, periodId);
      }
    });

    const openPeriodConfigBtn = document.getElementById('btn-open-period-config');
    if (openPeriodConfigBtn) {
      openPeriodConfigBtn.addEventListener('click', () => PeriodConfigUI.open());
    }

    const printBtn = document.getElementById('btn-print-timetable');
    if (printBtn) {
      printBtn.addEventListener('click', () => this.printMultiWeekTimetable());
    }

    const slotForm = document.getElementById('form-assign-slot');
    if (slotForm) {
      slotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const backdrop = document.getElementById('modal-slot-backdrop');
        const week = parseInt(backdrop.getAttribute('data-week'), 10);
        const day = parseInt(backdrop.getAttribute('data-day'), 10);
        const periodId = backdrop.getAttribute('data-period');
        const classNameInput = document.getElementById('slot-class-input').value;
        const classDetailsInput = document.getElementById('slot-class-details-input').value;
        const classColorInput = document.getElementById('slot-class-color-input').value;

        if (!classNameInput.trim()) {
          TimetableManager.setSlotClass(week, day, periodId, null);
        } else {
          const targetClass = state.findOrCreateClassByName(classNameInput, classDetailsInput, classColorInput);
          if (targetClass) {
            if (classColorInput && targetClass.color !== classColorInput) {
              targetClass.color = classColorInput;
            }
            if (classDetailsInput && targetClass.details !== classDetailsInput) {
              targetClass.details = classDetailsInput;
            }
            state.saveState();
            const customDetails = classDetailsInput.trim() ? classDetailsInput.trim() : null;
            TimetableManager.setSlotClass(week, day, periodId, targetClass.id, customDetails);
          }
        }

        backdrop.classList.remove('active');
        triggerRefresh(false, true);
      });
    }

    const clearSlotBtn = document.getElementById('btn-clear-slot');
    if (clearSlotBtn) {
      clearSlotBtn.addEventListener('click', () => {
        const backdrop = document.getElementById('modal-slot-backdrop');
        const week = parseInt(backdrop.getAttribute('data-week'), 10);
        const day = parseInt(backdrop.getAttribute('data-day'), 10);
        const periodId = backdrop.getAttribute('data-period');
        TimetableManager.setSlotClass(week, day, periodId, null);
        backdrop.classList.remove('active');
        triggerRefresh(false, true);
      });
    }
  },

  openSlotAssignmentModal(week, day, periodId) {
    const backdrop = document.getElementById('modal-slot-backdrop');
    if (!backdrop) return;

    const currentClass = TimetableManager.getClassForSlot(week, day, periodId);
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periodObj = state.periods.find(p => p.id === periodId);

    const titleEl = document.getElementById('slot-modal-title');
    if (titleEl) {
      titleEl.textContent = `Assign ${days[day]} Period ${periodObj ? periodObj.name : ''} (${getWeekLetter(week)})`;
    }

    const datalist = document.getElementById('class-autocomplete-list');
    if (datalist) {
      datalist.innerHTML = state.classes.map(c => `<option value="${escapeHtml(c.name)}">`).join('');
    }

    const input = document.getElementById('slot-class-input');
    const detailsInput = document.getElementById('slot-class-details-input');
    const colorInput = document.getElementById('slot-class-color-input');

    const initialClassName = currentClass ? currentClass.name.toLowerCase() : '';
    if (input) input.value = currentClass ? currentClass.name : '';
    if (detailsInput) detailsInput.value = currentClass ? (currentClass.details || '') : '';
    if (colorInput) colorInput.value = currentClass ? currentClass.color : '#3b82f6';

    if (input && !input._hasAutoFillListener) {
      input._hasAutoFillListener = true;
      input.addEventListener('input', () => {
        const val = input.value.trim().toLowerCase();
        if (!val) return;
        const match = state.classes.find(c => c.name.toLowerCase() === val);
        if (match) {
          if (detailsInput && (!detailsInput.value.trim() || val !== input._lastLoadedClassName)) {
            detailsInput.value = match.details || '';
          }
          if (colorInput) colorInput.value = match.color || '#3b82f6';
          input._lastLoadedClassName = val;
        }
      });
    }
    if (input) input._lastLoadedClassName = initialClassName;

    backdrop.setAttribute('data-week', week);
    backdrop.setAttribute('data-day', day);
    backdrop.setAttribute('data-period', periodId);
    backdrop.classList.add('active');
  }
};

if (typeof window !== 'undefined') {
  window.TimetableUI = TimetableUI;
  window.PeriodConfigUI = PeriodConfigUI;
}
