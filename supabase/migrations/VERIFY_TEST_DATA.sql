-- ============================================================================
-- VERIFY TEST DATA - Quick Database Check
-- ============================================================================
-- Run this to see if data was actually inserted and if RLS is allowing reads
-- ============================================================================

-- 1. Check Tasks
SELECT 
  id,
  title,
  status,
  user_id,
  created_at
FROM tasks
WHERE user_id = 'dd6fbf1c-94a9-468b-8ea3-a433b811e450'
ORDER BY created_at DESC;

-- 2. Check Checklist Items
SELECT 
  ci.id,
  ci.task_id,
  ci.text,
  ci.done,
  ci."order",
  t.title as task_title
FROM checklist_items ci
LEFT JOIN tasks t ON t.id = ci.task_id
WHERE t.user_id = 'dd6fbf1c-94a9-468b-8ea3-a433b811e450'
ORDER BY t.created_at, ci."order";

-- 3. Check Labels
SELECT 
  id,
  name,
  color,
  user_id,
  created_at
FROM labels
WHERE user_id = 'dd6fbf1c-94a9-468b-8ea3-a433b811e450'
ORDER BY name;

-- 4. Check Task-Label Links
SELECT 
  tl.task_id,
  t.title as task_title,
  l.name as label_name,
  l.color as label_color
FROM task_labels tl
LEFT JOIN tasks t ON t.id = tl.task_id
LEFT JOIN labels l ON l.id = tl.label_id
WHERE t.user_id = 'dd6fbf1c-94a9-468b-8ea3-a433b811e450'
ORDER BY t.title, l.name;

-- 5. Check RLS Policies (should show all policies)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('checklist_items', 'labels', 'task_labels')
ORDER BY tablename, policyname;

