-- =============================================================================
-- MUKIRIA TECHNICAL TRAINING INSTITUTE
-- Baseline Institutional Data Seed Script
-- File: database/migrations/03_seed_institutional_data.sql
-- =============================================================================

-- ─── 0. Schema Defenses: Relax Legacy NOT NULL Constraints ───────────────────
ALTER TABLE IF EXISTS Trainers 
ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE IF EXISTS Trainers ALTER COLUMN department DROP NOT NULL;

ALTER TABLE IF EXISTS Classes 
ADD COLUMN IF NOT EXISTS class_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 6;
ALTER TABLE IF EXISTS Classes ALTER COLUMN class_code DROP NOT NULL;
ALTER TABLE IF EXISTS Classes ALTER COLUMN name DROP NOT NULL;

ALTER TABLE IF EXISTS Units_of_Competence 
ADD COLUMN IF NOT EXISTS unit_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE IF EXISTS Units_of_Competence ALTER COLUMN unit_name DROP NOT NULL;
ALTER TABLE IF EXISTS Units_of_Competence ALTER COLUMN title DROP NOT NULL;

ALTER TABLE IF EXISTS Trainees 
ADD COLUMN IF NOT EXISTS reg_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS reg_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS adm_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE IF EXISTS Trainees ALTER COLUMN reg_code DROP NOT NULL;

ALTER TABLE IF EXISTS Exams 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS unit_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS course_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS total_marks NUMERIC(5,2) DEFAULT 100,
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'written',
ADD COLUMN IF NOT EXISTS class_id UUID,
ADD COLUMN IF NOT EXISTS trainer_id UUID,
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS Exams ALTER COLUMN trainer_id DROP NOT NULL;
ALTER TABLE IF EXISTS Exams ALTER COLUMN title DROP NOT NULL;
ALTER TABLE IF EXISTS Exams ALTER COLUMN instructions DROP NOT NULL;
ALTER TABLE IF EXISTS Exams ALTER COLUMN type DROP NOT NULL;
ALTER TABLE IF EXISTS Exams ALTER COLUMN total_marks DROP NOT NULL;

-- ─── 1. Atomic Seeding Block ──────────────────────────────────────────────────
DO $$
DECLARE
    -- ID holders
    v_term_id UUID;
    v_dept_ci UUID;
    v_dept_eee UUID;
    v_dept_bus UUID;
    v_dept_hosp UUID;
    
    v_trainer_muriithi UUID;
    v_trainer_njoroge UUID;
    v_trainer_kiprop UUID;
    
    v_class_admin UUID;
    v_class_it6 UUID;
    v_class_it4 UUID;
    v_class_fbs UUID;
    
    v_unit_ict UUID;
    v_unit_essentials UUID;
    v_unit_elec UUID;
    
    v_offering_ict UUID;
    v_offering_it6 UUID;
    v_offering_it4 UUID;
    
    v_trainee_risper UUID;
    v_trainee_gakii UUID;
    v_trainee_alvin UUID;
    v_trainee_faith UUID;
    v_trainee_alex UUID;
    
    v_exam_ict UUID;
