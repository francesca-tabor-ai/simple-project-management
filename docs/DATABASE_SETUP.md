# Database Setup Instructions

## Quick Setup

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Copy and paste the entire contents of `supabase/schema.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

## What This Creates

### Tasks Table (Extended)

The tasks table includes comprehensive task management features:

**Core Fields:**
- `id` - Unique identifier for each task
- `user_id` - References the authenticated user (enforces ownership)
- `title` - The task title
- `status` - One of: `pending`, `in_progress`, `done`
- `created_at` - Timestamp when task was created
- `updated_at` - Timestamp when task was last updated

**Extended Fields:**
- `description` - Multi-line task description (text)
- `dueDate` - ISO date string for task deadline (nullable)
- `priority` - One of: `low`, `medium`, `high`, `urgent`
- `labels` - Array of string labels (stored as JSONB)
- `assignee` - User object with `{id, name}` (stored as JSONB, nullable)
- `checklist` - Array of checklist items with `{id, text, done}` (stored as JSONB)
- `attachments` - Array of links with `{id, title, url}` (stored as JSONB)

### Row Level Security (RLS)

All policies are automatically set up to ensure:
- ✅ Users can only see their own tasks
- ✅ Users can only create tasks for themselves
- ✅ Users can only update their own tasks
- ✅ Users can only delete their own tasks

This means even if someone tries to access another user's data through the API, Supabase will automatically block it.

### Sample Data

The migration includes 5 sample tasks that demonstrate all features:

1. **Design new landing page** - High priority, in progress, with checklist and attachments
2. **Implement user authentication** - Medium priority, with assignee and labels
3. **Fix critical bug** - Urgent priority, overdue task
4. **Write API documentation** - Completed task with full checklist
5. **Update README** - Simple task with minimal metadata

These samples will be automatically created for your user when you run the migration.

## Features

### Task Details Drawer

Click any task card to open a comprehensive details panel with:

- **Description** - Multi-line text with auto-save
- **Priority** - Visual priority levels (Low/Medium/High/Urgent)
- **Due Date** - Date picker with overdue indicators
- **Assignee** - Assign tasks to team members
- **Labels** - Categorize with removable tags
- **Checklist** - Track sub-tasks with progress bar
- **Attachments** - Add links to relevant resources

### Enhanced Task Cards

Task cards now display:
- Priority badge with color coding
- Due date (with red indicator if overdue)
- Label chips (up to 3 visible + counter)
- Assignee avatar with initials
- Checklist completion ratio (e.g., "3/6")

## Verification

After running the SQL, you can verify the setup:

1. Go to **Table Editor** in your Supabase dashboard
2. You should see a `tasks` table with all the extended columns
3. Go to **Authentication** → **Policies** → Select `tasks` table
4. You should see 4 policies listed
5. You should see 5 sample tasks in the table

## Usage Notes

### JSONB Fields

The following fields use PostgreSQL's JSONB format for flexible storage:
- `labels` - Stored as JSON array: `["label1", "label2"]`
- `assignee` - Stored as JSON object: `{"id": "1", "name": "John"}`
- `checklist` - Stored as JSON array of objects
- `attachments` - Stored as JSON array of objects

This allows for efficient querying while maintaining flexibility.

### Updating the Schema

If you need to add more fields later, you can run additional migrations:

```sql
ALTER TABLE tasks ADD COLUMN new_field TEXT;
```

### Indexes

The schema includes indexes on commonly queried fields:
- `user_id` - Fast user-specific queries
- `status` - Quick filtering by status
- `priority` - Efficient priority sorting
- `dueDate` - Fast deadline queries

## Troubleshooting

### "Table already exists" Error

If you see an error that the table already exists, you can either:

1. **Drop and recreate** (⚠️ WARNING: This deletes all data):
```sql
DROP TABLE IF EXISTS tasks CASCADE;
```
Then run the schema.sql again.

2. **Add only new columns** to existing table:
```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "dueDate" TEXT DEFAULT NULL;
-- etc...
```

### Schema Cache Not Refreshing

If the API doesn't recognize the new columns:
1. Go to **Settings** → **API** in Supabase Dashboard
2. Click **Restart API** or **Reload Schema**
3. Wait 1-2 minutes for the cache to refresh

That's it! Your task management system is ready to use.
