# Supabase Database Files

This folder contains all database-related SQL files organized by purpose.

---

## 📁 Folder Structure

```
supabase/
├── schema.sql                    # Complete database schema (single file setup)
├── setup-database.sql            # Quick setup script (backward compatible)
├── migrations/                   # Database migrations (run in order)
│   ├── 20260102_add_extended_fields.sql
│   ├── 20260103_normalize_checklist_labels.sql
│   ├── 20260103_01_create_tables.sql
│   ├── 20260103_02_enable_rls.sql
│   ├── 20260103_03_migrate_data.sql
│   └── 20260103_04_create_views.sql
├── tests/                        # Test & verification scripts
│   ├── QUICK_SQL_TEST.sql
│   ├── test-checklist-simple.sql
│   └── test-checklist-supabase.sql
├── queries/                      # Reusable query snippets
│   └── verify-checklist-db.sql
└── README.md                     # This file
```

---

## 🚀 Quick Start

### For New Projects

**Option 1: Single File Setup** (Easiest)

Run `schema.sql` in Supabase SQL Editor:

```bash
# Copy and paste entire contents of schema.sql
# Click "Run" in Supabase SQL Editor
```

This creates:
- ✅ Tasks table with all fields
- ✅ RLS policies
- ✅ Sample data
- ✅ Indexes

**Option 2: Use setup-database.sql**

Same as Option 1, but with more detailed comments.

---

### For Existing Projects (Migrations)

Run migrations in **chronological order**:

1. **20260102_add_extended_fields.sql**
   - Adds extended columns to tasks table
   - Safe to run multiple times

2. **20260103_normalize_checklist_labels.sql**
   - Complete migration (all steps in one file)
   - OR run the split versions below:

3. **20260103_01_create_tables.sql** ✅ Step 1
   - Creates checklist_items, labels, task_labels tables

4. **20260103_02_enable_rls.sql** ✅ Step 2
   - Enables Row Level Security
   - Creates security policies

5. **20260103_03_migrate_data.sql** ✅ Step 3
   - Migrates JSONB data to new tables

6. **20260103_04_create_views.sql** ✅ Step 4
   - Creates helper views
   - Enables backward-compatible queries

---

## 🧪 Testing

After running migrations, verify with test files:

### Quick Verification

```sql
-- Run: tests/QUICK_SQL_TEST.sql
-- No edits needed, runs immediately
```

Shows:
- ✅ Tables exist
- ✅ Columns are correct type
- ✅ Data is present

### Comprehensive Tests

```sql
-- Run: tests/test-checklist-supabase.sql
-- 10-step test suite with CRUD operations
```

### Read-Only Verification

```sql
-- Run: queries/verify-checklist-db.sql
-- Checks data integrity without modifications
```

---

## 📊 Schema Overview

### Current Structure (Normalized)

**Main Tables:**
- `tasks` - Core task data
- `checklist_items` - Checklist items (1-to-many with tasks)
- `labels` - Master label list per user
- `task_labels` - Junction table (many-to-many)

**Helper Views:**
- `tasks_with_checklist` - Tasks + checklist as JSON array
- `tasks_with_labels` - Tasks + labels as JSON array
- `tasks_complete` - Tasks + checklist + labels

### Legacy Structure (JSONB)

Old columns still exist for backward compatibility:
- `tasks.checklist` (JSONB) - Will be deprecated
- `tasks.labels` (JSONB) - Will be deprecated

---

## 🔄 Migration Timeline

| Date | Migration | Purpose |
|------|-----------|---------|
| 2026-01-02 | `20260102_add_extended_fields` | Add extended task fields |
| 2026-01-03 | `20260103_normalize_*` | Normalize checklist & labels |

---

## 🛠️ Development Workflow

### Adding a New Migration

1. Create file: `supabase/migrations/YYYYMMDD_description.sql`
2. Write migration with rollback comments
3. Test on staging database
4. Document in this README
5. Commit with descriptive message

