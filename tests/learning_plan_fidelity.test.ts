import { describe, it, expect } from "vitest";
import plan0415Admin from "../client/src/data/learningPlans/plan_0415_451_12A_admin.json";
import planAgre6 from "../client/src/data/learningPlans/plan_AGR_CU_EXT_BC_01_5_MA_agre6.json";
import planFbp6 from "../client/src/data/learningPlans/plan_HOS_OS_FBO_BC_01_5_MA_fbp6.json";
import planIct4Itech6Ops from "../client/src/data/learningPlans/plan_IT_CU_ICTA_CR_02_4_MA_ict4_itech6.json";
import planItech6Install from "../client/src/data/learningPlans/plan_IT_CU_ICTA_CR_01_5_MA_itech6.json";
import planItech5Repair from "../client/src/data/learningPlans/plan_IT_CU_ICTA_CR_04_4_MA_itech5.json";
import planEe5DigitalLiteracy from "../client/src/data/learningPlans/plan_0611_441_02B_ee5.json";
import planItech5WorkEthics from "../client/src/data/learningPlans/plan_IT_OS_ICTA_BC_02_5_MA_itech5.json";
import planItech5InstallSoftware from "../client/src/data/learningPlans/plan_IT_OS_ICTA_CR_01_5_MA_itech5.json";
import planMisManageIS from "../client/src/data/learningPlans/plan_IT_OS_ICT_CR_8_6_mis.json";
import {
  OFFICIAL_LEARNING_PLANS,
  getOfficialLearningPlan,
  convertRecordToLearningPlanDocument,
  type LearningPlanRecord,
} from "../client/src/data/learningPlans";

