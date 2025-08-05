-- Database Reset Script - Drops all tables and recreates with hierarchical task structure
-- Run this in your Supabase SQL Editor (Database → SQL Editor)

-- 1. Drop all existing tables
DROP TABLE IF EXISTS task_activity_log CASCADE;
DROP TABLE IF EXISTS subtasks CASCADE;
DROP TABLE IF EXISTS main_tasks CASCADE;
DROP TABLE IF EXISTS action_items CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;
DROP TABLE IF EXISTS memories CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS goal_phases CASCADE;
DROP TABLE IF EXISTS goal_subgoals CASCADE;
DROP TABLE IF EXISTS goal_progress_logs CASCADE;

-- 2. Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  summary TEXT,
  themes TEXT[] DEFAULT '{}',
  total_interactions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create interactions table
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  platform TEXT NOT NULL,
  model TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  summary TEXT,
  embedding VECTOR(1536),
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create memories table
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  source TEXT NOT NULL,
  source_id UUID NOT NULL,
  tags TEXT[] DEFAULT '{}',
  relevance_score FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



-- 8. Create task_templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  estimated_duration INTEGER,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,
  recurrence_config JSONB,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  target_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  progress INTEGER DEFAULT 0,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  goal_type TEXT DEFAULT 'personal',
  parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  phase TEXT DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create action_items table (enhanced with hierarchical support)
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  category TEXT DEFAULT 'General',
  due_date TIMESTAMPTZ,
  estimated_duration INTEGER,
  template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
  source_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  source_interaction_id UUID REFERENCES interactions(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  -- Hierarchical support
  parent_id UUID REFERENCES action_items(id) ON DELETE CASCADE,
  is_main_task BOOLEAN DEFAULT FALSE,
  progress INTEGER DEFAULT 0,
  actual_duration INTEGER,
  order_index INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create task_activity_log table
CREATE TABLE IF NOT EXISTS task_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES action_items(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  message_id UUID REFERENCES interactions(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Create indexes
-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_platform ON sessions(platform);

-- Interactions indexes
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON interactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_session_id ON interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_platform ON interactions(platform);

-- Memories indexes
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_source ON memories(source);



-- Task templates indexes
CREATE INDEX IF NOT EXISTS idx_task_templates_user_id ON task_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);
CREATE INDEX IF NOT EXISTS idx_task_templates_is_recurring ON task_templates(is_recurring);
CREATE INDEX IF NOT EXISTS idx_task_templates_is_public ON task_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_task_templates_usage_count ON task_templates(usage_count DESC);

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON goals(completed);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);
CREATE INDEX IF NOT EXISTS idx_goals_parent_goal_id ON goals(parent_goal_id);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(created_at DESC);

-- Action items indexes
CREATE INDEX IF NOT EXISTS idx_action_items_user_id ON action_items(user_id);
CREATE INDEX IF NOT EXISTS idx_action_items_created_at ON action_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_items_completed ON action_items(completed);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority);
CREATE INDEX IF NOT EXISTS idx_action_items_category ON action_items(category);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(due_date);
CREATE INDEX IF NOT EXISTS idx_action_items_template_id ON action_items(template_id);
CREATE INDEX IF NOT EXISTS idx_action_items_source_session_id ON action_items(source_session_id);
CREATE INDEX IF NOT EXISTS idx_action_items_source_interaction_id ON action_items(source_interaction_id);
CREATE INDEX IF NOT EXISTS idx_action_items_goal_id ON action_items(goal_id);
-- Hierarchical indexes
CREATE INDEX IF NOT EXISTS idx_action_items_parent_id ON action_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_action_items_is_main_task ON action_items(is_main_task);
CREATE INDEX IF NOT EXISTS idx_action_items_progress ON action_items(progress);
CREATE INDEX IF NOT EXISTS idx_action_items_order_index ON action_items(order_index);

