# Checklist Persistence - Technical Documentation

## ✅ Status: FULLY IMPLEMENTED

Checklist items **are persisted to the database** and survive page refreshes. This document explains how it works and how to verify it.

---

## Architecture

### Database Schema

Checklists are stored as JSONB in the `tasks` table:

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  -- ... other fields ...
  checklist JSONB DEFAULT '[]'::jsonb,  -- ← Persistent storage
  -- ...
);
```

**Checklist Item Structure:**

```typescript
{
  id: string;        // UUID generated client-side
  text: string;      // Item text
  done: boolean;     // Completion status
}
```

### Data Flow

```
User Action (add/toggle/delete)
  ↓
handleUpdate() in TaskDetailsDrawer
  ↓
setLocalTask() - Optimistic UI update (instant)
  ↓
useAutosave() hook detects change
  ↓
(400ms debounce for rapid changes)
  ↓
updateTask() server action
  ↓
Supabase UPDATE query
  ↓
Database persists JSONB array
```

---

## Implementation Details

### 1. Loading Checklists (Page Load)

**File:** `app/actions/tasks.ts`

```typescript
export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')  // ← Includes checklist JSONB
    .order('created_at', { ascending: false })
  
  return data || []
}
```

✅ **Checklists load automatically** with tasks on page refresh.

---

### 2. Adding Checklist Items

**File:** `components/TaskDetailsDrawer.tsx`

```typescript
const handleAddChecklistItem = () => {
  if (!newChecklistItem.trim()) return
  
  const newItem = {
    id: crypto.randomUUID(),  // ← Client-side UUID
    text: newChecklistItem.trim(),
    done: false,
  }
  
  // Optimistic update + auto-save
  handleUpdate({ checklist: [...localTask.checklist, newItem] })
  setNewChecklistItem('')
}
```

✅ **Immediately updates UI** and **queues database save**.

---

### 3. Toggling Checklist Items

```typescript
const handleToggleChecklistItem = (itemId: string) => {
  const updated = localTask.checklist.map(item =>
    item.id === itemId ? { ...item, done: !item.done } : item
  )
  handleUpdate({ checklist: updated })
}
```

✅ **Persists done state** to database.

---

### 4. Deleting Checklist Items

```typescript
const handleDeleteChecklistItem = (itemId: string) => {
  handleUpdate({ 
    checklist: localTask.checklist.filter(item => item.id !== itemId) 
  })
}
```

✅ **Removes from database** permanently.

---

### 5. Autosave System

**File:** `hooks/useAutosave.ts`

```typescript
const { status, error, flush } = useAutosave(
  localTask,
  async (draftTask) => {
    // Calculate diff (only changed fields)
    const updates = {}
    for (const key of keys) {
      if (JSON.stringify(draftTask[key]) !== JSON.stringify(task[key])) {
        updates[key] = draftTask[key]
      }
    }
    
    // Persist to Supabase
    if (Object.keys(updates).length > 0) {
      await updateTask(task.id, updates)
    }
  },
  { debounceMs: 400 }
)
```

**Key Features:**
- ✅ **Debouncing:** 400ms delay coalesces rapid changes
- ✅ **Diff Calculation:** Only sends changed fields
- ✅ **Flush on Close:** Pending saves committed when drawer closes
- ✅ **Visual Feedback:** "Saving..." / "Saved" indicator

---

## Testing Checklist Persistence

### ✅ Manual Test Steps

1. **Open task drawer**
   - Click any task card

2. **Add checklist item**
   - Type "Test item 1" → Click "Add"
   - Verify it appears in the list

3. **Wait for "Saved" indicator**
   - Look for checkmark in drawer header (top-right)
   - Wait ~500ms after adding

4. **Hard refresh the page**
   - Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - **Expected:** All checklist items still visible

5. **Toggle item done**
   - Check the checkbox
   - Wait for "Saved" indicator
   - Refresh page
   - **Expected:** Checkbox still checked

6. **Delete item**
   - Click × button
   - Wait for "Saved"
   - Refresh page
   - **Expected:** Item stays deleted

7. **Test rapid changes**
   - Add 3 items quickly
   - Toggle 2 checkboxes rapidly
   - Close drawer (auto-flushes saves)
   - Refresh page
   - **Expected:** All changes persisted

8. **Test across browser tabs**
   - Open task in Tab A
   - Add checklist item
   - Open same account in Tab B
   - **Expected:** Item appears after Tab B refresh

---

## Troubleshooting

### Issue: "Checklist disappears on refresh"

**Possible Causes:**

1. **Autosave not completing**
   ```
   Solution: Wait for "Saved" indicator before refreshing
   ```

2. **Browser cached stale data**
   ```
   Solution: Hard refresh (Cmd+Shift+R)
   ```

3. **Network error during save**
   ```
   Check: Look for red "Error" indicator in drawer header
   Solution: Click "Retry" button if present
   ```

4. **Drawer closed before flush**
   ```
   Note: Drawer calls flush() on close, but if page navigates
         immediately, the save might not complete
   Solution: Add 200ms delay before navigation if programmatic
   ```

### Issue: "Saved indicator never appears"

**Debugging Steps:**

1. **Open browser console** (F12)
2. **Check for errors** during save
3. **Look for failed API calls** in Network tab
4. **Common issues:**
   - User not authenticated
   - Network offline
   - Supabase RLS policy blocking update
   - Task doesn't exist

### Issue: "Changes revert after refresh"

**Likely Cause:** Race condition if navigating too quickly

**Fix:**
```typescript
// Before navigation:
await flushSave()
await new Promise(resolve => setTimeout(resolve, 100))
router.push('/somewhere')
```

---

## Database Verification

### Check checklist data directly in Supabase

1. **Go to Supabase Dashboard** → SQL Editor

2. **Run query:**
   ```sql
   SELECT 
     id,
     title,
     checklist
   FROM tasks
   WHERE user_id = auth.uid()
   ORDER BY updated_at DESC
   LIMIT 10;
   ```

3. **Verify:**
   - `checklist` column shows array: `[{id, text, done}, ...]`
   - Items match what you see in the UI

---

## Performance Considerations

### Why JSONB is used instead of separate table

**Option A: Separate `checklist_items` table**
```sql
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  text TEXT,
  done BOOLEAN,
  order INT
);
```

**Pros:**
- ✅ Normalized data
- ✅ Easy to query individual items
- ✅ Can add constraints

**Cons:**
- ❌ N+1 query problem (join required)
- ❌ More complex updates (transactions)
- ❌ Slower for typical use case (loading full tasks)

---

**Option B: JSONB array (current implementation)**
```sql
checklist JSONB DEFAULT '[]'::jsonb
```

**Pros:**
- ✅ **Single query** loads everything
- ✅ **Atomic updates** (no transactions needed)
- ✅ **Faster for typical reads** (no joins)
- ✅ **Simpler code** (fewer API endpoints)
- ✅ Still indexable with GIN if needed

**Cons:**
- ❌ Can't easily query across all checklists
- ❌ No foreign key constraints
- ❌ Denormalized

**Verdict:** JSONB is perfect for this use case because:
- Checklist items are always loaded with their parent task
- We never query checklist items independently
- Typical tasks have < 20 items (JSONB handles this well)
- Simplicity > normalization for MVP

---

## Migration Path (If You Need Separate Table Later)

If app grows and you need to query checklist items independently:

### Step 1: Create new table
```sql
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  "order" INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checklist_task_id ON checklist_items(task_id, "order");
```

### Step 2: Migrate existing data
```sql
-- For each task, explode JSONB array into rows
INSERT INTO checklist_items (id, task_id, text, done, "order")
SELECT 
  (item->>'id')::uuid,
  tasks.id,
  item->>'text',
  (item->>'done')::boolean,
  row_number - 1
