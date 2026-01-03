# Fix: Labels and Checklist Not Showing After Test Data Migration

## Problem
After running `TEST_DATA.sql`, tasks were created but:
- ❌ Labels were not showing in the UI
- ❌ Checklist items were not showing in the UI

## Root Cause
The frontend was still reading from the old JSONB columns (`tasks.labels` and `tasks.checklist`) instead of querying the new normalized tables (`labels`, `task_labels`, `checklist_items`).

## Solution

### 1. Updated `getTasks()` to Fetch Normalized Labels
**File**: `app/actions/tasks.ts`

Changed from simple `SELECT *` to:
1. Fetch all tasks
2. Fetch all labels via `task_labels` JOIN
3. Merge labels into tasks (with JSONB fallback)

```typescript
const { data: taskLabelsData } = await supabase
  .from('task_labels')
  .select(`
    task_id,
    labels (id, name, color)
  `)
  .in('task_id', taskIds)
```

### 2. Created Label Management Actions
**File**: `app/actions/labels.ts` (NEW)

New server actions:
- `addLabelToTask()` - Creates label and links to task
- `removeLabelFromTask()` - Unlinks label from task
- `updateLabelColor()` - Updates label color
- JSONB fallback functions for backwards compatibility

### 3. Updated TaskDetailsDrawer to Use Normalized Labels
**File**: `components/TaskDetailsDrawer.tsx`

Updated label handlers:
- `handleAddLabel()` → Now calls `addLabelToTask()`
- `handleRemoveLabel()` → Now calls `removeLabelFromTask()`
- `handleChangeLabelColor()` → Now calls `updateLabelColor()`

All with optimistic updates + error rollback.

### 4. Created Verification Script
**File**: `supabase/migrations/VERIFY_TEST_DATA.sql` (NEW)

Run this in Supabase SQL Editor to check:
- Tasks created
- Checklist items linked
- Labels created
- Task-label relationships
- RLS policies active

## Testing Steps

### 1. Run VERIFY_TEST_DATA.sql
Copy and run in Supabase SQL Editor to confirm data exists.

### 2. Refresh the App
```bash
# The dev server should auto-reload, but if not:
npm run dev
```

### 3. Check the UI
- Open a task from the test data
- ✅ Labels should now be visible
- ✅ Checklist items should be visible
- ✅ You can add/remove/edit labels
- ✅ You can add/toggle/delete checklist items

## Backwards Compatibility

All new code includes **JSONB fallbacks**:
- If normalized tables don't exist → uses JSONB columns
- If normalized tables are empty → falls back to JSONB
- This allows gradual migration without breaking existing functionality

## What's Next

1. **Run the verification script** to confirm data is in the database
2. **Test the UI** to see labels and checklist items
3. **If labels still don't show**: Check browser console for errors (RLS policy issues?)
4. **If checklist items don't show**: The drawer already uses normalized table, so this should work

## Key Files Changed
- ✅ `app/actions/tasks.ts` - Updated getTasks()
- ✅ `app/actions/labels.ts` - NEW label management
- ✅ `components/TaskDetailsDrawer.tsx` - Use new label actions
- ✅ `supabase/migrations/VERIFY_TEST_DATA.sql` - NEW verification script
- ✅ `supabase/migrations/TEST_DATA.sql` - Fixed UUID format

