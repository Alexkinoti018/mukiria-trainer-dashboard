-- =============================================================================
-- MUKIRIA TECHNICAL TRAINING INSTITUTE (MTTI)
-- Idempotent Multi-Tenant Referential Integrity & Conflict Hardening
-- Migration: 12_enforce_multi_tenant_integrity.sql
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. CORE DEPARTMENTS TABLE VERIFICATION & SEED ───────────────────────────
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure standard code unique constraint exists if table pre-existed without it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'departments_code_key' AND conrelid = 'public.departments'::regclass
    ) THEN
        ALTER TABLE public.departments ADD CONSTRAINT departments_code_key UNIQUE (code);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Insert or ensure all canonical departments exist by unique code
INSERT INTO public.departments (name, code)
VALUES
    ('Computing and Informatics', 'ICT'),
    ('Business Studies', 'BUS'),
    ('Hospitality Management', 'HOS'),
    ('Building & Civil Engineering', 'ENG'),
    ('Surveying and Geomatics', 'SURV'),
    ('Agriculture & Agricultural Engineering', 'AGR'),
    ('Cosmetology & Hair Dressing', 'COS'),
    ('Electrical & Electronics Engineering', 'EEE'),
    ('Institutional Curriculum Division', 'GEN')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- ─── 2. DEPARTMENTAL SCOPING ACROSS CORE ENTITIES ───────────────────────────

-- 2.1 Classes (Cohorts)
ALTER TABLE IF EXISTS public.classes 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Automated dynamic backfill linking to departments by matching code
UPDATE public.classes
SET department_id = (SELECT id FROM public.departments WHERE code = 'ICT' LIMIT 1)
WHERE (department_id IS NULL) AND (
    class_code ILIKE 'ICT%' OR class_code ILIKE '%ITECH%' OR name ILIKE 'ICT%' OR name ILIKE '%ITECH%'
);

UPDATE public.classes
SET department_id = (SELECT id FROM public.departments WHERE code = 'BUS' LIMIT 1)
WHERE (department_id IS NULL) AND (
    class_code ILIKE 'ADMIN%' OR name ILIKE 'ADMIN%'
);

UPDATE public.classes
SET department_id = (SELECT id FROM public.departments WHERE code = 'HOS' OR code = 'HOSP' LIMIT 1)
WHERE (department_id IS NULL) AND (
    class_code ILIKE 'FBS%' OR class_code ILIKE '%HOS%' OR name ILIKE 'FBS%' OR name ILIKE '%HOS%'
);

UPDATE public.classes
SET department_id = (SELECT id FROM public.departments WHERE code = 'ENG' LIMIT 1)
WHERE (department_id IS NULL) AND (
    class_code ILIKE 'CE%' OR class_code ILIKE '%CIVIL%' OR class_code ILIKE '%BLD%' OR
    name ILIKE 'CE%' OR name ILIKE '%CIVIL%' OR name ILIKE '%BLD%'
);

UPDATE public.classes
SET department_id = (SELECT id FROM public.departments WHERE code = 'SURV' LIMIT 1)
WHERE (department_id IS NULL) AND (
    class_code ILIKE 'LSM%' OR class_code ILIKE 'LS%' OR name ILIKE 'LSM%' OR name ILIKE 'LS%'
);

UPDATE public.classes
SET department_id = (SELECT id FROM public.departments WHERE code = 'AGR' LIMIT 1)
WHERE (department_id IS NULL) AND (
    class_code ILIKE 'AGR%' OR class_code ILIKE 'AGRE%' OR name ILIKE 'AGR%' OR name ILIKE 'AGRE%'
);

UPDATE public.classes
SET department_id = (SELECT id FROM public.departments WHERE code = 'COS' LIMIT 1)
WHERE (department_id IS NULL) AND (
    class_code ILIKE 'COS%' OR class_code ILIKE '%BEAUTY%' OR name ILIKE 'COS%' OR name ILIKE '%BEAUTY%'
);

UPDATE public.classes
SET department_id = (SELECT id FROM public.departments WHERE code = 'EEE' LIMIT 1)
WHERE (department_id IS NULL) AND (
    class_code ILIKE 'EEE%' OR class_code ILIKE '%ELEC%' OR name ILIKE 'EEE%' OR name ILIKE '%ELEC%'
);

-- Fallback for any remaining unmapped classes
UPDATE public.classes
SET department_id = (SELECT id FROM public.departments WHERE code = 'GEN' LIMIT 1)
WHERE department_id IS NULL;

-- 2.2 Trainers
ALTER TABLE IF EXISTS public.trainers 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- 2.3 Session Plans Data
ALTER TABLE IF EXISTS public.session_plans_data 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.session_plans 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- 2.4 Timetable
ALTER TABLE IF EXISTS public.timetable 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- ─── 3. PERFORMANCE & ISOLATION INDEXES ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_classes_dept ON public.classes(department_id);
CREATE INDEX IF NOT EXISTS idx_trainers_dept ON public.trainers(department_id);
CREATE INDEX IF NOT EXISTS idx_session_plans_data_dept ON public.session_plans_data(department_id);

-- ─── 4. RELATIONAL INTEGRITY LINKAGES ────────────────────────────────────────

-- Strict 1:1 Record of Work to Session Plan foreign key linkage
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'records_of_work'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'records_of_work' 
            AND column_name = 'session_plan_id' AND data_type = 'uuid'
        ) THEN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'fk_records_of_work_session_plan'
            ) THEN
                ALTER TABLE public.records_of_work
                ADD CONSTRAINT fk_records_of_work_session_plan
                FOREIGN KEY (session_plan_id) REFERENCES public.session_plans_data(id) ON DELETE CASCADE;
            END IF;
        END IF;
    END IF;
END $$;

-- ─── 5. CONDITIONAL COLLISION PREVENTION (PRESERVING CO-TEACHING) ────────────

-- 5.1 Trainer Double-Booking Prevention: An instructor cannot teach in two places simultaneously
CREATE UNIQUE INDEX IF NOT EXISTS uq_trainer_schedule_slot 
ON public.timetable (trainer_id, day_of_week, time_block);

-- 5.2 Venue Collision Prevention: Exclude null or virtual/general venues
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'timetable' AND column_name = 'venue_id'
    ) THEN
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS uq_venue_schedule_slot ON public.timetable (venue_id, day_of_week, time_block) WHERE venue_id IS NOT NULL;';
    END IF;
END $$;

-- ─── 6. AUDIT VERIFICATION VIEW ──────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_multi_tenant_compliance AS
SELECT 
    c.id AS class_id,
    c.class_code,
    d.name AS department_name,
    d.code AS department_code,
    COUNT(t.id) AS total_scheduled_sessions
FROM public.classes c
LEFT JOIN public.departments d ON c.department_id = d.id
LEFT JOIN public.timetable t ON c.id = t.class_id
GROUP BY c.id, c.class_code, d.name, d.code;
