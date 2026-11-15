-- ==============================================================================
-- Migration 19: Protect Relational Cascades on Academic Terms
-- Context: Phase E Approved Finding (DEF-E04)
-- Objective: Prevent accidental or malicious cascading deletion of Terms from
--            destroying all classes, unit offerings, student marks, and attendance.
-- ==============================================================================

BEGIN;

-- 1. Protect Classes -> Terms foreign key
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'classes'
          AND con.contype = 'f'
          AND pg_get_constraintdef(con.oid) LIKE '%REFERENCES terms(id)%'
    ) LOOP
        EXECUTE 'ALTER TABLE classes DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

ALTER TABLE classes
    ADD CONSTRAINT classes_term_id_fkey
    FOREIGN KEY (term_id)
    REFERENCES terms(id)
    ON DELETE RESTRICT;

-- 2. Protect Unit Offerings -> Terms foreign key
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'unit_offerings'
          AND con.contype = 'f'
          AND pg_get_constraintdef(con.oid) LIKE '%REFERENCES terms(id)%'
    ) LOOP
        EXECUTE 'ALTER TABLE unit_offerings DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

ALTER TABLE unit_offerings
    ADD CONSTRAINT unit_offerings_term_id_fkey
    FOREIGN KEY (term_id)
    REFERENCES terms(id)
    ON DELETE RESTRICT;

COMMIT;
