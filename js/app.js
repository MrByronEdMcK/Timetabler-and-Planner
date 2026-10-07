/* ==========================================================================
   Australian Teacher Timetabler & Planner - Complete Engine & UI Controller
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'aus_teacher_timetabler_state_v3';

  // Default School Terms (2026 Sample Default)
  const DEFAULT_TERMS = [
    { id: 't1', name: 'Term 1', startDate: '2026-01-28', endDate: '2026-04-02', weeks: 10 },
    { id: 't2', name: 'Term 2', startDate: '2026-04-20', endDate: '2026-07-03', weeks: 11 },
    { id: 't3', name: 'Term 3', startDate: '2026-07-20', endDate: '2026-09-25', weeks: 10 },
    { id: 't4', name: 'Term 4', startDate: '2026-10-12', endDate: '2026-12-18', weeks: 10 }
  ];

  // Default Configurable Periods with Native Start & End Times (Req 2)
  const DEFAULT_PERIODS = [
    { id: 'p1', name: 'Period 1', startTime: '09:00', endTime: '10:00' },
    { id: 'p2', name: 'Period 2', startTime: '10:00', endTime: '11:00' },
    { id: 'recess', name: 'Recess', startTime: '11:00', endTime: '11:30', isBreak: true },
    { id: 'p3', name: 'Period 3', startTime: '11:30', endTime: '12:30' },
    { id: 'p4', name: 'Period 4', startTime: '12:30', endTime: '13:30' },
    { id: 'lunch', name: 'Lunch', startTime: '13:30', endTime: '14:15', isBreak: true },
    { id: 'p5', name: 'Period 5', startTime: '14:15', endTime: '15:15' }
  ];

  const PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1', '#f97316'];
  const DEFAULT_CLASSES = [
    { id: 'c1', name: 'Year 9 Mathematics', subject: 'Mathematics', color: '#3b82f6', details: 'Room 201' },
    { id: 'c2', name: 'Year 10 Science', subject: 'Science', color: '#10b981', details: 'Lab B' },
    { id: 'c3', name: 'Year 11 Physics', subject: 'Physics', color: '#8b5cf6', details: 'Lab A' }
  ];

  const DEFAULT_EVENTS = [
    { id: 'e1', title: 'Swimming Carnival', date: '2026-02-13', type: 'carnival', blockAllDay: true },
    { id: 'e2', title: 'ANZAC Day Holiday', date: '2026-04-27', type: 'holiday', blockAllDay: true },
    { id: 'e3', title: 'Athletics Carnival', date: '2026-08-07', type: 'carnival', blockAllDay: true },
    { id: 'e4', title: 'Term 3 Assembly', date: '2026-08-14', type: 'assembly', blockAllDay: false, blockedPeriod: 'p1' }
  ];

  const DEFAULT_TIMETABLE_SLOTS = {
    '1_1_p1': 'c1', '1_1_p3': 'c2', '1_2_p2': 'c1', '1_2_p4': 'c3',
    '1_3_p1': 'c2', '1_3_p5': 'c1', '1_4_p2': 'c2', '1_4_p3': 'c3',
    '1_5_p1': 'c1', '1_5_p4': 'c2',
    '2_1_p2': 'c1', '2_1_p4': 'c2', '2_2_p1': 'c2', '2_2_p3': 'c1',
    '2_3_p2': 'c3', '2_3_p4': 'c1', '2_4_p1': 'c1', '2_4_p5': 'c2'
  };

  const DEFAULT_LESSON_PLANS = {
    'c1': [
      {
        id: 'l101',
        title: 'Intro to Linear Equations',
        unit: 'Unit 1: Algebra',
        isRevision: false,
        classwork: [
          { type: 'Notes', work: '7A Summary, Page 7', link: '' },
          { type: 'Textbook', work: '7A Q1, Q3, Q5', link: 'https://education.vic.gov.au' }
        ]
      },
      {
        id: 'l102',
        title: 'Solving 1-Step Equations',
        unit: 'Unit 1: Algebra',
        isRevision: false,
        classwork: [
          { type: 'Notes', work: '7B Notes', link: '' },
          { type: 'Textbook', work: '7B(All)', link: '' },
          { type: 'Worksheets', work: 'Sheet 1 (Q1-4)', link: '' }
        ]
      },
      {
        id: 'l103',
        title: 'Solving 2-Step Equations',
        unit: 'Unit 1: Algebra',
        isRevision: false,
        classwork: [
          { type: 'Notes', work: '7C Notes', link: '' },
          { type: 'Textbook', work: '7C(2, 4-7, Q8(half), 9, 10)', link: '' },
          { type: 'Worksheets', work: 'Worksheet 2', link: '' }
        ]
      },
      { id: 'l104', title: 'Equations with Variables on Both Sides', unit: 'Unit 1: Algebra', isRevision: false, classwork: [{ type: 'Textbook', work: '7D Q1-8', link: '' }] },
      { id: 'l105', title: 'Algebra Revision & Quiz Prep', unit: 'Unit 1: Algebra', isRevision: true, classwork: [{ type: 'Worksheets', work: 'Revision Sheet 1', link: '' }] },
      { id: 'l106', title: 'Linear Graphs & Gradient', unit: 'Unit 2: Coordinate Geometry', isRevision: false, classwork: [{ type: 'Notes', work: 'Gradient Notes', link: '' }, { type: 'Textbook', work: '8A Q1-6', link: '' }] },
      { id: 'l107', title: 'y = mx + c Form', unit: 'Unit 2: Coordinate Geometry', isRevision: false, classwork: [{ type: 'Textbook', work: '8B Q1-10', link: '' }] },
      { id: 'l108', title: 'Mid-Year Exam Revision', unit: 'Exam Prep', isRevision: true, isTestMilestone: true, testDate: '2026-08-25' }
    ],
    'c2': [
      {
        id: 'l201',
        title: 'Cell Structure & Organelles',
        unit: 'Biology: Cells',
        isRevision: false,
        classwork: [
          { type: 'Notes', work: 'Diagrams Page 42', link: '' },
          { type: 'Textbook', work: 'Chapter 3 Q1-5', link: '' }
        ]
      },
      { id: 'l202', title: 'Microscope Lab Practical', unit: 'Biology: Cells', isRevision: false, classwork: [{ type: 'Worksheets', work: 'Lab Practical Report Sheet', link: '' }] },
      { id: 'l203', title: 'Photosynthesis & Respiration', unit: 'Biology: Cells', isRevision: false },
      { id: 'l204', title: 'Cell Biology Revision', unit: 'Biology: Cells', isRevision: true }
    ]
  };

  // Persistent Storage Manager (IndexedDB + HTML5 StorageManager API)
  const PersistentStorageManager = {
    DB_NAME: 'aus_teacher_timetabler_db',
    DB_VERSION: 1,
    DB_STORE: 'app_state',
    DB_KEY: 'current_state',

    openDB() {
      return new Promise((resolve) => {
        if (typeof indexedDB === 'undefined') {
          return resolve(null);
        }
        try {
          const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
          req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(this.DB_STORE)) {
              db.createObjectStore(this.DB_STORE);
            }
          };
          req.onsuccess = (e) => resolve(e.target.result);
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    },

    async saveToIndexedDB(stateData) {
      try {
        const db = await this.openDB();
        if (!db) return false;
        return new Promise((resolve) => {
          try {
            const tx = db.transaction(this.DB_STORE, 'readwrite');
            const store = tx.objectStore(this.DB_STORE);
            const payload = {
              data: stateData,
              savedAt: new Date().toISOString()
            };
            const putReq = store.put(payload, this.DB_KEY);
            putReq.onsuccess = () => resolve(true);
            putReq.onerror = () => resolve(false);
          } catch (txErr) {
            resolve(false);
          }
        });
      } catch (err) {
        return false;
      }
    },

    async loadFromIndexedDB() {
      try {
        const db = await this.openDB();
        if (!db) return null;
        return new Promise((resolve) => {
          try {
            const tx = db.transaction(this.DB_STORE, 'readonly');
            const store = tx.objectStore(this.DB_STORE);
            const getReq = store.get(this.DB_KEY);
            getReq.onsuccess = (e) => {
              const res = e.target.result;
              if (res && res.data) {
                resolve(res.data);
              } else {
                resolve(null);
              }
            };
            getReq.onerror = () => resolve(null);
          } catch (txErr) {
            resolve(null);
          }
        });
      } catch (err) {
        return null;
      }
    },

    async requestPersistentStorage() {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
        try {
          return await navigator.storage.persist();
        } catch (e) {
          return false;
        }
      }
      return false;
    },

    async checkPersistence() {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
        try {
          return await navigator.storage.persisted();
        } catch (e) {
          return false;
        }
      }
      return false;
    },

    async getStorageEstimate() {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        try {
          return await navigator.storage.estimate();
        } catch (e) {
          return null;
        }
      }
      return null;
    }
  };

  // State Store
  class StateStore {
    constructor() {
      this.data = this.loadState();
      this.isPersisted = false;
      this.initPersistence();
    }

    async initPersistence() {
      try {
        this.isPersisted = await PersistentStorageManager.requestPersistentStorage();
      } catch (e) {}

      try {
        const localStored = (typeof localStorage !== 'undefined') ? localStorage.getItem(STORAGE_KEY) : null;
        if (!localStored) {
          const dbData = await PersistentStorageManager.loadFromIndexedDB();
          if (dbData && typeof dbData === 'object' && Object.keys(dbData).length > 0) {
            console.info('Restored state from persistent IndexedDB backup');
            this.data = dbData;
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
            } catch (e) {}
            if (typeof refreshAllViews === 'function') {
              refreshAllViews(false, true);
            }
          }
        } else {
          PersistentStorageManager.saveToIndexedDB(this.data);
        }
      } catch (e) {}

      this.updateStorageUI();
    }

    loadState() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
      } catch (err) {
        console.warn('Could not read localStorage', err);
      }
      return this.getDefaultState();
    }

    getDefaultState() {
      return {
        tutorialCompleted: false,
        timeFormat: '12h',
        currentDate: '2026-07-22',
        timetableCycleWeeks: 2,
        terms: JSON.parse(JSON.stringify(DEFAULT_TERMS)),
        periods: JSON.parse(JSON.stringify(DEFAULT_PERIODS)),
        classes: JSON.parse(JSON.stringify(DEFAULT_CLASSES)),
        events: JSON.parse(JSON.stringify(DEFAULT_EVENTS)),
        timetableSlots: JSON.parse(JSON.stringify(DEFAULT_TIMETABLE_SLOTS)),
        lessonPlans: JSON.parse(JSON.stringify(DEFAULT_LESSON_PLANS))
      };
    }

    indicateSaveStatus(status) {
      if (typeof document === 'undefined') return;
      const dot = document.getElementById('storage-status-dot');
      const label = document.getElementById('storage-status-label');
      if (dot && label) {
        if (status === 'saving') {
          dot.className = 'storage-dot saving';
          label.textContent = 'Saving...';
        } else if (status === 'saved') {
          dot.className = 'storage-dot';
          label.textContent = 'Saved';
        } else if (status === 'error') {
          dot.className = 'storage-dot';
          dot.style.background = '#ef4444';
          label.textContent = 'Storage Error';
        }
      }
    }

    async updateStorageUI() {
      if (typeof document === 'undefined') return;
      const badge = document.getElementById('storage-persist-badge');
      const protStatus = document.getElementById('storage-protection-status');
      const usageStatus = document.getElementById('storage-usage-status');
      const engineStatus = document.getElementById('storage-engine-status');

      const persisted = await PersistentStorageManager.checkPersistence();
      this.isPersisted = persisted;

      if (badge) {
        if (persisted) {
          badge.textContent = '🛡️ Protected (Persistent)';
          badge.style.color = '#10b981';
          badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
          badge.style.background = 'rgba(16, 185, 129, 0.1)';
        } else {
          badge.textContent = '⚡ Standard (Best-Effort)';
          badge.style.color = 'var(--text-muted)';
          badge.style.borderColor = 'var(--border-color)';
          badge.style.background = 'var(--bg-surface)';
        }
      }

      if (protStatus) {
        protStatus.textContent = persisted
          ? 'Guaranteed (Immune to browser auto-cleanup)'
          : 'Standard (May be cleared if device storage is low)';
        protStatus.style.color = persisted ? '#10b981' : 'var(--text-muted)';
      }

      if (engineStatus) {
        const idbAvailable = (typeof indexedDB !== 'undefined');
        engineStatus.textContent = idbAvailable
          ? 'LocalStorage + IndexedDB (Dual Redundancy)'
          : 'LocalStorage Active';
      }

      if (usageStatus) {
        const estimate = await PersistentStorageManager.getStorageEstimate();
        if (estimate && typeof estimate.usage === 'number') {
          const usedKB = (estimate.usage / 1024).toFixed(1);
          const totalMB = estimate.quota ? (estimate.quota / (1024 * 1024)).toFixed(0) : 'N/A';
          usageStatus.textContent = `Used: ~${usedKB} KB (Quota: ~${totalMB} MB)`;
        } else {
          try {
            const str = (typeof localStorage !== 'undefined') ? (localStorage.getItem(STORAGE_KEY) || '') : '';
            const kb = (new Blob([str]).size / 1024).toFixed(1);
            usageStatus.textContent = `Used: ~${kb} KB`;
          } catch(e) {
            usageStatus.textContent = 'Active';
          }
        }
      }
    }

    saveState() {
      this.indicateSaveStatus('saving');

      // 1. Synchronous localStorage write
      let localOk = false;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
          localOk = true;
        }
      } catch (err) {
        console.error('Error saving state to localStorage', err);
        if (err.name === 'QuotaExceededError' || err.code === 22) {
          if (typeof showToastNotification === 'function') {
            showToastNotification('⚠️ LocalStorage quota reached. Saving to persistent IndexedDB.');
          }
        }
      }

      // 2. Asynchronous IndexedDB persistent write
      PersistentStorageManager.saveToIndexedDB(this.data).then(dbOk => {
        setTimeout(() => {
          this.indicateSaveStatus('saved');
        }, 300);
      }).catch(() => {
        this.indicateSaveStatus(localOk ? 'saved' : 'error');
      });
    }

    resetToDefault() {
      this.data = this.getDefaultState();
      this.saveState();
    }

    // Requirement 6: Clear all placeholder data post-tutorial for clean slate
    clearAllPlaceholderData() {
      this.data.events = [];
      this.data.classes = [];
      this.data.timetableSlots = {};
      this.data.lessonPlans = {};
      this.data.tutorialCompleted = true;
      this.saveState();
    }

    get theme() { return this.data.theme || 'light'; }
    setTheme(newTheme) {
      this.data.theme = newTheme;
      this.saveState();
    }

    get accent() { return this.data.accent || 'blue'; }
    setAccent(newAccent) {
      this.data.accent = newAccent;
      this.saveState();
    }

    toggleLessonPin(classId, lessonId, targetDate = null, targetPeriodId = null) {
      if (!classId || !lessonId) return;
      const lessons = this.data.lessonPlans[classId] || [];
      const lesson = lessons.find(l => l.id === lessonId);
      if (!lesson) return;

      if (lesson.isPinned) {
        lesson.isPinned = false;
        delete lesson.pinnedDate;
        delete lesson.pinnedPeriodId;
        delete lesson.pinnedSlotKey;
        showToastNotification(`📌 Unpinned "${lesson.title}"`);
      } else {
        lesson.isPinned = true;
        if (targetDate) lesson.pinnedDate = targetDate;
        if (targetPeriodId) lesson.pinnedPeriodId = targetPeriodId;
        if (lesson.pinnedDate && lesson.pinnedPeriodId) {
          lesson.pinnedSlotKey = `${lesson.pinnedDate}_${lesson.pinnedPeriodId}`;
        }
        showToastNotification(`📌 Pinned "${lesson.title}" to ${TermManager.formatDisplayDate(lesson.pinnedDate || 'Date')}`);
      }

      this.saveState();
      refreshAllViews(false, true);
    }

    get terms() { return this.data.terms; }
    get events() { return this.data.events; }

    get academicYear() {
      if (this.data.academicYear) return parseInt(this.data.academicYear, 10);
      if (this.data.terms && this.data.terms.length > 0 && this.data.terms[0].startDate) {
        return parseInt(this.data.terms[0].startDate.substring(0, 4), 10) || 2026;
      }
      return 2026;
    }

    setAcademicYear(newYear) {
      const yrStr = String(newYear);
      this.data.academicYear = parseInt(newYear, 10);

      if (this.data.terms) {
        this.data.terms.forEach(term => {
          if (term.startDate) {
            term.startDate = term.startDate.replace(/^\d{4}/, yrStr);
          }
          if (term.endDate) {
            term.endDate = term.endDate.replace(/^\d{4}/, yrStr);
          }
        });
      }

      if (this.data.currentDate) {
        this.data.currentDate = this.data.currentDate.replace(/^\d{4}/, yrStr);
      }

      this.saveState();
    }
    get classes() { return this.data.classes; }
    get periods() { return this.data.periods; }
    get timetableSlots() { return this.data.timetableSlots; }
    get lessonPlans() { return this.data.lessonPlans; }
    get timetableCycleWeeks() { return this.data.timetableCycleWeeks || 2; }
    get currentDate() { return this.data.currentDate || '2026-07-22'; }
    get timeFormat() { return this.data.timeFormat || '12h'; }

    setCurrentDate(dateStr) {
      this.data.currentDate = dateStr;
      this.saveState();
    }

    setTimeFormat(format) {
      this.data.timeFormat = format;
      this.saveState();
    }

    setTimetableCycleWeeks(weeks) {
      this.data.timetableCycleWeeks = parseInt(weeks, 10) || 1;
      this.saveState();
    }

    findOrCreateClassByName(nameStr, details = '', color = null) {
      const trimmed = nameStr.trim();
      if (!trimmed) return null;
      let existing = this.classes.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
      if (existing) {
        if (!existing.details && details) existing.details = details;
        if (!existing.color && color) existing.color = color;
        this.saveState();
        return existing;
      }

      const colorIndex = this.classes.length % PALETTE.length;
      const newClass = {
        id: `c_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        name: trimmed,
        subject: trimmed,
        color: color || PALETTE[colorIndex],
        details: details || ''
      };
      this.data.classes.push(newClass);
      this.saveState();
      return newClass;
    }

    deleteClassById(classId) {
      this.data.classes = this.classes.filter(c => c.id !== classId);
      delete this.data.lessonPlans[classId];
      // Clean timetable slots assigned to this class
      for (const slotKey in this.data.timetableSlots) {
        if (this.data.timetableSlots[slotKey] === classId) {
          delete this.data.timetableSlots[slotKey];
        }
      }
      this.saveState();
    }

    // Linked Classes Helper Methods
    getLinkedClasses(classId) {
      const classObj = this.classes.find(c => c.id === classId);
      if (!classObj || !Array.isArray(classObj.linkedClassIds)) return [];
      return this.classes.filter(c => classObj.linkedClassIds.includes(c.id));
    }

    linkClasses(classIdA, classIdB) {
      if (classIdA === classIdB) return;
      const cA = this.classes.find(c => c.id === classIdA);
      const cB = this.classes.find(c => c.id === classIdB);
      if (!cA || !cB) return;

      if (!Array.isArray(cA.linkedClassIds)) cA.linkedClassIds = [];
      if (!Array.isArray(cB.linkedClassIds)) cB.linkedClassIds = [];

      if (!cA.linkedClassIds.includes(classIdB)) cA.linkedClassIds.push(classIdB);
      if (!cB.linkedClassIds.includes(classIdA)) cB.linkedClassIds.push(classIdA);

      this.saveState();
    }

    unlinkClasses(classIdA, classIdB) {
      const cA = this.classes.find(c => c.id === classIdA);
      const cB = this.classes.find(c => c.id === classIdB);
      if (cA && Array.isArray(cA.linkedClassIds)) {
        cA.linkedClassIds = cA.linkedClassIds.filter(id => id !== classIdB);
      }
      if (cB && Array.isArray(cB.linkedClassIds)) {
        cB.linkedClassIds = cB.linkedClassIds.filter(id => id !== classIdA);
      }
      this.saveState();
    }

    syncLinkedLesson(sourceClassId, sourceLesson, targetClassId) {
      this.syncLinkedLessonWithOptions(sourceClassId, sourceLesson, targetClassId, { classwork: true, titles: true, content: true });
    }

    syncLinkedLessonWithOptions(sourceClassId, sourceLesson, targetClassId, options = { classwork: true, titles: true, content: true }) {
      if (!sourceLesson || !targetClassId || sourceClassId === targetClassId) return;
      if (!this.data.lessonPlans[targetClassId]) {
        this.data.lessonPlans[targetClassId] = [];
      }

      const targetLessons = this.data.lessonPlans[targetClassId];
      let targetLesson = targetLessons.find(l => l.title.trim().toLowerCase() === sourceLesson.title.trim().toLowerCase() || l.id === sourceLesson.id);

      if (targetLesson) {
        if (options.titles) {
          targetLesson.title = sourceLesson.title;
          targetLesson.unit = sourceLesson.unit || 'General Curriculum';
        }
        if (options.content) {
          targetLesson.content = sourceLesson.content || '';
        }
        if (options.classwork) {
          targetLesson.classwork = JSON.parse(JSON.stringify(sourceLesson.classwork || []));
        }
        targetLesson.isFloat = sourceLesson.isFloat || false;
        targetLesson.isRevision = sourceLesson.isRevision || false;
      } else {
        const newLinkedLesson = {
          id: `l_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          title: sourceLesson.title,
          unit: sourceLesson.unit || 'General Curriculum',
          content: options.content ? (sourceLesson.content || '') : '',
          classwork: options.classwork ? JSON.parse(JSON.stringify(sourceLesson.classwork || [])) : [],
          isFloat: sourceLesson.isFloat || false,
          isRevision: sourceLesson.isRevision || false
        };
        targetLessons.push(newLinkedLesson);
      }
      this.saveState();
    }

    syncAllLinkedLessons(sourceClassId, targetClassId) {
      this.syncAllLinkedLessonsWithOptions(sourceClassId, targetClassId, { classwork: true, titles: true, content: true }, false);
    }

    syncAllLinkedLessonsWithOptions(sourceClassId, targetClassId, options = { classwork: true, titles: true, content: true }, filterAfterLockThreshold = false) {
      const sourceLessons = this.data.lessonPlans[sourceClassId] || [];
      const currentDateStr = this.currentDate;

      let lessonsToSync = sourceLessons;

      if (filterAfterLockThreshold) {
        const { schedule } = Scheduler.generateScheduleForClass(sourceClassId);
        const validLessonIds = new Set();
        schedule.forEach(entry => {
          if (entry.slot && entry.slot.date >= currentDateStr && entry.lesson) {
            validLessonIds.add(entry.lesson.id);
          }
        });
        lessonsToSync = sourceLessons.filter(l => validLessonIds.has(l.id));
      }

      lessonsToSync.forEach(sourceLesson => {
        this.syncLinkedLessonWithOptions(sourceClassId, sourceLesson, targetClassId, options);
      });
      this.saveState();
    }
  }

  const state = new StateStore();

  // Helper for 12h / 24h Time Inputs (Req 2)
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

  function getWeekLetter(weekNum) {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const idx = (weekNum - 1) % letters.length;
    return `Week ${letters[idx]}`;
  }

  function parseLocalDate(dateStr) {
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
  }

  function formatLocalDate(d) {
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
  }

  function getTermWeekNumber(dateStr) {
    const term = TermManager.getTermForDate(dateStr);
    if (!term) return '';
    const termStart = TermManager.parseLocalDate(term.startDate);
    const current = TermManager.parseLocalDate(dateStr);
    if (!termStart || !current) return '';
    const diffDays = Math.round((current - termStart) / (1000 * 60 * 60 * 24));
    const weekNum = Math.floor(diffDays / 7) + 1;
    return `${term.name}, Week ${weekNum}`;
  }

  const TermManager = {
    parseLocalDate(dateStr) {
      return parseLocalDate(dateStr);
    },

    formatLocalDate(d) {
      return formatLocalDate(d);
    },

    getTermForDate(dateStr) {
      if (!dateStr) return null;
      const target = parseLocalDate(dateStr);
      if (!target) return null;
      for (const term of state.terms) {
        const start = parseLocalDate(term.startDate);
        const end = parseLocalDate(term.endDate);
        if (start && end && target >= start && target <= end) return term;
      }
      return null;
    },

    formatDisplayDate(dateStr) {
      if (!dateStr) return '';
      const d = parseLocalDate(dateStr);
      if (!d) return '';
      return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    },

    getAllTermSchoolDays() {
      const schoolDays = [];
      state.terms.forEach(term => {
        const current = parseLocalDate(term.startDate);
        const end = parseLocalDate(term.endDate);
        if (!current || !end) return;

        while (current <= end) {
          const dayOfWeek = current.getDay();
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const dateStr = formatLocalDate(current);
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

  const TimetableManager = {
    getWeekCycleNumber(dateStr) {
      const term = TermManager.getTermForDate(dateStr);
      if (!term) return 1;
      const termStart = TermManager.parseLocalDate(term.startDate);
      const targetDate = TermManager.parseLocalDate(dateStr);
      if (!termStart || !targetDate) return 1;

      const diffTime = Math.abs(targetDate - termStart);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(diffDays / 7);
      const cycleWeeks = state.timetableCycleWeeks || 2;
      return (weekIndex % cycleWeeks) + 1;
    },

    getSlotKey(weekCycleNum, dayOfWeek, periodId) {
      return `${weekCycleNum}_${dayOfWeek}_${periodId}`;
    },

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

  const Scheduler = {
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

    /**
     * Helper: Prioritize content lessons and explicitly placed Floats over Revision lessons when slot capacity is tight.
     * Order of elimination:
     * Pass 1: Omit Float lessons (`isFloat`) FIRST working backwards from test milestone.
     * Pass 2: Omit Revision lessons (`isRevision`) SECOND working backwards from test milestone.
     * Pass 3: Combine/Merge adjacent regular Content lessons into single period slots THIRD if capacity is still exceeded!
     */
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

    /**
     * Determine action type for a calendar slot:
     * Returns: { type: 'REMOVE_FLOAT' | 'REVISION_SHIFT' | 'FLOAT' | 'MAX_CAPACITY', targetRevisionId, message }
     */
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

  // UI Modules
  const CalendarUI = {
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
                <div style="font-size:0.78rem; color:var(--text-muted);">Changing the school year shifts all term dates automatically.</div>
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
      const handleYearChange = (newYear) => {
        const yr = parseInt(newYear, 10);
        if (!isNaN(yr) && yr >= 2020 && yr <= 2035) {
          state.setAcademicYear(yr);
          updateCurrentDateDisplay();
          refreshAllViews(false, true);
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
            term[field] = e.target.value;
            state.saveState();
            refreshAllViews(false, true);
          }
        }
      });

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
          refreshAllViews(false, true);
        }
      });

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
      const classSelect = document.getElementById('event-class-select');
      if (classSelect) {
        classSelect.innerHTML = `<option value="">All Classes (Whole School)</option>` +
          state.classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      }
      modalBackdrop.classList.add('active');
    }
  };

  const TimetableUI = {
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
        const label = getWeekLetter(w);
        const activeClass = w === this.currentWeekTab ? 'active' : '';
        html += `<button class="week-tab-btn ${activeClass}" data-week="${w}">${label}</button>`;
      }
      container.innerHTML = html;

      const cycleSelect = document.getElementById('timetable-cycle-select');
      if (cycleSelect) cycleSelect.value = cycleWeeks;
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
                <div class="period-name">${period.name}</div>
                <div class="period-time">${formattedTime}</div>
              </td>
              <td colspan="5">${period.name} (${formattedTime})</td>
            </tr>
          `;
        } else {
          html += `
            <tr>
              <td class="period-header-col">
                <div class="period-name">${period.name}</div>
                <div class="period-time">${formattedTime}</div>
              </td>
          `;

          for (let dayIdx = 1; dayIdx <= 5; dayIdx++) {
            const assignedClass = TimetableManager.getClassForSlot(week, dayIdx, period.id);

            if (assignedClass) {
              const detailsHtml = assignedClass.details ? `<div class="tt-class-details">${assignedClass.details}</div>` : '';
              const textColor = getReadableClassTextColor(assignedClass.color);
              html += `
                <td class="tt-cell" data-week="${week}" data-day="${dayIdx}" data-period="${period.id}"
                    style="background:${assignedClass.color}22 !important; border:2px solid ${assignedClass.color} !important; text-align:center; vertical-align:middle; padding:6px 4px;">
                  <div class="tt-class-name" style="color:${textColor}; font-weight:800; font-size:1.05rem;">${assignedClass.name}</div>
                  ${detailsHtml}
                </td>
              `;
            } else {
              html += `
                <td class="tt-cell" data-week="${week}" data-day="${dayIdx}" data-period="${period.id}">
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

    bindEvents() {
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
          refreshAllViews(false, true);
        });
      }

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

      document.getElementById('slot-modal-title').textContent = `Assign ${days[day]} Period ${periodObj ? periodObj.name : ''} (${getWeekLetter(week)})`;

      const datalist = document.getElementById('class-autocomplete-list');
      if (datalist) {
        datalist.innerHTML = state.classes.map(c => `<option value="${c.name}">`).join('');
      }

      const input = document.getElementById('slot-class-input');
      const detailsInput = document.getElementById('slot-class-details-input');
      const colorInput = document.getElementById('slot-class-color-input');

      const initialClassName = currentClass ? currentClass.name.toLowerCase() : '';
      if (input) input.value = currentClass ? currentClass.name : '';
      if (detailsInput) detailsInput.value = currentClass ? (currentClass.details || '') : '';
      if (colorInput) colorInput.value = currentClass ? currentClass.color : '#3b82f6';

      // Auto-fill color and room details when typing or selecting an existing class
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

  const LessonUI = {
    selectedClassId: null,
    collapsedTopics: {},

    init() {
      if (state.classes.length > 0 && !this.selectedClassId) {
        this.selectedClassId = state.classes[0].id;
      }
      this.renderClassSelector();
      this.renderLessonList();
      this.bindEvents();
    },

    renderClassSelector() {
      const container = document.getElementById('lesson-class-selector');
      if (!container) return;

      if (state.classes.length === 0) {
        container.innerHTML = `<div style="padding:1rem; color:var(--text-dim); font-size:0.85rem;">No classes added yet. Create a class in the Timetable tab.</div>`;
        return;
      }

      container.innerHTML = state.classes.map(c => {
        const activeClass = c.id === this.selectedClassId ? 'active' : '';
        const count = (state.lessonPlans[c.id] || []).length;
        const linkedClasses = state.getLinkedClasses(c.id);
        const linkedBadge = linkedClasses.length > 0 ? `<div style="font-size:0.72rem; color:#38bdf8; font-weight:700; margin-top:2px;">🔗 Linked: ${linkedClasses.map(l => l.name).join(', ')}</div>` : '';

        return `
          <div class="class-item-wrapper">
            <button class="class-item-btn ${activeClass}" data-id="${c.id}">
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <div style="width:12px; height:12px; border-radius:50%; background:${c.color};"></div>
                <div>
                  <div>${c.name}</div>
                  ${linkedBadge}
                  ${c.details ? `<div style="font-size:0.75rem; color:var(--text-muted);">${c.details}</div>` : ''}
                </div>
              </div>
              <div class="class-stats">${count} Lessons</div>
            </button>
            <!-- Requirement 6: Delete class button -->
            <button class="btn btn-danger btn-sm delete-class-btn" data-id="${c.id}" title="Delete class and curriculum">🗑️</button>
          </div>
        `;
      }).join('');
    },

    openLinkClassesModal() {
      if (!this.selectedClassId && state.classes && state.classes.length > 0) {
        this.selectedClassId = state.classes[0].id;
      }
      const backdrop = document.getElementById('modal-link-classes-backdrop');
      if (!backdrop) return;
      this.renderLinkClassesModalBody();
      backdrop.classList.add('active');
    },

    renderLinkClassesModalBody() {
      const bodyContainer = document.getElementById('link-classes-body');
      if (!bodyContainer) return;

      if (!this.selectedClassId && state.classes && state.classes.length > 0) {
        this.selectedClassId = state.classes[0].id;
      }

      const currentClass = state.classes.find(c => c.id === this.selectedClassId);
      if (!currentClass) {
        bodyContainer.innerHTML = '<div style="color:var(--text-dim);">Select a class first.</div>';
        return;
      }

      const otherClasses = state.classes.filter(c => c.id !== this.selectedClassId);
      if (otherClasses.length === 0) {
        bodyContainer.innerHTML = '<div style="color:var(--text-dim); padding:1rem; text-align:center;">Create at least one other class in "2. Timetable Rotation" to enable class linking.</div>';
        return;
      }

      const currentLinked = currentClass.linkedClassIds || [];

      let html = `
        <div style="font-weight:700; font-size:0.9rem; color:var(--primary); margin-bottom:0.5rem; display:flex; align-items:center; gap:0.5rem;">
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${currentClass.color};"></span>
          <span>Select classes linked with ${currentClass.name}:</span>
        </div>
      `;

      otherClasses.forEach(c => {
        const isChecked = currentLinked.includes(c.id);
        html += `
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); padding:0.75rem 1rem; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${c.color};"></span>
              <span style="font-weight:700; font-size:0.9rem;">${c.name}</span>
              <span style="font-size:0.75rem; color:var(--text-muted);">(${c.subject || 'General'})</span>
            </div>
            <label style="margin:0; cursor:pointer; display:flex; align-items:center; gap:0.4rem; font-size:0.85rem; font-weight:700; color:var(--primary);">
              <input type="checkbox" class="chk-link-class" data-target-id="${c.id}" ${isChecked ? 'checked' : ''}>
              <span>${isChecked ? '🔗 Linked' : 'Link Class'}</span>
            </label>
          </div>
        `;
      });

      bodyContainer.innerHTML = html;
    },

    updateSyncLinkedCheckboxInModal() {
      const group = document.getElementById('lesson-sync-linked-group');
      const label = document.getElementById('lesson-sync-linked-label');
      const syncBtn = document.getElementById('btn-sync-lesson-now');

      const linked = state.getLinkedClasses(this.selectedClassId);
      if (linked.length > 0) {
        const names = linked.map(l => l.name).join(', ');
        if (group) group.style.display = 'flex';
        if (label) label.textContent = `🔗 Linked Parallel Class(es): ${names}`;
        if (syncBtn) {
          syncBtn.disabled = false;
          syncBtn.innerHTML = `🔄 Sync Lesson to ${names}`;
          syncBtn.style.opacity = '1';
          syncBtn.style.cursor = 'pointer';
        }
      } else {
        if (group) group.style.display = 'none';
      }
      this.bindModalInputListeners();
    },

    syncCurrentModalLesson() {
      const classId = this.selectedClassId;
      if (!classId) return;

      const lessonId = document.getElementById('lesson-id-input').value;
      const title = document.getElementById('lesson-title-input').value.trim();
      const unit = document.getElementById('lesson-unit-input').value;
      const content = document.getElementById('lesson-content-input').value;
      const floatCheck = document.getElementById('lesson-float-check');
      const revisionCheck = document.getElementById('lesson-revision-check');
      const isFloat = floatCheck ? floatCheck.checked : false;
      const isRevision = revisionCheck ? revisionCheck.checked : false;

      if (!title) {
        alert('Please enter a lesson title before syncing.');
        return;
      }

      const classwork = this.readClassworkInputsFromModal();

      const currentLesson = {
        id: lessonId || `l_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: title,
        unit: unit || 'General Curriculum',
        content: content || '',
        classwork: classwork,
        isFloat: isFloat,
        isRevision: isRevision
      };

      const linkedClasses = state.getLinkedClasses(classId);
      if (linkedClasses.length === 0) return;

      linkedClasses.forEach(targetClass => {
        state.syncLinkedLesson(classId, currentLesson, targetClass.id);
      });

      const linkedNames = linkedClasses.map(l => l.name).join(', ');
      showToastNotification(`✅ Synced "${title}" to ${linkedNames}!`);

      const syncBtn = document.getElementById('btn-sync-lesson-now');
      if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.innerHTML = `✅ Synced to ${linkedNames}`;
        syncBtn.style.opacity = '0.6';
        syncBtn.style.cursor = 'not-allowed';
      }

      refreshAllViews(false, true);
    },

    bindModalInputListeners() {
      const modal = document.getElementById('modal-lesson-backdrop');
      if (!modal || modal._hasInputListeners) return;
      modal._hasInputListeners = true;

      modal.addEventListener('input', () => {
        const syncBtn = document.getElementById('btn-sync-lesson-now');
        if (syncBtn && syncBtn.disabled) {
          const linked = state.getLinkedClasses(this.selectedClassId);
          if (linked.length > 0) {
            const names = linked.map(l => l.name).join(', ');
            syncBtn.disabled = false;
            syncBtn.innerHTML = `🔄 Sync Lesson to ${names}`;
            syncBtn.style.opacity = '1';
            syncBtn.style.cursor = 'pointer';
          }
        }
      });
    },

    openSyncOptionsModal() {
      if (!this.selectedClassId && state.classes && state.classes.length > 0) {
        this.selectedClassId = state.classes[0].id;
      }
      const linked = state.getLinkedClasses(this.selectedClassId);
      const sourceClass = state.classes.find(c => c.id === this.selectedClassId);
      const sourceClassName = sourceClass ? sourceClass.name : 'this class';

      if (linked.length === 0) {
        alert(`No linked classes configured for ${sourceClassName}. Click "🔗 Manage Class Links" in the sidebar to link parallel classes.`);
        return;
      }

      const backdrop = document.getElementById('modal-sync-options-backdrop');
      const subtitle = document.getElementById('sync-modal-subtitle');
      if (subtitle) {
        const names = linked.map(l => l.name).join(', ');
        subtitle.textContent = `Select content and date scope to sync from ${sourceClassName} to ${names}.`;
      }
      if (backdrop) backdrop.classList.add('active');
    },

    executeSyncOptions() {
      const classId = this.selectedClassId;
      if (!classId) return;

      const linked = state.getLinkedClasses(classId);
      if (linked.length === 0) return;

      const syncOptClasswork = document.getElementById('sync-opt-classwork')?.checked ?? true;
      const syncOptTitles = document.getElementById('sync-opt-titles')?.checked ?? true;
      const syncOptContent = document.getElementById('sync-opt-content')?.checked ?? true;

      const scopeRadio = document.querySelector('input[name="sync-scope"]:checked');
      const filterAfterLockThreshold = scopeRadio ? scopeRadio.value === 'future' : false;

      const options = {
        classwork: syncOptClasswork,
        titles: syncOptTitles,
        content: syncOptContent
      };

      linked.forEach(targetClass => {
        state.syncAllLinkedLessonsWithOptions(classId, targetClass.id, options, filterAfterLockThreshold);
      });

      const linkedNames = linked.map(l => l.name).join(', ');
      const backdrop = document.getElementById('modal-sync-options-backdrop');
      if (backdrop) backdrop.classList.remove('active');

      showToastNotification(`✅ Synced curriculum options to ${linkedNames}!`);
      this.renderClassSelector();
      this.renderLessonList();
      refreshAllViews(false, true);
    },

    renderLessonList() {
      const container = document.getElementById('lesson-list-container');
      if (!container) return;

      if (!this.selectedClassId || state.classes.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-dim);">Select or create a class to manage lessons.</div>`;
        return;
      }

      const lessons = state.lessonPlans[this.selectedClassId] || [];

      if (lessons.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-dim);">No lesson plans added for this class yet. Click "Add Lesson Plan" above.</div>`;
        return;
      }

      // Group consecutive lessons by unit / topic
      const topicGroups = [];
      let currentGroup = null;

      lessons.forEach((lesson, originalIndex) => {
        const unitName = (lesson.unit || 'General Curriculum').trim();
        if (!currentGroup || currentGroup.unitName !== unitName) {
          currentGroup = {
            unitName: unitName,
            items: []
          };
          topicGroups.push(currentGroup);
        }
        currentGroup.items.push({ lesson, originalIndex });
      });

      let html = '';

      topicGroups.forEach((group) => {
        const topicKey = `${this.selectedClassId}_${group.unitName}`;
        const isCollapsed = !!this.collapsedTopics[topicKey];
        const count = group.items.length;
        const startNum = group.items[0].originalIndex + 1;
        const endNum = group.items[group.items.length - 1].originalIndex + 1;
        const numLabel = count === 1 ? `Lesson #${startNum}` : `Lessons #${startNum}–#${endNum}`;

        const otherClasses = state.classes.filter(c => c.id !== this.selectedClassId);

        let copyMenuHtml = '';
        if (otherClasses.length === 0) {
          copyMenuHtml = `<div style="padding:0.4rem 0.75rem; font-size:0.75rem; color:var(--text-dim); font-style:italic;">No other classes created</div>`;
        } else {
          copyMenuHtml = otherClasses.map(c => `
            <button type="button" class="copy-unit-target-btn" data-unit="${group.unitName}" data-target-id="${c.id}" 
                    style="width:100%; text-align:left; background:transparent; border:none; padding:0.45rem 0.75rem; font-size:0.78rem; color:var(--text-main); font-weight:600; display:flex; align-items:center; gap:0.5rem; cursor:pointer; border-radius:4px; transition:background 0.15s ease;"
                    onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='transparent'">
              <span style="width:10px; height:10px; border-radius:50%; background:${c.color}; flex-shrink:0;"></span>
              <span>${c.name}</span>
            </button>
          `).join('');
        }

        html += `
          <div class="topic-group-container">
            <div class="topic-group-header ${isCollapsed ? 'collapsed' : ''}" data-topic-key="${topicKey}">
              <div class="topic-group-title">
                <span class="topic-toggle-icon">${isCollapsed ? '▶' : '▼'}</span>
                <span>📂 ${group.unitName}</span>
                <span class="topic-count-badge">${count} ${count === 1 ? 'Lesson' : 'Lessons'} (${numLabel})</span>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <div class="copy-unit-wrapper" style="position:relative; display:inline-block;">
                  <button type="button" class="btn btn-secondary btn-xs copy-unit-btn" data-unit="${group.unitName}" title="Copy all lessons in this unit to another class" style="font-size:0.72rem; padding:0.15rem 0.5rem; line-height:1.2; font-weight:600;">📋 Copy Unit to Class ▼</button>
                  <div class="copy-unit-dropdown" style="display:none; position:absolute; right:0; top:100%; margin-top:4px; background:#0f172a !important; opacity:1 !important; border:1px solid var(--border-color); border-radius:var(--radius-md); box-shadow:0 12px 30px rgba(0,0,0,0.85); z-index:500; min-width:190px; padding:0.35rem 0;">
                    <div style="font-size:0.72rem; font-weight:700; color:var(--text-muted); padding:0.35rem 0.75rem; border-bottom:1px solid var(--border-color); margin-bottom:0.2rem;">Copy Unit to Class:</div>
                    ${copyMenuHtml}
                  </div>
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">
                  ${isCollapsed ? '▶ Click to Expand' : '▼ Click to Collapse'}
                </div>
              </div>
            </div>
            <div class="topic-group-body ${isCollapsed ? 'collapsed' : ''}">
        `;

        group.items.forEach(({ lesson, originalIndex }) => {
          const isFloat = lesson.isFloat;
          const isRevision = lesson.isRevision;
          const isMerged = lesson.isMerged;
          const isTest = lesson.isTestMilestone;

          let tagsHtml = '';
          if (lesson.isPinned) tagsHtml += `<span class="tag tag-pinned" data-class="${this.selectedClassId}" data-id="${lesson.id}" style="cursor:pointer;" title="Click to unpin this lesson">📌 Pinned: ${TermManager.formatDisplayDate(lesson.pinnedDate)} ✕</span> `;
          if (isRevision) tagsHtml += `<span class="tag tag-revision">⭐ Revision</span> `;
          if (isFloat) tagsHtml += `<span class="tag tag-float">🎈 Float</span> `;
          if (isTest) tagsHtml += `<span class="tag tag-test">🎯 Test: ${lesson.testDate || 'Set Date'}</span> `;
          if (lesson.classwork && Array.isArray(lesson.classwork) && lesson.classwork.length > 0) {
            tagsHtml += `<span class="tag" style="background:rgba(59,130,246,0.2); color:#60a5fa; border:1px solid rgba(59,130,246,0.4);">📚 ${lesson.classwork.length} Task${lesson.classwork.length > 1 ? 's' : ''}</span> `;
          }

          html += `
            <div class="lesson-card ${isFloat ? 'is-float' : ''} ${isRevision ? 'is-revision' : ''} ${isMerged ? 'is-merged' : ''} ${lesson.isTestMilestone ? 'is-test' : ''}" 
                 data-id="${lesson.id}" data-index="${originalIndex}" draggable="true">
              <div class="lesson-main-info">
                <span class="drag-handle" title="Drag to reorder lesson sequence">⣿</span>
                <div class="lesson-num">${originalIndex + 1}</div>
                <div class="lesson-details">
                  <div class="lesson-title">${lesson.title}</div>
                  <div class="lesson-unit">📂 ${lesson.unit || 'General Curriculum'} ${tagsHtml}</div>
                </div>
              </div>
              <div class="lesson-actions">
                <button class="btn btn-secondary btn-sm view-lesson-btn" data-id="${lesson.id}" title="View lesson details and copy notes">👁️ View</button>
                <button class="btn btn-secondary btn-sm edit-lesson-btn" data-id="${lesson.id}" title="Edit lesson plan">✏️ Edit</button>
                <button class="btn btn-secondary btn-sm toggle-pin-btn" data-id="${lesson.id}" title="Pin to date or unpin">
                  ${lesson.isPinned ? '📌 Unpin' : '📌 Pin'}
                </button>
                <button class="btn btn-secondary btn-sm duplicate-lesson-btn" data-id="${lesson.id}" title="Duplicate this lesson plan">📄 Duplicate</button>
                <button class="btn btn-secondary btn-sm toggle-float-btn" data-id="${lesson.id}" title="Float lessons are pruned FIRST during pacing conflicts">
                  ${isFloat ? 'Remove Float Tag' : '🎈 Tag Float'}
                </button>
                <button class="btn btn-secondary btn-sm toggle-revision-btn" data-id="${lesson.id}" title="Revision lessons are pruned SECOND during pacing conflicts">
                  ${isRevision ? 'Remove Revision Tag' : '⭐ Tag Revision'}
                </button>
                <button class="btn btn-danger btn-sm delete-lesson-btn" data-id="${lesson.id}">🗑️</button>
              </div>
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
      this.bindDragEvents();
      this.bindTopicToggleEvents();
      this.bindUnitCopyEvents();
      this.bindLessonDuplicateEvents();
    },

    bindUnitCopyEvents() {
      const container = document.getElementById('lesson-list-container');
      if (!container || container._hasUnitCopyListener) return;
      container._hasUnitCopyListener = true;

      // Close copy unit dropdowns on click outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.copy-unit-wrapper')) {
          container.querySelectorAll('.copy-unit-dropdown').forEach(d => d.style.display = 'none');
        }
      });

      container.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-unit-btn');
        if (copyBtn) {
          e.preventDefault();
          e.stopPropagation();
          const wrapper = copyBtn.closest('.copy-unit-wrapper');
          if (wrapper) {
            const dropdown = wrapper.querySelector('.copy-unit-dropdown');
            if (dropdown) {
              const isShown = dropdown.style.display === 'block';
              container.querySelectorAll('.copy-unit-dropdown').forEach(d => d.style.display = 'none');
              dropdown.style.display = isShown ? 'none' : 'block';
            }
          }
          return;
        }

        const targetBtn = e.target.closest('.copy-unit-target-btn');
        if (targetBtn) {
          e.preventDefault();
          e.stopPropagation();
          const unitName = targetBtn.getAttribute('data-unit');
          const targetClassId = targetBtn.getAttribute('data-target-id');
          const targetClass = state.classes.find(c => c.id === targetClassId);

          if (targetClass) {
            const currentLessons = state.lessonPlans[this.selectedClassId] || [];
            const unitLessons = currentLessons.filter(l => (l.unit || 'General Curriculum').trim() === unitName);

            if (!state.lessonPlans[targetClass.id]) {
              state.lessonPlans[targetClass.id] = [];
            }

            unitLessons.forEach(l => {
              const clone = JSON.parse(JSON.stringify(l));
              clone.id = `l_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
              state.lessonPlans[targetClass.id].push(clone);
            });

            state.saveState();
            refreshAllViews(false, true);

            const listContainer = document.getElementById('lesson-list-container');
            if (listContainer) {
              const alertBanner = document.createElement('div');
              alertBanner.style.cssText = 'background:rgba(16, 185, 129, 0.2); border:1px solid #10b981; color:#34d399; padding:0.6rem 1rem; border-radius:var(--radius-md); margin-bottom:1rem; font-weight:700; font-size:0.85rem;';
              alertBanner.innerHTML = `✅ Successfully copied unit "${unitName}" (${unitLessons.length} lessons) to ${targetClass.name}!`;
              listContainer.insertBefore(alertBanner, listContainer.firstChild);
              setTimeout(() => alertBanner.remove(), 4000);
            }
          }
        }
      });
    },

    bindLessonDuplicateEvents() {
      const container = document.getElementById('lesson-list-container');
      if (!container || container._hasDuplicateListener) return;
      container._hasDuplicateListener = true;

      container.addEventListener('click', (e) => {
        const dupBtn = e.target.closest('.duplicate-lesson-btn');
        if (dupBtn) {
          e.preventDefault();
          e.stopPropagation();
          const lessonId = dupBtn.getAttribute('data-id');
          const lessons = state.lessonPlans[this.selectedClassId] || [];
          const origIdx = lessons.findIndex(l => l.id === lessonId);

          if (origIdx >= 0) {
            const orig = lessons[origIdx];
            const duplicate = JSON.parse(JSON.stringify(orig));
            duplicate.id = `l_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            duplicate.title = `${orig.title} (Copy)`;

            lessons.splice(origIdx + 1, 0, duplicate);
            state.saveState();
            refreshAllViews(false, true);
          }
        }
      });
    },

    bindTopicToggleEvents() {
      const container = document.getElementById('lesson-list-container');
      if (!container) return;

      const headers = container.querySelectorAll('.topic-group-header');
      headers.forEach(header => {
        header.addEventListener('click', (e) => {
          if (e.target.closest('.copy-unit-btn')) return;
          const key = header.getAttribute('data-topic-key');
          this.collapsedTopics[key] = !this.collapsedTopics[key];
          this.renderLessonList();
        });
      });
    },

    toggleCollapseAllTopics() {
      const lessons = state.lessonPlans[this.selectedClassId] || [];
      if (lessons.length === 0) return;

      const units = new Set(lessons.map(l => (l.unit || 'General Curriculum').trim()));
      let hasUncollapsed = false;

      units.forEach(u => {
        const key = `${this.selectedClassId}_${u}`;
        if (!this.collapsedTopics[key]) hasUncollapsed = true;
      });

      units.forEach(u => {
        const key = `${this.selectedClassId}_${u}`;
        this.collapsedTopics[key] = hasUncollapsed;
      });

      this.renderLessonList();
    },

    bindDragEvents() {
      const container = document.getElementById('lesson-list-container');
      if (!container) return;

      const cards = container.querySelectorAll('.lesson-card');
      cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
          this.draggedIndex = parseInt(card.getAttribute('data-index'), 10);
          card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => {
          card.classList.remove('dragging');
          cards.forEach(c => c.classList.remove('drag-over'));
        });

        card.addEventListener('dragover', (e) => {
          e.preventDefault();
          card.classList.add('drag-over');
        });

        card.addEventListener('dragleave', () => {
          card.classList.remove('drag-over');
        });

        card.addEventListener('drop', (e) => {
          e.preventDefault();
          card.classList.remove('drag-over');
          const targetIndex = parseInt(card.getAttribute('data-index'), 10);
          if (this.draggedIndex !== null && this.draggedIndex !== targetIndex) {
            const lessons = state.lessonPlans[this.selectedClassId] || [];
            const [movedItem] = lessons.splice(this.draggedIndex, 1);
            lessons.splice(targetIndex, 0, movedItem);
            state.saveState();
            this.renderLessonList();
            refreshAllViews(false, true);
          }
        });
      });
    },

    initTestSlotPickers() {
      const termSelect = document.getElementById('lesson-test-term-select');
      const weekSelect = document.getElementById('lesson-test-week-select');
      const slotSelect = document.getElementById('lesson-test-slot-select');
      if (!termSelect || !weekSelect || !slotSelect) return;

      termSelect.innerHTML = state.terms.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

      const updateWeeks = () => {
        const termId = termSelect.value;
        const term = state.terms.find(t => t.id === termId) || state.terms[0];
        const numWeeks = term ? (term.weeks || 10) : 10;
        let weekHtml = '';
        for (let w = 1; w <= numWeeks; w++) {
          weekHtml += `<option value="${w}">Week ${w}</option>`;
        }
        weekSelect.innerHTML = weekHtml;
        this.updateTestSlotsForSelectedTermAndWeek();
      };

      termSelect.onchange = updateWeeks;
      weekSelect.onchange = () => this.updateTestSlotsForSelectedTermAndWeek();
      updateWeeks();
    },

    updateTestSlotsForSelectedTermAndWeek(selectedSlotKey = null) {
      const termSelect = document.getElementById('lesson-test-term-select');
      const weekSelect = document.getElementById('lesson-test-week-select');
      const slotSelect = document.getElementById('lesson-test-slot-select');
      if (!termSelect || !weekSelect || !slotSelect) return;

      const termId = termSelect.value;
      const weekNum = parseInt(weekSelect.value, 10);
      const classId = this.selectedClassId;

      const availableSlots = Scheduler.getAvailableSlots(classId).filter(s => {
        if (s.termId !== termId) return false;
        const term = state.terms.find(t => t.id === termId);
        if (!term) return false;
        const termStart = TermManager.parseLocalDate(term.startDate);
        const slotDate = TermManager.parseLocalDate(s.date);
        if (!termStart || !slotDate) return false;
        const diffDays = Math.round((slotDate - termStart) / (1000 * 60 * 60 * 24));
        const slotWeekNum = Math.floor(diffDays / 7) + 1;
        return slotWeekNum === weekNum;
      });

      if (availableSlots.length === 0) {
        slotSelect.innerHTML = `<option value="">No class slots on this week</option>`;
        return;
      }

      const daysMap = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      slotSelect.innerHTML = availableSlots.map(s => {
        const slotKey = `${s.date}_${s.periodId}`;
        const dayName = daysMap[s.dayOfWeek] || '';
        const displayLabel = `${dayName} ${s.periodName} (${TermManager.formatDisplayDate(s.date)})`;
        const selected = slotKey === selectedSlotKey ? 'selected' : '';
        return `<option value="${slotKey}" data-date="${s.date}" data-period="${s.periodId}" ${selected}>${displayLabel}</option>`;
      }).join('');
    },

    populateTestSlotOptions(classId, selectedSlotKey = null) {
      this.initTestSlotPickers();
      if (selectedSlotKey) {
        const availableSlots = Scheduler.getAvailableSlots(classId);
        const found = availableSlots.find(s => `${s.date}_${s.periodId}` === selectedSlotKey);
        if (found) {
          const termSelect = document.getElementById('lesson-test-term-select');
          const weekSelect = document.getElementById('lesson-test-week-select');
          if (termSelect) termSelect.value = found.termId;

          const term = state.terms.find(t => t.id === found.termId);
          if (term) {
            const termStart = TermManager.parseLocalDate(term.startDate);
            const slotDate = TermManager.parseLocalDate(found.date);
            if (termStart && slotDate) {
              const diffDays = Math.round((slotDate - termStart) / (1000 * 60 * 60 * 24));
              const slotWeekNum = Math.floor(diffDays / 7) + 1;
              if (weekSelect) weekSelect.value = slotWeekNum;
            }
          }
          this.updateTestSlotsForSelectedTermAndWeek(selectedSlotKey);
        }
      }
    },

    initRichToolbar() {
      const container = document.querySelector('.rich-toolbar');
      const textarea = document.getElementById('lesson-content-input');
      if (!container || !textarea || container._hasListener) return;
      container._hasListener = true;

      container.onclick = (e) => {
        const btn = e.target.closest('.rt-btn');
        if (!btn) return;
        const cmd = btn.getAttribute('data-cmd');

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const sel = textarea.value.substring(start, end);

        let replaceText = '';
        if (cmd === 'bold') {
          replaceText = `<strong>${sel || 'bold text'}</strong>`;
        } else if (cmd === 'italic') {
          replaceText = `<em>${sel || 'italic text'}</em>`;
        } else if (cmd === 'list') {
          replaceText = `\n<ul>\n  <li>${sel || 'Point 1'}</li>\n  <li>Point 2</li>\n</ul>\n`;
        } else if (cmd === 'highlight') {
          replaceText = `<span class="highlight-text">${sel || 'highlighted note'}</span>`;
        } else if (cmd === 'template') {
          replaceText = `<strong>🎯 Learning Intention:</strong>\n• \n\n<strong>📝 Lesson Activities:</strong>\n1. \n2. \n\n<strong>💡 Success Criteria / Notes:</strong>\n• `;
        }

        textarea.setRangeText(replaceText, start, end, 'select');
        textarea.focus();
      };
    },

    populateUnitAutocomplete() {
      const unitDatalist = document.getElementById('unit-autocomplete-list');
      if (!unitDatalist) return;
      const allLessons = Object.values(state.lessonPlans).flat();
      const uniqueUnits = [...new Set(allLessons.map(l => l.unit).filter(Boolean))];
      unitDatalist.innerHTML = uniqueUnits.map(u => `<option value="${u}">`).join('');
    },

    bindTestCheckToggle() {
      const testCheck = document.getElementById('lesson-test-check');
      const pinCheck = document.getElementById('lesson-pin-check');
      const forcedCheck = document.getElementById('lesson-forced-check');

      const handleToggle = () => {
        const group = document.getElementById('lesson-test-slot-group');
        const isChecked = (testCheck && testCheck.checked) || (pinCheck && pinCheck.checked) || (forcedCheck && forcedCheck.checked);
        if (isChecked) {
          if (group) group.style.display = 'block';
          this.populateTestSlotOptions(this.selectedClassId);
        } else {
          if (group) group.style.display = 'none';
        }
      };

      if (testCheck && !testCheck._hasToggleListener) {
        testCheck._hasToggleListener = true;
        testCheck.addEventListener('change', handleToggle);
      }
      if (pinCheck && !pinCheck._hasToggleListener) {
        pinCheck._hasToggleListener = true;
        pinCheck.addEventListener('change', handleToggle);
      }
      if (forcedCheck && !forcedCheck._hasToggleListener) {
        forcedCheck._hasToggleListener = true;
        forcedCheck.addEventListener('change', handleToggle);
      }
    },

    renderClassworkInputs(classworkArray = []) {
      const container = document.getElementById('classwork-inputs-container');
      if (!container) return;

      if (!classworkArray || classworkArray.length === 0) {
        classworkArray = [{ type: 'Textbook', work: '', link: '' }];
      }

      container.innerHTML = classworkArray.map((cw) => `
        <div class="classwork-input-row">
          <input type="text" class="form-control cw-type-input" list="classwork-type-suggestions" placeholder="Type (e.g. Textbook)" value="${cw.type || ''}" style="font-size:0.82rem; padding:0.3rem 0.5rem;">
          <input type="text" class="form-control cw-work-input" placeholder="Work (e.g. 7A Q1-5, Page 7)" value="${cw.work || ''}" style="font-size:0.82rem; padding:0.3rem 0.5rem;">
          <input type="text" class="form-control cw-link-input" placeholder="Link / URL (Optional)" value="${cw.link || ''}" style="font-size:0.82rem; padding:0.3rem 0.5rem;">
          <button type="button" class="btn btn-danger btn-xs btn-remove-cw-row" title="Delete Item" style="padding:0.25rem 0.4rem;">🗑️</button>
        </div>
      `).join('');
    },

    addClassworkInputRow(type = '', work = '', link = '') {
      const container = document.getElementById('classwork-inputs-container');
      if (!container) return;
      const div = document.createElement('div');
      div.className = 'classwork-input-row';
      div.innerHTML = `
        <input type="text" class="form-control cw-type-input" list="classwork-type-suggestions" placeholder="Type (e.g. Textbook)" value="${type}" style="font-size:0.82rem; padding:0.3rem 0.5rem;">
        <input type="text" class="form-control cw-work-input" placeholder="Work (e.g. 7A Q1-5, Page 7)" value="${work}" style="font-size:0.82rem; padding:0.3rem 0.5rem;">
        <input type="text" class="form-control cw-link-input" placeholder="Link / URL (Optional)" value="${link}" style="font-size:0.82rem; padding:0.3rem 0.5rem;">
        <button type="button" class="btn btn-danger btn-xs btn-remove-cw-row" title="Delete Item" style="padding:0.25rem 0.4rem;">🗑️</button>
      `;
      container.appendChild(div);
    },

    readClassworkInputsFromModal() {
      const rows = document.querySelectorAll('#classwork-inputs-container .classwork-input-row');
      const classwork = [];
      rows.forEach(row => {
        const typeVal = row.querySelector('.cw-type-input')?.value?.trim() || '';
        const workVal = row.querySelector('.cw-work-input')?.value?.trim() || '';
        const linkVal = row.querySelector('.cw-link-input')?.value?.trim() || '';
        if (typeVal || workVal || linkVal) {
          classwork.push({ type: typeVal || 'Task', work: workVal, link: linkVal });
        }
      });
      return classwork;
    },

    openAddLessonModal(targetClassId = null, targetDate = null, targetPeriodId = null) {
      if (targetClassId) this.selectedClassId = targetClassId;
      const backdrop = document.getElementById('modal-lesson-backdrop');
      if (!backdrop) return;

      const classObj = state.classes.find(c => c.id === this.selectedClassId);
      const className = classObj ? classObj.name : '';
      document.getElementById('lesson-modal-title').textContent = `Add Lesson Plan ${className ? `(${className})` : ''}`;
      document.getElementById('lesson-id-input').value = '';
      document.getElementById('lesson-title-input').value = '';
      document.getElementById('lesson-unit-input').value = '';
      document.getElementById('lesson-content-input').value = '';
      document.getElementById('lesson-revision-check').checked = false;

      const pinCheck = document.getElementById('lesson-pin-check');
      if (pinCheck) pinCheck.checked = !!(targetDate && targetPeriodId);

      const testCheck = document.getElementById('lesson-test-check');
      const forcedCheck = document.getElementById('lesson-forced-check');
      if (testCheck) testCheck.checked = false;
      if (forcedCheck) forcedCheck.checked = false;

      const slotGroup = document.getElementById('lesson-test-slot-group');
      if (targetDate && targetPeriodId) {
        if (slotGroup) slotGroup.style.display = 'block';
        const slotKey = `${targetDate}_${targetPeriodId}`;
        this.populateTestSlotOptions(this.selectedClassId, slotKey);
      } else if (slotGroup) {
        slotGroup.style.display = 'none';
      }

      const datePicker = document.getElementById('lesson-forced-date-picker');
      if (datePicker) datePicker.value = '';

      this.renderClassworkInputs([{ type: 'Textbook', work: '', link: '' }]);
      this.populateUnitAutocomplete();
      this.bindTestCheckToggle();
      this.bindForcedDatePickerEvents();
      this.initRichToolbar();
      this.updateSyncLinkedCheckboxInModal();
      backdrop.classList.add('active');
    },

    openEditLessonModal(lessonId) {
      const backdrop = document.getElementById('modal-lesson-backdrop');
      if (!backdrop) return;

      const lessons = state.lessonPlans[this.selectedClassId] || [];
      const lesson = lessons.find(l => l.id === lessonId);
      if (!lesson) return;

      document.getElementById('lesson-modal-title').textContent = 'Edit Lesson Plan';
      document.getElementById('lesson-id-input').value = lesson.id;
      document.getElementById('lesson-title-input').value = lesson.title;
      document.getElementById('lesson-unit-input').value = lesson.unit || '';
      document.getElementById('lesson-content-input').value = lesson.content || '';
      
      const revisionCheck = document.getElementById('lesson-revision-check');
      if (revisionCheck) revisionCheck.checked = !!lesson.isRevision;

      const testCheck = document.getElementById('lesson-test-check');
      const pinCheck = document.getElementById('lesson-pin-check');
      const forcedCheck = document.getElementById('lesson-forced-check');
      const slotGroup = document.getElementById('lesson-test-slot-group');
      const datePicker = document.getElementById('lesson-forced-date-picker');

      if (testCheck) testCheck.checked = !!lesson.isTestMilestone;
      if (pinCheck) pinCheck.checked = !!lesson.isPinned;
      if (forcedCheck) forcedCheck.checked = !!lesson.isForcedSlot;
      if (datePicker) datePicker.value = lesson.testDate || lesson.pinnedDate || lesson.forcedDate || '';

      const isAnchored = !!lesson.isTestMilestone || !!lesson.isPinned || !!lesson.isForcedSlot;
      if (isAnchored) {
        if (slotGroup) slotGroup.style.display = 'block';
        let keyToSelect = lesson.testSlotKey || lesson.pinnedSlotKey || lesson.forcedSlotKey;
        if (!keyToSelect && (lesson.testDate || lesson.pinnedDate || lesson.forcedDate)) {
          const targetD = lesson.testDate || lesson.pinnedDate || lesson.forcedDate;
          const slots = Scheduler.getAvailableSlots(this.selectedClassId);
          const match = slots.find(s => s.date === targetD) || slots.find(s => s.date >= targetD);
          if (match) keyToSelect = `${match.date}_${match.periodId}`;
        }
        this.populateTestSlotOptions(this.selectedClassId, keyToSelect);
      } else {
        if (slotGroup) slotGroup.style.display = 'none';
      }

      this.renderClassworkInputs(lesson.classwork || []);
      this.populateUnitAutocomplete();
      this.bindTestCheckToggle();
      this.bindForcedDatePickerEvents();
      this.initRichToolbar();
      this.updateSyncLinkedCheckboxInModal();
      backdrop.classList.add('active');
    },

    bindForcedDatePickerEvents() {
      const datePicker = document.getElementById('lesson-forced-date-picker');
      if (datePicker && !datePicker._hasChangeListener) {
        datePicker._hasChangeListener = true;
        datePicker.addEventListener('change', (e) => {
          const chosenDate = e.target.value;
          if (!chosenDate) return;
          const slots = Scheduler.getAvailableSlots(this.selectedClassId);
          const match = slots.find(s => s.date === chosenDate) || slots.find(s => s.date >= chosenDate);
          if (match) {
            this.populateTestSlotOptions(this.selectedClassId, `${match.date}_${match.periodId}`);
          }
        });
      }
    },

    bindEvents() {
      document.addEventListener('change', (e) => {
        if (e.target.classList.contains('chk-link-class')) {
          const targetId = e.target.getAttribute('data-target-id');
          if (targetId && this.selectedClassId) {
            if (e.target.checked) {
              state.linkClasses(this.selectedClassId, targetId);
            } else {
              state.unlinkClasses(this.selectedClassId, targetId);
            }
            this.renderClassSelector();
            this.renderLinkClassesModalBody();
          }
        }
      });

      document.addEventListener('click', (e) => {
        const syncLessonBtn = e.target.closest('#btn-sync-lesson-now');
        if (syncLessonBtn) {
          this.syncCurrentModalLesson();
        }
      });

      document.addEventListener('click', (e) => {
        const syncCurriculumBtn = e.target.closest('#btn-sync-linked-curriculum');
        if (syncCurriculumBtn) {
          this.openSyncOptionsModal();
        }
      });

      const execSyncBtn = document.getElementById('btn-execute-sync-options');
      if (execSyncBtn) {
        execSyncBtn.addEventListener('click', () => {
          this.executeSyncOptions();
        });
      }

      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.class-item-btn');
        if (btn) {
          this.selectedClassId = btn.getAttribute('data-id');
          this.renderClassSelector();
          this.renderLessonList();
          MasterScheduleUI.selectedClassIds = [this.selectedClassId];
          MasterScheduleUI.renderNavBar();
          MasterScheduleUI.renderCalendarGrid();
        }
      });

      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-class-btn')) {
          const classId = e.target.getAttribute('data-id');
          const classObj = state.classes.find(c => c.id === classId);
          if (classObj && confirm(`Delete "${classObj.name}" and all associated lesson plans?`)) {
            state.deleteClassById(classId);
            if (this.selectedClassId === classId) {
              this.selectedClassId = state.classes.length > 0 ? state.classes[0].id : null;
            }
            refreshAllViews(false, true);
          }
        }
      });

      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-lesson-btn')) {
          const id = e.target.getAttribute('data-id');
          const lessons = state.lessonPlans[this.selectedClassId] || [];
          const lesson = lessons.find(l => l.id === id);
          const classObj = state.classes.find(c => c.id === this.selectedClassId);
          if (lesson && classObj) {
            LessonViewer.open(lesson, classObj);
          }
        }
      });

      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-lesson-btn')) {
          const id = e.target.getAttribute('data-id');
          this.openEditLessonModal(id);
        }
      });

      document.addEventListener('click', (e) => {
        const pinEl = e.target.closest('.toggle-pin-btn, .tag-pinned');
        if (pinEl) {
          e.preventDefault();
          e.stopPropagation();
          const lessonId = pinEl.getAttribute('data-id');
          const classId = pinEl.getAttribute('data-class') || LessonUI.selectedClassId;
          if (classId && lessonId) {
            state.toggleLessonPin(classId, lessonId);
          }
        }
      });

      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('toggle-float-btn')) {
          const id = e.target.getAttribute('data-id');
          const lessons = state.lessonPlans[this.selectedClassId] || [];
          const lesson = lessons.find(l => l.id === id);
          if (lesson) {
            lesson.isFloat = !lesson.isFloat;
            if (lesson.isFloat) {
              if (!lesson.title.includes('Float')) lesson.title = `🎈 Float: ${lesson.title}`;
            }
            state.saveState();
            this.renderLessonList();
            refreshAllViews(false, true);
          }
        }
      });

      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('toggle-revision-btn')) {
          const id = e.target.getAttribute('data-id');
          const lessons = state.lessonPlans[this.selectedClassId] || [];
          const lesson = lessons.find(l => l.id === id);
          if (lesson) {
            lesson.isRevision = !lesson.isRevision;
            state.saveState();
            this.renderLessonList();
            refreshAllViews(false, true);
          }
        }
      });

      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-lesson-btn')) {
          const id = e.target.getAttribute('data-id');
          state.lessonPlans[this.selectedClassId] = (state.lessonPlans[this.selectedClassId] || []).filter(l => l.id !== id);
          state.saveState();
          this.renderLessonList();
          this.renderClassSelector();
          refreshAllViews(false, true);
        }
      });

      const insertFloatBtn = document.getElementById('btn-insert-float-lesson');
      if (insertFloatBtn) {
        insertFloatBtn.addEventListener('click', () => {
          if (!this.selectedClassId) return;
          const lessons = state.lessonPlans[this.selectedClassId] || [];
          let targetUnit = 'General Curriculum';
          if (lessons.length > 0) {
            const lastLesson = lessons[lessons.length - 1];
            if (lastLesson && lastLesson.unit) {
              targetUnit = lastLesson.unit;
            }
          }
          const floatCount = lessons.filter(l => l.isFloat).length + 1;
          const newFloat = {
            id: `float_${Date.now()}`,
            title: `🎈 Float / Free Lesson #${floatCount}`,
            unit: targetUnit,
            isFloat: true,
            content: 'Unstructured float / catch-up lesson. Will be pruned FIRST during pacing conflicts.'
          };
          if (!state.lessonPlans[this.selectedClassId]) state.lessonPlans[this.selectedClassId] = [];
          state.lessonPlans[this.selectedClassId].push(newFloat);
          state.saveState();
          this.renderLessonList();
          refreshAllViews(false, true);
        });
      }

      const addCwBtn = document.getElementById('btn-add-classwork-row');
      if (addCwBtn && !addCwBtn._hasClickListener) {
        addCwBtn._hasClickListener = true;
        addCwBtn.addEventListener('click', () => {
          this.addClassworkInputRow();
        });
      }

      document.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.btn-remove-cw-row');
        if (removeBtn) {
          const row = removeBtn.closest('.classwork-input-row');
          if (row) row.remove();
        }
      });

      const addBtn = document.getElementById('btn-open-lesson-modal');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          this.openAddLessonModal();
        });
      }
      const unitDatalist = document.getElementById('unit-autocomplete-list');
      if (unitDatalist && this.selectedClassId) {
        const lessons = state.lessonPlans[this.selectedClassId] || [];
        const uniqueUnits = [...new Set(lessons.map(l => l.unit).filter(Boolean))];
        unitDatalist.innerHTML = uniqueUnits.map(u => `<option value="${u}">`).join('');
      }
    }
  };

  // Lesson Viewer & Copy Controller
  const LessonViewer = {
    currentLessonData: null,

    open(lesson, classObj, slotInfo = null) {
      this.currentLessonData = { lesson, classObj, slotInfo };
      const backdrop = document.getElementById('modal-view-lesson-backdrop');
      const body = document.getElementById('view-lesson-modal-body');
      if (!backdrop || !body) return;

      let tagsHtml = '';
      if (lesson.isPinned) tagsHtml += `<span class="tag tag-pinned" data-class="${classObj ? classObj.id : ''}" data-id="${lesson.id}" style="cursor:pointer;" title="Click to unpin">📌 Pinned: ${TermManager.formatDisplayDate(lesson.pinnedDate)} ✕</span> `;
      if (lesson.isRevision) tagsHtml += `<span class="tag tag-revision">⭐ Revision</span> `;
      if (lesson.isMerged) tagsHtml += `<span class="tag tag-merged">🔀 Merged</span> `;
      if (lesson.isTestMilestone) tagsHtml += `<span class="tag tag-test">🎯 Test: ${lesson.testDate || 'Set Date'}</span> `;

      let slotMeta = '';
      if (slotInfo) {
        slotMeta = `<div>📅 <strong>Scheduled Slot:</strong> ${slotInfo.termName} • ${TermManager.formatDisplayDate(slotInfo.date)} (${slotInfo.periodName})</div>`;
      }

      let classworkHtml = '';
      if (lesson.classwork && Array.isArray(lesson.classwork) && lesson.classwork.length > 0) {
        classworkHtml = `
          <div style="margin-top:0.75rem; padding:0.75rem; background:rgba(59, 130, 246, 0.1); border:1px solid rgba(59, 130, 246, 0.3); border-radius:var(--radius-sm);">
            <strong style="color:#93c5fd; font-size:0.85rem; display:block; margin-bottom:0.4rem;">📚 Classwork Tasks:</strong>
            ${lesson.classwork.map(cw => `
              <div style="font-size:0.85rem; margin-bottom:0.3rem;">
                <span class="cw-badge cw-badge-default">${cw.type || 'Task'}</span>
                <strong>${cw.work || ''}</strong>
                ${cw.link ? `<a href="${cw.link}" target="_blank" class="cw-link-icon">🔗 Material Link</a>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }

      body.innerHTML = `
        <h3 style="font-size:1.2rem; font-weight:800; margin-bottom:0.4rem; color:var(--text-main);">${lesson.title}</h3>
        <div class="lesson-view-meta">
          <div style="color:${classObj ? classObj.color : '#3b82f6'}; font-weight:700;">● ${classObj ? classObj.name : ''}</div>
          <div>📂 ${lesson.unit || 'General Curriculum'}</div>
          ${slotMeta}
          <div style="margin-top:0.35rem;">${tagsHtml}</div>
        </div>
        ${classworkHtml}
        <div class="lesson-view-content-box" style="margin-top:0.75rem;">
          ${lesson.content ? lesson.content.replace(/\n/g, '<br>') : '<div style="color:var(--text-dim); font-style:italic;">No detailed teaching notes added for this lesson plan. Click "Edit" to add details!</div>'}
        </div>
      `;

      const pinBtn = document.getElementById('btn-viewer-toggle-pin');
      if (pinBtn) {
        pinBtn.textContent = lesson.isPinned ? '📌 Unpin Lesson' : '📌 Pin to Slot';
        pinBtn.onclick = () => {
          const targetD = slotInfo ? slotInfo.date : (lesson.pinnedDate || null);
          const targetP = slotInfo ? slotInfo.periodId : (lesson.pinnedPeriodId || null);
          state.toggleLessonPin(classObj.id, lesson.id, targetD, targetP);
          backdrop.classList.remove('active');
        };
      }

      const editBtn = document.getElementById('btn-viewer-edit-lesson');
      if (editBtn) {
        editBtn.onclick = () => {
          backdrop.classList.remove('active');
          if (classObj) LessonUI.selectedClassId = classObj.id;
          LessonUI.openEditLessonModal(lesson.id);
        };
      }

      backdrop.classList.add('active');
    },

    copyToClipboard() {
      if (!this.currentLessonData) return;
      const { lesson, classObj, slotInfo } = this.currentLessonData;
      let text = `LESSON PLAN: ${lesson.title}\n`;
      text += `Class: ${classObj ? classObj.name : ''}\n`;
      text += `Unit: ${lesson.unit || 'General Curriculum'}\n`;
      if (slotInfo) {
        text += `Date/Period: ${slotInfo.termName} - ${TermManager.formatDisplayDate(slotInfo.date)} (${slotInfo.periodName})\n`;
      }

      if (lesson.classwork && Array.isArray(lesson.classwork) && lesson.classwork.length > 0) {
        text += `\nCLASSWORK TASKS:\n`;
        lesson.classwork.forEach(cw => {
          text += `- [${cw.type || 'Task'}]: ${cw.work}${cw.link ? ` (${cw.link})` : ''}\n`;
        });
      }

      if (lesson.content) {
        const cleanContent = lesson.content.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
        text += `\nDETAILS / NOTES:\n${cleanContent}\n`;
      }

      navigator.clipboard.writeText(text).then(() => {
        const copyBtn = document.getElementById('btn-copy-lesson-details');
        if (copyBtn) {
          const origText = copyBtn.textContent;
          copyBtn.textContent = '✅ Copied to Clipboard!';
          setTimeout(() => {
            copyBtn.textContent = origText;
          }, 2000);
        }
      }).catch(() => {
        alert('Copied lesson details to clipboard!');
      });
    }
  };

  // Requirement 7: Master Calendar Matrix View (Start & End Term/Week Range Selector & Drag-Drop Reordering)
  const MasterScheduleUI = {
    selectedClassIds: ['ALL'],
    startTermId: null,
    startWeekNum: 1,
    endTermId: null,
    endWeekNum: 1,
    rangeMode: 'RANGE', // 'CURRENT_WEEK' or 'RANGE'

    init() {
      this.ensureRangeDefaults();
      this.renderNavBar();
      this.renderConflictBanner();
      this.renderCalendarGrid();
      this.bindEvents();
    },

    showReanalysisOverlay(message = 'Re-analyzing Schedule...') {
      let overlay = document.getElementById('reanalysis-loading-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'reanalysis-loading-overlay';
        overlay.style.cssText = 'position:fixed; inset:0; background:rgba(15, 23, 42, 0.75); backdrop-filter:blur(4px); z-index:2000; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; font-weight:700; gap:0.85rem; transition:opacity 0.2s ease;';
        overlay.innerHTML = `
          <div class="spinner" style="width:38px; height:38px; border:3px solid rgba(255,255,255,0.2); border-top-color:var(--primary); border-radius:50%; animation:spin 0.8s linear infinite;"></div>
          <div id="reanalysis-overlay-text" style="font-size:0.95rem; font-weight:700;">Re-analyzing Schedule...</div>
        `;
        document.body.appendChild(overlay);
      }
      const textEl = document.getElementById('reanalysis-overlay-text');
      if (textEl) textEl.textContent = message;
      overlay.style.display = 'flex';
      overlay.style.opacity = '1';
    },

    hideReanalysisOverlay() {
      const overlay = document.getElementById('reanalysis-loading-overlay');
      if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 200);
      }
    },

    ensureRangeDefaults() {
      if (state.terms.length === 0) return;

      if (state.data.masterCalendarRangeMode) {
        this.rangeMode = state.data.masterCalendarRangeMode;
      }

      if (state.data.masterCalendarRange) {
        const saved = state.data.masterCalendarRange;
        if (saved.startTermId && state.terms.find(t => t.id === saved.startTermId)) {
          this.startTermId = saved.startTermId;
        }
        if (saved.startWeekNum) {
          this.startWeekNum = saved.startWeekNum;
        }
        if (saved.endTermId && state.terms.find(t => t.id === saved.endTermId)) {
          this.endTermId = saved.endTermId;
        }
        if (saved.endWeekNum) {
          this.endWeekNum = saved.endWeekNum;
        }
      }

      if (!this.startTermId || !state.terms.find(t => t.id === this.startTermId)) {
        this.startTermId = state.terms[0].id;
        this.startWeekNum = 1;
      }
      if (!this.endTermId || !state.terms.find(t => t.id === this.endTermId)) {
        this.endTermId = state.terms[0].id;
        this.endWeekNum = Math.min(4, state.terms[0].weeks || 10);
      }
    },

    saveRangeToState() {
      state.data.masterCalendarRange = {
        startTermId: this.startTermId,
        startWeekNum: this.startWeekNum,
        endTermId: this.endTermId,
        endWeekNum: this.endWeekNum
      };
      state.data.masterCalendarRangeMode = this.rangeMode;
      state.saveState();
    },

    _cachedTermWeeks: null,
    _cachedTermsKey: null,

    getAllChronologicalTermWeeks() {
      const currentKey = state.terms.map(t => `${t.id}_${t.startDate}_${t.endDate}_${t.weeks}`).join('|');
      if (this._cachedTermWeeks && this._cachedTermsKey === currentKey) {
        return this._cachedTermWeeks;
      }

      const sortedTerms = [...state.terms].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      const list = [];
      sortedTerms.forEach(term => {
        const numWeeks = term.weeks || 10;
        for (let w = 1; w <= numWeeks; w++) {
          list.push({ term, weekNum: w });
        }
      });

      this._cachedTermWeeks = list;
      this._cachedTermsKey = currentKey;
      return list;
    },

    getActiveTermWeeksInRange() {
      this.ensureRangeDefaults();
      const allList = this.getAllChronologicalTermWeeks();
      if (allList.length === 0) return [];

      if (this.rangeMode === 'CURRENT_WEEK') {
        const currentD = state.currentDate;
        const match = allList.find(item => {
          const term = item.term;
          const weekNum = item.weekNum;
          const weekStart = TermManager.parseLocalDate(term.startDate);
          if (!weekStart) return false;
          weekStart.setDate(weekStart.getDate() + (weekNum - 1) * 7);
          const dayOfWeek = weekStart.getDay();
          const diffToMon = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
          const mon = new Date(weekStart);
          mon.setDate(mon.getDate() + diffToMon);
          const fri = new Date(mon);
          fri.setDate(fri.getDate() + 4);

          const monStr = TermManager.formatLocalDate(mon);
          const friStr = TermManager.formatLocalDate(fri);
          return currentD >= monStr && currentD <= friStr;
        });

        if (match) return [match];

        const termMatch = state.terms.find(t => currentD >= t.startDate && currentD <= t.endDate);
        if (termMatch) {
          const d1 = TermManager.parseLocalDate(termMatch.startDate);
          const d2 = TermManager.parseLocalDate(currentD);
          if (d1 && d2) {
            const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
            const diffWeeks = Math.max(1, Math.min(termMatch.weeks || 10, Math.floor(diffDays / 7) + 1));
            return [{ term: termMatch, weekNum: diffWeeks }];
          }
        }

        return [allList[0]];
      }

      let startIdx = allList.findIndex(item => item.term.id === this.startTermId && item.weekNum === this.startWeekNum);
      let endIdx = allList.findIndex(item => item.term.id === this.endTermId && item.weekNum === this.endWeekNum);

      if (startIdx === -1) startIdx = 0;
      if (endIdx === -1) endIdx = Math.min(3, allList.length - 1);

      if (startIdx > endIdx) {
        const temp = startIdx;
        startIdx = endIdx;
        endIdx = temp;
      }

      return allList.slice(startIdx, endIdx + 1);
    },

    renderNavBar() {
      const container = document.getElementById('master-calendar-nav-bar');
      if (!container) return;

      this.ensureRangeDefaults();

      let classPillsHtml = `<button class="pill-btn ${this.selectedClassIds.includes('ALL') ? 'active' : ''}" data-type="class" data-id="ALL">🌟 All Classes</button>`;
      state.classes.forEach(c => {
        const active = this.selectedClassIds.includes(c.id) ? 'active' : '';
        classPillsHtml += `<button class="pill-btn ${active}" data-type="class" data-id="${c.id}"><span style="color:${c.color}">●</span> ${c.name}</button>`;
      });

      const termOptions = state.terms.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
      const activeRange = this.getActiveTermWeeksInRange();

      const isCurrentWeekMode = this.rangeMode === 'CURRENT_WEEK';

      container.innerHTML = `
        <div class="master-nav-bar" style="display:flex; flex-direction:column; gap:0.75rem;">
          <div class="nav-row" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-weight:700; font-size:0.85rem; color:var(--text-muted);">Class Filter:</span>
              <div class="pills-group">${classPillsHtml}</div>
            </div>

            <!-- View Mode Slider Switch (Show Current Week vs Date Range) -->
            <div class="master-mode-switch-wrapper" style="display:flex; align-items:center; gap:0.5rem; padding:0.25rem 0.6rem; border-radius:30px; border:1px solid var(--border-color);">
              <button type="button" class="btn btn-xs ${isCurrentWeekMode ? 'btn-primary' : 'btn-secondary'}" id="btn-master-mode-week" style="border-radius:20px; font-size:0.75rem; font-weight:700;">📍 Show Current Week</button>
              <button type="button" class="btn btn-xs ${!isCurrentWeekMode ? 'btn-primary' : 'btn-secondary'}" id="btn-master-mode-range" style="border-radius:20px; font-size:0.75rem; font-weight:700;">🗓️ Date Range</button>
            </div>
          </div>

          <div class="nav-row master-range-bar" style="padding:0.6rem 0.85rem; border-radius:var(--radius-md); border:1px solid var(--border-color); display:flex; align-items:center; gap:1rem; flex-wrap:wrap; opacity:${isCurrentWeekMode ? 0.6 : 1};">
            <span style="font-weight:700; font-size:0.85rem; color:var(--primary);">🗓️ Term & Week Range:</span>
            
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <span style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">From:</span>
              <select id="master-start-term-select" class="form-control" ${isCurrentWeekMode ? 'disabled' : ''} style="width:auto; font-size:0.82rem; padding:0.25rem 0.5rem; border-color:var(--primary);">${termOptions}</select>
              <select id="master-start-week-select" class="form-control" ${isCurrentWeekMode ? 'disabled' : ''} style="width:auto; font-size:0.82rem; padding:0.25rem 0.5rem; border-color:var(--primary);"></select>
            </div>

            <div style="display:flex; align-items:center; gap:0.4rem;">
              <span style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">To:</span>
              <select id="master-end-term-select" class="form-control" ${isCurrentWeekMode ? 'disabled' : ''} style="width:auto; font-size:0.82rem; padding:0.25rem 0.5rem; border-color:var(--primary);">${termOptions}</select>
              <select id="master-end-week-select" class="form-control" ${isCurrentWeekMode ? 'disabled' : ''} style="width:auto; font-size:0.82rem; padding:0.25rem 0.5rem; border-color:var(--primary);"></select>
            </div>

            <div style="font-size:0.8rem; font-weight:700; color:var(--accent-teal); margin-left:auto;">
              ${isCurrentWeekMode ? `📍 Showing Current Week (${TermManager.formatDisplayDate(state.currentDate)})` : `📅 Showing ${activeRange.length} ${activeRange.length === 1 ? 'Week' : 'Weeks'} Inclusive`}
            </div>
          </div>
        </div>
      `;

      this.populateRangeDropdowns();
      this.bindNavBarSelectEvents();
    },

    populateRangeDropdowns() {
      const startTermSelect = document.getElementById('master-start-term-select');
      const startWeekSelect = document.getElementById('master-start-week-select');
      const endTermSelect = document.getElementById('master-end-term-select');
      const endWeekSelect = document.getElementById('master-end-week-select');

      if (!startTermSelect || !startWeekSelect || !endTermSelect || !endWeekSelect) return;

      startTermSelect.value = this.startTermId;
      endTermSelect.value = this.endTermId;

      const populateWeeks = (termId, selectEl, currentVal) => {
        const term = state.terms.find(t => t.id === termId) || state.terms[0];
        const numWeeks = term ? (term.weeks || 10) : 10;
        let weekHtml = '';
        for (let w = 1; w <= numWeeks; w++) {
          const selected = w === currentVal ? 'selected' : '';
          weekHtml += `<option value="${w}" ${selected}>Week ${w}</option>`;
        }
        selectEl.innerHTML = weekHtml;
      };

      populateWeeks(this.startTermId, startWeekSelect, this.startWeekNum);
      populateWeeks(this.endTermId, endWeekSelect, this.endWeekNum);
    },

    bindNavBarSelectEvents() {
      const btnModeWeek = document.getElementById('btn-master-mode-week');
      const btnModeRange = document.getElementById('btn-master-mode-range');

      if (btnModeWeek) {
        btnModeWeek.onclick = () => {
          this.rangeMode = 'CURRENT_WEEK';
          this.saveRangeToState();
          this.renderNavBar();
          this.renderCalendarGrid();
        };
      }
      if (btnModeRange) {
        btnModeRange.onclick = () => {
          this.rangeMode = 'RANGE';
          this.saveRangeToState();
          this.renderNavBar();
          this.renderCalendarGrid();
        };
      }

      const startTermSelect = document.getElementById('master-start-term-select');
      const startWeekSelect = document.getElementById('master-start-start-week-select') || document.getElementById('master-start-week-select');
      const endTermSelect = document.getElementById('master-end-term-select');
      const endWeekSelect = document.getElementById('master-end-week-select');

      if (!startTermSelect || !startWeekSelect || !endTermSelect || !endWeekSelect) return;

      startTermSelect.onchange = (e) => {
        this.startTermId = e.target.value;
        this.saveRangeToState();
        this.populateRangeDropdowns();
        this.renderCalendarGrid();
        this.renderNavBar();
      };

      startWeekSelect.onchange = (e) => {
        this.startWeekNum = parseInt(e.target.value, 10);
        this.saveRangeToState();
        this.renderCalendarGrid();
        this.renderNavBar();
      };

      endTermSelect.onchange = (e) => {
        this.endTermId = e.target.value;
        this.saveRangeToState();
        this.populateRangeDropdowns();
        this.renderCalendarGrid();
        this.renderNavBar();
      };

      endWeekSelect.onchange = (e) => {
        this.endWeekNum = parseInt(e.target.value, 10);
        this.saveRangeToState();
        this.renderCalendarGrid();
        this.renderNavBar();
      };
    },

    toggleFilter(type, idOrNum) {
      if (type === 'class') {
        if (idOrNum === 'ALL') {
          this.selectedClassIds = ['ALL'];
        } else {
          this.selectedClassIds = this.selectedClassIds.filter(x => x !== 'ALL');
          if (this.selectedClassIds.includes(idOrNum)) {
            this.selectedClassIds = this.selectedClassIds.filter(x => x !== idOrNum);
          } else {
            this.selectedClassIds.push(idOrNum);
          }
          if (this.selectedClassIds.length === 0) {
            this.selectedClassIds = ['ALL'];
          }
        }
      }
    },

    renderConflictBanner() {
      const container = document.getElementById('master-conflict-container');
      if (!container) return;

      if (this.selectedClassIds.includes('ALL') || this.selectedClassIds.length > 1) {
        container.innerHTML = '';
        return;
      }

      const singleClassId = this.selectedClassIds[0];
      const conflicts = Scheduler.analyzeConflicts(singleClassId);

      if (conflicts.length === 0) {
        container.innerHTML = '';
        return;
      }

      const primaryConflict = conflicts[0];
      const targetTitle = primaryConflict.testLesson ? primaryConflict.testLesson.title : 'Milestone';
      const dateText = primaryConflict.testDate;

      container.innerHTML = `
        <div class="conflict-banner">
          <div class="conflict-message">
            <span style="font-size:1.4rem;">⚠️</span>
            <div>
              <strong>Pacing Conflict Detected!</strong><br>
              <span style="font-size:0.85rem; opacity:0.9;">
                Before "${targetTitle}" (${dateText}): You have <strong>${primaryConflict.availableSlots} available slots</strong> but need <strong>${primaryConflict.requiredLessons} lessons</strong> (${primaryConflict.deficit} missing slot/s).
              </span>
            </div>
          </div>
          <div class="conflict-actions">
            <button class="btn btn-warning btn-sm btn-resolve-conflict" data-class="${singleClassId}">
              ⚡ Resolve Conflict
            </button>
          </div>
        </div>
      `;
    },

    renderCalendarGrid() {
      const container = document.getElementById('master-calendar-grid-container');
      if (!container) return;

      const activeRange = this.getActiveTermWeeksInRange();
      if (activeRange.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-dim);">No active term weeks found in the selected range.</div>`;
        return;
      }

      const classScheduleMap = {};
      state.classes.forEach(c => {
        classScheduleMap[c.id] = Scheduler.generateScheduleForClass(c.id).schedule;
      });

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      let gridHtml = '';

      activeRange.forEach(({ term, weekNum }) => {
        const termStart = TermManager.parseLocalDate(term.startDate);
        if (!termStart) return;
        const weekOffsetDays = (weekNum - 1) * 7;
        const weekStartDate = new Date(termStart);
        weekStartDate.setDate(weekStartDate.getDate() + weekOffsetDays);

        gridHtml += `
          <div style="margin-bottom: 1.25rem;">
            <div style="font-weight: 800; font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--primary);">
              📅 ${term.name} • Week ${weekNum}
            </div>
            <div class="master-calendar-grid">
        `;

          days.forEach((dayName, idx) => {
            const currentDate = new Date(weekStartDate);
            const dayOfWeek = currentDate.getDay();
            const diffToMon = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
            currentDate.setDate(currentDate.getDate() + diffToMon + idx);

            const dateStr = TermManager.formatLocalDate(currentDate);
            const isPast = dateStr <= state.currentDate;

            let daySlots = [];
            if (this.selectedClassIds.includes('ALL')) {
              daySlots = Scheduler.getAllClassSlotsForYear('ALL').filter(s => s.date === dateStr);
            } else {
              this.selectedClassIds.forEach(cId => {
                const slots = Scheduler.getAllClassSlotsForYear(cId).filter(s => s.date === dateStr);
                daySlots.push(...slots);
              });
            }

            let slotsHtml = '';
            if (daySlots.length === 0) {
              slotsHtml = `<div style="font-size:0.78rem; color:var(--text-dim); font-style:italic; padding:0.5rem 0;">No classes scheduled</div>`;
            } else {
              daySlots.forEach(s => {
                const classObj = s.assignedClass;
                const blockout = s.blockout;

                if (blockout) {
                  slotsHtml += `
                    <div class="master-slot-item blockout">
                      <strong>🚫 ${blockout.title}</strong>
                      <div style="font-size:0.72rem;">${s.periodName} (${s.timeFormatted}) • ${classObj.name}</div>
                    </div>
                  `;
                } else {
                  const classSchedule = classScheduleMap[classObj.id] || [];
                  const mapped = classSchedule.find(m => m.slot.date === s.date && m.slot.periodId === s.periodId);
                  const lesson = mapped ? mapped.lesson : null;

                  let lessonTitle = `<span style="color:var(--text-dim); font-style:italic;">No lesson plan</span>`;
                  if (lesson) {
                    let tags = '';
                    if (lesson.isMerged) tags += `<span class="tag tag-merged" style="font-size:0.68rem; padding:0.1rem 0.35rem; margin-right:0.25rem;">🔀 Combined Class</span> `;
                    if (lesson.isFloat) tags += `🎈 `;
                    if (lesson.isRevision) tags += `⭐ `;
                    if (lesson.isTestMilestone) tags += `🎯 `;
                    lessonTitle = `<div>${tags}<strong>${lesson.title}</strong></div>`;
                  }

                  let slotBtnHtml = '';
                  if (!isPast) {
                    const actionInfo = Scheduler.checkSlotActionType(classObj.id, s.date, s.periodId, classSchedule);
                    if (actionInfo.type === 'REMOVE_FLOAT') {
                      slotBtnHtml = `<button type="button" class="btn btn-danger btn-xs btn-remove-slot-float" data-class="${classObj.id}" data-lesson-id="${actionInfo.lessonId}" style="white-space:nowrap; padding:0.15rem 0.4rem; font-size:0.7rem;" title="Remove this Float lesson">🗑️ Float</button>`;
                    } else if (actionInfo.type === 'REVISION_SHIFT') {
                      slotBtnHtml = `<button type="button" class="btn btn-warning btn-xs btn-shift-slot-revision" data-class="${classObj.id}" data-revision-id="${actionInfo.targetRevisionId}" data-date="${s.date}" data-period="${s.periodId}" style="white-space:nowrap; padding:0.15rem 0.4rem; font-size:0.7rem;" title="${actionInfo.message}">⭐ + Revision</button>`;
                    } else if (actionInfo.type === 'FLOAT') {
                      slotBtnHtml = `<button type="button" class="btn btn-secondary btn-xs btn-insert-slot-float" data-class="${classObj.id}" data-date="${s.date}" data-period="${s.periodId}" style="white-space:nowrap; padding:0.15rem 0.4rem; font-size:0.7rem;" title="Insert Float lesson">🎈 + Float</button>`;
                    } else if (actionInfo.type === 'MAX_CAPACITY') {
                      slotBtnHtml = `<button type="button" disabled class="btn btn-secondary btn-xs" style="white-space:nowrap; opacity:0.4; cursor:not-allowed; border-color:transparent; padding:0.15rem 0.4rem; font-size:0.7rem;" title="${actionInfo.message}">🔒 Max</button>`;
                    }
                  }

                  const isMerged = lesson && lesson.isMerged;
                  const isFloat = lesson && lesson.isFloat;

                  const isLight = (state.theme === 'light');
                  const classTitleColor = isMerged ? (isLight ? '#6d28d9' : '#c4b5fd') : getReadableClassTextColor(classObj.color);
                  const slotBg = isMerged 
                    ? (isLight ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.25)') 
                    : (isLight ? `${classObj.color}18` : `${classObj.color}25`);
                  const slotBorder = isMerged 
                    ? '1px solid rgba(139, 92, 246, 0.4)' 
                    : `1px solid ${classObj.color}${isLight ? '45' : '65'}`;

                  slotsHtml += `
                    <div class="master-slot-item ${isMerged ? 'is-merged' : ''} ${isFloat ? 'is-float' : ''}" 
                         draggable="${lesson ? 'true' : 'false'}" 
                         style="background:${slotBg} !important; border:${slotBorder} !important; border-left:4px solid ${isMerged ? '#8b5cf6' : classObj.color} !important; cursor:${lesson ? 'grab' : 'default'}; padding:0.55rem; border-radius:var(--radius-sm); margin-bottom:0.4rem;"
                         data-class-id="${classObj.id}" ${lesson ? `data-lesson-id="${lesson.id}"` : ''}
                         data-date="${s.date}" data-period="${s.periodId}">
                      <div style="display:flex; justify-content:space-between; align-items:center; gap:0.35rem; margin-bottom:0.15rem;">
                        <div style="font-size:0.8rem; color:${classTitleColor}; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                          <span style="color:${classObj.color}; font-size:0.9rem;">●</span> ${classObj.name}
                        </div>
                        <div style="white-space:nowrap; flex-shrink:0;">
                          ${slotBtnHtml}
                        </div>
                      </div>
                      <div style="font-size:0.73rem; color:var(--text-muted); font-weight:700; margin-bottom:0.25rem;">
                        ${s.periodName}
                      </div>
                      <div style="color:var(--text-main); font-weight:600; font-size:0.82rem; line-height:1.25;">
                        ${lessonTitle}
                      </div>
                    </div>
                  `;
                }
              });
            }

            gridHtml += `
              <div class="master-day-card ${isPast ? 'is-past' : ''}">
                <div class="master-day-header">
                  <div class="master-day-name">${dayName} ${isPast ? '🔒' : ''}</div>
                  <div class="master-day-date">${TermManager.formatDisplayDate(dateStr)}</div>
                </div>
                <div class="master-slot-list">
                  ${slotsHtml}
                </div>
              </div>
            `;
          });

            gridHtml += `</div></div>`;
        });

        container.innerHTML = gridHtml;
      this.bindDragAndDropEvents();
      this.bindFloatSlotEvents();
    },

    bindFloatSlotEvents() {
      const container = document.getElementById('master-calendar-grid-container');
      if (!container || container._hasFloatListener) return;
      container._hasFloatListener = true;

      container.addEventListener('click', (e) => {
        const shiftRevisionBtn = e.target.closest('.btn-shift-slot-revision');
        if (shiftRevisionBtn) {
          e.preventDefault();
          e.stopPropagation();
          const classId = shiftRevisionBtn.getAttribute('data-class');
          const revId = shiftRevisionBtn.getAttribute('data-revision-id');
          const date = shiftRevisionBtn.getAttribute('data-date');
          const periodId = shiftRevisionBtn.getAttribute('data-period');

          const lessons = state.lessonPlans[classId] || [];
          const revIdx = lessons.findIndex(l => l.id === revId);
          if (revIdx >= 0) {
            const [revLesson] = lessons.splice(revIdx, 1);
            
            const { schedule } = Scheduler.generateScheduleForClass(classId);
            const targetSchedIdx = schedule.findIndex(s => s.slot.date === date && s.slot.periodId === periodId);

            let insertIdx = 0;
            if (targetSchedIdx >= 0) {
              let prevLesson = null;
              for (let i = targetSchedIdx - 1; i >= 0; i--) {
                if (schedule[i].lesson && !schedule[i].lesson.isAutofilled) {
                  prevLesson = schedule[i].lesson;
                  break;
                }
              }
              if (prevLesson) {
                const prevIdx = lessons.findIndex(l => l.id === prevLesson.id);
                if (prevIdx >= 0) insertIdx = prevIdx + 1;
              }
            }

            lessons.splice(insertIdx, 0, revLesson);
            state.saveState();

            this.showReanalysisOverlay('Re-analyzing Schedule & Shifting Revision Class...');
            setTimeout(() => {
              this.hideReanalysisOverlay();
              refreshAllViews(false, true);
            }, 350);
          }
          return;
        }

        const addFloatBtn = e.target.closest('.btn-insert-slot-float');
        if (addFloatBtn) {
          e.preventDefault();
          e.stopPropagation();
          const classId = addFloatBtn.getAttribute('data-class');
          const date = addFloatBtn.getAttribute('data-date');
          const periodId = addFloatBtn.getAttribute('data-period');

          const lessons = state.lessonPlans[classId] || [];
          const { schedule } = Scheduler.generateScheduleForClass(classId);
          const targetSchedIdx = schedule.findIndex(s => s.slot.date === date && s.slot.periodId === periodId);

          let insertIdx = 0;
          if (targetSchedIdx >= 0) {
            let prevLesson = null;
            for (let i = targetSchedIdx - 1; i >= 0; i--) {
              if (schedule[i].lesson && !schedule[i].lesson.isAutofilled) {
                prevLesson = schedule[i].lesson;
                break;
              }
            }
            if (prevLesson) {
              const prevIdx = lessons.findIndex(l => l.id === prevLesson.id);
              if (prevIdx >= 0) insertIdx = prevIdx + 1;
            }
          }

          const prevLesson = insertIdx > 0 ? lessons[insertIdx - 1] : null;
          const nextLesson = insertIdx < lessons.length ? lessons[insertIdx] : null;

          let targetUnit = 'General Curriculum';
          if (prevLesson && prevLesson.unit) {
            targetUnit = prevLesson.unit;
          } else if (nextLesson && nextLesson.unit) {
            targetUnit = nextLesson.unit;
          }

          const floatCount = lessons.filter(l => l.isFloat).length + 1;
          const newFloat = {
            id: `float_${Date.now()}`,
            title: `🎈 Float / Free Lesson #${floatCount}`,
            unit: targetUnit,
            isFloat: true,
            content: 'Unstructured float / catch-up lesson. Discarded FIRST during pacing conflicts.'
          };

          lessons.splice(insertIdx, 0, newFloat);
          state.saveState();

          this.showReanalysisOverlay('Re-analyzing Schedule & Inserting Float...');
          setTimeout(() => {
            this.hideReanalysisOverlay();
            refreshAllViews(false, true);
          }, 350);
          return;
        }

        const removeFloatBtn = e.target.closest('.btn-remove-slot-float');
        if (removeFloatBtn) {
          e.preventDefault();
          e.stopPropagation();
          const classId = removeFloatBtn.getAttribute('data-class');
          const lessonId = removeFloatBtn.getAttribute('data-lesson-id');
          if (classId && lessonId) {
            state.lessonPlans[classId] = (state.lessonPlans[classId] || []).filter(l => l.id !== lessonId);
            state.saveState();

            this.showReanalysisOverlay('Re-analyzing Schedule...');
            setTimeout(() => {
              this.hideReanalysisOverlay();
              refreshAllViews(false, true);
            }, 350);
          }
          return;
        }

        const slotItem = e.target.closest('.master-slot-item');
        if (slotItem && !e.target.closest('button')) {
          const classId = slotItem.getAttribute('data-class-id');
          const lessonId = slotItem.getAttribute('data-lesson-id');
          const dateStr = slotItem.getAttribute('data-date');
          const periodId = slotItem.getAttribute('data-period');
          const classObj = state.classes.find(c => c.id === classId);

          if (lessonId) {
            const lessons = state.lessonPlans[classId] || [];
            const lesson = lessons.find(l => l.id === lessonId);
            if (lesson && classObj) {
              LessonViewer.open(lesson, classObj, { termName: '', date: dateStr, periodId: periodId, periodName: '' });
            }
          } else if (classId) {
            LessonUI.openAddLessonModal(classId, dateStr, periodId);
          }
        }
      });
    },

    bindDragAndDropEvents() {
      const container = document.getElementById('master-calendar-grid-container');
      if (!container) {
        console.warn('[MasterScheduleUI] Master calendar grid container not found.');
        return;
      }

      const items = container.querySelectorAll('.master-slot-item[draggable="true"]');
      items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
          const payload = {
            classId: item.getAttribute('data-class-id'),
            lessonId: item.getAttribute('data-lesson-id'),
            date: item.getAttribute('data-date'),
            periodId: item.getAttribute('data-period')
          };
          console.log('[Calendar DragDrop] DragStart event triggered:', payload);
          e.dataTransfer.setData('text/plain', JSON.stringify(payload));
          item.style.opacity = '0.5';
        });

        item.addEventListener('dragend', () => {
          item.style.opacity = '1';
        });
      });

      const allSlotItems = container.querySelectorAll('.master-slot-item:not(.blockout)');
      allSlotItems.forEach(slot => {
        slot.addEventListener('dragover', (e) => {
          e.preventDefault();
          slot.style.background = 'rgba(59, 130, 246, 0.25)';
        });

        slot.addEventListener('dragleave', () => {
          slot.style.background = '';
        });

        slot.addEventListener('drop', (e) => {
          e.preventDefault();
          slot.style.background = '';

          try {
            const rawData = e.dataTransfer.getData('text/plain');
            if (!rawData) {
              console.error('[Calendar DragDrop Error] Drop payload is empty.');
              return;
            }
            const data = JSON.parse(rawData);

            const sourceClassId = data.classId;
            const draggedLessonId = data.lessonId;

            const targetClassId = slot.getAttribute('data-class-id');
            const targetDate = slot.getAttribute('data-date');
            const targetPeriodId = slot.getAttribute('data-period');
            const targetLessonId = slot.getAttribute('data-lesson-id');

            if (!draggedLessonId) return;
            if (sourceClassId !== targetClassId) return;

            const lessons = state.lessonPlans[targetClassId] || [];
            const srcIdx = lessons.findIndex(l => l.id === draggedLessonId);
            if (srcIdx === -1) return;

            const [draggedLesson] = lessons.splice(srcIdx, 1);
            let insertIdx = -1;

            if (targetLessonId && targetLessonId !== draggedLessonId) {
              insertIdx = lessons.findIndex(l => l.id === targetLessonId);
            }

            if (insertIdx === -1) {
              const { schedule } = Scheduler.generateScheduleForClass(targetClassId);
              const targetSchedIdx = schedule.findIndex(s => s.slot.date === targetDate && s.slot.periodId === targetPeriodId);

              if (targetSchedIdx >= 0) {
                let prevLesson = null;
                for (let i = targetSchedIdx - 1; i >= 0; i--) {
                  if (schedule[i].lesson && schedule[i].lesson.id !== draggedLessonId && !schedule[i].lesson.isAutofilled) {
                    prevLesson = schedule[i].lesson;
                    break;
                  }
                }
                if (prevLesson) {
                  const prevIdx = lessons.findIndex(l => l.id === prevLesson.id);
                  if (prevIdx >= 0) insertIdx = prevIdx + 1;
                }
              }
            }

            if (insertIdx === -1 || insertIdx < 0) {
              insertIdx = 0;
            }

            insertIdx = Math.min(insertIdx, lessons.length);
            lessons.splice(insertIdx, 0, draggedLesson);

            console.log(`[Calendar DragDrop Success] Moved "${draggedLesson.title}" to sequence index ${insertIdx}`);
            state.saveState();
            refreshAllViews(false, true);
          } catch (err) {
            console.error('[Calendar DragDrop Critical Error]', err);
          }
        });
      });
    },

    bindEvents() {
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.pill-btn');
        if (btn) {
          const type = btn.getAttribute('data-type');
          const id = btn.getAttribute('data-id');
          const num = btn.getAttribute('data-num');
          this.toggleFilter(type, id || num);
          this.renderNavBar();
          this.renderConflictBanner();
          this.renderCalendarGrid();
        }
      });

      document.addEventListener('click', (e) => {
        const slotEl = e.target.closest('.master-slot-item');
        if (slotEl && !slotEl.classList.contains('blockout')) {
          const classId = slotEl.getAttribute('data-class-id');
          const lessonId = slotEl.getAttribute('data-lesson-id');
          const dateStr = slotEl.getAttribute('data-date');
          const periodId = slotEl.getAttribute('data-period');
          if (classId && lessonId) {
            const classObj = state.classes.find(c => c.id === classId);
            const lessons = state.lessonPlans[classId] || [];
            const lesson = lessons.find(l => l.id === lessonId);
            const periodObj = state.periods.find(p => p.id === periodId);
            const term = TermManager.getTermForDate(dateStr);
            const slotInfo = {
              date: dateStr,
              termName: term ? term.name : '',
              periodName: periodObj ? periodObj.name : ''
            };
            if (lesson && classObj) {
              LessonViewer.open(lesson, classObj, slotInfo);
            }
          }
        }
      });

      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-resolve-conflict')) {
          const classId = e.target.getAttribute('data-class');
          ConflictModal.open(classId);
        }
      });
    }
  };

  const ConflictModal = {
    currentClassId: null,

    open(classId) {
      this.currentClassId = classId;
      const backdrop = document.getElementById('modal-conflict-backdrop');
      if (!backdrop) return;
      this.renderModalContent();
      backdrop.classList.add('active');
    },

    renderModalContent() {
      const container = document.getElementById('conflict-modal-body');
      if (!container || !this.currentClassId) return;

      const conflicts = Scheduler.analyzeConflicts(this.currentClassId);
      const lessons = state.lessonPlans[this.currentClassId] || [];

      if (conflicts.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:2rem; color:var(--accent-emerald);">
            <div style="font-size:2.5rem; margin-bottom:0.5rem;">🎉</div>
            <h3>No Pacing Conflicts!</h3>
            <p style="color:var(--text-muted); font-size:0.9rem; margin-top:0.5rem;">
              All lesson plans fit into available class slots before deadlines.
            </p>
          </div>
        `;
        return;
      }

      const conflict = conflicts[0];
      const revisionLessons = lessons.filter(l => l.isRevision);

      let html = `
        <div style="margin-bottom:1.25rem;">
          <div style="font-size:0.9rem; color:var(--text-muted);">Deficit Overview:</div>
          <div style="font-size:1.1rem; font-weight:700; color:#fca5a5; margin-top:0.2rem;">
            Missing ${conflict.deficit} Class Slot(s) before "${conflict.testLesson ? conflict.testLesson.title : 'Milestone'}"
          </div>
        </div>

        <div style="margin-bottom:1.5rem;">
          <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; color:var(--text-main);">
            Option 1: Remove a Tagged Revision Lesson
          </h4>
      `;

      if (revisionLessons.length === 0) {
        html += `<div style="font-size:0.85rem; color:var(--text-dim); italic;">No revision lessons currently tagged for this class. Tag lessons as "Revision" in the Lesson Manager to use this option.</div>`;
      } else {
        revisionLessons.forEach(l => {
          html += `
            <div class="resolution-card">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${l.title}</strong>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${l.unit || 'Revision'}</div>
                </div>
                <button class="btn btn-warning btn-sm btn-drop-revision" data-id="${l.id}">
                  ✂️ Prune Lesson
                </button>
              </div>
            </div>
          `;
        });
      }

      html += `
        </div>

        <div>
          <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; color:var(--text-main);">
            Option 2: Merge 2 Adjacent Lessons into 1 Class Slot
          </h4>
      `;

      if (lessons.length < 2) {
        html += `<div style="font-size:0.85rem; color:var(--text-dim);">Need at least 2 lessons to merge.</div>`;
      } else {
        for (let i = 0; i < lessons.length - 1; i++) {
          const l1 = lessons[i];
          const l2 = lessons[i + 1];
          html += `
            <div class="resolution-card">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${l1.title}</strong> + <strong>${l2.title}</strong>
                  <div style="font-size:0.75rem; color:var(--text-muted);">Combines 2 lessons into 1 single period slot</div>
                </div>
                <button class="btn btn-primary btn-sm btn-merge-lessons" data-id1="${l1.id}" data-id2="${l2.id}">
                  🔀 Merge
                </button>
              </div>
            </div>
          `;
        }
      }

      html += `</div>`;
      container.innerHTML = html;
    },

    bindEvents() {
      document.addEventListener('click', (e) => {
        const dropBtn = e.target.closest('.btn-drop-revision');
        if (dropBtn) {
          const lessonId = dropBtn.getAttribute('data-id');
          Scheduler.dropRevisionLesson(this.currentClassId, lessonId);
          this.renderModalContent();
          refreshAllViews(false, true);
        }
      });

      document.addEventListener('click', (e) => {
        const mergeBtn = e.target.closest('.btn-merge-lessons');
        if (mergeBtn) {
          const id1 = mergeBtn.getAttribute('data-id1');
          const id2 = mergeBtn.getAttribute('data-id2');
          Scheduler.mergeLessons(this.currentClassId, id1, id2);
          this.renderModalContent();
          refreshAllViews(false, true);
        }
      });
    }
  };

  // Requirement 1: Interactive Spotlight Tour Engine
  const SpotlightTour = {
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

      // Switch to target view panel
      const navBtn = document.querySelector(`.app-nav .nav-btn[data-view="${step.view}"]`);
      if (navBtn) navBtn.click();

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

      let tooltipTop = window.scrollY + rect.bottom + 15;
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
        // Requirement 6: Clear all placeholder data on tutorial completion for a 100% clean slate!
        state.clearAllPlaceholderData();
        refreshAllViews();
        alert('Tutorial complete! Demo placeholder data cleared. Your planner is fresh and ready!');
      } else {
        state.data.tutorialCompleted = true;
        state.saveState();
      }
    }
  };

  // Period Config UI Engine (Req 2)
  const PeriodConfigUI = {
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
              <input type="text" class="form-control period-name-input" data-index="${idx}" value="${p.name}">
            </td>
            <td>
              <!-- Requirement 2: Native HTML <input type="time"> for period start time -->
              <input type="time" class="form-control period-starttime-input" data-index="${idx}" value="${p.startTime || '09:00'}">
            </td>
            <td>
              <!-- Requirement 2: Native HTML <input type="time"> for period end time -->
              <input type="time" class="form-control period-endtime-input" data-index="${idx}" value="${p.endTime || '10:00'}">
            </td>
            <td>
              ${p.isBreak ? '<span class="tag tag-revision">Break</span>' : '<span class="tag tag-locked">Period</span>'}
            </td>
            <td>
              <button class="btn btn-secondary btn-sm move-period-up" data-index="${idx}">⬆️</button>
              <button class="btn btn-secondary btn-sm move-period-down" data-index="${idx}">⬇️</button>
              <button class="btn btn-danger btn-sm delete-period-btn" data-index="${idx}">🗑️</button>
            </td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
      container.innerHTML = html;
    },

    bindEvents() {
      document.addEventListener('change', (e) => {
        if (e.target.classList.contains('period-name-input')) {
          const idx = parseInt(e.target.getAttribute('data-index'), 10);
          state.periods[idx].name = e.target.value;
          state.saveState();
        }
        if (e.target.classList.contains('period-starttime-input')) {
          const idx = parseInt(e.target.getAttribute('data-index'), 10);
          state.periods[idx].startTime = e.target.value;
          state.saveState();
        }
        if (e.target.classList.contains('period-endtime-input')) {
          const idx = parseInt(e.target.getAttribute('data-index'), 10);
          state.periods[idx].endTime = e.target.value;
          state.saveState();
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
            refreshAllViews(false, true);
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
            refreshAllViews(false, true);
          }
        }
        if (e.target.classList.contains('delete-period-btn')) {
          const idx = parseInt(e.target.getAttribute('data-index'), 10);
          state.periods.splice(idx, 1);
          state.saveState();
          this.renderPeriodTable();
          refreshAllViews(false, true);
        }
      });

      const formatSelect = document.getElementById('time-format-select');
      if (formatSelect) {
        formatSelect.addEventListener('change', (e) => {
          state.setTimeFormat(e.target.value);
          refreshAllViews(false, false);
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
          refreshAllViews(false, true);
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
          refreshAllViews(false, true);
        });
      }
    }
  };

  const HomeworkUI = {
    selectedClassId: null,
    selectedTermId: 't1',
    selectedWeekNum: 1,
    coveredLessonLimit: null,
    selectedFormatStyle: 'multiline_bullet',
    whiteboardFontScale: 1.0,
    isManualFontScale: false,
    whiteboardLayoutMode: 'bubbles', // 'bubbles' | 'list'

    toggleWhiteboardLayout() {
      this.whiteboardLayoutMode = (this.whiteboardLayoutMode === 'bubbles') ? 'list' : 'bubbles';
      const btn = document.getElementById('btn-toggle-wb-layout');
      if (btn) {
        btn.innerHTML = (this.whiteboardLayoutMode === 'bubbles') ? '🫧 Bubbles' : '📋 List';
        btn.title = (this.whiteboardLayoutMode === 'bubbles') ? 'Switch to Vertical List view' : 'Switch to Bubbled Grid view';
      }
      this.renderWhiteboardContent();
    },

    updateWhiteboardFontScale(scale, isManual = true) {
      this.whiteboardFontScale = Math.max(0.7, Math.min(3.0, Math.round(scale * 20) / 20));
      if (isManual) this.isManualFontScale = true;

      const backdrop = document.getElementById('modal-whiteboard-backdrop');
      if (backdrop) {
        backdrop.style.setProperty('--wb-font-scale', this.whiteboardFontScale);
      }

      const label = document.getElementById('wb-zoom-label');
      if (label) {
        const pct = Math.round(this.whiteboardFontScale * 100);
        label.textContent = `${pct}%${this.isManualFontScale ? '' : ' (Auto)'}`;
      }
    },

    calculateAutoFontScale(totalItems, categoryCount = 1) {
      const isBubbles = (this.whiteboardLayoutMode !== 'list');
      if (isBubbles) {
        if (totalItems <= 4) return 1.6;
        if (totalItems <= 8) return 1.35;
        if (totalItems <= 14) return 1.15;
        return 1.0;
      } else {
        if (totalItems <= 2) return 1.6;
        if (totalItems <= 4) return 1.35;
        if (totalItems <= 6) return 1.15;
        return 1.0;
      }
    },

    init() {
      if (state.classes.length > 0 && (!this.selectedClassId || this.selectedClassId === 'ALL')) {
        this.selectedClassId = state.classes[0].id;
      }
      this.ensureDefaultTermAndWeek();
      this.renderClassSelector();
      this.renderTermAndWeekPicker();
      this.renderMainContent();
      this.bindEvents();
    },

    ensureDefaultTermAndWeek() {
      const currentDate = state.currentDate || '2026-07-22';
      const currentTerm = TermManager.getTermForDate(currentDate) || state.terms[0];
      if (currentTerm) {
        this.selectedTermId = currentTerm.id;
        const termStart = TermManager.parseLocalDate(currentTerm.startDate);
        const curr = TermManager.parseLocalDate(currentDate);
        if (termStart && curr) {
          const diffDays = Math.round((curr - termStart) / (1000 * 60 * 60 * 24));
          this.selectedWeekNum = Math.max(1, Math.min(currentTerm.weeks || 10, Math.floor(diffDays / 7) + 1));
        }
      }
    },

    renderClassSelector() {
      const container = document.getElementById('homework-class-selector');
      if (!container) return;

      if (state.classes.length > 0 && (!this.selectedClassId || !state.classes.some(c => c.id === this.selectedClassId))) {
        this.selectedClassId = state.classes[0].id;
      }

      let html = '';

      state.classes.forEach(c => {
        const active = c.id === this.selectedClassId ? 'active' : '';
        html += `
          <button class="nav-btn ${active}" data-id="${c.id}" style="padding: 0.35rem 0.75rem; font-size: 0.85rem;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${c.color}; margin-right:4px;"></span>
            ${c.name}
          </button>
        `;
      });

      container.innerHTML = html;
    },

    renderTermAndWeekPicker() {
      const termSelect = document.getElementById('homework-term-select');
      const weekSelect = document.getElementById('homework-week-select');
      if (!termSelect || !weekSelect) return;

      termSelect.innerHTML = state.terms.map(t => {
        const selected = t.id === this.selectedTermId ? 'selected' : '';
        return `<option value="${t.id}" ${selected}>${t.name}</option>`;
      }).join('');

      const term = state.terms.find(t => t.id === this.selectedTermId) || state.terms[0];
      const totalWeeks = term ? (term.weeks || 10) : 10;

      let weekHtml = '';
      for (let w = 1; w <= totalWeeks; w++) {
        const selected = w === this.selectedWeekNum ? 'selected' : '';
        weekHtml += `<option value="${w}" ${selected}>Week ${w}</option>`;
      }
      weekSelect.innerHTML = weekHtml;
    },

    getSelectedWeekDateRange() {
      const term = state.terms.find(t => t.id === this.selectedTermId) || state.terms[0];
      if (!term) return { startDateStr: '', endDateStr: '', label: '' };

      const termStart = TermManager.parseLocalDate(term.startDate);
      if (!termStart) return { startDateStr: '', endDateStr: '', label: '' };

      const weekStart = new Date(termStart);
      weekStart.setDate(termStart.getDate() + (this.selectedWeekNum - 1) * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4);

      const startDateStr = TermManager.formatLocalDate(weekStart);
      const endDateStr = TermManager.formatLocalDate(weekEnd);

      const label = `${term.name}, Week ${this.selectedWeekNum} (${TermManager.formatDisplayDate(startDateStr)} - ${TermManager.formatDisplayDate(endDateStr)})`;

      return { startDateStr, endDateStr, label, weekStart, weekEnd };
    },

    getScheduledLessonsForSelectedWeek() {
      const { startDateStr, endDateStr } = this.getSelectedWeekDateRange();
      if (!startDateStr || !endDateStr) return [];

      if (state.classes.length > 0 && (!this.selectedClassId || !state.classes.some(c => c.id === this.selectedClassId))) {
        this.selectedClassId = state.classes[0].id;
      }

      const targetClass = state.classes.find(c => c.id === this.selectedClassId);
      if (!targetClass) return [];

      const results = [];

      const { schedule } = Scheduler.generateScheduleForClass(targetClass.id);
      schedule.forEach(entry => {
        if (entry.slot && entry.slot.date >= startDateStr && entry.slot.date <= endDateStr && entry.lesson) {
          results.push({
            slot: entry.slot,
            lesson: entry.lesson,
            classObj: targetClass
          });
        }
      });

      results.sort((a, b) => {
        if (a.slot.date !== b.slot.date) return a.slot.date.localeCompare(b.slot.date);

        const pA = state.periods.find(p => p.id === a.slot.periodId);
        const pB = state.periods.find(p => p.id === b.slot.periodId);

        if (pA && pB) {
          if (pA.startTime && pB.startTime && pA.startTime !== pB.startTime) {
            return pA.startTime.localeCompare(pB.startTime);
          }
          const idxA = state.periods.findIndex(p => p.id === a.slot.periodId);
          const idxB = state.periods.findIndex(p => p.id === b.slot.periodId);
          if (idxA !== -1 && idxB !== -1 && idxA !== idxB) {
            return idxA - idxB;
          }
        }

        return (a.slot.periodId || '').localeCompare(b.slot.periodId || '', undefined, { numeric: true });
      });

      return results;
    },

    getFormattedClassworkForLesson(lesson) {
      if (!lesson || !lesson.classwork || !Array.isArray(lesson.classwork)) return [];
      return lesson.classwork.filter(item => item && (item.type || item.work));
    },

    aggregateTaskObjects(taskList) {
      if (!Array.isArray(taskList) || taskList.length === 0) return [];

      const chapters = {};
      const chapterOrder = [];
      const simpleItems = [];

      taskList.forEach(raw => {
        if (!raw) return;
        const workStr = (typeof raw === 'string' ? raw : raw.work || '').trim();
        const linkStr = (typeof raw === 'object' && raw.link) ? raw.link.trim() : '';

        if (!workStr) return;

        const colonIdx = workStr.indexOf(':');
        if (colonIdx > 0) {
          const prefix = workStr.substring(0, colonIdx).trim();
          const rest = workStr.substring(colonIdx + 1).trim();

          if (!chapters[prefix]) {
            chapters[prefix] = [];
            chapterOrder.push(prefix);
          }
          if (rest) {
            const existing = chapters[prefix].find(x => x.work === rest);
            if (!existing) {
              chapters[prefix].push({ work: rest, link: linkStr });
            } else if (!existing.link && linkStr) {
              existing.link = linkStr;
            }
          }
        } else {
          const existing = simpleItems.find(x => x.work === workStr);
          if (!existing) {
            simpleItems.push({ work: workStr, link: linkStr });
          } else if (!existing.link && linkStr) {
            existing.link = linkStr;
          }
        }
      });

      const results = [];

      chapterOrder.forEach(prefix => {
        const qList = chapters[prefix];
        results.push({
          type: 'chapter',
          prefix: prefix,
          items: qList
        });
      });

      if (simpleItems.length > 0) {
        results.push({
          type: 'simple',
          items: simpleItems
        });
      }

      return results;
    },

    aggregateTaskItems(taskList) {
      if (!Array.isArray(taskList) || taskList.length === 0) return [];
      const structured = this.aggregateTaskObjects(taskList);

      return structured.map(bullet => {
        if (bullet.type === 'chapter') {
          if (bullet.items.length === 0) return bullet.prefix;
          return `${bullet.prefix}: ${bullet.items.map(i => i.work).join(', ')}`;
        } else {
          return bullet.items.map(i => i.work).join(', ');
        }
      });
    },

    generateSummaryText(scheduledEntries = null, formatStyle = null) {
      const entries = scheduledEntries || this.getScheduledLessonsForSelectedWeek();
      if (entries.length === 0) return '(No classwork recorded for this week)';

      const grouped = {};
      const links = [];

      entries.forEach(entry => {
        const items = this.getFormattedClassworkForLesson(entry.lesson);
        items.forEach(item => {
          const typeKey = (item.type || 'General').trim();
          if (!grouped[typeKey]) {
            grouped[typeKey] = [];
          }
          if (item.work && item.work.trim()) {
            grouped[typeKey].push({
              work: item.work.trim(),
              link: item.link || ''
            });
            if (item.link && item.link.trim()) {
              links.push({
                type: typeKey,
                name: item.work.trim(),
                url: item.link.trim()
              });
            }
          }
        });
      });

      const keys = Object.keys(grouped);
      if (keys.length === 0) return '(No classwork tasks recorded for this week)';

      const lines = [];
      keys.forEach(key => {
        const aggregated = this.aggregateTaskItems(grouped[key]);
        lines.push(`${key}: ${aggregated.join(', ')}`);
      });

      let text = lines.join('\n\n');

      if (links.length > 0) {
        const uniqueLinks = [];
        links.forEach(l => {
          if (!uniqueLinks.some(u => u.url === l.url)) {
            uniqueLinks.push(l);
          }
        });

        text += '\n\nLinks:\n' + uniqueLinks.map(l => `• ${l.type} (${l.name}): ${l.url}`).join('\n');
      }

      return text;
    },

    renderMainContent() {
      const container = document.getElementById('homework-main-content');
      if (!container) return;

      const weekRange = this.getSelectedWeekDateRange();
      const scheduledEntries = this.getScheduledLessonsForSelectedWeek();
      const selectedClass = state.classes.find(c => c.id === this.selectedClassId);
      const selectedClassName = selectedClass ? selectedClass.name : 'Selected Class';

      if (scheduledEntries.length === 0) {
        container.innerHTML = `
          <div class="homework-empty-state">
            <div style="font-size:2.5rem; margin-bottom:0.75rem;">📅</div>
            <h3 style="font-weight:700; font-size:1.1rem; margin-bottom:0.4rem;">No Scheduled Classes Found for ${selectedClassName} in ${weekRange.label}</h3>
            <p style="font-size:0.85rem; max-width:500px; margin:0 auto;">
              Ensure class timetable slots are set up in <strong>"2. Timetable Rotation"</strong> and curriculum lesson plans are defined in <strong>"3. Curriculum & Lessons"</strong>.
            </p>
          </div>
        `;
        return;
      }

      let cardsHtml = '';
      scheduledEntries.forEach((entry, idx) => {
        const { slot, lesson, classObj } = entry;
        const classworkItems = this.getFormattedClassworkForLesson(lesson);

        let classworkHtml = '';
        if (classworkItems.length === 0) {
          classworkHtml = `<div style="font-size:0.82rem; color:var(--text-dim); font-style:italic;">No classwork tasks specified. Edit lesson to add tasks.</div>`;
        } else {
          classworkHtml = classworkItems.map(cw => {
            const typeLower = (cw.type || '').toLowerCase();
            let badgeClass = 'cw-badge-default';
            if (typeLower.includes('note')) badgeClass = 'cw-badge-notes';
            else if (typeLower.includes('text') || typeLower.includes('book')) badgeClass = 'cw-badge-textbook';
            else if (typeLower.includes('sheet') || typeLower.includes('work')) badgeClass = 'cw-badge-worksheets';
            else if (typeLower.includes('hand') || typeLower.includes('print')) badgeClass = 'cw-badge-handout';

            const workText = cw.work || '(No description)';
            const contentHtml = cw.link ? `<a href="${cw.link}" target="_blank" style="color:var(--primary); text-decoration:underline;" title="Open material link">${workText}</a>` : workText;

            return `
              <div style="margin-bottom:0.4rem; font-size:0.88rem;">
                <span class="cw-badge ${badgeClass}">${cw.type || 'Task'}</span>
                <strong>${contentHtml}</strong>
              </div>
            `;
          }).join('');
        }

        const days = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const dayName = days[slot.dayOfWeek] || '';

        const linkedClasses = state.getLinkedClasses(classObj.id);
        const hasLinked = linkedClasses.length > 0;
        const syncTileBtn = hasLinked ? `
          <button type="button" class="btn btn-secondary btn-xs hw-card-sync-btn" data-class="${classObj.id}" data-lesson-id="${lesson.id}" style="font-size:0.75rem; padding:0.2rem 0.5rem; font-weight:700;" title="Sync homework tasks to ${linkedClasses.map(l => l.name).join(', ')}">
            🔄 Sync Tile
          </button>
        ` : '';

        cardsHtml += `
          <div class="homework-lesson-card" data-class="${classObj.id}" data-lesson-id="${lesson.id}" style="cursor:pointer;" title="Click to view/edit lesson plan & classwork">
            <div class="homework-card-header">
              <div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${classObj.color};"></span>
                  <span style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">${classObj.name}</span>
                </div>
                <div class="homework-lesson-title" style="margin-top:0.25rem;">${idx + 1}. ${lesson.title}</div>
                <div style="font-size:0.75rem; color:var(--text-dim);">${lesson.unit || 'General Curriculum'}</div>
              </div>
              <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.35rem;">
                <div class="homework-slot-badge" style="text-align: right; line-height: 1.35; white-space: nowrap; padding: 0.35rem 0.75rem;">
                  <div>${dayName} ${slot.periodName}</div>
                  <div style="font-size:0.75rem; opacity:0.9; font-weight:500;">(${TermManager.formatDisplayDate(slot.date)})</div>
                </div>
                <div style="display:flex; gap:0.35rem; margin-top:0.25rem; flex-wrap:wrap; justify-content:flex-end;">
                  ${syncTileBtn}
                  <button type="button" class="btn btn-secondary btn-xs btn-edit-homework-lesson" data-class="${classObj.id}" data-lesson-id="${lesson.id}" style="font-size:0.75rem; padding:0.2rem 0.5rem;" title="Edit lesson plan & classwork">
                    ✏️ Edit
                  </button>
                </div>
              </div>
            </div>
            <div>${classworkHtml}</div>
          </div>
        `;
      });

      const renderedMarkdownHTML = this.generateSummaryHTML(scheduledEntries);

      container.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
          <h4 class="homework-section-title">
            🗓️ Scheduled Lessons & Classwork for ${selectedClassName} — ${weekRange.label} (${scheduledEntries.length} Lesson Period/s)
          </h4>
          <div class="homework-grid">
            ${cardsHtml}
          </div>
        </div>

        <div class="homework-summary-wrapper">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
            <div style="font-weight:700; font-size:0.95rem; color:var(--text-main); display:flex; align-items:center; gap:0.5rem;">
              <span>📋 Formatted Homework Summary for ${selectedClassName}</span>
              <span class="homework-summary-badge">
                ✨ Highlight & Copy (Ctrl+C)
              </span>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-select-summary-text" style="font-size:0.8rem; padding:0.35rem 0.85rem; font-weight:700;" title="Select all text below for quick Ctrl+C copy">
              🔍 Select All Text
            </button>
          </div>

          <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.75rem;">
            💡 Highlight the text inside the box below and press <strong>Ctrl+C</strong> to copy with bold headers and active links directly into Google Classroom!
          </div>

          <div id="homework-summary-markdown-box" class="homework-summary-rendered-box">
            ${renderedMarkdownHTML}
          </div>
        </div>
      `;
    },

    openWhiteboardModal() {
      if (!this.selectedClassId || !state.classes.some(c => c.id === this.selectedClassId)) {
        if (state.classes.length > 0) {
          this.selectedClassId = state.classes[0].id;
          this.renderClassSelector();
        } else {
          alert('Please create at least one class in "Timetable Rotation" before opening the Whiteboard display.');
          return;
        }
      }

      const backdrop = document.getElementById('modal-whiteboard-backdrop');
      if (!backdrop) return;

      this.isManualFontScale = false;
      this.coveredLessonLimit = null;
      this.renderWhiteboardContent();
      backdrop.classList.add('active');
    },

    renderWhiteboardContent() {
      const titleEl = document.getElementById('whiteboard-modal-title');
      const subtitleEl = document.getElementById('whiteboard-modal-subtitle');
      const progressButtonsContainer = document.getElementById('whiteboard-progress-buttons');
      const progressLabel = document.getElementById('whiteboard-progress-label');
      const bodyEl = document.getElementById('whiteboard-modal-body');

      const weekRange = this.getSelectedWeekDateRange();
      const scheduledEntries = this.getScheduledLessonsForSelectedWeek();
      const selectedClass = state.classes.find(c => c.id === this.selectedClassId);
      const selectedClassName = selectedClass ? selectedClass.name : 'Class';

      if (titleEl) titleEl.textContent = `Classwork & Homework — ${selectedClassName}`;
      if (subtitleEl) subtitleEl.textContent = weekRange.label;

      if (scheduledEntries.length === 0) {
        if (progressButtonsContainer) progressButtonsContainer.innerHTML = '';
        if (bodyEl) {
          bodyEl.innerHTML = `<div style="text-align:center; padding:4rem; font-size:1.5rem; color:#94a3b8;">No scheduled lessons or classwork found for ${selectedClassName} this week.</div>`;
        }
        return;
      }

      const totalLessons = scheduledEntries.length;
      let btnHtml = `
        <button class="btn ${this.coveredLessonLimit === null ? 'btn-primary' : 'btn-secondary'} btn-sm wb-progress-btn" data-limit="all">
          All Lessons (${totalLessons}/${totalLessons})
        </button>
      `;

      for (let i = 1; i <= totalLessons; i++) {
        const active = this.coveredLessonLimit === i ? 'btn-primary' : 'btn-secondary';
        btnHtml += `
          <button class="btn ${active} btn-sm wb-progress-btn" data-limit="${i}">
            Up to Lesson ${i}
          </button>
        `;
      }
      if (progressButtonsContainer) progressButtonsContainer.innerHTML = btnHtml;

      if (progressLabel) {
        progressLabel.textContent = (this.coveredLessonLimit === null)
          ? `Showing All ${totalLessons} Lessons`
          : `Showing Lessons 1 to ${this.coveredLessonLimit} of ${totalLessons}`;
      }

      const visibleEntries = (this.coveredLessonLimit === null)
        ? scheduledEntries
        : scheduledEntries.slice(0, this.coveredLessonLimit);

      const groupedByType = {};

      visibleEntries.forEach(entry => {
        const items = this.getFormattedClassworkForLesson(entry.lesson);
        items.forEach(item => {
          const typeKey = (item.type || 'General Work').trim();
          if (!groupedByType[typeKey]) groupedByType[typeKey] = [];
          groupedByType[typeKey].push({
            work: item.work || '',
            link: item.link || '',
            lessonTitle: entry.lesson.title,
            className: entry.classObj.name
          });
        });
      });

      const typeKeys = Object.keys(groupedByType);

      if (typeKeys.length === 0) {
        if (bodyEl) {
          bodyEl.innerHTML = `<div style="text-align:center; padding:4rem; font-size:1.4rem; color:#94a3b8;">No classwork tasks recorded for ${selectedClassName} for the selected lesson(s).</div>`;
        }
        return;
      }

      let totalWorkItemsCount = 0;
      const isBubbleLayout = (this.whiteboardLayoutMode !== 'list');
      let wbHtml = `<div class="whiteboard-cards-grid ${isBubbleLayout ? 'layout-bubbles' : 'layout-list'}">`;

      typeKeys.forEach(typeKey => {
        const items = groupedByType[typeKey];
        const structured = this.aggregateTaskObjects(items);
        totalWorkItemsCount += structured.length;

        let icon = '📌';
        const keyLower = typeKey.toLowerCase();
        if (keyLower.includes('note')) icon = '📝';
        else if (keyLower.includes('text') || keyLower.includes('book')) icon = '📖';
        else if (keyLower.includes('sheet') || keyLower.includes('work')) icon = '📄';
        else if (keyLower.includes('hand') || keyLower.includes('print')) icon = '📑';

        let itemsContentHtml = '';

        if (isBubbleLayout) {
          // Bubbled Flow & Horizontal Chips
          const bubblesHtml = structured.map(bullet => {
            if (bullet.type === 'chapter') {
              const chipsHtml = bullet.items.map(it => {
                if (it.link) {
                  return `<span class="wb-subitem-chip"><a href="${it.link}" target="_blank" class="wb-link" title="Open link">${it.work}</a></span>`;
                }
                return `<span class="wb-subitem-chip">${it.work}</span>`;
              }).join('');

              return `
                <div class="whiteboard-bubble-group">
                  <div class="wb-group-prefix">${bullet.prefix}</div>
                  <div class="wb-chips-row">${chipsHtml}</div>
                </div>
              `;
            } else {
              const tasksHtml = bullet.items.map(it => {
                const workContent = it.link
                  ? `<a href="${it.link}" target="_blank" class="wb-link" title="Open link">${it.work}</a>`
                  : `<span>${it.work}</span>`;
                return `
                  <div class="whiteboard-task-bubble">
                    <span class="wb-bullet">•</span>
                    <div>${workContent}</div>
                  </div>
                `;
              }).join('');
              return tasksHtml;
            }
          }).join('');

          itemsContentHtml = `<div class="whiteboard-items-flow">${bubblesHtml}</div>`;
        } else {
          // Classic Vertical List
          let itemsListHtml = '';
          structured.forEach(bullet => {
            let lineContent = '';
            if (bullet.type === 'chapter') {
              const formattedSubItems = bullet.items.map(it => {
                if (it.link) {
                  return `<a href="${it.link}" target="_blank" class="wb-link" title="Open link for ${it.work}">${it.work}</a>`;
                }
                return `<span>${it.work}</span>`;
              }).join(', ');

              lineContent = `<span>${bullet.prefix}${bullet.items.length > 0 ? ': ' : ''}</span>${formattedSubItems}`;
            } else {
              lineContent = bullet.items.map(it => {
                if (it.link) {
                  return `<a href="${it.link}" target="_blank" class="wb-link" title="Open link for ${it.work}">${it.work}</a>`;
                }
                return `<span>${it.work}</span>`;
              }).join(', ');
            }

            itemsListHtml += `
              <div class="whiteboard-work-item">
                <span class="wb-bullet">•</span>
                <div>${lineContent}</div>
              </div>
            `;
          });

          itemsContentHtml = `<div>${itemsListHtml}</div>`;
        }

        wbHtml += `
          <div class="whiteboard-card">
            <div class="whiteboard-type-header">
              <span>${icon}</span>
              <span>${typeKey}</span>
            </div>
            ${itemsContentHtml}
          </div>
        `;
      });

      wbHtml += '</div>';

      if (bodyEl) bodyEl.innerHTML = wbHtml;

      if (!this.isManualFontScale) {
        const autoScale = this.calculateAutoFontScale(totalWorkItemsCount, typeKeys.length);
        this.updateWhiteboardFontScale(autoScale, false);
      } else {
        this.updateWhiteboardFontScale(this.whiteboardFontScale, true);
      }
    },

    aggregateTaskItems(taskList) {
      if (!Array.isArray(taskList) || taskList.length === 0) return [];
      const structured = this.aggregateTaskObjects(taskList);

      return structured.map(bullet => {
        if (bullet.type === 'chapter') {
          if (bullet.items.length === 0) return bullet.prefix;
          return `${bullet.prefix}(${bullet.items.map(i => i.work).join(', ')})`;
        } else {
          return bullet.items.map(i => i.work).join(', ');
        }
      });
    },

    generateSummaryText(scheduledEntries = null) {
      const entries = scheduledEntries || this.getScheduledLessonsForSelectedWeek();
      if (entries.length === 0) return '(No classwork recorded for this week)';

      const selectedClass = state.classes.find(c => c.id === this.selectedClassId);
      const selectedClassName = selectedClass ? selectedClass.name : 'Class';

      const grouped = {};
      const links = [];

      entries.forEach(entry => {
        const items = this.getFormattedClassworkForLesson(entry.lesson);
        items.forEach(item => {
          const typeKey = (item.type || 'General').trim();
          if (!grouped[typeKey]) {
            grouped[typeKey] = [];
          }
          if (item.work && item.work.trim()) {
            grouped[typeKey].push({
              work: item.work.trim(),
              link: item.link || ''
            });
            if (item.link && item.link.trim()) {
              links.push({
                type: typeKey,
                name: item.work.trim(),
                url: item.link.trim()
              });
            }
          }
        });
      });

      const keys = Object.keys(grouped);
      if (keys.length === 0) return '(No classwork tasks recorded for this week)';

      const lines = [`${selectedClassName} Homework:`];
      keys.forEach(key => {
        lines.push(`${key}:`);
        lines.push('');
        const structured = this.aggregateTaskObjects(grouped[key]);
        structured.forEach(bullet => {
          if (bullet.type === 'chapter') {
            const subContent = bullet.items.map(it => it.work).join(', ');
            lines.push(`• ${bullet.prefix}${bullet.items.length > 0 ? ': ' : ''}${subContent}`);
          } else {
            const subContent = bullet.items.map(it => it.work).join(', ');
            lines.push(`• ${subContent}`);
          }
        });
        lines.push('');
      });

      if (links.length > 0) {
        const uniqueLinks = [];
        links.forEach(l => {
          if (!uniqueLinks.some(u => u.url === l.url)) {
            uniqueLinks.push(l);
          }
        });

        lines.push('Links:');
        uniqueLinks.forEach(l => {
          lines.push(`• ${l.type} (${l.name}): ${l.url}`);
        });
      }

      return lines.join('\n').trim();
    },

    generateSummaryHTML(scheduledEntries = null) {
      const entries = scheduledEntries || this.getScheduledLessonsForSelectedWeek();
      if (entries.length === 0) return '<div>(No classwork recorded for this week)</div>';

      const selectedClass = state.classes.find(c => c.id === this.selectedClassId);
      const selectedClassName = selectedClass ? selectedClass.name : 'Class';

      const grouped = {};
      const links = [];

      entries.forEach(entry => {
        const items = this.getFormattedClassworkForLesson(entry.lesson);
        items.forEach(item => {
          const typeKey = (item.type || 'General').trim();
          if (!grouped[typeKey]) {
            grouped[typeKey] = [];
          }
          if (item.work && item.work.trim()) {
            grouped[typeKey].push({
              work: item.work.trim(),
              link: item.link || ''
            });
            if (item.link && item.link.trim()) {
              links.push({
                type: typeKey,
                name: item.work.trim(),
                url: item.link.trim()
              });
            }
          }
        });
      });

      const keys = Object.keys(grouped);
      if (keys.length === 0) return '<div>(No classwork tasks recorded for this week)</div>';

      let html = '<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.6;">';
      html += `<div style="margin-bottom: 0.25rem; font-weight: 700;">${selectedClassName} Homework:</div>`;

      keys.forEach((key) => {
        html += `<div style="margin-top: 0.5rem; margin-bottom: 0.35rem; font-weight: 700;">${key}:</div>`;
        const structured = this.aggregateTaskObjects(grouped[key]);
        structured.forEach(bullet => {
          if (bullet.type === 'chapter') {
            const subContent = bullet.items.map(it => it.work).join(', ');
            html += `<div style="margin-bottom: 0.2rem;">• ${bullet.prefix}${bullet.items.length > 0 ? ': ' : ''}${subContent}</div>`;
          } else {
            const subContent = bullet.items.map(it => it.work).join(', ');
            html += `<div style="margin-bottom: 0.2rem;">• ${subContent}</div>`;
          }
        });
        html += '<div style="height: 0.5rem;"></div>';
      });

      if (links.length > 0) {
        const uniqueLinks = [];
        links.forEach(l => {
          if (!uniqueLinks.some(u => u.url === l.url)) {
            uniqueLinks.push(l);
          }
        });

        html += '<div style="margin-top: 0.5rem; margin-bottom: 0.25rem; font-weight: 700;">Links:</div>';
        uniqueLinks.forEach(l => {
          html += `<div style="margin-bottom: 0.2rem;">• ${l.type} (${l.name}): <a href="${l.url}" target="_blank" style="color: var(--primary-light, #0284c7); text-decoration: underline;">${l.url}</a></div>`;
        });
      }

      html += '</div>';
      return html;
    },

    copySummaryToClipboard() {
      const plainText = this.generateSummaryText();
      const htmlText = this.generateSummaryHTML();

      if (navigator.clipboard && window.ClipboardItem) {
        const textBlob = new Blob([plainText], { type: 'text/plain' });
        const htmlBlob = new Blob([htmlText], { type: 'text/html' });
        const item = new ClipboardItem({
          'text/plain': textBlob,
          'text/html': htmlBlob
        });

        navigator.clipboard.write([item]).then(() => {
          showToastNotification('📋 Homework summary copied with hyperlinked materials!');
        }).catch(() => {
          this.fallbackCopyText(plainText);
        });
      } else {
        this.fallbackCopyText(plainText);
      }
    },

    fallbackCopyText(text) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showToastNotification('📋 Homework summary copied to clipboard!');
      } catch (err) {
        alert('Copy failed. Please copy text manually.');
      }
      document.body.removeChild(textArea);
    },

    navigateToPrevWeek() {
      if (this.selectedWeekNum > 1) {
        this.selectedWeekNum--;
      } else {
        const termIdx = state.terms.findIndex(t => t.id === this.selectedTermId);
        if (termIdx > 0) {
          const prevTerm = state.terms[termIdx - 1];
          this.selectedTermId = prevTerm.id;
          this.selectedWeekNum = prevTerm.weeks || 10;
        }
      }
      this.renderTermAndWeekPicker();
      this.renderMainContent();
    },

    navigateToNextWeek() {
      const term = state.terms.find(t => t.id === this.selectedTermId) || state.terms[0];
      const maxWeeks = term ? (term.weeks || 10) : 10;

      if (this.selectedWeekNum < maxWeeks) {
        this.selectedWeekNum++;
      } else {
        const termIdx = state.terms.findIndex(t => t.id === this.selectedTermId);
        if (termIdx !== -1 && termIdx < state.terms.length - 1) {
          const nextTerm = state.terms[termIdx + 1];
          this.selectedTermId = nextTerm.id;
          this.selectedWeekNum = 1;
        }
      }
      this.renderTermAndWeekPicker();
      this.renderMainContent();
    },

    bindEvents() {
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('#homework-class-selector .nav-btn');
        if (btn) {
          this.selectedClassId = btn.getAttribute('data-id');
          this.renderClassSelector();
          this.renderMainContent();
        }
      });

      // Select all summary text handler
      document.addEventListener('click', (e) => {
        const selectBtn = e.target.closest('#btn-select-summary-text');
        if (selectBtn) {
          const box = document.getElementById('homework-summary-markdown-box');
          if (box) {
            const range = document.createRange();
            range.selectNodeContents(box);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            showToastNotification('🔍 Text selected! Press Ctrl+C to copy.');
          }
        }
      });

      // Font zoom & layout toggle buttons handler
      document.addEventListener('click', (e) => {
        if (e.target.id === 'btn-toggle-wb-layout' || e.target.closest('#btn-toggle-wb-layout')) {
          this.toggleWhiteboardLayout();
        } else if (e.target.id === 'btn-wb-zoom-in' || e.target.closest('#btn-wb-zoom-in')) {
          this.updateWhiteboardFontScale(this.whiteboardFontScale + 0.2, true);
        } else if (e.target.id === 'btn-wb-zoom-out' || e.target.closest('#btn-wb-zoom-out')) {
          this.updateWhiteboardFontScale(this.whiteboardFontScale - 0.2, true);
        } else if (e.target.id === 'btn-wb-zoom-auto' || e.target.closest('#btn-wb-zoom-auto')) {
          this.isManualFontScale = false;
          this.renderWhiteboardContent();
        }
      });

      // Tile Sync Button Handler
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.hw-card-sync-btn');
        if (btn) {
          e.preventDefault();
          e.stopPropagation();
          const classId = btn.getAttribute('data-class');
          const lessonId = btn.getAttribute('data-lesson-id');
          if (classId && lessonId) {
            const lessons = state.lessonPlans[classId] || [];
            const lesson = lessons.find(l => l.id === lessonId);
            const linked = state.getLinkedClasses(classId);
            if (lesson && linked.length > 0) {
              linked.forEach(targetClass => {
                state.syncLinkedLesson(classId, lesson, targetClass.id);
              });
              const names = linked.map(l => l.name).join(', ');
              showToastNotification(`✅ Synced "${lesson.title}" to ${names}!`);
              btn.disabled = true;
              btn.innerHTML = `✅ Synced`;
              btn.style.opacity = '0.6';
              btn.style.cursor = 'not-allowed';
            }
          }
        }
      });

      // Sync Week Button Handler
      const syncWeekBtn = document.getElementById('btn-homework-sync-week');
      if (syncWeekBtn) {
        syncWeekBtn.addEventListener('click', () => {
          const linked = state.getLinkedClasses(this.selectedClassId);
          const currentClass = state.classes.find(c => c.id === this.selectedClassId);
          const currentClassName = currentClass ? currentClass.name : 'this class';

          if (linked.length === 0) {
            alert(`No linked classes configured for ${currentClassName}. Click "🔗 Manage Class Links" in View 3 to link parallel classes.`);
            return;
          }

          const entries = this.getScheduledLessonsForSelectedWeek();
          if (entries.length === 0) {
            alert(`No scheduled lessons in ${currentClassName} for the selected week.`);
            return;
          }

          const linkedNames = linked.map(l => l.name).join(', ');
          if (confirm(`🔄 Sync all ${entries.length} scheduled lesson(s) for this week from ${currentClassName} to ${linkedNames}?`)) {
            entries.forEach(entry => {
              linked.forEach(targetClass => {
                state.syncLinkedLesson(this.selectedClassId, entry.lesson, targetClass.id);
              });
            });
            showToastNotification(`✅ Synced Week homework to ${linkedNames}!`);
            this.renderMainContent();
          }
        });
      }

      // Click on homework lesson card or Edit button to open Lesson Plan Edit modal
      document.addEventListener('click', (e) => {
        if (e.target.closest('.hw-card-sync-btn')) return;

        const editBtn = e.target.closest('.btn-edit-homework-lesson');
        const card = e.target.closest('.homework-lesson-card');

        if ((editBtn || card) && !e.target.closest('a')) {
          const targetEl = editBtn || card;
          const classId = targetEl.getAttribute('data-class');
          const lessonId = targetEl.getAttribute('data-lesson-id');
          if (classId && lessonId) {
            const classObj = state.classes.find(c => c.id === classId);
            const lessons = state.lessonPlans[classId] || [];
            const lesson = lessons.find(l => l.id === lessonId);
            if (lesson && classObj) {
              LessonUI.selectedClassId = classId;
              LessonUI.openEditLessonModal(lessonId);
            }
          }
        }
      });

      const termSelect = document.getElementById('homework-term-select');
      if (termSelect) {
        termSelect.addEventListener('change', (e) => {
          this.selectedTermId = e.target.value;
          this.selectedWeekNum = 1;
          this.renderTermAndWeekPicker();
          this.renderMainContent();
        });
      }

      const weekSelect = document.getElementById('homework-week-select');
      if (weekSelect) {
        weekSelect.addEventListener('change', (e) => {
          this.selectedWeekNum = parseInt(e.target.value, 10);
          this.renderMainContent();
        });
      }

      const prevBtn = document.getElementById('btn-homework-prev-week');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          this.navigateToPrevWeek();
        });
      }

      const nextBtn = document.getElementById('btn-homework-next-week');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          this.navigateToNextWeek();
        });
      }

      const wbBtn = document.getElementById('btn-open-whiteboard-modal');
      if (wbBtn) {
        wbBtn.addEventListener('click', () => {
          this.openWhiteboardModal();
        });
      }

      const fsBtn = document.getElementById('btn-fullscreen-whiteboard');
      if (fsBtn) {
        fsBtn.addEventListener('click', () => {
          const backdrop = document.getElementById('modal-whiteboard-backdrop');
          if (!document.fullscreenElement) {
            if (backdrop.requestFullscreen) backdrop.requestFullscreen();
            else if (backdrop.webkitRequestFullscreen) backdrop.webkitRequestFullscreen();
          } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
          }
        });
      }

      document.addEventListener('click', (e) => {
        const limitBtn = e.target.closest('.wb-progress-btn');
        if (limitBtn) {
          const limitVal = limitBtn.getAttribute('data-limit');
          this.coveredLessonLimit = (limitVal === 'all') ? null : parseInt(limitVal, 10);
          this.renderWhiteboardContent();
        }
      });
    }
  };

  function doResetData() {
    state.resetToDefault();
    LessonUI.selectedClassId = state.classes.length > 0 ? state.classes[0].id : null;
    MasterScheduleUI.selectedClassIds = ['ALL'];
    updateCurrentDateDisplay();
    refreshAllViews();

    const listContainer = document.getElementById('view-terms');
    if (listContainer) {
      const alertBanner = document.createElement('div');
      alertBanner.style.cssText = 'background:rgba(16, 185, 129, 0.2); border:1px solid #10b981; color:#34d399; padding:0.6rem 1rem; border-radius:var(--radius-md); margin-bottom:1rem; font-weight:700; font-size:0.85rem;';
      alertBanner.innerHTML = `✅ All app data reset to sample defaults successfully!`;
      listContainer.insertBefore(alertBanner, listContainer.firstChild);
      setTimeout(() => alertBanner.remove(), 4000);
    }
  }

  let activeViewId = 'terms';
  const dirtyViews = new Set(['terms', 'timetable', 'lessons', 'master', 'homework']);

  function renderViewIfDirty(viewId) {
    if (!dirtyViews.has(viewId)) return;
    dirtyViews.delete(viewId);
    console.info(`[VIEW RENDER] Rendering tab "${viewId}"...`);

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

  function showToastNotification(msg) {
    if (!msg) return;
    let toast = document.getElementById('simple-toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'simple-toast-notification';
      toast.style.cssText = 'position:fixed; bottom:25px; right:25px; background:var(--primary); color:#ffffff; border-radius:var(--radius-md); padding:0.6rem 1.1rem; box-shadow:0 10px 25px rgba(0,0,0,0.25); z-index:2050; font-size:0.85rem; font-weight:700; transition:all 0.3s ease; transform:translateY(10px); opacity:0;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 3000);
  }

  function showReanalysisSummaryToast(summaryMsg) {
    if (!summaryMsg) return;
    let toast = document.getElementById('reanalysis-summary-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'reanalysis-summary-toast';
      toast.style.cssText = 'position:fixed; top:80px; right:25px; background:var(--bg-surface); color:var(--text-main); border:1px solid var(--primary); border-radius:var(--radius-md); padding:0.85rem 1.25rem; box-shadow:var(--shadow-xl); z-index:2050; font-size:0.85rem; font-weight:700; display:flex; align-items:center; gap:0.75rem; transition:all 0.3s ease; transform:translateY(-10px); opacity:0;';
      document.body.appendChild(toast);
    }
    toast.style.background = 'var(--bg-surface)';
    toast.style.color = 'var(--text-main)';
    toast.style.borderColor = 'var(--border-color)';
    toast.innerHTML = `
      <span style="font-size:1.3rem;">⚡</span>
      <div>
        <div style="font-weight:800; font-size:0.88rem; color:var(--primary);">Pacing Reanalysis Impact</div>
        <div style="font-weight:600; font-size:0.8rem; margin-top:0.15rem;">${summaryMsg}</div>
      </div>
      <button type="button" style="background:none; border:none; color:inherit; font-size:1.1rem; cursor:pointer; margin-left:0.5rem;" onclick="this.parentElement.style.opacity='0';">&times;</button>
    `;
    toast.style.display = 'flex';
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
      if (toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => { toast.style.display = 'none'; }, 300);
      }
    }, 6500);
  }

  function refreshAllViews(force = false, isScheduleOrSequenceEdit = false) {
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

  function getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function updateCurrentDateDisplay() {
    const el = document.getElementById('current-date-input');
    if (el) el.value = state.currentDate;

    const syncContainer = document.getElementById('lock-sync-status-container');
    if (syncContainer) {
      const realTodayStr = getLocalDateString(new Date());
      if (state.currentDate === realTodayStr) {
        syncContainer.innerHTML = `<span style="font-size:0.72rem; color:#34d399; font-weight:700; margin-left:0.4rem;" title="Lock threshold matches today's computer local date">✓ Synced</span>`;
      } else {
        syncContainer.innerHTML = `<button type="button" id="btn-sync-lock-today" class="btn btn-warning btn-xs" style="font-size:0.7rem; font-weight:700; padding:0.15rem 0.5rem; margin-left:0.4rem; border-radius:12px;" title="Lock threshold (${TermManager.formatDisplayDate(state.currentDate)}) is out of sync with real computer date (${TermManager.formatDisplayDate(realTodayStr)}). Click to sync!">🔄 Sync to Today (${TermManager.formatDisplayDate(realTodayStr)})</button>`;
      }
    }
  }

  function bindGlobalEvents() {
    const navButtons = document.querySelectorAll('.app-nav .nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.getAttribute('data-view');
        activeViewId = targetView;
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.view-panel').forEach(panel => {
          panel.classList.remove('active');
        });
        const targetPanel = document.getElementById(`view-${targetView}`);
        if (targetPanel) targetPanel.classList.add('active');

        renderViewIfDirty(targetView);
      });
    });

    document.addEventListener('click', (e) => {
      const syncBtn = e.target.closest('#btn-sync-lock-today');
      if (syncBtn) {
        const realTodayStr = getLocalDateString(new Date());
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

    // Modal Close Backdrop/Button Handler
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-backdrop')) {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
      }
    });

    // Settings Cog Modal Handler
    const openSettingsBtn = document.getElementById('btn-open-settings-modal');
    if (openSettingsBtn) {
      openSettingsBtn.addEventListener('click', () => {
        const modal = document.getElementById('modal-settings-backdrop');
        if (modal) {
          modal.classList.add('active');
          state.updateStorageUI();
        }
      });
    }

    // Header Storage Status Chip Handler
    const storageStatusBtn = document.getElementById('btn-storage-status-indicator');
    if (storageStatusBtn) {
      storageStatusBtn.addEventListener('click', () => {
        const modal = document.getElementById('modal-settings-backdrop');
        if (modal) {
          modal.classList.add('active');
          state.updateStorageUI();
        }
      });
    }

    // Settings Modal Action Buttons
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
        const jsonStr = JSON.stringify(state.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Timetable_Planner_Backup_${state.currentDate}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    });

    const openPeriodConfigBtn = document.getElementById('btn-open-period-config');
    if (openPeriodConfigBtn) {
      openPeriodConfigBtn.addEventListener('click', () => PeriodConfigUI.open());
    }

    const openLinkClassesBtn = document.getElementById('btn-open-link-classes');
    if (openLinkClassesBtn) {
      openLinkClassesBtn.addEventListener('click', () => LessonUI.openLinkClassesModal());
    }

    const toggleCollapseBtn = document.getElementById('btn-toggle-collapse-all-topics');
    if (toggleCollapseBtn) {
      toggleCollapseBtn.addEventListener('click', () => {
        LessonUI.toggleCollapseAllTopics();
      });
    }

    // Requirement 5 & Update 2: Multi-Page Color Printable Landscape A4 Timetable Generator
    const printBtn = document.getElementById('btn-print-timetable');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
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
              <h2 class="print-week-header">${weekLabel}</h2>
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
                    <div class="period-name">${period.name}</div>
                    <div class="period-time">${formattedTime}</div>
                  </td>
                  <td colspan="5">${period.name} (${formattedTime})</td>
                </tr>
              `;
            } else {
              gridHtml += `
                <tr>
                  <td class="period-header-col">
                    <div class="period-name">${period.name}</div>
                    <div class="period-time">${formattedTime}</div>
                  </td>
              `;
              for (let dayIdx = 1; dayIdx <= 5; dayIdx++) {
                const assignedClass = TimetableManager.getClassForSlot(w, dayIdx, period.id);
                if (assignedClass) {
                  const detailsHtml = assignedClass.details ? `<div class="tt-class-details">${assignedClass.details}</div>` : '';
                  gridHtml += `
                    <td class="tt-cell" style="background:${assignedClass.color}22 !important; border:2px solid ${assignedClass.color} !important; text-align:center; vertical-align:middle; padding:6px 4px;">
                      <div class="tt-class-name">${assignedClass.name}</div>
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
      });
    }

    // Add Event Form
    const eventForm = document.getElementById('form-add-event');
    if (eventForm) {
      eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('event-title').value;
        const date = document.getElementById('event-date').value;
        const type = document.getElementById('event-type').value;
        const blockAllDay = document.getElementById('event-block-allday').checked;
        const blockedPeriod = document.getElementById('event-period-select').value;
        const affectedClassId = document.getElementById('event-class-select').value || null;

        const newEvent = {
          id: `e_${Date.now()}`,
          title: title,
          date: date,
          type: type,
          blockAllDay: blockAllDay,
          blockedPeriod: blockAllDay ? null : blockedPeriod,
          affectedClassId: affectedClassId
        };

        state.data.events.push(newEvent);
        state.saveState();
        document.getElementById('modal-event-backdrop').classList.remove('active');
        eventForm.reset();
        refreshAllViews(false, true);
      });
    }

    // Requirement 3 & 4: Slot Class Form Submit with Details, Color & Delete Button
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
            const customDetails = classDetailsInput.trim() ? classDetailsInput.trim() : null;
            TimetableManager.setSlotClass(week, day, periodId, targetClass.id, customDetails);
          }
        }

        backdrop.classList.remove('active');
        refreshAllViews(false, true);
      });
    }

    // Requirement 3: Dedicated Clear/Delete Slot Assignment Button
    const clearSlotBtn = document.getElementById('btn-clear-slot');
    if (clearSlotBtn) {
      clearSlotBtn.addEventListener('click', () => {
        const backdrop = document.getElementById('modal-slot-backdrop');
        const week = parseInt(backdrop.getAttribute('data-week'), 10);
        const day = parseInt(backdrop.getAttribute('data-day'), 10);
        const periodId = backdrop.getAttribute('data-period');
        TimetableManager.setSlotClass(week, day, periodId, null);
        backdrop.classList.remove('active');
        refreshAllViews(false, true);
      });
    }

    // Submit Add / Edit Lesson Form
    const lessonForm = document.getElementById('form-add-lesson');
    if (lessonForm) {
      lessonForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const classId = LessonUI.selectedClassId;
        if (!classId) return;

        const lessonId = document.getElementById('lesson-id-input').value;
        const title = document.getElementById('lesson-title-input').value;
        const unit = document.getElementById('lesson-unit-input').value;
        const content = document.getElementById('lesson-content-input').value;
        const floatCheck = document.getElementById('lesson-float-check');
        const revisionCheck = document.getElementById('lesson-revision-check');
        const testCheck = document.getElementById('lesson-test-check');
        const pinCheck = document.getElementById('lesson-pin-check');

        const isFloat = floatCheck ? floatCheck.checked : false;
        const isRevision = revisionCheck ? revisionCheck.checked : false;
        const isTestMilestone = testCheck ? testCheck.checked : false;
        const isPinned = pinCheck ? pinCheck.checked : false;
        const testSlotSelect = document.getElementById('lesson-test-slot-select');

        let slotKey = null;
        let slotDate = null;
        let slotPeriodId = null;

        if ((isTestMilestone || isPinned) && testSlotSelect && testSlotSelect.value) {
          slotKey = testSlotSelect.value;
          const selectedOpt = testSlotSelect.options[testSlotSelect.selectedIndex];
          if (selectedOpt) {
            slotDate = selectedOpt.getAttribute('data-date');
            slotPeriodId = selectedOpt.getAttribute('data-period');
          }
        }

        if (!state.data.lessonPlans[classId]) {
          state.data.lessonPlans[classId] = [];
        }

        const classwork = LessonUI.readClassworkInputsFromModal();

        if (lessonId) {
          // Edit existing lesson in-place
          const existing = state.data.lessonPlans[classId].find(l => l.id === lessonId);
          if (existing) {
            existing.title = title;
            existing.unit = unit || 'General Curriculum';
            existing.content = content || '';
            existing.classwork = classwork;
            existing.isFloat = isFloat;
            existing.isRevision = isRevision;
            existing.isTestMilestone = isTestMilestone;
            existing.isPinned = isPinned;
            delete existing.isForcedSlot;
            delete existing.forcedSlotKey;
            delete existing.forcedDate;
            delete existing.forcedPeriodId;

            if (isTestMilestone) {
              existing.testSlotKey = slotKey;
              existing.testDate = slotDate;
              existing.testPeriodId = slotPeriodId;
            } else {
              delete existing.testSlotKey;
              delete existing.testDate;
              delete existing.testPeriodId;
            }

            if (isPinned) {
              existing.pinnedSlotKey = slotKey;
              existing.pinnedDate = slotDate;
              existing.pinnedPeriodId = slotPeriodId;
            } else {
              delete existing.pinnedSlotKey;
              delete existing.pinnedDate;
              delete existing.pinnedPeriodId;
            }
          }
        } else {
          // Create new lesson (supports comma-separated list like 6G, 6H, 6I, 6J)
          const titleInput = title.trim();
          if (titleInput.includes(',')) {
            const rawTitles = titleInput.split(',').map(t => t.trim()).filter(Boolean);
            rawTitles.forEach((t, tIdx) => {
              const batchLesson = {
                id: `l_${Date.now()}_${tIdx}_${Math.random().toString(36).substr(2, 4)}`,
                title: t,
                unit: unit || 'General Curriculum',
                content: content || '',
                classwork: JSON.parse(JSON.stringify(classwork)),
                isFloat: isFloat,
                isRevision: isRevision,
                isTestMilestone: isTestMilestone && tIdx === rawTitles.length - 1,
                testSlotKey: (isTestMilestone && tIdx === rawTitles.length - 1) ? slotKey : null,
                testDate: (isTestMilestone && tIdx === rawTitles.length - 1) ? slotDate : null,
                testPeriodId: (isTestMilestone && tIdx === rawTitles.length - 1) ? slotPeriodId : null,
                isPinned: isPinned && tIdx === 0,
                pinnedSlotKey: (isPinned && tIdx === 0) ? slotKey : null,
                pinnedDate: (isPinned && tIdx === 0) ? slotDate : null,
                pinnedPeriodId: (isPinned && tIdx === 0) ? slotPeriodId : null
              };
              state.data.lessonPlans[classId].push(batchLesson);
            });
          } else {
            const newLesson = {
              id: `l_${Date.now()}`,
              title: title,
              unit: unit || 'General Curriculum',
              content: content || '',
              classwork: classwork,
              isFloat: isFloat,
              isRevision: isRevision,
              isTestMilestone: isTestMilestone,
              testSlotKey: isTestMilestone ? slotKey : null,
              testDate: isTestMilestone ? slotDate : null,
              testPeriodId: isTestMilestone ? slotPeriodId : null,
              isPinned: isPinned,
              pinnedSlotKey: isPinned ? slotKey : null,
              pinnedDate: isPinned ? slotDate : null,
              pinnedPeriodId: isPinned ? slotPeriodId : null
            };
            state.data.lessonPlans[classId].push(newLesson);
          }
        }

        state.saveState();

        const syncCheck = document.getElementById('lesson-sync-linked-check');
        const shouldSync = syncCheck ? syncCheck.checked : false;

        if (shouldSync) {
          const linkedClasses = state.getLinkedClasses(classId);
          linkedClasses.forEach(targetClass => {
            const savedLessons = state.data.lessonPlans[classId] || [];
            let savedLesson = savedLessons.find(l => l.id === lessonId || l.title.trim().toLowerCase() === title.trim().toLowerCase());
            if (!savedLesson && savedLessons.length > 0) {
              savedLesson = savedLessons[savedLessons.length - 1];
            }
            if (savedLesson) {
              state.syncLinkedLesson(classId, savedLesson, targetClass.id);
            }
          });
        }

        document.getElementById('modal-lesson-backdrop').classList.remove('active');
        lessonForm.reset();
        refreshAllViews(false, true);
      });
    }

    // Copy Lesson Details Button
    const copyDetailsBtn = document.getElementById('btn-copy-lesson-details');
    if (copyDetailsBtn) {
      copyDetailsBtn.addEventListener('click', () => {
        LessonViewer.copyToClipboard();
      });
    }

    // Global Reset Data Event Delegation
    document.addEventListener('click', (e) => {
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
        return;
      }

      const resetDownloadBtn = e.target.closest('#btn-reset-download-backup');
      if (resetDownloadBtn) {
        e.preventDefault();
        const jsonStr = JSON.stringify(state.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timetabler_backup_${state.currentDate}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    });

    // Export Data JSON
    const exportBtn = document.getElementById('btn-export-json');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const jsonStr = JSON.stringify(state.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Timetable_Planner_Backup_${state.currentDate}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    // Import Data JSON Handler
    document.addEventListener('change', (e) => {
      if (e.target.id === 'settings-input-restore-json' || e.target.id === 'input-import-json') {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            state.data = imported;
            state.saveState();
            document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
            updateCurrentDateDisplay();
            refreshAllViews(false, true);
            alert('✅ Data restored successfully!');
          } catch (err) {
            alert('❌ Invalid backup JSON file.');
          }
        };
        reader.readAsText(file);
      }
    });
  }

  function getContrastingTextColor(hexColor) {
    if (!hexColor) return '#ffffff';
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 135 ? '#0f172a' : '#ffffff';
  }

  function getReadableClassTextColor(hexColor) {
    const isLightMode = (state.theme === 'light');
    if (!hexColor) return isLightMode ? '#0f172a' : '#ffffff';

    let hex = hexColor.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    if (isLightMode) {
      return yiq > 130 ? '#0f172a' : hexColor;
    } else {
      return yiq < 140 ? '#ffffff' : hexColor;
    }
  }

  const ThemeManager = {
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

  document.addEventListener('DOMContentLoaded', () => {
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

    SpotlightTour.init();
  });

})();
