/* ==========================================================================
   Australian Teacher Timetabler & Planner - Main ES Module Application Controller
   Coordinates Views 1–5, ThemeManager, SpotlightTour, Global Shortcuts & Storage
   ========================================================================== */

import {
  state,
  PersistentStorageManager,
  showToastNotification,
  showReanalysisSummaryToast
} from './state.js';
import { TermManager } from './termManager.js';
import { TimetableManager } from './timetableManager.js';
import { Scheduler } from './scheduler.js';
import { CalendarUI } from './ui/calendarUI.js';
import { TimetableUI, PeriodConfigUI } from './ui/timetableUI.js';
import { LessonUI, LessonViewer } from './ui/lessonUI.js';
import { MasterScheduleUI } from './ui/masterScheduleUI.js';
import { ConflictModal } from './ui/conflictModal.js';
import { HomeworkUI } from './ui/homeworkUI.js';
import './timer.js';

const _urlParamsInit = (typeof window !== 'undefined' && window.location)
  ? new URLSearchParams(window.location.search)
  : null;
let activeViewId = (_urlParamsInit && ['terms', 'timetable', 'lessons', 'master', 'homework'].includes(_urlParamsInit.get('view')))
  ? _urlParamsInit.get('view')
  : 'terms';
const dirtyViews = new Set(['terms', 'timetable', 'lessons', 'master', 'homework']);

export function renderViewIfDirty(viewId) {
  if (!dirtyViews.has(viewId)) return;
  dirtyViews.delete(viewId);

  try {
    if (viewId === 'terms') {
      CalendarUI.renderTermCards();
      CalendarUI.renderEventsList();
    } else if (viewId === 'timetable') {
      TimetableUI.renderWeekTabs();
      TimetableUI.renderGrid();
    } else if (viewId === 'lessons') {
      LessonUI.renderClassSelector();
      LessonUI.renderLessonList();
    } else if (viewId === 'master') {
      MasterScheduleUI.renderNavBar();
      MasterScheduleUI.renderConflictBanner();
      MasterScheduleUI.renderCalendarGrid();
    } else if (viewId === 'homework') {
      HomeworkUI.renderClassSelector();
      HomeworkUI.renderTermAndWeekPicker();
      HomeworkUI.renderMainContent();
    }
  } catch (err) {
    console.error(`[VIEW RENDER ERROR] Failed to render view "${viewId}":`, err);
  }
}

export function refreshAllViews(force = false, isScheduleOrSequenceEdit = false) {
  Scheduler.reanalysisStats.clear();
  ['terms', 'timetable', 'lessons', 'master', 'homework'].forEach(v => dirtyViews.add(v));
  if (force) {
    ['terms', 'timetable', 'lessons', 'master', 'homework'].forEach(v => renderViewIfDirty(v));
  } else {
    renderViewIfDirty(activeViewId);
  }

  if (isScheduleOrSequenceEdit && Scheduler.reanalysisStats.hasChanges()) {
    showReanalysisSummaryToast(Scheduler.reanalysisStats.getSummaryMessage());
  }
}

export function updateCurrentDateDisplay() {
  const el = document.getElementById('current-date-input');
  if (el) el.value = state.currentDate;

  const syncContainer = document.getElementById('lock-sync-status-container');
  if (syncContainer) {
    const realTodayStr = TermManager.getLocalDateString(new Date());
    if (state.currentDate === realTodayStr) {
      syncContainer.innerHTML = `<span style="font-size:0.72rem; color:#34d399; font-weight:700; margin-left:0.4rem;" title="Lock threshold matches today's computer local date">✓ Synced</span>`;
    } else {
      syncContainer.innerHTML = `<button type="button" id="btn-sync-lock-today" class="btn btn-warning btn-xs" style="font-size:0.7rem; font-weight:700; padding:0.15rem 0.5rem; margin-left:0.4rem; border-radius:12px;" title="Lock threshold (${TermManager.formatDisplayDate(state.currentDate)}) is out of sync with real computer date (${TermManager.formatDisplayDate(realTodayStr)}). Click to sync!">🔄 Sync to Today (${TermManager.formatDisplayDate(realTodayStr)})</button>`;
    }
  }
}

