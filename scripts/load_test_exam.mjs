#!/usr/bin/env node

/**
 * Mukiria TTI — Exam Concurrency & Connection Pooling Load Test
 * Simulates 150 concurrent trainees fetching an active exam and submitting answers.
 *
 * Verifies:
 * - Lab-safe rate limiting isolation (150 distinct candidate reg numbers over same gateway)
 * - PostgreSQL connection pool resilience under peak exam submission surge
 * - Response latency percentiles (P50, P90, P95, P99)
 */

import http from "node:http";
import https from "node:https";
import jwt from "jsonwebtoken";

const TARGET_URL = process.env.TARGET_URL || process.argv[2] || "http://localhost:3000";
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "150", 10);
const UNIT_CODE = process.env.UNIT_CODE || "ICT/CU/IT/CR/6/6";
const TIMEOUT_MS = 15000;
const JWT_SECRET = process.env.JWT_SECRET || "K1Jd+xcqwjY0Z/BpsJvc7jMxK3NL8JhmymAXssKzHtRZbUvQMdQEro4wJJO1D0TqQQqWjAkT5tHamzqcYit8Dw==";

function generateTraineeToken(regNumber, candidateIndex) {
  return jwt.sign(
    {
      sub: `trainee-load-${candidateIndex}`,
      profile_id: `trainee-load-${candidateIndex}`,
      role: "trainee",
      reg_number: regNumber,
      admission_number: regNumber,
      name: `Trainee Candidate #${candidateIndex}`,
      enrolled_units: [UNIT_CODE, "061155101A", "ICT/CU/IT/CR/6/6"],
    },
    JWT_SECRET,
    { algorithm: "HS256", expiresIn: "2h", audience: "mtti-web", issuer: "mtti-api" }
  );
}

console.log("================================================================================");
console.log(` Mukiria TTI Exam Concurrency Load Test (Simulating ${CONCURRENCY} Trainees)`);
console.log(` Target: ${TARGET_URL} | Unit: ${UNIT_CODE}`);
console.log("================================================================================\n");

function httpRequest(urlStr, options, postData) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = new URL(urlStr);
    const client = url.protocol === "https:" ? https : http;

    const reqOptions = {
      method: options.method || "GET",
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      headers: options.headers || {},
      timeout: TIMEOUT_MS,
    };

    const req = client.request(reqOptions, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        const latency = Date.now() - startTime;
        let json = null;
        try { json = JSON.parse(body); } catch {}
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          latency,
          data: json,
          raw: body,
        });
      });
    });

    req.on("error", (err) => {
      resolve({
        ok: false,
        status: 0,
        latency: Date.now() - startTime,
        error: err.message,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        ok: false,
        status: 408,
        latency: Date.now() - startTime,
        error: "Timeout",
      });
    });

    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

function calculatePercentile(latencies, p) {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function runCandidateWorkflow(candidateIndex) {
  const regNumber = `141${String(candidateIndex).padStart(3, "0")}/S2026`;
  const candidateName = `Trainee Candidate #${candidateIndex}`;

  const token = generateTraineeToken(regNumber, candidateIndex);
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "x-user-reg": regNumber,
    "x-forwarded-for": "197.237.100.50", // All 150 simulated trainees share the same campus lab IP
  };

  // Step 1: Query Available Exam
  const fetchStart = Date.now();
  const examRes = await httpRequest(`${TARGET_URL}/api/exams`, { method: "GET", headers });
  const fetchLatency = Date.now() - fetchStart;

  if (!examRes.ok) {
    return {
      candidateIndex,
      regNumber,
      step: "fetch_exam",
      ok: false,
      status: examRes.status,
      latency: fetchLatency,
      error: examRes.error || examRes.data?.error || `HTTP ${examRes.status}`,
    };
  }

  // Find target exam or fallback
  const exams = Array.isArray(examRes.data) ? examRes.data : [];
  const targetExam = exams.find((e) => e.unit_code === UNIT_CODE) || exams[0] || { id: "exam-001", unit_code: UNIT_CODE };

  // Step 2: Submit Completed Exam Script
  const submissionPayload = {
    exam_id: targetExam.id,
    unit_code: targetExam.unit_code || UNIT_CODE,
    reg_number: regNumber,
    name: candidateName,
    section_a: [
      { question_id: "q1", answer: "B" },
      { question_id: "q2", answer: "A" },
      { question_id: "q3", answer: "D" },
    ],
    section_b: [
      { question_id: "q_b1", answer: `Demonstrated competency protocol by candidate ${candidateIndex}` },
    ],
  };

  const submitStart = Date.now();
  const submitRes = await httpRequest(`${TARGET_URL}/api/submissions`, { method: "POST", headers }, submissionPayload);
  const submitLatency = Date.now() - submitStart;

  const totalLatency = fetchLatency + submitLatency;

  return {
    candidateIndex,
    regNumber,
    step: "submit_exam",
    ok: submitRes.ok,
    status: submitRes.status,
    latency: totalLatency,
    fetchLatency,
    submitLatency,
    score: submitRes.data?.score,
    error: submitRes.ok ? null : (submitRes.error || submitRes.data?.error || `HTTP ${submitRes.status}`),
  };
}

