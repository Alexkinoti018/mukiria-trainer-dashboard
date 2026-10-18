/**
 * TVET CDACC Official Learning Plan Word (.doc) Exporter
 * Form MTTI/F/CUR/02 / MTTI/F/CUR/01
 * Landscape A4 with 9-Column CDACC Matrix and Maiandra GD Typography
 */

export interface LearningPlanWordExportData {
  institution?: string;
  formNumber?: string;
  unitTitle: string;
  unitCode: string;
  trainerName: string;
  level: string | number;
  classCode: string;
  traineesCount: number;
  dateOfPreparation?: string;
  dateOfRevision?: string;
  skillsSummary?: string[];
  elementsAndPerformanceCriteria?: Array<{
    elementTitle: string;
    criteria: string[];
  }>;
  weeks: Array<{
    week: number;
    sessionNo?: string | number;
    title: string;
    outcome?: string;
    trainerActivities?: string;
    traineeActivities?: string;
    resources?: string;
    assessment?: string;
  }>;
}

export function generateLearningPlanWordHtml(data: LearningPlanWordExportData): string {
  const escapeHtml = (str: string = "") =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const formNo = data.formNumber || "MTTI/F/CUR/02";
  const inst = data.institution || "MUKIRIA TECHNICAL TRAINING INSTITUTE";

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Learning Plan - ${escapeHtml(data.unitCode)}</title>
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
      margin: 1.5cm 1.5cm 1.5cm 1.5cm;
      mso-header-margin: 0.8cm;
      mso-footer-margin: 0.8cm;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: 'Maiandra GD', Calibri, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.25;
      color: #000000;
    }
    .form-code {
      text-align: right;
      font-weight: bold;
      font-size: 9pt;
      margin-bottom: 2pt;
    }
    .header-center {
      text-align: center;
      margin-bottom: 8pt;
    }
    .header-center h1 {
      font-size: 14pt;
      font-weight: bold;
      color: #000953;
      margin: 0 0 2pt 0;
    }
    .header-center h2 {
      font-size: 11pt;
      font-weight: bold;
      color: #333333;
      margin: 0;
    }
    table.meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8pt;
      font-size: 9pt;
    }
    table.meta-table td {
      border: 1pt solid #000000;
      padding: 3pt 5pt;
      vertical-align: top;
    }
    .meta-hdr {
      font-weight: bold;
      background-color: #f1f5f9;
      color: #000953;
      width: 18%;
    }
    .meta-val {
      width: 32%;
    }
    table.lp-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-top: 6pt;
      margin-bottom: 12pt;
    }
    table.lp-table th, table.lp-table td {
      border: 1pt solid #000000;
      padding: 3pt 4pt;
      vertical-align: top;
    }
    table.lp-table th {
      background-color: #e2e8f0;
      font-weight: bold;
      color: #000953;
      text-align: center;
    }
    .sign-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10pt;
      font-size: 9pt;
    }
    .sign-table td {
      border: 1pt solid #000000;
      padding: 5pt;
      vertical-align: top;
      width: 50%;
    }
  </style>
</head>
<body>
<div class="Section1">
  <div class="form-code">Form ${escapeHtml(formNo)}</div>

  <div class="header-center">
    <h1>${escapeHtml(inst)}</h1>
    <h2>LEARNING PLAN / SCHEME OF WORK</h2>
    <div style="font-weight: bold; font-size: 10pt; color: #c48820; margin-top: 2pt;">
      UNIT: ${escapeHtml(data.unitTitle)} (${escapeHtml(data.unitCode)})
    </div>
  </div>

  <table class="meta-table">
    <tr>
      <td class="meta-hdr">Institution:</td>
      <td class="meta-val">${escapeHtml(inst)}</td>
      <td class="meta-hdr">Trainer Name:</td>
      <td class="meta-val"><strong>${escapeHtml(data.trainerName)}</strong></td>
    </tr>
    <tr>
      <td class="meta-hdr">Unit of Competence:</td>
      <td class="meta-val"><strong>${escapeHtml(data.unitTitle)}</strong></td>
      <td class="meta-hdr">Unit Code:</td>
      <td class="meta-val"><strong>${escapeHtml(data.unitCode)}</strong></td>
    </tr>
    <tr>
      <td class="meta-hdr">Level:</td>
      <td class="meta-val">Level ${escapeHtml(String(data.level))}</td>
      <td class="meta-hdr">Class / Cohort:</td>
      <td class="meta-val">${escapeHtml(data.classCode)}</td>
    </tr>
    <tr>
      <td class="meta-hdr">No. of Trainees:</td>
      <td class="meta-val">${data.traineesCount || 53}</td>
      <td class="meta-hdr">Date of Prep / Rev:</td>
      <td class="meta-val">${escapeHtml(data.dateOfPreparation || "MAY 2026")}</td>
    </tr>
  </table>

  <table class="lp-table">
    <thead>
      <tr>
        <th style="width: 5%;">Week</th>
        <th style="width: 7%;">Session</th>
        <th style="width: 16%;">Session Title</th>
        <th style="width: 18%;">Learning Outcomes</th>
        <th style="width: 17%;">Trainer Activities</th>
        <th style="width: 17%;">Trainee Activities</th>
        <th style="width: 10%;">Resources</th>
        <th style="width: 10%;">Assessment</th>
      </tr>
    </thead>
    <tbody>
      ${data.weeks
        .map(
          (w) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${w.week}</td>
        <td style="text-align: center;">${escapeHtml(String(w.sessionNo || "1&2"))}</td>
        <td><strong>${escapeHtml(w.title)}</strong></td>
        <td>${escapeHtml(w.outcome || "")}</td>
        <td>${escapeHtml(w.trainerActivities || "")}</td>
        <td>${escapeHtml(w.traineeActivities || "")}</td>
        <td>${escapeHtml(w.resources || "CDACC Curriculum, Whiteboard, PCs")}</td>
        <td>${escapeHtml(w.assessment || "Oral questions, Observation")}</td>
      </tr>`
        )
        .join("\n")}
    </tbody>
  </table>

  <table class="sign-table">
    <tr>
      <td>
        <strong>PREPARED BY (TRAINER):</strong><br><br>
        Name: ${escapeHtml(data.trainerName)}<br>
        Signature: ___________________________<br>
        Date: ${new Date().toLocaleDateString("en-GB")}
      </td>
      <td>
        <strong>APPROVED BY (HOD / DEAN):</strong><br><br>
        Name: _______________________________<br>
        Signature: ___________________________<br>
        Date: _______________________________
      </td>
    </tr>
  </table>
</div>
</body>
</html>`;
}

export function exportLearningPlanWordClientSide(data: LearningPlanWordExportData): { filename: string; success: boolean } {
  const html = generateLearningPlanWordHtml(data);
  const blob = new Blob(["\ufeff", html], {
    type: "application/msword;charset=utf-8",
  });

  const safeUnit = (data.unitCode || "UNIT").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `MTTI_LearningPlan_${safeUnit}.doc`;

  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);

  return { filename, success: true };
}
