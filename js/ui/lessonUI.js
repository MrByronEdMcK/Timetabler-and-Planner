/* ==========================================================================
   Lesson Plan Manager, Curriculum Transfer & Lesson Viewer UI (View 3)
   ========================================================================== */

import {
  state,
  getClassCellStyles,
  showToastNotification,
  showReanalysisSummaryToast,
  escapeHtml
} from '../state.js';
import { TermManager } from '../termManager.js';
import { Scheduler } from '../scheduler.js';

function triggerRefresh(force = false, isScheduleEdit = true) {
  if (typeof window !== 'undefined' && typeof window.refreshAllViews === 'function') {
    window.refreshAllViews(force, isScheduleEdit);
  } else if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('planner:stateChanged'));
  }
}

export const LessonUI = {
  selectedClassId: null,
  collapsedTopics: {},
  importedCurriculumPayload: null,

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
      const linkedBadge = linkedClasses.length > 0 ? `<div style="font-size:0.72rem; color:#38bdf8; font-weight:700; margin-top:2px;">🔗 Linked: ${escapeHtml(linkedClasses.map(l => l.name).join(', '))}</div>` : '';
      const cellStyle = getClassCellStyles(c.color, state.theme === 'dark');

      return `
        <div class="class-item-wrapper">
          <button class="class-item-btn ${activeClass}" data-id="${escapeHtml(c.id)}">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <div style="width:12px; height:12px; border-radius:50%; background:${cellStyle.dotBg}; border:${cellStyle.dotBorder}; flex-shrink:0;"></div>
              <div>
                <div>${escapeHtml(c.name)}</div>
                ${linkedBadge}
                ${c.details ? `<div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(c.details)}</div>` : ''}
              </div>
            </div>
            <div class="class-stats">${count} Lessons</div>
          </button>
          <button class="btn btn-danger btn-sm delete-class-btn" data-id="${escapeHtml(c.id)}" title="Delete class and curriculum">🗑️</button>
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
    const currentStyle = getClassCellStyles(currentClass.color, state.theme === 'dark');

    let html = `
      <div style="font-weight:700; font-size:0.9rem; color:var(--primary); margin-bottom:0.5rem; display:flex; align-items:center; gap:0.5rem;">
        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${currentStyle.dotBg}; border:${currentStyle.dotBorder};"></span>
        <span>Select classes linked with ${escapeHtml(currentClass.name)}:</span>
      </div>
    `;

    otherClasses.forEach(c => {
      const isChecked = currentLinked.includes(c.id);
      const cellStyle = getClassCellStyles(c.color, state.theme === 'dark');
      html += `
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); padding:0.75rem 1rem; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${cellStyle.dotBg}; border:${cellStyle.dotBorder};"></span>
            <span style="font-weight:700; font-size:0.9rem;">${escapeHtml(c.name)}</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">(${escapeHtml(c.subject || 'General')})</span>
          </div>
          <label style="margin:0; cursor:pointer; display:flex; align-items:center; gap:0.4rem; font-size:0.85rem; font-weight:700; color:var(--primary);">
            <input type="checkbox" class="chk-link-class" data-target-id="${escapeHtml(c.id)}" ${isChecked ? 'checked' : ''}>
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
        syncBtn.innerHTML = `🔄 Sync Lesson to ${escapeHtml(names)}`;
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
      syncBtn.innerHTML = `✅ Synced to ${escapeHtml(linkedNames)}`;
      syncBtn.style.opacity = '0.6';
      syncBtn.style.cursor = 'not-allowed';
    }

    triggerRefresh(false, true);
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
          syncBtn.innerHTML = `🔄 Sync Lesson to ${escapeHtml(names)}`;
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
    triggerRefresh(false, true);
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

    topicGroups.forEach((group, groupIndex) => {
      const collapseStateKey = `${this.selectedClassId}_${group.unitName}`;
      const isCollapsed = !!this.collapsedTopics[collapseStateKey];
      const count = group.items.length;
      const startNum = group.items[0].originalIndex + 1;
      const endNum = group.items[group.items.length - 1].originalIndex + 1;
      const numLabel = count === 1 ? `Lesson #${startNum}` : `Lessons #${startNum}–#${endNum}`;

      const otherClasses = state.classes.filter(c => c.id !== this.selectedClassId);

      let copyMenuHtml = '';
      if (otherClasses.length === 0) {
        copyMenuHtml = `<div style="padding:0.4rem 0.75rem; font-size:0.75rem; color:var(--text-dim); font-style:italic;">No other classes created</div>`;
      } else {
        copyMenuHtml = otherClasses.map(c => {
          const cellStyle = getClassCellStyles(c.color, state.theme === 'dark');
          return `
            <button type="button" class="copy-unit-target-btn" data-unit="${escapeHtml(group.unitName)}" data-target-id="${escapeHtml(c.id)}" 
                    style="width:100%; text-align:left; background:transparent; border:none; padding:0.45rem 0.75rem; font-size:0.78rem; color:var(--text-main); font-weight:600; display:flex; align-items:center; gap:0.5rem; cursor:pointer; border-radius:4px; transition:background 0.15s ease;">
              <span style="width:10px; height:10px; border-radius:50%; background:${cellStyle.dotBg}; border:${cellStyle.dotBorder}; flex-shrink:0;"></span>
              <span>${escapeHtml(c.name)}</span>
            </button>
          `;
        }).join('');
      }

      html += `
        <div class="topic-group-container" data-unit-group-index="${groupIndex}" data-unit-name="${escapeHtml(group.unitName)}">
          <div class="topic-group-header ${isCollapsed ? 'collapsed' : ''}" data-topic-key="${escapeHtml(collapseStateKey)}" data-unit-group-index="${groupIndex}" draggable="true">
            <div class="topic-group-title">
              <span class="unit-drag-handle" title="Drag unit up or down to reorder sequence">⣿</span>
              <span class="topic-toggle-icon">${isCollapsed ? '▶' : '▼'}</span>
              <span>${escapeHtml(group.unitName)}</span>
              <span class="topic-count-badge">${count} ${count === 1 ? 'Lesson' : 'Lessons'} (${numLabel})</span>
            </div>
            <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
              <div style="display:inline-flex; gap:0.2rem; margin-right:0.15rem;">
                <button type="button" class="btn btn-secondary btn-xs unit-move-btn" data-dir="up" data-unit-group-index="${groupIndex}" ${groupIndex === 0 ? 'disabled style="opacity:0.35; cursor:not-allowed;"' : ''} title="Move unit up in sequence">▲</button>
                <button type="button" class="btn btn-secondary btn-xs unit-move-btn" data-dir="down" data-unit-group-index="${groupIndex}" ${groupIndex === topicGroups.length - 1 ? 'disabled style="opacity:0.35; cursor:not-allowed;"' : ''} title="Move unit down in sequence">▼</button>
              </div>
              <button type="button" class="btn btn-secondary btn-xs export-unit-btn" data-unit="${escapeHtml(group.unitName)}" title="Export this unit (${escapeHtml(group.unitName)}) to a JSON file" style="font-size:0.72rem; padding:0.15rem 0.5rem; line-height:1.2; font-weight:600;">📤 Export Unit</button>
              <div class="copy-unit-wrapper" style="position:relative; display:inline-block;">
                <button type="button" class="btn btn-secondary btn-xs copy-unit-btn" data-unit="${escapeHtml(group.unitName)}" title="Copy all lessons in this unit to another class" style="font-size:0.72rem; padding:0.15rem 0.5rem; line-height:1.2; font-weight:600;">📋 Copy Unit to Class ▼</button>
                <div class="copy-unit-dropdown" style="display:none; position:absolute; right:0; top:100%; margin-top:4px; background:var(--bg-surface); opacity:1; border:1px solid var(--border-color); border-radius:var(--radius-md); box-shadow:var(--shadow-xl); z-index:500; min-width:190px; padding:0.35rem 0;">
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
        const isMerged = lesson.isMerged || Boolean(lesson.mergeWithNextId);
        const isTest = lesson.isTestMilestone;

        let tagsHtml = '';
        if (lesson.isPinned) tagsHtml += `<span class="tag tag-pinned" data-class="${escapeHtml(this.selectedClassId)}" data-id="${escapeHtml(lesson.id)}" style="cursor:pointer;" title="Click to unpin this lesson">📌 Pinned: ${TermManager.formatDisplayDate(lesson.pinnedDate)} ✕</span> `;
        if (isRevision) tagsHtml += `<span class="tag tag-revision">⭐ Revision</span> `;
        if (isFloat) tagsHtml += `<span class="tag tag-float">🎈 Float</span> `;
        if (isTest) tagsHtml += `<span class="tag tag-test">🎯 Test: ${escapeHtml(lesson.testDate || 'Set Date')}</span> `;
        if (lesson.mergeWithNextId) {
          const nextPartner = lessons[originalIndex + 1];
          const partnerTitle = (nextPartner && nextPartner.id === lesson.mergeWithNextId) ? nextPartner.title : 'Next Lesson';
          tagsHtml += `<span class="tag tag-merged tag-unmerge-inline" data-class="${escapeHtml(this.selectedClassId)}" data-id="${escapeHtml(lesson.id)}" style="cursor:pointer;" title="Click to unmerge from ${escapeHtml(partnerTitle)}">🔀 Merged with ${escapeHtml(partnerTitle)} ✕</span> `;
        }
        if (lesson.isOmittedFromSchedule) {
          tagsHtml += `<span class="tag tag-locked tag-restore-inline" data-class="${escapeHtml(this.selectedClassId)}" data-id="${escapeHtml(lesson.id)}" style="cursor:pointer;" title="Click to restore to active schedule">✂️ Omitted in Schedule ✕</span> `;
        }
        const validTasks = (lesson.classwork && Array.isArray(lesson.classwork))
          ? lesson.classwork.filter(cw => cw && ((cw.work && cw.work.trim()) || (cw.link && cw.link.trim())))
          : [];
        if (validTasks.length > 0) {
          tagsHtml += `<span class="tag" style="background:rgba(59,130,246,0.2); color:#60a5fa; border:1px solid rgba(59,130,246,0.4);">📚 ${validTasks.length} Task${validTasks.length > 1 ? 's' : ''}</span> `;
        }

        html += `
          <div class="lesson-card ${isFloat ? 'is-float' : ''} ${isRevision ? 'is-revision' : ''} ${isMerged ? 'is-merged' : ''} ${lesson.isTestMilestone ? 'is-test' : ''}" 
               data-id="${escapeHtml(lesson.id)}" data-index="${originalIndex}" draggable="true">
            <div class="lesson-main-info">
              <span class="drag-handle" title="Drag to reorder lesson sequence">⣿</span>
              <div class="lesson-num">${originalIndex + 1}</div>
              <div class="lesson-details">
                <div class="lesson-title">${escapeHtml(lesson.title)}</div>
                <div class="lesson-unit">${escapeHtml(lesson.unit || 'General Curriculum')} ${tagsHtml}</div>
              </div>
            </div>
            <div class="lesson-actions">
              <button class="btn btn-secondary btn-sm view-lesson-btn" data-id="${escapeHtml(lesson.id)}" title="View lesson details and copy notes">👁️ View</button>
              <button class="btn btn-secondary btn-sm edit-lesson-btn" data-id="${escapeHtml(lesson.id)}" title="Edit lesson plan">✏️</button>
              <button class="btn btn-secondary btn-sm duplicate-lesson-btn" data-id="${escapeHtml(lesson.id)}" title="Duplicate this lesson plan">📄 Duplicate</button>
              <button class="btn btn-secondary btn-sm toggle-float-btn" data-id="${escapeHtml(lesson.id)}" title="Float lessons are pruned FIRST during pacing conflicts">
                ${isFloat ? 'Remove Float Tag' : '🎈 Tag Float'}
              </button>
              <button class="btn btn-secondary btn-sm toggle-revision-btn" data-id="${escapeHtml(lesson.id)}" title="Revision lessons are pruned SECOND during pacing conflicts">
                ${isRevision ? 'Remove Revision Tag' : '⭐ Tag Revision'}
              </button>
              <button class="btn btn-danger btn-sm delete-lesson-btn" data-id="${escapeHtml(lesson.id)}">🗑️</button>
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

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.copy-unit-wrapper')) {
        container.querySelectorAll('.copy-unit-dropdown').forEach(d => { d.style.display = 'none'; });
      }
    });

    container.addEventListener('click', (e) => {
      const exportUnitBtn = e.target.closest('.export-unit-btn');
      if (exportUnitBtn) {
        e.preventDefault();
        e.stopPropagation();
        const unitName = exportUnitBtn.getAttribute('data-unit');
        this.openCurriculumTransferModal('export', unitName || null);
        return;
      }

      const copyBtn = e.target.closest('.copy-unit-btn');
      if (copyBtn) {
        e.preventDefault();
        e.stopPropagation();
        const wrapper = copyBtn.closest('.copy-unit-wrapper');
        if (wrapper) {
          const dropdown = wrapper.querySelector('.copy-unit-dropdown');
          if (dropdown) {
            const isShown = dropdown.style.display === 'block';
            container.querySelectorAll('.copy-unit-dropdown').forEach(d => { d.style.display = 'none'; });
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
            delete clone.mergeWithNextId;
            delete clone.isOmittedFromSchedule;
            state.lessonPlans[targetClass.id].push(clone);
          });

          state.saveState();
          triggerRefresh(false, true);

          const listContainer = document.getElementById('lesson-list-container');
          if (listContainer) {
            const alertBanner = document.createElement('div');
            alertBanner.style.cssText = 'background:rgba(16, 185, 129, 0.2); border:1px solid #10b981; color:#34d399; padding:0.6rem 1rem; border-radius:var(--radius-md); margin-bottom:1rem; font-weight:700; font-size:0.85rem;';
            alertBanner.innerHTML = `✅ Successfully copied unit "${escapeHtml(unitName)}" (${unitLessons.length} lessons) to ${escapeHtml(targetClass.name)}!`;
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
          delete duplicate.mergeWithNextId;
          delete duplicate.isOmittedFromSchedule;

          lessons.splice(origIdx + 1, 0, duplicate);
          state.saveState();
          triggerRefresh(false, true);
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
        if (e.target.closest('.copy-unit-btn') || e.target.closest('.copy-unit-dropdown') || e.target.closest('.export-unit-btn') || e.target.closest('.unit-move-btn')) return;
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

  validateAndClearInvalidAnchorsAfterReorder(classId, movedLessonIds = new Set()) {
    const lessons = state.lessonPlans[classId] || [];
    if (lessons.length === 0) return { clearedPins: [], clearedTests: [], clearedMerges: [] };

    const availableSlots = Scheduler.getAvailableSlots(classId);
    const clearedPins = [];
    const clearedTests = [];
    const clearedMerges = [];

    let currentLessonCheckStart = 0;
    let currentSlotCheckStart = 0;

    lessons.forEach((lesson, idx) => {
      const wasMoved = movedLessonIds.has(lesson.id);

      // Clear manual merge pairing if a lesson or its merge partner was moved or is no longer adjacent
      if (lesson.mergeWithNextId) {
        const nextLesson = lessons[idx + 1];
        if (wasMoved || !nextLesson || nextLesson.id !== lesson.mergeWithNextId || movedLessonIds.has(nextLesson.id)) {
          delete lesson.mergeWithNextId;
          clearedMerges.push(lesson.title);
        }
      }

      const hasPin = Boolean(lesson.isPinned && (lesson.pinnedDate || lesson.pinnedSlotKey));
      const hasTestDate = Boolean(lesson.isTestMilestone && (lesson.testDate || lesson.testSlotKey));

      if (!hasPin && !hasTestDate) return;

      let key = hasTestDate ? lesson.testSlotKey : lesson.pinnedSlotKey;
      const targetDate = hasTestDate ? lesson.testDate : lesson.pinnedDate;
      const targetPeriodId = hasTestDate ? lesson.testPeriodId : lesson.pinnedPeriodId;

      if (!key && targetDate && targetPeriodId) {
        key = `${targetDate}_${targetPeriodId}`;
      }

      let slotIdx = -1;
      if (key && availableSlots.length > 0) {
        slotIdx = availableSlots.findIndex(s => `${s.date}_${s.periodId}` === key);
      }
      if (slotIdx === -1 && targetDate && availableSlots.length > 0) {
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

      const windowLessonsCount = idx - currentLessonCheckStart;
      const windowSlotsCount = slotIdx >= 0 ? (slotIdx - currentSlotCheckStart) : -1;
      const isOutOfOrder = slotIdx !== -1 && slotIdx < currentSlotCheckStart;
      const exceedsCapacity = slotIdx !== -1 && windowLessonsCount > windowSlotsCount;

      if (wasMoved || isOutOfOrder || exceedsCapacity) {
        if (hasPin) {
          lesson.isPinned = false;
          delete lesson.pinnedDate;
          delete lesson.pinnedPeriodId;
          delete lesson.pinnedSlotKey;
          clearedPins.push(lesson.title);
        }
        if (hasTestDate) {
          delete lesson.testDate;
          delete lesson.testPeriodId;
          delete lesson.testSlotKey;
          clearedTests.push(lesson.title);
        }
      } else if (slotIdx >= 0) {
        currentLessonCheckStart = idx + 1;
        currentSlotCheckStart = Math.max(currentSlotCheckStart, slotIdx + 1);
      }
    });

    return { clearedPins, clearedTests, clearedMerges };
  },

  reorderUnitGroup(fromGroupIndex, toGroupIndex) {
    const lessons = state.lessonPlans[this.selectedClassId] || [];
    if (lessons.length === 0) return;

    const topicGroups = [];
    let currentGroup = null;
    lessons.forEach((lesson) => {
      const unitName = (lesson.unit || 'General Curriculum').trim();
      if (!currentGroup || currentGroup.unitName !== unitName) {
        currentGroup = { unitName, lessons: [] };
        topicGroups.push(currentGroup);
      }
      currentGroup.lessons.push(lesson);
    });

    if (
      fromGroupIndex < 0 ||
      fromGroupIndex >= topicGroups.length ||
      toGroupIndex < 0 ||
      toGroupIndex >= topicGroups.length ||
      fromGroupIndex === toGroupIndex
    ) {
      return;
    }

    const [movedGroup] = topicGroups.splice(fromGroupIndex, 1);
    topicGroups.splice(toGroupIndex, 0, movedGroup);

    const movedLessonIds = new Set(movedGroup.lessons.map(l => l.id));
    const newLessons = [];
    topicGroups.forEach(g => newLessons.push(...g.lessons));
    state.lessonPlans[this.selectedClassId] = newLessons;

    const { clearedPins, clearedTests, clearedMerges } = this.validateAndClearInvalidAnchorsAfterReorder(this.selectedClassId, movedLessonIds);
    state.saveState();
    this.renderLessonList();
    triggerRefresh(false, true);

    if (clearedPins.length > 0 || clearedTests.length > 0 || clearedMerges.length > 0) {
      const parts = [];
      if (clearedPins.length > 0) parts.push(`${clearedPins.length} pinned lesson(s) unpinned`);
      if (clearedTests.length > 0) parts.push(`${clearedTests.length} test date(s) cleared`);
      if (clearedMerges.length > 0) parts.push(`${clearedMerges.length} merged pair(s) unmerged`);
      showReanalysisSummaryToast(`Moved unit "${movedGroup.unitName}" • ${parts.join(' & ')}.`);
    } else {
      showToastNotification(`Moved unit "${movedGroup.unitName}"`);
    }
  },

  bindDragEvents() {
    const container = document.getElementById('lesson-list-container');
    if (!container) return;

    const moveBtns = container.querySelectorAll('.unit-move-btn');
    moveBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const groupIdx = parseInt(btn.getAttribute('data-unit-group-index'), 10);
        const dir = btn.getAttribute('data-dir');
        if (isNaN(groupIdx)) return;
        const targetIdx = dir === 'up' ? groupIdx - 1 : groupIdx + 1;
        this.reorderUnitGroup(groupIdx, targetIdx);
      });
    });

    const unitHeaders = container.querySelectorAll('.topic-group-header');
    const unitContainers = container.querySelectorAll('.topic-group-container');

    unitHeaders.forEach(header => {
      header.addEventListener('dragstart', (e) => {
        if (e.target.closest('.copy-unit-btn') || e.target.closest('.export-unit-btn') || e.target.closest('.unit-move-btn')) {
          e.preventDefault();
          return;
        }
        e.stopPropagation();
        this.draggedUnitGroupIndex = parseInt(header.getAttribute('data-unit-group-index'), 10);
        this.draggedIndex = null;
        header.classList.add('dragging-unit');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', `unit_${this.draggedUnitGroupIndex}`); } catch (err) {}
        }
      });

      header.addEventListener('dragend', () => {
        header.classList.remove('dragging-unit');
        this.draggedUnitGroupIndex = null;
        unitContainers.forEach(c => {
          c.classList.remove('unit-drag-over-top', 'unit-drag-over-bottom');
        });
      });
    });

    unitContainers.forEach(unitBox => {
      unitBox.addEventListener('dragover', (e) => {
        if (this.draggedUnitGroupIndex === null || this.draggedUnitGroupIndex === undefined) return;
        e.preventDefault();
        e.stopPropagation();
        const targetGroupIdx = parseInt(unitBox.getAttribute('data-unit-group-index'), 10);
        unitContainers.forEach(c => c.classList.remove('unit-drag-over-top', 'unit-drag-over-bottom'));
        if (targetGroupIdx !== this.draggedUnitGroupIndex) {
          if (targetGroupIdx < this.draggedUnitGroupIndex) {
            unitBox.classList.add('unit-drag-over-top');
          } else {
            unitBox.classList.add('unit-drag-over-bottom');
          }
        }
      });

      unitBox.addEventListener('dragleave', (e) => {
        if (this.draggedUnitGroupIndex === null || this.draggedUnitGroupIndex === undefined) return;
        if (!unitBox.contains(e.relatedTarget)) {
          unitBox.classList.remove('unit-drag-over-top', 'unit-drag-over-bottom');
        }
      });

      unitBox.addEventListener('drop', (e) => {
        if (this.draggedUnitGroupIndex === null || this.draggedUnitGroupIndex === undefined) return;
        e.preventDefault();
        e.stopPropagation();
        unitContainers.forEach(c => c.classList.remove('unit-drag-over-top', 'unit-drag-over-bottom'));
        const targetGroupIdx = parseInt(unitBox.getAttribute('data-unit-group-index'), 10);
        const fromIdx = this.draggedUnitGroupIndex;
        this.draggedUnitGroupIndex = null;
        if (!isNaN(fromIdx) && !isNaN(targetGroupIdx) && fromIdx !== targetGroupIdx) {
          this.reorderUnitGroup(fromIdx, targetGroupIdx);
        }
      });
    });

    const cards = container.querySelectorAll('.lesson-card');
    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        this.draggedUnitGroupIndex = null;
        this.draggedIndex = parseInt(card.getAttribute('data-index'), 10);
        card.classList.add('dragging');
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        this.draggedIndex = null;
        cards.forEach(c => c.classList.remove('drag-over'));
      });

      card.addEventListener('dragover', (e) => {
        if (this.draggedUnitGroupIndex !== null && this.draggedUnitGroupIndex !== undefined) return;
        e.preventDefault();
        card.classList.add('drag-over');
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        if (this.draggedUnitGroupIndex !== null && this.draggedUnitGroupIndex !== undefined) return;
        e.preventDefault();
        card.classList.remove('drag-over');
        const targetIndex = parseInt(card.getAttribute('data-index'), 10);
        if (this.draggedIndex !== null && this.draggedIndex !== undefined && this.draggedIndex !== targetIndex) {
          const lessons = state.lessonPlans[this.selectedClassId] || [];
          const [movedItem] = lessons.splice(this.draggedIndex, 1);
          lessons.splice(targetIndex, 0, movedItem);
          this.validateAndClearInvalidAnchorsAfterReorder(this.selectedClassId, new Set([movedItem.id]));
          state.saveState();
          this.renderLessonList();
          triggerRefresh(false, true);
        }
      });
    });
  },

  initTestSlotPickers() {
    const termSelect = document.getElementById('lesson-test-term-select');
    const weekSelect = document.getElementById('lesson-test-week-select');
    const slotSelect = document.getElementById('lesson-test-slot-select');
    if (!termSelect || !weekSelect || !slotSelect) return;

    termSelect.innerHTML = state.terms.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>`).join('');

    const updateWeeks = () => {
      const termId = termSelect.value;
      const term = state.terms.find(t => t.id === termId) || state.terms[0];
      const numWeeks = term ? TermManager.getTermWeeks(term) : 10;
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
      return `<option value="${escapeHtml(slotKey)}" data-date="${escapeHtml(s.date)}" data-period="${escapeHtml(s.periodId)}" ${selected}>${escapeHtml(displayLabel)}</option>`;
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
    unitDatalist.innerHTML = uniqueUnits.map(u => `<option value="${escapeHtml(u)}">`).join('');
  },

  bindTestCheckToggle() {
    const testCheck = document.getElementById('lesson-test-check');
    const pinCheck = document.getElementById('lesson-pin-check');

    const handleToggle = () => {
      const group = document.getElementById('lesson-test-slot-group');
      const isChecked = (testCheck && testCheck.checked) || (pinCheck && pinCheck.checked);
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
  },

  renderClassworkInputs(classworkArray = []) {
    const container = document.getElementById('classwork-inputs-container');
    if (!container) return;

    const validItems = Array.isArray(classworkArray)
      ? classworkArray.filter(cw => cw && ((cw.work && cw.work.trim()) || (cw.link && cw.link.trim())))
      : [];

    container.innerHTML = validItems.map((cw) => `
      <div class="classwork-input-row">
        <input type="text" class="form-control cw-type-input" list="classwork-type-suggestions" placeholder="Type (e.g. Textbook)" value="${escapeHtml(cw.type || '')}" style="font-size:0.82rem; padding:0.3rem 0.5rem;">
        <input type="text" class="form-control cw-work-input" placeholder="Work (e.g. 7A Q1-5, Page 7)" value="${escapeHtml(cw.work || '')}" style="font-size:0.82rem; padding:0.3rem 0.5rem;">
        <input type="text" class="form-control cw-link-input" placeholder="Link / URL (Optional)" value="${escapeHtml(cw.link || '')}" style="font-size:0.82rem; padding:0.3rem 0.5rem;">
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
      <input type="text" class="form-control cw-type-input" list="classwork-type-suggestions" placeholder="Type (e.g. Textbook)" value="${escapeHtml(type)}" style="font-size:0.82rem; padding:0.3rem 0.5rem;">
      <input type="text" class="form-control cw-work-input" placeholder="Work (e.g. 7A Q1-5, Page 7)" value="${escapeHtml(work)}" style="font-size:0.82rem; padding:0.3rem 0.5rem;">
      <input type="text" class="form-control cw-link-input" placeholder="Link / URL (Optional)" value="${escapeHtml(link)}" style="font-size:0.82rem; padding:0.3rem 0.5rem;">
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
      if (workVal || linkVal) {
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

    const floatCheck = document.getElementById('lesson-float-check');
    if (floatCheck) floatCheck.checked = false;

    const revisionCheck = document.getElementById('lesson-revision-check');
    if (revisionCheck) revisionCheck.checked = false;

    const pinCheck = document.getElementById('lesson-pin-check');
    if (pinCheck) pinCheck.checked = !!(targetDate && targetPeriodId);

    const testCheck = document.getElementById('lesson-test-check');
    if (testCheck) testCheck.checked = false;

    const slotGroup = document.getElementById('lesson-test-slot-group');
    if (targetDate && targetPeriodId) {
      if (slotGroup) slotGroup.style.display = 'block';
      const slotKey = `${targetDate}_${targetPeriodId}`;
      this.populateTestSlotOptions(this.selectedClassId, slotKey);
    } else if (slotGroup) {
      slotGroup.style.display = 'none';
    }

    this.renderClassworkInputs([]);
    this.populateUnitAutocomplete();
    this.bindTestCheckToggle();
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

    const floatCheck = document.getElementById('lesson-float-check');
    if (floatCheck) floatCheck.checked = !!lesson.isFloat;

    const revisionCheck = document.getElementById('lesson-revision-check');
    if (revisionCheck) revisionCheck.checked = !!lesson.isRevision;

    const testCheck = document.getElementById('lesson-test-check');
    const pinCheck = document.getElementById('lesson-pin-check');
    const slotGroup = document.getElementById('lesson-test-slot-group');

    if (testCheck) testCheck.checked = !!lesson.isTestMilestone;
    if (pinCheck) pinCheck.checked = !!lesson.isPinned;

    const isAnchored = !!lesson.isTestMilestone || !!lesson.isPinned;
    if (isAnchored) {
      if (slotGroup) slotGroup.style.display = 'block';
      let keyToSelect = lesson.testSlotKey || lesson.pinnedSlotKey;
      if (!keyToSelect && (lesson.testDate || lesson.pinnedDate)) {
        const targetD = lesson.testDate || lesson.pinnedDate;
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
    this.initRichToolbar();
    this.updateSyncLinkedCheckboxInModal();
    backdrop.classList.add('active');
  },

  // =========================================================================
  // Curriculum & Unit Export / Import (Across Devices & Academic Years)
  // =========================================================================
  getOrderedUnitsForLessons(lessons = []) {
    const unitMap = new Map();
    lessons.forEach(lesson => {
      const uName = (lesson.unit || 'General Curriculum').trim();
      if (!unitMap.has(uName)) {
        unitMap.set(uName, []);
      }
      unitMap.get(uName).push(lesson);
    });
    return Array.from(unitMap.entries()).map(([unitName, unitLessons]) => ({
      unitName,
      lessons: unitLessons
    }));
  },

  buildCurriculumExportPayload(classId, selectedUnits = null, options = { classwork: true, content: true, tags: true, dates: false }) {
    const classObj = state.classes.find(c => c.id === classId);
    const rawLessons = state.lessonPlans[classId] || [];
    const unitFilter = selectedUnits ? new Set(selectedUnits) : null;

    const filteredLessons = rawLessons
      .filter(l => {
        const uName = (l.unit || 'General Curriculum').trim();
        return !unitFilter || unitFilter.has(uName);
      })
      .map(l => {
        const cleanCw = options.classwork && Array.isArray(l.classwork)
          ? l.classwork
              .filter(cw => cw && ((cw.work && cw.work.trim()) || (cw.link && cw.link.trim())))
              .map(cw => ({
                type: (cw.type || 'Task').trim(),
                work: (cw.work || '').trim(),
                link: (cw.link || '').trim()
              }))
          : [];

        const exportedLesson = {
          title: l.title || 'Untitled Lesson',
          unit: (l.unit || 'General Curriculum').trim(),
          content: options.content ? (l.content || '') : '',
          classwork: cleanCw,
          isFloat: options.tags ? Boolean(l.isFloat) : false,
          isRevision: options.tags ? Boolean(l.isRevision) : false,
          isTestMilestone: options.tags ? Boolean(l.isTestMilestone) : false
        };

        if (options.dates) {
          if (l.isTestMilestone) {
            exportedLesson.testSlotKey = l.testSlotKey || null;
            exportedLesson.testDate = l.testDate || null;
            exportedLesson.testPeriodId = l.testPeriodId || null;
          }
          if (l.isPinned) {
            exportedLesson.isPinned = true;
            exportedLesson.pinnedSlotKey = l.pinnedSlotKey || null;
            exportedLesson.pinnedDate = l.pinnedDate || null;
            exportedLesson.pinnedPeriodId = l.pinnedPeriodId || null;
          }
        }
        return exportedLesson;
      });

    const exportedUnits = [...new Set(filteredLessons.map(l => l.unit))];

    return {
      format: 'timetabler_curriculum_v1',
      exportedAt: new Date().toISOString(),
      academicYear: state.academicYear,
      classInfo: classObj ? {
        name: classObj.name,
        subject: classObj.subject || classObj.name,
        color: classObj.color || '#3b82f6',
        details: classObj.details || ''
      } : { name: 'Exported Class', subject: 'General', color: '#3b82f6', details: '' },
      units: exportedUnits,
      lessonCount: filteredLessons.length,
      lessons: filteredLessons
    };
  },

  downloadCurriculumJSON(payload, filenameSuffix = '') {
    const safeClass = (payload.classInfo?.name || 'Class').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeSuffix = filenameSuffix ? `_${filenameSuffix.replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
    const filename = `Curriculum_${safeClass}${safeSuffix}_${state.academicYear}.json`;
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  openCurriculumTransferModal(mode = 'export', preselectedUnit = null) {
    if (!this.selectedClassId && state.classes.length > 0) {
      this.selectedClassId = state.classes[0].id;
    }
    const backdrop = document.getElementById('modal-curriculum-transfer-backdrop');
    if (!backdrop) return;

    this.switchCurriculumTransferTab(mode);
    this.populateExportCurriculumModal(this.selectedClassId, preselectedUnit);
    this.populateImportCurriculumModal();
    backdrop.classList.add('active');
  },

  switchCurriculumTransferTab(mode = 'export') {
    const exportTab = document.getElementById('tab-curriculum-export');
    const importTab = document.getElementById('tab-curriculum-import');
    const exportPanel = document.getElementById('panel-curriculum-export');
    const importPanel = document.getElementById('panel-curriculum-import');

    if (mode === 'import') {
      if (exportTab) exportTab.className = 'btn btn-secondary btn-sm';
      if (importTab) importTab.className = 'btn btn-primary btn-sm';
      if (exportPanel) exportPanel.style.display = 'none';
      if (importPanel) importPanel.style.display = 'block';
    } else {
      if (exportTab) exportTab.className = 'btn btn-primary btn-sm';
      if (importTab) importTab.className = 'btn btn-secondary btn-sm';
      if (exportPanel) exportPanel.style.display = 'block';
      if (importPanel) importPanel.style.display = 'none';
    }
  },

  populateExportCurriculumModal(classId = null, preselectedUnit = null) {
    const targetClassId = classId || this.selectedClassId || (state.classes[0] && state.classes[0].id);
    const classSelect = document.getElementById('export-curriculum-class-select');
    if (classSelect) {
      if (state.classes.length === 0) {
        classSelect.innerHTML = `<option value="">No classes available</option>`;
      } else {
        classSelect.innerHTML = state.classes.map(c => {
          const count = (state.lessonPlans[c.id] || []).length;
          const sel = c.id === targetClassId ? 'selected' : '';
          return `<option value="${escapeHtml(c.id)}" ${sel}>${escapeHtml(c.name)} (${count} Lessons)</option>`;
        }).join('');
      }
    }
    this.renderExportUnitsChecklist(targetClassId, preselectedUnit);
  },

  renderExportUnitsChecklist(classId, preselectedUnit = null) {
    const checklist = document.getElementById('export-units-checklist');
    if (!checklist) return;

    const lessons = state.lessonPlans[classId] || [];
    if (lessons.length === 0) {
      checklist.innerHTML = `<div style="padding:0.75rem; color:var(--text-dim); font-size:0.82rem; text-align:center;">No lessons found in this class.</div>`;
      return;
    }

    const units = this.getOrderedUnitsForLessons(lessons);
    checklist.innerHTML = units.map((u) => {
      const isChecked = preselectedUnit ? (u.unitName === preselectedUnit) : true;
      const taskCount = u.lessons.reduce((acc, l) => {
        const valid = Array.isArray(l.classwork) ? l.classwork.filter(cw => cw && ((cw.work && cw.work.trim()) || (cw.link && cw.link.trim()))).length : 0;
        return acc + valid;
      }, 0);
      return `
        <label style="display:flex; align-items:center; justify-content:space-between; padding:0.4rem 0.6rem; border-radius:4px; background:var(--bg-surface); border:1px solid var(--border-color); cursor:pointer; font-size:0.84rem; margin:0;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <input type="checkbox" class="chk-export-unit" value="${escapeHtml(u.unitName)}" ${isChecked ? 'checked' : ''}>
            <span style="font-weight:600; color:var(--text-main);">${escapeHtml(u.unitName)}</span>
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">${u.lessons.length} Lesson${u.lessons.length !== 1 ? 's' : ''}${taskCount > 0 ? ` • ${taskCount} Task${taskCount !== 1 ? 's' : ''}` : ''}</span>
        </label>
      `;
    }).join('');
  },

  executeCurriculumExportFromModal() {
    const classSelect = document.getElementById('export-curriculum-class-select');
    const classId = classSelect ? classSelect.value : this.selectedClassId;
    if (!classId) {
      alert('Please select a class to export.');
      return;
    }

    const checkedBoxes = Array.from(document.querySelectorAll('#export-units-checklist .chk-export-unit:checked'));
    if (checkedBoxes.length === 0) {
      alert('Please select at least one unit to export.');
      return;
    }

    const totalBoxes = document.querySelectorAll('#export-units-checklist .chk-export-unit').length;
    const selectedUnits = checkedBoxes.map(cb => cb.value);

    const options = {
      classwork: document.getElementById('export-opt-classwork')?.checked ?? true,
      content: document.getElementById('export-opt-content')?.checked ?? true,
      tags: document.getElementById('export-opt-tags')?.checked ?? true,
      dates: document.getElementById('export-opt-dates')?.checked ?? false
    };

    const payload = this.buildCurriculumExportPayload(classId, selectedUnits, options);
    const suffix = (selectedUnits.length === 1 && totalBoxes > 1)
      ? selectedUnits[0]
      : (selectedUnits.length < totalBoxes ? `${selectedUnits.length}_Units` : 'Full_Curriculum');

    this.downloadCurriculumJSON(payload, suffix);

    const backdrop = document.getElementById('modal-curriculum-transfer-backdrop');
    if (backdrop) backdrop.classList.remove('active');

    showToastNotification(`📤 Exported ${payload.lessonCount} lessons (${selectedUnits.length} unit${selectedUnits.length !== 1 ? 's' : ''})`);
  },

  populateImportCurriculumModal() {
    state.syncCurrentYearToYears();
    const destYearLabel = document.getElementById('import-dest-year-label');
    if (destYearLabel) destYearLabel.textContent = `${state.academicYear}`;

    const destSelect = document.getElementById('import-dest-class-select');
    const newClassWrap = document.getElementById('import-new-class-name-wrap');
    if (destSelect) {
      let opts = state.classes.map(c => {
        const sel = c.id === this.selectedClassId ? 'selected' : '';
        return `<option value="${escapeHtml(c.id)}" ${sel}>${escapeHtml(c.name)}</option>`;
      }).join('');
      opts += `<option value="__NEW_CLASS__">+ Create New Class...</option>`;
      destSelect.innerHTML = opts;
      if (state.classes.length === 0) {
        destSelect.value = '__NEW_CLASS__';
        if (newClassWrap) newClassWrap.style.display = 'block';
      } else {
        if (newClassWrap) newClassWrap.style.display = 'none';
      }
    }

    const yearSelect = document.getElementById('import-source-year-select');
    if (yearSelect) {
      const allYears = Object.keys(state.data.years || {}).sort((a, b) => Number(b) - Number(a));
      const yearsWithClasses = allYears.filter(yr => {
        const yData = state.data.years[yr];
        return yData && Array.isArray(yData.classes) && yData.classes.length > 0;
      });

      if (yearsWithClasses.length === 0) {
        yearSelect.innerHTML = `<option value="">No years with classes found</option>`;
      } else {
        const defaultSourceYr = yearsWithClasses.find(yr => Number(yr) !== Number(state.academicYear)) || yearsWithClasses[0];
        yearSelect.innerHTML = yearsWithClasses.map(yr => {
          const count = (state.data.years[yr]?.classes || []).length;
          const sel = String(yr) === String(defaultSourceYr) ? 'selected' : '';
          return `<option value="${escapeHtml(yr)}" ${sel}>${escapeHtml(yr)} (${count} Class${count !== 1 ? 'es' : ''})</option>`;
        }).join('');
      }
      this.populateImportYearClasses();
    }

    const sourceTypeRadio = document.querySelector('input[name="import-curriculum-source-type"]:checked');
    const sourceType = sourceTypeRadio ? sourceTypeRadio.value : 'file';
    this.updateImportSourceVisibility(sourceType);
  },

  updateImportSourceVisibility(sourceType) {
    const fileBox = document.getElementById('import-source-file-box');
    const yearBox = document.getElementById('import-source-year-box');
    if (sourceType === 'year') {
      if (fileBox) fileBox.style.display = 'none';
      if (yearBox) yearBox.style.display = 'block';
      this.loadImportPreviewFromSelectedYearClass();
    } else {
      if (fileBox) fileBox.style.display = 'block';
      if (yearBox) yearBox.style.display = 'none';
      if (this.importedCurriculumPayload) {
        this.renderImportUnitsPreview(this.importedCurriculumPayload);
      } else {
        const previewSec = document.getElementById('import-units-preview-section');
        if (previewSec) previewSec.style.display = 'none';
      }
    }
  },

  populateImportYearClasses() {
    const yearSelect = document.getElementById('import-source-year-select');
    const classSelect = document.getElementById('import-source-year-class-select');
    if (!yearSelect || !classSelect) return;

    const yr = yearSelect.value;
    const yData = (state.data.years && state.data.years[yr]) ? state.data.years[yr] : null;
    if (!yData || !Array.isArray(yData.classes) || yData.classes.length === 0) {
      classSelect.innerHTML = `<option value="">No classes in ${escapeHtml(yr || 'selected year')}</option>`;
      return;
    }

    classSelect.innerHTML = yData.classes.map(c => {
      const lCount = ((yData.lessonPlans && yData.lessonPlans[c.id]) || []).length;
      return `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} (${lCount} Lessons)</option>`;
    }).join('');

    this.loadImportPreviewFromSelectedYearClass();
  },

  loadImportPreviewFromSelectedYearClass() {
    const yearSelect = document.getElementById('import-source-year-select');
    const classSelect = document.getElementById('import-source-year-class-select');
    const previewSec = document.getElementById('import-units-preview-section');
    if (!yearSelect || !classSelect) return;

    const yr = yearSelect.value;
    const cid = classSelect.value;
    const yData = (state.data.years && state.data.years[yr]) ? state.data.years[yr] : null;
    if (!yData || !cid) {
      if (previewSec) previewSec.style.display = 'none';
      return;
    }

    const classObj = (yData.classes || []).find(c => c.id === cid);
    const lessons = (yData.lessonPlans && yData.lessonPlans[cid]) ? yData.lessonPlans[cid] : [];

    const payload = {
      format: 'timetabler_curriculum_v1',
      academicYear: Number(yr),
      classInfo: classObj ? {
        name: classObj.name,
        subject: classObj.subject || classObj.name,
        color: classObj.color || '#3b82f6',
        details: classObj.details || ''
      } : { name: 'Class', subject: 'General', color: '#3b82f6', details: '' },
      lessons: JSON.parse(JSON.stringify(lessons))
    };

    this.renderImportUnitsPreview(payload);
  },

  handleCurriculumFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const normalized = this.normalizeUploadedCurriculumJSON(parsed);
        if (!normalized) {
          alert('❌ Unrecognized JSON format. Please upload a Curriculum Export JSON or a Timetable Planner Backup JSON.');
          return;
        }
        this.importedCurriculumPayload = normalized;
        this.renderImportUnitsPreview(normalized);

        const newClassInput = document.getElementById('import-new-class-name-input');
        if (newClassInput && !newClassInput.value.trim() && normalized.classInfo?.name) {
          newClassInput.value = normalized.classInfo.name;
        }
      } catch (err) {
        alert('❌ Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  },

  normalizeUploadedCurriculumJSON(parsed) {
    if (!parsed || typeof parsed !== 'object') return null;

    if (parsed.format === 'timetabler_curriculum_v1' && Array.isArray(parsed.lessons)) {
      return parsed;
    }

    if (Array.isArray(parsed)) {
      return {
        format: 'timetabler_curriculum_v1',
        classInfo: { name: 'Imported Class', subject: 'General', color: '#3b82f6', details: '' },
        lessons: parsed
      };
    }

    if (parsed.lessonPlans && typeof parsed.lessonPlans === 'object') {
      const classesList = Array.isArray(parsed.classes) ? parsed.classes : [];
      const allLessons = [];
      Object.keys(parsed.lessonPlans).forEach(cid => {
        const cObj = classesList.find(c => c.id === cid);
        const cPrefix = (classesList.length > 1 && cObj) ? `[${cObj.name}] ` : '';
        const cLessons = parsed.lessonPlans[cid] || [];
        cLessons.forEach(l => {
          const copy = JSON.parse(JSON.stringify(l));
          copy.unit = `${cPrefix}${(copy.unit || 'General Curriculum').trim()}`;
          allLessons.push(copy);
        });
      });
      const firstClass = classesList[0] || { name: 'Backup Class', subject: 'General', color: '#3b82f6', details: '' };
      return {
        format: 'timetabler_curriculum_v1',
        classInfo: firstClass,
        lessons: allLessons
      };
    }

    return null;
  },

  renderImportUnitsPreview(payload) {
    const previewSec = document.getElementById('import-units-preview-section');
    const checklist = document.getElementById('import-units-checklist');
    const label = document.getElementById('import-units-preview-label');
    if (!previewSec || !checklist) return;

    previewSec.style.display = 'block';
    const lessons = (payload && Array.isArray(payload.lessons)) ? payload.lessons : [];

    if (label) {
      const srcName = payload?.classInfo?.name ? `${payload.classInfo.name}` : 'Source';
      const yrText = payload?.academicYear ? ` (${payload.academicYear})` : '';
      label.textContent = `Units in ${srcName}${yrText} (${lessons.length} Total Lessons)`;
    }

    if (lessons.length === 0) {
      checklist.innerHTML = `<div style="padding:0.75rem; color:var(--text-dim); font-size:0.82rem; text-align:center;">No lessons found in the selected source.</div>`;
      return;
    }

    const units = this.getOrderedUnitsForLessons(lessons);
    checklist.innerHTML = units.map(u => {
      const taskCount = u.lessons.reduce((acc, l) => {
        const valid = Array.isArray(l.classwork) ? l.classwork.filter(cw => cw && ((cw.work && cw.work.trim()) || (cw.link && cw.link.trim()))).length : 0;
        return acc + valid;
      }, 0);
      return `
        <label style="display:flex; align-items:center; justify-content:space-between; padding:0.4rem 0.6rem; border-radius:4px; background:var(--bg-surface); border:1px solid var(--border-color); cursor:pointer; font-size:0.84rem; margin:0;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <input type="checkbox" class="chk-import-unit" value="${escapeHtml(u.unitName)}" checked>
            <span style="font-weight:600; color:var(--text-main);">${escapeHtml(u.unitName)}</span>
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">${u.lessons.length} Lesson${u.lessons.length !== 1 ? 's' : ''}${taskCount > 0 ? ` • ${taskCount} Task${taskCount !== 1 ? 's' : ''}` : ''}</span>
        </label>
      `;
    }).join('');
  },

  executeCurriculumImportFromModal() {
    const sourceTypeRadio = document.querySelector('input[name="import-curriculum-source-type"]:checked');
    const sourceType = sourceTypeRadio ? sourceTypeRadio.value : 'file';

    let activePayload = null;
    if (sourceType === 'year') {
      const yearSelect = document.getElementById('import-source-year-select');
      const classSelect = document.getElementById('import-source-year-class-select');
      const yr = yearSelect ? yearSelect.value : '';
      const cid = classSelect ? classSelect.value : '';
      const yData = (state.data.years && state.data.years[yr]) ? state.data.years[yr] : null;
      if (!yData || !cid) {
        alert('Please select a source academic year and class.');
        return;
      }
      const classObj = (yData.classes || []).find(c => c.id === cid);
      const lessons = (yData.lessonPlans && yData.lessonPlans[cid]) ? yData.lessonPlans[cid] : [];
      activePayload = {
        classInfo: classObj || { name: 'Imported Class', color: '#3b82f6', details: '' },
        lessons: JSON.parse(JSON.stringify(lessons))
      };
    } else {
      activePayload = this.importedCurriculumPayload;
      if (!activePayload || !Array.isArray(activePayload.lessons)) {
        alert('Please upload a Curriculum JSON file first.');
        return;
      }
    }

    const checkedBoxes = Array.from(document.querySelectorAll('#import-units-checklist .chk-import-unit:checked'));
    if (checkedBoxes.length === 0) {
      alert('Please select at least one unit to import.');
      return;
    }
    const selectedUnitsSet = new Set(checkedBoxes.map(cb => cb.value));

    const destSelect = document.getElementById('import-dest-class-select');
    let destClassId = destSelect ? destSelect.value : this.selectedClassId;

    if (destClassId === '__NEW_CLASS__') {
      const newNameInput = document.getElementById('import-new-class-name-input');
      const newName = (newNameInput && newNameInput.value.trim()) || activePayload.classInfo?.name || 'Imported Class';
      const created = state.findOrCreateClassByName(
        newName,
        activePayload.classInfo?.details || '',
        activePayload.classInfo?.color || null
      );
      if (!created) {
        alert('Please enter a valid name for the new class.');
        return;
      }
      destClassId = created.id;
    }

    if (!destClassId) {
      alert('Please select a destination class.');
      return;
    }

    const importModeSelect = document.getElementById('import-curriculum-mode-select');
    const importMode = importModeSelect ? importModeSelect.value : 'append';
    const clearDates = document.getElementById('import-opt-clear-dates')?.checked ?? true;

    const lessonsToImport = activePayload.lessons
      .filter(l => selectedUnitsSet.has((l.unit || 'General Curriculum').trim()))
      .map((l, idx) => {
        const cleanCw = Array.isArray(l.classwork)
          ? l.classwork
              .filter(cw => cw && ((cw.work && cw.work.trim()) || (cw.link && cw.link.trim())))
              .map(cw => ({
                type: (cw.type || 'Task').trim(),
                work: (cw.work || '').trim(),
                link: (cw.link || '').trim()
              }))
          : [];

        const cloned = {
          id: `l_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
          title: l.title || 'Untitled Lesson',
          unit: (l.unit || 'General Curriculum').trim(),
          content: l.content || '',
          classwork: cleanCw,
          isFloat: Boolean(l.isFloat),
          isRevision: Boolean(l.isRevision),
          isTestMilestone: Boolean(l.isTestMilestone)
        };

        if (!clearDates) {
          if (l.isTestMilestone) {
            cloned.testSlotKey = l.testSlotKey || null;
            cloned.testDate = l.testDate || null;
            cloned.testPeriodId = l.testPeriodId || null;
          }
          if (l.isPinned) {
            cloned.isPinned = true;
            cloned.pinnedSlotKey = l.pinnedSlotKey || null;
            cloned.pinnedDate = l.pinnedDate || null;
            cloned.pinnedPeriodId = l.pinnedPeriodId || null;
          }
        }
        return cloned;
      });

    if (!Array.isArray(state.data.lessonPlans[destClassId])) {
      state.data.lessonPlans[destClassId] = [];
    }

    if (importMode === 'replace_all') {
      state.data.lessonPlans[destClassId] = lessonsToImport;
    } else if (importMode === 'replace_units') {
      const existing = state.data.lessonPlans[destClassId];
      const importedByUnit = new Map();
      lessonsToImport.forEach(l => {
        const u = (l.unit || 'General Curriculum').trim();
        if (!importedByUnit.has(u)) importedByUnit.set(u, []);
        importedByUnit.get(u).push(l);
      });

      const updatedList = [];
      const replacedUnits = new Set();
      existing.forEach(l => {
        const u = (l.unit || 'General Curriculum').trim();
        if (importedByUnit.has(u)) {
          if (!replacedUnits.has(u)) {
            updatedList.push(...importedByUnit.get(u));
            replacedUnits.add(u);
          }
        } else {
          updatedList.push(l);
        }
      });

      importedByUnit.forEach((uLessons, uName) => {
        if (!replacedUnits.has(uName)) {
          updatedList.push(...uLessons);
        }
      });

      state.data.lessonPlans[destClassId] = updatedList;
    } else {
      state.data.lessonPlans[destClassId].push(...lessonsToImport);
    }

    this.selectedClassId = destClassId;
    state.saveState();
    triggerRefresh(false, true);

    const backdrop = document.getElementById('modal-curriculum-transfer-backdrop');
    if (backdrop) backdrop.classList.remove('active');

    const destClassObj = state.classes.find(c => c.id === destClassId);
    const destName = destClassObj ? destClassObj.name : 'Class';
    showToastNotification(`📥 Imported ${lessonsToImport.length} lessons (${selectedUnitsSet.size} unit${selectedUnitsSet.size !== 1 ? 's' : ''}) into ${destName}!`);
  },

  bindEvents() {
    if (this._eventsBound) return;
    this._eventsBound = true;

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
      } else if (e.target.id === 'export-curriculum-class-select') {
        this.renderExportUnitsChecklist(e.target.value);
      } else if (e.target.name === 'import-curriculum-source-type') {
        this.updateImportSourceVisibility(e.target.value);
      } else if (e.target.id === 'import-source-year-select') {
        this.populateImportYearClasses();
      } else if (e.target.id === 'import-source-year-class-select') {
        this.loadImportPreviewFromSelectedYearClass();
      } else if (e.target.id === 'import-dest-class-select') {
        const wrap = document.getElementById('import-new-class-name-wrap');
        if (wrap) wrap.style.display = (e.target.value === '__NEW_CLASS__') ? 'block' : 'none';
      } else if (e.target.id === 'input-import-curriculum-file') {
        if (e.target.files && e.target.files[0]) {
          this.handleCurriculumFileUpload(e.target.files[0]);
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-open-link-classes')) {
        this.openLinkClassesModal();
        return;
      }
      if (e.target.closest('#btn-sync-lesson-now')) {
        this.syncCurrentModalLesson();
        return;
      }
      if (e.target.closest('#btn-sync-linked-curriculum')) {
        this.openSyncOptionsModal();
        return;
      }
      if (e.target.closest('#btn-execute-sync-options')) {
        this.executeSyncOptions();
        return;
      }
      if (e.target.closest('#btn-toggle-collapse-all-topics')) {
        this.toggleCollapseAllTopics();
        return;
      }
      if (e.target.closest('#btn-export-class-curriculum')) {
        this.openCurriculumTransferModal('export');
        return;
      }
      if (e.target.closest('#btn-import-class-curriculum')) {
        this.openCurriculumTransferModal('import');
        return;
      }
      if (e.target.closest('#tab-curriculum-export')) {
        this.switchCurriculumTransferTab('export');
        return;
      }
      if (e.target.closest('#tab-curriculum-import')) {
        this.switchCurriculumTransferTab('import');
        return;
      }
      if (e.target.closest('#btn-export-select-all-units')) {
        document.querySelectorAll('#export-units-checklist .chk-export-unit').forEach(cb => { cb.checked = true; });
        return;
      }
      if (e.target.closest('#btn-export-deselect-all-units')) {
        document.querySelectorAll('#export-units-checklist .chk-export-unit').forEach(cb => { cb.checked = false; });
        return;
      }
      if (e.target.closest('#btn-import-select-all-units')) {
        document.querySelectorAll('#import-units-checklist .chk-import-unit').forEach(cb => { cb.checked = true; });
        return;
      }
      if (e.target.closest('#btn-import-deselect-all-units')) {
        document.querySelectorAll('#import-units-checklist .chk-import-unit').forEach(cb => { cb.checked = false; });
        return;
      }
      if (e.target.closest('#btn-execute-curriculum-export')) {
        this.executeCurriculumExportFromModal();
        return;
      }
      if (e.target.closest('#btn-execute-curriculum-import')) {
        this.executeCurriculumImportFromModal();
        return;
      }

      const classBtn = e.target.closest('.class-item-btn');
      if (classBtn) {
        this.selectedClassId = classBtn.getAttribute('data-id');
        this.renderClassSelector();
        this.renderLessonList();
        if (typeof window !== 'undefined' && window.MasterScheduleUI) {
          window.MasterScheduleUI.selectedClassIds = [this.selectedClassId];
          window.MasterScheduleUI.renderNavBar();
          window.MasterScheduleUI.renderCalendarGrid();
        }
        return;
      }

      if (e.target.classList.contains('delete-class-btn')) {
        const classId = e.target.getAttribute('data-id');
        const classObj = state.classes.find(c => c.id === classId);
        if (classObj && confirm(`Delete "${classObj.name}" and all associated lesson plans?`)) {
          state.deleteClassById(classId);
          if (this.selectedClassId === classId) {
            this.selectedClassId = state.classes.length > 0 ? state.classes[0].id : null;
          }
          triggerRefresh(false, true);
        }
        return;
      }

      if (e.target.classList.contains('view-lesson-btn')) {
        const id = e.target.getAttribute('data-id');
        const lessons = state.lessonPlans[this.selectedClassId] || [];
        const lesson = lessons.find(l => l.id === id);
        const classObj = state.classes.find(c => c.id === this.selectedClassId);
        if (lesson && classObj) {
          LessonViewer.open(lesson, classObj);
        }
        return;
      }

      if (e.target.classList.contains('edit-lesson-btn')) {
        const id = e.target.getAttribute('data-id');
        this.openEditLessonModal(id);
        return;
      }

      const pinEl = e.target.closest('.tag-pinned');
      if (pinEl) {
        e.preventDefault();
        e.stopPropagation();
        const lessonId = pinEl.getAttribute('data-id');
        const classId = pinEl.getAttribute('data-class') || this.selectedClassId;
        if (classId && lessonId) {
          state.toggleLessonPin(classId, lessonId);
        }
        return;
      }

      const unmergeEl = e.target.closest('.tag-unmerge-inline');
      if (unmergeEl) {
        e.preventDefault();
        e.stopPropagation();
        const lessonId = unmergeEl.getAttribute('data-id');
        const classId = unmergeEl.getAttribute('data-class') || this.selectedClassId;
        if (classId && lessonId) {
          Scheduler.unmergeLessons(classId, lessonId);
          showToastNotification('🔀 Lessons unmerged in schedule.');
          this.renderLessonList();
          triggerRefresh(false, true);
        }
        return;
      }

      const restoreEl = e.target.closest('.tag-restore-inline');
      if (restoreEl) {
        e.preventDefault();
        e.stopPropagation();
        const lessonId = restoreEl.getAttribute('data-id');
        const classId = restoreEl.getAttribute('data-class') || this.selectedClassId;
        if (classId && lessonId) {
          Scheduler.restoreRevisionLesson(classId, lessonId);
          showToastNotification('↩️ Revision lesson restored to schedule.');
          this.renderLessonList();
          triggerRefresh(false, true);
        }
        return;
      }

      if (e.target.classList.contains('toggle-float-btn')) {
        const id = e.target.getAttribute('data-id');
        const lessons = state.lessonPlans[this.selectedClassId] || [];
        const lesson = lessons.find(l => l.id === id);
        if (lesson) {
          lesson.isFloat = !lesson.isFloat;
          if (lesson.isFloat && !lesson.title.includes('Float')) {
            lesson.title = `🎈 Float: ${lesson.title}`;
          }
          state.saveState();
          this.renderLessonList();
          triggerRefresh(false, true);
        }
        return;
      }

      if (e.target.classList.contains('toggle-revision-btn')) {
        const id = e.target.getAttribute('data-id');
        const lessons = state.lessonPlans[this.selectedClassId] || [];
        const lesson = lessons.find(l => l.id === id);
        if (lesson) {
          lesson.isRevision = !lesson.isRevision;
          state.saveState();
          this.renderLessonList();
          triggerRefresh(false, true);
        }
        return;
      }

      if (e.target.classList.contains('delete-lesson-btn')) {
        const id = e.target.getAttribute('data-id');
        state.lessonPlans[this.selectedClassId] = (state.lessonPlans[this.selectedClassId] || []).filter(l => l.id !== id);
        state.saveState();
        this.renderLessonList();
        this.renderClassSelector();
        triggerRefresh(false, true);
        return;
      }

      const removeBtn = e.target.closest('.btn-remove-cw-row');
      if (removeBtn) {
        const row = removeBtn.closest('.classwork-input-row');
        if (row) row.remove();
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
        triggerRefresh(false, true);
      });
    }

    const addCwBtn = document.getElementById('btn-add-classwork-row');
    if (addCwBtn && !addCwBtn._hasClickListener) {
      addCwBtn._hasClickListener = true;
      addCwBtn.addEventListener('click', () => {
        this.addClassworkInputRow();
      });
    }

    const addBtn = document.getElementById('btn-open-lesson-modal');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openAddLessonModal();
      });
    }

    const lessonForm = document.getElementById('form-add-lesson');
    if (lessonForm) {
      lessonForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const classId = this.selectedClassId;
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

        const classwork = this.readClassworkInputsFromModal();

        if (lessonId) {
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
        document.getElementById('modal-lesson-backdrop').classList.remove('active');
        lessonForm.reset();
        triggerRefresh(false, true);
      });
    }

    const copyDetailsBtn = document.getElementById('btn-copy-lesson-details');
    if (copyDetailsBtn) {
      copyDetailsBtn.addEventListener('click', () => {
        LessonViewer.copyToClipboard();
      });
    }
  }
};

