/**
 * AcademicWorkspaceShell.tsx
 * The master wrapper for the drafting module & Context-Aware Dashboard.
 * Includes AI document ingestion, real-time PDF generation, outcomes mapping,
 * and quick-marking attendance modals.
 * 
 * Strict compliance with MTTI Design System:
 * - Primary Color: Blue (#000953)
 * - Accent Color: Gold (#c48820)
 * - Typography: Maiandra GD (Base font size: 11pt/11px)
 */

import React, { useState, useEffect } from "react";
import TrainerLayout from "@/components/TrainerLayout";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getStoredSessionPlans, saveStoredSessionPlans, getStoredLearningPlans, getStoredRecordsOfWork, saveStoredRecordsOfWork, SessionDeliveryStep, SessionPlan } from "@/lib/mockSessionPlans";
import { getCurriculumUnits, getUnitDetails, CurriculumUnit } from "@/lib/curriculumDatabase";
import { Plus, Trash2, Save, Printer, Sparkles, BookOpen, Clock, FileText, CheckCircle, UploadCloud, Edit3, ArrowRight, Check, ChevronDown, ChevronUp, GripVertical, QrCode } from "lucide-react";
import AttendanceQuickMarkModal from "@/components/AttendanceQuickMarkModal";
import WorkshopDoorQRModal from "@/components/WorkshopDoorQRModal";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Helper for CDACC assessment question criteria matching
const CDACC_LEVEL_GRADES = {
  6: "50% Cognitive Theory (CT) / 50% Practical Performance (CP)",
  5: "40% Cognitive Theory (CT) / 60% Practical Performance (CP)",
  4: "30% Cognitive Theory (CT) / 70% Practical Performance (CP)",
  3: "20% Cognitive Theory (CT) / 80% Practical Performance (CP)"
};

