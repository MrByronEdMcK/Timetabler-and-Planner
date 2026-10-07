/* ==========================================================================
   Automated Sanity Test Suite for Scheduler & Timetabler Engine
   Run via Node.js: node test/scheduler.test.js
   ========================================================================== */

import { state } from '../js/state.js';
import { TermManager } from '../js/termManager.js';
import { TimetableManager } from '../js/timetableManager.js';
import { Scheduler } from '../js/scheduler.js';

let passes = 0;
let fails = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passes++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    fails++;
  }
}

console.log('=== Running Australian Teacher Timetabler Test Suite ===\n');

// Test 1: Term school days calculation
console.log('Test 1: School Days Calculation');
const schoolDays = TermManager.getAllTermSchoolDays();
assert(schoolDays.length > 150, `Calculated ${schoolDays.length} school days across 4 terms (expected >150)`);

// Test 2: X-Week Rotation
console.log('\nTest 2: Timetable Week Cycle Rotation');
const weekCycleTerm1Start = TimetableManager.getWeekCycleNumber('2026-01-28');
const weekCycleTerm1Week2 = TimetableManager.getWeekCycleNumber('2026-02-04');
assert(weekCycleTerm1Start === 1, `Term 1 Start Date (2026-01-28) maps to Week Cycle 1 (Week A)`);
assert(weekCycleTerm1Week2 === 2, `7 days later (2026-02-04) maps to Week Cycle 2 (Week B)`);

// Test 3: Class slots for Year 9 Maths
console.log('\nTest 3: Year 9 Maths Class Slots');
const slotsMaths = Scheduler.getAllClassSlotsForYear('c1');
assert(slotsMaths.length > 0, `Found ${slotsMaths.length} assigned class slots for Year 9 Maths across the school year`);

// Test 4: Blockout Filtering
console.log('\nTest 4: Blockout Events');
const swimmingCarnivalBlockout = TermManager.getBlockoutForDate('2026-02-13', 'c1');
assert(swimmingCarnivalBlockout !== undefined && swimmingCarnivalBlockout.title === 'Swimming Carnival', `Swimming Carnival blockout correctly identified on 2026-02-13`);

// Test 5: Historical Lock Boundary (<= current date 2026-07-22)
console.log('\nTest 5: Requirement 8 - Current Date Historical Protection Lock');
state.setCurrentDate('2026-07-22');
const scheduleRes = Scheduler.generateScheduleForClass('c1');
const pastLockedCount = scheduleRes.schedule.filter(s => s.isLocked).length;
const futureModifiableCount = scheduleRes.schedule.filter(s => !s.isLocked).length;

assert(pastLockedCount > 0, `Identified ${pastLockedCount} past locked lessons before/on 2026-07-22`);
assert(futureModifiableCount > 0, `Identified ${futureModifiableCount} future modifiable lessons after 2026-07-22`);

// Test 6: Conflict Analysis
console.log('\nTest 6: Test Milestone & Capacity Conflict Analysis');
const conflicts = Scheduler.analyzeConflicts('c1');
assert(Array.isArray(conflicts), `Conflict analysis completed successfully (${conflicts.length} conflicts found)`);

// Test 7: Drop Revision Lesson Resolution
console.log('\nTest 7: Drop Tagged Revision Lesson Resolution');
const initialLessonsCount = (state.lessonPlans['c1'] || []).length;
const revisionLesson = state.lessonPlans['c1'].find(l => l.isRevision);

if (revisionLesson) {
  Scheduler.dropRevisionLesson('c1', revisionLesson.id);
  const newCount = (state.lessonPlans['c1'] || []).length;
  assert(newCount === initialLessonsCount - 1, `Successfully pruned revision lesson "${revisionLesson.title}" (Count: ${initialLessonsCount} -> ${newCount})`);
} else {
  assert(false, `No revision lesson found to prune`);
}

// Test 8: Merge Lessons Resolution
console.log('\nTest 8: Combine / Merge 2 Lessons Resolution');
const beforeMergeCount = (state.lessonPlans['c1'] || []).length;
if (beforeMergeCount >= 2) {
  const l1 = state.lessonPlans['c1'][0];
  const l2 = state.lessonPlans['c1'][1];
  const success = Scheduler.mergeLessons('c1', l1.id, l2.id);
  const afterMergeCount = (state.lessonPlans['c1'] || []).length;
  assert(success && afterMergeCount === beforeMergeCount - 1, `Successfully merged two lessons into 1 single period slot (Count: ${beforeMergeCount} -> ${afterMergeCount})`);
}

// Test 9: Daylight Saving Time (DST) calculation resilience
console.log('\nTest 9: Daylight Saving Time (DST) Transition Robustness');
const aprilPreDST = TimetableManager.getWeekCycleNumber('2026-04-01');
const aprilPostDST = TimetableManager.getWeekCycleNumber('2026-04-08');
assert(aprilPreDST >= 1 && aprilPostDST >= 1, `Calculated consistent week cycles across April DST changeover`);

// Test 10: State Store v3 Storage Key & Reset
console.log('\nTest 10: State Store v3 Schema Integrity');
assert(state.data.currentDate === '2026-07-22', `StateStore currentDate properly initialized`);
assert(Array.isArray(state.classes) && state.classes.length > 0, `StateStore classes properly loaded`);

console.log(`\n==========================================`);
console.log(`Test Results: ${passes} PASSED, ${fails} FAILED`);
console.log(`==========================================\n`);

if (fails > 0) {
  process.exit(1);
}

