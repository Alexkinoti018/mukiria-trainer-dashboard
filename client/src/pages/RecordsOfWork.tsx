import { useState, useEffect, useMemo } from "react";
import TrainerLayout from "@/components/TrainerLayout";
import { 
  FileText, 
  Printer, 
  Download, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Users, 
  Calendar, 
  RefreshCw, 
  Sparkles, 
  Filter,
  Edit2,
  Trash2,
  Check,
  BookOpen,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getStoredRecordsOfWork, 
  saveStoredRecordsOfWork, 
  getStoredSessionPlans,
  type RecordOfWork,
  type SessionPlan 
} from "@/lib/mockSessionPlans";
import curriculumDatabaseRaw from "@/lib/curriculum_database.json";
import parsedTemplates from "@/lib/parsed_templates.json";

// Comprehensive Unit Name Lookup
export const getUnitNameByCode = (code: string): string => {
  if (!code) return "General Competency";
  
  // 1. From curriculum database
  const fromCurriculum = (curriculumDatabaseRaw as any[]).find(
    u => u.unit_code?.toLowerCase() === code.toLowerCase()
  );
  if (fromCurriculum?.unit_title) return fromCurriculum.unit_title;

  // 2. From parsed templates
  const fromTemplates = (parsedTemplates as any[]).find(
    t => t.unit_code?.toLowerCase() === code.toLowerCase()
  );
  if (fromTemplates?.unit_name) return fromTemplates.unit_name;

  // 3. Known TVET CDACC mappings
  const knownMap: Record<string, string> = {
    "HBS/OS/COS/BC/01/5/MA": "Apply Digital Literacy",
    "ICT/OS/CS/CR/11/6/A": "Perform Graphic Design",
    "IT/CU/ICTA/CR/01/5/MA": "Install Computer Software",
    "IT/CU/ICT/CR/3/6": "Management Information Systems",
    "BUS/OS/IS/CR/11/5/A": "Information Systems Principles",
    "ICT/OS/DL/CR/11/5/A": "Demonstrate Digital Literacy",
    "ICT/OS/ES/CR/11/6/A": "Perform System Maintenance",
    "0612 451 07A": "Perform Computer Networking",
    "061006T4ICT": "Perform Computer Networking",
    "ICT/OS/IT/CR/1/6": "Perform Computer Networking",
    "IT/CU/ICTA/CR/01/4/MA": "Computer Essentials",
    "IT/CU/ICTA/CR/02/4/MA": "Computer Operations",
    "IT/CU/ICTA/CR/03/4/MA": "Computer Network Setup",
    "IT/CU/ICTA/CR/04/4/MA": "Computer Repair and Maintenance",
    "IT/CU/ICTA/CC/01/5/MA": "Basic Electronics",
  };

  if (knownMap[code]) return knownMap[code];

  const stripped = code.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  for (const [k, v] of Object.entries(knownMap)) {
    if (k.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === stripped) return v;
  }

  return code;
};

