# 🧠 Aqeel - AI Memory Assistant

A powerful RAG-powered productivity and planning application that helps you organize, remember, and act on your AI interactions using vector embeddings and semantic search.

## ✨ Features

- **🤖 AI Memory Management** - Store and retrieve AI interactions with semantic search
- **📝 Action Item Extraction** - Automatically extract actionable items from AI responses
- **🔍 Vector Search** - Find relevant content using OpenAI embeddings
- **💾 Dual Storage** - Switch between localStorage and PostgreSQL database
- **📊 Session Management** - Organize conversations by sessions and platforms
- **🎯 Task Planning** - Create, track, and manage action items with priorities
- **🔗 RAG Integration** - Enhanced AI responses with context from your history

## 🏗️ Architecture

```
Frontend (React/Vite) ←→ API Server (Express) ←→ PostgreSQL + pgvector
```

- **Frontend**: React with TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Express.js API server with PostgreSQL
- **Database**: PostgreSQL with pgvector extension for vector similarity search
- **AI**: OpenAI API for embeddings and chat completions
- **Storage**: Dual-mode (localStorage ↔ PostgreSQL)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose
- **OpenAI API key** (optional for full RAG features)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd Aqeel
npm install
npm run server:install
```

### 2. Set Up Environment

```bash
# Create environment files
npm run setup-env
```

Or manually create:

**`.env.local`** (frontend):
```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_API_URL=http://localhost:3001/api
VITE_APP_ENV=development
```

**`server/.env`** (backend):
```env
DATABASE_URL=postgresql://aqeel_user:aqeel_password@localhost:5433/aqeel_db
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

### 3. Start Database

```bash
npm run db:start
```

### 4. Start Application

```bash
# Start both frontend and API server
npm run dev:full
```

Your app is now running at:
- **Frontend**: http://localhost:5173
- **API Server**: http://localhost:3001
- **Database**: PostgreSQL on localhost:5433

## 📚 Available Scripts

### Development
```bash
npm run dev               # Start frontend only
npm run dev:full          # Start both frontend and API server
npm run build             # Build for production
npm run preview           # Preview production build
```

### Database Management
```bash
npm run db:start          # Start PostgreSQL container
npm run db:stop           # Stop PostgreSQL container
npm run db:logs           # View database logs
npm run db:connect        # Connect to database CLI
```

### API Server
```bash
npm run server:install    # Install server dependencies
npm run server:dev        # Start API server in development
npm run server:start      # Start API server in production
npm run server:test       # Test database connection
```

### Setup
```bash
npm run setup-env         # Configure environment variables
npm run setup-db          # Initialize database schema
```

## 🧪 Testing the Integration

1. **Database Connection Test**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Frontend Integration Test**
   - Open http://localhost:5173
   - Navigate to Dashboard
   - Click "Run Database Tests"

3. **RAG Functionality Test**
   - Go to Chat page
   - Send: "I need to finish the project proposal by Friday"
   - Send follow-up: "What deadlines do I have?"
   - Verify AI references your previous message

## 🗄️ Database Schema

The application uses PostgreSQL with the following key tables:

- **`users`** - User accounts and authentication
- **`ai_interactions`** - AI conversation history
- **`sessions`** - Conversation sessions
- **`memories`** - Vector embeddings for semantic search
- **`action_items`** - Extracted actionable items
- **`usage_logs`** - API usage tracking
- **`api_keys`** - User-provided API keys

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_OPENAI_API_KEY` | OpenAI API key for embeddings | Required |
| `VITE_API_URL` | API server URL | `http://localhost:3001/api` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://aqeel_user:aqeel_password@localhost:5433/aqeel_db` |
| `PORT` | API server port | `3001` |

### Database Configuration

The app uses Docker Compose for easy database setup:

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: aqeel_db
      POSTGRES_USER: aqeel_user
      POSTGRES_PASSWORD: aqeel_password
    ports:
      - "5433:5432"
```

## 🚀 Deployment

### Frontend Deployment

```bash
npm run build
# Deploy dist/ folder to your hosting service
```

### API Server Deployment

```bash
# Set production environment variables
export NODE_ENV=production
export DATABASE_URL=your_production_db_url
export OPENAI_API_KEY=your_openai_api_key

npm run server:start
```

### Database Deployment

- Use managed PostgreSQL service (Supabase, AWS RDS, etc.)
- Ensure pgvector extension is installed
- Run the schema migration

## 🔒 Security Considerations

- **Environment Variables**: Never commit API keys to version control
- **CORS**: Configure CORS properly for production
- **Database**: Use strong passwords and SSL connections
- **Rate Limiting**: Implement rate limiting on API endpoints
- **Input Validation**: Validate all API inputs

## 📈 Monitoring

### API Server Health
```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/stats
```

### Database Monitoring
```bash
npm run db:logs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter issues:

1. Check the [troubleshooting guide](TESTING_GUIDE.md)
2. Review the [setup guide](SETUP_GUIDE.md)
3. Check database logs: `npm run db:logs`
4. Check API server logs: `cd server && npm run dev`

## 🎉 Acknowledgments

- **OpenAI** for embeddings and chat completions
- **pgvector** for PostgreSQL vector similarity search
- **React** and **Vite** for the frontend framework
- **Express.js** for the API server
- **Tailwind CSS** for styling

---

Built with ❤️ for better AI productivity
