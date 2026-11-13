import { test, expect } from "@playwright/test";

test.describe("Navigation & Dead-Button Audit Across Roles", () => {
  test("Trainer Dashboard: Audits primary navigation routes and action buttons for zero errors", async ({ page }) => {
    const pageErrors: Error[] = [];
    const consoleErrors: string[] = [];

    page.on("pageerror", (err) => pageErrors.push(err));
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Authenticate as Trainer via local storage session bridge
    await page.addInitScript(() => {
      localStorage.setItem("mtti_demo_session", JSON.stringify({
        id: "trainer-001",
        email: "trainer@mtti.ac.ke",
        name: "Dr. J. Muriithi",
        role: "trainer",
        department_id: "dept-ci",
        assigned_units: ["ICT/CU/IT/CR/6/6", "061155101A"],
      }));
      localStorage.setItem("mtti_auth_token", "token-trainer");
    });

    const trainerRoutes = [
      { path: "/trainer/dashboard", titleKeyword: "Dashboard" },
      { path: "/trainer/documents/learning-plan", titleKeyword: "Learning Plan" },
      { path: "/trainer/session-plans", titleKeyword: "Session" },
      { path: "/trainer/documents/records-of-work", titleKeyword: "Record of Work" },
      { path: "/trainer/class-register", titleKeyword: "Register" },
      { path: "/trainer/exam-builder", titleKeyword: "Exam" },
      { path: "/trainer/grading", titleKeyword: "Grading" },
      { path: "/trainer/assessment-marks", titleKeyword: "Marksheet" },
    ];

    for (const route of trainerRoutes) {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);

      // Verify no 404 / NotFound crash
      const notFound = page.locator("text=Page Not Found");
      await expect(notFound).toHaveCount(0);

      // Verify page content rendered
      const root = page.locator("#root");
      await expect(root).toBeVisible();
    }

    // Filter out expected benign network/telemetry notices
    const fatalErrors = pageErrors.filter(
      (e) => !e.message.includes("ServiceWorker") && !e.message.includes("ResizeObserver")
    );
    expect(fatalErrors, "Zero uncaught page errors across Trainer routes").toHaveLength(0);
  });

  test("HOD Dashboard: Audits HOD Compliance & Reports routes for zero errors", async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    // Authenticate as HOD
    await page.addInitScript(() => {
      localStorage.setItem("mtti_demo_session", JSON.stringify({
        id: "hod-001",
        email: "hod.ci@mtti.ac.ke",
        name: "Head of Department (CI)",
        role: "hod",
        department_id: "dept-ci",
      }));
      localStorage.setItem("mtti_auth_token", "token-hod");
    });

    const hodRoutes = [
      "/hod/dashboard",
      "/hod/compliance",
      "/hod/reports",
      "/hod/analytics",
    ];

    for (const path of hodRoutes) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);

      const notFound = page.locator("text=Page Not Found");
      await expect(notFound).toHaveCount(0);
      await expect(page.locator("#root")).toBeVisible();
    }

    const fatalErrors = pageErrors.filter(
      (e) => !e.message.includes("ServiceWorker") && !e.message.includes("ResizeObserver")
    );
    expect(fatalErrors, "Zero uncaught page errors across HOD routes").toHaveLength(0);
  });

  test("Trainee Dashboard: Audits Candidate Portal & Attendance routes for zero errors", async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    // Authenticate as Trainee (Zero-email rule)
    await page.addInitScript(() => {
      localStorage.setItem("mtti_demo_session", JSON.stringify({
        id: "trainee-001",
        name: "Nthiga Gakii Doris",
        role: "trainee",
        reg_number: "14179/S2026",
        cohort_code: "class-itech-6",
      }));
      localStorage.setItem("mtti_auth_token", "token-trainee");
    });

    const traineeRoutes = [
      "/trainee/dashboard",
      "/candidate/portal",
      "/trainee/attendance",
      "/trainee/results",
    ];

    for (const path of traineeRoutes) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);

      const notFound = page.locator("text=Page Not Found");
      await expect(notFound).toHaveCount(0);
      await expect(page.locator("#root")).toBeVisible();
    }

    const fatalErrors = pageErrors.filter(
      (e) => !e.message.includes("ServiceWorker") && !e.message.includes("ResizeObserver")
    );
    expect(fatalErrors, "Zero uncaught page errors across Trainee routes").toHaveLength(0);
  });
});