export const LessonViewer = {
  currentLessonData: null,

  open(lesson, classObj, slotInfo = null) {
    this.currentLessonData = { lesson, classObj, slotInfo };
    const backdrop = document.getElementById('modal-view-lesson-backdrop');
    const body = document.getElementById('view-lesson-modal-body');
    if (!backdrop || !body) return;

    let tagsHtml = '';
    if (lesson.isPinned) tagsHtml += `<span class="tag tag-pinned" data-class="${escapeHtml(classObj ? classObj.id : '')}" data-id="${escapeHtml(lesson.id)}" style="cursor:pointer;" title="Click to unpin">📌 Pinned: ${TermManager.formatDisplayDate(lesson.pinnedDate)} ✕</span> `;
    if (lesson.isRevision) tagsHtml += `<span class="tag tag-revision">⭐ Revision</span> `;
    if (lesson.isMerged) tagsHtml += `<span class="tag tag-merged">🔀 Merged</span> `;
    if (lesson.isTestMilestone) tagsHtml += `<span class="tag tag-test">🎯 Test: ${escapeHtml(lesson.testDate || 'Set Date')}</span> `;

    let slotMeta = '';
    if (slotInfo) {
      slotMeta = `<div>📅 <strong>Scheduled Slot:</strong> ${escapeHtml(slotInfo.termName ? `${slotInfo.termName} • ` : '')}${TermManager.formatDisplayDate(slotInfo.date)}${slotInfo.periodName ? ` (${escapeHtml(slotInfo.periodName)})` : ''}</div>`;
    }

    let classworkHtml = '';
    const validClasswork = (lesson.classwork && Array.isArray(lesson.classwork))
      ? lesson.classwork.filter(cw => cw && ((cw.work && cw.work.trim()) || (cw.link && cw.link.trim())))
      : [];
    if (validClasswork.length > 0) {
      classworkHtml = `
        <div style="margin-top:0.75rem; padding:0.75rem; background:rgba(59, 130, 246, 0.1); border:1px solid rgba(59, 130, 246, 0.3); border-radius:var(--radius-sm);">
          <strong style="color:#93c5fd; font-size:0.85rem; display:block; margin-bottom:0.4rem;">📚 Classwork Tasks:</strong>
          ${validClasswork.map(cw => `
            <div style="font-size:0.85rem; margin-bottom:0.3rem;">
              <span class="cw-badge cw-badge-default">${escapeHtml(cw.type || 'Task')}</span>
              <strong>${escapeHtml(cw.work || '')}</strong>
              ${cw.link ? `<a href="${escapeHtml(cw.link)}" target="_blank" class="cw-link-icon">🔗 Material Link</a>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    const modalCellStyle = classObj ? getClassCellStyles(classObj.color, state.theme === 'dark') : null;
    const classMetaHtml = classObj ? `
      <div style="color:${modalCellStyle.textColor}; font-weight:700; display:flex; align-items:center; gap:5px;">
        <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${modalCellStyle.dotBg}; border:${modalCellStyle.dotBorder};"></span>
        <span>${escapeHtml(classObj.name)}</span>
      </div>` : '';

    body.innerHTML = `
      <h3 style="font-size:1.2rem; font-weight:800; margin-bottom:0.4rem; color:var(--text-main);">${escapeHtml(lesson.title)}</h3>
      <div class="lesson-view-meta">
        ${classMetaHtml}
        <div>${escapeHtml(lesson.unit || 'General Curriculum')}</div>
        ${slotMeta}
        <div style="margin-top:0.35rem;">${tagsHtml}</div>
      </div>
      ${classworkHtml}
      <div class="lesson-view-content-box" style="margin-top:0.75rem;">
        ${lesson.content ? lesson.content.replace(/\n/g, '<br>') : '<div style="color:var(--text-dim); font-style:italic;">No detailed teaching notes added for this lesson plan. Click "Edit" to add details!</div>'}
      </div>
    `;

    const pinBtn = document.getElementById('btn-viewer-toggle-pin');
    const editBtn = document.getElementById('btn-viewer-edit-lesson');
    let mergedActionsWrap = document.getElementById('viewer-merged-edit-actions');

    if (!mergedActionsWrap && editBtn && editBtn.parentElement) {
      mergedActionsWrap = document.createElement('span');
      mergedActionsWrap.id = 'viewer-merged-edit-actions';
      mergedActionsWrap.style.cssText = 'display:none; gap:0.5rem; flex-wrap:wrap;';
      editBtn.parentElement.appendChild(mergedActionsWrap);
    }

    if (lesson.isMerged && Array.isArray(lesson.mergedLessonIds) && lesson.mergedLessonIds.length >= 2) {
      if (editBtn) editBtn.style.display = 'none';
      if (pinBtn) pinBtn.style.display = 'none';

      if (mergedActionsWrap) {
        const [id1, id2] = lesson.mergedLessonIds;
        const [t1, t2] = Array.isArray(lesson.mergedTitles) ? lesson.mergedTitles : ['Lesson 1', 'Lesson 2'];
        mergedActionsWrap.style.display = 'inline-flex';
        mergedActionsWrap.innerHTML = `
          <button type="button" class="btn btn-secondary btn-sm" id="btn-viewer-edit-merged-1" title="Edit ${escapeHtml(t1)}">✏️ Edit ${escapeHtml(t1)}</button>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-viewer-edit-merged-2" title="Edit ${escapeHtml(t2)}">✏️ Edit ${escapeHtml(t2)}</button>
          ${lesson.isManualMerge ? `<button type="button" class="btn btn-warning btn-sm" id="btn-viewer-unmerge" title="Unmerge into two separate lessons">🔀 Unmerge</button>` : ''}
        `;
        const btn1 = document.getElementById('btn-viewer-edit-merged-1');
        const btn2 = document.getElementById('btn-viewer-edit-merged-2');
        const btnUnmerge = document.getElementById('btn-viewer-unmerge');
        if (btn1) {
          btn1.onclick = () => {
            backdrop.classList.remove('active');
            if (classObj) LessonUI.selectedClassId = classObj.id;
            LessonUI.openEditLessonModal(id1);
          };
        }
        if (btn2) {
          btn2.onclick = () => {
            backdrop.classList.remove('active');
            if (classObj) LessonUI.selectedClassId = classObj.id;
            LessonUI.openEditLessonModal(id2);
          };
        }
        if (btnUnmerge && classObj) {
          btnUnmerge.onclick = () => {
            backdrop.classList.remove('active');
            Scheduler.unmergeLessons(classObj.id, id1);
            showToastNotification('🔀 Lessons unmerged back into separate periods.');
            triggerRefresh(false, true);
          };
        }
      }
    } else {
      if (mergedActionsWrap) {
        mergedActionsWrap.style.display = 'none';
        mergedActionsWrap.innerHTML = '';
      }
      if (pinBtn) {
        pinBtn.style.display = '';
        pinBtn.textContent = lesson.isPinned ? '📌 Unpin Lesson' : '📌 Pin to Slot';
        pinBtn.onclick = () => {
          const targetD = slotInfo ? slotInfo.date : (lesson.pinnedDate || null);
          const targetP = slotInfo ? slotInfo.periodId : (lesson.pinnedPeriodId || null);
          state.toggleLessonPin(classObj.id, lesson.id, targetD, targetP);
          backdrop.classList.remove('active');
        };
      }
      if (editBtn) {
        editBtn.style.display = '';
        editBtn.onclick = () => {
          backdrop.classList.remove('active');
          if (classObj) LessonUI.selectedClassId = classObj.id;
          LessonUI.openEditLessonModal(lesson.id);
        };
      }
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
      text += `Date/Period: ${slotInfo.termName ? `${slotInfo.termName} - ` : ''}${TermManager.formatDisplayDate(slotInfo.date)}${slotInfo.periodName ? ` (${slotInfo.periodName})` : ''}\n`;
    }

    const validClasswork = (lesson.classwork && Array.isArray(lesson.classwork))
      ? lesson.classwork.filter(cw => cw && ((cw.work && cw.work.trim()) || (cw.link && cw.link.trim())))
      : [];
    if (validClasswork.length > 0) {
      text += `\nCLASSWORK TASKS:\n`;
      validClasswork.forEach(cw => {
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

if (typeof window !== 'undefined') {
  window.LessonUI = LessonUI;
  window.LessonViewer = LessonViewer;
}
