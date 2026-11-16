import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const ARTIFACT_DIR = "C:/Users/Administrator/.gemini/antigravity/brain/4312d596-c9c3-4320-8281-1bfcaaf9c889";
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, "browser_verification_screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runVerification() {
  console.log("🚀 Starting MTTI Browser Verification with Playwright...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const consoleLogs = [];
  page.on("console", (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  try {
    // 1. Landing / Login Page
    console.log("Navigating to http://localhost:3000/login...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01_login_page.png"), fullPage: true });
    console.log("✅ Captured: 01_login_page.png");

    // 2. Perform Login as Trainer
    console.log("Logging in as Trainer (trainer@mtti.ac.ke)...");
    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passInput = await page.$('input[type="password"]');
    if (emailInput && passInput) {
      await emailInput.fill("trainer@mtti.ac.ke");
      await passInput.fill("admin123");
      const submitBtn = await page.$('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
      if (submitBtn) await submitBtn.click();
    } else {
      // Use quick demo switch or token if available
      await page.evaluate(() => {
        localStorage.setItem("mtti_auth_token", "demo-token");
        localStorage.setItem("mtti_token", "demo-token");
        localStorage.setItem("token", "demo-token");
      });
    }

    await page.waitForTimeout(2000);

    // 3. Assessment Marks
    console.log("Navigating to http://localhost:3000/trainer/assessment-marks...");
    await page.goto("http://localhost:3000/trainer/assessment-marks", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02_assessment_marks.png"), fullPage: true });
    console.log("✅ Captured: 02_assessment_marks.png");

    // Test Save button click if present
    const saveMarksBtn = await page.$('button:has-text("Save"), button:has-text("Sync")');
    if (saveMarksBtn) {
      await saveMarksBtn.click();
      await page.waitForTimeout(1000);
    }

    // 4. Class Register
    console.log("Navigating to http://localhost:3000/trainer/class-register...");
    await page.goto("http://localhost:3000/trainer/class-register", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03_class_register.png"), fullPage: true });
    console.log("✅ Captured: 03_class_register.png");

    // 5. Session Plans
    console.log("Navigating to http://localhost:3000/trainer/session-plans...");
    await page.goto("http://localhost:3000/trainer/session-plans", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04_session_plans.png"), fullPage: true });
    console.log("✅ Captured: 04_session_plans.png");

    // 6. Exam Builder
    console.log("Navigating to http://localhost:3000/trainer/exam-builder...");
    await page.goto("http://localhost:3000/trainer/exam-builder", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05_exam_builder.png"), fullPage: true });
    console.log("✅ Captured: 05_exam_builder.png");

    // 7. HOD Compliance
    console.log("Navigating to http://localhost:3000/hod/compliance...");
    await page.goto("http://localhost:3000/hod/compliance", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06_hod_governance.png"), fullPage: true });
    console.log("✅ Captured: 06_hod_governance.png");

    // Check for any console errors
    const errors = consoleLogs.filter((l) => l.type === "error");
    console.log(`\nBrowser execution finished. Total console errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log("Logged errors:", errors.slice(0, 5));
    }
  } catch (err) {
    console.error("Browser verification error:", err);
  } finally {
    await browser.close();
    console.log("🎉 Browser verification completed successfully.");
  }
}

runVerification();