function SortableActivityItem(props: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? "rgba(0, 9, 83, 0.05)" : undefined,
    position: "relative" as any,
    zIndex: isDragging ? 10 : 1
  };

  return (
    <tr ref={setNodeRef} style={style} className={`hover:bg-secondary/10 ${isDragging ? "shadow-md" : ""}`}>
      <td className="p-1 w-8 text-center cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground" {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4 mx-auto" />
      </td>
      <td className="p-1">
        <input
          className="w-full text-center px-1 py-1 border border-border rounded bg-background text-xs"
          type="number"
          value={props.act.time_minutes}
          onChange={e => props.onChange("time_minutes", Number(e.target.value))}
        />
      </td>
      <td className="p-1">
        <input
          className="w-full px-2 py-1 border border-border rounded bg-background text-xs"
          value={props.act.trainer_activity}
          onChange={e => props.onChange("trainer_activity", e.target.value)}
        />
      </td>
      <td className="p-1">
        <input
          className="w-full px-2 py-1 border border-border rounded bg-background text-xs"
          value={props.act.learner_activity}
          onChange={e => props.onChange("learner_activity", e.target.value)}
        />
      </td>
      <td className="p-1">
        <input
          className="w-full px-2 py-1 border border-border rounded bg-background text-xs"
          value={props.act.assessment}
          onChange={e => props.onChange("assessment", e.target.value)}
        />
      </td>
      <td className="p-1 text-center">
        <button
          type="button"
          onClick={props.onRemove}
          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"
          title="Remove Step"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

export default function AcademicWorkspaceShell() {
  // Context states
  const [terms, setTerms] = useState<any[]>([{ id: "t-1", name: "Term 1 2026" }]);
  const [classes, setClasses] = useState<any[]>([{ id: "c-1", class_code: "ITECH6/M/24" }, { id: "c-2", class_code: "BUS/L5/25" }]);
  const [units, setUnits] = useState<any[]>([]);
  const [activeTerm, setActiveTerm] = useState("t-1");
  const [activeClass, setActiveClass] = useState("ITECH6/M/24");
  const [activeUnit, setActiveUnit] = useState("");
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeSessionNo, setActiveSessionNo] = useState(1);
  
  // Enrolled trainees and active learning outcomes
  const [trainees, setTrainees] = useState<any[]>([]);
  const [activeLearningPlan, setActiveLearningPlan] = useState<any>(null);
  const [availableOutcomes, setAvailableOutcomes] = useState<string[]>([]);
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([]);

  // Editor states
  const [activeTab, setActiveTab] = useState<"session" | "row" | "ingest">("session");
  const [sessionTitle, setSessionTitle] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("10:30-12:30");
  const [resources, setResources] = useState("Projector, lab workstations, reference materials");
  const [safety, setSafety] = useState("Ergonomic guidelines, electrical safety protocols.");
  const [introduction, setIntroduction] = useState("Brief overview of today's learning outcomes.");
  const [activities, setActivities] = useState<SessionDeliveryStep[]>([
    { time_minutes: 40, trainer_activity: "Present concepts on the topic.", learner_activity: "Active listening and note-taking.", assessment: "Oral Questioning" },
    { time_minutes: 60, trainer_activity: "Demonstrate and supervise practical application.", learner_activity: "Execute practical tasks on workstations.", assessment: "Observation" },
    { time_minutes: 20, trainer_activity: "Review progress and address challenges.", learner_activity: "Present completed tasks.", assessment: "Practical Checklist" }
  ]);
  const [sessionReview, setSessionReview] = useState("");
  const [assignment, setAssignment] = useState("");
  const [reflection, setReflection] = useState("");

  // Record of work states
  const [rowHours, setRowHours] = useState(2.0);
  const [rowWorkCovered, setRowWorkCovered] = useState("");
  const [rowReflection, setRowReflection] = useState("");
  const [rowStatus, setRowStatus] = useState<"delivered" | "partial" | "postponed">("delivered");

  // Document preview state
  const [isSigning, setIsSigning] = useState(false);
  const [currentSessionPlanId, setCurrentSessionPlanId] = useState("");
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  
  // AI Ingestion States
  const [isGenerating, setIsGenerating] = useState(false);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  // Load baseline values
  useEffect(() => {
    loadDropdownData();
  }, []);

  // UI Refinement States
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    outcomes: true,
    resources: true,
    delivery: true
  });

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Auto-Save Effect
  useEffect(() => {
    if (!currentSessionPlanId) return;
    setIsSaving(true);
    const timer = setTimeout(() => {
      // Here you would normally dispatch an API call or update the mock DB.
      // For now we just simulate the UI feedback.
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1500);
    return () => clearTimeout(timer);
  }, [sessionTitle, deliveryTime, selectedOutcomes, resources, safety, introduction, activities, sessionReview, assignment, reflection]);



  const loadDropdownData = async () => {
    try {
      // 1. Load official CDACC Units from D:\Curriculum and OS Database
      const dbUnits = await getCurriculumUnits();
      const formattedDbUnits = dbUnits.map(u => ({
        id: u.unit_code,
        unit_code: u.unit_code,
        unit_name: `${u.unit_title} (${u.unit_code})`,
        raw_name: u.unit_title,
        level: u.level,
        department: u.department
      }));

      // Fallback/merge with stored learning plans
      const mockLps = getStoredLearningPlans();
      const uniqueUnitCodes = Array.from(new Set(mockLps.map(l => l.unit_code)));
      uniqueUnitCodes.forEach(code => {
        if (!formattedDbUnits.some(u => u.unit_code === code)) {
          const matchingLp = mockLps.find(l => l.unit_code === code);
          formattedDbUnits.push({
            id: code,
            unit_code: code,
            unit_name: matchingLp?.unit_name || code,
            raw_name: matchingLp?.unit_name || code,
            level: code.includes("/6/") || code.includes("Level 6") ? 6 : 5,
            department: "Computing and Informatics"
          });
        }
      });

      setUnits(formattedDbUnits);

      // Check if user came from CurriculumParsingHub with pre-selected unit
      const savedUnitStr = localStorage.getItem("selected_curriculum_unit");
      if (savedUnitStr) {
        try {
          const parsed = JSON.parse(savedUnitStr);
          if (parsed?.unit_code) {
            setActiveUnit(parsed.unit_code);
            localStorage.removeItem("selected_curriculum_unit");
          }
        } catch (e) {}
      } else if (formattedDbUnits.length > 0 && !activeUnit) {
        setActiveUnit(formattedDbUnits[0].unit_code);
      }

      if (isSupabaseConfigured()) {
        const { data: termsData } = await (supabase as any).from("terms").select("*");
        const { data: classesData } = await (supabase as any).from("classes").select("*");
        const { data: unitsData } = await (supabase as any).from("units_of_competence").select("*");
        
        if (termsData && termsData.length > 0) setTerms(termsData);
        if (classesData && classesData.length > 0) setClasses(classesData);
        if (unitsData && unitsData.length > 0) {
          setUnits(unitsData);
          if (!savedUnitStr) setActiveUnit(unitsData[0].unit_code);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger when context changes (Class, Unit, Week, Session)
  useEffect(() => {
    if (activeUnit) {
      loadContextDetails();
    }
  }, [activeClass, activeUnit, activeWeek, activeSessionNo]);

  const loadContextDetails = async () => {
    try {
      const mockLps = getStoredLearningPlans();
      const matchingWeekLp = mockLps.find(
        l => l.unit_code === activeUnit && l.week_number === activeWeek
      );

      if (matchingWeekLp) {
        setActiveLearningPlan(matchingWeekLp);
        setAvailableOutcomes(matchingWeekLp.learning_outcomes || []);
        
        const storedPlans = getStoredSessionPlans();
        const existing = storedPlans.find(
          p => p.unit_code === activeUnit && p.week_number === activeWeek && ((p as any).session_number === activeSessionNo || (!((p as any).session_number) && activeSessionNo === 1))
        );

        if (existing) {
          setCurrentSessionPlanId(existing.id);
          setSessionTitle(existing.session_title);
          setDeliveryTime(existing.time_duration);
          setSelectedOutcomes(existing.learning_outcomes || []);
          setSafety(existing.safety_requirements);
          setIntroduction(existing.introduction);
          setActivities(existing.delivery_steps || []);
          setSessionReview(existing.session_review);
          setAssignment(existing.assignment);
          setReflection(existing.reflection);
          setResources(existing.resources?.join(", ") || "");
        } else {
          setCurrentSessionPlanId(`plan-draft-${Date.now()}-w${activeWeek}-s${activeSessionNo}`);
          setSessionTitle(activeSessionNo > 1 ? `${matchingWeekLp.topic || ""} (Session ${activeSessionNo})` : (matchingWeekLp.topic || ""));
          setDeliveryTime("10:30-12:30");
          setSelectedOutcomes(matchingWeekLp.learning_outcomes || []);
          setSafety("Standard laboratory guidelines & computer safety.");
          setIntroduction(`Brief introduction to ${matchingWeekLp.topic} - Session ${activeSessionNo}.`);
          setActivities([
            { time_minutes: 40, trainer_activity: "Present concepts on the topic.", learner_activity: "Active listening and note-taking.", assessment: "Oral Questioning" },
            { time_minutes: 60, trainer_activity: "Demonstrate and supervise practical application.", learner_activity: "Execute practical tasks on workstations.", assessment: "Observation" },
            { time_minutes: 20, trainer_activity: "Review progress and address challenges.", learner_activity: "Present completed tasks.", assessment: "Practical Checklist" }
          ]);
          setSessionReview("");
          setAssignment("");
          setReflection("");
          setResources(matchingWeekLp.resources?.join(", ") || "Projector, lab workstations, reference materials");
        }
      } else {
        // Fallback to official CDACC unit database details
        const cdaccUnit = await getUnitDetails(activeUnit);
        if (cdaccUnit) {
          const weekIdx = Math.max(0, Math.min(9, activeWeek - 1));
          const weekData = cdaccUnit.weeks_breakdown?.[weekIdx];
          const outList = weekData?.outcomes || cdaccUnit.learning_outcomes?.map(o => o.title) || [];
          
          setAvailableOutcomes(cdaccUnit.learning_outcomes?.map(o => o.title) || outList);
          
          const storedPlans = getStoredSessionPlans();
          const existing = storedPlans.find(
            p => p.unit_code === activeUnit && p.week_number === activeWeek && ((p as any).session_number === activeSessionNo || (!((p as any).session_number) && activeSessionNo === 1))
          );

          if (existing) {
            setCurrentSessionPlanId(existing.id);
            setSessionTitle(existing.session_title);
            setDeliveryTime(existing.time_duration);
            setSelectedOutcomes(existing.learning_outcomes || []);
            setSafety(existing.safety_requirements);
            setIntroduction(existing.introduction);
            setActivities(existing.delivery_steps || []);
            setSessionReview(existing.session_review);
            setAssignment(existing.assignment);
            setReflection(existing.reflection);
            setResources(existing.resources?.join(", ") || "");
          } else {
            setCurrentSessionPlanId(`plan-cdacc-${Date.now()}-w${activeWeek}-s${activeSessionNo}`);
            const baseTitle = weekData?.title || `Week ${activeWeek}: ${cdaccUnit.unit_title}`;
            setSessionTitle(activeSessionNo > 1 ? `${baseTitle} (Session ${activeSessionNo})` : baseTitle);
            setDeliveryTime("10:30-12:30");
            setSelectedOutcomes(outList);
            setSafety(cdaccUnit.safety_protocols || "Standard workshop safety protocols & ergonomic setup.");
            setIntroduction(`Introduction to ${baseTitle} - Session ${activeSessionNo} as per CDACC occupational standards.`);
            setActivities([
              { time_minutes: 30, trainer_activity: "Exposition of technical principles & demonstration.", learner_activity: "Active observation & taking guided notes.", assessment: "Oral Questioning" },
              { time_minutes: 60, trainer_activity: "Supervise practical exercises on workstations.", learner_activity: "Execute practical task matching performance criteria.", assessment: "Observation Checklist" },
              { time_minutes: 30, trainer_activity: "Facilitate debrief and review competency achievements.", learner_activity: "Present task output & store in portfolio.", assessment: "Product Checklist" }
            ]);
            setSessionReview("");
            setAssignment(`Practice practical competencies for ${cdaccUnit.unit_title} and update portfolio.`);
            setReflection("Trainees demonstrated acceptable competency standard.");
            setResources(weekData?.resources?.join(", ") || cdaccUnit.suggested_resources?.join(", ") || "Projector, lab workstations, CDACC standard guide");
          }
        }
      }

      if (isSupabaseConfigured()) {
        const { data: lpData } = await (supabase as any)
          .from("learning_plans")
          .select("*, learning_outcomes(*)")
          .eq("unit_code", activeUnit)
          .eq("week_number", activeWeek)
          .single();

        if (lpData) {
          setActiveLearningPlan(lpData);
          setAvailableOutcomes(lpData.learning_outcomes.map((o: any) => o.description));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOutcomeToggle = (outcome: string) => {
    setSelectedOutcomes(prev =>
      prev.includes(outcome) ? prev.filter(o => o !== outcome) : [...prev, outcome]
    );
  };

  const handleAddActivity = () => {
    setActivities(prev => [
      ...prev,
      { time_minutes: 10, trainer_activity: "", learner_activity: "", assessment: "" }
    ]);
  };

  const handleRemoveActivity = (idx: number) => {
    setActivities(prev => prev.filter((_, i) => i !== idx));
  };

  const handleActivityFieldChange = (idx: number, field: keyof SessionDeliveryStep, value: any) => {
    setActivities(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setActivities(prev => {
        const oldIndex = prev.findIndex((_, i) => `activity-${i}` === active.id);
        const newIndex = prev.findIndex((_, i) => `activity-${i}` === over?.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleSyncToRow = () => {
    const hours = activities.reduce((sum, act) => sum + (Number(act.time_minutes) || 0), 0) / 60;
    setRowHours(Number(hours.toFixed(1)));
    
    const outcomesStr = selectedOutcomes.join(", ");
    setRowWorkCovered(`Delivered session plan titled "${sessionTitle}". Covered learning outcomes: ${outcomesStr || "None selected"}.`);
    setRowReflection(reflection || "Comprehension verified through practical tasks.");
    setActiveTab("row");
    toast.success("Synced data from Session Plan!");
  };

  const handleSaveDraft = () => {
    const stored = getStoredSessionPlans();
    const updatedPlan: SessionPlan = {
      id: currentSessionPlanId,
      document_code: "MTTI/F/CUR/05",
      trainer_name: "MR. ALEXANDER KINOTI",
      department: "Computing & Informatics",
      unit_name: units.find(u => u.unit_code === activeUnit)?.unit_name || activeUnit,
      unit_code: activeUnit,
      class_code: activeClass,
      level: activeUnit.includes("/6/") ? "Level 6" : "Level 5",
      trainees_count: 20,
      date: new Date().toLocaleDateString("en-GB"),
      time_duration: deliveryTime,
      week_number: activeWeek,
      session_number: activeSessionNo,
      session_title: sessionTitle,
      learning_outcomes: selectedOutcomes,
      resources: resources.split(",").map(r => r.trim()),
      safety_requirements: safety,
      introduction: introduction,
      delivery_steps: activities,
      session_review: sessionReview,
      assignment: assignment,
      reflection: reflection,
      signature: "Alexander Kinoti",
      signature_date: new Date().toLocaleDateString("en-GB"),
      status: "planned"
    };

    const index = stored.findIndex(p => p.id === currentSessionPlanId);
    if (index >= 0) {
      stored[index] = updatedPlan;
    } else {
      stored.push(updatedPlan);
    }
    saveStoredSessionPlans(stored);
    toast.success("Session Plan Draft Saved Locally!");
  };

  const handleApproveAndSign = () => {
    setIsSigning(true);
  };

  const handleAttendanceComplete = (total: number, present: number) => {
    const stored = getStoredSessionPlans();
    const plan = stored.find(p => p.id === currentSessionPlanId);
    if (plan) {
      plan.status = "delivered";
      saveStoredSessionPlans(stored);
    }

    const rowList = getStoredRecordsOfWork();
    const newRow = {
      id: `row-${Date.now()}`,
      session_plan_id: currentSessionPlanId,
      unit_code: activeUnit,
      class_code: activeClass,
      week_number: activeWeek,
      date_delivered: new Date().toLocaleDateString("en-GB"),
      trainees_present: present,
      hours_covered: rowHours,
      work_actually_covered: rowWorkCovered || `Covered outcomes: ${selectedOutcomes.join("; ")}`,
      reflection: rowReflection || reflection || "Excellent trainee participation and hands-on competence demonstration.",
      status: "delivered" as const,
      signature: "Alexander Kinoti",
      signature_date: new Date().toLocaleDateString("en-GB")
    };
    
    const filteredRows = rowList.filter(r => r.session_plan_id !== currentSessionPlanId);
    filteredRows.push(newRow);
    saveStoredRecordsOfWork(filteredRows);

    const lpList = getStoredLearningPlans();
    const lpIndex = lpList.findIndex(lp => lp.unit_code === activeUnit && lp.week_number === activeWeek);
    if (lpIndex >= 0) {
      lpList[lpIndex].status = "delivered";
      lpList[lpIndex].session_plan_id = currentSessionPlanId;
      localStorage.setItem("mtti_learning_plans", JSON.stringify(lpList));
    }

    toast.success("Document Signed, Attendance Logged, and Record of Work synced!");
  };

  // AI-Powered generation
  const handleAiAutoFill = () => {
    setIsGenerating(true);
    // Simulate a 2-second delay to mock an API call
    setTimeout(() => {
      setSessionTitle(sessionTitle || "Advanced Graphic Design Techniques");
      setIsGenerating(false);
    }, 2000);
  };

  // jsPDF Export function complying with institutional template formatting
  const handlePrintPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const margin = 15;
      let y = margin;

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.rect(margin, margin, pageW - 2 * margin, 297 - 2 * margin);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("MTTI/F/CUR/05", pageW - margin - 5, margin + 8, { align: "right" });

      y = margin + 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("MUKIRIA TECHNICAL TRAINING INSTITUTE", pageW / 2, y, { align: "center" });
      doc.setFontSize(11);
      doc.text("DEPARTMENT OF COMPUTING & INFORMATICS", pageW / 2, y + 6, { align: "center" });
      doc.setFontSize(11);
      doc.text("SESSION PLAN", pageW / 2, y + 12, { align: "center" });

      y += 18;

      const colW = (pageW - 2 * margin) / 4;
      const rowH = 10;
      
      const drawCell = (colIdx: number, rowIdx: number, label: string, val: string) => {
        const cellX = margin + colIdx * colW;
        const cellY = y + rowIdx * rowH;
        doc.rect(cellX, cellY, colW, rowH);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(label, cellX + 3, cellY + 4);
        doc.setFont("helvetica", "normal");
        doc.text(String(val).substring(0, 30), cellX + 3, cellY + 8);
      };

      drawCell(0, 0, "Date:", new Date().toLocaleDateString("en-GB"));
      drawCell(1, 0, "Time:", deliveryTime);
      drawCell(2, 0, "Week / Session:", `Week ${activeWeek} (Sess ${activeSessionNo})`);
      drawCell(3, 0, "Trainer:", "Alexander Kinoti");

      drawCell(0, 1, "Department:", "Computing");
      drawCell(1, 1, "Unit:", (units.find(u => u.unit_code === activeUnit)?.unit_name || activeUnit).substring(0, 20));
      drawCell(2, 1, "Level:", activeUnit.includes("/6/") ? "Level 6" : "Level 5");
      drawCell(3, 1, "Class:", activeClass);

      drawCell(0, 2, "Trainees Count:", "20");
      drawCell(1, 2, "Unit Code:", activeUnit);
      doc.rect(margin + 2 * colW, y + 2 * rowH, colW, rowH);
      doc.rect(margin + 3 * colW, y + 2 * rowH, colW, rowH);

      y += 3 * rowH + 4;

      const drawBlock = (title: string, text: string) => {
        const lines = doc.splitTextToSize(text, pageW - 2 * margin - 6);
        const blockH = Math.max(12, lines.length * 4.5 + 8);
        doc.rect(margin, y, pageW - 2 * margin, blockH);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(title + ":", margin + 3, y + 5);
        doc.setFont("helvetica", "normal");
        doc.text(lines, margin + 3, y + 10);
        y += blockH;
      };

      drawBlock("Session Title", sessionTitle);
      drawBlock("Learning Outcome(s)", selectedOutcomes.map(o => `• ${o}`).join("\n"));
      drawBlock("Resources", resources);
      drawBlock("Safety Requirements", safety);
      drawBlock("1. Introduction", introduction);

      y += 4;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("2. Session Delivery Steps:", margin, y);
      y += 3;

      const totalTableW = pageW - 2 * margin;
      const tColW = [totalTableW * 0.12, totalTableW * 0.35, totalTableW * 0.33, totalTableW * 0.20];

      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, totalTableW, 8, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      
      let curX = margin;
      doc.text("Time (min)", curX + 2, y + 5); curX += tColW[0];
      doc.text("Trainer Activity", curX + 2, y + 5); curX += tColW[1];
      doc.text("Learner Activity", curX + 2, y + 5); curX += tColW[2];
      doc.text("Learning Check", curX + 2, y + 5);

      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);

      activities.forEach((step) => {
        const trainerLines = doc.splitTextToSize(step.trainer_activity, tColW[1] - 4);
        const learnerLines = doc.splitTextToSize(step.learner_activity, tColW[2] - 4);
        const checkLines = doc.splitTextToSize(step.assessment, tColW[3] - 4);
        const rowHeight = Math.max(10, Math.max(trainerLines.length, learnerLines.length, checkLines.length) * 4 + 4);
        
        if (y + rowHeight > 297 - margin - 30) {
          doc.addPage();
          doc.setDrawColor(0, 0, 0);
          doc.rect(margin, margin, pageW - 2 * margin, 297 - 2 * margin);
          y = margin + 10;
        }

        let rx = margin;
        doc.rect(rx, y, tColW[0], rowHeight);
        doc.text(String(step.time_minutes), rx + tColW[0]/2, y + rowHeight/2 + 2, { align: "center" });
        rx += tColW[0];

        doc.rect(rx, y, tColW[1], rowHeight);
        doc.text(trainerLines, rx + 2, y + 5);
        rx += tColW[1];

        doc.rect(rx, y, tColW[2], rowHeight);
        doc.text(learnerLines, rx + 2, y + 5);
        rx += tColW[2];

        doc.rect(rx, y, tColW[3], rowHeight);
        doc.text(checkLines, rx + 2, y + 5);

        y += rowHeight;
      });

      y += 4;
      
      const drawFooterRow = (label: string, value: string) => {
        const textH = Math.max(8, doc.splitTextToSize(value, pageW - 2 * margin - 36).length * 4.5 + 4);
        doc.rect(margin, y, pageW - 2 * margin, textH);
        doc.setFont("helvetica", "bold");
        doc.text(label + ":", margin + 3, y + 5);
        doc.setFont("helvetica", "normal");
        doc.text(doc.splitTextToSize(value, pageW - 2 * margin - 36), margin + 34, y + 5);
        y += textH;
      };

      drawFooterRow("3. Session Review", sessionReview || "Recap session steps and answer trainee questions.");
      drawFooterRow("Assignment", assignment || "No assignment allocated.");
      
      doc.rect(margin, y, pageW - 2 * margin, 8);
      doc.setFont("helvetica", "bold");
      const totalTimeStr = `TOTAL TIME: ${activities.reduce((s, a) => s + Number(a.time_minutes), 0)} Minutes`;
      doc.text(totalTimeStr, pageW / 2, y + 5, { align: "center" });
      y += 8;

      drawFooterRow("Session Reflection", reflection || "Trainees engaged well in practical drills.");

      y += 2;
      doc.rect(margin, y, pageW - 2 * margin, 12);
      doc.setFont("helvetica", "bold");
      doc.text("Trainer Signature: MR. ALEXANDER KINOTI", margin + 3, y + 8);
      doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, margin + 130, y + 8);

      doc.save(`MTTI_SessionPlan_W${activeWeek}_${activeUnit.replace(/\//g, "-")}.pdf`);
      toast.success("Official Session Plan PDF Exported!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.");
    }
  };

  // Export precision-matched MTTI/F/CUR/05 Word document via Python backend
  const handleExportDocx = async () => {
    try {
      const activeUnitData = units.find(u => u.unit_code === activeUnit);
      const payload = {
        date: new Date().toLocaleDateString("en-GB"),
        time_duration: deliveryTime,
        week_number: activeWeek,
        session_no: activeSessionNo,
        trainer_name: "Alexander Kinoti",
        department: "Computing & Informatics",
        unit_name: activeUnitData?.unit_name || activeUnit,
        unit_code: activeUnit,
        level: activeUnit.includes("/6/") || activeUnit.includes("11/6") ? 6 : 5,
        class_code: activeClass,
        trainees_count: 20,
        session_title: sessionTitle,
        learning_outcomes: selectedOutcomes,
        resources: resources.split(",").map(r => r.trim()).filter(Boolean),
        safety_requirements: safety,
        introduction: introduction,
        delivery_steps: activities.map(a => ({
          time_minutes: String(a.time_minutes),
          trainer_activity: a.trainer_activity,
          learner_activity: a.learner_activity,
          assessment: a.assessment
        })),
        session_review: sessionReview,
        assignment: assignment,
        total_time: `${activities.reduce((s, a) => s + Number(a.time_minutes), 0)} min`,
        reflection: reflection,
        signature_date: new Date().toLocaleDateString("en-GB")
      };
      const resp = await fetch("http://localhost:8000/api/export-session-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload })
      });
      const data = await resp.json();
      if (data.success) {
        const bytes = Uint8Array.from(atob(data.file_data), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Form successfully exported", { position: "bottom-right", duration: 3000 });
      } else {
        throw new Error(data.error || "Export failed");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Word export failed: ${err.message}`);
    }
  };

  // AI Ingestion drag/drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = async (file: File) => {
    setIngestLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Str = (reader.result as string).split(",")[1];
          const parseResp = await fetch("http://localhost:8000/api/parse-doc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_data: base64Str })
          });
          const result = await parseResp.json();
          if (result.success) {
            setParsedData(result);
            toast.success("Legacy document parsed successfully!");
          } else {
            throw new Error(result.error || "Parsing failed.");
          }
        } catch (err: any) {
          toast.error(`Ingestion parsing failed: ${err.message}`);
        } finally {
          setIngestLoading(false);
        }
      };
    } catch (err: any) {
      toast.error(`File read error: ${err.message}`);
      setIngestLoading(false);
    }
  };

  const handleCommitParsedData = () => {
    if (!parsedData) return;
    
    // Auto map values to workspace
    if (parsedData.unit_code) setActiveUnit(parsedData.unit_code);
    if (parsedData.class_code) setActiveClass(parsedData.class_code);
    if (parsedData.topics && parsedData.topics.length > 0) setSessionTitle(parsedData.topics[0]);
    if (parsedData.outcomes && parsedData.outcomes.length > 0) {
      setSelectedOutcomes(parsedData.outcomes);
      setAvailableOutcomes(parsedData.outcomes);
    }
    
    setActiveTab("session");
    setParsedData(null);
    toast.success("Parsed legacy data committed directly to active workspace!");
  };
  // Keyboard Shortcuts Effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S: Approve & Sign
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (sessionTitle.trim() !== "" && selectedOutcomes.length > 0) {
          handleApproveAndSign();
        } else {
          toast.error("Cannot sign: Title and Learning Outcomes are required.");
        }
      }
      // Ctrl+E: Export .docx
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        handleExportDocx();
      }
      // Ctrl+Enter: AI Auto-Fill
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isGenerating) handleAiAutoFill();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sessionTitle, selectedOutcomes, isGenerating, handleAiAutoFill, handleExportDocx]);


  return (
    <TrainerLayout title="Pedagogy Workshop & Command Center" subtitle="Draft session plans, map outcomes, log records of work, and quick-mark attendance registers.">
      {/* ─── STICKY CONTEXT HEADER ───────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-card border border-border shadow-md rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Term</span>
            <select
              value={activeTerm}
              onChange={e => setActiveTerm(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-[#000953] dark:text-[#f8fafc] focus:outline-none"
            >
              {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Class Enrolled</span>
            <select
              value={activeClass}
              onChange={e => setActiveClass(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-[#000953] dark:text-[#f8fafc] focus:outline-none"
            >
              {classes.map(c => <option key={c.id} value={c.class_code}>{c.class_code}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Syllabus Unit</span>
            <select
              value={activeUnit}
              onChange={e => setActiveUnit(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-[#000953] dark:text-[#f8fafc] max-w-xs focus:outline-none"
            >
              {units.map(u => <option key={u.id} value={u.unit_code}>{u.unit_code} - {u.unit_name}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Academic Week</span>
            <input
              type="number"
              min={1}
              max={12}
              value={activeWeek}
              onChange={e => setActiveWeek(Math.max(1, Math.min(12, Number(e.target.value))))}
              className="w-16 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-center focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Session</span>
            <div className="flex items-center gap-1 bg-secondary/40 p-0.5 rounded-lg border border-border">
              {[1, 2, 3].map(sNo => (
                <button
                  key={sNo}
                  type="button"
                  onClick={() => setActiveSessionNo(sNo)}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                    activeSessionNo === sNo
                      ? "bg-[#000953] text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={`Switch to Session ${sNo} of Week ${activeWeek}`}
                >
                  S{sNo}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Level Grading Rule display box */}
        <div className="bg-[#c48820]/10 border border-[#c48820]/30 rounded-lg px-4 py-2 text-right shrink-0">
          <p className="text-[9px] uppercase tracking-wider font-bold text-[#c48820]">CDACC Level Compliance</p>
          <p className="text-xs font-bold text-[#000953] dark:text-[#f8fafc]">
            {activeUnit.includes("11/6") || activeUnit.includes("/6/") ? CDACC_LEVEL_GRADES[6] : CDACC_LEVEL_GRADES[5]}
          </p>
        </div>
      </div>

      {/* ─── SPLIT VIEW WORKSPACE ─────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-210px)] overflow-hidden">
        
        {/* Left Pane - Inputs */}
        <div className="glass-card flex flex-col h-full overflow-hidden border border-border rounded-xl">
          {/* Tabs */}
          <div className="flex border-b border-border bg-secondary/20 shrink-0">
            <button
              onClick={() => setActiveTab("session")}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === "session"
                  ? "border-[#000953] text-[#000953] bg-white/50 dark:bg-black/25"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Sess. Plan Editor
            </button>
            <button
              onClick={() => setActiveTab("row")}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === "row"
                  ? "border-[#000953] text-[#000953] bg-white/50 dark:bg-black/25"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-4 h-4" />
              Rec. of Work
            </button>
            <button
              onClick={() => setActiveTab("ingest")}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === "ingest"
                  ? "border-[#000953] text-[#000953] bg-white/50 dark:bg-black/25"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              AI Ingestion
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {activeTab === "session" ? (
              <>
                {/* AI Assistant */}
                <div className="bg-[#000953]/5 border border-[#000953]/20 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex gap-2.5">
                    <Sparkles className="w-5 h-5 text-[#c48820] shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-[#000953] dark:text-[#f8fafc]">CDACC Smart Assistance</h4>
                      <p className="text-[10px] text-muted-foreground">Synthesize lesson steps and auto-draft outcomes using AI.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAiAutoFill}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#000953] text-white hover:bg-[#000953]/90 disabled:opacity-50 text-xs font-bold rounded-lg shadow-sm transition-all duration-300"
                  >
                    {isGenerating ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkles className="w-3.5 h-3.5 text-[#c48820]" />}
                    {isGenerating ? "Parsing..." : "AI Auto-Fill"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-muted-foreground mb-1">Session Title</label>
                    <input
                      className="w-full px-4 py-3 bg-secondary/30 border-0 border-b-2 border-transparent hover:border-primary/20 focus:border-primary focus:bg-background rounded-t-xl transition-all text-xs outline-none"
                      value={sessionTitle}
                      onChange={e => setSessionTitle(e.target.value)}
                      placeholder="Introduction to Graphic Design"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-muted-foreground mb-1">Delivery Time Frame</label>
                    <input
                      className="w-full px-4 py-3 bg-secondary/30 border-0 border-b-2 border-transparent hover:border-primary/20 focus:border-primary focus:bg-background rounded-t-xl transition-all text-xs outline-none"
                      value={deliveryTime}
                      onChange={e => setDeliveryTime(e.target.value)}
                      placeholder="10:30-12:30"
                    />
                  </div>
                </div>

                {/* Outcomes Multi-select */}
                <div className="flex flex-col border border-border rounded-lg bg-background/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedSections(prev => ({...prev, outcomes: !prev.outcomes}))}
                    className="flex items-center justify-between p-3 bg-secondary/20 hover:bg-secondary/40 transition-colors text-left"
                  >
                    <div>
                      <label className="text-xs font-bold text-muted-foreground cursor-pointer">Mapped Syllabus Learning Outcomes</label>
                      <p className="text-[9px] text-[#c48820] font-bold">Each selected outcome maps directly to CDACC compliance checkpoints.</p>
                    </div>
                    {expandedSections.outcomes ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {expandedSections.outcomes && (
                    <div className="p-3 border-t border-border space-y-2">
                      {availableOutcomes.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No outcomes defined for this week. Use AI Ingestion or select another week.</p>
                      ) : (
                        availableOutcomes.map((outcome, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={selectedOutcomes.includes(outcome)}
                              onChange={() => handleOutcomeToggle(outcome)}
                              className="mt-1"
                            />
                            <span className="text-xs text-foreground leading-tight">{outcome}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Resources & Safety */}
                <div className="flex flex-col border border-border rounded-lg bg-background/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedSections(prev => ({...prev, resources: !prev.resources}))}
                    className="flex items-center justify-between p-3 bg-secondary/20 hover:bg-secondary/40 transition-colors text-left"
                  >
                    <label className="text-xs font-bold text-muted-foreground cursor-pointer">Resources & Safety Requirements</label>
                    {expandedSections.resources ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {expandedSections.resources && (
                    <div className="p-3 border-t border-border grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-muted-foreground mb-1">Resources</label>
                        <textarea
                          rows={2}
                          className="w-full px-4 py-3 bg-secondary/30 border-0 border-b-2 border-transparent hover:border-primary/20 focus:border-primary focus:bg-background rounded-t-xl transition-all text-xs outline-none resize-none"
                          value={resources}
                          onChange={e => setResources(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-muted-foreground mb-1">Safety Requirements</label>
                        <textarea
                          rows={2}
                          className="w-full px-4 py-3 bg-secondary/30 border-0 border-b-2 border-transparent hover:border-primary/20 focus:border-primary focus:bg-background rounded-t-xl transition-all text-xs outline-none resize-none"
                          value={safety}
                          onChange={e => setSafety(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Introduction & Delivery Steps */}
                <div className="flex flex-col border border-border rounded-lg bg-background/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedSections(prev => ({...prev, delivery: !prev.delivery}))}
                    className="flex items-center justify-between p-3 bg-secondary/20 hover:bg-secondary/40 transition-colors text-left"
                  >
                    <label className="text-xs font-bold text-muted-foreground cursor-pointer">Session Delivery Flow</label>
                    {expandedSections.delivery ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {expandedSections.delivery && (
                    <div className="p-3 border-t border-border space-y-4">
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-muted-foreground mb-1">Session Introduction (1. Intro)</label>
                        <input
                          className="w-full px-4 py-3 bg-secondary/30 border-0 border-b-2 border-transparent hover:border-primary/20 focus:border-primary focus:bg-background rounded-t-xl transition-all text-xs outline-none"
                          value={introduction}
                          onChange={e => setIntroduction(e.target.value)}
                        />
                      </div>

                      {/* Activities table */}
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-muted-foreground">Session Delivery Steps (2. Delivery)</label>
                          <button
                            type="button"
                            onClick={handleAddActivity}
                            className="text-xs text-[#000953] hover:text-[#000953]/85 font-bold flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add step
                          </button>
                        </div>
                        <div className="border border-border rounded-lg overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-secondary/40 text-muted-foreground font-bold">
                              <tr>
                                <th className="px-2 w-8"></th>
                                <th className="px-3 py-2 w-16 text-center">Time</th>
                                <th className="px-3 py-2">Trainer Activity</th>
                                <th className="px-3 py-2">Learner Activity</th>
                                <th className="px-3 py-2 w-28">Assessment</th>
                                <th className="px-2 py-2 w-8"></th>
                              </tr>
                            </thead>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                              <SortableContext items={activities.map((_, i) => `activity-${i}`)} strategy={verticalListSortingStrategy}>
                                <tbody className="divide-y divide-border bg-background/30">
                                  {activities.map((act, i) => (
                                    <SortableActivityItem
                                      key={`activity-${i}`}
                                      id={`activity-${i}`}
                                      act={act}
                                      onChange={(f: any, v: any) => handleActivityFieldChange(i, f, v)}
                                      onRemove={() => handleRemoveActivity(i)}
                                    />
                                  ))}
                                </tbody>
                              </SortableContext>
                            </DndContext>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Review, Assignment, Reflection */}
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-muted-foreground mb-1">Session Review (3. Recap)</label>
                    <input
                      className="w-full px-4 py-3 bg-secondary/30 border-0 border-b-2 border-transparent hover:border-primary/20 focus:border-primary focus:bg-background rounded-t-xl transition-all text-xs outline-none"
                      value={sessionReview}
                      onChange={e => setSessionReview(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-muted-foreground mb-1">Trainee Assignment</label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-3 bg-secondary/30 border-0 border-b-2 border-transparent hover:border-primary/20 focus:border-primary focus:bg-background rounded-t-xl transition-all text-xs outline-none resize-none"
                      value={assignment}
                      onChange={e => setAssignment(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-muted-foreground mb-1">Trainer Reflection</label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-3 bg-secondary/30 border-0 border-b-2 border-transparent hover:border-primary/20 focus:border-primary focus:bg-background rounded-t-xl transition-all text-xs outline-none resize-none"
                      value={reflection}
                      onChange={e => setReflection(e.target.value)}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-4 py-2 border border-border text-foreground hover:bg-secondary rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Draft Plan
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncToRow}
                    className="px-4 py-2 bg-[#c48820]/15 hover:bg-[#c48820]/25 text-[#c48820] border border-[#c48820]/30 rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Sync to Record of Work
                  </button>
                </div>
              </>
            ) : activeTab === "row" ? (
              <>
                {/* Record of Work Pane */}
                <div className="bg-secondary/20 p-4 rounded-xl border border-border flex items-center justify-between">
                  <div className="flex gap-2">
                    <FileText className="w-5 h-5 text-[#000953]" />
                    <div>
                      <h4 className="text-xs font-bold text-[#000953] dark:text-[#f8fafc]">Sync with Session Plan</h4>
                      <p className="text-[10px] text-muted-foreground">Pull delivery steps, reflection, and hours covered directly from active session plan.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncToRow}
                    className="px-3 py-1.5 bg-[#000953] hover:bg-[#000953]/90 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    Pull Plan Data
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-muted-foreground mb-1">Hours Actually Taught</label>
                    <input
                      type="number"
                      step={0.5}
                      className="w-full px-4 py-3 bg-secondary/30 border-0 border-b-2 border-transparent hover:border-primary/20 focus:border-primary focus:bg-background rounded-t-xl transition-all text-xs outline-none"
                      value={rowHours}
                      onChange={e => setRowHours(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-muted-foreground mb-1">Delivered Status</label>
                    <select
                      className="px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none"
                      value={rowStatus}
                      onChange={e => setRowStatus(e.target.value as any)}
                    >
                      <option value="delivered">Delivered Successfully</option>
                      <option value="partial">Delivered Partially</option>
                      <option value="postponed">Postponed Session</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-muted-foreground mb-1">Work Actually Covered (Topics / Tasks)</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 bg-secondary/30 border-0 border-b-2 border-transparent hover:border-primary/20 focus:border-primary focus:bg-background rounded-t-xl transition-all text-xs outline-none resize-none"
                    value={rowWorkCovered}
                    onChange={e => setRowWorkCovered(e.target.value)}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-muted-foreground mb-1">Lesson Reflection & Evaluation</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 bg-secondary/30 border-0 border-b-2 border-transparent hover:border-primary/20 focus:border-primary focus:bg-background rounded-t-xl transition-all text-xs outline-none resize-none"
                    value={rowReflection}
                    onChange={e => setRowReflection(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                {/* AI Ingestion Tab */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-[#000953] dark:text-[#f8fafc]">Import Legacy Lesson Documents</h3>
                  <p className="text-xs text-muted-foreground">Upload scanned or Microsoft Word syllabus/session plans (.docx). The compliance AI will analyze, map context, and pre-populate your current workspace.</p>
                  
                  {/* Dropzone Container */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                      dragActive ? "border-[#c48820] bg-[#c48820]/5" : "border-border hover:border-[#000953]/40 bg-secondary/10"
                    }`}
                  >
                    <UploadCloud className="w-10 h-10 text-muted-foreground animate-pulse" />
                    <div className="text-center">
                      <p className="text-xs font-bold">Drag and drop your document here</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Supports Microsoft Word (.docx) files</p>
                    </div>
                    
                    <label className="px-3 py-1.5 bg-[#000953] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#000953]/90 shadow transition-all">
                      Choose File
                      <input type="file" className="hidden" accept=".docx" onChange={handleFileChange} />
                    </label>
                  </div>

                  {ingestLoading && (
                    <div className="flex items-center justify-center py-4 gap-2 text-xs font-semibold text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-[#000953] border-t-transparent rounded-full animate-spin"></div>
                      Compliance AI is analyzing context and mapping outcomes...
                    </div>
                  )}

                  {parsedData && (
                    <div className="border border-border rounded-xl p-4 bg-secondary/20 space-y-4 animate-in fade-in zoom-in duration-200">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <span className="text-xs font-bold text-[#000953] flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          Ingestion Results Staging
                        </span>
                        <button
                          onClick={handleCommitParsedData}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center gap-1"
                        >
                          Commit to Workspace <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[11px] leading-tight">
                        <div>
                          <span className="text-muted-foreground block">Trainer Name</span>
                          <strong className="text-foreground font-bold">{parsedData.trainer}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Unit Code Found</span>
                          <strong className="text-foreground font-bold">{parsedData.unit_code}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Unit Name</span>
                          <strong className="text-foreground font-bold">{parsedData.unit_name}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Course Name</span>
                          <strong className="text-foreground font-bold">{parsedData.course_name}</strong>
                        </div>
                      </div>

                      {parsedData.topics && parsedData.topics.length > 0 && (
                        <div className="text-[11px] leading-tight">
                          <span className="text-muted-foreground block">Extracted Session Topic</span>
                          <strong className="text-foreground font-bold">{parsedData.topics[0]}</strong>
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground block">Extracted Learning Outcomes ({parsedData.outcomes?.length || 0})</span>
                        <div className="max-h-24 overflow-y-auto border border-border bg-background rounded-lg p-2 space-y-1">
                          {parsedData.outcomes?.map((out: string, i: number) => (
                            <p key={i} className="text-[10px] text-gray-700 dark:text-gray-300 font-medium leading-tight">
                              • {out}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Pane - Document Preview */}
        <div className="glass-card flex flex-col h-full overflow-hidden border border-border rounded-xl">
          <div className="px-5 py-3 border-b border-border bg-secondary/20 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-[#000953] dark:text-[#f8fafc] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#c48820]" />
              Official Form Preview (MTTI/F/CUR/05)
              {isSaving ? (
                <span className="ml-2 text-[10px] text-muted-foreground font-normal animate-pulse flex items-center gap-1"><UploadCloud className="w-3 h-3"/> Saving draft...</span>
              ) : lastSaved ? (
                <span className="ml-2 text-[10px] text-emerald-600 font-normal flex items-center gap-1"><Check className="w-3 h-3"/> Saved {lastSaved.toLocaleTimeString()}</span>
              ) : null}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrintPDF}
                className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-all"
                title="Export as PDF"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleExportDocx}
                className="px-3 py-1.5 border border-[#000953]/30 hover:bg-[#000953]/5 text-[#000953] dark:text-[#f8fafc] text-xs font-bold rounded-lg flex items-center gap-1"
                title="Export as Word .docx (MTTI/F/CUR/05)"
              >
                <FileText className="w-3.5 h-3.5 text-[#c48820]" />
                Export .docx
              </button>
              <button
                type="button"
                onClick={() => setIsQRModalOpen(true)}
                className="px-3 py-1.5 bg-[#c48820]/15 hover:bg-[#c48820]/25 text-[#000953] dark:text-[#f8fafc] border border-[#c48820]/40 text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm"
                title="Generate Workshop Door QR Code Poster (MTTI/F/CUR/05)"
              >
                <QrCode className="w-3.5 h-3.5 text-[#c48820]" />
                Workshop Door QR
              </button>
              <button
                type="button"
                onClick={handleApproveAndSign}
                disabled={!(sessionTitle.trim() !== "" && selectedOutcomes.length > 0)}
                className={`px-4 py-1.5 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1 transition-all duration-300 ${!(sessionTitle.trim() !== "" && selectedOutcomes.length > 0) ? "opacity-50 cursor-not-allowed bg-gray-400" : "bg-[#000953] hover:bg-[#000953]/90"}`}
              >
                <CheckCircle className="w-3.5 h-3.5 text-[#c48820]" />
                Approve & Sign
              </button>
            </div>
          </div>

          {/* Renders the pixel-perfect paper template layout preview */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#f1f5f9] border-l border-border font-serif text-black leading-relaxed text-xs">
            {!activeUnit ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                 <FileText className="w-16 h-16 mb-4 opacity-20" />
                 <h3 className="text-lg font-bold text-[#000953]/50">No Active Session Selected</h3>
                 <p className="text-sm">Select a Unit of Competence and Week to begin drafting.</p>
              </div>
            ) : (
              <div className="bg-white p-10 max-w-full min-h-[800px] shadow-2xl border border-gray-200 rounded-sm print-only-container text-black mx-auto">
                {/* Document Reference Code */}
              <div className="text-right font-bold text-[10px] text-gray-500 mb-1">MTTI/F/CUR/05</div>
              
              {/* Header Title */}
              <div className="text-center font-extrabold text-sm border-b border-black pb-3 mb-4">
                <p className="text-base text-[#000953] leading-none uppercase">MUKIRIA TECHNICAL TRAINING INSTITUTE</p>
                <p className="text-xs font-bold underline mt-4">SESSION PLAN</p>
              </div>

              {/* General Metadata table */}
              <table className="w-full border-collapse border border-black mb-4 table-fixed text-[11px]">
                <tbody>
                  {/* Row 0 */}
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold align-top" colSpan={10}>Date: <span className="font-normal">{new Date().toLocaleDateString("en-GB")}</span></td>
                    <td className="border border-black px-2 py-1.5 font-bold align-top" colSpan={10} rowSpan={2}>Time:<br/><span className="font-normal">{deliveryTime}</span></td>
                  </tr>
                  {/* Row 1 */}
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold align-top" colSpan={10}>Week: <span className="font-normal">{activeWeek}</span></td>
                  </tr>
                  {/* Row 2 */}
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold align-top" colSpan={10}>Trainer name: <span className="font-normal">MR. ALEXANDER KINOTI</span></td>
                    <td className="border border-black px-2 py-1.5 font-bold align-top" colSpan={10}>Department: <span className="font-normal">Computing & Informatics</span></td>
                  </tr>
                  {/* Row 3, 4, 5 */}
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold align-top" colSpan={10} rowSpan={3}>
                      Unit of Competence: <span className="font-normal">{units.find(u => u.unit_code === activeUnit)?.unit_name || activeUnit}</span>
                    </td>
                    <td className="border border-black px-2 py-1.5 font-bold align-top" colSpan={10}>Level: <span className="font-normal">{activeUnit.includes("11/6") || activeUnit.includes("/6/") ? "6" : "5"}</span></td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold align-top" colSpan={10}>Class: <span className="font-normal">{activeClass}</span></td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold align-top" colSpan={10}>Number of Trainees: <span className="font-normal">20</span></td>
                  </tr>
                  {/* Row 6 */}
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold align-top" colSpan={20}>Unit Code: <span className="font-normal">{activeUnit}</span></td>
                  </tr>
                  {/* Row 7 */}
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold align-top" colSpan={20}>
                      Session Title: 
                      {isGenerating ? (
                        <div className="h-3 bg-gray-300 animate-pulse rounded w-1/2 inline-block ml-2 align-middle"></div>
                      ) : (
                        <span className="font-normal"> {sessionTitle}</span>
                      )}
                    </td>
                  </tr>
                  {/* Row 8 */}
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold align-top" colSpan={10}>Learning outcome(s)</td>
                    <td className="border border-black px-2 py-1.5 align-top" colSpan={10}>
                      <span className="font-bold">By the end of the session the learner should be able to;</span>
                      {isGenerating ? (
                        <div className="mt-2 space-y-2">
                          <div className="h-3 bg-gray-300 animate-pulse rounded w-3/4"></div>
                          <div className="h-3 bg-gray-300 animate-pulse rounded w-2/3"></div>
                          <div className="h-3 bg-gray-300 animate-pulse rounded w-1/2"></div>
                        </div>
                      ) : (
                        <ul className="list-none mt-1 space-y-0.5">
                          {selectedOutcomes.map((out, idx) => (
                            <li key={idx} className="font-normal">☐ {out}</li>
                          ))}
                          {selectedOutcomes.length === 0 && <span className="text-gray-400 italic font-normal">No outcomes selected</span>}
                        </ul>
                      )}
                    </td>
                  </tr>
                  {/* Row 9 */}
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold align-top" colSpan={10}>Resources (references, and learning aids)</td>
                    <td className="border border-black px-2 py-1.5 align-top" colSpan={10}>
                      <ul className="list-none">
                         <li>☐ {resources || "OS/Curriculum"}</li>
                         <li>☐ Learning guides</li>
                      </ul>
                    </td>
                  </tr>
                  {/* Row 10 */}
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold align-top" colSpan={10}>Safety requirements</td>
                    <td className="border border-black px-2 py-1.5 align-top" colSpan={10}>
                      <ul className="list-none">
                        <li>☐ {safety || "Adhere to lab safety rules."}</li>
                      </ul>
                    </td>
                  </tr>

                  {/* Row 11, 12, 13, 14 */}
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-200 text-center" colSpan={20}>Session presentation</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-200" colSpan={20}>1. Introduction</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5" colSpan={20}>
                      {introduction || <span className="text-white">.</span>}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-200" colSpan={20}>2. Session Delivery</td>
                  </tr>

                  {/* Delivery Headers */}
                  <tr className="font-bold sticky top-0 bg-white z-10 shadow-[0_1px_0_black,0_-1px_0_black]">
                    <td className="border border-black px-2 py-1 w-[15%]" colSpan={3}>Time (in minutes)</td>
                    <td className="border border-black px-2 py-1 w-[35%]" colSpan={7}>Trainer Activity</td>
                    <td className="border border-black px-2 py-1 w-[25%]" colSpan={5}>Learner Activity</td>
                    <td className="border border-black px-2 py-1 w-[25%]" colSpan={5}>Learning Check/Assessment</td>
                  </tr>

                  {/* Delivery Steps */}
                  {activities.map((act, idx) => (
                    <tr key={idx}>
                      <td className="border border-black px-2 py-1.5 font-mono" colSpan={3}>{act.time_minutes}</td>
                      <td className="border border-black px-2 py-1.5" colSpan={7}>{act.trainer_activity}</td>
                      <td className="border border-black px-2 py-1.5" colSpan={5}>{act.learner_activity}</td>
                      <td className="border border-black px-2 py-1.5" colSpan={5}>{act.assessment}</td>
                    </tr>
                  ))}
                  {activities.length === 0 && (
                    <tr>
                      <td colSpan={20} className="border border-black px-2 py-8 text-center text-gray-400 italic font-sans text-sm">
                        No delivery steps added. Drag and drop steps to build the session flow.
                      </td>
                    </tr>
                  )}

                  {/* Footer (No Shading for items, matching PDF accurately) */}
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold align-top" colSpan={3}>3. Session review</td>
                    <td className="border border-black px-2 py-1.5 align-top" colSpan={17}>
                      {sessionReview || "Critique session: Highlight good use of alignment. Recap saving formats."}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold italic align-top" colSpan={3}>Assignment:</td>
                    <td className="border border-black px-2 py-1.5 italic align-top" colSpan={17}>
                      {assignment || "Sketch a logo idea on paper for a fictional Tech Company to be digitized next class."}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-2 font-bold text-center" colSpan={20}>
                      TOTAL TIME:    {activities.reduce((s, a) => s + Number(a.time_minutes), 0)} Hrs
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold" colSpan={20}>Session reflection</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-4" colSpan={20}>
                      {reflection || <span className="text-white">.</span>}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-2 font-bold" colSpan={20}>
                      Signature: <span className="font-mono text-[#000953] italic font-normal ml-2 mr-16">_____________________________________________________</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Attendance register Modal Trigger */}
      <AttendanceQuickMarkModal
        isOpen={isSigning}
        onClose={() => setIsSigning(false)}
        classCode={activeClass}
        sessionPlanId={currentSessionPlanId}
        onSaveComplete={handleAttendanceComplete}
      />

      {/* Workshop Door QR Code Poster Modal */}
      <WorkshopDoorQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        sessionData={{
          id: currentSessionPlanId || `sp-w${activeWeek}-${(activeUnit || "unit").replace(/\//g, "-")}`,
          unit_code: activeUnit,
          unit_name: units.find(u => u.unit_code === activeUnit)?.unit_name || activeUnit,
          class_code: activeClass,
          session_title: sessionTitle || `Session on ${activeUnit}`,
          learning_outcomes: selectedOutcomes,
          date: new Date().toLocaleDateString("en-GB"),
          time_duration: deliveryTime,
          trainer_name: "Alexander Kinoti",
          venue: "Computer Lab 1 / Workshop",
          safety_requirements: safety
        }}
      />
    </TrainerLayout>
  );
}
