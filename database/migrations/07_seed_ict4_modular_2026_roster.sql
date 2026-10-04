-- ============================================================================
-- MUKIRIA TECHNICAL TRAINING INSTITUTE
-- Migration 07: Seed Official ICT4 MOD/S/2026 Cohort Roster & Unit Offerings
-- Cohort: ICT4 MOD/S/2026 (Artisan in ICT / Level 4 Computing & Informatics)
-- Units: 
--   1. Apply Digital Literacy (061155101A / 061155101A-WA1)
--   2. Perform Computer Essentials (IT/CU/ICTA/CR/01/4/MA / 0611-651-21A)
-- Trainees: 8 Official Candidates (Zero Email Addresses)
-- ============================================================================

-- 1. Ensure Department Exists
INSERT INTO public.departments (id, name, code)
VALUES ('dept-ci', 'Computing & Informatics', 'CI')
ON CONFLICT (code) DO NOTHING;

-- 2. Ensure Class Exists
INSERT INTO public.classes (id, class_code, name, department_id, level, duration)
VALUES (
  'class-ict4-mod-2026',
  'ICT4 MOD/S/2026',
  'ICT4 MOD/S/2026',
  'dept-ci',
  'Level 4',
  'Term 3 2026'
)
ON CONFLICT (class_code) DO UPDATE SET
  name = EXCLUDED.name,
  level = EXCLUDED.level,
  duration = EXCLUDED.duration;

-- 3. Ensure Unit Offerings Exist (Perform Computer Essentials ONLY - Zero Digital Literacy)
INSERT INTO public.unit_offerings (id, unit_code, title, class_code, trainer_id, term, year)
VALUES 
  ('uo_ict4_essentials', 'IT/CU/ICTA/CR/01/4/MA', 'Perform Computer Essentials', 'ICT4 MOD/S/2026', 'user_trainer_001', 'Term 3', 2026)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  class_code = EXCLUDED.class_code;

-- 4. Upsert Official ICT4 Trainees (Strictly Zero Email Addresses)
INSERT INTO public.trainees (id, reg_code, adm_no, name, class_code, department)
VALUES
  ('tr_it4_01', 'ICT4 MOD/14076/S2026', '14076', 'Wanjau Alvin Gatere', 'ICT4 MOD/S/2026', 'Computing & Informatics'),
  ('tr_it4_02', 'ICT4 MOD/14107/S2026', '14107', 'Ann Mukiri Matheta', 'ICT4 MOD/S/2026', 'Computing & Informatics'),
  ('tr_it4_03', 'ICT4 MOD/14124/S2026', '14124', 'Kimanthi Dennis Mwenda', 'ICT4 MOD/S/2026', 'Computing & Informatics'),
  ('tr_it4_04', 'ICT4 MOD/14128/S2026', '14128', 'Kimanthi Dennis Mwenda (II)', 'ICT4 MOD/S/2026', 'Computing & Informatics'),
  ('tr_it4_05', 'ICT4 MOD/14211/S2026', '14211', 'Guantai Brandon Mutua', 'ICT4 MOD/S/2026', 'Computing & Informatics'),
  ('tr_it4_06', 'ICT4 MOD/14218/S2026', '14218', 'Mwithia Mutharimi Nathan', 'ICT4 MOD/S/2026', 'Computing & Informatics'),
  ('tr_it4_07', 'ICT4 MOD/14248/S2026', '14248', 'Mbaabu Sarah Nkatha', 'ICT4 MOD/S/2026', 'Computing & Informatics'),
  ('tr_it4_08', 'ICT4 MOD/14341/S2026', '14341', 'Mutiria Hesborn Muriuki', 'ICT4 MOD/S/2026', 'Computing & Informatics')
ON CONFLICT (id) DO UPDATE SET
  reg_code = EXCLUDED.reg_code,
  adm_no = EXCLUDED.adm_no,
  name = EXCLUDED.name,
  class_code = EXCLUDED.class_code,
  department = EXCLUDED.department;
