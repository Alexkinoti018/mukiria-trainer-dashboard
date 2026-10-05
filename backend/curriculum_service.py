import os
import json
from urllib.parse import unquote

CURRICULUM_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "curriculum_database.json")
_cached_catalog = None

def get_catalog():
    global _cached_catalog
    if _cached_catalog is not None:
        return _cached_catalog
    
    if os.path.exists(CURRICULUM_DB_PATH):
        try:
            with open(CURRICULUM_DB_PATH, "r", encoding="utf-8") as f:
                _cached_catalog = json.load(f)
                return _cached_catalog
        except Exception as e:
            print(f"Error loading curriculum database: {e}")
            
    # Try client path fallback
    client_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "client", "src", "lib", "curriculum_database.json"))
    if os.path.exists(client_path):
        try:
            with open(client_path, "r", encoding="utf-8") as f:
                _cached_catalog = json.load(f)
                return _cached_catalog
        except Exception as e:
            print(f"Error loading client curriculum database: {e}")

    _cached_catalog = []
    return _cached_catalog

def get_departments():
    catalog = get_catalog()
    depts = {}
    for u in catalog:
        d = u.get("department", "General")
        depts[d] = depts.get(d, 0) + 1
    return [{"name": k, "unit_count": v} for k, v in depts.items()]

def get_units(department=None, level=None, search=None):
    catalog = get_catalog()
    results = catalog
    
    if department:
        department = department.lower().strip()
        results = [u for u in results if department in u.get("department", "").lower()]
        
    if level:
        try:
            lvl_int = int(level)
            results = [u for u in results if u.get("level") == lvl_int]
        except (ValueError, TypeError):
            pass
            
    if search:
        s = search.lower().strip()
        results = [
            u for u in results
            if s in u.get("unit_title", "").lower()
            or s in u.get("unit_code", "").lower()
            or s in u.get("cdacc_code", "").lower()
            or s in u.get("isced_code", "").lower()
            or s in u.get("course", "").lower()
        ]
        
    return results

def get_unit_by_code(code):
    if not code:
        return None
    code_clean = unquote(code).strip().upper().replace(' ', '')
    catalog = get_catalog()
    
    for u in catalog:
        c1 = u.get("unit_code", "").upper().replace(' ', '')
        c2 = u.get("cdacc_code", "").upper().replace(' ', '')
        c3 = u.get("isced_code", "").upper().replace(' ', '')
        c4 = u.get("id", "").upper().replace(' ', '')
        if code_clean in [c1, c2, c3, c4] or (len(code_clean) > 4 and code_clean in c1):
            return u
            
    # Fuzzy match on title
    for u in catalog:
        t = u.get("unit_title", "").upper().replace(' ', '')
        if code_clean in t or t in code_clean:
            return u
            
    return None

def trigger_rescan():
    global _cached_catalog
    try:
        from build_curriculum_database import build_complete_curriculum_catalog
        new_catalog = build_complete_curriculum_catalog()
        _cached_catalog = new_catalog
        return {"success": True, "count": len(new_catalog), "message": f"Successfully rescanned and indexed {len(new_catalog)} units from D:\\Curriculum and OS"}
    except Exception as e:
        return {"success": False, "error": str(e)}
