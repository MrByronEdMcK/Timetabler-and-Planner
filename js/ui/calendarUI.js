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
          <span class="term-weeks-badge">${TermManager.getTermWeeks(term)} Weeks</span>
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
      // Multi-class badges
      const classIds = Array.isArray(ev.affectedClassIds) ? ev.affectedClassIds : (ev.affectedClassId ? [ev.affectedClassId] : []);
      let classBadge = '';
      if (classIds.length === 0 || classIds.includes('ALL')) {
        classBadge = `<span class="tag tag-locked">All Classes</span>`;
      } else {
        classBadge = classIds.map(cId => {
          const classObj = state.classes.find(c => c.id === cId);
          return classObj 
            ? `<span class="tag" style="background:${classObj.color}22; color:${classObj.color}">${classObj.name}</span>`
            : '';
        }).filter(Boolean).join(' ');
      }
      
      const sDate = ev.startDate || ev.date;
      const eDate = ev.endDate || ev.date || sDate;
      const isMultiDay = eDate && eDate > sDate;

      let periodBadge = '';
      let dateText = '';

      if (isMultiDay) {
        periodBadge = ev.blockAllDay !== false
          ? `<span style="color:var(--warning); font-weight:700;">Multi-Day (All Periods Blocked)</span>`
          : `<span style="color:var(--warning); font-weight:700;">Multi-Day (Period: ${ev.blockedPeriod})</span>`;
        dateText = `${TermManager.formatDisplayDate(sDate)} → ${TermManager.formatDisplayDate(eDate)}`;
      } else {
        periodBadge = ev.blockAllDay !== false ? `Whole Day` : `Blocked Period: ${ev.blockedPeriod}`;
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
          <div style="display:flex; gap:0.4rem; align-items:center;">
            <button type="button" class="btn btn-secondary btn-sm edit-event-btn" data-id="${ev.id}">Edit</button>
            <button type="button" class="btn btn-danger btn-sm delete-event-btn" data-id="${ev.id}">Delete</button>
          </div>
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
          term.weeks = TermManager.getTermWeeks(term);
          const card = document.querySelector(`.term-card[data-id="${id}"]`);
          if (card) {
            const badge = card.querySelector('.term-weeks-badge');
            if (badge) {
              badge.textContent = `${term.weeks} Weeks`;
            }
          }
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

    // Delete Event, Edit Event & Year Prev/Next Buttons
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-year-prev' || e.target.closest('#btn-year-prev')) {
        handleYearChange(state.academicYear - 1);
      }
      if (e.target.id === 'btn-year-next' || e.target.closest('#btn-year-next')) {
        handleYearChange(state.academicYear + 1);
      }
      if (e.target.classList.contains('delete-event-btn') || e.target.closest('.delete-event-btn')) {
        const btn = e.target.classList.contains('delete-event-btn') ? e.target : e.target.closest('.delete-event-btn');
        const id = btn.getAttribute('data-id');
        state.data.events = state.events.filter(ev => ev.id !== id);
        state.saveState();
        this.renderEventsList();
        window.dispatchEvent(new CustomEvent('planner:stateChanged'));
      }
      if (e.target.classList.contains('edit-event-btn') || e.target.closest('.edit-event-btn')) {
        const btn = e.target.classList.contains('edit-event-btn') ? e.target : e.target.closest('.edit-event-btn');
        const id = btn.getAttribute('data-id');
        this.openEditEventModal(id);
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
        if (multidayNotice) {
          multidayNotice.style.display = isMultiDay ? 'block' : 'none';
        }
      }
      if (periodGroup && blockAllDayCheckbox) {
        periodGroup.style.display = blockAllDayCheckbox.checked ? 'none' : 'block';
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
        if (periodGroup) {
          periodGroup.style.display = blockAllDayCheckbox.checked ? 'none' : 'block';
        }
      });
    }

    const eventForm = document.getElementById('form-add-event');
    if (eventForm) {
      eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('event-edit-id')?.value;
        const title = document.getElementById('event-title').value.trim();
        const startDate = document.getElementById('event-date').value;
        const endDateVal = document.getElementById('event-end-date')?.value;
        const endDate = (endDateVal && endDateVal >= startDate) ? endDateVal : startDate;
        const type = document.getElementById('event-type').value;
        const blockAllDayCheckbox = document.getElementById('event-block-allday');
        const blockAllDay = blockAllDayCheckbox ? blockAllDayCheckbox.checked : true;
        const blockedPeriod = blockAllDay ? null : document.getElementById('event-period-select')?.value;

        // Gather affected classes from checklist
        const checkAll = document.getElementById('event-class-check-all');
        const classBoxes = document.querySelectorAll('.event-class-checkbox');
        let affectedClassIds = [];
        if (checkAll && checkAll.checked) {
          affectedClassIds = ['ALL'];
        } else {
          classBoxes.forEach(cb => {
            if (cb.checked) affectedClassIds.push(cb.value);
          });
          if (affectedClassIds.length === 0 || affectedClassIds.length === state.classes.length) {
            affectedClassIds = ['ALL'];
          }
        }
        const affectedClassId = (affectedClassIds.length === 1 && affectedClassIds[0] !== 'ALL') ? affectedClassIds[0] : null;

        if (editId) {
          const existing = state.data.events.find(ev => ev.id === editId);
          if (existing) {
            existing.title = title;
            existing.date = startDate;
            existing.startDate = startDate;
            existing.endDate = endDate;
            existing.type = type;
            existing.blockAllDay = blockAllDay;
            existing.blockedPeriod = blockedPeriod;
            existing.affectedClassIds = affectedClassIds;
            existing.affectedClassId = affectedClassId;
          }
        } else {
          const newEvent = {
            id: `e_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            title: title,
            date: startDate,
            startDate: startDate,
            endDate: endDate,
            type: type,
            blockAllDay: blockAllDay,
            blockedPeriod: blockedPeriod,
            affectedClassIds: affectedClassIds,
            affectedClassId: affectedClassId
          };
          state.data.events.push(newEvent);
        }

        state.saveState();
        document.getElementById('modal-event-backdrop')?.classList.remove('active');
        eventForm.reset();
        this.renderEventsList();
        window.dispatchEvent(new CustomEvent('planner:stateChanged'));
      });
    }
  },

  renderClassChecklist(selectedIds = ['ALL']) {
    const container = document.getElementById('event-classes-checklist');
    if (!container) return;

    const isAll = !selectedIds || selectedIds.length === 0 || selectedIds.includes('ALL') || (selectedIds.length === state.classes.length && state.classes.length > 0);

    let html = `
      <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-weight:700; padding-bottom:0.35rem; border-bottom:1px solid var(--border-color);">
        <input type="checkbox" id="event-class-check-all" ${isAll ? 'checked' : ''}>
        <span>🌟 All Classes (Whole School)</span>
      </label>
    `;

    state.classes.forEach(c => {
      const checked = isAll || selectedIds.includes(c.id);
      html += `
        <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-size:0.85rem; padding:0.15rem 0;">
          <input type="checkbox" class="event-class-checkbox" value="${c.id}" ${checked ? 'checked' : ''}>
          <span class="tag" style="background:${c.color}22; color:${c.color}; font-weight:700;">● ${c.name}</span>
        </label>
      `;
    });

    container.innerHTML = html;

    const checkAll = document.getElementById('event-class-check-all');
    const classBoxes = container.querySelectorAll('.event-class-checkbox');

    if (checkAll) {
      checkAll.addEventListener('change', () => {
        classBoxes.forEach(cb => { cb.checked = checkAll.checked; });
      });
    }

    classBoxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const allChecked = Array.from(classBoxes).length > 0 && Array.from(classBoxes).every(b => b.checked);
        if (checkAll) {
          checkAll.checked = allChecked;
        }
      });
    });
  },

  openAddEventModal() {
    const modalBackdrop = document.getElementById('modal-event-backdrop');
    if (!modalBackdrop) return;

    const titleEl = document.getElementById('event-modal-title');
    if (titleEl) titleEl.textContent = 'Add Blockout Event';
    const submitBtn = document.getElementById('btn-submit-event');
    if (submitBtn) submitBtn.textContent = 'Save Event';
    const editIdInput = document.getElementById('event-edit-id');
    if (editIdInput) editIdInput.value = '';

    const form = document.getElementById('form-add-event');
    if (form) form.reset();

    this.renderClassChecklist(['ALL']);

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
  },

  openEditEventModal(eventId) {
    const ev = state.events.find(e => e.id === eventId);
    if (!ev) return;
    const modalBackdrop = document.getElementById('modal-event-backdrop');
    if (!modalBackdrop) return;

    const titleEl = document.getElementById('event-modal-title');
    if (titleEl) titleEl.textContent = 'Edit Blockout Event';
    const submitBtn = document.getElementById('btn-submit-event');
    if (submitBtn) submitBtn.textContent = 'Save Changes';
    const editIdInput = document.getElementById('event-edit-id');
    if (editIdInput) editIdInput.value = ev.id;

    const titleInput = document.getElementById('event-title');
    if (titleInput) titleInput.value = ev.title || '';

    const sDate = ev.startDate || ev.date || '';
    const eDate = ev.endDate || ev.date || sDate;
    const eventDateInput = document.getElementById('event-date');
    const eventEndDateInput = document.getElementById('event-end-date');
    if (eventDateInput) eventDateInput.value = sDate;
    if (eventEndDateInput) {
      eventEndDateInput.value = (eDate && eDate !== sDate) ? eDate : '';
      eventEndDateInput.min = sDate;
    }

    const typeSelect = document.getElementById('event-type');
    if (typeSelect) typeSelect.value = ev.type || 'other';

    const classIds = Array.isArray(ev.affectedClassIds) ? ev.affectedClassIds : (ev.affectedClassId ? [ev.affectedClassId] : ['ALL']);
    this.renderClassChecklist(classIds);

    const blockAllDayCheckbox = document.getElementById('event-block-allday');
    if (blockAllDayCheckbox) {
      blockAllDayCheckbox.checked = (ev.blockAllDay !== false);
      blockAllDayCheckbox.disabled = false;
    }

    const periodSelect = document.getElementById('event-period-select');
    if (periodSelect) {
      if (state.periods) {
        periodSelect.innerHTML = state.periods.filter(p => !p.isBreak).map(p =>
          `<option value="${p.id}">${p.name}</option>`
        ).join('');
      }
      if (ev.blockedPeriod) periodSelect.value = ev.blockedPeriod;
    }

    const periodGroup = document.getElementById('event-period-group');
    if (periodGroup) {
      periodGroup.style.display = (ev.blockAllDay !== false) ? 'none' : 'block';
    }

    const multidayNotice = document.getElementById('event-multiday-notice');
    if (multidayNotice) {
      multidayNotice.style.display = (eDate && eDate > sDate) ? 'block' : 'none';
    }

    modalBackdrop.classList.add('active');
  }
};
