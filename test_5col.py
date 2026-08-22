import sys, docx
from docx.shared import Inches

doc = docx.Document()
section = doc.sections[0]
section.top_margin    = docx.shared.Inches(0.6)
section.bottom_margin = docx.shared.Inches(0.6)
section.left_margin   = docx.shared.Inches(0.8)
section.right_margin  = docx.shared.Inches(0.8)

tbl = doc.add_table(rows=5, cols=5)
tbl.style = 'Table Grid'

widths = [Inches(0.69), Inches(0.69), Inches(2.07), Inches(2.07), Inches(1.38)]
for row in tbl.rows:
    for idx, width in enumerate(widths):
        row.cells[idx].width = width

tbl.rows[0].cells[0].text = "Date"
tbl.rows[0].cells[0].merge(tbl.rows[0].cells[2])

tbl.rows[0].cells[3].text = "Time"
tbl.rows[0].cells[3].merge(tbl.rows[0].cells[4])

tbl.rows[1].cells[0].text = "Time (in minutes)"
tbl.rows[1].cells[0].merge(tbl.rows[1].cells[1])

tbl.rows[1].cells[2].text = "Trainer Activity"
tbl.rows[1].cells[3].text = "Learner Activity"
tbl.rows[1].cells[4].text = "Assessment"

doc.save("test_5col.docx")
print("Saved 5col docx")
