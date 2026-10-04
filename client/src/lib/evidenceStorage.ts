/**
 * Mukiria Technical Training Institute (MTTI)
 * Assessment Evidence Storage & Binary Document Service
 *
 * Handles:
 * - Supabase Storage bucket ('assessment-evidence') integration
 * - Binary streaming, Base64 encoding/decoding, and MIME detection
 * - In-browser PDF & Image rendering URLs
 * - Authentic binary file downloads with exact file metadata
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import jsPDF from "jspdf";

export interface EvidenceFilePayload {
  filename: string;
  mimeType: string;
  fileSize: number;
  fileData?: string; // Base64
  fileUrl?: string;
}

export function getMimeType(filename: string, providedType?: string): string {
  if (providedType && providedType !== "application/octet-stream") {
    return providedType;
  }
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "doc":
      return "application/msword";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "xls":
      return "application/vnd.ms-excel";
    case "zip":
      return "application/zip";
    case "txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}

/**
 * Returns a valid URL that can be directly embedded in an <iframe>, <object>, or <img>
 */
export function getEvidenceViewUrl(evidence: {
  file_url?: string;
  file_data?: string;
  mime_type?: string;
  filename?: string;
}): string {
  if (evidence.file_url) {
    if (
      evidence.file_url.startsWith("http://") ||
      evidence.file_url.startsWith("https://") ||
      evidence.file_url.startsWith("blob:") ||
      evidence.file_url.startsWith("data:") ||
      evidence.file_url.startsWith("/api/")
    ) {
      return evidence.file_url;
    }
  }

  if (evidence.file_data) {
    const mime =
      evidence.mime_type ||
      getMimeType(evidence.filename || "document.pdf");
    const cleanB64 = evidence.file_data.replace(/^data:[^;]+;base64,/, "");
    return `data:${mime};base64,${cleanB64}`;
  }

  return "";
}

/**
 * Converts a browser File object to Base64 and Data URL
 */
export function fileToBase64(file: File): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] || "";
      resolve({ base64, dataUrl });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an assessment evidence file to Supabase Storage ('assessment-evidence' bucket)
 * or falls back to Base64 data URL for offline / local storage.
 */
