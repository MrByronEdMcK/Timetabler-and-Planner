# Timetable and Planner

> **Interactive Annual Curriculum Pacing, Rotating Timetable Engine & Lesson Planner for Teachers**

An intuitive, client-side web application designed for Australian teachers to map out annual curriculums, manage rotating multi-week timetables (e.g., Week A / Week B), automatically resolve scheduling conflicts, generate printable weekly plans, and run classroom whiteboard task presentations.

---

## 🚀 Key Features

1. **Australian Term Calendar & Events**
   - Configurable 4-term school calendar with automatic calculation of instructional days.
   - Resilient against Daylight Saving Time (DST) transitions and Leap Years (Feb 29).
   - Whole-day and period-specific blockouts (carnivals, public holidays, assemblies).

2. **Multi-Week Rotating Timetable**
   - Supports 1 to 4 week timetable cycles with configurable periods and break times.
   - Native start and end times for each period.
   - Color-coded subjects with high-contrast accessibility in both light and dark modes.

3. **Curriculum & Lesson Planning**
   - Multi-unit lesson sequences with linked classes (sync lessons across parallel cohorts).
   - Lesson tagging: content lessons, revision lessons, float lessons, and exam milestones.
   - Pinned lessons locked to specific dates and periods.

4. **Master Pacing & 3-Pass Conflict Resolution**
   - Dynamic schedule projection across the entire school year.
   - Historical lock threshold: past lessons are preserved while future lessons dynamically re-flow around unexpected school closures or timetable disruptions.
   - Automated 3-pass conflict resolver:
     1. Prunes float lessons first.
     2. Prunes revision lessons second.
     3. Merges adjacent content lessons into single slots third.

5. **Weekly Homework & Whiteboard Mode**
   - Weekly homework summary generation formatted for learning management systems (Compass, Google Classroom, SEQTA).
   - High-contrast projector-ready Whiteboard presentation mode with dynamic bubble flow.
   - Multi-page color printable landscape A4 timetable generation.

---

## 🛡️ Persistent Storage Architecture

The application implements a **dual-layer client-side persistent storage engine** designed to protect your lesson plans and timetable data:

1. **LocalStorage (Fast Boot)**:
   - Provides instant, synchronous loading on initial page render with zero layout shift.
2. **IndexedDB Mirroring (High-Capacity Redundancy)**:
   - Every save asynchronously mirrors a complete snapshot to IndexedDB (`aus_teacher_timetabler_db`).
   - If LocalStorage reaches its browser quota (~5MB) or is cleared by the browser, data remains safe and recoverable from IndexedDB.
3. **HTML5 Persistent Storage API (`navigator.storage.persist`)**:
   - The application automatically requests browser persistence permissions.
   - When granted, the browser guarantees that your stored timetable and lessons will not be automatically evicted even under low device disk space.
4. **Visual Save Status & Tools**:
   - Header status indicator shows real-time `Saved` / `Saving...` feedback.
   - Application Settings (⚙️) includes storage quota estimates, persistence verification, and one-click JSON backup export/restore.

---

## 🌐 GitHub Pages Deployment & Release

This repository is pre-configured for static deployment on **GitHub Pages**.

### 1. Repository & URL Naming Advice

- **Recommended Repository Name**: `timetabler-planner` or `timetabler-and-planner`
  - GitHub automatically uses your repository name in your public site URL:
    ```
    https://<your-username>.github.io/<repository-name>/
    ```
  - **Avoid spaces in your GitHub repository name** (e.g. avoid `Timetabler and Planner`). Spaces cause `%20` encoding in URLs (`https://<username>.github.io/Timetabler%20and%20Planner/`). Using hyphens (`timetabler-planner`) gives a clean, readable URL.
- **Internal File Names**:
  - All project files (`index.html`, `css/main.css`, `js/app.js`, etc.) use standard lowercase names with clean relative paths. **No internal file name adjustments are needed.**
  - A `.nojekyll` file is included in the root directory to ensure GitHub Pages serves all static assets directly without Jekyll processing.

### 2. Deployment Instructions

#### Option A: GitHub Actions (Recommended - Automated CI/CD)
A GitHub Actions workflow is provided at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. Initialize git and commit your files:
   ```bash
   git init
   git add .
   git commit -m "Initial release of Timetable and Planner"
   ```
2. Create a new repository on GitHub named `timetabler-planner`.
3. Add the remote and push to `main`:
   ```bash
   git remote add origin https://github.com/<your-username>/timetabler-planner.git
   git branch -M main
   git push -u origin main
   ```
4. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, choose **GitHub Actions**.
   - The workflow will automatically run the 36 automated tests and publish your site!

#### Option B: Deploy Directly from Branch
1. Push your repository to GitHub.
2. Go to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **Deploy from a branch**.
4. Select the `main` branch and `/ (root)` folder, then click **Save**.
5. Your site will be live at `https://<your-username>.github.io/timetabler-planner/` within 1–2 minutes.

---

## 🧪 Automated Testing

The codebase includes test suites verifying calendar generation, leap-year calculations, DST arithmetic, conflict resolution, storage persistence, and CSS styling:

### Run Python Headless Test Suite:
```bash
python test/run_tests.py
```
*(Runs 36 automated unit and integration tests covering engine logic, storage keys, IndexedDB methods, and branding removal.)*

### Run In-Browser Test Runner:
Open [`test/runner.html`](test/runner.html) in any modern browser to run interactive test assertions directly against the ES modules.
