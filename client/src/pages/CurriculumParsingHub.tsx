import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, FileSearch, ArrowRight, BookOpen, Layers, Save } from "lucide-react";
import TrainerLayout from "../components/TrainerLayout";

type ParseState = "idle" | "parsing" | "success" | "review" | "error";

interface ExtractedData {
  unitCode: string;
  unitTitle: string;
  level: number;
  elements: {
    title: string;
    performanceCriteria: string[];
  }[];
}

const MOCK_DATA: ExtractedData = {
  unitCode: "041305T4OAD",
  unitTitle: "Demonstrate ICT Skills",
  level: 4,
  elements: [
    {
      title: "1. Identify computer hardware components",
      performanceCriteria: [
        "1.1 Hardware components are identified according to manufacturer specifications",
        "1.2 Hardware devices are connected as per standard operating procedures",
        "1.3 Computer peripherals are installed and tested for functionality",
      ],
    },
    {
      title: "2. Perform basic computer operations",
      performanceCriteria: [
        "2.1 Operating system is installed and configured",
        "2.2 System security software is installed and updated",
        "2.3 Data backup is performed according to organizational policy",
      ],
    },
    {
      title: "3. Apply word processing skills",
      performanceCriteria: [
        "3.1 Word processing application is launched and documents created",
        "3.2 Document formatting is applied according to organizational standards",
        "3.3 Documents are saved and printed accurately",
      ],
    },
  ],
};

