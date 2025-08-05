#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Setting up environment variables...\n');

// Check if .env.local exists
const envLocalPath = path.join(__dirname, '.env.local');
const serverEnvPath = path.join(__dirname, 'server', '.env');

let envLocalContent = '';
let serverEnvContent = '';

// Read existing .env.local if it exists
if (fs.existsSync(envLocalPath)) {
  envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
  console.log('✅ Found existing .env.local');
} else {
  console.log('📝 Creating new .env.local');
}

// Read existing server/.env if it exists
if (fs.existsSync(serverEnvPath)) {
  serverEnvContent = fs.readFileSync(serverEnvPath, 'utf8');
  console.log('✅ Found existing server/.env');
} else {
  console.log('📝 Creating new server/.env');
}

// Get OpenAI API key from user
import readline from 'readline';
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('🔑 Enter your OpenAI API key (or press Enter to skip): ', (apiKey) => {
  rl.close();
  
  // Update .env.local
  if (apiKey.trim()) {
    const newEnvLocalContent = `# Frontend Environment
VITE_OPENAI_API_KEY=${apiKey.trim()}
VITE_API_URL=http://localhost:3001/api

# App Configuration
VITE_APP_ENV=development
`;

    fs.writeFileSync(envLocalPath, newEnvLocalContent);
    console.log('✅ Updated .env.local with OpenAI API key');
  } else {
    const newEnvLocalContent = `# Frontend Environment
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_API_URL=http://localhost:3001/api

# App Configuration
VITE_APP_ENV=development
`;

    fs.writeFileSync(envLocalPath, newEnvLocalContent);
    console.log('⚠️  Created .env.local without API key (you can add it later)');
  }

  // Update server/.env
  const newServerEnvContent = `# Database Configuration
DATABASE_URL=postgresql://aqeel_user:aqeel_password@localhost:5432/aqeel_db

# OpenAI Configuration
OPENAI_API_KEY=${apiKey.trim() || 'your_openai_api_key_here'}

# Server Configuration
PORT=3001
`;

  fs.writeFileSync(serverEnvPath, newServerEnvContent);
  console.log('✅ Updated server/.env');

  console.log('\n🎉 Environment setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. If you didn\'t provide an API key, edit .env.local and server/.env');
  console.log('2. Start the database: npm run db:start');
  console.log('3. Install server dependencies: npm run server:install');
  console.log('4. Start everything: npm run dev:full');
  console.log('\n💡 You can get an OpenAI API key from: https://platform.openai.com/api-keys');
}); 