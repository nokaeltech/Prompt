# PostgreSQL Database Schema for RAG-Powered Productivity App

This directory contains the complete PostgreSQL database schema and related utilities for your RAG-powered productivity application.

## 🗂️ Schema Overview

The database is designed to support:
- **User Management**: Authentication and user profiles
- **Task Management**: Tasks, subtasks, and action items
- **Content Management**: Notes, journals, and long-form content
- **RAG (Retrieval-Augmented Generation)**: Vector embeddings for semantic search
- **Chat History**: Message threads and AI interactions
- **Usage Tracking**: API usage monitoring and cost tracking
- **API Key Management**: Optional BYOK (Bring Your Own Key) support

## 📋 Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User accounts and profiles | Email, name, timestamps |
| `tasks` | Main task items | Status, priority, due dates |
| `subtasks` | Task breakdown items | Linked to parent tasks |
| `notes` | User notes and content | Tags, full-text search |
| `memories` | Vector embeddings for RAG | 1536-dim vectors, similarity search |
| `messages` | Chat message history | Role-based, session-linked |
| `sessions` | Chat session management | Platform, themes, summaries |
| `action_items` | Extracted action items | Priority, categories, due dates |
| `api_keys` | User API key storage | Provider-specific, encrypted |
| `usage_logs` | API usage tracking | Token counting, cost calculation |
| `ai_interactions` | AI interaction history | Platform, model, embeddings |

## 🚀 Quick Start

### 1. Database Setup

#### Option A: Supabase (Recommended)
1. Create a new Supabase project
2. Enable the `vector` extension in your database
3. Run the schema file:

```sql
-- In Supabase SQL Editor
\i database/schema.sql
```

#### Option B: Local PostgreSQL
1. Install PostgreSQL with vector extension
2. Create a new database
3. Run the schema:

```bash
psql -d your_database -f database/schema.sql
```

### 2. Environment Setup

Add these environment variables:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
VITE_OPENAI_API_KEY=your_openai_api_key
```

### 3. Initialize Services

```typescript
import { createClient } from '@supabase/supabase-js';
import { DatabaseService } from './services/database';
import { RAGService } from './services/rag';
import OpenAI from 'openai';

// Initialize Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Initialize services
const db = new DatabaseService(supabase);
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY
});
const rag = new RAGService(openai, db);
```

## 🔧 Core Features

### Task Management

```typescript
// Create a task
const task = await db.createTask({
  user_id: userId,
  title: "Complete project proposal",
  description: "Write up the Q4 project proposal",
  priority: "high",
  due_date: "2024-01-15"
});

// Get user's tasks
const tasks = await db.getTasks(userId);

// Update task status
await db.updateTask(taskId, { status: "in_progress" });
```

### RAG Operations

```typescript
// Create a memory with embedding
const memory = await rag.createMemory(
  userId,
  "I need to finish the project proposal by Friday",
  "note",
  noteId,
  ["work", "deadline"]
);

// Search memories semantically
const results = await rag.searchMemories(
  userId,
  "What deadlines do I have?",
  0.7, // similarity threshold
  5    // max results
);

// Generate RAG-enhanced response
const response = await rag.generateRAGResponse(
  userId,
  "What should I work on today?",
  "You are a helpful productivity assistant."
);
```

### Usage Tracking

```typescript
// Check daily usage limits
const limits = await rag.checkUsageLimits(userId, 100000);

// Get usage statistics
const stats = await rag.getDailyUsageStats(userId);
console.log(`Used ${stats.totalTokens} tokens today`);
```

## 🧠 RAG Implementation Details

### Vector Similarity Search

The database uses PostgreSQL's `pgvector` extension for efficient similarity search:

```sql
-- Search memories by similarity
SELECT * FROM memories
WHERE user_id = $1
  AND embedding IS NOT NULL
  AND 1 - (embedding <=> $2) > $3
ORDER BY embedding <=> $2
LIMIT $4;
```

### Memory Creation Pipeline

1. **Content Processing**: Extract meaningful content from user input
2. **Embedding Generation**: Convert text to 1536-dimensional vectors
3. **Storage**: Store content + embedding in `memories` table
4. **Indexing**: Automatic indexing for fast similarity search

### Context Retrieval

When a user asks a question:
1. Generate embedding for the query
2. Find similar memories using cosine similarity
3. Retrieve top-k most relevant memories
4. Include context in AI prompt
5. Generate enhanced response

## 📊 Performance Optimizations

### Indexes
- **Vector Index**: `ivfflat` index on embeddings for fast similarity search
- **Full-text Search**: GIN indexes on content fields
- **Foreign Keys**: Indexes on all foreign key columns
- **Timestamps**: Indexes on created_at for efficient sorting

### Query Optimization
- **Row Level Security**: Automatic data isolation per user
- **Batch Operations**: Efficient bulk memory creation
- **Connection Pooling**: Supabase handles connection management

## 🔒 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with user-specific policies:

```sql
-- Example policy for tasks
CREATE POLICY "Users can view own tasks" 
ON tasks FOR SELECT 
USING (auth.uid() = user_id);
```

### API Key Management
- Optional BYOK (Bring Your Own Key) support
- Encrypted storage of user API keys
- Provider-specific key management

## 📈 Usage Monitoring

### Cost Tracking
- Automatic token counting
- Cost calculation based on model
- Daily usage aggregation
- Usage limit enforcement

### Analytics
- Request frequency tracking
- Model usage distribution
- Cost breakdown by purpose
- User engagement metrics

## 🔄 Migration from Local Storage

If you're migrating from the existing localStorage-based app:

```typescript
// Migration helper
async function migrateFromLocalStorage(userId: string) {
  const storage = new StorageManager();
  
  // Migrate interactions
  const interactions = storage.getInteractions();
  for (const interaction of interactions) {
    await db.createAiInteraction({
      user_id: userId,
      prompt: interaction.prompt,
      response: interaction.response,
      platform: interaction.platform,
      model: interaction.model,
      timestamp: interaction.timestamp,
      tags: interaction.tags,
      summary: interaction.summary
    });
  }
  
  // Create memories from interactions
  const memoryData = interactions.map(interaction => ({
    content: `${interaction.prompt}\n${interaction.response}`,
    sourceType: 'interaction' as const,
    sourceId: interaction.id,
    tags: interaction.tags
  }));
  
  await rag.createMemoriesFromData(userId, memoryData);
}
```

## 🛠️ Development Tools

### Database Functions

The schema includes several helper functions:

- `search_memories()`: Semantic search with similarity threshold
- `get_daily_usage()`: Daily usage aggregation
- `update_updated_at_column()`: Automatic timestamp updates

### TypeScript Integration

Full TypeScript support with:
- Database types matching schema
- Insert/Update type helpers
- Service layer with type safety
- Error handling and validation

## 🚀 Production Considerations

### Scaling
- **Vector Search**: Optimize `ivfflat` index parameters for your data size
- **Connection Pooling**: Configure appropriate pool sizes
- **Caching**: Consider Redis for frequently accessed data
- **CDN**: Use Supabase's global CDN for static assets

### Monitoring
- Set up alerts for usage limits
- Monitor vector search performance
- Track API response times
- Monitor database connection health

### Backup & Recovery
- Enable Supabase point-in-time recovery
- Regular database backups
- Test restore procedures
- Document disaster recovery plan

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🤝 Contributing

When modifying the schema:
1. Create a migration file for changes
2. Update TypeScript types
3. Test with sample data
4. Update documentation
5. Consider backward compatibility

---

This database schema provides a solid foundation for your RAG-powered productivity app with enterprise-grade features for security, performance, and scalability. 