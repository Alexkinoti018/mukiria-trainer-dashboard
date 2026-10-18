/**
 * Client-Side TVET CDACC HOD Reports & Broadsheets Word (.doc) Generator
 * Mukiria Technical Training Institute (MTTI)
 */

import type { Exam, Submission } from "@/lib/supabase";

export function exportCandidateSlipWord(sub: Submission, exam?: Exam | null): { filename: string; success: boolean } {
  const safeReg = (sub.reg_number || "CANDIDATE").replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeUnit = (sub.unit_code || "UNIT").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `MTTI_ResultSlip_${safeUnit}_${safeReg}.doc`;

  const escapeHtml = (str: string = "") =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const totalScore = sub.total_score ?? 0;
  const isCompetent = totalScore >= 50;
  const statusRemark = isCompetent ? "Competent [C]" : "Not Yet Competent [NYC] / Referral";

  const secAScore = Array.isArray(sub.section_a)
    ? sub.section_a.reduce((s: number, a: any) => s + (Number(a.score ?? a.marks_awarded) || 0), 0)
    : 0;
  const secBScore = Array.isArray(sub.section_b)
    ? sub.section_b.reduce((s: number, a: any) => s + (Number(a.score ?? a.marks_awarded) || 0), 0)
    : 0;

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Candidate Assessment Slip - ${escapeHtml(sub.student_name)}</title>
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
      margin: 2.0cm;
      mso-header-margin: 1.0cm;
      mso-footer-margin: 1.0cm;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: 'Maiandra GD', Calibri, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #000000;
    }
    .form-number { text-align: right; font-weight: bold; font-size: 9pt; color: #555555; }
    .header-box { text-align: center; border-bottom: 2pt solid #000953; padding-bottom: 8pt; margin-bottom: 14pt; }
    .institution-name { font-size: 16pt; font-weight: bold; color: #000953; margin: 0 0 2pt 0; }
    .dept-name { font-size: 11pt; font-weight: bold; color: #333333; margin: 0 0 4pt 0; }
    .slip-title { font-size: 13pt; font-weight: bold; color: #c48820; margin: 0; }
    table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 14pt; font-size: 10.5pt; }
    table.data-table td { border: 1pt solid #000000; padding: 5pt 7pt; }
    .lbl { font-weight: bold; background-color: #f8fafc; color: #000953; width: 25%; }
    .val { width: 25%; }
    .result-box {
      border: 2pt solid ${isCompetent ? "#10b981" : "#ef4444"};
      background-color: ${isCompetent ? "#f0fdf4" : "#fef2f2"};
      padding: 10pt;
      margin-bottom: 16pt;
      text-align: center;
    }
    .result-score { font-size: 22pt; font-weight: bold; color: #000953; margin: 0; }
    .result-status { font-size: 13pt; font-weight: bold; color: ${isCompetent ? "#047857" : "#b91c1c"}; margin-top: 4pt; }
    .sign-table { width: 100%; border-collapse: collapse; margin-top: 20pt; font-size: 9.5pt; }
    .sign-table td { border: 1pt solid #000000; padding: 6pt; width: 50%; vertical-align: top; }
  </style>
</head>
<body>
<div class="Section1">
  <div class="form-number">Form MTTI/F/ASS/04</div>
  
  <div class="header-box">
    <div class="institution-name">MUKIRIA TECHNICAL TRAINING INSTITUTE</div>
    <div class="dept-name">OFFICIAL TVET CDACC ASSESSMENT PERFORMANCE SLIP</div>
    <div class="slip-title">CANDIDATE RESULT RECORD</div>
  </div>

  <table class="data-table">
    <tr>
      <td class="lbl">Candidate Name:</td>
      <td class="val" colspan="3"><strong>${escapeHtml(sub.student_name)}</strong></td>
    </tr>
    <tr>
      <td class="lbl">Registration Code / ADM:</td>
      <td class="val"><strong>${escapeHtml(sub.reg_number)}</strong></td>
      <td class="lbl">Unit Code:</td>
      <td class="val"><strong>${escapeHtml(sub.unit_code)}</strong></td>
    </tr>
    <tr>
      <td class="lbl">Unit Title:</td>
      <td class="val" colspan="3">${escapeHtml(exam?.payload?.title || "Continuous Assessment Unit")}</td>
    </tr>
    <tr>
      <td class="lbl">Section A Score:</td>
      <td class="val">${secAScore} Marks</td>
      <td class="lbl">Section B Score:</td>
      <td class="val">${secBScore} Marks</td>
    </tr>
    <tr>
      <td class="lbl">Assessment Date:</td>
      <td class="val">${sub.created_at ? new Date(sub.created_at).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB")}</td>
      <td class="lbl">Verification Status:</td>
      <td class="val"><strong style="color: #000953;">VERIFIED</strong></td>
    </tr>
  </table>

  <div class="result-box">
    <div class="result-score">Overall Score: ${totalScore}%</div>
    <div class="result-status">${escapeHtml(statusRemark)}</div>
    <div style="font-size: 9.5pt; color: #555555; margin-top: 4pt;">
      Evaluated strictly under TVET CDACC Continuous Formative Assessment Double-Hurdle Benchmarks.
    </div>
  </div>

  <div style="border: 1pt solid #cbd5e1; padding: 8pt; margin-bottom: 14pt; font-size: 10pt; background-color: #f8fafc;">
    <strong>Assessor Feedback &amp; Verification Remarks:</strong><br>
    ${escapeHtml(sub.trainer_comments || "Candidate demonstrated satisfactory understanding of practical and cognitive competence criteria.")}
  </div>

  <table class="sign-table">
    <tr>
      <td>
        <strong>INTERNAL ASSESSOR:</strong><br><br>
        Trainer Name: Alexander Kinoti<br>
        Signature: ___________________________<br>
        Date: ${new Date().toLocaleDateString("en-GB")}
      </td>
      <td>
        <strong>HEAD OF DEPARTMENT / VERIFIER:</strong><br><br>
        Name: _______________________________<br>
        Signature: ___________________________<br>
        Date: _______________________________
      </td>
    </tr>
  </table>
</div>
</body>
</html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
  const urlHelper = typeof window !== "undefined" && window.URL ? window.URL : URL;
  const link = document.createElement("a");
  link.href = urlHelper.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  urlHelper.revokeObjectURL(link.href);

  return { filename, success: true };
}

export function exportBatchBroadsheetWord(params: {
  submissions: Submission[];
  exams: Exam[];
  selectedUnit: string;
  passRate: number;
  gradedCount: number;
}): { filename: string; success: boolean } {
  const { submissions, exams, selectedUnit, passRate, gradedCount } = params;
  const filename = `MTTI_HOD_Institutional_Dossier_${selectedUnit}.doc`;

  const escapeHtml = (str: string = "") =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const totalAvg =
    submissions.filter((s) => s.total_score !== null).length > 0
      ? Math.round(
          submissions.filter((s) => s.total_score !== null).reduce((sum, s) => sum + (s.total_score || 0), 0) /
            submissions.filter((s) => s.total_score !== null).length
        )
      : 0;

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>MTTI Departmental Broadsheet - ${escapeHtml(selectedUnit)}</title>
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
      size: 29.7cm 21.0cm; /* Landscape A4 */
      margin: 1.5cm;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: 'Maiandra GD', Calibri, Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.25;
      color: #000000;
    }
    .header-box { text-align: center; border-bottom: 2pt solid #000953; padding-bottom: 6pt; margin-bottom: 10pt; }
    .institution-name { font-size: 15pt; font-weight: bold; color: #000953; margin: 0; }
    .dept-title { font-size: 11pt; font-weight: bold; color: #333333; margin: 2pt 0; }
    .broadsheet-badge { font-size: 11pt; font-weight: bold; color: #c48820; margin: 0; }
    table.summary-table { width: 100%; border-collapse: collapse; margin-bottom: 10pt; font-size: 9pt; }
    table.summary-table td { border: 1pt solid #000000; padding: 4pt 6pt; }
    .s-lbl { font-weight: bold; background-color: #f1f5f9; color: #000953; width: 18%; }
    .s-val { width: 32%; }
    table.sheet-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 14pt; }
    table.sheet-table th, table.sheet-table td { border: 1pt solid #000000; padding: 3pt 4pt; }
    table.sheet-table th { background-color: #000953; color: #ffffff; font-weight: bold; text-align: center; }
    .sign-table { width: 100%; border-collapse: collapse; margin-top: 14pt; font-size: 9pt; }
    .sign-table td { border: 1pt solid #000000; padding: 6pt; width: 50%; vertical-align: top; }
  </style>
</head>
<body>
<div class="Section1">
  <div style="text-align: right; font-weight: bold; font-size: 8.5pt; color: #555555;">Form MTTI/F/CUR/04</div>
  
  <div class="header-box">
    <div class="institution-name">MUKIRIA TECHNICAL TRAINING INSTITUTE</div>
    <div class="dept-title">DEPARTMENT OF COMPUTING &amp; INFORMATICS / TECHNICAL FACULTY</div>
    <div class="broadsheet-badge">OFFICIAL CONTINUOUS ASSESSMENT BROADSHEET &amp; RESULTS DOSSIER</div>
  </div>

  <table class="summary-table">
    <tr>
      <td class="s-lbl">Unit of Competence:</td>
      <td class="s-val"><strong>${escapeHtml(selectedUnit === "all" ? "All Faculty Units" : selectedUnit)}</strong></td>
      <td class="s-lbl">Academic Series:</td>
      <td class="s-val">MAY-AUG 2026</td>
    </tr>
    <tr>
      <td class="s-lbl">Total Candidates:</td>
      <td class="s-val">${submissions.length} Enrolled</td>
      <td class="s-lbl">Graded Count:</td>
      <td class="s-val">${gradedCount} Assessed</td>
    </tr>
    <tr>
      <td class="s-lbl">Cohort Pass Rate:</td>
      <td class="s-val"><strong>${passRate}% Competent</strong></td>
      <td class="s-lbl">Average Score:</td>
      <td class="s-val"><strong>${totalAvg}% Overall</strong></td>
    </tr>
  </table>

  <table class="sheet-table">
    <thead>
      <tr>
        <th style="width: 4%;">S/N</th>
        <th style="width: 14%;">ADM NO / Reg Code</th>
        <th style="width: 24%;">Candidate Name</th>
        <th style="width: 14%;">Unit Code</th>
        <th style="width: 10%;">Sec A (Marks)</th>
        <th style="width: 10%;">Sec B (Marks)</th>
        <th style="width: 10%;">Total Score</th>
        <th style="width: 14%;">CDACC Status</th>
      </tr>
    </thead>
    <tbody>
      ${submissions
        .map((s, idx) => {
          const secA = Array.isArray(s.section_a)
            ? s.section_a.reduce((acc: number, a: any) => acc + (Number(a.score ?? a.marks_awarded) || 0), 0)
            : "—";
          const secB = Array.isArray(s.section_b)
            ? s.section_b.reduce((acc: number, a: any) => acc + (Number(a.score ?? a.marks_awarded) || 0), 0)
            : "—";
          const score = s.total_score !== null ? `${s.total_score}%` : "Pending";
          const isComp = (s.total_score ?? 0) >= 50;
          const statusText = s.total_score !== null ? (isComp ? "Competent [C]" : "Referral [NYC]") : "Ungraded";
          return `
      <tr>
        <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
        <td style="text-align: center; font-family: monospace;">${escapeHtml(s.reg_number)}</td>
        <td><strong>${escapeHtml(s.student_name)}</strong></td>
        <td style="text-align: center;">${escapeHtml(s.unit_code)}</td>
        <td style="text-align: center;">${secA}</td>
        <td style="text-align: center;">${secB}</td>
        <td style="text-align: center; font-weight: bold;">${score}</td>
        <td style="text-align: center; font-weight: bold; color: ${isComp ? "#047857" : "#b91c1c"};">${escapeHtml(statusText)}</td>
      </tr>`;
        })
        .join("\n")}
    </tbody>
  </table>

  <table class="sign-table">
    <tr>
      <td>
        <strong>PREPARED BY (HEAD OF DEPARTMENT):</strong><br><br>
        Name: Dr. J. Muriithi<br>
        Signature: ___________________________<br>
        Date: ${new Date().toLocaleDateString("en-GB")}
      </td>
      <td>
        <strong>CONFIRMED BY (REGISTRAR ACADEMICS):</strong><br><br>
        Name: _______________________________<br>
        Signature: ___________________________<br>
        Date: _______________________________
      </td>
    </tr>
  </table>
</div>
</body>
</html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
  const urlHelper = typeof window !== "undefined" && window.URL ? window.URL : URL;
  const link = document.createElement("a");
  link.href = urlHelper.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  urlHelper.revokeObjectURL(link.href);

  return { filename, success: true };
}