BEGIN
    RAISE NOTICE 'Starting Mukiria TTI Institutional Data Seeding...';

    -- 1. Academic Terms
    SELECT id INTO v_term_id FROM Terms WHERE name = 'Term 3 - Sept/Dec 2026' LIMIT 1;
    IF v_term_id IS NULL THEN
        INSERT INTO Terms (name, start_date, end_date)
        VALUES ('Term 3 - Sept/Dec 2026', '2026-09-01', '2026-12-05')
        RETURNING id INTO v_term_id;
        RAISE NOTICE 'Created Academic Term: Term 3 - Sept/Dec 2026';
    END IF;

    -- 2. Trainers (Instructors & HODs) - Populate name, email, department
    SELECT id INTO v_trainer_muriithi FROM Trainers WHERE email = 'trainer@mtti.ac.ke' LIMIT 1;
    IF v_trainer_muriithi IS NULL THEN
        INSERT INTO Trainers (name, email, department)
        VALUES ('Dr. J. Muriithi', 'trainer@mtti.ac.ke', 'Computing & Informatics')
        RETURNING id INTO v_trainer_muriithi;
    ELSE
        UPDATE Trainers SET department = 'Computing & Informatics' WHERE id = v_trainer_muriithi;
    END IF;

    SELECT id INTO v_trainer_njoroge FROM Trainers WHERE email = 'hod@mtti.ac.ke' LIMIT 1;
    IF v_trainer_njoroge IS NULL THEN
        INSERT INTO Trainers (name, email, department)
        VALUES ('Prof. S. Njoroge', 'hod@mtti.ac.ke', 'Computing & Informatics')
        RETURNING id INTO v_trainer_njoroge;
    ELSE
        UPDATE Trainers SET department = 'Computing & Informatics' WHERE id = v_trainer_njoroge;
    END IF;

    SELECT id INTO v_trainer_kiprop FROM Trainers WHERE email = 'evans.kiprop@mtti.ac.ke' LIMIT 1;
    IF v_trainer_kiprop IS NULL THEN
        INSERT INTO Trainers (name, email, department)
        VALUES ('Eng. Evans Kiprop', 'evans.kiprop@mtti.ac.ke', 'Electrical & Electronics')
        RETURNING id INTO v_trainer_kiprop;
    ELSE
        UPDATE Trainers SET department = 'Electrical & Electronics' WHERE id = v_trainer_kiprop;
    END IF;

    -- 3. Academic Departments
    SELECT id INTO v_dept_ci FROM Departments WHERE code = 'CI' LIMIT 1;
    IF v_dept_ci IS NULL THEN
        INSERT INTO Departments (name, code, hod_id)
        VALUES ('Computing & Informatics', 'CI', v_trainer_njoroge)
        RETURNING id INTO v_dept_ci;
    ELSE
        UPDATE Departments SET hod_id = v_trainer_njoroge WHERE id = v_dept_ci;
    END IF;

    SELECT id INTO v_dept_eee FROM Departments WHERE code = 'EEE' LIMIT 1;
    IF v_dept_eee IS NULL THEN
        INSERT INTO Departments (name, code, hod_id)
        VALUES ('Electrical & Electronics Engineering', 'EEE', v_trainer_kiprop)
        RETURNING id INTO v_dept_eee;
    ELSE
        UPDATE Departments SET hod_id = v_trainer_kiprop WHERE id = v_dept_eee;
    END IF;

    SELECT id INTO v_dept_bus FROM Departments WHERE code = 'BUS' LIMIT 1;
    IF v_dept_bus IS NULL THEN
        INSERT INTO Departments (name, code)
        VALUES ('Business Studies', 'BUS')
        RETURNING id INTO v_dept_bus;
    END IF;

    SELECT id INTO v_dept_hosp FROM Departments WHERE code = 'HOSP' LIMIT 1;
    IF v_dept_hosp IS NULL THEN
        INSERT INTO Departments (name, code)
        VALUES ('Hospitality Management', 'HOSP')
        RETURNING id INTO v_dept_hosp;
    END IF;

    -- 4. Classes / Student Cohorts - Supply both name and class_code
    SELECT id INTO v_class_admin FROM Classes WHERE name = 'Admin 5/6/J/2026' OR class_code = 'Admin 5/6/J/2026' LIMIT 1;
    IF v_class_admin IS NULL THEN
        INSERT INTO Classes (name, class_code, level, term_id)
        VALUES ('Admin 5/6/J/2026', 'Admin 5/6/J/2026', 5, v_term_id)
        RETURNING id INTO v_class_admin;
    END IF;

    SELECT id INTO v_class_it6 FROM Classes WHERE name = 'ITECH 6 MODULAR/S/2026' OR class_code = 'ITECH 6 MODULAR/S/2026' LIMIT 1;
    IF v_class_it6 IS NULL THEN
        INSERT INTO Classes (name, class_code, level, term_id)
        VALUES ('ITECH 6 MODULAR/S/2026', 'ITECH 6 MODULAR/S/2026', 6, v_term_id)
        RETURNING id INTO v_class_it6;
    END IF;

    SELECT id INTO v_class_it4 FROM Classes WHERE name = 'ICT4 MOD/S/2026' OR class_code = 'ICT4 MOD/S/2026' LIMIT 1;
    IF v_class_it4 IS NULL THEN
        INSERT INTO Classes (name, class_code, level, term_id)
        VALUES ('ICT4 MOD/S/2026', 'ICT4 MOD/S/2026', 4, v_term_id)
        RETURNING id INTO v_class_it4;
    END IF;

    SELECT id INTO v_class_fbs FROM Classes WHERE name = 'FBS Hospitality' OR class_code = 'FBS Hospitality' LIMIT 1;
    IF v_class_fbs IS NULL THEN
        INSERT INTO Classes (name, class_code, level, term_id)
        VALUES ('FBS Hospitality', 'FBS Hospitality', 4, v_term_id)
        RETURNING id INTO v_class_fbs;
    END IF;

    -- 5. Units of Competence - Supply both title and unit_name
    SELECT id INTO v_unit_ict FROM Units_of_Competence WHERE unit_code = '0415-451-21A' LIMIT 1;
    IF v_unit_ict IS NULL THEN
        INSERT INTO Units_of_Competence (unit_code, title, unit_name, level, department_id)
        VALUES ('0415-451-21A', 'Apply ICT Skills', 'Apply ICT Skills', 5, v_dept_ci)
        RETURNING id INTO v_unit_ict;
    ELSE
        UPDATE Units_of_Competence SET department_id = v_dept_ci, title = 'Apply ICT Skills', unit_name = 'Apply ICT Skills' WHERE id = v_unit_ict;
    END IF;

    SELECT id INTO v_unit_essentials FROM Units_of_Competence WHERE unit_code = '0611-651-21A' LIMIT 1;
    IF v_unit_essentials IS NULL THEN
        INSERT INTO Units_of_Competence (unit_code, title, unit_name, level, department_id)
        VALUES ('0611-651-21A', 'Perform Computer Essentials', 'Perform Computer Essentials', 6, v_dept_ci)
        RETURNING id INTO v_unit_essentials;
    ELSE
        UPDATE Units_of_Competence SET department_id = v_dept_ci, title = 'Perform Computer Essentials', unit_name = 'Perform Computer Essentials' WHERE id = v_unit_essentials;
    END IF;

    SELECT id INTO v_unit_elec FROM Units_of_Competence WHERE unit_code = '0713-451-21A' LIMIT 1;
    IF v_unit_elec IS NULL THEN
        INSERT INTO Units_of_Competence (unit_code, title, unit_name, level, department_id)
        VALUES ('0713-451-21A', 'Electrical Installation & Maintenance', 'Electrical Installation & Maintenance', 5, v_dept_eee)
        RETURNING id INTO v_unit_elec;
    ELSE
        UPDATE Units_of_Competence SET department_id = v_dept_eee, title = 'Electrical Installation & Maintenance', unit_name = 'Electrical Installation & Maintenance' WHERE id = v_unit_elec;
    END IF;

    -- 6. Unit Offerings (Allocation Anchor)
    SELECT id INTO v_offering_ict FROM Unit_Offerings 
    WHERE term_id = v_term_id AND class_id = v_class_admin AND unit_id = v_unit_ict LIMIT 1;
    IF v_offering_ict IS NULL THEN
        INSERT INTO Unit_Offerings (term_id, class_id, unit_id, trainer_id)
        VALUES (v_term_id, v_class_admin, v_unit_ict, v_trainer_muriithi)
        RETURNING id INTO v_offering_ict;
    ELSE
        UPDATE Unit_Offerings SET trainer_id = v_trainer_muriithi WHERE id = v_offering_ict;
    END IF;

    SELECT id INTO v_offering_it6 FROM Unit_Offerings 
    WHERE term_id = v_term_id AND class_id = v_class_it6 AND unit_id = v_unit_essentials LIMIT 1;
    IF v_offering_it6 IS NULL THEN
        INSERT INTO Unit_Offerings (term_id, class_id, unit_id, trainer_id)
        VALUES (v_term_id, v_class_it6, v_unit_essentials, v_trainer_muriithi)
        RETURNING id INTO v_offering_it6;
    ELSE
        UPDATE Unit_Offerings SET trainer_id = v_trainer_muriithi WHERE id = v_offering_it6;
    END IF;

    SELECT id INTO v_offering_it4 FROM Unit_Offerings 
    WHERE term_id = v_term_id AND class_id = v_class_it4 AND unit_id = v_unit_essentials LIMIT 1;
    IF v_offering_it4 IS NULL THEN
        INSERT INTO Unit_Offerings (term_id, class_id, unit_id, trainer_id)
        VALUES (v_term_id, v_class_it4, v_unit_essentials, v_trainer_kiprop)
        RETURNING id INTO v_offering_it4;
    ELSE
        UPDATE Unit_Offerings SET trainer_id = v_trainer_kiprop WHERE id = v_offering_it4;
    END IF;

    -- 7. Trainees (Institutional Cohorts) - Supply reg_code, reg_number, adm_no, email
    SELECT id INTO v_trainee_risper FROM Trainees WHERE reg_number = '13410' OR reg_code = '13410' LIMIT 1;
    IF v_trainee_risper IS NULL THEN
        INSERT INTO Trainees (reg_code, reg_number, adm_no, name, email, class_id)
        VALUES ('13410', '13410', '13410', 'RISPER MWENDE', 'risper.mwende@mtti.ac.ke', v_class_admin)
        RETURNING id INTO v_trainee_risper;
    END IF;

    SELECT id INTO v_trainee_gakii FROM Trainees WHERE reg_number = '14179/S2026' OR reg_code = 'ITECH 6 MOD/14179/S2026' LIMIT 1;
    IF v_trainee_gakii IS NULL THEN
        INSERT INTO Trainees (reg_code, reg_number, adm_no, name, email, class_id)
        VALUES ('ITECH 6 MOD/14179/S2026', '14179/S2026', '14179/S2026', 'Nthiga Gakii Doris', 'doris.nthiga@mtti.ac.ke', v_class_it6)
        RETURNING id INTO v_trainee_gakii;
    END IF;

    SELECT id INTO v_trainee_alvin FROM Trainees WHERE reg_number = '14076/S2026' OR reg_code = 'ICT4 MOD/14076/S2026' LIMIT 1;
    IF v_trainee_alvin IS NULL THEN
        INSERT INTO Trainees (reg_code, reg_number, adm_no, name, email, class_id)
        VALUES ('ICT4 MOD/14076/S2026', '14076/S2026', '14076/S2026', 'Wanjau Alvin Gatere', 'alvin.wanjau@mtti.ac.ke', v_class_it4)
        RETURNING id INTO v_trainee_alvin;
    END IF;

    SELECT id INTO v_trainee_faith FROM Trainees WHERE reg_number = '13258' OR reg_code = '13258' LIMIT 1;
    IF v_trainee_faith IS NULL THEN
        INSERT INTO Trainees (reg_code, reg_number, adm_no, name, email, class_id)
        VALUES ('13258', '13258', '13258', 'Faith Mwende', 'faith.mwende@mtti.ac.ke', v_class_fbs)
        RETURNING id INTO v_trainee_faith;
    END IF;

    SELECT id INTO v_trainee_alex FROM Trainees WHERE reg_number = 'MTTI/DICT/2024/001' OR reg_code = 'MTTI/DICT/2024/001' LIMIT 1;
    IF v_trainee_alex IS NULL THEN
        INSERT INTO Trainees (reg_code, reg_number, adm_no, name, email, class_id)
        VALUES ('MTTI/DICT/2024/001', 'MTTI/DICT/2024/001', '001', 'Alex Kinoti', 'student@mtti.ac.ke', v_class_it6)
        RETURNING id INTO v_trainee_alex;
    END IF;

    -- 8. Exams (Satisfy both relational schema and JSON payload schema)
    SELECT id INTO v_exam_ict FROM Exams WHERE unit_code = '0415-451-21A-WA1' LIMIT 1;
    IF v_exam_ict IS NULL THEN
        INSERT INTO Exams (
            unit_id, class_id, trainer_id, unit_code, course_name, title,
            duration_minutes, total_marks, instructions, type, payload
        )
        VALUES (
            v_unit_ict,
            v_class_admin,
            v_trainer_muriithi,
            '0415-451-21A-WA1',
            'Office Administration (Apply ICT Skills)',
            'Apply ICT Skills — Written Assessment 1 (Term Sept/Dec 2026)',
            120,
            100,
            'Answer ALL questions in Section A (40 Marks) and ANY THREE questions in Section B (60 Marks).',
            'written',
            jsonb_build_object(
                'title', 'Apply ICT Skills — Written Assessment 1 (Term Sept/Dec 2026)',
                'duration_minutes', 120,
                'total_marks', 100,
                'type', 'written',
                'series', 'Sept/Dec 2026',
                'class', 'Admin 5/6/J/2026',
                'start_time', '2026-09-01T08:00:00Z',
                'end_time', '2026-12-05T18:00:00Z',
                'instructions', 'Answer ALL questions in Section A (40 Marks) and ANY THREE questions in Section B (60 Marks).',
                'section_a', jsonb_build_object(
                    'title', 'Section A — Core Concepts & Procedures (Compulsory)',
                    'instructions', 'Answer ALL questions in this section (40 Marks total).',
                    'total_marks', 40,
                    'questions', jsonb_build_array(
                        jsonb_build_object(
                            'id', 'wa1_a1',
                            'text', 'Define an ''operating system'' and give two examples.',
                            'type', 'short_answer',
                            'marks', 4,
                            'critical_aspect', 'Operating system definition and categorization',
                            'correct_answer', 'System software that manages computer hardware and software resources. Examples: Microsoft Windows, Linux, macOS.',
                            'rubric', '2 marks for complete definition, 1 mark per correct example.'
                        ),
                        jsonb_build_object(
                            'id', 'wa1_a2',
                            'text', 'State three main functions of the Central Processing Unit (CPU).',
                            'type', 'short_answer',
                            'marks', 6,
                            'critical_aspect', 'CPU operation cycle',
                            'correct_answer', '1. Fetching instructions from memory, 2. Decoding instructions, 3. Executing arithmetic and logical instructions.',
                            'rubric', '2 marks for each well-explained CPU core function.'
                        ),
                        jsonb_build_object(
                            'id', 'wa1_a3',
                            'text', 'Which of the following is an example of volatile primary memory?',
                            'type', 'mcq',
                            'marks', 2,
                            'options', jsonb_build_array('ROM', 'RAM', 'Flash Drive', 'Hard Disk Drive'),
                            'correct_answer', 'RAM',
                            'rubric', '2 marks for selecting RAM, 0 marks for incorrect options.'
                        )
                    )
                ),
                'section_b', jsonb_build_object(
                    'title', 'Section B — Application & Practical Scenarios',
                    'instructions', 'Answer ANY THREE questions in this section (60 Marks total).',
                    'total_marks', 60,
                    'questions', jsonb_build_array(
                        jsonb_build_object(
                            'id', 'wa1_b1',
                            'text', 'Explain the step-by-step procedure for performing a Mail Merge in Microsoft Word 2016 to generate customized admission letters.',
                            'type', 'essay',
                            'marks', 20,
                            'critical_aspect', 'Mail Merge workflow and recipient datasource binding',
                            'correct_answer', 'Step 1: Open Word and select Mailings > Start Mail Merge > Letters. Step 2: Select Recipients > Use an Existing List. Step 3: Insert Merge Fields into document template. Step 4: Preview Results. Step 5: Finish & Merge.',
                            'rubric', '4 marks for Mailings setup, 5 marks for datasource connection, 6 marks for merge fields, 5 marks for final output.'
                        )
                    )
                )
            )
        )
        RETURNING id INTO v_exam_ict;
    END IF;

    -- 9. Trainee Submissions (Locked vs Draft)
    IF NOT EXISTS (SELECT 1 FROM Submissions WHERE exam_id = v_exam_ict AND reg_number = '13410') THEN
        INSERT INTO Submissions (
            exam_id, unit_code, trainee_id, reg_number, student_name, student_email,
            status, total_score, section_a, section_b, submitted_at, payload
        ) VALUES (
            v_exam_ict, '0415-451-21A-WA1', v_trainee_risper, '13410', 'RISPER MWENDE', 'risper.mwende@mtti.ac.ke',
            'submitted', NULL,
            jsonb_build_array(
                jsonb_build_object('question_id', 'wa1_a1', 'answer', 'System software controlling computer operations. Windows 11, Ubuntu Linux.'),
                jsonb_build_object('question_id', 'wa1_a2', 'answer', 'Fetch instructions, decode instructions, execute arithmetic logic operations.'),
                jsonb_build_object('question_id', 'wa1_a3', 'answer', 'RAM')
            ),
            jsonb_build_array(
                jsonb_build_object('question_id', 'wa1_b1', 'answer', 'Click Mailings > Start Mail Merge. Select recipients from Excel sheet. Insert merge fields. Finish and merge.')
            ),
            NOW() - INTERVAL '2 hours',
            jsonb_build_object('client_platform', 'web', 'submission_type', 'final')
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM Submissions WHERE exam_id = v_exam_ict AND reg_number = 'MTTI/DICT/2024/001') THEN
        INSERT INTO Submissions (
            exam_id, unit_code, trainee_id, reg_number, student_name, student_email,
            status, total_score, section_a, section_b, submitted_at, payload
        ) VALUES (
            v_exam_ict, '0415-451-21A-WA1', v_trainee_alex, 'MTTI/DICT/2024/001', 'Alex Kinoti', 'student@mtti.ac.ke',
            'in_progress', NULL,
            jsonb_build_array(
                jsonb_build_object('question_id', 'wa1_a1', 'answer', 'An operating system is the core software managing memory and processes.')
            ),
            '[]'::jsonb,
            NULL,
            jsonb_build_object('client_platform', 'web', 'draft_saved_at', NOW())
        );
    END IF;

    -- 10. Continuous Assessment Marks
    IF NOT EXISTS (SELECT 1 FROM Assessment_Marks WHERE unit_offering_id = v_offering_ict AND trainee_id = v_trainee_risper) THEN
        INSERT INTO Assessment_Marks (
            unit_offering_id, trainee_id, ct_scores, computed_average_theory,
            cp_scores, computed_average_practical, weighted_mark, is_locked
        ) VALUES (
            v_offering_ict, v_trainee_risper,
            jsonb_build_object('CT1', 82.5, 'CT2', 78.0, 'CT3', 85.0), 81.83,
            jsonb_build_object('CP1', 88.0, 'CP2', 90.0, 'CP3', 86.5), 88.17,
            85.63, FALSE
        );
    END IF;

    RAISE NOTICE 'Institutional Data Seeding Completed Successfully!';
END $$;
