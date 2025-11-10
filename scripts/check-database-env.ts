/**
 * Check Database Environment Variables
 * 
 * Verifies DATABASE_URL is set before running database scripts
 * Provides clear instructions if missing
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

function checkDatabaseEnv() {
  console.log('🔍 Checking Database Environment Variables\n');
  console.log('='.repeat(60));
  
  // Check if .env.local exists
  const envLocalPath = join(process.cwd(), '.env.local');
  const envLocalExists = existsSync(envLocalPath);
  
  console.log(`\n📄 Environment File:`);
  if (envLocalExists) {
    console.log(`   ✅ .env.local exists`);
  } else {
    console.log(`   ❌ .env.local NOT FOUND`);
    console.log(`   Create it by copying .env.example:`);
    console.log(`   cp .env.example .env.local`);
  }
  
  // Check DATABASE_URL
  console.log(`\n🗄️  Database Configuration:`);
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    console.log(`   ✅ DATABASE_URL is set`);
    
    // Parse and display (hide password)
    try {
      const url = new URL(databaseUrl);
      console.log(`   Host: ${url.hostname}`);
      console.log(`   Port: ${url.port || '5432'}`);
      console.log(`   Database: ${url.pathname.substring(1)}`);
      console.log(`   User: ${url.username}`);
      console.log(`   Password: ${'*'.repeat(10)}`);
    } catch (error) {
      console.log(`   ⚠️  DATABASE_URL format may be invalid`);
    }
  } else {
    console.log(`   ❌ DATABASE_URL is NOT SET`);
    console.log(`\n📋 How to fix:`);
    console.log(`   1. Go to https://supabase.com/dashboard`);
    console.log(`   2. Select your project`);
    console.log(`   3. Go to Settings → Database`);
    console.log(`   4. Copy "Connection string" (Transaction mode)`);
    console.log(`   5. Add to .env.local:`);
    console.log(`      DATABASE_URL=postgres://user:pass@host:6543/postgres`);
    console.log(`\n⚠️  IMPORTANT: Use port 6543 (Transaction mode), not 5432`);
  }
  
  // Check other required variables
  console.log(`\n🔑 API Keys:`);
  const requiredKeys = [
    'OPENAI_API_KEY',
    'GEMINI_API_KEY',
    'CAESAR_API_KEY',
    'COINMARKETCAP_API_KEY',
    'NEWS_API_KEY'
  ];
  
  let missingKeys = 0;
  for (const key of requiredKeys) {
    if (process.env[key]) {
      console.log(`   ✅ ${key}`);
    } else {
      console.log(`   ❌ ${key} (missing)`);
      missingKeys++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));
  
  if (!databaseUrl) {
    console.log('\n❌ DATABASE_URL is required to run database scripts');
    console.log('\n📋 Next steps:');
    console.log('   1. Create .env.local file');
    console.log('   2. Add DATABASE_URL from Supabase');
    console.log('   3. Run this script again to verify');
    console.log('   4. Then run: npm run setup:ucie:complete');
    process.exit(1);
  } else if (missingKeys > 0) {
    console.log(`\n⚠️  DATABASE_URL is set, but ${missingKeys} API keys are missing`);
    console.log('   Database setup will work, but API calls may fail');
    console.log('\n✅ You can proceed with database setup:');
    console.log('   npm run setup:ucie:complete');
  } else {
    console.log('\n✅ All environment variables are set!');
    console.log('\n🚀 Ready to run database setup:');
    console.log('   npm run setup:ucie:complete');
  }
}

// Run check
checkDatabaseEnv();
