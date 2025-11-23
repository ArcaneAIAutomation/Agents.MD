#!/usr/bin/env tsx

/**
 * ATGE Environment Variables Verification Script
 * 
 * Verifies that all required environment variables are configured
 * for the ATGE GPT-5.1 Trade Analysis system.
 * 
 * Usage: npx tsx scripts/verify-atge-env.ts
 */

const requiredVars = [
  'OPENAI_API_KEY',
  'COINMARKETCAP_API_KEY',
  'COINGECKO_API_KEY',
  'DATABASE_URL',
  'CRON_SECRET',
  'GLASSNODE_API_KEY'
];

const optionalVars = [
  'OPENAI_MODEL',
  'REASONING_EFFORT',
  'OPENAI_TIMEOUT',
  'GEMINI_API_KEY',
  'KRAKEN_API_KEY',
  'NEWS_API_KEY',
  'CAESAR_API_KEY'
];

interface VerificationResult {
  name: string;
  configured: boolean;
  value?: string;
  masked?: string;
}

function maskValue(value: string): string {
  if (value.length <= 8) {
    return '***';
  }
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
}

function verifyVariable(name: string): VerificationResult {
  const value = process.env[name];
  
  if (!value) {
    return { name, configured: false };
  }
  
  return {
    name,
    configured: true,
    value,
    masked: maskValue(value)
  };
}

function main() {
  console.log('🔍 ATGE Environment Variables Verification\n');
  console.log('=' .repeat(60));
  console.log('\n📋 Required Variables:\n');
  
  let allRequiredPresent = true;
  const requiredResults: VerificationResult[] = [];
  
  requiredVars.forEach(varName => {
    const result = verifyVariable(varName);
    requiredResults.push(result);
    
    if (result.configured) {
      console.log(`✅ ${varName}`);
      console.log(`   Value: ${result.masked}`);
    } else {
      console.log(`❌ ${varName}: MISSING`);
      allRequiredPresent = false;
    }
    console.log('');
  });
  
  console.log('=' .repeat(60));
  console.log('\n📋 Optional Variables:\n');
  
  const optionalResults: VerificationResult[] = [];
  
  optionalVars.forEach(varName => {
    const result = verifyVariable(varName);
    optionalResults.push(result);
    
    if (result.configured) {
      console.log(`✅ ${varName}`);
      console.log(`   Value: ${result.masked}`);
    } else {
      console.log(`⚠️  ${varName}: Not set (using default)`);
    }
    console.log('');
  });
  
  console.log('=' .repeat(60));
  console.log('\n📊 Summary:\n');
  
  const requiredConfigured = requiredResults.filter(r => r.configured).length;
  const optionalConfigured = optionalResults.filter(r => r.configured).length;
  
  console.log(`Required: ${requiredConfigured}/${requiredVars.length} configured`);
  console.log(`Optional: ${optionalConfigured}/${optionalVars.length} configured`);
  console.log('');
  
  if (allRequiredPresent) {
    console.log('✅ All required environment variables are configured!');
    console.log('');
    console.log('🚀 ATGE system is ready for deployment.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify variables in Vercel dashboard');
    console.log('2. Run database migrations');
    console.log('3. Deploy to production');
    console.log('4. Test trade generation');
    console.log('');
    process.exit(0);
  } else {
    console.log('❌ Some required environment variables are missing!');
    console.log('');
    console.log('Missing variables:');
    requiredResults
      .filter(r => !r.configured)
      .forEach(r => console.log(`  - ${r.name}`));
    console.log('');
    console.log('Please configure them in:');
    console.log('  - Local: .env.local file');
    console.log('  - Production: Vercel dashboard → Settings → Environment Variables');
    console.log('');
    console.log('See ATGE-ENV-SETUP-GUIDE.md for detailed instructions.');
    console.log('');
    process.exit(1);
  }
}

// Run verification
main();