async function main() {
  const overallStart = Date.now();
  console.log(`[*] Launching ${CONCURRENCY} concurrent trainee workflows...`);

  const promises = [];
  for (let i = 1; i <= CONCURRENCY; i++) {
    promises.push(runCandidateWorkflow(i));
  }

  const results = await Promise.all(promises);
  const totalDuration = (Date.now() - overallStart) / 1000;

  const successful = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const latencies = results.map((r) => r.latency);

  const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const p50 = calculatePercentile(latencies, 50);
  const p90 = calculatePercentile(latencies, 90);
  const p95 = calculatePercentile(latencies, 95);
  const p99 = calculatePercentile(latencies, 99);
  const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;

  console.log("\n================================================================================");
  console.log(" LOAD TEST EXECUTION RESULTS");
  console.log("================================================================================");
  console.log(` Total Concurrent Trainees:   ${CONCURRENCY}`);
  console.log(` Completed Workflows:         ${results.length}`);
  console.log(` Successful Submissions:      ${successful.length} (${((successful.length / CONCURRENCY) * 100).toFixed(1)}%)`);
  console.log(` Failed / Throttled:          ${failed.length} (${((failed.length / CONCURRENCY) * 100).toFixed(1)}%)`);
  console.log(` Total Execution Time:        ${totalDuration.toFixed(2)} seconds`);
  console.log(` Overall Throughput:          ${(results.length / totalDuration).toFixed(1)} req/sec`);
  console.log("--------------------------------------------------------------------------------");
  console.log(" LATENCY DISTRIBUTION (Per Full Trainee Workflow):");
  console.log(`   Average Latency:           ${avgLatency} ms`);
  console.log(`   P50 (Median):              ${p50} ms`);
  console.log(`   P90:                       ${p90} ms`);
  console.log(`   P95:                       ${p95} ms`);
  console.log(`   P99:                       ${p99} ms`);
  console.log(`   Max Latency:               ${maxLatency} ms`);
  console.log("================================================================================");

  if (failed.length > 0) {
    console.log("\nSample Failures / Errors (First 5):");
    failed.slice(0, 5).forEach((f) => {
      console.log(` - Trainee ${f.regNumber}: Step=${f.step}, Status=${f.status}, Latency=${f.latency}ms, Error: ${f.error}`);
    });
  }

  const successRate = (successful.length / CONCURRENCY) * 100;
  if (successRate >= 90) {
    console.log(`\n✅ CONCURRENCY PASS: Success rate ${successRate.toFixed(1)}% satisfies TVET CDACC 150-candidate surge requirement.`);
    process.exit(0);
  } else {
    console.error(`\n❌ CONCURRENCY FAIL: Success rate ${successRate.toFixed(1)}% is below 90% threshold.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal load testing execution error:", err);
  process.exit(1);
});