export function switchView(targetView) {
  if (!targetView || !['terms', 'timetable', 'lessons', 'master', 'homework'].includes(targetView)) return;
  activeViewId = targetView;
  const navButtons = document.querySelectorAll('.app-nav .nav-btn');
  navButtons.forEach(b => {
    if (b.getAttribute('data-view') === targetView) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  const targetPanel = document.getElementById(`view-${targetView}`);
  if (targetPanel) targetPanel.classList.add('active');

  renderViewIfDirty(targetView);
}

// Interactive Spotlight Tour Engine
export const SpotlightTour = {
  currentStep: 0,
  steps: [
    {
      view: 'terms',
      targetId: 'term-cards-container',
      title: '🗓️ Step 1: Term Calendar & Blockouts',
      text: 'Configure start and end dates for the 4 school terms. Add Sports Carnivals, Assemblies, and Holidays to bypass blocked days automatically!'
    },
    {
      view: 'timetable',
      targetId: 'btn-open-period-config',
      title: '⚙️ Step 2: Period Customization & 12h/24h Time',
      text: 'Customize period start and end times with native time inputs. Reorder periods and position Recess & Lunch breaks anywhere you like!'
    },
    {
      view: 'timetable',
      targetId: 'timetable-grid-container',
      title: '🧩 Step 3: Assign Classes Inline',
      text: 'Click any cell to assign a class! Type to autocomplete existing classes or create a new class inline with custom room details.'
    },
    {
      view: 'lessons',
      targetId: 'btn-open-lesson-modal',
      title: '📚 Step 4: Curriculum Lessons & Drag-to-Reorder',
      text: 'Add ordered lesson plans with unit autocomplete. Tag "Revision" lessons for pruning and drag & drop cards to reorder your sequence!'
    },
    {
      view: 'master',
      targetId: 'master-calendar-nav-bar',
      title: '🎯 Step 5: Master Pacing Calendar Matrix',
      text: 'View your year-long schedule in a visual calendar matrix! Switch terms/weeks quickly and resolve pacing conflicts with 1-click!'
    }
  ],

  init() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('notour') || urlParams.get('view') || urlParams.get('modal')) {
        return;
      }
    } catch (e) {}
    if (!state.data.tutorialCompleted) {
      setTimeout(() => this.start(), 400);
    }
  },

  start() {
    this.currentStep = 0;
    this.showStep(0);
  },

  showStep(index) {
    if (index < 0 || index >= this.steps.length) return;

    document.querySelectorAll('.tour-target-highlighted').forEach(el => el.classList.remove('tour-target-highlighted'));

    this.currentStep = index;
    const step = this.steps[index];

    switchView(step.view);

    setTimeout(() => {
      const targetEl = document.getElementById(step.targetId);
      if (!targetEl) return;

      targetEl.classList.add('tour-target-highlighted');
      const rect = targetEl.getBoundingClientRect();
      this.renderSpotlight(rect, step);
    }, 150);
  },

  renderSpotlight(rect, step) {
    let backdrop = document.getElementById('tour-backdrop');
    let ring = document.getElementById('tour-ring');
    let tooltip = document.getElementById('tour-tooltip');

    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'tour-backdrop';
      backdrop.className = 'tour-spotlight-backdrop';
      document.body.appendChild(backdrop);
    }

    if (!ring) {
      ring = document.createElement('div');
      ring.id = 'tour-ring';
      ring.className = 'tour-spotlight-ring';
      document.body.appendChild(ring);
    }

    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'tour-tooltip';
      tooltip.className = 'tour-tooltip-card';
      document.body.appendChild(tooltip);
    }

    ring.style.top = `${window.scrollY + rect.top - 8}px`;
    ring.style.left = `${window.scrollX + rect.left - 8}px`;
    ring.style.width = `${rect.width + 16}px`;
    ring.style.height = `${rect.height + 16}px`;

    const tooltipTop = window.scrollY + rect.bottom + 15;
    let tooltipLeft = window.scrollX + rect.left;
    if (tooltipLeft + 340 > window.innerWidth) {
      tooltipLeft = window.innerWidth - 360;
    }

    tooltip.style.top = `${tooltipTop}px`;
    tooltip.style.left = `${Math.max(15, tooltipLeft)}px`;

    const isLast = this.currentStep === this.steps.length - 1;

    tooltip.innerHTML = `
      <h4 style="font-size:1rem; font-weight:700; margin-bottom:0.4rem;">${step.title}</h4>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">${step.text}</p>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <button id="tour-skip-btn" class="btn btn-secondary btn-sm">Skip</button>
        <button id="tour-next-btn" class="btn btn-primary btn-sm">${isLast ? 'Finish & Start Fresh ✨' : 'Next ➡️'}</button>
      </div>
    `;

    document.getElementById('tour-skip-btn').onclick = () => this.finish(false);
    document.getElementById('tour-next-btn').onclick = () => {
      if (isLast) {
        this.finish(true);
      } else {
        this.showStep(this.currentStep + 1);
      }
    };
  },

  finish(clearData = true) {
    document.querySelectorAll('.tour-target-highlighted').forEach(el => el.classList.remove('tour-target-highlighted'));

    const backdrop = document.getElementById('tour-backdrop');
    const ring = document.getElementById('tour-ring');
    const tooltip = document.getElementById('tour-tooltip');
    if (backdrop) backdrop.remove();
    if (ring) ring.remove();
    if (tooltip) tooltip.remove();

    if (clearData) {
      state.clearAllPlaceholderData();
      refreshAllViews(true, false);
      alert('Tutorial complete! Demo placeholder data cleared. Your planner is fresh and ready!');
    } else {
      state.data.tutorialCompleted = true;
      state.saveState();
    }
  }
};

