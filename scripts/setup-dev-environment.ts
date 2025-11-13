/**
 * ATGE Development Environment Setup Script
 * 
 * Complete setup for ATGE development including:
 * - Database verification
 * - Test data seeding
 * - Environment validation
 * 
 * Usage:
 *   npx tsx scripts/setup-dev-environment.ts
 */

import { query } from '../lib/db';
import { seedTestUsers, seedAccessCodes, verifyTables } from './seed-test-data';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Check if .env.local exists
 */
function checkEnvFile(): boolean {
  const envPath = path.join(process.cwd(), '.env.local');
  return fs.existsSync(envPath);
}

/**
 * Verify required environment variables
 */
function verifyEnvironmentVariables(): { valid: boolean; missing: string[] } {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'OPENAI_API_KEY',
    'COINMARKETCAP_API_KEY'
  ];
  
  const optional = [
    'GEMINI_API_KEY',
    'NEWS_API_KEY',
    'COINGECKO_API_KEY',
    'LUNARCRUSH_API_KEY',
    'TWITTER_BEARER_TOKEN',
    'ETHERSCAN_API_KEY'
  ];
  
  const missing: string[] = [];
  
  console.log('\n🔍 Checking environment variables...');
  
  // Check required variables
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
      console.log(`❌ Missing required: ${varName}`);
    } else {
      console.log(`✅ Found: ${varName}`);
    }
  }
  
  // Check optional variables
  console.log('\n📋 Optional variables:');
  for (const varName of optional) {
    if (process.env[varName]) {
      console.log(`✅ Found: ${varName}`);
    } else {
      console.log(`⚠️  Missing optional: ${varName}`);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Test database connection
 */
async function testDatabaseConnection(): Promise<boolean> {
  console.log('\n🔌 Testing database connection...');
  
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log(`✅ Database connected successfully`);
    console.log(`   Server time: ${result.rows[0].current_time}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Check if migrations have been run
 */
async function checkMigrations(): Promise<boolean> {
  console.log('\n📊 Checking database migrations...');
  
  try {
    // Check if ATGE tables exist
    const atgeTables = [
      'trade_signals',
      'trade_results',
      'trade_technical_indicators',
      'trade_market_snapshot',
      'trade_historical_prices'
    ];
    
    for (const table of atgeTables) {
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      if (!result.rows[0].exists) {
        console.log(`❌ Missing table: ${table}`);
        return false;
      }
    }
    
    console.log('✅ All ATGE tables exist');
    return true;
  } catch (error) {
    console.error('❌ Migration check failed:', error);
    return false;
  }
}

/**
 * Display setup summary
 */
function displaySummary(
  envValid: boolean,
  dbConnected: boolean,
  migrationsRun: boolean,
  dataSeeded: boolean
): void {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 ATGE Development Environment Setup Summary');
  console.log('='.repeat(60));
  
  console.log('\n📋 Status:');
  console.log(`   Environment Variables: ${envValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`   Database Connection: ${dbConnected ? '✅ Connected' : '❌ Failed'}`);
  console.log(`   Database Migrations: ${migrationsRun ? '✅ Complete' : '❌ Incomplete'}`);
  console.log(`   Test Data Seeding: ${dataSeeded ? '✅ Complete' : '❌ Failed'}`);
  
  const allGood = envValid && dbConnected && migrationsRun && dataSeeded;
  
  if (allGood) {
    console.log('\n✅ Development environment is ready!');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Start development server: npm run dev');
    console.log('   2. Run tests: npm test');
    console.log('   3. Generate trade signal: Use test user credentials');
  } else {
    console.log('\n⚠️  Setup incomplete. Please address the issues above.');
    
    if (!envValid) {
      console.log('\n📝 Environment Variables:');
      console.log('   Copy .env.example to .env.local and fill in values');
    }
    
    if (!dbConnected) {
      console.log('\n🔌 Database Connection:');
      console.log('   Check DATABASE_URL in .env.local');
      console.log('   Ensure database is running and accessible');
    }
    
    if (!migrationsRun) {
      console.log('\n📊 Database Migrations:');
      console.log('   Run: npx tsx scripts/run-migrations.ts');
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Main setup function
 */
async function main(): Promise<void> {
  console.log('🚀 Setting up ATGE development environment...\n');
  
  let envValid = false;
  let dbConnected = false;
  let migrationsRun = false;
  let dataSeeded = false;
  
  try {
    // Step 1: Check .env.local file
    if (!checkEnvFile()) {
      console.log('⚠️  .env.local file not found');
      console.log('   Copy .env.example to .env.local and configure it');
    } else {
      console.log('✅ .env.local file found');
    }
    
    // Step 2: Verify environment variables
    const envCheck = verifyEnvironmentVariables();
    envValid = envCheck.valid;
    
    if (!envValid) {
      console.log('\n❌ Missing required environment variables:');
      envCheck.missing.forEach(varName => {
        console.log(`   • ${varName}`);
      });
      displaySummary(envValid, dbConnected, migrationsRun, dataSeeded);
      process.exit(1);
    }
    
    // Step 3: Test database connection
    dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      displaySummary(envValid, dbConnected, migrationsRun, dataSeeded);
      process.exit(1);
    }
    
    // Step 4: Check migrations
    migrationsRun = await checkMigrations();
    
    if (!migrationsRun) {
      console.log('\n⚠️  Database migrations not complete');
      console.log('   Run: npx tsx scripts/run-migrations.ts');
      displaySummary(envValid, dbConnected, migrationsRun, dataSeeded);
      process.exit(1);
    }
    
    // Step 5: Verify tables
    const tablesExist = await verifyTables();
    
    if (!tablesExist) {
      console.log('\n❌ Required tables are missing');
      displaySummary(envValid, dbConnected, migrationsRun, dataSeeded);
      process.exit(1);
    }
    
    // Step 6: Seed test data
    console.log('\n🌱 Seeding test data...');
    await seedTestUsers();
    await seedAccessCodes();
    dataSeeded = true;
    
    // Display summary
    displaySummary(envValid, dbConnected, migrationsRun, dataSeeded);
    
    console.log('✅ Setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    displaySummary(envValid, dbConnected, migrationsRun, dataSeeded);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { checkEnvFile, verifyEnvironmentVariables, testDatabaseConnection, checkMigrations };
