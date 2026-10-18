/**
 * Client-Side TVET CDACC Word Document (.doc/.docx) Generator
 * Mukiria Technical Training Institute (MTTI)
 * Institutional Design System: Maiandra GD typography, CDACC Compliance Table Layout
 */

import type { ExamPayload, ExamQuestion } from "@/lib/supabase";

export interface ExportExamWordParams {
  unitCode: string;
  courseName: string;
  unitName: string;
  classCode: string;
  series: string;
  payload: ExamPayload;
}

export function generateExamWordHtml(params: ExportExamWordParams): string {
  const {
    unitCode = "061155101A",
    courseName = "ICT TECHNICIAN LEVEL 6",
    unitName = "CONTINUOUS ASSESSMENT",
    classCode = "ALL COHORTS",
    series = "MAY-AUG 2026",
    payload,
  } = params;

  const title = payload.title || `${unitCode} — Assessment`;
  const duration = payload.duration_minutes || 90;
  const totalMarks = payload.total_marks || 100;
  const taskCode = payload.task_code || "CT1";
  const assessmentCategory = payload.assessment_category || "CAT";
  const isPractical = payload.type === "practical" || (payload as any).is_practical === true;

  const escapeHtml = (str: string = "") =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const instructionsList = payload.instructions
    ? payload.instructions.split("\n").filter((l) => l.trim().length > 0)
    : [
        "Answer ALL questions in Section A and ANY TWO questions in Section B.",
        "Candidates should check the question paper to ascertain that all pages are printed as indicated.",
        "Mobile phones and unauthorized electronic materials are NOT allowed in the examination room.",
        "Write your Admission Number and Registration Code clearly on every page.",
      ];

  const sectionA = payload.section_a;
  const sectionB = payload.section_b;
  const checklistItems = (payload as any).checklist_items || [];

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 21.0cm 29.7cm; /* A4 */
      margin: 2.0cm 2.0cm 2.0cm 2.0cm;
      mso-header-margin: 1.0cm;
      mso-footer-margin: 1.0cm;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: 'Maiandra GD', Calibri, 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #000000;
    }
    .form-number {
      text-align: right;
      font-size: 9.5pt;
      font-weight: bold;
      color: #333333;
      margin-bottom: 2pt;
    }
    .header-box {
      text-align: center;
      margin-bottom: 12pt;
      border-bottom: 2pt solid #000953;
      padding-bottom: 6pt;
    }
    .institution-title {
      font-size: 15pt;
      font-weight: bold;
      color: #000953;
      margin: 0 0 2pt 0;
      letter-spacing: 0.5pt;
    }
    .sub-title {
      font-size: 11pt;
      font-weight: bold;
      color: #333333;
      margin: 0 0 4pt 0;
      text-transform: uppercase;
    }
    .exam-title-badge {
      font-size: 12pt;
      font-weight: bold;
      color: #c48820;
      margin: 2pt 0;
    }
    table.meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12pt;
      font-size: 10pt;
    }
    table.meta-table td {
      border: 1pt solid #000000;
      padding: 4pt 6pt;
      vertical-align: top;
    }
    .meta-label {
      font-weight: bold;
      color: #000953;
      width: 22%;
      background-color: #f8fafc;
    }
    .meta-val {
      font-weight: normal;
      color: #000000;
      width: 28%;
    }
    .instructions-card {
      border: 1.5pt solid #000953;
      background-color: #fafbfc;
      padding: 8pt 10pt;
      margin-bottom: 14pt;
    }
    .instructions-card h4 {
      margin: 0 0 4pt 0;
      font-size: 10.5pt;
      font-weight: bold;
      color: #000953;
      text-transform: uppercase;
    }
    .instructions-card ol {
      margin: 0;
      padding-left: 18pt;
      font-size: 9.5pt;
    }
    .instructions-card li {
      margin-bottom: 2pt;
    }
    .section-banner {
      background-color: #000953;
      color: #ffffff;
      font-weight: bold;
      font-size: 11pt;
      padding: 4pt 8pt;
      margin-top: 14pt;
      margin-bottom: 6pt;
      border: 1pt solid #000953;
    }
    .section-instructions {
      font-style: italic;
      font-size: 9.5pt;
      color: #333333;
      margin-bottom: 8pt;
      padding-left: 2pt;
    }
    .question-block {
      margin-bottom: 12pt;
      page-break-inside: avoid;
    }
    .question-head {
      font-weight: bold;
      margin-bottom: 3pt;
    }
    .marks-badge {
      float: right;
      font-weight: bold;
      color: #000953;
    }
    .mcq-options {
      margin-left: 20pt;
      margin-top: 4pt;
      margin-bottom: 6pt;
    }
    .mcq-opt {
      margin-bottom: 2pt;
      font-size: 10pt;
    }
    .ruled-space {
      margin-top: 8pt;
      border-bottom: 1pt dotted #999999;
      height: 24pt;
    }
    table.checklist-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8pt;
      margin-bottom: 14pt;
      font-size: 9.5pt;
    }
    table.checklist-table th, table.checklist-table td {
      border: 1pt solid #000000;
      padding: 4pt 6pt;
    }
    table.checklist-table th {
      background-color: #f1f5f9;
      font-weight: bold;
      text-align: center;
      color: #000953;
    }
    .sign-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20pt;
      font-size: 9.5pt;
    }
    .sign-table td {
      border: 1pt solid #000000;
      padding: 6pt;
      vertical-align: top;
      width: 50%;
    }
    .last-page-notice {
      text-align: center;
      font-size: 9pt;
      font-weight: bold;
      color: #555555;
      margin-top: 18pt;
      border-top: 1pt solid #cccccc;
      padding-top: 4pt;
      letter-spacing: 1pt;
    }
  </style>
