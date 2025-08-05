-- Database initialization script for Aqeel RAG app
-- This script runs automatically when the Docker container starts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Grant permissions to the user
GRANT ALL PRIVILEGES ON SCHEMA public TO aqeel_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aqeel_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aqeel_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aqeel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO aqeel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO aqeel_user; 