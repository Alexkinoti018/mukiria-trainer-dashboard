import json
import re
import pdfplumber

pdf_path = r"C:\Users\Administrator\.gemini\antigravity\brain\b5e1f511-781f-46cb-bb10-060f2a9e6646\.user_uploaded\uploaded_media_1791175017165.pdf"

COL_PERIOD_MAP = {
    1: 1, # 8:00 - 10:00
    3: 2, # 10:30 - 12:30
    5: 3, # 13:30 - 15:30
    7: 4  # 15:35 - 17:35
}

DAY_MAP = {
    "Mo": "Monday",
    "Tu": "Tuesday",
    "We": "Wednesday",
    "Th": "Thursday",
    "Fr": "Friday"
}

PERIOD_TIMES = {
    1: {"name": "Period 1", "startTime": "08:00", "endTime": "10:00", "timeRange": "8:00 - 10:00"},
    2: {"name": "Period 2", "startTime": "10:30", "endTime": "12:30", "timeRange": "10:30 - 12:30"},
    3: {"name": "Period 3", "startTime": "13:30", "endTime": "15:30", "timeRange": "13:30 - 15:30"},
    4: {"name": "Period 4", "startTime": "15:35", "endTime": "17:35", "timeRange": "15:35 - 17:35"},
}

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

trainers_data = []
all_classes_set = set()
all_units_set = set()
all_venues_set = set()

def infer_department(name, units, classes):
    combined = " ".join(units + classes).lower()
    if any(k in combined for k in ["ict", "itech", "computer", "digital literacy", "software", "network", "database", "programming", "discreet mathematics"]):
        return "Computing & Informatics"
    if any(k in combined for k in ["cosme", "salon", "hair", "skin", "makeup", "braiding", "barbering", "nail"]):
        return "Cosmetology & Hairdressing"
    if any(k in combined for k in ["agre", "dga", "crops", "farm", "animal", "forage", "bee", "horticulture", "ruminant"]):
        return "Agriculture & Environmental Studies"
    if any(k in combined for k in ["fbp", "fbs", "food", "kitchen", "pastry", "catering", "beverage", "meal", "soup"]):
        return "Hospitality & Institutional Management"
    if any(k in combined for k in ["ce6", "btech", "msn", "building", "masonry", "civil", "structural", "concrete", "sanitation"]):
        return "Building & Civil Engineering"
    if any(k in combined for k in ["ee", "ei", "el", "dee", "electrical", "electronics", "solar", "wiring", "power", "conduit"]):
        return "Electrical & Electronics Engineering"
    if any(k in combined for k in ["aut", "wef", "automotive", "welding", "engines", "braking", "suspension", "fabrication"]):
        return "Mechanical & Automotive Engineering"
    if any(k in combined for k in ["ls", "survey", "cartography", "cadastral", "photogrammetry"]):
        return "Surveying & Geomatics"
    if any(k in combined for k in ["bf", "pm", "admin", "admn", "accounting", "banking", "finance", "business", "shorthand", "secretarial"]):
        return "Business Studies & Administration"
    return "Institutional Academics"

