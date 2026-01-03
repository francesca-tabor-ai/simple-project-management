# Normalized Checklist Items & Labels - Quick Reference

## Overview

This migration creates **separate tables** for checklist items and labels instead of storing them as JSONB in the tasks table.

---

## 📊 New Database Schema

### **Tasks Table** (unchanged core fields)
```sql
tasks
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── title (TEXT)
├── status (TEXT)
├── description (TEXT)
├── priority (TEXT)
├── dueDate (TEXT)
├── assignee (JSONB) -- Still JSONB (single object)
├── attachments (JSONB) -- Still JSONB (rarely queried)
├── googleCalendar (JSONB)
├── source (JSONB)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### **Checklist Items Table** (NEW)
```sql
checklist_items
├── id (UUID, PK)
├── task_id (UUID, FK → tasks.id) -- CASCADE DELETE
├── text (TEXT, NOT NULL)
├── done (BOOLEAN, DEFAULT false)
├── order (INTEGER, DEFAULT 0)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

Indexes:
  - (task_id, order) -- Fast ordered retrieval
  - (task_id, done) -- Filter by completion status
```

### **Labels Table** (NEW - Master list)
```sql
labels
├── id (UUID, PK)
├── name (TEXT, NOT NULL)
├── color (TEXT, DEFAULT '#3B82F6')
├── user_id (UUID, FK → auth.users)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

Unique: (user_id, name) -- One label name per user
```

### **Task Labels Table** (NEW - Junction)
```sql
task_labels
├── task_id (UUID, FK → tasks.id) -- CASCADE DELETE
├── label_id (UUID, FK → labels.id) -- CASCADE DELETE
└── created_at (TIMESTAMPTZ)

Primary Key: (task_id, label_id)
```

---

## 🔄 Migration Summary

The migration script:

✅ Creates 3 new tables with proper constraints  
✅ Migrates existing JSONB data to normalized tables  
✅ Sets up Row Level Security (RLS) on all tables  
✅ Creates indexes for performance  
✅ Creates helper views for easy querying  
✅ Keeps old JSONB columns for backward compatibility (optional)

---

## 📝 Example Queries

### 1. Get Task with Checklist Items

```sql
-- Using JOIN
SELECT 
  t.id,
  t.title,
  t.status,
  ci.id as item_id,
  ci.text as item_text,
  ci.done as item_done,
  ci."order" as item_order
FROM tasks t
LEFT JOIN checklist_items ci ON ci.task_id = t.id
WHERE t.user_id = auth.uid()
ORDER BY t.updated_at DESC, ci."order";
```

### 2. Get Task with Checklist as JSON Array (like before)

```sql
-- Using helper view
SELECT 
  id,
  title,
  status,
  checklist_items -- Returns JSON array like old structure
FROM tasks_with_checklist
WHERE user_id = auth.uid()
ORDER BY updated_at DESC;
```

### 3. Get Task with Labels

```sql
-- Using JOIN
SELECT 
  t.id,
  t.title,
  l.name as label_name,
  l.color as label_color
FROM tasks t
LEFT JOIN task_labels tl ON tl.task_id = t.id
LEFT JOIN labels l ON l.id = tl.label_id
WHERE t.user_id = auth.uid()
ORDER BY t.updated_at DESC, l.name;
```

### 4. Get Complete Task Data (everything)

```sql
-- Using helper view (recommended)
SELECT *
FROM tasks_complete
WHERE user_id = auth.uid()
ORDER BY updated_at DESC;

-- Returns tasks with:
-- - checklist_items as JSON array
-- - label_list as JSON array
```

### 5. Add Checklist Item

```sql
INSERT INTO checklist_items (task_id, text, done, "order")
VALUES (
  'task-uuid-here',
  'New checklist item',
  false,
  0 -- or (SELECT COALESCE(MAX("order"), -1) + 1 FROM checklist_items WHERE task_id = 'task-uuid-here')
)
RETURNING *;
```

### 6. Toggle Checklist Item

```sql
UPDATE checklist_items
SET done = NOT done
WHERE id = 'item-uuid-here'
  AND EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.id = checklist_items.task_id 
    AND tasks.user_id = auth.uid()
  )
