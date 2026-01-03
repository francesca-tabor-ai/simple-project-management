-- ============================================================================
-- PART 3: Run this THIRD - Migrate Existing Data
-- ============================================================================
-- After STEP 2 succeeds, run THIS
-- This migrates your existing JSONB data to the new tables
-- ============================================================================

-- Migrate checklist items from JSONB to checklist_items table
INSERT INTO checklist_items (id, task_id, text, done, "order")
SELECT 
  (item->>'id')::uuid as id,
  tasks.id as task_id,
  item->>'text' as text,
  COALESCE((item->>'done')::boolean, false) as done,
  (row_number - 1) as "order"
FROM tasks,
  jsonb_array_elements(COALESCE(tasks.checklist, '[]'::jsonb)) WITH ORDINALITY AS arr(item, row_number)
WHERE jsonb_array_length(COALESCE(tasks.checklist, '[]'::jsonb)) > 0
ON CONFLICT (id) DO NOTHING;

-- Migrate labels from JSONB to labels table
INSERT INTO labels (name, color, user_id)
SELECT DISTINCT
  item->>'name' as name,
  COALESCE(item->>'color', '#3B82F6') as color,
  tasks.user_id
FROM tasks,
  jsonb_array_elements(COALESCE(tasks.labels, '[]'::jsonb)) AS item
WHERE jsonb_array_length(COALESCE(tasks.labels, '[]'::jsonb)) > 0
ON CONFLICT (user_id, name) DO NOTHING;

-- Create task_labels relationships
INSERT INTO task_labels (task_id, label_id)
SELECT DISTINCT
  tasks.id as task_id,
  labels.id as label_id
FROM tasks,
  jsonb_array_elements(COALESCE(tasks.labels, '[]'::jsonb)) AS item
  INNER JOIN labels ON 
    labels.name = item->>'name' 
    AND labels.user_id = tasks.user_id
WHERE jsonb_array_length(COALESCE(tasks.labels, '[]'::jsonb)) > 0
ON CONFLICT (task_id, label_id) DO NOTHING;

-- Verify migration
SELECT 
  'Step 3 Complete: Data Migrated' as status,
  (SELECT COUNT(*) FROM checklist_items) as checklist_items_migrated,
  (SELECT COUNT(*) FROM labels) as labels_created,
  (SELECT COUNT(*) FROM task_labels) as task_label_links_created,
  (SELECT COUNT(*) FROM tasks WHERE jsonb_array_length(COALESCE(checklist, '[]'::jsonb)) > 0) as tasks_with_old_checklist,
  (SELECT COUNT(DISTINCT task_id) FROM checklist_items) as tasks_with_new_checklist;

-- ============================================================================

