-- Migration Script: Upgrade to Production-Ready Schema
-- Run this AFTER running the updated supabase-schema.sql
-- This script handles the transition from the old schema to the new multi-user schema

-- Step 1: Add user_id columns to existing tables
-- Note: This will fail if you already have data and no default user
-- If you have existing data, you'll need to assign it to a specific user first

-- Add user_id to interactions table
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS tokens_used INTEGER;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add user_id to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add user_id to memories table
ALTER TABLE memories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to action_items table
ALTER TABLE action_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE action_items ADD COLUMN IF NOT EXISTS source_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;
ALTER TABLE action_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Add constraints and defaults
-- Update action_items priority constraint
ALTER TABLE action_items DROP CONSTRAINT IF EXISTS action_items_priority_check;
ALTER TABLE action_items ADD CONSTRAINT action_items_priority_check CHECK (priority IN ('low', 'medium', 'high'));

-- Step 3: Create new indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_platform ON interactions(platform);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_platform ON sessions(platform);

CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_source ON memories(source);

CREATE INDEX IF NOT EXISTS idx_action_items_user_id ON action_items(user_id);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority);
CREATE INDEX IF NOT EXISTS idx_action_items_category ON action_items(category);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(due_date);

-- Step 4: Update RLS policies (replace the old public access policies)
-- Drop old policies
DROP POLICY IF EXISTS "Allow public access to interactions" ON interactions;
DROP POLICY IF EXISTS "Allow public access to sessions" ON sessions;
DROP POLICY IF EXISTS "Allow public access to memories" ON memories;
DROP POLICY IF EXISTS "Allow public access to action_items" ON action_items;

-- Create new secure policies
CREATE POLICY "Users can view own interactions" ON interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interactions" ON interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interactions" ON interactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own interactions" ON interactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own memories" ON memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memories" ON memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memories" ON memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memories" ON memories FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own action items" ON action_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own action items" ON action_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own action items" ON action_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own action items" ON action_items FOR DELETE USING (auth.uid() = user_id);

-- Step 5: Create helper functions
-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON memories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_action_items_updated_at BEFORE UPDATE ON action_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Function to clear user data
CREATE OR REPLACE FUNCTION clear_user_data(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM action_items WHERE user_id = user_uuid;
  DELETE FROM memories WHERE user_id = user_uuid;
  DELETE FROM interactions WHERE user_id = user_uuid;
  DELETE FROM sessions WHERE user_id = user_uuid;
END;
$$;

-- Step 6: Data migration helper (if you have existing data)
-- WARNING: Only run this if you have existing data and want to assign it to a specific user
-- Replace 'your-user-id-here' with an actual user ID from auth.users

/*
-- Uncomment and modify this section if you have existing data to migrate
UPDATE interactions SET user_id = 'your-user-id-here' WHERE user_id IS NULL;
UPDATE sessions SET user_id = 'your-user-id-here' WHERE user_id IS NULL;
UPDATE memories SET user_id = 'your-user-id-here' WHERE user_id IS NULL;
UPDATE action_items SET user_id = 'your-user-id-here' WHERE user_id IS NULL;
*/

-- Step 7: Make user_id NOT NULL after data migration
-- Uncomment these lines AFTER you've migrated all existing data to specific users
/*
ALTER TABLE interactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE memories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE action_items ALTER COLUMN user_id SET NOT NULL;
*/ 