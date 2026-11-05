/**
 * Timetable and Planner - Help & Documentation (FAQ) Module
 * Central knowledge base, searchable features guide, and interactive documentation.
 */

(function(window, document) {
  'use strict';

  const HELP_TOPICS = [
    {
      id: 'school-terms',
      cat: 'terms',
      title: 'Australian School Terms Configuration',
      icon: '📅',
      keywords: 'term dates start end calendar 4 terms holiday leap year active duration school days',
      summary: 'Specify start and end dates for the 4 school terms. Lessons are automatically scheduled only during active term dates.',
      details: `
        <p>Configure the official dates for Terms 1 through 4. The timetable rotation engine and lesson scheduler only schedule classes on weekdays falling within active term date windows.</p>
        <ul>
          <li><strong>Holiday Breaks:</strong> Days between terms (autumn, winter, spring, and summer holidays) are automatically excluded.</li>
          <li><strong>Leap Years:</strong> February 29 leap days are safely handled without offset errors.</li>
          <li><strong>Duration Badges:</strong> Each term card automatically displays the calculated total teaching weeks based on your start and end dates.</li>
        </ul>
      `
    },
    {
      id: 'academic-year',
      cat: 'terms',
      title: 'Multi-Year Academic Year Switching',
      icon: '🎓',
      keywords: 'academic school year 2026 2027 switch multi-year isolation years preserve scoping',
      summary: 'Switching years displays that year\'s terms, timetable, classes, and blockout events with full data isolation.',
      details: `
        <p>Use the ◀ and ▶ buttons in View 1 to seamlessly plan ahead for upcoming academic years (e.g. 2026, 2027, 2028).</p>
        <ul>
          <li><strong>Complete Scoping:</strong> Each academic year maintains its own independent set of terms, timetable rotation grid, enrolled classes, curriculum lesson plans, and blockout events.</li>
          <li><strong>No Bleed:</strong> Changes made in 2027 will never alter or overwrite your current 2026 timetable or classes.</li>
        </ul>
      `
    },
    {
      id: 'blockout-events',
      cat: 'terms',
      title: 'Calendar Blockout Events (Carnivals, Assemblies, Holidays)',
      icon: '🚫',
      keywords: 'blockout event holiday sports carnival assembly excursion camp multi-day strike period skip push forward',
      summary: 'Add events that block out whole days or specific periods. The scheduler automatically skips these dates.',
      details: `
        <p>School events often interrupt regular classes. Calendar blockouts instruct the scheduling engine to treat those dates or periods as unavailable.</p>
        <ul>
          <li><strong>All Day vs Specific Periods:</strong> Block out an entire day (e.g. Swimming Carnival, Public Holiday) or target individual periods (e.g. Period 1 Assembly only).</li>
          <li><strong>Multi-Day Events:</strong> Select an End Date to span a multi-day school camp, exam block, or excursion across consecutive days.</li>
          <li><strong>Affected Classes:</strong> Target a blockout to specific classes (e.g. Year 10 Camp only affects Year 10) or all classes schoolwide.</li>
          <li><strong>Automatic Shift:</strong> Lessons scheduled on blocked slots are pushed forward to the next available teaching slot so no curriculum sequence is lost.</li>
        </ul>
      `
    },
    {
      id: 'timetable-rotation',
      cat: 'timetable',
      title: 'Rotating Timetable Builder & Cycles',
      icon: '🔄',
      keywords: 'timetable rotation cycle week a week b 1-week 2-week 3-week 4-week daylight saving dst parity anchor cell inline',
      summary: 'Build and manage 1-Week, 2-Week (Week A/B), 3-Week, or 4-Week rotating timetable cycles.',
      details: `
        <p>Configure your school\'s bell schedule and rotating timetable cycle in View 2.</p>
        <ul>
          <li><strong>Rotation Parity:</strong> Cycle parity is anchored to Term 1 Start Date and alternates continuously across teaching weeks.</li>
          <li><strong>DST Safe:</strong> Daylight Saving Time clock shifts never desynchronize or reverse Week A / Week B parity.</li>
          <li><strong>Inline Cell Assignment:</strong> Click any cell in the grid to assign a class, period, and room inline with instant typeahead search.</li>
        </ul>
      `
    },
    {
      id: 'period-config',
      cat: 'timetable',
      title: 'Periods, Times & Bell Schedule Configuration',
      icon: '⏰',
      keywords: 'periods times bell schedule recess lunch break 12-hour 24-hour duration am pm timer sync',
      summary: 'Configure period labels, start/end times, breaks, and time formats.',
      details: `
        <p>Click "Periods & Times" in View 2 to customize your school\'s daily bell schedule.</p>
        <ul>
          <li><strong>Period Times:</strong> Define exact start and end times for Period 1 through Period 6.</li>
          <li><strong>Breaks & Recess:</strong> Add Recess, Lunch, or Homeroom intervals between periods.</li>
          <li><strong>12h / 24h Toggle:</strong> Choose between standard 12-hour (AM/PM) and 24-hour military time formats.</li>
          <li><strong>Timer Sync:</strong> Whiteboard Mode\'s lesson countdown timer automatically reads these period times.</li>
        </ul>
      `
    },
    {
      id: 'print-timetable',
      cat: 'timetable',
      title: 'Print Clean Landscape A4 Timetable',
      icon: '🖨️',
      keywords: 'print a4 landscape timetable pdf paper hardcopy clean',
      summary: 'Print a clean, professional landscape A4 timetable with room numbers and times.',
      details: `
        <p>Click "Print A4 Timetable" in View 2 to trigger a print-optimized layout that fits cleanly on standard landscape A4 paper, hiding web navigation and editing buttons.</p>
      `
    },
    {
      id: 'ordered-curriculum',
      cat: 'curriculum',
      title: 'Ordered Lesson Sequence & Curriculum Manager',
      icon: '📚',
      keywords: 'curriculum lessons sequence units topics drag drop reorder order hover actions duplicate',
      summary: 'Organize lesson plans into units/topics with drag-and-drop reordering.',
      details: `
        <p>View 3 allows you to map out your full year\'s curriculum for each class, organized into sequential topic groups.</p>
        <ul>
          <li><strong>Drag & Drop:</strong> Drag lesson cards to easily reorder them within or across topics.</li>
          <li><strong>Topic Management:</strong> Collapse or expand topics, duplicate lesson plans, or insert buffer float lessons.</li>
          <li><strong>Hover Controls:</strong> Hovering over any lesson card reveals quick actions to View details, Edit, Pin dates, Duplicate, Tag as Float/Revision, or Delete.</li>
        </ul>
      `
    },
    {
      id: 'float-revision-tags',
      cat: 'curriculum',
      title: '🎈 Float Lessons vs ⭐ Revision Lessons (Auto Conflict Resolution)',
      icon: '🎈',
      keywords: 'float revision buffer conflict resolution capacity deficit prune priority tag',
      summary: 'Tag lessons as Float (pruned FIRST during conflicts) or Revision (pruned SECOND during conflicts).',
      details: `
        <p>When public holidays, carnivals, or short terms cause a "capacity deficit" (more planned lessons than available timetable slots before an assessment), the scheduling engine resolves conflicts automatically using 3-pass priority:</p>
        <ul>
          <li><strong>Pass 1 — 🎈 Float Lessons:</strong> Buffer or free lessons tagged with "Float" are omitted FIRST when slots are tight.</li>
          <li><strong>Pass 2 — ⭐ Revision Lessons:</strong> Revision/practice lessons tagged with "Revision" are omitted SECOND if deficit remains.</li>
          <li><strong>Pass 3 — Adjacent Content Merge:</strong> If a deficit still persists, adjacent content lessons are merged together as a last resort so no curriculum topics are skipped before tests.</li>
        </ul>
      `
    },
    {
      id: 'pinned-lessons',
      cat: 'curriculum',
      title: '📌 Pinned Assessment Lessons',
      icon: '📌',
      keywords: 'pin pinned assessment test exam locked date milestone pacing window',
      summary: 'Lock a test, exam, or assessment lesson to an exact calendar date.',
      details: `
        <p>When creating or editing a lesson (such as a Unit Test), you can pin it to a specific calendar date.</p>
        <ul>
          <li><strong>Anchored Target:</strong> The scheduler maps all prerequisite curriculum lessons into the available slots preceding the pinned test.</li>
          <li><strong>Conflict Notice:</strong> If the required lessons exceed available slots before the pinned date, the Master Pacing calendar alerts you of the deficit so you can tag floats or adjust pacing.</li>
        </ul>
      `
    },
    {
      id: 'class-linking',
      cat: 'curriculum',
      title: 'Class Linking & Cross-Class Curriculum Sync',
      icon: '🔗',
      keywords: 'link parallel classes sync curriculum homework 7MAE1 7MAE2 identical pair',
      summary: 'Link parallel classes taking the same curriculum to automatically sync lessons and homework.',
      details: `
        <p>If you teach multiple parallel classes sharing the same curriculum (e.g. 7MAE1 and 7MAE2):</p>
        <ul>
          <li>Click "Manage Class Links" in View 3 to pair classes together.</li>
          <li>Click "🔄 Sync Linked Curriculum" or "🔄 Sync Week" to copy lesson plans and homework from the active class to its linked partner.</li>
          <li>Each class preserves its own independent timetable slots, days, and period timings.</li>
        </ul>
      `
    },
    {
      id: 'lock-threshold',
      cat: 'pacing',
      title: '🔒 Lock Threshold (Protecting Past Taught Lessons)',
      icon: '🔒',
      keywords: 'lock threshold boundary protect past lessons date taught historical freeze threshold',
      summary: 'Edits and reschedules only modify lessons after this date. Past lessons remain locked.',
      details: `
        <p>The "Lock Threshold" in the top header is a date boundary that protects your teaching history.</p>
        <ul>
          <li><strong>Historical Preservation:</strong> Any lessons taught on or before the Lock Threshold date are frozen in place and will not shift when future blockout events or timetable changes occur.</li>
          <li><strong>Forward Scheduling:</strong> Automatic rescheduling only operates on future slots occurring after the Lock Threshold.</li>
        </ul>
      `
    },
    {
      id: 'master-pacing',
      cat: 'pacing',
      title: 'Master Pacing Calendar & Annual Matrix',
      icon: '🎯',
      keywords: 'master pacing annual calendar matrix year view conflict warning alert timeline',
      summary: 'Annual calendar showing every scheduled lesson and period across the entire school year.',
      details: `
        <p>View 4 provides a comprehensive annual calendar matrix showing every scheduled lesson period across all 4 terms.</p>
        <ul>
          <li><strong>Filter Options:</strong> Switch between All Classes or view an individual class\'s full pacing timeline.</li>
          <li><strong>Conflict Warnings:</strong> Highlights capacity deficits or scheduling issues in a prominent alert banner at the top of the matrix.</li>
        </ul>
      `
    },
    {
      id: 'weekly-homework',
      cat: 'homework',
      title: 'Weekly Homework Tracker & Classroom Summary',
      icon: '📝',
      keywords: 'weekly homework classwork tracker google classroom summary copy category lesson click edit',
      summary: 'Track weekly classwork and generate formatted summaries ready for Google Classroom.',
      details: `
        <p>View 5 tracks assigned classwork, textbook questions, and homework for every lesson in a given week.</p>
        <ul>
          <li><strong>One-Click Edit:</strong> Click anywhere on a homework lesson card to open the lesson plan editor directly.</li>
          <li><strong>Formatted Summary:</strong> Toggle between "Category" and "Lesson" summary format to copy clean, formatted text directly into Google Classroom or student management systems.</li>
        </ul>
      `
    },
    {
      id: 'whiteboard-mode',
      cat: 'homework',
      title: '🖥️ Whiteboard Display Mode (Interactive Projection)',
      icon: '🖥️',
      keywords: 'whiteboard display mode interactive projector fullscreen auto-fit font hide tile timer compact stack',
      summary: 'Full-screen projection display for interactive classroom whiteboards with font auto-fit, tile hiding, and lesson timer.',
      details: `
        <p>Click "Whiteboard Display Mode" in View 5 to launch a clean, student-facing interface designed specifically for classroom projectors and interactive panels.</p>
        <ul>
          <li><strong>Category vs Lesson Mode:</strong> Group classwork by task category (e.g. Textbook, Worksheets) or by sequential lesson period. Catch Up is automatically excluded from Category mode as it is not a homework task.</li>
          <li><strong>Compact Tile Stacking:</strong> Lessons without homework tasks (e.g. Catch Up, Tests) are rendered in half-height compact cards and stacked vertically in pairs (e.g. Lesson 1 over Lesson 2) to save screen space.</li>
          <li><strong>Hide Lesson Tiles (✕):</strong> Click the ✕ button in the top right of any tile to hide it from students. Other tiles retain their exact lesson numbering without re-indexing. An "Unhide All" button restores all hidden tiles.</li>
          <li><strong>Auto-Fit & Font Zoom:</strong> "Auto Fit" automatically scales the typography to fill the whiteboard perfectly, with manual A+ and A- buttons for custom adjustment.</li>
          <li><strong>Whiteboard Themes:</strong> Toggle between crisp Light Mode and high-contrast Dark Mode.</li>
        </ul>
      `
    },
    {
      id: 'lesson-timer',
      cat: 'homework',
      title: '⏱️ Whiteboard Lesson Countdown Timer',
      icon: '⏱️',
      keywords: 'timer countdown lesson time bell whiteboard add timer start end editable',
      summary: 'Classroom countdown timer that synchronizes with the scheduled lesson period.',
      details: `
        <p>Click "Add Timer" in Whiteboard Mode to display an on-screen lesson timer for your students.</p>
        <ul>
          <li><strong>Automatic Period Sync:</strong> If a lesson is currently in session, the timer automatically initializes to start and end at the scheduled period times from your timetable settings.</li>
          <li><strong>Editable End Time:</strong> If outside lesson times, you can set a custom end time to run focused activity countdowns.</li>
        </ul>
      `
    },
    {
      id: 'data-storage',
      cat: 'storage',
      title: 'Dual-Layer Persistence & Backup Management',
      icon: '💾',
      keywords: 'storage persistence indexeddb localstorage backup download json restore reset defaults redundancy',
      summary: 'Dual-layer local persistence (LocalStorage + IndexedDB) with JSON export and restore.',
      details: `
        <p>Your data never leaves your device and requires no internet connection to operate.</p>
        <ul>
          <li><strong>Dual-Layer Redundancy:</strong> Changes are saved simultaneously to LocalStorage and IndexedDB. Persistent storage permission prevents browsers from clearing your timetable during low disk space.</li>
          <li><strong>Download Backup (JSON):</strong> Click ⚙️ Settings → "Download Backup (JSON)" to save a complete backup file (<code>Timetable_Planner_Backup_YYYY-MM-DD.json</code>).</li>
          <li><strong>Restore Backup:</strong> Restore your timetable on any computer by uploading your JSON backup file.</li>
        </ul>
      `
    },
    {
      id: 'keyboard-shortcuts',
      cat: 'all',
      title: '⌨️ Keyboard Shortcuts & Quick Navigation',
      icon: '⌨️',
      keywords: 'keyboard shortcuts hotkeys esc numbers 1 2 3 4 5 help ? quick keys navigation',
      summary: 'Fast keyboard navigation for power users.',
      details: `
        <table style="width:100%; border-collapse:collapse; margin-top:0.5rem; font-size:0.85rem;">
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:0.4rem 0;"><strong>?</strong></td><td>Open Help & Documentation from any view</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:0.4rem 0;"><strong>Esc</strong></td><td>Close active modal or exit Whiteboard mode</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:0.4rem 0;"><strong>1 – 5</strong></td><td>Quickly switch between Views 1 through 5 (when not typing in an input)</td></tr>
        </table>
      `
    }
  ];

  const HelpUI = {
    topics: HELP_TOPICS,
    currentCategory: 'all',
    searchQuery: '',
    expandedIds: new Set(),

    init() {
      this.bindEvents();
      this.renderTopics();
    },

    bindEvents() {
      // Open Help Button
      const openBtn = document.getElementById('btn-open-help-modal');
      if (openBtn) {
        openBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.openHelpModal();
        });
      }

      // Close Help Buttons
      const closeBtn = document.getElementById('btn-close-help-modal');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.closeHelpModal();
        });
      }

      const footerCloseBtn = document.getElementById('btn-help-footer-close');
      if (footerCloseBtn) {
        footerCloseBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.closeHelpModal();
        });
      }

      // Close when clicking modal backdrop
      const backdrop = document.getElementById('modal-help-backdrop');
      if (backdrop) {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) {
            this.closeHelpModal();
          }
        });
      }

      // Search input live filtering
      const searchInput = document.getElementById('help-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value.trim().toLowerCase();
          this.renderTopics();
        });
      }

      // Category filter pills delegation
      const catContainer = document.querySelector('.help-cat-tabs');
      if (catContainer) {
        catContainer.addEventListener('click', (e) => {
          const pill = e.target.closest('.help-cat-pill');
          if (!pill) return;
          const cat = pill.getAttribute('data-cat') || 'all';
          this.setCategory(cat);
        });
      }

      // Topic card expansion toggle
      const topicsList = document.getElementById('help-topics-list');
      if (topicsList) {
        topicsList.addEventListener('click', (e) => {
          const card = e.target.closest('.help-topic-card');
          if (!card) return;
          const topicId = card.getAttribute('data-id');
          if (!topicId) return;

          if (this.expandedIds.has(topicId)) {
            this.expandedIds.delete(topicId);
          } else {
            this.expandedIds.add(topicId);
          }
          this.renderTopics();
        });
      }

      // Global keyboard shortcut: '?' to open help, 'Escape' to close
      document.addEventListener('keydown', (e) => {
        // If typing inside an input, textarea, or contentEditable element, ignore '?'
        const tag = document.activeElement ? document.activeElement.tagName.toUpperCase() : '';
        const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (document.activeElement && document.activeElement.isContentEditable);

        if (e.key === '?' && !isEditing) {
          e.preventDefault();
          this.openHelpModal();
        } else if (e.key === 'Escape') {
          const bd = document.getElementById('modal-help-backdrop');
          if (bd && bd.classList.contains('active')) {
            this.closeHelpModal();
          }
        }
      });
    },

    openHelpModal(query = '') {
      const backdrop = document.getElementById('modal-help-backdrop');
      if (!backdrop) return;

      backdrop.classList.add('active');

      const searchInput = document.getElementById('help-search-input');
      if (searchInput) {
        if (query) {
          searchInput.value = query;
          this.searchQuery = query.toLowerCase();
        }
        setTimeout(() => searchInput.focus(), 100);
      }
      this.renderTopics();
    },

    closeHelpModal() {
      const backdrop = document.getElementById('modal-help-backdrop');
      if (backdrop) {
        backdrop.classList.remove('active');
      }
    },

    setCategory(cat) {
      this.currentCategory = cat;
      const pills = document.querySelectorAll('.help-cat-pill');
      pills.forEach(p => {
        if (p.getAttribute('data-cat') === cat) {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });
      this.renderTopics();
    },

    escapeRegex(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    highlightText(text, query) {
      if (!query) return text;
      const words = query.split(/\s+/).filter(w => w.length > 0);
      if (words.length === 0) return text;

      let result = text;
      words.forEach(w => {
        const regex = new RegExp(`(${this.escapeRegex(w)})`, 'gi');
        result = result.replace(regex, '<mark class="help-highlight">$1</mark>');
      });
      return result;
    },

    renderTopics() {
      const container = document.getElementById('help-topics-list');
      if (!container) return;

      const q = this.searchQuery;
      const cat = this.currentCategory;

      const filtered = this.topics.filter(t => {
        // Category filter
        if (cat !== 'all' && t.cat !== cat && t.cat !== 'all') {
          return false;
        }

        // Search query filter
        if (!q) return true;

        const words = q.split(/\s+/).filter(w => w.length > 0);
        const corpus = (t.title + ' ' + t.keywords + ' ' + t.summary + ' ' + t.details).toLowerCase();
        return words.every(w => corpus.includes(w));
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="help-empty-state">
            <div class="help-empty-icon">🔍</div>
            <div class="help-empty-title">No matching help topics found</div>
            <p style="margin-bottom: 1rem;">No topics matched "<strong>${q}</strong>" in the selected category.</p>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-help-clear-search">Clear Search Filter</button>
          </div>
        `;
        const clearBtn = document.getElementById('btn-help-clear-search');
        if (clearBtn) {
          clearBtn.addEventListener('click', () => {
            const input = document.getElementById('help-search-input');
            if (input) input.value = '';
            this.searchQuery = '';
            this.setCategory('all');
          });
        }
        return;
      }

      const getCatLabel = (c) => {
        switch(c) {
          case 'terms': return 'Terms & Calendar';
          case 'timetable': return 'Timetable Rotation';
          case 'curriculum': return 'Curriculum & Lessons';
          case 'pacing': return 'Master Pacing';
          case 'homework': return 'Weekly Homework';
          case 'storage': return 'Storage & Backup';
          default: return 'General Feature';
        }
      };

      const html = filtered.map(t => {
        // If user is actively searching, expand matching cards automatically
        const isExpanded = q.length > 0 ? true : this.expandedIds.has(t.id);
        const titleHtml = this.highlightText(t.title, q);
        const summaryHtml = this.highlightText(t.summary, q);
        const detailsHtml = this.highlightText(t.details, q);

        return `
          <div class="help-topic-card ${isExpanded ? 'expanded' : ''}" data-id="${t.id}">
            <div class="help-topic-header">
              <div class="help-topic-title-row">
                <span>${t.icon}</span>
                <span>${titleHtml}</span>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="help-topic-cat-badge">${getCatLabel(t.cat)}</span>
                <span class="help-topic-expand-indicator">▼</span>
              </div>
            </div>
            <div class="help-topic-summary">${summaryHtml}</div>
            ${isExpanded ? `<div class="help-topic-details">${detailsHtml}</div>` : ''}
          </div>
        `;
      }).join('');

      container.innerHTML = html;
    }
  };

  // Expose to window
  window.HelpUI = HelpUI;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => HelpUI.init());
  } else {
    HelpUI.init();
  }

})(window, document);
