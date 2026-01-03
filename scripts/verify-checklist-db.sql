-- ============================================================================
-- CHECKLIST PERSISTENCE VERIFICATION SCRIPT
-- ============================================================================
-- Run this in Supabase SQL Editor to verify checklist persistence
--
-- Instructions:
-- 1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- 2. Click "New query"
-- 3. Copy and paste this ENTIRE file
-- 4. Click "Run" button
-- ============================================================================

-- Step 1: Check if tasks table has checklist column
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'checklist';

-- Expected: One row showing column_name='checklist', data_type='jsonb'

-- ============================================================================

-- Step 2: Check current user's tasks with checklists
SELECT 
  id,
  title,
  status,
  jsonb_array_length(checklist) as checklist_item_count,
  checklist,
  created_at,
  updated_at
FROM tasks
WHERE user_id = auth.uid()
ORDER BY updated_at DESC
LIMIT 10;

-- Expected: Your tasks with checklist data shown as JSON arrays
-- Example checklist: [{"id": "...", "text": "Item 1", "done": false}]

-- ============================================================================

-- Step 3: Count tasks by checklist item count
SELECT 
  CASE 
    WHEN jsonb_array_length(checklist) = 0 THEN 'No checklist'
    WHEN jsonb_array_length(checklist) BETWEEN 1 AND 3 THEN '1-3 items'
    WHEN jsonb_array_length(checklist) BETWEEN 4 AND 10 THEN '4-10 items'
    ELSE '10+ items'
  END as checklist_size,
  COUNT(*) as task_count
FROM tasks
WHERE user_id = auth.uid()
GROUP BY 1
ORDER BY 1;

-- Expected: Distribution of your tasks by checklist size

-- ============================================================================

-- Step 4: Show most recent checklist items (across all tasks)
SELECT 
  t.title,
  t.status,
  item->>'text' as item_text,
  (item->>'done')::boolean as is_done,
  t.updated_at
FROM tasks t,
  jsonb_array_elements(t.checklist) as item
WHERE t.user_id = auth.uid()
ORDER BY t.updated_at DESC
LIMIT 20;

-- Expected: Recent checklist items from all your tasks

-- ============================================================================

-- Step 5: Verify checklist data structure is valid
SELECT 
  id,
  title,
  checklist,
  CASE 
    WHEN jsonb_typeof(checklist) != 'array' THEN '❌ Not an array'
    WHEN jsonb_array_length(checklist) = 0 THEN '✓ Empty array (valid)'
    ELSE '✓ Valid array with ' || jsonb_array_length(checklist)::text || ' items'
  END as validation_status
FROM tasks
WHERE user_id = auth.uid()
ORDER BY updated_at DESC
LIMIT 10;

-- Expected: All rows show '✓' status

-- ============================================================================

-- Step 6: Test checklist item structure
SELECT 
  t.title,
  item->>'id' as item_id,
  item->>'text' as item_text,
  item->>'done' as item_done,
  CASE 
    WHEN item->>'id' IS NULL THEN '❌ Missing id field'
    WHEN item->>'text' IS NULL THEN '❌ Missing text field'
    WHEN item->>'done' IS NULL THEN '❌ Missing done field'
    ELSE '✓ Valid structure'
  END as item_validation
FROM tasks t,
  jsonb_array_elements(t.checklist) as item
WHERE t.user_id = auth.uid()
  AND jsonb_array_length(t.checklist) > 0
LIMIT 20;

-- Expected: All items show '✓ Valid structure'

-- ============================================================================
-- INTERPRETATION GUIDE
-- ============================================================================

-- ✅ GOOD RESULTS:
-- - checklist column exists with type 'jsonb'
-- - Your tasks show checklist arrays
-- - All validation statuses show '✓'
-- - Item structures are complete (id, text, done)

-- ❌ BAD RESULTS (and how to fix):
-- 
-- 1. "No rows returned for Step 2"
--    → You have no tasks yet. Create some tasks in the app first.
--
-- 2. "checklist is NULL"
--    → Run migration: ALTER TABLE tasks ALTER COLUMN checklist SET DEFAULT '[]'::jsonb;
--
-- 3. "Not an array" validation status
--    → Data corruption. Update task: UPDATE tasks SET checklist = '[]'::jsonb WHERE id = ...;
--
-- 4. "Missing field" in item validation
--    → Checklist items have invalid structure. Re-save task in UI to fix.

-- ============================================================================
-- MANUAL TEST
-- ============================================================================

-- If you want to manually test persistence:

-- 1. Insert a test task with checklist
-- INSERT INTO tasks (title, status, user_id, checklist)
-- VALUES (
--   'Persistence Test Task',
--   'pending',
--   auth.uid(),
--   '[
--     {"id": "test-1", "text": "Test item 1", "done": false},
--     {"id": "test-2", "text": "Test item 2", "done": true}
--   ]'::jsonb
-- );

-- 2. Query it back
-- SELECT id, title, checklist FROM tasks WHERE title = 'Persistence Test Task' AND user_id = auth.uid();

-- 3. Update checklist
-- UPDATE tasks 
-- SET checklist = jsonb_set(
--   checklist,
--   '{0,done}',
--   'true'::jsonb
-- )
-- WHERE title = 'Persistence Test Task' AND user_id = auth.uid();

-- 4. Verify update
-- SELECT checklist FROM tasks WHERE title = 'Persistence Test Task' AND user_id = auth.uid();

-- 5. Clean up
-- DELETE FROM tasks WHERE title = 'Persistence Test Task' AND user_id = auth.uid();

-- ============================================================================
-- END OF VERIFICATION SCRIPT
-- ============================================================================

