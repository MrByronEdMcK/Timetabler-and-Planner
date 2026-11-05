/* ==========================================================================
   Lesson Plan Manager & Curriculum UI
   ========================================================================== */

import { state } from '../state.js';

export const LessonUI = {
  selectedClassId: null,

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

    container.innerHTML = state.classes.map(c => {
      const activeClass = c.id === this.selectedClassId ? 'active' : '';
      const count = (state.lessonPlans[c.id] || []).length;
      const linkedClasses = state.getLinkedClasses(c.id);
      const linkedBadge = linkedClasses.length > 0 ? `<div style="font-size:0.7rem; color:#38bdf8; font-weight:700; margin-top:2px;">🔗 Linked to ${linkedClasses.map(l => l.name).join(', ')}</div>` : '';

      return `
        <button class="class-item-btn ${activeClass}" data-id="${c.id}">
          <div style="display:flex; flex-direction:column; align-items:flex-start;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <div style="width:12px; height:12px; border-radius:50%; background:${c.color};"></div>
              <span>${c.name}</span>
            </div>
            ${linkedBadge}
          </div>
          <div class="class-stats">${count} Lessons</div>
        </button>
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
      <div style="font-weight:700; font-size:0.9rem; color:var(--primary-light); margin-bottom:0.5rem; display:flex; align-items:center; gap:0.5rem;">
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
          <label style="margin:0; cursor:pointer; display:flex; align-items:center; gap:0.4rem; font-size:0.85rem; font-weight:700; color:var(--primary-light);">
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
    const chk = document.getElementById('lesson-sync-linked-check');

    const linked = state.getLinkedClasses(this.selectedClassId);
    if (linked.length > 0) {
      if (group) group.style.display = 'block';
      if (chk) chk.checked = true;
      if (label) {
        const names = linked.map(l => l.name).join(', ');
        label.textContent = `🔄 Sync changes to linked class(es): ${names}`;
      }
    } else {
      if (group) group.style.display = 'none';
      if (chk) chk.checked = false;
    }
  },

  renderLessonList() {
    const container = document.getElementById('lesson-list-container');
    if (!container) return;

    if (!this.selectedClassId) {
      container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-dim);">Select a class to manage lessons.</div>`;
      return;
    }

    const lessons = state.lessonPlans[this.selectedClassId] || [];

    if (lessons.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-dim);">No lesson plans added for this class yet. Click "Add Lesson" below.</div>`;
      return;
    }

    container.innerHTML = lessons.map((lesson, idx) => {
      const isRevision = lesson.isRevision;
      const isMerged = lesson.isMerged;
      const isTest = lesson.isTestMilestone;

      let tagsHtml = '';
      if (isRevision) tagsHtml += `<span class="tag tag-revision">⭐ Revision</span> `;
      if (isMerged) tagsHtml += `<span class="tag tag-merged">🔀 Merged (2-in-1)</span> `;
      if (isTest) tagsHtml += `<span class="tag tag-test">🎯 Test Milestone: ${lesson.testDate || 'Set Date'}</span> `;

      return `
        <div class="lesson-card ${isRevision ? 'is-revision' : ''} ${isMerged ? 'is-merged' : ''}" data-id="${lesson.id}">
          <div class="lesson-main-info">
            <div class="lesson-num">${idx + 1}</div>
            <div class="lesson-details">
              <div class="lesson-title">${lesson.title}</div>
              <div class="lesson-unit">${lesson.unit || 'General Curriculum'} ${tagsHtml}</div>
            </div>
          </div>
          <div class="lesson-actions">
            <button class="btn btn-secondary btn-sm toggle-revision-btn" data-id="${lesson.id}">
              ${isRevision ? 'Remove Revision Tag' : '+ Tag Revision'}
            </button>
            <button class="btn btn-danger btn-sm delete-lesson-btn" data-id="${lesson.id}">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  },

  bindEvents() {
    // Select class button click
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.class-item-btn');
      if (btn) {
        this.selectedClassId = btn.getAttribute('data-id');
        this.renderClassSelector();
        this.renderLessonList();
        window.dispatchEvent(new CustomEvent('planner:classSelected', { detail: { classId: this.selectedClassId } }));
      }
    });

    // Open Link Classes Modal (Event Delegation)
    document.addEventListener('click', (e) => {
      const openLinkBtn = e.target.closest('#btn-open-link-classes');
      if (openLinkBtn) {
        this.openLinkClassesModal();
      }
    });

    // Class Link Checkbox Change Handler
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

    // Sync Linked Curriculum Button (Event Delegation)
    document.addEventListener('click', (e) => {
      const syncBtn = e.target.closest('#btn-sync-linked-curriculum');
      if (syncBtn) {
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

        const linkedNames = linked.map(l => l.name).join(', ');
        if (confirm(`🔄 Sync all curriculum & homework tasks from ${sourceClassName} to ${linkedNames}?\n\n(This updates lesson titles, content & classwork tasks while preserving independent timetable dates).`)) {
          linked.forEach(lClass => {
            state.syncAllLinkedLessons(this.selectedClassId, lClass.id);
          });
          this.renderClassSelector();
          this.renderLessonList();
          alert(`✅ Curriculum & homework tasks successfully synced to ${linkedNames}!`);
        }
      }
    });

    // Toggle Revision Tag
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('toggle-revision-btn')) {
        const id = e.target.getAttribute('data-id');
        const lessons = state.lessonPlans[this.selectedClassId] || [];
        const lesson = lessons.find(l => l.id === id);
        if (lesson) {
          lesson.isRevision = !lesson.isRevision;
          state.saveState();
          this.renderLessonList();
          window.dispatchEvent(new CustomEvent('planner:stateChanged'));
        }
      }
    });

    // Delete Lesson
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-lesson-btn')) {
        const id = e.target.getAttribute('data-id');
        state.lessonPlans[this.selectedClassId] = (state.lessonPlans[this.selectedClassId] || []).filter(l => l.id !== id);
        state.saveState();
        this.renderLessonList();
        this.renderClassSelector();
        window.dispatchEvent(new CustomEvent('planner:stateChanged'));
      }
    });

    // Add Lesson Form Submit / Modal Opener
    const addBtn = document.getElementById('btn-open-lesson-modal');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openAddLessonModal();
      });
    }
  },

  openAddLessonModal() {
    const backdrop = document.getElementById('modal-lesson-backdrop');
    if (!backdrop) return;
    this.updateSyncLinkedCheckboxInModal();
    backdrop.classList.add('active');
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

    const modalCellStyle = classObj && typeof getClassCellStyles === 'function' ? getClassCellStyles(classObj.color, state.theme === 'dark') : { textColor: 'var(--text-main)', dotBg: classObj ? classObj.color : '#3b82f6', dotBorder: 'none' };
    const classMetaHtml = classObj ? `
      <div style="color:${modalCellStyle.textColor}; font-weight:700; display:flex; align-items:center; gap:5px;">
        <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${modalCellStyle.dotBg}; border:${modalCellStyle.dotBorder};"></span>
        <span>${classObj.name}</span>
      </div>` : '';

    body.innerHTML = `
      <h3 style="font-size:1.2rem; font-weight:800; margin-bottom:0.4rem; color:var(--text-main);">${lesson.title}</h3>
      <div class="lesson-view-meta">
        ${classMetaHtml}
        <div>${lesson.unit || 'General Curriculum'}</div>
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

if (typeof window !== 'undefined') {
  window.LessonUI = LessonUI;
  window.LessonViewer = LessonViewer;
}
