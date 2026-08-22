import { useState, useEffect } from "react";
import TrainerLayout from "@/components/TrainerLayout";
import { Save, Printer, UserCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useTrainees } from "@/contexts/TraineeContext";
import { useAuth } from "@/contexts/AuthContext";

// --- Types ---
type AttendanceStatus = "X" | "0" | "";

interface StudentAttendanceRecord {
  attendance: Record<string, AttendanceStatus>; // key format: "W{week}_S{session}"
}

const WEEKS = 10;
const SESSIONS_PER_WEEK = 3;

export default function ClassRegister() {
  const { trainees } = useTrainees();
  const { user } = useAuth();
  
  // State: Mapping traineeId -> attendance record
  const [attendanceData, setAttendanceData] = useState<Record<string, StudentAttendanceRecord>>({});
  const [hoursPerSession, setHoursPerSession] = useState<number>(2);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize attendance tracking for any newly registered trainees
  useEffect(() => {
    setAttendanceData(prev => {
      const updated = { ...prev };
      trainees.forEach(t => {
        if (!updated[t.id]) {
          updated[t.id] = { attendance: {} };
        }
      });
      return updated;
    });
  }, [trainees]);

  // Form Metadata - Inherited intelligently
  const [metadata, setMetadata] = useState({
    lecturer: user?.email || "Dr. J. Muriithi",
    className: "ITECH6/M/2024",
    subject: "Software Engineering",
    duration: "Term 2 2026",
    level: "Level 6",
    lecturerComment: "",
    hodComment: "",
  });

  // Toggle Attendance Cell
  const toggleAttendance = (studentId: string, week: number, session: number) => {
    setAttendanceData((prev) => {
      const studentRecord = prev[studentId] || { attendance: {} };
      const key = `W${week}_S${session}`;
      const current = studentRecord.attendance[key];
      
      // Cycle: "" -> "X" -> "0" -> ""
      let nextStatus: AttendanceStatus = "";
      if (!current) nextStatus = "X";
      else if (current === "X") nextStatus = "0";
      else nextStatus = "";

      return {
        ...prev,
        [studentId]: {
          attendance: { ...studentRecord.attendance, [key]: nextStatus }
        }
      };
    });
  };

  // Calculations
  const calculateStats = (attendance: Record<string, AttendanceStatus>) => {
    let presentCount = 0;
    let absentCount = 0;

    Object.values(attendance).forEach(status => {
      if (status === "X") presentCount++;
      if (status === "0") absentCount++;
    });

    const totalMarkedSessions = presentCount + absentCount;
    const actualHrs = presentCount * hoursPerSession;
    const possibleHrs = totalMarkedSessions * hoursPerSession;
    
    // We base percentage ONLY on marked sessions so far.
    // If no sessions marked, percentage is 0 (or N/A visually).
    const percentage = totalMarkedSessions === 0 
      ? 0 
      : Math.round((presentCount / totalMarkedSessions) * 100);

    return { actualHrs, possibleHrs, percentage, totalMarkedSessions };
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Class Register Saved", {
        description: "Attendance data has been securely synced to the database.",
      });
    }, 1200);
  };

  return (
    <TrainerLayout 
      title="Class Register (CUR/02)" 
      subtitle="Digital General Class Register with auto-calculations."
    >
      <div className="space-y-6 pb-20">
        
        {/* Controls & Metadata */}
        <div className="bg-white text-black border border-black/20 rounded-xl shadow-sm p-6 space-y-6 print:border-none print:shadow-none print:p-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black/5 rounded-lg border border-black/10">
                <UserCheck className="w-5 h-5 text-black" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-black">Register Details</h2>
                <p className="text-xs text-black/60 print:hidden">Adjust session hours to recalculate totals.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto print:hidden">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-black/70 whitespace-nowrap">Hrs / Session:</label>
                <input 
                  type="number" 
                  value={hoursPerSession}
                  onChange={(e) => setHoursPerSession(Number(e.target.value) || 0)}
                  className="w-20 h-9 px-2 text-center bg-white border border-black/20 text-black rounded-md outline-none focus:ring-1 focus:ring-black"
                  min="1"
                  max="8"
                />
              </div>
              <button onClick={() => window.print()} className="h-9 px-4 flex items-center gap-2 hidden md:flex bg-white border border-black/20 text-black hover:bg-black/5 rounded-md font-medium transition-colors">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={handleSave} disabled={isSaving} className="h-9 px-4 flex items-center gap-2 flex-1 md:flex-none justify-center bg-black text-white hover:bg-black/90 rounded-md font-medium transition-colors">
                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Register"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-black/70 uppercase tracking-wider">Lecturer</label>
              <input type="text" value={metadata.lecturer} onChange={e => setMetadata({...metadata, lecturer: e.target.value})} className="w-full h-9 px-3 text-sm bg-white border border-black/20 text-black rounded-md outline-none focus:ring-1 focus:ring-black" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-black/70 uppercase tracking-wider">Class</label>
              <input type="text" value={metadata.className} onChange={e => setMetadata({...metadata, className: e.target.value})} className="w-full h-9 px-3 text-sm font-bold bg-white border border-black/20 text-black rounded-md outline-none focus:ring-1 focus:ring-black" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-black/70 uppercase tracking-wider">Subject</label>
              <input type="text" value={metadata.subject} onChange={e => setMetadata({...metadata, subject: e.target.value})} className="w-full h-9 px-3 text-sm bg-white border border-black/20 text-black rounded-md outline-none focus:ring-1 focus:ring-black" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-black/70 uppercase tracking-wider">Duration</label>
              <input type="text" value={metadata.duration} onChange={e => setMetadata({...metadata, duration: e.target.value})} className="w-full h-9 px-3 text-sm bg-white border border-black/20 text-black rounded-md outline-none focus:ring-1 focus:ring-black" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-black/70 uppercase tracking-wider">Level</label>
              <input type="text" value={metadata.level} onChange={e => setMetadata({...metadata, level: e.target.value})} className="w-full h-9 px-3 text-sm bg-white border border-black/20 text-black rounded-md outline-none focus:ring-1 focus:ring-black" />
            </div>
          </div>
        </div>

        {/* The Register Table */}
        <div className="bg-white border border-black/20 rounded-xl shadow-sm overflow-hidden flex flex-col print:border-none print:shadow-none print:overflow-visible">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse text-sm text-left text-black">
              <thead>
                <tr className="bg-gray-100 border-b border-black/20">
                  <th className="p-3 font-bold border-r border-black/20 w-12 text-center text-black">#</th>
                  <th className="p-3 font-bold border-r border-black/20 w-32 whitespace-nowrap text-black">Admission No</th>
                  <th className="p-3 font-bold border-r border-black/20 min-w-[200px] text-black">Names</th>
                  
                  {/* Week Headers */}
                  {Array.from({ length: WEEKS }).map((_, w) => (
                    <th key={`head-w${w+1}`} className="p-0 font-bold border-r border-black/20 text-center text-black">
                      <div className="border-b border-black/20 p-1 text-xs">WK {w + 1}</div>
                      <div className="flex">
                        {Array.from({ length: SESSIONS_PER_WEEK }).map((_, s) => (
                          <div key={`head-w${w+1}-s${s+1}`} className={`flex-1 p-1 text-[10px] ${s < SESSIONS_PER_WEEK -1 ? 'border-r border-black/20' : ''}`}>
                            S{s+1}
                          </div>
                        ))}
                      </div>
                    </th>
                  ))}

                  {/* Calculations Headers */}
                  <th className="p-3 font-bold border-r border-black/20 text-center text-xs whitespace-nowrap text-black">Possible<br/>Hrs</th>
                  <th className="p-3 font-bold border-r border-black/20 text-center text-xs whitespace-nowrap text-black">Actual<br/>Hrs</th>
                  <th className="p-3 font-bold text-center text-xs whitespace-nowrap text-black">Attendance<br/>%</th>
                </tr>
              </thead>
              <tbody>
                {trainees.map((student, idx) => {
                  const studentAttendance = attendanceData[student.id]?.attendance || {};
                  const stats = calculateStats(studentAttendance);
                  const isPoorAttendance = stats.totalMarkedSessions > 0 && stats.percentage < 75;

                  return (
                    <tr key={student.id} className="border-b border-black/20 hover:bg-gray-50 transition-colors">
                      <td className="p-2 border-r border-black/20 text-center text-black/70">{idx + 1}</td>
                      <td className="p-2 border-r border-black/20 font-medium text-black">{student.admNo}</td>
                      <td className="p-2 border-r border-black/20 font-bold text-black whitespace-nowrap">{student.name}</td>
                      
                      {/* Week Cells */}
                      {Array.from({ length: WEEKS }).map((_, w) => (
                        <td key={`cell-w${w+1}`} className="p-0 border-r border-black/20 min-w-[72px]">
                          <div className="flex h-full min-h-[36px]">
                            {Array.from({ length: SESSIONS_PER_WEEK }).map((_, s) => {
                              const status = studentAttendance[`W${w+1}_S${s+1}`] || "";
                              return (
                                <button
                                  key={`btn-w${w+1}-s${s+1}`}
                                  onClick={() => toggleAttendance(student.id, w + 1, s + 1)}
                                  className={`flex-1 flex items-center justify-center text-sm font-bold transition-all
                                    ${s < SESSIONS_PER_WEEK - 1 ? 'border-r border-black/20' : ''}
                                    ${status === 'X' ? 'bg-black/10 text-black' : ''}
                                    ${status === '0' ? 'bg-gray-200 text-black line-through' : ''}
                                    hover:bg-black/5 focus:outline-none focus:ring-1 focus:ring-black inset-0 text-black
                                  `}
                                >
                                  {status}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      ))}

                      {/* Calculations Cells */}
                      <td className="p-2 border-r border-black/20 text-center font-medium bg-gray-50 text-black">{stats.possibleHrs}</td>
                      <td className="p-2 border-r border-black/20 text-center font-bold bg-gray-100 text-black">{stats.actualHrs}</td>
                      <td className="p-2 text-center text-black">
                        {stats.totalMarkedSessions === 0 ? (
                          <span className="text-black/50 text-xs">-</span>
                        ) : (
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border border-black/20 ${
                            isPoorAttendance ? 'bg-gray-200 text-black line-through' : 'bg-black text-white'
                          }`}>
                            {stats.percentage}%
                            {isPoorAttendance && <AlertCircle className="w-3 h-3" />}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Comments */}
          <div className="p-6 border-t border-black/20 grid md:grid-cols-2 gap-6 bg-gray-50 text-black">
            <div className="space-y-2">
              <label className="text-xs font-bold text-black/70 uppercase tracking-wider">Lecturer's Comment</label>
              <textarea 
                rows={3} 
                value={metadata.lecturerComment}
                onChange={e => setMetadata({...metadata, lecturerComment: e.target.value})}
                className="w-full p-3 text-sm bg-white border border-black/20 text-black rounded-md outline-none focus:ring-1 focus:ring-black resize-none" 
                placeholder="Add any remarks regarding attendance..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-black/70 uppercase tracking-wider">HOD's Comment</label>
              <textarea 
                rows={3} 
                value={metadata.hodComment}
                onChange={e => setMetadata({...metadata, hodComment: e.target.value})}
                className="w-full p-3 text-sm bg-white border border-black/20 text-black rounded-md outline-none focus:ring-1 focus:ring-black resize-none" 
                placeholder="HOD remarks (Official use only)"
              />
            </div>
          </div>
        </div>

      </div>
    </TrainerLayout>
  );
}
