-- Core Entity Tables
CREATE TABLE Terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

CREATE TABLE Classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL CHECK (level BETWEEN 3 AND 6),
    term_id UUID REFERENCES Terms(id) ON DELETE CASCADE
);

CREATE TABLE Trainees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reg_code VARCHAR(100) UNIQUE NOT NULL,
    adm_no VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    class_id UUID REFERENCES Classes(id) ON DELETE SET NULL
);

CREATE TABLE Trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE Units_of_Competence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL CHECK (level BETWEEN 3 AND 6)
);

-- ─── 1. The Anchor: [Term + Class + Unit] ────────────────────────────────────
CREATE TABLE Unit_Offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id UUID REFERENCES Terms(id) ON DELETE CASCADE,
    class_id UUID REFERENCES Classes(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES Units_of_Competence(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES Trainers(id) ON DELETE SET NULL,
    UNIQUE(term_id, class_id, unit_id)
);

-- Pedagogical Tables
CREATE TABLE Learning_Plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_offering_id UUID REFERENCES Unit_Offerings(id) ON DELETE CASCADE
);

CREATE TABLE Learning_Outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_plan_id UUID REFERENCES Learning_Plans(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    critical_aspect TEXT -- Maps to CDACC Critical Aspect
);

-- Relational Links
CREATE TABLE Timetable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID REFERENCES Trainers(id) ON DELETE CASCADE,
    class_id UUID REFERENCES Classes(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES Units_of_Competence(id) ON DELETE CASCADE,
    day_of_week VARCHAR(15) NOT NULL,
    time_block VARCHAR(50) NOT NULL
);

CREATE TABLE Session_Plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_offering_id UUID REFERENCES Unit_Offerings(id) ON DELETE CASCADE,
    timetable_id UUID REFERENCES Timetable(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft', -- Draft, Approved, Completed
    content JSONB, -- Flexible storage for specific session details
    reflection_notes TEXT,
    reflection_status VARCHAR(50) -- e.g., 'Went Great', 'Need to Review'
);

CREATE TABLE Attendance_Register (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_plan_id UUID REFERENCES Session_Plans(id) ON DELETE CASCADE,
    trainee_id UUID REFERENCES Trainees(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL DEFAULT 'Present' -- 'Present', 'Absent'
);

CREATE TABLE Record_of_Work (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_plan_id UUID REFERENCES Session_Plans(id) ON DELETE CASCADE,
    learning_outcome_id UUID REFERENCES Learning_Outcomes(id) ON DELETE CASCADE,
    date_covered DATE NOT NULL
);

-- Phase 1 NEW: Assessment Marks Table (Normalized)
CREATE TABLE Assessment_Marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_offering_id UUID REFERENCES Unit_Offerings(id) ON DELETE CASCADE,
    trainee_id UUID REFERENCES Trainees(id) ON DELETE CASCADE,
    
    -- Continuous Theory (CT)
    ct_scores JSONB, -- Array of scores e.g., [80, 75, 90]
    computed_average_theory NUMERIC(5,2),
    
    -- Continuous Practical (CP)
    cp_scores JSONB, -- Array of scores
    computed_average_practical NUMERIC(5,2),
    
    -- Final Calculation
    weighted_mark NUMERIC(5,2),
    is_locked BOOLEAN DEFAULT FALSE, -- Internal Assessor Sign-off

    -- Ensure one record per trainee per unit offering
    UNIQUE(unit_offering_id, trainee_id)
);

-- Assessment Evidence (Foreign Key strictly linking uploaded files)
CREATE TABLE Assessment_Evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_offering_id UUID,
    trainee_id UUID,
    assessment_type VARCHAR(10) NOT NULL CHECK (assessment_type LIKE 'CT%' OR assessment_type LIKE 'CP%'),
    file_url TEXT NOT NULL,
    uploaded_by_id UUID,
    verified_by_trainer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (unit_offering_id, trainee_id) REFERENCES Assessment_Marks(unit_offering_id, trainee_id) ON DELETE CASCADE
);
