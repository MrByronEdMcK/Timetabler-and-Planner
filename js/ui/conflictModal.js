/* ==========================================================================
   Conflict Resolution Modal UI (Non-Destructive Schedule-Level Omit & Merge)
   ========================================================================== */

import { state, escapeHtml, showToastNotification } from '../state.js';
import { Scheduler } from '../scheduler.js';

function triggerRefresh(force = false, isScheduleEdit = true) {
  if (typeof window !== 'undefined' && typeof window.refreshAllViews === 'function') {
    window.refreshAllViews(force, isScheduleEdit);
  } else if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('planner:stateChanged'));
  }
}

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
    const rawLessons = state.lessonPlans[this.currentClassId] || [];

    // Identify currently active non-destructive adjustments so user can restore/unmerge them
    const omittedLessons = rawLessons.filter(l => l.isOmittedFromSchedule);
    const manualMerges = [];
    for (let i = 0; i < rawLessons.length - 1; i++) {
      if (rawLessons[i].mergeWithNextId && rawLessons[i + 1] && rawLessons[i].mergeWithNextId === rawLessons[i + 1].id) {
        manualMerges.push({ l1: rawLessons[i], l2: rawLessons[i + 1] });
      }
    }

    let activeAdjustmentsHtml = '';
    if (omittedLessons.length > 0 || manualMerges.length > 0) {
      activeAdjustmentsHtml = `
        <div style="margin-top:1.25rem; padding-top:1rem; border-top:1px solid var(--border-color);">
          <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:0.6rem; color:var(--primary);">
            Active Schedule Adjustments (Original Lessons Preserved in Curriculum)
          </h4>
          ${omittedLessons.map(l => `
            <div class="resolution-card" style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>${escapeHtml(l.title)}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">Omitted from schedule projection</div>
              </div>
              <button type="button" class="btn btn-secondary btn-sm btn-restore-revision" data-id="${escapeHtml(l.id)}">
                ↩️ Restore
              </button>
            </div>
          `).join('')}
          ${manualMerges.map(({ l1, l2 }) => `
            <div class="resolution-card" style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>Merged: ${escapeHtml(l1.title)}, ${escapeHtml(l2.title)}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">Paired into 1 period slot (tasks & notes combined)</div>
              </div>
              <button type="button" class="btn btn-secondary btn-sm btn-unmerge-lessons" data-id1="${escapeHtml(l1.id)}">
                🔀 Unmerge
              </button>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (conflicts.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:2rem; color:var(--accent-emerald);">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">🎉</div>
          <h3>No Pacing Conflicts!</h3>
          <p style="color:var(--text-muted); font-size:0.9rem; margin-top:0.5rem;">
            All lesson plans fit into available class slots before deadlines.
          </p>
        </div>
        ${activeAdjustmentsHtml}
      `;
      return;
    }

    const conflict = conflicts[0];
    const activeLessons = rawLessons.filter(l => !l.isOmittedFromSchedule);
    const revisionLessons = activeLessons.filter(l => l.isRevision);

    let html = `
      <div style="margin-bottom:1.25rem;">
        <div style="font-size:0.9rem; color:var(--text-muted);">Deficit Overview:</div>
        <div style="font-size:1.1rem; font-weight:700; color:#fca5a5; margin-top:0.2rem;">
          Missing ${conflict.deficit} Class Slot(s) before "${escapeHtml(conflict.testLesson ? conflict.testLesson.title : 'Milestone')}"
        </div>
      </div>

      <div style="margin-bottom:1.5rem;">
        <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; color:var(--text-main);">
          Option 1: Omit a Tagged Revision Lesson from Schedule
        </h4>
    `;

    if (revisionLessons.length === 0) {
      html += `<div style="font-size:0.85rem; color:var(--text-dim); font-style:italic;">No active revision lessons currently tagged for this class. Tag lessons as "Revision" in the Lesson Manager to use this option.</div>`;
    } else {
      revisionLessons.forEach(l => {
        html += `
          <div class="resolution-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>${escapeHtml(l.title)}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(l.unit || 'Revision')}</div>
              </div>
              <button type="button" class="btn btn-warning btn-sm btn-drop-revision" data-id="${escapeHtml(l.id)}">
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

    const mergeCandidates = [];
    for (let i = 0; i < rawLessons.length - 1; i++) {
      const l1 = rawLessons[i];
      const l2 = rawLessons[i + 1];
      const isAlreadyMerged = (l1.mergeWithNextId === l2.id) || rawLessons.some((prev, pIdx) => pIdx === i - 1 && prev.mergeWithNextId === l1.id);
      if (!l1.isOmittedFromSchedule && !l2.isOmittedFromSchedule && !l1.isTestMilestone && !l2.isTestMilestone && !isAlreadyMerged) {
        mergeCandidates.push({ l1, l2 });
      }
    }

    if (mergeCandidates.length === 0) {
      html += `<div style="font-size:0.85rem; color:var(--text-dim);">No eligible adjacent non-test lesson pairs available to merge.</div>`;
    } else {
      mergeCandidates.forEach(({ l1, l2 }) => {
        html += `
          <div class="resolution-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>Merged: ${escapeHtml(l1.title)}, ${escapeHtml(l2.title)}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">Combines 2 lessons into 1 period slot while keeping them separate in Curriculum</div>
              </div>
              <button type="button" class="btn btn-primary btn-sm btn-merge-lessons" data-id1="${escapeHtml(l1.id)}" data-id2="${escapeHtml(l2.id)}">
                🔀 Merge
              </button>
            </div>
          </div>
        `;
      });
    }

    html += `</div>${activeAdjustmentsHtml}`;
    container.innerHTML = html;
  },

  bindEvents() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    document.addEventListener('click', (e) => {
      const dropBtn = e.target.closest('.btn-drop-revision');
      if (dropBtn) {
        const lessonId = dropBtn.getAttribute('data-id');
        Scheduler.dropRevisionLesson(this.currentClassId, lessonId);
        showToastNotification('✂️ Revision lesson omitted from active schedule (preserved in Curriculum).');
        this.renderModalContent();
        triggerRefresh(false, true);
        return;
      }

      const restoreBtn = e.target.closest('.btn-restore-revision');
      if (restoreBtn) {
        const lessonId = restoreBtn.getAttribute('data-id');
        Scheduler.restoreRevisionLesson(this.currentClassId, lessonId);
        showToastNotification('↩️ Revision lesson restored to schedule.');
        this.renderModalContent();
        triggerRefresh(false, true);
        return;
      }

      const mergeBtn = e.target.closest('.btn-merge-lessons');
      if (mergeBtn) {
        const id1 = mergeBtn.getAttribute('data-id1');
        const id2 = mergeBtn.getAttribute('data-id2');
        Scheduler.mergeLessons(this.currentClassId, id1, id2);
        showToastNotification('🔀 Lessons paired in schedule (original lessons preserved in Curriculum).');
        this.renderModalContent();
        triggerRefresh(false, true);
        return;
      }

      const unmergeBtn = e.target.closest('.btn-unmerge-lessons');
      if (unmergeBtn) {
        const id1 = unmergeBtn.getAttribute('data-id1');
        Scheduler.unmergeLessons(this.currentClassId, id1);
        showToastNotification('🔀 Lessons unmerged back into separate periods.');
        this.renderModalContent();
        triggerRefresh(false, true);
      }
    });
  }
};

if (typeof window !== 'undefined') {
  window.ConflictModal = ConflictModal;
}
