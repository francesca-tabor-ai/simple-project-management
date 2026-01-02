-- Migration: Add extended fields to tasks table
-- Date: 2026-01-02
-- Description: Adds all extended columns for task details, integrations, and metadata
-- This migration is safe to run multiple times (uses IF NOT EXISTS)

-- Add extended task detail columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "dueDate" TEXT DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee JSONB DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Add integration columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "googleCalendar" JSONB DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source JSONB DEFAULT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks("dueDate");
CREATE INDEX IF NOT EXISTS idx_tasks_google_calendar ON tasks USING gin ("googleCalendar");
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks USING gin (source);

-- Add helpful column comments
COMMENT ON COLUMN tasks.description IS 'Detailed task description with rich text';
COMMENT ON COLUMN tasks."dueDate" IS 'Due date in ISO format (YYYY-MM-DD)';
COMMENT ON COLUMN tasks.priority IS 'Task priority level: low, medium, high, or urgent';
COMMENT ON COLUMN tasks.labels IS 'Array of label objects: [{id, name, color}]';
COMMENT ON COLUMN tasks.assignee IS 'Assigned user object: {id, name}';
COMMENT ON COLUMN tasks.checklist IS 'Array of checklist items: [{id, text, done}]';
COMMENT ON COLUMN tasks.attachments IS 'Array of attachments: [{id, title, url}]';
COMMENT ON COLUMN tasks."googleCalendar" IS 'Google Calendar sync metadata: {synced, calendarId, eventId, lastSyncedAt}';
COMMENT ON COLUMN tasks.source IS 'Task source tracking: {type, from, messageSid, mediaSid, receivedAt}';

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

