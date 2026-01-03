-- ============================================================================
-- QUICKSTART: Normalized Tables Setup
-- ============================================================================
-- Copy your user ID from the query below, then run the entire script
-- ============================================================================

-- STEP 1: Get your user ID (run this first, copy the result)
SELECT 'Your User ID:' as step, auth.uid()::text as user_id;

-- STEP 2: Update this line with YOUR user ID ↓
-- Then highlight everything from line 5 to the end and click RUN

DO $$
DECLARE
  -- ⚠️ CHANGE THIS TO YOUR USER ID ↓↓↓
  _my_user_id UUID := 'dd6fbf1c-94a9-468b-8ea3-a433b811e450';
  
  _task1 UUID;
  _task2 UUID;
  _task3 UUID;
  _label_urgent UUID;
  _label_feature UUID;
  _label_bug UUID;
  _label_docs UUID;
  _label_backend UUID;
  _label_frontend UUID;
  _label_testing UUID;
BEGIN

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Setting up normalized tables for user: %', _my_user_id;
  RAISE NOTICE '==============================================';

  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _my_user_id) THEN
    RAISE EXCEPTION 'User % not found! Update _my_user_id at top of script.', _my_user_id;
  END IF;

  -- ============================================================================
  -- Create normalized tables
  -- ============================================================================

  CREATE TABLE IF NOT EXISTS checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
  );

  CREATE TABLE IF NOT EXISTS task_labels (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (task_id, label_id)
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_checklist_items_task_id ON checklist_items(task_id);
  CREATE INDEX IF NOT EXISTS idx_checklist_items_order ON checklist_items(task_id, "order");
  CREATE INDEX IF NOT EXISTS idx_labels_user_id ON labels(user_id);
  CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id);
  CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id);

  -- Enable RLS
  ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
  ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

  -- RLS Policies for checklist_items
  DROP POLICY IF EXISTS "Users can view own checklist items" ON checklist_items;
  CREATE POLICY "Users can view own checklist items" ON checklist_items
    FOR SELECT USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = checklist_items.task_id AND tasks.user_id = auth.uid()));

  DROP POLICY IF EXISTS "Users can insert own checklist items" ON checklist_items;
  CREATE POLICY "Users can insert own checklist items" ON checklist_items FOR INSERT WITH CHECK (true);

  DROP POLICY IF EXISTS "Users can update own checklist items" ON checklist_items;
  CREATE POLICY "Users can update own checklist items" ON checklist_items
    FOR UPDATE USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = checklist_items.task_id AND tasks.user_id = auth.uid()));

  DROP POLICY IF EXISTS "Users can delete own checklist items" ON checklist_items;
  CREATE POLICY "Users can delete own checklist items" ON checklist_items
    FOR DELETE USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = checklist_items.task_id AND tasks.user_id = auth.uid()));

  -- RLS Policies for labels
  DROP POLICY IF EXISTS "Users can view own labels" ON labels;
  CREATE POLICY "Users can view own labels" ON labels FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert own labels" ON labels;
  CREATE POLICY "Users can insert own labels" ON labels FOR INSERT WITH CHECK (true);

  DROP POLICY IF EXISTS "Users can update own labels" ON labels;
  CREATE POLICY "Users can update own labels" ON labels FOR UPDATE USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can delete own labels" ON labels;
  CREATE POLICY "Users can delete own labels" ON labels FOR DELETE USING (auth.uid() = user_id);

  -- RLS Policies for task_labels
  DROP POLICY IF EXISTS "Users can view own task labels" ON task_labels;
  CREATE POLICY "Users can view own task labels" ON task_labels
    FOR SELECT USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_labels.task_id AND tasks.user_id = auth.uid()));

  DROP POLICY IF EXISTS "Users can insert own task labels" ON task_labels;
  CREATE POLICY "Users can insert own task labels" ON task_labels FOR INSERT WITH CHECK (true);

  DROP POLICY IF EXISTS "Users can delete own task labels" ON task_labels;
  CREATE POLICY "Users can delete own task labels" ON task_labels
    FOR DELETE USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_labels.task_id AND tasks.user_id = auth.uid()));

  RAISE NOTICE '✅ Created normalized tables with RLS';

  -- ============================================================================
  -- Migrate existing JSONB data
  -- ============================================================================

  INSERT INTO checklist_items (task_id, text, done, "order")
  SELECT 
    t.id,
    (item->>'text')::text,
    COALESCE((item->>'done')::boolean, false),
    ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY ordinality) - 1
  FROM tasks t
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(t.checklist, '[]'::jsonb)) WITH ORDINALITY AS item
  WHERE jsonb_array_length(COALESCE(t.checklist, '[]'::jsonb)) > 0
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO labels (id, user_id, name, color)
  SELECT DISTINCT
    (label->>'id')::uuid,
    t.user_id,
    (label->>'name')::text,
    COALESCE((label->>'color')::text, '#3B82F6')
  FROM tasks t
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(t.labels, '[]'::jsonb)) AS label
  WHERE jsonb_array_length(COALESCE(t.labels, '[]'::jsonb)) > 0
  ON CONFLICT (user_id, name) DO UPDATE SET color = EXCLUDED.color;

  INSERT INTO task_labels (task_id, label_id)
  SELECT DISTINCT
    t.id,
    (label->>'id')::uuid
  FROM tasks t
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(t.labels, '[]'::jsonb)) AS label
  WHERE jsonb_array_length(COALESCE(t.labels, '[]'::jsonb)) > 0
    AND EXISTS (SELECT 1 FROM labels WHERE id = (label->>'id')::uuid)
  ON CONFLICT (task_id, label_id) DO NOTHING;

  RAISE NOTICE '✅ Migrated existing JSONB data';

  -- ============================================================================
  -- Insert test data
  -- ============================================================================

  -- Clean up old test data
  DELETE FROM task_labels WHERE task_id IN (
    SELECT id FROM tasks WHERE user_id = _my_user_id AND (title LIKE '🚀%' OR title LIKE '📝%' OR title LIKE '🐛%')
  );
  DELETE FROM checklist_items WHERE task_id IN (
    SELECT id FROM tasks WHERE user_id = _my_user_id AND (title LIKE '🚀%' OR title LIKE '📝%' OR title LIKE '🐛%')
  );
  DELETE FROM tasks WHERE user_id = _my_user_id AND (title LIKE '🚀%' OR title LIKE '📝%' OR title LIKE '🐛%');

  -- Insert 3 test tasks
  INSERT INTO tasks (id, user_id, title, status, description, priority, "dueDate")
  VALUES (gen_random_uuid(), _my_user_id, '🚀 Launch New Feature', 'in_progress', 'Deploy new task management features', 'high', (CURRENT_DATE + 7)::text)
  RETURNING id INTO _task1;

  INSERT INTO tasks (id, user_id, title, status, description, priority, "dueDate")
  VALUES (gen_random_uuid(), _my_user_id, '📝 Write Documentation', 'pending', 'Create comprehensive API docs', 'medium', (CURRENT_DATE + 14)::text)
  RETURNING id INTO _task2;

  INSERT INTO tasks (id, user_id, title, status, description, priority, "dueDate")
  VALUES (gen_random_uuid(), _my_user_id, '🐛 Fix Critical Bug', 'done', 'Resolved authentication issue', 'urgent', (CURRENT_DATE - 1)::text)
  RETURNING id INTO _task3;

  RAISE NOTICE '✅ Created 3 test tasks';

  -- Insert labels
  INSERT INTO labels (user_id, name, color) VALUES
    (_my_user_id, 'urgent', '#EF4444'),
    (_my_user_id, 'feature', '#3B82F6'),
    (_my_user_id, 'bug', '#F59E0B'),
    (_my_user_id, 'documentation', '#8B5CF6'),
    (_my_user_id, 'backend', '#10B981'),
    (_my_user_id, 'frontend', '#F472B6'),
    (_my_user_id, 'testing', '#6366F1')
  ON CONFLICT (user_id, name) DO UPDATE SET color = EXCLUDED.color;

  SELECT id INTO _label_urgent FROM labels WHERE user_id = _my_user_id AND name = 'urgent';
  SELECT id INTO _label_feature FROM labels WHERE user_id = _my_user_id AND name = 'feature';
  SELECT id INTO _label_bug FROM labels WHERE user_id = _my_user_id AND name = 'bug';
  SELECT id INTO _label_docs FROM labels WHERE user_id = _my_user_id AND name = 'documentation';
  SELECT id INTO _label_backend FROM labels WHERE user_id = _my_user_id AND name = 'backend';
  SELECT id INTO _label_frontend FROM labels WHERE user_id = _my_user_id AND name = 'frontend';
  SELECT id INTO _label_testing FROM labels WHERE user_id = _my_user_id AND name = 'testing';

  RAISE NOTICE '✅ Created 7 labels';

  -- Link labels to tasks
  INSERT INTO task_labels (task_id, label_id) VALUES
    (_task1, _label_urgent), (_task1, _label_feature), (_task1, _label_backend), (_task1, _label_frontend), (_task1, _label_testing),
    (_task2, _label_docs), (_task2, _label_backend),
    (_task3, _label_urgent), (_task3, _label_bug), (_task3, _label_backend), (_task3, _label_testing)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Linked labels to tasks';

  -- Insert checklist items
  INSERT INTO checklist_items (task_id, text, done, "order") VALUES
    (_task1, 'Review code changes', true, 0),
    (_task1, 'Run integration tests', true, 1),
    (_task1, 'Update deployment docs', true, 2),
    (_task1, 'Deploy to staging', false, 3),
    (_task1, 'Get stakeholder approval', false, 4),
    (_task2, 'Outline API endpoints', false, 0),
    (_task2, 'Write usage examples', false, 1),
    (_task2, 'Add authentication guide', false, 2),
    (_task3, 'Reproduce bug locally', true, 0),
    (_task3, 'Identify root cause', true, 1),
    (_task3, 'Implement fix', true, 2),
    (_task3, 'Deploy to production', true, 3);

  RAISE NOTICE '✅ Created 12 checklist items';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '🎉 Setup complete! Check the results below.';
  RAISE NOTICE '==============================================';

