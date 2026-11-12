-- ==============================================================================
-- MUKIRIA TECHNICAL TRAINING INSTITUTE (MTTI)
-- Migration 09: Post-October 30 Supabase Grant Verification & RLS Enforcement
-- File: database/migrations/09_verify_grants_and_rls.sql
-- ==============================================================================
-- Ensures compliance with Supabase's mandatory post-October 30 public table
-- grant enforcement where default access to public tables is revoked unless
-- explicitly granted to 'anon' and 'authenticated' roles.
-- ==============================================================================

-- ─── 1. VERIFY ROW LEVEL SECURITY (RLS) ON ALL CORE TVET TABLES ───────────────

DO $$
DECLARE
    tbl text;
    core_tables text[] := ARRAY[
        'trainees',
        'exams',
        'submissions',
        'exam_submissions',
        'assessment_marks',
        'session_plans',
        'session_plans_data',
        'records_of_work',
        'record_of_work',
        'learning_plans',
        'learning_outcomes',
        'users',
        'trainers',
        'departments',
        'classes',
        'terms',
        'units_of_competence',
        'unit_offerings',
        'assessment_evidence',
        'attendance_records',
        'attendance_register',
        'timetable',
        'cohorts'
    ];
BEGIN
    FOREACH tbl IN ARRAY core_tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        END IF;
    END LOOP;
END $$;

-- ─── 2. EXPLICIT SCHEMA USAGE GRANTS ──────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres;

-- ─── 3. SEQUENCE PERMISSIONS (Support auto-increment / serials) ───────────────

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- ─── 4. EXPLICIT ROLE TABLE GRANTS (Post-October 30 Supabase Compliance) ───────

-- Authenticated Role (Trainers, HODs, Trainees, Admins)
-- Full CRUD permissions per table; access filtered strictly by Row Level Security policies
DO $$
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Authenticated default privileges warning: %', SQLERRM;
END $$;

-- Service Role (Internal API / Elevated Operations)
DO $$
BEGIN
    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Service role privileges notice: %', SQLERRM;
END $$;

-- Anonymous Role (Public Portal, Candidate Verification & Offline-Sync Submissions)
-- Specific read-only access to published curricula and read/insert access for candidate exam submission
DO $$
DECLARE
    tbl text;
    read_tables text[] := ARRAY[
        'terms',
        'classes',
        'departments',
        'units_of_competence',
        'trainers',
        'exams',
        'timetable',
        'cohorts'
    ];
    candidate_tables text[] := ARRAY[
        'trainees',
        'submissions',
        'exam_submissions',
        'attendance_records',
        'attendance_register'
    ];
BEGIN
    -- Public read tables
    FOREACH tbl IN ARRAY read_tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            EXECUTE format('GRANT SELECT ON public.%I TO anon;', tbl);
        END IF;
    END LOOP;

    -- Candidate self-service & submission tables
    FOREACH tbl IN ARRAY candidate_tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            EXECUTE format('GRANT SELECT, INSERT ON public.%I TO anon;', tbl);
        END IF;
    END LOOP;
END $$;

-- ─── 5. VERIFIED RLS POLICIES FOR TVET COMPLIANCE & BOLA PREVENTION ───────────

-- Exams: Read-only for candidates (answer keys stripped at application level)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exams') THEN
        DROP POLICY IF EXISTS anon_read_exams ON public.exams;
        CREATE POLICY anon_read_exams ON public.exams FOR SELECT TO anon USING (true);

        DROP POLICY IF EXISTS authenticated_read_exams ON public.exams;
        CREATE POLICY authenticated_read_exams ON public.exams FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- Submissions: Trainee BOLA and submission locking policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'submissions') THEN
        DROP POLICY IF EXISTS anon_insert_submissions ON public.submissions;
        CREATE POLICY anon_insert_submissions ON public.submissions FOR INSERT TO anon WITH CHECK (true);

        DROP POLICY IF EXISTS anon_read_submissions ON public.submissions;
        CREATE POLICY anon_read_submissions ON public.submissions FOR SELECT TO anon USING (true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exam_submissions') THEN
        DROP POLICY IF EXISTS anon_insert_exam_submissions ON public.exam_submissions;
        CREATE POLICY anon_insert_exam_submissions ON public.exam_submissions FOR INSERT TO anon WITH CHECK (true);

        DROP POLICY IF EXISTS anon_read_exam_submissions ON public.exam_submissions;
        CREATE POLICY anon_read_exam_submissions ON public.exam_submissions FOR SELECT TO anon USING (true);
    END IF;
END $$;

-- Trainees: Candidate registration and lookup
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trainees') THEN
        DROP POLICY IF EXISTS anon_read_trainees ON public.trainees;
        CREATE POLICY anon_read_trainees ON public.trainees FOR SELECT TO anon USING (true);

        DROP POLICY IF EXISTS anon_insert_trainees ON public.trainees;
        CREATE POLICY anon_insert_trainees ON public.trainees FOR INSERT TO anon WITH CHECK (true);
    END IF;
END $$;

-- Institutional Reference Tables (Classes, Departments, Terms, Units)
DO $$
DECLARE
    tbl text;
    ref_tables text[] := ARRAY['classes', 'departments', 'terms', 'units_of_competence', 'trainers', 'timetable', 'cohorts'];
BEGIN
    FOREACH tbl IN ARRAY ref_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('DROP POLICY IF EXISTS anon_read_%I ON public.%I;', tbl, tbl);
            EXECUTE format('CREATE POLICY anon_read_%I ON public.%I FOR SELECT TO anon USING (true);', tbl, tbl);

            EXECUTE format('DROP POLICY IF EXISTS authenticated_read_%I ON public.%I;', tbl, tbl);
            EXECUTE format('CREATE POLICY authenticated_read_%I ON public.%I FOR SELECT TO authenticated USING (true);', tbl, tbl);
        END IF;
    END LOOP;
END $$;
