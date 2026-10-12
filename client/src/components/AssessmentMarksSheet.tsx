import React, { useState, useEffect, useMemo } from "react";
import { Plus, Save, Printer, Download, Lock, Unlock, Users, PenTool, RefreshCw } from "lucide-react";
import { supabase, isSupabaseConfigured, normalizeAssessmentTaskSlot } from "@/lib/supabase";
import { toast } from "sonner";
import { useTrainees, findMatchingTrainee, syncScoreToContinuousMarksheet } from "@/contexts/TraineeContext";
import { useExam } from "@/contexts/ExamContext";
import ObservationChecklistMarkingModal from "./ObservationChecklistMarkingModal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface AssessmentRow {
  id: string;
  sn: number;
  regCode: string;
  admNo: string;
  name: string;
  ctScores: (number | string)[];
  cpScores: (number | string)[];
  ctAvg: number;
  cpAvg: number;
  weightedMark: number;
}

export function AssessmentMarksSheet() {
  const [centerCode, setCenterCode] = useState("01200004");
  const [level, setLevel] = useState<number>(6);
  const [courseCode, setCourseCode] = useState("041305T4OAD");
  const [courseTitle, setCourseTitle] = useState("Diploma in Information Communication Technology");
  const [unitCode, setUnitCode] = useState("IT/CU/ICTA/CR/01/6/MA");
  const [unitTitle, setUnitTitle] = useState("Perform Computer Essentials");
  const [termDates, setTermDates] = useState("From 31 AUG 2026 to 20 NOV 2026");
  const [poeDate, setPoeDate] = useState("07/10/2026");
  const [assessmentSeries, setAssessmentSeries] = useState("NOV/DEC 2026");

  // Sign-off names
  const [assessorName, setAssessorName] = useState("Alexander Kinoti");
  const [verifierName, setVerifierName] = useState("HOD Computing & Informatics");
  
  // Class selection for targeted marksheet
  const [selectedClass, setSelectedClass] = useState<string>("ICT4/ITECH6/S/26 MOD 1");
  const [unitOfferingId] = useState("uo_1");
  const [isLocked, setIsLocked] = useState(false); // Internal Assessor Sign-off
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);

  const [ctCount, setCtCount] = useState(3);
  const [cpCount, setCpCount] = useState(3);

  const [rows, setRows] = useState<AssessmentRow[]>([]);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [selectedCandidateForPractical, setSelectedCandidateForPractical] = useState<AssessmentRow | null>(null);

  const { trainees, uploads } = useTrainees();
  const { exams, submissions } = useExam();

  useEffect(() => {
    const handleMarksUpdated = () => setSyncVersion((v) => v + 1);
    window.addEventListener("mtti-marks-updated", handleMarksUpdated);
    return () => window.removeEventListener("mtti-marks-updated", handleMarksUpdated);
  }, []);

  // Distinct classes available from trainees roster
  const availableClasses = useMemo(() => {
    return Array.from(new Set(trainees.map(t => t.classCode).filter(Boolean)));
  }, [trainees]);

  // Round averages to whole number (no decimals) per TVET CDACC requirements
  const calculateAverages = (scores: any[]): number => {
    const validScores = scores
      .map((s) => parseFloat(s))
      .filter((s) => !isNaN(s));
    if (validScores.length === 0) return 0;
    const sum = validScores.reduce((a, b) => a + b, 0);
    return Math.round(sum / validScores.length);
  };

  // TVET CDACC Official Weight Formula per Level
  const calculateWeighted = (ctAvg: number, cpAvg: number, currentLevel: number): number => {
    let raw = 0;
    switch (currentLevel) {
      case 6: raw = (ctAvg * 0.5) + (cpAvg * 0.5); break;
      case 5: raw = (ctAvg * 0.4) + (cpAvg * 0.6); break;
      case 4: raw = (ctAvg * 0.3) + (cpAvg * 0.7); break;
      case 3: raw = (ctAvg * 0.2) + (cpAvg * 0.8); break;
      default: raw = (ctAvg * 0.5) + (cpAvg * 0.5); break;
    }
    return Math.round(raw);
  };

  // Auto-populate and synchronize based on selected class, trainees, graded submissions, graded uploads, and saved marks
  useEffect(() => {
    const classTrainees = selectedClass === "all" 
      ? trainees 
      : trainees.filter(t => {
          if (t.classCode === selectedClass) return true;
          if (
            (selectedClass.includes("ICT4") || selectedClass.includes("ITECH6")) &&
            (t.classCode.includes("ITECH") || t.classCode.includes("ICT4") || t.classCode.includes("MOD 1"))
          ) return true;
          if (selectedClass.includes("ADMIN") && t.classCode.includes("ADMIN")) return true;
          if (selectedClass.includes("FBS") && t.classCode.includes("FBS")) return true;
          if (selectedClass.includes("LS") && t.classCode.includes("LS")) return true;
          return false;
        });

    let targetLevel = 6;
    if (selectedClass.includes("FBS")) {
      targetLevel = 5;
      setLevel(5);
      setCourseTitle("Diploma in Food & Beverage Sales and Service Management");
      setCourseCode("FBS-MOD-5");
      setUnitCode("HBS/OS/COS/BC/01/5/MA");
      setUnitTitle("Apply Digital Literacy");
      setTermDates("From SEPT 2026 to NOV 2026");
    } else if (selectedClass.includes("ADMIN")) {
      targetLevel = 6;
      setLevel(6);
      setCourseTitle("Diploma in Secretarial & Administration");
      setCourseCode("Admin-MOD-6");
      setUnitCode("ADM/OS/SEC/BC/01/6/MA");
      setUnitTitle("Apply ICT Skills");
      setTermDates("From SEPT 2026 to NOV 2026");
    } else if (selectedClass.includes("LS")) {
      targetLevel = 6;
      setLevel(6);
      setCourseTitle("Diploma in Land Survey");
      setCourseCode("LS-MOD-6");
      setUnitCode("LS/CU/SRV/BC/01/6/MA");
      setUnitTitle("Apply Digital Literacy");
      setTermDates("From SEPT 2026 to NOV 2026");
    } else if (selectedClass.includes("ICT4") || selectedClass.includes("ITECH6")) {
      targetLevel = 6;
      setLevel(6);
      setCourseTitle("Diploma in Information Communication Technology");
      setCourseCode("041305T4OAD");
      setUnitCode("IT/CU/ICTA/CR/01/6/MA");
      setUnitTitle("Perform Computer Essentials");
      setTermDates("From SEPT 2026 to NOV 2026");
    }

    let savedMarks: any[] = [];
    try {
      const raw = localStorage.getItem(`mtti_marks_${unitOfferingId}`);
      if (raw) savedMarks = JSON.parse(raw);
    } catch {}

    setRows(
      classTrainees.map((t, idx) => {
        const cleanAdm = t.admNo?.replace(/^(ITECH\s*6\s*MOD|ICT4\s*MOD)\//i, "") || t.admNo;
        const savedEntry = savedMarks.find((m) => m.trainee_id === t.id);

        const initCtScores: (number | string)[] = Array(ctCount).fill("");
        const initCpScores: (number | string)[] = Array(cpCount).fill("");

        // 1. Pull graded online exam submissions (CT1, CT2, CT3, CP1-3) from ExamContext
        submissions.forEach((sub) => {
          if (sub.total_score === null || sub.total_score === undefined) return;
          const matched = findMatchingTrainee([t], {
            traineeId: sub.trainee_id,
            regNumber: sub.reg_number,
            studentName: sub.student_name,
          });
          if (!matched) return;

          const exam = exams.find((e) => e.unit_code === sub.unit_code || e.id === sub.exam_id);
          const maxMarks = exam?.payload?.total_marks ?? 100;
          const pct =
            maxMarks !== 100 && maxMarks > 0 && sub.total_score <= maxMarks
              ? Math.round((sub.total_score / maxMarks) * 100)
              : Math.round(sub.total_score);

          const slot = normalizeAssessmentTaskSlot(
            sub.task_code || exam?.payload?.task_code,
            sub.unit_code,
            exam?.payload?.title,
            exam?.payload?.type
          );

          if (slot === "CT1" && ctCount >= 1) initCtScores[0] = String(pct);
          else if (slot === "CT2" && ctCount >= 2) initCtScores[1] = String(pct);
          else if (slot === "CT3" && ctCount >= 3) initCtScores[2] = String(pct);
          else if (slot === "CP1" && cpCount >= 1) initCpScores[0] = String(pct);
          else if (slot === "CP2" && cpCount >= 2) initCpScores[1] = String(pct);
          else if (slot === "CP3" && cpCount >= 3) initCpScores[2] = String(pct);
        });

        // 2. Pull graded uploaded evidence (Practicals CP1-CP3, Theory CT1-CT3) from TraineeContext
        uploads.forEach((up) => {
          if (up.status !== "graded" || up.grade === null || up.grade === undefined) return;
          const matched = findMatchingTrainee([t], {
            traineeId: up.traineeId,
            studentName: up.student_name,
          });
          if (!matched) return;

          const slot = normalizeAssessmentTaskSlot(
            up.task_code || up.uploadType,
            up.unit_code,
            up.filename
          );
          const pct = Math.round(Number(up.grade));

          if (slot === "CT1" && ctCount >= 1) initCtScores[0] = String(pct);
          else if (slot === "CT2" && ctCount >= 2) initCtScores[1] = String(pct);
          else if (slot === "CT3" && ctCount >= 3) initCtScores[2] = String(pct);
          else if (slot === "CP1" && cpCount >= 1) initCpScores[0] = String(pct);
          else if (slot === "CP2" && cpCount >= 2) initCpScores[1] = String(pct);
          else if (slot === "CP3" && cpCount >= 3) initCpScores[2] = String(pct);
        });

        // 3. Apply explicit saved marksheet overrides from localStorage
        if (savedEntry) {
          if (Array.isArray(savedEntry.ct_scores)) {
            savedEntry.ct_scores.forEach((s: any, sIdx: number) => {
              if (sIdx < ctCount && s !== "" && s !== null && s !== undefined && !isNaN(Number(s))) {
                initCtScores[sIdx] = String(s);
              }
            });
          }
          if (Array.isArray(savedEntry.cp_scores)) {
            savedEntry.cp_scores.forEach((s: any, sIdx: number) => {
              if (sIdx < cpCount && s !== "" && s !== null && s !== undefined && !isNaN(Number(s))) {
                initCpScores[sIdx] = String(s);
              }
            });
          }
        }

        const ctAvg = calculateAverages(initCtScores);
        const cpAvg = calculateAverages(initCpScores);
        const weightedMark = calculateWeighted(ctAvg, cpAvg, targetLevel);

        return {
          id: t.id,
          sn: idx + 1,
          regCode: t.regCode || (t.admNo ? `ITECH 6 MOD/${cleanAdm}` : `MTTI/2026/${String(idx + 1).padStart(3, "0")}`),
          admNo: cleanAdm,
          name: t.name,
          ctScores: initCtScores,
          cpScores: initCpScores,
          ctAvg,
          cpAvg,
          weightedMark,
        };
      })
    );
  }, [selectedClass, trainees, uploads, submissions, exams, ctCount, cpCount, syncVersion]);

  // Recalculate everything when scores or level change
  useEffect(() => {
    setRows((prev) =>
      prev.map((row) => {
        const ctAvg = calculateAverages(row.ctScores);
        const cpAvg = calculateAverages(row.cpScores);
        const weightedMark = calculateWeighted(ctAvg, cpAvg, level);
        return { ...row, ctAvg, cpAvg, weightedMark };
      })
    );
  }, [level, ctCount, cpCount]);

  const handleScoreChange = (rowId: string, type: 'ct' | 'cp', index: number, value: string) => {
    if (isLocked) {
      toast.warning("Assessment sheet is locked. Unlock first to edit marks.");
      return;
    }

    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        
        const newRow = { ...row };
        if (type === 'ct') {
          newRow.ctScores = [...row.ctScores];
          newRow.ctScores[index] = value;
        } else {
          newRow.cpScores = [...row.cpScores];
          newRow.cpScores[index] = value;
          newRow.cpAvg = calculateAverages(newRow.cpScores);
        }
        newRow.ctAvg = calculateAverages(newRow.ctScores);
        newRow.weightedMark = calculateWeighted(newRow.ctAvg, newRow.cpAvg, level);
        return newRow;
      })
    );
  };

  const handleMatrixKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colKey: string
  ) => {
    const columns: string[] = [];
    for (let i = 0; i < ctCount; i++) columns.push(`ct-${i}`);
    for (let i = 0; i < cpCount; i++) columns.push(`cp-${i}`);

    const currentColIdx = columns.indexOf(colKey);
    let targetRow = rowIndex;
    let targetCol = currentColIdx;

    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      targetRow = Math.min(rows.length - 1, rowIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      targetRow = Math.max(0, rowIndex - 1);
    } else if (e.key === "ArrowLeft") {
      const input = e.currentTarget;
      if (input.selectionStart === 0 && input.selectionEnd === 0 && currentColIdx > 0) {
        e.preventDefault();
        targetCol = currentColIdx - 1;
      }
    } else if (e.key === "ArrowRight") {
      const input = e.currentTarget;
      if (input.selectionStart === input.value.length && currentColIdx < columns.length - 1) {
        e.preventDefault();
        targetCol = currentColIdx + 1;
      }
    } else {
      return;
    }

    const nextId = `cell-${targetRow}-${columns[targetCol]}`;
    const nextElem = document.getElementById(nextId);
    if (nextElem) {
      nextElem.focus();
      if (nextElem instanceof HTMLInputElement) {
        nextElem.select();
      }
    }
  };

  const handleRowChange = (rowId: string, field: keyof AssessmentRow, value: string) => {
    if (isLocked) {
      toast.warning("Assessment sheet is locked. Unlock first to edit trainee details.");
      return;
    }
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    if (isLocked) {
      toast.warning("Assessment sheet is locked. Unlock first to add candidates.");
      return;
    }
    const newId = `tr-manual-${Date.now()}`;
    setRows((prev) => [
      ...prev,
      {
        id: newId,
        sn: prev.length + 1,
        regCode: `ITECH 6 MOD/${14300 + prev.length}/S2026`,
        admNo: `${14300 + prev.length}/S2026`,
        name: "NEW CANDIDATE",
        ctScores: Array(ctCount).fill(""),
        cpScores: Array(cpCount).fill(""),
        ctAvg: 0,
        cpAvg: 0,
        weightedMark: 0,
      },
    ]);
    toast.success("Candidate row added.");
  };

  const removeRow = (id: string) => {
    if (isLocked) {
      toast.warning("Assessment sheet is locked. Unlock first to remove candidates.");
      return;
    }
    setRows((prev) => prev.filter((row) => row.id !== id).map((row, idx) => ({ ...row, sn: idx + 1 })));
    toast.info("Candidate row removed.");
  };

  const addColumn = (type: 'ct' | 'cp') => {
    if (isLocked) return;
    if (type === 'ct') {
      setCtCount(c => c + 1);
      setRows(prev => prev.map(row => ({ ...row, ctScores: [...row.ctScores, ""] })));
    } else {
      setCpCount(c => c + 1);
      setRows(prev => prev.map(row => ({ ...row, cpScores: [...row.cpScores, ""] })));
    }
  };

  const submitData = async () => {
    try {
      const batchPayload = {
        unitOfferingId,
        marks: rows.map(r => ({
          traineeId: r.id,
          cpScore: r.cpAvg,
          ctScore: r.ctAvg,
        })),
      };

      try {
        const res = await fetch("/api/marks/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batchPayload),
        });

        if (res.status === 400) {
          const errData = await res.json().catch(() => ({}));
          if (errData.error?.includes("locked") || errData.error?.includes("finalized")) {
            setIsLocked(true);
            toast.error("Assessment marksheet is finalized and locked");
            return;
          }
        }
      } catch (apiErr) {
        console.warn("Backend API /api/marks/batch call:", apiErr);
      }

      const payload = rows.map(r => ({
        unit_offering_id: unitOfferingId,
        trainee_id: r.id,
        ct_scores: r.ctScores.map(score => (score === "" ? null : parseFloat(score as any))),
        computed_average_theory: Math.round(r.ctAvg),
        cp_scores: r.cpScores.map(score => (score === "" ? null : parseFloat(score as any))),
        computed_average_practical: Math.round(r.cpAvg),
        weighted_mark: Math.round(r.weightedMark),
        is_locked: isLocked
      }));

      let savedToSupabase = false;

      if (isSupabaseConfigured()) {
        try {
          const { error } = await supabase.from('assessment_marks').upsert(payload as any, { onConflict: 'unit_offering_id, trainee_id' });
          if (error) throw error;
          savedToSupabase = true;
          toast.success("Assessment marks saved & synchronized with TVET database!");
        } catch (supabaseErr: any) {
          console.warn("Supabase save failed, falling back to local storage:", supabaseErr);
        }
      } 
      
      localStorage.setItem(`mtti_marks_${unitOfferingId}`, JSON.stringify(payload));
      if (!savedToSupabase) {
        toast.success("Assessment marks saved successfully.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to submit data: ${err.message || "Unknown error"}`);
    }
  };

  // Dedicated Clean Landscape Print Handler
  const handlePrint = () => {
    toast.dismiss();
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // High-Resolution Landscape PDF Exporter
  const handleDownloadPDF = async () => {
    try {
      setIsExportingPDF(true);
      toast.dismiss();

      const element = document.getElementById("cdacc-marksheet-printable");
      if (!element) {
        toast.error("Marksheet printable area not found");
        return;
      }

      toast.info("Rendering official TVET CDACC Landscape PDF...", { duration: 2500 });
      await new Promise(res => setTimeout(res, 200));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 297;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, Math.min(pdfHeight, 210));
      
      const cleanCode = unitCode.replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`TVET_CDACC_Continuous_Assessment_Marksheet_${cleanCode}.pdf`);
      toast.success("TVET CDACC Landscape PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Failed to generate PDF. Use Print button to Save as PDF.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="container py-4 max-w-[1440px] space-y-4 print:p-0 print:m-0 print:max-w-none">
      
      {/* Print Specific CSS to Guarantee Landscape and 0 UI Artifacts */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm 8mm 8mm 8mm;
          }
          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide EVERYTHING on the page by default */
          body * {
            visibility: hidden !important;
          }
          /* Show ONLY the printable marksheet and its children */
          #cdacc-marksheet-printable,
          #cdacc-marksheet-printable * {
            visibility: visible !important;
          }
          #cdacc-marksheet-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
          }
          /* Hide any scrollbars or overflow limits */
          .overflow-x-auto, .overflow-auto {
            overflow: visible !important;
          }
          /* Ensure table expands 100% with no cut-off columns */
          table.cdacc-table {
            width: 100% !important;
            min-width: 0 !important;
            border-collapse: collapse !important;
            table-layout: auto !important;
          }
          table.cdacc-table th, table.cdacc-table td {
            border: 1px solid #000000 !important;
            padding: 3px 4px !important;
            font-size: 10px !important;
            min-width: 0 !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Neutralize dark-mode backgrounds in print */
          .bg-white, .bg-card, .bg-slate-50, .bg-[#e5e5e5] {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Top Controls Toolbar (Print:hidden) */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-muted-foreground uppercase">Class Cohort:</span>
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none cursor-pointer"
          >
            <option value="all">All Registered Trainees ({trainees.length})</option>
            {availableClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls} ({trainees.filter(t => t.classCode === cls).length} trainees)
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground font-medium">
            {rows.length} candidates loaded
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setSyncVersion((v) => v + 1);
              toast.success("Synchronized graded Continuous Theory (CT1–CT3) & Practical (CP1–CP3) assessments.");
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#000953] hover:bg-[#000e7a] text-white rounded-lg text-xs font-bold transition shadow-sm"
            title="Sync all graded CT and CP assessments into the Marksheet"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Graded Assessments
          </button>

          <button
            onClick={addRow}
            disabled={isLocked}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
            title="Add candidate row"
          >
            <Plus className="w-4 h-4" />
            Add Candidate
          </button>

          <button
            onClick={() => {
              setSelectedCandidateForPractical(null);
              setIsObservationModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-600 border border-red-500/30 rounded-lg text-xs font-bold transition shadow-sm"
            title="Open Practical Observation Checklist"
          >
            <PenTool className="w-4 h-4 text-red-600" />
            Practical Observation Tool
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-black text-white hover:bg-black/80 rounded-lg text-xs font-bold transition shadow-sm"
            title="Print Official Sheet in Landscape"
          >
            <Printer className="w-4 h-4" />
            Print Marksheet (Landscape)
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 text-white hover:bg-blue-800 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
            title="Download Landscape PDF"
          >
            <Download className="w-4 h-4" />
            {isExportingPDF ? "Generating PDF..." : "Download PDF (Landscape)"}
          </button>

          <button
            onClick={() => {
              setIsLocked(!isLocked);
              toast.info(isLocked ? "Assessment sheet unlocked for editing." : "Assessment sheet signed-off and locked.");
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition ${
              isLocked 
                ? "bg-amber-500/10 text-amber-600 border-amber-500/30" 
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border"
            }`}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {isLocked ? "Locked (Signed)" : "Sign-off & Lock"}
          </button>

          <button 
            onClick={submitData}
            disabled={isLocked}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Marks
          </button>
        </div>
      </div>

      {/* Official TVET CDACC Printable Sheet Container */}
      <div 
        id="cdacc-marksheet-printable"
        className="p-8 bg-white text-black shadow-md rounded-xl border border-gray-300 print:shadow-none print:border-none print:p-0 print:m-0"
      >
        
        {/* Official Mukiria Continuous Assessment Mark Sheet Header (No MTTI Logo) */}
        <div className="text-center pb-3 mb-4 space-y-1.5">
          <h1 className="text-xl font-bold uppercase tracking-wider text-black" style={{ fontFamily: 'Maiandra GD, Calibri, sans-serif' }}>
            MUKIRIA TECHNICAL TRAINING INSTITUTE
          </h1>
          <h2 className="text-base font-bold uppercase tracking-wide text-black" style={{ fontFamily: 'Maiandra GD, Calibri, sans-serif' }}>
            CONTINUOUS ASSESSMENT MARK SHEET PER UNIT OF COMPETENCY
          </h2>
        </div>

        {/* Clean Metadata Section Matching Official CDACC Form Without Text Collision */}
        <div className="space-y-2 mb-4 text-[12px] text-black" style={{ fontFamily: 'Maiandra GD, Calibri, sans-serif' }}>
          
          {/* Metadata Row 1 */}
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="font-bold whitespace-nowrap">Assessment Center Code:</span>
              <input 
                value={centerCode}
                onChange={(e) => setCenterCode(e.target.value)}
                className="font-bold border-b border-dotted border-black outline-none bg-transparent w-28 px-1 print:border-none"
              />
            </div>
            <div className="flex items-baseline gap-2 flex-1 justify-end">
              <span className="font-bold whitespace-nowrap">Assessment Center Name:</span>
              <span className="font-bold uppercase tracking-wide border-b border-dotted border-black px-2">
                MUKIRIA TECHNICAL TRAINING INSTITUTE
              </span>
            </div>
          </div>

          {/* Metadata Row 2 */}
          <div className="flex flex-wrap items-baseline gap-4 justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-bold whitespace-nowrap">Course Code:</span>
              <input 
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="font-bold border-b border-dotted border-black outline-none bg-transparent w-36 px-1 print:border-none"
              />
            </div>
            <div className="flex items-baseline gap-2 flex-1 min-w-[260px]">
              <span className="font-bold whitespace-nowrap">Course Title:</span>
              <input 
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="font-bold border-b border-dotted border-black outline-none bg-transparent flex-1 px-1 print:border-none"
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold whitespace-nowrap">Level:</span>
              {/* Screen: select, Print: static clean text */}
              <select
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="font-bold border-b border-dotted border-black outline-none bg-transparent w-24 px-1 cursor-pointer print:hidden"
              >
                <option value={6}>Level 6</option>
                <option value={5}>Level 5</option>
                <option value={4}>Level 4</option>
                <option value={3}>Level 3</option>
              </select>
              <span className="font-bold border-b border-dotted border-black px-1 hidden print:inline-block">
                Level {level}
              </span>
            </div>
          </div>

          {/* Metadata Row 3 */}
          <div className="flex flex-wrap items-baseline gap-4 justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-bold whitespace-nowrap">Unit Code:</span>
              <input 
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                className="font-bold border-b border-dotted border-black outline-none bg-transparent w-48 px-1 print:border-none"
              />
            </div>
            <div className="flex items-baseline gap-2 flex-1 min-w-[240px]">
              <span className="font-bold whitespace-nowrap">Unit Title:</span>
              <input 
                value={unitTitle}
                onChange={(e) => setUnitTitle(e.target.value)}
                className="font-bold uppercase border-b border-dotted border-black outline-none bg-transparent flex-1 px-1 print:border-none"
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold whitespace-nowrap">Term Dates:</span>
              <input 
                value={termDates}
                onChange={(e) => setTermDates(e.target.value)}
                className="font-bold border-b border-dotted border-black outline-none bg-transparent w-56 px-1 text-center print:border-none"
              />
            </div>
          </div>

          {/* Metadata Row 4 */}
          <div className="flex flex-wrap items-baseline gap-6 justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-bold whitespace-nowrap">Date of Review of POE:</span>
              <input 
                value={poeDate}
                onChange={(e) => setPoeDate(e.target.value)}
                className="font-bold border-b border-dotted border-black outline-none bg-transparent w-36 px-1 print:border-none"
                placeholder="DD/MM/YYYY"
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold whitespace-nowrap">Assessment Series:</span>
              <input 
                value={assessmentSeries}
                onChange={(e) => setAssessmentSeries(e.target.value)}
                className="font-bold uppercase border-b border-dotted border-black outline-none bg-transparent w-44 px-1 text-center print:border-none"
              />
            </div>
          </div>

        </div>

        {/* Dynamic Landscape Continuous Assessment Table */}
        <div className="w-full overflow-x-auto mb-5 border-2 border-black rounded shadow-sm print:shadow-none print:rounded-none print:border-black print:overflow-visible">
          <table className="w-full min-w-[960px] text-left border-collapse text-[11px] text-black cdacc-table" style={{ fontFamily: 'Maiandra GD, Calibri, sans-serif' }}>
            <thead>
              <tr className="bg-slate-100 print:bg-slate-100">
                <th className="p-2 border border-black font-bold text-center w-10 min-w-[36px]" rowSpan={2}>S/N</th>
                <th className="p-2 border border-black font-bold text-center w-40 min-w-[140px]" rowSpan={2}>Candidate’s Reg Code</th>
                <th className="p-2 border border-black font-bold text-center w-28 min-w-[95px]" rowSpan={2}>ADM NO</th>
                <th className="p-2 border border-black font-bold text-center min-w-[200px]" rowSpan={2}>Candidate’s Name</th>
                <th className="p-2 border border-black font-bold text-center" colSpan={ctCount + 1}>
                  Continuous Theory (CT) Marks (100%)
                  <button onClick={() => addColumn('ct')} className="ml-2 font-bold hover:underline print:hidden text-[#000953]" title="Add Theory Assessment Column">[+]</button>
                </th>
                <th className="p-2 border border-black font-bold text-center" colSpan={cpCount + 1}>
                  Continuous Practical (CP) Marks (100%)
                  <button onClick={() => addColumn('cp')} className="ml-2 font-bold hover:underline print:hidden text-[#000953]" title="Add Practical Assessment Column">[+]</button>
                </th>
                <th className="p-2 border border-black font-bold text-center w-24 min-w-[80px]" rowSpan={2}>Weighted marks</th>
                <th className="p-2 border-none font-bold text-center print:hidden w-12" rowSpan={2}></th>
              </tr>
              <tr className="bg-slate-100 print:bg-slate-100">
                {Array.from({ length: ctCount }).map((_, i) => (
                  <th key={`cth-${i}`} className="p-1.5 border border-black text-center font-bold w-14 min-w-[54px]">
                    CT {i + 1}
                  </th>
                ))}
                <th className="p-1.5 border border-black text-center font-bold bg-[#e5e5e5] w-20 min-w-[65px]">AVERAGE</th>
                
                {Array.from({ length: cpCount }).map((_, i) => (
                  <th key={`cph-${i}`} className="p-1.5 border border-black text-center font-bold w-14 min-w-[48px]">CP {i + 1}</th>
                ))}
                <th className="p-1.5 border border-black text-center font-bold bg-[#e5e5e5] w-20 min-w-[65px]">AVERAGE</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => {
                const hasTheoryScores = row.ctScores.some(s => s !== "" && !isNaN(Number(s)));
                const hasScores = hasTheoryScores || row.cpScores.some(s => s !== "" && !isNaN(Number(s)));

                return (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-1.5 border border-black text-center font-bold">{row.sn}</td>
                    
                    {/* Candidate Reg Code */}
                    <td className="p-1 border border-black text-center">
                      <input 
                        type="text"
                        className="w-full text-center outline-none bg-transparent text-black font-bold font-mono text-[11px] px-1 py-0.5 rounded transition print:border-none" 
                        value={row.regCode}
                        onChange={(e) => handleRowChange(row.id, 'regCode', e.target.value)}
                        readOnly={isLocked}
                      />
                    </td>

                    {/* ADM NO */}
                    <td className="p-1 border border-black text-center">
                      <input 
                        type="text"
                        className="w-full text-center outline-none bg-transparent text-black font-bold font-mono text-[11px] px-1 py-0.5 rounded transition print:border-none" 
                        value={row.admNo}
                        onChange={(e) => handleRowChange(row.id, 'admNo', e.target.value)}
                        readOnly={isLocked}
                      />
                    </td>

                    {/* Candidate Name */}
                    <td className="p-1.5 border border-black text-left">
                      <input 
                        type="text"
                        className="w-full text-left outline-none bg-transparent text-black font-bold uppercase text-[12px] px-1 py-0.5 rounded transition print:border-none" 
                        value={row.name}
                        onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                        readOnly={isLocked}
                      />
                    </td>
                    
                    {/* CT Scores */}
                    {row.ctScores.map((score, i) => (
                      <td key={`ct-${i}`} className="p-1 border border-black text-center">
                        <input 
                          id={`cell-${rowIdx}-ct-${i}`}
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          placeholder=""
                          readOnly={isLocked}
                          className="w-full h-7 outline-none text-center bg-transparent font-bold text-xs text-black focus:bg-amber-50 rounded disabled:opacity-50 print:border-none" 
                          value={score} 
                          onChange={(e) => handleScoreChange(row.id, 'ct', i, e.target.value)}
                          onKeyDown={(e) => handleMatrixKeyDown(e, rowIdx, `ct-${i}`)}
                        />
                      </td>
                    ))}

                    <td className="p-1.5 border border-black text-center font-bold bg-[#e5e5e5] text-black text-xs">
                      {hasTheoryScores ? Math.round(row.ctAvg) : ""}
                    </td>
                    
                    {/* CP Scores */}
                    {row.cpScores.map((score, i) => (
                      <td key={`cp-${i}`} className="p-1 border border-black text-center">
                        <input 
                          id={`cell-${rowIdx}-cp-${i}`}
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          placeholder=""
                          readOnly={isLocked}
                          className="w-full h-7 outline-none text-center bg-transparent font-bold text-xs text-black focus:bg-amber-50 rounded disabled:opacity-50 print:border-none" 
                          value={score} 
                          onChange={(e) => handleScoreChange(row.id, 'cp', i, e.target.value)}
                          onKeyDown={(e) => handleMatrixKeyDown(e, rowIdx, `cp-${i}`)}
                        />
                      </td>
                    ))}
                    <td className="p-1.5 border border-black text-center font-bold bg-[#e5e5e5] text-black text-xs">
                      {row.cpScores.some(s => s !== "" && !isNaN(Number(s))) ? Math.round(row.cpAvg) : ""}
                    </td>
                    
                    {/* Weighted Marks */}
                    <td className="p-1.5 border border-black text-center font-bold bg-[#e5e5e5] text-black text-xs">
                      {hasScores ? row.weightedMark : ""}
                    </td>
                    
                    {/* Action buttons (print:hidden) */}
                    <td className="p-1 border-none text-center print:hidden">
                      <div className="flex items-center gap-1 justify-center">
                        <button
                          onClick={() => {
                            setSelectedCandidateForPractical(row);
                            setIsObservationModalOpen(true);
                          }}
                          className="text-amber-600 hover:text-amber-800 font-bold p-1 rounded hover:bg-amber-50 transition"
                          title={`Evaluate Practical Observation Checklist for ${row.name}`}
                        >
                          <PenTool className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => removeRow(row.id)} 
                          className="text-red-500 hover:text-red-700 font-bold p-1 rounded hover:bg-red-50 transition" 
                          title="Remove Candidate"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Notes & Official TVET CDACC Sign-Off Block */}
        <div className="mt-6 text-[11px] space-y-4 avoid-break" style={{ fontFamily: 'Maiandra GD, Calibri, sans-serif' }}>
          <div>
            <p className="font-bold mb-1">Note:</p>
            <ol className="list-decimal pl-5 space-y-0.5 text-slate-800 print:text-black">
              <li>There is no limit on the number of formative assessment tests for theory as well as practical and hence the marks sheet can be adjusted as necessary.</li>
              <li>The marks in the average column for CT and CP are the ones to be entered in the Council’s Assessment Portal.</li>
              <li>To arrive at Weighted marks, use Average marks for Theory and Practical as per the ratio below depending on the level of the course:</li>
            </ol>
            <div className="mt-2 space-y-0.5 font-bold ml-5 text-black">
              <p>Level 6 = ( Theory × 0.5) + ( Practical × 0.5)</p>
              <p>Level 5 = ( Theory × 0.4) + ( Practical × 0.6)</p>
              <p>Level 4 = ( Theory × 0.3) + ( Practical × 0.7)</p>
              <p>Level 3 = ( Theory × 0.2) + ( Practical × 0.8)</p>
            </div>
          </div>

          {/* Official TVET CDACC Approval Block */}
          <div className="pt-3 space-y-2.5 text-[12px] text-black">
            <div className="font-bold">Approved by:</div>
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">1. Name of Internal Assessor:</span>
                <input
                  value={assessorName}
                  onChange={(e) => setAssessorName(e.target.value)}
                  className="font-bold border-b border-dotted border-black outline-none bg-transparent w-56 px-1 text-xs"
                />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">Signature:</span>
                <span className="border-b border-dotted border-black w-48 text-center font-serif italic text-xs">
                  {isLocked ? "Alexander Kinoti" : "........................"}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">Date:</span>
                <input
                  value={poeDate}
                  onChange={(e) => setPoeDate(e.target.value)}
                  className="border-b border-dotted border-black outline-none bg-transparent w-36 px-1 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">2. Name of Internal Verifier:</span>
                <input
                  value={verifierName}
                  onChange={(e) => setVerifierName(e.target.value)}
                  className="font-bold border-b border-dotted border-black outline-none bg-transparent w-56 px-1 text-xs"
                />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">Signature:</span>
                <span className="border-b border-dotted border-black w-36 text-center font-serif italic text-xs">
                  {isLocked ? "Verified — HOD" : "........................"}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">Date:</span>
                <input
                  value={poeDate}
                  onChange={(e) => setPoeDate(e.target.value)}
                  className="border-b border-dotted border-black outline-none bg-transparent w-32 px-1 text-xs"
                />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">Institutional stamp:</span>
                <span className="border-b border-dotted border-black w-36 text-center text-xs">
                  ........................
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Practical Observation Checklist Modal (TVET CDACC Workshop / Laboratory Tool) */}
      <ObservationChecklistMarkingModal
        isOpen={isObservationModalOpen}
        onClose={() => setIsObservationModalOpen(false)}
        candidateName={selectedCandidateForPractical?.name || "Nthiga Gakii Doris"}
        candidateRegCode={selectedCandidateForPractical?.admNo || selectedCandidateForPractical?.regCode || "14179/S2026"}
        unitCode={unitCode}
        unitTitle={unitTitle}
        onSave={(total, pct, comp, feed) => {
          if (selectedCandidateForPractical) {
            handleScoreChange(selectedCandidateForPractical.id, 'cp', 0, String(pct));
            syncScoreToContinuousMarksheet({
              traineeId: selectedCandidateForPractical.id,
              taskCode: "CP1",
              percentageScore: pct,
              unitOfferingId,
              level,
            });
            toast.success(`Recorded ${total}/50 (${pct}%) on CP1 for ${selectedCandidateForPractical.name}`);
          }
        }}
      />
    </div>
  );
}
export default AssessmentMarksSheet;
