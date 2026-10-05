import docx
import os
import glob
import re
import json

CURRICULUM_DIR = r"D:\Curriculum and OS"

def clean_txt(text):
    if not text:
        return ""
    # Normalize whitespaces
    return re.sub(r'\s+', ' ', text).strip()

def parse_docx_curriculum(file_path, department, course_title, default_level=6):
    """
    Parses a CDACC Curriculum .docx file to extract all units,
    descriptions, learning outcomes, content, and assessment methods.
    """
    print(f"--> Parsing Curriculum: {os.path.basename(file_path)}")
    try:
        doc = docx.Document(file_path)
    except Exception as e:
        print(f"    Failed to open {file_path}: {e}")
        return []

    # Iterate through paragraphs to identify unit boundaries
    unit_blocks = []
    current_unit = None
    
    # We will look for headings with ISCED or TVET CDACC UNIT CODE or UNIT TITLE
    # Also find Table of Contents or Summary tables if available
    
    # Let's inspect paragraphs
    paragraphs = doc.paragraphs
    for i, p in enumerate(paragraphs):
        txt = clean_txt(p.text)
        if not txt:
            continue
            
        # Detect unit header patterns
        isced_match = re.search(r'ISCED\s+UNIT\s+CODE:?\s*([0-9A-Z\s/]+)', txt, re.I)
        cdacc_match = re.search(r'TVET\s+CDACC\s+UNIT\s+CODE:?\s*([0-9A-Z\s/\-]+)', txt, re.I)
        
        # Check if paragraph has "DURATION OF UNIT"
        dur_match = re.search(r'DURATION\s+OF\s+UNIT:?\s*(\d+)\s*HOURS', txt, re.I)
        
        if isced_match or cdacc_match:
            # Check if this belongs to current unit or starts a new unit
            # Often Unit Title is the previous line or in the same line
            title_candidate = ""
            # Check if title is part of txt
            cleaned_title = re.sub(r'ISCED\s+UNIT\s+CODE:?.*', '', txt, flags=re.I)
            cleaned_title = re.sub(r'TVET\s+CDACC\s+UNIT\s+CODE:?.*', '', cleaned_title, flags=re.I).strip()
            
            if cleaned_title and len(cleaned_title) > 3 and not cleaned_title.isdigit():
                title_candidate = cleaned_title
            elif i > 0:
                prev_txt = clean_txt(paragraphs[i-1].text)
                if prev_txt and len(prev_txt) < 80 and not prev_txt.isdigit() and 'CURRICULUM' not in prev_txt.upper():
                    title_candidate = prev_txt
            
            # Start or update unit
            if not current_unit or (current_unit.get('cdacc_code') and cdacc_match and current_unit['cdacc_code'] != clean_txt(cdacc_match.group(1))):
                if current_unit and (current_unit.get('cdacc_code') or current_unit.get('isced_code')):
                    unit_blocks.append(current_unit)
                
                current_unit = {
                    "source_file": os.path.basename(file_path),
                    "department": department,
                    "course": course_title,
                    "level": default_level,
                    "title": title_candidate or "Unit of Competence",
                    "isced_code": clean_txt(isced_match.group(1)) if isced_match else "",
                    "cdacc_code": clean_txt(cdacc_match.group(1)) if cdacc_match else "",
                    "duration_hours": 0,
                    "description": "",
                    "learning_outcomes": [],
                    "p_start_idx": i
                }
            else:
                if isced_match and not current_unit.get("isced_code"):
                    current_unit["isced_code"] = clean_txt(isced_match.group(1))
                if cdacc_match and not current_unit.get("cdacc_code"):
                    current_unit["cdacc_code"] = clean_txt(cdacc_match.group(1))
                if title_candidate and (current_unit["title"] == "Unit of Competence" or len(title_candidate) > len(current_unit["title"])):
                    current_unit["title"] = title_candidate
        
        elif dur_match and current_unit:
            current_unit["duration_hours"] = int(dur_match.group(1))
            
        elif current_unit and "unit description" in txt.lower():
            # Grab next paragraph as description
            if i + 1 < len(paragraphs):
                current_unit["description"] = clean_txt(paragraphs[i+1].text)
    
    if current_unit and (current_unit.get('cdacc_code') or current_unit.get('isced_code')):
        unit_blocks.append(current_unit)

    # Now let's extract learning outcomes from tables!
    # In CDACC documents, there are tables:
    # 1. Summary of Learning Outcomes (Col 0: Learning Outcomes, Col 1: Duration)
    # 2. Detailed content table (Col 0: Learning outcome, Col 1: Content, Col 2: Suggested Assessment Methods)
    
    # We can match tables to unit blocks based on text in the table or proximity
    for t_idx, t in enumerate(doc.tables):
        if len(t.rows) < 2:
            continue
        hdr = [clean_txt(c.text).lower() for c in t.rows[0].cells]
        hdr_str = " ".join(hdr)
        
        # Summary of Learning Outcomes table:
        if ('learning outcome' in hdr_str or 'learning outcomes' in hdr_str) and ('duration' in hdr_str or 'hours' in hdr_str):
            # Extract list of outcomes
            outcomes_extracted = []
            for r in t.rows[1:]:
                row_cells = [clean_txt(c.text) for c in r.cells]
                if not row_cells or not row_cells[0]: continue
                out_title = row_cells[0]
                if 'total' in out_title.lower(): continue
                hours = 0
                if len(row_cells) > 1:
                    digits = re.findall(r'\d+', row_cells[1])
                    if digits: hours = int(digits[0])
                outcomes_extracted.append({
                    "title": out_title,
                    "duration_hours": hours,
                    "content": [],
                    "assessment_methods": []
                })
            
            # Match to the right unit!
            # Look at previous paragraph or match by table index
            # Find the closest unit before this table
            matched_unit = None
            if unit_blocks:
                # Find the unit that doesn't have learning outcomes yet
                for u in unit_blocks:
                    if not u["learning_outcomes"]:
                        matched_unit = u
                        break
            if matched_unit and outcomes_extracted:
                matched_unit["learning_outcomes"] = outcomes_extracted

        # Detailed Content Table:
        elif ('content' in hdr_str or 'suggested' in hdr_str or 'assessment' in hdr_str):
            # Often col 0 is outcome, col 1 is content, col 2 is assessment
            col_out = 0
            col_cnt = 1 if len(t.columns) > 1 else 0
            col_ass = 2 if len(t.columns) > 2 else -1
            
            curr_outcome_title = ""
            for r in t.rows[1:]:
                cells = [clean_txt(c.text) for c in r.cells]
                if not any(cells): continue
                
                out_txt = cells[col_out] if col_out < len(cells) else ""
                cnt_txt = cells[col_cnt] if col_cnt < len(cells) else ""
                ass_txt = cells[col_ass] if col_ass >= 0 and col_ass < len(cells) else ""
                
                if out_txt:
                    curr_outcome_title = out_txt
                
                # Split content into distinct topics
                topics = [clean_txt(s) for s in re.split(r'[\n\r•;]+|\s{3,}', cnt_txt) if len(clean_txt(s)) > 3]
                methods = [clean_txt(s) for s in re.split(r'[\n\r•;]+|\s{3,}', ass_txt) if len(clean_txt(s)) > 3]
                
                # Attach to current unit's matching learning outcome
                if unit_blocks:
                    # Look at recent units
                    target_unit = None
                    for u in reversed(unit_blocks):
                        if u["learning_outcomes"]:
                            target_unit = u
                            break
                    if target_unit and target_unit["learning_outcomes"]:
                        # Find best matching outcome
                        found = False
                        if curr_outcome_title:
                            for lo in target_unit["learning_outcomes"]:
                                # Match by number or words
                                num1 = re.findall(r'^\d+', curr_outcome_title)
                                num2 = re.findall(r'^\d+', lo["title"])
                                if num1 and num2 and num1[0] == num2[0]:
                                    lo["content"].extend([t for t in topics if t not in lo["content"]])
                                    lo["assessment_methods"].extend([m for m in methods if m not in lo["assessment_methods"]])
                                    found = True
                                    break
                        if not found and target_unit["learning_outcomes"]:
                            # Add to last outcome
                            target_unit["learning_outcomes"][-1]["content"].extend(topics)
                            target_unit["learning_outcomes"][-1]["assessment_methods"].extend(methods)

    print(f"    Extracted {len(unit_blocks)} units from {os.path.basename(file_path)}")
    return unit_blocks

