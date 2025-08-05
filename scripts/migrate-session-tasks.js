const { createClient } = require('@supabase/supabase-js');

// Migration script for session-to-task linking
async function migrateSessionTasks() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🚀 Starting session-to-task migration...');

  try {
    // 1. Create task_activity_log table
    console.log('📋 Creating task_activity_log table...');
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create task_activity_log table for audit trail
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

        -- Create indexes for task_activity_log
        CREATE INDEX IF NOT EXISTS idx_task_activity_log_user_id ON task_activity_log(user_id);
        CREATE INDEX IF NOT EXISTS idx_task_activity_log_task_id ON task_activity_log(task_id);
        CREATE INDEX IF NOT EXISTS idx_task_activity_log_session_id ON task_activity_log(session_id);
        CREATE INDEX IF NOT EXISTS idx_task_activity_log_timestamp ON task_activity_log(timestamp DESC);

        -- Enable RLS
        ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
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

    if (createTableError) {
      console.error('Error creating task_activity_log table:', createTableError);
      throw createTableError;
    }

    // 2. Add source_session_id column to action_items if it doesn't exist
    console.log('🔗 Adding source_session_id column to action_items...');
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add source_session_id column if it doesn't exist
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'action_items' 
            AND column_name = 'source_session_id'
          ) THEN
            ALTER TABLE action_items ADD COLUMN source_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;
          END IF;
        END $$;

        -- Add index for source_session_id
        CREATE INDEX IF NOT EXISTS idx_action_items_source_session_id ON action_items(source_session_id);
      `
    });

    if (addColumnError) {
      console.error('Error adding source_session_id column:', addColumnError);
      throw addColumnError;
    }

    // 3. Add updated_at column to action_items if it doesn't exist
    console.log('⏰ Adding updated_at column to action_items...');
    const { error: addUpdatedAtError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add updated_at column if it doesn't exist
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'action_items' 
            AND column_name = 'updated_at'
          ) THEN
            ALTER TABLE action_items ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
          END IF;
        END $$;

        -- Add trigger for updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_action_items_updated_at ON action_items;
        CREATE TRIGGER update_action_items_updated_at 
          BEFORE UPDATE ON action_items 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (addUpdatedAtError) {
      console.error('Error adding updated_at column:', addUpdatedAtError);
      throw addUpdatedAtError;
    }

    // 4. Create helper functions for session-to-task linking
    console.log('🔧 Creating helper functions...');
    const { error: createFunctionsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Function to get tasks by session
        CREATE OR REPLACE FUNCTION get_tasks_by_session(session_uuid UUID)
        RETURNS TABLE (
          id UUID,
          text TEXT,
          completed BOOLEAN,
          priority TEXT,
          category TEXT,
          due_date TIMESTAMPTZ,
          source_interaction_id UUID,
          source_session_id UUID,
          created_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            ai.id,
            ai.text,
            ai.completed,
            ai.priority,
            ai.category,
            ai.due_date,
            ai.source_interaction_id,
            ai.source_session_id,
            ai.created_at,
            ai.updated_at
          FROM action_items ai
          WHERE ai.source_session_id = session_uuid
          AND ai.user_id = auth.uid()
          ORDER BY ai.created_at DESC;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Function to get task activity log
        CREATE OR REPLACE FUNCTION get_task_activity_log(task_uuid UUID)
        RETURNS TABLE (
          id UUID,
          task_id UUID,
          action TEXT,
          message_id UUID,
          session_id UUID,
          old_value TEXT,
          new_value TEXT,
          metadata JSONB,
          timestamp TIMESTAMPTZ
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            tal.id,
            tal.task_id,
            tal.action,
            tal.message_id,
            tal.session_id,
            tal.old_value,
            tal.new_value,
            tal.metadata,
            tal.timestamp
          FROM task_activity_log tal
          WHERE tal.task_id = task_uuid
          AND tal.user_id = auth.uid()
          ORDER BY tal.timestamp DESC;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    if (createFunctionsError) {
      console.error('Error creating helper functions:', createFunctionsError);
      throw createFunctionsError;
    }

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 What was added:');
    console.log('  • task_activity_log table for audit trail');
    console.log('  • source_session_id column to action_items');
    console.log('  • updated_at column to action_items');
    console.log('  • Helper functions for session-to-task queries');
    console.log('  • Proper indexes and RLS policies');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('  • Update your frontend code to use the new session linking');
    console.log('  • Test creating tasks from sessions');
    console.log('  • Verify the activity log is working');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateSessionTasks();
}

module.exports = { migrateSessionTasks }; 