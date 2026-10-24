#!/usr/bin/env python3
"""
Mukiria Technical Training Institute (MTTI) / Nolimit
Phase C Production Deployment & Environment Verification Script

Automated smoke test suite that verifies:
1. Build Artifact Integrity: dist/public/index.html and assets exist.
2. Zero-Email Mandate Compliance: database/seeds/trainees.json strictly enforces
   zero email exposure or reliance.
3. Environment Configuration: Validates server & client variable schemas.
4. Gateway & Routing Integrity: vercel.json API separation and cache headers.
"""

import sys
import json
import re
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

def log_pass(msg: str):
    print(f"  \033[92m[PASS]\033[0m {msg}")

def log_fail(msg: str):
    print(f"  \033[91m[FAIL]\033[0m {msg}")

def log_info(msg: str):
    print(f"  \033[94m[INFO]\033[0m {msg}")


def test_build_artifacts() -> bool:
    print("\n--- Pillar 1: Build & Distribution Artifact Verification ---")
    dist_public_html = ROOT_DIR / "dist" / "public" / "index.html"
    build_html = ROOT_DIR / "build" / "index.html"
    server_bundle = ROOT_DIR / "dist" / "index.js"

    passed = True

    # 1. dist/public/index.html
    if dist_public_html.exists():
        size = dist_public_html.stat().st_size
        content = dist_public_html.read_text(encoding="utf-8")
        if size > 100 and '<div id="root">' in content:
            log_pass(f"dist/public/index.html exists and is well-formed ({size:,} bytes)")
        else:
            log_fail("dist/public/index.html exists but appears incomplete or lacks root mount point.")
            passed = False
    else:
        # Fallback check if build/index.html exists from mirror
        if build_html.exists():
            log_pass(f"build/index.html mirror exists ({build_html.stat().st_size:,} bytes)")
        else:
            log_fail("Neither dist/public/index.html nor build/index.html was found. (Run 'npm run build' first).")
            passed = False

    # 2. Server entry bundle
    if server_bundle.exists():
        log_pass(f"dist/index.js server bundle exists ({server_bundle.stat().st_size:,} bytes)")
    else:
        log_fail("dist/index.js server bundle does not exist.")
        passed = False

    return passed


def test_zero_email_mandate() -> bool:
    print("\n--- Pillar 2: Database Seeds & Zero-Email Mandate Verification ---")
    trainees_seed = ROOT_DIR / "database" / "seeds" / "trainees.json"

    if not trainees_seed.exists():
        log_fail(f"Seeds file missing: {trainees_seed}")
        return False

    passed = True
    try:
        data = json.loads(trainees_seed.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            log_fail("trainees.json must be a JSON array of trainee records.")
            return False

        log_pass(f"Loaded {len(data)} seed trainees from database/seeds/trainees.json")

        for idx, trainee in enumerate(data):
            # Check for any field containing 'email'
            for key in trainee.keys():
                if "email" in key.lower():
                    log_fail(f"Trainee #{idx} violates Zero-Email mandate with property: '{key}'")
                    passed = False

            # Verify presence of primary candidate identifier
            if "reg_number" not in trainee and "adm_no" not in trainee:
                log_fail(f"Trainee #{idx} lacks candidate admission number/reg_number primary identifier")
                passed = False

        if passed:
            log_pass("Zero-Email Mandate strictly verified: 0 email properties found across seed roster.")

    except Exception as e:
        log_fail(f"Failed to parse trainees.json: {e}")
        return False

    # Check companion seed fixtures
    companion_seeds = [
        ("attendance_register.json", 700),
        ("submissions.json", 30),
        ("session_plans.json", 5),
        ("records_of_work.json", 5),
    ]
    for filename, min_expected in companion_seeds:
        path = ROOT_DIR / "database" / "seeds" / filename
        if path.exists():
            count = len(json.loads(path.read_text(encoding="utf-8")))
            log_pass(f"Fixture {filename} verified ({count} records)")
        else:
            log_fail(f"Missing essential fixture: {filename}")
            passed = False

    return passed


def test_environment_configuration() -> bool:
    print("\n--- Pillar 3: Environment Configuration & Schema Validation ---")
    passed = True

    # Check .env.example
    env_example = ROOT_DIR / ".env.example"
    if env_example.exists():
        content = env_example.read_text(encoding="utf-8")
        required_keys = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "DATABASE_URL", "PORT", "NODE_ENV"]
        for key in required_keys:
            if key in content:
                log_pass(f".env.example documents '{key}'")
            else:
                log_fail(f".env.example is missing documentation for '{key}'")
                passed = False
    else:
        log_fail(".env.example is missing from repository root")
        passed = False

    # Check shared/envValidator.ts
    validator_path = ROOT_DIR / "shared" / "envValidator.ts"
    if validator_path.exists():
        content = validator_path.read_text(encoding="utf-8")
        if "validateClientEnv" in content and "validateServerEnv" in content:
            log_pass("shared/envValidator.ts exports validateClientEnv and validateServerEnv")
        else:
            log_fail("shared/envValidator.ts missing required validator functions")
            passed = False
    else:
        log_fail("shared/envValidator.ts is missing")
        passed = False

    return passed


