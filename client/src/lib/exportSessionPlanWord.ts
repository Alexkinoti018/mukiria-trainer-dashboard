/**
 * Client-Side TVET CDACC Session Plan Word (.doc) Generator
 * Form MTTI/F/CUR/05 - Mukiria Technical Training Institute
 */

export interface SessionPlanPayload {
  date?: string;
  time_duration?: string;
  week_number?: string | number;
  session_no?: string | number;
  trainer_name?: string;
  department?: string;
  unit_name?: string;
  unit_code?: string;
  level?: string | number;
  class_code?: string;
  trainees_count?: string | number;
  session_title?: string;
  learning_outcomes?: string[];
  resources?: string[];
  safety_requirements?: string;
  introduction?: string;
  delivery_steps?: Array<{
    time_minutes: string | number;
    trainer_activity: string;
    learner_activity: string;
    assessment: string;
  }>;
  session_review?: string;
  assignment?: string;
  total_time?: string;
  reflection?: string;
  signature_date?: string;
}

export function exportSessionPlanWordClientSide(plan: SessionPlanPayload): { filename: string; success: boolean } {
  const safeUnit = (plan.unit_code || "UNIT").replace(/[^a-zA-Z0-9_-]/g, "_");
  const weekNo = plan.week_number || "1";
  const filename = `MTTI_CUR05_SessionPlan_W${weekNo}_${safeUnit}.doc`;

  const escapeHtml = (str: string = "") =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const steps = plan.delivery_steps || [];
  const totalMins = steps.reduce((sum, s) => sum + (Number(s.time_minutes) || 0), 0);
  const totalTimeStr = plan.total_time || `${totalMins} min`;

  const outcomesHtml = (plan.learning_outcomes && plan.learning_outcomes.length > 0)
    ? plan.learning_outcomes.map(o => `<div>&#9633; ${escapeHtml(o)}</div>`).join("")
    : `<div>&#9633; Apply required competence standards in practical workshop environment.</div>`;

  const resourcesHtml = (plan.resources && plan.resources.length > 0)
    ? plan.resources.map(r => `<div>&#9633; ${escapeHtml(r)}</div>`).join("")
    : `<div>&#9633; CDACC Occupational Standards &amp; Curriculum Guides</div><div>&#9633; Workshop tools, trainer manuals, and workstations</div>`;

  const stepsHtml = steps.length > 0
    ? steps.map(s => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${escapeHtml(String(s.time_minutes))} min</td>
        <td>${escapeHtml(s.trainer_activity || "")}</td>
        <td>${escapeHtml(s.learner_activity || "")}</td>
        <td>${escapeHtml(s.assessment || "")}</td>
      </tr>
    `).join("")
    : `
      <tr>
        <td style="text-align: center; font-weight: bold;">15 min</td>
        <td>Explain core theoretical concepts and safety precautions</td>
        <td>Take notes, review specifications, ask clarifying questions</td>
        <td>Oral questioning &amp; engagement check</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: bold;">45 min</td>
        <td>Demonstrate practical application and guide workstation setups</td>
        <td>Execute practical steps following procedure manual</td>
        <td>Continuous observation &amp; safety compliance</td>
      </tr>
    `;

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Session Plan - Form MTTI/F/CUR/05</title>
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
      size: 21.0cm 29.7cm; /* A4 Portrait */
      margin: 1.5cm 1.8cm 1.5cm 1.8cm;
      mso-header-margin: 1.0cm;
      mso-footer-margin: 1.0cm;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: 'Maiandra GD', Calibri, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.35;
      color: #000000;
    }
    .form-number { text-align: right; font-weight: bold; font-size: 9pt; color: #555555; margin-bottom: 4pt; }
    .header-box { text-align: center; border-bottom: 2pt solid #000953; padding-bottom: 6pt; margin-bottom: 12pt; }
    .institution-name { font-size: 15pt; font-weight: bold; color: #000953; margin: 0 0 2pt 0; text-transform: uppercase; }
    .plan-title { font-size: 13pt; font-weight: bold; color: #c48820; margin: 0; letter-spacing: 1px; }
    table.grid-table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; font-size: 10pt; }
    table.grid-table td, table.grid-table th { border: 1pt solid #000000; padding: 4.5pt 6pt; vertical-align: top; }
    .section-head { background-color: #000953; color: #ffffff; font-weight: bold; font-size: 10.5pt; }
    .subsection-head { background-color: #e2e8f0; font-weight: bold; color: #000953; }
    .lbl { font-weight: bold; color: #000953; width: 22%; background-color: #f8fafc; }
    .val { width: 28%; }
    .step-th { background-color: #f1f5f9; font-weight: bold; color: #000953; text-align: center; }
    .sig-table { width: 100%; border-collapse: collapse; margin-top: 14pt; }
    .sig-table td { border: none; padding: 6pt 4pt; font-size: 10pt; }
  </style>
</head>
<body>
<div class="Section1">
  <div class="form-number">MTTI/F/CUR/05</div>
  
  <div class="header-box">
    <div class="institution-name">MUKIRIA TECHNICAL TRAINING INSTITUTE</div>
    <div class="plan-title">SESSION PLAN</div>
  </div>

  <table class="grid-table">
    <tr>
      <td class="lbl">Date:</td>
      <td class="val">${escapeHtml(plan.date || new Date().toLocaleDateString("en-GB"))}</td>
      <td class="lbl">Time / Duration:</td>
      <td class="val">${escapeHtml(plan.time_duration || "8:00 AM - 10:00 AM")}</td>
    </tr>
    <tr>
      <td class="lbl">Week:</td>
      <td class="val">Week ${escapeHtml(String(weekNo))}</td>
      <td class="lbl">Session No:</td>
      <td class="val">Session ${escapeHtml(String(plan.session_no || "1"))}</td>
    </tr>
    <tr>
      <td class="lbl">Trainer Name:</td>
      <td class="val"><strong>${escapeHtml(plan.trainer_name || "Alexander Kinoti")}</strong></td>
      <td class="lbl">Department:</td>
      <td class="val">${escapeHtml(plan.department || "Computing & Informatics")}</td>
    </tr>
    <tr>
      <td class="lbl">Unit of Competence:</td>
      <td class="val" colspan="3"><strong>${escapeHtml(plan.unit_name || "")}</strong> (${escapeHtml(plan.unit_code || "")})</td>
    </tr>
    <tr>
      <td class="lbl">Level:</td>
      <td class="val">Level ${escapeHtml(String(plan.level || "6"))}</td>
      <td class="lbl">Class / Cohort:</td>
      <td class="val">${escapeHtml(plan.class_code || "")}</td>
    </tr>
    <tr>
      <td class="lbl">No. of Trainees:</td>
      <td class="val">${escapeHtml(String(plan.trainees_count || 20))}</td>
      <td class="lbl">Session Title:</td>
      <td class="val"><strong>${escapeHtml(plan.session_title || "")}</strong></td>
    </tr>
    <tr>
      <td class="lbl">Learning Outcome(s):</td>
      <td colspan="3">
        <div style="font-style: italic; margin-bottom: 4pt; color: #334155;">By the end of the session, the trainee should be able to:</div>
        ${outcomesHtml}
      </td>
    </tr>
    <tr>
      <td class="lbl">Resources &amp; Aids:</td>
      <td colspan="3">${resourcesHtml}</td>
    </tr>
    <tr>
      <td class="lbl">Safety Requirements:</td>
      <td colspan="3">&#9633; ${escapeHtml(plan.safety_requirements || "Adhere strictly to workshop safety guidelines, wear ESD gear, and observe electrical grounding standards.")}</td>
    </tr>
    <tr>
      <td class="section-head" colspan="4" style="text-align: center;">SESSION PRESENTATION</td>
    </tr>
    <tr>
      <td class="subsection-head" colspan="4">1. Introduction (Recap, Relevance &amp; Motivation)</td>
    </tr>
    <tr>
      <td colspan="4" style="padding: 6pt 8pt;">${escapeHtml(plan.introduction || "Review prior session outcomes and establish industrial context of today's learning elements.")}</td>
    </tr>
    <tr>
      <td class="subsection-head" colspan="4">2. Session Delivery</td>
    </tr>
    <tr>
      <th class="step-th" style="width: 15%;">Time</th>
      <th class="step-th" style="width: 35%;">Trainer Activity</th>
      <th class="step-th" style="width: 25%;">Learner Activity</th>
      <th class="step-th" style="width: 25%;">Assessment / Check</th>
    </tr>
    ${stepsHtml}
    <tr>
      <td class="subsection-head" colspan="4">3. Session Review &amp; Synthesis</td>
    </tr>
    <tr>
      <td colspan="4" style="padding: 6pt 8pt;">${escapeHtml(plan.session_review || "Summarize key elements achieved, provide feedback on student observations, and clarify queries.")}</td>
    </tr>
    <tr>
      <td class="subsection-head" colspan="4">Assignment / Extended Practice</td>
    </tr>
    <tr>
      <td colspan="4" style="padding: 6pt 8pt; font-style: italic;">${escapeHtml(plan.assignment || "Complete lab portfolio tasks and prepare for subsequent practical competency demonstration.")}</td>
    </tr>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <td colspan="2" style="text-align: right; color: #000953;">TOTAL SESSION TIME:</td>
      <td colspan="2" style="color: #000953;">${escapeHtml(totalTimeStr)}</td>
    </tr>
    <tr>
      <td class="subsection-head" colspan="4">Trainer's Self-Reflection &amp; Remarks</td>
    </tr>
    <tr>
      <td colspan="4" style="padding: 8pt 8pt; min-height: 40pt;">${escapeHtml(plan.reflection || "The session proceeded successfully. All trainees actively participated in the practical elements and demonstrated required competence benchmarks.")}</td>
    </tr>
  </table>

  <table class="sig-table">
    <tr>
      <td style="width: 50%;">
        <strong>Trainer Signature:</strong> ___________________________<br>
        <span style="font-size: 9pt; color: #555555;">${escapeHtml(plan.trainer_name || "Alexander Kinoti")}</span>
      </td>
      <td style="width: 50%; text-align: right;">
        <strong>Date:</strong> ${escapeHtml(plan.signature_date || new Date().toLocaleDateString("en-GB"))}<br>
        <span style="font-size: 9pt; color: #555555;">Mukiria Technical Training Institute</span>
      </td>
    </tr>
  </table>
</div>
</body>
</html>`;

  try {
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { filename, success: true };
  } catch (err) {
    console.error("Session plan word export failed:", err);
    return { filename, success: false };
  }
}
