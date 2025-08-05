# Local PostgreSQL Database Setup

This guide will help you set up a local PostgreSQL database with the `pgvector` extension for your RAG-powered productivity app.

## 🚀 Quick Setup

### Prerequisites

1. **PostgreSQL 12+** installed on your system
2. **pgvector extension** installed
3. **Node.js** and npm/yarn for running the setup scripts

### Option 1: Docker (Recommended)

The easiest way to get started is using Docker with the official PostgreSQL image that includes pgvector.

#### 1. Create Docker Compose File

Create a `docker-compose.yml` file in your project root:

```yaml
version: '3.8'
services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: aqeel-postgres
    environment:
      POSTGRES_DB: aqeel_db
      POSTGRES_USER: aqeel_user
      POSTGRES_PASSWORD: aqeel_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 2. Create Database Initialization Script

Create `database/init.sql`:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create database user with permissions
CREATE USER aqeel_user WITH PASSWORD 'aqeel_password';
GRANT ALL PRIVILEGES ON DATABASE aqeel_db TO aqeel_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO aqeel_user;
```

#### 3. Start the Database

```bash
# Start the database
docker-compose up -d

# Check if it's running
docker-compose ps

# View logs
docker-compose logs postgres
```

#### 4. Run the Schema

```bash
# Connect to the database and run the schema
docker exec -i aqeel-postgres psql -U aqeel_user -d aqeel_db < database/schema.sql
```

### Option 2: Local PostgreSQL Installation

If you prefer to install PostgreSQL locally:

#### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

#### 2. Install pgvector Extension

**macOS:**
```bash
brew install pgvector
```

**Ubuntu/Debian:**
```bash
sudo apt install postgresql-16-pgvector
```

**From Source:**
```bash
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

#### 3. Create Database and User

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE aqeel_db;
CREATE USER aqeel_user WITH PASSWORD 'aqeel_password';
GRANT ALL PRIVILEGES ON DATABASE aqeel_db TO aqeel_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO aqeel_user;
\q
```

#### 4. Run the Schema

```bash
# Run the schema file
psql -U aqeel_user -d aqeel_db -f database/schema.sql
```

## 🔧 Environment Configuration

### 1. Create Environment File

Create `.env.local` in your project root:

```env
# Database Configuration
VITE_DATABASE_URL=postgresql://aqeel_user:aqeel_password@localhost:5432/aqeel_db

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key

# App Configuration
VITE_APP_ENV=development
```

### 2. Update Database Connection

Since you're using a local database instead of Supabase, you'll need to use a PostgreSQL client directly. Let me create a local database service for you.

## 🛠️ Local Database Service

I'll create a local database service that uses `pg` (node-postgres) instead of Supabase:

### Install Dependencies

```bash
npm install pg @types/pg
```

### Create Local Database Service

The local database service will be created in the next step to replace the Supabase-specific implementation.

## 📊 Database Management

### Useful Commands

```bash
# Connect to database
psql -U aqeel_user -d aqeel_db

# List tables
\dt

# View table structure
\d table_name

# Check extensions
\dx

# Exit
\q
```

### Backup and Restore

```bash
# Backup database
pg_dump -U aqeel_user -d aqeel_db > backup.sql

# Restore database
psql -U aqeel_user -d aqeel_db < backup.sql
```

## 🔍 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if PostgreSQL is running
   - Verify port 5432 is not blocked
   - Check firewall settings

2. **pgvector Extension Not Found**
   - Ensure pgvector is properly installed
   - Restart PostgreSQL after installation
   - Check PostgreSQL version compatibility

3. **Permission Denied**
   - Verify user permissions
   - Check database ownership
   - Ensure proper grants are set

### Debug Commands

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Check if pgvector is installed
psql -U aqeel_user -d aqeel_db -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

## 🚀 Next Steps

1. **Choose your setup method** (Docker recommended)
2. **Run the setup commands** above
3. **Configure environment variables**
4. **Test the database connection**
5. **Run the migration** from localStorage to database

Once you've completed the local database setup, I can help you create the local database service that will replace the Supabase-specific implementation in your app. 