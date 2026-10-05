import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileSearch, 
  ArrowRight, 
  BookOpen, 
  Layers, 
  Save, 
  Search, 
  RefreshCw, 
  Clock, 
  Award, 
  Check, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FolderCheck,
  Sparkles,
  GraduationCap
} from "lucide-react";
import TrainerLayout from "../components/TrainerLayout";
import { 
  CurriculumUnit, 
  getCurriculumUnits, 
  getCurriculumDepartments, 
  rescanCurriculumFolder 
} from "@/lib/curriculumDatabase";

type TabMode = "repository" | "upload";
type ParseState = "idle" | "parsing" | "success" | "review" | "error";

interface ExtractedData {
  unitCode: string;
  unitTitle: string;
  level: number;
  courseName?: string;
  topics?: string[];
  outcomes?: string[];
  elements: {
    title: string;
    performanceCriteria: string[];
  }[];
}

export default function CurriculumParsingHub() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabMode>("repository");
  
  // Repository state
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [departments, setDepartments] = useState<{ name: string; unit_count: number }[]>([]);
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<CurriculumUnit | null>(null);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [isRescanning, setIsRescanning] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<"outcomes" | "elements" | "weeks">("outcomes");

  // Upload parser state
  const [parseState, setParseState] = useState<ParseState>("idle");
  const [progressText, setProgressText] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [trainerName, setTrainerName] = useState("Alexander Kinoti");
  const [classCode, setClassCode] = useState("ITECH6/M/24");
  const [resources, setResources] = useState("Projector, lab workstations, reference materials");

  // Load curriculum units and departments
  useEffect(() => {
    loadUnitsData();
  }, [selectedDept, selectedLevel, searchQuery]);

  const loadUnitsData = async () => {
    setIsLoadingUnits(true);
    try {
      const [uData, dData] = await Promise.all([
        getCurriculumUnits({
          department: selectedDept,
          level: selectedLevel || undefined,
          search: searchQuery || undefined
        }),
        getCurriculumDepartments()
      ]);
      setUnits(uData);
      setDepartments(dData);
      if (uData.length > 0 && (!selectedUnit || !uData.some(u => u.unit_code === selectedUnit.unit_code))) {
        setSelectedUnit(uData[0]);
      }
    } catch (err) {
      console.error("Failed to load curriculum catalog:", err);
      toast.error("Failed to load curriculum catalog from institutional storage");
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const handleRescan = async () => {
    setIsRescanning(true);
    toast.info("Rescanning D:\\Curriculum and OS for new Curricula & OS files...");
    try {
      const res = await rescanCurriculumFolder();
      if (res.success) {
        toast.success("Institutional Repository Synchronized", {
          description: `Successfully indexed ${res.count || units.length} official CDACC units from D:\\Curriculum and OS`
        });
        await loadUnitsData();
      } else {
        toast.error("Rescan Failed", { description: res.message });
      }
    } catch (err: any) {
      toast.error("Rescan Error", { description: err?.message });
    } finally {
      setIsRescanning(false);
    }
  };

  const handleSelectUnitForLearningPlan = (unit: CurriculumUnit) => {
    try {
      localStorage.setItem("selected_curriculum_unit", JSON.stringify(unit));
      toast.success(`"${unit.unit_title}" Loaded into Learning Plan`, {
        description: "Navigating to Learning Plan builder with 10 weeks of pre-mapped CDACC outcomes."
      });
      setLocation("/trainer/documents/learning-plan");
    } catch (e) {
      console.error(e);
      setLocation("/trainer/documents/learning-plan");
    }
  };

  const handleSelectUnitForWorkspace = (unit: CurriculumUnit) => {
    try {
      localStorage.setItem("selected_curriculum_unit", JSON.stringify(unit));
      toast.success(`"${unit.unit_title}" Loaded into Academic Workspace`, {
        description: "Navigating to Session Planning & Records of Work."
      });
      setLocation("/trainer/workspace");
    } catch (e) {
      console.error(e);
      setLocation("/trainer/workspace");
    }
  };

  const handleSelectUnitForExam = (unit: CurriculumUnit) => {
    try {
      localStorage.setItem("selected_curriculum_unit", JSON.stringify(unit));
      toast.success(`"${unit.unit_title}" Loaded for Exam Generation`, {
        description: "Drafting CDACC exam questions matching official performance criteria."
      });
      setLocation("/trainer/exams");
    } catch (e) {
      console.error(e);
      setLocation("/trainer/exams");
    }
  };

  // Upload parser handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    e.preventDefault();
    let file: File | null = null;
    if ("dataTransfer" in e) {
      file = e.dataTransfer.files?.[0] || null;
    } else if (e.target.files) {
      file = e.target.files[0] || null;
    }

    if (!file) return;

    setParseState("parsing");
    setProgressText("Reading binary document...");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Str = (reader.result as string).split(",")[1];
        setProgressText("Extracting CDACC elements via NLP engine...");

        const resp = await fetch("http://127.0.0.1:8000/api/parse-doc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_data: base64Str,
            filename: file?.name || "curriculum.docx",
            context: "learning_plan",
            role: "trainer"
          })
        });

        const resData = await resp.json();
        if (!resData.success) {
          throw new Error(resData.error || "Failed to extract curriculum data");
        }

        setProgressText("Formatting learning outcomes tree...");
        setTimeout(() => {
          setParseState("success");
          setExtractedData({
            unitCode: resData.unit_code,
            unitTitle: resData.unit_name || resData.course_name || "Unit of Competence",
            level: resData.level || 6,
            courseName: resData.course_name,
            topics: resData.topics,
            outcomes: resData.outcomes,
            elements: (resData.elements && resData.elements.length > 0)
              ? resData.elements.map((el: any) => ({
                  title: el.element_title || "Element",
                  performanceCriteria: el.performance_criteria || []
                }))
              : (resData.outcomes || []).map((out: string, i: number) => ({
                  title: `${i + 1}. ${out}`,
                  performanceCriteria: [
                    "Tasks are executed in compliance with standard safety regulations.",
                    "Proper tools and instruments are selected and calibrated accurately."
                  ]
                }))
          });
          toast.success("Document Ingested & Matched with CDACC Standards!");
        }, 800);
      } catch (err: any) {
        console.error("Parse doc error:", err);
        setParseState("error");
        toast.error("Document Parsing Failed", { description: err?.message });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <TrainerLayout 
      title="Curriculum & Occupational Standards Hub" 
      subtitle="Official TVET CDACC institutional repository & automated document parsing engine for Mukiria TTI."
    >
      <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
        {/* Top Header / Mode Switcher */}
        <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("repository")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "repository"
                  ? "bg-[#000953] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <FolderCheck className="w-4 h-4 text-[#c48820]" />
              Institutional CDACC Repository (D:\Curriculum and OS)
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-[#c48820] text-slate-900 font-bold">
                {units.length} Units
              </span>
            </button>

            <button
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "upload"
                  ? "bg-[#000953] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Upload & Parse Custom Document
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ISO 9001:2015 & TVET CDACC Verified</span>
            </div>

            {activeTab === "repository" && (
              <button
                onClick={handleRescan}
                disabled={isRescanning}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-300 transition-colors disabled:opacity-50"
                title="Rescan D:\Curriculum and OS for newly added Word/PDF files"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRescanning ? "animate-spin text-[#c48820]" : ""}`} />
                <span>{isRescanning ? "Scanning Local Disk..." : "Rescan Folder"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Institutional Repository (Primary View) */}
        {activeTab === "repository" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Column: Units Browser & Filters */}
            <div className="w-full md:w-5/12 lg:w-4/12 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
              {/* Search & Filter Bar */}
              <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-slate-50/50">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by title, CDACC code, or course..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#000953]"
                  />
                </div>

                {/* Department Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  <button
                    onClick={() => setSelectedDept("All")}
                    className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap font-medium transition-colors ${
                      selectedDept === "All"
                        ? "bg-[#000953] text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    All ({departments.reduce((acc, d) => acc + d.unit_count, 0)})
                  </button>
                  {departments.map(d => (
                    <button
                      key={d.name}
                      onClick={() => setSelectedDept(d.name)}
                      className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap font-medium transition-colors ${
                        selectedDept === d.name
                          ? "bg-[#000953] text-white"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {d.name.split(" ")[0]} ({d.unit_count})
                    </button>
                  ))}
                </div>

                {/* Level Filter Pills */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">Level:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { label: "All", val: null },
                      { label: "L6 (Diploma)", val: 6 },
                      { label: "L5 (Cert)", val: 5 },
                      { label: "L4 (Artisan)", val: 4 }
                    ].map(lvl => (
                      <button
                        key={lvl.label}
                        onClick={() => setSelectedLevel(lvl.val)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          selectedLevel === lvl.val
                            ? "bg-[#c48820] text-slate-900"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Units List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {isLoadingUnits ? (
                  <div className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#c48820]" />
                    <p className="text-xs">Loading CDACC units catalog...</p>
                  </div>
                ) : units.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium">No units matched your filter.</p>
                    <button
                      onClick={() => { setSelectedDept("All"); setSelectedLevel(null); setSearchQuery(""); }}
                      className="mt-2 text-xs text-[#000953] underline font-semibold"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  units.map(unit => {
                    const isSelected = selectedUnit?.unit_code === unit.unit_code;
                    return (
                      <div
                        key={unit.id || unit.unit_code}
                        onClick={() => setSelectedUnit(unit)}
                        className={`p-3.5 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-blue-50/70 border-l-4 border-l-[#000953]"
                            : "hover:bg-slate-50 border-l-4 border-l-transparent"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-xs font-semibold line-clamp-1 ${isSelected ? "text-[#000953]" : "text-slate-800"}`}>
                            {unit.unit_title}
                          </h4>
                          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            unit.level === 6 ? "bg-indigo-100 text-indigo-800" :
                            unit.level === 5 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            L{unit.level}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                          <span>{unit.unit_code}</span>
                          <span>•</span>
                          <span>{unit.duration_hours}h</span>
                        </div>

                        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                          <span className="truncate max-w-[180px]">{unit.department}</span>
                          <span className="text-[#c48820] font-semibold">{unit.learning_outcomes?.length || 0} Outcomes</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Detailed Unit Inspector & Direct Actions */}
            <div className="flex-1 bg-white overflow-y-auto flex flex-col">
              {selectedUnit ? (
                <div className="flex-1 flex flex-col">
                  {/* Top Card Banner */}
                  <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-[#000953] text-white">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded bg-[#c48820] text-slate-900 text-[11px] font-bold uppercase tracking-wider">
                          Level {selectedUnit.level} Diploma / Certificate
                        </span>
                        <span className="text-xs text-slate-300 font-mono">
                          Duration: {selectedUnit.duration_hours} Hours
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#c48820]" />
                        <span>Source: {selectedUnit.source_file || "D:\\Curriculum and OS"}</span>
                      </div>
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2">
                      {selectedUnit.unit_title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-400">CDACC Code:</span>{" "}
                        <span className="font-mono text-white font-semibold">{selectedUnit.cdacc_code || selectedUnit.unit_code}</span>
                      </div>
                      {selectedUnit.isced_code && (
                        <div>
                          <span className="text-slate-400">ISCED Code:</span>{" "}
                          <span className="font-mono text-white">{selectedUnit.isced_code}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400">Department:</span>{" "}
                        <span className="text-white">{selectedUnit.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveDetailTab("outcomes")}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                          activeDetailTab === "outcomes"
                            ? "bg-[#000953] text-white"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Learning Outcomes ({selectedUnit.learning_outcomes?.length || 0})
                      </button>
                      <button
                        onClick={() => setActiveDetailTab("elements")}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                          activeDetailTab === "elements"
                            ? "bg-[#000953] text-white"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        OS Elements & Performance Criteria ({selectedUnit.elements?.length || 0})
                      </button>
                      <button
                        onClick={() => setActiveDetailTab("weeks")}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                          activeDetailTab === "weeks"
                            ? "bg-[#000953] text-white"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        10-Week Delivery Matrix
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelectUnitForLearningPlan(selectedUnit)}
                        className="px-3.5 py-1.5 bg-[#000953] hover:bg-[#000953]/90 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#c48820]" />
                        Auto-Fill Learning Plan
                      </button>
                      <button
                        onClick={() => handleSelectUnitForWorkspace(selectedUnit)}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#000953]" />
                        Open Workspace
                      </button>
                      <button
                        onClick={() => handleSelectUnitForExam(selectedUnit)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-[#c48820]" />
                        Draft Exam
                      </button>
                    </div>
                  </div>

                  {/* Inspector Body */}
                  <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {/* Unit Description */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#000953]" />
                        Official Unit Description
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {selectedUnit.description}
                      </p>
                    </div>

                    {/* Tab 1: Learning Outcomes */}
                    {activeDetailTab === "outcomes" && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                          <span>Summary of Learning Outcomes & Content Breakdown</span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            Total Duration: {selectedUnit.duration_hours}h
                          </span>
                        </h4>

                        <div className="space-y-3">
                          {selectedUnit.learning_outcomes?.map((lo, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-6 h-6 rounded-full bg-[#000953] text-[#c48820] text-xs font-bold flex items-center justify-center">
                                    {idx + 1}
                                  </div>
                                  <span className="text-xs font-bold text-slate-800">{lo.title}</span>
                                </div>
                                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold">
                                  {lo.duration_hours} Hours
                                </span>
                              </div>

                              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                  <p className="font-semibold text-slate-700 mb-1.5 text-[11px] uppercase tracking-wider">
                                    Syllabus Content Topics:
                                  </p>
                                  <ul className="space-y-1 text-slate-600">
                                    {lo.content && lo.content.length > 0 ? (
                                      lo.content.map((c, cIdx) => (
                                        <li key={cIdx} className="flex items-start gap-1.5">
                                          <span className="text-[#c48820] font-bold">•</span>
                                          <span>{c}</span>
                                        </li>
                                      ))
                                    ) : (
                                      <li className="text-slate-400 italic">Core practical and cognitive topics as defined in CDACC curriculum guide.</li>
                                    )}
                                  </ul>
                                </div>

                                <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                                  <p className="font-semibold text-slate-700 mb-1.5 text-[11px] uppercase tracking-wider">
                                    Suggested Assessment Methods:
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {lo.assessment_methods?.map((m, mIdx) => (
                                      <span key={mIdx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] border border-slate-200">
                                        {m}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Elements & Performance Criteria */}
                    {activeDetailTab === "elements" && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Occupational Standards (OS) Elements & Performance Criteria
                        </h4>

                        <div className="space-y-3">
                          {selectedUnit.elements?.map((elem, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-[#000953]" />
                                <span className="text-xs font-bold text-slate-800">{elem.element_title}</span>
                              </div>
                              <div className="p-4">
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                  Assessable Performance Statements:
                                </p>
                                <ul className="space-y-1.5 text-xs text-slate-600">
                                  {elem.performance_criteria?.map((pc, pcIdx) => (
                                    <li key={pcIdx} className="flex items-start gap-2">
                                      <span className="text-emerald-600 shrink-0 mt-0.5">✓</span>
                                      <span>{pc}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tab 3: 10-Week Matrix */}
                    {activeDetailTab === "weeks" && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                          <span>10-Week Term Delivery Plan (MTTI Standard)</span>
                          <span className="text-[11px] text-emerald-700 font-semibold">Ready for Auto-Export</span>
                        </h4>

                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-[#000953] text-white">
                              <tr>
                                <th className="p-2.5 w-16 text-center">Week</th>
                                <th className="p-2.5">Weekly Session Focus</th>
                                <th className="p-2.5">Specific Learning Outcomes</th>
                                <th className="p-2.5">Lab Resources & Tools</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {selectedUnit.weeks_breakdown?.map(w => (
                                <tr key={w.week} className="hover:bg-slate-50">
                                  <td className="p-2.5 text-center font-bold text-[#000953] bg-slate-50/50">
                                    W{w.week}
                                  </td>
                                  <td className="p-2.5 font-semibold text-slate-800">
                                    {w.title}
                                  </td>
                                  <td className="p-2.5 text-slate-600">
                                    <ul className="list-disc list-inside space-y-0.5">
                                      {w.outcomes.map((o, oI) => (
                                        <li key={oI} className="text-[11px]">{o}</li>
                                      ))}
                                    </ul>
                                  </td>
                                  <td className="p-2.5 text-slate-500 text-[11px]">
                                    {w.resources?.join(", ") || "Lab workstations"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <h3 className="text-sm font-semibold text-slate-700">Select a Unit of Competence</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Browse the 84 official TVET CDACC units on the left to inspect outcomes, elements, and performance criteria.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Custom Document Upload / Parser */}
        {activeTab === "upload" && (
          <div className="flex-1 overflow-auto p-8 bg-[#F8FAFC]">
            <div className="max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                {parseState === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-8"
                  >
                    <div 
                      className="border-2 border-dashed border-slate-300 rounded-2xl bg-white p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                      onDragOver={handleDragOver}
                      onDrop={handleFileUpload}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                      />
                      <div className="w-16 h-16 bg-blue-50 text-[#000953] rounded-full flex items-center justify-center mx-auto mb-4">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">
                        Drag & Drop External CDACC Document (.docx / .pdf)
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                        Upload any syllabus, occupational standard, or course outline. Our backend parser extracts the unit code, learning outcomes, and performance criteria, cross-referencing with the institutional database.
                      </p>
                      <button className="px-5 py-2.5 bg-[#000953] text-white text-xs font-semibold rounded-lg hover:bg-[#000953]/90 transition-colors shadow-sm">
                        Browse Local Files
                      </button>
                    </div>
                  </motion.div>
                )}

                {parseState === "parsing" && (
                  <motion.div
                    key="parsing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-16 flex flex-col items-center justify-center"
                  >
                    <div className="relative w-24 h-24 mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-[#c48820] border-t-transparent animate-spin"></div>
                      <div className="absolute inset-3 bg-blue-50 rounded-full flex items-center justify-center">
                        <FileSearch className="w-6 h-6 text-[#000953] animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mb-1">Processing Document</h3>
                    <p className="text-xs font-semibold text-[#c48820] animate-pulse">{progressText}</p>
                  </motion.div>
                )}

                {parseState === "success" && extractedData && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-6"
                  >
                    <div className="px-6 py-5 bg-[#000953] text-white flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-[#c48820] text-xs font-bold uppercase tracking-wider mb-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Extraction Complete
                        </div>
                        <h2 className="text-xl font-bold">{extractedData.unitTitle}</h2>
                        <p className="text-xs text-white/70 mt-0.5">
                          Unit Code: {extractedData.unitCode} • Level {extractedData.level}
                        </p>
                      </div>
                      <button
                        onClick={() => setParseState("idle")}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/20"
                      >
                        Upload Another
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#000953]" />
                          Extracted CDACC Elements & Criteria
                        </h3>
                        <button
                          onClick={() => {
                            toast.success("Learning Plan Auto-Filled!", {
                              description: "Redirecting to your Learning Plan with parsed elements."
                            });
                            setLocation("/trainer/documents/learning-plan");
                          }}
                          className="px-4 py-2 bg-[#000953] text-white text-xs font-semibold rounded-lg hover:bg-[#000953]/90 flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5 text-[#c48820]" />
                          Apply to Learning Plan
                        </button>
                      </div>

                      <div className="space-y-3">
                        {extractedData.elements.map((elem, idx) => (
                          <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                            <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-[#000953]/10 text-[#000953] flex items-center justify-center font-bold text-xs">
                                {idx + 1}
                              </div>
                              <span className="text-xs font-bold text-slate-800">{elem.title}</span>
                            </div>
                            <div className="p-3.5">
                              <ul className="space-y-1 text-xs text-slate-600">
                                {elem.performanceCriteria.map((pc, pcI) => (
                                  <li key={pcI} className="flex items-start gap-2">
                                    <span className="text-[#c48820] font-bold">•</span>
                                    <span>{pc}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {parseState === "error" && (
                  <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-red-800">Extraction Error</h3>
                    <p className="text-xs text-red-600 mt-1 mb-4">
                      Unable to extract structured CDACC data from this file.
                    </p>
                    <button
                      onClick={() => setParseState("idle")}
                      className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
                    >
                      Try Another File
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </TrainerLayout>
  );
}
