import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Save, Printer, Download, Filter, CheckCircle2, Lock, Unlock, Users, PenTool } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";
import { useTrainees } from "@/contexts/TraineeContext";
import ObservationChecklistMarkingModal from "./ObservationChecklistMarkingModal";

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
  const [level, setLevel] = useState<number>(6);
  const [courseCode, setCourseCode] = useState("041305T4OAD");
  const [courseTitle, setCourseTitle] = useState("Diploma in Information Communication Technology");
  const [unitCode, setUnitCode] = useState("IT/CU/ICTA/CR/01/6/MA");
  const [unitTitle, setUnitTitle] = useState("Demonstrate ICT Skills");
  const [termDates, setTermDates] = useState("MAY 2026 To AUG 2026");
  const [poeDate, setPoeDate] = useState("14/08/2026");
  
  // Class selection for targeted marksheet
  const [selectedClass, setSelectedClass] = useState<string>("ITECH 6 MODULAR/S/2026");
  const [unitOfferingId, setUnitOfferingId] = useState("uo_1");
  const [isLocked, setIsLocked] = useState(false); // Internal Assessor Sign-off
  
  const [ctCount, setCtCount] = useState(3);
  const [cpCount, setCpCount] = useState(3);

  const [rows, setRows] = useState<AssessmentRow[]>([]);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [selectedCandidateForPractical, setSelectedCandidateForPractical] = useState<AssessmentRow | null>(null);

  const { trainees } = useTrainees();

  // Distinct classes available from trainees roster
  const availableClasses = useMemo(() => {
    return Array.from(new Set(trainees.map(t => t.classCode).filter(Boolean)));
  }, [trainees]);

  // Auto-populate based on selected class and context Trainees
  useEffect(() => {
    const classTrainees = selectedClass === "all" 
      ? trainees 
      : trainees.filter(t => t.classCode === selectedClass);

    setRows((currentRows) => {
      return classTrainees.map((t, idx) => {
        const existingRow = currentRows.find(r => r.id === t.id);
        const cleanAdm = t.admNo?.replace(/^(ITECH\s*6\s*MOD|ICT4\s*MOD)\//i, "") || t.admNo;
        
        return existingRow ? { ...existingRow, sn: idx + 1 } : {
          id: t.id,
          sn: idx + 1,
          regCode: t.regCode,
          admNo: cleanAdm,
          name: t.name,
          ctScores: Array(ctCount).fill(""),
          cpScores: Array(cpCount).fill(""),
          ctAvg: 0,
          cpAvg: 0,
          weightedMark: 0,
        };
      });
    });

    // Update level and unit metadata if class is known
    if (selectedClass.includes("FBS")) {
      setLevel(5);
      setCourseTitle("Diploma in Food & Beverage Sales and Service Management");
      setCourseCode("FBS-MOD-5");
      setUnitCode("HBS/OS/COS/BC/01/5/MA");
      setUnitTitle("Apply Digital Literacy");
    } else if (selectedClass.includes("Admin")) {
      setLevel(6);
      setCourseTitle("Diploma in Secretarial & Administration");
      setCourseCode("Admin-MOD-6");
      setUnitCode("ADM/OS/SEC/BC/01/6/MA");
      setUnitTitle("Apply ICT Skills");
    } else if (selectedClass.includes("4")) {
      setLevel(4);
      setCourseTitle("Certificate in Information Communication Technology");
      setCourseCode("041304T4ICT");
      setUnitCode("IT/CU/ICT/CC/01/4/MA");
      setUnitTitle("Perform Computer Essentials");
    } else if (selectedClass.includes("5")) {
      setLevel(5);
    } else if (selectedClass.includes("6")) {
      setLevel(6);
      setCourseTitle("Diploma in Information Communication Technology");
      setCourseCode("041305T4OAD");
      setUnitCode("IT/CU/ICTA/CR/01/6/MA");
      setUnitTitle("Perform Computer Essentials");
    }
  }, [selectedClass, trainees, ctCount, cpCount]);

  // Round averages to whole number (no decimals)
  const calculateAverages = (scores: any[]): number => {
    const validScores = scores
      .map((s) => parseFloat(s))
      .filter((s) => !isNaN(s));
    if (validScores.length === 0) return 0;
    const sum = validScores.reduce((a, b) => a + b, 0);
    return Math.round(sum / validScores.length);
  };

  // Round weighted marks to whole number according to CDACC level ratios
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
          newRow.ctAvg = calculateAverages(newRow.ctScores);
        } else {
          newRow.cpScores = [...row.cpScores];
          newRow.cpScores[index] = value;
          newRow.cpAvg = calculateAverages(newRow.cpScores);
        }
        
        newRow.weightedMark = calculateWeighted(newRow.ctAvg, newRow.cpAvg, level);
        return newRow;
      })
    );
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
        name: "New Candidate Name",
        ctScores: Array(ctCount).fill(""),
        cpScores: Array(cpCount).fill(""),
        ctAvg: 0,
        cpAvg: 0,
        weightedMark: 0,
      },
    ]);
    toast.success("Candidate row added. Click cell to edit details.");
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
      const payload = rows.map(r => ({
           unit_offering_id: unitOfferingId,
           trainee_id: r.id,
           ct_scores: r.ctScores.map(score => parseFloat(score as any)).filter(score => !isNaN(score)),
           computed_average_theory: Math.round(r.ctAvg),
           cp_scores: r.cpScores.map(score => parseFloat(score as any)).filter(score => !isNaN(score)),
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
      
      if (!savedToSupabase) {
        localStorage.setItem(`mtti_marks_${unitOfferingId}`, JSON.stringify(payload));
        toast.success("Assessment marks saved successfully (Whole-number scores stored).");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to submit data: ${err.message || "Unknown error"}`);
    }
  };

  return (
    <div className="container py-6 max-w-[1440px] space-y-4">
      {/* Top Controls Toolbar (Print:hidden) */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-muted-foreground uppercase">Class Roster:</span>
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
            Showing {rows.length} candidates
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={addRow}
            disabled={isLocked}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
            title="Add a new candidate row to the marks sheet"
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
            title="Open TVET CDACC Practical Observation Checklist (Laboratory / Workshop Assessor Tool)"
          >
            <PenTool className="w-4 h-4 text-red-600" />
            Practical Observation Tool
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-black text-white hover:bg-black/80 rounded-lg text-xs font-bold transition shadow-sm"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4" />
            Print Marks Sheet
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
            {isLocked ? "Locked (Assessor Signed)" : "Sign-off & Lock"}
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

      {/* Official Printable Sheet Container */}
      <div className="p-8 bg-white text-black shadow-md rounded-xl border border-gray-300 print:shadow-none print:border-none print:p-0">
        
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center mb-6 text-center space-y-1.5">
          <img 
            src="/mukiria-logo.png" 
            alt="Mukiria Logo" 
            className="w-24 h-24 object-contain mb-1 fallback-logo" 
            onError={(e) => e.currentTarget.style.display = 'none'} 
          />
          <h1 className="text-2xl font-bold uppercase tracking-wide text-black" style={{ fontFamily: 'Maiandra GD, sans-serif' }}>
            MUKIRIA TECHNICAL TRAINING INSTITUTE
          </h1>
          <h2 className="text-base font-bold uppercase tracking-wider text-black" style={{ fontFamily: 'Maiandra GD, sans-serif' }}>
            CONTINUOUS ASSESSMENT MARKS SHEETS PER UNIT OF COMPETENCY
          </h2>
        </div>

        {/* Form Metadata Grid */}
        <div className="grid grid-cols-[auto_1fr_auto] gap-x-8 gap-y-4 mb-6 text-[13px] text-black" style={{ fontFamily: 'Maiandra GD, sans-serif' }}>
          {/* Row 1 */}
          <div className="flex gap-2 items-center whitespace-nowrap">
            <span className="font-semibold">Assessment Center Code:</span>
            <span className="font-bold">10200004</span>
          </div>
          <div className="flex gap-2 items-center whitespace-nowrap col-span-2">
            <span className="font-semibold">Assessment Center Name:</span>
            <span className="uppercase font-bold tracking-wide">MUKIRIA TECHNICAL TRAINING INSTITUTE</span>
          </div>

          {/* Row 2 */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-semibold">Course Code:</span>
            <input 
              className="border-b border-dotted border-black outline-none bg-transparent w-36 px-1 font-bold" 
              value={courseCode} 
              onChange={e => setCourseCode(e.target.value)} 
            />
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-semibold">Course Title:</span>
            <input 
              className="border-b border-dotted border-black outline-none bg-transparent w-80 px-1 font-bold" 
              value={courseTitle} 
              onChange={e => setCourseTitle(e.target.value)} 
            />
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-bold">Level:</span>
            <select 
              className="border-b border-dotted border-black outline-none bg-transparent w-24 px-1 font-bold cursor-pointer" 
              value={level} 
              onChange={e => setLevel(Number(e.target.value))}
            >
              <option value={6}>Level 6</option>
              <option value={5}>Level 5</option>
              <option value={4}>Level 4</option>
              <option value={3}>Level 3</option>
            </select>
          </div>

          {/* Row 3 */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-semibold">Unit Code:</span>
            <input 
              className="border-b border-dotted border-black outline-none bg-transparent w-44 px-1 font-bold" 
              value={unitCode} 
              onChange={e => setUnitCode(e.target.value)} 
            />
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-semibold">Unit Title:</span>
            <input 
              className="border-b border-dotted border-black outline-none bg-transparent w-72 px-1 font-bold" 
              value={unitTitle} 
              onChange={e => setUnitTitle(e.target.value)} 
            />
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-bold">Term Dates:</span>
            <input 
              className="border-b border-dotted border-black outline-none bg-transparent w-48 px-1 text-center font-bold" 
              value={termDates} 
              onChange={e => setTermDates(e.target.value)} 
            />
          </div>

          {/* Row 4 */}
          <div className="flex items-center gap-2 whitespace-nowrap col-span-3">
            <span className="font-bold">Date of Review of PoE:</span>
            <input 
              className="border-b border-dotted border-black outline-none bg-transparent w-48 px-1 font-bold" 
              value={poeDate}
              onChange={e => setPoeDate(e.target.value)}
              placeholder="DD/MM/YYYY" 
            />
          </div>
        </div>

        {/* Dynamic Spreadsheet Table with Min-Width Guarantee */}
        <div className="w-full overflow-x-auto mb-6 border-2 border-black rounded shadow-sm">
          <table className="min-w-[1320px] w-full text-left border-collapse text-[12px] text-black" style={{ fontFamily: 'Maiandra GD, sans-serif' }}>
            <thead>
              <tr className="bg-white">
                <th className="w-12 min-w-[48px] p-2.5 border border-black font-bold text-center" rowSpan={2}>S/N</th>
                <th className="w-56 min-w-[200px] p-2.5 border border-black font-bold text-center" rowSpan={2}>Candidate's Reg<br/>Code</th>
                <th className="w-36 min-w-[130px] p-2.5 border border-black font-bold text-center" rowSpan={2}>ADM<br/>NO</th>
                <th className="w-64 min-w-[220px] p-2.5 border border-black font-bold text-center" rowSpan={2}>Candidate's Name</th>
                <th className="p-2.5 border border-black font-bold text-center" colSpan={ctCount + 1}>
                  Continuous Theory (CT) Marks<br/>(100%)
                  <button onClick={() => addColumn('ct')} className="ml-2 font-bold hover:underline print:hidden text-blue-600" title="Add Theory Assessment Column">[+]</button>
                </th>
                <th className="p-2.5 border border-black font-bold text-center" colSpan={cpCount + 1}>
                  Continuous Practical (CP) MARKS (100%)
                  <button onClick={() => addColumn('cp')} className="ml-2 font-bold hover:underline print:hidden text-blue-600" title="Add Practical Assessment Column">[+]</button>
                </th>
                <th className="w-24 min-w-[85px] p-2.5 border border-black font-bold text-center" rowSpan={2}>WEIGHTED<br/>MARKS</th>
                <th className="w-10 min-w-[36px] p-2 border-none font-bold text-center print:hidden" rowSpan={2}></th>
              </tr>
              <tr>
                {Array.from({ length: ctCount }).map((_, i) => (
                  <th key={`cth-${i}`} className="w-16 min-w-[62px] p-2 border border-black text-center font-bold bg-[#e5e5e5]">CT {i + 1}</th>
                ))}
                <th className="w-20 min-w-[75px] p-2 border border-black text-center font-bold bg-[#e5e5e5]">AVERAGE</th>
                
                {Array.from({ length: cpCount }).map((_, i) => (
                  <th key={`cph-${i}`} className="w-16 min-w-[62px] p-2 border border-black text-center font-bold bg-[#e5e5e5]">CP {i + 1}</th>
                ))}
                <th className="w-20 min-w-[75px] p-2 border border-black text-center font-bold bg-[#e5e5e5]">AVERAGE</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-2.5 border border-black text-center text-black font-bold">{row.sn}</td>
                  
                  {/* Reg Code with full visibility */}
                  <td className="p-1.5 border border-black text-center">
                    <input 
                      type="text"
                      className="w-full text-center outline-none bg-transparent text-black font-bold font-mono text-[11px] hover:bg-slate-100/60 focus:bg-white focus:ring-1 focus:ring-primary px-1 py-1 rounded transition" 
                      value={row.regCode}
                      onChange={(e) => handleRowChange(row.id, 'regCode', e.target.value)}
                      title={row.regCode}
                    />
                  </td>

                  {/* ADM NO with full visibility */}
                  <td className="p-1.5 border border-black text-center">
                    <input 
                      type="text"
                      className="w-full text-center outline-none bg-transparent text-black font-bold font-mono text-[11px] hover:bg-slate-100/60 focus:bg-white focus:ring-1 focus:ring-primary px-1 py-1 rounded transition" 
                      value={row.admNo}
                      onChange={(e) => handleRowChange(row.id, 'admNo', e.target.value)}
                      title={row.admNo}
                    />
                  </td>

                  {/* Candidate Name with full visibility */}
                  <td className="p-1.5 border border-black text-left">
                    <input 
                      type="text"
                      className="w-full text-left outline-none bg-transparent text-black font-bold text-[12px] hover:bg-slate-100/60 focus:bg-white focus:ring-1 focus:ring-primary px-2 py-1 rounded transition" 
                      value={row.name}
                      onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                      title={row.name}
                    />
                  </td>
                  
                  {/* CT Scores */}
                  {row.ctScores.map((score, i) => (
                    <td key={`ct-${i}`} className="p-1 border border-black text-center">
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="-"
                        className="w-full h-8 outline-none text-center bg-transparent font-bold text-xs text-black focus:bg-amber-50 focus:ring-1 focus:ring-amber-500 rounded" 
                        value={score} 
                        onChange={(e) => handleScoreChange(row.id, 'ct', i, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="p-2 border border-black text-center font-bold bg-[#e5e5e5] text-black text-xs">
                    {row.ctScores.some(s => s !== "" && !isNaN(Number(s))) ? Math.round(row.ctAvg) : "-"}
                  </td>
                  
                  {/* CP Scores */}
                  {row.cpScores.map((score, i) => (
                    <td key={`cp-${i}`} className="p-1 border border-black text-center">
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="-"
                        className="w-full h-8 outline-none text-center bg-transparent font-bold text-xs text-black focus:bg-amber-50 focus:ring-1 focus:ring-amber-500 rounded" 
                        value={score} 
                        onChange={(e) => handleScoreChange(row.id, 'cp', i, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="p-2 border border-black text-center font-bold bg-[#e5e5e5] text-black text-xs">
                    {row.cpScores.some(s => s !== "" && !isNaN(Number(s))) ? Math.round(row.cpAvg) : "-"}
                  </td>
                  
                  {/* Weighted Marks (Whole Number) */}
                  <td className="p-2 border border-black text-center font-bold bg-[#e5e5e5] text-black text-xs">
                    {(row.ctScores.some(s => s !== "" && !isNaN(Number(s))) || row.cpScores.some(s => s !== "" && !isNaN(Number(s)))) 
                      ? Math.round(row.weightedMark) 
                      : "-"}
                  </td>
                  
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Notes & Signatures */}
        <div className="mt-8 text-[12px] space-y-5" style={{ fontFamily: 'Maiandra GD, sans-serif' }}>
          <div>
            <p className="font-bold mb-1">Note:</p>
            <ol className="list-decimal pl-5 space-y-1 italic text-slate-800">
              <li>There is no limit on the number of formative assessment tests for theory as well as practical and hence the marks sheet can be adjusted as necessary.</li>
              <li>The marks in the average column for CT and CP are the ones to be entered in the council's assessment portal (rounded to whole number).</li>
              <li>To arrive at Weighted Marks, use Average marks for Theory and Practical as per the ratio below depending on the Level of Course:</li>
            </ol>
            <div className="mt-2.5 space-y-1 font-bold ml-5 text-black">
              <p>LEVEL 6 = (Theory × 0.5) + (Practical × 0.5)</p>
              <p>LEVEL 5 = (Theory × 0.4) + (Practical × 0.6)</p>
              <p>LEVEL 4 = (Theory × 0.3) + (Practical × 0.7)</p>
              <p>LEVEL 3 = (Theory × 0.2) + (Practical × 0.8)</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 font-bold text-[13px]">
            <div>Approved by:</div>
            <div className="space-y-6">
              <div className="flex items-end gap-2">
                <span className="whitespace-nowrap">1. Name of Internal Assessor:</span>
                <span className="font-bold border-b border-black flex-1 px-2 pb-0.5">Alexander Kinoti</span>
                <span className="whitespace-nowrap">Signature: ................................</span>
                <span className="whitespace-nowrap">Date: {poeDate}</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="whitespace-nowrap">2. Name of Internal Verifier:</span>
                <span className="font-bold border-b border-black flex-1 px-2 pb-0.5">HOD Computing & Informatics</span>
                <span className="whitespace-nowrap">Signature: ................................</span>
                <span className="whitespace-nowrap">Date: {poeDate}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Practical Observation Checklist Modal (TVET CDACC Workshop / Laboratory Tool) */}
      <ObservationChecklistMarkingModal
        isOpen={isObservationModalOpen}
        onClose={() => setIsObservationModalOpen(false)}
        candidateName={selectedCandidateForPractical?.name || "LUCKYSUSAN KIANJIRU MUGO"}
        candidateRegCode={selectedCandidateForPractical?.admNo || selectedCandidateForPractical?.regCode || "10525"}
        unitCode={unitCode}
        unitTitle={unitTitle}
        onSave={(total, pct, comp, feed) => {
          if (selectedCandidateForPractical) {
            handleScoreChange(selectedCandidateForPractical.id, 'cp', 0, String(total));
            toast.success(`Recorded ${total}/50 (${pct}%) on CP1 for ${selectedCandidateForPractical.name}`);
          }
        }}
      />
    </div>
  );
}
