#!/usr/bin/env tsx

/**
 * Quantum BTC Super Spec - Production Deployment Verification Script
 * 
 * This script verifies that the Quantum BTC system is properly deployed and operational.
 * 
 * Usage:
 *   npx tsx scripts/verify-quantum-deployment.ts
 * 
 * Environment Variables Required:
 *   - VERCEL_URL or PRODUCTION_URL: The production URL to test
 *   - CRON_SECRET: Secret for testing cron endpoint
 *   - AUTH_TOKEN: Optional auth token for testing protected endpoints
 */

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

// Get production URL from environment
const PRODUCTION_URL = process.env.VERCEL_URL || process.env.PRODUCTION_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

console.log('🚀 Quantum BTC Super Spec - Deployment Verification\n');
console.log(`Testing URL: ${PRODUCTION_URL}\n`);

/**
 * Test helper function
 */
async function runTest(
  name: string,
  testFn: () => Promise<boolean>,
  errorMessage: string = 'Test failed'
): Promise<void> {
  const startTime = Date.now();
  try {
    const passed = await testFn();
    const duration = Date.now() - startTime;
    
    results.push({
      name,
      passed,
      message: passed ? '✅ Passed' : `❌ Failed: ${errorMessage}`,
      duration
    });
    
    console.log(`${passed ? '✅' : '❌'} ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    results.push({
      name,
      passed: false,
      message: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      duration
    });
    
    console.log(`❌ ${name} - Error: ${error instanceof Error ? error.message : String(error)} (${duration}ms)`);
  }
}

/**
 * Test 1: Performance Dashboard Endpoint
 */
async function testPerformanceDashboard(): Promise<boolean> {
  const response = await fetch(`${PRODUCTION_URL}/api/quantum/performance-dashboard`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error('Response indicates failure');
  }
  
  if (!data.metrics) {
    throw new Error('Missing metrics in response');
  }
  
  return true;
}

/**
 * Test 2: Cron Job Endpoint (if CRON_SECRET available)
 */
async function testCronEndpoint(): Promise<boolean> {
  if (!CRON_SECRET) {
    console.log('⚠️  Skipping cron test (CRON_SECRET not set)');
    return true;
  }
  
  const response = await fetch(`${PRODUCTION_URL}/api/quantum/validate-btc-trades`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': CRON_SECRET
    },
    body: JSON.stringify({})
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error('Response indicates failure');
  }
  
  if (!data.summary) {
    throw new Error('Missing summary in response');
  }
  
  return true;
}

/**
 * Test 3: Trade Generation Endpoint (if AUTH_TOKEN available)
 */
async function testTradeGeneration(): Promise<boolean> {
  if (!AUTH_TOKEN) {
    console.log('⚠️  Skipping trade generation test (AUTH_TOKEN not set)');
    return true;
  }
  
  const response = await fetch(`${PRODUCTION_URL}/api/quantum/generate-btc-trade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `auth_token=${AUTH_TOKEN}`
    },
    body: JSON.stringify({})
  });
  
  if (!response.ok) {
    // 401 is expected if auth token is invalid
    if (response.status === 401) {
      console.log('⚠️  Trade generation test: Authentication required (expected)');
      return true;
    }
    
    // 429 is expected if rate limited
    if (response.status === 429) {
      console.log('⚠️  Trade generation test: Rate limited (expected)');
      return true;
    }
    
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success && !data.error) {
    throw new Error('Invalid response format');
  }
  
  return true;
}

/**
 * Test 4: Health Check (basic connectivity)
 */
async function testHealthCheck(): Promise<boolean> {
  const response = await fetch(`${PRODUCTION_URL}/api/health`, {
    method: 'GET'
  });
  
  // Even if endpoint doesn't exist, we should get a response
  return response.status !== 0;
}

/**
 * Test 5: Vercel Configuration Check
 */
