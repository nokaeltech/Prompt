-- Example Queries for Aqeel AI Memory Assistant
-- These queries demonstrate how to work with the production-ready schema

-- ========================================
-- 1. USER MANAGEMENT & AUTHENTICATION
-- ========================================

-- Get current user's ID (Supabase auth context)
SELECT auth.uid() as current_user_id;

-- Check if user exists
SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid()) as user_exists;

-- ========================================
-- 2. SESSIONS MANAGEMENT
-- ========================================

-- Create a new session
INSERT INTO sessions (user_id, title, platform, start_time)
VALUES (auth.uid(), 'Productivity Planning', 'Web', NOW())
RETURNING id, title, start_time;

-- Get all sessions for current user (ordered by most recent)
SELECT 
  id,
  title,
  platform,
  start_time,
  end_time,
  total_interactions,
  themes,
  summary
FROM sessions 
WHERE user_id = auth.uid()
ORDER BY start_time DESC;

-- Get sessions from last 30 days
SELECT 
  id,
  title,
  platform,
  start_time,
  total_interactions
FROM sessions 
WHERE user_id = auth.uid()
  AND start_time >= NOW() - INTERVAL '30 days'
ORDER BY start_time DESC;

-- Update session end time and summary
UPDATE sessions 
SET 
  end_time = NOW(),
  summary = 'Completed productivity planning session with 5 action items created',
  updated_at = NOW()
WHERE id = 'session-id-here' AND user_id = auth.uid()
RETURNING id, title, summary;

-- ========================================
-- 3. INTERACTIONS MANAGEMENT
-- ========================================

-- Create a new interaction
INSERT INTO interactions (
  user_id,
  prompt,
  response,
  platform,
  model,
  session_id,
  tags,
  tokens_used
)
VALUES (
  auth.uid(),
  'Help me plan my week',
  'Here is a comprehensive weekly plan...',
  'Web',
  'gpt-4o',
  'session-id-here',
  ARRAY['planning', 'productivity'],
  150
)
RETURNING id, prompt, response, timestamp;

-- Get interactions for a specific session
SELECT 
  i.id,
  i.prompt,
  i.response,
  i.timestamp,
  i.tags,
  i.summary,
  i.tokens_used
FROM interactions i
WHERE i.user_id = auth.uid() 
  AND i.session_id = 'session-id-here'
ORDER BY i.timestamp ASC;

-- Get recent interactions across all sessions
SELECT 
  i.id,
  i.prompt,
  i.response,
  i.timestamp,
  i.platform,
  i.model,
  s.title as session_title,
  i.tags
FROM interactions i
JOIN sessions s ON i.session_id = s.id
WHERE i.user_id = auth.uid()
ORDER BY i.timestamp DESC
LIMIT 20;

-- Search interactions by content (full-text search)
SELECT 
  id,
  prompt,
  response,
  timestamp,
  ts_rank(to_tsvector('english', prompt || ' ' || response), plainto_tsquery('english', 'productivity')) as rank
FROM interactions
WHERE user_id = auth.uid()
  AND to_tsvector('english', prompt || ' ' || response) @@ plainto_tsquery('english', 'productivity')
ORDER BY rank DESC;

-- ========================================
-- 4. ACTION ITEMS (TO-DO LISTS) MANAGEMENT
-- ========================================

-- Create a new action item
INSERT INTO action_items (
  user_id,
  text,
  priority,
  category,
  due_date,
  source_interaction_id,
  source_session_id
)
VALUES (
  auth.uid(),
  'Review quarterly goals',
  'high',
  'business',
  NOW() + INTERVAL '7 days',
  'interaction-id-here',
  'session-id-here'
)
RETURNING id, text, priority, category, due_date;

-- Get all action items for current user
SELECT 
  id,
  text,
  completed,
  priority,
  category,
  due_date,
  created_at
FROM action_items
WHERE user_id = auth.uid()
ORDER BY 
  CASE 
    WHEN completed = false AND due_date IS NOT NULL AND due_date < NOW() THEN 1
    WHEN completed = false AND priority = 'high' THEN 2
    WHEN completed = false AND priority = 'medium' THEN 3
    WHEN completed = false AND priority = 'low' THEN 4
    ELSE 5
  END,
  created_at DESC;

-- Get overdue action items
SELECT 
  id,
  text,
  priority,
  category,
  due_date,
  created_at
FROM action_items
WHERE user_id = auth.uid()
  AND completed = false
  AND due_date < NOW()
ORDER BY due_date ASC;

-- Get action items by category
SELECT 
  id,
  text,
  completed,
  priority,
  due_date
FROM action_items
WHERE user_id = auth.uid()
  AND category = 'business'
ORDER BY created_at DESC;

-- Mark action item as completed
UPDATE action_items
SET 
  completed = true,
  updated_at = NOW()
WHERE id = 'action-item-id-here' 
  AND user_id = auth.uid()
RETURNING id, text, completed;

-- Get action items created from a specific interaction
SELECT 
  ai.id,
  ai.text,
  ai.completed,
  ai.priority,
  ai.category,
  ai.due_date,
  i.prompt as source_prompt
FROM action_items ai
JOIN interactions i ON ai.source_interaction_id = i.id
WHERE ai.user_id = auth.uid()
  AND ai.source_interaction_id = 'interaction-id-here'
ORDER BY ai.created_at DESC;

