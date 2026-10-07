/* ==========================================================================
   Timetable Builder UI (X-Week Rotation Grid)
   ========================================================================== */

import { state } from '../state.js';
import { TimetableManager } from '../timetableManager.js';

export const TimetableUI = {
  currentWeekTab: 1,

  init() {
    this.renderWeekTabs();
    this.renderGrid();
    this.bindEvents();
  },

  renderWeekTabs() {
    const container = document.getElementById('timetable-week-tabs');
    if (!container) return;

    const cycleWeeks = state.timetableCycleWeeks || 2;
    let html = '';

    for (let w = 1; w <= cycleWeeks; w++) {
      const label = cycleWeeks === 2 ? (w === 1 ? 'Week A (W1)' : 'Week B (W2)') : `Week ${w}`;
      const activeClass = w === this.currentWeekTab ? 'active' : '';
      html += `<button class="week-tab-btn ${activeClass}" data-week="${w}">${label}</button>`;
    }

    container.innerHTML = html;

    // Cycle weeks selector input
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
            ${days.map((day, idx) => `<th>${day}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    periods.forEach(period => {
      if (period.isBreak) {
        html += `
          <tr class="tt-recess-row">
            <td class="period-header-col">
              <div class="period-name">${period.name}</div>
              <div class="period-time">${period.time}</div>
            </td>
            <td colspan="5">${period.name} (${period.time})</td>
          </tr>
        `;
      } else {
        html += `
          <tr>
            <td class="period-header-col">
              <div class="period-name">${period.name}</div>
              <div class="period-time">${period.time}</div>
            </td>
        `;

        for (let dayIdx = 1; dayIdx <= 5; dayIdx++) {
          const assignedClass = TimetableManager.getClassForSlot(week, dayIdx, period.id);

          if (assignedClass) {
            html += `
              <td class="tt-cell" data-week="${week}" data-day="${dayIdx}" data-period="${period.id}">
                <div class="tt-cell-content" style="background:${assignedClass.color}25; border:1px solid ${assignedClass.color}66;">
                  <div class="tt-class-name" style="color:${assignedClass.color}">${assignedClass.name}</div>
                  <span class="tt-subject-badge">${assignedClass.subject}</span>
                </div>
              </td>
            `;
          } else {
            html += `
              <td class="tt-cell" data-week="${week}" data-day="${dayIdx}" data-period="${period.id}">
                <div class="tt-cell-empty">+ Assign Class</div>
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

  bindEvents() {
    // Week tab clicks
    document.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('.week-tab-btn');
      if (tabBtn) {
        this.currentWeekTab = parseInt(tabBtn.getAttribute('data-week'), 10);
        this.renderWeekTabs();
        this.renderGrid();
      }
    });

    // Cycle length select change
    const cycleSelect = document.getElementById('timetable-cycle-select');
    if (cycleSelect) {
      cycleSelect.addEventListener('change', (e) => {
        const weeks = parseInt(e.target.value, 10);
        state.setTimetableCycleWeeks(weeks);
        if (this.currentWeekTab > weeks) this.currentWeekTab = 1;
        this.renderWeekTabs();
        this.renderGrid();
        window.dispatchEvent(new CustomEvent('planner:stateChanged'));
      });
    }

    // Grid cell clicks to open assignment modal
    document.addEventListener('click', (e) => {
      const cell = e.target.closest('.tt-cell');
      if (cell) {
        const week = parseInt(cell.getAttribute('data-week'), 10);
        const day = parseInt(cell.getAttribute('data-day'), 10);
        const periodId = cell.getAttribute('data-period');
        this.openSlotAssignmentModal(week, day, periodId);
      }
    });
  },

  openSlotAssignmentModal(week, day, periodId) {
    const backdrop = document.getElementById('modal-slot-backdrop');
    if (!backdrop) return;

    const currentClass = TimetableManager.getClassForSlot(week, day, periodId);
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periodObj = state.periods.find(p => p.id === periodId);

    document.getElementById('slot-modal-title').textContent = `Assign ${days[day]} Period ${periodObj ? periodObj.name : ''} (Week ${week})`;

    const select = document.getElementById('slot-class-select');
    select.innerHTML = `<option value="">-- Empty (No Class) --</option>` +
      state.classes.map(c => `<option value="${c.id}" ${currentClass && currentClass.id === c.id ? 'selected' : ''}>${c.name}</option>`).join('');

    backdrop.setAttribute('data-week', week);
    backdrop.setAttribute('data-day', day);
    backdrop.setAttribute('data-period', periodId);
    backdrop.classList.add('active');
  }
};
