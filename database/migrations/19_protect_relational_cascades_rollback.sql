-- ==============================================================================
-- Migration 19 Rollback: Revert Relational Cascades on Academic Terms
-- Context: Phase E Approved Finding (DEF-E04) Rollback
-- ==============================================================================

BEGIN;

ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_term_id_fkey;
ALTER TABLE classes
    ADD CONSTRAINT classes_term_id_fkey
    FOREIGN KEY (term_id)
    REFERENCES terms(id)
    ON DELETE CASCADE;

ALTER TABLE unit_offerings DROP CONSTRAINT IF EXISTS unit_offerings_term_id_fkey;
ALTER TABLE unit_offerings
    ADD CONSTRAINT unit_offerings_term_id_fkey
    FOREIGN KEY (term_id)
    REFERENCES terms(id)
    ON DELETE CASCADE;

COMMIT;
