-- ============================================================================
-- MUKIRIA TECHNICAL TRAINING INSTITUTE
-- Migration 08: Seed Official ICT4/ITECH6/S/26 MOD 1 Cohort Roster & Ready State
-- Document Reference: MTTI/REG/CUR/02 & Computer essential Checklist.pdf
-- Class Code: ICT4/ITECH6/S/26 MOD 1 (Combined Level 4 & 6 Modular Cohort)
-- Series: SEPTEMBER-DECEMBER 2026
-- Units:
--   1. Perform Computer Essentials (IT/CU/ICTA/CR/01/4/MA / 0611-651-21A)
--   2. Apply Digital Literacy (061155101A / 061155101A-WA1)
-- Trainees: 21 Official Candidates (Strictly Zero Email Addresses)
-- ============================================================================

-- 1. Ensure Department Exists
INSERT INTO public.departments (id, name, code)
VALUES ('dept-ci', 'Computing & Informatics', 'CI')
ON CONFLICT (code) DO NOTHING;

-- 2. Ensure Class Exists (Support both ICT4/ITECH6/S/2026 MOD 1 and ICT4/ITECH6/S/26 MOD 1)
INSERT INTO public.classes (id, class_code, name, department_id, level, duration)
VALUES 
  ('class-ict4-itech6-mod1-2026', 'ICT4/ITECH6/S/26 MOD 1', 'ICT4/ITECH6/S/26 MOD 1', 'dept-ci', 'Level 4 & 6', 'Term 3 2026'),
  ('class-ict4-itech6-mod1-2026-full', 'ICT4/ITECH6/S/2026 MOD 1', 'ICT4/ITECH6/S/2026 MOD 1', 'dept-ci', 'Level 4 & 6', 'Term 3 2026')
ON CONFLICT (class_code) DO UPDATE SET
  name = EXCLUDED.name,
  level = EXCLUDED.level,
  duration = EXCLUDED.duration;

-- 3. Ensure Unit Offerings Exist (Perform Computer Essentials ONLY - Zero Digital Literacy)
INSERT INTO public.unit_offerings (id, unit_code, title, class_code, trainer_id, term, year)
VALUES 
  ('uo_ict4_itech6_mod1_essentials', 'IT/CU/ICTA/CR/01/4/MA', 'Perform Computer Essentials', 'ICT4/ITECH6/S/26 MOD 1', 'user_trainer_001', 'Term 3', 2026),
  ('uo_ict4_itech6_mod1_essentials_2026', 'IT/CU/ICTA/CR/01/4/MA', 'Perform Computer Essentials', 'ICT4/ITECH6/S/2026 MOD 1', 'user_trainer_001', 'Term 3', 2026)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  class_code = EXCLUDED.class_code;

