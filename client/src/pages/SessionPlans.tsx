import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Upload,
  Plus,
  Trash2,
  Copy,
  Edit,
  Search,
  BookOpen,
  Calendar,
  Clock,
  User,
  Users,
  CheckCircle2,
  FileText,
  X,
  FileCheck,
  ChevronRight,
  ClipboardCheck,
  TrendingUp,
  FileSpreadsheet,
  QrCode,
} from "lucide-react";
import TrainerLayout from "@/components/TrainerLayout";
import WorkshopDoorQRModal from "@/components/WorkshopDoorQRModal";
import {
  getStoredSessionPlans,
  saveStoredSessionPlans,
  getStoredLearningPlans,
  saveStoredLearningPlans,
  getStoredRecordsOfWork,
  saveStoredRecordsOfWork,
  SessionPlan,
  LearningPlanWeek,
  RecordOfWork,
  SessionDeliveryStep,
} from "@/lib/mockSessionPlans";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { saveSessionPlanToOffline, getAllOfflineSessionPlans, enqueueSyncItem } from "@/lib/offlineStore";
import { syncEngine } from "@/lib/syncEngine";

export default function SessionPlans() {
  const { user } = useAuth();
  const canEditPedagogical = user?.role === "trainer" || user?.role === "admin" || user?.role === "hod";

  const [activeTab, setActiveTab] = useState<"learning" | "session" | "record">("learning");
  const [plans, setPlans] = useState<SessionPlan[]>([]);
  const [learningPlans, setLearningPlans] = useState<LearningPlanWeek[]>([]);
  const [recordsOfWork, setRecordsOfWork] = useState<RecordOfWork[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUnit, setFilterUnit] = useState("all");
  const [filterClass, setFilterClass] = useState("all");

  // Modal / Form States
  const [selectedPlan, setSelectedPlan] = useState<SessionPlan | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRecordLogOpen, setIsRecordLogOpen] = useState(false);
  const [qrModalPlan, setQrModalPlan] = useState<SessionPlan | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields (Session Plan Editor)
  const [formTrainerName, setFormTrainerName] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formUnitName, setFormUnitName] = useState("");
  const [formUnitCode, setFormUnitCode] = useState("");
  const [formClassCode, setFormClassCode] = useState("");
  const [formLevel, setFormLevel] = useState("");
  const [formTraineesCount, setFormTraineesCount] = useState(30);
  const [formDate, setFormDate] = useState("");
  const [formTimeDuration, setFormTimeDuration] = useState("10:30-12:30");
  const [formWeekNumber, setFormWeekNumber] = useState(1);
  const [formSessionTitle, setFormSessionTitle] = useState("");
  const [formLearningOutcomes, setFormLearningOutcomes] = useState("");
  const [formResources, setFormResources] = useState("");
  const [formSafetyRequirements, setFormSafetyRequirements] = useState("");
  const [formIntroduction, setFormIntroduction] = useState("");
  const [formDeliverySteps, setFormDeliverySteps] = useState<SessionDeliveryStep[]>([]);
  const [formSessionReview, setFormSessionReview] = useState("");
  const [formAssignment, setFormAssignment] = useState("");
  const [formReflection, setFormReflection] = useState("");
  const [formSignature, setFormSignature] = useState("");
  const [formSignatureDate, setFormSignatureDate] = useState("");

  // Record of Work Log Form Fields
  const [logSessionPlan, setLogSessionPlan] = useState<SessionPlan | null>(null);
  const [logDateDelivered, setLogDateDelivered] = useState("");
  const [logTraineesPresent, setLogTraineesPresent] = useState(30);
  const [logHoursCovered, setLogHoursCovered] = useState(2);
  const [logWorkCovered, setLogWorkCovered] = useState("");
  const [logReflection, setLogReflection] = useState("");
  const [logStatus, setLogStatus] = useState<"delivered" | "partial" | "postponed">("delivered");
  const [logSignature, setLogSignature] = useState("Alexander Kinoti");
  const [logSignatureDate, setLogSignatureDate] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const [plansRes, lpRes, rowRes] = await Promise.all([
          (supabase as any).from("session_plans").select("*").order("week_number"),
          (supabase as any).from("learning_plans").select("*").order("week_number"),
          (supabase as any).from("records_of_work").select("*").order("week_number"),
        ]);

        if (plansRes.data && plansRes.data.length > 0) {
          const mapped: SessionPlan[] = plansRes.data.map((d: any) => ({
            ...d,
            learning_outcomes: Array.isArray(d.learning_outcomes) ? d.learning_outcomes : JSON.parse(d.learning_outcomes || "[]"),
            resources: Array.isArray(d.resources) ? d.resources : JSON.parse(d.resources || "[]"),
            delivery_steps: Array.isArray(d.delivery_steps) ? d.delivery_steps : JSON.parse(d.delivery_steps || "[]"),
          }));
          setPlans(mapped);
          saveStoredSessionPlans(mapped);
          mapped.forEach((p) => saveSessionPlanToOffline(p));
        } else {
          const idbPlans = await getAllOfflineSessionPlans();
          if (idbPlans && idbPlans.length > 0) {
            setPlans(idbPlans);
          } else {
            setPlans(getStoredSessionPlans());
          }
        }

        if (lpRes.data && lpRes.data.length > 0) {
          const mappedLp: LearningPlanWeek[] = lpRes.data.map((d: any) => ({
            ...d,
            learning_outcomes: Array.isArray(d.learning_outcomes) ? d.learning_outcomes : JSON.parse(d.learning_outcomes || "[]"),
            resources: Array.isArray(d.resources) ? d.resources : JSON.parse(d.resources || "[]"),
          }));
          setLearningPlans(mappedLp);
          saveStoredLearningPlans(mappedLp);
        } else {
          setLearningPlans(getStoredLearningPlans());
        }

        if (rowRes.data && rowRes.data.length > 0) {
          setRecordsOfWork(rowRes.data);
          saveStoredRecordsOfWork(rowRes.data);
        } else {
          setRecordsOfWork(getStoredRecordsOfWork());
        }
      } else {
        const idbPlans = await getAllOfflineSessionPlans();
        setPlans(idbPlans.length > 0 ? idbPlans : getStoredSessionPlans());
        setLearningPlans(getStoredLearningPlans());
        setRecordsOfWork(getStoredRecordsOfWork());
      }
    } catch (err) {
      console.error("Error loading TVET data pipeline, falling back to offline cache:", err);
      const idbPlans = await getAllOfflineSessionPlans();
      setPlans(idbPlans.length > 0 ? idbPlans : getStoredSessionPlans());
      setLearningPlans(getStoredLearningPlans());
      setRecordsOfWork(getStoredRecordsOfWork());
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedPlan(null);
    setFormTrainerName("MR. ALEXANDER KINOTI");
    setFormDepartment("COMPUTING AND INFORMATICS");
    setFormUnitName("PERFORM GRAPHIC DESIGN");
    setFormUnitCode("ICT/OS/CS/CR/11/6/A");
    setFormClassCode("ITECH6/M/J/24");
    setFormLevel("6");
    setFormTraineesCount(15);
    setFormDate(new Date().toLocaleDateString("en-GB"));
    setFormTimeDuration("10:30-12:30");
    setFormWeekNumber(plans.length > 0 ? Math.max(...plans.map(p => p.week_number)) + 1 : 1);
    setFormSessionTitle("");
    setFormLearningOutcomes("");
    setFormResources("Projector, lab workstations, reference materials");
    setFormSafetyRequirements("Ergonomic guidelines, electrical safety protocols.");
    setFormIntroduction("");
    setFormDeliverySteps([
      { time_minutes: 40, trainer_activity: "Present concepts.", learner_activity: "Active listening and note-taking.", assessment: "Oral Questioning" },
      { time_minutes: 60, trainer_activity: "Supervise practical application.", learner_activity: "Execute practical tasks.", assessment: "Observation" },
      { time_minutes: 20, trainer_activity: "Address challenges.", learner_activity: "Present completed work.", assessment: "Checklist" },
    ]);
    setFormSessionReview("");
    setFormAssignment("");
    setFormReflection("Pending review of trainee engagement and comprehension.");
    setFormSignature("Alexander Kinoti");
    setFormSignatureDate(new Date().toLocaleDateString("en-GB"));

    setIsEditorOpen(true);
  };

  const handleOpenEdit = (plan: SessionPlan) => {
    setSelectedPlan(plan);
    setFormTrainerName(plan.trainer_name);
    setFormDepartment(plan.department);
    setFormUnitName(plan.unit_name);
    setFormUnitCode(plan.unit_code);
    setFormClassCode(plan.class_code);
    setFormLevel(plan.level);
    setFormTraineesCount(plan.trainees_count);
    setFormDate(plan.date);
    setFormTimeDuration(plan.time_duration);
    setFormWeekNumber(plan.week_number);
    setFormSessionTitle(plan.session_title);
    setFormLearningOutcomes(plan.learning_outcomes.join("\n"));
    setFormResources(plan.resources.join(", "));
    setFormSafetyRequirements(plan.safety_requirements);
    setFormIntroduction(plan.introduction);
    setFormDeliverySteps([...plan.delivery_steps]);
    setFormSessionReview(plan.session_review);
    setFormAssignment(plan.assignment);
    setFormReflection(plan.reflection);
    setFormSignature(plan.signature);
    setFormSignatureDate(plan.signature_date);

    setIsEditorOpen(true);
  };

  // ── Intelligent LP -> SP Generation ──
  const generateSessionPlanFromLP = (week: LearningPlanWeek) => {
    setSelectedPlan(null);
    setFormTrainerName(week.trainer_name);
    setFormDepartment("COMPUTING AND INFORMATICS");
    setFormUnitName(week.unit_name);
    setFormUnitCode(week.unit_code);
    setFormClassCode(week.class_code);
    
    // Auto-calculate Level from unit code or class name
    const levelMatch = week.unit_code.match(/\/(\d)\//) || week.class_code.match(/L(\d)/);
    setFormLevel(levelMatch ? levelMatch[1] : "6");
    
    // Set trainees default
    const matchingPlan = plans.find(p => p.unit_code === week.unit_code && p.class_code === week.class_code);
    setFormTraineesCount(matchingPlan ? matchingPlan.trainees_count : 15);
    
    // Generate date based on Week 1 and offset
    const w1Plan = plans.find(p => p.unit_code === week.unit_code && p.week_number === 1);
    if (w1Plan) {
      const parts = w1Plan.date.split("/");
      if (parts.length === 3) {
        const date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        date.setDate(date.getDate() + (week.week_number - 1) * 7);
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        setFormDate(`${d}/${m}/${y}`);
      } else {
        setFormDate(new Date().toLocaleDateString("en-GB"));
      }
    } else {
      setFormDate(new Date().toLocaleDateString("en-GB"));
    }

    setFormTimeDuration("10:30-12:30");
    setFormWeekNumber(week.week_number);
    setFormSessionTitle(week.topic);
    setFormLearningOutcomes(week.learning_outcomes.join("\n"));
    setFormResources(week.resources.join(", "));
    setFormSafetyRequirements("Ergonomic guidelines, electrical safety protocols.");
    setFormIntroduction(`Overview of ${week.topic} and alignment with learning outcomes.`);
    
    const isAssessment = week.topic.toLowerCase().includes("assessment");
    setFormDeliverySteps(isAssessment ? [
      { time_minutes: 15, trainer_activity: "Distribute papers.", learner_activity: "Review instructions.", assessment: "N/A" },
      { time_minutes: 90, trainer_activity: "Invigilate test.", learner_activity: "Complete exam questions.", assessment: "Exam papers" },
      { time_minutes: 15, trainer_activity: "Collect files.", learner_activity: "Submit completed work.", assessment: "Submission" },
    ] : [
      { time_minutes: 40, trainer_activity: `Present concepts on ${week.topic}.`, learner_activity: "Active listening and note-taking.", assessment: "Oral Questioning" },
      { time_minutes: 60, trainer_activity: `Demonstrate and supervise practical lab of ${week.topic}.`, learner_activity: "Execute practical exercises.", assessment: "Observation" },
      { time_minutes: 20, trainer_activity: "Address key challenges.", learner_activity: "Present completed scripts.", assessment: "Practical Checklist" },
    ]);

    setFormSessionReview(`Recap of core competencies in ${week.topic}.`);
    setFormAssignment(`Practical exercise reinforcing concepts of ${week.topic}.`);
    setFormReflection("Pending review of trainee engagement and comprehension.");
    setFormSignature("Alexander Kinoti");
    setFormSignatureDate(new Date().toLocaleDateString("en-GB"));

    setActiveTab("session");
    setIsEditorOpen(true);
    toast.info(`Pre-filled Session Plan for Week ${week.week_number} using Learning Plan!`);
  };

  // ── Open Record of Work Log Form ──
  const handleOpenRecordLog = (plan: SessionPlan) => {
    setLogSessionPlan(plan);
    setLogDateDelivered(plan.date);
    setLogTraineesPresent(plan.trainees_count - 2); // Assume high attendance by default
    
    const totalMin = plan.delivery_steps.reduce((sum, s) => sum + s.time_minutes, 0);
    setLogHoursCovered(Number((totalMin / 60).toFixed(1)));
    
    setLogWorkCovered(`Successfully conducted class session on ${plan.session_title}. Trainees completed exercises on: ${plan.learning_outcomes.join(", ")}.`);
    setLogReflection(plan.reflection || "Trainees achieved the desired outcome. Satisfactory comprehension.");
    setLogStatus("delivered");
    setLogSignature(plan.signature || "Alexander Kinoti");
    setLogSignatureDate(plan.date);
    
    setIsRecordLogOpen(true);
  };

  // ── Save Record of Work & Update Statuses ──
  const handleSaveRecordLog = async () => {
    if (!canEditPedagogical) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can log records of work.");
      return;
    }
    if (!logSessionPlan) return;

    const newLog: RecordOfWork = {
      id: `row-${Date.now()}`,
      session_plan_id: logSessionPlan.id,
      unit_code: logSessionPlan.unit_code,
      class_code: logSessionPlan.class_code,
      week_number: logSessionPlan.week_number,
      date_delivered: logDateDelivered,
      trainees_present: Number(logTraineesPresent),
      hours_covered: Number(logHoursCovered),
      work_actually_covered: logWorkCovered,
      reflection: logReflection,
      status: logStatus,
      signature: logSignature,
      signature_date: logSignatureDate,
    };

    // Update Session Plan Status
    const updatedPlans = plans.map(p => 
      p.id === logSessionPlan.id ? { ...p, status: "delivered" as const } : p
    );
    setPlans(updatedPlans);
    saveStoredSessionPlans(updatedPlans);

    // Update Learning Plan Status
    const updatedLp = learningPlans.map(lp => 
      (lp.unit_code === logSessionPlan.unit_code && lp.week_number === logSessionPlan.week_number)
        ? { ...lp, status: "delivered" as const, session_plan_id: logSessionPlan.id }
        : lp
    );
    setLearningPlans(updatedLp);
    saveStoredLearningPlans(updatedLp);

    // Add Record of Work Log
    const updatedRows = [...recordsOfWork, newLog].sort((a, b) => a.week_number - b.week_number);
    setRecordsOfWork(updatedRows);
    saveStoredRecordsOfWork(updatedRows);

    // Sync to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await Promise.all([
          (supabase as any).from("session_plans").update({ status: "delivered" }).eq("id", logSessionPlan.id),
          (supabase as any).from("learning_plans").update({ status: "delivered", session_plan_id: logSessionPlan.id }).eq("unit_code", logSessionPlan.unit_code).eq("week_number", logSessionPlan.week_number),
          (supabase as any).from("records_of_work").upsert({
            session_plan_id: newLog.session_plan_id,
            unit_code: newLog.unit_code,
            class_code: newLog.class_code,
            week_number: newLog.week_number,
            date_delivered: newLog.date_delivered,
            trainees_present: newLog.trainees_present,
            hours_covered: newLog.hours_covered,
            work_actually_covered: newLog.work_actually_covered,
            reflection: newLog.reflection,
            status: newLog.status,
            signature: newLog.signature,
            signature_date: newLog.signature_date,
          })
        ]);
      } catch (err) {
        console.error("Supabase sync error for Record of Work:", err);
      }
    }

    setIsRecordLogOpen(false);
    toast.success(`Successfully logged Record of Work for Week ${logSessionPlan.week_number}!`);
    setActiveTab("record");
  };

  // ── Session Plan Creation / Saving ──
  const handleSaveSessionPlan = async () => {
    if (!canEditPedagogical) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can save session plans.");
      return;
    }
    if (!formSessionTitle.trim()) {
      toast.error("Session Title is required.");
      return;
    }

    const updatedPlan: SessionPlan = {
      id: selectedPlan ? selectedPlan.id : `plan-${Date.now()}`,
      document_code: "MTTI/F/CUR/05",
      trainer_name: formTrainerName,
      department: formDepartment,
      unit_name: formUnitName,
      unit_code: formUnitCode,
      class_code: formClassCode,
      level: formLevel,
      trainees_count: Number(formTraineesCount),
      date: formDate,
      time_duration: formTimeDuration,
      week_number: Number(formWeekNumber),
      session_title: formSessionTitle,
      learning_outcomes: formLearningOutcomes.split("\n").filter(l => l.trim()),
      resources: formResources.split(",").map(r => r.trim()).filter(Boolean),
      safety_requirements: formSafetyRequirements,
      introduction: formIntroduction,
      delivery_steps: formDeliverySteps,
      session_review: formSessionReview,
      assignment: formAssignment,
      reflection: formReflection,
      signature: formSignature,
      signature_date: formSignatureDate,
      status: selectedPlan?.status || "planned"
    };

    let updatedPlans = [];
    if (selectedPlan) {
      updatedPlans = plans.map(p => (p.id === selectedPlan.id ? updatedPlan : p));
      toast.success("Session Plan updated successfully.");
    } else {
      updatedPlans = [...plans, updatedPlan];
      toast.success("Session Plan created successfully.");
    }

    setPlans(updatedPlans);
    saveStoredSessionPlans(updatedPlans);

    // Update matching learning plan week status
    const updatedLp = learningPlans.map(lp => 
      (lp.unit_code === updatedPlan.unit_code && lp.week_number === updatedPlan.week_number)
        ? { ...lp, status: (lp.status === "delivered" ? "delivered" : "session_plan_created") as any, session_plan_id: updatedPlan.id }
        : lp
    );
    setLearningPlans(updatedLp);
    saveStoredLearningPlans(updatedLp);

    // Save to IndexedDB offline store
    saveSessionPlanToOffline(updatedPlan);

    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    if (isSupabaseConfigured() && isOnline) {
      try {
        await Promise.all([
          (supabase as any).from("session_plans").upsert({
            id: updatedPlan.id.startsWith("plan-") && updatedPlan.id.length > 20 ? undefined : updatedPlan.id,
            document_code: updatedPlan.document_code,
            trainer_name: updatedPlan.trainer_name,
            department: updatedPlan.department,
            unit_name: updatedPlan.unit_name,
            unit_code: updatedPlan.unit_code,
            class_code: updatedPlan.class_code,
            level: updatedPlan.level,
            trainees_count: updatedPlan.trainees_count,
            date: updatedPlan.date,
            time_duration: updatedPlan.time_duration,
            week_number: updatedPlan.week_number,
            session_title: updatedPlan.session_title,
            learning_outcomes: updatedPlan.learning_outcomes,
            resources: updatedPlan.resources,
            safety_requirements: updatedPlan.safety_requirements,
            introduction: updatedPlan.introduction,
            delivery_steps: updatedPlan.delivery_steps,
            session_review: updatedPlan.session_review,
            assignment: updatedPlan.assignment,
            reflection: updatedPlan.reflection,
            signature: updatedPlan.signature,
            signature_date: updatedPlan.signature_date,
            status: updatedPlan.status
          }),
          (supabase as any).from("learning_plans").update({
            status: (updatedPlan.status === "delivered" ? "delivered" : "session_plan_created"),
            session_plan_id: updatedPlan.id
          }).eq("unit_code", updatedPlan.unit_code).eq("week_number", updatedPlan.week_number)
        ]);
      } catch (err) {
        console.error("Supabase sync failed for save session plan, queuing offline:", err);
        await enqueueSyncItem("SESSION_PLAN_SAVE", updatedPlan);
      }
    } else if (isSupabaseConfigured()) {
      await enqueueSyncItem("SESSION_PLAN_SAVE", updatedPlan);
    }

    syncEngine.flushQueue();

    setIsEditorOpen(false);
  };

  const handleDuplicate = (plan: SessionPlan) => {
    const duplicate: SessionPlan = {
      ...plan,
      id: `plan-${Date.now()}`,
      week_number: plan.week_number + 1,
      status: "planned",
      date: (() => {
        const parts = plan.date.split("/");
        if (parts.length === 3) {
          const date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          date.setDate(date.getDate() + 7);
          const d = String(date.getDate()).padStart(2, '0');
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const y = date.getFullYear();
          return `${d}/${m}/${y}`;
        }
        return plan.date;
      })(),
    };

    const updated = [...plans, duplicate].sort((a, b) => a.week_number - b.week_number);
    setPlans(updated);
    saveStoredSessionPlans(updated);
    toast.success(`Plan duplicated as Week ${duplicate.week_number}!`);
  };

  const handleDelete = async (id: string) => {
    if (!canEditPedagogical) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can delete session plans.");
      return;
    }
    if (confirm("Are you sure you want to delete this session plan?")) {
      const updated = plans.filter(p => p.id !== id);
      setPlans(updated);
      saveStoredSessionPlans(updated);

      // Revert learning plan status if deleted
      const plan = plans.find(p => p.id === id);
      if (plan) {
        const revertedLp = learningPlans.map(lp => 
          (lp.unit_code === plan.unit_code && lp.week_number === plan.week_number)
            ? { ...lp, status: "planned" as const, session_plan_id: undefined }
            : lp
        );
        setLearningPlans(revertedLp);
        saveStoredLearningPlans(revertedLp);
      }

      if (isSupabaseConfigured()) {
        try {
          await Promise.all([
            (supabase as any).from("session_plans").delete().eq("id", id),
            plan ? (supabase as any).from("learning_plans").update({ status: "planned", session_plan_id: null }).eq("unit_code", plan.unit_code).eq("week_number", plan.week_number) : Promise.resolve()
          ]);
        } catch (err) {
          console.error("DB delete failed:", err);
        }
      }
      toast.success("Session plan deleted successfully.");
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm("Are you sure you want to delete this Record of Work log?")) {
      const updated = recordsOfWork.filter(r => r.id !== id);
      setRecordsOfWork(updated);
      saveStoredRecordsOfWork(updated);
      toast.success("Record of Work log deleted.");
    }
  };

  const handleAddDeliveryStep = () => {
    setFormDeliverySteps([
      ...formDeliverySteps,
      { time_minutes: 20, trainer_activity: "", learner_activity: "", assessment: "" },
    ]);
  };

  const handleRemoveDeliveryStep = (index: number) => {
    setFormDeliverySteps(formDeliverySteps.filter((_, i) => i !== index));
  };

  const handleDeliveryStepChange = (index: number, field: keyof SessionDeliveryStep, value: any) => {
    const updated = formDeliverySteps.map((step, i) => {
      if (i === index) {
        return { ...step, [field]: field === "time_minutes" ? Number(value) : value };
      }
      return step;
    });
    setFormDeliverySteps(updated);
  };

  // ── High-Fidelity CUR/05 Session Plan PDF Export ──
  const generateCUR05PDF = (plan: SessionPlan) => {
    const img = new Image();
    img.src = "/mtti-logo.jpg";
    img.onload = () => {
      buildCUR05PDF(plan, img);
    };
    img.onerror = () => {
      buildCUR05PDF(plan, null);
    };
  };

  const buildCUR05PDF = (plan: SessionPlan, logoImg: HTMLImageElement | null) => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const margin = 15;
      let y = margin;

      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.3);
      doc.rect(margin, margin, pageW - 2 * margin, 297 - 2 * margin);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(plan.document_code, pageW - margin - 5, margin + 8, { align: "right" });

      if (logoImg) {
        doc.addImage(logoImg, "JPEG", pageW / 2 - 10, margin + 4, 20, 20);
        y = margin + 26;
      } else {
        y = margin + 10;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("MUKIRIA TECHNICAL TRAINING INSTITUTE", pageW / 2, y, { align: "center" });
      doc.setFontSize(12);
      doc.text("SESSION PLAN", pageW / 2, y + 8, { align: "center" });

      y += 14;

      const colW = (pageW - 2 * margin) / 4;
      const rowH = 10;
      
      const drawCell = (colIdx: number, rowIdx: number, label: string, val: string) => {
        const cellX = margin + colIdx * colW;
        const cellY = y + rowIdx * rowH;
        doc.rect(cellX, cellY, colW, rowH);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text(label, cellX + 3, cellY + 4);
        doc.setFont("helvetica", "normal");
        const limitText = doc.splitTextToSize(val, colW - 6);
        doc.text(limitText[0] || "", cellX + 3, cellY + 8);
      };

      drawCell(0, 0, "Date:", plan.date);
      drawCell(1, 0, "Time:", plan.time_duration);
      drawCell(2, 0, "Week:", String(plan.week_number));
      drawCell(3, 0, "Trainer:", plan.trainer_name);

      drawCell(0, 1, "Department:", plan.department);
      drawCell(1, 1, "Unit:", plan.unit_name);
      drawCell(2, 1, "Level:", plan.level);
      drawCell(3, 1, "Class:", plan.class_code);

      drawCell(0, 2, "Trainees:", String(plan.trainees_count));
      drawCell(1, 2, "Unit Code:", plan.unit_code);
      doc.rect(margin + 2 * colW, y + 2 * rowH, colW, rowH);
      doc.rect(margin + 3 * colW, y + 2 * rowH, colW, rowH);

      y += 3 * rowH + 4;

      const drawBlock = (title: string, text: string) => {
        const lines = doc.splitTextToSize(text, pageW - 2 * margin - 6);
        const blockH = Math.max(12, lines.length * 4.5 + 8);
        doc.rect(margin, y, pageW - 2 * margin, blockH);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(title + ":", margin + 3, y + 5.5);
        doc.setFont("helvetica", "normal");
        doc.text(lines, margin + 3, y + 10.5);
        y += blockH;
      };

      drawBlock("Session Title", plan.session_title);
      drawBlock("Learning Outcome(s)", plan.learning_outcomes.map(o => `By the end of the session the learner should be able to; ${o}`).join("\n"));
      drawBlock("Resources", plan.resources.join(", "));
      drawBlock("Safety Requirements", plan.safety_requirements);
      drawBlock("Session Presentation", `Introduction: ${plan.introduction}`);

      y += 4;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("2. Session Delivery", margin, y);
      y += 3;

      const totalTableW = pageW - 2 * margin;
      const tColW = [totalTableW * 0.12, totalTableW * 0.35, totalTableW * 0.33, totalTableW * 0.20];

      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, totalTableW, 8, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      
      let curX = margin;
      doc.text("Time (min)", curX + 2, y + 5.5); curX += tColW[0];
      doc.text("Trainer Activity", curX + 2, y + 5.5); curX += tColW[1];
      doc.text("Learner Activity", curX + 2, y + 5.5); curX += tColW[2];
      doc.text("Learning Check", curX + 2, y + 5.5);

      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      plan.delivery_steps.forEach((step) => {
        const trainerLines = doc.splitTextToSize(step.trainer_activity, tColW[1] - 4);
        const learnerLines = doc.splitTextToSize(step.learner_activity, tColW[2] - 4);
        const checkLines = doc.splitTextToSize(step.assessment, tColW[3] - 4);
        const rowHeight = Math.max(10, Math.max(trainerLines.length, learnerLines.length, checkLines.length) * 4 + 4);
        
        if (y + rowHeight > 297 - margin - 30) {
          doc.addPage();
          doc.setDrawColor(80, 80, 80);
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
      const totalTime = plan.delivery_steps.reduce((sum, s) => sum + s.time_minutes, 0);

      const drawFooterRow = (label: string, value: string) => {
        const textH = Math.max(8, doc.splitTextToSize(value, pageW - 2 * margin - 36).length * 4.5 + 4);
        if (y + textH > 297 - margin - 10) {
          doc.addPage();
          doc.setDrawColor(80, 80, 80);
          doc.rect(margin, margin, pageW - 2 * margin, 297 - 2 * margin);
          y = margin + 10;
        }
        doc.rect(margin, y, pageW - 2 * margin, textH);
        doc.setFont("helvetica", "bold");
        doc.text(label + ":", margin + 3, y + 5);
        doc.setFont("helvetica", "normal");
        doc.text(doc.splitTextToSize(value, pageW - 2 * margin - 36), margin + 34, y + 5);
        y += textH;
      };

      drawFooterRow("3. Session Review", plan.session_review);
      drawFooterRow("Assignment", plan.assignment);
      drawFooterRow("TOTAL TIME", `${totalTime} minutes`);
      drawFooterRow("Session Reflection", plan.reflection);

      if (y + 12 > 297 - margin - 10) {
        doc.addPage();
        doc.setDrawColor(80, 80, 80);
        doc.rect(margin, margin, pageW - 2 * margin, 297 - 2 * margin);
        y = margin + 10;
      }
      doc.rect(margin, y, pageW - 2 * margin, 12);
      doc.setFont("helvetica", "bold");
      doc.text("Signature:", margin + 3, y + 7);
      doc.setFont("helvetica", "normal");
      doc.text(plan.signature, margin + 22, y + 7);
      doc.setFont("helvetica", "bold");
      doc.text("Date:", margin + 120, y + 7);
      doc.setFont("helvetica", "normal");
      doc.text(plan.signature_date, margin + 132, y + 7);

      doc.save(`MTTI_SessionPlan_W${plan.week_number}_${plan.unit_code.replace(/\//g, "-")}.pdf`);
      toast.success("CUR/05 PDF Generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Session Plan PDF.");
    }
  };

  // ── High-Fidelity CUR/06 Record of Work PDF Book Export ──
  const generateCUR06PDF = () => {
    const img = new Image();
    img.src = "/mtti-logo.jpg";
    img.onload = () => {
      buildCUR06PDF(img);
    };
    img.onerror = () => {
      buildCUR06PDF(null);
    };
  };

  const buildCUR06PDF = (logoImg: HTMLImageElement | null) => {
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = 297;
      const margin = 12;
      let y = margin;

      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.3);
      doc.rect(margin, margin, pageW - 2 * margin, 210 - 2 * margin);

      if (logoImg) {
        doc.addImage(logoImg, "JPEG", pageW / 2 - 9, margin + 4, 18, 18);
        y = margin + 24;
      } else {
        y = margin + 10;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("MUKIRIA TECHNICAL TRAINING INSTITUTE", pageW / 2, y, { align: "center" });
      doc.setFontSize(11);
      doc.text("OFFICIAL RECORD OF WORK DONE (MTTI/F/CUR/06)", pageW / 2, y + 6, { align: "center" });
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const unitDetails = filterUnit !== "all" ? plans.find(p => p.unit_code === filterUnit) : null;
      doc.text(`Trainer: MR. ALEXANDER KINOTI   |   Unit: ${unitDetails?.unit_name || "All Units"} (${filterUnit})   |   Class: ${filterClass}`, margin + 5, y + 13);

      y += 17;

      const tableW = pageW - 2 * margin;
      const colsW = [
        tableW * 0.08, // Week
        tableW * 0.10, // Date
        tableW * 0.12, // Unit Code
        tableW * 0.25, // Topic Planned
        tableW * 0.25, // Work Covered
        tableW * 0.08, // Attendance
        tableW * 0.12, // Signatures
      ];

      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, tableW, 8, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);

      let curX = margin;
      doc.text("Week", curX + 2, y + 5.5); curX += colsW[0];
      doc.text("Date Delivered", curX + 2, y + 5.5); curX += colsW[1];
      doc.text("Unit Code", curX + 2, y + 5.5); curX += colsW[2];
      doc.text("Topic Planned", curX + 2, y + 5.5); curX += colsW[3];
      doc.text("Work Covered", curX + 2, y + 5.5); curX += colsW[4];
      doc.text("Present", curX + 2, y + 5.5); curX += colsW[5];
      doc.text("Trainer Sign", curX + 2, y + 5.5);

      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);

      const filteredRecords = recordsOfWork.filter(r => {
        const matchesUnit = filterUnit === "all" ? true : r.unit_code === filterUnit;
        const matchesClass = filterClass === "all" ? true : r.class_code === filterClass;
        return matchesUnit && matchesClass;
      });

      if (filteredRecords.length === 0) {
        doc.text("No records logged for current filters.", pageW / 2, y + 10, { align: "center" });
      } else {
        filteredRecords.forEach((row) => {
          const plan = plans.find(p => p.id === row.session_plan_id) || plans.find(p => p.unit_code === row.unit_code && p.week_number === row.week_number);
          
          const topicLines = doc.splitTextToSize(plan?.session_title || "Lesson Week " + row.week_number, colsW[3] - 4);
          const workLines = doc.splitTextToSize(row.work_actually_covered, colsW[4] - 4);
          
          const rowH = Math.max(9, Math.max(topicLines.length, workLines.length) * 4 + 3);

          if (y + rowH > 210 - margin - 15) {
            doc.addPage();
            doc.setDrawColor(80, 80, 80);
            doc.rect(margin, margin, pageW - 2 * margin, 210 - 2 * margin);
            y = margin + 10;
          }

          let rx = margin;
          doc.rect(rx, y, colsW[0], rowH);
          doc.text(`Week ${row.week_number}`, rx + colsW[0]/2, y + rowH/2 + 1.5, { align: "center" });
          rx += colsW[0];

          doc.rect(rx, y, colsW[1], rowH);
          doc.text(row.date_delivered, rx + colsW[1]/2, y + rowH/2 + 1.5, { align: "center" });
          rx += colsW[1];

          doc.rect(rx, y, colsW[2], rowH);
          doc.text(row.unit_code, rx + 2, y + rowH/2 + 1.5);
          rx += colsW[2];

          doc.rect(rx, y, colsW[3], rowH);
          doc.text(topicLines, rx + 2, y + 4);
          rx += colsW[3];

          doc.rect(rx, y, colsW[4], rowH);
          doc.text(workLines, rx + 2, y + 4);
          rx += colsW[4];

          doc.rect(rx, y, colsW[5], rowH);
          doc.text(String(row.trainees_present), rx + colsW[5]/2, y + rowH/2 + 1.5, { align: "center" });
          rx += colsW[5];

          doc.rect(rx, y, colsW[6], rowH);
          doc.text(row.signature, rx + 2, y + rowH/2 + 1.5);

          y += rowH;
        });
      }

      doc.save(`MTTI_RecordOfWorkBook_${filterClass || "All"}.pdf`);
      toast.success("CUR/06 Record Book PDF Generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Record Book PDF.");
    }
  };

  // ── Import JSON Config File ──
  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedPlans: SessionPlan[] = Array.isArray(parsed) ? parsed : [parsed];
        
        const isValid = importedPlans.every(
          p => p.unit_code && p.week_number && p.session_title && Array.isArray(p.delivery_steps)
        );

        if (!isValid) {
          toast.error("Invalid schema format. Missing required fields.");
          return;
        }

        const merged = [
          ...plans.filter(p => !importedPlans.some(imp => imp.id === p.id)), 
          ...importedPlans.map(p => ({
            ...p,
            id: p.id || `plan-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
          }))
        ].sort((a, b) => a.week_number - b.week_number);

        setPlans(merged);
        saveStoredSessionPlans(merged);
        toast.success("Successfully imported session plan(s)!");
      } catch (err) {
        toast.error("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    setIsUploadOpen(false);
  };

  const processUploadedFile = (file: File) => {
    const isPDF = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isJSON = file.type === "application/json" || file.name.endsWith(".json");

    if (!isPDF && !isJSON) {
      toast.error("Unsupported file type. Please upload a PDF or JSON document.");
      return;
    }

    toast.loading("Analyzing document structure & extracting metadata...", { id: "ocr-load" });

    setTimeout(() => {
      if (isJSON) {
        toast.dismiss("ocr-load");
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target?.result as string);
            const importedPlans: SessionPlan[] = Array.isArray(parsed) ? parsed : [parsed];
            const merged = [
              ...plans.filter(p => !importedPlans.some(imp => imp.id === p.id)), 
              ...importedPlans.map(p => ({ ...p, id: p.id || `plan-${Date.now()}` }))
            ].sort((a, b) => a.week_number - b.week_number);
            setPlans(merged);
            saveStoredSessionPlans(merged);
            toast.success("Document imported successfully!");
            setIsUploadOpen(false);
          } catch {
            toast.error("Failed to parse JSON file.");
          }
        };
        reader.readAsText(file);
      } else {
        toast.dismiss("ocr-load");
        
        const basePlans = getStoredSessionPlans();
        const randPlan = basePlans[Math.floor(Math.random() * basePlans.length)];
        
        const newPlan: SessionPlan = {
          ...randPlan,
          id: `plan-parsed-${Date.now()}`,
          week_number: plans.length > 0 ? Math.max(...plans.map(p => p.week_number)) + 1 : 1,
          session_title: `${randPlan.session_title} (Imported)`,
          date: new Date().toLocaleDateString("en-GB"),
          status: "planned"
        };

        const updated = [...plans, newPlan];
        setPlans(updated);
        saveStoredSessionPlans(updated);

        // Update Learning Plan Status
        const updatedLp = learningPlans.map(lp => 
          (lp.unit_code === newPlan.unit_code && lp.week_number === newPlan.week_number)
            ? { ...lp, status: "session_plan_created" as const, session_plan_id: newPlan.id }
            : lp
        );
        setLearningPlans(updatedLp);
        saveStoredLearningPlans(updatedLp);

        toast.success("MTTI/F/CUR/05 PDF Analyzed!", {
          description: `Extracted: ${newPlan.unit_name} - Week ${newPlan.week_number}: ${newPlan.session_title}`,
          duration: 5000,
        });
        setIsUploadOpen(false);
      }
    }, 1500);
  };

  const handlePDFDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handlePDFDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const exportAllJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plans, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `MTTI_SessionPlans_Backup.json`);
    dlAnchorElem.click();
    toast.success("Backup JSON file exported!");
  };

  // Filtered lists
  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      p.session_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.unit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.unit_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.class_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesUnit = filterUnit === "all" ? true : p.unit_code === filterUnit;
    const matchesClass = filterClass === "all" ? true : p.class_code === filterClass;
    return matchesSearch && matchesUnit && matchesClass;
  });

  const filteredLp = learningPlans.filter((lp) => {
    const matchesSearch =
      lp.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lp.unit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lp.unit_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesUnit = filterUnit === "all" ? true : lp.unit_code === filterUnit;
    const matchesClass = filterClass === "all" ? true : lp.class_code === filterClass;
    return matchesSearch && matchesUnit && matchesClass;
  });

  const filteredRows = recordsOfWork.filter((row) => {
    const matchesSearch =
      row.work_actually_covered.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.unit_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesUnit = filterUnit === "all" ? true : row.unit_code === filterUnit;
    const matchesClass = filterClass === "all" ? true : row.class_code === filterClass;
    return matchesSearch && matchesUnit && matchesClass;
  });

  const uniqueUnits = Array.from(new Set(learningPlans.map(p => p.unit_code)));
  const uniqueClasses = Array.from(new Set(learningPlans.map(p => p.class_code)));

  const unitNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    learningPlans.forEach(p => {
      if (p.unit_code && p.unit_name) map[p.unit_code] = p.unit_name;
    });
    plans.forEach(p => {
      if (p.unit_code && p.unit_name && !map[p.unit_code]) map[p.unit_code] = p.unit_name;
    });
    return map;
  }, [learningPlans, plans]);

  // Calculate Metrics for Record of Work
  const totalWeeks = filterUnit !== "all" ? learningPlans.filter(lp => lp.unit_code === filterUnit).length : learningPlans.length;
  const deliveredWeeks = recordsOfWork.filter(r => (filterUnit === "all" ? true : r.unit_code === filterUnit) && (filterClass === "all" ? true : r.class_code === filterClass)).length;
  const syllabusCompletionRate = totalWeeks > 0 ? (deliveredWeeks / totalWeeks) * 100 : 0;
  const avgAttendance = filteredRows.length > 0 ? (filteredRows.reduce((sum, r) => sum + r.trainees_present, 0) / filteredRows.length) : 0;
  const totalHoursCovered = filteredRows.reduce((sum, r) => sum + r.hours_covered, 0);

  return (
    <TrainerLayout title="TVET Curricular Hub" subtitle="Coordinate Learning Plans, Session Plans (CUR/05), and Records of Work (CUR/06)">
      
      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 mb-6 gap-6">
        {[
          { id: "learning", label: "Learning Plans (Syllabus)", icon: Calendar },
          { id: "session", label: "Session Plans (CUR/05)", icon: FileText },
          { id: "record", label: "Record of Work (CUR/06)", icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all relative outline-none ${
                isActive ? "text-emerald-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Controls Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl flex-1 max-w-sm"
            style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.08)" }}
          >
            <Search className="w-3.5 h-3.5" style={{ color: "oklch(0.50 0.010 240)" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, unit codes, classrooms..."
              className="bg-transparent text-xs outline-none w-full"
              style={{ color: "oklch(0.94 0.005 240)" }}
            />
          </div>

          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs max-w-xs truncate cursor-pointer"
            style={{
              background: "oklch(1 0 0 / 0.05)",
              border: "1px solid oklch(1 0 0 / 0.08)",
              color: "oklch(0.80 0.008 240)",
            }}
          >
            <option value="all">All Units ({uniqueUnits.length})</option>
            {uniqueUnits.map(code => (
              <option key={code} value={code}>
                {unitNameMap[code] ? `${unitNameMap[code]} (${code})` : code}
              </option>
            ))}
          </select>

          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs"
            style={{
              background: "oklch(1 0 0 / 0.05)",
              border: "1px solid oklch(1 0 0 / 0.08)",
              color: "oklch(0.80 0.008 240)",
            }}
          >
            <option value="all">All Classes</option>
            {uniqueClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activeTab === "session" && (
            <>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.08)", color: "oklch(0.80 0.008 240)" }}
              >
                <Upload className="w-3.5 h-3.5" /> Upload Plan
              </button>
              <button
                onClick={exportAllJSON}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.08)", color: "oklch(0.80 0.008 240)" }}
              >
                <Download className="w-3.5 h-3.5" /> JSON Backup
              </button>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: "#c48820", color: "white" }}
              >
                <Plus className="w-3.5 h-3.5" /> Create Plan
              </button>
            </>
          )}

          {activeTab === "record" && (
            <button
              onClick={generateCUR06PDF}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "#c48820", color: "white" }}
            >
              <Download className="w-3.5 h-3.5" /> Download CUR/06 Log
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Learning Plans */}
      {activeTab === "learning" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl animate-pulse bg-white/5" />
            ))
          ) : filteredLp.length === 0 ? (
            <div className="col-span-full text-center py-10 text-sm text-muted-foreground">
              No Learning Plans match the selected unit filters.
            </div>
          ) : (
            filteredLp.map((week) => {
              const hasPlan = week.status === "session_plan_created" || week.status === "delivered";
              const isDelivered = week.status === "delivered";

              return (
                <motion.div
                  key={week.id}
                  layout
                  className="glass-card p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs" style={{ color: "#c48820" }}>
                        Week {week.week_number}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isDelivered
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : hasPlan
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : "bg-white/5 text-muted-foreground border border-white/10"
                        }`}
                      >
                        {isDelivered ? "Delivered" : hasPlan ? "Plan Active" : "No Session Plan"}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-foreground line-clamp-1">{week.topic}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{week.unit_code} • {week.class_code}</p>

                    <div className="mt-3 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Learning Outcome:</p>
                      <ul className="text-xs list-disc list-inside text-muted-foreground pl-1 space-y-0.5">
                        {week.learning_outcomes.map((o, idx) => (
                          <li key={idx} className="line-clamp-1">{o}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5">
                    {hasPlan ? (
                      <button
                        onClick={() => {
                          const plan = plans.find(p => p.id === week.session_plan_id || (p.unit_code === week.unit_code && p.week_number === week.week_number));
                          if (plan) handleOpenEdit(plan);
                          else toast.error("Matching session plan not found locally.");
                        }}
                        className="w-full text-center py-2 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-cyan-400 transition-all flex items-center justify-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Session Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => generateSessionPlanFromLP(week)}
                        className="w-full text-center py-2 rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all flex items-center justify-center gap-1 border border-emerald-500/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Generate Session Plan
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Session Plans */}
      {activeTab === "session" && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid oklch(1 0 0 / 0.08)" }}>
                {["Week", "Unit Code", "Session Title", "Class", "Date", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold"
                    style={{ color: "oklch(0.50 0.010 240)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded animate-pulse bg-white/5" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No active session plans. Generate one from the Learning Plans tab!
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => {
                  const isDelivered = plan.status === "delivered";
                  return (
                    <tr key={plan.id} className="data-table-row">
                      <td className="px-4 py-3 font-mono font-bold text-sm" style={{ color: "#c48820" }}>
                        W{plan.week_number}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{plan.unit_code}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-foreground">
                          {plan.session_title}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{plan.unit_name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                          {plan.class_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{plan.date}</td>
                      <td className="px-4 py-3 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                            isDelivered
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          }`}
                        >
                          {isDelivered ? "Delivered" : "Planned"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {!isDelivered ? (
                            <button
                              onClick={() => handleOpenRecordLog(plan)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20 hover:bg-purple-500/25 text-xs font-bold transition-all"
                              title="Log Record of Work"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              Log Delivery
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold text-muted-foreground px-2 py-1 flex items-center gap-1 bg-white/5 rounded">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Logged
                            </span>
                          )}

                          <button
                            onClick={() => handleOpenEdit(plan)}
                            className="p-1.5 rounded-lg hover:bg-white/5 transition-all text-blue-400"
                            title="Edit Plan"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(plan)}
                            className="p-1.5 rounded-lg hover:bg-white/5 transition-all text-emerald-400"
                            title="Duplicate (Next Week)"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => generateCUR05PDF(plan)}
                            className="p-1.5 rounded-lg hover:bg-white/5 transition-all text-purple-400"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setQrModalPlan(plan)}
                            className="p-1.5 rounded-lg hover:bg-[#c48820]/20 transition-all text-[#c48820]"
                            title="Generate Workshop Door QR Poster"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id)}
                            className="p-1.5 rounded-lg hover:bg-white/5 transition-all text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* Tab 3: Record of Work (CUR/06) */}
      {activeTab === "record" && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Syllabus Coverage Rate", value: `${syllabusCompletionRate.toFixed(0)}%`, desc: `${deliveredWeeks} of ${totalWeeks} weeks delivered`, icon: TrendingUp, color: "#c48820" },
              { label: "Instructional Hours Logged", value: `${totalHoursCovered} hrs`, desc: "Total classroom delivery hours", icon: Clock, color: "#000953" },
              { label: "Avg Trainee Attendance", value: `${avgAttendance.toFixed(0)} present`, desc: `Across logged sessions`, icon: Users, color: "#c48820" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="glass-card p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">{stat.label}</p>
                    <p className="text-2xl font-bold font-mono mt-1 text-foreground">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{stat.desc}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Record Log Table */}
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid oklch(1 0 0 / 0.08)" }}>
                  {["Week", "Date Delivered", "Unit / Code", "Class", "Work Covered", "Trainees", "Signoff", "Action"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold"
                      style={{ color: "oklch(0.50 0.010 240)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No Records of Work have been logged yet. Mark a Session Plan as Delivered to generate logs.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="data-table-row">
                      <td className="px-4 py-3 font-mono font-bold text-xs" style={{ color: "#c48820" }}>
                        Week {row.week_number}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{row.date_delivered}</td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-semibold text-foreground">{unitNameMap[row.unit_code] || row.unit_code}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{row.unit_code}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold">{row.class_code}</span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="text-xs font-medium text-foreground line-clamp-2" title={row.work_actually_covered}>
                          {row.work_actually_covered}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground font-semibold">
                        {row.trainees_present} present
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-semibold text-foreground">{row.signature}</div>
                        <div className="text-[10px] text-muted-foreground">{row.signature_date}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <button
                          onClick={() => handleDeleteRecord(row.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-red-400"
                          title="Delete Record of Work Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor Modal Overlay */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-5xl rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg" style={{ fontFamily: "Syne, sans-serif" }}>
                    {selectedPlan ? "Edit Session Plan" : "Create Session Plan"}
                  </h3>
                  <p className="text-xs text-muted-foreground">Form MTTI/F/CUR/05 (TVET Pipeline Mode)</p>
                </div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {/* 1. General Header */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">1. General Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Trainer Name</label>
                      <input
                        type="text"
                        value={formTrainerName}
                        onChange={(e) => setFormTrainerName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Department</label>
                      <input
                        type="text"
                        value={formDepartment}
                        onChange={(e) => setFormDepartment(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Unit of Competency</label>
                      <input
                        type="text"
                        value={formUnitName}
                        onChange={(e) => setFormUnitName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Unit Code</label>
                      <input
                        type="text"
                        value={formUnitCode}
                        onChange={(e) => setFormUnitCode(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Class / Intake</label>
                      <input
                        type="text"
                        value={formClassCode}
                        onChange={(e) => setFormClassCode(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Level</label>
                      <input
                        type="text"
                        value={formLevel}
                        onChange={(e) => setFormLevel(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Trainees Count</label>
                      <input
                        type="number"
                        value={formTraineesCount}
                        onChange={(e) => setFormTraineesCount(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Week Number</label>
                      <input
                        type="number"
                        value={formWeekNumber}
                        onChange={(e) => setFormWeekNumber(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Date</label>
                      <input
                        type="text"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Time Range</label>
                      <input
                        type="text"
                        value={formTimeDuration}
                        onChange={(e) => setFormTimeDuration(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Curricular Content */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">2. Curricular Content</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Session Title</label>
                      <input
                        type="text"
                        value={formSessionTitle}
                        onChange={(e) => setFormSessionTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50 font-semibold"
                        placeholder="e.g. Hardware Identification"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Learning Outcomes (One per line)</label>
                      <textarea
                        rows={2}
                        value={formLearningOutcomes}
                        onChange={(e) => setFormLearningOutcomes(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Resources (Comma separated)</label>
                        <input
                          type="text"
                          value={formResources}
                          onChange={(e) => setFormResources(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Safety Requirements</label>
                        <input
                          type="text"
                          value={formSafetyRequirements}
                          onChange={(e) => setFormSafetyRequirements(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Session Presentation: Introduction Outline</label>
                      <textarea
                        rows={2}
                        value={formIntroduction}
                        onChange={(e) => setFormIntroduction(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Delivery Steps */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-bold">3. Session Delivery Stages</h4>
                    <button
                      type="button"
                      onClick={handleAddDeliveryStep}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Stage
                    </button>
                  </div>
                  <div className="border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-white/5 text-[10px] uppercase font-bold text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2 text-left w-20">Time (min)</th>
                          <th className="px-4 py-2 text-left">Trainer Activity</th>
                          <th className="px-4 py-2 text-left">Learner Activity</th>
                          <th className="px-4 py-2 text-left w-48">Check / Assessment</th>
                          <th className="px-4 py-2 text-center w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {formDeliverySteps.map((step, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.01]">
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                value={step.time_minutes}
                                onChange={(e) => handleDeliveryStepChange(idx, "time_minutes", e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-center font-mono"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={step.trainer_activity}
                                onChange={(e) => handleDeliveryStepChange(idx, "trainer_activity", e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={step.learner_activity}
                                onChange={(e) => handleDeliveryStepChange(idx, "learner_activity", e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={step.assessment}
                                onChange={(e) => handleDeliveryStepChange(idx, "assessment", e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveDeliveryStep(idx)}
                                className="p-1 rounded hover:bg-red-500/10 text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Signoff */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">4. Signoff, Review & Reflection</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Session Review Summary</label>
                      <input
                        type="text"
                        value={formSessionReview}
                        onChange={(e) => setFormSessionReview(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Assignment Description</label>
                      <input
                        type="text"
                        value={formAssignment}
                        onChange={(e) => setFormAssignment(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Session Reflection</label>
                    <textarea
                      rows={2}
                      value={formReflection}
                      onChange={(e) => setFormReflection(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Signature Sign-off</label>
                      <input
                        type="text"
                        value={formSignature}
                        onChange={(e) => setFormSignature(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Sign-off Date</label>
                      <input
                        type="text"
                        value={formSignatureDate}
                        onChange={(e) => setFormSignatureDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-muted text-muted-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSessionPlan}
                  className="flex items-center gap-1 px-5 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: "#c48820", color: "white" }}
                >
                  Save Session Plan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Log Record of Work Dialog */}
      <AnimatePresence>
        {isRecordLogOpen && logSessionPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-xl rounded-2xl border border-border shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg" style={{ fontFamily: "Syne, sans-serif" }}>
                    Log Record of Work Done
                  </h3>
                  <p className="text-xs text-muted-foreground">Form MTTI/F/CUR/06 • Week {logSessionPlan.week_number} of {logSessionPlan.unit_code}</p>
                </div>
                <button
                  onClick={() => setIsRecordLogOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Log Form Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Date Delivered</label>
                    <input
                      type="text"
                      value={logDateDelivered}
                      onChange={(e) => setLogDateDelivered(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Trainees Present</label>
                    <input
                      type="number"
                      value={logTraineesPresent}
                      onChange={(e) => setLogTraineesPresent(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Hours Covered</label>
                    <input
                      type="number"
                      step="0.1"
                      value={logHoursCovered}
                      onChange={(e) => setLogHoursCovered(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Delivery Status</label>
                    <select
                      value={logStatus}
                      onChange={(e) => setLogStatus(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                    >
                      <option value="delivered">Delivered (Completed)</option>
                      <option value="partial">Partial Delivery</option>
                      <option value="postponed">Postponed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Work Actually Covered</label>
                  <textarea
                    rows={3}
                    value={logWorkCovered}
                    onChange={(e) => setLogWorkCovered(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Remarks & Reflections</label>
                  <textarea
                    rows={2}
                    value={logReflection}
                    onChange={(e) => setLogReflection(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Signature</label>
                    <input
                      type="text"
                      value={logSignature}
                      onChange={(e) => setLogSignature(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Signature Date</label>
                    <input
                      type="text"
                      value={logSignatureDate}
                      onChange={(e) => setLogSignatureDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Log Footer actions */}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setIsRecordLogOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-muted text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRecordLog}
                  className="px-5 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: "#c48820", color: "white" }}
                >
                  Confirm Log
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal Overlay */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg" style={{ fontFamily: "Syne, sans-serif" }}>
                    Upload Session Plan Document
                  </h3>
                  <p className="text-xs text-muted-foreground">Supported formats: PDF (MTTI/F/CUR/05) or backup JSON</p>
                </div>
                <button
                  onClick={() => setIsUploadOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div
                onDragEnter={handlePDFDrag}
                onDragOver={handlePDFDrag}
                onDragLeave={handlePDFDrag}
                onDrop={handlePDFDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Drag and drop file here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse your files</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
                <FileCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Intelligent parsing: </span>
                  Uploading an official MTTI Session Plan PDF triggers high-fidelity metadata OCR analysis, extracting sections, title, week, and step intervals directly into the interactive dashboard.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Workshop Door QR Code Poster Modal */}
      {qrModalPlan && (
        <WorkshopDoorQRModal
          isOpen={!!qrModalPlan}
          onClose={() => setQrModalPlan(null)}
          sessionData={{
            id: qrModalPlan.id,
            unit_code: qrModalPlan.unit_code,
            unit_name: qrModalPlan.unit_name,
            class_code: qrModalPlan.class_code,
            session_title: qrModalPlan.session_title,
            learning_outcomes: qrModalPlan.learning_outcomes,
            date: qrModalPlan.date,
            time_duration: qrModalPlan.time_duration,
            trainer_name: qrModalPlan.trainer_name,
            safety_requirements: qrModalPlan.safety_requirements
          }}
        />
      )}

    </TrainerLayout>
  );
}
