-- ============================================================================
-- QUICK CHECKLIST VERIFICATION (No Setup Required)
-- ============================================================================
-- Copy and paste this entire script into Supabase SQL Editor
-- Works immediately without any edits!
-- ============================================================================

-- Step 1: Get your user_id
-- Copy the id from the results and use it in the next queries
SELECT 
  '👤 Step 1: Your User ID' as step,
  id as your_user_id,
  email
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;

-- ⬆️ COPY THE "your_user_id" VALUE FROM ABOVE ⬆️
-- Then replace USER_ID_HERE in the queries below

-- ============================================================================

-- Step 2: View your tasks with checklists
-- (Replace USER_ID_HERE with the ID from Step 1)
SELECT 
  '📋 Step 2: Your Tasks' as step,
  id,
  title,
  status,
  jsonb_array_length(COALESCE(checklist, '[]'::jsonb)) as checklist_items,
  checklist
FROM tasks
WHERE user_id = 'USER_ID_HERE'::uuid
ORDER BY updated_at DESC
LIMIT 10;

-- ============================================================================

-- Step 3: View all checklist items (expanded)
-- (Replace USER_ID_HERE with your ID)
SELECT 
  '✅ Step 3: All Checklist Items' as step,
  t.title as task_title,
  t.status,
  item->>'text' as item_text,
  (item->>'done')::boolean as is_done,
  t.updated_at
FROM tasks t,
  jsonb_array_elements(t.checklist) as item
WHERE t.user_id = 'USER_ID_HERE'::uuid
ORDER BY t.updated_at DESC, item->>'text'
LIMIT 50;

-- ============================================================================
-- ALTERNATIVE: If you don't want to copy user_id manually
-- ============================================================================

-- Read-only check (works without user_id)
SELECT 
  '📊 Database Statistics' as info,
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(checklist, '[]'::jsonb)) > 0) as tasks_with_checklists,
  SUM(jsonb_array_length(COALESCE(checklist, '[]'::jsonb))) as total_checklist_items_all_users
FROM tasks;

-- Check column exists
SELECT 
  '🔍 Column Structure' as info,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'tasks' 
  AND column_name IN ('checklist', 'user_id', 'title');

-- ============================================================================