FROM tasks,
  jsonb_array_elements(tasks.checklist) WITH ORDINALITY arr(item, row_number)
WHERE jsonb_array_length(tasks.checklist) > 0;
```

### Step 3: Update API
- Add `GET /api/tasks/:id/checklist`
- Add `POST /api/tasks/:id/checklist`
- Add `PATCH /api/checklist/:id`
- Add `DELETE /api/checklist/:id`
- Add `PATCH /api/tasks/:id/checklist/reorder`

### Step 4: Update client
- Fetch checklist items separately
- Update optimistic updates to call new endpoints

**But for now:** JSONB is the right choice! ✅

---

## Related Documentation

- **[Autosave Feature](./AUTOSAVE.md)** - How auto-saving works
- **[Task Details Drawer](./TASK_DETAILS_FEATURE.md)** - UI components
- **[Database Setup](./SUPABASE_SETUP.md)** - Schema overview

---

## Summary

| Aspect | Status |
|--------|--------|
| **Database Persistence** | ✅ JSONB column |
| **Auto-save** | ✅ 400ms debounce |
| **Load on refresh** | ✅ Included in getTasks |
| **Optimistic UI** | ✅ Instant feedback |
| **Error handling** | ✅ Retry on failure |
| **Flush on close** | ✅ Automatic |
| **Visual feedback** | ✅ Save indicators |
| **Works on refresh** | ✅ YES |

**Checklist persistence is fully working!** 🎉

If you're experiencing issues, follow the troubleshooting section above.