-- ========================================
-- 5. MEMORIES & RAG SEARCH
-- ========================================

-- Create a new memory
INSERT INTO memories (
  user_id,
  content,
  embedding,
  source,
  source_id,
  tags,
  relevance_score
)
VALUES (
  auth.uid(),
  'User prefers to work on high-priority tasks in the morning',
  '[0.1, 0.2, 0.3, ...]'::vector(1536),
  'interaction',
  'interaction-id-here',
  ARRAY['productivity', 'preferences'],
  0.85
)
RETURNING id, content, relevance_score;

-- Search memories using RAG function
SELECT 
  id,
  content,
  source,
  source_id,
  similarity
FROM search_memories(
  auth.uid(),
  '[0.1, 0.2, 0.3, ...]'::vector(1536),
  0.7,
  5
);

-- Get all memories for current user
SELECT 
  id,
  content,
  source,
  source_id,
  tags,
  relevance_score,
  created_at
FROM memories
WHERE user_id = auth.uid()
ORDER BY relevance_score DESC, created_at DESC;

-- Get memories by source type
SELECT 
  id,
  content,
  source_id,
  tags,
  relevance_score
FROM memories
WHERE user_id = auth.uid()
  AND source = 'interaction'
ORDER BY created_at DESC;

-- ========================================
-- 6. ANALYTICS & STATISTICS
-- ========================================

-- Get user statistics using the helper function
SELECT * FROM get_user_stats(auth.uid());

-- Get daily interaction count for last 30 days
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as interaction_count,
  SUM(tokens_used) as total_tokens
FROM interactions
WHERE user_id = auth.uid()
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Get action items completion rate by category
SELECT 
  category,
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE completed = true) as completed_items,
  ROUND(
    (COUNT(*) FILTER (WHERE completed = true)::float / COUNT(*)::float) * 100, 2
  ) as completion_rate
FROM action_items
WHERE user_id = auth.uid()
GROUP BY category
ORDER BY completion_rate DESC;

-- Get most active sessions
SELECT 
  s.id,
  s.title,
  s.start_time,
  s.total_interactions,
  COUNT(ai.id) as action_items_created
FROM sessions s
LEFT JOIN action_items ai ON s.id = ai.source_session_id
WHERE s.user_id = auth.uid()
GROUP BY s.id, s.title, s.start_time, s.total_interactions
ORDER BY s.total_interactions DESC
LIMIT 10;

-- Get platform usage statistics
SELECT 
  platform,
  COUNT(*) as session_count,
  SUM(total_interactions) as total_interactions
FROM sessions
WHERE user_id = auth.uid()
GROUP BY platform
ORDER BY total_interactions DESC;

-- ========================================
-- 7. ADVANCED QUERIES
-- ========================================

-- Find sessions with most action items
SELECT 
  s.title,
  s.start_time,
  COUNT(ai.id) as action_items_count,
  COUNT(ai.id) FILTER (WHERE ai.completed = true) as completed_items
FROM sessions s
LEFT JOIN action_items ai ON s.id = ai.source_session_id
WHERE s.user_id = auth.uid()
GROUP BY s.id, s.title, s.start_time
HAVING COUNT(ai.id) > 0
ORDER BY action_items_count DESC;

-- Get interactions that generated action items
SELECT 
  i.id,
  i.prompt,
  i.response,
  i.timestamp,
  COUNT(ai.id) as action_items_generated
FROM interactions i
LEFT JOIN action_items ai ON i.id = ai.source_interaction_id
WHERE i.user_id = auth.uid()
GROUP BY i.id, i.prompt, i.response, i.timestamp
HAVING COUNT(ai.id) > 0
ORDER BY action_items_generated DESC;

-- Find patterns in user's productivity (sessions with high completion rates)
SELECT 
  s.title,
  s.start_time,
  COUNT(ai.id) as total_action_items,
  COUNT(ai.id) FILTER (WHERE ai.completed = true) as completed_items,
  ROUND(
    (COUNT(ai.id) FILTER (WHERE ai.completed = true)::float / COUNT(ai.id)::float) * 100, 2
  ) as completion_rate
FROM sessions s
LEFT JOIN action_items ai ON s.id = ai.source_session_id
WHERE s.user_id = auth.uid()
  AND ai.id IS NOT NULL
GROUP BY s.id, s.title, s.start_time
HAVING COUNT(ai.id) >= 3
ORDER BY completion_rate DESC;

-- ========================================
-- 8. CLEANUP & MAINTENANCE
-- ========================================

-- Clear all data for current user (use with caution!)
-- SELECT clear_user_data(auth.uid());

-- Get orphaned records (for cleanup)
SELECT 'interactions' as table_name, COUNT(*) as orphaned_count
FROM interactions 
WHERE user_id = auth.uid() AND session_id NOT IN (SELECT id FROM sessions WHERE user_id = auth.uid())
UNION ALL
SELECT 'action_items' as table_name, COUNT(*) as orphaned_count
FROM action_items 
WHERE user_id = auth.uid() AND source_interaction_id NOT IN (SELECT id FROM interactions WHERE user_id = auth.uid());

-- ========================================
-- 9. PERFORMANCE MONITORING
-- ========================================

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE tablename IN ('interactions', 'sessions', 'memories', 'action_items')
ORDER BY tablename, attname;

-- Monitor index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN ('interactions', 'sessions', 'memories', 'action_items')
ORDER BY idx_scan DESC; 