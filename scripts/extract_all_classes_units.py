import json
import re

with open("scripts/raw_timetable_pages.json", "r", encoding="utf-8") as f:
    pages = json.load(f)

# Common venues in Mukiria TTI
VENUES = {
    "LAB1A", "LAB1B", "LAB2", "LAB3", "FARM", "FIELD", "MSN/W", "CAP/W", "PL/W", "WE/W", "A/W",
    "E/W", "E/W1", "MCT1", "MCT2", "SALON1", "SALON11", "SALONIII", "SALON IV", "SALON1A",
    "CI", "C&A H", "C&A1", "C&A3", "BCE1", "BCE2", "BCE3", "D/H", "R 1", "R1", "RI", "K 1", "K1",
    "MSN/S"
}
# Also H1..H18, D1..D8, C1..C8, F1..F8, G1..G8, A1..A10
for prefix in ["H", "D", "C", "F", "G", "A"]:
    for num in range(1, 20):
        VENUES.add(f"{prefix}{num}")

DAYS = {"Mo", "Tu", "We", "Th", "Fr"}
PERIODS = {"1", "2", "3", "4", "TEA BREAK", "LUNCH HR", "SHORT BREAK"}

# Let's inspect all lines
classes_found = set()
units_found = set()
entries_found = []

def is_class(s):
    # Matches patterns like ICT4/ITECH6/S/26, AGRE 5/6/M/26, CE6/M/26, BTECH5/6/J/S/25, etc.
    s = s.strip()
    if any(s.startswith(x) for x in [
        "ICT", "ITECH", "AGRE", "DGA", "CE", "BTECH", "BTEC", "MSN", "AT", "PL", "EE", "EI", "EL",
        "DEE", "IAR", "SW", "BF", "PM", "ADMIN", "ADMN", "COSME", "AUT", "WEF", "FDM", "FDT",
        "FBP", "FBS", "LS"
    ]):
        return True
    return False

# Now let's loop through all pages and reconstruct sessions
for p in pages:
    teacher = p["teacher"]
    lines = p["raw_lines"]
    
    # Filter out page headers/footers
    content_lines = []
    for line in lines:
        if line.startswith("Timetable generated") or "aSc Timetables" in line or line.startswith("Teacher"):
            continue
        if line in DAYS or line in PERIODS:
            continue
        if re.match(r"^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$", line):
            continue
        content_lines.append(line)

    # Let's group lines into blocks:
    # A block typically has:
    # [Class Line(s)] -> [Subject/Unit Line(s)] -> [Room/Venue Line]
    idx = 0
    while idx < len(content_lines):
        line = content_lines[idx]
        if is_class(line):
            # Might be multi-line class (e.g. "ICT4/ITECH6/S/", "26 MOD 1")
            cls = line
            idx += 1
            while idx < len(content_lines) and (content_lines[idx].startswith("MOD") or re.match(r"^\d{2}\s+MOD", content_lines[idx]) or re.match(r"^\d{2}$", content_lines[idx]) or content_lines[idx] in ["25", "26", "IV", "III", "II", "I"]):
                cls += " " + content_lines[idx]
                idx += 1
            
            # Next should be unit title
            unit_parts = []
            while idx < len(content_lines) and content_lines[idx] not in VENUES and not is_class(content_lines[idx]):
                unit_parts.append(content_lines[idx])
                idx += 1
            unit = " ".join(unit_parts)
            
            venue = ""
            if idx < len(content_lines) and content_lines[idx] in VENUES:
                venue = content_lines[idx]
                idx += 1
            
            classes_found.add(cls.strip())
            if unit:
                units_found.add(unit.strip())
            entries_found.append({
                "teacher": teacher,
                "class": cls.strip(),
                "unit": unit.strip(),
                "venue": venue
            })
        else:
            idx += 1

print(f"Total timetable entries parsed: {len(entries_found)}")
print(f"Unique classes found: {len(classes_found)}")
print(f"Unique units found: {len(units_found)}")

with open("scripts/extracted_classes_units.json", "w", encoding="utf-8") as f:
    json.dump({
        "classes": sorted(list(classes_found)),
        "units": sorted(list(units_found)),
        "entries": entries_found
    }, f, indent=2)

print("\n--- SAMPLE CLASSES ---")
for c in sorted(classes_found)[:30]:
    print(" ", c)

print("\n--- SAMPLE UNITS ---")
for u in sorted(units_found)[:30]:
    print(" ", u)
