import React, { useState, useEffect, useMemo } from "react";
import { Plus, Save, Printer, Download, Lock, Unlock, Users, PenTool, RefreshCw, Search, X, CheckCircle2, AlertCircle, Award, Scale } from "lucide-react";
import { supabase, isSupabaseConfigured, normalizeAssessmentTaskSlot } from "@/lib/supabase";
import { toast } from "sonner";
import { useTrainees, findMatchingTrainee, syncScoreToContinuousMarksheet, getTraineesForClass } from "@/contexts/TraineeContext";
import { useExam } from "@/contexts/ExamContext";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentTrainerProfile } from "@/lib/timetableSyncService";
import ObservationChecklistMarkingModal from "./ObservationChecklistMarkingModal";
import { calculateCdaccWeightedMark } from "@/lib/assessmentTaxonomy";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface AssessmentRow {
  id: string;
  sn: number;
  regCode: string;
  admNo: string;
  name: string;
  ctScores: (number | string)[]; // Strictly [CT1, CT2, CT3]
  cpScores: (number | string)[]; // Strictly [CP1, CP2, CP3]
  ctAvg: number;
  cpAvg: number;
  weightedMark: number;
  internalContribution: number;
  passedTheoryHurdle: boolean;
  passedPracticalHurdle: boolean;
  isCompetent: boolean;
  gradeBand: "Distinction" | "Credit" | "Pass" | "Refer";
}

const DEFAULT_LS_CT1_MARKS: Record<string, number> = {
  "14009": 70, // Vick Mutembei
  "14024": 68, // Kajuju Jackline Kathera
  "14032": 72, // Muthike Bredah Nyawira
  "14092": 65, // Murithi Brian Munene
  "14120": 74, // Glory Makena
  "14348": 62, // Okello Janet Auma
  "14403": 69, // Mutegi Kagendo Emma
  "14428": 71, // Risper Mwendwa
  "14502": 66, // Mutegi Hyprith Gatwiri
  "14001": 73, // Njeru Salim Mutemi
  "14011": 75, // Jedida Karwitha
  "14066": 64, // Nyaga Caroline Mukami
  "14183": 70, // Gideon Mucheria Kithendu
  "14256": 67, // Linus Murerwa
  "14283": 72, // Caroline Mwendwa
  "14331": 68, // Brian Mutembei
  "14332": 65, // Kipngetich Cornelius
  "14351": 71, // Otieno Jecinter Trizer
  "14451": 69, // Caroline Kanana Mwirigi
  "D/UPNUT/25042/069": 74, // Harriet Mwendwa
};

