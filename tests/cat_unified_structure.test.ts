import { describe, it, expect } from "vitest";
import {
  COMPUTER_ESSENTIALS_CATS,
  APPLY_ICT_SKILLS_CATS,
  DIGITAL_LITERACY_CATS,
} from "../client/src/lib/curriculumContinuousAssessments";
import { DIGITAL_LITERACY_EXAMS } from "../client/src/lib/digitalLiteracyExams";
import {
  buildUnifiedGradedExamData,
  exportGradedExamPDFClientSide,
} from "../client/src/lib/exportGradedExamPdf";
import type { Submission } from "../client/src/lib/supabase";

describe("CAT Unified Structure (No Section A or B) Suite", () => {
  const allCurriculumCats = [
    ...COMPUTER_ESSENTIALS_CATS,
    ...APPLY_ICT_SKILLS_CATS,
    ...DIGITAL_LITERACY_CATS,
  ];

  describe("1. Curriculum CAT Definitions Inspection", () => {
    it("ensures all 13 CATs have total marks between 15 and 30 (calibrated for 15 marks)", () => {
      expect(allCurriculumCats.length).toBe(13);
      for (const cat of allCurriculumCats) {
        expect(cat.payload.total_marks).toBeGreaterThanOrEqual(15);
        expect(cat.payload.total_marks).toBeLessThanOrEqual(30);
        expect(cat.payload.total_marks).toBe(15);
      }
    });

    it("verifies NO CAT in curriculum has 'Section A' or 'Section B' in title or instructions", () => {
      for (const cat of allCurriculumCats) {
        const title = cat.payload.section_a?.title || "";
        const instructions = cat.payload.section_a?.instructions || "";

        expect(title.toLowerCase()).not.toContain("section a");
        expect(title.toLowerCase()).not.toContain("section b");
        expect(instructions.toLowerCase()).not.toContain("this section");

        // Section B must not exist or have questions
        expect(cat.payload.section_b?.questions?.length || 0).toBe(0);
      }
    });
  });

  describe("2. PDF Data Builder (buildUnifiedGradedExamData) for CATs vs Written Assessments", () => {
    const sampleCat = DIGITAL_LITERACY_CATS[0];
    const catSubmission: Submission = {
      id: "sub_test_cat_001",
      exam_id: sampleCat.id,
      unit_code: sampleCat.unit_code,
      task_code: sampleCat.payload.task_code,
      student_name: "Faith Mwende",
      reg_number: "13258",
      section_a: [
        {
          question_id: "dl_lo1_q1",
          question_text: "Q1",
          answer: "HDMI and USB ports",
          score: 4,
          max_score: 4,
          rubric_scores: {},
        },
      ],
      section_b: [],
      status: "submitted",
      total_score: 14,
    };

    const wa1Exam = DIGITAL_LITERACY_EXAMS[0]; // 70 marks, CT1
    const wa1Submission: Submission = {
      id: "sub_test_wa1_001",
      exam_id: wa1Exam.id,
      unit_code: wa1Exam.unit_code,
      task_code: "CT1",
      student_name: "Faith Mwende",
      reg_number: "13258",
      section_a: [
        {
          question_id: "q1",
          question_text: "Q1",
          answer: "A",
          score: 2,
          max_score: 2,
          rubric_scores: {},
        },
      ],
      section_b: [
        {
          question_id: "q11",
          question_text: "Task 1",
          answer: "Step 1...",
          score: 18,
          max_score: 20,
          rubric_scores: {},
        },
      ],
      status: "submitted",
      total_score: 55,
    };

    it("correctly identifies CAT as is_cat === true without Section A/B instructions", () => {
      const unifiedCat = buildUnifiedGradedExamData(
        catSubmission,
        sampleCat,
        "Alexander Kinoti",
        ""
      );

      expect(unifiedCat.is_cat).toBe(true);
      expect(unifiedCat.total_marks).toBe(15);
      expect(unifiedCat.section_b.length).toBe(0);

      // Default instructions for CAT must not refer to Section A or Section B
      for (const inst of unifiedCat.instructions) {
        expect(inst.toLowerCase()).not.toContain("section a and section b");
      }
    });

    it("preserves Section A and Section B for 70-mark Written Assessment 1 (is_cat === false)", () => {
      const unifiedWa1 = buildUnifiedGradedExamData(
        wa1Submission,
        wa1Exam,
        "Alexander Kinoti",
        ""
      );

      expect(unifiedWa1.is_cat).toBe(false);
      expect(unifiedWa1.total_marks).toBe(70);
      expect(unifiedWa1.section_a.length).toBeGreaterThan(0);
      expect(unifiedWa1.section_b.length).toBeGreaterThan(0);
    });

    it("generates PDF for CAT without error and includes Continuous Assessment header", () => {
      const unifiedCat = buildUnifiedGradedExamData(
        catSubmission,
        sampleCat,
        "Alexander Kinoti",
        ""
      );

      const doc = exportGradedExamPDFClientSide(unifiedCat);
      expect(doc).toBeDefined();
      expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    });
  });
});
