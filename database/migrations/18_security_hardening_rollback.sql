-- ============================================================================
-- Mukiria Technical Training Institute (MTTI)
-- Migration 18 Rollback: Revert Security Hardening & Audit Immutability Trigger
-- ============================================================================

BEGIN;

-- 1. Drop Audit Log Immutability Triggers and Functions
DROP TRIGGER IF EXISTS trg_audit_logs_no_truncate ON public.audit_logs;
DROP TRIGGER IF EXISTS trg_audit_logs_no_modify ON public.audit_logs;
DROP FUNCTION IF EXISTS public.prevent_audit_log_tampering();

-- 2. Drop mtti_app Policies
DO $$
DECLARE
    tbl text;
    tables CURSOR FOR 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public';
BEGIN
    FOR r IN tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS mtti_app_all_policy ON public.%I;', r.tablename);
    END LOOP;
END $$;

DROP POLICY IF EXISTS mtti_app_audit_insert ON public.audit_logs;
DROP POLICY IF EXISTS mtti_app_audit_select ON public.audit_logs;

-- 3. Re-grant privileges to authenticated if rolling back
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Disable RLS on tables where it was newly added
ALTER TABLE IF EXISTS public.exam_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

COMMIT;