def parse_docx_os(file_path, department, course_title, default_level=6):
    """
    Parses a CDACC Occupational Standards (OS) .docx file to extract
    Elements, Performance Criteria, Variables/Range, and Underpinning Knowledge.
    """
    print(f"--> Parsing Occupational Standards: {os.path.basename(file_path)}")
    try:
        doc = docx.Document(file_path)
    except Exception as e:
        print(f"    Failed to open OS {file_path}: {e}")
        return []

    os_units = []
    current_unit = None
    
    paragraphs = doc.paragraphs
    for i, p in enumerate(paragraphs):
        txt = clean_txt(p.text)
        if not txt: continue
        
        isced_match = re.search(r'ISCED\s+UNIT\s+CODE:?\s*([0-9A-Z\s/]+)', txt, re.I)
        cdacc_match = re.search(r'TVET\s+CDACC\s+(?:UNIT\s+)?CODE:?\s*([0-9A-Z\s/\-]+)', txt, re.I)
        
        if isced_match or cdacc_match:
            # Title extraction
            title_cand = ""
            cleaned = re.sub(r'ISCED\s+UNIT\s+CODE:?.*', '', txt, flags=re.I)
            cleaned = re.sub(r'TVET\s+CDACC\s+(?:UNIT\s+)?CODE:?.*', '', cleaned, flags=re.I).strip()
            if cleaned and len(cleaned) > 3:
                title_cand = cleaned
            elif i > 0:
                prev = clean_txt(paragraphs[i-1].text)
                if prev and len(prev) < 80 and 'OCCUPATIONAL' not in prev.upper():
                    title_cand = prev
                    
            if not current_unit or (current_unit.get('cdacc_code') and cdacc_match and current_unit['cdacc_code'] != clean_txt(cdacc_match.group(1))):
                if current_unit and (current_unit.get('cdacc_code') or current_unit.get('isced_code') or current_unit.get('elements')):
                    os_units.append(current_unit)
                current_unit = {
                    "source_file": os.path.basename(file_path),
                    "department": department,
                    "course": course_title,
                    "level": default_level,
                    "title": title_cand or "Unit of Competence",
                    "isced_code": clean_txt(isced_match.group(1)) if isced_match else "",
                    "cdacc_code": clean_txt(cdacc_match.group(1)) if cdacc_match else "",
                    "description": "",
                    "elements": [],
                    "critical_aspects": [],
                    "resources_required": []
                }
            else:
                if isced_match and not current_unit.get("isced_code"):
                    current_unit["isced_code"] = clean_txt(isced_match.group(1))
                if cdacc_match and not current_unit.get("cdacc_code"):
                    current_unit["cdacc_code"] = clean_txt(cdacc_match.group(1))
                if title_cand and current_unit["title"] == "Unit of Competence":
                    current_unit["title"] = title_cand

    if current_unit:
        os_units.append(current_unit)

    # Extract Elements and Performance Criteria from Tables!
    # Header usually: ELEMENT | PERFORMANCE CRITERIA
    for t in doc.tables:
        if len(t.rows) < 2: continue
        hdr = [clean_txt(c.text).lower() for c in t.rows[0].cells]
        hdr_str = " ".join(hdr)
        
        if 'element' in hdr_str and ('performance criteria' in hdr_str or 'criteria' in hdr_str):
            elements_map = {}
            for r in t.rows[1:]:
                cells = [clean_txt(c.text) for c in r.cells]
                if len(cells) < 2: continue
                elem_txt = cells[0]
                crit_txt = cells[1]
                if not crit_txt: continue
                
                # Check if elem_txt is header repetition
                if 'element' in elem_txt.lower() and len(elem_txt) < 15:
                    continue
                
                # Group criteria by element
                if elem_txt and elem_txt not in elements_map:
                    elements_map[elem_txt] = []
                
                # Criteria might have multiple lines (1.1, 1.2...)
                crit_lines = [clean_txt(l) for l in crit_txt.split('\n') if clean_txt(l)]
                if not crit_lines:
                    crit_lines = [crit_txt]
                
                if elem_txt:
                    elements_map[elem_txt].extend(crit_lines)
                elif elements_map:
                    last_key = list(elements_map.keys())[-1]
                    elements_map[last_key].extend(crit_lines)
            
            # Format elements list
            elem_list = []
            for e_title, pc_list in elements_map.items():
                # deduplicate performance criteria
                unique_pc = []
                for pc in pc_list:
                    if pc not in unique_pc: unique_pc.append(pc)
                elem_list.append({
                    "element_title": e_title,
                    "performance_criteria": unique_pc
                })
                
            # Assign to the corresponding unit in os_units
            if os_units:
                for u in os_units:
                    if not u["elements"]:
                        u["elements"] = elem_list
                        break
                        
        elif 'resource implications' in hdr_str or 'resources' in hdr_str or 'critical aspects' in hdr_str:
            # Additional metadata
            pass

    print(f"    Extracted {len(os_units)} OS units with elements.")
    return os_units

if __name__ == '__main__':
    currs = parse_docx_curriculum(r'D:\Curriculum and OS\Cycle 3\ICT6\6 Curriculum (1).docx', 'Computing and Informatics', 'Diploma in ICT Level 6', 6)
    os_units = parse_docx_os(r'D:\Curriculum and OS\Cycle 3\ICT6\6 Occupation Standards.docx', 'Computing and Informatics', 'Diploma in ICT Level 6', 6)
    print("Curriculum units:", len(currs))
    for c in currs[:3]:
        print("  Unit:", c['title'], "CDACC:", c['cdacc_code'], "Outcomes count:", len(c['learning_outcomes']))
        for lo in c['learning_outcomes'][:2]:
            print("     LO:", lo['title'], "Content topics count:", len(lo['content']))
    print("OS units:", len(os_units))
    for o in os_units[:3]:
        print("  Unit:", o['title'], "CDACC:", o['cdacc_code'], "Elements count:", len(o['elements']))
