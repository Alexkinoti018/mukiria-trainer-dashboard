/**
 * Client-Side TVET CDACC Record of Work (RoW) Book PDF Generator
 * Form MTTI/F/CUR/03
 * Landscape A4 using jsPDF
 */

import jsPDF from "jspdf";
import type { RecordOfWork } from "@/lib/mockSessionPlans";

export function exportRecordOfWorkPdfClientSide(params: {
  trainerName: string;
  department: string;
  term: string;
  records: RecordOfWork[];
}): { filename: string; success: boolean } {
  const { trainerName, department, term, records } = params;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 14;
  let y = margin;

  // Header Box
  doc.setFillColor(0, 9, 83); // Navy #000953
  doc.rect(margin, y, pageWidth - margin * 2, 1.2, "F");
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text("Form MTTI/F/CUR/03", pageWidth - margin, y, { align: "right" });
  y += 4;

  doc.setFontSize(14);
  doc.setTextColor(0, 9, 83);
  doc.text("MUKIRIA TECHNICAL TRAINING INSTITUTE", pageWidth / 2, y, { align: "center" });
  y += 5;

  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`${department.toUpperCase()} — PEDAGOGICAL DOSSIER`, pageWidth / 2, y, { align: "center" });
  y += 5;

  doc.setFontSize(11);
  doc.setTextColor(196, 136, 32); // Gold #c48820
  doc.text("OFFICIAL RECORD OF WORK (RoW) LOGBOOK", pageWidth / 2, y, { align: "center" });
  y += 6;

  // Metadata Strip
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(0, 9, 83);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, pageWidth - margin * 2, 8, "FD");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 9, 83);
  doc.text(`Trainer: ${trainerName}`, margin + 3, y + 5.2);
  doc.text(`Term: ${term}`, margin + 85, y + 5.2);
  doc.text(`Compiled Sessions: ${records.length}`, margin + 160, y + 5.2);
  doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, pageWidth - margin - 3, y + 5.2, { align: "right" });
  y += 12;

  // Table Columns
  // Width: total = 297 - 28 = 269mm
  // Wk: 12, Date: 20, Class/Unit: 38, Hrs: 14, Pres: 14, Work: 90, Reflection: 55, Sig: 26 = 269mm
  const cols = [
    { label: "Wk", w: 12, align: "center" },
    { label: "Date", w: 22, align: "center" },
    { label: "Class & Unit Code", w: 40, align: "left" },
    { label: "Hours", w: 14, align: "center" },
    { label: "Present", w: 14, align: "center" },
    { label: "Work Actually Covered", w: 90, align: "left" },
    { label: "Reflection & Remarks", w: 53, align: "left" },
    { label: "Sign-Off", w: 24, align: "center" },
  ];

  // Draw Table Header
  doc.setFillColor(0, 9, 83);
  doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);

  let curX = margin;
  cols.forEach((col) => {
    const textX = col.align === "center" ? curX + col.w / 2 : curX + 2;
    doc.text(col.label, textX, y + 4.8, { align: col.align as any });
    curX += col.w;
  });
  y += 7;

  // Rows
  records.forEach((rec, idx) => {
    if (y > pageHeight - 25) {
      doc.addPage();
      y = margin;
      // Repeat header on next page
      doc.setFillColor(0, 9, 83);
      doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      let pageX = margin;
      cols.forEach((col) => {
        const textX = col.align === "center" ? pageX + col.w / 2 : pageX + 2;
        doc.text(col.label, textX, y + 4.8, { align: col.align as any });
        pageX += col.w;
      });
      y += 7;
    }

    const rowH = 8.5;
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, pageWidth - margin * 2, rowH, "FD");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    let cellX = margin;
    // Wk
    doc.text(String(rec.week_number || idx + 1), cellX + 6, y + 5.5, { align: "center" });
    cellX += 12;

    // Date
    doc.text(String(rec.date_delivered || ""), cellX + 11, y + 5.5, { align: "center" });
    cellX += 22;

    // Class & Unit Code
    const classUnit = `${rec.class_code} · ${rec.unit_code}`;
    doc.text(doc.splitTextToSize(classUnit, 38)[0] || "", cellX + 2, y + 5.5);
    cellX += 40;

    // Hours
    doc.text(`${rec.hours_covered} hrs`, cellX + 7, y + 5.5, { align: "center" });
    cellX += 14;

    // Present
    doc.text(String(rec.trainees_present || "—"), cellX + 7, y + 5.5, { align: "center" });
    cellX += 14;

    // Work Covered
    const workText = doc.splitTextToSize(rec.work_actually_covered || "", 86)[0] || "";
    doc.text(workText, cellX + 2, y + 5.5);
    cellX += 90;

    // Reflection
    const refText = doc.splitTextToSize(rec.reflection || "Competencies achieved.", 49)[0] || "";
    doc.text(refText, cellX + 2, y + 5.5);
    cellX += 53;

    // Sign
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 9, 83);
    doc.text(rec.signature || "A. KINOTI", cellX + 12, y + 5.5, { align: "center" });

    y += rowH;
  });

  // Footer Signatures
  y += 6;
  if (y > pageHeight - 20) {
    doc.addPage();
    y = margin + 5;
  }
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Official Academic Document — Mukiria Technical Training Institute (MTTI). Page ${doc.getNumberOfPages()}`, margin, pageHeight - 6);

  const filename = `MTTI_RoW_Book_${Date.now()}.pdf`;
  doc.save(filename);

  return { filename, success: true };
}
