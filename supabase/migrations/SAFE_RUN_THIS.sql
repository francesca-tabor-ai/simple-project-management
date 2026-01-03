-- ============================================================================
-- SAFE MIGRATION: Create Normalized Tables (Idempotent)
-- ============================================================================
-- This version can be run multiple times safely
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Tables (IF NOT EXISTS - safe to rerun)
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

CREATE TABLE IF NOT EXISTS labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS task_labels (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, label_id)
);

-- ============================================================================
-- STEP 2: Create Indexes (IF NOT EXISTS)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_checklist_items_task_id ON checklist_items(task_id, "order");
CREATE INDEX IF NOT EXISTS idx_checklist_items_done ON checklist_items(task_id, done);
CREATE INDEX IF NOT EXISTS idx_labels_user_id ON labels(user_id);
CREATE INDEX IF NOT EXISTS idx_labels_name ON labels(user_id, name);
CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id);

-- ============================================================================
-- STEP 3: Enable RLS
-- ============================================================================

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Drop Existing Policies (if any) - SAFE
-- ============================================================================

-- Drop checklist_items policies
DROP POLICY IF EXISTS "Users can view own checklist items" ON checklist_items;
DROP POLICY IF EXISTS "Users can insert own checklist items" ON checklist_items;
DROP POLICY IF EXISTS "Users can update own checklist items" ON checklist_items;
DROP POLICY IF EXISTS "Users can delete own checklist items" ON checklist_items;

-- Drop labels policies
DROP POLICY IF EXISTS "Users can view own labels" ON labels;
DROP POLICY IF EXISTS "Users can insert own labels" ON labels;
DROP POLICY IF EXISTS "Users can update own labels" ON labels;
DROP POLICY IF EXISTS "Users can delete own labels" ON labels;

-- Drop task_labels policies
DROP POLICY IF EXISTS "Users can view own task labels" ON task_labels;
DROP POLICY IF EXISTS "Users can insert own task labels" ON task_labels;
DROP POLICY IF EXISTS "Users can delete own task labels" ON task_labels;

-- ============================================================================
-- STEP 5: Create RLS Policies (Fresh)
-- ============================================================================

-- Checklist Items Policies
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

-- Labels Policies
CREATE POLICY "Users can view own labels"
  ON labels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own labels"
  ON labels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own labels"
  ON labels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own labels"
  ON labels FOR DELETE
  USING (auth.uid() = user_id);

-- Task Labels Policies
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

-- ============================================================================
-- STEP 6: Migrate Data from JSONB (Only if not already migrated)
-- ============================================================================

-- Migrate checklist items (skip if already exists by ID)
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

-- Migrate labels (skip duplicates)
INSERT INTO labels (name, color, user_id)
SELECT DISTINCT
  item->>'name' as name,
  COALESCE(item->>'color', '#3B82F6') as color,
  tasks.user_id
FROM tasks,
  jsonb_array_elements(COALESCE(tasks.labels, '[]'::jsonb)) AS item
WHERE jsonb_array_length(COALESCE(tasks.labels, '[]'::jsonb)) > 0
ON CONFLICT (user_id, name) DO NOTHING;

-- Create task_labels relationships (skip duplicates)
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

-- ============================================================================
-- STEP 7: Create Helper Views (Replace if exists)
-- ============================================================================

DROP VIEW IF EXISTS tasks_with_checklist;
CREATE VIEW tasks_with_checklist AS
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

DROP VIEW IF EXISTS tasks_with_labels;
CREATE VIEW tasks_with_labels AS
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

DROP VIEW IF EXISTS tasks_complete;
CREATE VIEW tasks_complete AS
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
-- STEP 8: Create Triggers (Drop first if exists)
-- ============================================================================

DROP TRIGGER IF EXISTS update_checklist_items_updated_at ON checklist_items;
DROP TRIGGER IF EXISTS update_labels_updated_at ON labels;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_labels_updated_at
  BEFORE UPDATE ON labels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  '✅ Migration Complete!' as status,
  (SELECT COUNT(*) FROM checklist_items) as checklist_items,
  (SELECT COUNT(*) FROM labels) as labels,
  (SELECT COUNT(*) FROM task_labels) as task_labels,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'checklist_items') as table_exists;

-- ============================================================================
-- END
-- ============================================================================

