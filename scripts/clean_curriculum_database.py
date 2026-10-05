import json
import os

def clean_database(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    print(f"Original length for {filepath}: {len(data)}")
    cleaned = []
    seen_codes = set()

    for u in data:
        code = str(u.get("unit_code", "")).strip()
        cdacc = str(u.get("cdacc_code", "")).strip()
        title = str(u.get("unit_title", "")).strip()
        
        # Filter out junk / non-unit entries
        if code in ["TOTAL_HOURS", "Industry Training", "INDUSTRIAL TRAINING"]:
            continue
        if "duration of unit" in code.lower() or "relationship to occupational" in code.lower():
            continue
        if "tvet cdacc code" in code.lower():
            continue
        if code == "0611 351 01A" and not cdacc:
            # Redundant duplicate of IT/CU/ICTA/CR/01/4/MA
            continue

        # Standardize entry 0 (Computer Essentials -> Perform Computer Essentials)
        if "it/cu/icta/cr/01/4/ma" in code.lower() or "it-cu-icta-cr-01-4-ma" in str(u.get("id","")).lower():
            u["unit_title"] = "Perform Computer Essentials"
            u["unit_code"] = "IT/CU/ICTA/CR/01/4/MA"
            u["cdacc_code"] = "IT/CU/ICTA/CR/01/4/MA"
            u["isced_code"] = "0611 351 01A"
            u["course"] = "ICT 4 / ICT Technician Level 6 Modular (ICT4/ITECH6/S/26 MOD 1)"
            u["department"] = "Computing and Informatics"

        key = f"{u.get('unit_code')}_{u.get('unit_title')}"
        if key in seen_codes:
            continue
        seen_codes.add(key)
        cleaned.append(u)

    print(f"Cleaned length for {filepath}: {len(cleaned)}")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(cleaned, f, indent=2, ensure_ascii=False)
    print(f"Successfully saved {filepath}")

clean_database("client/src/lib/curriculum_database.json")
clean_database("backend/data/curriculum_database.json")
