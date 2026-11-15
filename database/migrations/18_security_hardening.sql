-- ============================================================================
-- Mukiria Technical Training Institute (MTTI)
-- Migration 18: Security Hardening, mtti_app Access, RLS Enforcement & Audit Immutability
-- Author: Elite AI Systems Architect & TVET CDACC Compliance Agent
-- Date: 2026-11-15
-- Target Role: mtti_app (Least-Privilege Node Application Service Role)
-- ============================================================================

BEGIN;

-- ─── 1. PROVISION LEAST-PRIVILEGE APPLICATION ROLE (IF NOT EXISTS) ───────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mtti_app') THEN
        CREATE ROLE mtti_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS CONNECTION LIMIT 50;
    END IF;
END $$;

-- ─── 2. ENABLE ROW LEVEL SECURITY ON ALL PUBLIC APPLICATION TABLES ───────────
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.units_of_competence ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.unit_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessment_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessment_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.session_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.records_of_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.compliance_rulesets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── 3. REVOKE ALL PRIVILEGES FROM ANON AND AUTHENTICATED ────────────────────
-- PostgREST public/authenticated attack surface neutralization
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- Allow read-only access strictly to public compliance rulesets
GRANT SELECT ON TABLE public.compliance_rulesets TO anon, authenticated;

-- Revoke default privileges on future objects created by postgres admin
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- ─── 4. GRANT AUTHORITATIVE PERMISSIONS TO mtti_app ──────────────────────────
GRANT USAGE ON SCHEMA public TO mtti_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mtti_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO mtti_app;

-- Prohibit TRUNCATE, UPDATE, DELETE on audit_logs from mtti_app (Append-Only)
REVOKE TRUNCATE, UPDATE, DELETE ON public.audit_logs FROM mtti_app;
GRANT INSERT, SELECT ON public.audit_logs TO mtti_app;

-- ─── 5. ATTACH EXPLICIT mtti_app RLS POLICIES ACROSS ALL TABLES ──────────────
-- Because mtti_app connects via PostgreSQL pooler (no PostgREST JWT claims),
-- explicit TO mtti_app policies allow application queries without bypassrls.
DO $$
DECLARE
    tbl text;
    tables CURSOR FOR 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename NOT IN ('audit_logs');
BEGIN
    FOR r IN tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS mtti_app_all_policy ON public.%I;', r.tablename);
        EXECUTE format('CREATE POLICY mtti_app_all_policy ON public.%I TO mtti_app USING (true) WITH CHECK (true);', r.tablename);
    END LOOP;
END $$;

-- Explicit scoped policies for audit_logs
DROP POLICY IF EXISTS mtti_app_audit_insert ON public.audit_logs;
CREATE POLICY mtti_app_audit_insert ON public.audit_logs
    FOR INSERT TO mtti_app
    WITH CHECK (true);

DROP POLICY IF EXISTS mtti_app_audit_select ON public.audit_logs;
CREATE POLICY mtti_app_audit_select ON public.audit_logs
    FOR SELECT TO mtti_app
    USING (true);

-- ─── 6. DROP & REPLACE ALL 16 VULNERABLE USING (true) POLICIES ────────────────
-- Drop vulnerable institutional reference policies
DROP POLICY IF EXISTS authenticated_read_terms ON public.terms;
DROP POLICY IF EXISTS authenticated_read_classes ON public.classes;
DROP POLICY IF EXISTS authenticated_read_departments ON public.departments;
DROP POLICY IF EXISTS authenticated_read_units ON public.units_of_competence;
DROP POLICY IF EXISTS authenticated_read_trainers ON public.trainers;
DROP POLICY IF EXISTS staff_timetable ON public.timetable;

-- Drop vulnerable exam and submission policies
DROP POLICY IF EXISTS anon_read_exams ON public.exams;
DROP POLICY IF EXISTS authenticated_read_exams ON public.exams;
DROP POLICY IF EXISTS exams_anon_read ON public.exams;
DROP POLICY IF EXISTS exams_all_read ON public.exams;
DROP POLICY IF EXISTS exams_authenticated_read ON public.exams;

DROP POLICY IF EXISTS anon_insert_submissions ON public.submissions;
DROP POLICY IF EXISTS anon_read_submissions ON public.submissions;
DROP POLICY IF EXISTS submissions_anon_read ON public.submissions;
DROP POLICY IF EXISTS submissions_all_read ON public.submissions;

DROP POLICY IF EXISTS anon_insert_exam_submissions ON public.exam_submissions;
DROP POLICY IF EXISTS anon_read_exam_submissions ON public.exam_submissions;

-- Drop vulnerable trainee policies
DROP POLICY IF EXISTS anon_read_trainees ON public.trainees;
DROP POLICY IF EXISTS anon_insert_trainees ON public.trainees;
DROP POLICY IF EXISTS allow_all_authenticated_read ON public.trainees;
DROP POLICY IF EXISTS trainees_read_policy ON public.trainees;
DROP POLICY IF EXISTS trainees_insert_policy ON public.trainees;

-- Drop vulnerable attendance register policy
DROP POLICY IF EXISTS attendance_register_policy ON public.attendance_register;

-- ─── 7. REFACTOR AUTH HELPER FUNCTIONS (READ STRICTLY APP_METADATA) ───────────
CREATE OR REPLACE FUNCTION public.auth_user_role() 
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'role',
        'none'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN 'none';
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.auth_trainee_reg() 
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'reg_number',
        NULL
    );
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.auth_user_department_id() 
RETURNS UUID AS $$
BEGIN
    RETURN (
        current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'department_id'
    )::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── 8. SET SECURITY INVOKER ON RELEVANT VIEWS ───────────────────────────────
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'trainee_exam_view' AND schemaname = 'public') THEN
        EXECUTE 'ALTER VIEW public.trainee_exam_view SET (security_invoker = true);';
    END IF;
END $$;

-- ─── 9. STORAGE BUCKET HARDENING ─────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'buckets') THEN
        UPDATE storage.buckets SET public = false WHERE id = 'assessment-evidence';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') THEN
        DROP POLICY IF EXISTS "Public Access" ON storage.objects;
        DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
    END IF;
END $$;

-- ─── 10. IMMUTABLE AUDIT LOGS TRIGGER (BLOCK TRUNCATE, UPDATE, DELETE) ───────
CREATE OR REPLACE FUNCTION public.prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'MTTI Compliance Violation: Operation % is strictly prohibited on public.audit_logs. Audit trail is tamper-resistant and append-only.', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_no_modify ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_no_modify
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_audit_log_tampering();

DROP TRIGGER IF EXISTS trg_audit_logs_no_truncate ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_no_truncate
    BEFORE TRUNCATE ON public.audit_logs
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.prevent_audit_log_tampering();

REVOKE TRUNCATE, UPDATE, DELETE ON public.audit_logs FROM public, anon, authenticated, mtti_app;

COMMIT;
