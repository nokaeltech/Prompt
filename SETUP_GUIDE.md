# 🚀 Complete Setup Guide - Frontend + API Server

This guide will help you set up the complete RAG-powered productivity app with a frontend and API server architecture.

## 📋 Architecture Overview

```
┌─────────────────┐    HTTP/API    ┌─────────────────┐    SQL    ┌─────────────────┐
│   Frontend      │ ──────────────► │   API Server    │ ─────────► │   PostgreSQL    │
│   (React/Vite)  │                │   (Express)     │           │   + pgvector    │
└─────────────────┘                └─────────────────┘           └─────────────────┘
```

## 🛠️ Prerequisites

- **Docker** and **Docker Compose**
- **Node.js** 18+ and npm
- **OpenAI API key**

## ⚡ Quick Setup (10 minutes)

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install API server dependencies
npm run server:install
```

### 2. Set Up Database

```bash
# Start PostgreSQL with pgvector
npm run setup-db
```

### 3. Configure Environment

Create `.env.local` in the root directory:
```env
# Frontend Environment
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_API_URL=http://localhost:3001/api

# App Configuration
VITE_APP_ENV=development
```

Create `.env` in the `server` directory:
```env
# Database Configuration
DATABASE_URL=postgresql://aqeel_user:aqeel_password@localhost:5432/aqeel_db

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3001
```

### 4. Start Everything

```bash
# Start both frontend and API server
npm run dev:full
```

Your app is now running at:
- **Frontend**: http://localhost:5173
- **API Server**: http://localhost:3001
- **Database**: PostgreSQL on localhost:5432

## 🔧 Manual Setup Steps

### Step 1: Database Setup

```bash
# Start PostgreSQL container
npm run db:start

# Wait for database to be ready
npm run db:logs

# Test database connection
npm run server:test
```

### Step 2: API Server Setup

```bash
# Install server dependencies
npm run server:install

# Test server database connection
npm run server:test

# Start API server in development mode
npm run server:dev
```

### Step 3: Frontend Setup

```bash
# Start frontend development server
npm run dev
```

## 🧪 Testing the Setup

### 1. Database Connection Test

```bash
# Test database connection
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected"
}
```

### 2. Frontend Integration Test

1. Open http://localhost:5173
2. Navigate to Dashboard
3. Look for "Database Test" component
4. Click "Run Database Tests"
5. Verify all tests pass

### 3. RAG Functionality Test

1. Go to Chat page
2. Send a message: "I need to finish the project proposal by Friday"
3. Send follow-up: "What deadlines do I have?"
4. Verify AI references your previous message

## 📊 Available Scripts

### Database Management
```bash
npm run db:start          # Start PostgreSQL container
npm run db:stop           # Stop PostgreSQL container
npm run db:logs           # View database logs
npm run db:connect        # Connect to database CLI
```

### API Server Management
```bash
npm run server:install    # Install server dependencies
npm run server:dev        # Start API server in development
npm run server:start      # Start API server in production
npm run server:test       # Test database connection
```

### Development
```bash
npm run dev               # Start frontend only
npm run dev:full          # Start both frontend and API server
npm run build             # Build frontend for production
```

## 🔍 Troubleshooting

### Database Connection Issues

**Problem:** API server can't connect to database

**Solutions:**
```bash
# 1. Check if database is running
docker ps

# 2. Restart database
npm run db:stop && npm run db:start

# 3. Test connection
npm run server:test

# 4. Check environment variables
cat server/.env
```

### API Server Issues

**Problem:** Frontend can't connect to API server

**Solutions:**
```bash
# 1. Check if API server is running
curl http://localhost:3001/api/health

# 2. Start API server
npm run server:dev

# 3. Check server logs
cd server && npm run dev

# 4. Verify environment variables
cat .env.local
```

### Frontend Issues

**Problem:** App shows "Database Disconnected"

**Solutions:**
1. Ensure API server is running on port 3001
2. Check `VITE_API_URL` in `.env.local`
3. Verify CORS is enabled on API server
4. Check browser console for errors

## 🚀 Production Deployment

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to your hosting service (Vercel, Netlify, etc.)
```

### API Server Deployment
```bash
# Set production environment variables
export NODE_ENV=production
export DATABASE_URL=your_production_db_url
export OPENAI_API_KEY=your_openai_api_key

# Start production server
npm run server:start
```

### Database Deployment
- Use managed PostgreSQL service (Supabase, AWS RDS, etc.)
- Ensure pgvector extension is installed
- Run the schema migration

## 📈 Monitoring

### API Server Health
```bash
# Check server status
curl http://localhost:3001/api/health

# Check database stats
curl http://localhost:3001/api/stats
```

### Database Monitoring
```bash
# View database logs
npm run db:logs

# Check connection pool
curl http://localhost:3001/api/stats
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit API keys to version control
2. **CORS**: Configure CORS properly for production
3. **Database**: Use strong passwords and SSL connections
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Input Validation**: Validate all API inputs

## 📚 API Endpoints

### Health & Status
- `GET /api/health` - Server health check
- `GET /api/stats` - Database statistics

### Tasks
- `GET /api/tasks?userId=...` - Get user tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Action Items
- `GET /api/action-items?userId=...` - Get user action items
- `POST /api/action-items` - Create action item
- `PUT /api/action-items/:id` - Update action item
- `DELETE /api/action-items/:id` - Delete action item

### Sessions
- `GET /api/sessions?userId=...` - Get user sessions
- `POST /api/sessions` - Create session

### AI Interactions
- `GET /api/ai-interactions?userId=...` - Get user interactions
- `POST /api/ai-interactions` - Create interaction

### Memories (RAG)
- `GET /api/memories?userId=...&sourceType=...` - Get memories
- `POST /api/memories` - Create memory
- `POST /api/memories/search` - Search memories with embeddings

### Usage Logs
- `GET /api/usage-logs/daily?userId=...&date=...` - Get daily usage
- `POST /api/usage-logs` - Log usage

## 🎉 Success Criteria

Your setup is working correctly when:

- ✅ Database health check returns "connected"
- ✅ API server responds to requests
- ✅ Frontend shows "Database Connected" (green)
- ✅ Database tests pass
- ✅ RAG context is used in AI responses
- ✅ Data persists between page refreshes
- ✅ Action items are extracted and saved

## 🆘 Getting Help

If you encounter issues:

1. **Check the troubleshooting section above**
2. **Review server logs**: `cd server && npm run dev`
3. **Check database logs**: `npm run db:logs`
4. **Verify environment variables**
5. **Test API endpoints directly**: `curl http://localhost:3001/api/health`

---

Your RAG-powered productivity app is now fully functional with a proper frontend/backend architecture! 🎉 