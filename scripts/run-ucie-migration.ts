#!/usr/bin/env tsx
/**
 * UCIE Database Migration Script
 * 
 * Automatically creates all required UCIE database tables in Supabase PostgreSQL.
 * 
 * Usage:
 *   npx tsx scripts/run-ucie-migration.ts
 * 
 * Requirements:
 *   - DATABASE_URL environment variable must be set
 *   - PostgreSQL connection with CREATE TABLE permissions
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logHeader(message: string) {
  log(`\n${'='.repeat(70)}`, colors.blue);
  log(`  ${message}`, colors.bright + colors.blue);
  log(`${'='.repeat(70)}\n`, colors.blue);
}

async function runMigration() {
  logHeader('UCIE Database Migration');

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    logError('DATABASE_URL environment variable is not set');
    logInfo('Please set DATABASE_URL in your .env.local file');
    logInfo('Example: DATABASE_URL=postgres://user:pass@host:6543/postgres');
    process.exit(1);
  }

  logInfo('Connecting to database...');
  logInfo(`Host: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown'}`);

  // Create database connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Required for Supabase
    },
    max: 1, // Only need one connection for migration
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    // Test connection
    logInfo('Testing database connection...');
    const testResult = await pool.query('SELECT NOW()');
    logSuccess(`Connected successfully at ${testResult.rows[0].now}`);

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'migrations', 'ucie_tables.sql');
    logInfo(`Reading migration file: ${migrationPath}`);

    if (!fs.existsSync(migrationPath)) {
      logError(`Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    logSuccess('Migration file loaded successfully');

    // Check if tables already exist
    logInfo('Checking for existing UCIE tables...');
    const existingTablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE 'ucie_%'
      ORDER BY table_name;
    `);

    const existingTables = existingTablesResult.rows.map(row => row.table_name);

    if (existingTables.length > 0) {
      logWarning(`Found ${existingTables.length} existing UCIE table(s):`);
      existingTables.forEach(table => {
        log(`  - ${table}`, colors.yellow);
      });
      logInfo('Migration will use CREATE TABLE IF NOT EXISTS (safe to run)');
    } else {
      logInfo('No existing UCIE tables found. Creating new tables...');
    }

    // Run migration
    logInfo('Executing migration...');
    await pool.query(migrationSQL);
    logSuccess('Migration executed successfully!');

    // Verify tables were created
    logInfo('Verifying table creation...');
    const verifyResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE 'ucie_%'
      ORDER BY table_name;
    `);

    const tables = verifyResult.rows.map(row => row.table_name);
    const expectedTables = [
      'ucie_alerts',
      'ucie_analysis_cache',
      'ucie_analysis_history',
      'ucie_api_costs',
      'ucie_watchlist',
    ];

    logHeader('Migration Results');

    if (tables.length === expectedTables.length) {
      logSuccess(`All ${tables.length} UCIE tables created successfully:`);
      tables.forEach(table => {
        log(`  ✓ ${table}`, colors.green);
      });
    } else {
      logWarning(`Expected ${expectedTables.length} tables, found ${tables.length}`);
      
      const missingTables = expectedTables.filter(t => !tables.includes(t));
      if (missingTables.length > 0) {
        logError('Missing tables:');
        missingTables.forEach(table => {
          log(`  ✗ ${table}`, colors.red);
        });
      }
    }

    // Get table row counts
    logInfo('\nTable statistics:');
    for (const table of tables) {
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      const count = countResult.rows[0].count;
      log(`  ${table}: ${count} rows`, colors.cyan);
    }

    // Check indexes
    logInfo('\nVerifying indexes...');
    const indexResult = await pool.query(`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename LIKE 'ucie_%'
      ORDER BY tablename, indexname;
    `);

    const indexes = indexResult.rows;
    logSuccess(`Found ${indexes.length} indexes:`);
    
    let currentTable = '';
    indexes.forEach(idx => {
      if (idx.tablename !== currentTable) {
        currentTable = idx.tablename;
        log(`\n  ${currentTable}:`, colors.cyan);
      }
      log(`    - ${idx.indexname}`, colors.reset);
    });

    logHeader('Migration Complete! 🎉');
    logSuccess('UCIE database tables are ready to use');
    logInfo('\nNext steps:');
    log('  1. Test UCIE API endpoints', colors.cyan);
    log('  2. Run integration tests', colors.cyan);
    log('  3. Deploy to production', colors.cyan);

  } catch (error) {
    logHeader('Migration Failed');
    logError('An error occurred during migration:');
    
    if (error instanceof Error) {
      log(`\n${error.message}`, colors.red);
      
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        logWarning('\nThis might be a foreign key constraint issue.');
        logInfo('Make sure the "users" table exists before running this migration.');
        logInfo('The UCIE tables reference the users table for user_id foreign keys.');
      }
      
      if (error.message.includes('permission denied')) {
        logWarning('\nDatabase permission issue detected.');
        logInfo('Make sure your database user has CREATE TABLE permissions.');
      }

      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        logWarning('\nConnection timeout detected.');
        logInfo('Check your DATABASE_URL and network connection.');
        logInfo('Make sure the database is accessible from your location.');
      }

      // Show stack trace in verbose mode
      if (process.env.VERBOSE === 'true') {
        log('\nStack trace:', colors.yellow);
        console.error(error.stack);
      } else {
        logInfo('\nRun with VERBOSE=true for full stack trace');
      }
    } else {
      console.error(error);
    }

    process.exit(1);
  } finally {
    // Close database connection
    await pool.end();
    logInfo('Database connection closed');
  }
}

// Run migration
runMigration().catch(error => {
  logError('Unexpected error:');
  console.error(error);
  process.exit(1);
});
