-- ============================================================================
-- MUKIRIA TECHNICAL TRAINING INSTITUTE
-- Migration 06: Seed Official Digital Literacy Roster (45 Trainees Across 4 Cohorts)
-- Unit: Apply Digital Literacy (061155101A / 061155101A-WA1)
-- Cohorts: FBS 5 MOD/J/2026, FBS6 MOD/J/2026, LS5 MOD/S/2026, LS6 MOD/S/2026
-- ============================================================================

-- 1. Ensure Departments Exist
INSERT INTO public.departments (id, name, code)
VALUES 
  ('dept-fbs', 'Food & Beverage / Hospitality', 'FBS'),
  ('dept-ls', 'Land Surveying & Geomatics', 'LS')
ON CONFLICT (code) DO NOTHING;

-- 2. Ensure Classes Exist
INSERT INTO public.classes (id, class_code, name, department_id, level, duration)
VALUES 
  ('class-fbs5-mod-2026', 'FBS 5 MOD/J/2026', 'FBS 5 MOD/J/2026', 'dept-fbs', 'Level 5', 'Term 3 2026'),
  ('class-fbs6-mod-2026', 'FBS6 MOD/J/2026', 'FBS6 MOD/J/2026', 'dept-fbs', 'Level 6', 'Term 3 2026'),
  ('class-ls5-mod-2026', 'LS5 MOD/S/2026', 'LS5 MOD/S/2026', 'dept-ls', 'Level 5', 'Term 3 2026'),
  ('class-ls6-mod-2026', 'LS6 MOD/S/2026', 'LS6 MOD/S/2026', 'dept-ls', 'Level 6', 'Term 3 2026')
ON CONFLICT (class_code) DO UPDATE SET
  name = EXCLUDED.name,
  level = EXCLUDED.level,
  duration = EXCLUDED.duration;

-- 3. Ensure Digital Literacy Unit Offerings Exist
INSERT INTO public.unit_offerings (id, unit_code, title, class_code, trainer_id, term, year)
VALUES 
  ('uo_fbs5_dl', '061155101A-WA1', 'Apply Digital Literacy', 'FBS 5 MOD/J/2026', 'user_trainer_001', 'Term 3', 2026),
  ('uo_fbs6_dl', '061155101A-WA1', 'Apply Digital Literacy', 'FBS6 MOD/J/2026', 'user_trainer_001', 'Term 3', 2026),
  ('uo_ls5_dl', '061155101A-WA1', 'Apply Digital Literacy', 'LS5 MOD/S/2026', 'user_trainer_001', 'Term 3', 2026),
  ('uo_ls6_dl', '061155101A-WA1', 'Apply Digital Literacy', 'LS6 MOD/S/2026', 'user_trainer_001', 'Term 3', 2026)
ON CONFLICT (id) DO NOTHING;

