import { describe, it, expect, vi } from "vitest";
import jsPDF from "jspdf";
import {
  formatMarkingSchemeItem,
  formatMarkingSchemeList,
  buildUnifiedGradedExamData,
  exportGradedExamPDFClientSide,
} from "../client/src/lib/exportGradedExamPdf";
import { DIGITAL_LITERACY_EXAMS } from "../client/src/lib/digitalLiteracyExams";
import { FBS_COHORT_SUBMISSIONS } from "../client/src/lib/fbsCohortSubmissions";

describe("Graded Exam PDF Generator & Marking Scheme Serialization", () => {
  describe("formatMarkingSchemeItem & formatMarkingSchemeList", () => {
    it("handles null, undefined, and non-object values gracefully", () => {
      expect(formatMarkingSchemeItem(null)).toBe("");
      expect(formatMarkingSchemeItem(undefined)).toBe("");
      expect(formatMarkingSchemeItem("Valid Criterion")).toBe("Valid Criterion");
      expect(formatMarkingSchemeItem(123)).toBe("123");
    });

    it("correctly extracts text from criterion, point, description, text, or expectedAnswer objects", () => {
      expect(formatMarkingSchemeItem({ criterion: "Definition of digital literacy", marks: 1 })).toBe(
        "Definition of digital literacy"
      );
      expect(formatMarkingSchemeItem({ point: "Point 1: Save files" })).toBe("Point 1: Save files");
      expect(formatMarkingSchemeItem({ description: "Clean explanation" })).toBe("Clean explanation");
      expect(formatMarkingSchemeItem({ text: "Text item" })).toBe("Text item");
      expect(formatMarkingSchemeItem({ expectedAnswer: "Expected output" })).toBe("Expected output");
    });

    it("serializes lists of criteria without '[object Object]'", () => {
      const items = [
        { criterion: "Definition of digital literacy", marks: 1 },
        { criterion: "Workplace importance & productivity benefit", marks: 1 },
      ];
      const result = formatMarkingSchemeList(items);
      expect(result).not.toContain("[object Object]");
      expect(result).toBe("Definition of digital literacy | Workplace importance & productivity benefit");
    });

    it("returns 'Not specified' for empty or non-array lists", () => {
      expect(formatMarkingSchemeList([])).toBe("Not specified");
      expect(formatMarkingSchemeList(null as any)).toBe("Not specified");
    });
  });

  describe("buildUnifiedGradedExamData & Question Sanitization", () => {
    const exam = DIGITAL_LITERACY_EXAMS.find((e) => e.id === "exam-061155101A-wa1")!;
    const submission = FBS_COHORT_SUBMISSIONS[0];

    it("builds unified exam data with non-null structure", () => {
      const unified = buildUnifiedGradedExamData(submission, exam, "Alexander Kinoti");
      expect(unified).toBeDefined();
      expect(unified.student_name).toBe(submission.student_name);
      expect(unified.section_a.length).toBeGreaterThan(0);
      expect(unified.section_b.length).toBeGreaterThan(0);
    });

    it("ensures Section B questions have no double numbering like 'Q11. 11.'", () => {
      const unified = buildUnifiedGradedExamData(submission, exam, "Alexander Kinoti");
      const q11 = unified.section_b.find((q) => Number(q.q_num) === 11);
      expect(q11).toBeDefined();

      // The text must not start with "11." or "Q11."
      expect(q11!.text).not.toMatch(/^(?:Q\s*)?11[\.\)]/i);
      expect(q11!.text).not.toContain("11.\na)");
    });

    it("ensures sub-parts in Section B are cleanly extracted and not duplicated in the question prompt", () => {
      const unified = buildUnifiedGradedExamData(submission, exam, "Alexander Kinoti");
      const q11 = unified.section_b.find((q) => Number(q.q_num) === 11);
      expect(q11).toBeDefined();

      // Check sub_parts array
      expect(q11!.sub_parts).toBeDefined();
      expect(q11!.sub_parts!.length).toBe(4);
      expect(q11!.sub_parts![0]).toMatch(/^a\)/);
      expect(q11!.sub_parts![1]).toMatch(/^b\)/);

      // Check prompt title does not duplicate the entire subpart list
      expect(q11!.text).not.toContain("a) Describe the primary function");
    });

    it("ensures all breakdown items in Section A and B are serialized strings, never '[object Object]'", () => {
      const unified = buildUnifiedGradedExamData(submission, exam, "Alexander Kinoti");
      
      for (const q of [...unified.section_a, ...unified.section_b]) {
        if (q.breakdown) {
          for (const item of q.breakdown) {
            expect(typeof item).toBe("string");
            expect(item).not.toContain("[object Object]");
          }
        }
      }
    });

    it("successfully runs exportGradedExamPDFClientSide without throwing errors and saves correct filename", () => {
      const unified = buildUnifiedGradedExamData(submission, exam, "Alexander Kinoti");
      
      const customDoc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const savedFiles: string[] = [];
      customDoc.save = (filename: string) => {
        savedFiles.push(filename);
      };

      expect(() => {
        exportGradedExamPDFClientSide(unified, customDoc);
      }).not.toThrow();

      expect(savedFiles.length).toBe(1);
      expect(savedFiles[0]).toMatch(/^MTTI_GradedExam_061155101A-WA1_.*\.pdf$/);
    });
  });
});
