-- =============================================================================
-- MUKIRIA TECHNICAL TRAINING INSTITUTE
-- Unified User Management, Secure Authentication & RBAC Schema
-- Migration 15: Centralized Users Table & Seeded Roles
-- File: database/migrations/15_unified_user_management.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. Unified Users Table (Supports Trainees and Staff) ─────────────────────
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admission_number VARCHAR(100) UNIQUE,
    phone_number VARCHAR(50),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'TRAINEE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_role CHECK (UPPER(role) IN ('TRAINEE', 'TRAINER', 'HOD', 'ADMIN'))
);

-- Case-insensitive lookup indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_adm_lower ON users (LOWER(admission_number)) WHERE admission_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