-- 4. Ensure Formative Practical Exam Exists and is Active (Ready State)
INSERT INTO public.exams (
  id, unit_id, class_id, trainer_id, unit_code, course_name, title,
  duration_minutes, total_marks, instructions, type, payload
)
VALUES (
  'exam_it4_itech6_essentials',
  NULL,
  'class-ict4-itech6-mod1-2026',
  'user_trainer_001',
  'IT/CU/ICTA/CR/01/4/MA',
  'ICT 4 / ICT Technician Level 5 & 6',
  'Perform Computer Essentials — Formative Practical Assessment & Observation Checklist',
  180,
  100,
  'Perform prescribed practical tasks in order: Device management, desktop & file management, software & online jobs.',
  'practical',
  jsonb_build_object(
    'title', 'Perform Computer Essentials — Formative Practical Assessment & Observation Checklist',
    'duration_minutes', 180,
    'total_marks', 100,
    'type', 'practical',
    'series', 'SEPTEMBER-DECEMBER 2026',
    'class', 'ICT4/ITECH6/S/26 MOD 1',
    'course_code', '06104ICTMA',
    'start_time', '2026-09-01T08:00:00Z',
    'end_time', '2026-12-31T23:59:59Z',
    'instructions', 'Follow assessor instructions across Practical Sessions 1, 2, 3 and oral examinations.',
    'sections', jsonb_build_array(
      jsonb_build_object('name', 'Practical 1', 'title', 'Manage Computer Devices', 'marks', 35),
      jsonb_build_object('name', 'Oral 1', 'title', 'Hardware & Diagnostics Oral Questions', 'marks', 20),
      jsonb_build_object('name', 'Practical 2', 'title', 'Manage Desktop Settings & File Management', 'marks', 40),
      jsonb_build_object('name', 'Oral 2', 'title', 'File Systems & BIOS Oral Questions', 'marks', 26),
      jsonb_build_object('name', 'Practical 3', 'title', 'Manage Software & Online Jobs', 'marks', 40),
      jsonb_build_object('name', 'Oral 3', 'title', 'Cybersecurity & Cloud Storage Oral Questions', 'marks', 20)
    )
  )
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  payload = EXCLUDED.payload;

-- 5. Upsert 19 Official Trainees into Institutional Class Register (Zero Email Addresses)
INSERT INTO public.trainees (id, reg_code, adm_no, name, class_code, department)
VALUES
  -- ── Section A: ITECH 6 Cohort Members (11 Trainees) ──
  ('tr_it6_01', 'ITECH 6 MOD/14179/S2026', '14179', 'Nthiga Gakii Doris', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it6_02', 'ITECH 6 MOD/14255/S2026', '14255', 'Kaumbuthu Belinda Mukiri', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it6_03', 'ITECH 6 MOD/14022/S2026', '14022', 'Ltumwa Lesoipa', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it6_04', 'ITECH 6 MOD/14077/S2026', '14077', 'Kitheka Emmanuel Kioko', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it6_05', 'ITECH 6 MOD/14102/S2026', '14102', 'Felix Mugendi', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it6_06', 'ITECH 6 MOD/14119/S2026', '14119', 'Mwangi Clinton Njiru', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it6_07', 'ITECH 6 MOD/14149/S2026', '14149', 'Abigael Mukiri', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it6_08', 'ITECH 6 MOD/14172/S2026', '14172', 'Fiona Kadogo Mwika', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it6_09', 'ITECH 6 MOD/14207/S2026', '14207', 'Ann Mary Makena', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it6_10', 'ITECH 6 MOD/14254/S2026', '14254', 'Brenda Ngugi', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it6_11', 'ITECH 6 MOD/14267/S2026', '14267', 'Ingashia Favour Wawira', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),

  -- ── Section B: ICT 4 Cohort Members (8 Trainees) ──
  ('tr_it4_01', 'ICT4 MOD/14076/S2026', '14076', 'Wanjau Alvin Gatere', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it4_02', 'ICT4 MOD/14107/S2026', '14107', 'Ann Mukiri Matheta', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it4_03', 'ICT4 MOD/14124/S2026', '14124', 'Kimanthi Dennis Mwenda', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it4_04', 'ICT4 MOD/14128/S2026', '14128', 'Kimanthi Dennis Mwenda (II)', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it4_05', 'ICT4 MOD/14211/S2026', '14211', 'Guantai Brandon Mutua', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it4_06', 'ICT4 MOD/14218/S2026', '14218', 'Mwithia Mutharimi Nathan', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it4_07', 'ICT4 MOD/14248/S2026', '14248', 'Mbaabu Sarah Nkatha', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics'),
  ('tr_it4_08', 'ICT4 MOD/14341/S2026', '14341', 'Mutiria Hesborn Muriuki', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics')
ON CONFLICT (id) DO UPDATE SET
  reg_code = EXCLUDED.reg_code,
  adm_no = EXCLUDED.adm_no,
  name = EXCLUDED.name,
  class_code = EXCLUDED.class_code,
  department = EXCLUDED.department;
