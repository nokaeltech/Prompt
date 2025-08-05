#!/usr/bin/env node

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://aqeel_user:aqeel_password@localhost:5432/aqeel_db',
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const result = await pool.query('SELECT version()');
    console.log('✅ Database connected successfully!');
    console.log('📊 PostgreSQL version:', result.rows[0].version);
    
    // Test vector extension
    const vectorResult = await pool.query("SELECT * FROM pg_extension WHERE extname = 'vector'");
    if (vectorResult.rows.length > 0) {
      console.log('✅ pgvector extension is installed');
    } else {
      console.log('⚠️  pgvector extension not found');
    }
    
    // Test tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection(); 