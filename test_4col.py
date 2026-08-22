import sys, docx
from docx.shared import Inches

doc = docx.Document()
section = doc.sections[0]
section.top_margin    = docx.shared.Inches(0.6)
section.bottom_margin = docx.shared.Inches(0.6)
section.left_margin   = docx.shared.Inches(0.8)
section.right_margin  = docx.shared.Inches(0.8)

tbl = doc.add_table(rows=5, cols=4)
tbl.style = 'Table Grid'

widths = [Inches(1.035), Inches(2.415), Inches(1.725), Inches(1.725)]
for row in tbl.rows:
    for idx, width in enumerate(widths):
        row.cells[idx].width = width

tbl.rows[0].cells[0].text = "Date"
tbl.rows[0].cells[0].merge(tbl.rows[0].cells[1]) # Spans col 0, 1 (50%)

tbl.rows[0].cells[2].text = "Time"
tbl.rows[0].cells[2].merge(tbl.rows[0].cells[3]) # Spans col 2, 3 (50%)
tbl.rows[0].cells[2].merge(tbl.rows[1].cells[3]) # Vertical merge

tbl.rows[1].cells[0].text = "Week"
tbl.rows[1].cells[0].merge(tbl.rows[1].cells[1])

tbl.rows[2].cells[0].text = "Time (in minutes)"
tbl.rows[2].cells[1].text = "Trainer Activity"
tbl.rows[2].cells[2].text = "Learner Activity"
tbl.rows[2].cells[3].text = "Assessment"

doc.save("test_4col.docx")
print("Saved 4col docx")
