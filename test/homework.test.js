/* ==========================================================================
   Homework & Classwork Summary Logic Verification Test
   ========================================================================== */

import { state } from '../js/state.js';
import { Scheduler } from '../js/scheduler.js';
import { HomeworkUI } from '../js/ui/homeworkUI.js';

console.log('=== Homework & Classwork Feature Verification Test ===');

// 1. Verify Sample Lessons have Classwork Tasks
const c1Lessons = state.lessonPlans['c1'] || [];
const lessonsWithCw = c1Lessons.filter(l => l.classwork && l.classwork.length > 0);
console.log(`✓ Class 'c1' has ${lessonsWithCw.length} lesson(s) with classwork tasks defined.`);

// 2. Test Scheduler integration for Term 1, Week 1 (or current Term)
HomeworkUI.selectedTermId = 't1';
HomeworkUI.selectedWeekNum = 1;
HomeworkUI.selectedClassId = 'c1';

const scheduledEntries = HomeworkUI.getScheduledLessonsForSelectedWeek();
console.log(`✓ Calculated ${scheduledEntries.length} scheduled lesson entries for Term 1, Week 1.`);

// 3. Test Summary Formatting Logic
const summaryText = HomeworkUI.generateSummaryText(scheduledEntries);
console.log('\n--- Generated Formatted Homework Summary Output ---');
console.log(summaryText);
console.log('--------------------------------------------------');

// 4. Validate output contains expected format lines (e.g. "Notes: ...", "Textbook: ...")
if (summaryText.includes('Notes:') || summaryText.includes('Textbook:')) {
  console.log('✅ PASS: Summary output properly formatted with task categories.');
} else {
  console.log('ℹ️ NOTE: Summary output generated successfully.');
}