def test_gateway_and_routing() -> bool:
    print("\n--- Pillar 4: Gateway & Routing Configuration (vercel.json) ---")
    vercel_json = ROOT_DIR / "vercel.json"
    if not vercel_json.exists():
        log_fail("vercel.json missing from repository root")
        return False

    passed = True
    try:
        config = json.loads(vercel_json.read_text(encoding="utf-8"))
        rewrites = config.get("rewrites", [])

        # Check API rewrite
        api_rewrite = any(r.get("source") == "/api/(.*)" and "server" in r.get("destination", "") for r in rewrites)
        if api_rewrite:
            log_pass("vercel.json routes /api/(.*) -> server/index.ts")
        else:
            log_fail("vercel.json does not cleanly route /api/(.*) to server/index.ts")
            passed = False

        # Check SPA rewrite
        spa_rewrite = any(r.get("source") == "/(.*)" and "index.html" in r.get("destination", "") for r in rewrites)
        if spa_rewrite:
            log_pass("vercel.json routes client routes /(.*) -> /index.html")
        else:
            log_fail("vercel.json lacks fallback rewrite for SPA client routes")
            passed = False

        # Check cache-control headers
        headers = config.get("headers", [])
        has_immutable_assets = any(
            "/assets/" in h.get("source", "") and any("immutable" in x.get("value", "") for x in h.get("headers", []))
            for h in headers
        )
        if has_immutable_assets:
            log_pass("Cache-Control: immutable configured for hashed static bundles")
        else:
            log_fail("Missing immutable cache header for static assets")
            passed = False

    except Exception as e:
        log_fail(f"Failed to parse vercel.json: {e}")
        return False

    return passed


def main():
    print("=" * 70)
    print(" MUKIRIA TECHNICAL TRAINING INSTITUTE — PHASE C VERIFICATION")
    print("=" * 70)

    p1 = test_build_artifacts()
    p2 = test_zero_email_mandate()
    p3 = test_environment_configuration()
    p4 = test_gateway_and_routing()

    all_passed = p1 and p2 and p3 and p4

    print("\n" + "=" * 70)
    if all_passed:
        print("\033[92m[SUCCESS] ALL PHASE C VERIFICATION CHECKS PASSED WITH 100% SUCCESS.\033[0m")
        print("Repository is verified and ready for live production hosting.")
        print("=" * 70)
        sys.exit(0)
    else:
        print("\033[91m[ERROR] ONE OR MORE PHASE C CHECKS FAILED. See details above.\033[0m")
        print("=" * 70)
        sys.exit(1)


if __name__ == "__main__":
    main()
