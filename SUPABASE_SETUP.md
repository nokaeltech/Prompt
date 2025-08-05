# Supabase Setup Guide

This guide will help you set up Supabase for the Aqeel RAG app.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `aqeel-rag-app`
   - Database Password: Choose a strong password
   - Region: Choose closest to you
5. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - Project URL
   - Anon public key

## 3. Set Up Environment Variables

Create a `.env.local` file in your project root with:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

## 4. Set Up Database Schema

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create tables for the RAG app
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  platform VARCHAR(255),
  model VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id UUID,
  tags TEXT[],
  summary TEXT,
  embedding VECTOR(1536)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  platform VARCHAR(255),
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  summary TEXT,
  themes TEXT[],
  total_interactions INTEGER DEFAULT 0
);

CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  source VARCHAR(255),
  source_id UUID,
  tags TEXT[],
  relevance_score FLOAT DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority VARCHAR(50) DEFAULT 'medium',
  category VARCHAR(255) DEFAULT 'General',
  due_date DATE,
  source_interaction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create indexes for better performance
CREATE INDEX idx_interactions_timestamp ON interactions(timestamp DESC);
CREATE INDEX idx_sessions_start_time ON sessions(start_time DESC);
CREATE INDEX idx_memories_created_at ON memories(created_at DESC);
CREATE INDEX idx_action_items_created_at ON action_items(created_at DESC);

-- Create indexes for vector similarity search
CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops);
```

## 5. Install Dependencies

```bash
npm install
```

## 6. Start the Application

```bash
npm run dev
```

## 7. Test the Setup

1. Open your app at `http://localhost:5173`
2. Go to the Dashboard
3. Click "Run Database Tests"
4. Verify all tests pass

## Troubleshooting

### Connection Issues
- Verify your environment variables are correct
- Check that your Supabase project is active
- Ensure the database schema is properly set up

### Vector Search Issues
- Make sure the `vector` extension is enabled
- Verify the embedding indexes are created

### Permission Issues
- Check that your RLS (Row Level Security) policies are configured correctly
- Ensure your API keys have the necessary permissions 