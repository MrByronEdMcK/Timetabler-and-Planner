/* ==========================================================================
   Calendar & Term Configuration UI (View 1)
   ========================================================================== */

import {
  state,
  sortEventsChronologically,
  getClassCellStyles,
  showToastNotification,
  escapeHtml
} from '../state.js';
import { TermManager } from '../termManager.js';

function triggerRefresh(force = false, isScheduleEdit = true) {
  if (typeof window !== 'undefined' && typeof window.refreshAllViews === 'function') {
    window.refreshAllViews(force, isScheduleEdit);
  } else if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('planner:stateChanged'));
  }
}

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
              <div style="font-weight:700; font-size:0.95rem; color:var(--text-main);">Academic School Year</div>
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
      <div class="term-card" data-id="${escapeHtml(term.id)}">
        <div class="term-header">
          <div class="term-name">${escapeHtml(term.name)}</div>
          <span class="term-weeks-badge">${TermManager.getTermWeeks(term)} Weeks</span>
        </div>
        <div class="form-group">
          <label class="form-label">Start Date</label>
          <input type="date" class="form-control term-date-input" data-id="${escapeHtml(term.id)}" data-field="startDate" value="${escapeHtml(term.startDate)}">
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">End Date</label>
          <input type="date" class="form-control term-date-input" data-id="${escapeHtml(term.id)}" data-field="endDate" min="${escapeHtml(term.startDate)}" value="${escapeHtml(term.endDate)}">
        </div>
      </div>
    `).join('');
  },

  sortEvents(events = state.data.events) {
    return sortEventsChronologically(events);
  },

  renderEventsList() {
    const container = document.getElementById('event-list-container');
    if (!container) return;

    if (state.events.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-dim);">No calendar events or blockouts added for ${state.academicYear} yet.</div>`;
      return;
    }

    this.sortEvents(state.data.events);
    container.innerHTML = state.events.map(ev => {
      const classIds = Array.isArray(ev.affectedClassIds) ? ev.affectedClassIds : (ev.affectedClassId ? [ev.affectedClassId] : []);
      let classBadge = '';
      if (classIds.length === 0 || classIds.includes('ALL')) {
        classBadge = `<span class="tag tag-locked">All Classes</span>`;
      } else {
        classBadge = classIds.map(cId => {
          const classObj = state.classes.find(c => c.id === cId);
          if (!classObj) return '';
          const cellStyle = getClassCellStyles(classObj.color, state.theme === 'dark');
          return `<span class="tag" style="background:${cellStyle.tagBg}; color:${cellStyle.tagColor}; border:${cellStyle.tagBorder};">${escapeHtml(classObj.name)}</span>`;
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
          : `<span style="color:var(--warning); font-weight:700;">Multi-Day (Period: ${escapeHtml(ev.blockedPeriod)})</span>`;
        dateText = `${TermManager.formatDisplayDate(sDate)} → ${TermManager.formatDisplayDate(eDate)}`;
      } else {
        periodBadge = ev.blockAllDay !== false ? `Whole Day` : `Blocked Period: ${escapeHtml(ev.blockedPeriod)}`;
        dateText = TermManager.formatDisplayDate(sDate);
      }

      return `
        <div class="event-item" data-id="${escapeHtml(ev.id)}">
          <div class="event-info">
            <div class="event-title">
              <span>${escapeHtml(ev.title)}</span>
              <span class="event-type-badge type-${escapeHtml(ev.type)}">${escapeHtml(ev.type)}</span>
              ${isMultiDay ? `<span class="tag" style="background:rgba(245,158,11,0.15); color:var(--warning, #f59e0b); font-weight:700; font-size:0.75rem;">📅 Multi-Day</span>` : ''}
            </div>
            <div class="event-date">
              📅 ${dateText} • ${periodBadge} • ${classBadge}
            </div>
          </div>
          <div style="display:flex; gap:0.4rem; align-items:center;">
            <button type="button" class="btn btn-secondary btn-sm edit-event-btn" data-id="${escapeHtml(ev.id)}">Edit</button>
            <button type="button" class="btn btn-danger btn-sm delete-event-btn" data-id="${escapeHtml(ev.id)}">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  },

  bindEvents() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    const handleYearChange = (newYear) => {
      const yr = parseInt(newYear, 10);
      if (!isNaN(yr) && yr >= 2020 && yr <= 2035) {
        if (yr === state.academicYear) return;
        state.setAcademicYear(yr);
        if (typeof window !== 'undefined') {
          if (typeof window.updateCurrentDateDisplay === 'function') {
            window.updateCurrentDateDisplay();
          }
          if (window.LessonUI) {
            window.LessonUI.selectedClassId = state.classes[0]?.id || null;
          }
          if (window.HomeworkUI) {
            window.HomeworkUI.selectedClassId = state.classes[0]?.id || null;
            window.HomeworkUI.ensureDefaultTermAndWeek();
          }
          if (window.MasterScheduleUI) {
            window.MasterScheduleUI.selectedClassIds = ['ALL'];
          }
        }
        showToastNotification(`Switched to academic year ${yr}`);
        triggerRefresh(true, true);
      } else {
        showToastNotification('⚠️ Please enter a valid academic year between 2020 and 2035.');
        this.renderTermCards();
      }
    };

    document.addEventListener('change', (e) => {
      if (e.target.id === 'input-academic-year') {
        handleYearChange(e.target.value);
      }
      if (e.target.classList.contains('term-date-input')) {
        const id = e.target.getAttribute('data-id');
        const field = e.target.getAttribute('data-field');
        const term = state.terms.find(t => t.id === id);
        if (term) {
          const newVal = e.target.value;
          if (!newVal) {
            e.target.value = term[field];
            return;
          }
          // Validate start date <= end date
          if (field === 'startDate' && term.endDate && newVal > term.endDate) {
            showToastNotification(`⚠️ ${term.name} Start Date cannot be after End Date. End Date adjusted.`);
            term.endDate = newVal;
          } else if (field === 'endDate' && term.startDate && newVal < term.startDate) {
            showToastNotification(`⚠️ ${term.name} End Date cannot be before Start Date.`);
            e.target.value = term.endDate;
            return;
          }

          term[field] = newVal;
          term.weeks = TermManager.getTermWeeks(term);
          state.saveState();
          if (typeof window !== 'undefined' && window.MasterScheduleUI) {
            window.MasterScheduleUI._cachedTermWeeks = null;
            window.MasterScheduleUI._cachedTermsKey = null;
          }
          this.renderTermCards();
          triggerRefresh(false, true);
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
        triggerRefresh(false, true);
      }
      if (e.target.classList.contains('edit-event-btn') || e.target.closest('.edit-event-btn')) {
        const btn = e.target.classList.contains('edit-event-btn') ? e.target : e.target.closest('.edit-event-btn');
        const id = btn.getAttribute('data-id');
        this.openEditEventModal(id);
      }
    });

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
        const blockAllDayEl = document.getElementById('event-block-allday');
        const blockAllDay = blockAllDayEl ? blockAllDayEl.checked : true;
        const blockedPeriod = blockAllDay ? null : document.getElementById('event-period-select')?.value;

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
          showToastNotification(`Updated blockout event "${title}"`);
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
          showToastNotification(`Added blockout event "${title}"`);
        }

        this.sortEvents(state.data.events);
        state.saveState();
        document.getElementById('modal-event-backdrop')?.classList.remove('active');
        eventForm.reset();
        this.renderEventsList();
        triggerRefresh(true, true);
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
      const cellStyle = getClassCellStyles(c.color, state.theme === 'dark');
      html += `
        <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-size:0.85rem; padding:0.15rem 0;">
          <input type="checkbox" class="event-class-checkbox" value="${escapeHtml(c.id)}" ${checked ? 'checked' : ''}>
          <span class="tag" style="background:${cellStyle.tagBg}; color:${cellStyle.tagColor}; border:${cellStyle.tagBorder}; font-weight:700;"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${cellStyle.dotBg}; border:${cellStyle.dotBorder}; margin-right:4px; vertical-align:middle;"></span>${escapeHtml(c.name)}</span>
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

    const periodSelect = document.getElementById('event-period-select');
    if (periodSelect && state.periods) {
      periodSelect.innerHTML = state.periods.filter(p => !p.isBreak).map(p =>
        `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`
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
          `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`
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

if (typeof window !== 'undefined') {
  window.CalendarUI = CalendarUI;
}