export function AssessmentMarksSheet() {
  const [centerCode, setCenterCode] = useState("01200004");
  const [level, setLevel] = useState<number>(4);
  const [courseCode, setCourseCode] = useState("061004T4ICT");
  const [courseTitle, setCourseTitle] = useState("ICT 4 / ICT Technician Level 5 & 6");
  const [unitCode, setUnitCode] = useState("IT/CU/ICTA/CR/01/4/MA");
  const [unitTitle, setUnitTitle] = useState("PERFORM COMPUTER ESSENTIALS");
  const [termDates, setTermDates] = useState("From 31 AUG 2026 to 20 NOV 2026");
  const [poeDate, setPoeDate] = useState("07/10/2026");
  const [assessmentSeries, setAssessmentSeries] = useState("NOV/DEC 2026");

  const { user } = useAuth();
  const isPrivileged = user?.role === "admin" || user?.role === "hod";
  const profile = getCurrentTrainerProfile(user);

  // Sign-off names
  const [assessorName, setAssessorName] = useState(() => (user?.name || "Alexander Kinoti"));
  const [verifierName, setVerifierName] = useState("HOD Computing & Informatics");
  
  // Class selection for targeted marksheet - remembers trainer selection across reloads
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mtti_last_selected_class");
      if (saved) return saved;
    }
    return "LS5/6/S/26";
  });
  const [unitOfferingId] = useState("uo_1");
  const [isLocked, setIsLocked] = useState(false); // Internal Assessor Sign-off
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);

  // Canonical 3 Continuous Theory and 3 Continuous Practical slots
  const ctCount = 3;
  const cpCount = 3;

  const [rows, setRows] = useState<AssessmentRow[]>([]);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [selectedCandidateForPractical, setSelectedCandidateForPractical] = useState<AssessmentRow | null>(null);
  const [selectedPracticalSlot, setSelectedPracticalSlot] = useState<"CP1" | "CP2" | "CP3">("CP1");

  // Dynamic assessment health & status metrics (calculated from current entered marks)
  const assessmentStats = useMemo(() => {
    const total = rows.length;
    let fullyGraded = 0;
    let pendingTheory = 0;
    let pendingPractical = 0;
    let competentCount = 0;

    for (const r of rows) {
      const hasCT = r.ctScores.some((s) => s !== "" && !isNaN(Number(s)));
      const hasCP = r.cpScores.some((s) => s !== "" && !isNaN(Number(s)));
      if (hasCT && hasCP) fullyGraded++;
      if (!hasCT) pendingTheory++;
      if (!hasCP) pendingPractical++;
      if (r.isCompetent) competentCount++;
    }

    return {
      total,
      fullyGraded,
      pendingTheory,
      pendingPractical,
      competentCount,
      notYetCompetent: total - competentCount,
      pctGraded: total > 0 ? Math.round((fullyGraded / total) * 100) : 0,
      pctCompetent: total > 0 ? Math.round((competentCount / total) * 100) : 0,
    };
  }, [rows]);

  // Filtered rows for live candidate search while preserving all master rows & entered marks
  const displayedRows = useMemo(() => {
    if (!candidateSearch.trim()) return rows;
    const q = candidateSearch.trim().toLowerCase();
    return rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.admNo.toLowerCase().includes(q) ||
      r.regCode.toLowerCase().includes(q)
    );
  }, [rows, candidateSearch]);

  const { trainees, uploads } = useTrainees();
  const { exams, submissions } = useExam();

  useEffect(() => {
    const handleMarksUpdated = () => setSyncVersion((v) => v + 1);
    window.addEventListener("mtti-marks-updated", handleMarksUpdated);
    return () => window.removeEventListener("mtti-marks-updated", handleMarksUpdated);
  }, []);

  // Distinct classes available from trainees roster (scoped to this trainer's teaching cohorts if in trainer portal)
  const availableClasses = useMemo(() => {
    const rawClasses = Array.from(new Set(trainees.map(t => t.classCode).filter(Boolean)))
      .filter(cls => cls !== "FBS6 MOD/12026" && !cls.includes("12026"));
    
    if (!isPrivileged && profile.classes && profile.classes.length > 0) {
      const trainerClasses = new Set(profile.classes.map(c => c.toUpperCase().trim()));
      const scoped = rawClasses.filter(c => trainerClasses.has(c.toUpperCase().trim()));
      return scoped.length > 0 ? scoped : rawClasses;
    }
    return rawClasses;
  }, [trainees, isPrivileged, profile]);

  const getClassStorageKey = (cls: string) => {
    const clean = cls.replace(/[^a-zA-Z0-9_-]/g, "_");
    return `mtti_marks_cls_${clean}`;
  };

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
    const classTrainees = getTraineesForClass(trainees, selectedClass);

    let targetLevel = 4;
    if (selectedClass.includes("FBS")) {
      targetLevel = 5;
      setLevel(5);
      setCourseTitle("Food & Beverage Sales and Service Management Level 5 & 6");
      setCourseCode("101305T4FBS");
      setUnitCode("0611 551 01A");
      setUnitTitle("APPLY DIGITAL LITERACY");
      setTermDates("From 31 AUG 2026 to 20 NOV 2026");
    } else if (selectedClass.includes("ADMIN")) {
      targetLevel = 5;
      setLevel(5);
      setCourseTitle("Office Administrator Level 5");
      setCourseCode("041505T4OA");
      setUnitCode("0415 451 21A");
      setUnitTitle("APPLY ICT SKILLS");
      setTermDates("From 31 AUG 2026 to 20 NOV 2026");
    } else if (selectedClass.includes("LS")) {
      targetLevel = 6;
      setLevel(6);
      setCourseTitle("Diploma in Land Survey (Level 6)");
      setCourseCode("073106T4LS");
      setUnitCode("0611 551 01A");
      setUnitTitle("APPLY DIGITAL LITERACY");
      setTermDates("From 31 AUG 2026 to 20 NOV 2026");
    } else if (selectedClass.includes("ITECH6") || selectedClass.includes("ITECH 6")) {
      targetLevel = 6;
      setLevel(6);
      setCourseTitle("Diploma in Information Communication Technology (Level 6)");
      setCourseCode("061006T4ICT");
      setUnitCode("IT/CU/ICTA/CR/01/6/MA");
      setUnitTitle("PERFORM COMPUTER ESSENTIALS");
      setTermDates("From 31 AUG 2026 to 20 NOV 2026");
    } else if (selectedClass.includes("ITECH5") || selectedClass.includes("ITECH 5")) {
      targetLevel = 5;
      setLevel(5);
      setCourseTitle("Craftsperson in Information Communication Technology (Level 5)");
      setCourseCode("061005T4ICT");
      setUnitCode("IT/CU/ICTA/CC/01/5/MA");
      setUnitTitle("APPLY BASIC ELECTRONICS");
      setTermDates("From 31 AUG 2026 to 20 NOV 2026");
    } else if (selectedClass.includes("ICT4") || selectedClass.includes("ICT 4")) {
      targetLevel = 4;
      setLevel(4);
      setCourseTitle("Certificate in Information Communication Technology (Level 4)");
      setCourseCode("061004T4ICT");
      setUnitCode("IT/CU/ICTA/CR/01/4/MA");
      setUnitTitle("PERFORM COMPUTER ESSENTIALS");
      setTermDates("From 31 AUG 2026 to 20 NOV 2026");
    }

    let savedMarks: any[] = [];
    const clsKey = getClassStorageKey(selectedClass);
    try {
      // 1. Try class-isolated storage first
      const rawCls = localStorage.getItem(clsKey);
      if (rawCls) savedMarks = JSON.parse(rawCls);

      // 2. Also check legacy uo_1 storage and non-destructively merge any records for these trainees
      const rawUo1 = localStorage.getItem(`mtti_marks_${unitOfferingId}`);
      if (rawUo1) {
        const uo1Marks = JSON.parse(rawUo1);
        if (Array.isArray(uo1Marks)) {
          uo1Marks.forEach((entry: any) => {
            if (!savedMarks.some((m: any) => m.trainee_id === entry.trainee_id)) {
              savedMarks.push(entry);
            }
          });
        }
      }
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

          const subUnitNorm = (sub.unit_code || "").replace(/[^a-zA-Z0-9]/g, "");
          const exam = exams.find((e) => (e.unit_code || "").replace(/[^a-zA-Z0-9]/g, "") === subUnitNorm || e.id === sub.exam_id);
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

        // 4. Protect & auto-seed canonical CT1 marks for Land Survey (LS5/6/S/26) cohort if not yet manually overridden
        if ((t.classCode.includes("LS") || selectedClass.includes("LS")) && initCtScores[0] === "") {
          const admClean = (cleanAdm || "").trim();
          if (DEFAULT_LS_CT1_MARKS[admClean] !== undefined) {
            initCtScores[0] = String(DEFAULT_LS_CT1_MARKS[admClean]);
          }
        }

        const ctAvg = calculateAverages(initCtScores);
        const cpAvg = calculateAverages(initCpScores);
        const cdacc = calculateCdaccWeightedMark(ctAvg, cpAvg, targetLevel);

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
          weightedMark: cdacc.weightedMark,
          internalContribution: cdacc.internalCertificationContribution,
          passedTheoryHurdle: cdacc.passedTheoryHurdle,
          passedPracticalHurdle: cdacc.passedPracticalHurdle,
          isCompetent: cdacc.isCompetent,
          gradeBand: cdacc.gradeBand,
        };
      })
    );
  }, [selectedClass, trainees, uploads, submissions, exams, ctCount, cpCount, syncVersion]);

  // Recalculate CDACC double-hurdle weighting and 60% internal certification contribution when scores or level change
  useEffect(() => {
    setRows((prev) =>
      prev.map((row) => {
        const ctAvg = calculateAverages(row.ctScores);
        const cpAvg = calculateAverages(row.cpScores);
        const cdacc = calculateCdaccWeightedMark(ctAvg, cpAvg, level);
        return {
          ...row,
          ctAvg,
          cpAvg,
          weightedMark: cdacc.weightedMark,
          internalContribution: cdacc.internalCertificationContribution,
          passedTheoryHurdle: cdacc.passedTheoryHurdle,
          passedPracticalHurdle: cdacc.passedPracticalHurdle,
          isCompetent: cdacc.isCompetent,
          gradeBand: cdacc.gradeBand,
        };
      })
    );
  }, [level]);

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
        }
        newRow.ctAvg = calculateAverages(newRow.ctScores);
        newRow.cpAvg = calculateAverages(newRow.cpScores);
        const cdacc = calculateCdaccWeightedMark(newRow.ctAvg, newRow.cpAvg, level);
        newRow.weightedMark = cdacc.weightedMark;
        newRow.internalContribution = cdacc.internalCertificationContribution;
        newRow.passedTheoryHurdle = cdacc.passedTheoryHurdle;
        newRow.passedPracticalHurdle = cdacc.passedPracticalHurdle;
        newRow.isCompetent = cdacc.isCompetent;
        newRow.gradeBand = cdacc.gradeBand;
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
        internalContribution: 0,
        passedTheoryHurdle: false,
        passedPracticalHurdle: false,
        isCompetent: false,
        gradeBand: "Refer",
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

        // Synchronize with Centralized Backend Database Persistence Layer
        try {
          const batchMarks = payload.map((p: any) => ({
            traineeId: p.trainee_id,
            cpScore: typeof p.cp_avg === "number" ? p.cp_avg : undefined,
            ctScore: typeof p.ct_avg === "number" ? p.ct_avg : undefined,
            projectScore: typeof p.project_score === "number" ? p.project_score : undefined,
          }));
          await fetch('/api/marks/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              unitOfferingId,
              marks: batchMarks
            })
          });
        } catch (apiErr) {
          console.warn("Backend API marks batch save warning:", apiErr);
        }
      } 
      
      const clsKey = getClassStorageKey(selectedClass);
      localStorage.setItem(clsKey, JSON.stringify(payload));

      try {
        const rawExisting = localStorage.getItem(`mtti_marks_${unitOfferingId}`);
        let existingList: any[] = [];
        if (rawExisting) {
          try { existingList = JSON.parse(rawExisting); } catch {}
        }
        if (!Array.isArray(existingList)) existingList = [];
        const payloadTraineeIds = new Set(payload.map(p => p.trainee_id));
        const retainedOtherClasses = existingList.filter(e => !payloadTraineeIds.has(e.trainee_id));
        const merged = [...retainedOtherClasses, ...payload];
        localStorage.setItem(`mtti_marks_${unitOfferingId}`, JSON.stringify(merged));
      } catch {
        localStorage.setItem(`mtti_marks_${unitOfferingId}`, JSON.stringify(payload));
      }

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
    setCandidateSearch("");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // High-Resolution Landscape PDF Exporter
  const handleDownloadPDF = async () => {
    try {
      setCandidateSearch("");
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
      <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3.5 print:hidden">
        {/* Row 1: Cohort Selection, CDACC Weighting Formula Badge, and Quick Candidate Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase">Class Cohort:</span>
            </div>
            <select
              value={selectedClass}
              onChange={(e) => {
                const nextCls = e.target.value;
                setSelectedClass(nextCls);
                try {
                  localStorage.setItem("mtti_last_selected_class", nextCls);
                } catch {}
              }}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none cursor-pointer"
            >
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls} ({getTraineesForClass(trainees, cls).length} trainees)
                </option>
              ))}
            </select>

            {/* CDACC Double-Hurdle Weighting Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold">
              <Scale className="w-3.5 h-3.5" />
              <span>
                Level {level} Formula: <strong>{level === 6 ? "50% CT / 50% CP" : level === 5 ? "40% CT / 60% CP" : level === 4 ? "30% CT / 70% CP" : "20% CT / 80% CP"}</strong>
              </span>
            </div>

            <span className="text-xs text-muted-foreground font-medium">
              {rows.length} candidates loaded
            </span>
          </div>

          {/* Quick Candidate Search Filter */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter candidate by Name or Adm..."
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary font-medium text-foreground placeholder:text-muted-foreground"
            />
            {candidateSearch && (
              <button
                type="button"
                onClick={() => setCandidateSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                title="Clear filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Assessment Progress & Status Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-border/60">
          <div className="px-3 py-1.5 rounded-lg bg-muted/40 border border-border/70 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">Total Candidates</span>
            <strong className="text-xs font-bold text-foreground">{assessmentStats.total}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between">
            <span className="text-[11px] text-blue-800 dark:text-blue-300 font-medium">Fully Assessed</span>
            <strong className="text-xs font-bold text-blue-900 dark:text-blue-200">
              {assessmentStats.fullyGraded} / {assessmentStats.total} ({assessmentStats.pctGraded}%)
            </strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
            <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">Pending Tasks</span>
            <strong className="text-xs font-bold text-amber-900 dark:text-amber-200">
              {assessmentStats.pendingTheory} CT • {assessmentStats.pendingPractical} CP
            </strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">Competency Rate</span>
            <strong className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              {assessmentStats.competentCount} C ({assessmentStats.pctCompetent}%)
            </strong>
          </div>
        </div>

        {/* Row 3: Cohesive Action Toolbar Groupings */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/60">
          {/* Group A: Persistence & Assessment Sync */}
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={submitData}
              disabled={isLocked}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#000953] hover:bg-[#000e7a] text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50 border border-amber-500/30"
              title="Save all entered marks to database and storage"
            >
              <Save className="w-4 h-4 text-amber-400" />
              Save Marks
            </button>

            <button
              onClick={() => {
                setSyncVersion((v) => v + 1);
                toast.success("Synchronized graded Continuous Theory (CT1–CT3) & Practical (CP1–CP3) assessments.");
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded-lg text-xs font-bold transition shadow-xs"
              title="Sync all graded CT and CP assessments into the Marksheet"
            >
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              Sync Graded Assessments
            </button>
          </div>

          {/* Group B: Practical & Candidate Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setSelectedCandidateForPractical(null);
                setIsObservationModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-700 dark:text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition shadow-xs"
              title="Open Practical Observation Checklist"
            >
              <PenTool className="w-4 h-4 text-red-600 dark:text-red-400" />
              Practical Observation Tool
            </button>

            <button
              onClick={addRow}
              disabled={isLocked}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
              title="Add candidate row"
            >
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Add Candidate
            </button>
          </div>

          {/* Group C: Export & Governance */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition shadow-xs"
              title="Print Official Sheet in Landscape"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Marksheet (Landscape)
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 text-white hover:bg-blue-800 rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
              title="Download Landscape PDF"
            >
              <Download className="w-3.5 h-3.5" />
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
          </div>
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
                <th className="p-2 border border-black font-bold text-center w-36 min-w-[130px]" rowSpan={2}>Candidate’s Reg Code</th>
                <th className="p-2 border border-black font-bold text-center w-28 min-w-[95px]" rowSpan={2}>ADM NO</th>
                <th className="p-2 border border-black font-bold text-center min-w-[180px]" rowSpan={2}>Candidate’s Name</th>
                <th className="p-2 border border-black font-bold text-center" colSpan={4}>
                  Continuous Theory (CT) Marks (100%)
                </th>
                <th className="p-2 border border-black font-bold text-center" colSpan={4}>
                  Continuous Practical (CP) Marks (100%)
                </th>
                <th className="p-2 border border-black font-bold text-center w-20 min-w-[70px]" rowSpan={2} title="Weighted continuous assessment mark per course Level">Weighted (100%)</th>
                <th className="p-2 border-none font-bold text-center print:hidden w-12" rowSpan={2}></th>
              </tr>
              <tr className="bg-slate-100 print:bg-slate-100">
                <th className="p-1.5 border border-black text-center font-bold w-14 min-w-[48px]" title="Written Assessment I (Exam 1)">CT 1</th>
                <th className="p-1.5 border border-black text-center font-bold w-14 min-w-[48px]" title="Written Assessment II (Exam 2)">CT 2</th>
                <th className="p-1.5 border border-black text-center font-bold w-14 min-w-[48px]" title="Written Assessment III (Exam 3)">CT 3</th>
                <th className="p-1.5 border border-black text-center font-bold bg-[#e5e5e5] w-16 min-w-[55px]">AVERAGE</th>
                
                <th className="p-1.5 border border-black text-center font-bold w-14 min-w-[48px]" title="Practical Assessment I (Prac 1)">CP 1</th>
                <th className="p-1.5 border border-black text-center font-bold w-14 min-w-[48px]" title="Practical Assessment II (Prac 2)">CP 2</th>
                <th className="p-1.5 border border-black text-center font-bold w-14 min-w-[48px]" title="Practical Assessment III (Prac 3)">CP 3</th>
                <th className="p-1.5 border border-black text-center font-bold bg-[#e5e5e5] w-16 min-w-[55px]">AVERAGE</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-6 text-center text-slate-500 font-medium italic">
                    No candidate found matching &quot;{candidateSearch}&quot;. Clear search to view all {rows.length} candidates.
                  </td>
                </tr>
              ) : (
                displayedRows.map((row) => {
                  const rowIdx = rows.findIndex((r) => r.id === row.id);
                  const hasTheoryScores = row.ctScores.some((s) => s !== "" && !isNaN(Number(s)));
                  const hasScores = hasTheoryScores || row.cpScores.some((s) => s !== "" && !isNaN(Number(s)));

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
                    
                    {/* CT Scores (CT1, CT2, CT3) */}
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
                    
                    {/* CP Scores (CP1, CP2, CP3) */}
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
                    
                    {/* Weighted Marks (100%) */}
                    <td className="p-1.5 border border-black text-center font-bold bg-[#e5e5e5] text-black text-xs">
                      {hasScores ? `${row.weightedMark}%` : ""}
                    </td>
                    
                    {/* Action buttons (print:hidden) */}
                    <td className="p-1 border-none text-center print:hidden">
                      <div className="flex items-center gap-1 justify-center">
                        <button
                          onClick={() => {
                            setSelectedCandidateForPractical(row);
                            setSelectedPracticalSlot("CP1");
                            setIsObservationModalOpen(true);
                          }}
                          className="text-amber-600 hover:text-amber-800 font-bold p-1 rounded hover:bg-amber-50 transition"
                          title={`Evaluate Practical Observation Checklist for ${row.name} (CP1/CP2/CP3)`}
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
              })
            )}
          </tbody>
          </table>
        </div>

        {/* Footer Notes & Official TVET CDACC Sign-Off Block */}
        <div className="mt-6 text-[11px] space-y-4 avoid-break" style={{ fontFamily: 'Maiandra GD, Calibri, sans-serif' }}>
          <div>
            <p className="font-bold mb-1">Canonical Continuous Assessment Standards (TVET CDACC):</p>
            <ol className="list-decimal pl-5 space-y-0.5 text-slate-800 print:text-black">
              <li>Continuous Formative Assessment recognizes strictly: Continuous Theory (CT1, CT2, CT3) and Continuous Practical (CP1, CP2, CP3).</li>
              <li>CDACC Double-Hurdle Rule: Candidate MUST attain at least 50% in Theory Average (CT) AND at least 50% in Practical Average (CP) to be certified as "Competent". Failing either hurdle results in "Refer [NYC]".</li>
              <li>The marks in the average column for CT and CP are the ones to be entered in the Council’s Assessment Portal.</li>
              <li>To arrive at Weighted marks, use Average marks for Theory and Practical as per the level ratio below:</li>
            </ol>
            <div className="mt-2 space-y-0.5 font-bold ml-5 text-black">
              <p>Level 6 = ( Theory × 0.50 ) + ( Practical × 0.50 )</p>
              <p>Level 5 = ( Theory × 0.40 ) + ( Practical × 0.60 )</p>
              <p>Level 4 = ( Theory × 0.30 ) + ( Practical × 0.70 )</p>
              <p>Level 3 = ( Theory × 0.20 ) + ( Practical × 0.80 )</p>
            </div>
            <p className="mt-2 text-slate-800 print:text-black font-semibold ml-5">
              * Internal Certification Contribution: Formative continuous assessment contributes 60% towards the final TVET CDACC National Qualification award.
            </p>
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
        candidateId={selectedCandidateForPractical?.id}
        targetSlot={selectedPracticalSlot}
        unitCode={unitCode}
        unitTitle={unitTitle}
        onSave={(total, pct, comp, feed, slot) => {
          if (selectedCandidateForPractical) {
            const chosenSlot = slot || selectedPracticalSlot || "CP1";
            const slotIdx = chosenSlot === "CP3" ? 2 : chosenSlot === "CP2" ? 1 : 0;
            handleScoreChange(selectedCandidateForPractical.id, 'cp', slotIdx, String(pct));
            syncScoreToContinuousMarksheet({
              traineeId: selectedCandidateForPractical.id,
              taskCode: chosenSlot,
              percentageScore: pct,
              unitOfferingId,
              level,
            });
            toast.success(`Recorded ${total}/50 (${pct}%) on ${chosenSlot} for ${selectedCandidateForPractical.name}`);
          }
        }}
      />
    </div>
  );
}
export default AssessmentMarksSheet;