export const ThemeManager = {
  init() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlTheme = urlParams.get('theme');
    const savedTheme = urlTheme || state.theme || 'light';
    this.applyTheme(savedTheme, false);

    const urlAccent = urlParams.get('accent');
    const savedAccent = urlAccent || state.accent || 'blue';
    this.applyAccent(savedAccent, false);

    this.bindEvents();
  },

  toggle() {
    const currentTheme = state.theme;
    const newTheme = (currentTheme === 'light') ? 'dark' : 'light';
    state.setTheme(newTheme);
    this.applyTheme(newTheme, false);
    const existingToast = document.getElementById('reanalysis-summary-toast');
    if (existingToast) {
      existingToast.style.opacity = '0';
      existingToast.style.transform = 'translateY(-10px)';
      setTimeout(() => { existingToast.style.display = 'none'; }, 200);
    }
    refreshAllViews(true, false);
    const wbBackdrop = document.getElementById('modal-whiteboard-backdrop');
    if (wbBackdrop && wbBackdrop.classList.contains('active')) {
      HomeworkUI.renderWhiteboardContent();
    }
  },

  applyTheme(theme, save = true) {
    if (save) state.setTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    const btns = document.querySelectorAll('#btn-toggle-theme, #btn-toggle-whiteboard-theme');
    btns.forEach(btn => {
      btn.innerHTML = (theme === 'light') ? '☀️ Light' : '🌙 Dark';
      btn.title = `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`;
    });
  },

  applyAccent(accent, save = true) {
    if (!accent) accent = 'blue';
    if (save) state.setAccent(accent);
    document.documentElement.setAttribute('data-accent', accent);
    document.body.setAttribute('data-accent', accent);
    document.querySelectorAll('.accent-swatch-btn').forEach(btn => {
      const isMatch = btn.getAttribute('data-accent') === accent;
      btn.classList.toggle('active', isMatch);
    });
    document.querySelectorAll('.accent-current-dot').forEach(dot => {
      dot.style.background = 'var(--primary)';
    });
  },

  bindEvents() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-toggle-theme, #btn-toggle-whiteboard-theme')) {
        this.toggle();
        return;
      }

      const btnHeaderAccent = e.target.closest('#btn-header-accent');
      const popover = document.getElementById('header-accent-popover');
      if (btnHeaderAccent) {
        e.stopPropagation();
        if (popover) popover.classList.toggle('hidden');
        return;
      }

      const swatchBtn = e.target.closest('.accent-swatch-btn');
      if (swatchBtn) {
        const accent = swatchBtn.getAttribute('data-accent');
        if (accent) {
          this.applyAccent(accent, true);
          if (popover) popover.classList.add('hidden');
          const accentName = accent.charAt(0).toUpperCase() + accent.slice(1);
          showToastNotification(`🎨 Accent theme set to ${accentName}`);
        }
        return;
      }

      if (popover && !popover.classList.contains('hidden') && !e.target.closest('#header-accent-popover')) {
        popover.classList.add('hidden');
      }
    });
  }
};

