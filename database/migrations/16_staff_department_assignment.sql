ALTER TABLE users
ADD COLUMN IF NOT EXISTS department_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_users_department_id
ON users (department_id)
WHERE department_id IS NOT NULL;
