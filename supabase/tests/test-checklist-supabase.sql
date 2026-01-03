-- ============================================================================
-- CHECKLIST PERSISTENCE TEST & VERIFICATION
-- ============================================================================
-- Copy this ENTIRE file and paste into Supabase SQL Editor
-- Then click "Run" or press Cmd/Ctrl + Enter
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify checklist column exists
-- ============================================================================
SELECT 
  'Step 1: Column Check' as test_step,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks' 
  AND column_name = 'checklist';

-- Expected: Shows checklist | jsonb | YES

-- ============================================================================
-- STEP 2: View your current tasks with checklists
-- ============================================================================
SELECT 
  'Step 2: Current Tasks' as test_step,
  id,
  title,
  status,
  jsonb_array_length(checklist) as item_count,
  checklist
FROM tasks
WHERE user_id = auth.uid()
ORDER BY updated_at DESC
LIMIT 5;

-- Expected: Shows your tasks with their checklist arrays

-- ============================================================================
-- STEP 3: Create a test task with checklist items
-- ============================================================================
INSERT INTO tasks (
  title,
  status,
  user_id,
  description,
  priority,
  "dueDate",
  labels,
  assignee,
  checklist,
  attachments
)
VALUES (
  '🧪 Checklist Persistence Test ' || to_char(NOW(), 'HH24:MI:SS'),
  'pending',
  auth.uid(),
  'This is a test task to verify checklist persistence',
  'medium',
  NULL,
  '[]'::jsonb,
  NULL,
  '[
    {"id": "test-item-1", "text": "First test item", "done": false},
    {"id": "test-item-2", "text": "Second test item", "done": true},
    {"id": "test-item-3", "text": "Third test item", "done": false}
  ]'::jsonb,
  '[]'::jsonb
)
RETURNING 
  'Step 3: Task Created' as test_step,
  id,
  title,
  jsonb_array_length(checklist) as items_created;

-- Expected: Shows the new task ID and "items_created: 3"

-- ============================================================================
-- STEP 4: Verify the checklist persisted correctly
-- ============================================================================
SELECT 
  'Step 4: Verify Persistence' as test_step,
  t.id,
  t.title,
  jsonb_array_length(t.checklist) as total_items,
  item->>'text' as item_text,
  (item->>'done')::boolean as is_completed
FROM tasks t,
  jsonb_array_elements(t.checklist) as item
WHERE t.user_id = auth.uid()
  AND t.title LIKE '🧪 Checklist Persistence Test%'
ORDER BY t.created_at DESC
LIMIT 10;

-- Expected: Shows 3 rows with your test items

-- ============================================================================
-- STEP 5: Update a checklist item (toggle done status)
-- ============================================================================
WITH test_task AS (
  SELECT id, checklist
  FROM tasks
  WHERE user_id = auth.uid()
    AND title LIKE '🧪 Checklist Persistence Test%'
  ORDER BY created_at DESC
  LIMIT 1
)
UPDATE tasks
SET 
  checklist = (
    SELECT jsonb_agg(
      CASE 
        WHEN elem->>'id' = 'test-item-1' 
        THEN jsonb_set(elem, '{done}', 'true'::jsonb)
        ELSE elem
      END
    )
    FROM jsonb_array_elements(test_task.checklist) elem
  ),
  updated_at = NOW()
FROM test_task
WHERE tasks.id = test_task.id
RETURNING 
  'Step 5: Updated Checklist' as test_step,
  tasks.id,
  tasks.checklist;

-- Expected: Shows updated checklist with first item marked as done

-- ============================================================================
-- STEP 6: Verify the update persisted
-- ============================================================================
SELECT 
  'Step 6: Verify Update' as test_step,
  item->>'text' as item_text,
  (item->>'done')::boolean as is_completed,
  CASE 
    WHEN item->>'id' = 'test-item-1' AND (item->>'done')::boolean = true 
    THEN '✅ PASS: Item updated correctly'
    WHEN item->>'id' = 'test-item-1' AND (item->>'done')::boolean = false
    THEN '❌ FAIL: Update did not persist'
    ELSE '✓ Other item unchanged'
  END as test_result
FROM tasks t,
  jsonb_array_elements(t.checklist) as item
WHERE t.user_id = auth.uid()
  AND t.title LIKE '🧪 Checklist Persistence Test%'
