-- ==============================================================================
-- Mukiria Technical Training Institute (MTTI)
-- Migration 16: Phase 1 Profile ID Linkage
-- File: database/migrations/16_phase1_profile_link.sql
-- ==============================================================================

-- 1. Add persisted profile_id link to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_id TEXT;
CREATE INDEX IF NOT EXISTS idx_users_profile_id ON users(profile_id);

-- 2. Ensure staff tables have email lookup fields for directory resolution
ALTER TABLE Trainers ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE Departments ADD COLUMN IF NOT EXISTS hod_email VARCHAR(255);