</head>
<body>
<div class="Section1">
  <div class="form-number">Form MTTI/F/CUR/08</div>
  
  <div class="header-box">
    <div class="institution-title">MUKIRIA TECHNICAL TRAINING INSTITUTE</div>
    <div class="sub-title">DEPARTMENT OF COMPUTING & INFORMATICS / TECHNICAL EDUCATION</div>
    <div class="exam-title-badge">${escapeHtml(taskCode)} — ${escapeHtml(assessmentCategory)} EXAMINATION</div>
    <div style="font-size: 10.5pt; font-weight: bold; color: #1e293b;">${escapeHtml(title)}</div>
  </div>

  <table class="meta-table">
    <tr>
      <td class="meta-label">Course / Program:</td>
      <td class="meta-val">${escapeHtml(courseName)}</td>
      <td class="meta-label">Assessment Series:</td>
      <td class="meta-val">${escapeHtml(series)}</td>
    </tr>
    <tr>
      <td class="meta-label">Unit Code:</td>
      <td class="meta-val"><strong>${escapeHtml(unitCode)}</strong></td>
      <td class="meta-label">Class / Cohort:</td>
      <td class="meta-val">${escapeHtml(classCode)}</td>
    </tr>
    <tr>
      <td class="meta-label">Unit Title:</td>
      <td class="meta-val">${escapeHtml(unitName || courseName)}</td>
      <td class="meta-label">Time Allowed:</td>
      <td class="meta-val"><strong>${duration} Minutes</strong> (${(duration / 60).toFixed(1)} hrs)</td>
    </tr>
    <tr>
      <td class="meta-label">Task Code:</td>
      <td class="meta-val">${escapeHtml(taskCode)}</td>
      <td class="meta-label">Maximum Score:</td>
      <td class="meta-val"><strong>${totalMarks} Marks (100%)</strong></td>
    </tr>
  </table>

  <div class="instructions-card">
    <h4>Instructions to Candidates</h4>
    <ol>
      ${instructionsList.map((inst) => `<li>${escapeHtml(inst)}</li>`).join("\n      ")}
    </ol>
  </div>

  ${
    isPractical
      ? `
  <div class="section-banner">PRACTICAL PERFORMANCE ASSESSMENT &amp; OBSERVATION CHECKLIST</div>
  <div class="section-instructions">
    Perform the practical task described below in accordance with workplace safety and standard operating procedures. The assessor will evaluate your performance using the CDACC Observation Checklist.
  </div>

  <div class="question-block" style="border: 1pt solid #cbd5e1; padding: 8pt; background-color: #f8fafc; margin-bottom: 12pt;">
    <strong>Practical Task Brief / Work Assignment:</strong>
    <p style="margin: 4pt 0;">${escapeHtml(payload.instructions || "Execute the required technical practical assignment using the designated workshop equipment, tools, and materials.")}</p>
  </div>

  <table class="checklist-table">
    <thead>
      <tr>
        <th style="width: 6%;">S/N</th>
        <th style="width: 54%;">Performance Criteria / Observable Task Step</th>
        <th style="width: 12%;">Critical Aspect</th>
        <th style="width: 14%;">Max Marks</th>
        <th style="width: 14%;">Score Attained</th>
      </tr>
    </thead>
    <tbody>
      ${
        checklistItems.length > 0
          ? checklistItems
              .map(
                (item: any, idx: number) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
        <td>${escapeHtml(item.step || item.criteria || item.text || `Performance Step ${idx + 1}`)}</td>
        <td style="text-align: center; font-size: 8.5pt;">${escapeHtml(item.critical_aspect || item.critical ? "YES" : "No")}</td>
        <td style="text-align: center; font-weight: bold;">${item.marks || Math.round(totalMarks / Math.max(checklistItems.length, 1))}</td>
        <td></td>
      </tr>`
              )
              .join("\n")
          : `
      <tr>
        <td style="text-align: center; font-weight: bold;">1</td>
        <td>Preparation of workspace, personal protective equipment (PPE), and tool verification.</td>
        <td style="text-align: center; font-size: 8.5pt;">YES</td>
        <td style="text-align: center; font-weight: bold;">10</td>
        <td></td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: bold;">2</td>
        <td>Adherence to occupational health and safety regulations throughout execution.</td>
        <td style="text-align: center; font-size: 8.5pt;">YES</td>
        <td style="text-align: center; font-weight: bold;">15</td>
        <td></td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: bold;">3</td>
        <td>Correct configuration, assembly, and functional testing according to specification.</td>
        <td style="text-align: center; font-size: 8.5pt;">YES</td>
        <td style="text-align: center; font-weight: bold;">45</td>
        <td></td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: bold;">4</td>
        <td>Troubleshooting, diagnostics, and quality inspection of finished output.</td>
        <td style="text-align: center; font-size: 8.5pt;">YES</td>
        <td style="text-align: center; font-weight: bold;">20</td>
        <td></td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: bold;">5</td>
        <td>Housekeeping, safe shutdown, tool restoration, and waste management.</td>
        <td style="text-align: center; font-size: 8.5pt;">No</td>
        <td style="text-align: center; font-weight: bold;">10</td>
        <td></td>
      </tr>
      `
      }
    </tbody>
  </table>
  `
      : `
  <!-- Section A -->
  ${
    sectionA && sectionA.questions && sectionA.questions.length > 0
      ? `
  <div class="section-banner">
    ${escapeHtml(sectionA.title || "SECTION A: MULTIPLE CHOICE & SHORT STRUCTURED QUESTIONS")} 
    <span style="float: right;">(${sectionA.total_marks || 40} MARKS)</span>
  </div>
  <div class="section-instructions">
    ${escapeHtml(sectionA.instructions || "Answer ALL questions in this section. Circle or mark the most appropriate answer.")}
  </div>

  ${sectionA.questions
    .map((q: ExamQuestion, idx: number) => {
      const qNum = idx + 1;
      const qMarks = q.marks || 2;
      return `
  <div class="question-block">
    <div class="question-head">
      <span class="marks-badge">[${qMarks} Marks]</span>
      <strong>${qNum}.</strong> ${escapeHtml(q.text || `Question ${qNum}`)}
    </div>
    ${
      q.options && q.options.length > 0
        ? `
    <div class="mcq-options">
      ${q.options
        .map((opt: string, optIdx: number) => {
          const letter = String.fromCharCode(65 + optIdx);
          return `<div class="mcq-opt"><strong>(${letter})</strong> ${escapeHtml(opt)}</div>`;
        })
        .join("\n      ")}
    </div>
    `
        : `
    <div class="ruled-space"></div>
    <div class="ruled-space"></div>
    `
    }
  </div>`;
    })
    .join("\n")}
  `
      : ""
  }

  <!-- Section B -->
  ${
    sectionB && sectionB.questions && sectionB.questions.length > 0
      ? `
  <div class="section-banner" style="margin-top: 18pt;">
    ${escapeHtml(sectionB.title || "SECTION B: EXTENDED STRUCTURED & APPLICATION QUESTIONS")} 
    <span style="float: right;">(${sectionB.total_marks || 60} MARKS)</span>
  </div>
  <div class="section-instructions">
    ${escapeHtml(sectionB.instructions || "Answer ANY TWO questions in this section. Write your answers clearly in the spaces provided.")}
  </div>

  ${sectionB.questions
    .map((q: ExamQuestion, idx: number) => {
      const qNum = (sectionA?.questions?.length || 0) + idx + 1;
      const qMarks = q.marks || 30;
      return `
  <div class="question-block">
    <div class="question-head">
      <span class="marks-badge">[${qMarks} Marks]</span>
      <strong>QUESTION ${qNum}:</strong>
    </div>
    <p style="margin: 3pt 0 6pt 0;">${escapeHtml(q.text || `Structured problem question ${qNum}`)}</p>
    <div class="ruled-space"></div>
    <div class="ruled-space"></div>
    <div class="ruled-space"></div>
    <div class="ruled-space"></div>
  </div>`;
    })
    .join("\n")}
  `
      : ""
  }
  `
  }

  <!-- Official Sign-off Table -->
  <table class="sign-table">
    <tr>
      <td>
        <strong>PREPARED &amp; ASSESSED BY:</strong><br><br>
        Trainer Name: Alexander Kinoti<br>
        Signature: ___________________________<br>
        Date: ${new Date().toLocaleDateString("en-GB")}
      </td>
      <td>
        <strong>INTERNAL VERIFIER / HOD APPROVAL:</strong><br><br>
        Head of Department: ___________________<br>
        Signature: ___________________________<br>
        Date: _______________________________
      </td>
    </tr>
  </table>

  <div class="last-page-notice">
    *** THIS IS THE LAST PRINTED PAGE OF THE EXAMINATION PAPER ***
  </div>
</div>
</body>
</html>`;
}

export function exportExamDocumentClientSide(params: ExportExamWordParams): { filename: string; success: boolean } {
  const htmlContent = generateExamWordHtml(params);
  const blob = new Blob(["\ufeff", htmlContent], {
    type: "application/msword;charset=utf-8",
  });

  const safeUnit = (params.unitCode || "EXAM").replace(/[^a-zA-Z0-9_-]/g, "_");
  const taskCode = (params.payload.task_code || "Assessment").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `MTTI_Exam_${safeUnit}_${taskCode}.doc`;

  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);

  return { filename, success: true };
}
