-- ============================================================
-- Mukiria Technical Training Institute (MTTI)
-- Idempotent Institutional Database Seed Script
-- Generated from database/seeds/*.json fixtures
-- ============================================================

BEGIN;

-- 1. Trainees
INSERT INTO trainees (id, name, reg_number, adm_no, reg_code, class_code, department, gender, phone, remarks, updated_at)
VALUES ('tr_1791155578578_6sfojk', 'Test Trainee Persistence', 'TEST/99999/S2026', 'TEST/99999/S2026', 'TEST/99999/S2026', 'ICT4/ITECH6/S/26 MOD 1', 'Computing & Informatics', 'M', '0712345678', 'Verification trainee', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, class_code = EXCLUDED.class_code, updated_at = CURRENT_TIMESTAMP;
INSERT INTO trainees (id, name, reg_number, adm_no, reg_code, class_code, department, gender, phone, remarks, updated_at)
VALUES ('tr_1791576675220_xm5wbvuxz', 'Alex  Teacher', 'TED/092/18', 'TED/092/18', 'TED/092/18', 'ADMIN5/6/J/26 MOD 3', 'Business Studies', 'M', '', '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, class_code = EXCLUDED.class_code, updated_at = CURRENT_TIMESTAMP;
INSERT INTO trainees (id, name, reg_number, adm_no, reg_code, class_code, department, gender, phone, remarks, updated_at)
VALUES ('tr_1791577241020_4dqoi35vr', 'Harriet Mwendwa', 'D/UPNUT/25042/069', 'D/UPNUT/25042/069', 'D/UPNUT/25042/069', 'ADMIN5/6/J/26 MOD 3', 'Business Studies', 'F', '0114282240', 'External learner', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, class_code = EXCLUDED.class_code, updated_at = CURRENT_TIMESTAMP;

-- 2. Attendance Records (738 entries)
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791155609368_i9bz4z', 'uo-1', 'tr_it6_01', 6, '2026-10-04', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791155609368_wbxooz', 'uo-1', 'tr_it6_02', 6, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791155609368_er4lrw', 'uo-1', 'tr_it6_03', 6, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_7bowsj', 'uo-1', 'tr_it6_01', 5, '2026-10-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_hbhgo1', 'uo-1', 'tr_it6_01', 4, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528738845_6qva4j', 'uo-1', 'tr_it6_02', 5, '2026-10-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528741498_bk40mb', 'uo-1', 'tr_it6_02', 4, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528755063_e2xcep', 'uo-1', 'tr_it6_01', 7, '2026-10-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528755606_ikk9zw', 'uo-1', 'tr_it6_02', 7, '2026-10-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528759905_ylwz0a', 'uo-1', 'tr_it6_03', 5, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528761689_gwg7zw', 'uo-1', 'tr_it6_03', 4, '2026-10-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_tby6sa', 'uo-1', 'tr_it6_01', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_9e6s4e', 'uo-1', 'tr_it6_01', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_suomjq', 'uo-1', 'tr_it6_01', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_e8zsho', 'uo-1', 'tr_it6_02', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_m1dy0o', 'uo-1', 'tr_it6_02', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_9lnfzv', 'uo-1', 'tr_it6_02', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_b6klki', 'uo-1', 'tr_it6_03', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_hsdeqq', 'uo-1', 'tr_it6_03', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_r5rmm9', 'uo-1', 'tr_it6_03', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_w8qc57', 'uo-1', 'tr_it6_04', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_226uh9', 'uo-1', 'tr_it6_04', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_xspkx6', 'uo-1', 'tr_it6_04', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_pb0a3t', 'uo-1', 'tr_it6_05', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_smfjim', 'uo-1', 'tr_it6_05', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_kbebhi', 'uo-1', 'tr_it6_05', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_l7oeg6', 'uo-1', 'tr_it6_06', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_dhy9lk', 'uo-1', 'tr_it6_06', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_7keg6a', 'uo-1', 'tr_it6_06', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_dzf5o7', 'uo-1', 'tr_it6_07', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_qmkuyt', 'uo-1', 'tr_it6_07', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_gyuotw', 'uo-1', 'tr_it6_07', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_hhxd4k', 'uo-1', 'tr_it6_08', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_2edxho', 'uo-1', 'tr_it6_08', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_tpwz9w', 'uo-1', 'tr_it6_08', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_46g335', 'uo-1', 'tr_it6_09', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_a6msmf', 'uo-1', 'tr_it6_09', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_zxpcz6', 'uo-1', 'tr_it6_09', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_u341ox', 'uo-1', 'tr_it6_10', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_w30xam', 'uo-1', 'tr_it6_10', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765151_6ggp0r', 'uo-1', 'tr_it6_10', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765153_9klofb', 'uo-1', 'tr_it6_11', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765153_he13p8', 'uo-1', 'tr_it6_11', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765153_srtmvr', 'uo-1', 'tr_it6_11', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765153_mbft8q', 'uo-1', 'tr_it4_01', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765153_xiibxp', 'uo-1', 'tr_it4_01', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765153_gal48d', 'uo-1', 'tr_it4_01', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765153_rsndjo', 'uo-1', 'tr_it4_02', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765153_3gocdn', 'uo-1', 'tr_it4_02', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765153_pz547b', 'uo-1', 'tr_it4_02', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765153_ivhgup', 'uo-1', 'tr_it4_03', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765153_g9lrnl', 'uo-1', 'tr_it4_03', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765153_espyey', 'uo-1', 'tr_it4_03', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765153_darjoe', 'uo-1', 'tr_it4_04', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765153_kp9kay', 'uo-1', 'tr_it4_04', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765153_bgbs8e', 'uo-1', 'tr_it4_04', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_cch70t', 'uo-1', 'tr_it4_05', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_aru1ke', 'uo-1', 'tr_it4_05', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_2qstaa', 'uo-1', 'tr_it4_05', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_i8dh4w', 'uo-1', 'tr_it4_06', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_tw7hdm', 'uo-1', 'tr_it4_06', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_uw2q2a', 'uo-1', 'tr_it4_06', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_felexz', 'uo-1', 'tr_it4_07', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_gnzgd5', 'uo-1', 'tr_it4_07', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_zxdaqe', 'uo-1', 'tr_it4_07', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_5nz835', 'uo-1', 'tr_it4_08', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_7or7pu', 'uo-1', 'tr_it4_08', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_ns4iyt', 'uo-1', 'tr_it4_08', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_4ayq7t', 'uo-1', 'tr_1791233527757_9oc6p', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_kxq3yw', 'uo-1', 'tr_1791233527757_9oc6p', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_b27h0w', 'uo-1', 'tr_1791233527757_9oc6p', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_tikut7', 'uo-1', 'tr_1791233542531_tyxjg', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_4g4254', 'uo-1', 'tr_1791233542531_tyxjg', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_blguqw', 'uo-1', 'tr_1791233542531_tyxjg', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_7qbrc1', 'uo-1', 'tr_1791155578578_6sfojk', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_rwqs6u', 'uo-1', 'tr_1791155578578_6sfojk', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791528765154_9s6pcb', 'uo-1', 'tr_1791155578578_6sfojk', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791576716640_ei7287', 'uo-1', 'tr_1791576675220_xm5wbvuxz', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791576719612_4if8yz', 'uo-1', 'tr_1791576675220_xm5wbvuxz', 2, '2026-10-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791576722452_lykc5u', 'uo-1', 'tr_1791576675220_xm5wbvuxz', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791576743728_suizxm', 'uo-1', 'tr_adm_01', 4, '2026-10-09', 2, 'excused', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254646_158cc7', 'uo-1', 'tr_adm_01', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254646_4uti4a', 'uo-1', 'tr_adm_01', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254646_eum03x', 'uo-1', 'tr_adm_01', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_31xdra', 'uo-1', 'tr_adm_02', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_neg87d', 'uo-1', 'tr_adm_02', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_qzntij', 'uo-1', 'tr_adm_02', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_da74uo', 'uo-1', 'tr_adm_03', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_d9pomx', 'uo-1', 'tr_adm_03', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_lbq5q5', 'uo-1', 'tr_adm_03', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_aklt1l', 'uo-1', 'tr_adm_04', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_6upstf', 'uo-1', 'tr_adm_04', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_lkltkb', 'uo-1', 'tr_adm_04', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_pnblvd', 'uo-1', 'tr_adm_05', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_26sce2', 'uo-1', 'tr_adm_05', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_tzlbk0', 'uo-1', 'tr_adm_05', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_vc3irx', 'uo-1', 'tr_adm_06', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_ho3ywu', 'uo-1', 'tr_adm_06', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_hcddfh', 'uo-1', 'tr_adm_06', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_lh5jv5', 'uo-1', 'tr_adm_07', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_n1mxjx', 'uo-1', 'tr_adm_07', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_bg8euu', 'uo-1', 'tr_adm_07', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_jj6g5f', 'uo-1', 'tr_adm_08', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_ecew05', 'uo-1', 'tr_adm_08', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254647_pxo31b', 'uo-1', 'tr_adm_08', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254648_wu93kq', 'uo-1', 'tr_adm_09', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254648_sceh2i', 'uo-1', 'tr_adm_09', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254648_zttq5d', 'uo-1', 'tr_adm_09', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254648_ws87jo', 'uo-1', 'tr_adm_10', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254648_oyawls', 'uo-1', 'tr_adm_10', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254648_84xngt', 'uo-1', 'tr_adm_10', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254648_hxguw5', 'uo-1', 'tr_adm_11', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254648_ojvl64', 'uo-1', 'tr_adm_11', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254648_b9r87g', 'uo-1', 'tr_adm_11', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254649_24jjvg', 'uo-1', 'tr_1791577241020_4dqoi35vr', 1, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254649_81gylv', 'uo-1', 'tr_1791577241020_4dqoi35vr', 2, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_1791577254649_xzasvz', 'uo-1', 'tr_1791577241020_4dqoi35vr', 3, '2026-10-09', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_01_w1_s1', 'uo-1', 'tr_it6_01', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_01_w1_s2', 'uo-1', 'tr_it6_01', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_01_w2_s1', 'uo-1', 'tr_it6_01', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_01_w2_s2', 'uo-1', 'tr_it6_01', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_01_w3_s1', 'uo-1', 'tr_it6_01', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_01_w3_s2', 'uo-1', 'tr_it6_01', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_02_w1_s1', 'uo-1', 'tr_it6_02', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_02_w1_s2', 'uo-1', 'tr_it6_02', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_02_w2_s1', 'uo-1', 'tr_it6_02', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_02_w2_s2', 'uo-1', 'tr_it6_02', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_02_w3_s1', 'uo-1', 'tr_it6_02', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_02_w3_s2', 'uo-1', 'tr_it6_02', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_03_w1_s1', 'uo-1', 'tr_it6_03', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_03_w1_s2', 'uo-1', 'tr_it6_03', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_03_w2_s1', 'uo-1', 'tr_it6_03', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_03_w2_s2', 'uo-1', 'tr_it6_03', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_03_w3_s1', 'uo-1', 'tr_it6_03', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_03_w3_s2', 'uo-1', 'tr_it6_03', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_04_w1_s1', 'uo-1', 'tr_it6_04', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_04_w1_s2', 'uo-1', 'tr_it6_04', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_04_w2_s1', 'uo-1', 'tr_it6_04', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_04_w2_s2', 'uo-1', 'tr_it6_04', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_04_w3_s1', 'uo-1', 'tr_it6_04', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_04_w3_s2', 'uo-1', 'tr_it6_04', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_05_w1_s1', 'uo-1', 'tr_it6_05', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_05_w1_s2', 'uo-1', 'tr_it6_05', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_05_w2_s1', 'uo-1', 'tr_it6_05', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_05_w2_s2', 'uo-1', 'tr_it6_05', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_05_w3_s1', 'uo-1', 'tr_it6_05', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_05_w3_s2', 'uo-1', 'tr_it6_05', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_06_w1_s1', 'uo-1', 'tr_it6_06', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_06_w1_s2', 'uo-1', 'tr_it6_06', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_06_w2_s1', 'uo-1', 'tr_it6_06', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_06_w2_s2', 'uo-1', 'tr_it6_06', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_06_w3_s1', 'uo-1', 'tr_it6_06', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_06_w3_s2', 'uo-1', 'tr_it6_06', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_07_w1_s1', 'uo-1', 'tr_it6_07', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_07_w1_s2', 'uo-1', 'tr_it6_07', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_07_w2_s1', 'uo-1', 'tr_it6_07', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_07_w2_s2', 'uo-1', 'tr_it6_07', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_07_w3_s1', 'uo-1', 'tr_it6_07', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_07_w3_s2', 'uo-1', 'tr_it6_07', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_08_w1_s1', 'uo-1', 'tr_it6_08', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_08_w1_s2', 'uo-1', 'tr_it6_08', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_08_w2_s1', 'uo-1', 'tr_it6_08', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_08_w2_s2', 'uo-1', 'tr_it6_08', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_08_w3_s1', 'uo-1', 'tr_it6_08', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_08_w3_s2', 'uo-1', 'tr_it6_08', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_09_w1_s1', 'uo-1', 'tr_it6_09', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_09_w1_s2', 'uo-1', 'tr_it6_09', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_09_w2_s1', 'uo-1', 'tr_it6_09', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_09_w2_s2', 'uo-1', 'tr_it6_09', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_09_w3_s1', 'uo-1', 'tr_it6_09', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_09_w3_s2', 'uo-1', 'tr_it6_09', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_10_w1_s1', 'uo-1', 'tr_it6_10', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_10_w1_s2', 'uo-1', 'tr_it6_10', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_10_w2_s1', 'uo-1', 'tr_it6_10', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_10_w2_s2', 'uo-1', 'tr_it6_10', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_10_w3_s1', 'uo-1', 'tr_it6_10', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_10_w3_s2', 'uo-1', 'tr_it6_10', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_11_w1_s1', 'uo-1', 'tr_it6_11', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_11_w1_s2', 'uo-1', 'tr_it6_11', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_11_w2_s1', 'uo-1', 'tr_it6_11', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_11_w2_s2', 'uo-1', 'tr_it6_11', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_11_w3_s1', 'uo-1', 'tr_it6_11', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it6_11_w3_s2', 'uo-1', 'tr_it6_11', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_01_w1_s1', 'uo-1', 'tr_it4_01', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_01_w1_s2', 'uo-1', 'tr_it4_01', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_01_w2_s1', 'uo-1', 'tr_it4_01', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_01_w2_s2', 'uo-1', 'tr_it4_01', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_01_w3_s1', 'uo-1', 'tr_it4_01', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_01_w3_s2', 'uo-1', 'tr_it4_01', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_02_w1_s1', 'uo-1', 'tr_it4_02', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_02_w1_s2', 'uo-1', 'tr_it4_02', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_02_w2_s1', 'uo-1', 'tr_it4_02', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_02_w2_s2', 'uo-1', 'tr_it4_02', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_02_w3_s1', 'uo-1', 'tr_it4_02', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_02_w3_s2', 'uo-1', 'tr_it4_02', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_03_w1_s1', 'uo-1', 'tr_it4_03', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_03_w1_s2', 'uo-1', 'tr_it4_03', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_03_w2_s1', 'uo-1', 'tr_it4_03', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_03_w2_s2', 'uo-1', 'tr_it4_03', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_03_w3_s1', 'uo-1', 'tr_it4_03', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_03_w3_s2', 'uo-1', 'tr_it4_03', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_04_w1_s1', 'uo-1', 'tr_it4_04', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_04_w1_s2', 'uo-1', 'tr_it4_04', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_04_w2_s1', 'uo-1', 'tr_it4_04', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_04_w2_s2', 'uo-1', 'tr_it4_04', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_04_w3_s1', 'uo-1', 'tr_it4_04', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_04_w3_s2', 'uo-1', 'tr_it4_04', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_05_w1_s1', 'uo-1', 'tr_it4_05', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_05_w1_s2', 'uo-1', 'tr_it4_05', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_05_w2_s1', 'uo-1', 'tr_it4_05', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_05_w2_s2', 'uo-1', 'tr_it4_05', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_05_w3_s1', 'uo-1', 'tr_it4_05', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_05_w3_s2', 'uo-1', 'tr_it4_05', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_06_w1_s1', 'uo-1', 'tr_it4_06', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_06_w1_s2', 'uo-1', 'tr_it4_06', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_06_w2_s1', 'uo-1', 'tr_it4_06', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_06_w2_s2', 'uo-1', 'tr_it4_06', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_06_w3_s1', 'uo-1', 'tr_it4_06', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_06_w3_s2', 'uo-1', 'tr_it4_06', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_07_w1_s1', 'uo-1', 'tr_it4_07', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_07_w1_s2', 'uo-1', 'tr_it4_07', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_07_w2_s1', 'uo-1', 'tr_it4_07', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_07_w2_s2', 'uo-1', 'tr_it4_07', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_07_w3_s1', 'uo-1', 'tr_it4_07', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_07_w3_s2', 'uo-1', 'tr_it4_07', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_08_w1_s1', 'uo-1', 'tr_it4_08', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_08_w1_s2', 'uo-1', 'tr_it4_08', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_08_w2_s1', 'uo-1', 'tr_it4_08', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_08_w2_s2', 'uo-1', 'tr_it4_08', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_08_w3_s1', 'uo-1', 'tr_it4_08', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_it4_08_w3_s2', 'uo-1', 'tr_it4_08', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_01_w1_s1', 'uo-1', 'tr_adm_01', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_01_w1_s2', 'uo-1', 'tr_adm_01', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_01_w2_s1', 'uo-1', 'tr_adm_01', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_01_w2_s2', 'uo-1', 'tr_adm_01', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_01_w3_s1', 'uo-1', 'tr_adm_01', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_01_w3_s2', 'uo-1', 'tr_adm_01', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_02_w1_s1', 'uo-1', 'tr_adm_02', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_02_w1_s2', 'uo-1', 'tr_adm_02', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_02_w2_s1', 'uo-1', 'tr_adm_02', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_02_w2_s2', 'uo-1', 'tr_adm_02', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_02_w3_s1', 'uo-1', 'tr_adm_02', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_02_w3_s2', 'uo-1', 'tr_adm_02', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_03_w1_s1', 'uo-1', 'tr_adm_03', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_03_w1_s2', 'uo-1', 'tr_adm_03', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_03_w2_s1', 'uo-1', 'tr_adm_03', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_03_w2_s2', 'uo-1', 'tr_adm_03', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_03_w3_s1', 'uo-1', 'tr_adm_03', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_03_w3_s2', 'uo-1', 'tr_adm_03', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_04_w1_s1', 'uo-1', 'tr_adm_04', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_04_w1_s2', 'uo-1', 'tr_adm_04', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_04_w2_s1', 'uo-1', 'tr_adm_04', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_04_w2_s2', 'uo-1', 'tr_adm_04', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_04_w3_s1', 'uo-1', 'tr_adm_04', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_04_w3_s2', 'uo-1', 'tr_adm_04', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_05_w1_s1', 'uo-1', 'tr_adm_05', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_05_w1_s2', 'uo-1', 'tr_adm_05', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_05_w2_s1', 'uo-1', 'tr_adm_05', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_05_w2_s2', 'uo-1', 'tr_adm_05', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_05_w3_s1', 'uo-1', 'tr_adm_05', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_05_w3_s2', 'uo-1', 'tr_adm_05', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_06_w1_s1', 'uo-1', 'tr_adm_06', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_06_w1_s2', 'uo-1', 'tr_adm_06', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_06_w2_s1', 'uo-1', 'tr_adm_06', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_06_w2_s2', 'uo-1', 'tr_adm_06', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_06_w3_s1', 'uo-1', 'tr_adm_06', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_06_w3_s2', 'uo-1', 'tr_adm_06', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_07_w1_s1', 'uo-1', 'tr_adm_07', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_07_w1_s2', 'uo-1', 'tr_adm_07', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_07_w2_s1', 'uo-1', 'tr_adm_07', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_07_w2_s2', 'uo-1', 'tr_adm_07', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_07_w3_s1', 'uo-1', 'tr_adm_07', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_07_w3_s2', 'uo-1', 'tr_adm_07', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_08_w1_s1', 'uo-1', 'tr_adm_08', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_08_w1_s2', 'uo-1', 'tr_adm_08', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_08_w2_s1', 'uo-1', 'tr_adm_08', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_08_w2_s2', 'uo-1', 'tr_adm_08', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_08_w3_s1', 'uo-1', 'tr_adm_08', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_08_w3_s2', 'uo-1', 'tr_adm_08', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_09_w1_s1', 'uo-1', 'tr_adm_09', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_09_w1_s2', 'uo-1', 'tr_adm_09', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_09_w2_s1', 'uo-1', 'tr_adm_09', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_09_w2_s2', 'uo-1', 'tr_adm_09', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_09_w3_s1', 'uo-1', 'tr_adm_09', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_09_w3_s2', 'uo-1', 'tr_adm_09', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_10_w1_s1', 'uo-1', 'tr_adm_10', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_10_w1_s2', 'uo-1', 'tr_adm_10', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_10_w2_s1', 'uo-1', 'tr_adm_10', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_10_w2_s2', 'uo-1', 'tr_adm_10', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_10_w3_s1', 'uo-1', 'tr_adm_10', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_10_w3_s2', 'uo-1', 'tr_adm_10', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_11_w1_s1', 'uo-1', 'tr_adm_11', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_11_w1_s2', 'uo-1', 'tr_adm_11', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_11_w2_s1', 'uo-1', 'tr_adm_11', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_11_w2_s2', 'uo-1', 'tr_adm_11', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_11_w3_s1', 'uo-1', 'tr_adm_11', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_adm_11_w3_s2', 'uo-1', 'tr_adm_11', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_01_w1_s1', 'uo-1', 'tr_fbs5_01', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_01_w1_s2', 'uo-1', 'tr_fbs5_01', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_01_w1_s3', 'uo-1', 'tr_fbs5_01', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_01_w2_s1', 'uo-1', 'tr_fbs5_01', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_01_w2_s2', 'uo-1', 'tr_fbs5_01', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_01_w2_s3', 'uo-1', 'tr_fbs5_01', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_01_w3_s1', 'uo-1', 'tr_fbs5_01', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_01_w3_s2', 'uo-1', 'tr_fbs5_01', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_01_w3_s3', 'uo-1', 'tr_fbs5_01', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_02_w1_s1', 'uo-1', 'tr_fbs5_02', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_02_w1_s2', 'uo-1', 'tr_fbs5_02', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_02_w1_s3', 'uo-1', 'tr_fbs5_02', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_02_w2_s1', 'uo-1', 'tr_fbs5_02', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_02_w2_s2', 'uo-1', 'tr_fbs5_02', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_02_w2_s3', 'uo-1', 'tr_fbs5_02', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_02_w3_s1', 'uo-1', 'tr_fbs5_02', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_02_w3_s2', 'uo-1', 'tr_fbs5_02', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_02_w3_s3', 'uo-1', 'tr_fbs5_02', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_03_w1_s1', 'uo-1', 'tr_fbs5_03', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_03_w1_s2', 'uo-1', 'tr_fbs5_03', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_03_w1_s3', 'uo-1', 'tr_fbs5_03', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_03_w2_s1', 'uo-1', 'tr_fbs5_03', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_03_w2_s2', 'uo-1', 'tr_fbs5_03', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_03_w2_s3', 'uo-1', 'tr_fbs5_03', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_03_w3_s1', 'uo-1', 'tr_fbs5_03', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_03_w3_s2', 'uo-1', 'tr_fbs5_03', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_03_w3_s3', 'uo-1', 'tr_fbs5_03', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_04_w1_s1', 'uo-1', 'tr_fbs5_04', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_04_w1_s2', 'uo-1', 'tr_fbs5_04', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_04_w1_s3', 'uo-1', 'tr_fbs5_04', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_04_w2_s1', 'uo-1', 'tr_fbs5_04', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_04_w2_s2', 'uo-1', 'tr_fbs5_04', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_04_w2_s3', 'uo-1', 'tr_fbs5_04', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_04_w3_s1', 'uo-1', 'tr_fbs5_04', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_04_w3_s2', 'uo-1', 'tr_fbs5_04', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_04_w3_s3', 'uo-1', 'tr_fbs5_04', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_05_w1_s1', 'uo-1', 'tr_fbs5_05', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_05_w1_s2', 'uo-1', 'tr_fbs5_05', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_05_w1_s3', 'uo-1', 'tr_fbs5_05', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_05_w2_s1', 'uo-1', 'tr_fbs5_05', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_05_w2_s2', 'uo-1', 'tr_fbs5_05', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_05_w2_s3', 'uo-1', 'tr_fbs5_05', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_05_w3_s1', 'uo-1', 'tr_fbs5_05', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_05_w3_s2', 'uo-1', 'tr_fbs5_05', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_05_w3_s3', 'uo-1', 'tr_fbs5_05', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_06_w1_s1', 'uo-1', 'tr_fbs5_06', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_06_w1_s2', 'uo-1', 'tr_fbs5_06', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_06_w1_s3', 'uo-1', 'tr_fbs5_06', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_06_w2_s1', 'uo-1', 'tr_fbs5_06', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_06_w2_s2', 'uo-1', 'tr_fbs5_06', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_06_w2_s3', 'uo-1', 'tr_fbs5_06', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_06_w3_s1', 'uo-1', 'tr_fbs5_06', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_06_w3_s2', 'uo-1', 'tr_fbs5_06', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_06_w3_s3', 'uo-1', 'tr_fbs5_06', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_07_w1_s1', 'uo-1', 'tr_fbs5_07', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_07_w1_s2', 'uo-1', 'tr_fbs5_07', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_07_w1_s3', 'uo-1', 'tr_fbs5_07', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_07_w2_s1', 'uo-1', 'tr_fbs5_07', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_07_w2_s2', 'uo-1', 'tr_fbs5_07', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_07_w2_s3', 'uo-1', 'tr_fbs5_07', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_07_w3_s1', 'uo-1', 'tr_fbs5_07', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_07_w3_s2', 'uo-1', 'tr_fbs5_07', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_07_w3_s3', 'uo-1', 'tr_fbs5_07', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_08_w1_s1', 'uo-1', 'tr_fbs5_08', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_08_w1_s2', 'uo-1', 'tr_fbs5_08', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_08_w1_s3', 'uo-1', 'tr_fbs5_08', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_08_w2_s1', 'uo-1', 'tr_fbs5_08', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_08_w2_s2', 'uo-1', 'tr_fbs5_08', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_08_w2_s3', 'uo-1', 'tr_fbs5_08', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_08_w3_s1', 'uo-1', 'tr_fbs5_08', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_08_w3_s2', 'uo-1', 'tr_fbs5_08', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_08_w3_s3', 'uo-1', 'tr_fbs5_08', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_09_w1_s1', 'uo-1', 'tr_fbs5_09', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_09_w1_s2', 'uo-1', 'tr_fbs5_09', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_09_w1_s3', 'uo-1', 'tr_fbs5_09', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_09_w2_s1', 'uo-1', 'tr_fbs5_09', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_09_w2_s2', 'uo-1', 'tr_fbs5_09', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_09_w2_s3', 'uo-1', 'tr_fbs5_09', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_09_w3_s1', 'uo-1', 'tr_fbs5_09', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_09_w3_s2', 'uo-1', 'tr_fbs5_09', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_09_w3_s3', 'uo-1', 'tr_fbs5_09', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_10_w1_s1', 'uo-1', 'tr_fbs5_10', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_10_w1_s2', 'uo-1', 'tr_fbs5_10', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_10_w1_s3', 'uo-1', 'tr_fbs5_10', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_10_w2_s1', 'uo-1', 'tr_fbs5_10', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_10_w2_s2', 'uo-1', 'tr_fbs5_10', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_10_w2_s3', 'uo-1', 'tr_fbs5_10', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_10_w3_s1', 'uo-1', 'tr_fbs5_10', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_10_w3_s2', 'uo-1', 'tr_fbs5_10', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_10_w3_s3', 'uo-1', 'tr_fbs5_10', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_11_w1_s1', 'uo-1', 'tr_fbs5_11', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_11_w1_s2', 'uo-1', 'tr_fbs5_11', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_11_w1_s3', 'uo-1', 'tr_fbs5_11', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_11_w2_s1', 'uo-1', 'tr_fbs5_11', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_11_w2_s2', 'uo-1', 'tr_fbs5_11', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_11_w2_s3', 'uo-1', 'tr_fbs5_11', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_11_w3_s1', 'uo-1', 'tr_fbs5_11', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_11_w3_s2', 'uo-1', 'tr_fbs5_11', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_11_w3_s3', 'uo-1', 'tr_fbs5_11', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_12_w1_s1', 'uo-1', 'tr_fbs5_12', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_12_w1_s2', 'uo-1', 'tr_fbs5_12', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_12_w1_s3', 'uo-1', 'tr_fbs5_12', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_12_w2_s1', 'uo-1', 'tr_fbs5_12', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_12_w2_s2', 'uo-1', 'tr_fbs5_12', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_12_w2_s3', 'uo-1', 'tr_fbs5_12', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_12_w3_s1', 'uo-1', 'tr_fbs5_12', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_12_w3_s2', 'uo-1', 'tr_fbs5_12', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_12_w3_s3', 'uo-1', 'tr_fbs5_12', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_13_w1_s1', 'uo-1', 'tr_fbs5_13', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_13_w1_s2', 'uo-1', 'tr_fbs5_13', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_13_w1_s3', 'uo-1', 'tr_fbs5_13', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_13_w2_s1', 'uo-1', 'tr_fbs5_13', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_13_w2_s2', 'uo-1', 'tr_fbs5_13', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_13_w2_s3', 'uo-1', 'tr_fbs5_13', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_13_w3_s1', 'uo-1', 'tr_fbs5_13', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_13_w3_s2', 'uo-1', 'tr_fbs5_13', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_13_w3_s3', 'uo-1', 'tr_fbs5_13', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_14_w1_s1', 'uo-1', 'tr_fbs5_14', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_14_w1_s2', 'uo-1', 'tr_fbs5_14', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_14_w1_s3', 'uo-1', 'tr_fbs5_14', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_14_w2_s1', 'uo-1', 'tr_fbs5_14', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_14_w2_s2', 'uo-1', 'tr_fbs5_14', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_14_w2_s3', 'uo-1', 'tr_fbs5_14', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_14_w3_s1', 'uo-1', 'tr_fbs5_14', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_14_w3_s2', 'uo-1', 'tr_fbs5_14', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_14_w3_s3', 'uo-1', 'tr_fbs5_14', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_15_w1_s1', 'uo-1', 'tr_fbs5_15', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_15_w1_s2', 'uo-1', 'tr_fbs5_15', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_15_w1_s3', 'uo-1', 'tr_fbs5_15', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_15_w2_s1', 'uo-1', 'tr_fbs5_15', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_15_w2_s2', 'uo-1', 'tr_fbs5_15', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_15_w2_s3', 'uo-1', 'tr_fbs5_15', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_15_w3_s1', 'uo-1', 'tr_fbs5_15', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_15_w3_s2', 'uo-1', 'tr_fbs5_15', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_15_w3_s3', 'uo-1', 'tr_fbs5_15', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_16_w1_s1', 'uo-1', 'tr_fbs5_16', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_16_w1_s2', 'uo-1', 'tr_fbs5_16', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_16_w1_s3', 'uo-1', 'tr_fbs5_16', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_16_w2_s1', 'uo-1', 'tr_fbs5_16', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_16_w2_s2', 'uo-1', 'tr_fbs5_16', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_16_w2_s3', 'uo-1', 'tr_fbs5_16', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_16_w3_s1', 'uo-1', 'tr_fbs5_16', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_16_w3_s2', 'uo-1', 'tr_fbs5_16', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_16_w3_s3', 'uo-1', 'tr_fbs5_16', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_17_w1_s1', 'uo-1', 'tr_fbs5_17', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_17_w1_s2', 'uo-1', 'tr_fbs5_17', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_17_w1_s3', 'uo-1', 'tr_fbs5_17', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_17_w2_s1', 'uo-1', 'tr_fbs5_17', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_17_w2_s2', 'uo-1', 'tr_fbs5_17', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_17_w2_s3', 'uo-1', 'tr_fbs5_17', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_17_w3_s1', 'uo-1', 'tr_fbs5_17', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_17_w3_s2', 'uo-1', 'tr_fbs5_17', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_17_w3_s3', 'uo-1', 'tr_fbs5_17', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_18_w1_s1', 'uo-1', 'tr_fbs5_18', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_18_w1_s2', 'uo-1', 'tr_fbs5_18', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_18_w1_s3', 'uo-1', 'tr_fbs5_18', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_18_w2_s1', 'uo-1', 'tr_fbs5_18', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_18_w2_s2', 'uo-1', 'tr_fbs5_18', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_18_w2_s3', 'uo-1', 'tr_fbs5_18', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_18_w3_s1', 'uo-1', 'tr_fbs5_18', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_18_w3_s2', 'uo-1', 'tr_fbs5_18', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_18_w3_s3', 'uo-1', 'tr_fbs5_18', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_19_w1_s1', 'uo-1', 'tr_fbs5_19', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_19_w1_s2', 'uo-1', 'tr_fbs5_19', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_19_w1_s3', 'uo-1', 'tr_fbs5_19', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_19_w2_s1', 'uo-1', 'tr_fbs5_19', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_19_w2_s2', 'uo-1', 'tr_fbs5_19', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_19_w2_s3', 'uo-1', 'tr_fbs5_19', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_19_w3_s1', 'uo-1', 'tr_fbs5_19', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_19_w3_s2', 'uo-1', 'tr_fbs5_19', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_19_w3_s3', 'uo-1', 'tr_fbs5_19', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_20_w1_s1', 'uo-1', 'tr_fbs5_20', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_20_w1_s2', 'uo-1', 'tr_fbs5_20', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_20_w1_s3', 'uo-1', 'tr_fbs5_20', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_20_w2_s1', 'uo-1', 'tr_fbs5_20', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_20_w2_s2', 'uo-1', 'tr_fbs5_20', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_20_w2_s3', 'uo-1', 'tr_fbs5_20', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_20_w3_s1', 'uo-1', 'tr_fbs5_20', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_20_w3_s2', 'uo-1', 'tr_fbs5_20', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_20_w3_s3', 'uo-1', 'tr_fbs5_20', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_21_w1_s1', 'uo-1', 'tr_fbs5_21', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_21_w1_s2', 'uo-1', 'tr_fbs5_21', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_21_w1_s3', 'uo-1', 'tr_fbs5_21', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_21_w2_s1', 'uo-1', 'tr_fbs5_21', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_21_w2_s2', 'uo-1', 'tr_fbs5_21', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_21_w2_s3', 'uo-1', 'tr_fbs5_21', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_21_w3_s1', 'uo-1', 'tr_fbs5_21', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_21_w3_s2', 'uo-1', 'tr_fbs5_21', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_21_w3_s3', 'uo-1', 'tr_fbs5_21', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_22_w1_s1', 'uo-1', 'tr_fbs5_22', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_22_w1_s2', 'uo-1', 'tr_fbs5_22', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_22_w1_s3', 'uo-1', 'tr_fbs5_22', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_22_w2_s1', 'uo-1', 'tr_fbs5_22', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_22_w2_s2', 'uo-1', 'tr_fbs5_22', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_22_w2_s3', 'uo-1', 'tr_fbs5_22', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_22_w3_s1', 'uo-1', 'tr_fbs5_22', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_22_w3_s2', 'uo-1', 'tr_fbs5_22', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_22_w3_s3', 'uo-1', 'tr_fbs5_22', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_23_w1_s1', 'uo-1', 'tr_fbs5_23', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_23_w1_s2', 'uo-1', 'tr_fbs5_23', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_23_w1_s3', 'uo-1', 'tr_fbs5_23', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_23_w2_s1', 'uo-1', 'tr_fbs5_23', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_23_w2_s2', 'uo-1', 'tr_fbs5_23', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_23_w2_s3', 'uo-1', 'tr_fbs5_23', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_23_w3_s1', 'uo-1', 'tr_fbs5_23', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_23_w3_s2', 'uo-1', 'tr_fbs5_23', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs5_23_w3_s3', 'uo-1', 'tr_fbs5_23', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_01_w1_s1', 'uo-1', 'tr_fbs6_01', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_01_w1_s2', 'uo-1', 'tr_fbs6_01', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_01_w1_s3', 'uo-1', 'tr_fbs6_01', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_01_w2_s1', 'uo-1', 'tr_fbs6_01', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_01_w2_s2', 'uo-1', 'tr_fbs6_01', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_01_w2_s3', 'uo-1', 'tr_fbs6_01', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_01_w3_s1', 'uo-1', 'tr_fbs6_01', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_01_w3_s2', 'uo-1', 'tr_fbs6_01', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_01_w3_s3', 'uo-1', 'tr_fbs6_01', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_02_w1_s1', 'uo-1', 'tr_fbs6_02', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_02_w1_s2', 'uo-1', 'tr_fbs6_02', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_02_w1_s3', 'uo-1', 'tr_fbs6_02', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_02_w2_s1', 'uo-1', 'tr_fbs6_02', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_02_w2_s2', 'uo-1', 'tr_fbs6_02', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_02_w2_s3', 'uo-1', 'tr_fbs6_02', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_02_w3_s1', 'uo-1', 'tr_fbs6_02', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_02_w3_s2', 'uo-1', 'tr_fbs6_02', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_02_w3_s3', 'uo-1', 'tr_fbs6_02', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_03_w1_s1', 'uo-1', 'tr_fbs6_03', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_03_w1_s2', 'uo-1', 'tr_fbs6_03', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_03_w1_s3', 'uo-1', 'tr_fbs6_03', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_03_w2_s1', 'uo-1', 'tr_fbs6_03', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_03_w2_s2', 'uo-1', 'tr_fbs6_03', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_03_w2_s3', 'uo-1', 'tr_fbs6_03', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_03_w3_s1', 'uo-1', 'tr_fbs6_03', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_03_w3_s2', 'uo-1', 'tr_fbs6_03', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_03_w3_s3', 'uo-1', 'tr_fbs6_03', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_04_w1_s1', 'uo-1', 'tr_fbs6_04', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_04_w1_s2', 'uo-1', 'tr_fbs6_04', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_04_w1_s3', 'uo-1', 'tr_fbs6_04', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_04_w2_s1', 'uo-1', 'tr_fbs6_04', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_04_w2_s2', 'uo-1', 'tr_fbs6_04', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_04_w2_s3', 'uo-1', 'tr_fbs6_04', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_04_w3_s1', 'uo-1', 'tr_fbs6_04', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_04_w3_s2', 'uo-1', 'tr_fbs6_04', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_04_w3_s3', 'uo-1', 'tr_fbs6_04', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_05_w1_s1', 'uo-1', 'tr_fbs6_05', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_05_w1_s2', 'uo-1', 'tr_fbs6_05', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_05_w1_s3', 'uo-1', 'tr_fbs6_05', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_05_w2_s1', 'uo-1', 'tr_fbs6_05', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_05_w2_s2', 'uo-1', 'tr_fbs6_05', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_05_w2_s3', 'uo-1', 'tr_fbs6_05', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_05_w3_s1', 'uo-1', 'tr_fbs6_05', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_05_w3_s2', 'uo-1', 'tr_fbs6_05', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_05_w3_s3', 'uo-1', 'tr_fbs6_05', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_06_w1_s1', 'uo-1', 'tr_fbs6_06', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_06_w1_s2', 'uo-1', 'tr_fbs6_06', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_06_w1_s3', 'uo-1', 'tr_fbs6_06', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_06_w2_s1', 'uo-1', 'tr_fbs6_06', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_06_w2_s2', 'uo-1', 'tr_fbs6_06', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_06_w2_s3', 'uo-1', 'tr_fbs6_06', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_06_w3_s1', 'uo-1', 'tr_fbs6_06', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_06_w3_s2', 'uo-1', 'tr_fbs6_06', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_fbs6_06_w3_s3', 'uo-1', 'tr_fbs6_06', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_01_w1_s1', 'uo-1', 'tr_ls5_01', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_01_w1_s2', 'uo-1', 'tr_ls5_01', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_01_w1_s3', 'uo-1', 'tr_ls5_01', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_01_w2_s1', 'uo-1', 'tr_ls5_01', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_01_w2_s2', 'uo-1', 'tr_ls5_01', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_01_w2_s3', 'uo-1', 'tr_ls5_01', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_01_w3_s1', 'uo-1', 'tr_ls5_01', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_01_w3_s2', 'uo-1', 'tr_ls5_01', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_01_w3_s3', 'uo-1', 'tr_ls5_01', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_02_w1_s1', 'uo-1', 'tr_ls5_02', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_02_w1_s2', 'uo-1', 'tr_ls5_02', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_02_w1_s3', 'uo-1', 'tr_ls5_02', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_02_w2_s1', 'uo-1', 'tr_ls5_02', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_02_w2_s2', 'uo-1', 'tr_ls5_02', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_02_w2_s3', 'uo-1', 'tr_ls5_02', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_02_w3_s1', 'uo-1', 'tr_ls5_02', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_02_w3_s2', 'uo-1', 'tr_ls5_02', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_02_w3_s3', 'uo-1', 'tr_ls5_02', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_03_w1_s1', 'uo-1', 'tr_ls5_03', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_03_w1_s2', 'uo-1', 'tr_ls5_03', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_03_w1_s3', 'uo-1', 'tr_ls5_03', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_03_w2_s1', 'uo-1', 'tr_ls5_03', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_03_w2_s2', 'uo-1', 'tr_ls5_03', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_03_w2_s3', 'uo-1', 'tr_ls5_03', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_03_w3_s1', 'uo-1', 'tr_ls5_03', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_03_w3_s2', 'uo-1', 'tr_ls5_03', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_03_w3_s3', 'uo-1', 'tr_ls5_03', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_04_w1_s1', 'uo-1', 'tr_ls5_04', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_04_w1_s2', 'uo-1', 'tr_ls5_04', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_04_w1_s3', 'uo-1', 'tr_ls5_04', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_04_w2_s1', 'uo-1', 'tr_ls5_04', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_04_w2_s2', 'uo-1', 'tr_ls5_04', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_04_w2_s3', 'uo-1', 'tr_ls5_04', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_04_w3_s1', 'uo-1', 'tr_ls5_04', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_04_w3_s2', 'uo-1', 'tr_ls5_04', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_04_w3_s3', 'uo-1', 'tr_ls5_04', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_05_w1_s1', 'uo-1', 'tr_ls5_05', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_05_w1_s2', 'uo-1', 'tr_ls5_05', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_05_w1_s3', 'uo-1', 'tr_ls5_05', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_05_w2_s1', 'uo-1', 'tr_ls5_05', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_05_w2_s2', 'uo-1', 'tr_ls5_05', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_05_w2_s3', 'uo-1', 'tr_ls5_05', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_05_w3_s1', 'uo-1', 'tr_ls5_05', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_05_w3_s2', 'uo-1', 'tr_ls5_05', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_05_w3_s3', 'uo-1', 'tr_ls5_05', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_06_w1_s1', 'uo-1', 'tr_ls5_06', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_06_w1_s2', 'uo-1', 'tr_ls5_06', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_06_w1_s3', 'uo-1', 'tr_ls5_06', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_06_w2_s1', 'uo-1', 'tr_ls5_06', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_06_w2_s2', 'uo-1', 'tr_ls5_06', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_06_w2_s3', 'uo-1', 'tr_ls5_06', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_06_w3_s1', 'uo-1', 'tr_ls5_06', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_06_w3_s2', 'uo-1', 'tr_ls5_06', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_06_w3_s3', 'uo-1', 'tr_ls5_06', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_07_w1_s1', 'uo-1', 'tr_ls5_07', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_07_w1_s2', 'uo-1', 'tr_ls5_07', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_07_w1_s3', 'uo-1', 'tr_ls5_07', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_07_w2_s1', 'uo-1', 'tr_ls5_07', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_07_w2_s2', 'uo-1', 'tr_ls5_07', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_07_w2_s3', 'uo-1', 'tr_ls5_07', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_07_w3_s1', 'uo-1', 'tr_ls5_07', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_07_w3_s2', 'uo-1', 'tr_ls5_07', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_07_w3_s3', 'uo-1', 'tr_ls5_07', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_08_w1_s1', 'uo-1', 'tr_ls5_08', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_08_w1_s2', 'uo-1', 'tr_ls5_08', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_08_w1_s3', 'uo-1', 'tr_ls5_08', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_08_w2_s1', 'uo-1', 'tr_ls5_08', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_08_w2_s2', 'uo-1', 'tr_ls5_08', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_08_w2_s3', 'uo-1', 'tr_ls5_08', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_08_w3_s1', 'uo-1', 'tr_ls5_08', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_08_w3_s2', 'uo-1', 'tr_ls5_08', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_08_w3_s3', 'uo-1', 'tr_ls5_08', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_09_w1_s1', 'uo-1', 'tr_ls5_09', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_09_w1_s2', 'uo-1', 'tr_ls5_09', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_09_w1_s3', 'uo-1', 'tr_ls5_09', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_09_w2_s1', 'uo-1', 'tr_ls5_09', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_09_w2_s2', 'uo-1', 'tr_ls5_09', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_09_w2_s3', 'uo-1', 'tr_ls5_09', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_09_w3_s1', 'uo-1', 'tr_ls5_09', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_09_w3_s2', 'uo-1', 'tr_ls5_09', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls5_09_w3_s3', 'uo-1', 'tr_ls5_09', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_01_w1_s1', 'uo-1', 'tr_ls6_01', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_01_w1_s2', 'uo-1', 'tr_ls6_01', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_01_w1_s3', 'uo-1', 'tr_ls6_01', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_01_w2_s1', 'uo-1', 'tr_ls6_01', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_01_w2_s2', 'uo-1', 'tr_ls6_01', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_01_w2_s3', 'uo-1', 'tr_ls6_01', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_01_w3_s1', 'uo-1', 'tr_ls6_01', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_01_w3_s2', 'uo-1', 'tr_ls6_01', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_01_w3_s3', 'uo-1', 'tr_ls6_01', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_02_w1_s1', 'uo-1', 'tr_ls6_02', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_02_w1_s2', 'uo-1', 'tr_ls6_02', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_02_w1_s3', 'uo-1', 'tr_ls6_02', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_02_w2_s1', 'uo-1', 'tr_ls6_02', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_02_w2_s2', 'uo-1', 'tr_ls6_02', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_02_w2_s3', 'uo-1', 'tr_ls6_02', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_02_w3_s1', 'uo-1', 'tr_ls6_02', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_02_w3_s2', 'uo-1', 'tr_ls6_02', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_02_w3_s3', 'uo-1', 'tr_ls6_02', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_03_w1_s1', 'uo-1', 'tr_ls6_03', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_03_w1_s2', 'uo-1', 'tr_ls6_03', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_03_w1_s3', 'uo-1', 'tr_ls6_03', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_03_w2_s1', 'uo-1', 'tr_ls6_03', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_03_w2_s2', 'uo-1', 'tr_ls6_03', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_03_w2_s3', 'uo-1', 'tr_ls6_03', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_03_w3_s1', 'uo-1', 'tr_ls6_03', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_03_w3_s2', 'uo-1', 'tr_ls6_03', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_03_w3_s3', 'uo-1', 'tr_ls6_03', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_04_w1_s1', 'uo-1', 'tr_ls6_04', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_04_w1_s2', 'uo-1', 'tr_ls6_04', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_04_w1_s3', 'uo-1', 'tr_ls6_04', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_04_w2_s1', 'uo-1', 'tr_ls6_04', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_04_w2_s2', 'uo-1', 'tr_ls6_04', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_04_w2_s3', 'uo-1', 'tr_ls6_04', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_04_w3_s1', 'uo-1', 'tr_ls6_04', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_04_w3_s2', 'uo-1', 'tr_ls6_04', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_04_w3_s3', 'uo-1', 'tr_ls6_04', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_05_w1_s1', 'uo-1', 'tr_ls6_05', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_05_w1_s2', 'uo-1', 'tr_ls6_05', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_05_w1_s3', 'uo-1', 'tr_ls6_05', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_05_w2_s1', 'uo-1', 'tr_ls6_05', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_05_w2_s2', 'uo-1', 'tr_ls6_05', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_05_w2_s3', 'uo-1', 'tr_ls6_05', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_05_w3_s1', 'uo-1', 'tr_ls6_05', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_05_w3_s2', 'uo-1', 'tr_ls6_05', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_05_w3_s3', 'uo-1', 'tr_ls6_05', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_06_w1_s1', 'uo-1', 'tr_ls6_06', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_06_w1_s2', 'uo-1', 'tr_ls6_06', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_06_w1_s3', 'uo-1', 'tr_ls6_06', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_06_w2_s1', 'uo-1', 'tr_ls6_06', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_06_w2_s2', 'uo-1', 'tr_ls6_06', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_06_w2_s3', 'uo-1', 'tr_ls6_06', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_06_w3_s1', 'uo-1', 'tr_ls6_06', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_06_w3_s2', 'uo-1', 'tr_ls6_06', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_06_w3_s3', 'uo-1', 'tr_ls6_06', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_07_w1_s1', 'uo-1', 'tr_ls6_07', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_07_w1_s2', 'uo-1', 'tr_ls6_07', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_07_w1_s3', 'uo-1', 'tr_ls6_07', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_07_w2_s1', 'uo-1', 'tr_ls6_07', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_07_w2_s2', 'uo-1', 'tr_ls6_07', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_07_w2_s3', 'uo-1', 'tr_ls6_07', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_07_w3_s1', 'uo-1', 'tr_ls6_07', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_07_w3_s2', 'uo-1', 'tr_ls6_07', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_07_w3_s3', 'uo-1', 'tr_ls6_07', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_08_w1_s1', 'uo-1', 'tr_ls6_08', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_08_w1_s2', 'uo-1', 'tr_ls6_08', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_08_w1_s3', 'uo-1', 'tr_ls6_08', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_08_w2_s1', 'uo-1', 'tr_ls6_08', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_08_w2_s2', 'uo-1', 'tr_ls6_08', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_08_w2_s3', 'uo-1', 'tr_ls6_08', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_08_w3_s1', 'uo-1', 'tr_ls6_08', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_08_w3_s2', 'uo-1', 'tr_ls6_08', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_08_w3_s3', 'uo-1', 'tr_ls6_08', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_09_w1_s1', 'uo-1', 'tr_ls6_09', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_09_w1_s2', 'uo-1', 'tr_ls6_09', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_09_w1_s3', 'uo-1', 'tr_ls6_09', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_09_w2_s1', 'uo-1', 'tr_ls6_09', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_09_w2_s2', 'uo-1', 'tr_ls6_09', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_09_w2_s3', 'uo-1', 'tr_ls6_09', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_09_w3_s1', 'uo-1', 'tr_ls6_09', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_09_w3_s2', 'uo-1', 'tr_ls6_09', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_09_w3_s3', 'uo-1', 'tr_ls6_09', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_10_w1_s1', 'uo-1', 'tr_ls6_10', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_10_w1_s2', 'uo-1', 'tr_ls6_10', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_10_w1_s3', 'uo-1', 'tr_ls6_10', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_10_w2_s1', 'uo-1', 'tr_ls6_10', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_10_w2_s2', 'uo-1', 'tr_ls6_10', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_10_w2_s3', 'uo-1', 'tr_ls6_10', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_10_w3_s1', 'uo-1', 'tr_ls6_10', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_10_w3_s2', 'uo-1', 'tr_ls6_10', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls6_10_w3_s3', 'uo-1', 'tr_ls6_10', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls_harriet_w1_s1', 'uo-1', 'tr_ls_harriet', 1, '2026-09-07', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls_harriet_w1_s2', 'uo-1', 'tr_ls_harriet', 1, '2026-09-09', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls_harriet_w1_s3', 'uo-1', 'tr_ls_harriet', 1, '2026-09-11', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls_harriet_w2_s1', 'uo-1', 'tr_ls_harriet', 2, '2026-09-14', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls_harriet_w2_s2', 'uo-1', 'tr_ls_harriet', 2, '2026-09-16', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls_harriet_w2_s3', 'uo-1', 'tr_ls_harriet', 2, '2026-09-18', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls_harriet_w3_s1', 'uo-1', 'tr_ls_harriet', 3, '2026-09-21', 1, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls_harriet_w3_s2', 'uo-1', 'tr_ls_harriet', 3, '2026-09-23', 2, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;
INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)
VALUES ('att_init_tr_ls_harriet_w3_s3', 'uo-1', 'tr_ls_harriet', 3, '2026-09-25', 3, 'present', 2, '', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;

-- 3. Assessment Marks
INSERT INTO assessment_marks (id, unit_offering_id, trainee_id, ct_avg, cp_avg, cp_scores, ct_scores, project_score, weighted_mark, is_locked, updated_at)
VALUES ('mark-01', 'uo-1', 'trainee-001', 78, 84, '[84]'::jsonb, '[78]'::jsonb, 80, 81, true, CURRENT_TIMESTAMP)
ON CONFLICT (unit_offering_id, trainee_id) DO UPDATE SET weighted_mark = EXCLUDED.weighted_mark, is_locked = EXCLUDED.is_locked, updated_at = CURRENT_TIMESTAMP;
INSERT INTO assessment_marks (id, unit_offering_id, trainee_id, ct_avg, cp_avg, cp_scores, ct_scores, project_score, weighted_mark, is_locked, updated_at)
VALUES ('mark-02', 'uo-1', 'trainee-002', 65, 78, '[70,85]'::jsonb, '[65]'::jsonb, 75, 72, false, CURRENT_TIMESTAMP)
ON CONFLICT (unit_offering_id, trainee_id) DO UPDATE SET weighted_mark = EXCLUDED.weighted_mark, is_locked = EXCLUDED.is_locked, updated_at = CURRENT_TIMESTAMP;
INSERT INTO assessment_marks (id, unit_offering_id, trainee_id, ct_avg, cp_avg, cp_scores, ct_scores, project_score, weighted_mark, is_locked, updated_at)
VALUES ('mark-1792533357539-vnf4m', 'uo-3', 'trainee-001', 75, 85, '[85]'::jsonb, '[75]'::jsonb, 80, 81, false, CURRENT_TIMESTAMP)
ON CONFLICT (unit_offering_id, trainee_id) DO UPDATE SET weighted_mark = EXCLUDED.weighted_mark, is_locked = EXCLUDED.is_locked, updated_at = CURRENT_TIMESTAMP;

-- 4. Exam Submissions
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13258', 'exam-061155101A-wa1', 'tr_fbs5_21', 'Faith Mwende', '13258', 'graded', 63, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":4,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":18,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":17,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."}]'::jsonb, '[]'::jsonb, 'Distinction performance. Very clear understanding of digital literacy, shortcut keys, and spreadsheet budgeting.', '2026-10-13T14:13:45Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-12265', 'exam-061155101A-wa1', 'tr_fbs5_22', 'Eugene Murimi', '12265', 'graded', 59, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":4,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":2,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":16,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b13","answer":"a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.","marks_awarded":16,"ai_reasoning":"Good responses covering spreadsheet sorting, CV formatting, and OS selection."}]'::jsonb, '[]'::jsonb, 'Distinction performance. Demonstrated strong grasp of hardware peripherals, safe shutdown, and office applications.', '2026-10-13T14:03:19Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13231', 'exam-061155101A-wa1', 'tr_fbs5_23', 'Brendah Mumbi', '13231', 'graded', 64, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":4,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":4,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":18,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":17,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."}]'::jsonb, '[]'::jsonb, 'Distinction performance. Excellent procedural steps in document encryption and Word table operations.', '2026-10-13T14:10:45Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13281', 'exam-061155101A-wa1', 'tr_fbs5_03', 'Kibaara Peninah Gaichuiri', '13281', 'graded', 58, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":16,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b13","answer":"a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.","marks_awarded":15,"ai_reasoning":"Good responses covering spreadsheet sorting, CV formatting, and OS selection."}]'::jsonb, '[]'::jsonb, 'Distinction performance. Solid command of workplace computing and safe laboratory practices.', '2026-10-13T13:42:15Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13297', 'exam-061155101A-wa1', 'tr_fbs5_04', 'Hilda Mwede Njagi', '13297', 'graded', 53, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":3,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":2,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":14,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."},{"question_id":"dl1_b13","answer":"a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.","marks_awarded":14,"ai_reasoning":"Good responses covering spreadsheet sorting, CV formatting, and OS selection."}]'::jsonb, '[]'::jsonb, 'Credit performance. Good explanations across Section A and competent answers on spreadsheet sorting.', '2026-10-13T13:58:30Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13304', 'exam-061155101A-wa1', 'tr_fbs5_05', 'Ndolo Shalom Mbithe', '13304', 'graded', 60, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":4,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":16,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":16,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."}]'::jsonb, '[]'::jsonb, 'Distinction performance. Well-articulated differences between system and application software.', '2026-10-13T13:36:45Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13313', 'exam-061155101A-wa1', 'tr_fbs5_06', 'Mirriam Nzula', '13313', 'graded', 52, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":3,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":2,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":2,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":14,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b13","answer":"a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.","marks_awarded":14,"ai_reasoning":"Good responses covering spreadsheet sorting, CV formatting, and OS selection."}]'::jsonb, '[]'::jsonb, 'Credit performance. Proper identification of input/output peripherals and safe file management.', '2026-10-13T14:02:12Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13343', 'exam-061155101A-wa1', 'tr_fbs5_07', 'Waweru Hope Marion Makena', '13343', 'graded', 65, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":4,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":4,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":3,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":18,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":17,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."}]'::jsonb, '[]'::jsonb, 'Distinction performance. Exceptional technical mastery of word processing features and lab safety.', '2026-10-13T14:09:55Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13355', 'exam-061155101A-wa1', 'tr_fbs5_08', 'Ann Joy Makena', '13355', 'graded', 57, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":15,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."},{"question_id":"dl1_b13","answer":"a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.","marks_awarded":15,"ai_reasoning":"Good responses covering spreadsheet sorting, CV formatting, and OS selection."}]'::jsonb, '[]'::jsonb, 'Distinction performance. Clear procedural breakdown for projector configuration and folder protection.', '2026-10-13T13:44:18Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13378', 'exam-061155101A-wa1', 'tr_fbs5_09', 'Martha Mwende Kyalo', '13378', 'graded', 50, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":3,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":2,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":2,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":13,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b13","answer":"a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.","marks_awarded":13,"ai_reasoning":"Good responses covering spreadsheet sorting, CV formatting, and OS selection."}]'::jsonb, '[]'::jsonb, 'Credit performance. Satisfactory answers in Section A; review spreadsheet functions.', '2026-10-13T13:59:04Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13396', 'exam-061155101A-wa1', 'tr_fbs5_10', 'John Opiyo Omondi', '13396', 'graded', 58, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":16,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":15,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."}]'::jsonb, '[]'::jsonb, 'Distinction performance. Comprehensive comparison between calculators and computers.', '2026-10-13T14:05:40Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13445', 'exam-061155101A-wa1', 'tr_fbs5_11', 'Eunice Kendi Nyaga', '13445', 'graded', 62, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":4,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":3,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":17,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b13","answer":"a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.","marks_awarded":16,"ai_reasoning":"Good responses covering spreadsheet sorting, CV formatting, and OS selection."}]'::jsonb, '[]'::jsonb, 'Distinction performance. High-quality explanations of office shortcuts and network save procedures.', '2026-10-13T14:11:20Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13446', 'exam-061155101A-wa1', 'tr_fbs5_12', 'Miriko Rita', '13446', 'graded', 51, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":3,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":2,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":2,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":14,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":13,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."}]'::jsonb, '[]'::jsonb, 'Credit performance. Good foundational knowledge of digital literacy in hospitality.', '2026-10-13T13:46:33Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13463', 'exam-061155101A-wa1', 'tr_fbs5_13', 'Valentine Lesoito', '13463', 'graded', 54, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":2,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":14,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b13","answer":"a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.","marks_awarded":14,"ai_reasoning":"Good responses covering spreadsheet sorting, CV formatting, and OS selection."}]'::jsonb, '[]'::jsonb, 'Credit performance. Solid practical understanding of newsletter formatting options.', '2026-10-13T13:57:12Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13482', 'exam-061155101A-wa1', 'tr_fbs5_14', 'Kinyua Christine Mutito', '13482', 'graded', 61, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":4,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":17,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":16,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."}]'::jsonb, '[]'::jsonb, 'Distinction performance. Accurate definitions of GUI drag-and-drop and ICT workplace policies.', '2026-10-13T14:12:05Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13488', 'exam-061155101A-wa1', 'tr_fbs5_15', 'Gichukia Bridgit Nyakio', '13488', 'graded', 53, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":3,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":2,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":14,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."},{"question_id":"dl1_b13","answer":"a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.","marks_awarded":14,"ai_reasoning":"Good responses covering spreadsheet sorting, CV formatting, and OS selection."}]'::jsonb, '[]'::jsonb, 'Credit performance. Good work on Section A peripherals and Excel data sorting.', '2026-10-13T14:08:14Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13546', 'exam-061155101A-wa1', 'tr_fbs5_16', 'Karwitha Silvia', '13546', 'graded', 59, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":16,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b13","answer":"a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.","marks_awarded":16,"ai_reasoning":"Good responses covering spreadsheet sorting, CV formatting, and OS selection."}]'::jsonb, '[]'::jsonb, 'Distinction performance. Well-structured responses across word processing and spreadsheet questions.', '2026-10-13T13:39:50Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13551', 'exam-061155101A-wa1', 'tr_fbs5_17', 'Lavint Aliviza', '13551', 'graded', 50, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":3,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":2,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":2,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":13,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":13,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."}]'::jsonb, '[]'::jsonb, 'Credit performance. Competent answers on safe computer laboratory practices and printing.', '2026-10-13T14:01:25Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13559', 'exam-061155101A-wa1', 'tr_fbs5_18', 'Kinya Weddy', '13559', 'graded', 58, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":16,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."},{"question_id":"dl1_b13","answer":"a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.","marks_awarded":15,"ai_reasoning":"Good responses covering spreadsheet sorting, CV formatting, and OS selection."}]'::jsonb, '[]'::jsonb, 'Distinction performance. Proper execution sequence for projector display setup and file management.', '2026-10-13T14:07:38Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13571', 'exam-061155101A-wa1', 'tr_fbs5_19', 'Gakuhi Jackline Nyambura', '13571', 'graded', 57, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":15,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b13","answer":"a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.","marks_awarded":15,"ai_reasoning":"Good responses covering spreadsheet sorting, CV formatting, and OS selection."}]'::jsonb, '[]'::jsonb, 'Distinction performance. Clear distinction between OS system software and application tools.', '2026-10-13T13:41:02Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13583', 'exam-061155101A-wa1', 'tr_fbs5_20', 'Terry Mwendwa', '13583', 'graded', 52, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":3,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":2,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":2,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":14,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":14,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."}]'::jsonb, '[]'::jsonb, 'Credit performance. Satisfactory understanding of keyboard techniques and document passwords.', '2026-10-13T13:56:40Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13251', 'exam-061155101A-wa1', 'tr_fbs6_01', 'Mbithi Faith Wavinya', '13251', 'graded', 61, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":4,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":17,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b13","answer":"a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.","marks_awarded":16,"ai_reasoning":"Good responses covering spreadsheet sorting, CV formatting, and OS selection."}]'::jsonb, '[]'::jsonb, 'Distinction performance. Excellent technical detail on computer architecture and spreadsheet formulas.', '2026-10-13T13:52:48Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13314', 'exam-061155101A-wa1', 'tr_fbs6_02', 'Emmanuel Njoroge', '13314', 'graded', 55, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":2,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":15,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":14,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."}]'::jsonb, '[]'::jsonb, 'Credit performance. Strong grasp of hardware interfaces and file drag-and-drop operations.', '2026-10-13T13:45:10Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13403', 'exam-061155101A-wa1', 'tr_fbs6_03', 'Brenda Ntinyari', '13403', 'graded', 65, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":4,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":4,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":3,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":18,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":17,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."}]'::jsonb, '[]'::jsonb, 'Distinction performance. Thorough answers on office shortcuts, Word tables, and lab ergonomics.', '2026-10-13T14:06:50Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13430', 'exam-061155101A-wa1', 'tr_fbs6_04', 'Omedo Lilian Atieno', '13430', 'graded', 52, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":3,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":2,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":2,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":14,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."},{"question_id":"dl1_b13","answer":"a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.","marks_awarded":14,"ai_reasoning":"Good responses covering spreadsheet sorting, CV formatting, and OS selection."}]'::jsonb, '[]'::jsonb, 'Credit performance. Good understanding of data safety and spreadsheet functions.', '2026-10-13T14:00:32Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13487', 'exam-061155101A-wa1', 'tr_fbs6_05', 'Waguama Donatus Wachira', '13487', 'graded', 58, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":3,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":16,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b13","answer":"a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.","marks_awarded":15,"ai_reasoning":"Good responses covering spreadsheet sorting, CV formatting, and OS selection."}]'::jsonb, '[]'::jsonb, 'Distinction performance. Solid grasp of operating system selection factors and printing controls.', '2026-10-13T13:49:15Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-fbs-13495', 'exam-061155101A-wa1', 'tr_fbs6_06', 'Nyamai Caroline Mutheu', '13495', 'graded', 61, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.","marks_awarded":2,"ai_reasoning":"Accurately articulates digital technology application and workplace efficiency."},{"question_id":"dl1_a2","answer":"Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.","marks_awarded":4,"ai_reasoning":"Valid professional peripherals identified."},{"question_id":"dl1_a3","answer":"1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.","marks_awarded":3,"ai_reasoning":"Core sequence adheres to standard institutional shutdown procedure."},{"question_id":"dl1_a4","answer":"1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.","marks_awarded":2,"ai_reasoning":"Valid keyboard productivity techniques identified."},{"question_id":"dl1_a5","answer":"Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.","marks_awarded":4,"ai_reasoning":"Complete explanation covering folder creation, save, and password encryption."},{"question_id":"dl1_a6","answer":"1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).","marks_awarded":3,"ai_reasoning":"Three common computing areas correctly stated."},{"question_id":"dl1_a7","answer":"Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.","marks_awarded":3,"ai_reasoning":"Accurate physical and display projection procedure."},{"question_id":"dl1_a8","answer":"System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).","marks_awarded":3,"ai_reasoning":"Clear software distinction with valid examples."},{"question_id":"dl1_a9","answer":"Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.","marks_awarded":2,"ai_reasoning":"Correct definition of GUI drag-and-drop file relocation."},{"question_id":"dl1_a10","answer":"1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.","marks_awarded":2,"ai_reasoning":"Appropriate workplace policies stated."}]'::jsonb, '[{"question_id":"dl1_b11","answer":"a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.","marks_awarded":17,"ai_reasoning":"Comprehensive grasp of word processing, office shortcuts, and computer architecture."},{"question_id":"dl1_b12","answer":"a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.","marks_awarded":16,"ai_reasoning":"Table, spreadsheet operations, and lab precautions well articulated."}]'::jsonb, '[]'::jsonb, 'Distinction performance. Well-rounded submission demonstrating mastery of digital workplace skills.', '2026-10-13T14:04:44Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-005', 'exam-dl-01', '13254', 'Yvonne Mwende', '13254', 'graded', 63, '[{"question_id":"dl1_a1","answer":"Digital literacy is the ability to find, evaluate, and compose clear information using digital devices.","marks_awarded":2},{"question_id":"dl1_a2","answer":"Input: Keyboard and Scanner. Output: Monitor and Laser Printer.","marks_awarded":4},{"question_id":"dl1_a3","answer":"1. Save open files. 2. Close active applications. 3. Click Start > Power > Shut Down.","marks_awarded":3},{"question_id":"dl1_a4","answer":"Touch typing and keyboard shortcuts like Ctrl+S, Ctrl+C.","marks_awarded":2},{"question_id":"dl1_a5","answer":"Create folder > File > Save As into folder > set password in General Options.","marks_awarded":4},{"question_id":"dl1_a6","answer":"Banking, Healthcare, Education.","marks_awarded":3},{"question_id":"dl1_a7","answer":"Connect HDMI, press Win + P, select Duplicate.","marks_awarded":3},{"question_id":"dl1_a8","answer":"System software manages hardware (Windows); application software does user work (Word).","marks_awarded":3},{"question_id":"dl1_a9","answer":"Click and drag file to destination folder.","marks_awarded":2},{"question_id":"dl1_a10","answer":"Acceptable use policy and password security policy.","marks_awarded":2}]'::jsonb, '[{"question_id":"dl1_b11","answer":"Word processor features, newsletter formatting, shortcuts, calculator differences.","marks_awarded":18},{"question_id":"dl1_b12","answer":"Word tables, spreadsheet printing, budget components, lab safety measures.","marks_awarded":17}]'::jsonb, '[]'::jsonb, 'Distinction performance. Strong grasp of digital literacy concepts.', '2026-10-04T11:30:00Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-006', 'exam-dl-01', '13263', 'Muoki Muthoki', '13263', 'graded', 56, '[{"question_id":"dl1_a1","answer":"Digital literacy is using computers effectively for workplace communication.","marks_awarded":2},{"question_id":"dl1_a2","answer":"Input: Keyboard, Mouse. Output: Monitor, Printer.","marks_awarded":4},{"question_id":"dl1_a3","answer":"Save documents, close apps, click Start > Shut down.","marks_awarded":2},{"question_id":"dl1_a4","answer":"Home row touch typing and Ctrl+C shortcuts.","marks_awarded":2},{"question_id":"dl1_a5","answer":"New folder, Save As, set password.","marks_awarded":3},{"question_id":"dl1_a6","answer":"Hospitals, Banks, Schools.","marks_awarded":2},{"question_id":"dl1_a7","answer":"HDMI cable, Windows + P Duplicate.","marks_awarded":2},{"question_id":"dl1_a8","answer":"System software (Windows), Application software (Word).","marks_awarded":3},{"question_id":"dl1_a9","answer":"Drag file to folder and release.","marks_awarded":2},{"question_id":"dl1_a10","answer":"Password policy, Acceptable use policy.","marks_awarded":2}]'::jsonb, '[{"question_id":"dl1_b11","answer":"Word processor, shortcuts, calculator vs computer.","marks_awarded":16},{"question_id":"dl1_b12","answer":"Word tables, spreadsheet print, lab safety.","marks_awarded":16}]'::jsonb, '[]'::jsonb, 'Competent performance (Credit). Good practical understanding.', '2026-10-04T12:00:00Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-101', 'exam-cr-001', 'trainee-001', 'Alex Kinoti', '10525', 'graded', 45, '[{"question_id":"q1","answer":"0","marks_awarded":5}]'::jsonb, '[{"question_id":"q2","answer":"Inspect processes and thermals","marks_awarded":8}]'::jsonb, '[]'::jsonb, NULL, '2026-09-01T10:00:00Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-102', 'exam-cr-001', 'trainee-002', 'Harriet Mwendwa', '10526', 'submitted', 38, '[{"question_id":"q1","answer":"0","marks_awarded":5}]'::jsonb, '[{"question_id":"q2","answer":"Check cooling fans","marks_awarded":6}]'::jsonb, '[]'::jsonb, NULL, '2026-09-01T10:05:00Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-in-progress-1', 'exam-cr-001', 'trainee-001', 'Alex Kinoti', '10525', 'submitted', 5, '[{"question_id":"q1","answer":"0","marks_awarded":5}]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, '2026-10-24T14:27:50.797Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;
INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)
VALUES ('sub-draft-001', 'exam-cr-001', 'trainee-001', 'Alex Kinoti', '10525', 'submitted', 5, '[{"question_id":"q1","answer":"0"}]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, '2026-10-24T14:28:01.378Z', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;

-- 5. Session Plans & Records of Work
INSERT INTO session_plans (id, unit_offering_id, class_code, trainer_id, department_id, date, session_title, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)
VALUES ('sp-001', 'uo-1', NULL, 'trainer-001', 'dept-ci', '2026-09-10', 'PC Hardware Diagnostics', 'pending', NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;
INSERT INTO session_plans (id, unit_offering_id, class_code, trainer_id, department_id, date, session_title, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)
VALUES ('sp-002', 'uo-3', NULL, 'trainer-002', 'dept-ci', '2026-09-12', 'Network Cabling & Crimping', 'approved', 'hod-001', 'Prof. S. Njoroge', '2026-09-13T10:00:00Z', 'Approved for lab practicals.', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;
INSERT INTO session_plans (id, unit_offering_id, class_code, trainer_id, department_id, date, session_title, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)
VALUES ('sp-ee-001', 'uo-ee-1', NULL, 'trainer-ee-001', 'dept-ee', '2026-09-14', 'Power Systems Analysis', 'pending', NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;
INSERT INTO session_plans (id, unit_offering_id, class_code, trainer_id, department_id, date, session_title, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)
VALUES ('sp-api-1792531332503', 'uo-api', 'ADMIN5/6/J/26 MOD 3', 'trainer-001', NULL, NULL, 'Central API Sync Test', 'pending', NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;
INSERT INTO session_plans (id, unit_offering_id, class_code, trainer_id, department_id, date, session_title, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)
VALUES ('sp-api-1792531453504', 'uo-api', 'ADMIN5/6/J/26 MOD 3', 'trainer-001', NULL, NULL, 'Central API Sync Test', 'pending', NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;
INSERT INTO session_plans (id, unit_offering_id, class_code, trainer_id, department_id, date, session_title, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)
VALUES ('sp-api-1792531530343', 'uo-api', 'ADMIN5/6/J/26 MOD 3', 'trainer-001', NULL, NULL, 'Central API Sync Test', 'pending', NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;
INSERT INTO session_plans (id, unit_offering_id, class_code, trainer_id, department_id, date, session_title, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)
VALUES ('sp-api-1792532814782', 'uo-api', 'ADMIN5/6/J/26 MOD 3', 'trainer-001', NULL, NULL, 'Central API Sync Test', 'pending', NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;
INSERT INTO session_plans (id, unit_offering_id, class_code, trainer_id, department_id, date, session_title, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)
VALUES ('sp-api-1792533364573', 'uo-api', 'ADMIN5/6/J/26 MOD 3', 'trainer-001', NULL, NULL, 'Central API Sync Test', 'pending', NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;
INSERT INTO records_of_work (id, session_plan_id, unit_offering_id, class_code, trainer_id, department_id, work_covered, date_covered, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)
VALUES ('row-001', 'sp-001', 'uo-1', NULL, 'trainer-001', 'dept-ci', 'Disassembly and testing of power supply units', '2026-09-10', 'approved', 'hod-001', 'Prof. S. Njoroge', '2026-10-20T21:55:57.655Z', 'Verified syllabus delivery and practical log.', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;
INSERT INTO records_of_work (id, session_plan_id, unit_offering_id, class_code, trainer_id, department_id, work_covered, date_covered, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)
VALUES ('row-002', 'sp-002', 'uo-3', NULL, 'trainer-002', 'dept-ci', 'Ethernet standard 568B termination lab', '2026-09-12', 'approved', 'hod-001', 'Prof. S. Njoroge', '2026-09-13T10:00:00Z', 'Verified against syllabus.', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;
INSERT INTO records_of_work (id, session_plan_id, unit_offering_id, class_code, trainer_id, department_id, work_covered, date_covered, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)
VALUES ('row-ee-001', 'sp-ee-001', 'uo-ee-1', NULL, 'trainer-ee-001', 'dept-ee', 'Transformer loading tests', '2026-09-14', 'pending', NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;
INSERT INTO records_of_work (id, session_plan_id, unit_offering_id, class_code, trainer_id, department_id, work_covered, date_covered, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)
VALUES ('row-api-1792531332758', NULL, 'uo-api', 'ADMIN5/6/J/26 MOD 3', NULL, NULL, 'Completed database integration practical', '2026-10-21', 'pending', NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;
INSERT INTO records_of_work (id, session_plan_id, unit_offering_id, class_code, trainer_id, department_id, work_covered, date_covered, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)
VALUES ('row-api-1792531453678', NULL, 'uo-api', 'ADMIN5/6/J/26 MOD 3', NULL, NULL, 'Completed database integration practical', '2026-10-21', 'pending', NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;
INSERT INTO records_of_work (id, session_plan_id, unit_offering_id, class_code, trainer_id, department_id, work_covered, date_covered, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)
VALUES ('row-api-1792531530886', NULL, 'uo-api', 'ADMIN5/6/J/26 MOD 3', NULL, NULL, 'Completed database integration practical', '2026-10-21', 'pending', NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;
INSERT INTO records_of_work (id, session_plan_id, unit_offering_id, class_code, trainer_id, department_id, work_covered, date_covered, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)
VALUES ('row-api-1792532815086', NULL, 'uo-api', 'ADMIN5/6/J/26 MOD 3', NULL, NULL, 'Completed database integration practical', '2026-10-21', 'pending', NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;
INSERT INTO records_of_work (id, session_plan_id, unit_offering_id, class_code, trainer_id, department_id, work_covered, date_covered, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)
VALUES ('row-api-1792533364990', NULL, 'uo-api', 'ADMIN5/6/J/26 MOD 3', NULL, NULL, 'Completed database integration practical', '2026-10-21', 'pending', NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;

COMMIT;
