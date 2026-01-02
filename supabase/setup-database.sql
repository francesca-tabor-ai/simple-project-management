-- ============================================================================
-- QUICK DATABASE SETUP FOR SUPABASE
-- ============================================================================
-- Run this entire file in Supabase SQL Editor to set up your database
-- 
-- Instructions:
-- 1. Go to: https://supabase.com/dashboard/project/vogjubuvhdniuziqxrla/sql
-- 2. Click "New query"
-- 3. Copy and paste this ENTIRE file
-- 4. Click "Run" button
-- 5. Wait for success message
-- ============================================================================

-- Create tasks table with all extended fields
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'done')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Extended fields for task details
  description TEXT DEFAULT '',
  "dueDate" TEXT DEFAULT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  labels JSONB DEFAULT '[]'::jsonb,
  assignee JSONB DEFAULT NULL,
  checklist JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  -- Integration fields
  "googleCalendar" JSONB DEFAULT NULL,
  source JSONB DEFAULT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- Create RLS policies - users can only access their own tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks("dueDate");
CREATE INDEX IF NOT EXISTS idx_tasks_google_calendar ON tasks USING gin ("googleCalendar");
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks USING gin (source);

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Verification queries (optional - uncomment to run)
-- SELECT 'Tasks table created successfully!' as message;
-- SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'tasks';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tasks' ORDER BY ordinal_position;

