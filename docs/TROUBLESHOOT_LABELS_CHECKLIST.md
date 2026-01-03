# 🔧 Troubleshooting: Labels and Checklist Not Showing

## Current Status
✅ Build fixed and deployed to Vercel
❓ Labels and checklist items still not showing in UI

## Root Cause Analysis

Based on the RLS policies CSV you provided, the **tables exist**, but the data might not be there. Here's the checklist:

---

## Step 1: Verify Migration Was Run

### Did you run `SAFE_RUN_THIS.sql`?
This creates the normalized tables (`checklist_items`, `labels`, `task_labels`) and migrates your JSONB data.

**To check:**
1. Go to Supabase Dashboard → SQL Editor
2. Run this quick test:

```sql
-- Check if normalized tables exist and have data
SELECT 'checklist_items' as table_name, COUNT(*) as row_count FROM checklist_items
UNION ALL
SELECT 'labels', COUNT(*) FROM labels
UNION ALL
SELECT 'task_labels', COUNT(*) FROM task_labels;
```

**Expected Result:**
- If all counts are 0 → You have tables but no data
- If you get an error → Tables don't exist yet

### Solution:
Run these **in order**:
1. `supabase/migrations/SAFE_RUN_THIS.sql` (creates tables, migrates data)
2. `supabase/migrations/TEST_DATA.sql` (adds sample tasks)

---

## Step 2: Verify You're Logged In as the Correct User

The test data is linked to: `dd6fbf1c-94a9-468b-8ea3-a433b811e450`

**To check your current user ID:**
1. Open browser console (F12)
2. Go to Application → Local Storage → `supabase.auth.token`
3. Copy the JWT token
4. Decode it at https://jwt.io
5. Check the `sub` field (your user ID)

**If your user ID is different:**
- Option A: Update `TEST_DATA.sql` to use YOUR user ID
- Option B: Create a new user with the test user ID (not recommended)

---

## Step 3: Run Verification Query

In Supabase SQL Editor, run:

```sql
-- Check if YOUR user has tasks with labels/checklist
SELECT 
  t.id,
  t.title,
  t.user_id,
  (SELECT COUNT(*) FROM checklist_items ci WHERE ci.task_id = t.id) as checklist_count,
  (SELECT COUNT(*) FROM task_labels tl WHERE tl.task_id = t.id) as label_count
FROM tasks t
WHERE t.user_id = auth.uid()
ORDER BY t.created_at DESC
LIMIT 5;
```

**What this shows:**
- Your recent tasks
- How many checklist items each has
- How many labels each has

**Expected Result:**
- If counts are all 0 → Data not migrated or wrong user
- If counts are > 0 → Data exists, issue is in frontend

---

## Step 4: Check Browser Console for Errors

Open your app and check the browser console (F12) for:

### Common Errors:

**1. RLS Policy Error:**
```
Error: new row violates row-level security policy
```
**Fix:** Your user ID doesn't match the data's user ID

**2. Table Not Found:**
```
ERROR: relation "checklist_items" does not exist
```
**Fix:** Run `SAFE_RUN_THIS.sql`

**3. No data returned:**
```
[TaskDetailsDrawer] Loaded 0 checklist items
[getTasks] Fetched 3 tasks with normalized labels
```
**Fix:** Data exists but filtering is wrong (check user ID)

---

## Step 5: Manual Data Insert Test

If nothing else works, manually insert a checklist item for one of YOUR existing tasks:

```sql
-- Get one of your task IDs
SELECT id, title FROM tasks WHERE user_id = auth.uid() LIMIT 1;

-- Copy the task ID, then insert a checklist item
INSERT INTO checklist_items (task_id, text, done, "order")
VALUES (
  'YOUR-TASK-ID-HERE',  -- Replace with actual task ID
  'Test checklist item',
  false,
  0
);

-- Insert a label
INSERT INTO labels (user_id, name, color)
VALUES (
  auth.uid(),
  'test-label',
  '#FF0000'
)
RETURNING id;

-- Link label to task (use the label ID from above)
INSERT INTO task_labels (task_id, label_id)
VALUES (
  'YOUR-TASK-ID-HERE',  -- Replace with actual task ID
  'YOUR-LABEL-ID-HERE'  -- Replace with label ID from previous query
);
```

Then refresh your app and open that task. If it shows → frontend is working, just needs data.

---

## Step 6: Check Network Tab

Open browser DevTools → Network tab → Filter by "Fetch/XHR"

**Look for:**
- Requests to Supabase (should see `task_labels`, `checklist_items`)
- Check the response data (should see your labels/checklist items)
- Check for 401/403 errors (authentication/authorization issues)

---

## Quick Diagnostic Command

Run this ALL-IN-ONE diagnostic query in Supabase SQL Editor:

```sql
-- === DIAGNOSTIC QUERY ===
-- Run this to see everything at once

-- Your user ID
SELECT 'Your User ID:' as info, auth.uid()::text as value
UNION ALL
-- Your task count
SELECT 'Your Tasks:', COUNT(*)::text FROM tasks WHERE user_id = auth.uid()
UNION ALL
-- Total checklist items for your tasks
SELECT 'Your Checklist Items:', COUNT(*)::text 
FROM checklist_items ci
JOIN tasks t ON t.id = ci.task_id
WHERE t.user_id = auth.uid()
UNION ALL
-- Total labels for your tasks
SELECT 'Your Task Labels:', COUNT(*)::text 
FROM task_labels tl
JOIN tasks t ON t.id = tl.task_id
WHERE t.user_id = auth.uid()
UNION ALL
-- Total labels you own
SELECT 'Your Labels:', COUNT(*)::text FROM labels WHERE user_id = auth.uid();
```

**Expected Output:**
```
Your User ID:          dd6fbf1c-94a9-468b-8ea3-a433b811e450
Your Tasks:            3
Your Checklist Items:  12
Your Task Labels:      11
Your Labels:           7
```

If any count is 0, that's where the problem is!

---

## Most Likely Issue

Based on your CSV showing RLS policies exist, I suspect:
1. ✅ Tables are created
2. ❌ Data hasn't been migrated yet
3. ❌ You haven't run `SAFE_RUN_THIS.sql` or `TEST_DATA.sql`

**Action:** Run both SQL files in Supabase SQL Editor, then refresh your app.

---

## Still Not Working?

Share the output of:
1. The diagnostic query above
2. Browser console logs (any errors with `[getTasks]` or `[TaskDetailsDrawer]`)
3. Network tab response for a task_labels request

