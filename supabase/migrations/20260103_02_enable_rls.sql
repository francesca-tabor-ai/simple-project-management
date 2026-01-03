-- ============================================================================
-- PART 2: Run this SECOND - Enable RLS
-- ============================================================================
-- After STEP 1 succeeds, run THIS
-- ============================================================================

-- Enable RLS
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checklist_items
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

-- RLS Policies for labels
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

-- RLS Policies for task_labels
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

-- Verify RLS enabled
SELECT 
  'Step 2 Complete: RLS Enabled' as status,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('checklist_items', 'labels', 'task_labels')
ORDER BY tablename;

-- ============================================================================

