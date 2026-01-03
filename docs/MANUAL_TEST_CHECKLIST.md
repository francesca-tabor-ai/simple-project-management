# 🧪 Manual Checklist Persistence Test

## Quick Test (2 minutes)

Follow these steps to verify checklist persistence is working:

---

### ✅ Step 1: Start the App

```bash
npm run dev
```

Open http://localhost:3000 (or whatever port it shows)

---

### ✅ Step 2: Log In

- Click "Sign In"
- Log in with your Google account
- You should see your tasks board

---

### ✅ Step 3: Create or Open a Task

**Option A: Create New Task**
1. Type a task title: "Test Persistence"
2. Click "Add Task"
3. Click on the new task card

**Option B: Open Existing Task**
1. Click any existing task card

---

### ✅ Step 4: Add Checklist Items

In the task drawer (right side):

1. Scroll down to "Checklist" section
2. Type: `Test item 1`
3. Click "Add" (or press Enter)
4. Add another: `Test item 2`
5. Click "Add"

**Expected:** Both items appear in the list immediately

---

### ✅ Step 5: Toggle One Item

1. Check the checkbox next to "Test item 1"
2. **Expected:** Item gets strike-through styling

---

### ✅ Step 6: Wait for Save Indicator

Look at the **top-right of the drawer**:

1. You should briefly see "Unsaved" (gray dot)
2. Then "Saving..." (spinner)
3. Then "Saved" (green checkmark)

**IMPORTANT:** Wait until you see the green "Saved" checkmark!

---

### ✅ Step 7: Hard Refresh the Page

**Mac:** Press `Cmd + Shift + R`  
**Windows/Linux:** Press `Ctrl + Shift + R`

This forces a full page reload, bypassing cache.

---

### ✅ Step 8: Verify Persistence

After the page reloads:

1. Click the same task again
2. Scroll to "Checklist" section

**Expected Results:**
- ✅ "Test item 1" is still there
- ✅ "Test item 2" is still there
- ✅ "Test item 1" checkbox is still checked
- ✅ "Test item 2" checkbox is still unchecked

**If all of these are true → Persistence is working! 🎉**

---

## 🔬 Extended Test (5 minutes)

If you want to be thorough:

### Test 9: Delete an Item

1. Hover over "Test item 2"
2. Click the × button
3. Wait for "Saved" indicator
4. Hard refresh (`Cmd+Shift+R`)
5. **Expected:** Item stays deleted

### Test 10: Add Multiple Items Rapidly

1. Add 5 items quickly:
   - "Rapid 1", "Rapid 2", "Rapid 3", "Rapid 4", "Rapid 5"
2. Don't wait between items
3. Close the drawer (auto-flushes saves)
4. Hard refresh
5. Reopen task
6. **Expected:** All 5 items are there

### Test 11: Test Across Browser Tabs

1. With task drawer open in Tab A, add item: "Cross tab test"
2. Wait for "Saved"
3. Open a new tab (Tab B)
4. Go to http://localhost:3000
5. Log in (if needed)
6. Open the same task
7. **Expected:** Item appears in Tab B

### Test 12: Test Network Failure

1. Open browser DevTools (F12)
2. Go to "Network" tab
3. Enable "Offline" mode
4. Try to add a checklist item
5. **Expected:** 
   - Item appears in UI (optimistic update)
   - Status shows "Error" indicator
   - Click "Retry" button when back online
   - Item persists after retry

---

## 🔍 Database Verification

### Option A: Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" (left sidebar)
4. Run this query:

```sql
SELECT 
  id,
  title,
  checklist
FROM tasks
WHERE user_id = auth.uid()
ORDER BY updated_at DESC
LIMIT 5;
```

5. **Expected:** 
   - You see your tasks
   - `checklist` column shows JSON arrays
   - Arrays contain objects like: `{"id": "...", "text": "...", "done": false}`

### Option B: Via Script

```bash
npx tsx scripts/test-checklist-persistence.ts
```

(This requires an authenticated session to work fully)

---

## ✅ Success Criteria

| Test | Pass? |
|------|-------|
| Items appear immediately after adding | [ ] |
| "Saved" indicator shows after changes | [ ] |
| Items persist after hard refresh | [ ] |
| Checkbox state persists | [ ] |
| Deleted items stay deleted | [ ] |
| Multiple rapid changes all save | [ ] |
| Items appear across browser tabs | [ ] |
| Database shows correct JSON structure | [ ] |

**If all pass → Checklist persistence is working perfectly!**

---

## 🚨 Troubleshooting

### Issue: "Checklist disappears after refresh"

**Possible Causes:**

1. **Refreshed too quickly**
   - Solution: Always wait for green "Saved" checkmark

2. **Browser cached stale data**
   - Solution: Use hard refresh (`Cmd+Shift+R`)
   - Clear browser cache if problem persists

3. **Network error during save**
   - Solution: Check for red "Error" indicator
   - Click "Retry" button
   - Check browser console (F12) for errors

4. **Not logged in / session expired**
   - Solution: Log out and log back in

### Issue: "Saved indicator never appears"

**Debug Steps:**

1. Open browser console (F12)
2. Look for errors in red
3. Check Network tab for failed requests
4. Common issues:
   - Network offline
   - Supabase URL/key misconfigured
   - RLS policy blocking update

### Issue: "Changes revert after refresh"

**Likely Cause:** Race condition if you close drawer/navigate too quickly

**Solution:**
- Wait 500ms after last change before navigating
- The drawer auto-flushes on close, but give it time

---

## 📊 What You're Testing

When you add a checklist item, this happens:

1. **Client (Instant):**
   - UI updates immediately (optimistic)
   - `setLocalTask({ ...task, checklist: [...items, newItem] })`

2. **Auto-save Hook (400ms later):**
   - Detects change via diff
   - Shows "Saving..." status
   - Calls `updateTask(taskId, { checklist: updatedArray })`

3. **Server Action:**
   - Validates user authentication
   - Updates Supabase: `UPDATE tasks SET checklist = $1 WHERE id = $2`

4. **Database:**
   - Stores as JSONB: `[{"id": "...", "text": "...", "done": false}]`

5. **On Refresh:**
   - `getTasks()` runs
   - Supabase returns task with checklist
   - UI renders persisted data

---

## 🎯 Expected Outcome

**After running all tests:**

- ✅ All checklist operations work
- ✅ All changes persist across refreshes
- ✅ Database contains correct JSON data
- ✅ Auto-save provides clear feedback
- ✅ System is production-ready

**Conclusion:** Checklist persistence is fully functional! 🚀

---

## 📝 Next Steps After Testing

### If Tests Pass ✅
- Mark this feature as complete
- Move on to next roadmap item
- Document any edge cases you discovered

### If Tests Fail ❌
- Document the specific failure
- Check browser console for errors
- Run the troubleshooting steps above
- Let me know what you found and I'll help fix it

---

**Created:** January 2026  
**Purpose:** Verify checklist persistence implementation  
**Status:** Ready to run

