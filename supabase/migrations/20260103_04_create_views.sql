-- ============================================================================
-- PART 4: Run this LAST - Create Helper Views (OPTIONAL but recommended)
-- ============================================================================
-- After STEP 3 succeeds, run THIS
-- Creates views for easy querying
-- ============================================================================

-- View: Tasks with checklist items as JSON array
CREATE OR REPLACE VIEW tasks_with_checklist AS
SELECT 
  t.*,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ci.id,
        'text', ci.text,
        'done', ci.done,
        'order', ci."order"
      ) ORDER BY ci."order"
    ) FILTER (WHERE ci.id IS NOT NULL),
    '[]'::jsonb
  ) as checklist_items
FROM tasks t
LEFT JOIN checklist_items ci ON ci.task_id = t.id
GROUP BY t.id;

-- View: Tasks with labels as JSON array
CREATE OR REPLACE VIEW tasks_with_labels AS
SELECT 
  t.*,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', l.id,
        'name', l.name,
        'color', l.color
      ) ORDER BY l.name
    ) FILTER (WHERE l.id IS NOT NULL),
    '[]'::jsonb
  ) as label_list
FROM tasks t
LEFT JOIN task_labels tl ON tl.task_id = t.id
LEFT JOIN labels l ON l.id = tl.label_id
GROUP BY t.id;

-- View: Complete task data (everything)
CREATE OR REPLACE VIEW tasks_complete AS
SELECT 
  t.id,
  t.user_id,
  t.title,
  t.status,
  t.description,
  t.priority,
  t."dueDate",
  t.assignee,
  t.attachments,
  t."googleCalendar",
  t.source,
  t.created_at,
  t.updated_at,
  -- Checklist items
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ci.id,
          'text', ci.text,
          'done', ci.done,
          'order', ci."order"
        ) ORDER BY ci."order"
      )
      FROM checklist_items ci
      WHERE ci.task_id = t.id
    ),
    '[]'::jsonb
  ) as checklist_items,
  -- Labels
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'name', l.name,
          'color', l.color
        ) ORDER BY l.name
      )
      FROM task_labels tl
      JOIN labels l ON l.id = tl.label_id
      WHERE tl.task_id = t.id
    ),
    '[]'::jsonb
  ) as label_list
FROM tasks t;

-- Verify views created
SELECT 
  'Step 4 Complete: Views Created' as status,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name IN ('tasks_with_checklist', 'tasks_with_labels', 'tasks_complete')
ORDER BY table_name;

-- Test the view
SELECT 
  'Test Query' as info,
  id,
  title,
  checklist_items,
  label_list
FROM tasks_complete
LIMIT 1;

-- ============================================================================
-- MIGRATION COMPLETE! ✅
-- ============================================================================
-- 
-- Now you can query:
-- - SELECT * FROM tasks_with_checklist WHERE user_id = auth.uid();
-- - SELECT * FROM tasks_with_labels WHERE user_id = auth.uid();
-- - SELECT * FROM tasks_complete WHERE user_id = auth.uid();
--
-- ============================================================================

