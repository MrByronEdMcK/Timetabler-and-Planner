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
    const yearContainer = document.getElementById('academic-year-container');
    if (yearContainer) {
      const currentYr = state.academicYear;
      yearContainer.innerHTML = `
        <div class="academic-year-banner" style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1.15rem; border-radius:var(--radius-md); border:1px solid var(--border-color); flex-wrap:wrap; gap:0.75rem;">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span style="font-size:1.3rem;">🎓</span>
            <div>
              <div style="font-weight:700; font-size:0.9rem; color:var(--text-main);">Academic School Year</div>
              <div style="font-size:0.78rem; color:var(--text-muted);">Switching years displays that year's terms, timetable, classes, and blockout events.</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-year-prev" title="Previous Year" style="padding:0.25rem 0.6rem; font-weight:800;">◀</button>
            <input type="text" inputmode="numeric" pattern="[0-9]*" id="input-academic-year" class="form-control" style="width:75px; text-align:center; font-weight:800; font-size:1rem; color:var(--primary); border-color:var(--primary); padding:0.25rem 0.4rem;" value="${currentYr}">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-year-next" title="Next Year" style="padding:0.25rem 0.6rem; font-weight:800;">▶</button>
          </div>
        </div>
      `;
    }

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
      container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-dim);">No calendar events or blockouts added for ${state.academicYear} yet.</div>`;
      return;
    }

    container.innerHTML = state.events.map(ev => {
      const classObj = ev.affectedClassId ? state.classes.find(c => c.id === ev.affectedClassId) : null;
      const classBadge = classObj ? `<span class="tag" style="background:${classObj.color}22; color:${classObj.color}">${classObj.name}</span>` : `<span class="tag tag-locked">All Classes</span>`;
      
      const sDate = ev.startDate || ev.date;
      const eDate = ev.endDate || ev.date || sDate;
      const isMultiDay = eDate && eDate > sDate;

      let periodBadge = '';
      let dateText = '';

      if (isMultiDay) {
        periodBadge = `<span style="color:var(--warning); font-weight:700;">Multi-Day (All Periods Blocked)</span>`;
        dateText = `${TermManager.formatDisplayDate(sDate)} → ${TermManager.formatDisplayDate(eDate)}`;
      } else {
        periodBadge = ev.blockAllDay ? `Whole Day` : `Blocked Period: ${ev.blockedPeriod}`;
        dateText = TermManager.formatDisplayDate(sDate);
      }

      return `
        <div class="event-item" data-id="${ev.id}">
          <div class="event-info">
            <div class="event-title">
              <span>${ev.title}</span>
              <span class="event-type-badge type-${ev.type}">${ev.type}</span>
              ${isMultiDay ? `<span class="tag" style="background:rgba(245,158,11,0.15); color:var(--warning, #f59e0b); font-weight:700; font-size:0.75rem;">📅 Multi-Day</span>` : ''}
            </div>
            <div class="event-date">
              📅 ${dateText} • ${periodBadge} • ${classBadge}
            </div>
          </div>
          <button class="btn btn-danger btn-sm delete-event-btn" data-id="${ev.id}">Delete</button>
        </div>
      `;
    }).join('');
  },

  bindEvents() {
    const handleYearChange = (newYear) => {
      const yr = parseInt(newYear, 10);
      if (!isNaN(yr) && yr >= 2020 && yr <= 2035) {
        if (yr === state.academicYear) return;
        state.setAcademicYear(yr);
        this.renderTermCards();
        this.renderEventsList();
        window.dispatchEvent(new CustomEvent('planner:stateChanged'));
      }
    };

    // Term Date inputs change
    document.addEventListener('change', (e) => {
      if (e.target.id === 'input-academic-year') {
        handleYearChange(e.target.value);
      }
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

    document.addEventListener('keydown', (e) => {
      if (e.target.id === 'input-academic-year' && e.key === 'Enter') {
        e.preventDefault();
        handleYearChange(e.target.value);
        e.target.blur();
      }
    });

    // Delete Event & Year Prev/Next Buttons
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-year-prev') {
        handleYearChange(state.academicYear - 1);
      }
      if (e.target.id === 'btn-year-next') {
        handleYearChange(state.academicYear + 1);
      }
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

    const eventDateInput = document.getElementById('event-date');
    const eventEndDateInput = document.getElementById('event-end-date');
    const blockAllDayCheckbox = document.getElementById('event-block-allday');
    const periodGroup = document.getElementById('event-period-group');
    const multidayNotice = document.getElementById('event-multiday-notice');

    const updateEventModalDateState = () => {
      if (!eventDateInput) return;
      const startDate = eventDateInput.value;
      if (eventEndDateInput) {
        eventEndDateInput.min = startDate || '';
        if (eventEndDateInput.value && startDate && eventEndDateInput.value < startDate) {
          eventEndDateInput.value = startDate;
        }
        const isMultiDay = !!(eventEndDateInput.value && startDate && eventEndDateInput.value > startDate);
        if (isMultiDay) {
          if (blockAllDayCheckbox) {
            blockAllDayCheckbox.checked = true;
            blockAllDayCheckbox.disabled = true;
          }
          if (multidayNotice) multidayNotice.style.display = 'block';
          if (periodGroup) periodGroup.style.display = 'none';
        } else {
          if (blockAllDayCheckbox) {
            blockAllDayCheckbox.disabled = false;
          }
          if (multidayNotice) multidayNotice.style.display = 'none';
          if (periodGroup) {
            periodGroup.style.display = (blockAllDayCheckbox && blockAllDayCheckbox.checked) ? 'none' : 'block';
          }
        }
      }
    };

    if (eventDateInput) {
      eventDateInput.addEventListener('change', updateEventModalDateState);
    }
    if (eventEndDateInput) {
      eventEndDateInput.addEventListener('change', updateEventModalDateState);
      eventEndDateInput.addEventListener('input', updateEventModalDateState);
    }
    if (blockAllDayCheckbox) {
      blockAllDayCheckbox.addEventListener('change', () => {
        if (periodGroup && !blockAllDayCheckbox.disabled) {
          periodGroup.style.display = blockAllDayCheckbox.checked ? 'none' : 'block';
        }
      });
    }

    const eventForm = document.getElementById('form-add-event');
    if (eventForm) {
      eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('event-title').value.trim();
        const startDate = document.getElementById('event-date').value;
        const endDateVal = document.getElementById('event-end-date')?.value;
        const endDate = (endDateVal && endDateVal >= startDate) ? endDateVal : startDate;
        const isMultiDay = endDate > startDate;
        const type = document.getElementById('event-type').value;
        const blockAllDay = isMultiDay ? true : document.getElementById('event-block-allday').checked;
        const blockedPeriod = (isMultiDay || blockAllDay) ? null : document.getElementById('event-period-select').value;
        const affectedClassId = document.getElementById('event-class-select').value || null;

        const newEvent = {
          id: `e_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          title: title,
          date: startDate,
          startDate: startDate,
          endDate: endDate,
          type: type,
          blockAllDay: blockAllDay,
          blockedPeriod: blockedPeriod,
          affectedClassId: affectedClassId
        };

        state.data.events.push(newEvent);
        state.saveState();
        document.getElementById('modal-event-backdrop')?.classList.remove('active');
        eventForm.reset();
        this.renderEventsList();
        window.dispatchEvent(new CustomEvent('planner:stateChanged'));
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

    // Populate period selector dropdown inside modal
    const periodSelect = document.getElementById('event-period-select');
    if (periodSelect && state.periods) {
      periodSelect.innerHTML = state.periods.filter(p => !p.isBreak).map(p =>
        `<option value="${p.id}">${p.name}</option>`
      ).join('');
    }

    const eventDateInput = document.getElementById('event-date');
    const eventEndDateInput = document.getElementById('event-end-date');
    const blockAllDayCheckbox = document.getElementById('event-block-allday');
    const multidayNotice = document.getElementById('event-multiday-notice');
    const periodGroup = document.getElementById('event-period-group');

    if (eventDateInput) {
      const yr = state.academicYear;
      const defDate = (state.terms && state.terms[0] && state.terms[0].startDate) ? state.terms[0].startDate : `${yr}-02-01`;
      eventDateInput.value = defDate;
      if (eventEndDateInput) {
        eventEndDateInput.value = '';
        eventEndDateInput.min = defDate;
      }
    }
    if (blockAllDayCheckbox) {
      blockAllDayCheckbox.checked = true;
      blockAllDayCheckbox.disabled = false;
    }
    if (multidayNotice) multidayNotice.style.display = 'none';
    if (periodGroup) periodGroup.style.display = 'none';

    modalBackdrop.classList.add('active');
  }
};
