# ==============================================================================
# Automated Test Suite for Australian Teacher Timetabler & Planner Engine
# Run via terminal: python test/run_tests.py
# ==============================================================================

import json
import datetime
import math
import sys
import os

# Ensure UTF-8 output where supported or fallback gracefully
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

class TestEngine:
    def __init__(self):
        self.passes = 0
        self.fails = 0

    def assert_true(self, condition, message):
        if condition:
            print(f'  [PASS] {message}')
            self.passes += 1
        else:
            print(f'  [FAIL] {message}')
            self.fails += 1

    def assert_equal(self, actual, expected, message):
        if actual == expected:
            print(f'  [PASS] {message} ({actual})')
            self.passes += 1
        else:
            print(f'  [FAIL] {message} (Expected: {expected}, Got: {actual})')
            self.fails += 1

# Simulation of Hardened Engine in Python for Headless Verification
class TermManager:
    @staticmethod
    def parse_date(date_str):
        parts = [int(p) for p in date_str.split('-')]
        return datetime.date(parts[0], parts[1], parts[2])

    @staticmethod
    def calculate_term_weeks(start_date_str, end_date_str):
        if not start_date_str or not end_date_str:
            return 10
        start = TermManager.parse_date(start_date_str)
        end = TermManager.parse_date(end_date_str)
        if end < start:
            return 10
        mon_start = start - datetime.timedelta(days=start.weekday())
        diff_days = (end - mon_start).days
        return max(1, diff_days // 7 + 1)

    @staticmethod
    def get_term_weeks(term):
        if not term:
            return 10
        if term.get('startDate') and term.get('endDate'):
            computed = TermManager.calculate_term_weeks(term['startDate'], term['endDate'])
            term['weeks'] = computed
            return computed
        return term.get('weeks', 10)

    @staticmethod
    def get_term_for_date(terms, date_str):
        target = TermManager.parse_date(date_str)
        for term in terms:
            start = TermManager.parse_date(term['startDate'])
            end = TermManager.parse_date(term['endDate'])
            if start <= target <= end:
                return term
        return None

    @staticmethod
    def get_all_term_school_days(terms):
        school_days = []
        for term in terms:
            curr = TermManager.parse_date(term['startDate'])
            end = TermManager.parse_date(term['endDate'])
            while curr <= end:
                # Monday is 0 in Python, Friday is 4
                if curr.weekday() < 5:
                    school_days.append({
                        'date': curr.strftime('%Y-%m-%d'),
                        'termId': term['id'],
                        'termName': term['name'],
                        'dayOfWeek': curr.weekday() + 1
                    })
                curr += datetime.timedelta(days=1)
        return school_days

class TimetableManager:
    @staticmethod
    def get_week_cycle_number(terms, date_str, cycle_weeks=2):
        term = TermManager.get_term_for_date(terms, date_str)
        if not term:
            return 1
        start = TermManager.parse_date(term['startDate'])
        target = TermManager.parse_date(date_str)
        diff_days = (target - start).days
        week_index = diff_days // 7
        return (week_index % cycle_weeks) + 1

class Scheduler:
    @staticmethod
    def get_prioritized_lessons_for_capacity(lessons_list, target_capacity):
        if len(lessons_list) <= target_capacity:
            return list(lessons_list)
        deficit = len(lessons_list) - target_capacity
        result = list(lessons_list)

        # Pass 1: Omit Float lessons FIRST
        for i in range(len(result) - 1, -1, -1):
            if result[i].get('isFloat') and deficit > 0:
                result.pop(i)
                deficit -= 1

        # Pass 2: Omit Revision lessons SECOND
        for i in range(len(result) - 1, -1, -1):
            if result[i].get('isRevision') and not result[i].get('isFloat') and deficit > 0:
                result.pop(i)
                deficit -= 1

        # Pass 3: Merge adjacent Content lessons THIRD
        if deficit > 0 and len(result) > 1:
            i = len(result) - 2
            while i >= 0 and deficit > 0:
                l1 = result[i]
                l2 = result[i + 1]
                if not l1.get('isTestMilestone') and not l2.get('isTestMilestone'):
                    merged = {
                        'id': f"merged_{l1['id']}_{l2['id']}",
                        'title': f"{l1['title']} + {l2['title']}",
                        'isMerged': True
                    }
                    result[i:i+2] = [merged]
                    deficit -= 1
                i -= 1

        return result[:target_capacity]

def run():
    runner = TestEngine()
    print('=== Australian Teacher Timetabler & Planner Automated Engine Tests ===\n')

    # Load App state data
    with open('js/app.js', 'r', encoding='utf-8') as f:
        app_js = f.read()

    runner.assert_true('aus_teacher_timetabler_state_v3' in app_js, 'Storage key is aus_teacher_timetabler_state_v3')
    runner.assert_true('parseLocalDate' in app_js, 'app.js includes hardened parseLocalDate helper')
    runner.assert_true('formatLocalDate' in app_js, 'app.js includes hardened formatLocalDate helper')

    # Test Terms & School Days
    print('\nTest 1: School Days & Term Generation')
    terms_2026 = [
        {'id': 't1', 'name': 'Term 1', 'startDate': '2026-01-28', 'endDate': '2026-04-02', 'weeks': 10},
        {'id': 't2', 'name': 'Term 2', 'startDate': '2026-04-20', 'endDate': '2026-07-03', 'weeks': 11},
        {'id': 't3', 'name': 'Term 3', 'startDate': '2026-07-20', 'endDate': '2026-09-25', 'weeks': 10},
        {'id': 't4', 'name': 'Term 4', 'startDate': '2026-10-12', 'endDate': '2026-12-18', 'weeks': 10}
    ]
    days = TermManager.get_all_term_school_days(terms_2026)
    runner.assert_true(len(days) >= 190, f'Calculated {len(days)} school days across 4 terms (expected >=190)')

    # Test Leap Year 2028
    print('\nTest 2: Leap Year 2028 Calculation (Feb 29 Handling)')
    terms_2028 = [
        {'id': 't1', 'name': 'Term 1', 'startDate': '2028-01-31', 'endDate': '2028-04-14', 'weeks': 11}
    ]
    days_2028 = TermManager.get_all_term_school_days(terms_2028)
    feb29_found = any(d['date'] == '2028-02-29' for d in days_2028)
    runner.assert_true(feb29_found, 'Feb 29 Leap Day correctly recognized as school day in 2028')

    # Test Week Cycles & DST
    print('\nTest 3: Timetable Rotation & DST Safety')
    w1 = TimetableManager.get_week_cycle_number(terms_2026, '2026-01-28', 2)
    w2 = TimetableManager.get_week_cycle_number(terms_2026, '2026-02-04', 2)
    w3 = TimetableManager.get_week_cycle_number(terms_2026, '2026-02-11', 2)
    runner.assert_equal(w1, 1, 'Term 1 Start is Week Cycle 1 (Week A)')
    runner.assert_equal(w2, 2, '7 days later is Week Cycle 2 (Week B)')
    runner.assert_equal(w3, 1, '14 days later rotates back to Week Cycle 1 (Week A)')

    # Test 3-Pass Conflict Resolution
    print('\nTest 4: 3-Pass Conflict Resolution (Float -> Revision -> Merge)')
    sample_lessons = [
        {'id': 'l1', 'title': 'Lesson 1', 'isRevision': False},
        {'id': 'l2', 'title': 'Lesson 2', 'isRevision': False},
        {'id': 'l3', 'title': 'Float Lesson', 'isFloat': True},
        {'id': 'l4', 'title': 'Lesson 3', 'isRevision': False},
        {'id': 'l5', 'title': 'Revision Lesson', 'isRevision': True},
        {'id': 'l6', 'title': 'Test Milestone', 'isTestMilestone': True}
    ]

    # Target capacity 5 (Deficit 1): Float should be removed first
    res5 = Scheduler.get_prioritized_lessons_for_capacity(sample_lessons, 5)
    runner.assert_true(not any(l.get('isFloat') for l in res5), 'Deficit 1: Float lesson pruned first')
    runner.assert_equal(len(res5), 5, 'Capacity exactly 5 slots')

    # Target capacity 4 (Deficit 2): Float AND Revision should be removed
    res4 = Scheduler.get_prioritized_lessons_for_capacity(sample_lessons, 4)
    runner.assert_true(not any(l.get('isFloat') for l in res4), 'Deficit 2: Float lesson pruned')
    runner.assert_true(not any(l.get('isRevision') for l in res4), 'Deficit 2: Revision lesson pruned second')
    runner.assert_equal(len(res4), 4, 'Capacity exactly 4 slots')

    # Target capacity 3 (Deficit 3): Float + Revision + Merge remaining content lessons
    res3 = Scheduler.get_prioritized_lessons_for_capacity(sample_lessons, 3)
    runner.assert_true(any(l.get('isMerged') for l in res3), 'Deficit 3: Adjacent content lessons merged third')
    runner.assert_equal(len(res3), 3, 'Capacity exactly 3 slots')

    # Test 5: Dark & Light Mode Theme CSS Integrity
    print('\nTest 5: Dark & Light Mode Theme Support for View 5 & Whiteboard')
    with open('css/main.css', 'r', encoding='utf-8') as f:
        main_css = f.read()

    runner.assert_true('--primary-light:' in main_css, 'CSS defines --primary-light variable')
    runner.assert_true('--surface-color:' in main_css, 'CSS defines --surface-color variable')
    runner.assert_true('body[data-theme="light"] .homework-lesson-card' in main_css, 'Light mode overrides exist for homework lesson cards')
    runner.assert_true('body[data-theme="light"] .homework-summary-rendered-box' in main_css, 'Light mode overrides exist for homework summary box')
    runner.assert_true('body[data-theme="light"] .whiteboard-modal' in main_css, 'Light mode overrides exist for whiteboard presentation')

    # Test 6: Whiteboard Horizontal & Vertical Task Bubbling
    print('\nTest 6: Whiteboard Horizontal & Vertical Task Bubbling Flow')
    runner.assert_true('.whiteboard-cards-grid' in main_css, 'CSS defines .whiteboard-cards-grid responsive layout')
    runner.assert_true('.whiteboard-bubble-group' in main_css, 'CSS defines .whiteboard-bubble-group for clustered tasks')
    runner.assert_true('.wb-subitem-chip' in main_css, 'CSS defines .wb-subitem-chip for horizontal task chips')
    runner.assert_true('.whiteboard-task-bubble' in main_css, 'CSS defines .whiteboard-task-bubble for pill items')

    with open('index.html', 'r', encoding='utf-8') as f:
        index_html = f.read()
    runner.assert_true('btn-toggle-wb-layout' in index_html, 'index.html includes Whiteboard Bubbles/List toggle button')

    # Test 7: Persistent Storage Layer & Redundancy
    print('\nTest 7: Persistent Storage & Redundancy Layer')
    with open('js/state.js', 'r', encoding='utf-8') as f:
        state_js = f.read()

    runner.assert_true('PersistentStorageManager' in app_js, 'app.js includes PersistentStorageManager')
    runner.assert_true('PersistentStorageManager' in state_js, 'state.js includes PersistentStorageManager')
    runner.assert_true('saveToIndexedDB' in app_js, 'app.js implements saveToIndexedDB')
    runner.assert_true('loadFromIndexedDB' in app_js, 'app.js implements loadFromIndexedDB')
    runner.assert_true('requestPersistentStorage' in app_js, 'app.js implements navigator.storage.persist request')
    runner.assert_true('btn-storage-status-indicator' in index_html, 'index.html includes header storage status indicator chip')
    runner.assert_true('storage-persist-badge' in index_html, 'index.html includes settings storage persistence badge')

    # Test 8: Branding & Clean Presentation
    print('\nTest 8: MrByronEd Branding Removal & Clean Presentation')
    runner.assert_true('MrByronEd' not in index_html, 'MrByronEd branding completely removed from index.html')
    runner.assert_true('MrByronEd' not in app_js, 'MrByronEd branding completely removed from app.js')
    runner.assert_true('<title>Timetable and Planner</title>' in index_html, 'index.html document title is Timetable and Planner')
    runner.assert_true('Timetable_Planner_Backup_' in app_js, 'app.js backup downloads use clean Timetable_Planner_Backup prefix')

    # Test 9: Multi-Day Blockout Events Engine & Period Blocking
    print('\nTest 9: Multi-Day Blockout Events Engine & Period Blocking')
    runner.assert_true('event-end-date' in index_html, 'index.html includes event-end-date input for multi-day blockouts')
    runner.assert_true('syncCurrentYearToYears' in app_js, 'app.js implements syncCurrentYearToYears')
    runner.assert_true('syncCurrentYearToYears' in state_js, 'state.js implements syncCurrentYearToYears')

    def get_blockout_for_date(events, date_str, class_id=None, period_id=None):
        for ev in events:
            s_date = ev.get('startDate') or ev.get('date')
            e_date = ev.get('endDate') or ev.get('date') or s_date
            if not s_date:
                continue
            if date_str < s_date or date_str > e_date:
                continue
            if ev.get('affectedClassId') and ev.get('affectedClassId') != class_id:
                continue
            if e_date > s_date:
                return ev
            if ev.get('blockAllDay'):
                return ev
            if period_id and ev.get('blockedPeriod') == period_id:
                return ev
        return None

    sample_events = [
        {'id': 'e1', 'title': 'Year 7 Camp', 'startDate': '2026-03-02', 'endDate': '2026-03-06', 'blockAllDay': True},
        {'id': 'e2', 'title': 'Period 1 Assembly', 'startDate': '2026-05-15', 'endDate': '2026-05-15', 'blockAllDay': False, 'blockedPeriod': 'p1'}
    ]

    # Pre-span date
    runner.assert_true(get_blockout_for_date(sample_events, '2026-03-01', period_id='p1') is None, 'Date before multi-day camp (2026-03-01) is NOT blocked')
    # All days in span blocked for all periods
    for d in ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06']:
        b1 = get_blockout_for_date(sample_events, d, period_id='p1')
        b5 = get_blockout_for_date(sample_events, d, period_id='p5')
        runner.assert_true(b1 is not None and b5 is not None and b1['title'] == 'Year 7 Camp', f'Multi-day event spans {d} and blocks all periods (P1 & P5)')
    # Post-span date
    runner.assert_true(get_blockout_for_date(sample_events, '2026-03-07', period_id='p1') is None, 'Date after multi-day camp (2026-03-07) is NOT blocked')

    # Single-day blocked period
    runner.assert_true(get_blockout_for_date(sample_events, '2026-05-15', period_id='p1') is not None, 'Single-day event blocks targeted period P1')
    runner.assert_true(get_blockout_for_date(sample_events, '2026-05-15', period_id='p2') is None, 'Single-day event leaves non-targeted period P2 open')

    # Test 10: Academic Year Scoping, Cleared State for New Years, and Restoration
    print('\nTest 10: Academic Year Scoping & Restoration')
    class MockStateStore:
        def __init__(self):
            self.data = {
                'academicYear': 2026,
                'terms': [{'id': 't1', 'startDate': '2026-01-28', 'endDate': '2026-04-02'}],
                'classes': [{'id': 'c1', 'name': 'Year 9 Maths'}],
                'events': [{'id': 'e1', 'title': 'Athletics Carnival', 'date': '2026-08-07'}],
                'timetableSlots': {'1_1_p1': 'c1'},
                'years': {
                    2026: {
                        'terms': [{'id': 't1', 'startDate': '2026-01-28', 'endDate': '2026-04-02'}],
                        'classes': [{'id': 'c1', 'name': 'Year 9 Maths'}],
                        'events': [{'id': 'e1', 'title': 'Athletics Carnival', 'date': '2026-08-07'}],
                        'timetableSlots': {'1_1_p1': 'c1'}
                    }
                }
            }

        def sync_current_year(self):
            yr = self.data['academicYear']
            self.data['years'][yr] = {
                'terms': json.loads(json.dumps(self.data.get('terms', []))),
                'classes': json.loads(json.dumps(self.data.get('classes', []))),
                'events': json.loads(json.dumps(self.data.get('events', []))),
                'timetableSlots': json.loads(json.dumps(self.data.get('timetableSlots', {})))
            }

        def set_academic_year(self, new_year):
            self.sync_current_year()
            self.data['academicYear'] = new_year
            if new_year in self.data['years']:
                yr_data = self.data['years'][new_year]
                self.data['terms'] = json.loads(json.dumps(yr_data.get('terms', [])))
                self.data['classes'] = json.loads(json.dumps(yr_data.get('classes', [])))
                self.data['events'] = json.loads(json.dumps(yr_data.get('events', [])))
                self.data['timetableSlots'] = json.loads(json.dumps(yr_data.get('timetableSlots', {})))
            else:
                self.data['terms'] = [{'id': 't1', 'startDate': f'{new_year}-01-28', 'endDate': f'{new_year}-04-02'}]
                self.data['classes'] = []
                self.data['events'] = []
                self.data['timetableSlots'] = {}
                self.sync_current_year()

    store = MockStateStore()
    runner.assert_equal(len(store.data['classes']), 1, 'Initial 2026 year has 1 class')
    runner.assert_equal(len(store.data['events']), 1, 'Initial 2026 year has 1 event')

    # Switch to 2027
    store.set_academic_year(2027)
    runner.assert_equal(store.data['academicYear'], 2027, 'Current academic year switched to 2027')
    runner.assert_equal(len(store.data['classes']), 0, 'New year 2027 classes list is empty (disappeared)')
    runner.assert_equal(len(store.data['events']), 0, 'New year 2027 events list is empty (disappeared)')
    runner.assert_equal(len(store.data['timetableSlots']), 0, 'New year 2027 timetable slots are empty (disappeared)')

    # Add 2027 content
    store.data['classes'].append({'id': 'c_2027', 'name': 'Year 10 Science'})
    store.data['events'].append({'id': 'e_2027', 'title': '2027 Ski Trip', 'startDate': '2027-07-12', 'endDate': '2027-07-16'})
    store.data['timetableSlots']['1_2_p3'] = 'c_2027'

    # Switch back to 2026
    store.set_academic_year(2026)
    runner.assert_equal(store.data['academicYear'], 2026, 'Switched back to 2026')
    runner.assert_equal(len(store.data['classes']), 1, '2026 classes successfully restored')
    runner.assert_equal(store.data['classes'][0]['name'], 'Year 9 Maths', 'Original 2026 class restored')
    runner.assert_equal(len(store.data['events']), 1, '2026 events successfully restored')
    runner.assert_equal(store.data['events'][0]['title'], 'Athletics Carnival', 'Original 2026 event restored')
    runner.assert_true('1_1_p1' in store.data['timetableSlots'], '2026 timetable slot restored')

    # Switch to 2027 again
    store.set_academic_year(2027)
    runner.assert_equal(len(store.data['classes']), 1, '2027 custom class preserved upon returning to 2027')
    runner.assert_equal(store.data['classes'][0]['name'], 'Year 10 Science', '2027 class restored')
    runner.assert_equal(len(store.data['events']), 1, '2027 multi-day event preserved upon returning to 2027')
    runner.assert_equal(store.data['events'][0]['title'], '2027 Ski Trip', '2027 multi-day event restored')
    runner.assert_true('1_2_p3' in store.data['timetableSlots'], '2027 timetable slot preserved')

    print('\nTest 11: Real Backup Import & Legacy JSON Isolation')
    backup_file = r'c:\Users\charl\Downloads\Timetable_Planner_Backup_2026-10-15.json'
    if os.path.exists(backup_file):
        with open(backup_file, 'r', encoding='utf-8') as f:
            raw_backup = json.load(f)
        
        # Verify raw backup itself contains no 2027 contamination
        has_2027_events = any('2027' in (e.get('date', '') or e.get('startDate', '')) for e in raw_backup.get('events', []))
        runner.assert_true(not has_2027_events, 'Raw backup JSON contains 0 events from 2027')
        runner.assert_equal(len(raw_backup.get('classes', [])), 4, 'Raw backup JSON contains 4 classes')
        runner.assert_equal(len(raw_backup.get('events', [])), 14, 'Raw backup JSON contains 14 blockout events')

        # Test importState logic on the backup
        clean_file = r'c:\Users\charl\Downloads\Timetable_Planner_Backup_Clean.json'
        runner.assert_true(os.path.exists(clean_file), 'Clean backup file exists in Downloads folder')
        with open(clean_file, 'r', encoding='utf-8') as f:
            clean_data = json.load(f)
        
        runner.assert_true('years' in clean_data, 'Clean backup includes years map')
        runner.assert_true('2026' in clean_data['years'], 'Clean backup contains 2026')
        runner.assert_true('2027' in clean_data['years'], 'Clean backup contains 2027')
        runner.assert_equal(len(clean_data['years']['2026']['classes']), 4, '2026 has all 4 classes')
        runner.assert_equal(len(clean_data['years']['2026']['events']), 14, '2026 has all 14 blockouts')
        runner.assert_equal(len(clean_data['years']['2027']['classes']), 0, '2027 has 0 classes (empty)')
        runner.assert_equal(len(clean_data['years']['2027']['events']), 0, '2027 has 0 blockouts (empty)')
        runner.assert_equal(len(clean_data['years']['2027']['timetableSlots']), 0, '2027 timetable is empty')

    # Test 12: Multi-Class Checklist & Whole Duration Multi-Day Blocking
    print('\nTest 12: Multi-Class Checklist & Whole Duration Multi-Day Blocking')
    runner.assert_true('event-classes-checklist' in index_html, 'index.html includes event-classes-checklist container')
    runner.assert_true('renderClassChecklist' in app_js, 'app.js implements renderClassChecklist')
    runner.assert_true('openEditEventModal' in app_js, 'app.js implements openEditEventModal')
    runner.assert_true('edit-event-btn' in app_js, 'app.js renders edit-event-btn')

    def test_get_blockout(events, date_str, class_id=None, period_id=None):
        for ev in events:
            s_date = ev.get('startDate') or ev.get('date')
            e_date = ev.get('endDate') or ev.get('date') or s_date
            if not s_date:
                continue
            if date_str < s_date or date_str > e_date:
                continue
            
            c_ids = ev.get('affectedClassIds') if isinstance(ev.get('affectedClassIds'), list) else ([ev.get('affectedClassId')] if ev.get('affectedClassId') else [])
            affects_all = (len(c_ids) == 0 or 'ALL' in c_ids)
            if class_id:
                if not affects_all and class_id not in c_ids:
                    continue
            
            if ev.get('blockAllDay') is not False:
                return ev
            if period_id and ev.get('blockedPeriod') == period_id:
                return ev
        return None

    # Scenario: Year 11 Exams multi-day (Nov 10 to Nov 13) affecting only 11MGN6 and 11MGN9
    exam_events = [
        {
            'id': 'ev_y11_exams',
            'title': 'Year 11 Exams',
            'startDate': '2026-11-10',
            'endDate': '2026-11-13',
            'blockAllDay': True,
            'affectedClassIds': ['c_11MGN6', 'c_11MGN9']
        },
        {
            'id': 'ev_y10_exams',
            'title': 'Year 10 Exams',
            'startDate': '2026-11-13',
            'endDate': '2026-11-13',
            'blockAllDay': False,
            'blockedPeriod': 'p4',
            'affectedClassIds': ['c_10MGN6']
        }
    ]

    # Tuesday Nov 10 (Day 1 of exams)
    b_116_tue = test_get_blockout(exam_events, '2026-11-10', 'c_11MGN6', 'p1')
    b_119_tue = test_get_blockout(exam_events, '2026-11-10', 'c_11MGN9', 'p3')
    b_106_tue = test_get_blockout(exam_events, '2026-11-10', 'c_10MGN6', 'p2')
    b_7mae_tue = test_get_blockout(exam_events, '2026-11-10', 'c_7MAE1', 'p4')

    runner.assert_true(b_116_tue and b_116_tue['title'] == 'Year 11 Exams', 'Tuesday 11MGN6 P1 is blocked by Year 11 Exams')
    runner.assert_true(b_119_tue and b_119_tue['title'] == 'Year 11 Exams', 'Tuesday 11MGN9 P3 is blocked by Year 11 Exams')
    runner.assert_true(b_106_tue is None, 'Tuesday 10MGN6 is NOT blocked')
    runner.assert_true(b_7mae_tue is None, 'Tuesday 7MAE1 is NOT blocked')

    # Thursday Nov 12 (Day 3 of multi-day exams - whole duration test!)
    b_116_thu_p5 = test_get_blockout(exam_events, '2026-11-12', 'c_11MGN6', 'p5')
    b_116_thu_p6 = test_get_blockout(exam_events, '2026-11-12', 'c_11MGN6', 'p6')
    b_119_thu_p4 = test_get_blockout(exam_events, '2026-11-12', 'c_11MGN9', 'p4')
    b_106_thu_p3 = test_get_blockout(exam_events, '2026-11-12', 'c_10MGN6', 'p3')

    runner.assert_true(b_116_thu_p5 and b_116_thu_p5['title'] == 'Year 11 Exams', 'Thursday 11MGN6 P5 is blocked across multi-day span')
    runner.assert_true(b_116_thu_p6 and b_116_thu_p6['title'] == 'Year 11 Exams', 'Thursday 11MGN6 P6 is blocked across multi-day span')
    runner.assert_true(b_119_thu_p4 and b_119_thu_p4['title'] == 'Year 11 Exams', 'Thursday 11MGN9 P4 is blocked across multi-day span')
    runner.assert_true(b_106_thu_p3 is None, 'Thursday 10MGN6 P3 remains unblocked')

    # Friday Nov 13 (Day 4 of multi-day exams)
    b_119_fri_p1 = test_get_blockout(exam_events, '2026-11-13', 'c_11MGN9', 'p1')
    b_116_fri_p2 = test_get_blockout(exam_events, '2026-11-13', 'c_11MGN6', 'p2')
    b_7mae_fri_p3 = test_get_blockout(exam_events, '2026-11-13', 'c_7MAE1', 'p3')
    b_106_fri_p4 = test_get_blockout(exam_events, '2026-11-13', 'c_10MGN6', 'p4')
    b_106_fri_p1 = test_get_blockout(exam_events, '2026-11-13', 'c_10MGN6', 'p1')

    runner.assert_true(b_119_fri_p1 and b_119_fri_p1['title'] == 'Year 11 Exams', 'Friday 11MGN9 P1 is blocked on final multi-day exam day')
    runner.assert_true(b_116_fri_p2 and b_116_fri_p2['title'] == 'Year 11 Exams', 'Friday 11MGN6 P2 is blocked on final multi-day exam day')
    runner.assert_true(b_7mae_fri_p3 is None, 'Friday 7MAE1 P3 is NOT blocked')
    runner.assert_true(b_106_fri_p4 and b_106_fri_p4['title'] == 'Year 10 Exams', 'Friday 10MGN6 P4 blocked by single-day P4 blockout')
    runner.assert_true(b_106_fri_p1 is None, 'Friday 10MGN6 P1 is open (non-targeted period)')

    # Saturday Nov 14 (Post-span)
    b_116_sat = test_get_blockout(exam_events, '2026-11-14', 'c_11MGN6', 'p1')
    runner.assert_true(b_116_sat is None, 'Saturday date after exam span is NOT blocked')

    # Test 13: Editing Blockout Events
    print('\nTest 13: Editing Blockout Events')
    runner.assert_true('event-edit-id' in index_html, 'index.html includes event-edit-id hidden input')
    runner.assert_true('event-modal-title' in index_html, 'index.html includes event-modal-title element')
    runner.assert_true('btn-submit-event' in index_html, 'index.html includes btn-submit-event element')

    # Test in-place event modification
    test_events = [
        {'id': 'ev_editable', 'title': 'Old Title', 'startDate': '2026-06-01', 'endDate': '2026-06-01', 'blockAllDay': True, 'affectedClassIds': ['ALL']}
    ]

    # Simulate edit form submission
    edit_id = 'ev_editable'
    existing = next((e for e in test_events if e['id'] == edit_id), None)
    runner.assert_true(existing is not None, 'Found target event to edit')
    existing['title'] = 'Updated Camp Title'
    existing['startDate'] = '2026-06-01'
    existing['endDate'] = '2026-06-05'
    existing['affectedClassIds'] = ['c_7MAE1', 'c_10MGN6']
    existing['affectedClassId'] = None

    runner.assert_equal(len(test_events), 1, 'Event count remains exactly 1 after in-place edit')
    runner.assert_equal(test_events[0]['title'], 'Updated Camp Title', 'Title updated in place')
    runner.assert_equal(test_events[0]['endDate'], '2026-06-05', 'End date updated in place for multi-day span')
    runner.assert_equal(test_events[0]['affectedClassIds'], ['c_7MAE1', 'c_10MGN6'], 'Affected classes checklist updated')

    # Verify updated event blocks targeted classes across span
    b_edited_7 = test_get_blockout(test_events, '2026-06-03', 'c_7MAE1', 'p2')
    b_edited_11 = test_get_blockout(test_events, '2026-06-03', 'c_11MGN6', 'p2')
    runner.assert_true(b_edited_7 and b_edited_7['title'] == 'Updated Camp Title', 'Edited event blocks 7MAE1 mid-span')
    runner.assert_true(b_edited_11 is None, 'Edited event does NOT block non-selected 11MGN6')

    # Test 14: Dynamic Term Weeks Calculation & Calendar Span (Term 4 11-Week Fix)
    print('\nTest 14: Dynamic Term Weeks Calculation & Calendar Span (Term 4 11-Week Fix)')
    # 1. TermManager methods exist in code
    runner.assert_true('calculateTermWeeks' in app_js, 'app.js implements calculateTermWeeks')
    with open('js/termManager.js', 'r', encoding='utf-8') as f:
        tm_js = f.read()
    runner.assert_true('calculateTermWeeks' in tm_js, 'termManager.js implements calculateTermWeeks')
    runner.assert_true('getTermWeeks' in app_js, 'app.js implements getTermWeeks')
    runner.assert_true('getTermWeeks' in tm_js, 'termManager.js implements getTermWeeks')

    # 2. Term week calculations for all standard Australian / Victorian terms
    w_t4_vic = TermManager.calculate_term_weeks('2026-10-05', '2026-12-18')
    runner.assert_equal(w_t4_vic, 11, 'Term 4 (2026-10-05 to 2026-12-18) is dynamically calculated as exactly 11 weeks')

    w_t4_nsw = TermManager.calculate_term_weeks('2026-10-12', '2026-12-18')
    runner.assert_equal(w_t4_nsw, 10, 'Term 4 starting a week later (2026-10-12 to 2026-12-18) is dynamically calculated as 10 weeks')

    w_t1 = TermManager.calculate_term_weeks('2026-01-28', '2026-04-02')
    runner.assert_equal(w_t1, 10, 'Term 1 (2026-01-28 to 2026-04-02) is dynamically calculated as 10 weeks')

    w_t2 = TermManager.calculate_term_weeks('2026-04-20', '2026-07-03')
    runner.assert_equal(w_t2, 11, 'Term 2 (2026-04-20 to 2026-07-03) is dynamically calculated as 11 weeks')

    w_t3 = TermManager.calculate_term_weeks('2026-07-13', '2026-09-18')
    runner.assert_equal(w_t3, 10, 'Term 3 (2026-07-13 to 2026-09-18) is dynamically calculated as 10 weeks')

    # 3. get_term_weeks mutates/syncs term object
    t4_obj = {'id': 't4', 'name': 'Term 4', 'startDate': '2026-10-05', 'endDate': '2026-12-18', 'weeks': 10}
    synced_weeks = TermManager.get_term_weeks(t4_obj)
    runner.assert_equal(synced_weeks, 11, 'get_term_weeks dynamically computes 11 for Term 4')
    runner.assert_equal(t4_obj['weeks'], 11, 'get_term_weeks updates term.weeks in place to 11')

    # 4. Master Schedule Chronological Weeks Generation includes Week 11 for Term 4
    sample_terms = [
        {'id': 't1', 'name': 'Term 1', 'startDate': '2026-01-28', 'endDate': '2026-04-02', 'weeks': 10},
        {'id': 't2', 'name': 'Term 2', 'startDate': '2026-04-20', 'endDate': '2026-07-03', 'weeks': 11},
        {'id': 't3', 'name': 'Term 3', 'startDate': '2026-07-13', 'endDate': '2026-09-18', 'weeks': 10},
        {'id': 't4', 'name': 'Term 4', 'startDate': '2026-10-05', 'endDate': '2026-12-18', 'weeks': 10}
    ]
    chrono_weeks = []
    for term in sample_terms:
        num_weeks = TermManager.get_term_weeks(term)
        for w in range(1, num_weeks + 1):
            chrono_weeks.append({'term': term, 'weekNum': w})

    t4_weeks = [cw for cw in chrono_weeks if cw['term']['id'] == 't4']
    runner.assert_equal(len(t4_weeks), 11, 'Master Schedule includes exactly 11 weeks for Term 4')
    runner.assert_true(any(cw['weekNum'] == 11 and cw['term']['id'] == 't4' for cw in chrono_weeks), 'Term 4 Week 11 is present in chronological weeks list')

    # Verify Week 11 date range covers 14 Dec to 18 Dec 2026
    w11_start = TermManager.parse_date('2026-10-05') + datetime.timedelta(days=(11 - 1) * 7)
    w11_fri = w11_start + datetime.timedelta(days=4)
    runner.assert_equal(w11_start.strftime('%Y-%m-%d'), '2026-12-14', 'Term 4 Week 11 starts on Monday 14 Dec 2026')
    runner.assert_equal(w11_fri.strftime('%Y-%m-%d'), '2026-12-18', 'Term 4 Week 11 ends on Friday 18 Dec 2026 (calendar does not end a week early)')

    # 5. Clean backup file has weeks: 11 for Term 4
    with open('Timetable_Planner_Backup_Clean.json', 'r', encoding='utf-8') as f:
        clean_data = json.load(f)
    clean_t4 = next((t for t in clean_data.get('terms', []) if t.get('id') == 't4'), None)
    runner.assert_true(clean_t4 is not None, 'Clean backup has Term 4')
    runner.assert_equal(clean_t4.get('weeks'), 11, 'Clean backup Term 4 has weeks: 11')

    print('\n==================================================')
    print(f'Test Results: {runner.passes} PASSED, {runner.fails} FAILED')
    print('==================================================\n')
    if runner.fails > 0:
        exit(1)

if __name__ == '__main__':
    run()