-- Task activity log indexes
CREATE INDEX IF NOT EXISTS idx_task_activity_log_user_id ON task_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_log_task_id ON task_activity_log(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_log_session_id ON task_activity_log(session_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_log_timestamp ON task_activity_log(timestamp DESC);

-- Vector indexes for similarity search
CREATE INDEX IF NOT EXISTS idx_interactions_embedding ON interactions USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 11. Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies
-- Sessions policies
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;
CREATE POLICY "Users can delete own sessions" ON sessions FOR DELETE USING (auth.uid() = user_id);

-- Interactions policies
DROP POLICY IF EXISTS "Users can view own interactions" ON interactions;
CREATE POLICY "Users can view own interactions" ON interactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own interactions" ON interactions;
CREATE POLICY "Users can insert own interactions" ON interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own interactions" ON interactions;
CREATE POLICY "Users can update own interactions" ON interactions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own interactions" ON interactions;
CREATE POLICY "Users can delete own interactions" ON interactions FOR DELETE USING (auth.uid() = user_id);

-- Memories policies
DROP POLICY IF EXISTS "Users can view own memories" ON memories;
CREATE POLICY "Users can view own memories" ON memories FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own memories" ON memories;
CREATE POLICY "Users can insert own memories" ON memories FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own memories" ON memories;
CREATE POLICY "Users can update own memories" ON memories FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own memories" ON memories;
CREATE POLICY "Users can delete own memories" ON memories FOR DELETE USING (auth.uid() = user_id);



-- Task templates policies
DROP POLICY IF EXISTS "Users can view own task templates" ON task_templates;
CREATE POLICY "Users can view own task templates" ON task_templates FOR SELECT USING (auth.uid() = user_id OR is_public = true);
DROP POLICY IF EXISTS "Users can insert own task templates" ON task_templates;
CREATE POLICY "Users can insert own task templates" ON task_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own task templates" ON task_templates;
CREATE POLICY "Users can update own task templates" ON task_templates FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own task templates" ON task_templates;
CREATE POLICY "Users can delete own task templates" ON task_templates FOR DELETE USING (auth.uid() = user_id);

-- Goals policies
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE USING (auth.uid() = user_id);

-- Action items policies
DROP POLICY IF EXISTS "Users can view own action items" ON action_items;
CREATE POLICY "Users can view own action items" ON action_items FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own action items" ON action_items;
CREATE POLICY "Users can insert own action items" ON action_items FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own action items" ON action_items;
CREATE POLICY "Users can update own action items" ON action_items FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own action items" ON action_items;
CREATE POLICY "Users can delete own action items" ON action_items FOR DELETE USING (auth.uid() = user_id);

-- Task activity log policies
DROP POLICY IF EXISTS "Users can view own task activity log" ON task_activity_log;
CREATE POLICY "Users can view own task activity log" ON task_activity_log FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own task activity log" ON task_activity_log;
CREATE POLICY "Users can insert own task activity log" ON task_activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own task activity log" ON task_activity_log;
CREATE POLICY "Users can update own task activity log" ON task_activity_log FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own task activity log" ON task_activity_log;
CREATE POLICY "Users can delete own task activity log" ON task_activity_log FOR DELETE USING (auth.uid() = user_id);

-- 13. Create triggers and functions
-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON memories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_action_items_updated_at BEFORE UPDATE ON action_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_activity_log_updated_at BEFORE UPDATE ON task_activity_log FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Automation: Update session total_interactions count
CREATE OR REPLACE FUNCTION update_session_interaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE sessions 
    SET total_interactions = total_interactions + 1,
        updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE sessions 
    SET total_interactions = total_interactions - 1,
        updated_at = NOW()
    WHERE id = OLD.session_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic session interaction counting
CREATE TRIGGER trigger_update_session_interaction_count
  AFTER INSERT OR DELETE ON interactions
  FOR EACH ROW EXECUTE FUNCTION update_session_interaction_count();



-- 14. Create helper functions
-- Drop existing functions first
DROP FUNCTION IF EXISTS get_action_items_by_session(UUID);
DROP FUNCTION IF EXISTS get_hierarchical_action_items();
DROP FUNCTION IF EXISTS search_memories(UUID, vector, float, int);
DROP FUNCTION IF EXISTS get_user_stats(UUID);

-- Function to get action items by session
CREATE OR REPLACE FUNCTION get_action_items_by_session(session_uuid UUID)
RETURNS TABLE (
  action_items JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_agg(to_jsonb(ai.*) ORDER BY ai.created_at DESC) as action_items
  FROM action_items ai
  WHERE ai.source_session_id = session_uuid
  AND ai.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get hierarchical action items
CREATE OR REPLACE FUNCTION get_hierarchical_action_items()
RETURNS TABLE (
  action_items JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_agg(
      CASE 
        WHEN ai.parent_id IS NULL THEN 
          jsonb_build_object(
            'id', ai.id,
            'text', ai.text,
            'completed', ai.completed,
            'priority', ai.priority,
            'category', ai.category,
            'is_main_task', ai.is_main_task,
            'progress', ai.progress,
            'children', (
              SELECT jsonb_agg(to_jsonb(child.*) ORDER BY child.order_index, child.created_at)
              FROM action_items child 
              WHERE child.parent_id = ai.id
            )
          )
        ELSE NULL
      END
    ) FILTER (WHERE ai.parent_id IS NULL) as action_items
  FROM action_items ai
  WHERE ai.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RAG search function for memories
CREATE OR REPLACE FUNCTION search_memories(
  user_uuid UUID,
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source TEXT,
  source_id UUID,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.source,
    m.source_id,
    1 - (m.embedding <=> query_embedding) as similarity
  FROM memories m
  WHERE m.user_id = user_uuid
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  total_interactions INTEGER,
  total_sessions INTEGER,
  total_memories INTEGER,
  total_action_items INTEGER,
  completed_action_items INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM interactions WHERE user_id = user_uuid) as total_interactions,
    (SELECT COUNT(*) FROM sessions WHERE user_id = user_uuid) as total_sessions,
    (SELECT COUNT(*) FROM memories WHERE user_id = user_uuid) as total_memories,
    (SELECT COUNT(*) FROM action_items WHERE user_id = user_uuid) as total_action_items,
    (SELECT COUNT(*) FROM action_items WHERE user_id = user_uuid AND completed = true) as completed_action_items;
END;
$$; 