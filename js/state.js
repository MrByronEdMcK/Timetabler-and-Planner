/* ==========================================================================
   State Management & Default Data Store (v3)
   ========================================================================== */

const STORAGE_KEY = 'aus_teacher_timetabler_state_v3';

// Default Australian School Terms (2026 Sample Default - Configurable)
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
export const PersistentStorageManager = {
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
export class StateStore {
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
          this.data = dbData;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
          } catch (e) {}
        }
      } else {
        PersistentStorageManager.saveToIndexedDB(this.data);
      }
    } catch (e) {}
  }

  loadState() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
      }
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

  saveState() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (err) {
      console.error('Error saving state', err);
    }
    PersistentStorageManager.saveToIndexedDB(this.data);
  }

  resetToDefault() {
    this.data = this.getDefaultState();
    this.saveState();
  }

  clearAllPlaceholderData() {
    this.data.events = [];
    this.data.classes = [];
    this.data.timetableSlots = {};
    this.data.lessonPlans = {};
    this.data.tutorialCompleted = true;
    this.saveState();
  }

  get theme() { return this.data.theme || 'dark'; }
  setTheme(newTheme) {
    this.data.theme = newTheme;
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
    } else {
      lesson.isPinned = true;
      if (targetDate) lesson.pinnedDate = targetDate;
      if (targetPeriodId) lesson.pinnedPeriodId = targetPeriodId;
      if (lesson.pinnedDate && lesson.pinnedPeriodId) {
        lesson.pinnedSlotKey = `${lesson.pinnedDate}_${lesson.pinnedPeriodId}`;
      }
    }

    this.saveState();
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
    let lessonsToSync = sourceLessons;

    if (filterAfterLockThreshold) {
      const currentDateStr = this.currentDate;
      lessonsToSync = sourceLessons.filter(l => !l.testDate || l.testDate >= currentDateStr);
    }

    lessonsToSync.forEach(sourceLesson => {
      this.syncLinkedLessonWithOptions(sourceClassId, sourceLesson, targetClassId, options);
    });
    this.saveState();
  }
}

export const state = new StateStore();

