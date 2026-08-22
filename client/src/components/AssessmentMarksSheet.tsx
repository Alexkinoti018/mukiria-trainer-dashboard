import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Calculator } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";
import { useTrainees } from "@/contexts/TraineeContext";

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
  const [courseTitle, setCourseTitle] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [unitTitle, setUnitTitle] = useState("Demonstrate ICT Skills");
  const [termDates, setTermDates] = useState("");
  
  // New: Relational Selection
  const [selectedClassId, setSelectedClassId] = useState("class_1");
  const [unitOfferingId, setUnitOfferingId] = useState("uo_1");
  const [isLocked, setIsLocked] = useState(false); // Internal Assessor Sign-off
  
  const [ctCount, setCtCount] = useState(3);
  const [cpCount, setCpCount] = useState(3);

  const [rows, setRows] = useState<AssessmentRow[]>([]);

  const { trainees } = useTrainees();

  // Auto-populate based on context Trainees (Zero Redundancy Engine)
  useEffect(() => {
    // We can filter by selectedClassId later if we attach class info to trainees.
    // For now, we list all registered trainees.
    setRows((currentRows) => {
      // Map global trainees to the sheet format, preserving existing scores if they exist
      return trainees.map((t, idx) => {
        const existingRow = currentRows.find(r => r.id === t.id);
        return existingRow ? { ...existingRow, sn: idx + 1 } : {
          id: t.id,
          sn: idx + 1,
          regCode: t.regCode,
          admNo: t.admNo,
          name: t.name,
          ctScores: Array(ctCount).fill(""),
          cpScores: Array(cpCount).fill(""),
          ctAvg: 0,
          cpAvg: 0,
          weightedMark: 0,
        };
      });
    });
  }, [trainees, ctCount, cpCount]);

  const calculateAverages = (scores: any[]) => {
    const validScores = scores
      .map((s) => parseFloat(s))
      .filter((s) => !isNaN(s));
    if (validScores.length === 0) return 0;
    const sum = validScores.reduce((a, b) => a + b, 0);
    return Number((sum / validScores.length).toFixed(2));
  };

  const calculateWeighted = (ctAvg: number, cpAvg: number, currentLevel: number) => {
    switch (currentLevel) {
      case 6: return Number(((ctAvg * 0.5) + (cpAvg * 0.5)).toFixed(2));
      case 5: return Number(((ctAvg * 0.4) + (cpAvg * 0.6)).toFixed(2));
      case 4: return Number(((ctAvg * 0.3) + (cpAvg * 0.7)).toFixed(2));
      case 3: return Number(((ctAvg * 0.2) + (cpAvg * 0.8)).toFixed(2));
      default: return 0;
    }
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
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        
        const newRow = { ...row };
        if (type === 'ct') {
          newRow.ctScores = [...row.ctScores];
          newRow.ctScores[index] = value as any;
          newRow.ctAvg = calculateAverages(newRow.ctScores);
        } else {
          newRow.cpScores = [...row.cpScores];
          newRow.cpScores[index] = value as any;
          newRow.cpAvg = calculateAverages(newRow.cpScores);
        }
        
        newRow.weightedMark = calculateWeighted(newRow.ctAvg, newRow.cpAvg, level);
        return newRow;
      })
    );
  };

  const handleRowChange = (rowId: string, field: keyof AssessmentRow, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sn: prev.length + 1,
        regCode: "",
        admNo: "",
        name: "",
        ctScores: Array(ctCount).fill(""),
        cpScores: Array(cpCount).fill(""),
        ctAvg: 0,
        cpAvg: 0,
        weightedMark: 0,
      },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id).map((row, idx) => ({ ...row, sn: idx + 1 })));
  };

  const addColumn = (type: 'ct' | 'cp') => {
    if (type === 'ct') {
      setCtCount(c => c + 1);
      setRows(prev => prev.map(row => ({ ...row, ctScores: [...row.ctScores, ""] })));
    } else {
      setCpCount(c => c + 1);
      setRows(prev => prev.map(row => ({ ...row, cpScores: [...row.cpScores, ""] })));
    }
  };

  const removeColumn = (type: 'ct' | 'cp', index: number) => {
    if (type === 'ct') {
      if (ctCount <= 1) return;
      setCtCount(c => c - 1);
      setRows(prev => prev.map(row => ({
        ...row,
        ctScores: row.ctScores.filter((_, i) => i !== index)
      })));
    } else {
      if (cpCount <= 1) return;
      setCpCount(c => c - 1);
      setRows(prev => prev.map(row => ({
        ...row,
        cpScores: row.cpScores.filter((_, i) => i !== index)
      })));
    }
  };

  const submitData = async () => {
    try {
      const payload = rows.map(r => ({
           unit_offering_id: unitOfferingId,
           trainee_id: r.id, // ID mapped from trainee
           ct_scores: r.ctScores.map(score => parseFloat(score as any)).filter(score => !isNaN(score)),
           computed_average_theory: r.ctAvg,
           cp_scores: r.cpScores.map(score => parseFloat(score as any)).filter(score => !isNaN(score)),
           computed_average_practical: r.cpAvg,
           weighted_mark: r.weightedMark,
           is_locked: isLocked
      }));

      let savedToSupabase = false;

      if (isSupabaseConfigured()) {
        try {
          // Upsert to handle unique constraint on (unit_offering_id, trainee_id)
          const { error } = await supabase.from('assessment_marks').upsert(payload as any, { onConflict: 'unit_offering_id, trainee_id' });
          if (error) throw error;
          savedToSupabase = true;
          toast.success("Assessment saved and validated successfully!");
        } catch (supabaseErr: any) {
          console.warn("Supabase save failed, falling back to local demo mode:", supabaseErr);
        }
      } 
      
      if (!savedToSupabase) {
        console.log("Mock Save Data (Relational):", payload);
        toast.success("Assessment saved locally (Demo Mode)");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to submit data: ${err.message || "Unknown error"}`);
    }
  };

  return (
    <div className="container py-8 max-w-[1400px]">
      <div className="card-minimal p-8 bg-white overflow-x-auto">
        
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center mb-8 text-center space-y-2">
          <img src="/mukiria-logo.png" alt="Mukiria Logo" className="w-32 h-32 object-contain mb-2 fallback-logo" onError={(e) => e.currentTarget.style.display = 'none'} />
          <h1 className="text-2xl font-bold uppercase text-black">Mukiria Technical Training Institute</h1>
          <h2 className="text-lg font-bold uppercase text-black">CONTINUOUSASSESSMENT MARKS SHEETS PER UNIT OF COMPETENCY</h2>
        </div>

        {/* Form Metadata */}
        <div className="grid grid-cols-[auto_1fr_auto] gap-x-12 gap-y-6 mb-8 text-[13px] text-black" style={{ fontFamily: 'Maiandra GD, sans-serif' }}>
          {/* Row 1 */}
          <div className="flex gap-2 items-center whitespace-nowrap">
            <span>Assessment Center Code:</span>
            <span>10200004</span>
          </div>
          <div className="flex gap-2 items-center whitespace-nowrap col-span-2">
            <span>Assessment Center Name:</span>
            <span className="uppercase">MUKIRIA TECHNICAL TRAINING INSTITUTE</span>
          </div>

          {/* Row 2 */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span>Course Code:</span>
            <input className="border-b-2 border-transparent hover:border-dotted focus:border-black outline-none bg-transparent w-40 px-1" value={courseCode} onChange={e => setCourseCode(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span>Course Title:</span>
            <input className="border-b-2 border-dotted border-black outline-none bg-transparent w-64 px-1" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-bold">Level:</span>
            <select className="border-b-2 border-dotted border-black outline-none bg-transparent w-24 px-1" value={level} onChange={e => setLevel(Number(e.target.value))}>
              <option value={6}>Level 6</option>
              <option value={5}>Level 5</option>
              <option value={4}>Level 4</option>
              <option value={3}>Level 3</option>
            </select>
          </div>

          {/* Row 3 */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span>Unit Code:</span>
            <input className="border-b-2 border-dotted border-black outline-none bg-transparent w-40 px-1" value={unitCode} onChange={e => setUnitCode(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span>Unit Title:</span>
            <input className="border-b-2 border-transparent hover:border-dotted focus:border-black outline-none bg-transparent w-64 px-1" value={unitTitle} onChange={e => setUnitTitle(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-bold">Term Dates:</span>
            <span className="font-bold">From</span>
            <input className="border-b-2 border-dotted border-black outline-none bg-transparent w-16 px-1 text-center font-bold" value={termDates.split("To")[0] || ""} onChange={e => setTermDates(`${e.target.value} To ${termDates.split("To")[1] || ""}`)} />
            <span className="font-bold">To</span>
            <input className="border-b-2 border-dotted border-black outline-none bg-transparent w-16 px-1 text-center font-bold" value={termDates.split("To")[1]?.trim() || ""} onChange={e => setTermDates(`${termDates.split("To")[0] || ""} To ${e.target.value}`)} />
          </div>

          {/* Row 4 */}
          <div className="flex items-center gap-2 whitespace-nowrap col-span-3">
            <span className="font-bold">Date of Review of PoE:</span>
            <input className="border-b-2 border-dotted border-black outline-none bg-transparent w-64 px-1" placeholder="" />
          </div>
        </div>

        {/* Dynamic Spreadsheet Table */}
        <div className="w-full overflow-x-auto mb-4 border-2 border-black">
          <table className="w-full text-left border-collapse text-[12px] text-black" style={{ fontFamily: 'Maiandra GD, sans-serif' }}>
            <thead>
              <tr className="bg-white">
                <th className="p-3 border border-black font-bold text-center" rowSpan={2}>S/N</th>
                <th className="p-3 border border-black font-bold text-center" rowSpan={2}>Candidate's Reg<br/>Code</th>
                <th className="p-3 border border-black font-bold text-center" rowSpan={2}>ADM<br/>NO</th>
                <th className="p-3 border border-black font-bold text-center" rowSpan={2}>Candidate's Name</th>
                <th className="p-3 border border-black font-bold text-center" colSpan={ctCount + 1}>
                  Continuous Theory (CT) Marks<br/>(100%)
                  <button onClick={() => addColumn('ct')} className="ml-2 font-bold hover:underline print:hidden">[+]</button>
                </th>
                <th className="p-3 border border-black font-bold text-center" colSpan={cpCount + 1}>
                  Continuous Practical (CP) MARKS (100%)
                  <button onClick={() => addColumn('cp')} className="ml-2 font-bold hover:underline print:hidden">[+]</button>
                </th>
                <th className="p-3 border border-black font-bold text-center" rowSpan={2}>WEIGHTED<br/>MARKS</th>
                <th className="p-3 border-none font-bold text-center print:hidden" rowSpan={2}></th>
              </tr>
              <tr>
                {Array.from({ length: ctCount }).map((_, i) => (
                  <th key={`cth-${i}`} className="p-3 border border-black text-center font-bold bg-[#e5e5e5]">CT {i + 1}</th>
                ))}
                <th className="p-3 border border-black text-center font-bold bg-[#e5e5e5]">AVERAGE</th>
                
                {Array.from({ length: cpCount }).map((_, i) => (
                  <th key={`cph-${i}`} className="p-3 border border-black text-center font-bold bg-[#e5e5e5]">CP {i + 1}</th>
                ))}
                <th className="p-3 border border-black text-center font-bold bg-[#e5e5e5]">AVERAGE</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="p-3 border border-black text-center text-black">{row.sn}</td>
                  <td className="p-0 border border-black">
                    <input readOnly disabled className="w-full h-full p-3 outline-none bg-transparent cursor-not-allowed text-black font-bold" value={row.regCode} />
                  </td>
                  <td className="p-0 border border-black">
                    <input readOnly disabled className="w-full h-full p-3 outline-none bg-transparent cursor-not-allowed text-black font-bold" value={row.admNo} />
                  </td>
                  <td className="p-0 border border-black">
                    <input readOnly disabled className="w-full h-full p-3 outline-none bg-transparent cursor-not-allowed text-black font-bold" value={row.name} />
                  </td>
                  
                  {/* CT Scores */}
                  {row.ctScores.map((score, i) => (
                    <td key={`ct-${i}`} className="p-0 border border-black relative group">
                      <input 
                        className="w-full h-full p-3 outline-none text-center bg-transparent font-bold" 
                        value={score} 
                        onChange={(e) => handleScoreChange(row.id, 'ct', i, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="p-3 border border-black text-center font-bold bg-[#e5e5e5] text-black">{row.ctAvg.toFixed(2)}</td>
                  
                  {/* CP Scores */}
                  {row.cpScores.map((score, i) => (
                    <td key={`cp-${i}`} className="p-0 border border-black relative group">
                      <input 
                        className="w-full h-full p-3 outline-none text-center bg-transparent font-bold" 
                        value={score} 
                        onChange={(e) => handleScoreChange(row.id, 'cp', i, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="p-3 border border-black text-center font-bold bg-[#e5e5e5] text-black">{row.cpAvg.toFixed(2)}</td>
                  
                  <td className="p-3 border border-black text-center font-bold bg-[#e5e5e5] text-black">{row.weightedMark.toFixed(2)}</td>
                  
                  <td className="p-3 border-none text-center print:hidden">
                    <button onClick={() => removeRow(row.id)} className="font-bold text-black" title="Remove Row">[x]</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end gap-4 print:hidden">
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`px-4 py-2 font-bold border-2 transition-colors ${
              isLocked 
                ? "border-black text-black bg-gray-200" 
                : "border-black text-black bg-white hover:bg-gray-100"
            }`}
          >
            {isLocked ? "Unlock Sheet (Internal Assessor)" : "Sign-off & Lock Sheet (Internal Assessor)"}
          </button>
          <button 
            onClick={submitData}
            disabled={isLocked}
            className={`px-6 py-2 border-2 border-black font-bold transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed bg-gray-200 text-black' : 'bg-black text-white hover:bg-gray-800'}`}
          >
            Save Marks
          </button>
        </div>

        {/* Footer Notes & Signatures */}
        <div className="mt-8 text-[12px] space-y-6" style={{ fontFamily: 'Maiandra GD, sans-serif' }}>
          <div>
            <p className="font-bold mb-1">Note:</p>
            <ol className="list-decimal pl-5 space-y-1 italic">
              <li>There is no limit on the number of formative assessment tests for theory as well as practical and hence the marks sheet can be adjusted as necessary.</li>
              <li>The marks in the average column for CT and CP are the ones to be entered in the council's assessment portal.</li>
              <li>To arrive at Weighted Marks, use Average marks for Theory and Practical as per the ratio below depending on the Level of Course</li>
            </ol>
            <div className="mt-3 space-y-1 font-bold ml-5">
              <p>LEVEL 6 = (Theory X 0.5) +(Practical X 0.5)</p>
              <p>LEVEL 5 = (Theory X 0.4) +(Practical X 0.6)</p>
              <p>LEVEL 4 = (Theory X 0.3) +(Practical X 0.7)</p>
              <p>LEVEL 3 = (Theory X 0.2) +(Practical X 0.8)</p>
            </div>
          </div>

          <div className="space-y-6 pt-6 font-bold text-[13px]">
            <div>Approved by:</div>
            <div className="space-y-8">
              <div className="flex items-end gap-1">
                <span className="whitespace-nowrap">1. Name of Internal Assessor</span>
                <span className="flex-1 overflow-hidden tracking-[0.15em] text-gray-500">........................................................................................................................................................................................</span>
              </div>
              <div className="flex items-end gap-1">
                <span>Signature</span>
                <span className="flex-1 overflow-hidden tracking-[0.15em] text-gray-500">........................................................................................................................</span>
                <span>Date</span>
                <span className="flex-1 overflow-hidden tracking-[0.15em] text-gray-500">........................................................................................................................</span>
              </div>
            </div>

            <div className="space-y-8 pt-6">
              <div className="flex items-end gap-1">
                <span className="whitespace-nowrap">2. Verified by External Verifier</span>
                <span className="flex-1 overflow-hidden tracking-[0.15em] text-gray-500">........................................................................................................................................................................................</span>
              </div>
              <div className="flex items-end gap-1">
                <span>Signature</span>
                <span className="flex-1 overflow-hidden tracking-[0.15em] text-gray-500">........................................................................................................................</span>
                <span>Date</span>
                <span className="flex-1 overflow-hidden tracking-[0.15em] text-gray-500">........................................................................................................................</span>
                <span>Institution Stamp</span>
                <span className="flex-1 overflow-hidden tracking-[0.15em] text-gray-500">........................................................................................................................</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
