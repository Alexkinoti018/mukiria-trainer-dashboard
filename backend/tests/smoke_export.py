"""Smoke test for all three document export endpoints."""
import urllib.request
import json
import base64
import time

BASE = "http://localhost:8000"


def post(path, payload):
    body = json.dumps({"payload": payload}).encode()
    req = urllib.request.Request(
        BASE + path, data=body, method="POST",
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def save(filename, b64_data):
    raw = base64.b64decode(b64_data)
    with open(filename, "wb") as f:
        f.write(raw)
    return len(raw)


time.sleep(1)  # Give server a moment if freshly started

# ── Test 1: Session Plan ─────────────────────────────────────
try:
    data = post("/api/export-session-plan", {
        "date": "14/07/2026",
        "time_duration": "8:00 AM - 12:00 PM",
        "week_number": 3,
        "trainer_name": "Alexander Kinoti",
        "department": "Computing & Informatics",
        "unit_name": "Perform Graphic Design",
        "unit_code": "ICT/OS/CS/CR/11/6/A",
        "level": 6,
        "class_code": "ITECH6/M/24",
        "trainees_count": 12,
        "session_title": "Introduction to Vector Graphics",
        "learning_outcomes": ["Create basic vector shapes", "Apply fill and stroke"],
        "resources": ["Lab Workstations", "Adobe Illustrator", "OS/Curriculum"],
        "safety_requirements": "Adhere to 20-20-20 eye rule.",
        "introduction": "Brief review of raster vs vector graphics.",
        "delivery_steps": [
            {"time_minutes": "30", "trainer_activity": "Demo: Pen tool", "learner_activity": "Trace shapes", "assessment": "Verify accuracy"},
            {"time_minutes": "60", "trainer_activity": "Guided practice", "learner_activity": "Build logo", "assessment": "Review on screen"},
        ],
        "session_review": "Recap key tools used.",
        "assignment": "Create a personal monogram logo.",
        "total_time": "2 Hours",
        "reflection": ""
    })
    if data.get("success"):
        sz = save("test_session_plan.docx", data["file_data"])
        print(f"[OK] Session Plan: {data['filename']} ({sz} bytes)")
    else:
        print("[FAIL] Session Plan:", data)
except Exception as e:
    print("[ERROR] Session Plan:", e)

# ── Test 2: Learning Plan ────────────────────────────────────
try:
    data = post("/api/export-learning-plan", {
        "unit_name": "Perform Graphic Design",
        "unit_code": "ICT/OS/CS/CR/11/6/A",
        "trainer_name": "Alexander Kinoti",
        "level": 6,
        "class_code": "ITECH6/M/24",
        "trainees_count": 12,
        "duration": "Jan-March 2026 (45hrs)",
        "date_prepared": "06/01/2026",
        "series": "Term 1 2026",
        "weeks": [
            {"week": 1, "session_no": 1, "title": "Intro to GD", "outcome": "Identify GD principles",
             "trainer_activities": "Lecture + Demo", "trainee_activities": "Notes + Q&A"},
            {"week": 2, "session_no": 2, "title": "Vector Basics", "outcome": "Use pen tool",
             "trainer_activities": "Guided practice", "trainee_activities": "Hands-on"},
        ]
    })
    if data.get("success"):
        sz = save("test_learning_plan.docx", data["file_data"])
        print(f"[OK] Learning Plan: {data['filename']} ({sz} bytes)")
    else:
        print("[FAIL] Learning Plan:", data)
except Exception as e:
    print("[ERROR] Learning Plan:", e)

# ── Test 3: Practical Exam ───────────────────────────────────
try:
    data = post("/api/export-practical-exam", {
        "course_name": "ICT Level 6",
        "course_code": "ICT/OS/CS/CR/11/6/A",
        "unit_name": "Perform Graphic Design",
        "unit_code": "ICT/OS/CS/CR/11/6/A",
        "class_code": "ITECH6/M/24",
        "series": "Term 1 2026",
        "time": "2 Hours",
        "project_brief": "Design a corporate identity package for a new startup.",
        "elements": ["Brand identity design", "Logo and colour palette"],
        "tasks": ["Design a logo", "Create a letterhead", "Design a business card"],
        "criteria": [
            {"criterion": "Logo is original and identifiable", "marks": 10},
            {"criterion": "Colour palette is harmonious", "marks": 10},
            {"criterion": "Typography is consistent", "marks": 10},
            {"criterion": "Deliverables match brief", "marks": 10},
            {"criterion": "Work presented professionally", "marks": 10},
        ]
    })
    if data.get("success"):
        sz = save("test_practical_exam.docx", data["file_data"])
        print(f"[OK] Practical Exam: {data['filename']} ({sz} bytes)")
    else:
        print("[FAIL] Practical Exam:", data)
except Exception as e:
    print("[ERROR] Practical Exam:", e)
