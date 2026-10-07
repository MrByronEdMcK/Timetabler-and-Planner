/* ==========================================================================
   Weekly Homework & Classwork Summary Manager UI
   ========================================================================== */

import { state } from '../state.js';
import { Scheduler } from '../scheduler.js';
import { TermManager } from '../termManager.js';

export const HomeworkUI = {
  selectedClassId: null,
  selectedTermId: 't1',
  selectedWeekNum: 1,
  coveredLessonLimit: null,

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
      const termStart = new Date(currentTerm.startDate);
      const curr = new Date(currentDate);
      const diffDays = Math.floor((curr - termStart) / (1000 * 60 * 60 * 24));
      this.selectedWeekNum = Math.max(1, Math.min(currentTerm.weeks || 10, Math.floor(diffDays / 7) + 1));
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

    const termStart = new Date(term.startDate);
    const weekStart = new Date(termStart);
    weekStart.setDate(termStart.getDate() + (this.selectedWeekNum - 1) * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4);

    const startDateStr = weekStart.toISOString().split('T')[0];
    const endDateStr = weekEnd.toISOString().split('T')[0];

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
        return `${bullet.prefix}(${bullet.items.map(i => i.work).join(', ')})`;
      } else {
        return bullet.items.map(i => i.work).join(', ');
      }
    });
  },

  generateSummaryText(scheduledEntries = null, formatStyle = null) {
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
        <div style="text-align:center; padding: 3rem 1.5rem; color: var(--text-dim); background: rgba(30, 41, 59, 0.4); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
          <div style="font-size:2.5rem; margin-bottom:0.75rem;">📅</div>
          <h3 style="font-weight:700; font-size:1.1rem; color:var(--text-main); margin-bottom:0.4rem;">No Scheduled Classes Found for ${selectedClassName} in ${weekRange.label}</h3>
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
          const contentHtml = cw.link ? `<a href="${cw.link}" target="_blank" style="color:var(--primary-light); text-decoration:underline;" title="Open material link">${workText}</a>` : workText;

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
        <h4 style="font-size:1rem; font-weight:700; margin-bottom:0.75rem; color:var(--primary-light);">
          🗓️ Scheduled Lessons & Classwork for ${selectedClassName} — ${weekRange.label} (${scheduledEntries.length} Lesson Period/s)
        </h4>
        <div class="homework-grid">
          ${cardsHtml}
        </div>
      </div>

      <div class="homework-summary-wrapper" style="margin-top:2rem; background: var(--bg-card-dark, rgba(30, 41, 59, 0.85)); padding:1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
          <div style="font-weight:700; font-size:0.95rem; color:var(--text-main); display:flex; align-items:center; gap:0.5rem;">
            <span>📋 Formatted Homework Summary for ${selectedClassName}</span>
            <span style="font-size:0.75rem; font-weight:600; color:#38bdf8; background:rgba(56, 189, 248, 0.12); padding:0.25rem 0.65rem; border-radius:12px; border:1px solid rgba(56, 189, 248, 0.25);">
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

        <div id="homework-summary-markdown-box" class="homework-summary-rendered-box" style="user-select: text; -webkit-user-select: text; background: rgba(15, 23, 42, 0.6); padding: 1.1rem 1.35rem; border-radius: 8px; border: 1px solid var(--border-color); color: var(--text-main); font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; font-size: 0.92rem;">
          ${renderedMarkdownHTML}
        </div>
      </div>
    `;
  },

  whiteboardFontScale: 1.0,
  isManualFontScale: false,

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

  calculateAutoFontScale(totalItems) {
    if (totalItems <= 2) return 1.6;
    if (totalItems <= 4) return 1.35;
    if (totalItems <= 6) return 1.15;
    return 1.0;
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
    let wbHtml = '<div style="display:flex; flex-direction:column; gap:1.25rem;">';

    typeKeys.forEach(typeKey => {
      const items = groupedByType[typeKey];
      const rawWorks = items.map(it => it.work);
      const aggWorks = this.aggregateTaskItems(rawWorks);
      totalWorkItemsCount += aggWorks.length;

      let icon = '📌';
      const keyLower = typeKey.toLowerCase();
      if (keyLower.includes('note')) icon = '📝';
      else if (keyLower.includes('text') || keyLower.includes('book')) icon = '📖';
      else if (keyLower.includes('sheet') || keyLower.includes('work')) icon = '📄';
      else if (keyLower.includes('hand') || keyLower.includes('print')) icon = '📑';

      let itemsListHtml = '';
      structured.forEach(bullet => {
        let lineContent = '';
        if (bullet.type === 'chapter') {
          const formattedSubItems = bullet.items.map(it => {
            if (it.link) {
              return `<a href="${it.link}" target="_blank" style="color:#38bdf8; text-decoration:underline; text-underline-offset:3px; font-weight:600;" title="Open link for ${it.work}">${it.work}</a>`;
            }
            return `<span>${it.work}</span>`;
          }).join(', ');

          lineContent = `<span>${bullet.prefix}${bullet.items.length > 0 ? ': ' : ''}</span>${formattedSubItems}`;
        } else {
          lineContent = bullet.items.map(it => {
            if (it.link) {
              return `<a href="${it.link}" target="_blank" style="color:#38bdf8; text-decoration:underline; text-underline-offset:3px; font-weight:600;" title="Open link for ${it.work}">${it.work}</a>`;
            }
            return `<span>${it.work}</span>`;
          }).join(', ');
        }

        itemsListHtml += `
          <div class="whiteboard-work-item">
            <span style="color:#38bdf8;">•</span>
            <div>${lineContent}</div>
          </div>
        `;
      });

      wbHtml += `
        <div class="whiteboard-card">
          <div class="whiteboard-type-header">
            <span>${icon}</span>
            <span>${typeKey}</span>
          </div>
          <div>${itemsListHtml}</div>
        </div>
      `;
    });

    wbHtml += '</div>';

    if (bodyEl) bodyEl.innerHTML = wbHtml;

    if (!this.isManualFontScale) {
      const autoScale = this.calculateAutoFontScale(totalWorkItemsCount);
      this.updateWhiteboardFontScale(autoScale, false);
    } else {
      this.updateWhiteboardFontScale(this.whiteboardFontScale, true);
    }
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

    let html = '<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.6; color: var(--text-main, #f8fafc);">';
    html += `<div style="margin-bottom: 0.25rem;">${selectedClassName} Homework:</div>`;

    keys.forEach((key) => {
      html += `<div style="margin-top: 0.5rem; margin-bottom: 0.35rem;">${key}:</div>`;
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

      html += '<div style="margin-top: 0.5rem; margin-bottom: 0.25rem;">Links:</div>';
      uniqueLinks.forEach(l => {
        html += `<div style="margin-bottom: 0.2rem;">• ${l.type} (${l.name}): <a href="${l.url}" target="_blank" style="color: #38bdf8; text-decoration: underline;">${l.url}</a></div>`;
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
        if (window.showToastNotification) window.showToastNotification('📋 Homework summary copied with hyperlinked materials!');
        else alert('📋 Homework summary copied with hyperlinked materials!');
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
      alert('📋 Homework summary copied to clipboard!');
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
          if (window.showToastNotification) window.showToastNotification('🔍 Text selected! Press Ctrl+C to copy.');
        }
      }
    });

    // Font zoom buttons handler
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-wb-zoom-in' || e.target.closest('#btn-wb-zoom-in')) {
        this.updateWhiteboardFontScale(this.whiteboardFontScale + 0.2, true);
      } else if (e.target.id === 'btn-wb-zoom-out' || e.target.closest('#btn-wb-zoom-out')) {
        this.updateWhiteboardFontScale(this.whiteboardFontScale - 0.2, true);
      } else if (e.target.id === 'btn-wb-zoom-auto' || e.target.closest('#btn-wb-zoom-auto')) {
        this.isManualFontScale = false;
        this.renderWhiteboardContent();
      }
    });

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
            if (window.LessonUI) window.LessonUI.selectedClassId = classId;
            if (window.LessonUI) window.LessonUI.openEditLessonModal(lessonId);
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
