/* ==========================================================================
   State Management, Default Data Store (v3), Color Science & Toast Utilities
   ========================================================================== */

export const STORAGE_KEY = 'aus_teacher_timetabler_state_v3';

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Helper to calculate exact school weeks between start and end dates (Mon-Fri)
export function calculateTermWeeks(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 10;
  let start = null, end = null;
  const p1 = String(startDateStr).split('-').map(Number);
  if (p1.length === 3 && !isNaN(p1[0])) start = new Date(p1[0], p1[1] - 1, p1[2], 12, 0, 0);
  const p2 = String(endDateStr).split('-').map(Number);
  if (p2.length === 3 && !isNaN(p2[0])) end = new Date(p2[0], p2[1] - 1, p2[2], 12, 0, 0);
  if (!start || !end || end < start) return 10;

  const dayOfWeek = start.getDay();
  const diffToMon = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
  const monStart = new Date(start);
  monStart.setDate(monStart.getDate() + diffToMon);

  const diffTime = end.getTime() - monStart.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

// Default Australian School Terms (2026 Sample Default - Configurable)
export const DEFAULT_TERMS = [
  { id: 't1', name: 'Term 1', startDate: '2026-01-28', endDate: '2026-04-02', weeks: 10 },
  { id: 't2', name: 'Term 2', startDate: '2026-04-20', endDate: '2026-07-03', weeks: 11 },
  { id: 't3', name: 'Term 3', startDate: '2026-07-13', endDate: '2026-09-18', weeks: 10 },
  { id: 't4', name: 'Term 4', startDate: '2026-10-05', endDate: '2026-12-18', weeks: 11 }
];

// Default Configurable Periods with Native Start & End Times (Req 2)
export const DEFAULT_PERIODS = [
  { id: 'p1', name: 'Period 1', startTime: '09:00', endTime: '10:00' },
  { id: 'p2', name: 'Period 2', startTime: '10:00', endTime: '11:00' },
  { id: 'recess', name: 'Recess', startTime: '11:00', endTime: '11:30', isBreak: true },
  { id: 'p3', name: 'Period 3', startTime: '11:30', endTime: '12:30' },
  { id: 'p4', name: 'Period 4', startTime: '12:30', endTime: '13:30' },
  { id: 'lunch', name: 'Lunch', startTime: '13:30', endTime: '14:15', isBreak: true },
  { id: 'p5', name: 'Period 5', startTime: '14:15', endTime: '15:15' }
];

export const PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1', '#f97316'];
export const DEFAULT_CLASSES = [
  { id: 'c1', name: 'Year 9 Mathematics', subject: 'Mathematics', color: '#3b82f6', details: 'Room 201' },
  { id: 'c2', name: 'Year 10 Science', subject: 'Science', color: '#10b981', details: 'Lab B' },
  { id: 'c3', name: 'Year 11 Physics', subject: 'Physics', color: '#8b5cf6', details: 'Lab A' }
];

export const DEFAULT_EVENTS = [
  { id: 'e1', title: 'Swimming Carnival', date: '2026-02-13', type: 'carnival', blockAllDay: true },
  { id: 'e2', title: 'ANZAC Day Holiday', date: '2026-04-27', type: 'holiday', blockAllDay: true },
  { id: 'e3', title: 'Athletics Carnival', date: '2026-08-07', type: 'carnival', blockAllDay: true },
  { id: 'e4', title: 'Term 3 Assembly', date: '2026-08-14', type: 'assembly', blockAllDay: false, blockedPeriod: 'p1' }
];

export const DEFAULT_TIMETABLE_SLOTS = {
  '1_1_p1': 'c1', '1_1_p3': 'c2', '1_2_p2': 'c1', '1_2_p4': 'c3',
  '1_3_p1': 'c2', '1_3_p5': 'c1', '1_4_p2': 'c2', '1_4_p3': 'c3',
  '1_5_p1': 'c1', '1_5_p4': 'c2',
  '2_1_p2': 'c1', '2_1_p4': 'c2', '2_2_p1': 'c2', '2_2_p3': 'c1',
  '2_3_p2': 'c3', '2_3_p4': 'c1', '2_4_p1': 'c1', '2_4_p5': 'c2'
};

export const DEFAULT_LESSON_PLANS = {
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

export function sortEventsChronologically(events) {
  if (!Array.isArray(events)) return events;
  events.sort((a, b) => {
    const sA = String(a?.startDate || a?.date || '');
    const sB = String(b?.startDate || b?.date || '');
    if (sA !== sB) return sA.localeCompare(sB);
    const eA = String(a?.endDate || a?.date || sA);
    const eB = String(b?.endDate || b?.date || sB);
    if (eA !== eB) return eA.localeCompare(eB);
    return String(a?.title || '').localeCompare(String(b?.title || ''));
  });
  return events;
}

export function sanitizeLessonPlans(lessonPlans) {
  let cleaned = false;
  if (!lessonPlans || typeof lessonPlans !== 'object') return false;
  Object.keys(lessonPlans).forEach(classId => {
    const lessons = lessonPlans[classId];
    if (Array.isArray(lessons)) {
      lessons.forEach(lesson => {
        if (lesson && Array.isArray(lesson.classwork)) {
          const origLen = lesson.classwork.length;
          lesson.classwork = lesson.classwork.filter(cw => {
            if (!cw || typeof cw !== 'object') return false;
            const w = (cw.work || '').trim();
            const l = (cw.link || '').trim();
            return Boolean(w || l);
          });
          if (lesson.classwork.length !== origLen) cleaned = true;
        }
      });
    }
  });
  return cleaned;
}

// Toast Notification Utilities
export function showToastNotification(msg) {
  if (!msg || typeof document === 'undefined') return;
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

export function showReanalysisSummaryToast(summaryMsg) {
  if (!summaryMsg || typeof document === 'undefined') return;
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

// Color Science & Cell Styling Utilities
export function getColorYIQ(hexColor) {
  if (!hexColor || typeof hexColor !== 'string') return 128;
  let hex = hexColor.replace('#', '').trim();
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length < 6) return 128;
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export function isColorNearWhite(hexColor) {
  if (!hexColor || typeof hexColor !== 'string') return false;
  let hex = hexColor.replace('#', '').trim();
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length < 6) return false;
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  return min >= 235 && sat <= 0.08;
}

export function isColorNearBlack(hexColor) {
  if (!hexColor || typeof hexColor !== 'string') return false;
  let hex = hexColor.replace('#', '').trim();
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length < 6) return false;
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const max = Math.max(r, g, b);
  return max <= 45;
}

export function getClassCellStyles(hexColor, isDark) {
  const safeColor = hexColor || (isDark ? '#38bdf8' : '#2563eb');
  const yiq = getColorYIQ(safeColor);
  const nearWhite = isColorNearWhite(safeColor);
  const nearBlack = isColorNearBlack(safeColor);

  if (isDark) {
    if (nearBlack) {
      return {
        bg: 'rgba(0, 0, 0, 0.65)',
        border: '2px solid #94a3b8',
        cardBorder: '1px solid #94a3b8',
        accentBar: '#94a3b8',
        textColor: '#f8fafc',
        detailsColor: '#cbd5e1',
        dotBg: '#0f172a',
        dotBorder: '1.5px solid #94a3b8',
        tagBg: '#0f172a',
        tagColor: '#f8fafc',
        tagBorder: '1px solid #94a3b8'
      };
    }
    if (nearWhite) {
      return {
        bg: 'rgba(255, 255, 255, 0.18)',
        border: '2px solid #ffffff',
        cardBorder: '1px solid rgba(255, 255, 255, 0.6)',
        accentBar: '#ffffff',
        textColor: '#ffffff',
        detailsColor: '#cbd5e1',
        dotBg: '#ffffff',
        dotBorder: '1px solid rgba(255, 255, 255, 0.4)',
        tagBg: 'rgba(255, 255, 255, 0.15)',
        tagColor: '#ffffff',
        tagBorder: '1px solid rgba(255, 255, 255, 0.5)'
      };
    }
    const isLuminous = yiq >= 180;
    return {
      bg: `${safeColor}${isLuminous ? '35' : '25'}`,
      border: `2px solid ${safeColor}`,
      cardBorder: `1px solid ${safeColor}65`,
      accentBar: safeColor,
      textColor: isLuminous ? safeColor : (yiq < 140 ? '#ffffff' : safeColor),
      detailsColor: '#cbd5e1',
      dotBg: safeColor,
      dotBorder: '1px solid rgba(255, 255, 255, 0.35)',
      tagBg: `${safeColor}${isLuminous ? '35' : '25'}`,
      tagColor: isLuminous ? safeColor : (yiq < 140 ? '#ffffff' : safeColor),
      tagBorder: `1px solid ${safeColor}66`
    };
  } else {
    if (nearWhite) {
      return {
        bg: '#ffffff',
        border: '2px solid #64748b',
        cardBorder: '1px solid #94a3b8',
        accentBar: '#64748b',
        textColor: '#0f172a',
        detailsColor: '#334155',
        dotBg: '#ffffff',
        dotBorder: '1.5px solid #64748b',
        tagBg: '#f8fafc',
        tagColor: '#0f172a',
        tagBorder: '1px solid #94a3b8'
      };
    }
    if (nearBlack) {
      return {
        bg: 'rgba(15, 23, 42, 0.08)',
        border: '2px solid #0f172a',
        cardBorder: '1px solid #0f172a',
        accentBar: '#0f172a',
        textColor: '#0f172a',
        detailsColor: '#334155',
        dotBg: '#0f172a',
        dotBorder: '1px solid rgba(0, 0, 0, 0.3)',
        tagBg: 'rgba(15, 23, 42, 0.08)',
        tagColor: '#0f172a',
        tagBorder: '1px solid #0f172a'
      };
    }
    const isLuminous = yiq >= 180;
    return {
      bg: `${safeColor}${isLuminous ? '38' : '22'}`,
      border: `2px solid ${safeColor}`,
      cardBorder: `1px solid ${safeColor}55`,
      accentBar: safeColor,
      textColor: yiq > 130 ? '#0f172a' : safeColor,
      detailsColor: '#334155',
      dotBg: safeColor,
      dotBorder: isLuminous ? '1px solid rgba(0, 0, 0, 0.35)' : '1px solid rgba(0, 0, 0, 0.15)',
      tagBg: `${safeColor}${isLuminous ? '38' : '22'}`,
      tagColor: yiq > 140 ? '#0f172a' : safeColor,
      tagBorder: `1px solid ${safeColor}66`
    };
  }
}

export function getReadableClassTextColor(hexColor, isLightMode = true) {
  if (!hexColor) return isLightMode ? '#0f172a' : '#ffffff';
  const yiq = getColorYIQ(hexColor);
  if (isLightMode) {
    return yiq > 130 ? '#0f172a' : hexColor;
  }
  return yiq < 140 ? '#ffffff' : hexColor;
}

// State Store
export class StateStore {
  constructor() {
    this.data = this.loadState();
    if (this.cleanBlankClassworkFromData(this.data)) {
      this.saveState();
    }
    this.isPersisted = false;
    this.initPersistence();
  }

  cleanBlankClassworkFromData(stateObj) {
    if (!stateObj || typeof stateObj !== 'object') return false;
    let changed = false;
    if (Array.isArray(stateObj.events)) {
      sortEventsChronologically(stateObj.events);
    }
    if (stateObj.lessonPlans && sanitizeLessonPlans(stateObj.lessonPlans)) {
      changed = true;
    }
    if (stateObj.years && typeof stateObj.years === 'object') {
      Object.keys(stateObj.years).forEach(yKey => {
        const yData = stateObj.years[yKey];
        if (yData) {
          if (Array.isArray(yData.events)) {
            sortEventsChronologically(yData.events);
          }
          if (yData.lessonPlans && sanitizeLessonPlans(yData.lessonPlans)) {
            changed = true;
          }
        }
      });
    }
    return changed;
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
          this.cleanBlankClassworkFromData(dbData);
          this.data = dbData;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
          } catch (e) {}
          if (typeof window !== 'undefined' && typeof window.refreshAllViews === 'function') {
            window.refreshAllViews(false, true);
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
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            const def = this.getDefaultState();
            let dataYear = 2026;
            if (parsed.terms && parsed.terms.length > 0 && parsed.terms[0].startDate) {
              const m = String(parsed.terms[0].startDate).match(/^(\d{4})/);
              if (m) dataYear = parseInt(m[1], 10);
            } else if (parsed.events && parsed.events.length > 0 && (parsed.events[0].startDate || parsed.events[0].date)) {
              const m = String(parsed.events[0].startDate || parsed.events[0].date).match(/^(\d{4})/);
              if (m) dataYear = parseInt(m[1], 10);
            } else if (parsed.academicYear) {
              dataYear = parseInt(parsed.academicYear, 10);
            }

            const year = parsed.academicYear ? parseInt(parsed.academicYear, 10) : dataYear;
            const years = (parsed.years && typeof parsed.years === 'object') ? parsed.years : {};

            if (!years[dataYear]) {
              years[dataYear] = {
                terms: (Array.isArray(parsed.terms) && parsed.terms.length > 0) ? parsed.terms : def.terms,
                classes: Array.isArray(parsed.classes) ? parsed.classes : def.classes,
                events: Array.isArray(parsed.events) ? parsed.events.filter(ev => {
                  const d = ev.startDate || ev.date || '';
                  return !d || d.startsWith(String(dataYear));
                }) : def.events,
                timetableSlots: parsed.timetableSlots || def.timetableSlots,
                timetableSlotDetails: parsed.timetableSlotDetails || {},
                lessonPlans: parsed.lessonPlans || def.lessonPlans,
                timetableCycleWeeks: parsed.timetableCycleWeeks || 2,
                currentDate: parsed.currentDate || `${dataYear}-07-22`
              };
            }

            // Sanitize all years: purge mismatched dates and clear legacy cloned classes
            Object.keys(years).forEach(yKey => {
              const yNum = parseInt(yKey, 10);
              const yStr = String(yNum);
              const yData = years[yKey];
              if (yData && typeof yData === 'object') {
                if (Array.isArray(yData.events)) {
                  yData.events = yData.events.filter(ev => {
                    const d = ev.startDate || ev.date || '';
                    return !d || d.startsWith(yStr);
                  });
                }
                let termsMismatch = false;
                if (Array.isArray(yData.terms)) {
                  yData.terms.forEach(t => {
                    if (t.startDate && !t.startDate.startsWith(yStr)) {
                      t.startDate = t.startDate.replace(/^\d{4}/, yStr);
                      termsMismatch = true;
                    }
                    if (t.endDate && !t.endDate.startsWith(yStr)) {
                      t.endDate = t.endDate.replace(/^\d{4}/, yStr);
                      termsMismatch = true;
                    }
                    if (t.startDate && t.endDate) {
                      t.weeks = calculateTermWeeks(t.startDate, t.endDate);
                    }
                  });
                }
                if (yNum !== dataYear && termsMismatch && years[dataYear]) {
                  const baseClasses = years[dataYear].classes || [];
                  const baseIds = new Set(baseClasses.map(c => c.id));
                  if (yData.classes && yData.classes.length > 0 && yData.classes.every(c => baseIds.has(c.id))) {
                    yData.classes = [];
                    yData.timetableSlots = {};
                    yData.timetableSlotDetails = {};
                    yData.lessonPlans = {};
                  }
                }
              }
            });

            if (!years[year]) {
              const yrStr = String(year);
              const newTerms = JSON.parse(JSON.stringify(DEFAULT_TERMS)).map(term => {
                const s = term.startDate.replace(/^\d{4}/, yrStr);
                const e = term.endDate.replace(/^\d{4}/, yrStr);
                return {
                  ...term,
                  startDate: s,
                  endDate: e,
                  weeks: calculateTermWeeks(s, e)
                };
              });
              years[year] = {
                terms: newTerms,
                classes: [],
                events: [],
                timetableSlots: {},
                timetableSlotDetails: {},
                lessonPlans: {},
                timetableCycleWeeks: 2,
                currentDate: `${year}-07-22`
              };
            }

            const curYrData = years[year];
            const curTerms = curYrData.terms || def.terms;
            if (Array.isArray(curTerms)) {
              curTerms.forEach(t => {
                if (t.startDate && t.endDate) {
                  t.weeks = calculateTermWeeks(t.startDate, t.endDate);
                }
              });
            }

            return {
              ...def,
              ...parsed,
              academicYear: year,
              currentDate: curYrData.currentDate || parsed.currentDate || `${year}-07-22`,
              terms: curTerms,
              classes: curYrData.classes || [],
              events: curYrData.events || [],
              timetableSlots: curYrData.timetableSlots || {},
              timetableSlotDetails: curYrData.timetableSlotDetails || {},
              lessonPlans: curYrData.lessonPlans || {},
              timetableCycleWeeks: curYrData.timetableCycleWeeks || parsed.timetableCycleWeeks || 2,
              years: years
            };
          }
        }
      }
    } catch (err) {
      console.warn('Could not read localStorage', err);
    }
    return this.getDefaultState();
  }

  getDefaultState() {
    const defaultYear = 2026;
    const defaultTerms = JSON.parse(JSON.stringify(DEFAULT_TERMS));
    const defaultPeriods = JSON.parse(JSON.stringify(DEFAULT_PERIODS));
    const defaultClasses = JSON.parse(JSON.stringify(DEFAULT_CLASSES));
    const defaultEvents = JSON.parse(JSON.stringify(DEFAULT_EVENTS));
    const defaultTimetableSlots = JSON.parse(JSON.stringify(DEFAULT_TIMETABLE_SLOTS));
    const defaultLessonPlans = JSON.parse(JSON.stringify(DEFAULT_LESSON_PLANS));

    return {
      tutorialCompleted: false,
      timeFormat: '12h',
      homeworkGroupingMode: 'category',
      currentDate: '2026-07-22',
      academicYear: defaultYear,
      timetableCycleWeeks: 2,
      terms: defaultTerms,
      periods: defaultPeriods,
      classes: defaultClasses,
      events: defaultEvents,
      timetableSlots: defaultTimetableSlots,
      timetableSlotDetails: {},
      lessonPlans: defaultLessonPlans,
      years: {
        2026: {
          terms: JSON.parse(JSON.stringify(defaultTerms)),
          events: JSON.parse(JSON.stringify(defaultEvents)),
          classes: JSON.parse(JSON.stringify(defaultClasses)),
          timetableSlots: JSON.parse(JSON.stringify(defaultTimetableSlots)),
          timetableSlotDetails: {},
          lessonPlans: JSON.parse(JSON.stringify(defaultLessonPlans)),
          timetableCycleWeeks: 2,
          currentDate: '2026-07-22'
        }
      }
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
        } catch (e) {
          usageStatus.textContent = 'Active';
        }
      }
    }
  }

  syncCurrentYearToYears() {
    if (Array.isArray(this.data.events)) {
      sortEventsChronologically(this.data.events);
    }
    const yr = this.academicYear;
    if (!this.data.years) this.data.years = {};
    this.data.years[yr] = {
      terms: JSON.parse(JSON.stringify(this.data.terms || [])),
      events: JSON.parse(JSON.stringify(this.data.events || [])),
      classes: JSON.parse(JSON.stringify(this.data.classes || [])),
      timetableSlots: JSON.parse(JSON.stringify(this.data.timetableSlots || {})),
      timetableSlotDetails: JSON.parse(JSON.stringify(this.data.timetableSlotDetails || {})),
      lessonPlans: JSON.parse(JSON.stringify(this.data.lessonPlans || {})),
      timetableCycleWeeks: this.data.timetableCycleWeeks || 2,
      currentDate: this.data.currentDate || `${yr}-07-22`
    };
  }

  saveState() {
    this.syncCurrentYearToYears();
    this.indicateSaveStatus('saving');

    let localOk = false;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        localOk = true;
      }
    } catch (err) {
      console.error('Error saving state to localStorage', err);
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        showToastNotification('⚠️ LocalStorage quota reached. Saving to persistent IndexedDB.');
      }
    }

    PersistentStorageManager.saveToIndexedDB(this.data).then(() => {
      setTimeout(() => {
        this.indicateSaveStatus('saved');
      }, 300);
    }).catch(() => {
      this.indicateSaveStatus(localOk ? 'saved' : 'error');
    });
  }

  importState(imported) {
    if (!imported || typeof imported !== 'object') return false;
    const def = this.getDefaultState();

    let dataYear = 2026;
    if (imported.terms && imported.terms.length > 0 && imported.terms[0].startDate) {
      const m = String(imported.terms[0].startDate).match(/^(\d{4})/);
      if (m) dataYear = parseInt(m[1], 10);
    } else if (imported.events && imported.events.length > 0 && (imported.events[0].startDate || imported.events[0].date)) {
      const m = String(imported.events[0].startDate || imported.events[0].date).match(/^(\d{4})/);
      if (m) dataYear = parseInt(m[1], 10);
    } else if (imported.academicYear) {
      dataYear = parseInt(imported.academicYear, 10);
    }

    const years = (imported.years && typeof imported.years === 'object') ? JSON.parse(JSON.stringify(imported.years)) : {};

    if (!years[dataYear]) {
      years[dataYear] = {
        terms: (Array.isArray(imported.terms) && imported.terms.length > 0) ? imported.terms : def.terms,
        classes: Array.isArray(imported.classes) ? imported.classes : [],
        events: Array.isArray(imported.events) ? imported.events.filter(e => {
          const d = e.startDate || e.date || '';
          return !d || d.startsWith(String(dataYear));
        }) : [],
        timetableSlots: imported.timetableSlots || {},
        timetableSlotDetails: imported.timetableSlotDetails || {},
        lessonPlans: imported.lessonPlans || {},
        timetableCycleWeeks: imported.timetableCycleWeeks || 1,
        currentDate: imported.currentDate || `${dataYear}-07-22`
      };
    }

    // Sanitize all years
    Object.keys(years).forEach(yKey => {
      const yNum = parseInt(yKey, 10);
      const yStr = String(yNum);
      const yData = years[yKey];
      if (yData && typeof yData === 'object') {
        if (Array.isArray(yData.events)) {
          yData.events = yData.events.filter(ev => {
            const d = ev.startDate || ev.date || '';
            return !d || d.startsWith(yStr);
          });
        }
        let termsMismatch = false;
        if (Array.isArray(yData.terms)) {
          yData.terms.forEach(t => {
            if (t.startDate && !t.startDate.startsWith(yStr)) {
              t.startDate = t.startDate.replace(/^\d{4}/, yStr);
              termsMismatch = true;
            }
            if (t.endDate && !t.endDate.startsWith(yStr)) {
              t.endDate = t.endDate.replace(/^\d{4}/, yStr);
              termsMismatch = true;
            }
            if (t.startDate && t.endDate) {
              t.weeks = calculateTermWeeks(t.startDate, t.endDate);
            }
          });
        }
        if (yNum !== dataYear && termsMismatch && years[dataYear]) {
          const baseClasses = years[dataYear].classes || [];
          const baseIds = new Set(baseClasses.map(c => c.id));
          if (yData.classes && yData.classes.length > 0 && yData.classes.every(c => baseIds.has(c.id))) {
            yData.classes = [];
            yData.timetableSlots = {};
            yData.timetableSlotDetails = {};
            yData.lessonPlans = {};
          }
        }
      }
    });

    if (!years[2027]) {
      const yrStr = '2027';
      const terms2027 = JSON.parse(JSON.stringify(years[dataYear]?.terms || DEFAULT_TERMS)).map(t => {
        const s = t.startDate ? t.startDate.replace(/^\d{4}/, yrStr) : `${yrStr}-01-28`;
        const e = t.endDate ? t.endDate.replace(/^\d{4}/, yrStr) : `${yrStr}-04-02`;
        return {
          ...t,
          startDate: s,
          endDate: e,
          weeks: calculateTermWeeks(s, e)
        };
      });
      years[2027] = {
        terms: terms2027,
        classes: [],
        events: [],
        timetableSlots: {},
        timetableSlotDetails: {},
        lessonPlans: {},
        timetableCycleWeeks: imported.timetableCycleWeeks || 1,
        currentDate: '2027-01-28'
      };
    }

    this.data = {
      ...def,
      ...imported,
      academicYear: dataYear,
      years: years
    };

    this.cleanBlankClassworkFromData(this.data);
    this.setAcademicYear(dataYear);
    this.saveState();
    return true;
  }

  resetToDefault() {
    this.data = this.getDefaultState();
    this.saveState();
  }

  clearAllPlaceholderData() {
    this.data.events = [];
    this.data.classes = [];
    this.data.timetableSlots = {};
    this.data.timetableSlotDetails = {};
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

  get homeworkGroupingMode() { return this.data.homeworkGroupingMode || 'category'; }
  setHomeworkGroupingMode(mode) {
    this.data.homeworkGroupingMode = (mode === 'lesson') ? 'lesson' : 'category';
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
      const displayD = (typeof window !== 'undefined' && window.TermManager)
        ? window.TermManager.formatDisplayDate(lesson.pinnedDate || 'Date')
        : (lesson.pinnedDate || 'Date');
      showToastNotification(`📌 Pinned "${lesson.title}" to ${displayD}`);
    }

    this.saveState();
    if (typeof window !== 'undefined' && typeof window.refreshAllViews === 'function') {
      window.refreshAllViews(false, true);
    }
  }

  get terms() { return this.data.terms; }
  set terms(val) { this.data.terms = val; }
  get events() { return this.data.events; }

  get academicYear() {
    if (this.data.academicYear) return parseInt(this.data.academicYear, 10);
    if (this.data.terms && this.data.terms.length > 0 && this.data.terms[0].startDate) {
      return parseInt(this.data.terms[0].startDate.substring(0, 4), 10) || 2026;
    }
    return 2026;
  }

  setAcademicYear(newYear) {
    const yr = parseInt(newYear, 10);
    if (isNaN(yr) || yr < 2020 || yr > 2035) return;
    if (yr === this.data.academicYear && this.data.years && this.data.years[yr]) return;

    this.syncCurrentYearToYears();

    this.data.academicYear = yr;
    if (!this.data.years) this.data.years = {};

    if (this.data.years[yr]) {
      const yrData = this.data.years[yr];
      const yrStr = String(yr);

      if (Array.isArray(yrData.events)) {
        yrData.events = yrData.events.filter(ev => {
          const d = ev.startDate || ev.date || '';
          return !d || d.startsWith(yrStr);
        });
      }

      let hadWrongYearTerms = false;
      if (Array.isArray(yrData.terms)) {
        yrData.terms.forEach(term => {
          if (term.startDate && !term.startDate.startsWith(yrStr)) {
            term.startDate = term.startDate.replace(/^\d{4}/, yrStr);
            hadWrongYearTerms = true;
          }
          if (term.endDate && !term.endDate.startsWith(yrStr)) {
            term.endDate = term.endDate.replace(/^\d{4}/, yrStr);
            hadWrongYearTerms = true;
          }
          if (term.startDate && term.endDate) {
            term.weeks = calculateTermWeeks(term.startDate, term.endDate);
          }
        });
      }

      if (hadWrongYearTerms && yr !== 2026 && this.data.years[2026]) {
        const c2026 = this.data.years[2026].classes || [];
        const c2026Ids = new Set(c2026.map(c => c.id));
        if (yrData.classes && yrData.classes.length > 0 && yrData.classes.every(c => c2026Ids.has(c.id))) {
          yrData.classes = [];
          yrData.timetableSlots = {};
          yrData.timetableSlotDetails = {};
          yrData.lessonPlans = {};
        }
      }

      this.data.terms = JSON.parse(JSON.stringify(yrData.terms || []));
      if (Array.isArray(this.data.terms)) {
        this.data.terms.forEach(term => {
          if (term.startDate && term.endDate) {
            term.weeks = calculateTermWeeks(term.startDate, term.endDate);
          }
        });
      }
      this.data.events = JSON.parse(JSON.stringify(yrData.events || []));
      this.data.classes = JSON.parse(JSON.stringify(yrData.classes || []));
      this.data.timetableSlots = JSON.parse(JSON.stringify(yrData.timetableSlots || {}));
      this.data.timetableSlotDetails = JSON.parse(JSON.stringify(yrData.timetableSlotDetails || {}));
      this.data.lessonPlans = JSON.parse(JSON.stringify(yrData.lessonPlans || {}));
      this.data.timetableCycleWeeks = yrData.timetableCycleWeeks || 2;
      this.data.currentDate = yrData.currentDate || `${yr}-07-22`;
    } else {
      const yrStr = String(yr);
      const newTerms = JSON.parse(JSON.stringify(DEFAULT_TERMS)).map(term => {
        const s = term.startDate.replace(/^\d{4}/, yrStr);
        const e = term.endDate.replace(/^\d{4}/, yrStr);
        return {
          ...term,
          startDate: s,
          endDate: e,
          weeks: calculateTermWeeks(s, e)
        };
      });

      this.data.terms = newTerms;
      this.data.events = [];
      this.data.classes = [];
      this.data.timetableSlots = {};
      this.data.timetableSlotDetails = {};
      this.data.lessonPlans = {};
      this.data.timetableCycleWeeks = 2;
      this.data.currentDate = `${yr}-07-22`;

      this.syncCurrentYearToYears();
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
      if (details) existing.details = details;
      if (color) existing.color = color;
      this.saveState();
      return existing;
    }

    const colorIndex = this.classes.length % PALETTE.length;
    const newClass = {
      id: `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
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

    // Clean references in other classes' linkedClassIds
    this.data.classes.forEach(c => {
      if (Array.isArray(c.linkedClassIds)) {
        c.linkedClassIds = c.linkedClassIds.filter(id => id !== classId);
      }
    });

    // Clean timetable slots and slot details assigned to this class
    for (const slotKey in this.data.timetableSlots) {
      const val = this.data.timetableSlots[slotKey];
      const assignedId = typeof val === 'string' ? val : (val ? val.classId : null);
      if (assignedId === classId) {
        delete this.data.timetableSlots[slotKey];
        if (this.data.timetableSlotDetails) {
          delete this.data.timetableSlotDetails[slotKey];
        }
      }
    }

    // Clean references in blockout events
    if (Array.isArray(this.data.events)) {
      this.data.events.forEach(ev => {
        if (ev.affectedClassId === classId) {
          ev.affectedClassId = null;
        }
        if (Array.isArray(ev.affectedClassIds)) {
          ev.affectedClassIds = ev.affectedClassIds.filter(id => id !== classId);
          if (ev.affectedClassIds.length === 0) {
            ev.affectedClassIds = ['ALL'];
          }
        }
      });
    }

    this.saveState();
  }

  deletePeriodById(periodId) {
    if (!periodId) return;
    this.data.periods = this.periods.filter(p => p.id !== periodId);

    // Clean any timetable slots referencing this period
    const suffix = `_${periodId}`;
    for (const slotKey in this.data.timetableSlots) {
      if (slotKey.endsWith(suffix)) {
        delete this.data.timetableSlots[slotKey];
        if (this.data.timetableSlotDetails) {
          delete this.data.timetableSlotDetails[slotKey];
        }
      }
    }

    // Clean any events blocking this specific period
    if (Array.isArray(this.data.events)) {
      this.data.events.forEach(ev => {
        if (ev.blockedPeriod === periodId) {
          ev.blockedPeriod = null;
          ev.blockAllDay = true;
        }
      });
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
      if (typeof window !== 'undefined' && window.Scheduler && typeof window.Scheduler.generateScheduleForClass === 'function') {
        const { schedule } = window.Scheduler.generateScheduleForClass(sourceClassId);
        const validLessonIds = new Set();
        schedule.forEach(entry => {
          if (entry.slot && entry.slot.date >= currentDateStr && entry.lesson) {
            if (Array.isArray(entry.lesson.mergedLessonIds)) {
              entry.lesson.mergedLessonIds.forEach(id => validLessonIds.add(id));
            } else {
              validLessonIds.add(entry.lesson.id);
            }
          }
        });
        lessonsToSync = sourceLessons.filter(l => validLessonIds.has(l.id));
      } else {
        lessonsToSync = sourceLessons.filter(l => !l.testDate || l.testDate >= currentDateStr);
      }
    }

    lessonsToSync.forEach(sourceLesson => {
      this.syncLinkedLessonWithOptions(sourceClassId, sourceLesson, targetClassId, options);
    });
    this.saveState();
  }
}

export const state = new StateStore();

if (typeof window !== 'undefined') {
  window.state = state;
  window.PersistentStorageManager = PersistentStorageManager;
  window.showToastNotification = showToastNotification;
  window.showReanalysisSummaryToast = showReanalysisSummaryToast;
  window.getClassCellStyles = getClassCellStyles;
  window.getReadableClassTextColor = getReadableClassTextColor;
}