export default function CurriculumParsingHub() {
  const [parseState, setParseState] = useState<ParseState>("idle");
  const [progressText, setProgressText] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  // Missing data form state
  const [trainerName, setTrainerName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [resources, setResources] = useState("");

  const handleApprove = () => {
    // Move to review state to fill missing data
    setParseState("review");
  };

  const handleFinalize = () => {
    toast.success("Learning Plan Auto-Filled Successfully!", {
      description: "All missing data has been applied and saved to your workspace."
    });
    setLocation("/trainer/workspace");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    e.preventDefault();
    // Simulate upload and NLP parsing process
    setParseState("parsing");
    
    setTimeout(() => setProgressText("Analyzing PDF layout..."), 0);
    setTimeout(() => setProgressText("Extracting text via OCR..."), 1500);
    setTimeout(() => setProgressText("Mapping CDACC Occupational Standards..."), 3000);
    setTimeout(() => setProgressText("Building Learning Outcomes Tree..."), 4500);
    
    setTimeout(() => {
      setParseState("success");
      setExtractedData(MOCK_DATA);
    }, 6000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <TrainerLayout title="Curriculum Parsing Hub" subtitle="Upload CDACC Occupational Standards to autonomously generate your Learning Plans.">
    <div className="h-full flex flex-col bg-[#F8FAFC]">
      {/* Header (Removed since TrainerLayout provides one, but I'll keep it for aesthetic if needed, wait, TrainerLayout has its own Header) */}
      {/* I will remove the internal header to avoid duplication since TrainerLayout provides title/subtitle */}
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          
          <AnimatePresence mode="wait">
            {/* STATE 1: IDLE / UPLOAD */}
            {parseState === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-12"
              >
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-2xl bg-white p-16 text-center hover:bg-slate-50 transition-colors cursor-pointer"
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
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-800 mb-2">Drag & Drop Curriculum Document</h3>
                  <p className="text-slate-500 max-w-md mx-auto mb-8">
                    Upload an official CDACC Occupational Standards PDF or Word document. Our NLP engine will extract all Learning Outcomes and Performance Criteria automatically.
                  </p>
                  <button className="px-6 py-3 bg-[#000953] text-white font-medium rounded-lg hover:bg-[#000953]/90 transition-colors shadow-sm">
                    Browse Files
                  </button>
                </div>
              </motion.div>
            )}

            {/* STATE 2: PARSING */}
            {parseState === "parsing" && (
              <motion.div
                key="parsing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-20 flex flex-col items-center justify-center"
              >
                <div className="relative w-32 h-32 mb-8">
                  {/* Outer spinning ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-[#c48820] border-t-transparent animate-spin"></div>
                  {/* Inner pulse */}
                  <div className="absolute inset-4 bg-[#000953]/5 rounded-full flex items-center justify-center animate-pulse">
                    <FileSearch className="w-8 h-8 text-[#000953]" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-semibold text-slate-800 mb-3">AI Engine Processing</h3>
                <p className="text-[#c48820] font-medium text-lg animate-pulse">{progressText}</p>
                <p className="text-slate-400 text-sm mt-4">Please wait while we extract the curriculum data...</p>
              </motion.div>
            )}

            {/* STATE 3: SUCCESS (Extracted Data) */}
            {parseState === "success" && extractedData && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Result Header */}
                <div className="px-8 py-6 bg-[#000953] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-[#c48820] text-sm font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4" />
                        Extraction Complete
                      </div>
                      <h2 className="text-2xl font-semibold">{extractedData.unitTitle}</h2>
                      <p className="text-white/70 mt-1">Unit Code: {extractedData.unitCode} • Level {extractedData.level}</p>
                    </div>
                    <button 
                      onClick={() => setParseState("idle")}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/20"
                    >
                      Upload Another
                    </button>
                  </div>
                </div>

                {/* Extracted Elements Tree */}
                <div className="p-8">
                  <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-slate-400" />
                    Structured Learning Plan Tree
                  </h3>
                  
                  <div className="space-y-4">
                    {extractedData.elements.map((element, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#000953]/10 text-[#000953] flex items-center justify-center font-bold text-sm shrink-0">
                            {idx + 1}
                          </div>
                          <h4 className="font-semibold text-slate-800">{element.title}</h4>
                        </div>
                        <div className="px-6 py-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Performance Criteria</p>
                          <ul className="space-y-2">
                            {element.performanceCriteria.map((pc, pcIdx) => (
                              <li key={pcIdx} className="flex gap-3 text-sm text-slate-600">
                                <span className="text-[#c48820] shrink-0 mt-0.5">•</span>
                                <span>{pc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={handleApprove}
                      className="flex items-center gap-2 px-6 py-3 bg-[#000953] text-white font-medium rounded-lg hover:bg-[#000953]/90 transition-colors shadow-sm"
                    >
                      <BookOpen className="w-5 h-5" />
                      Approve & Auto-Fill Learning Plan
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STATE 4: REVIEW & FILL MISSING DATA */}
            {parseState === "review" && extractedData && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="px-8 py-6 bg-[#000953] text-white">
                  <h2 className="text-2xl font-semibold">Finalize Learning Plan</h2>
                  <p className="text-white/70 mt-1">Please provide the missing contextual data to complete the Learning Plan generation for {extractedData.unitTitle}.</p>
                </div>

                <div className="p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Trainer Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg border border-slate-300 focus:outline-none focus:border-[#000953] focus:ring-1 focus:ring-[#000953] transition-colors"
                      placeholder="e.g., John Doe"
                      value={trainerName}
                      onChange={(e) => setTrainerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Class Code</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg border border-slate-300 focus:outline-none focus:border-[#000953] focus:ring-1 focus:ring-[#000953] transition-colors"
                      placeholder="e.g., ICT/L6/2026"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Standard Resources Required</label>
                    <textarea 
                      className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg border border-slate-300 focus:outline-none focus:border-[#000953] focus:ring-1 focus:ring-[#000953] transition-colors min-h-[100px]"
                      placeholder="e.g., Projector, Lab Computers, Whiteboard..."
                      value={resources}
                      onChange={(e) => setResources(e.target.value)}
                    />
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                    <button 
                      onClick={() => setParseState("success")}
                      className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Back to Tree
                    </button>
                    <button 
                      onClick={handleFinalize}
                      className="flex items-center gap-2 px-8 py-3 bg-[#c48820] text-white font-semibold rounded-lg hover:bg-[#c48820]/90 transition-colors shadow-sm"
                    >
                      <Save className="w-5 h-5" />
                      Save & Complete
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
    </TrainerLayout>
  );
}
