import { Pool, neonConfig } from '@neondatabase/serverless';
import dotenv from "dotenv";
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
dotenv.config();

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

// Test database connection
export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Initialize database tables if they don't exist
export async function initializeDatabase() {
  try {
    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'work_items')
    `);

    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log('📊 Existing tables:', existingTables);

    if (!existingTables.includes('users') || !existingTables.includes('work_items')) {
      console.log('🔧 Creating missing tables...');

      // Create users table if it doesn't exist
      if (!existingTables.includes('users')) {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            password TEXT,
            gmail_token TEXT,
            slack_token TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('✅ Users table created');
      }

      // Create work_items table if it doesn't exist
      if (!existingTables.includes('work_items')) {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS work_items (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            source_type TEXT NOT NULL,
            source_id TEXT NOT NULL,
            source_url TEXT,
            source_date TIMESTAMP,
            classification TEXT NOT NULL,
            summary TEXT NOT NULL,
            action_items JSONB DEFAULT '[]',
            sentiment TEXT,
            urgency_score INTEGER,
            effort_estimate TEXT,
            deadline TEXT,
            context_tags JSONB,
            stakeholders JSONB,
            business_impact TEXT,
            follow_up_needed BOOLEAN DEFAULT FALSE,
            is_completed BOOLEAN DEFAULT FALSE,
            is_snoozed BOOLEAN DEFAULT FALSE,
            snooze_until TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('✅ Work items table created');
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}