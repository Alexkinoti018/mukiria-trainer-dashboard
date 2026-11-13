import { test, expect } from "@playwright/test";

test.describe("Trainee Zero-Email Exam Flow & Security Shielding", () => {
  test("authenticates via admission number, verifies answer key column shielding, submits, and verifies locked state on reload", async ({ page }) => {
    let interceptedExamPayload: any = null;

    // Monitor all exam API responses to verify DevTools network response column shielding
    page.on("response", async (response) => {
      if (response.url().includes("/api/exams") && response.request().method() === "GET") {
        try {
          const json = await response.json();
          interceptedExamPayload = json;
        } catch {}
      }
    });

    // ── 1. Zero-Email Admission Login ──
    await page.goto("/login");
    await page.waitForTimeout(500);

    // If multi-tab login exists, ensure Trainee Portal tab is selected
    const traineeTab = page.locator("button:has-text('Trainee Portal'), button:has-text('Candidate Login')");
    if (await traineeTab.count() > 0) {
      await traineeTab.first().click();
      await page.waitForTimeout(300);
    }

    const admInput = page.locator("#trainee_adm_no, input[name='admission_number']");
    const pwdInput = page.locator("#trainee_pwd, input[type='password']");

    await expect(admInput).toBeVisible({ timeout: 10000 });
    await admInput.fill("14179/S2026");
    await pwdInput.fill("TraineePassword@2026!");

    const submitBtn = page.locator("button[type='submit']:has-text('Access Trainee Examination Portal'), button[type='submit']:has-text('Sign In'), button[type='submit']:has-text('Login')");
    await submitBtn.click();

    // Verify successful authentication and redirection
    await page.waitForURL((url) => !url.pathname.includes("/login") || url.pathname.includes("/candidate") || url.pathname.includes("/trainee"), {
      timeout: 15000,
    });

    // Navigate to Candidate Portal / Exam interface
    await page.goto("/candidate/portal", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // ── 2. Verify DevTools/Network Response Shielding (Zero correct_answer / rubric leaks) ──
    expect(interceptedExamPayload, "Network response for exam must be captured").toBeTruthy();

    const examsList = Array.isArray(interceptedExamPayload) ? interceptedExamPayload : [interceptedExamPayload];
    for (const exam of examsList) {
      const payloadStr = JSON.stringify(exam);
      // Strictly assert zero answer key exposure to student browser DevTools
      expect(payloadStr).not.toContain('"correct_answer"');
      expect(payloadStr).not.toContain('"correctAnswer"');
      expect(payloadStr).not.toContain('"rubric"');
      expect(payloadStr).not.toContain('"marking_guide"');
    }

    // ── 3. Fill & Submit Exam ──
    // Check if an exam can be selected or started
    const startOrSelectExam = page.locator("button:has-text('Start Assessment'), button:has-text('Begin Exam'), button:has-text('Take Exam')");
    if (await startOrSelectExam.count() > 0) {
      await startOrSelectExam.first().click();
      await page.waitForTimeout(500);
    }

    // Answer first question if interactive options exist
    const radioOption = page.locator("input[type='radio'], button[role='radio']");
    if (await radioOption.count() > 0) {
      await radioOption.first().click();
      await page.waitForTimeout(300);
    }

    // Submit exam
    const finishBtn = page.locator("button:has-text('Submit Assessment'), button:has-text('Submit Exam'), button:has-text('Submit & Lock')");
    if (await finishBtn.count() > 0) {
      await finishBtn.first().click();
      await page.waitForTimeout(500);

      // Confirm dialog if any
      const confirmBtn = page.locator("button:has-text('Confirm'), button:has-text('Yes, Submit')");
      if (await confirmBtn.count() > 0) {
        await confirmBtn.first().click();
      }
      await page.waitForTimeout(1000);
    }

    // ── 4. Verify Locked State on Reload ──
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // Assert that the portal shows submitted, locked, or completed indicator
    const submittedOrLocked = page.locator("text=/Submitted|Locked|Completed|Attempted|Result/i");
    await expect(submittedOrLocked.first()).toBeVisible();
  });
});