export default function RecordsOfWork() {
  const { user } = useAuth();
  const [records, setRecords] = useState<RecordOfWork[]>([]);
  const [sessionPlans, setSessionPlans] = useState<SessionPlan[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecordOfWork | null>(null);
  const [isExportingBook, setIsExportingBook] = useState(false);

  // Form State for Manual / Edit
  const [formData, setFormData] = useState({
    unit_code: "HBS/OS/COS/BC/01/5/MA",
    class_code: "EE6/M/S/24",
    week_number: 1,
    date_delivered: new Date().toLocaleDateString("en-GB"),
    hours_covered: 2,
    trainees_present: 28,
    work_actually_covered: "",
    reflection: "",
    status: "delivered" as "delivered" | "partial" | "postponed",
    signature: user?.email ? user.email.split("@")[0].toUpperCase() : "A. KINOTI"
  });

  useEffect(() => {
    const loadedRecords = getStoredRecordsOfWork();
    const loadedPlans = getStoredSessionPlans();
    setRecords(loadedRecords);
    setSessionPlans(loadedPlans);
  }, []);

  // Sync delivered session plans into Record of Work
  const handleAutoSync = () => {
    const plans = getStoredSessionPlans();
    const existing = getStoredRecordsOfWork();
    let newEntriesCount = 0;

    const updated = [...existing];

    plans.forEach(plan => {
      // If plan is delivered or has reflections, sync it
      const alreadySynced = updated.some(r => r.session_plan_id === plan.id || (r.unit_code === plan.unit_code && r.week_number === plan.week_number));
      
      if (!alreadySynced && (plan.status === "delivered" || plan.delivery_steps?.length > 0)) {
        const newRecord: RecordOfWork = {
          id: `row-${Date.now()}-${plan.id}`,
          session_plan_id: plan.id,
          unit_code: plan.unit_code,
          class_code: plan.class_code,
          week_number: plan.week_number,
          date_delivered: plan.date || new Date().toLocaleDateString("en-GB"),
          trainees_present: plan.trainees_count ? plan.trainees_count - 2 : 28,
          hours_covered: 2,
          work_actually_covered: `Delivered ${plan.session_title}. Covered learning outcomes: ${plan.learning_outcomes.slice(0, 2).join("; ")}.`,
          reflection: plan.reflection || "Class demonstrated full understanding of practical demonstrations.",
          status: "delivered",
          signature: plan.signature || user?.email?.split("@")[0].toUpperCase() || "A. KINOTI",
          signature_date: plan.signature_date || new Date().toLocaleDateString("en-GB")
        };
        updated.push(newRecord);
        newEntriesCount++;
      }
    });

    // Sort by week number
    updated.sort((a, b) => a.week_number - b.week_number);
    setRecords(updated);
    saveStoredRecordsOfWork(updated);

    if (newEntriesCount > 0) {
      toast.success(`Synced ${newEntriesCount} Session Plan(s) to Record of Work!`);
    } else {
      toast.info("All delivered session plans are already up to date in your Record of Work.");
    }
  };

  const handleExportBook = async () => {
    if (records.length === 0) {
      toast.error("No Records of Work entries available to compile.");
      return;
    }

    setIsExportingBook(true);
    toast.info("Compiling official MTTI Record of Work Book (PDF)...");

    try {
      const recordsToExport = selectedUnit === "all" ? records : filteredRecords;
      const payload = {
        term: "Term 3, 2026",
        trainer_name: user?.email ? user.email.split("@")[0].toUpperCase() : "ALEXANDER KINOTI",
        department: "Department of Computing and Informatics",
        compiled_date: new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
        records: recordsToExport
      };

      const resp = await fetch("http://localhost:8000/api/merge-row-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();
      if (data.success && data.file_data) {
        const bytes = Uint8Array.from(atob(data.file_data), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || `MTTI_RoW_Book_${Date.now()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Official RoW Book downloaded (${recordsToExport.length} sessions compiled)!`);
      } else {
        throw new Error(data.error || "Compilation failed.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to export RoW Book: ${err.message}`);
    } finally {
      setIsExportingBook(false);
    }
  };

  const handleOpenNew = () => {
    setEditingRecord(null);
    setFormData({
      unit_code: selectedUnit !== "all" ? selectedUnit : "HBS/OS/COS/BC/01/5/MA",
      class_code: "EE6/M/S/24",
      week_number: records.length + 1,
      date_delivered: new Date().toLocaleDateString("en-GB"),
      hours_covered: 2,
      trainees_present: 28,
      work_actually_covered: "",
      reflection: "Learners actively engaged with the practical exercises.",
      status: "delivered",
      signature: user?.email ? user.email.split("@")[0].toUpperCase() : "A. KINOTI"
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: RecordOfWork) => {
    setEditingRecord(record);
    setFormData({
      unit_code: record.unit_code,
      class_code: record.class_code,
      week_number: record.week_number,
      date_delivered: record.date_delivered,
      hours_covered: record.hours_covered,
      trainees_present: record.trainees_present,
      work_actually_covered: record.work_actually_covered,
      reflection: record.reflection,
      status: record.status,
      signature: record.signature
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    saveStoredRecordsOfWork(updated);
    toast.success("Record of Work entry removed.");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.work_actually_covered.trim()) {
      toast.error("Please enter the work actually covered.");
      return;
    }

    let updated: RecordOfWork[];
    if (editingRecord) {
      updated = records.map(r => r.id === editingRecord.id ? {
        ...r,
        ...formData,
        signature_date: new Date().toLocaleDateString("en-GB")
      } : r);
      toast.success("Record of Work updated successfully.");
    } else {
      const newRec: RecordOfWork = {
        id: `row-${Date.now()}`,
        session_plan_id: `manual-${Date.now()}`,
        ...formData,
        signature_date: new Date().toLocaleDateString("en-GB")
      };
      updated = [...records, newRec].sort((a, b) => a.week_number - b.week_number);
      toast.success("New Record of Work entry added.");
    }

    setRecords(updated);
    saveStoredRecordsOfWork(updated);
    setIsModalOpen(false);
  };

  // Filtered records
  const filteredRecords = records.filter(r => {
    const matchesUnit = selectedUnit === "all" || r.unit_code === selectedUnit;
    const unitName = getUnitNameByCode(r.unit_code).toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      unitName.includes(query) ||
      r.unit_code.toLowerCase().includes(query) ||
      r.work_actually_covered.toLowerCase().includes(query) ||
      r.reflection.toLowerCase().includes(query) ||
      `week ${r.week_number}`.includes(query);
    return matchesUnit && matchesSearch;
  });

  // Available unique units
  const availableUnits = Array.from(new Set(records.map(r => r.unit_code)));

  // Statistics
  const totalHoursCovered = filteredRecords.reduce((acc, r) => acc + Number(r.hours_covered || 0), 0);
  const totalSessionsLogged = filteredRecords.length;
  const avgAttendance = totalSessionsLogged > 0
    ? Math.round(filteredRecords.reduce((acc, r) => acc + Number(r.trainees_present || 0), 0) / totalSessionsLogged)
    : 0;

  return (
    <TrainerLayout 
      title="Record of Work (RoW)" 
      subtitle="Official MTTI/F/CUR/02 log of delivered curriculum deliverables & instructional hours"
    >
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm print:hidden">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {/* Search by Unit Name or Keywords */}
            <div className="relative min-w-[220px] flex-1">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by unit name, code, topic, or reflection..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-background border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary shadow-inner"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter by Unit Name & Code */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary max-w-xs truncate cursor-pointer"
              >
                <option value="all">All Units ({records.length} records)</option>
                {availableUnits.map(unit => {
                  const name = getUnitNameByCode(unit);
                  return (
                    <option key={unit} value={unit}>
                      {name} ({unit})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAutoSync}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              title="Automatically pull completed session plans and attendance into this log"
            >
              <Sparkles className="w-4 h-4" />
              Sync from Session Plans
            </button>
            <button
              onClick={handleExportBook}
              disabled={isExportingBook}
              className="flex items-center gap-2 px-3 py-2 bg-[#000953] hover:bg-[#000953]/90 text-white rounded-lg text-xs font-bold transition shadow-sm border border-[#c48820]/50 disabled:opacity-50"
              title="Merge all Records of Work for this term into a single official MTTI/F/CUR/02 PDF Book"
            >
              <BookOpen className="w-4 h-4 text-[#c48820]" />
              {isExportingBook ? "Compiling..." : "Export RoW Book (PDF)"}
            </button>
            <button
              onClick={handleOpenNew}
              className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-bold transition border border-border"
            >
              <Printer className="w-4 h-4" />
              Print RoW
            </button>
          </div>
        </div>

        {/* Metric Cards (print:hidden) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Total Delivered Hours</p>
              <h3 className="text-xl font-bold">{totalHoursCovered} Hours</h3>
              <p className="text-[11px] text-muted-foreground">Across {totalSessionsLogged} scheduled sessions</p>
            </div>
          </div>

          <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Logged Sessions</p>
              <h3 className="text-xl font-bold">{totalSessionsLogged} Entries</h3>
              <p className="text-[11px] text-emerald-600 font-medium">Auto-cascaded from Session Plans</p>
            </div>
          </div>

          <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Average Attendance</p>
              <h3 className="text-xl font-bold">{avgAttendance} Trainees</h3>
              <p className="text-[11px] text-muted-foreground">Per classroom session</p>
            </div>
          </div>
        </div>

        {/* Official Printable Record of Work Document */}
        <div 
          className="bg-white text-black p-8 border-2 border-black rounded-lg shadow-lg mx-auto w-full print:border-none print:shadow-none print:p-0"
          style={{ fontFamily: 'Maiandra GD, sans-serif' }}
        >
          {/* Institution Header */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
            <div>
              <span className="text-xs font-bold text-gray-600">ISO 9001:2015 CERTIFIED</span>
              <h1 className="text-xl font-bold tracking-tight uppercase">MUKIRIA TECHNICAL TRAINING INSTITUTE</h1>
              <h2 className="text-sm font-semibold uppercase text-gray-800">DEPARTMENT OF COMPUTING AND INFORMATICS</h2>
              <h3 className="text-base font-bold underline mt-1">RECORD OF WORK (RoW)</h3>
            </div>
            <div className="text-right">
              <div className="border border-black px-3 py-1 font-mono text-xs font-bold bg-gray-50">
                MTTI/F/CUR/02
              </div>
              <p className="text-[11px] mt-1 text-gray-600">Term: <strong>Term 2, 2026</strong></p>
              <p className="text-[11px] text-gray-600">Trainer: <strong>{user?.email?.split('@')[0].toUpperCase() || "ALEXANDER KINOTI"}</strong></p>
            </div>
          </div>

          {/* Table Header Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs border border-black p-3 bg-gray-50 mb-4">
            <div>
              <span className="font-bold">Unit Code: </span>
              <span className="font-mono font-semibold">{selectedUnit !== "all" ? selectedUnit : "Various / Multi-Unit"}</span>
            </div>
            <div>
              <span className="font-bold">Course / Unit: </span>
              <span className="font-bold uppercase text-black">{selectedUnit !== "all" ? getUnitNameByCode(selectedUnit) : "All Curriculum Delivery Units"}</span>
            </div>
            <div>
              <span className="font-bold">Class: </span>
              <span>{filteredRecords[0]?.class_code || "EE6/M/S/24"}</span>
            </div>
            <div>
              <span className="font-bold">KNQF Level: </span>
              <span>Level 6</span>
            </div>
          </div>

          {/* Record of Work Main Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-black text-xs text-left">
              <thead>
                <tr className="bg-gray-200 border-b-2 border-black font-bold">
                  <th className="border border-black p-2 text-center w-12">Wk</th>
                  <th className="border border-black p-2 w-24">Date</th>
                  <th className="border border-black p-2">Work Actually Covered</th>
                  <th className="border border-black p-2 text-center w-14">Hrs</th>
                  <th className="border border-black p-2 text-center w-16">Present</th>
                  <th className="border border-black p-2 w-48">Lesson Reflection / Remarks</th>
                  <th className="border border-black p-2 text-center w-24">Sign & Date</th>
                  <th className="border border-black p-2 text-center w-16 print:hidden">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500 italic">
                      No Records of Work logged for this unit. Click <strong>"Sync from Session Plans"</strong> to auto-populate from your delivered sessions.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, idx) => (
                    <tr key={r.id || idx} className="border-b border-black hover:bg-gray-50 transition">
                      <td className="border border-black p-2 text-center font-bold font-mono">
                        {r.week_number}
                      </td>
                      <td className="border border-black p-2 font-mono whitespace-nowrap">
                        {r.date_delivered}
                      </td>
                      <td className="border border-black p-2">
                        <div className="font-medium text-black">{r.work_actually_covered}</div>
                        <div className="text-[10px] text-gray-600 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-black bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300">
                            {getUnitNameByCode(r.unit_code)}
                          </span>
                          <span className="font-mono text-gray-500">({r.unit_code})</span>
                          <span className="text-gray-400">•</span>
                          <span>Class: {r.class_code}</span>
                        </div>
                      </td>
                      <td className="border border-black p-2 text-center font-mono font-bold">
                        {r.hours_covered}
                      </td>
                      <td className="border border-black p-2 text-center font-mono">
                        {r.trainees_present}
                      </td>
                      <td className="border border-black p-2 italic text-gray-700">
                        {r.reflection || "Outcome met successfully."}
                      </td>
                      <td className="border border-black p-2 text-center font-mono text-[10px]">
                        <div className="font-bold underline">{r.signature}</div>
                        <div className="text-gray-500">{r.signature_date || r.date_delivered}</div>
                      </td>
                      <td className="border border-black p-2 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(r)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Signoff Section */}
          <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t-2 border-black text-xs">
            <div>
              <p className="font-bold">Trainer Sign-off:</p>
              <div className="mt-4 border-b border-black w-64 pb-1">
                Name: <strong>{user?.email?.split('@')[0].toUpperCase() || "ALEXANDER KINOTI"}</strong>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Date: {new Date().toLocaleDateString("en-GB")}</p>
            </div>
            <div>
              <p className="font-bold">Head of Department (HOD) Approval:</p>
              <div className="mt-4 border-b border-black w-64 pb-1">
                Signature: __________________________
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Date: ________________________</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit / New Entry Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl shadow-xl w-full max-w-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-base">
                  {editingRecord ? "Edit Record of Work Entry" : "Add Record of Work Entry"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Unit Code</label>
                    <input
                      type="text"
                      value={formData.unit_code}
                      onChange={(e) => setFormData({ ...formData, unit_code: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Class Code</label>
                    <input
                      type="text"
                      value={formData.class_code}
                      onChange={(e) => setFormData({ ...formData, class_code: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Week Number</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={formData.week_number}
                      onChange={(e) => setFormData({ ...formData, week_number: parseInt(e.target.value) || 1 })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Date Delivered</label>
                    <input
                      type="text"
                      value={formData.date_delivered}
                      onChange={(e) => setFormData({ ...formData, date_delivered: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      placeholder="DD/MM/YYYY"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Hours Covered</label>
                    <input
                      type="number"
                      step={0.5}
                      value={formData.hours_covered}
                      onChange={(e) => setFormData({ ...formData, hours_covered: parseFloat(e.target.value) || 2 })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Work Actually Covered (Topics & Practical Tasks)</label>
                  <textarea
                    rows={3}
                    value={formData.work_actually_covered}
                    onChange={(e) => setFormData({ ...formData, work_actually_covered: e.target.value })}
                    placeholder="e.g. Conducted lecture on CPU architectures. Supervised practical lab where trainees assembled hardware components."
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Trainees Present</label>
                    <input
                      type="number"
                      value={formData.trainees_present}
                      onChange={(e) => setFormData({ ...formData, trainees_present: parseInt(e.target.value) || 0 })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Delivery Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="delivered">Delivered Successfully</option>
                      <option value="partial">Partial Delivery</option>
                      <option value="postponed">Postponed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Lesson Reflection & Evaluation Remarks</label>
                  <textarea
                    rows={2}
                    value={formData.reflection}
                    onChange={(e) => setFormData({ ...formData, reflection: e.target.value })}
                    placeholder="e.g. All trainees successfully completed practical exercise. Remind them of next week's CAT."
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-border text-xs font-semibold rounded-lg hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90"
                  >
                    Save Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </TrainerLayout>
  );
}
