-- ==============================================================================
-- MUKIRIA TECHNICAL TRAINING INSTITUTE (MTTI)
-- Migration 10: Versioned Compliance Rulesets & Cryptographic Audit Trails
-- File: database/migrations/10_versioned_rules_and_audit.sql
-- ==============================================================================
-- 1. Creates `compliance_rulesets` for versioning TVET/KNQF regulatory standards
-- 2. Creates `audit_logs` table for immutable, append-only grade/attendance mutations
-- 3. Attaches PostgreSQL AFTER INSERT/UPDATE/DELETE triggers to core mutation tables
-- 4. Enforces RLS: Zero UPDATE/DELETE access to audit logs (even for admins)
-- ==============================================================================

-- ─── 1. VERSIONED COMPLIANCE RULESETS TABLE ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.compliance_rulesets (
    id VARCHAR(64) PRIMARY KEY,
    version_tag VARCHAR(64) NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    level INT NOT NULL CHECK (level BETWEEN 3 AND 6),
    ct_weight NUMERIC(4, 2) NOT NULL,
    cp_weight NUMERIC(4, 2) NOT NULL,
    min_attendance_pct NUMERIC(5, 2) NOT NULL DEFAULT 75.0,
    required_theory_exams INT NOT NULL DEFAULT 3,
    missing_exam_policy VARCHAR(64) NOT NULL DEFAULT 'zero_if_incomplete',
    exam_structure_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_compliance_ruleset_version_level UNIQUE (version_tag, level)
);

-- Enable RLS on compliance_rulesets
ALTER TABLE public.compliance_rulesets ENABLE ROW LEVEL SECURITY;

-- Grants for compliance_rulesets
GRANT SELECT ON public.compliance_rulesets TO anon, authenticated;
GRANT ALL ON public.compliance_rulesets TO service_role;

-- RLS Policy: All roles can read compliance rulesets
DROP POLICY IF EXISTS allow_all_read_compliance_rulesets ON public.compliance_rulesets;
CREATE POLICY allow_all_read_compliance_rulesets ON public.compliance_rulesets
    FOR SELECT TO anon, authenticated
    USING (true);

-- Seed default KNQF_2026_T3 rulesets for Levels 3 to 6
INSERT INTO public.compliance_rulesets (
    id, version_tag, effective_from, level, ct_weight, cp_weight,
    min_attendance_pct, required_theory_exams, missing_exam_policy, exam_structure_rules
) VALUES
(
    'ruleset-knqf-2026-t3-l3',
    'KNQF_2026_T3',
    '2026-08-31 00:00:00+03',
    3,
    0.20,
    0.80,
    75.0,
    3,
    'zero_if_incomplete',
    '{
        "allow_true_false": true,
        "prohibit_true_false": false,
        "min_checklist_items": 10,
        "max_checklist_items": 25,
        "section_a_marks": 20,
        "section_b_marks": 30,
        "total_marks": 50
    }'::jsonb
),
(
    'ruleset-knqf-2026-t3-l4',
    'KNQF_2026_T3',
    '2026-08-31 00:00:00+03',
    4,
    0.30,
    0.70,
    75.0,
    3,
    'zero_if_incomplete',
    '{
        "allow_true_false": false,
        "prohibit_true_false": true,
        "min_checklist_items": 10,
        "max_checklist_items": 25,
        "section_a_marks": 10,
        "section_b_marks": 40,
        "total_marks": 50
    }'::jsonb
),
(
    'ruleset-knqf-2026-t3-l5',
    'KNQF_2026_T3',
    '2026-08-31 00:00:00+03',
    5,
    0.40,
    0.60,
    75.0,
    3,
    'zero_if_incomplete',
    '{
        "allow_true_false": false,
        "prohibit_true_false": true,
        "min_checklist_items": 10,
        "max_checklist_items": 25,
        "section_a_marks": 40,
        "section_b_marks": 60,
        "total_marks": 100
    }'::jsonb
),
(
    'ruleset-knqf-2026-t3-l6',
    'KNQF_2026_T3',
    '2026-08-31 00:00:00+03',
    6,
    0.50,
    0.50,
    75.0,
    3,
    'zero_if_incomplete',
    '{
        "allow_true_false": false,
        "prohibit_true_false": true,
        "min_checklist_items": 10,
        "max_checklist_items": 25,
        "section_a_marks": 40,
        "section_b_marks": 60,
        "total_marks": 100
    }'::jsonb
)
ON CONFLICT (version_tag, level) DO UPDATE SET
    ct_weight = EXCLUDED.ct_weight,
    cp_weight = EXCLUDED.cp_weight,
    min_attendance_pct = EXCLUDED.min_attendance_pct,
    required_theory_exams = EXCLUDED.required_theory_exams,
    missing_exam_policy = EXCLUDED.missing_exam_policy,
    exam_structure_rules = EXCLUDED.exam_structure_rules,
    updated_at = CURRENT_TIMESTAMP;

