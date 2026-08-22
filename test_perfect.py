import sys, os, io, docx, json

def build_perfect_docx():
    doc = docx.Document()
    section = doc.sections[0]
    section.top_margin    = docx.shared.Inches(0.6)
    section.bottom_margin = docx.shared.Inches(0.6)
    section.left_margin   = docx.shared.Inches(0.8)
    section.right_margin  = docx.shared.Inches(0.8)

    style = doc.styles['Normal']
    style.font.name = 'Maiandra GD'
    style.font.size = docx.shared.Pt(11)

    p_code = doc.add_paragraph()
    p_code.alignment = 2 # Right
    p_code.add_run("MTTI/F/CUR/05").bold = True

    p_hdr = doc.add_paragraph()
    p_hdr.alignment = 1 # Center
    r_inst = p_hdr.add_run("MUKIRIA TECHNICAL TRAINING INSTITUTE\n")
    r_inst.bold = True
    r_inst.font.size = docx.shared.Pt(14)
    
    r_sp = p_hdr.add_run("SESSION PLAN")
    r_sp.bold = True

    # 4 columns
    n_step_rows = 2
    total_rows = 15 + n_step_rows + 8
    tbl = doc.add_table(rows=total_rows, cols=4)
    tbl.style = 'Table Grid'

    def _set_labeled_cell(cell, label, value=""):
        cell.text = ""
        p = cell.paragraphs[0]
        run_label = p.add_run(label)
        run_label.bold = True
        run_label.font.name = 'Maiandra GD'
        if value:
            run_val = p.add_run(" " + str(value))
            run_val.font.name = 'Maiandra GD'

    def _set_header_cell(cell, text, fill="D9D9D9", align=None):
        cell.text = ""
        p = cell.paragraphs[0]
        if align is not None:
            p.alignment = align
        run = p.add_run(text)
        run.bold = True
        run.font.name = 'Maiandra GD'
        if fill:
            from docx.oxml.ns import nsdecls
            from docx.oxml import parse_xml
            tcPr = cell._tc.get_or_add_tcPr()
            shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill}"/>')
            tcPr.append(shd)

    def _merge(row, start_col, end_col):
        row.cells[start_col].merge(row.cells[end_col])

    # Row 0
    _set_labeled_cell(tbl.rows[0].cells[0], "Date:", "14/07/2026")
    _merge(tbl.rows[0], 0, 1)
    _set_labeled_cell(tbl.rows[0].cells[2], "Time:", "8AM - 10AM")
    _merge(tbl.rows[0], 2, 3)

    # Row 1
    _set_labeled_cell(tbl.rows[1].cells[0], "Week:", "1")
    _merge(tbl.rows[1], 0, 1)
    # Merge Time vertically
    tbl.rows[0].cells[2].merge(tbl.rows[1].cells[2])

    # Row 2
    _set_labeled_cell(tbl.rows[2].cells[0], "Trainer name:", "Alex")
    _merge(tbl.rows[2], 0, 1)
    _set_labeled_cell(tbl.rows[2].cells[2], "Department:", "Computing")
    _merge(tbl.rows[2], 2, 3)

    # Row 3, 4, 5
    _set_labeled_cell(tbl.rows[3].cells[0], "Unit of Competence:", "Graphic Design")
    _merge(tbl.rows[3], 0, 1)
    tbl.rows[3].cells[0].merge(tbl.rows[4].cells[0])
    tbl.rows[3].cells[0].merge(tbl.rows[5].cells[0])

    _set_labeled_cell(tbl.rows[3].cells[2], "Level:", "6")
    _merge(tbl.rows[3], 2, 3)
    _set_labeled_cell(tbl.rows[4].cells[2], "Class:", "ITECH")
    _merge(tbl.rows[4], 2, 3)
    _set_labeled_cell(tbl.rows[5].cells[2], "Number of Trainees:", "20")
    _merge(tbl.rows[5], 2, 3)

    # Row 6, 7
    _set_labeled_cell(tbl.rows[6].cells[0], "Unit Code:", "ICT/11")
    _merge(tbl.rows[6], 0, 3)
    _set_labeled_cell(tbl.rows[7].cells[0], "Session Title:", "Intro")
    _merge(tbl.rows[7], 0, 3)

    # Row 8
    _set_labeled_cell(tbl.rows[8].cells[0], "Learning outcome(s)")
    _merge(tbl.rows[8], 0, 1)
    _set_labeled_cell(tbl.rows[8].cells[2], "By the end of the session the learner should be able to;\n", "- Point 1")
    _merge(tbl.rows[8], 2, 3)

    # Row 9, 10
    _set_labeled_cell(tbl.rows[9].cells[0], "Resources (references, and learning aids)")
    _merge(tbl.rows[9], 0, 1)
    _merge(tbl.rows[9], 2, 3)
    tbl.rows[9].cells[2].text = "Books"
    
    _set_labeled_cell(tbl.rows[10].cells[0], "Safety requirements")
    _merge(tbl.rows[10], 0, 1)
    _merge(tbl.rows[10], 2, 3)
    tbl.rows[10].cells[2].text = "Safety rules"

    # Row 11, 12, 13
    _set_header_cell(tbl.rows[11].cells[0], "Session presentation", align=1)
    _merge(tbl.rows[11], 0, 3)

    _set_header_cell(tbl.rows[12].cells[0], "1. Introduction", align=0)
    _merge(tbl.rows[12], 0, 3)
    tbl.rows[12].cells[0].paragraphs[0].add_run("\nContent here")

    _set_header_cell(tbl.rows[13].cells[0], "2. Session Delivery", align=0)
    _merge(tbl.rows[13], 0, 3)

    # Row 14 headers
    headers = ["Time (in minutes)", "Trainer Activity", "Learner Activity", "Learning Check/Assessment"]
    for i, h in enumerate(headers):
        _set_labeled_cell(tbl.rows[14].cells[i], h)

    # Steps (15, 16)
    for i in range(2):
        row = tbl.rows[15+i]
        row.cells[0].text = "30"
        row.cells[1].text = "Teach"
        row.cells[2].text = "Learn"
        row.cells[3].text = "Quiz"

    footer_start = 15 + n_step_rows

    # Row 15+n: Review Header
    _set_header_cell(tbl.rows[footer_start].cells[0], "3. Session review", align=0)
    _merge(tbl.rows[footer_start], 0, 3)

    # Row 15+n+1: Review Content
    tbl.rows[footer_start+1].cells[0].text = "Review text"
    _merge(tbl.rows[footer_start+1], 0, 3)

    # Row 15+n+2: Assignment Header
    _set_header_cell(tbl.rows[footer_start+2].cells[0], "Assignment:", align=0)
    _merge(tbl.rows[footer_start+2], 0, 3)

    # Row 15+n+3: Assignment Content
    tbl.rows[footer_start+3].cells[0].text = "Assignment text"
    _merge(tbl.rows[footer_start+3], 0, 3)

    # Row 15+n+4: TOTAL TIME
    _set_header_cell(tbl.rows[footer_start+4].cells[0], "TOTAL TIME: 60 Minutes", fill=None, align=1)
    _merge(tbl.rows[footer_start+4], 0, 3)

    # Row 15+n+5: Session reflection
    _set_header_cell(tbl.rows[footer_start+5].cells[0], "Session reflection", fill=None, align=0)
    _merge(tbl.rows[footer_start+5], 0, 3)

    # Row 15+n+6: Reflection Content
    tbl.rows[footer_start+6].cells[0].text = "Reflection text"
    _merge(tbl.rows[footer_start+6], 0, 3)

    # Row 15+n+7: Signature
    _set_labeled_cell(tbl.rows[footer_start+7].cells[0], "Signature:", "Alex")
    _merge(tbl.rows[footer_start+7], 0, 3)

    doc.save('test_perfect.docx')
    print("test_perfect.docx saved.")

build_perfect_docx()
