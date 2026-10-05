BEGIN;

-- 1. Create attendance_register table if not exists with composite unique constraint
CREATE TABLE IF NOT EXISTS attendance_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_offering_id UUID NOT NULL REFERENCES unit_offerings(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'present', -- 'present', 'absent', 'excused'
  hours_attended NUMERIC(4, 1) DEFAULT 2.0,
  remarks TEXT,
  marked_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_attendance_session UNIQUE (unit_offering_id, trainee_id, week_number, session_date)
);

-- 2. Guarantee columns exist if table was previously created with minimal columns
ALTER TABLE attendance_register 
  ADD COLUMN IF NOT EXISTS unit_offering_id UUID REFERENCES unit_offerings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS trainee_id UUID REFERENCES trainees(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS week_number INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS session_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'present',
  ADD COLUMN IF NOT EXISTS hours_attended NUMERIC(4, 1) DEFAULT 2.0,
  ADD COLUMN IF NOT EXISTS remarks TEXT,
  ADD COLUMN IF NOT EXISTS marked_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Guarantee unique constraint exists for reliable ON CONFLICT upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_attendance_session'
  ) THEN
    -- In case duplicates existed, clean them up or add constraint
    ALTER TABLE attendance_register 
    ADD CONSTRAINT uq_attendance_session UNIQUE (unit_offering_id, trainee_id, week_number, session_date);
  END IF;
END $$;

-- 4. Fast lookup index for class register queries
CREATE INDEX IF NOT EXISTS idx_attendance_lookup 
ON attendance_register(unit_offering_id, week_number);

-- 5. Enable Row Level Security and configure access policy
ALTER TABLE attendance_register ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'attendance_register' AND policyname = 'attendance_register_policy'
  ) THEN
    CREATE POLICY attendance_register_policy ON attendance_register
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

COMMIT;
