import { describe, it, expect } from "vitest";
import { generateExamWordHtml } from "../client/src/lib/exportExamWord";
import type { ExamPayload } from "../client/src/lib/supabase";

describe("TVET CDACC Word Document (.doc) Export Suite", () => {
  it("generates valid Word HTML for Cognitive Theory Examination", () => {
    const payload: ExamPayload = {
      title: "Apply Digital Literacy — Written Assessment 1",
      duration_minutes: 120,
      total_marks: 70,
      instructions: "Answer all questions in Section A and any two in Section B.",
      portal_visible: true,
      assessment_category: "CAT",
      task_code: "CT1",
      section_a: {
        title: "Section A: Multiple Choice Questions",
        instructions: "Answer all questions",
        total_marks: 40,
        questions: [
          {
            id: "q1",
            text: "Which of the following is an operating system?",
            type: "mcq",
            options: ["Linux", "HTML", "HTTP", "FTP"],
            correct_answer: 0,
            marks: 2,
            critical_aspect: "OS identification",
          },
        ],
      },
      section_b: {
        title: "Section B: Structured Questions",
        instructions: "Answer any two questions",
        total_marks: 30,
        questions: [
          {
            id: "q2",
            text: "Explain three differences between RAM and ROM.",
            type: "short_answer",
            correct_answer: "RAM is volatile, ROM is non-volatile...",
            marks: 15,
            critical_aspect: "Memory architecture",
          },
        ],
      },
    };

    const html = generateExamWordHtml({
      unitCode: "061155101A",
      courseName: "ICT Technician Level 6",
      unitName: "Apply Digital Literacy",
      classCode: "ADMIN5/6/S/24/J/S/25 MOD III",
      series: "MAY-AUG 2026",
      payload,
    });

    expect(html).toContain("Form MTTI/F/CUR/08");
    expect(html).toContain("MUKIRIA TECHNICAL TRAINING INSTITUTE");
    expect(html).toContain("061155101A");
    expect(html).toContain("Apply Digital Literacy — Written Assessment 1");
    expect(html).toContain("120 Minutes");
    expect(html).toContain("Which of the following is an operating system?");
    expect(html).toContain("<strong>(A)</strong> Linux");
    expect(html).toContain("Explain three differences between RAM and ROM.");
    expect(html).toContain("PREPARED &amp; ASSESSED BY:");
    expect(html).toContain("THIS IS THE LAST PRINTED PAGE");
  });

  it("generates valid Word HTML with Practical Observation Checklist for Practical assessments", () => {
    const payload: ExamPayload = {
      title: "Perform Computer Essentials Formative Assessment",
      duration_minutes: 180,
      total_marks: 100,
      instructions: "Perform computer maintenance and configuration following safety rules.",
      portal_visible: true,
      assessment_category: "PRACTICAL",
      task_code: "CP1",
      type: "practical" as any,
      checklist_items: [
        {
          step: "Inspect power supply and motherboard seating.",
          critical_aspect: "Safety verification",
          marks: 20,
        },
        {
          step: "Install and configure disk operating system.",
          critical_aspect: "Installation",
          marks: 40,
        },
      ],
    } as any;

    const html = generateExamWordHtml({
      unitCode: "IT/CU/ICTA/CR/01/4/MA",
      courseName: "Computer Essentials Level 4",
      unitName: "Perform Computer Essentials",
      classCode: "ICT4 MOD/S/2026",
      series: "JAN-APRIL 2026",
      payload,
    });

    expect(html).toContain("PRACTICAL PERFORMANCE ASSESSMENT &amp; OBSERVATION CHECKLIST");
    expect(html).toContain("Inspect power supply and motherboard seating.");
    expect(html).toContain("Install and configure disk operating system.");
    expect(html).toContain("IT/CU/ICTA/CR/01/4/MA");
  });
});
