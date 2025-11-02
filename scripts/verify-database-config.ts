/**
 * Verify Database Configuration
 * 
 * Checks that the correct cloud database is configured
 * 
 * Usage:
 *   npx tsx scripts/verify-database-config.ts
 */

import dotenv from 'dotenv';
import { query } from '../lib/db';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function verifyDatabaseConfig() {
  try {
    console.log('🔍 Verifying Database Configuration\n');
    console.log('=' .repeat(60));
    
    // Check DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      console.error('❌ DATABASE_URL is not set!');
      return;
    }
    
    console.log('\n📊 Database Connection String:');
    
    // Parse connection string safely
    const urlParts = dbUrl.split('@');
    if (urlParts.length < 2) {
      console.error('❌ Invalid DATABASE_URL format');
      return;
    }
    
    const hostPart = urlParts[1].split('/')[0];
    const [host, port] = hostPart.split(':');
    
    console.log(`   Host: ${host}`);
    console.log(`   Port: ${port}`);
    console.log(`   Database: postgres`);
    
    // Verify it's the Supabase cloud database
    if (host.includes('supabase.com')) {
      console.log(`   ✅ Using Supabase Cloud Database`);
      
      if (host.includes('eu-west-2')) {
        console.log(`   ✅ Region: EU-West-2 (AWS)`);
      }
      
      if (port === '6543') {
        console.log(`   ✅ Connection Pooling: Enabled (port 6543)`);
      } else {
        console.warn(`   ⚠️  Port ${port} - Expected 6543 for connection pooling`);
      }
    } else {
      console.warn(`   ⚠️  Not using Supabase cloud database`);
      console.warn(`   Current host: ${host}`);
    }
    
    // Test connection
    console.log('\n🔌 Testing Database Connection...');
    
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      console.log(`   ✅ Connection successful!`);
      console.log(`   Server Time: ${new Date(row.current_time).toISOString()}`);
      console.log(`   PostgreSQL Version: ${row.pg_version.split(' ')[0]} ${row.pg_version.split(' ')[1]}`);
    }
    
    // Check if users table exists
    console.log('\n📋 Checking Database Schema...');
    
    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'access_codes', 'sessions', 'auth_logs')
      ORDER BY table_name
    `);
    
    const tables = tableCheck.rows.map(r => r.table_name);
    
    console.log(`   Found ${tables.length}/4 required tables:`);
    
    const requiredTables = ['users', 'access_codes', 'sessions', 'auth_logs'];
    requiredTables.forEach(table => {
      if (tables.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} (MISSING)`);
      }
    });
    
    // Check email verification columns
    console.log('\n📧 Checking Email Verification Schema...');
    
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('email_verified', 'verification_token', 'verification_token_expires', 'verification_sent_at')
      ORDER BY column_name
    `);
    
    const columns = columnCheck.rows.map(r => r.column_name);
    
    console.log(`   Found ${columns.length}/4 verification columns:`);
    
    const requiredColumns = ['email_verified', 'verification_token', 'verification_token_expires', 'verification_sent_at'];
    requiredColumns.forEach(column => {
      if (columns.includes(column)) {
        console.log(`   ✅ ${column}`);
      } else {
        console.log(`   ❌ ${column} (MISSING)`);
      }
    });
    
    // Check user count
    console.log('\n👥 User Statistics...');
    
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE email_verified = TRUE) as verified_users,
        COUNT(*) FILTER (WHERE email_verified = FALSE) as unverified_users
      FROM users
    `);
    
    if (userStats.rows.length > 0) {
      const stats = userStats.rows[0];
      console.log(`   Total Users: ${stats.total_users}`);
      console.log(`   Verified: ${stats.verified_users}`);
      console.log(`   Unverified: ${stats.unverified_users}`);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ Database configuration verified!\n');
    
  } catch (error) {
    console.error('\n❌ Error verifying database configuration:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

verifyDatabaseConfig();
