-- Create tasks table with extended fields for task details
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'done')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Extended fields
  description TEXT DEFAULT '',
  "dueDate" TEXT DEFAULT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  labels JSONB DEFAULT '[]'::jsonb,
  assignee JSONB DEFAULT NULL,
  checklist JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  -- Integration fields
  "googleCalendar" JSONB DEFAULT NULL,
  source JSONB DEFAULT NULL
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- Create policies
-- Users can only see their own tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own tasks
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own tasks
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks("dueDate");
-- GIN indexes for JSONB columns (for containment/existence queries)
CREATE INDEX IF NOT EXISTS idx_tasks_google_calendar ON tasks USING gin ("googleCalendar");
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks USING gin (source);

-- Insert sample tasks with rich data to demonstrate features
-- Note: Replace 'YOUR_USER_ID' with an actual user ID from auth.users after you create an account
-- You can find your user_id by running: SELECT id FROM auth.users LIMIT 1;

-- Sample Task 1: High priority with checklist and due date
INSERT INTO tasks (
  user_id, title, status, description, "dueDate", priority, 
  labels, assignee, checklist, attachments
) 
SELECT 
  id,
  'Design new landing page',
  'in_progress',
  'Create a modern, responsive landing page with hero section, features, and CTA. Should match brand guidelines.',
  '2026-01-15',
  'high',
  '[
    {"id": "label-1", "name": "design", "color": "#EC4899"},
    {"id": "label-2", "name": "frontend", "color": "#3B82F6"},
    {"id": "label-3", "name": "urgent", "color": "#EF4444"}
  ]'::jsonb,
  '{"id": "1", "name": "Francesca"}'::jsonb,
  '[
    {"id": "c1", "text": "Wireframe layout", "done": true},
    {"id": "c2", "text": "Design hero section", "done": true},
    {"id": "c3", "text": "Create component library", "done": false},
    {"id": "c4", "text": "Build responsive grid", "done": false}
  ]'::jsonb,
  '[
    {"id": "a1", "title": "Design mockups", "url": "https://figma.com/example"},
    {"id": "a2", "title": "Brand guidelines", "url": "https://notion.so/brand-guide"}
  ]'::jsonb
FROM auth.users LIMIT 1;

-- Sample Task 2: Medium priority with labels and assignee
INSERT INTO tasks (
  user_id, title, status, description, "dueDate", priority, 
  labels, assignee, checklist, attachments
)
SELECT 
  id,
  'Implement user authentication',
  'pending',
  'Set up Supabase auth with email/password and social providers. Include forgot password flow.',
  '2026-01-20',
  'medium',
  '[
    {"id": "label-4", "name": "backend", "color": "#8B5CF6"},
    {"id": "label-5", "name": "security", "color": "#F59E0B"}
  ]'::jsonb,
  '{"id": "2", "name": "Alex"}'::jsonb,
  '[
    {"id": "c5", "text": "Set up Supabase project", "done": false},
    {"id": "c6", "text": "Configure email provider", "done": false},
    {"id": "c7", "text": "Add social login buttons", "done": false}
  ]'::jsonb,
  '[]'::jsonb
FROM auth.users LIMIT 1;

-- Sample Task 3: Urgent overdue task
INSERT INTO tasks (
  user_id, title, status, description, "dueDate", priority, 
  labels, assignee, checklist, attachments
)
SELECT 
  id,
  'Fix critical bug in checkout',
  'pending',
  'Users are reporting payment failures. Need to investigate and fix ASAP.',
  '2026-01-01',
  'urgent',
  '[
    {"id": "label-6", "name": "bug", "color": "#EF4444"},
    {"id": "label-7", "name": "critical", "color": "#DC2626"},
    {"id": "label-8", "name": "payments", "color": "#10B981"}
  ]'::jsonb,
  '{"id": "3", "name": "Sam"}'::jsonb,
  '[]'::jsonb,
  '[
    {"id": "a3", "title": "Error logs", "url": "https://sentry.io/issue/123"},
    {"id": "a4", "title": "Customer reports", "url": "https://support.example.com/tickets"}
  ]'::jsonb
FROM auth.users LIMIT 1;

-- Sample Task 4: Completed task with full checklist
INSERT INTO tasks (
  user_id, title, status, description, "dueDate", priority, 
  labels, assignee, checklist, attachments
)
SELECT 
  id,
  'Write API documentation',
  'done',
  'Complete API documentation for all endpoints with examples and error codes.',
  '2025-12-30',
  'low',
  '[
    {"id": "label-9", "name": "documentation", "color": "#06B6D4"},
    {"id": "label-10", "name": "api", "color": "#3B82F6"}
  ]'::jsonb,
  '{"id": "4", "name": "Priya"}'::jsonb,
  '[
    {"id": "c8", "text": "Document authentication endpoints", "done": true},
    {"id": "c9", "text": "Document task endpoints", "done": true},
    {"id": "c10", "text": "Add code examples", "done": true},
    {"id": "c11", "text": "Review with team", "done": true}
  ]'::jsonb,
  '[
    {"id": "a5", "title": "API Docs", "url": "https://docs.example.com/api"}
  ]'::jsonb
