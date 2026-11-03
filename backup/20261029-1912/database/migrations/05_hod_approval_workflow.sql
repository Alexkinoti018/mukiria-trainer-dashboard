-- =============================================================================
-- Migration 05: HOD Pedagogical Sign-Off & Academic Quality Assurance Workflow
-- Mukiria Technical Training Institute (MTTI)
-- Adds approval metadata and digital sign-off columns to Session_Plans and Record_of_Work
-- =============================================================================

-- 1. Extend Session_Plans with HOD sign-off columns
ALTER TABLE Session_Plans
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'draft' CHECK (approval_status IN ('draft', 'pending', 'approved', 'rejected', 'revision_requested')),
ADD COLUMN IF NOT EXISTS hod_reviewed_by UUID REFERENCES Users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS hod_reviewer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS hod_review_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS hod_remarks TEXT;

-- 2. Extend Record_of_Work with HOD sign-off columns
ALTER TABLE Record_of_Work
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'draft' CHECK (approval_status IN ('draft', 'pending', 'approved', 'rejected', 'revision_requested')),
ADD COLUMN IF NOT EXISTS hod_reviewed_by UUID REFERENCES Users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS hod_reviewer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS hod_review_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS hod_remarks TEXT;

-- 3. Create performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_session_plans_approval_status 
ON Session_Plans(unit_offering_id, approval_status);

CREATE INDEX IF NOT EXISTS idx_record_of_work_approval_status 
ON Record_of_Work(session_plan_id, approval_status);

-- 4. RLS Policy Hardening: Trainees have 0 write access to pedagogical approvals
-- Ensure HODs can only approve records within their respective department
CREATE OR REPLACE FUNCTION check_hod_department_match(p_unit_offering_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_dept_id UUID;
    v_user_dept_id UUID;
    v_user_role VARCHAR;
BEGIN
    SELECT role, department_id INTO v_user_role, v_user_dept_id FROM Users WHERE id = auth.uid();
    IF v_user_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    IF v_user_role = 'hod' THEN
        SELECT department_id INTO v_dept_id FROM Unit_Offerings WHERE id = p_unit_offering_id;
        RETURN v_dept_id = v_user_dept_id;
    END IF;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
