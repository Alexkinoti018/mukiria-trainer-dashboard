import { describe, it, expect } from "vitest";
import plan0415Admin from "../client/src/data/learningPlans/plan_0415_451_12A_admin.json";
import {
  OFFICIAL_LEARNING_PLANS,
  getOfficialLearningPlan,
  convertRecordToLearningPlanDocument,
  type LearningPlanRecord,
} from "../client/src/data/learningPlans";

describe("Learning Plan Fidelity & Verbatim Digitization Suite (Form MTTI/F/CUR/02)", () => {
  const plan = plan0415Admin as LearningPlanRecord;

  describe("1. Metadata & Header Extraction Verbatim Fidelity", () => {
    it("should extract all official header fields exactly as written in source document", () => {
      expect(plan.metadata.formNumber).toBe("MTTI/F/CUR/02");
      expect(plan.metadata.institution).toBe("MUKIRIA TECHNICAL TRAINING INSTITUTE");
      expect(plan.metadata.unitTitle).toBe("APPLY ICT SKILLS");
      expect(plan.metadata.unitCode).toBe("0415 451 12A");
      expect(plan.metadata.trainerName).toBe("Lucy Kabura Njoroge");
      expect(plan.metadata.level).toBe("5,6");
      expect(plan.metadata.dateOfPreparation).toBe("01/05/2026");
      expect(plan.metadata.dateOfRevision).toBe("");
      expect(plan.metadata.numberOfTrainees).toBe(53);
      expect(plan.metadata.cohortCode).toBe("ADMIN5/6/S/24/J/S/25 MOD III");
    });

    it("should extract all 16 skills/job tasks verbatim without summarization", () => {
      expect(plan.metadata.skillsSummary.length).toBe(16);
      expect(plan.metadata.skillsSummary[0]).toBe("Operate computer devices");
      expect(plan.metadata.skillsSummary[1]).toBe("Solve tasks using Office suite");
      expect(plan.metadata.skillsSummary[2]).toBe("Manage Data and Information");
      expect(plan.metadata.skillsSummary[3]).toBe("Perform online communication and collaboration");
      expect(plan.metadata.skillsSummary[4]).toBe("Apply cyber security skills");
      expect(plan.metadata.skillsSummary[5]).toBe("Perform Online jobs");
      expect(plan.metadata.skillsSummary[6]).toBe("Apply job entry techniques");
      expect(plan.metadata.skillsSummary[7]).toBe("Exploring Modern Information and Communication Technology");
      expect(plan.metadata.skillsSummary[8]).toBe("Applying Computer Software Skills");
      expect(plan.metadata.skillsSummary[9]).toBe("Applying Online Skills");
      expect(plan.metadata.skillsSummary[10]).toBe("Applying Word Processing Skills");
      expect(plan.metadata.skillsSummary[11]).toBe("Applying Presentation Skills");
      expect(plan.metadata.skillsSummary[12]).toBe("Applying Spreadsheet Manipulation Skills");
      expect(plan.metadata.skillsSummary[13]).toBe("Applying Accounting Software Skills");
      expect(plan.metadata.skillsSummary[14]).toBe("Applying Database Management Software Skills");
      expect(plan.metadata.skillsSummary[15]).toBe(
        "Applying Desktop Publishing Skills and Applying Basic Computer Networking Skills."
      );
    });

    it("should extract all 17 element and performance criteria blocks with exact criteria counts", () => {
      expect(plan.metadata.elementsAndPerformanceCriteria.length).toBe(17);

      const elements = plan.metadata.elementsAndPerformanceCriteria;
      expect(elements[0].elementTitle).toBe("Operate computer devices");
      expect(elements[0].criteria.length).toBe(9);

      expect(elements[1].elementTitle).toBe("Solve tasks using Office suite");
      expect(elements[1].criteria.length).toBe(6);

      expect(elements[2].elementTitle).toBe("Manage data and information");
      expect(elements[2].criteria.length).toBe(5);

      expect(elements[3].elementTitle).toBe("Perform online communication and collaboration");
      expect(elements[3].criteria.length).toBe(4);

      expect(elements[4].elementTitle).toBe("Apply cyber security skills");
      expect(elements[4].criteria.length).toBe(4);

      expect(elements[5].elementTitle).toBe("Perform online jobs");
      expect(elements[5].criteria.length).toBe(7);

      expect(elements[6].elementTitle).toBe("Apply job entry techniques");
      expect(elements[6].criteria.length).toBe(5);

      expect(elements[7].elementTitle).toBe("Explore modern information and communication technology");
      expect(elements[7].criteria.length).toBe(6);

      expect(elements[8].elementTitle).toBe("Apply computer software skills");
      expect(elements[8].criteria.length).toBe(5);

      expect(elements[9].elementTitle).toBe("Apply online skills");
      expect(elements[9].criteria.length).toBe(8);

      expect(elements[10].elementTitle).toBe("Apply word processing skills");
      expect(elements[10].criteria.length).toBe(6);

      expect(elements[11].elementTitle).toBe("Apply presentation skills");
      expect(elements[11].criteria.length).toBe(5);

      expect(elements[12].elementTitle).toBe("Apply spreadsheet manipulation skills");
      expect(elements[12].criteria.length).toBe(7);

      expect(elements[13].elementTitle).toBe("Apply Accounting Software skills");
      expect(elements[13].criteria.length).toBe(4);

      expect(elements[14].elementTitle).toBe("Apply Database Management Software skills");
      expect(elements[14].criteria.length).toBe(8);

      expect(elements[15].elementTitle).toBe("Apply desktop publishing skills");
      expect(elements[15].criteria.length).toBe(7);

      expect(elements[16].elementTitle).toBe("Apply basic computer networking skills");
      expect(elements[16].criteria.length).toBe(4);

      const totalCriteria = elements.reduce((acc, el) => acc + el.criteria.length, 0);
      expect(totalCriteria).toBe(100);
    });

    it("should extract preparation and approval signatures verbatim", () => {
      expect(plan.metadata.preparedBy.name).toBe("Lucy Kabura Njoroge");
      expect(plan.metadata.preparedBy.date).toBe("01/05/2026");
      expect(plan.metadata.approvedBy.name).toBe("LYDIA KITHEKA");
      expect(plan.metadata.approvedBy.title).toBe("DP Academic");
    });
  });

  describe("2. Schedule Table Verbatim Fidelity & Row-for-Row Integrity", () => {
    it("should contain exactly 24 scheduled sessions across 12 full weeks", () => {
      expect(plan.schedule.length).toBe(24);

      // Verify each week from 1 to 12 has exactly 2 sessions
      for (let w = 1; w <= 12; w++) {
        const weekSessions = plan.schedule.filter((s) => s.week === w);
        expect(weekSessions.length).toBe(2);
        expect(weekSessions[0].sessionNumber).toBe("1&2");
        expect(weekSessions[1].sessionNumber).toBe("3&4");
      }
    });

    it("should preserve exact session titles row-for-row", () => {
      const titles = plan.schedule.map((s) => s.sessionTitle);
      expect(titles).toEqual([
        "Introduction to ICT and Digital Literacy",
        "Computer Components and Functions",
        "Operating Systems and File Management",
        "Keyboarding and Mouse Skills",
        "Introduction to Word Processing",
        "Document Editing and Formatting",
        "Tables and Graphics in Word Processing",
        "Printing and Page Setup",
        "Introduction to Spreadsheets",
        "Spreadsheet Formulae and Functions",
        "Charts and Data Presentation",
        "Spreadsheet Printing and Formatting",
        "Introduction to Presentation Software",
        "Slide Design and Formatting",
        "Multimedia and Slide Effects",
        "Online Communication Tools",
        "Online Collaboration Tools",
        "Internet Research and Data Management",
        "Cyber Security and Data Protection",
        "Social Media and Online Skills",
        "Database Management Skills",
        "Desktop Publishing Skills",
        "Computer Networking Basics",
        "Job Entry and Online Work Skills",
      ]);
    });

    it("should preserve exact learning outcomes text and line counts without truncation", () => {
      // Week 1, Session 1&2
      const s1 = plan.schedule[0];
      expect(s1.learningOutcomes).toContain(
        "Define digital literacy and ICT correctly by the end of the lesson."
      );
      expect(s1.learningOutcomes).toContain(
        "Identify at least 5 uses of computers in daily life and offices."
      );
      expect(s1.learningOutcomes).toContain(
        "Explain the importance of ICT skills with 80% accuracy during discussion."
      );

      // Week 5, Session 3&4 (Spreadsheet Formulae and Functions)
      const s10 = plan.schedule[9];
      expect(s10.sessionTitle).toBe("Spreadsheet Formulae and Functions");
      expect(s10.learningOutcomes).toContain(
        "Apply spreadsheet functions such as SUM and AVERAGE accurately."
      );
      expect(s10.learningOutcomes).toContain(
        "Calculate and present data correctly using formulas."
      );

      // Week 10, Session 3&4 (Social Media and Online Skills)
      const s20 = plan.schedule[19];
      expect(s20.sessionTitle).toBe("Social Media and Online Skills");
      expect(s20.traineeActivities).toEqual(["Trainee(s):", ""]);
    });

    it("should preserve exact trainer and trainee activities verbatim", () => {
      const s1 = plan.schedule[0];
      expect(s1.trainerActivities).toEqual([
        "Trainer:",
        "Introduce ICT concepts using examples.",
        "Explain importance of digital literacy.",
        "Demonstrate uses of computers in offices.",
      ]);
      expect(s1.traineeActivities).toEqual([
        "Trainee(s):",
        "Participate in discussion on ICT use.",
        "Identify areas where computers are used.",
        "Take notes on digital literacy concepts.",
      ]);

      const s9 = plan.schedule[8]; // Intro to Spreadsheets
      expect(s9.trainerActivities).toEqual([
        "Trainer:",
        "Demonstrate Excel interface.",
        "Explain spreadsheet terminology.",
        "Guide learners in data entry.",
      ]);
    });

    it("should preserve exact resources and assessment categories", () => {
      plan.schedule.forEach((session) => {
        expect(session.resourcesAndRefs.length).toBeGreaterThan(0);
        expect(session.assessments.length).toBeGreaterThan(0);
        expect(session.assessments).toContain("Knowledge");
        expect(session.assessments).toContain("Skills");
      });
    });
  });

  describe("3. Lookup & UI Model Conversion Integrity", () => {
    it("should successfully retrieve plan by unit code '0415 451 12A'", () => {
      const retrieved = getOfficialLearningPlan("0415 451 12A");
      expect(retrieved).toBeDefined();
      expect(retrieved?.metadata.cohortCode).toBe("ADMIN5/6/S/24/J/S/25 MOD III");
    });

    it("should successfully retrieve plan by cohort code 'ADMIN5/6/S/24/J/S/25 MOD III'", () => {
      const retrieved = getOfficialLearningPlan(undefined, "ADMIN5/6/S/24/J/S/25 MOD III");
      expect(retrieved).toBeDefined();
      expect(retrieved?.metadata.unitCode).toBe("0415 451 12A");
    });

    it("should convert LearningPlanRecord into LearningPlanDocument with correct week count and element titles", () => {
      const doc = convertRecordToLearningPlanDocument(plan);
      expect(doc.unitCode).toBe("0415 451 12A");
      expect(doc.classCode).toBe("ADMIN5/6/S/24/J/S/25 MOD III");
      expect(doc.trainerName).toBe("Lucy Kabura Njoroge");
      expect(doc.traineesCount).toBe(53);
      expect(doc.elements.length).toBe(17);
      expect(doc.weeks.length).toBe(24);
      expect(doc.weeks[0].title).toBe("Introduction to ICT and Digital Literacy");
      expect(doc.weeks[23].title).toBe("Job Entry and Online Work Skills");
    });

    it("should ensure all 5 official digitized plans are loaded into OFFICIAL_LEARNING_PLANS", () => {
      expect(OFFICIAL_LEARNING_PLANS.length).toBe(5);
      const unitCodes = OFFICIAL_LEARNING_PLANS.map((p) => p.metadata.unitCode);
      expect(unitCodes).toContain("0415 451 12A");
      expect(unitCodes).toContain("IT/CU/ICTA/CR/02/5/MA");
      expect(unitCodes).toContain("IT/OS/ICTA/BC/02/5/MA");
      expect(unitCodes).toContain("AGR/CU/EXT/BC/01/5/MA");
    });
  });
});
