-- ============================================================================
-- TEST DATA MIGRATION - Checklist & Labels
-- ============================================================================
-- This file creates sample tasks with checklist items and labels
-- User ID: dd6fbf1c-94a9-468b-8ea3-a433b811e450
-- ============================================================================

-- ============================================================================
-- PART 1: Insert Sample Tasks
-- ============================================================================

-- Insert 3 sample tasks (or update if they already exist)
INSERT INTO tasks (
  id,
  user_id,
  title,
  status,
  description,
  priority,
  "dueDate",
  created_at,
  updated_at
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'dd6fbf1c-94a9-468b-8ea3-a433b811e450',
    '🚀 Launch New Feature',
    'in_progress',
    'Deploy the new task management features to production',
    'high',
    (CURRENT_DATE + INTERVAL '7 days')::text,
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'dd6fbf1c-94a9-468b-8ea3-a433b811e450',
    '📝 Write Documentation',
    'pending',
    'Create comprehensive documentation for the API',
    'medium',
    (CURRENT_DATE + INTERVAL '14 days')::text,
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'dd6fbf1c-94a9-468b-8ea3-a433b811e450',
    '🐛 Fix Critical Bug',
    'done',
    'Resolved the authentication issue reported by users',
    'urgent',
    (CURRENT_DATE - INTERVAL '2 days')::text,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- PART 2: Insert Checklist Items (Normalized Table)
-- ============================================================================

-- Task 1: Launch New Feature (5 checklist items)
INSERT INTO checklist_items (id, task_id, text, done, "order", created_at, updated_at) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Review code changes', true, 0, NOW(), NOW()),
  ('aaaa2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Run integration tests', true, 1, NOW(), NOW()),
  ('aaaa3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Deploy to staging environment', true, 2, NOW(), NOW()),
  ('aaaa4444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'QA testing and sign-off', false, 3, NOW(), NOW()),
  ('aaaa5555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Deploy to production', false, 4, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  text = EXCLUDED.text,
  done = EXCLUDED.done,
  updated_at = NOW();

-- Task 2: Write Documentation (3 checklist items)
INSERT INTO checklist_items (id, task_id, text, done, "order", created_at, updated_at) VALUES
  ('bbbb1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Create API endpoint documentation', false, 0, NOW(), NOW()),
  ('bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Add code examples for each endpoint', false, 1, NOW(), NOW()),
  ('bbbb3333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Review and publish to docs site', false, 2, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  text = EXCLUDED.text,
  done = EXCLUDED.done,
  updated_at = NOW();

-- Task 3: Fix Critical Bug (4 checklist items - all done)
INSERT INTO checklist_items (id, task_id, text, done, "order", created_at, updated_at) VALUES
  ('cccc1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Reproduce the bug locally', true, 0, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
  ('cccc2222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Identify root cause in auth flow', true, 1, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
  ('cccc3333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Implement fix and write tests', true, 2, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
  ('cccc4444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Deploy hotfix to production', true, 3, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
  text = EXCLUDED.text,
  done = EXCLUDED.done,
  updated_at = NOW();

-- ============================================================================
-- PART 3: Create Labels (Normalized Table)
-- ============================================================================

INSERT INTO labels (id, name, color, user_id, created_at, updated_at) VALUES
  ('label-1111-1111-1111-111111111111', 'urgent', '#EF4444', 'dd6fbf1c-94a9-468b-8ea3-a433b811e450', NOW(), NOW()),
  ('label-2222-2222-2222-222222222222', 'feature', '#3B82F6', 'dd6fbf1c-94a9-468b-8ea3-a433b811e450', NOW(), NOW()),
  ('label-3333-3333-3333-333333333333', 'bug', '#F59E0B', 'dd6fbf1c-94a9-468b-8ea3-a433b811e450', NOW(), NOW()),
  ('label-4444-4444-4444-444444444444', 'documentation', '#8B5CF6', 'dd6fbf1c-94a9-468b-8ea3-a433b811e450', NOW(), NOW()),
  ('label-5555-5555-5555-555555555555', 'backend', '#10B981', 'dd6fbf1c-94a9-468b-8ea3-a433b811e450', NOW(), NOW()),
  ('label-6666-6666-6666-666666666666', 'frontend', '#F472B6', 'dd6fbf1c-94a9-468b-8ea3-a433b811e450', NOW(), NOW()),
  ('label-7777-7777-7777-777777777777', 'testing', '#6366F1', 'dd6fbf1c-94a9-468b-8ea3-a433b811e450', NOW(), NOW())
ON CONFLICT (user_id, name) DO UPDATE SET
  color = EXCLUDED.color,
  updated_at = NOW();

-- ============================================================================
-- PART 4: Link Labels to Tasks (Many-to-Many)
-- ============================================================================

-- Task 1: Launch New Feature → urgent, feature, backend, frontend, testing
INSERT INTO task_labels (task_id, label_id, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'label-1111-1111-1111-111111111111', NOW()), -- urgent
  ('11111111-1111-1111-1111-111111111111', 'label-2222-2222-2222-222222222222', NOW()), -- feature
  ('11111111-1111-1111-1111-111111111111', 'label-5555-5555-5555-555555555555', NOW()), -- backend
  ('11111111-1111-1111-1111-111111111111', 'label-6666-6666-6666-666666666666', NOW()), -- frontend
  ('11111111-1111-1111-1111-111111111111', 'label-7777-7777-7777-777777777777', NOW())  -- testing
ON CONFLICT (task_id, label_id) DO NOTHING;

-- Task 2: Write Documentation → documentation, backend
INSERT INTO task_labels (task_id, label_id, created_at) VALUES
  ('22222222-2222-2222-2222-222222222222', 'label-4444-4444-4444-444444444444', NOW()), -- documentation
  ('22222222-2222-2222-2222-222222222222', 'label-5555-5555-5555-555555555555', NOW())  -- backend
ON CONFLICT (task_id, label_id) DO NOTHING;

-- Task 3: Fix Critical Bug → urgent, bug, backend, testing
INSERT INTO task_labels (task_id, label_id, created_at) VALUES
  ('33333333-3333-3333-3333-333333333333', 'label-1111-1111-1111-111111111111', NOW()), -- urgent
  ('33333333-3333-3333-3333-333333333333', 'label-3333-3333-3333-333333333333', NOW()), -- bug
  ('33333333-3333-3333-3333-333333333333', 'label-5555-5555-5555-555555555555', NOW()), -- backend
  ('33333333-3333-3333-3333-333333333333', 'label-7777-7777-7777-777777777777', NOW())  -- testing
ON CONFLICT (task_id, label_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION: Show What Was Created
-- ============================================================================

-- Show tasks created
SELECT 
  '📋 Tasks Created' as section,
  COUNT(*) as count
FROM tasks
WHERE user_id = 'dd6fbf1c-94a9-468b-8ea3-a433b811e450';

-- Show checklist items created
SELECT 
  '✅ Checklist Items Created' as section,
  COUNT(*) as count
FROM checklist_items ci
JOIN tasks t ON t.id = ci.task_id
WHERE t.user_id = 'dd6fbf1c-94a9-468b-8ea3-a433b811e450';

-- Show labels created
SELECT 
  '🏷️  Labels Created' as section,
  COUNT(*) as count
FROM labels
WHERE user_id = 'dd6fbf1c-94a9-468b-8ea3-a433b811e450';

-- Show task-label relationships
SELECT 
  '🔗 Task-Label Links Created' as section,
  COUNT(*) as count
FROM task_labels tl
JOIN tasks t ON t.id = tl.task_id
WHERE t.user_id = 'dd6fbf1c-94a9-468b-8ea3-a433b811e450';

-- ============================================================================
-- DETAILED VIEW: See All Test Data
-- ============================================================================

-- Show tasks with their checklist counts and labels
SELECT 
  t.title,
  t.status,
  t.priority,
  COUNT(DISTINCT ci.id) as checklist_items,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.done = true) as completed_items,
  STRING_AGG(DISTINCT l.name, ', ' ORDER BY l.name) as labels
FROM tasks t
LEFT JOIN checklist_items ci ON ci.task_id = t.id
LEFT JOIN task_labels tl ON tl.task_id = t.id
LEFT JOIN labels l ON l.id = tl.label_id
WHERE t.user_id = 'dd6fbf1c-94a9-468b-8ea3-a433b811e450'
GROUP BY t.id, t.title, t.status, t.priority
ORDER BY t.created_at DESC;

-- Show checklist items by task
SELECT 
  t.title as task_title,
  ci.text as checklist_item,
  ci.done,
  ci."order"
FROM checklist_items ci
JOIN tasks t ON t.id = ci.task_id
WHERE t.user_id = 'dd6fbf1c-94a9-468b-8ea3-a433b811e450'
ORDER BY t.title, ci."order";

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 
  '🎉 Test Data Created Successfully!' as status,
  '3 tasks, 12 checklist items, 7 labels, 11 task-label links' as summary,
  'User: dd6fbf1c-94a9-468b-8ea3-a433b811e450' as user_info;

-- ============================================================================
-- END OF TEST DATA MIGRATION
-- ============================================================================