function doResetData() {
  state.resetToDefault();
  LessonUI.selectedClassId = state.classes.length > 0 ? state.classes[0].id : null;
  MasterScheduleUI.selectedClassIds = ['ALL'];
  updateCurrentDateDisplay();
  refreshAllViews(true, false);

  const listContainer = document.getElementById('view-terms');
  if (listContainer) {
    const alertBanner = document.createElement('div');
    alertBanner.style.cssText = 'background:rgba(16, 185, 129, 0.2); border:1px solid #10b981; color:#34d399; padding:0.6rem 1rem; border-radius:var(--radius-md); margin-bottom:1rem; font-weight:700; font-size:0.85rem;';
    alertBanner.innerHTML = `✅ All app data reset to sample defaults successfully!`;
    listContainer.insertBefore(alertBanner, listContainer.firstChild);
    setTimeout(() => alertBanner.remove(), 4000);
  }
}

function downloadFullAppBackup() {
  state.syncCurrentYearToYears();
  const jsonStr = JSON.stringify(state.data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Timetable_Planner_Backup_${state.currentDate}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function bindGlobalEvents() {
  const navButtons = document.querySelectorAll('.app-nav .nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-view');
      switchView(targetView);
    });
  });

  document.addEventListener('click', (e) => {
    const syncBtn = e.target.closest('#btn-sync-lock-today');
    if (syncBtn) {
      const realTodayStr = TermManager.getLocalDateString(new Date());
      state.setCurrentDate(realTodayStr);
      updateCurrentDateDisplay();
      MasterScheduleUI.showReanalysisOverlay(`Re-analyzing Schedule with Synced Lock Threshold (${TermManager.formatDisplayDate(realTodayStr)})...`);
      setTimeout(() => {
        MasterScheduleUI.hideReanalysisOverlay();
        refreshAllViews(false, true);
      }, 350);
    }
  });

  const currentDateInput = document.getElementById('current-date-input');
  if (currentDateInput) {
    currentDateInput.addEventListener('change', (e) => {
      state.setCurrentDate(e.target.value);
      updateCurrentDateDisplay();
      refreshAllViews(false, true);
    });
  }

  // Modal Close Backdrop / Button Handler
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-backdrop')) {
      const wbBackdrop = document.getElementById('modal-whiteboard-backdrop');
      if (wbBackdrop && wbBackdrop.classList.contains('active') &&
          (e.target === wbBackdrop || e.target.closest('#modal-whiteboard-backdrop .modal-close'))) {
        if (typeof window !== 'undefined' && window.ClassTimer && typeof window.ClassTimer.onExitWhiteboardView === 'function') {
          window.ClassTimer.onExitWhiteboardView();
        }
      }
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
    }
  });

  // Global Keyboard Shortcuts: '1'–'5' to switch views, 'Escape' to close any active modal, popover, or Whiteboard mode
  document.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    const tag = activeEl ? activeEl.tagName.toUpperCase() : '';
    const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (activeEl && activeEl.isContentEditable);

    if (e.key === 'Escape') {
      const popover = document.getElementById('header-accent-popover');
      if (popover && !popover.classList.contains('hidden')) {
        popover.classList.add('hidden');
      }

      const wbBackdrop = document.getElementById('modal-whiteboard-backdrop');
      if (wbBackdrop && wbBackdrop.classList.contains('active')) {
        if (typeof window !== 'undefined' && window.ClassTimer && typeof window.ClassTimer.onExitWhiteboardView === 'function') {
          window.ClassTimer.onExitWhiteboardView();
        }
      }

      const activeModals = document.querySelectorAll('.modal-backdrop.active');
      if (activeModals.length > 0) {
        activeModals.forEach(m => m.classList.remove('active'));
      }
      return;
    }

    if (!isEditing && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const anyModalOpen = document.querySelector('.modal-backdrop.active') !== null;
      if (!anyModalOpen) {
        const viewMap = {
          '1': 'terms',
          '2': 'timetable',
          '3': 'lessons',
          '4': 'master',
          '5': 'homework'
        };
        if (viewMap[e.key]) {
          e.preventDefault();
          switchView(viewMap[e.key]);
        }
      }
    }
  });

  // Settings Cog Modal & Header Storage Status Chip Handler
  const openSettingsModal = () => {
    const modal = document.getElementById('modal-settings-backdrop');
    if (modal) {
      modal.classList.add('active');
      state.updateStorageUI();
    }
  };

  const openSettingsBtn = document.getElementById('btn-open-settings-modal');
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', openSettingsModal);
  }

  const storageStatusBtn = document.getElementById('btn-storage-status-indicator');
  if (storageStatusBtn) {
    storageStatusBtn.addEventListener('click', openSettingsModal);
  }

  // Deduplicated Settings, Backup & Reset Action Handlers
  document.addEventListener('click', (e) => {
    const tutorialBtn = e.target.closest('#btn-settings-tutorial, #btn-open-tutorial');
    if (tutorialBtn) {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
      SpotlightTour.start();
      return;
    }

    const reqPersistBtn = e.target.closest('#btn-request-persistence');
    if (reqPersistBtn) {
      e.preventDefault();
      PersistentStorageManager.requestPersistentStorage().then(granted => {
        state.updateStorageUI();
        if (granted) {
          showToastNotification('🛡️ Persistent storage permission granted!');
        } else {
          showToastNotification('ℹ️ Standard storage active. Browser manages persistence.');
        }
      });
      return;
    }

    const verifyStorageBtn = e.target.closest('#btn-verify-storage');
    if (verifyStorageBtn) {
      e.preventDefault();
      state.saveState();
      state.updateStorageUI();
      showToastNotification('✅ Storage verified: Synchronized with IndexedDB.');
      return;
    }

    const backupBtn = e.target.closest('#btn-settings-backup, #btn-export-json, #btn-reset-download-backup');
    if (backupBtn) {
      e.preventDefault();
      downloadFullAppBackup();
      return;
    }

    const resetBtn = e.target.closest('#btn-reset-data, #btn-settings-reset');
    if (resetBtn) {
      e.preventDefault();
      const backdrop = document.getElementById('modal-reset-warning-backdrop');
      if (backdrop) {
        backdrop.classList.add('active');
      } else {
        doResetData();
      }
      return;
    }

    const confirmResetBtn = e.target.closest('#btn-confirm-reset-data');
    if (confirmResetBtn) {
      e.preventDefault();
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
      doResetData();
    }
  });

  // Import Data JSON Handler
  document.addEventListener('change', (e) => {
    if (e.target.id === 'settings-input-restore-json' || e.target.id === 'input-import-json') {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          state.importState(imported);
          document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
          updateCurrentDateDisplay();
          refreshAllViews(true, true);
          alert('✅ Data restored successfully!');
        } catch (err) {
          alert('❌ Invalid backup JSON file.');
        }
      };
      reader.readAsText(file);
    }
  });
}

