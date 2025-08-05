#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up local PostgreSQL database for Aqeel RAG app...\n');

// Check if Docker is installed
function checkDocker() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if Docker Compose is installed
function checkDockerCompose() {
  try {
    execSync('docker-compose --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if PostgreSQL client is installed
function checkPsql() {
  try {
    execSync('psql --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Start Docker container
function startDockerContainer() {
  console.log('🐳 Starting PostgreSQL container with pgvector...');
  try {
    execSync('docker-compose up -d', { stdio: 'inherit' });
    console.log('✅ PostgreSQL container started successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to start Docker container:', error.message);
    return false;
  }
}

// Wait for database to be ready
function waitForDatabase() {
  console.log('⏳ Waiting for database to be ready...');
  let attempts = 0;
  const maxAttempts = 30;
  
  return new Promise((resolve, reject) => {
    const checkConnection = () => {
      attempts++;
      try {
        execSync('docker exec aqeel-postgres pg_isready -U aqeel_user -d aqeel_db', { stdio: 'ignore' });
        console.log('✅ Database is ready!');
        resolve(true);
      } catch (error) {
        if (attempts >= maxAttempts) {
          reject(new Error('Database failed to start within timeout'));
          return;
        }
        console.log(`⏳ Attempt ${attempts}/${maxAttempts} - Database not ready yet...`);
        setTimeout(checkConnection, 2000);
      }
    };
    checkConnection();
  });
}

// Run schema file
function runSchema() {
  console.log('📋 Running database schema...');
  try {
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema file not found');
    }
    
    execSync(`docker exec -i aqeel-postgres psql -U aqeel_user -d aqeel_db < ${schemaPath}`, { stdio: 'inherit' });
    console.log('✅ Database schema applied successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to run schema:', error.message);
    return false;
  }
}

// Create environment file
function createEnvFile() {
  console.log('📝 Creating environment file...');
  const envContent = `# Database Configuration
VITE_DATABASE_URL=postgresql://aqeel_user:aqeel_password@localhost:5432/aqeel_db

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# App Configuration
VITE_APP_ENV=development
`;

  const envPath = path.join(__dirname, '..', '.env.local');
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Environment file created at .env.local');
  console.log('⚠️  Please update VITE_OPENAI_API_KEY with your actual API key');
}

// Install npm dependencies
function installDependencies() {
  console.log('📦 Installing npm dependencies...');
  try {
    execSync('npm install pg @types/pg', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    return false;
  }
}

// Test database connection
function testConnection() {
  console.log('🔍 Testing database connection...');
  try {
    execSync('docker exec aqeel-postgres psql -U aqeel_user -d aqeel_db -c "SELECT version();"', { stdio: 'inherit' });
    console.log('✅ Database connection test successful!');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

// Main setup function
async function setup() {
  try {
    // Check prerequisites
    console.log('🔍 Checking prerequisites...');
    
    if (!checkDocker()) {
      console.error('❌ Docker is not installed. Please install Docker first.');
      process.exit(1);
    }
    
    if (!checkDockerCompose()) {
      console.error('❌ Docker Compose is not installed. Please install Docker Compose first.');
      process.exit(1);
    }
    
    console.log('✅ Prerequisites check passed!\n');

    // Start container
    if (!startDockerContainer()) {
      process.exit(1);
    }

    // Wait for database
    await waitForDatabase();

    // Run schema
    if (!runSchema()) {
      process.exit(1);
    }

    // Test connection
    if (!testConnection()) {
      process.exit(1);
    }

    // Install dependencies
    installDependencies();

    // Create environment file
    createEnvFile();

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update .env.local with your OpenAI API key');
    console.log('2. Start your development server: npm run dev');
    console.log('3. Test the database connection in your app');
    
    console.log('\n🔧 Useful commands:');
    console.log('- View logs: docker-compose logs postgres');
    console.log('- Stop database: docker-compose down');
    console.log('- Connect to database: docker exec -it aqeel-postgres psql -U aqeel_user -d aqeel_db');
    console.log('- Backup database: docker exec aqeel-postgres pg_dump -U aqeel_user aqeel_db > backup.sql');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setup(); 