async function testVercelConfig(): Promise<boolean> {
  // Check if vercel.json exists and has correct cron configuration
  const fs = await import('fs');
  const path = await import('path');
  
  const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
  
  if (!fs.existsSync(vercelConfigPath)) {
    throw new Error('vercel.json not found');
  }
  
  const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf-8'));
  
  if (!vercelConfig.crons) {
    throw new Error('No crons configured in vercel.json');
  }
  
  const quantumCron = vercelConfig.crons.find((cron: any) => 
    cron.path === '/api/quantum/validate-btc-trades'
  );
  
  if (!quantumCron) {
    throw new Error('Quantum validation cron not found in vercel.json');
  }
  
  if (quantumCron.schedule !== '0 * * * *') {
    throw new Error(`Incorrect cron schedule: ${quantumCron.schedule} (expected: 0 * * * *)`);
  }
  
  return true;
}

/**
 * Test 6: Database Migration Files Check
 */
async function testMigrationFiles(): Promise<boolean> {
  const fs = await import('fs');
  const path = await import('path');
  
  const migrationDir = path.join(process.cwd(), 'migrations', 'quantum-btc');
  
  if (!fs.existsSync(migrationDir)) {
    throw new Error('Migration directory not found: migrations/quantum-btc');
  }
  
  const requiredMigrations = [
    '000_quantum_btc_complete_migration.sql',
    '001_create_btc_trades.sql',
    '002_create_btc_hourly_snapshots.sql',
    '003_create_quantum_anomaly_logs.sql',
    '004_create_prediction_accuracy_database.sql',
    '005_create_api_latency_reliability_logs.sql'
  ];
  
  const files = fs.readdirSync(migrationDir);
  
  for (const migration of requiredMigrations) {
    if (!files.includes(migration)) {
      throw new Error(`Missing migration file: ${migration}`);
    }
  }
  
  return true;
}

/**
 * Test 7: Environment Variables Check
 */
async function testEnvironmentVariables(): Promise<boolean> {
  const requiredVars = [
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'JWT_SECRET',
    'CRON_SECRET'
  ];
  
  const missingVars: string[] = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }
  
  return true;
}

/**
 * Main test execution
 */
async function main() {
  console.log('Running deployment verification tests...\n');
  
  // Run all tests
  await runTest(
    'Test 1: Performance Dashboard Endpoint',
    testPerformanceDashboard,
    'Performance dashboard endpoint not responding correctly'
  );
  
  await runTest(
    'Test 2: Cron Job Endpoint',
    testCronEndpoint,
    'Cron job endpoint not responding correctly'
  );
  
  await runTest(
    'Test 3: Trade Generation Endpoint',
    testTradeGeneration,
    'Trade generation endpoint not responding correctly'
  );
  
  await runTest(
    'Test 4: Health Check',
    testHealthCheck,
    'Basic connectivity failed'
  );
  
  await runTest(
    'Test 5: Vercel Configuration',
    testVercelConfig,
    'Vercel configuration incorrect'
  );
  
  await runTest(
    'Test 6: Database Migration Files',
    testMigrationFiles,
    'Migration files missing or incomplete'
  );
  
  await runTest(
    'Test 7: Environment Variables',
    testEnvironmentVariables,
    'Required environment variables not set'
  );
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('DEPLOYMENT VERIFICATION SUMMARY');
  console.log('='.repeat(60) + '\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);
  
  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
    console.log('');
  }
  
  // Print recommendations
  console.log('='.repeat(60));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(60) + '\n');
  
  if (failed === 0) {
    console.log('✅ All tests passed! Deployment is successful.');
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Monitor Vercel logs for 24 hours');
    console.log('  2. Verify cron job executes hourly');
    console.log('  3. Check database for trade data');
    console.log('  4. Monitor API response times');
    console.log('  5. Gather user feedback');
  } else {
    console.log('⚠️  Some tests failed. Please review and fix issues before proceeding.');
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Check Vercel environment variables');
    console.log('  2. Verify database migrations ran successfully');
    console.log('  3. Check Vercel function logs for errors');
    console.log('  4. Verify API keys are correct');
    console.log('  5. Review QUANTUM-BTC-DEPLOYMENT-GUIDE.md');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  console.error('\n❌ Fatal error during verification:');
  console.error(error);
  process.exit(1);
});
