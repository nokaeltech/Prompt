-- Aqeel AI Memory Assistant Database Schema (Production-Ready)
-- Run this in your Supabase SQL Editor (Database → SQL Editor)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create interactions table with user_id for multi-user support
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  platform TEXT NOT NULL,
  model TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id UUID NOT NULL,
  tags TEXT[] DEFAULT '{}',
  summary TEXT,
  embedding VECTOR(1536),
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sessions table with user_id
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

-- Create memories table with user_id
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

-- Create action_items table with user_id
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  category TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  source_interaction_id UUID REFERENCES interactions(id) ON DELETE SET NULL,
  source_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON interactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_session_id ON interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_platform ON interactions(platform);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_platform ON sessions(platform);

CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_source ON memories(source);

CREATE INDEX IF NOT EXISTS idx_action_items_user_id ON action_items(user_id);
CREATE INDEX IF NOT EXISTS idx_action_items_created_at ON action_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_items_completed ON action_items(completed);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority);
CREATE INDEX IF NOT EXISTS idx_action_items_category ON action_items(category);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(due_date);

-- Create vector indexes for similarity search
CREATE INDEX IF NOT EXISTS idx_interactions_embedding ON interactions USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable Row Level Security (RLS)
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policies for multi-user support
-- Interactions policies
DROP POLICY IF EXISTS "Users can view own interactions" ON interactions;
CREATE POLICY "Users can view own interactions" ON interactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own interactions" ON interactions;
CREATE POLICY "Users can insert own interactions" ON interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own interactions" ON interactions;
CREATE POLICY "Users can update own interactions" ON interactions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own interactions" ON interactions;
CREATE POLICY "Users can delete own interactions" ON interactions FOR DELETE USING (auth.uid() = user_id);

-- Sessions policies
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;
CREATE POLICY "Users can delete own sessions" ON sessions FOR DELETE USING (auth.uid() = user_id);

-- Memories policies
DROP POLICY IF EXISTS "Users can view own memories" ON memories;
CREATE POLICY "Users can view own memories" ON memories FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own memories" ON memories;
CREATE POLICY "Users can insert own memories" ON memories FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own memories" ON memories;
CREATE POLICY "Users can update own memories" ON memories FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own memories" ON memories;
CREATE POLICY "Users can delete own memories" ON memories FOR DELETE USING (auth.uid() = user_id);

-- Action items policies
DROP POLICY IF EXISTS "Users can view own action items" ON action_items;
CREATE POLICY "Users can view own action items" ON action_items FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own action items" ON action_items;
CREATE POLICY "Users can insert own action items" ON action_items FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own action items" ON action_items;
CREATE POLICY "Users can update own action items" ON action_items FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own action items" ON action_items;
CREATE POLICY "Users can delete own action items" ON action_items FOR DELETE USING (auth.uid() = user_id);

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
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

-- Create a function to clear all data for a specific user (for testing/reset purposes)
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

-- Create a function to clear all data (for testing/reset purposes - ADMIN ONLY)
CREATE OR REPLACE FUNCTION clear_all_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM action_items;
  DELETE FROM memories;
  DELETE FROM interactions;
  DELETE FROM sessions;
END;
$$; 