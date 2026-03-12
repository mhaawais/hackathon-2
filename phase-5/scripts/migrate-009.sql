-- Migration: Spec-009 Intermediate Features
-- Run against Neon DB: psql $DATABASE_URL -f migrate-009.sql
-- Safe to run multiple times (IF NOT EXISTS / IF NOT EXISTS guards)

-- New columns on todo table
ALTER TABLE todo ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE todo ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium';
ALTER TABLE todo ADD COLUMN IF NOT EXISTS tags JSON NOT NULL DEFAULT '[]';
ALTER TABLE todo ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Add CHECK constraint for priority (idempotent approach)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'todo_priority_check' AND table_name = 'todo'
  ) THEN
    ALTER TABLE todo ADD CONSTRAINT todo_priority_check
      CHECK (priority IN ('high', 'medium', 'low'));
  END IF;
END$$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todo (priority, user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todo (due_date) WHERE due_date IS NOT NULL;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'todo'
ORDER BY ordinal_position;
