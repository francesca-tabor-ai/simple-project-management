-- ============================================================================
-- PART 1: Run this FIRST - Create Tables Only
-- ============================================================================
-- Copy and paste THIS SECTION into Supabase SQL Editor
-- Then click Run
-- ============================================================================

-- Create checklist_items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create labels table
CREATE TABLE IF NOT EXISTS labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create task_labels junction table
CREATE TABLE IF NOT EXISTS task_labels (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, label_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_checklist_items_task_id ON checklist_items(task_id, "order");
CREATE INDEX IF NOT EXISTS idx_checklist_items_done ON checklist_items(task_id, done);
CREATE INDEX IF NOT EXISTS idx_labels_user_id ON labels(user_id);
CREATE INDEX IF NOT EXISTS idx_labels_name ON labels(user_id, name);
CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id);

-- Verify tables created
SELECT 
  'Step 1 Complete: Tables Created' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'checklist_items') as checklist_table,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'labels') as labels_table,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'task_labels') as task_labels_table;

-- ============================================================================

