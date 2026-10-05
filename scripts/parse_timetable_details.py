import json
import re

with open("scripts/raw_timetable_pages.json", "r", encoding="utf-8") as f:
    pages = json.load(f)

print(f"Loaded {len(pages)} pages.")

# Let's inspect pages 50 to 57 (computing / Alexander Kinoti / Greenwood / Timothy Muthomi etc.)
for p in pages:
    if "KINOTI" in p["teacher"]:
        print(f"Teacher: {p['teacher']}")
        for line in p["raw_lines"]:
            print("  ", line)