describe("Learning Plan Fidelity & Verbatim Digitization Suite (Form MTTI/F/CUR/02)", () => {
  describe("Primary Plan: APPLY ICT SKILLS (0415 451 12A / ADMIN5/6/S/24/J/S/25 MOD III)", () => {
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

        const s10 = plan.schedule[9];
        expect(s10.sessionTitle).toBe("Spreadsheet Formulae and Functions");
        expect(s10.learningOutcomes).toContain(
          "Apply spreadsheet functions such as SUM and AVERAGE accurately."
        );
        expect(s10.learningOutcomes).toContain(
          "Calculate and present data correctly using formulas."
        );

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

        const s9 = plan.schedule[8];
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
  });

  describe("Official Plan: APPLY DIGITAL LITERACY (HOS/OS/FBO/BC/01/5/MA / FBP6/S/24/S/25)", () => {
    const fbpPlan = planFbp6 as LearningPlanRecord;

    it("should extract metadata verbatim for FBP6", () => {
      expect(fbpPlan.metadata.formNumber).toBe("MTTI/F/CUR/02");
      expect(fbpPlan.metadata.unitTitle).toBe("APPLY DIGITAL LITERACY.");
      expect(fbpPlan.metadata.unitCode).toBe("HOS/OS/FBO/BC/01/5/MA");
      expect(fbpPlan.metadata.trainerName).toBe("BEATRICE WANGUI MAINA");
      expect(fbpPlan.metadata.cohortCode).toBe("FBP6/S/24/S/25");
      expect(fbpPlan.metadata.numberOfTrainees).toBe(18);
      expect(fbpPlan.metadata.level).toBe("6");
    });

    it("should extract exactly 7 elements and 40 criteria for FBP6", () => {
      expect(fbpPlan.metadata.elementsAndPerformanceCriteria.length).toBe(7);
      const totalCriteria = fbpPlan.metadata.elementsAndPerformanceCriteria.reduce(
        (sum, el) => sum + el.criteria.length,
        0
      );
      expect(totalCriteria).toBe(40);
    });

    it("should contain exactly 12 weekly sessions with verbatim titles", () => {
      expect(fbpPlan.schedule.length).toBe(12);
      expect(fbpPlan.schedule[0].sessionTitle).toBe("Introduction to Computer Systems and Hardware");
      expect(fbpPlan.schedule[3].sessionTitle).toBe("Written Assessment 1");
      expect(fbpPlan.schedule[3].assessments).toContain("Attitudes");
      expect(fbpPlan.schedule[11].sessionTitle).toBe("Written assessment 3 ");
    });
  });

  describe("Official Plan: PERFORM COMPUTER OPERATIONS (IT/CU/ICTA/CR/02/4/MA / ICT4/ITECH6/M/26)", () => {
    const opsPlan = planIct4Itech6Ops as LearningPlanRecord;

    it("should extract metadata verbatim for ICT4/ITECH6", () => {
      expect(opsPlan.metadata.unitTitle).toBe("PERFORM COMPUTER OPERATIONS");
      expect(opsPlan.metadata.unitCode).toBe("IT/CU/ICTA/CR/02/4/MA");
      expect(opsPlan.metadata.trainerName).toBe("BEATRICE WANGUI MAINA");
      expect(opsPlan.metadata.level).toBe("4 & 6");
      expect(opsPlan.metadata.cohortCode).toBe("ICT4/ITECH6/M/26");
    });

    it("should extract exactly 7 elements and 31 criteria for Computer Operations", () => {
      expect(opsPlan.metadata.elementsAndPerformanceCriteria.length).toBe(7);
      const totalCriteria = opsPlan.metadata.elementsAndPerformanceCriteria.reduce(
        (sum, el) => sum + el.criteria.length,
        0
      );
      expect(totalCriteria).toBe(31);
    });

    it("should contain exactly 55 scheduled rows with ADMISSION WEEK as session 1", () => {
      expect(opsPlan.schedule.length).toBe(55);
      expect(opsPlan.schedule[0].sessionNumber).toBe("ADMISSION WEEK");
      expect(opsPlan.schedule[0].sessionTitle).toBe("ADMISSION WEEK");
      expect(opsPlan.schedule[1].sessionTitle).toBe(
        "Introduction to Computer Operations & Word Processing Basics"
      );
      expect(opsPlan.schedule[54].sessionTitle).toBe("Practical Assessment 3");
    });
  });

  describe("Official Plan: INSTALL COMPUTER SOFTWARE (IT/CU/ICTA/CR/01/5/MA / ITECH6/S/25)", () => {
    const installPlan = planItech6Install as LearningPlanRecord;

    it("should extract metadata verbatim for ITECH6 Install Software", () => {
      expect(installPlan.metadata.unitTitle).toBe("INSTALL COMPUTER SOFTWARE");
      expect(installPlan.metadata.unitCode).toBe("IT/CU/ICTA/CR/01/5/MA");
      expect(installPlan.metadata.trainerName).toBe("BEATRICE WANGUI MAINA");
      expect(installPlan.metadata.numberOfTrainees).toBe(36);
      expect(installPlan.metadata.cohortCode).toBe("ITECH6/S/25");
      expect(installPlan.metadata.level).toBe("6");
    });

    it("should extract exactly 3 elements and 14 criteria for Install Software", () => {
      expect(installPlan.metadata.elementsAndPerformanceCriteria.length).toBe(3);
      expect(installPlan.metadata.elementsAndPerformanceCriteria[0].elementTitle).toBe(
        "1. Install Computer software"
      );
      expect(installPlan.metadata.elementsAndPerformanceCriteria[0].criteria.length).toBe(6);
      expect(installPlan.metadata.elementsAndPerformanceCriteria[1].elementTitle).toBe(
        "2. Test computer software functionality."
      );
      expect(installPlan.metadata.elementsAndPerformanceCriteria[1].criteria.length).toBe(3);
      expect(installPlan.metadata.elementsAndPerformanceCriteria[2].elementTitle).toBe(
        "3. Perform software maintenance."
      );
      expect(installPlan.metadata.elementsAndPerformanceCriteria[2].criteria.length).toBe(5);
    });

    it("should contain exactly 46 scheduled sessions across 12 weeks", () => {
      expect(installPlan.schedule.length).toBe(46);
      expect(installPlan.schedule[0].sessionTitle).toBe("Introduction to Computer Software");
      expect(installPlan.schedule[45].sessionTitle).toBe("Practical Assessment 3");
    });
  });

  describe("Official Plan: PERFORM COMPUTER REPAIR AND MAINTENANCE (IT/CU/ICTA/CR/04/4/MA / ITECH5/J/26)", () => {
    const repairPlan = planItech5Repair as LearningPlanRecord;

    it("should extract metadata verbatim for Computer Repair", () => {
      expect(repairPlan.metadata.unitTitle).toBe("PERFORM COMPUTER REPAIR AND MAINTENANCE");
      expect(repairPlan.metadata.unitCode).toBe("IT/CU/ICTA/CR/04/4/MA");
      expect(repairPlan.metadata.trainerName).toBe("Jackline Waithira Comba");
      expect(repairPlan.metadata.numberOfTrainees).toBe(20);
      expect(repairPlan.metadata.cohortCode).toBe("ITECH5/J/26");
      expect(repairPlan.metadata.level).toBe("5");
    });

    it("should extract exactly 4 elements and 14 criteria for Repair and Maintenance", () => {
      expect(repairPlan.metadata.elementsAndPerformanceCriteria.length).toBe(4);
      const totalCriteria = repairPlan.metadata.elementsAndPerformanceCriteria.reduce(
        (sum, el) => sum + el.criteria.length,
        0
      );
      expect(totalCriteria).toBe(14);
    });

    it("should contain exactly 72 scheduled sessions across 12 weeks", () => {
      expect(repairPlan.schedule.length).toBe(72);
      expect(repairPlan.schedule[0].sessionTitle).toBe(
        "Introduction to Computer Repair & User Data Assessment"
      );
      expect(repairPlan.schedule[71].sessionTitle).toBe("Unit Conclusion");
    });
  });

  describe("Official Plan: Apply Digital Literacy (0611 441 02B / EE5/S/25A)", () => {
    const ee5Plan = planEe5DigitalLiteracy as LearningPlanRecord;

    it("should extract metadata verbatim for EE5 Digital Literacy", () => {
      expect(ee5Plan.metadata.unitTitle).toBe("Apply Digital Literacy");
      expect(ee5Plan.metadata.unitCode).toBe("0611 441 02B");
      expect(ee5Plan.metadata.trainerName).toBe("Jackline Comba");
      expect(ee5Plan.metadata.numberOfTrainees).toBe(25);
      expect(ee5Plan.metadata.cohortCode).toBe("EE5/S/25A");
      expect(ee5Plan.metadata.level).toBe("5");
    });

    it("should extract exactly 6 elements and 35 criteria", () => {
      expect(ee5Plan.metadata.elementsAndPerformanceCriteria.length).toBe(6);
      const totalCriteria = ee5Plan.metadata.elementsAndPerformanceCriteria.reduce(
        (sum, el) => sum + el.criteria.length,
        0
      );
      expect(totalCriteria).toBe(35);
    });

    it("should contain exactly 12 weekly sessions", () => {
      expect(ee5Plan.schedule.length).toBe(12);
      expect(ee5Plan.schedule[0].sessionTitle).toBe(
        "Introduction to Computer Devices and Digital Literacy"
      );
      expect(ee5Plan.schedule[11].sessionTitle).toBe("CAT 3 (Final Assessment)");
    });
  });

  describe("Official Plan: APPLY WORK ETHICS AND PRACTICES (IT/OS/ICTA/BC/02/5/MA / ITECH5/S/25)", () => {
    const ethicsPlan = planItech5WorkEthics as LearningPlanRecord;

    it("should extract metadata verbatim for ITECH5 Work Ethics", () => {
      expect(ethicsPlan.metadata.unitTitle).toBe("APPLY WORK ETHICS AND PRACTICES");
      expect(ethicsPlan.metadata.unitCode).toBe("IT/OS/ICTA/BC/02/5/MA");
      expect(ethicsPlan.metadata.trainerName).toBe("Jackline Comba");
      expect(ethicsPlan.metadata.numberOfTrainees).toBe(25);
      expect(ethicsPlan.metadata.cohortCode).toBe("ITECH5/S/25");
      expect(ethicsPlan.metadata.level).toBe("5");
    });

    it("should extract exactly 6 elements and 40 criteria", () => {
      expect(ethicsPlan.metadata.elementsAndPerformanceCriteria.length).toBe(6);
      const totalCriteria = ethicsPlan.metadata.elementsAndPerformanceCriteria.reduce(
        (sum, el) => sum + el.criteria.length,
        0
      );
      expect(totalCriteria).toBe(40);
    });

    it("should contain exactly 12 weekly sessions", () => {
      expect(ethicsPlan.schedule.length).toBe(12);
      expect(ethicsPlan.schedule[0].sessionTitle).toBe("Applying Self-Management Skills - Part 1");
      expect(ethicsPlan.schedule[11].sessionTitle).toBe("Written CAT 3 (Final)");
    });
  });

  describe("Official Plan: INSTALL COMPUTER SOFTWARE (IT/OS/ICTA/CR/01/5/MA / ITECH5/S/25)", () => {
    const installItech5 = planItech5InstallSoftware as LearningPlanRecord;

    it("should extract metadata verbatim for ITECH5 Install Software", () => {
      expect(installItech5.metadata.unitTitle).toBe("INSTALL COMPUTER SOFTWARE");
      expect(installItech5.metadata.unitCode).toBe("IT/OS/ICTA/CR/01/5/MA");
      expect(installItech5.metadata.trainerName).toBe("Jackline Waithira");
      expect(installItech5.metadata.numberOfTrainees).toBe(25);
      expect(installItech5.metadata.cohortCode).toBe("ITECH5/S/25");
      expect(installItech5.metadata.level).toBe("5");
    });

    it("should extract exactly 3 elements and 14 criteria", () => {
      expect(installItech5.metadata.elementsAndPerformanceCriteria.length).toBe(3);
      const totalCriteria = installItech5.metadata.elementsAndPerformanceCriteria.reduce(
        (sum, el) => sum + el.criteria.length,
        0
      );
      expect(totalCriteria).toBe(14);
    });

    it("should contain exactly 48 scheduled sessions across 12 weeks", () => {
      expect(installItech5.schedule.length).toBe(48);
      expect(installItech5.schedule[0].sessionTitle).toBe(
        "Introduction to Computer Software & User Needs"
      );
      expect(installItech5.schedule[47].sessionTitle).toBe("Written CAT 3 (Final)");
    });
  });

  describe("Official Plan: MANAGE INFORMATION SYSTEM (IT/OS/ICT/CR/8/6)", () => {
    const misPlan = planMisManageIS as LearningPlanRecord;

    it("should extract metadata verbatim for MIS", () => {
      expect(misPlan.metadata.unitTitle).toBe("MANAGE INFORMATION SYSTEM");
      expect(misPlan.metadata.unitCode).toBe("IT/OS/ICT/CR/8/6");
      expect(misPlan.metadata.trainerName).toBe("JACKLINE WAITHIRA");
      expect(misPlan.metadata.level).toBe("6");
    });

    it("should extract exactly 5 elements and 24 criteria", () => {
      expect(misPlan.metadata.elementsAndPerformanceCriteria.length).toBe(5);
      const totalCriteria = misPlan.metadata.elementsAndPerformanceCriteria.reduce(
        (sum, el) => sum + el.criteria.length,
        0
      );
      expect(totalCriteria).toBe(24);
    });

    it("should contain exactly 24 scheduled sessions across 12 weeks", () => {
      expect(misPlan.schedule.length).toBe(24);
      expect(misPlan.schedule[0].sessionTitle).toBe("Introduction to Information System Concepts");
      expect(misPlan.schedule[23].sessionTitle).toBe("Written CAT 3 (Final)");
    });
  });

  describe("Lookup & UI Model Conversion Integrity", () => {
    it("should ensure all 13 official digitized plans are loaded into OFFICIAL_LEARNING_PLANS", () => {
      expect(OFFICIAL_LEARNING_PLANS.length).toBe(13);
    });

    it("should successfully retrieve plan by unit code 'IT/CU/ICTA/CR/04/4/MA'", () => {
      const retrieved = getOfficialLearningPlan("IT/CU/ICTA/CR/04/4/MA");
      expect(retrieved).toBeDefined();
      expect(retrieved?.metadata.cohortCode).toBe("ITECH5/J/26");
    });

    it("should successfully retrieve plan by cohort code 'EE5/S/25A'", () => {
      const retrieved = getOfficialLearningPlan(undefined, "EE5/S/25A");
      expect(retrieved).toBeDefined();
      expect(retrieved?.metadata.unitCode).toBe("0611 441 02B");
    });

    it("should successfully retrieve plan by unit code 'IT/OS/ICT/CR/8/6'", () => {
      const retrieved = getOfficialLearningPlan("IT/OS/ICT/CR/8/6");
      expect(retrieved).toBeDefined();
      expect(retrieved?.metadata.unitTitle).toBe("MANAGE INFORMATION SYSTEM");
    });
  });
});
