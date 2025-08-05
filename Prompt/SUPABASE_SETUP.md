# Supabase Setup Guide

This guide will help you set up Supabase as your database backend for the Aqeel AI Memory Assistant.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed on your machine

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter a project name (e.g., "aqeel-ai-assistant")
5. Enter a database password (save this securely)
6. Choose a region close to you
7. Click "Create new project"

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## Step 3: Set Up Environment Variables

1. Create a `.env` file in the project root (copy from `.env.example` if it exists)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 4: Create Database Tables

Run the following SQL in your Supabase SQL Editor (Database → SQL Editor):

```sql
-- Create interactions table
CREATE TABLE interactions (
  id UUID PRIMARY KEY,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  platform TEXT NOT NULL,
  model TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  session_id UUID NOT NULL,
  tags TEXT[] DEFAULT '{}',
  summary TEXT,
  embedding VECTOR(1536)
);

-- Create sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  summary TEXT,
  themes TEXT[] DEFAULT '{}',
  total_interactions INTEGER DEFAULT 0
);

-- Create memories table
CREATE TABLE memories (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  source TEXT NOT NULL,
  source_id UUID NOT NULL,
  tags TEXT[] DEFAULT '{}',
  relevance_score FLOAT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Create action_items table
CREATE TABLE action_items (
  id UUID PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT NOT NULL,
  category TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  source_interaction_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_interactions_timestamp ON interactions(timestamp DESC);
CREATE INDEX idx_interactions_session_id ON interactions(session_id);
CREATE INDEX idx_sessions_start_time ON sessions(start_time DESC);
CREATE INDEX idx_memories_created_at ON memories(created_at DESC);
CREATE INDEX idx_action_items_created_at ON action_items(created_at DESC);
CREATE INDEX idx_action_items_completed ON action_items(completed);

-- Enable Row Level Security (RLS)
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
-- In production, you should implement proper authentication
CREATE POLICY "Allow public access to interactions" ON interactions FOR ALL USING (true);
CREATE POLICY "Allow public access to sessions" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow public access to memories" ON memories FOR ALL USING (true);
CREATE POLICY "Allow public access to action_items" ON action_items FOR ALL USING (true);
```

## Step 5: Install Dependencies and Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and go to the application URL

## Step 6: Switch to Supabase Storage

1. Go to the Settings page in the application
2. In the "Data Storage" section, click "Use Supabase"
3. Your data will be migrated from localStorage to Supabase

## Troubleshooting

### Connection Issues
- Make sure your environment variables are correctly set
- Check that your Supabase project is active
- Verify your API keys are correct

### Database Errors
- Ensure all tables are created correctly
- Check that RLS policies are set up properly
- Verify your database password is correct

### Migration Issues
- Clear your browser's localStorage if you encounter issues
- Check the browser console for error messages
- Ensure your Supabase project has the correct permissions

## Security Notes

- The current setup allows public access to all data
- For production use, implement proper authentication
- Consider using Supabase Auth for user management
- Set up proper RLS policies based on user authentication

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are set correctly
4. Check that all database tables are created properly 