**Naming Convention:**
```
YYYYMMDD_brief_description.sql

Examples:
20260104_add_task_comments.sql
20260105_create_team_workspace.sql
```

### Running Migrations Locally

```bash
# If using Supabase CLI (optional)
supabase db reset
supabase migration up
```

### Running Migrations in Production

1. Go to Supabase Dashboard → SQL Editor
2. Copy migration file contents
3. Paste and click "Run"
4. Verify with test queries
5. Monitor for errors

---

## 📝 Best Practices

### Writing Migrations

✅ **DO:**
- Use `IF NOT EXISTS` for idempotency
- Add helpful comments
- Include verification queries
- Keep migrations small and focused
- Test rollback procedures

❌ **DON'T:**
- Drop columns without backup
- Skip RLS policies
- Forget indexes on foreign keys
- Mix schema changes with data migrations

### Example Migration Template

```sql
-- ============================================================================
-- Migration: [Brief Description]
-- Date: YYYY-MM-DD
-- ============================================================================

-- Create table
CREATE TABLE IF NOT EXISTS new_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- ... columns
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_new_table_user ON new_table(user_id);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own records"
  ON new_table FOR SELECT
  USING (auth.uid() = user_id);

-- Verification
SELECT 'Migration complete' as status,
  COUNT(*) as rows
FROM new_table;

-- ============================================================================
```

---

## 🔍 Useful Queries

### Check Current Schema

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- View indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Verify Data Integrity

```sql
-- Check for orphaned checklist items
SELECT COUNT(*) 
FROM checklist_items ci
WHERE NOT EXISTS (
  SELECT 1 FROM tasks t WHERE t.id = ci.task_id
);

-- Check for orphaned task_labels
SELECT COUNT(*) 
FROM task_labels tl
WHERE NOT EXISTS (
  SELECT 1 FROM tasks t WHERE t.id = tl.task_id
)
OR NOT EXISTS (
  SELECT 1 FROM labels l WHERE l.id = tl.label_id
);
```

---

## 🔒 Security Notes

- ✅ All tables have RLS enabled
- ✅ Policies restrict access to user's own data
- ✅ Foreign keys have CASCADE DELETE
- ✅ No direct public access

**RLS Policy Pattern:**
```sql
-- Users can only access their own tasks
CREATE POLICY "policy_name"
  ON table_name FOR operation
  USING (auth.uid() = user_id);
```

---

## 📚 Related Documentation

- **[Database Setup Guide](../docs/DATABASE_SETUP.md)** - Step-by-step setup
- **[Normalized Schema](../docs/NORMALIZED_SCHEMA.md)** - New table structure
- **[Supabase Setup](../docs/SUPABASE_SETUP.md)** - Supabase configuration

---

## 🆘 Troubleshooting

### Migration Failed

1. **Check error message** in Supabase SQL Editor
2. **Verify prerequisites** - Does previous migration exist?
3. **Check for conflicts** - Do tables/policies already exist?
4. **Rollback if needed** - Drop created objects and retry

### RLS Policy Errors

```sql
-- Check if policy already exists
SELECT * FROM pg_policies 
WHERE tablename = 'your_table_name';

-- Drop and recreate if needed
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

### Data Migration Issues

```sql
-- Check source data exists
SELECT COUNT(*) FROM tasks 
WHERE jsonb_array_length(COALESCE(checklist, '[]'::jsonb)) > 0;

-- Check target data was created
SELECT COUNT(*) FROM checklist_items;
```

---

## 📊 Statistics

Current database state:

```sql
-- Run this to see current stats
SELECT 
  'tasks' as table_name, COUNT(*) as rows FROM tasks
UNION ALL
SELECT 'checklist_items', COUNT(*) FROM checklist_items
UNION ALL
SELECT 'labels', COUNT(*) FROM labels
UNION ALL
SELECT 'task_labels', COUNT(*) FROM task_labels;
```

---

**Last Updated:** January 3, 2026  
**Schema Version:** 2.0 (Normalized)  
**Status:** ✅ Production Ready