END $$;

-- ============================================================================
-- Verification (shows what was created)
-- ============================================================================

SELECT '🎉 Setup Complete!' as status, '' as details
UNION ALL
SELECT '─────────────────────', '────────────────────────────';

SELECT 'Your User ID' as metric, auth.uid()::text as value
UNION ALL
SELECT 'Total Tasks', COUNT(*)::text FROM tasks WHERE user_id = auth.uid()
UNION ALL
SELECT 'Total Checklist Items', COUNT(*)::text FROM checklist_items ci JOIN tasks t ON t.id = ci.task_id WHERE t.user_id = auth.uid()
UNION ALL
SELECT 'Total Labels', COUNT(*)::text FROM labels WHERE user_id = auth.uid()
UNION ALL
SELECT 'Total Task-Label Links', COUNT(*)::text FROM task_labels tl JOIN tasks t ON t.id = tl.task_id WHERE t.user_id = auth.uid();

SELECT '' as separator, '' as empty_line;

SELECT 
  '📋 Your Tasks' as section,
  t.title,
  t.status,
  (SELECT COUNT(*) FROM checklist_items WHERE task_id = t.id) || ' checklist items' as checklist,
  (SELECT COUNT(*) FROM task_labels WHERE task_id = t.id) || ' labels' as labels
FROM tasks t
WHERE t.user_id = auth.uid()
ORDER BY t.created_at DESC
LIMIT 10;

