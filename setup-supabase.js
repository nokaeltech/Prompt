#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Supabase Setup for Aqeel RAG App\n');

const envPath = path.join(__dirname, '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('📁 Found existing .env.local file');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if the file contains actual values (not placeholders)
  if (envContent.includes('VITE_SUPABASE_URL') && 
      !envContent.includes('your_supabase_project_url_here')) {
    console.log('✅ Supabase environment variables are already configured');
    console.log('\nTo update your Supabase configuration:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to Settings → API');
    console.log('3. Copy the Project URL and anon public key');
    console.log('4. Update your .env.local file');
    process.exit(0);
  } else {
    console.log('⚠️  Found placeholder values in .env.local file');
    console.log('📝 You need to replace the placeholder values with your actual Supabase credentials');
  }
}

console.log('📝 Setting up Supabase environment variables...\n');

console.log('To complete the setup, you need to:');
console.log('1. Create a Supabase project at https://supabase.com');
console.log('2. Get your project credentials from Settings → API');
console.log('3. Update the .env.local file with your credentials\n');

const envTemplate = `# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration (optional for full RAG features)
VITE_OPENAI_API_KEY=your_openai_api_key_here
`;

if (!envExists) {
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env.local file with template');
} else {
  console.log('📝 Updating existing .env.local file...');
  const currentContent = fs.readFileSync(envPath, 'utf8');
  const updatedContent = currentContent + '\n' + envTemplate;
  fs.writeFileSync(envPath, updatedContent);
}

console.log('\n📋 Next steps:');
console.log('1. Replace the placeholder values in .env.local with your actual credentials');
console.log('2. Follow the Supabase Setup Guide: SUPABASE_SETUP.md');
console.log('3. Run the database schema in your Supabase SQL Editor');
console.log('4. Start the app with: npm run dev\n');

console.log('🔗 Useful links:');
console.log('- Supabase Dashboard: https://supabase.com/dashboard');
console.log('- Setup Guide: SUPABASE_SETUP.md');
console.log('- Database Schema: See SUPABASE_SETUP.md for SQL commands\n');

console.log('🎉 Setup complete! Update your .env.local file and you\'re ready to go!'); 