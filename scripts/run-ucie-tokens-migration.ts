#!/usr/bin/env tsx
/**
 * UCIE Tokens Table Migration Script
 * 
 * Creates the ucie_tokens table for storing cryptocurrency information.
 * 
 * Usage:
 *   npx tsx scripts/run-ucie-tokens-migration.ts
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
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

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logHeader(message: string) {
  log(`\n${'='.repeat(70)}`, colors.blue);
  log(`  ${message}`, colors.bright + colors.blue);
  log(`${'='.repeat(70)}\n`, colors.blue);
}

async function runMigration() {
  logHeader('UCIE Tokens Table Migration');

  if (!process.env.DATABASE_URL) {
    logError('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    logInfo('Connecting to database...');
    await pool.query('SELECT NOW()');
    logSuccess('Connected successfully');

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '003_ucie_tokens_table.sql');
    logInfo(`Reading migration file: ${migrationPath}`);

    if (!fs.existsSync(migrationPath)) {
      logError(`Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    logSuccess('Migration file loaded');

    // Run migration
    logInfo('Executing migration...');
    await pool.query(migrationSQL);
    logSuccess('Migration executed successfully!');

    // Verify table creation
    const verifyResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ucie_tokens'
      ORDER BY ordinal_position;
    `);

    logHeader('Migration Results');
    logSuccess('Table ucie_tokens created successfully');
    log('\nColumns:', colors.cyan);
    verifyResult.rows.forEach(col => {
      log(`  - ${col.column_name.padEnd(25)} ${col.data_type}`, colors.reset);
    });

    // Check indexes
    const indexResult = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'ucie_tokens'
      ORDER BY indexname;
    `);

    log('\nIndexes:', colors.cyan);
    indexResult.rows.forEach(idx => {
      log(`  - ${idx.indexname}`, colors.reset);
    });

    logHeader('Migration Complete! 🎉');
    logInfo('Next step: Run token seeding script');
    log('  npx tsx scripts/seed-ucie-tokens.ts', colors.cyan);

  } catch (error) {
    logHeader('Migration Failed');
    logError('An error occurred:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