RETURNING *;
```

### 7. Reorder Checklist Items

```sql
-- Update order for specific items
UPDATE checklist_items
SET "order" = CASE id
  WHEN 'item-uuid-1' THEN 0
  WHEN 'item-uuid-2' THEN 1
  WHEN 'item-uuid-3' THEN 2
END
WHERE task_id = 'task-uuid-here';
```

### 8. Create Label

```sql
INSERT INTO labels (name, color, user_id)
VALUES ('urgent', '#EF4444', auth.uid())
ON CONFLICT (user_id, name) 
DO UPDATE SET color = EXCLUDED.color
RETURNING *;
```

### 9. Add Label to Task

```sql
-- First ensure label exists
INSERT INTO labels (name, color, user_id)
VALUES ('feature', '#3B82F6', auth.uid())
ON CONFLICT (user_id, name) DO NOTHING;

-- Then link it to task
INSERT INTO task_labels (task_id, label_id)
SELECT 'task-uuid-here', id
FROM labels
WHERE name = 'feature' AND user_id = auth.uid()
ON CONFLICT DO NOTHING;
```

### 10. Remove Label from Task

```sql
DELETE FROM task_labels
WHERE task_id = 'task-uuid-here'
  AND label_id = 'label-uuid-here'
  AND EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.id = task_id 
    AND tasks.user_id = auth.uid()
  );
```

---

## 🔒 Security (RLS)

All tables have Row Level Security enabled:

- ✅ Users can only access checklist items for **their own tasks**
- ✅ Users can only create/edit/delete **their own labels**
- ✅ Users can only link labels to **their own tasks**
- ✅ All operations check `auth.uid()` = task owner

---

## 🚀 Performance Benefits

| Operation | JSONB (Old) | Normalized (New) |
|-----------|-------------|------------------|
| **Query single checklist item** | ❌ Must load entire array | ✅ Direct access by ID |
| **Update one item** | ❌ Rewrite entire array | ✅ Update single row |
| **Filter tasks by label** | ❌ JSONB search (slow) | ✅ JOIN (indexed, fast) |
| **Count incomplete items** | ❌ Process entire JSONB | ✅ Simple COUNT query |
| **Reorder checklist** | ❌ Rebuild entire array | ✅ Update order column |
| **Shared labels** | ❌ Duplicate data | ✅ Single source of truth |
| **Label autocomplete** | ❌ Scan all task JSONB | ✅ Query labels table |

---

## 📊 Helper Views

### `tasks_with_checklist`
Returns tasks with `checklist_items` as JSON array (backward compatible format)

### `tasks_with_labels`
Returns tasks with `label_list` as JSON array

### `tasks_complete`
Returns tasks with both checklist items AND labels as JSON arrays

**Usage:**
```sql
SELECT * FROM tasks_complete WHERE user_id = auth.uid();
```

Returns familiar format:
```json
{
  "id": "...",
  "title": "Task title",
  "checklist_items": [
    {"id": "...", "text": "Item 1", "done": false, "order": 0}
  ],
  "label_list": [
    {"id": "...", "name": "urgent", "color": "#EF4444"}
  ]
}
```

---

## 🔄 Backward Compatibility

The migration **keeps** old JSONB columns (`tasks.checklist`, `tasks.labels`) so existing code continues to work during transition.

**Recommended approach:**
1. Run migration
2. Update frontend to use new API endpoints
3. Test thoroughly
4. Drop old JSONB columns when ready

---

## 📁 Files

- **Migration:** `supabase/migrations/20260103_normalize_checklist_labels.sql`
- **Reference:** This file

---

## 🧪 Testing

After running migration:

```sql
-- Verify tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('checklist_items', 'labels', 'task_labels');

-- Verify data migrated
SELECT 
  (SELECT COUNT(*) FROM checklist_items) as checklist_count,
  (SELECT COUNT(*) FROM labels) as label_count,
  (SELECT COUNT(*) FROM task_labels) as task_label_count;

-- Test query
SELECT * FROM tasks_complete WHERE user_id = auth.uid() LIMIT 1;
```

---

## 🎯 Next Steps

1. **Run migration** in Supabase SQL Editor
2. **Create new API endpoints** for CRUD operations
3. **Update frontend** to use new structure
4. **Test thoroughly** with helper views
5. **Drop old JSONB columns** when confident

---

**Migration Date:** January 3, 2026  
**Status:** Ready to deploy