with pdfplumber.open(pdf_path) as pdf:
    print(f"Reading {len(pdf.pages)} pages...")
    for idx, page in enumerate(pdf.pages):
        text = page.extract_text() or ""
        teacher_match = re.search(r"Teacher\s+([A-Z\.\s\']+)", text)
        teacher_name = teacher_match.group(1).strip() if teacher_match else f"Trainer {idx + 1}"
        
        tables = page.extract_tables()
        if not tables or len(tables) == 0:
            continue
        
        table = tables[0]
        # Rows 1 to 5 correspond to Mo, Tu, We, Th, Fr
        schedule = {
            "Monday": [],
            "Tuesday": [],
            "Wednesday": [],
            "Thursday": [],
            "Friday": []
        }
        
        trainer_classes = set()
        trainer_units = set()

        for r_idx in range(1, len(table)):
            row = table[r_idx]
            if not row or len(row) < 8:
                continue
            day_code = row[0].strip() if row[0] else ""
            if day_code not in DAY_MAP:
                continue
            day_name = DAY_MAP[day_code]
            
            for col_idx, period_num in COL_PERIOD_MAP.items():
                if col_idx >= len(row):
                    continue
                cell_val = row[col_idx]
                if not cell_val:
                    continue
                
                cell_text = cell_val.strip()
                if not cell_text:
                    continue
                
                parts = [p.strip() for p in cell_text.split("\n") if p.strip()]
                if not parts:
                    continue
                
                # In MTTI timetables, cells usually have:
                # [Unit / Subject Title]
                # [Class Code]
                # [Room / Venue]
                # OR [Class Code] \n [Unit Title] \n [Room / Venue]
                # Let's inspect parts
                unit_title = ""
                class_code = ""
                venue = ""
                
                # If 1 line
                if len(parts) == 1:
                    unit_title = parts[0]
                elif len(parts) == 2:
                    # check which is class
                    if any(parts[0].startswith(x) for x in ["ICT", "ITECH", "AGRE", "DGA", "CE", "BTECH", "BTEC", "MSN", "AT", "PL", "EE", "EI", "EL", "DEE", "IAR", "SW", "BF", "PM", "ADMIN", "ADMN", "COSME", "AUT", "WEF", "FDM", "FDT", "FBP", "FBS", "LS"]):
                        class_code = parts[0]
                        unit_title = parts[1]
                    else:
                        unit_title = parts[0]
                        class_code = parts[1]
                else:
                    venue = parts[-1]
                    rem = parts[:-1]
                    # Find class among remaining
                    cls_idx = -1
                    for i_p, p_str in enumerate(rem):
                        if any(p_str.startswith(x) for x in ["ICT", "ITECH", "AGRE", "DGA", "CE", "BTECH", "BTEC", "MSN", "AT", "PL", "EE", "EI", "EL", "DEE", "IAR", "SW", "BF", "PM", "ADMIN", "ADMN", "COSME", "AUT", "WEF", "FDM", "FDT", "FBP", "FBS", "LS"]):
                            cls_idx = i_p
                            break
                    
                    if cls_idx != -1:
                        class_code = " ".join(rem[cls_idx:])
                        unit_title = " ".join(rem[:cls_idx]) if cls_idx > 0 else rem[0]
                    else:
                        unit_title = rem[0]
                        class_code = " ".join(rem[1:])
                
                # Cleanup class and unit
                if not unit_title and class_code:
                    unit_title = "Specialized Instruction"
                if not class_code:
                    class_code = "MTTI-GENERAL"

                trainer_classes.add(class_code)
                trainer_units.add(unit_title)
                all_classes_set.add(class_code)
                all_units_set.add(unit_title)
                if venue:
                    all_venues_set.add(venue)

                time_info = PERIOD_TIMES[period_num]
                session_entry = {
                    "period": period_num,
                    "periodName": time_info["name"],
                    "timeRange": time_info["timeRange"],
                    "startTime": time_info["startTime"],
                    "endTime": time_info["endTime"],
                    "classCode": class_code,
                    "unitTitle": unit_title,
                    "venue": venue or "Classroom",
                    "trainer": teacher_name
                }
                schedule[day_name].append(session_entry)
        
        # Sort sessions by period
        for d in schedule:
            schedule[d].sort(key=lambda x: x["period"])

        trainer_obj = {
            "id": slugify(teacher_name),
            "name": teacher_name,
            "department": infer_department(teacher_name, list(trainer_units), list(trainer_classes)),
            "classes": sorted(list(trainer_classes)),
            "units": sorted(list(trainer_units)),
            "schedule": schedule,
            "page": idx + 1
        }
        trainers_data.append(trainer_obj)

print(f"Extracted {len(trainers_data)} trainers.")
print(f"Total unique classes: {len(all_classes_set)}")
print(f"Total unique units: {len(all_units_set)}")
print(f"Total unique venues: {len(all_venues_set)}")

master_timetable = {
    "institution": "MUKIRIA TECHNICAL TRAINING INSTITUTE",
    "term": "Term 3, 2026",
    "termCode": "TERM-3-2026",
    "academicYear": 2026,
    "termStartDate": "2026-09-28",
    "termEndDate": "2026-11-27",
    "termTotalWeeks": 10,
    "currentReferenceDate": "2026-10-05",
    "currentWeek": 2,
    "periods": [
        {"period": 1, "name": "Period 1", "startTime": "08:00", "endTime": "10:00", "type": "class"},
        {"period": "tea", "name": "Tea Break", "startTime": "10:00", "endTime": "10:30", "type": "break"},
        {"period": 2, "name": "Period 2", "startTime": "10:30", "endTime": "12:30", "type": "class"},
        {"period": "lunch", "name": "Lunch Hour", "startTime": "12:30", "endTime": "13:30", "type": "break"},
        {"period": 3, "name": "Period 3", "startTime": "13:30", "endTime": "15:30", "type": "class"},
        {"period": "short_break", "name": "Short Break", "startTime": "15:30", "endTime": "15:35", "type": "break"},
        {"period": 4, "name": "Period 4", "startTime": "15:35", "endTime": "17:35", "type": "class"}
    ],
    "trainers": trainers_data,
    "classes": sorted(list(all_classes_set)),
    "units": sorted(list(all_units_set)),
    "venues": sorted(list(all_venues_set))
}

with open("client/src/lib/timetableData.json", "w", encoding="utf-8") as f:
    json.dump(master_timetable, f, indent=2)

print("Saved client/src/lib/timetableData.json successfully!")
