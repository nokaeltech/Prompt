const { createClient } = require('@supabase/supabase-js');

// Database reset script - Drops all tables and recreates with hierarchical task structure
async function resetDatabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🗑️  Starting database reset...');
  console.log('⚠️  This will DELETE ALL DATA and recreate the database structure!');

  try {
    // 1. Drop all existing tables
    console.log('📋 Dropping existing tables...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop all tables in the correct order (respecting foreign key constraints)
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
      `
    });

    if (dropError) {
      console.error('Error dropping tables:', dropError);
      throw dropError;
    }

    // 2. Enable required extensions
    console.log('🔧 Enabling extensions...');
    const { error: extensionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE EXTENSION IF NOT EXISTS vector;
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      `
    });

    if (extensionsError) {
      console.error('Error enabling extensions:', extensionsError);
      throw extensionsError;
    }

    // 3. Create sessions table
    console.log('📋 Creating sessions table...');
    const { error: sessionsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (sessionsError) {
      console.error('Error creating sessions table:', sessionsError);
      throw sessionsError;
    }

    // 4. Create interactions table
    console.log('📋 Creating interactions table...');
    const { error: interactionsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (interactionsError) {
      console.error('Error creating interactions table:', interactionsError);
      throw interactionsError;
    }

    // 5. Create memories table
    console.log('📋 Creating memories table...');
    const { error: memoriesError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (memoriesError) {
      console.error('Error creating memories table:', memoriesError);
      throw memoriesError;
    }

    // 6. Create main_tasks table
    console.log('📋 Creating main_tasks table...');
    const { error: mainTasksError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS main_tasks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          linked_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
          linked_interaction_id UUID REFERENCES interactions(id) ON DELETE SET NULL,
          status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
          priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
          category TEXT NOT NULL,
          due_date TIMESTAMPTZ,
          estimated_duration INTEGER,
          actual_duration INTEGER,
          progress INTEGER DEFAULT 0,
          tags TEXT[] DEFAULT '{}',
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    });

    if (mainTasksError) {
      console.error('Error creating main_tasks table:', mainTasksError);
      throw mainTasksError;
    }

    // 7. Create subtasks table
    console.log('📋 Creating subtasks table...');
    const { error: subtasksError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS subtasks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          parent_task_id UUID REFERENCES main_tasks(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
          priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
          order_index INTEGER DEFAULT 0,
          estimated_duration INTEGER,
          actual_duration INTEGER,
          due_date TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          tags TEXT[] DEFAULT '{}',
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    });

    if (subtasksError) {
      console.error('Error creating subtasks table:', subtasksError);
      throw subtasksError;
    }

    // 8. Create task_templates table
    console.log('📋 Creating task_templates table...');
    const { error: templatesError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (templatesError) {
      console.error('Error creating task_templates table:', templatesError);
      throw templatesError;
    }

    // 9. Create task_activity_log table
    console.log('📋 Creating task_activity_log table...');
    const { error: activityLogError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS task_activity_log (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          task_id UUID REFERENCES main_tasks(id) ON DELETE CASCADE,
          action TEXT NOT NULL,
          message_id UUID REFERENCES interactions(id) ON DELETE SET NULL,
          session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
          old_value TEXT,
          new_value TEXT,
          metadata JSONB,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    });

    if (activityLogError) {
      console.error('Error creating task_activity_log table:', activityLogError);
      throw activityLogError;
    }

    // 10. Create indexes
    console.log('📋 Creating indexes...');
    const { error: indexesError } = await supabase.rpc('exec_sql', {
      sql: `
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

        -- Main tasks indexes
        CREATE INDEX IF NOT EXISTS idx_main_tasks_user_id ON main_tasks(user_id);
        CREATE INDEX IF NOT EXISTS idx_main_tasks_linked_session_id ON main_tasks(linked_session_id);
        CREATE INDEX IF NOT EXISTS idx_main_tasks_linked_interaction_id ON main_tasks(linked_interaction_id);
        CREATE INDEX IF NOT EXISTS idx_main_tasks_status ON main_tasks(status);
        CREATE INDEX IF NOT EXISTS idx_main_tasks_priority ON main_tasks(priority);
        CREATE INDEX IF NOT EXISTS idx_main_tasks_category ON main_tasks(category);
        CREATE INDEX IF NOT EXISTS idx_main_tasks_due_date ON main_tasks(due_date);
        CREATE INDEX IF NOT EXISTS idx_main_tasks_created_at ON main_tasks(created_at DESC);

        -- Subtasks indexes
        CREATE INDEX IF NOT EXISTS idx_subtasks_user_id ON subtasks(user_id);
        CREATE INDEX IF NOT EXISTS idx_subtasks_parent_task_id ON subtasks(parent_task_id);
        CREATE INDEX IF NOT EXISTS idx_subtasks_status ON subtasks(status);
        CREATE INDEX IF NOT EXISTS idx_subtasks_priority ON subtasks(priority);
        CREATE INDEX IF NOT EXISTS idx_subtasks_order_index ON subtasks(order_index);
        CREATE INDEX IF NOT EXISTS idx_subtasks_due_date ON subtasks(due_date);
        CREATE INDEX IF NOT EXISTS idx_subtasks_created_at ON subtasks(created_at DESC);

        -- Task templates indexes
        CREATE INDEX IF NOT EXISTS idx_task_templates_user_id ON task_templates(user_id);
        CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);
        CREATE INDEX IF NOT EXISTS idx_task_templates_is_recurring ON task_templates(is_recurring);
        CREATE INDEX IF NOT EXISTS idx_task_templates_is_public ON task_templates(is_public);
        CREATE INDEX IF NOT EXISTS idx_task_templates_usage_count ON task_templates(usage_count DESC);

        -- Task activity log indexes
        CREATE INDEX IF NOT EXISTS idx_task_activity_log_user_id ON task_activity_log(user_id);
        CREATE INDEX IF NOT EXISTS idx_task_activity_log_task_id ON task_activity_log(task_id);
        CREATE INDEX IF NOT EXISTS idx_task_activity_log_session_id ON task_activity_log(session_id);
        CREATE INDEX IF NOT EXISTS idx_task_activity_log_timestamp ON task_activity_log(timestamp DESC);

        -- Vector indexes for similarity search
        CREATE INDEX IF NOT EXISTS idx_interactions_embedding ON interactions USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
        CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
      `
    });

    if (indexesError) {
      console.error('Error creating indexes:', indexesError);
      throw indexesError;
    }

    // 11. Enable Row Level Security
    console.log('🔒 Enabling Row Level Security...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
        ALTER TABLE main_tasks ENABLE ROW LEVEL SECURITY;
        ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
        ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
        ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
      throw rlsError;
    }

    // 12. Create RLS policies
    console.log('🔒 Creating RLS policies...');
    const { error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
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

        -- Main tasks policies
        DROP POLICY IF EXISTS "Users can view own main tasks" ON main_tasks;
        CREATE POLICY "Users can view own main tasks" ON main_tasks FOR SELECT USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Users can insert own main tasks" ON main_tasks;
        CREATE POLICY "Users can insert own main tasks" ON main_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Users can update own main tasks" ON main_tasks;
        CREATE POLICY "Users can update own main tasks" ON main_tasks FOR UPDATE USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Users can delete own main tasks" ON main_tasks;
        CREATE POLICY "Users can delete own main tasks" ON main_tasks FOR DELETE USING (auth.uid() = user_id);

        -- Subtasks policies
        DROP POLICY IF EXISTS "Users can view own subtasks" ON subtasks;
        CREATE POLICY "Users can view own subtasks" ON subtasks FOR SELECT USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Users can insert own subtasks" ON subtasks;
        CREATE POLICY "Users can insert own subtasks" ON subtasks FOR INSERT WITH CHECK (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Users can update own subtasks" ON subtasks;
        CREATE POLICY "Users can update own subtasks" ON subtasks FOR UPDATE USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Users can delete own subtasks" ON subtasks;
        CREATE POLICY "Users can delete own subtasks" ON subtasks FOR DELETE USING (auth.uid() = user_id);

        -- Task templates policies
        DROP POLICY IF EXISTS "Users can view own task templates" ON task_templates;
        CREATE POLICY "Users can view own task templates" ON task_templates FOR SELECT USING (auth.uid() = user_id OR is_public = true);
        DROP POLICY IF EXISTS "Users can insert own task templates" ON task_templates;
        CREATE POLICY "Users can insert own task templates" ON task_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Users can update own task templates" ON task_templates;
        CREATE POLICY "Users can update own task templates" ON task_templates FOR UPDATE USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Users can delete own task templates" ON task_templates;
        CREATE POLICY "Users can delete own task templates" ON task_templates FOR DELETE USING (auth.uid() = user_id);

        -- Task activity log policies
        DROP POLICY IF EXISTS "Users can view own task activity log" ON task_activity_log;
        CREATE POLICY "Users can view own task activity log" ON task_activity_log FOR SELECT USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Users can insert own task activity log" ON task_activity_log;
        CREATE POLICY "Users can insert own task activity log" ON task_activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Users can update own task activity log" ON task_activity_log;
        CREATE POLICY "Users can update own task activity log" ON task_activity_log FOR UPDATE USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Users can delete own task activity log" ON task_activity_log;
        CREATE POLICY "Users can delete own task activity log" ON task_activity_log FOR DELETE USING (auth.uid() = user_id);
      `
    });

    if (policiesError) {
      console.error('Error creating RLS policies:', policiesError);
      throw policiesError;
    }

    // 13. Create triggers and functions
    console.log('🔧 Creating triggers and functions...');
    const { error: triggersError } = await supabase.rpc('exec_sql', {
      sql: `
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
        CREATE TRIGGER update_main_tasks_updated_at BEFORE UPDATE ON main_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        CREATE TRIGGER update_subtasks_updated_at BEFORE UPDATE ON subtasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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

        -- Function to update main task progress based on subtasks
        CREATE OR REPLACE FUNCTION update_main_task_progress()
        RETURNS TRIGGER AS $$
        DECLARE
          total_subtasks INTEGER;
          completed_subtasks INTEGER;
          new_progress INTEGER;
        BEGIN
          -- Count total and completed subtasks for the parent task
          SELECT 
            COUNT(*),
            COUNT(*) FILTER (WHERE status = 'completed')
          INTO total_subtasks, completed_subtasks
          FROM subtasks 
          WHERE parent_task_id = COALESCE(NEW.parent_task_id, OLD.parent_task_id);

          -- Calculate progress percentage
          IF total_subtasks > 0 THEN
            new_progress := (completed_subtasks * 100) / total_subtasks;
          ELSE
            new_progress := 0;
          END IF;

          -- Update main task progress
          UPDATE main_tasks 
          SET progress = new_progress,
              updated_at = NOW()
          WHERE id = COALESCE(NEW.parent_task_id, OLD.parent_task_id);

          RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger to automatically update main task progress
        CREATE TRIGGER trigger_update_main_task_progress
          AFTER INSERT OR UPDATE OR DELETE ON subtasks
          FOR EACH ROW EXECUTE FUNCTION update_main_task_progress();
      `
    });

    if (triggersError) {
      console.error('Error creating triggers:', triggersError);
      throw triggersError;
    }

    // 14. Create helper functions
    console.log('🔧 Creating helper functions...');
    const { error: functionsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Function to get main task with all subtasks
        CREATE OR REPLACE FUNCTION get_main_task_with_subtasks(task_uuid UUID)
        RETURNS TABLE (
          main_task JSONB,
          subtasks JSONB
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            to_jsonb(mt.*) as main_task,
            COALESCE(
              (SELECT jsonb_agg(to_jsonb(st.*) ORDER BY st.order_index, st.created_at)
               FROM subtasks st 
               WHERE st.parent_task_id = mt.id), 
              '[]'::jsonb
            ) as subtasks
          FROM main_tasks mt
          WHERE mt.id = task_uuid
          AND mt.user_id = auth.uid();
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Function to get all main tasks with subtask counts
        CREATE OR REPLACE FUNCTION get_main_tasks_with_subtask_counts()
        RETURNS TABLE (
          id UUID,
          title TEXT,
          description TEXT,
          status TEXT,
          priority TEXT,
          category TEXT,
          progress INTEGER,
          total_subtasks INTEGER,
          completed_subtasks INTEGER,
          due_date TIMESTAMPTZ,
          created_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            mt.id,
            mt.title,
            mt.description,
            mt.status,
            mt.priority,
            mt.category,
            mt.progress,
            COALESCE(stats.total_subtasks, 0) as total_subtasks,
            COALESCE(stats.completed_subtasks, 0) as completed_subtasks,
            mt.due_date,
            mt.created_at,
            mt.updated_at
          FROM main_tasks mt
          LEFT JOIN (
            SELECT 
              parent_task_id,
              COUNT(*) as total_subtasks,
              COUNT(*) FILTER (WHERE status = 'completed') as completed_subtasks
            FROM subtasks
            WHERE user_id = auth.uid()
            GROUP BY parent_task_id
          ) stats ON stats.parent_task_id = mt.id
          WHERE mt.user_id = auth.uid()
          ORDER BY mt.created_at DESC;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Function to get tasks by session
        CREATE OR REPLACE FUNCTION get_tasks_by_session(session_uuid UUID)
        RETURNS TABLE (
          main_task JSONB,
          subtasks JSONB
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            to_jsonb(mt.*) as main_task,
            COALESCE(
              (SELECT jsonb_agg(to_jsonb(st.*) ORDER BY st.order_index, st.created_at)
               FROM subtasks st 
               WHERE st.parent_task_id = mt.id), 
              '[]'::jsonb
            ) as subtasks
          FROM main_tasks mt
          WHERE mt.linked_session_id = session_uuid
          AND mt.user_id = auth.uid()
          ORDER BY mt.created_at DESC;
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
          total_main_tasks INTEGER,
          completed_main_tasks INTEGER
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            (SELECT COUNT(*) FROM interactions WHERE user_id = user_uuid) as total_interactions,
            (SELECT COUNT(*) FROM sessions WHERE user_id = user_uuid) as total_sessions,
            (SELECT COUNT(*) FROM memories WHERE user_id = user_uuid) as total_memories,
            (SELECT COUNT(*) FROM main_tasks WHERE user_id = user_uuid) as total_main_tasks,
            (SELECT COUNT(*) FROM main_tasks WHERE user_id = user_uuid AND status = 'completed') as completed_main_tasks;
        END;
        $$;
      `
    });

    if (functionsError) {
      console.error('Error creating helper functions:', functionsError);
      throw functionsError;
    }

    console.log('✅ Database reset completed successfully!');
    console.log('');
    console.log('📋 What was created:');
    console.log('  • Fresh database with hierarchical task structure');
    console.log('  • main_tasks and subtasks tables');
    console.log('  • Automatic progress calculation');
    console.log('  • Session and interaction linking');
    console.log('  • Complete RLS policies and security');
    console.log('  • Helper functions for task management');
    console.log('  • Vector search capabilities for memories');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('  • Your database is now clean and ready for hierarchical tasks');
    console.log('  • Use the TaskExtractionService to create tasks from AI responses');
    console.log('  • Navigate to the HierarchicalTasks page to see the new structure');

  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

// Run reset if called directly
if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase }; 