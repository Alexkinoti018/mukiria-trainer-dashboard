import json
import re
from pypdf import PdfReader

pdf_path = r"C:\Users\Administrator\.gemini\antigravity\brain\b5e1f511-781f-46cb-bb10-060f2a9e6646\.user_uploaded\uploaded_media_1791175017165.pdf"
reader = PdfReader(pdf_path)

print(f"Total pages: {len(reader.pages)}")

timetable_data = []
all_classes = set()
all_teachers = set()
all_units = set()

# Days and periods mapping in standard aSc Timetables
# Periods: 1 (8:00 - 10:00), TEA BREAK (10:00 - 10:30), 2 (10:30 - 12:30), LUNCH HR (12:30 - 13:30), 3 (13:30 - 15:30), SHORT BREAK (15:30 - 15:35), 4 (15:35 - 17:35)

for page_idx, page in enumerate(reader.pages):
    text = page.extract_text() or ""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    
    # Extract teacher name
    teacher = ""
    for line in lines:
        if line.startswith("Teacher "):
            teacher = line.replace("Teacher ", "").strip()
            break
        elif "Teacher" in line:
            m = re.search(r"Teacher\s+([A-Z\.\s]+)", line)
            if m:
                teacher = m.group(1).strip()
                break

    if teacher:
        all_teachers.add(teacher)

    # Let's inspect raw lines for each page
    page_info = {
        "page": page_idx + 1,
        "teacher": teacher,
        "raw_lines": lines
    }
    timetable_data.append(page_info)

print(f"Total teachers extracted: {len(all_teachers)}")
for t in sorted(all_teachers):
    print(f" - {t}")

with open("scripts/raw_timetable_pages.json", "w", encoding="utf-8") as f:
    json.dump(timetable_data, f, indent=2)