-- 4. Upsert 45 Official Trainees (Strictly Zero Email Addresses)
INSERT INTO public.trainees (id, reg_code, adm_no, name, class_code, department)
VALUES
  -- 1. FBS 5 MOD/J/2026 (20 Trainees)
  ('tr_fbs5_01', 'FBS 5 MOD/13254/12026', '13254', 'Yvonne Mwende', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_02', 'FBS 5 MOD/13263/12026', '13263', 'Muoki Muthoki', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_03', 'FBS 5 MOD/13281/12026', '13281', 'Kibaara Peninah Gaichuiri', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_04', 'FBS 5 MOD/13297/12026', '13297', 'Hilda Mwede Njagi', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_05', 'FBS 5 MOD/13304/12026', '13304', 'Ndolo Shalom Mbithe', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_06', 'FBS 5 MOD/13313/12026', '13313', 'Mirriam Nzula', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_07', 'FBS 5 MOD/13343/12026', '13343', 'Waweru Hope Marion Makena', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_08', 'FBS 5 MOD/13355/12026', '13355', 'Ann Joy Makena', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_09', 'FBS 5 MOD/13378/12026', '13378', 'Martha Mwende Kyalo', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_10', 'FBS 5 MOD/13396/12026', '13396', 'John Opiyo Omondi', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_11', 'FBS 5 MOD/13445/12026', '13445', 'Eunice Kendi Nyaga', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_12', 'FBS 5 MOD/13446/12026', '13446', 'Miriko Rita', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_13', 'FBS 5 MOD/13463/12026', '13463', 'Valentine Lesoito', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_14', 'FBS 5 MOD/13482/12026', '13482', 'Kinyua Christine Mutito', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_15', 'FBS 5 MOD/13488/12026', '13488', 'Gichukia Bridgit Nyakio', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_16', 'FBS 5 MOD/13546/12026', '13546', 'Karwitha Silvia', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_17', 'FBS 5 MOD/13551/12026', '13551', 'Lavint Aliviza', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_18', 'FBS 5 MOD/13559/12026', '13559', 'Kinya Weddy', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_19', 'FBS 5 MOD/13571/12026', '13571', 'Gakuhi Jackline Nyambura', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs5_20', 'FBS 5 MOD/13583/12026', '13583', 'Terry Mwendwa', 'FBS 5 MOD/J/2026', 'FBS Hospitality'),

  -- 2. FBS6 MOD/J/2026 (6 Trainees)
  ('tr_fbs6_01', 'FBP6 MOD/13251/12026', '13251', 'Mbithi Faith Wavinya', 'FBS6 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs6_02', 'FBS6 MOD/13314/12026', '13314', 'Emmanuel Njoroge', 'FBS6 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs6_03', 'FBS6 MOD/13403/12026', '13403', 'Brenda Ntinyari', 'FBS6 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs6_04', 'FBS6 MOD/13430/12026', '13430', 'Omedo Lilian Atieno', 'FBS6 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs6_05', 'FBS6 MOD/13487/12026', '13487', 'Waguama Donatus Wachira', 'FBS6 MOD/J/2026', 'FBS Hospitality'),
  ('tr_fbs6_06', 'FBS6 MOD/13495/12026', '13495', 'Nyamai Caroline Mutheu', 'FBS6 MOD/J/2026', 'FBS Hospitality'),

  -- 3. LS5 MOD/S/2026 (9 Trainees)
  ('tr_ls5_01', 'LS5 MOD/14009/52026', '14009', 'Vick Mutembei', 'LS5 MOD/S/2026', 'Land Surveying'),
  ('tr_ls5_02', 'LS5 MOD/14024/52026', '14024', 'Kajuju Jackline Kathera', 'LS5 MOD/S/2026', 'Land Surveying'),
  ('tr_ls5_03', 'LS5 MOD/14032/52026', '14032', 'Muthike Bredah Nyawira', 'LS5 MOD/S/2026', 'Land Surveying'),
  ('tr_ls5_04', 'LS5 MOD/14092/S2026', '14092', 'Murithi Brian Munene', 'LS5 MOD/S/2026', 'Land Surveying'),
  ('tr_ls5_05', 'LS5 MOD/14120/52026', '14120', 'Glory Makena', 'LS5 MOD/S/2026', 'Land Surveying'),
  ('tr_ls5_06', 'LS5 MOD/14348/S2026', '14348', 'Okello Janet Auma', 'LS5 MOD/S/2026', 'Land Surveying'),
  ('tr_ls5_07', 'LS5 MOD/14403/52026', '14403', 'Mutegi Kagendo Emma', 'LS5 MOD/S/2026', 'Land Surveying'),
  ('tr_ls5_08', 'LS5 MOD/14428/52026', '14428', 'Risper Mwendwa', 'LS5 MOD/S/2026', 'Land Surveying'),
  ('tr_ls5_09', 'LS5 MOD/14502/52026', '14502', 'Mutegi Hyprith Gatwiri', 'LS5 MOD/S/2026', 'Land Surveying'),

  -- 4. LS6 MOD/S/2026 (10 Trainees)
  ('tr_ls6_01', 'LS6 MOD/14001/S2026', '14001', 'Njeru Salim Mutemi', 'LS6 MOD/S/2026', 'Land Surveying'),
  ('tr_ls6_02', 'LS6 MOD/14011/S2026', '14011', 'Jedida Karwitha', 'LS6 MOD/S/2026', 'Land Surveying'),
  ('tr_ls6_03', 'LS6 MOD/14066/52026', '14066', 'Nyaga Caroline Mukami', 'LS6 MOD/S/2026', 'Land Surveying'),
  ('tr_ls6_04', 'LS6 MOD/14183/S2026', '14183', 'Gideon Mucheria Kithendu', 'LS6 MOD/S/2026', 'Land Surveying'),
  ('tr_ls6_05', 'LS6 MOD/14256/52026', '14256', 'Linus Murerwa', 'LS6 MOD/S/2026', 'Land Surveying'),
  ('tr_ls6_06', 'LS6 MOD/14283/52026', '14283', 'Caroline Mwendwa', 'LS6 MOD/S/2026', 'Land Surveying'),
  ('tr_ls6_07', 'LS6 MOD/14331/S2026', '14331', 'Brian Mutembei', 'LS6 MOD/S/2026', 'Land Surveying'),
  ('tr_ls6_08', 'LS6 MOD/14332/52026', '14332', 'Kipngetich Cornelius', 'LS6 MOD/S/2026', 'Land Surveying'),
  ('tr_ls6_09', 'LS6 MOD/14351/52026', '14351', 'Otieno Jecinter Trizer', 'LS6 MOD/S/2026', 'Land Surveying'),
  ('tr_ls6_10', 'LS6 MOD/14451/S2026', '14451', 'Caroline Kanana Mwirigi', 'LS6 MOD/S/2026', 'Land Surveying')
ON CONFLICT (id) DO UPDATE SET
  reg_code = EXCLUDED.reg_code,
  adm_no = EXCLUDED.adm_no,
  name = EXCLUDED.name,
  class_code = EXCLUDED.class_code,
  department = EXCLUDED.department;
