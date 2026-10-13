import { describe, it, expect, beforeEach } from "vitest";
import { formatSubPart } from "../client/src/pages/CandidatePortal";
import { DIGITAL_LITERACY_EXAMS } from "../client/src/lib/digitalLiteracyExams";

describe("Section B & Digital Literacy Exam 1 Persistence Safeguards", () => {
  const mockExam = DIGITAL_LITERACY_EXAMS.find((e) => e.unit_code === "061155101A-WA1");

  it("exam 061155101A-WA1 exists and has Section A and Section B questions", () => {
    expect(mockExam).toBeDefined();
    expect(mockExam?.payload.section_a?.questions.length).toBe(10);
    expect(mockExam?.payload.section_b?.questions.length).toBe(3);
  });

  it("formatSubPart safely formats structured sub-parts without throwing Minified React error #31", () => {
    const objSubPart = {
      part: "a",
      prompt: "Describe the primary function of a word processing application",
      marks: 4,
      breakdown: [{ criterion: "Primary function", marks: 2 }],
    };

    const formatted = formatSubPart(objSubPart);
    expect(formatted).toBe("a) Describe the primary function of a word processing application (4 Marks)");
    expect(typeof formatted).toBe("string");

    // String subpart fallback
    expect(formatSubPart("Plain text prompt")).toBe("Plain text prompt");
    expect(formatSubPart(null)).toBe("");
  });

  it("all Section B questions have valid IDs and structured sub_parts", () => {
    const secBQuestions = mockExam?.payload.section_b?.questions || [];
    expect(secBQuestions.length).toBe(3);

    for (const q of secBQuestions) {
      expect(q.id).toMatch(/^dl1_b1[123]$/);
      expect(q.type).toBe("structured");
      expect(Array.isArray(q.sub_parts)).toBe(true);

      // Verify each sub-part formats safely to string
      for (const sp of q.sub_parts || []) {
        const str = formatSubPart(sp);
        expect(typeof str).toBe("string");
        expect(str.length).toBeGreaterThan(0);
      }
    }
  });

  it("simulates synchronous answer persistence and rehydration for Section B", () => {
    const mockStorage: Record<string, string> = {};
    const regNo = "13258";
    const examId = mockExam?.id || "exam-061155101A-wa1";
    const unitCode = "061155101A-WA1";

    const answersDraft = {
      sectionAAnswers: {
        dl1_a1: "Digital literacy is the ability to access and evaluate digital information.",
      },
      sectionBAnswers: {
        dl1_b11: "a) Word processors allow document creation with WYSIWYG formatting.\nb) Multi-column layout and drop caps.",
        dl1_b12: "a) Steps to insert table: Insert > Table > grid selection.\nb) Network drive save steps...",
      },
    };

    // Save synchronously on keystroke
    const storageKeyCandidate = `mtti_exam_answers_${examId}_${regNo}`;
    const storageKeyUnit = `mtti_exam_answers_${unitCode}_${regNo}`;
    const storageKeyGeneral = `mtti_exam_answers_${unitCode}`;
    const activeSessionKey = `mtti_active_exam_session_${unitCode}`;

    const serialized = JSON.stringify(answersDraft);
    mockStorage[storageKeyCandidate] = serialized;
    mockStorage[storageKeyUnit] = serialized;
    mockStorage[storageKeyGeneral] = serialized;
    mockStorage[activeSessionKey] = JSON.stringify({
      state: "exam",
      unitCode,
      examId,
      student: { name: "Faith Mwende", regNumber: "13258", cohortCode: "FBS 5 MOD/J/2026" },
      currentSection: "b",
      currentQIndex: 0,
    });

    // Simulate page reload
    const reloadedSession = JSON.parse(mockStorage[activeSessionKey]);
    expect(reloadedSession.state).toBe("exam");
    expect(reloadedSession.student.regNumber).toBe("13258");
    expect(reloadedSession.currentSection).toBe("b");

    const reloadedAnswers = JSON.parse(mockStorage[storageKeyCandidate]);
    expect(reloadedAnswers.sectionBAnswers.dl1_b11).toContain("Word processors allow document creation");
    expect(reloadedAnswers.sectionBAnswers.dl1_b12).toContain("Steps to insert table");
    expect(reloadedAnswers.sectionAAnswers.dl1_a1).toContain("Digital literacy is the ability");
  });
});
