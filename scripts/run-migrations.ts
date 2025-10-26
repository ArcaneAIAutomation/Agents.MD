/**
 * Database Migration Runner
 * Bitcoin Sovereign Technology - Authentication System
 * 
 * This script runs database migrations against Vercel Postgres.
 * 
 * Usage:
 *   npx ts-node scripts/run-migrations.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { getPool, closePool, testConnection } from '../lib/db';

// ============================================================================
// MIGRATION CONFIGURATION
// ============================================================================

interface Migration {
  id: string;
  name: string;
  file: string;
}

const MIGRATIONS: Migration[] = [
  {
    id: '001',
    name: 'Initial Schema',
    file: '001_initial_schema.sql',
  },
  // Add more migrations here as needed
];

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Create migrations tracking table if it doesn't exist
 */
async function createMigrationsTable(): Promise<void> {
  const pool = getPool();
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(10) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  console.log('✅ Migrations tracking table ready');
}

/**
 * Check if a migration has already been run
 */
async function isMigrationExecuted(migrationId: string): Promise<boolean> {
  const pool = getPool();
  
  const result = await pool.query(
    'SELECT id FROM schema_migrations WHERE id = $1',
    [migrationId]
  );
  
  return result.rows.length > 0;
}

/**
 * Mark a migration as executed
 */
async function markMigrationExecuted(migration: Migration): Promise<void> {
  const pool = getPool();
  
  await pool.query(
    'INSERT INTO schema_migrations (id, name) VALUES ($1, $2)',
    [migration.id, migration.name]
  );
}

/**
 * Read migration file content
 */
function readMigrationFile(filename: string): string {
  const filePath = join(process.cwd(), 'migrations', filename);
  return readFileSync(filePath, 'utf-8');
}

/**
 * Execute a single migration
 */
async function executeMigration(migration: Migration): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 Migration: ${migration.id} - ${migration.name}`);
  console.log('='.repeat(60));
  
  // Check if already executed
  const executed = await isMigrationExecuted(migration.id);
  
  if (executed) {
    console.log(`⏭️  Skipping (already executed)`);
    return;
  }
  
  // Read migration file
  console.log(`📖 Reading: ${migration.file}`);
  const sql = readMigrationFile(migration.file);
  
  // Execute migration
  console.log(`⚙️  Executing migration...`);
  const pool = getPool();
  
  try {
    const start = Date.now();
    await pool.query(sql);
    const duration = Date.now() - start;
    
    // Mark as executed
    await markMigrationExecuted(migration);
    
    console.log(`✅ Migration completed successfully (${duration}ms)`);
  } catch (error) {
    console.error(`❌ Migration failed:`, error);
    throw error;
  }
}

/**
 * Run all pending migrations
 */
async function runMigrations(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Starting database migrations...');
  console.log('='.repeat(60) + '\n');
  
  let executed = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const migration of MIGRATIONS) {
    try {
      const wasExecuted = await isMigrationExecuted(migration.id);
      
      if (wasExecuted) {
        skipped++;
      } else {
        await executeMigration(migration);
        executed++;
      }
    } catch (error) {
      console.error(`\n❌ Failed to execute migration ${migration.id}:`, error);
      failed++;
      break; // Stop on first failure
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Executed: ${executed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📦 Total: ${MIGRATIONS.length}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Display migration status
 */
async function displayStatus(): Promise<void> {
  console.log('📋 Migration Status:\n');
  
  const pool = getPool();
  const result = await pool.query(`
    SELECT id, name, executed_at 
    FROM schema_migrations 
    ORDER BY id
  `);
  
  if (result.rows.length === 0) {
    console.log('⚠️  No migrations have been executed yet.\n');
    return;
  }
  
  console.log('Executed migrations:');
  console.log('-'.repeat(60));
  
  for (const row of result.rows) {
    const date = new Date(row.executed_at).toISOString();
    console.log(`✅ ${row.id} - ${row.name} (${date})`);
  }
  
  console.log('-'.repeat(60) + '\n');
  
  // Check for pending migrations
  const executedIds = result.rows.map((row: any) => row.id);
  const pending = MIGRATIONS.filter(m => !executedIds.includes(m.id));
  
  if (pending.length > 0) {
    console.log('Pending migrations:');
    console.log('-'.repeat(60));
    for (const migration of pending) {
      console.log(`⏳ ${migration.id} - ${migration.name}`);
    }
    console.log('-'.repeat(60) + '\n');
  } else {
    console.log('✅ All migrations are up to date!\n');
  }
}

/**
 * Verify database schema
 */
async function verifySchema(): Promise<void> {
  console.log('🔍 Verifying database schema...\n');
  
  const pool = getPool();
  
  // Check tables
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  
  console.log(`Tables found: ${tables.rows.length}`);
  for (const row of tables.rows) {
    console.log(`  ✓ ${row.table_name}`);
  }
  console.log('');
  
  // Check indexes
  const indexes = await pool.query(`
    SELECT COUNT(*) as count 
    FROM pg_indexes 
    WHERE schemaname = 'public'
  `);
  
  console.log(`Indexes found: ${indexes.rows[0].count}`);
  console.log('');
  
  // Expected tables
  const expectedTables = ['users', 'access_codes', 'sessions', 'auth_logs'];
  const actualTables = tables.rows.map((row: any) => row.table_name);
  const missing = expectedTables.filter(t => !actualTables.includes(t));
  
  if (missing.length > 0) {
    console.log('⚠️  Missing tables:');
    missing.forEach(t => console.log(`   - ${t}`));
    console.log('');
  } else {
    console.log('✅ All expected tables are present!\n');
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔐 Bitcoin Sovereign Technology');
  console.log('   Database Migration Runner');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Database connection failed!');
      console.error('   Please check your DATABASE_URL environment variable.');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful!\n');
    
    // Create migrations tracking table
    await createMigrationsTable();
    
    // Display current status
    await displayStatus();
    
    // Run migrations
    await runMigrations();
    
    // Verify schema
    await verifySchema();
    
    console.log('✅ Migration process completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Migration process failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await closePool();
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for testing
export { runMigrations, displayStatus, verifySchema };
