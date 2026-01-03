-- ============================================================================
-- CHECKLIST PERSISTENCE TEST (SQL Editor Version)
-- ============================================================================
-- This version works in Supabase SQL Editor without authentication context
-- ============================================================================

-- ============================================================================
-- STEP 1: Find your user_id first
-- ============================================================================
-- Run this query to get your user_id:

SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Copy your user_id from the results above and paste it below
-- Replace 'YOUR_USER_ID_HERE' with your actual UUID

-- ============================================================================
-- STEP 2: View your current tasks (EDIT THIS - add your user_id)
-- ============================================================================
SELECT 
  'Step 2: Your Tasks' as test_step,
  id,
  title,
  status,
  jsonb_array_length(COALESCE(checklist, '[]'::jsonb)) as item_count,
  checklist
FROM tasks
WHERE user_id = 'YOUR_USER_ID_HERE'::uuid  -- ⚠️ REPLACE THIS
ORDER BY updated_at DESC
LIMIT 5;

-- ============================================================================
-- STEP 3: Create test task (EDIT THIS - add your user_id)
-- ============================================================================
INSERT INTO tasks (
  user_id,
  title,
  status,
  description,
  priority,
  labels,
  checklist,
  attachments
)
VALUES (
  'YOUR_USER_ID_HERE'::uuid,  -- ⚠️ REPLACE THIS
  '🧪 Checklist Test ' || to_char(NOW(), 'HH24:MI:SS'),
  'pending',
  'Testing checklist persistence',
  'medium',
  '[]'::jsonb,
  '[
    {"id": "test-1", "text": "First test item", "done": false},
    {"id": "test-2", "text": "Second test item", "done": true},
    {"id": "test-3", "text": "Third test item", "done": false}
  ]'::jsonb,
  '[]'::jsonb
)
RETURNING 
  'Step 3: Task Created' as test_step,
  id as task_id,
  title,
  jsonb_array_length(checklist) as items_created,
  checklist;

-- ============================================================================
-- STEP 4: Verify checklist items (EDIT THIS - add your user_id)
-- ============================================================================
SELECT 
  'Step 4: Verify Items' as test_step,
  t.title,
  item->>'id' as item_id,
  item->>'text' as item_text,
  (item->>'done')::boolean as is_completed
FROM tasks t,
  jsonb_array_elements(t.checklist) as item
WHERE t.user_id = 'YOUR_USER_ID_HERE'::uuid  -- ⚠️ REPLACE THIS
  AND t.title LIKE '🧪 Checklist Test%'
ORDER BY t.created_at DESC, item->>'id';

-- Expected: 3 rows showing your test items

-- ============================================================================
-- STEP 5: Update a checklist item (toggle done) (EDIT THIS - add your user_id)
-- ============================================================================
WITH test_task AS (
  SELECT id, checklist
  FROM tasks
  WHERE user_id = 'YOUR_USER_ID_HERE'::uuid  -- ⚠️ REPLACE THIS
    AND title LIKE '🧪 Checklist Test%'
  ORDER BY created_at DESC
  LIMIT 1
)
UPDATE tasks
SET 
  checklist = (
    SELECT jsonb_agg(
      CASE 
        WHEN elem->>'id' = 'test-1'
        THEN jsonb_set(elem, '{done}', 'true'::jsonb)
        ELSE elem
      END
    )
    FROM jsonb_array_elements((SELECT checklist FROM test_task)) elem
  ),
  updated_at = NOW()
FROM test_task
WHERE tasks.id = test_task.id
RETURNING 
  'Step 5: Updated' as test_step,
  tasks.id,
  tasks.checklist;

-- Expected: First item now has done=true

-- ============================================================================
-- STEP 6: Verify update persisted (EDIT THIS - add your user_id)
-- ============================================================================
SELECT 
  'Step 6: Verify Update' as test_step,
  item->>'text' as item_text,
  (item->>'done')::boolean as is_completed,
  CASE 
    WHEN item->>'id' = 'test-1' AND (item->>'done')::boolean = true
    THEN '✅ PASS'
    WHEN item->>'id' = 'test-1'
    THEN '❌ FAIL'
    ELSE '✓ OK'
  END as test_result
FROM tasks t,
  jsonb_array_elements(t.checklist) as item
WHERE t.user_id = 'YOUR_USER_ID_HERE'::uuid  -- ⚠️ REPLACE THIS
  AND t.title LIKE '🧪 Checklist Test%'
ORDER BY item->>'id';

-- Expected: First item shows ✅ PASS

-- ============================================================================
-- STEP 7: Clean up test task (EDIT THIS - add your user_id)
-- ============================================================================
DELETE FROM tasks
WHERE user_id = 'YOUR_USER_ID_HERE'::uuid  -- ⚠️ REPLACE THIS
  AND title LIKE '🧪 Checklist Test%'
RETURNING 
  'Step 7: Cleanup' as test_step,
  id,
  title;

-- ============================================================================
-- SIMPLIFIED VERSION (No edits needed if you have existing tasks)
-- ============================================================================

-- Just check if checklist column exists and has data:
SELECT 
  'Checklist Column Check' as verification,
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(checklist, '[]'::jsonb)) > 0) as tasks_with_checklists,
  SUM(jsonb_array_length(COALESCE(checklist, '[]'::jsonb))) as total_checklist_items
FROM tasks;

-- Shows aggregate stats across all users (safe, read-only)

-- ============================================================================

