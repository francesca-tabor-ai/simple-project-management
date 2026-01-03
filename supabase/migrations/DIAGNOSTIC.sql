-- ============================================================================
-- DIAGNOSTIC: Check What's in Your Database
-- ============================================================================
-- Run this to see if data exists and if there are any issues
-- ============================================================================

-- 1. Check your user ID
SELECT '=== YOUR USER ID ===' as section, auth.uid()::text as value;

-- 2. Check if normalized tables exist
SELECT 
  '=== TABLES EXIST? ===' as section,
  tablename,
  'EXISTS' as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('checklist_items', 'labels', 'task_labels')
ORDER BY tablename;

-- 3. Count rows in each table
SELECT '=== ROW COUNTS ===' as section, '' as detail
UNION ALL
SELECT 'tasks (all users)', COUNT(*)::text FROM tasks
UNION ALL
SELECT 'tasks (your user)', COUNT(*)::text FROM tasks WHERE user_id = auth.uid()
UNION ALL
SELECT 'checklist_items (all)', COUNT(*)::text FROM checklist_items
UNION ALL
SELECT 'checklist_items (yours)', COUNT(*)::text 
  FROM checklist_items ci 
  JOIN tasks t ON t.id = ci.task_id 
  WHERE t.user_id = auth.uid()
UNION ALL
SELECT 'labels (all)', COUNT(*)::text FROM labels
UNION ALL
SELECT 'labels (yours)', COUNT(*)::text FROM labels WHERE user_id = auth.uid()
UNION ALL
SELECT 'task_labels (all)', COUNT(*)::text FROM task_labels
UNION ALL
SELECT 'task_labels (yours)', COUNT(*)::text 
  FROM task_labels tl 
  JOIN tasks t ON t.id = tl.task_id 
  WHERE t.user_id = auth.uid();

-- 4. Show your recent tasks
SELECT 
  '=== YOUR TASKS ===' as section,
  t.id::text as task_id,
  t.title,
  t.status,
  t.created_at::text
FROM tasks t
WHERE t.user_id = auth.uid()
ORDER BY t.created_at DESC
LIMIT 5;

-- 5. Show checklist items for your tasks
SELECT 
  '=== YOUR CHECKLIST ITEMS ===' as section,
  ci.id::text as item_id,
  ci.task_id::text,
  ci.text,
  ci.done::text,
  ci."order"::text
FROM checklist_items ci
JOIN tasks t ON t.id = ci.task_id
WHERE t.user_id = auth.uid()
ORDER BY ci.task_id, ci."order"
LIMIT 10;

-- 6. Show your labels
SELECT 
  '=== YOUR LABELS ===' as section,
  l.id::text as label_id,
  l.name,
  l.color
FROM labels l
WHERE l.user_id = auth.uid()
ORDER BY l.name;

-- 7. Show task-label links
SELECT 
  '=== YOUR TASK-LABEL LINKS ===' as section,
  t.title as task,
  l.name as label,
  l.color
FROM task_labels tl
JOIN tasks t ON t.id = tl.task_id
JOIN labels l ON l.id = tl.label_id
WHERE t.user_id = auth.uid()
ORDER BY t.title, l.name;

-- 8. Check if tasks have JSONB data (old format)
SELECT 
  '=== JSONB DATA (OLD FORMAT) ===' as section,
  t.title,
  jsonb_array_length(COALESCE(t.checklist, '[]'::jsonb))::text as checklist_count,
  jsonb_array_length(COALESCE(t.labels, '[]'::jsonb))::text as labels_count
FROM tasks t
WHERE t.user_id = auth.uid()
ORDER BY t.created_at DESC
LIMIT 5;

-- 9. Check RLS policies
SELECT 
  '=== RLS POLICIES ===' as section,
  tablename,
  policyname,
  cmd::text as command
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('checklist_items', 'labels', 'task_labels')
ORDER BY tablename, policyname;

-- 10. Test if you can insert data (will rollback, just testing permissions)
DO $$
DECLARE
  _test_task_id UUID;
BEGIN
  -- Find one of your tasks
  SELECT id INTO _test_task_id 
  FROM tasks 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  IF _test_task_id IS NULL THEN
    RAISE NOTICE 'No tasks found for your user. Create a task first!';
  ELSE
    RAISE NOTICE 'Test task found: %', _test_task_id;
    
    -- Test inserting a checklist item (will rollback)
    BEGIN
      INSERT INTO checklist_items (task_id, text, done, "order")
      VALUES (_test_task_id, 'TEST ITEM - will be rolled back', false, 999);
      RAISE NOTICE '✓ Can insert checklist items';
      RAISE EXCEPTION 'ROLLBACK TEST'; -- Force rollback
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLERRM = 'ROLLBACK TEST' THEN
          RAISE NOTICE '✓ Checklist insert test passed (rolled back)';
        ELSE
          RAISE NOTICE '✗ Checklist insert failed: %', SQLERRM;
        END IF;
    END;
  END IF;
END $$;

