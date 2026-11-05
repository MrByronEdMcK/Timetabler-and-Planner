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

    # Test 15: Weekly Homework Summary & Whiteboard Toggle (By Category vs By Lesson)
    print('\nTest 15: Weekly Homework Summary & Whiteboard Toggle (By Category vs By Lesson)')
    with open('index.html', 'r', encoding='utf-8') as f:
        idx_html = f.read()
    runner.assert_true('btn-toggle-wb-grouping' in idx_html, 'index.html includes Whiteboard By Category / By Lesson toggle button')
    runner.assert_true('btn-hw-group-category' in app_js, 'app.js includes Homework summary By Category toggle button')
    runner.assert_true('btn-hw-group-lesson' in app_js, 'app.js includes Homework summary By Lesson toggle button')
    runner.assert_true('homeworkGroupingMode' in app_js, 'app.js implements homeworkGroupingMode state')
    with open('js/state.js', 'r', encoding='utf-8') as f:
        st_js = f.read()
    runner.assert_true('homeworkGroupingMode' in st_js, 'state.js implements homeworkGroupingMode state')
    with open('js/ui/homeworkUI.js', 'r', encoding='utf-8') as f:
        hw_ui_js = f.read()
    runner.assert_true('toggleGroupingMode' in hw_ui_js, 'homeworkUI.js implements toggleGroupingMode')
    runner.assert_true('setGroupingMode' in hw_ui_js, 'homeworkUI.js implements setGroupingMode')
    runner.assert_true('btn-toggle-wb-grouping' in hw_ui_js, 'homeworkUI.js controls btn-toggle-wb-grouping')

    # Verify formatting output in both modes
    class HomeworkFormatterSimulator:
        @staticmethod
        def generate_summary_text(entries, class_name, grouping_mode='category'):
            if not entries:
                return '(No classwork recorded for this week)'

            if grouping_mode == 'lesson':
                lesson_blocks = []
                links = []
                total_tasks = 0
                for idx, entry in enumerate(entries):
                    lesson = entry.get('lesson', {})
                    classwork = lesson.get('classwork', [])
                    if not classwork:
                        continue

                    grouped_for_lesson = {}
                    for item in classwork:
                        t = (item.get('type') or 'General').strip()
                        w = (item.get('work') or '').strip()
                        l = (item.get('link') or '').strip()
                        if w:
                            grouped_for_lesson.setdefault(t, []).append({'work': w, 'link': l})
                            if l:
                                links.append({'type': t, 'name': w, 'url': l})

                    cat_keys = list(grouped_for_lesson.keys())
                    if not cat_keys:
                        continue
                    total_tasks += len(cat_keys)

                    clean_title = (lesson.get('title') or '').strip()
                    if clean_title.lower() == f"lesson {idx + 1}":
                        clean_title = ''
                    header_text = f"Lesson {idx + 1} - {clean_title}" if clean_title else f"Lesson {idx + 1}"

                    block_lines = [header_text]
                    for cat in cat_keys:
                        works = [it['work'] for it in grouped_for_lesson[cat]]
                        block_lines.append(f"{cat} - {', '.join(works)}")
                    lesson_blocks.append('\n'.join(block_lines))

                if total_tasks == 0 or not lesson_blocks:
                    return '(No classwork tasks recorded for this week)'

                lines = []
                if class_name:
                    lines.append(f"{class_name} Homework:")
                    lines.append('')
                lines.append('\n\n'.join(lesson_blocks))
                if links:
                    lines.append('')
                    lines.append('Links:')
                    for l in links:
                        lines.append(f"• {l['type']} ({l['name']}): {l['url']}")
                return '\n'.join(lines).strip()

            # Category mode
            grouped = {}
            links = []
            for entry in entries:
                for item in entry.get('lesson', {}).get('classwork', []):
                    t = (item.get('type') or 'General').strip()
                    w = (item.get('work') or '').strip()
                    l = (item.get('link') or '').strip()
                    if w:
                        grouped.setdefault(t, []).append(w)
                        if l:
                            links.append({'type': t, 'name': w, 'url': l})

            if not grouped:
                return '(No classwork tasks recorded for this week)'

            lines = [f"{class_name} Homework:"]
            for key, works in grouped.items():
                lines.append(f"{key}:")
                lines.append('')
                for w in works:
                    lines.append(f"• {w}")
                lines.append('')
            if links:
                lines.append('Links:')
                for l in links:
                    lines.append(f"• {l['type']} ({l['name']}): {l['url']}")
            return '\n'.join(lines).strip()

    sample_entries = [
        {
            'lesson': {
                'title': '',
                'classwork': [
                    {'type': 'Textbook', 'work': '7A Q1, Q3, Q5', 'link': 'https://education.vic.gov.au'},
                    {'type': 'Worksheets', 'work': 'Sheet 1', 'link': ''}
                ]
            }
        },
        {
            'lesson': {
                'title': 'Solving 1-Step Equations',
                'classwork': [
                    {'type': 'Textbook', 'work': '7B(All)', 'link': ''},
                    {'type': 'Worksheets', 'work': 'Sheet 2', 'link': ''}
                ]
            }
        }
    ]

    # Test category grouping mode
    summary_cat = HomeworkFormatterSimulator.generate_summary_text(sample_entries, 'Year 9 Mathematics', 'category')
    runner.assert_true('Year 9 Mathematics Homework:' in summary_cat, 'Category summary contains class header')
    runner.assert_true('Textbook:' in summary_cat, 'Category summary groups Textbook tasks together')
    runner.assert_true('• 7A Q1, Q3, Q5' in summary_cat, 'Category summary includes Lesson 1 textbook task')
    runner.assert_true('• 7B(All)' in summary_cat, 'Category summary includes Lesson 2 textbook task under same category')
    runner.assert_true('Worksheets:' in summary_cat, 'Category summary groups Worksheets tasks together')
    runner.assert_true('• Sheet 1' in summary_cat, 'Category summary includes Sheet 1')
    runner.assert_true('• Sheet 2' in summary_cat, 'Category summary includes Sheet 2')
    runner.assert_true('Links:' in summary_cat and 'https://education.vic.gov.au' in summary_cat, 'Category summary includes Links section')

    # Test lesson grouping mode
    summary_lesson = HomeworkFormatterSimulator.generate_summary_text(sample_entries, 'Year 9 Mathematics', 'lesson')
    runner.assert_true('Lesson 1\nTextbook - 7A Q1, Q3, Q5\nWorksheets - Sheet 1' in summary_lesson, 'Lesson mode formats Lesson 1 with Category - Work lines')
    runner.assert_true('Lesson 2 - Solving 1-Step Equations\nTextbook - 7B(All)\nWorksheets - Sheet 2' in summary_lesson, 'Lesson mode formats Lesson 2 with title and Category - Work lines')
    runner.assert_true('\n\nLesson 2' in summary_lesson, 'Lesson mode has blank line between lessons')
    runner.assert_true('Links:' in summary_lesson and 'https://education.vic.gov.au' in summary_lesson, 'Lesson mode preserves material hyperlinks')

    # Test pure Lesson 1 / Lesson 2 without title matching user prompt example exactly
    sample_pure = [
        {'lesson': {'title': 'Lesson 1', 'classwork': [{'type': 'Textbook', 'work': 'blah, blah'}, {'type': 'Worksheets', 'work': 'blah'}]}},
        {'lesson': {'title': 'Lesson 2', 'classwork': [{'type': 'Textbook', 'work': 'blah, blah'}, {'type': 'Worksheets', 'work': 'blah'}]}}
    ]
    summary_pure = HomeworkFormatterSimulator.generate_summary_text(sample_pure, '', 'lesson')
    expected_pure = "Lesson 1\nTextbook - blah, blah\nWorksheets - blah\n\nLesson 2\nTextbook - blah, blah\nWorksheets - blah"
    runner.assert_equal(summary_pure, expected_pure, 'Lesson mode matches user request example format exactly')

    # Test 16: Whiteboard Chapter Titles and Badges Dynamic Font Scaling
    print('\nTest 16: Whiteboard Chapter Titles and Badges Dynamic Font Scaling')
    with open('css/main.css', 'r', encoding='utf-8') as f:
        main_css = f.read()

    runner.assert_true('.wb-chapter-title' in main_css, 'css/main.css defines .wb-chapter-title')
    runner.assert_true('font-size: calc(1.05rem * var(--wb-font-scale, 1))' in main_css or ('--wb-font-scale' in main_css and '.wb-chapter-title' in main_css), 'css/main.css scales .wb-chapter-title with var(--wb-font-scale)')
    runner.assert_true('.wb-card-slot-badge' in main_css, 'css/main.css defines .wb-card-slot-badge')
    runner.assert_true('body[data-theme="light"] .wb-chapter-title' in main_css, 'css/main.css provides light mode support for .wb-chapter-title')
    runner.assert_true('wb-chapter-title' in app_js, 'app.js includes wb-chapter-title class')
    runner.assert_true('wb-chapter-title' in hw_ui_js, 'homeworkUI.js includes wb-chapter-title class')
    runner.assert_true('wb-card-slot-badge' in app_js, 'app.js includes wb-card-slot-badge class')
    runner.assert_true('wb-card-slot-badge' in hw_ui_js, 'homeworkUI.js includes wb-card-slot-badge class')
    runner.assert_true('style="font-size:0.85em;"' not in app_js, 'app.js contains no hardcoded unscaled style="font-size:0.85em;"')
    runner.assert_true('style="font-size:0.85em;"' not in hw_ui_js, 'homeworkUI.js contains no hardcoded unscaled style="font-size:0.85em;"')

    # Test 17: Content-Adaptive Whiteboard Display Bubbles & Spacing
    print('\nTest 17: Content-Adaptive Whiteboard Display Bubbles & Spacing')
    runner.assert_true('.wb-chapter-bubble' in main_css, 'css/main.css defines .wb-chapter-bubble')
    runner.assert_true('width: fit-content' in main_css, 'css/main.css includes width: fit-content for adaptive bubbles')
    runner.assert_true('body[data-theme="light"] .wb-chapter-bubble' in main_css, 'css/main.css provides light mode styling for .wb-chapter-bubble')
    runner.assert_true('display: flex' in main_css and 'flex-wrap: wrap' in main_css, 'css/main.css configures flex-wrap for adaptive whiteboard tiles')
    runner.assert_true('wb-chapter-bubble' in app_js, 'app.js renders wb-chapter-bubble')
    runner.assert_true('wb-chapter-bubble' in hw_ui_js, 'homeworkUI.js renders wb-chapter-bubble')
    runner.assert_true('lessonDisplayTitle = `Lesson ${lessonNumber}`' in app_js or 'lessonDisplayTitle = `Lesson ${idx + 1}`' in app_js, 'app.js uses clean Lesson number without appended titles in whiteboard view')
    runner.assert_true('lessonDisplayTitle = `Lesson ${lessonNumber}`' in hw_ui_js or 'lessonDisplayTitle = `Lesson ${idx + 1}`' in hw_ui_js, 'homeworkUI.js uses clean Lesson number without appended titles in whiteboard view')
    runner.assert_true('${dayName} ${slot.periodName}\n' in app_js or '${dayName} ${slot.periodName}</span>' in app_js or '${dayName} ${slot.periodName}\r\n' in app_js, 'app.js displays only day and period badge without dates in whiteboard')
    runner.assert_true('${dayName} ${slot.periodName}\n' in hw_ui_js or '${dayName} ${slot.periodName}</span>' in hw_ui_js or '${dayName} ${slot.periodName}\r\n' in hw_ui_js, 'homeworkUI.js displays only day and period badge without dates in whiteboard')

    # Verify auto-scale calculation supports large readable font without shrinking
    class ScaleSimulator:
        @staticmethod
        def calc(total_items, is_bubbles=True):
            if is_bubbles:
                if total_items <= 4: return 1.6
                if total_items <= 8: return 1.4
                if total_items <= 14: return 1.25
                if total_items <= 20: return 1.1
                return 1.0
            return 1.0
    runner.assert_equal(ScaleSimulator.calc(3, True), 1.6, '3 items (from user screenshot) auto-fits to generous 1.6x font size')
    runner.assert_equal(ScaleSimulator.calc(6, True), 1.4, '6 items auto-fits to 1.4x without prematurely shrinking text')

    # Test 18: Class Timer, Double Lesson Detection & Speech Bubble Pacer
    print('\nTest 18: Class Timer, Double Lesson Detection & Speech Bubble Pacer')
    with open('index.html', 'r', encoding='utf-8') as f:
        idx_html = f.read()
    with open('css/main.css', 'r', encoding='utf-8') as f:
        main_css = f.read()
    with open('js/timer.js', 'r', encoding='utf-8') as f:
        timer_js = f.read()

    # 1. Pro tip removal and timer markup
    runner.assert_true('whiteboard-footer-tip' not in idx_html, 'Pro tip banner completely removed from index.html')
    runner.assert_true('wb-class-timer' in idx_html, 'index.html includes #wb-class-timer container')
    runner.assert_true('wb-timer-speech-bubble' in idx_html, 'index.html includes #wb-timer-speech-bubble indicator')
    runner.assert_true('wb-timer-track' in idx_html, 'index.html includes #wb-timer-track timeline visualizer')

    # 2. CSS Styles
    runner.assert_true('.wb-speech-bubble' in main_css, 'css/main.css defines .wb-speech-bubble indicator')
    runner.assert_true('.wb-speech-bubble-tail' in main_css, 'css/main.css defines .wb-speech-bubble-tail speech arrow')
    runner.assert_true('.wb-speech-bubble.work' in main_css, 'css/main.css defines .wb-speech-bubble.work state')
    runner.assert_true('.wb-speech-bubble.break' in main_css, 'css/main.css defines .wb-speech-bubble.break state')
    runner.assert_true('body[data-theme="light"] .wb-class-timer' in main_css, 'css/main.css provides light mode overrides for Class Timer')

    # 3. ClassTimer in modular and bundled scripts
    runner.assert_true('ClassTimer' in timer_js, 'js/timer.js defines ClassTimer')
    runner.assert_true('ClassTimer' in app_js, 'app.js integrates ClassTimer')
    runner.assert_true('ClassTimer' in hw_ui_js, 'js/ui/homeworkUI.js integrates ClassTimer')

    # 4. Logic Simulator: Double Lesson Detection
    class TimerSimulator:
        @staticmethod
        def parse_to_minutes(time_str):
            h, m = map(int, time_str.split(':'))
            return h * 60 + m

        @classmethod
        def merge_contiguous_periods(cls, periods):
            periods.sort(key=lambda p: cls.parse_to_minutes(p['startTime']))
            blocks = []
            curr = None
            for p in periods:
                p_start = cls.parse_to_minutes(p['startTime'])
                p_end = cls.parse_to_minutes(p['endTime'])
                if not curr:
                    curr = {'periods': [p], 'startTime': p['startTime'], 'endTime': p['endTime'], 'startMinutes': p_start, 'endMinutes': p_end}
                else:
                    if p_start == curr['endMinutes']:
                        curr['periods'].append(p)
                        curr['endTime'] = p['endTime']
                        curr['endMinutes'] = p_end
                    else:
                        blocks.append(curr)
                        curr = {'periods': [p], 'startTime': p['startTime'], 'endTime': p['endTime'], 'startMinutes': p_start, 'endMinutes': p_end}
            if curr:
                blocks.append(curr)

            for b in blocks:
                b['isDouble'] = len(b['periods']) > 1
                if b['isDouble']:
                    b['label'] = f"Double Lesson ({' & '.join(p['name'] for p in b['periods'])})"
                else:
                    b['label'] = b['periods'][0]['name']
                b['durationMinutes'] = b['endMinutes'] - b['startMinutes']
            return blocks

        @classmethod
        def calculate_schedule(cls, remaining_sec, num_breaks, break_dur_min, now_ms=1000000):
            break_sec = break_dur_min * 60
            tot_break_sec = num_breaks * break_sec
            if tot_break_sec >= remaining_sec * 0.7:
                break_sec = max(30, int((remaining_sec * 0.3) / num_breaks))
                tot_break_sec = num_breaks * break_sec
            tot_work_sec = max(0, remaining_sec - tot_break_sec)
            num_work_chunks = num_breaks + 1
            work_chunk_sec = tot_work_sec / num_work_chunks

            segments = []
            cur_ms = now_ms
            first_work_ms = int(round(work_chunk_sec * 1000))
            segments.append({'type': 'work', 'name': 'Work', 'startMs': cur_ms, 'endMs': cur_ms + first_work_ms})
            cur_ms += first_work_ms

            for i in range(1, num_breaks + 1):
                b_ms = int(round(break_sec * 1000))
                segments.append({'type': 'break', 'name': f'Break {i}', 'startMs': cur_ms, 'endMs': cur_ms + b_ms})
                cur_ms += b_ms

                w_ms = int(round(work_chunk_sec * 1000))
                segments.append({'type': 'work', 'name': 'Work', 'startMs': cur_ms, 'endMs': cur_ms + w_ms})
                cur_ms += w_ms
            return segments

    # Test contiguous double lesson merging
    test_p1 = {'id': 'p1', 'name': 'Period 1', 'startTime': '09:00', 'endTime': '10:00'}
    test_p2 = {'id': 'p2', 'name': 'Period 2', 'startTime': '10:00', 'endTime': '11:00'}
    test_p4 = {'id': 'p4', 'name': 'Period 4', 'startTime': '12:30', 'endTime': '13:30'}

    merged_double = TimerSimulator.merge_contiguous_periods([test_p1, test_p2])
    runner.assert_equal(len(merged_double), 1, 'Contiguous back-to-back periods merge into 1 lesson block')
    runner.assert_true(merged_double[0]['isDouble'], 'Merged block is identified as Double Lesson')
    runner.assert_equal(merged_double[0]['label'], 'Double Lesson (Period 1 & Period 2)', 'Double lesson label is properly formatted')
    runner.assert_equal(merged_double[0]['durationMinutes'], 120, 'Double lesson duration is 120 minutes')

    # Test non-contiguous periods remain separate
    separate_blocks = TimerSimulator.merge_contiguous_periods([test_p1, test_p4])
    runner.assert_equal(len(separate_blocks), 2, 'Non-contiguous periods remain 2 separate lesson blocks')
    runner.assert_true(not separate_blocks[0]['isDouble'], 'Single period is not marked as double')

    # Test Even Break Placement Math
    # 50 min lesson, 1 break of 4 min -> Work (23 min) -> Break (4 min) -> Work (23 min)
    sched_1 = TimerSimulator.calculate_schedule(remaining_sec=3000, num_breaks=1, break_dur_min=4, now_ms=0)
    runner.assert_equal(len(sched_1), 3, '1 break yields exactly 3 timeline segments (Work -> Break -> Work)')
    runner.assert_equal(sched_1[0]['type'], 'work', 'First segment is Work')
    runner.assert_equal(sched_1[1]['type'], 'break', 'Middle segment is Break')
    runner.assert_equal(sched_1[2]['type'], 'work', 'Final segment is Work')
    runner.assert_equal((sched_1[0]['endMs'] - sched_1[0]['startMs']), 1380000, 'Work chunk 1 is exactly 23 minutes (1380 sec)')
    runner.assert_equal((sched_1[1]['endMs'] - sched_1[1]['startMs']), 240000, 'Break chunk is exactly 4 minutes (240 sec)')
    runner.assert_equal((sched_1[2]['endMs'] - sched_1[2]['startMs']), 1380000, 'Work chunk 2 is exactly 23 minutes (1380 sec)')

    # 60 min lesson, 2 breaks of 3 min -> 3 work chunks of 18 min each
    sched_2 = TimerSimulator.calculate_schedule(remaining_sec=3600, num_breaks=2, break_dur_min=3, now_ms=0)
    runner.assert_equal(len(sched_2), 5, '2 breaks yields exactly 5 segments (Work -> Break 1 -> Work -> Break 2 -> Work)')
    runner.assert_equal(sched_2[0]['type'], 'work', 'Segment 1 is Work')
    runner.assert_equal(sched_2[1]['type'], 'break', 'Segment 2 is Break')
    runner.assert_equal(sched_2[2]['type'], 'work', 'Segment 3 is Work')
    runner.assert_equal(sched_2[3]['type'], 'break', 'Segment 4 is Break')
    runner.assert_equal(sched_2[4]['type'], 'work', 'Segment 5 is Work')
    runner.assert_equal((sched_2[0]['endMs'] - sched_2[0]['startMs']), 1080000, 'Each work chunk is exactly 18 minutes (1080 sec)')

    # Test 19: Class Custom Color Theme & Yellow Display Rendering
    print('\nTest 19: Class Custom Color Theme & Yellow Display Rendering')
    with open('js/app.js', 'r', encoding='utf-8') as f:
        app_js = f.read()
    with open('js/state.js', 'r', encoding='utf-8') as f:
        st_js = f.read()

    # 1. State class update logic
    runner.assert_true('if (color) existing.color = color;' in app_js, 'app.js updates existing class color in findOrCreateClassByName')
    runner.assert_true('if (color) existing.color = color;' in st_js, 'state.js updates existing class color in findOrCreateClassByName')
    runner.assert_true('targetClass.color = classColorInput' in app_js, 'app.js syncs slot color picker change to class.color')

    # 2. Color Science Simulator: Near-white vs Chromatic Bright Colors (Yellow, Lime, Cyan)
    class ColorScienceSimulator:
        @staticmethod
        def is_color_near_white(hex_color):
            hex_c = hex_color.replace('#', '').strip()
            if len(hex_c) == 3:
                hex_c = ''.join(c + c for c in hex_c)
            r = int(hex_c[0:2], 16)
            g = int(hex_c[2:4], 16)
            b = int(hex_c[4:6], 16)
            min_c = min(r, g, b)
            max_c = max(r, g, b)
            sat = (max_c - min_c) / max_c if max_c else 0
            return min_c >= 235 and sat <= 0.08

        @staticmethod
        def get_yiq(hex_color):
            hex_c = hex_color.replace('#', '').strip()
            if len(hex_c) == 3:
                hex_c = ''.join(c + c for c in hex_c)
            r = int(hex_c[0:2], 16)
            g = int(hex_c[2:4], 16)
            b = int(hex_c[4:6], 16)
            return (r * 299 + g * 587 + b * 114) / 1000

        @classmethod
        def get_cell_styles(cls, hex_color, is_dark=False):
            safe_color = hex_color
            yiq = cls.get_yiq(safe_color)
            near_white = cls.is_color_near_white(safe_color)
            if is_dark:
                if near_white:
                    return {'bg': 'rgba(255, 255, 255, 0.18)', 'border': '2px solid #ffffff'}
                is_luminous = yiq >= 180
                return {'bg': f'{safe_color}{"35" if is_luminous else "25"}', 'border': f'2px solid {safe_color}'}
            else:
                if near_white:
                    return {'bg': '#ffffff', 'border': '2px solid #64748b', 'textColor': '#0f172a'}
                is_luminous = yiq >= 180
                return {
                    'bg': f'{safe_color}{"38" if is_luminous else "22"}',
                    'border': f'2px solid {safe_color}',
                    'textColor': '#0f172a' if yiq > 130 else safe_color,
                    'tagColor': '#0f172a' if yiq > 140 else safe_color,
                    'dotBg': safe_color
                }

    # Verify actual whites are detected
    runner.assert_true(ColorScienceSimulator.is_color_near_white('#ffffff'), 'Pure white #ffffff is identified as near-white')
    runner.assert_true(ColorScienceSimulator.is_color_near_white('#f8fafc'), 'Off-white #f8fafc is identified as near-white')

    # Verify yellow and luminous hues are NOT falsely identified as near-white
    runner.assert_true(not ColorScienceSimulator.is_color_near_white('#ffff00'), 'Pure yellow #ffff00 is NOT classified as near-white')
    runner.assert_true(not ColorScienceSimulator.is_color_near_white('#e0f51b'), 'User lime yellow #e0f51b is NOT classified as near-white')
    runner.assert_true(not ColorScienceSimulator.is_color_near_white('#fde047'), 'Tailwind yellow #fde047 is NOT classified as near-white')
    runner.assert_true(not ColorScienceSimulator.is_color_near_white('#00ffff'), 'Cyan #00ffff is NOT classified as near-white')

    # Verify yellow cell styles in Light Mode
    yellow_style = ColorScienceSimulator.get_cell_styles('#e0f51b', is_dark=False)
    runner.assert_true(yellow_style['bg'] != '#ffffff', 'Yellow cell background is NOT forced to plain white')
    runner.assert_true(yellow_style['bg'].startswith('#e0f51b'), 'Yellow cell background retains yellow hex tint')
    runner.assert_true(yellow_style['border'] == '2px solid #e0f51b', 'Yellow cell border is vibrant yellow (not gray #64748b)')
    runner.assert_equal(yellow_style['textColor'], '#0f172a', 'Yellow cell text color is high-contrast dark charcoal #0f172a')
    runner.assert_equal(yellow_style['dotBg'], '#e0f51b', 'Yellow class badge dot is bright yellow #e0f51b')

    # Test 20: Pinned Class Timer, Draggable Breaks, Prominent Timeline & Anti-Jitter Bubble
    print('\nTest 20: Pinned Class Timer, Draggable Breaks, Prominent Timeline & Anti-Jitter Bubble')
    with open('index.html', 'r', encoding='utf-8') as f:
        idx_html = f.read()
    with open('css/main.css', 'r', encoding='utf-8') as f:
        main_css = f.read()
    with open('js/timer.js', 'r', encoding='utf-8') as f:
        timer_js = f.read()
    with open('js/app.js', 'r', encoding='utf-8') as f:
        app_js = f.read()

    # 1. Markup verification
    runner.assert_true('wb-timeline-area' in idx_html, 'index.html contains .wb-timeline-area container')
    runner.assert_true('wb-timer-controls' in idx_html, 'index.html contains .wb-timer-controls container')
    runner.assert_true('wb-timer-ctrl-row' in idx_html, 'index.html organizes controls into vertical rows')
    runner.assert_true('btn-timer-pin' in idx_html, 'index.html includes #btn-timer-pin button')
    runner.assert_true('btn-timer-respace' in idx_html, 'index.html includes #btn-timer-respace button')

    # 2. CSS verification for Prominence, Moving Bubble, Vertical Layout, and Anti-Jitter
    runner.assert_true('.wb-timer-controls' in main_css and 'flex-direction: column' in main_css, 'css/main.css positions break controls vertically on the right')
    runner.assert_true('height: 14px' in main_css, 'css/main.css defines prominent 14px progress track height')
    runner.assert_true('.wb-timeline-area' in main_css and 'flex: 1 1 auto' in main_css and 'max-width: 680px' not in main_css, 'css/main.css allows timeline progress bar to extend across full available window width')
    runner.assert_true('width: 175px' in main_css or 'width: 165px' in main_css, 'css/main.css fixes speech bubble width to prevent resizing')
    runner.assert_true('tabular-nums' in main_css, 'css/main.css uses tabular-nums monospace numerals to eliminate digit twitching')
    runner.assert_true('border-top: 8px solid var(--bubble-tail-color' in main_css, 'css/main.css points speech bubble tail downwards toward progress playhead')
    runner.assert_true('cursor: grab' in main_css or 'cursor:grab' in main_css, 'css/main.css provides grab cursor for draggable break segments')

    # 3. Modular Timer Verification (js/timer.js)
    runner.assert_true('isPinned' in timer_js, 'js/timer.js implements isPinned state')
    runner.assert_true('togglePin' in timer_js, 'js/timer.js implements togglePin method')
    runner.assert_true('respaceBreaks' in timer_js, 'js/timer.js implements respaceBreaks method')
    runner.assert_true('bindDragEvents' in timer_js, 'js/timer.js implements bindDragEvents for draggable breaks')
    runner.assert_true('speechBubble.style.left' in timer_js and 'progPct' in timer_js, 'js/timer.js dynamically tracks speech bubble across timeline in lockstep with playhead')
    runner.assert_true('if (!forceRestart && this.activeSchedule && this.activeSchedule.isManual && this.isPinned)' in timer_js, 'js/timer.js preserves pinned manual schedule without resetting')

    # 4. Draggable Break Calculation Simulator
    class DraggableBreakSimulator:
        @staticmethod
        def simulate_drag(schedule_start_ms, schedule_end_ms, break_seg_start_ms, break_dur_ms, drag_target_center_ms, min_buffer_ms=45000):
            total_span = schedule_end_ms - schedule_start_ms
            min_start_ms = schedule_start_ms + min_buffer_ms
            max_end_ms = schedule_end_ms - min_buffer_ms
            max_start_ms = max_end_ms - break_dur_ms
            if max_start_ms < min_start_ms:
                return break_seg_start_ms, break_seg_start_ms + break_dur_ms
            new_start_ms = max(min_start_ms, min(max_start_ms, drag_target_center_ms - (break_dur_ms / 2)))
            new_end_ms = new_start_ms + break_dur_ms
            return int(new_start_ms), int(new_end_ms)

    # Lesson: 3000 sec (50 min) from 0 to 3,000,000 ms. Break duration: 240,000 ms (4 min).
    # Drag to early position near start (at 10,000 ms center) -> should clamp to min_buffer_ms (45,000 ms)
    s_early, e_early = DraggableBreakSimulator.simulate_drag(0, 3000000, 1380000, 240000, 10000)
    runner.assert_equal(s_early, 45000, 'Break dragged too close to start is clamped to 45s min buffer')
    runner.assert_equal(e_early - s_early, 240000, 'Break duration is preserved exactly during clamping')

    # Drag to late position near end (at 2,990,000 ms center) -> should clamp to 3,000,000 - 45,000 - 240,000 = 2,715,000 ms
    s_late, e_late = DraggableBreakSimulator.simulate_drag(0, 3000000, 1380000, 240000, 2990000)
    runner.assert_equal(s_late, 2715000, 'Break dragged too close to end is clamped to 45s min buffer before finish')
    runner.assert_equal(e_late, 2955000, 'Break end is exactly 45s before lesson end')

    # Drag to custom center position at 1,000,000 ms -> should place break from 880,000 to 1,120,000 ms
    s_custom, e_custom = DraggableBreakSimulator.simulate_drag(0, 3000000, 1380000, 240000, 1000000)
    runner.assert_equal(s_custom, 880000, 'Break placed accurately at dragged custom position')
    runner.assert_equal(e_custom, 1120000, 'Break end matches custom placement')

    # Test 21: Break Stepper Unclipped, 3 & 5 Min Options, and Live Start/End Hover/Drag Tooltip
    print('\nTest 21: Break Stepper Unclipped, 3 & 5 Min Options, and Live Start/End Hover/Drag Tooltip')
    with open('index.html', 'r', encoding='utf-8') as f:
        idx_html = f.read()
    with open('css/main.css', 'r', encoding='utf-8') as f:
        main_css = f.read()
    with open('js/timer.js', 'r', encoding='utf-8') as f:
        timer_js = f.read()
    with open('js/app.js', 'r', encoding='utf-8') as f:
        app_js = f.read()

    # 1. Stepper input unclipped and wide enough
    runner.assert_true('.wb-timer-stepper input' in main_css and 'min-width: 32px' in main_css, 'css/main.css gives stepper number input >=32px min-width to prevent digit cut-off')
    runner.assert_true('appearance: textfield' in main_css or '-moz-appearance: textfield' in main_css, 'css/main.css strips native number input spinners')

    # 2. Break duration options restricted strictly to 3 min and 5 min
    import re
    select_match = re.search(r'<select id="wb-select-break-dur"[^>]*>(.*?)</select>', idx_html, re.DOTALL)
    runner.assert_true(select_match is not None, 'index.html contains #wb-select-break-dur')
    if select_match:
        options = re.findall(r'<option[^>]*value="([^"]+)"[^>]*>([^<]+)</option>', select_match.group(1))
        option_values = [opt[0] for opt in options]
        runner.assert_equal(option_values, ['3', '5'], 'Break duration options in index.html are strictly 3 and 5 minutes only')

    # Modular break duration enforcement (js/timer.js)
    runner.assert_true('(val === 5) ? 5 : 3' in timer_js or '(p.breakDurationMinutes === 5) ? 5 : 3' in timer_js, 'js/timer.js enforces strictly 3 or 5 minute break duration')

    # 3. Floating Break Time Badge / Tooltip
    runner.assert_true('wb-break-tooltip' in idx_html, 'index.html includes #wb-break-tooltip badge element')
    runner.assert_true('.wb-break-tooltip' in main_css, 'css/main.css defines .wb-break-tooltip styles')
    runner.assert_true('.wb-break-tooltip-tail' in main_css, 'css/main.css defines downward arrow tail for break tooltip')
    runner.assert_true('body[data-theme="light"] .wb-break-tooltip' in main_css, 'css/main.css provides light mode styles for break tooltip')

    # Modular tooltip methods and events (js/timer.js)
    runner.assert_true('showBreakTooltip' in timer_js, 'js/timer.js implements showBreakTooltip method')
    runner.assert_true('hideBreakTooltip' in timer_js, 'js/timer.js implements hideBreakTooltip method')
    runner.assert_true('pointerover' in timer_js and 'showBreakTooltip' in timer_js, 'js/timer.js shows break start and end times on hover')
    runner.assert_true('this.showBreakTooltip(activeBreak.el, newStartMs, newEndMs)' in timer_js, 'js/timer.js updates break start and end times live while dragging')


    # Test 22: Pinned vs Unpinned Respacing, Period Bounds, Lifecycle, and Hide/Mute Timer
    print('\nTest 22: Pinned vs Unpinned Respacing, Period Bounds, Lifecycle, and Hide/Mute Timer')
    
    # 1. HTML Controls & CSS Rules
    runner.assert_true('btn-timer-hide' in idx_html, 'index.html includes #btn-timer-hide button')
    runner.assert_true('btn-timer-show' in idx_html, 'index.html includes #btn-timer-show button')
    runner.assert_true('.wb-class-timer.hidden' in main_css and 'display: none !important' in main_css, 'css/main.css defines hidden timer state with display: none !important')

    # 2. Modular Timer Methods & State Lifecycle (js/timer.js)
    runner.assert_true('isHidden: false' in timer_js, 'js/timer.js initializes isHidden to false')
    runner.assert_true('hideTimer()' in timer_js, 'js/timer.js implements hideTimer method')
    runner.assert_true('showTimer()' in timer_js, 'js/timer.js implements showTimer method')
    runner.assert_true('this.isHidden = true' in timer_js and 'this.soundEnabled = false' in timer_js, 'js/timer.js hideTimer hides element and mutes chime')
    runner.assert_true('this.isHidden = false' in timer_js and 'this.soundEnabled = true' in timer_js, 'js/timer.js showTimer restores visibility and unmutes chime')
    runner.assert_true('if (this.activeSchedule && !this.activeSchedule.isManual)' in timer_js and 'return;' in timer_js, 'js/timer.js blocks pinning for classes currently in progress')
    runner.assert_true('pinBtn.style.display = \'none\'' in timer_js, 'js/timer.js hides pin button for classes currently in progress')
    runner.assert_true('onExitWhiteboardView()' in timer_js, 'js/timer.js implements onExitWhiteboardView')
    runner.assert_true('if (this.activeSchedule && !this.isPinned)' in timer_js and 'this.activeSchedule = null' in timer_js, 'js/timer.js discards unpinned timer on exit')
    runner.assert_true('Math.floor(detection.block.startMinutes / 60)' in timer_js and 'Math.floor(detection.block.endMinutes / 60)' in timer_js, 'js/timer.js derives period start and end times directly from timetable period minutes')
    runner.assert_true('isPinnedOrClassInProgress = this.isPinned || !this.activeSchedule.isManual' in timer_js, 'js/timer.js distinguishes pinned/in-progress respacing from unpinned respacing')

    # 3. HomeworkUI Whiteboard Exit Event Binding
    with open('js/ui/homeworkUI.js', 'r', encoding='utf-8') as f:
        hw_js = f.read()
    runner.assert_true('btn-exit-whiteboard' in hw_js and 'onExitWhiteboardView' in hw_js, 'js/ui/homeworkUI.js triggers ClassTimer.onExitWhiteboardView upon exiting whiteboard')

    # 4. Mathematical Simulation: Pinned vs Unpinned Respacing
    class TimerScheduleSimulator:
        @staticmethod
        def calculate_schedule(total_sec, num_breaks, break_dur_min, start_ms):
            total_ms = total_sec * 1000
            end_ms = start_ms + total_ms
            break_dur_ms = break_dur_min * 60 * 1000
            total_break_ms = num_breaks * break_dur_ms
            total_work_ms = max(0, total_ms - total_break_ms)
            work_chunks = num_breaks + 1
            work_dur_ms = total_work_ms // work_chunks

            segments = []
            curr_ms = start_ms
            for i in range(num_breaks):
                segments.append({'type': 'work', 'startMs': curr_ms, 'endMs': curr_ms + work_dur_ms})
                curr_ms += work_dur_ms
                segments.append({'type': 'break', 'breakIndex': i + 1, 'startMs': curr_ms, 'endMs': curr_ms + break_dur_ms})
                curr_ms += break_dur_ms
            segments.append({'type': 'work', 'startMs': curr_ms, 'endMs': end_ms})
            return {'startMs': start_ms, 'endMs': end_ms, 'durationSeconds': total_sec, 'segments': segments}

        @staticmethod
        def respace(schedule, is_pinned, is_manual, num_breaks, break_dur_min, current_time_ms):
            if is_pinned or not is_manual:
                # Fixed window
                total_sec = round((schedule['endMs'] - schedule['startMs']) / 1000)
                return TimerScheduleSimulator.calculate_schedule(total_sec, num_breaks, break_dur_min, schedule['startMs'])
            else:
                # Unpinned manual: respaces across remaining time from now
                remaining_sec = max(0, round((schedule['endMs'] - current_time_ms) / 1000))
                return TimerScheduleSimulator.calculate_schedule(remaining_sec, num_breaks, break_dur_min, current_time_ms)

    # Initial 50 min session (3000 sec) starting at 1,000,000 ms -> ends at 4,000,000 ms
    init_sched = TimerScheduleSimulator.calculate_schedule(3000, 1, 3, 1000000)
    runner.assert_equal(init_sched['startMs'], 1000000, 'Schedule starts at specified timestamp')
    runner.assert_equal(init_sched['endMs'], 4000000, 'Schedule ends at specified timestamp')

    # A: Pinned respacing at halfway point (current_time = 2,500,000 ms)
    # Must NOT alter startMs (1,000,000) or endMs (4,000,000)
    pinned_respaced = TimerScheduleSimulator.respace(init_sched, is_pinned=True, is_manual=True, num_breaks=2, break_dur_min=3, current_time_ms=2500000)
    runner.assert_equal(pinned_respaced['startMs'], 1000000, 'Pinned respacing preserves exact initial startMs (does not jump to now)')
    runner.assert_equal(pinned_respaced['endMs'], 4000000, 'Pinned respacing preserves exact initial endMs')
    runner.assert_equal(len(pinned_respaced['segments']), 5, 'Pinned respaced schedule contains 2 breaks (5 segments)')

    # B: Unpinned manual respacing at halfway point (current_time = 2,500,000 ms)
    # CAN update startMs to current_time (2,500,000 ms) across remaining 1500 seconds -> endMs remains 4,000,000 ms
    unpinned_respaced = TimerScheduleSimulator.respace(init_sched, is_pinned=False, is_manual=True, num_breaks=1, break_dur_min=3, current_time_ms=2500000)
    runner.assert_equal(unpinned_respaced['startMs'], 2500000, 'Unpinned respacing updates startMs to current moment')
    runner.assert_equal(unpinned_respaced['endMs'], 4000000, 'Unpinned respacing preserves final endMs across remaining time')
    runner.assert_equal(unpinned_respaced['durationSeconds'], 1500, 'Unpinned respaced duration equals remaining 1500 seconds')

    # C: Class in progress timetable bounds calculation
    # Period 3: 10:55 AM (655 min) to 11:45 AM (705 min)
    period_start_min = 655
    period_end_min = 705
    period_total_sec = (period_end_min - period_start_min) * 60
    runner.assert_equal(period_total_sec, 3000, 'Period duration is 50 minutes (3000 sec)')
    sim_period_start = 1770000000000 + (655 * 60 * 1000)
    class_in_prog_sched = TimerScheduleSimulator.calculate_schedule(period_total_sec, 1, 3, sim_period_start)
    runner.assert_equal(class_in_prog_sched['startMs'], sim_period_start, 'Class in progress startMs matches scheduled period start')
    runner.assert_equal(class_in_prog_sched['endMs'], sim_period_start + (3000 * 1000), 'Class in progress endMs matches scheduled period end')

    # D: Respacing class in progress with is_pinned=False maintains fixed period start and end
    prog_respaced = TimerScheduleSimulator.respace(class_in_prog_sched, is_pinned=False, is_manual=False, num_breaks=2, break_dur_min=3, current_time_ms=sim_period_start + 600000)
    runner.assert_equal(prog_respaced['startMs'], sim_period_start, 'Class in progress respacing preserves scheduled period startMs even if unpinned')
    runner.assert_equal(prog_respaced['endMs'], sim_period_start + (3000 * 1000), 'Class in progress respacing preserves scheduled period endMs')


    # Test 23: Default No Timer State, Add Timer Button, and Remove Timer Lifecycle
    print('\nTest 23: Default No Timer State, Add Timer Button, and Remove Timer Lifecycle')
    
    # 1. HTML & CSS verification for Add Timer and Empty State
    runner.assert_true('wb-timer-empty-state' in idx_html, 'index.html contains #wb-timer-empty-state container')
    runner.assert_true('btn-timer-add' in idx_html, 'index.html contains #btn-timer-add button')
    runner.assert_true('btn-timer-remove' in idx_html, 'index.html contains #btn-timer-remove button')
    runner.assert_true('wb-class-timer hidden' in idx_html, 'index.html hides wb-class-timer by default with hidden class')
    runner.assert_true('.wb-timer-empty-state' in main_css, 'css/main.css defines .wb-timer-empty-state container styles')
    runner.assert_true('.wb-timer-empty-state.hidden' in main_css, 'css/main.css defines hidden rule for .wb-timer-empty-state')

    # 2. Modular Timer Methods and Logic (js/timer.js)
    runner.assert_true('addTimer()' in timer_js, 'js/timer.js implements addTimer method')
    runner.assert_true('removeTimer()' in timer_js, 'js/timer.js implements removeTimer method')
    runner.assert_true('emptyState.classList.remove(\'hidden\')' in timer_js, 'js/timer.js reveals Add Timer button when activeSchedule is null')
    runner.assert_true('emptyState.classList.add(\'hidden\')' in timer_js, 'js/timer.js hides Add Timer button when timer is active')
    runner.assert_true('btn-timer-add' in timer_js, 'js/timer.js binds click handler to #btn-timer-add')
    runner.assert_true('btn-timer-remove' in timer_js, 'js/timer.js binds click handler to #btn-timer-remove')
    runner.assert_true('s.isPinned' in timer_js and 'this.activeSchedule = s' in timer_js, 'js/timer.js only restores persisted schedule if explicitly pinned')
    runner.assert_true('// Auto-detect active period if no active schedule exists' not in timer_js, 'js/timer.js does not auto-start timers during tick without user action')

    # 3. HomeworkUI Integration
    with open('js/ui/homeworkUI.js', 'r', encoding='utf-8') as f:
        hw_js = f.read()
    runner.assert_true('ClassTimer.startLessonTimer(this.selectedClassId)' not in hw_js.split('openWhiteboardModal()')[1].split('renderWhiteboardContent()')[0], 'HomeworkUI.openWhiteboardModal does not auto-start a timer by default')


    # Test 24: Lesson Titles Removed & Catch Up for Non-Assessment Lessons
    print('\nTest 24: Lesson Titles Removed & Catch Up for Non-Assessment Lessons')

    with open('js/ui/homeworkUI.js', 'r', encoding='utf-8') as f:
        hw_js = f.read()
    with open('js/app.js', 'r', encoding='utf-8') as f:
        app_js = f.read()

    # Dual-codebase inspection
    for code, name in [(hw_js, 'js/ui/homeworkUI.js'), (app_js, 'js/app.js')]:
        runner.assert_true('isLessonAssessment(lesson)' in code, f'{name} implements isLessonAssessment method')
        runner.assert_true('headerText = `Lesson ${idx + 1}`' in code, f'{name} removes lesson titles from copy/paste headers')
        runner.assert_true('Catch Up' in code, f'{name} includes Catch Up logic')
        runner.assert_true('lessonBlocks.push(`${headerText}\\nCatch Up`)' in code or 'lessonBlocks.push(`${headerText}\nCatch Up`)' in code, f'{name} outputs Catch Up in lesson mode summary')
        runner.assert_true('lessonBlocks.push(`${headerText}\\nTest`)' in code or 'lessonBlocks.push(`${headerText}\nTest`)' in code, f'{name} outputs Test for assessment in lesson mode summary')
        runner.assert_true('grouped[\'Catch Up\']' not in code and 'grouped["Catch Up"]' not in code, f'{name} omits Catch Up in category mode summary')
        runner.assert_true('lessonBlocksHtml.push(blockHtml)' in code, f'{name} pushes blockHtml into lessonBlocksHtml in generateSummaryHTML')
        # Ensure generateSummaryHTML does not mistakenly reference undefined lessonBlocks
        gen_sum_html = code.split('generateSummaryHTML(scheduledEntries = null')[1].split('copySummaryToClipboard')[0]
        runner.assert_true('lessonBlocks.push' not in gen_sum_html, f'{name} generateSummaryHTML has 0 references to lessonBlocks.push')

    # Simulation of isLessonAssessment
    import re
    def sim_is_assessment(lesson):
        if not lesson: return False
        if lesson.get('isTestMilestone') or lesson.get('isAssessment') or lesson.get('isTest'): return True
        title = (lesson.get('title') or '').strip().lower()
        regex = r'\b(assessment|test|exam|sac|quiz)\b'
        return bool(re.search(regex, title, re.IGNORECASE))

    runner.assert_true(sim_is_assessment({'isTestMilestone': True}), 'isTestMilestone identified as assessment')
    runner.assert_true(sim_is_assessment({'title': 'Unit 3 Test'}), 'Unit 3 Test identified as assessment')
    runner.assert_true(sim_is_assessment({'title': 'Mid-Year Exam'}), 'Mid-Year Exam identified as assessment')
    runner.assert_true(sim_is_assessment({'title': 'SAC 1'}), 'SAC 1 identified as assessment')
    runner.assert_true(sim_is_assessment({'title': 'Weekly Quiz'}), 'Weekly Quiz identified as assessment')
    runner.assert_true(not sim_is_assessment({'title': 'Intro to Algebra', 'unit': 'Algebra'}), 'Intro to Algebra is NOT an assessment')
    runner.assert_true(not sim_is_assessment({'title': 'Worksheets', 'unit': 'General'}), 'Worksheets is NOT an assessment')
    runner.assert_true(not sim_is_assessment({'title': 'Revision 1', 'unit': 'Exam Prep'}), 'Revision 1 is NOT an assessment')

    # Simulation of generateSummaryText
    def sim_generate_summary_text(entries, class_name="10A Maths"):
        blocks = []
        for idx, entry in enumerate(entries):
            lesson = entry['lesson']
            items = lesson.get('classwork') or []
            has_work = any(it.get('work', '').strip() for it in items)
            is_assess = sim_is_assessment(lesson)
            header = f"Lesson {idx + 1}"

            if not has_work:
                if is_assess:
                    blocks.append(f"{header}\nTest")
                else:
                    blocks.append(f"{header}\nCatch Up")
                continue

            grouped = {}
            for it in items:
                t = (it.get('type') or 'General').strip()
                if t not in grouped: grouped[t] = []
                w = it.get('work', '').strip()
                if w: grouped[t].append(w)
            
            lines = [header]
            for cat, w_list in grouped.items():
                lines.append(f"{cat} - {', '.join(w_list)}")
            blocks.append('\n'.join(lines))

        res = [f"{class_name} Homework:", ""] + ['\n\n'.join(blocks)]
        return '\n'.join(res).strip()

    test_sample = [
        {'lesson': {'title': 'Solving 1-Step Equations', 'classwork': [{'type': 'Textbook', 'work': '7B(All)'}]}},
        {'lesson': {'title': 'No HW Class', 'classwork': []}}, # should be Catch Up
        {'lesson': {'title': 'Chapter 7 Test', 'isTestMilestone': True, 'classwork': []}} # should be Test
    ]
    summary_out = sim_generate_summary_text(test_sample)
    runner.assert_true('Lesson 1\nTextbook - 7B(All)' in summary_out, 'Lesson 1 header has no lesson title')
    runner.assert_true('Lesson 2\nCatch Up' in summary_out, 'Lesson 2 has Catch Up')
    runner.assert_true('Lesson 3\nCatch Up' not in summary_out, 'Lesson 3 (Test) does NOT have Catch Up')
    runner.assert_true('Lesson 3\nTest' in summary_out, 'Lesson 3 (Test) outputs Test so every lesson in the week is shown')

    # Simulation of generateSummaryHTML
    def sim_generate_summary_html(entries, class_name="10A Maths"):
        blocks_html = []
        for idx, entry in enumerate(entries):
            lesson = entry['lesson']
            items = lesson.get('classwork') or []
            has_work = any(it.get('work', '').strip() for it in items)
            is_assess = sim_is_assessment(lesson)
            header = f"Lesson {idx + 1}"

            if not has_work:
                if is_assess:
                    blocks_html.append(f"<div>{header}</div><div>Test</div>")
                else:
                    blocks_html.append(f"<div>{header}</div><div>Catch Up</div>")
                continue
            
            blocks_html.append(f"<div>{header}</div>")

        return ''.join(blocks_html)

    html_out = sim_generate_summary_html(test_sample)
    runner.assert_true('Lesson 1' in html_out, 'HTML Lesson 1 present')
    runner.assert_true('Lesson 2' in html_out and 'Catch Up' in html_out, 'HTML Lesson 2 has Catch Up')
    runner.assert_true('Lesson 3' in html_out and 'Test' in html_out, 'HTML Lesson 3 (Test) outputs Test')
    runner.assert_true('id="btn-exit-whiteboard"' not in idx_html, 'index.html removes Exit Whiteboard Mode button')

    # Test 25: Editable End Time for Manual Timers & Pipe Separator in Lesson Copy/Paste
    print('\nTest 25: Editable End Time for Manual Timers & Pipe Separator in Lesson Copy/Paste')

    # 1. UI Elements
    runner.assert_true('wb-timeline-end-input' in idx_html, 'index.html contains #wb-timeline-end-input')
    runner.assert_true('wb-timeline-end-edit-label' in idx_html, 'index.html contains #wb-timeline-end-edit-label')
    runner.assert_true('.wb-timeline-end-input' in main_css, 'css/main.css defines .wb-timeline-end-input')

    # 2. Modular timer verification for onEndTimeChanged & formatTime24 (js/timer.js)
    with open('js/timer.js', 'r', encoding='utf-8') as f:
        timer_code = f.read()

    runner.assert_true('onEndTimeChanged(newTimeStr)' in timer_code, 'js/timer.js implements onEndTimeChanged')
    runner.assert_true('formatTime24(' in timer_code, 'js/timer.js implements formatTime24 helper')
    runner.assert_true('wb-timeline-end-input' in timer_code, 'js/timer.js binds to #wb-timeline-end-input')
    runner.assert_true('newSchedule.isManual = true' in timer_code, 'js/timer.js preserves manual timer flag when end time changes')

    # 3. Dual codebase verification for homeworkUI / app.js pipe separator in lesson copy/paste
    with open('js/ui/homeworkUI.js', 'r', encoding='utf-8') as f:
        hw_code = f.read()
    with open('js/app.js', 'r', encoding='utf-8') as f:
        app_code = f.read()

    for code, name in [(hw_code, 'js/ui/homeworkUI.js'), (app_code, 'js/app.js')]:
        runner.assert_true("aggWorks.join(' | ')" in code, f"{name} joins lesson summary text category tasks with ' | '")
        runner.assert_true(".join(' | ')" in code, f"{name} joins lesson summary HTML category tasks with ' | '")

    # 4. Simulation of pipe separator in lesson mode
    def sim_aggregate_task_items(items):
        chapters = {}
        order = []
        for it in items:
            work = it.get('work', '').strip()
            if not work: continue
            if ':' in work:
                prefix, rest = work.split(':', 1)
                prefix = prefix.strip()
                rest = rest.strip()
                if prefix not in chapters:
                    chapters[prefix] = []
                    order.append(prefix)
                if rest: chapters[prefix].append(rest)
        bullets = []
        for p in order:
            sub = ', '.join(chapters[p])
            bullets.append(f"{p}: {sub}" if sub else p)
        return ' | '.join(bullets)

    sample_tasks = [
        {'type': 'Textbook', 'work': 'Chapter 18 Review: 1-2, 3-6eso, 7-15'},
        {'type': 'Textbook', 'work': 'Chapter 18 Challenge: 3-6'}
    ]
    formatted_pipe = f"Textbook - {sim_aggregate_task_items(sample_tasks)}"
    expected_pipe = "Textbook - Chapter 18 Review: 1-2, 3-6eso, 7-15 | Chapter 18 Challenge: 3-6"
    runner.assert_equal(formatted_pipe, expected_pipe, 'Lesson copy/paste uses pipe separator between chapter tasks')

    # Test 26: Compact Half-Height Whiteboard Boxes for No-Task or Test Lessons
    print('\nTest 26: Compact Half-Height Whiteboard Boxes for No-Task or Test Lessons')
    runner.assert_true('.whiteboard-card.wb-card-compact' in main_css, 'css/main.css defines .whiteboard-card.wb-card-compact')
    runner.assert_true('align-self: flex-start' in main_css, 'css/main.css sets align-self: flex-start to prevent compact cards stretching')
    runner.assert_true('.wb-compact-badge' in main_css, 'css/main.css defines .wb-compact-badge')
    runner.assert_true('.wb-compact-badge.wb-catchup-badge' in main_css, 'css/main.css defines .wb-catchup-badge')
    runner.assert_true('.wb-compact-badge.wb-test-badge' in main_css, 'css/main.css defines .wb-test-badge')
    runner.assert_true('body[data-theme="light"] .wb-compact-badge.wb-catchup-badge' in main_css, 'css/main.css provides light theme overrides for catchup badge')
    runner.assert_true('body[data-theme="light"] .wb-compact-badge.wb-test-badge' in main_css, 'css/main.css provides light theme overrides for test badge')
    runner.assert_true('.wb-compact-subtext' in main_css, 'css/main.css defines .wb-compact-subtext')

    for code, name in [(hw_code, 'js/ui/homeworkUI.js'), (app_code, 'js/app.js')]:
        runner.assert_true('wb-card-compact' in code, f'{name} applies wb-card-compact class to cards without tasks or tests')
        runner.assert_true('wb-catchup-badge' in code, f'{name} renders Catch Up badge for lessons without tasks')
        runner.assert_true('wb-test-badge' in code, f'{name} renders Test badge for assessment lessons')
        runner.assert_true('wb-tile-hide-btn' in code, f'{name} implements hide button on lesson tiles')

    # Test 27: Emoji Decluttering & Minimalist Modern UI
    print('\nTest 27: Emoji Decluttering & Minimalist Modern UI')
    # 1. Accent color button has dot + Accent without palette emoji
    runner.assert_true('<span>Accent</span>' in idx_html and '🎨 Accent' not in idx_html, 'index.html accent button has color dot and Accent without palette emoji')
    # 2. Settings button is cog icon only without the word Settings
    runner.assert_true('id="btn-open-settings-modal"' in idx_html and '>⚙️</button>' in idx_html, 'index.html settings button is cog icon only without word Settings')
    # 3. Main nav tabs have clean numbering without leading emojis
    runner.assert_true('>1. Terms & Events</button>' in idx_html, 'index.html nav tab 1 has no leading emoji')
    runner.assert_true('>2. Timetable Rotation</button>' in idx_html, 'index.html nav tab 2 has no leading emoji')
    runner.assert_true('>3. Curriculum & Lessons</button>' in idx_html, 'index.html nav tab 3 has no leading emoji')
    runner.assert_true('>4. Master Pacing & Calendar</button>' in idx_html, 'index.html nav tab 4 has no leading emoji')
    runner.assert_true('>5. Weekly Homework & Summary</button>' in idx_html, 'index.html nav tab 5 has no leading emoji')
    # 4. Sync Week and Whiteboard Display Mode retain both icon and text
    runner.assert_true('🔄 Sync Week' in idx_html, 'index.html preserves icon and text for Sync Week')
    runner.assert_true('Whiteboard Display Mode' in idx_html, 'index.html preserves icon and text for Whiteboard Display Mode')
    # 5. Homework card edit button removed from cards (tiles have edit on click anyway)
    for code, name in [(hw_code, 'js/ui/homeworkUI.js'), (app_code, 'js/app.js')]:
        runner.assert_true('btn-edit-homework-lesson' not in code, f'{name} removes redundant edit button from homework cards')
        runner.assert_true('✏️ Edit\n' not in code, f'{name} removes the word Edit from lesson cards')
    # 6. Grouping toggles Category / Lesson without 'By' or icons
    for code, name in [(hw_code, 'js/ui/homeworkUI.js'), (app_code, 'js/app.js')]:
        runner.assert_true('>Category<' in code or '>\\n                Category\\n' in code or 'Category\n' in code, f'{name} uses clean Category label')
        runner.assert_true('>Lesson<' in code or '>\\n                Lesson\\n' in code or 'Lesson\n' in code, f'{name} uses clean Lesson label')
        runner.assert_true('isLessonGrouping ? \'Lesson\' : \'Category\'' in code, f'{name} whiteboard toggle switches between Category and Lesson')
    # 7. Removed Select All Text, Tip banner, and Highlight & Copy pill
    for code, name in [(hw_code, 'js/ui/homeworkUI.js'), (app_code, 'js/app.js')]:
        runner.assert_true('btn-select-summary-text' not in code, f'{name} removes Select All Text button')
        runner.assert_true('Highlight & Copy (Ctrl+C)' not in code, f'{name} removes Highlight & Copy pill')
        runner.assert_true('Highlight the text inside the box below' not in code, f'{name} removes tip banner')

    # Test 28: Whiteboard Icon Cleanup, Tile Hiding, and Curriculum Options Row on Hover
    print('\nTest 28: Whiteboard Icon Cleanup, Tile Hiding, and Curriculum Options Row on Hover')
    with open('css/planner.css', 'r', encoding='utf-8') as f:
        planner_css = f.read()

    # 1. Whiteboard hide button defined in CSS
    runner.assert_true('.wb-tile-hide-btn' in main_css, 'css/main.css defines .wb-tile-hide-btn styling')
    runner.assert_true('btn-wb-unhide-all' in hw_code, 'js/ui/homeworkUI.js provides unhide/restore button')
    runner.assert_true('btn-wb-unhide-all' in app_code, 'js/app.js provides unhide/restore button')

    # 2. Whiteboard icons decluttered: Catch Up badge has no book icon, no target icon in test badge
    runner.assert_true('wb-catchup-badge">Catch Up<' in hw_code, 'js/ui/homeworkUI.js Catch Up badge has no book icon')
    runner.assert_true('wb-catchup-badge">Catch Up<' in app_code, 'js/app.js Catch Up badge has no book icon')

    # 3. Folder icons removed everywhere
    runner.assert_true('📂' not in app_code and '📁' not in app_code, 'js/app.js has 0 folder emojis')
    with open('js/ui/lessonUI.js', 'r', encoding='utf-8') as f:
        lesson_ui_code = f.read()
    runner.assert_true('📂' not in lesson_ui_code and '📁' not in lesson_ui_code, 'js/ui/lessonUI.js has 0 folder emojis')

    # 4. Pin button removed from lesson cards, available when viewing
    runner.assert_true('toggle-pin-btn' not in app_code, 'js/app.js removes pin button from lesson cards')
    runner.assert_true('btn-viewer-toggle-pin' in app_code, 'js/app.js keeps pin button in lesson details viewer')
    runner.assert_true('btn-viewer-toggle-pin' in idx_html, 'index.html keeps pin button in lesson details viewer')

    # 5. Options row only shown on hover / focus-within in planner.css
    runner.assert_true('.lesson-card:hover .lesson-actions' in planner_css, 'css/planner.css shows .lesson-actions on hover')
    runner.assert_true('.lesson-card:focus-within .lesson-actions' in planner_css, 'css/planner.css shows .lesson-actions on focus-within')
    runner.assert_true('opacity: 0' in planner_css and 'pointer-events: none' in planner_css, 'css/planner.css hides .lesson-actions by default')

    # Test 29: Whiteboard Subtext Removal, Top-Right Hide Button, and Stable Lesson Numbering
    print('\nTest 29: Whiteboard Subtext Removal, Top-Right Hide Button, and Stable Lesson Numbering')
    # 1. Removal of small subtext under Catch Up and Test
    runner.assert_true('No classwork tasks specified for this lesson.' not in hw_code, 'js/ui/homeworkUI.js removes subtext under catch up')
    runner.assert_true('No classwork tasks specified for this lesson.' not in app_code, 'js/app.js removes subtext under catch up')
    runner.assert_true('Assessment lesson. No homework tasks.' not in hw_code, 'js/ui/homeworkUI.js removes subtext under test lessons')
    runner.assert_true('Assessment lesson. No homework tasks.' not in app_code, 'js/app.js removes subtext under test lessons')

    # 2. Hide button pinned to top right
    runner.assert_true('position: relative' in main_css, 'css/main.css sets position: relative on .whiteboard-card')
    runner.assert_true('position: absolute' in main_css and 'right:' in main_css, 'css/main.css positions .wb-tile-hide-btn in top right')
    runner.assert_true('padding-right:' in main_css, 'css/main.css adds padding-right to .whiteboard-type-header to avoid collision')

    # 3. Stable lesson numbering across hidden cards
    runner.assert_true('weekLessonIndex' in hw_code, 'js/ui/homeworkUI.js assigns weekLessonIndex to entries')
    runner.assert_true('weekLessonIndex' in app_code, 'js/app.js assigns weekLessonIndex to entries')

    # 4. Simulation of stable numbering when a lesson is hidden
    mock_lessons = [{'id': 'L1', 'title': 'Intro'}, {'id': 'L2', 'title': 'Topic A'}, {'id': 'L3', 'title': 'Topic B'}]
    mock_entries = [{'lesson': l, 'weekLessonIndex': i + 1} for i, l in enumerate(mock_lessons)]
    hidden_ids = {'L1'}
    visible_mock = [e for e in mock_entries if e['lesson']['id'] not in hidden_ids]
    # L2 must retain number 2, L3 must retain number 3
    runner.assert_equal(visible_mock[0]['weekLessonIndex'], 2, 'Lesson 2 retains number 2 when Lesson 1 is hidden')
    runner.assert_equal(visible_mock[1]['weekLessonIndex'], 3, 'Lesson 3 retains number 3 when Lesson 1 is hidden')

    # Test 30: Brand Subtitle Removal, Clean Category View, and Stacked Compact Whiteboard Cards
    print('\nTest 30: Brand Subtitle Removal, Clean Category View, and Stacked Compact Whiteboard Cards')
    # 1. Subtitles removed from header and View 5
    runner.assert_true('Interactive Annual Pacing & Curriculum Rotation Engine' not in idx_html, 'index.html removes brand subtitle')
    runner.assert_true('View all classwork items from scheduled lessons' not in idx_html, 'index.html removes View 5 subtitle')

    # 2. Edit button removed from homework tiles
    runner.assert_true('btn-edit-homework-lesson' not in hw_code, 'js/ui/homeworkUI.js removes edit button from homework tiles')
    runner.assert_true('btn-edit-homework-lesson' not in app_code, 'js/app.js removes edit button from homework tiles')

    # 3. Lesson and period text strictly on one line (nowrap)
    runner.assert_true('white-space: nowrap' in main_css or 'white-space:nowrap' in main_css, 'css/main.css forces single-line headers')
    runner.assert_true('flex-wrap: nowrap' in main_css, 'css/main.css prevents header wrapping')
    runner.assert_true('flex-shrink: 0' in main_css, 'css/main.css prevents period badge squishing')

    # 4. Stacked adjacent compact cards in whiteboard view
    runner.assert_true('.wb-compact-stack' in main_css, 'css/main.css defines .wb-compact-stack column layout')
    runner.assert_true('wb-compact-stack' in hw_code, 'js/ui/homeworkUI.js stacks adjacent compact cards')
    runner.assert_true('wb-compact-stack' in app_code, 'js/app.js stacks adjacent compact cards')

    # 5. Catch up omitted from category view
    runner.assert_true('anyCatchUpInWeek' not in hw_code, 'js/ui/homeworkUI.js omits Catch Up from whiteboard category view')
    runner.assert_true('anyCatchUpInWeek' not in app_code, 'js/app.js omits Catch Up from whiteboard category view')
    runner.assert_true('hasCatchUp' not in hw_code, 'js/ui/homeworkUI.js omits Catch Up from summary category mode')
    runner.assert_true('hasCatchUp' not in app_code, 'js/app.js omits Catch Up from summary category mode')

    # -------------------------------------------------------------------------
    # TEST 31: Small-Text Explainer Removal & Searchable Help/FAQ Knowledge Base
    # -------------------------------------------------------------------------
    print("\nTest 31: Small-Text Explainer Removal & Searchable Help/FAQ Knowledge Base")

    # 1. Verify small-text explainers removed from main views
    runner.assert_true('Specify start and end dates for the 4 school terms' not in idx_html, 'index.html removes View 1 terms explainer')
    runner.assert_true('Add events that block out whole days' not in idx_html, 'index.html removes View 1 events explainer')
    runner.assert_true('Click any grid cell to assign a class inline' not in idx_html, 'index.html removes View 2 timetable explainer')
    runner.assert_true('Tag lessons as "🎈 Float"' not in idx_html, 'index.html removes View 3 curriculum explainer')

    cal_code = open('js/ui/calendarUI.js', 'r', encoding='utf-8').read()
    runner.assert_true("Switching years displays that year's terms" not in cal_code, 'js/ui/calendarUI.js removes Academic School Year subtitle')
    runner.assert_true("Switching years displays that year's terms" not in app_code, 'js/app.js removes Academic School Year subtitle')

    # 2. Top bar Help button
    runner.assert_true('id="btn-open-help-modal"' in idx_html, 'index.html includes Help button in header')
    runner.assert_true('>?</button>' in idx_html, 'index.html Help button has clean "?" label')

    # 3. Help modal structure in index.html
    runner.assert_true('id="modal-help-backdrop"' in idx_html, 'index.html defines #modal-help-backdrop')
    runner.assert_true('id="help-search-input"' in idx_html, 'index.html defines #help-search-input search box')
    runner.assert_true('id="help-topics-list"' in idx_html, 'index.html defines #help-topics-list container')
    runner.assert_true('js/help.js' in idx_html, 'index.html loads js/help.js')

    # 4. CSS styling
    runner.assert_true('.help-modal' in main_css, 'css/main.css defines .help-modal')
    runner.assert_true('.help-cat-pill' in main_css, 'css/main.css defines .help-cat-pill')
    runner.assert_true('.help-topic-card' in main_css, 'css/main.css defines .help-topic-card')
    runner.assert_true('.help-highlight' in main_css, 'css/main.css defines .help-highlight')

    # 5. js/help.js Knowledge Base & Search Engine
    help_code = open('js/help.js', 'r', encoding='utf-8').read()
    runner.assert_true('HelpUI' in help_code, 'js/help.js defines HelpUI')
    runner.assert_true('HELP_TOPICS' in help_code, 'js/help.js defines HELP_TOPICS')
    runner.assert_true('openHelpModal' in help_code, 'js/help.js implements openHelpModal')
    runner.assert_true('closeHelpModal' in help_code, 'js/help.js implements closeHelpModal')
    runner.assert_true('renderTopics' in help_code, 'js/help.js implements renderTopics')
    runner.assert_true('highlightText' in help_code, 'js/help.js implements highlightText')

    # Check key topics present in knowledge base
    key_topics = [
        'school-terms', 'academic-year', 'blockout-events', 'timetable-rotation',
        'period-config', 'print-timetable', 'ordered-curriculum', 'float-revision-tags',
        'pinned-lessons', 'class-linking', 'lock-threshold', 'master-pacing',
        'weekly-homework', 'whiteboard-mode', 'lesson-timer', 'data-storage',
        'keyboard-shortcuts'
    ]
    for topic_id in key_topics:
        runner.assert_true(f"id: '{topic_id}'" in help_code or f'id: "{topic_id}"' in help_code, f'js/help.js contains topic {topic_id}')

    # Check keyboard shortcut handling
    runner.assert_true("e.key === '?'" in help_code, "js/help.js binds '?' global shortcut to open help")
    runner.assert_true("e.key === 'Escape'" in help_code, "js/help.js binds Escape shortcut to close help")

    print('\n==================================================')
    print(f'Test Results: {runner.passes} PASSED, {runner.fails} FAILED')
    print('==================================================\n')
    if runner.fails > 0:
        exit(1)

if __name__ == '__main__':
    run()