// Expose globals on window for deep-linking, console diagnostics & test runner compatibility
if (typeof window !== 'undefined') {
  window.state = state;
  window.PersistentStorageManager = PersistentStorageManager;
  window.TermManager = TermManager;
  window.TimetableManager = TimetableManager;
  window.Scheduler = Scheduler;
  window.CalendarUI = CalendarUI;
  window.TimetableUI = TimetableUI;
  window.PeriodConfigUI = PeriodConfigUI;
  window.LessonUI = LessonUI;
  window.LessonViewer = LessonViewer;
  window.MasterScheduleUI = MasterScheduleUI;
  window.ConflictModal = ConflictModal;
  window.HomeworkUI = HomeworkUI;
  window.ThemeManager = ThemeManager;
  window.SpotlightTour = SpotlightTour;
  window.switchView = switchView;
  window.refreshAllViews = refreshAllViews;
  window.updateCurrentDateDisplay = updateCurrentDateDisplay;
  window.showToastNotification = showToastNotification;
}

function initApp() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('testSeed') === '1') {
      const testClasses = [
        { id: 'c_white', name: '10SCIE', color: '#ffffff', details: 'B02' },
        { id: 'c_blue', name: '10MATH', color: '#3b82f6', details: 'S2.3' },
        { id: 'c_orange', name: '07ENG', color: '#f97316', details: 'B08' }
      ];
      state.data.classes = testClasses;
      state.data.timetableSlots = {
        '1_1_p1': 'c_white',
        '1_1_p2': 'c_blue',
        '1_2_p1': 'c_orange',
        '1_2_p2': 'c_white',
        '1_3_p1': 'c_white',
        '1_4_p1': 'c_blue',
        '1_5_p1': 'c_white'
      };
      state.data.lessonPlans = {
        'c_white': [
          {
            id: 'lp1',
            title: 'Photosynthesis & Light Absorption',
            unit: 'Biology',
            classwork: [
              { type: 'Textbook', work: 'Pages 104-108 Questions 1-5', link: 'https://classroom.google.com/c/12345/p1' },
              { type: 'Worksheet', work: 'Chloroplast Diagram Worksheet', link: 'https://docs.google.com/document/d/xyz' }
            ]
          }
        ]
      };
      if (state.data.years && state.data.years[state.academicYear]) {
        state.data.years[state.academicYear].classes = state.data.classes;
        state.data.years[state.academicYear].timetableSlots = state.data.timetableSlots;
        state.data.years[state.academicYear].lessonPlans = state.data.lessonPlans;
      }
    }
  } catch (e) {}

  ThemeManager.init();
  CalendarUI.init();
  TimetableUI.init();
  LessonUI.init();
  MasterScheduleUI.init();
  HomeworkUI.init();
  ConflictModal.bindEvents();
  PeriodConfigUI.bindEvents();
  bindGlobalEvents();
  updateCurrentDateDisplay();

  // Check URL parameters for view navigation & deep linking
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const targetView = urlParams.get('view');
    if (targetView && ['terms', 'timetable', 'lessons', 'master', 'homework'].includes(targetView)) {
      switchView(targetView);
    }
    const targetModal = urlParams.get('modal');
    if (targetModal === 'settings') {
      const modal = document.getElementById('modal-settings-backdrop');
      if (modal) {
        modal.classList.add('active');
        state.updateStorageUI();
      }
    } else if (targetModal === 'help') {
      if (window.HelpUI) {
        const q = urlParams.get('helpquery') || '';
        window.HelpUI.openHelpModal(q);
      } else {
        const modal = document.getElementById('modal-help-backdrop');
        if (modal) modal.classList.add('active');
      }
    } else if (targetModal === 'whiteboard') {
      const hwTerm = urlParams.get('hwterm');
      const hwWeek = urlParams.get('hwweek');
      const hwGrouping = urlParams.get('grouping');
      const hwClass = urlParams.get('hwclass');
      if (hwTerm) HomeworkUI.selectedTermId = hwTerm;
      if (hwWeek) HomeworkUI.selectedWeekNum = parseInt(hwWeek, 10);
      if (hwGrouping) HomeworkUI.groupingMode = hwGrouping;
      if (hwClass) HomeworkUI.selectedClassId = hwClass;
      HomeworkUI.openWhiteboardModal();
    }
  } catch (e) {}

  SpotlightTour.init();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