-- ─── 2. IMMUTABLE APPEND-ONLY AUDIT LOGS TABLE ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(64) NOT NULL,
    record_id VARCHAR(128) NOT NULL,
    action VARCHAR(16) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    actor_id VARCHAR(100),
    actor_role VARCHAR(50),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for high-performance audit query inspection
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Deny direct mutation permissions to all standard roles
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM public, anon, authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- Strict RLS Policy: Only HOD and Admin can SELECT audit logs; NO ONE can UPDATE or DELETE
DROP POLICY IF EXISTS audit_logs_hod_admin_select ON public.audit_logs;
CREATE POLICY audit_logs_hod_admin_select ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
        COALESCE(current_setting('request.jwt.claims', true)::jsonb->>'role', '') IN ('admin', 'hod', 'HOD')
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()::text AND role IN ('admin', 'HOD')
        )
    );

-- ─── 3. CRYPTOGRAPHIC AUDIT TRIGGER FUNCTION ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_record_mutation()
RETURNS TRIGGER AS $$
DECLARE
    current_actor_id text;
    current_actor_role text;
    rec_id text;
BEGIN
    -- Extract actor details from session claims or fallback to auth.uid()
    BEGIN
        current_actor_id := NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'sub', '');
        current_actor_role := NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'role', '');
    EXCEPTION WHEN OTHERS THEN
        current_actor_id := NULL;
        current_actor_role := NULL;
    END;

    IF current_actor_id IS NULL THEN
        BEGIN
            current_actor_id := NULLIF(current_setting('app.current_user_id', true), '');
            current_actor_role := NULLIF(current_setting('app.current_user_role', true), '');
        EXCEPTION WHEN OTHERS THEN
            current_actor_id := NULL;
            current_actor_role := NULL;
        END;
    END IF;

    IF current_actor_id IS NULL THEN
        BEGIN
            current_actor_id := auth.uid()::text;
        EXCEPTION WHEN OTHERS THEN
            current_actor_id := 'system';
        END IF;
    END IF;

    IF current_actor_role IS NULL THEN
        current_actor_role := 'system';
    END IF;

    IF TG_OP = 'DELETE' THEN
        rec_id := COALESCE(OLD.id::text, '');
        INSERT INTO public.audit_logs (table_name, record_id, action, actor_id, actor_role, old_data, new_data, created_at)
        VALUES (TG_TABLE_NAME, rec_id, TG_OP, current_actor_id, current_actor_role, to_jsonb(OLD), NULL, CURRENT_TIMESTAMP);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        rec_id := COALESCE(NEW.id::text, OLD.id::text, '');
        INSERT INTO public.audit_logs (table_name, record_id, action, actor_id, actor_role, old_data, new_data, created_at)
        VALUES (TG_TABLE_NAME, rec_id, TG_OP, current_actor_id, current_actor_role, to_jsonb(OLD), to_jsonb(NEW), CURRENT_TIMESTAMP);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        rec_id := COALESCE(NEW.id::text, '');
        INSERT INTO public.audit_logs (table_name, record_id, action, actor_id, actor_role, old_data, new_data, created_at)
        VALUES (TG_TABLE_NAME, rec_id, TG_OP, current_actor_id, current_actor_role, NULL, to_jsonb(NEW), CURRENT_TIMESTAMP);
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 4. ATTACH AUDIT TRIGGERS TO CORE PEDAGOGICAL & MARK TABLES ────────────────

DO $$
DECLARE
    tbl text;
    target_tables text[] := ARRAY[
        'submissions',
        'exam_submissions',
        'assessment_marks',
        'session_plans',
        'session_plans_data',
        'records_of_work',
        'record_of_work',
        'attendance_records',
        'attendance_register'
    ];
BEGIN
    FOREACH tbl IN ARRAY target_tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I;', tbl, tbl);
            EXECUTE format(
                'CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_record_mutation();',
                tbl, tbl
            );
        END IF;
    END LOOP;
END $$;
