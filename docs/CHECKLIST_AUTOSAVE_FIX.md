# Checklist Autosave Fix - Testing Guide

## 🎯 What Was Fixed

### Problem:
Checklist items disappeared after refresh because:
- ❌ Discrete actions (add/toggle/delete) waited for 400ms debounce
- ❌ Users could refresh before debounce completed
- ❌ No immediate flush for checklist actions
- ❌ Insufficient logging made debugging hard

### Solution:
✅ **Immediate flush after checklist actions** - No 400ms wait  
✅ **Already using immutable updates** - Creates new arrays/objects  
✅ **Comprehensive logging** - Track save lifecycle  
✅ **Better error handling** - Surface failures clearly  

---

## 🧪 Manual Testing Steps

### Test 1: Add Checklist Item (Core Fix)

1. **Open task drawer**
2. **Add checklist item:** "Test persistence fix"
3. **Click "Add" button** (or press Enter)
4. **Watch browser console:**
   ```
   [TaskDetailsDrawer] Saving changes: ['checklist']
   [updateTask] Updating task: <id> with fields: ['checklist']
   [updateTask] Successfully updated task: <id>
   [TaskDetailsDrawer] Save successful
   ```
5. **Wait 1 second** (should see "Saved" indicator)
6. **Hard refresh:** `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)
7. **Reopen task**
8. ✅ **Expected:** Item is still there

**If it fails:**
- Check console for errors
- Look for `[updateTask] Supabase error:` messages
- Verify you're authenticated

---

### Test 2: Toggle Checklist Item

1. **Open task with checklist items**
2. **Click checkbox** to toggle an item
3. **Watch console** for save confirmation
4. **Hard refresh immediately** (don't wait)
5. **Reopen task**
6. ✅ **Expected:** Checkbox state persists

---

### Test 3: Delete Checklist Item

1. **Open task with checklist items**
2. **Hover over item** → Click **× button**
3. **Watch console** for save confirmation
4. **Hard refresh immediately**
5. **Reopen task**
6. ✅ **Expected:** Item stays deleted

---

### Test 4: Rapid Changes (Stress Test)

1. **Open task**
2. **Quickly add 3 checklist items:**
   - "Item 1"
   - "Item 2"
   - "Item 3"
3. **Toggle first item's checkbox**
4. **Delete second item**
5. **Close drawer** (triggers flush on unmount)
6. **Hard refresh**
7. **Reopen task**
8. ✅ **Expected:** 
   - 2 items remain (Item 1 and Item 3)
   - Item 1 is checked
   - Item 3 is unchecked

---

### Test 5: Concurrent Edits (Edge Case)

1. **Open task in Tab A**
2. **Add checklist item:** "Tab A item"
3. **Wait for "Saved" indicator**
4. **Open same task in Tab B** (new browser tab)
5. **In Tab B:** Add checklist item "Tab B item"
6. **Refresh both tabs**
7. ✅ **Expected:** Both items appear (last write wins)

---

### Test 6: Network Failure (Error Handling)

1. **Open browser DevTools** → Network tab
2. **Set to "Offline" mode**
3. **Add checklist item**
4. **Watch console:**
   ```
   [TaskDetailsDrawer] Autosave error: Failed to fetch
   ```
5. **Check drawer header** - Should show error indicator
6. **Go back online**
7. **Retry:** Close and reopen drawer (triggers flush)
8. ✅ **Expected:** Item persists after going back online

---

## 🔍 Console Log Patterns

### Successful Save
```
[TaskDetailsDrawer] Saving changes: ['checklist']
[updateTask] Updating task: abc-123 with fields: ['checklist']
[updateTask] Successfully updated task: abc-123
[TaskDetailsDrawer] Save successful
```

### Failed Save (Auth Issue)
```
[updateTask] User not authenticated
[TaskDetailsDrawer] Autosave error: User not authenticated
```

### Failed Save (Network Issue)
```
[TaskDetailsDrawer] Autosave error: Failed to fetch
```

### Failed Save (RLS Policy)
```
[updateTask] Supabase error: {
  error: "new row violates row-level security policy",
  code: "42501"
}
```

---

## 🛠️ Database Verification

### Check Supabase Table Editor

1. Go to Supabase Dashboard → Table Editor → `tasks`
2. Find your test task
3. Click to expand the `checklist` column
4. ✅ **Should see JSONB array:**
   ```json
   [
     {"id": "...", "text": "Test persistence fix", "done": false}
   ]
   ```

### Run SQL Query

```sql
-- In Supabase SQL Editor:
SELECT 
  id,
  title,
  checklist,
  updated_at
FROM tasks
WHERE user_id = auth.uid()
ORDER BY updated_at DESC
LIMIT 5;
```

✅ **Verify:**
- `checklist` column is not NULL
- `updated_at` timestamp changes when you edit checklist
- Array contains your items

---

## 📊 Before & After Comparison

| Aspect | Before Fix | After Fix |
|--------|-----------|-----------|
| **Save timing** | 400ms debounce | Immediate flush |
| **User experience** | Can lose data | Reliable saves |
| **Refresh safety** | ❌ Lost items | ✅ Persists |
| **Debugging** | Silent failures | Console logs |
| **Error feedback** | None | Error indicator |
| **Rapid changes** | Race conditions | All saved |

---

## 🐛 Troubleshooting

### Issue: Item disappears after refresh

**Check 1: Was item actually saved?**
```
Look for: [updateTask] Successfully updated task: <id>
```
- If missing → Save didn't complete
- If present → Fetch/hydration issue

**Check 2: Is checklist in database?**
- Go to Supabase Table Editor
- Check `checklist` column
- If empty → Save failed
- If populated → Client state issue

**Check 3: Is getTasks fetching checklist?**
```
Look for: [getTasks] Fetched X tasks
```
- Then check task object in React DevTools
- Verify `task.checklist` array exists

---

### Issue: Save indicator shows "Error"

**Check console for:**
```
[updateTask] Supabase error: { ... }
```

**Common errors:**

1. **Authentication error**
   ```
   [updateTask] User not authenticated
   ```
   → Solution: Log out and log back in

2. **RLS policy error**
   ```
   error: "new row violates row-level security policy"
   ```
   → Solution: Check RLS policies in Supabase

3. **Network error**
   ```
   Failed to fetch
   ```
   → Solution: Check internet connection

4. **Invalid data**
   ```
   invalid input syntax for type json
   ```
   → Solution: Checklist structure is corrupted

---

### Issue: Console logs not appearing

**Enable verbose logging:**

1. Open browser console
2. Look for `[TaskDetailsDrawer]` and `[updateTask]` prefixes
3. If nothing appears:
   - Clear console and try again
   - Check console filters aren't hiding logs
   - Verify you're in the right tab

---

## ✅ Success Criteria

After all tests pass:

- ✅ Checklist items persist across refreshes
- ✅ No data loss from rapid actions
- ✅ Console shows clear save lifecycle
- ✅ Errors surface with helpful messages
- ✅ Save indicator accurately reflects status
- ✅ Database contains correct JSONB data

---

## 🎯 Next Steps After Verification

If all tests pass:
1. Remove or reduce console.log statements for production
2. Consider adding toast notifications for errors
3. Monitor real-world usage for edge cases
4. Document the immediate flush pattern for other discrete actions

If tests fail:
1. Share console output with exact error messages
2. Check Supabase logs for server-side errors
3. Verify environment variables are set correctly
4. Test in incognito mode (clear cache/state)

---

**Last Updated:** January 3, 2026  
**Status:** Ready for Testing  
**Fix:** Immediate flush + comprehensive logging

