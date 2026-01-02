# Supabase Database Setup Guide

This guide will help you set up all the necessary database tables and configurations in Supabase.

---

## 📋 Overview

Your app uses these tables:
- **`auth.users`** - Managed automatically by Supabase Auth (no setup needed)
- **`tasks`** - Main task data with extended fields

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Go to Supabase SQL Editor

1. Open your Supabase project: https://supabase.com/dashboard/project/vogjubuvhdniuziqxrla
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

---

### Step 2: Run the Complete Schema

Copy **ALL** of the SQL from `supabase/schema.sql` and paste it into the SQL Editor, then click **"Run"**.

Or copy this complete schema:

```sql
-- ============================================================================
-- TASKS TABLE SCHEMA - Complete Setup
-- ============================================================================
-- This creates the tasks table with all fields, RLS policies, and sample data

-- Drop existing table if you want to start fresh (CAREFUL - deletes data!)
-- DROP TABLE IF EXISTS tasks CASCADE;

-- Create tasks table with extended fields for task details
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'done')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Extended fields
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

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- Create RLS policies
-- Users can only see their own tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own tasks
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own tasks
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks("dueDate");
CREATE INDEX IF NOT EXISTS idx_tasks_google_calendar ON tasks USING gin ("googleCalendar");
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks USING gin (source);

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
```

Click **"Run"** ▶️

---

### Step 3: Verify Tables Created

Run this query to verify:

```sql
-- Check if tables exist
SELECT 
  schemaname,
  tablename
FROM pg_tables
WHERE tablename = 'tasks';

-- Check columns
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;
```

You should see **15 columns** including:
- id, user_id, title, status, created_at, updated_at
- description, dueDate, priority, labels, assignee
- checklist, attachments, googleCalendar, source

---

## 🔐 About the Users Table

### auth.users Table

The **`auth.users`** table is **automatically created** by Supabase when you enable Authentication.

**You don't need to create it manually!**

This table stores:
- User IDs (UUID)
- Email addresses
- Encrypted passwords
- OAuth tokens (Google, etc.)
- Email confirmation status
- Last sign in time

### Verify Users Table Exists

```sql
-- Check auth.users table
SELECT 
  id,
  email,
  created_at
FROM auth.users
LIMIT 5;
```

If you see an empty result, that's normal - no users exist yet!

---

## 📊 Add Sample Data (Optional)

If you want to test with sample tasks, your schema.sql file includes sample data.

**To add sample data:**

1. First, create a user account in your app
2. Get your user ID:
   ```sql
   SELECT id, email FROM auth.users LIMIT 1;
   ```
3. The sample data INSERTs in `schema.sql` will automatically use this user ID

Or you can manually insert a test task:

```sql
-- Replace YOUR_USER_ID with your actual user ID
INSERT INTO tasks (user_id, title, status, description, priority)
VALUES (
  'YOUR_USER_ID',
  'Test Task',
  'pending',
  'This is a test task',
  'medium'
);
```

---

## ✅ Verify Setup Complete

### 1. Check RLS is Enabled

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'tasks';
```

Should show `rowsecurity = true`

### 2. Check Policies Exist

```sql
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'tasks';
```

Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)

### 3. Check Indexes

```sql
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'tasks';
```

Should show 6-8 indexes

---

## 🔄 Update Existing Database

If you already have a `tasks` table but it's missing columns, run the migration:

```sql
-- Add missing columns (safe to run multiple times)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "dueDate" TEXT DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee JSONB DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "googleCalendar" JSONB DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source JSONB DEFAULT NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks("dueDate");
CREATE INDEX IF NOT EXISTS idx_tasks_google_calendar ON tasks USING gin ("googleCalendar");
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks USING gin (source);

-- Force schema reload
NOTIFY pgrst, 'reload schema';
```

---

## 🛠️ Troubleshooting

### Error: "permission denied for schema auth"

✅ This is normal - you're trying to modify Supabase's built-in auth schema.  
**Solution**: Don't try to create `auth.users` - it already exists!

### Error: "relation tasks already exists"

✅ Your table is already created!  
**Solution**: Skip table creation, or use the migration script to add missing columns.

### Error: "column already exists"

✅ The column is there!  
**Solution**: The `IF NOT EXISTS` clause makes it safe. Just continue.

### No data showing in app

1. **Check you're logged in** - RLS requires authentication
2. **Check user_id matches** - Tasks are filtered by user
3. **Check RLS policies** - Make sure they're enabled
4. **Check schema cache** - Run `NOTIFY pgrst, 'reload schema';`

---

## 📞 Next Steps

After setting up the database:

1. ✅ **Test authentication**: Sign up in your app
2. ✅ **Create a task**: Should save to database
3. ✅ **Verify in Supabase**: Check Table Editor to see your task
4. ✅ **Test RLS**: Try accessing another user's tasks (should be blocked)

---

## 🎉 Success Checklist

- [ ] `tasks` table created with 15 columns
- [ ] RLS enabled on `tasks` table
- [ ] 4 RLS policies created (SELECT, INSERT, UPDATE, DELETE)
- [ ] Indexes created for performance
- [ ] `auth.users` table exists (automatic)
- [ ] Schema cache reloaded
- [ ] Can create tasks in app
- [ ] Tasks appear in Supabase Table Editor

**Your database is ready!** 🚀