export async function uploadEvidenceFile(
  file: File,
  options?: { traineeId?: string; taskCode?: string; unitOfferingId?: string }
): Promise<{
  fileUrl: string;
  fileData?: string;
  filename: string;
  mimeType: string;
  fileSize: number;
}> {
  const mimeType = file.type || getMimeType(file.name);
  const traineeFolder = options?.traineeId || "candidate";
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${traineeFolder}/${Date.now()}_${safeFilename}`;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.storage
        .from("assessment-evidence")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: mimeType,
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from("assessment-evidence")
          .getPublicUrl(storagePath);

        const { base64 } = await fileToBase64(file);
        return {
          fileUrl: publicData.publicUrl,
          fileData: base64,
          filename: file.name,
          mimeType,
          fileSize: file.size,
        };
      }
    } catch (err) {
      console.warn("Supabase bucket upload error, falling back to local Base64:", err);
    }
  }

  // Fallback: Read file to Base64
  const { base64, dataUrl } = await fileToBase64(file);
  return {
    fileUrl: dataUrl,
    fileData: base64,
    filename: file.name,
    mimeType,
    fileSize: file.size,
  };
}

/**
 * TVET CDACC Continuous Assessment Calculation Utilities
 */
export function calculateAverages(scores: (number | string | undefined | null)[]): number {
  const validScores = scores
    .map((s) => (typeof s === "number" ? s : parseFloat(String(s))))
    .filter((s) => !isNaN(s));
  if (validScores.length === 0) return 0;
  const sum = validScores.reduce((a, b) => a + b, 0);
  return Math.round(sum / validScores.length);
}

export function calculateWeightedMark(ctAvg: number, cpAvg: number, level: number = 6): number {
  let raw = 0;
  switch (level) {
    case 6:
      raw = ctAvg * 0.5 + cpAvg * 0.5;
      break;
    case 5:
      raw = ctAvg * 0.4 + cpAvg * 0.6;
      break;
    case 4:
      raw = ctAvg * 0.3 + cpAvg * 0.7;
      break;
    case 3:
      raw = ctAvg * 0.2 + cpAvg * 0.8;
      break;
    default:
      raw = ctAvg * 0.5 + cpAvg * 0.5;
      break;
  }
  return Math.round(raw);
}

/**
 * Triggers a real binary download of the evidence with its genuine file name and MIME type
 */
export function downloadEvidenceFile(evidence: {
  filename: string;
  file_url?: string;
  file_data?: string;
  mime_type?: string;
}): void {
  const mime =
    evidence.mime_type ||
    getMimeType(evidence.filename || "evidence_file.bin");

  try {
    if (evidence.file_data) {
      const cleanB64 = evidence.file_data.replace(/^data:[^;]+;base64,/, "");
      const byteChars = atob(cleanB64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mime });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = evidence.filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }, 200);
      return;
    }

    if (evidence.file_url) {
      if (
        evidence.file_url.startsWith("blob:") ||
        evidence.file_url.startsWith("data:")
      ) {
        const link = document.createElement("a");
        link.href = evidence.file_url;
        link.download = evidence.filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 200);
        return;
      }

      // Remote or API URL
      const downloadTarget = evidence.file_url.includes("/api/evidence/")
        ? evidence.file_url.replace(/\/file(\?.*)?$/, "/download")
        : evidence.file_url;

      const link = document.createElement("a");
      link.href = downloadTarget;
      link.download = evidence.filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 200);
      return;
    }

    console.warn("No binary data or URL available for download");
  } catch (err) {
    console.error("Binary download error:", err);
  }
}

/**
 * Generates an official, genuine TVET CDACC Practical Evidence PDF document in Base64
 */
export function generateSamplePracticalEvidencePDF(params: {
  studentName: string;
  admNo: string;
  taskTitle: string;
  taskCode: string;
  unitCode: string;
  unitTitle: string;
}): { base64: string; mimeType: string; size: number } {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 18;

  // Header Box (Deep Navy)
  doc.setFillColor(13, 27, 42);
  doc.rect(0, 0, pageW, 36, "F");
  doc.setFillColor(16, 185, 129); // Emerald accent line
  doc.rect(0, 36, pageW, 1.5, "F");

  doc.setTextColor(16, 185, 129);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("MUKIRIA TECHNICAL TRAINING INSTITUTE", pageW / 2, 12, {
    align: "center",
  });

  doc.setTextColor(200, 220, 240);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    "DEPARTMENT OF COMPUTING & INFORMATICS  •  TVET CDACC CBET",
    pageW / 2,
    19,
    { align: "center" }
  );
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(
    `PRACTICAL ASSESSMENT EVIDENCE SUBMISSION — ${params.taskCode}`,
    pageW / 2,
    28,
    { align: "center" }
  );

  let y = 46;

  // Candidate Specification Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageW - 2 * margin, 32, 2, 2, "F");
  doc.setDrawColor(200, 210, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, pageW - 2 * margin, 32, 2, 2, "S");

  doc.setFontSize(8.5);
  doc.setTextColor(70, 85, 105);
  doc.text("Candidate Name:", margin + 5, y + 8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(13, 27, 42);
  doc.text(params.studentName.toUpperCase(), margin + 35, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(70, 85, 105);
  doc.text("Admission / Reg:", margin + 5, y + 16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(13, 27, 42);
  doc.text(params.admNo, margin + 35, y + 16);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(70, 85, 105);
  doc.text("Unit Code:", margin + 95, y + 8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(13, 27, 42);
  doc.text(params.unitCode, margin + 120, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(70, 85, 105);
  doc.text("Unit Title:", margin + 95, y + 16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(13, 27, 42);
  doc.text(params.unitTitle, margin + 120, y + 16);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(70, 85, 105);
  doc.text("Task Allocated:", margin + 5, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 140, 90);
  doc.text(`${params.taskCode}: ${params.taskTitle}`, margin + 35, y + 24);

  y += 40;

  // Practical Task Execution Log
  doc.setFillColor(13, 27, 42);
  doc.rect(margin, y, pageW - 2 * margin, 7, "F");
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("1. WORKSHOP PRACTICAL OBSERVATION CRITERIA & STEPS", margin + 4, y + 5);
  y += 11;

  const steps = [
    "Step 1: Laboratory Safety & ESD Precaution — Wore anti-static wrist strap, inspected power supply.",
    "Step 2: Hardware Disassembly — Successfully identified CMOS battery, DDR4 RAM banks, CPU socket.",
    "Step 3: Operating System Configuration — Formatted GPT partition, installed Windows 11 Pro image.",
    "Step 4: Driver & Network Verification — Validated Gigabit Ethernet MAC address and IPv4 configuration.",
    "Step 5: System Diagnostics — Ran chkdsk, verify memory timings in BIOS/UEFI setup utility.",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 40, 55);

  steps.forEach((step, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 250 : 242, idx % 2 === 0 ? 250 : 245, idx % 2 === 0 ? 250 : 250);
    doc.rect(margin, y - 1, pageW - 2 * margin, 7, "F");
    doc.text(`[✓] ${step}`, margin + 3, y + 3.8);
    y += 7.5;
  });

  y += 6;

  // Candidate Self-Declaration
  doc.setFillColor(245, 248, 255);
  doc.roundedRect(margin, y, pageW - 2 * margin, 24, 2, 2, "F");
  doc.setDrawColor(180, 200, 230);
  doc.roundedRect(margin, y, pageW - 2 * margin, 24, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(13, 27, 42);
  doc.text("CANDIDATE WORK INTEGRITY CERTIFICATION", margin + 4, y + 6);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 75, 95);
  doc.text(
    '"I hereby certify that this practical assignment reflects my individual technical execution, workshop',
    margin + 4,
    y + 12
  );
  doc.text(
    'measurements, and laboratory safety compliance conducted at Mukiria Technical Training Institute."',
    margin + 4,
    y + 17
  );

  y += 32;

  // Assessor Review & Mark Block
  doc.setFillColor(232, 245, 238);
  doc.roundedRect(margin, y, pageW - 2 * margin, 32, 2, 2, "F");
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, pageW - 2 * margin, 32, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(16, 140, 90);
  doc.text("TVET CDACC ASSESSOR VERIFICATION & MARK AWARD", margin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 45, 60);
  doc.text("Assigned Trainer / Assessor: Alexander Kinoti", margin + 4, y + 14);
  doc.text("Assessor Signature: _______________________", margin + 4, y + 22);
  doc.text("Task Evaluation Score: [ ____ / 100 ]", margin + 110, y + 14);
  doc.text("Verification Date: ____________________", margin + 110, y + 22);

  // Running Footer
  doc.setFillColor(13, 27, 42);
  doc.rect(0, 283, pageW, 14, "F");
  doc.setTextColor(180, 200, 220);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Mukiria Technical Training Institute  •  Unit: ${params.unitCode}  •  Evidence Code: ${params.taskCode}`,
    pageW / 2,
    289,
    { align: "center" }
  );
  doc.text(
    "TVET CDACC Competency-Based Education & Training Assessment Record  •  Official Copy",
    pageW / 2,
    293,
    { align: "center" }
  );

  const arrayBuffer = doc.output("arraybuffer");
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return {
    base64,
    mimeType: "application/pdf",
    size: bytes.byteLength,
  };
}

