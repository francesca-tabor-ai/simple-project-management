-- ============================================================================
-- MIGRATION: Normalize Checklist Items & Labels to Separate Tables
-- ============================================================================
-- This migration creates separate tables for checklist_items and task_labels
-- and migrates existing JSONB data to the new structure
-- ============================================================================

-- ============================================================================
-- PART 1: Create checklist_items table
-- ============================================================================

CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_checklist_items_task_id ON checklist_items(task_id, "order");
CREATE INDEX IF NOT EXISTS idx_checklist_items_done ON checklist_items(task_id, done);

-- Enable RLS
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access checklist items for their own tasks
CREATE POLICY "Users can view own checklist items"
  ON checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = checklist_items.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own checklist items"
  ON checklist_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = checklist_items.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own checklist items"
  ON checklist_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = checklist_items.task_id 
      AND tasks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = checklist_items.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own checklist items"
  ON checklist_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = checklist_items.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- Add helpful comments
COMMENT ON TABLE checklist_items IS 'Normalized checklist items for tasks';
COMMENT ON COLUMN checklist_items.task_id IS 'Foreign key to tasks table';
COMMENT ON COLUMN checklist_items."order" IS 'Display order for checklist items (0-based)';
COMMENT ON COLUMN checklist_items.done IS 'Whether the checklist item is completed';

-- ============================================================================
-- PART 2: Create labels table (master list)
-- ============================================================================

CREATE TABLE IF NOT EXISTS labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6', -- Default blue
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name) -- Each user can only have one label with a given name
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_labels_user_id ON labels(user_id);
CREATE INDEX IF NOT EXISTS idx_labels_name ON labels(user_id, name);

-- Enable RLS
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own labels
CREATE POLICY "Users can view own labels"
  ON labels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own labels"
  ON labels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own labels"
  ON labels FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own labels"
  ON labels FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE labels IS 'Master list of labels/tags per user';

-- ============================================================================
-- PART 3: Create task_labels junction table (many-to-many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_labels (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, label_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id);

-- Enable RLS
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only link labels to their own tasks
CREATE POLICY "Users can view own task labels"
  ON task_labels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_labels.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own task labels"
  ON task_labels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_labels.task_id 
      AND tasks.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM labels 
      WHERE labels.id = task_labels.label_id 
      AND labels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own task labels"
  ON task_labels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_labels.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

COMMENT ON TABLE task_labels IS 'Junction table linking tasks to labels (many-to-many)';

-- ============================================================================
-- PART 4: Migrate existing JSONB checklist data to checklist_items table
-- ============================================================================

-- Migrate checklist items from tasks.checklist (JSONB) to checklist_items table
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
ON CONFLICT (id) DO NOTHING; -- Skip if already migrated

-- ============================================================================
-- PART 5: Migrate existing JSONB labels data to labels and task_labels tables
-- ============================================================================

-- First, create labels from all unique label names across all tasks
INSERT INTO labels (name, color, user_id)
SELECT DISTINCT
  item->>'name' as name,
  COALESCE(item->>'color', '#3B82F6') as color,
  tasks.user_id
FROM tasks,
  jsonb_array_elements(COALESCE(tasks.labels, '[]'::jsonb)) AS item
WHERE jsonb_array_length(COALESCE(tasks.labels, '[]'::jsonb)) > 0
ON CONFLICT (user_id, name) DO NOTHING; -- Skip duplicates

-- Then, create task_labels relationships
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
ON CONFLICT (task_id, label_id) DO NOTHING; -- Skip duplicates

-- ============================================================================
-- PART 6: Add helper columns to tasks table (optional - for backward compatibility)
-- ============================================================================

-- Add columns to track if using new tables (optional)
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS use_normalized_checklist BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS use_normalized_labels BOOLEAN DEFAULT false;

-- Mark all tasks as using normalized structure
UPDATE tasks SET 
  use_normalized_checklist = true,
  use_normalized_labels = true;

-- ============================================================================
-- PART 7: Create helpful views for querying
-- ============================================================================

-- View: Tasks with their checklist items
CREATE OR REPLACE VIEW tasks_with_checklist AS
SELECT 
  t.*,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ci.id,
        'text', ci.text,
        'done', ci.done,
        'order', ci."order",
        'created_at', ci.created_at,
        'updated_at', ci.updated_at
      ) ORDER BY ci."order"
    ) FILTER (WHERE ci.id IS NOT NULL),
    '[]'::jsonb
  ) as checklist_items
FROM tasks t
LEFT JOIN checklist_items ci ON ci.task_id = t.id
GROUP BY t.id;

-- View: Tasks with their labels
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

-- View: Complete task data (tasks + checklist + labels)
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
  -- Checklist items as array
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
  -- Labels as array
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

-- ============================================================================
-- PART 8: Create trigger to update updated_at timestamp
-- ============================================================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for checklist_items
DROP TRIGGER IF EXISTS update_checklist_items_updated_at ON checklist_items;
CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for labels
DROP TRIGGER IF EXISTS update_labels_updated_at ON labels;
CREATE TRIGGER update_labels_updated_at
  BEFORE UPDATE ON labels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 9: Verification queries
-- ============================================================================

-- Check migration results
SELECT 
  'Migration Summary' as report,
  (SELECT COUNT(*) FROM checklist_items) as total_checklist_items,
  (SELECT COUNT(*) FROM labels) as total_labels,
  (SELECT COUNT(*) FROM task_labels) as total_task_label_links,
  (SELECT COUNT(*) FROM tasks WHERE jsonb_array_length(COALESCE(checklist, '[]'::jsonb)) > 0) as tasks_with_jsonb_checklist,
  (SELECT COUNT(DISTINCT task_id) FROM checklist_items) as tasks_with_normalized_checklist;

-- Show sample data
SELECT 
  'Sample Checklist Items' as data_type,
  ci.id,
  t.title as task_title,
  ci.text as item_text,
  ci.done,
  ci."order"
FROM checklist_items ci
JOIN tasks t ON t.id = ci.task_id
ORDER BY t.created_at DESC, ci."order"
LIMIT 10;

SELECT 
  'Sample Labels' as data_type,
  l.id,
  l.name,
  l.color,
  COUNT(tl.task_id) as task_count
FROM labels l
LEFT JOIN task_labels tl ON tl.label_id = l.id
GROUP BY l.id, l.name, l.color
ORDER BY task_count DESC, l.name
LIMIT 10;

-- ============================================================================
-- PART 10: (Optional) Drop old JSONB columns after verification
-- ============================================================================

-- ⚠️ ONLY RUN THIS AFTER VERIFYING THE MIGRATION WORKED! ⚠️
-- Uncomment these lines when you're ready to drop old columns:

-- ALTER TABLE tasks DROP COLUMN IF EXISTS checklist;
-- ALTER TABLE tasks DROP COLUMN IF EXISTS labels;

-- For now, keep them for backward compatibility

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================

SELECT '✅ Migration completed successfully!' as status,
       'Tables created: checklist_items, labels, task_labels' as tables,
       'Data migrated from JSONB to normalized tables' as migration,
       'RLS policies enabled for all tables' as security,
       'Helper views created: tasks_with_checklist, tasks_with_labels, tasks_complete' as views;

-- ============================================================================

