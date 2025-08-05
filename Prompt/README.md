# Aqeel - AI Memory Assistant

Your personal AI companion that remembers everything you do with AI, so you don't have to.

## Features

- **AI Interaction Tracking**: Automatically save and organize your AI conversations
- **Session Management**: Group related interactions into sessions
- **Memory System**: Intelligent memory storage with semantic search
- **Action Items**: Extract and track actionable items from AI responses
- **Flexible Storage**: Choose between local storage or Supabase cloud database
- **RAG Enhancement**: Use stored memories to enhance AI responses

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Storage Options

### Local Storage (Default)
Data is stored in your browser's localStorage. No setup required.

### Supabase Cloud Storage
For cloud storage and data persistence across devices:

1. Follow the [Supabase Setup Guide](./SUPABASE_SETUP.md)
2. Set up your environment variables
3. Go to Settings → Data Storage → Use Supabase

## Environment Variables

Create a `.env` file in the project root:

```env
# Supabase (optional)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI (optional)
VITE_OPENAI_API_KEY=your_openai_api_key
```