/**
 * Generates a realistic sample Workshop Evidence Image in Base64 (SVG to Data URL)
 */
export function generateSampleObservationImage(): string {
  // A clean SVG schematic of computer workshop workbench observation
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <rect width="800" height="500" fill="#0d1b2a"/>
    <rect x="20" y="20" width="760" height="460" rx="12" fill="#132338" stroke="#10b981" stroke-width="2"/>
    <text x="400" y="60" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#10b981" text-anchor="middle">MUKIRIA TECHNICAL TRAINING INSTITUTE</text>
    <text x="400" y="90" font-family="Arial, sans-serif" font-size="14" fill="#a0aec0" text-anchor="middle">WORKSHOP LABORATORY OBSERVATION EVIDENCE — CP2</text>
    
    <!-- Workbench Drawing -->
    <rect x="80" y="130" width="640" height="260" rx="8" fill="#1a2f4c" stroke="#2d4a77" stroke-width="2"/>
    <!-- System Unit Box -->
    <rect x="120" y="160" width="180" height="200" rx="6" fill="#0d1b2a" stroke="#10b981" stroke-width="2"/>
    <circle cx="210" cy="200" r="25" fill="#10b981" opacity="0.3"/>
    <text x="210" y="205" font-family="Arial, sans-serif" font-size="11" fill="#10b981" text-anchor="middle">COOLING FAN</text>
    <rect x="140" y="250" width="140" height="15" fill="#3b82f6" rx="2"/>
    <text x="210" y="262" font-family="Arial, sans-serif" font-size="9" fill="#ffffff" text-anchor="middle">RAM DDR4 16GB</text>
    <rect x="140" y="280" width="140" height="30" fill="#f59e0b" rx="2"/>
    <text x="210" y="298" font-family="Arial, sans-serif" font-size="10" fill="#ffffff" text-anchor="middle">NVMe SSD 512GB</text>

    <!-- Multimeter / Diagnostics -->
    <rect x="360" y="160" width="150" height="200" rx="8" fill="#e11d48" opacity="0.9"/>
    <rect x="380" y="180" width="110" height="50" rx="4" fill="#0f172a"/>
    <text x="435" y="215" font-family="monospace" font-size="22" font-weight="bold" fill="#22c55e" text-anchor="middle">12.04 V</text>
    <circle cx="410" cy="280" r="14" fill="#ffffff"/>
    <circle cx="460" cy="280" r="14" fill="#1e293b"/>
    <text x="435" y="335" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">PSU VOLTAGE OK</text>

    <!-- Inspection Stamp -->
    <circle cx="620" cy="250" r="65" fill="none" stroke="#10b981" stroke-width="3" stroke-dasharray="6,4"/>
    <text x="620" y="235" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#10b981" text-anchor="middle">MTTI VERIFIED</text>
    <text x="620" y="255" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#10b981" text-anchor="middle">PASSED</text>
    <text x="620" y="275" font-family="Arial, sans-serif" font-size="10" fill="#10b981" text-anchor="middle">LAB BENCH #4</text>

    <text x="400" y="440" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">Trainee: Harriet Mwendwa | Unit: 061155101A | Assessor: Alexander Kinoti</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
