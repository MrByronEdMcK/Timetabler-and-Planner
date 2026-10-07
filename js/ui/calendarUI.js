/* ==========================================================================
   Calendar & Term Configuration UI
   ========================================================================== */

import { state } from '../state.js';
import { TermManager } from '../termManager.js';

export const CalendarUI = {
  init() {
    this.renderTermCards();
    this.renderEventsList();
    this.bindEvents();
  },

  renderTermCards() {
    const container = document.getElementById('term-cards-container');
    if (!container) return;

    container.innerHTML = state.terms.map(term => `
      <div class="term-card" data-id="${term.id}">
        <div class="term-header">
          <div class="term-name">${term.name}</div>
          <span class="term-weeks-badge">${term.weeks || 10} Weeks</span>
        </div>
        <div class="form-group">
          <label class="form-label">Start Date</label>
          <input type="date" class="form-control term-date-input" data-id="${term.id}" data-field="startDate" value="${term.startDate}">
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">End Date</label>
          <input type="date" class="form-control term-date-input" data-id="${term.id}" data-field="endDate" value="${term.endDate}">
        </div>
      </div>
    `).join('');
  },

  renderEventsList() {
    const container = document.getElementById('event-list-container');
    if (!container) return;

    if (state.events.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-dim);">No calendar events or blockouts added yet.</div>`;
      return;
    }

    container.innerHTML = state.events.map(ev => {
      const classObj = ev.affectedClassId ? state.classes.find(c => c.id === ev.affectedClassId) : null;
      const classBadge = classObj ? `<span class="tag" style="background:${classObj.color}22; color:${classObj.color}">${classObj.name}</span>` : `<span class="tag tag-locked">All Classes</span>`;
      const periodBadge = ev.blockAllDay ? `Whole Day` : `Blocked Period: ${ev.blockedPeriod}`;

      return `
        <div class="event-item" data-id="${ev.id}">
          <div class="event-info">
            <div class="event-title">
              <span>${ev.title}</span>
              <span class="event-type-badge type-${ev.type}">${ev.type}</span>
            </div>
            <div class="event-date">
              📅 ${TermManager.formatDisplayDate(ev.date)} • ${periodBadge} • ${classBadge}
            </div>
          </div>
          <button class="btn btn-danger btn-sm delete-event-btn" data-id="${ev.id}">Delete</button>
        </div>
      `;
    }).join('');
  },

  bindEvents() {
    // Term Date inputs change
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('term-date-input')) {
        const id = e.target.getAttribute('data-id');
        const field = e.target.getAttribute('data-field');
        const term = state.terms.find(t => t.id === id);
        if (term) {
          term[field] = e.target.value;
          state.saveState();
          window.dispatchEvent(new CustomEvent('planner:stateChanged'));
        }
      }
    });

    // Delete Event
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-event-btn')) {
        const id = e.target.getAttribute('data-id');
        state.data.events = state.events.filter(ev => ev.id !== id);
        state.saveState();
        this.renderEventsList();
        window.dispatchEvent(new CustomEvent('planner:stateChanged'));
      }
    });

    // Add Event Form Submit
    const addEventBtn = document.getElementById('btn-open-event-modal');
    if (addEventBtn) {
      addEventBtn.addEventListener('click', () => {
        this.openAddEventModal();
      });
    }
  },

  openAddEventModal() {
    const modalBackdrop = document.getElementById('modal-event-backdrop');
    if (!modalBackdrop) return;

    // Populate class selector dropdown inside modal
    const classSelect = document.getElementById('event-class-select');
    if (classSelect) {
      classSelect.innerHTML = `<option value="">All Classes (Whole School)</option>` +
        state.classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    modalBackdrop.classList.add('active');
  }
};
