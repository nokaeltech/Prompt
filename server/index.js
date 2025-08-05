import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://aqeel_user:aqeel_password@localhost:5432/aqeel_db',
});

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    res.json({
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingConnections: pool.waitingCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tasks endpoints
app.get('/api/tasks', async (req, res) => {
  try {
    const { userId } = req.query;
    const { rows } = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { user_id, title, description, status, priority, due_date } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO tasks (user_id, title, description, status, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, title, description, status, priority, due_date]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Action items endpoints
app.get('/api/action-items', async (req, res) => {
  try {
    const { userId } = req.query;
    const { rows } = await pool.query(
      'SELECT * FROM action_items WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/action-items', async (req, res) => {
  try {
    const { user_id, text, completed, priority, category, due_date, source_interaction_id, source_session_id } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO action_items (user_id, text, completed, priority, category, due_date, source_interaction_id, source_session_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user_id, text, completed, priority, category, due_date, source_interaction_id, source_session_id]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/action-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.values(updates);
    const { rows } = await pool.query(
      `UPDATE action_items SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/action-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM action_items WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sessions endpoints
app.get('/api/sessions', async (req, res) => {
  try {
    const { userId } = req.query;
    const { rows } = await pool.query(
      'SELECT * FROM sessions WHERE user_id = $1 ORDER BY start_time DESC',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const { user_id, title, platform, start_time, end_time, summary, themes, total_interactions } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO sessions (user_id, title, platform, start_time, end_time, summary, themes, total_interactions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user_id, title, platform, start_time, end_time, summary, themes, total_interactions]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Interactions endpoints
app.get('/api/ai-interactions', async (req, res) => {
  try {
    const { userId } = req.query;
    const { rows } = await pool.query(
      'SELECT * FROM ai_interactions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai-interactions', async (req, res) => {
  try {
    const { user_id, session_id, prompt, response, platform, model, timestamp, tags, summary, embedding, tokens_used } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO ai_interactions (user_id, session_id, prompt, response, platform, model, timestamp, tags, summary, embedding, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [user_id, session_id, prompt, response, platform, model, timestamp, tags, summary, embedding, tokens_used]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Memories endpoints
app.get('/api/memories', async (req, res) => {
  try {
    const { userId, sourceType } = req.query;
    let query = 'SELECT * FROM memories WHERE user_id = $1';
    let params = [userId];
    
    if (sourceType) {
      query += ' AND source_type = $2';
      params.push(sourceType);
    }
    
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/memories', async (req, res) => {
  try {
    const { user_id, content, embedding, source_type, source_id, tags } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO memories (user_id, content, embedding, source_type, source_id, tags)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, content, embedding, source_type, source_id, tags]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Memory search endpoint
app.post('/api/memories/search', async (req, res) => {
  try {
    const { userId, queryEmbedding, threshold, limit } = req.body;
    const { rows } = await pool.query(
      `SELECT 
        id,
        content,
        source_type,
        source_id,
        1 - (embedding <=> $2) as similarity
       FROM memories
       WHERE user_id = $1
         AND embedding IS NOT NULL
         AND 1 - (embedding <=> $2) > $3
       ORDER BY embedding <=> $2
       LIMIT $4`,
      [userId, queryEmbedding, threshold, limit]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Usage logs endpoints
app.get('/api/usage-logs/daily', async (req, res) => {
  try {
    const { userId, date } = req.query;
    const { rows } = await pool.query(
      `SELECT 
        COALESCE(SUM(tokens_used), 0) as total_tokens,
        COALESCE(SUM(request_count), 0) as total_requests,
        COALESCE(SUM(cost_usd), 0) as total_cost
       FROM usage_logs
       WHERE user_id = $1 AND DATE(created_at) = $2`,
      [userId, date]
    );
    res.json(rows[0] || { total_tokens: 0, total_requests: 0, total_cost: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/usage-logs', async (req, res) => {
  try {
    const { user_id, tokens_used, request_count, purpose, model, cost_usd } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO usage_logs (user_id, tokens_used, request_count, purpose, model, cost_usd)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, tokens_used, request_count, purpose, model, cost_usd]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 API server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
}); 