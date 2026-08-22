import urllib.request, json, base64

tests = [
    ('/api/export-session-plan', {
        'date': '14/07/2026', 'time_duration': '8AM-12PM', 'week_number': 1,
        'trainer_name': 'Alexander Kinoti', 'unit_name': 'Perform Graphic Design',
        'unit_code': 'ICT/OS/CS/CR/11/6/A', 'level': 6, 'class_code': 'ITECH6/M/24',
        'trainees_count': 12, 'session_title': 'Test Session',
        'learning_outcomes': ['Create shapes'], 'resources': ['Lab'],
        'delivery_steps': [{'time_minutes': '30', 'trainer_activity': 'Demo', 'learner_activity': 'Practice', 'assessment': 'Quiz'}],
        'total_time': '1hr'
    }),
    ('/api/export-learning-plan', {
        'unit_name': 'Perform Graphic Design', 'unit_code': 'ICT/OS/CS/CR/11/6/A',
        'trainer_name': 'Alexander Kinoti', 'level': 6, 'class_code': 'ITECH6/M/24',
        'trainees_count': 12,
        'weeks': [{'week': 1, 'session_no': 1, 'title': 'Intro', 'outcome': 'Identify principles',
                   'trainer_activities': 'Lecture', 'trainee_activities': 'Notes'}]
    }),
    ('/api/export-practical-exam', {
        'course_name': 'ICT Level 6', 'unit_name': 'Perform Graphic Design',
        'unit_code': 'ICT/OS/CS/CR/11/6/A', 'class_code': 'ITECH6/M/24', 'series': 'T1 2026',
        'criteria': [
            {'criterion': 'Design quality', 'marks': 20},
            {'criterion': 'Technical skill', 'marks': 20},
            {'criterion': 'Presentation',   'marks': 10},
        ]
    }),
]

for path, payload in tests:
    try:
        body = json.dumps({'payload': payload}).encode()
        req = urllib.request.Request(
            'http://localhost:8000' + path, data=body, method='POST',
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            d = json.loads(resp.read())
        if d.get('success'):
            sz = len(base64.b64decode(d['file_data']))
            print('[OK]', path, '->', d['filename'], '(' + str(sz) + ' bytes)')
        else:
            print('[FAIL]', path, d)
    except Exception as e:
        print('[ERROR]', path, str(e))
