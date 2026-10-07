/* ==========================================================================
   Conflict Resolution Modal UI
   ========================================================================== */

import { state } from '../state.js';
import { Scheduler } from '../scheduler.js';

export const ConflictModal = {
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
    // Drop revision click
    document.addEventListener('click', (e) => {
      const dropBtn = e.target.closest('.btn-drop-revision');
      if (dropBtn) {
        const lessonId = dropBtn.getAttribute('data-id');
        Scheduler.dropRevisionLesson(this.currentClassId, lessonId);
        this.renderModalContent();
        window.dispatchEvent(new CustomEvent('planner:stateChanged'));
      }
    });

    // Merge lessons click
    document.addEventListener('click', (e) => {
      const mergeBtn = e.target.closest('.btn-merge-lessons');
      if (mergeBtn) {
        const id1 = mergeBtn.getAttribute('data-id1');
        const id2 = mergeBtn.getAttribute('data-id2');
        Scheduler.mergeLessons(this.currentClassId, id1, id2);
        this.renderModalContent();
        window.dispatchEvent(new CustomEvent('planner:stateChanged'));
      }
    });
  }
};
