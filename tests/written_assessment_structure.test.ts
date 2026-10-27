import { describe, it, expect } from "vitest";
import { validateExamCompliance, EMPTY_PAYLOAD } from "../client/src/pages/ExamBuilder";
import type { ExamPayload } from "../client/src/lib/supabase";

describe("Written Assessment Setting & Structure Verification Suite", () => {
  it("initializes EMPTY_PAYLOAD with Section B configured as Extended Essay / Structured questions", () => {
    const payload = EMPTY_PAYLOAD();
    expect(payload.section_b).toBeDefined();
    expect(payload.section_b?.title).toContain("Extended Essay / Structured");
    expect(payload.section_b?.questions.length).toBeGreaterThan(0);

    const firstQ = payload.section_b?.questions[0];
    expect(firstQ?.type).toBe("structured");
    expect(firstQ?.type).not.toBe("short_answer");
  });

  it("Level 5 & 6: requires Section A to be Short Answer and Section B to be Extended Essay / Structured", () => {
    // Valid Level 6 written assessment: Sec A (40m short answer) + Sec B (60m essay/structured)
    const validPayload: ExamPayload = {
      title: "Written Assessment 1 — Advanced Network Design",
      duration_minutes: 120,
      total_marks: 100,
      instructions: "Answer ALL questions in Section A and ANY THREE in Section B.",
      type: "written",
      assessment_category: "Exam",
      task_code: "CT1",
      section_a: {
        title: "Section A — Short Answer",
        instructions: "Answer all questions.",
        total_marks: 40,
        questions: Array.from({ length: 10 }, (_, i) => ({
          id: `qa_${i + 1}`,
          text: `Define concept ${i + 1}`,
          type: "short_answer",
          marks: 4,
          critical_aspect: "Concept comprehension",
        })),
      },
      section_b: {
        title: "Section B — Extended Essay / Structured Questions",
        instructions: "Answer ANY THREE questions.",
        total_marks: 60,
        questions: [
          {
            id: "qb_1",
            text: "Discuss the enterprise network migration plan in detail.",
            type: "essay",
            marks: 20,
            critical_aspect: "Migration planning",
          },
          {
            id: "qb_2",
            text: "Structured problem: Troubleshoot BGP routing convergence.",
            type: "structured",
            marks: 20,
            critical_aspect: "Troubleshooting procedures",
          },
          {
            id: "qb_3",
            text: "Explain zero-trust architecture deployment in hybrid cloud.",
            type: "essay",
            marks: 20,
            critical_aspect: "Zero-trust principles",
          },
        ],
      },
    };

    const errors = validateExamCompliance(6, validPayload);
    expect(errors).toHaveLength(0);

    // If Section B is incorrectly configured with short_answer like Section A
    const invalidPayload: ExamPayload = {
      ...validPayload,
      section_b: {
        ...validPayload.section_b!,
        questions: [
          {
            id: "qb_1",
            text: "Short answer question in section B",
            type: "short_answer",
            marks: 20,
            critical_aspect: "Aspect",
          },
          ...validPayload.section_b!.questions.slice(1),
        ],
      },
    };

    const invalidErrors = validateExamCompliance(6, invalidPayload);
    expect(invalidErrors.some((e) => e.includes("Section B must contain only Extended Essay / Structured questions"))).toBe(true);
  });

  it("Level 3: requires Section B to be Extended Essay / Structured questions instead of short answer", () => {
    // Valid Level 3: Sec A (20m short answer) + Sec B (30m structured/essay)
    const validLevel3: ExamPayload = {
      title: "Written Assessment 1 — Computer Operations",
      duration_minutes: 90,
      total_marks: 50,
      instructions: "Answer ALL in Section A and ANY TWO in Section B.",
      type: "written",
      assessment_category: "Exam",
      task_code: "CT1",
      section_a: {
        title: "Section A — Short Answer",
        instructions: "Answer all questions.",
        total_marks: 20,
        questions: Array.from({ length: 5 }, (_, i) => ({
          id: `qa_${i + 1}`,
          text: `Identify operational rule ${i + 1}`,
          type: "short_answer",
          marks: 4,
          critical_aspect: "Rule identification",
        })),
      },
      section_b: {
        title: "Section B — Extended Essay / Structured Questions",
        instructions: "Answer any two questions.",
        total_marks: 30,
        questions: [
          {
            id: "qb_1",
            text: "Structured practical workflow for system assembly.",
            type: "structured",
            marks: 15,
            critical_aspect: "Assembly workflow",
          },
          {
            id: "qb_2",
            text: "Explain workplace safety guidelines during power installation.",
            type: "essay",
            marks: 15,
            critical_aspect: "Safety protocol",
          },
        ],
      },
    };

    const errors = validateExamCompliance(3, validLevel3);
    expect(errors).toHaveLength(0);

    // If Section B contains short_answer
    const invalidLevel3: ExamPayload = {
      ...validLevel3,
      section_b: {
        ...validLevel3.section_b!,
        questions: [
          {
            id: "qb_1",
            text: "Short answer question in Section B",
            type: "short_answer",
            marks: 15,
            critical_aspect: "Aspect",
          },
          validLevel3.section_b!.questions[1],
        ],
      },
    };

    const invalidErrors = validateExamCompliance(3, invalidLevel3);
    expect(invalidErrors.some((e) => e.includes("Section B must contain only Extended Essay / Structured questions"))).toBe(true);
  });

  it("Level 4: requires Section B to be Extended Essay / Structured questions instead of short answer", () => {
    // Valid Level 4: Sec A (10m MCQs) + Sec B (40m structured/essay)
    const validLevel4: ExamPayload = {
      title: "Written Assessment 1 — IT Essentials",
      duration_minutes: 90,
      total_marks: 50,
      instructions: "Answer ALL in Section A and ANY TWO in Section B.",
      type: "written",
      assessment_category: "Exam",
      task_code: "CT1",
      section_a: {
        title: "Section A — MCQs",
        instructions: "Answer all MCQs.",
        total_marks: 10,
        questions: Array.from({ length: 5 }, (_, i) => ({
          id: `qa_${i + 1}`,
          text: `Which option describes device ${i + 1}?`,
          type: "mcq",
          marks: 2,
          critical_aspect: "Hardware selection",
        })),
      },
      section_b: {
        title: "Section B — Extended Essay / Structured Questions",
        instructions: "Answer any two questions.",
        total_marks: 40,
        questions: [
          {
            id: "qb_1",
            text: "Analyze network topology scenarios and recommend implementation.",
            type: "structured",
            marks: 20,
            critical_aspect: "Topology configuration",
          },
          {
            id: "qb_2",
            text: "Detailed essay on operating system kernel architectures.",
            type: "essay",
            marks: 20,
            critical_aspect: "OS architecture",
          },
        ],
      },
    };

    const errors = validateExamCompliance(4, validLevel4);
    expect(errors).toHaveLength(0);

    // If Section B contains short_answer
    const invalidLevel4: ExamPayload = {
      ...validLevel4,
      section_b: {
        ...validLevel4.section_b!,
        questions: [
          {
            id: "qb_1",
            text: "Short answer question in Section B",
            type: "short_answer",
            marks: 20,
            critical_aspect: "Aspect",
          },
          validLevel4.section_b!.questions[1],
        ],
      },
    };

    const invalidErrors = validateExamCompliance(4, invalidLevel4);
    expect(invalidErrors.some((e) => e.includes("Section B must contain only Extended Essay / Structured questions"))).toBe(true);
  });
});
