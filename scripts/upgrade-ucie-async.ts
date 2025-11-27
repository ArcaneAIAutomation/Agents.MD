#!/usr/bin/env tsx
/**
 * UCIE Async Upgrade Script
 * 
 * Automates the complete migration to async UCIE pattern.
 * 
 * Steps:
 * 1. Create database table (ucie_jobs)
 * 2. Verify cron job configuration
 * 3. Test new endpoints
 * 4. Verify deployment
 */

import { query, queryOne } from '../lib/db';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// Colors for console output
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

function success(message: string) {
  log(`✅ ${message}`, colors.green);
}

function error(message: string) {
  log(`❌ ${message}`, colors.red);
}

function info(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function warning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function section(title: string) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`  ${title}`, colors.bright + colors.cyan);
  log(`${'='.repeat(60)}\n`, colors.cyan);
}

/**
 * Step 1: Create database table
 */
async function createDatabaseTable(): Promise<boolean> {
  section('Step 1: Creating Database Table');
  
  try {
    info('Reading migration file...');
    const migrationPath = path.join(process.cwd(), 'migrations', 'ucie_jobs.sql');
    
    if (!fs.existsSync(migrationPath)) {
      error('Migration file not found: migrations/ucie_jobs.sql');
      return false;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    info('Migration file loaded');
    
    info('Executing migration...');
    await query(migrationSQL);
    success('Database table created: ucie_jobs');
    
    // Verify table exists
    const tableCheck = await queryOne(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ucie_jobs'
      )`
    );
    
    if (tableCheck.exists) {
      success('Table verified: ucie_jobs exists');
      
      // Check indexes
      const indexes = await query(
        `SELECT indexname FROM pg_indexes WHERE tablename = 'ucie_jobs'`
      );
      success(`Indexes created: ${indexes.length} indexes`);
      indexes.forEach((idx: any) => {
        info(`  - ${idx.indexname}`);
      });
      
      return true;
    } else {
      error('Table verification failed');
      return false;
    }
    
  } catch (err) {
    if (err.message.includes('already exists')) {
      warning('Table already exists (skipping)');
      return true;
    }
    error(`Database error: ${err.message}`);
    return false;
  }
}

/**
 * Step 2: Verify API endpoints exist
 */
async function verifyEndpoints(): Promise<boolean> {
  section('Step 2: Verifying API Endpoints');
  
  const endpoints = [
    'pages/api/ucie/start-analysis.ts',
    'pages/api/ucie/status/[jobId].ts',
    'pages/api/ucie/result/[jobId].ts',
    'pages/api/cron/process-ucie-jobs.ts'
  ];
  
  let allExist = true;
  
  for (const endpoint of endpoints) {
    const fullPath = path.join(process.cwd(), endpoint);
    if (fs.existsSync(fullPath)) {
      success(`Found: ${endpoint}`);
    } else {
      error(`Missing: ${endpoint}`);
      allExist = false;
    }
  }
  
  return allExist;
}

/**
 * Step 3: Verify vercel.json configuration
 */
async function verifyVercelConfig(): Promise<boolean> {
  section('Step 3: Verifying Vercel Configuration');
  
  try {
    const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
    
    if (!fs.existsSync(vercelConfigPath)) {
      error('vercel.json not found');
      return false;
    }
    
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf-8'));
    
    // Check maxDuration
    if (vercelConfig.functions?.['pages/api/**/*.ts']?.maxDuration === 60) {
      success('Function timeout: 60 seconds (correct)');
    } else {
      error('Function timeout not set to 60 seconds');
      return false;
    }
    
    // Check cron job
    const ucieC ron = vercelConfig.crons?.find(
      (c: any) => c.path === '/api/cron/process-ucie-jobs'
    );
    
    if (ucieCron) {
      success(`Cron job configured: ${ucieCron.schedule}`);
      if (ucieCron.schedule === '* * * * *') {
        success('Cron schedule: Every minute (correct)');
      } else {
        warning(`Cron schedule: ${ucieCron.schedule} (expected: * * * * *)`);
      }
    } else {
      error('UCIE cron job not found in vercel.json');
      return false;
    }
    
    return true;
    
  } catch (err) {
    error(`Config verification error: ${err.message}`);
    return false;
  }
}

/**
 * Step 4: Test database connection
 */
async function testDatabaseConnection(): Promise<boolean> {
  section('Step 4: Testing Database Connection');
  
  try {
    info('Testing database connection...');
    const result = await queryOne('SELECT NOW() as current_time');
    success(`Database connected: ${result.current_time}`);
    
    info('Testing ucie_jobs table...');
    const count = await queryOne('SELECT COUNT(*) as count FROM ucie_jobs');
    success(`Table accessible: ${count.count} jobs in queue`);
    
    return true;
    
  } catch (err) {
    error(`Database test failed: ${err.message}`);
    return false;
  }
}

/**
 * Step 5: Create test job
 */
async function createTestJob(): Promise<boolean> {
  section('Step 5: Creating Test Job');
  
  try {
    info('Creating test job for BTC...');
    
    const job = await queryOne(
      `INSERT INTO ucie_jobs (
        symbol, 
        status, 
        progress, 
        phase, 
        user_id,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, symbol, status, created_at`,
      ['BTC', 'queued', 0, 'initializing', 'test-upgrade-script']
    );
    
    success(`Test job created: ${job.id}`);
    info(`  Symbol: ${job.symbol}`);
    info(`  Status: ${job.status}`);
    info(`  Created: ${job.created_at}`);
    
    // Clean up test job
    info('Cleaning up test job...');
    await query('DELETE FROM ucie_jobs WHERE id = $1', [job.id]);
    success('Test job cleaned up');
    
    return true;
    
  } catch (err) {
    error(`Test job creation failed: ${err.message}`);
    return false;
  }
}

/**
 * Step 6: Display next steps
 */
function displayNextSteps(allPassed: boolean) {
  section('Upgrade Summary');
  
  if (allPassed) {
    success('All checks passed! ✨');
    
    log('\n📋 Next Steps:\n', colors.bright);
    log('1. Deploy to Vercel:', colors.cyan);
    log('   git push origin main\n');
    
    log('2. Verify cron job in Vercel Dashboard:', colors.cyan);
    log('   https://vercel.com/dashboard → Cron Jobs\n');
    
    log('3. Test the new endpoints:', colors.cyan);
    log('   curl -X POST https://news.arcane.group/api/ucie/start-analysis \\');
    log('     -H "Content-Type: application/json" \\');
    log('     -d \'{"symbol":"BTC"}\'\n');
    
    log('4. Monitor first analysis:', colors.cyan);
    log('   - Should complete in 5-7 minutes');
    log('   - Check Vercel function logs');
    log('   - Verify cron runs every minute\n');
    
    log('5. Update frontend:', colors.cyan);
    log('   - Use new async endpoints');
    log('   - Implement polling hook');
    log('   - Show progress to users\n');
    
    success('🚀 UCIE async upgrade complete!');
    
  } else {
    error('Some checks failed. Please fix the issues above.');
    
    log('\n📋 Troubleshooting:\n', colors.yellow);
    log('1. Check database connection:', colors.cyan);
    log('   npx tsx scripts/test-database-access.ts\n');
    
    log('2. Verify all files exist:', colors.cyan);
    log('   ls -la pages/api/ucie/\n');
    
    log('3. Check vercel.json syntax:', colors.cyan);
    log('   cat vercel.json | jq .\n');
    
    log('4. Review error messages above', colors.cyan);
  }
}

/**
 * Main upgrade function
 */
async function main() {
  log('\n🚀 UCIE Async Upgrade Script', colors.bright + colors.cyan);
  log('Automating migration to async pattern\n', colors.cyan);
  
  const results = {
    database: false,
    endpoints: false,
    config: false,
    connection: false,
    testJob: false
  };
  
  try {
    // Run all steps
    results.database = await createDatabaseTable();
    results.endpoints = await verifyEndpoints();
    results.config = await verifyVercelConfig();
    results.connection = await testDatabaseConnection();
    results.testJob = await createTestJob();
    
    // Check if all passed
    const allPassed = Object.values(results).every(r => r === true);
    
    // Display summary
    displayNextSteps(allPassed);
    
    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);
    
  } catch (err) {
    error(`Upgrade failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Run the upgrade
main();
