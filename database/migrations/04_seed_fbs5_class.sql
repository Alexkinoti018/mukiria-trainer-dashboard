-- ============================================================================
-- MUKIRIA TECHNICAL TRAINING INSTITUTE
-- Migration 04: Seed FBS 5 MOD/J/2026 Roster & Class Assignment
-- Unit: Apply Digital Literacy (Level 5) | Lecturer: Alexander Kinoti
-- Document: MTTI/REG/CUR/02 General Class Register
-- ============================================================================

-- 1. Ensure Department Exists
INSERT INTO public.departments (id, name, code)
VALUES ('dept-fbs', 'Food & Beverage / Hospitality', 'FBS')
ON CONFLICT (code) DO NOTHING;

-- 2. Ensure Class Exists
INSERT INTO public.classes (id, class_code, name, department_id, level, duration)
VALUES (
  'class-fbs5-mod-2026',
  'FBS 5 MOD/J/2026',
  'FBS 5 MOD/J/2026',
  'dept-fbs',
  'Level 5',
  'Term 3 2026'
)
ON CONFLICT (class_code) DO UPDATE SET
  name = EXCLUDED.name,
  level = EXCLUDED.level,
  duration = EXCLUDED.duration;

-- 3. Upsert 20 Official Trainees from Register
INSERT INTO public.trainees (id, reg_code, adm_no, name, class_code, department)
VALUES
  ('tr_fbs5_01', 'FBS 5 MOD/13254/J2026', '13254', 'Yvonne Mwende', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_02', 'FBS 5 MOD/13263/J2026', '13263', 'Muoki Muthoki', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_03', 'FBS 5 MOD/13281/J2026', '13281', 'Kibaara Peninah Gaichuiri', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_04', 'FBS 5 MOD/13297/J2026', '13297', 'Hilda Mwede Njagi', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_05', 'FBS 5 MOD/13304/J2026', '13304', 'Ndolo Shalom Mbithe', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_06', 'FBS 5 MOD/13313/J2026', '13313', 'Mirriam Nzula', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_07', 'FBS 5 MOD/13343/J2026', '13343', 'Waweru Hope Marion Makena', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_08', 'FBS 5 MOD/13355/J2026', '13355', 'Ann Joy Makena', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_09', 'FBS 5 MOD/13378/J2026', '13378', 'Martha Mwende Kyalo', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_10', 'FBS 5 MOD/13396/J2026', '13396', 'John Opiyo Omondi', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_11', 'FBS 5 MOD/13445/J2026', '13445', 'Eunice Kendi Nyaga', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_12', 'FBS 5 MOD/13446/J2026', '13446', 'Miriko Rita', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_13', 'FBS 5 MOD/13463/J2026', '13463', 'Valentine Lesoito', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_14', 'FBS 5 MOD/13482/J2026', '13482', 'Kinyua Christine Mutito', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_15', 'FBS 5 MOD/13488/J2026', '13488', 'Gichukia Bridgit Nyakio', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_16', 'FBS 5 MOD/13546/J2026', '13546', 'Karwitha Silvia', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_17', 'FBS 5 MOD/13551/J2026', '13551', 'Lavint Aliviza', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_18', 'FBS 5 MOD/13559/J2026', '13559', 'Kinya Weddy', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_19', 'FBS 5 MOD/13571/J2026', '13571', 'Gakuhi Jackline Nyambura', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_20', 'FBS 5 MOD/13583/J2026', '13583', 'Terry Mwendwa', 'FBS 5 MOD/J/2026', 'FBS Hospitality')
ON CONFLICT (id) DO UPDATE SET
  reg_code = EXCLUDED.reg_code,
  adm_no = EXCLUDED.adm_no,
  name = EXCLUDED.name,
  class_code = EXCLUDED.class_code,
  department = EXCLUDED.department;

-- 4. Assign Class & Unit to Alexander Kinoti
INSERT INTO public.unit_offerings (id, unit_code, title, class_code, trainer_id, term, year)
VALUES (
  'uo_fbs5_adl',
  'HBS/OS/COS/BC/01/5/MA',
  'Apply Digital Literacy',
  'FBS 5 MOD/J/2026',
  'user_trainer_001',
  'Term 3',
  2026
)
ON CONFLICT (id) DO NOTHING;