ORDER BY t.created_at DESC, item->>'id'
LIMIT 10;

-- Expected: First item shows "✅ PASS: Item updated correctly"

-- ============================================================================
-- STEP 7: Add a new item to existing checklist
-- ============================================================================
WITH test_task AS (
  SELECT id, checklist
  FROM tasks
  WHERE user_id = auth.uid()
    AND title LIKE '🧪 Checklist Persistence Test%'
  ORDER BY created_at DESC
  LIMIT 1
)
UPDATE tasks
SET 
  checklist = checklist || '{"id": "test-item-4", "text": "Fourth test item (added)", "done": false}'::jsonb,
  updated_at = NOW()
FROM test_task
WHERE tasks.id = test_task.id
RETURNING 
  'Step 7: Added Item' as test_step,
  tasks.id,
  jsonb_array_length(tasks.checklist) as new_item_count;

-- Expected: Shows "new_item_count: 4"

-- ============================================================================
-- STEP 8: Remove a checklist item
-- ============================================================================
WITH test_task AS (
  SELECT id, checklist
  FROM tasks
  WHERE user_id = auth.uid()
    AND title LIKE '🧪 Checklist Persistence Test%'
  ORDER BY created_at DESC
  LIMIT 1
)
UPDATE tasks
SET 
  checklist = (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(test_task.checklist) elem
    WHERE elem->>'id' != 'test-item-2'  -- Remove second item
  ),
  updated_at = NOW()
FROM test_task
WHERE tasks.id = test_task.id
RETURNING 
  'Step 8: Removed Item' as test_step,
  tasks.id,
  jsonb_array_length(tasks.checklist) as remaining_items;

-- Expected: Shows "remaining_items: 3"

-- ============================================================================
-- STEP 9: Final verification
-- ============================================================================
SELECT 
  'Step 9: Final State' as test_step,
  t.title,
  jsonb_array_length(t.checklist) as total_items,
  (SELECT COUNT(*) FROM jsonb_array_elements(t.checklist) elem WHERE (elem->>'done')::boolean = true) as completed_items,
  (SELECT COUNT(*) FROM jsonb_array_elements(t.checklist) elem WHERE (elem->>'done')::boolean = false) as pending_items,
  t.checklist
FROM tasks t
WHERE t.user_id = auth.uid()
  AND t.title LIKE '🧪 Checklist Persistence Test%'
ORDER BY t.created_at DESC
LIMIT 1;

-- Expected: 
-- total_items: 3
-- completed_items: 1 (test-item-1 was toggled)
-- pending_items: 2

-- ============================================================================
-- STEP 10: Clean up test task (optional - comment out to keep)
-- ============================================================================
DELETE FROM tasks
WHERE user_id = auth.uid()
  AND title LIKE '🧪 Checklist Persistence Test%'
RETURNING 
  'Step 10: Cleanup' as test_step,
  id,
  title,
  'Deleted' as status;

-- Expected: Shows the deleted test task

-- ============================================================================
-- TEST SUMMARY
-- ============================================================================
-- 
-- If all steps completed successfully, then:
-- ✅ Checklist column exists in database
-- ✅ Checklists can be created with tasks
-- ✅ Checklist data persists correctly
-- ✅ Individual items can be updated
-- ✅ Items can be added to existing checklists
-- ✅ Items can be removed from checklists
-- ✅ All operations maintain data integrity
--
-- Conclusion: CHECKLIST PERSISTENCE IS WORKING! 🎉
--
-- ============================================================================
-- QUICK REFERENCE QUERIES
-- ============================================================================

-- View all your tasks with checklist counts:
-- SELECT id, title, jsonb_array_length(checklist) as items
-- FROM tasks WHERE user_id = auth.uid() ORDER BY updated_at DESC;

-- View all checklist items across all tasks:
-- SELECT t.title, item->>'text', (item->>'done')::boolean
-- FROM tasks t, jsonb_array_elements(t.checklist) item
-- WHERE t.user_id = auth.uid();

-- Find tasks with incomplete checklist items:
-- SELECT t.title, COUNT(*) as incomplete_items
-- FROM tasks t, jsonb_array_elements(t.checklist) item
-- WHERE t.user_id = auth.uid() AND (item->>'done')::boolean = false
-- GROUP BY t.title;

-- ============================================================================