FROM auth.users LIMIT 1;

-- Sample Task 5: Simple task with minimal metadata (Unassigned)
INSERT INTO tasks (
  user_id, title, status, description, priority, labels
)
SELECT 
  id,
  'Update README file',
  'pending',
  'Add installation instructions and usage examples to the project README.',
  'low',
  '["documentation"]'::jsonb
FROM auth.users LIMIT 1;

-- Sample Task 6: Task with multiple labels (demonstrates label lane duplication)
INSERT INTO tasks (
  user_id, title, status, description, "dueDate", priority, 
  labels, assignee, checklist, attachments
)
SELECT 
  id,
  'Refactor authentication module',
  'in_progress',
  'Clean up authentication code and improve error handling. This task has multiple labels and will appear in multiple label lanes.',
  '2026-01-18',
  'medium',
  '[
    {"id": "label-11", "name": "backend", "color": "#8B5CF6"},
    {"id": "label-12", "name": "security", "color": "#F59E0B"},
    {"id": "label-13", "name": "refactor", "color": "#84CC16"}
  ]'::jsonb,
  '{"id": "2", "name": "Alex"}'::jsonb,
  '[
    {"id": "c12", "text": "Review current implementation", "done": true},
    {"id": "c13", "text": "Identify pain points", "done": true},
    {"id": "c14", "text": "Implement improvements", "done": false}
  ]'::jsonb,
  '[]'::jsonb
FROM auth.users LIMIT 1;

-- Sample Task 7: Another urgent task for different assignee
INSERT INTO tasks (
  user_id, title, status, description, "dueDate", priority, 
  labels, assignee, checklist
)
SELECT 
  id,
  'Deploy hotfix to production',
  'in_progress',
  'Critical hotfix needs to be deployed immediately.',
  '2026-01-03',
  'urgent',
  '[
    {"id": "label-14", "name": "deployment", "color": "#F97316"},
    {"id": "label-15", "name": "critical", "color": "#DC2626"}
  ]'::jsonb,
  '{"id": "1", "name": "Francesca"}'::jsonb,
  '[
    {"id": "c15", "text": "Test in staging", "done": true},
    {"id": "c16", "text": "Get approval", "done": false},
    {"id": "c17", "text": "Deploy to production", "done": false}
  ]'::jsonb
FROM auth.users LIMIT 1;

-- Sample Task 8: Task with no labels (demonstrates "No label" lane)
INSERT INTO tasks (
  user_id, title, status, description, priority, assignee
)
SELECT 
  id,
  'Setup monitoring dashboards',
  'pending',
  'Configure monitoring and alerting for production systems.',
  'high',
  '{"id": "3", "name": "Sam"}'::jsonb
FROM auth.users LIMIT 1;

-- Sample Task 9: Another unassigned task
INSERT INTO tasks (
  user_id, title, status, description, priority, labels
)
SELECT 
  id,
  'Research new framework options',
  'pending',
  'Evaluate different framework options for the next project. Compare performance, developer experience, and ecosystem support.',
  'low',
  '[
    {"id": "label-16", "name": "research", "color": "#A855F7"},
    {"id": "label-17", "name": "planning", "color": "#14B8A6"}
  ]'::jsonb
FROM auth.users LIMIT 1;

-- Sample Task 10: Task for description search testing
INSERT INTO tasks (
  user_id, title, status, description, "dueDate", priority, 
  labels, assignee
)
SELECT 
  id,
  'Performance optimization',
  'in_progress',
  'Improve application performance by optimizing database queries and implementing caching strategies. Focus on the authentication flow which is currently slow.',
  '2026-01-12',
  'high',
  '[
    {"id": "label-18", "name": "backend", "color": "#8B5CF6"},
    {"id": "label-19", "name": "performance", "color": "#EAB308"}
  ]'::jsonb,
  '{"id": "3", "name": "Sam"}'::jsonb
FROM auth.users LIMIT 1;

-- Sample Task 11: Another task due today (for due date filter testing)
INSERT INTO tasks (
  user_id, title, status, description, "dueDate", priority, 
  labels, assignee
)
SELECT 
  id,
  'Client presentation',
  'pending',
  'Prepare slides and demo for client meeting. Make sure all features are working properly.',
  CURRENT_DATE::text,
  'urgent',
  '[
    {"id": "label-20", "name": "presentation", "color": "#EC4899"},
    {"id": "label-21", "name": "client", "color": "#6366F1"}
  ]'::jsonb,
  '{"id": "4", "name": "Priya"}'::jsonb
FROM auth.users LIMIT 1;

-- Sample Task 12: Task with rich description (search testing)
INSERT INTO tasks (
  user_id, title, status, description, priority, 
  labels, assignee
)
SELECT 
  id,
  'Code review process improvements',
  'pending',
  'Implement automated code review checks using GitHub Actions. Set up linting, testing, and security scanning in the CI/CD pipeline.',
  'medium',
  '[
    {"id": "label-22", "name": "devops", "color": "#22C55E"},
    {"id": "label-23", "name": "process", "color": "#06B6D4"}
  ]'::jsonb,
  '{"id": "2", "name": "Alex"}'::jsonb
FROM auth.users LIMIT 1;
