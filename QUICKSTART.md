# 🚀 Quick Start Guide - Local Database Setup

Get your RAG-powered productivity app running with a local PostgreSQL database in minutes!

## 📋 Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js** 18+ and npm/yarn
- **OpenAI API key** (for RAG functionality)

## ⚡ Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Database Setup

```bash
npm run setup-db
```

This script will:
- ✅ Start PostgreSQL container with pgvector extension
- ✅ Create database and user
- ✅ Run the complete schema
- ✅ Install required npm packages
- ✅ Create `.env.local` file
- ✅ Test the connection

### 3. Configure Environment

Edit `.env.local` and add your OpenAI API key:

```env
VITE_OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### 4. Start Development Server

```bash
npm run dev
```

Your app is now running with a local PostgreSQL database! 🎉

## 🔧 Database Management

### Start/Stop Database

```bash
# Start database
npm run db:start

# Stop database
npm run db:stop

# View logs
npm run db:logs
```

### Connect to Database

```bash
# Connect via command line
npm run db:connect

# Or use any PostgreSQL client with:
# Host: localhost
# Port: 5432
# Database: aqeel_db
# Username: aqeel_user
# Password: aqeel_password
```

## 🧠 Using RAG in Your App

### Initialize Services

```typescript
import { initializeServices, testDatabaseConnection } from './services';

// Initialize services
const { dbService, ragService } = initializeServices();

// Test connection
const isConnected = await testDatabaseConnection();
console.log('Database connected:', isConnected);
```

### Create a Memory

```typescript
// Create a memory with embedding
const memory = await ragService.createMemory(
  'user123',
  'I need to finish the project proposal by Friday',
  'note',
  'note123',
  ['work', 'deadline']
);
```

### Search Memories

```typescript
// Search for relevant memories
const results = await ragService.searchMemories(
  'user123',
  'What deadlines do I have?',
  0.7, // similarity threshold
  5    // max results
);
```

### Generate RAG Response

```typescript
// Get AI response with context
const response = await ragService.generateRAGResponse(
  'user123',
  'What should I work on today?',
  'You are a helpful productivity assistant.'
);

console.log(response.response);
console.log('Context used:', response.context.memories.length, 'memories');
```

## 📊 Database Schema

Your database includes these tables:

- **`users`** - User accounts
- **`tasks`** - Main tasks with priorities and due dates
- **`subtasks`** - Task breakdown items
- **`notes`** - User notes and content
- **`memories`** - Vector embeddings for RAG
- **`sessions`** - Chat session management
- **`messages`** - Chat message history
- **`action_items`** - Extracted action items
- **`api_keys`** - User API key storage
- **`usage_logs`** - API usage tracking
- **`ai_interactions`** - AI interaction history

## 🔄 Migration from localStorage

If you have existing data in localStorage:

```typescript
import { MigrationService } from './utils/migration';

const migration = new MigrationService(dbService, ragService);

// Migrate all data
const result = await migration.migrateAllData('user123');
console.log(`Migrated ${result.interactions} interactions`);

// Verify migration
const verification = await migration.verifyMigration('user123');
console.log('Migration successful:', verification.matches);
```

## 🛠️ Troubleshooting

### Database Connection Issues

```bash
# Check if container is running
docker ps

# View container logs
npm run db:logs

# Restart container
npm run db:stop && npm run db:start
```

### Schema Issues

```bash
# Re-run schema
docker exec -i aqeel-postgres psql -U aqeel_user -d aqeel_db < database/schema.sql
```

### Permission Issues

```bash
# Check database permissions
docker exec -it aqeel-postgres psql -U aqeel_user -d aqeel_db -c "\du"
```

## 📈 Next Steps

1. **Explore the RAG features** - Try creating memories and searching them
2. **Add task management** - Create and manage tasks with the database
3. **Implement usage tracking** - Monitor API usage and costs
4. **Add user authentication** - Implement user management
5. **Scale up** - Consider moving to Supabase for production

## 🆘 Need Help?

- Check the [database README](database/README.md) for detailed documentation
- Review the [local setup guide](database/local-setup.md) for advanced configuration
- Check the [schema file](database/schema.sql) for database structure

---

Your local RAG-powered productivity app is ready to use! 🎉 