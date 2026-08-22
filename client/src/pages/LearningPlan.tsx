import React, { useState } from "react";
import TrainerLayout from "@/components/TrainerLayout";
import IntelligentDropzone from "@/components/IntelligentDropzone";
import { Printer } from "lucide-react";

interface ElementCriteria {
  title: string;
  performanceCriteria: string[];
}

interface WeekSession {
  week: number;
  sessionNo: number;
  title: string;
  outcome: string;
  trainerActivities: string;
  traineeActivities: string;
  resources: string;
  assessments: string;
  reflections: string;
}

interface ExtractedData {
  unitCode: string;
  unitTitle: string;
  level: number;
  elements: ElementCriteria[];
  weeks: WeekSession[];
}

export default function LearningPlan() {
  const [dataList, setDataList] = useState<ExtractedData[] | null>(null);

  const handleUploadSuccess = (responses: any[]) => {
    console.log("Parsed Data Array:", responses);
    const mapped = responses.map((res, idx) => {
      
      // Map elements for the "Benchmark or Criteria" section
      const elements: ElementCriteria[] = (res.topics && res.topics.length > 0) ? res.topics.map((topic: string, i: number) => ({
        title: `${i + 1}. ${topic}`,
        performanceCriteria: (res.outcomes && res.outcomes.length > i) 
          ? [res.outcomes[i]] // Ideally this would be split by actual criteria, using flat outcomes for now
          : ["Criteria extracted from document"]
      })) : [
        {
          title: "1. Identify computer hardware and software",
          performanceCriteria: [
            "a. Computer hardware components are identified and their functions explained.",
            "b. Computer software is classified, and operating system features are utilized."
          ]
        },
        {
          title: "2. Operate computer devices",
          performanceCriteria: [
            "a. Computer is turned on and off following standard operating procedures.",
            "b. Files and folders are created, saved, and managed securely."
          ]
        }
      ];

      // Map weeks for the 9-column schedule table
      const weeks: WeekSession[] = (res.topics && res.topics.length > 0) ? res.topics.map((topic: string, i: number) => ({
        week: i + 1,
        sessionNo: i + 1,
        title: topic,
        outcome: `By the end of the session trainee should be able to: \n${topic}`,
        trainerActivities: "• Poses questions\n• Demonstrates concepts",
        traineeActivities: "• Give responses\n• Practical exercises",
        resources: "Refs:\n1. CDACC OS/Curr\n2. Practical Manual",
        assessments: "Knowledge\n1. Oral questioning\nSkills\n1. Observation",
        reflections: ""
      })) : [
        {
          week: 1,
          sessionNo: 1,
          title: "Identification of computer",
          outcome: "By the end of the session trainee should be able to:\nIdentify computer hardware",
          trainerActivities: "• Poses questions on digital literacy terms.",
          traineeActivities: "• Give responses to questions",
          resources: "Refs:\n(minimum two)",
          assessments: "Knowledge\n1. Oral questioning",
          reflections: ""
        }
      ];

      return {
        unitCode: res.unit_code || `BUS/CU/OA/BC/03/5/A`,
        unitTitle: res.unit_name || res.course_name || `Apply ICT Skills`,
        level: res.level || 5,
        elements: elements,
        weeks: weeks
      };
    });
    
    if (mapped.length > 0) {
      // Merge all uploaded documents into a SINGLE learning plan
      const mergedData: ExtractedData = {
        unitCode: mapped[0].unitCode,
        unitTitle: mapped[0].unitTitle,
        level: mapped[0].level,
        elements: mapped.flatMap(m => m.elements),
        weeks: mapped.flatMap(m => m.weeks).map((w, index) => ({
          ...w,
          week: index + 1,
          sessionNo: index + 1
        }))
      };
      setDataList([mergedData]);
    } else {
      setDataList([]);
    }
  };

  return (
    <TrainerLayout title="Learning Plan" subtitle="Upload CDACC Occupational Standard to generate">
      {!dataList || dataList.length === 0 ? (
        <div className="max-w-2xl mx-auto mt-8 bg-card border border-border p-8 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-center">Generate Learning Plan</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Upload a CDACC Occupational Standard document (.docx or .pdf). The Intelligent Parsing Hub will automatically extract the unit code, elements, and performance criteria to generate your Learning Plan.
          </p>
          <IntelligentDropzone 
            context="learning_plan"
            role="trainer"
            onSuccess={handleUploadSuccess}
            label="Drag & Drop CDACC file here"
          />
        </div>
      ) : (
        <div className="max-w-[1400px] mx-auto mt-6">
          <div className="flex justify-end mb-4 print:hidden">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-bold hover:opacity-80 transition-opacity"
            >
              <Printer className="w-4 h-4" /> Print Document
            </button>
          </div>
          
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page { size: landscape; margin: 10mm; }
              body { -webkit-print-color-adjust: exact; }
              thead { display: table-row-group; }
            }
          `}} />

          {/* Strict Black & White Document Layout (Mapped for multiple uploads) */}
          <div className="flex flex-col gap-12">
            {dataList.map((data, docIndex) => (
              <div 
                key={docIndex} 
                className="bg-white text-black p-6 border-2 border-black shadow-lg mx-auto w-full print:border-none print:shadow-none print:p-0" 
                style={{ fontFamily: 'Maiandra GD, sans-serif', pageBreakAfter: 'always' }}
              >
                {/* Header Section */}
                <div className="text-right font-bold text-sm mb-2">MTTI/F/CUR/01</div>
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold uppercase mb-1">Mukiria Technical Training Institute</h1>
                  <h2 className="text-lg font-bold uppercase">Learning Plan</h2>
                </div>
                
                {/* Header Grid (5 Rows x 2 Cols) */}
                <table className="w-full border-collapse border border-black text-sm mb-4">
                  <tbody>
                    <tr>
                      <td className="border border-black p-2 w-1/2"><span className="font-bold">Unit of Competence:</span> {data.unitTitle}</td>
                      <td className="border border-black p-2 w-1/2"><span className="font-bold">Unit Code:</span> {data.unitCode}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2"><span className="font-bold">Name of Trainer:</span> Alexander Kinoti</td>
                      <td className="border border-black p-2"><span className="font-bold">Department:</span> Computing & Informatics</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2"><span className="font-bold">Duration:</span> MAY-AUG 2026</td>
                      <td className="border border-black p-2"><span className="font-bold">Level:</span> {data.level}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2"><span className="font-bold">Date of Preparation:</span> {new Date().toLocaleDateString('en-GB')}</td>
                      <td className="border border-black p-2"><span className="font-bold">Date of Revision:</span></td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2"><span className="font-bold">Number of Trainees:</span> 25</td>
                      <td className="border border-black p-2"><span className="font-bold">Class:</span> ADMIN6/5/S/J/24/25</td>
                    </tr>
                  </tbody>
                </table>

                {/* Preamble / Criteria */}
                <div className="text-sm mb-6">
                  <p className="mb-2"><span className="font-bold">Skill or Job Task:</span> Operate computer hardware and software, manage files, navigate networks, and utilize office applications (Word processing, Spreadsheets, Databases, and Presentations) to execute organizational administrative tasks.</p>
                  
                  <p className="font-bold mb-2">Benchmark or Criteria to be used:</p>
                  <div className="ml-4 space-y-3">
                    {data.elements.map((el, i) => (
                      <div key={i}>
                        <p className="font-bold">{el.title}</p>
                        <div className="ml-6 space-y-1 mt-1">
                          {el.performanceCriteria.map((pc, j) => (
                            <p key={j}>{String.fromCharCode(97 + j)}. {pc}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 9-Column Weekly Schedule */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-xs md:text-sm">
                    <thead>
                      <tr>
                        <th className="border border-black p-2 font-bold w-12 text-center">Week</th>
                        <th className="border border-black p-2 font-bold w-16 text-center">Session<br/>No.</th>
                        <th className="border border-black p-2 font-bold w-48 text-left">Session<br/>Title</th>
                        <th className="border border-black p-2 font-bold w-48 text-left">Learning<br/>Outcome</th>
                        <th className="border border-black p-2 font-bold w-32 text-left">Trainer<br/>Activities</th>
                        <th className="border border-black p-2 font-bold w-32 text-left">Trainee(s)<br/>Activities</th>
                        <th className="border border-black p-2 font-bold w-32 text-left">Resources<br/>& Refs</th>
                        <th className="border border-black p-2 font-bold w-32 text-left">Learning<br/>Checks/<br/>Assessments</th>
                        <th className="border border-black p-2 font-bold w-24 text-left">Reflections<br/>& Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.weeks.map((w, i) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-center align-top font-bold">{w.week}</td>
                          <td className="border border-black p-2 text-center align-top">{w.sessionNo}</td>
                          <td className="border border-black p-2 align-top">{w.title}</td>
                          <td className="border border-black p-2 align-top whitespace-pre-wrap">{w.outcome}</td>
                          <td className="border border-black p-2 align-top whitespace-pre-wrap">{w.trainerActivities}</td>
                          <td className="border border-black p-2 align-top whitespace-pre-wrap">{w.traineeActivities}</td>
                          <td className="border border-black p-2 align-top whitespace-pre-wrap">{w.resources}</td>
                          <td className="border border-black p-2 align-top whitespace-pre-wrap">{w.assessments}</td>
                          <td className="border border-black p-2 align-top whitespace-pre-wrap">{w.reflections}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Footer Section */}
                <div className="mt-12 flex justify-between text-sm font-bold">
                  <div className="flex gap-4">
                    <span>Prepared by: ALEXANDER KINOTI</span>
                    <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
                    <span>Sign: ........................</span>
                  </div>
                </div>
                <div className="mt-8 flex justify-between text-sm font-bold">
                  <div className="flex gap-4">
                    <span>Approved by: .................................................</span>
                    <span>Date: ........................</span>
                    <span>Sign: ........................</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}
    </TrainerLayout>
  );
}
