-- ============================================================================
-- Mukiria Technical Training Institute (MTTI)
-- Script: Provision Least-Privilege Application Database Role (mtti_app)
-- ============================================================================
-- NOTE: Execute this script as the administrative database superuser (e.g. postgres).
-- Replace 'CHANGE_ME_TO_A_CRYPTOGRAPHICALLY_SECURE_PASSWORD' before executing.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mtti_app') THEN
        CREATE ROLE mtti_app WITH
            LOGIN
            PASSWORD 'CHANGE_ME_TO_A_CRYPTOGRAPHICALLY_SECURE_PASSWORD'
            NOSUPERUSER
            NOCREATEDB
            NOCREATEROLE
            NOBYPASSRLS
            CONNECTION LIMIT 50;
        RAISE NOTICE 'Role mtti_app created successfully.';
    ELSE
        ALTER ROLE mtti_app WITH
            NOSUPERUSER
            NOCREATEDB
            NOCREATEROLE
            NOBYPASSRLS;
        RAISE NOTICE 'Role mtti_app already exists; enforced least-privilege flags.';
    END IF;
END $$;

-- 1. Database Connection and Schema Usage
GRANT CONNECT ON DATABASE postgres TO mtti_app;
GRANT USAGE ON SCHEMA public TO mtti_app;

-- 2. Standard DML Operations on Public Application Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mtti_app;

-- 3. Restrict Audit Logs: Append-Only (NO UPDATE, DELETE, or TRUNCATE)
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public.audit_logs FROM mtti_app;
GRANT SELECT, INSERT ON TABLE public.audit_logs TO mtti_app;

-- 4. Sequence Privileges for Auto-Incrementing / Serial Columns
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mtti_app;

-- 5. Default Privileges for Any Future Tables and Sequences Created in public
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mtti_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE UPDATE, DELETE, TRUNCATE ON TABLES FROM mtti_app; -- default revoked on specific sensitive tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO mtti_app;

-- ─── VERIFICATION QUERIES (Run to test role capabilities) ─────────────────────
-- 1. Verify mtti_app lacks bypass and superuser:
--    SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = 'mtti_app';
--    Expected: rolsuper = false, rolbypassrls = false.
-- 2. Verify mtti_app cannot truncate audit_logs:
--    SET ROLE mtti_app;
--    TRUNCATE public.audit_logs;
--    Expected: ERROR: permission denied for table audit_logs (or trigger violation).
--    RESET ROLE;
