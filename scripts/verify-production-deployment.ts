#!/usr/bin/env tsx

/**
 * ATGE Production Deployment Verification Script
 * 
 * This script verifies that the ATGE system is deployed correctly to production.
 * It tests all critical endpoints and reports any issues.
 * 
 * Usage:
 *   npx tsx scripts/verify-production-deployment.ts
 * 
 * Requirements:
 *   - Production URL (default: https://news.arcane.group)
 *   - Valid authentication token (optional, for protected endpoints)
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://news.arcane.group';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

interface TestResult {
  name: string;
  endpoint: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  responseTime?: number;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = false
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Skip if auth required but not provided
    if (requireAuth && !AUTH_TOKEN) {
      return {
        name,
        endpoint,
        status: 'skip',
        message: 'Skipped (requires authentication token)'
      };
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (requireAuth && AUTH_TOKEN) {
      headers['Cookie'] = `auth_token=${AUTH_TOKEN}`;
    }
    
    const response = await fetch(`${PRODUCTION_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return {
        name,
        endpoint,
        status: 'pass',
        message: `✅ Success (${response.status})`,
        responseTime
      };
    } else {
      const errorText = await response.text();
      return {
        name,
        endpoint,
        status: 'fail',
        message: `❌ Failed (${response.status}): ${errorText.substring(0, 100)}`,
        responseTime
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name,
      endpoint,
      status: 'fail',
      message: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      responseTime
    };
  }
}

async function runTests() {
  console.log('🚀 ATGE Production Deployment Verification\n');
  console.log(`Production URL: ${PRODUCTION_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN ? '✅ Provided' : '❌ Not provided (some tests will be skipped)'}\n`);
  console.log('=' .repeat(80));
  console.log('\n');
  
  // Test 1: Health Check (if exists)
  console.log('📋 Test 1: Health Check');
  const healthResult = await testEndpoint(
    'Health Check',
    '/api/health',
    { method: 'GET' },
    false
  );
  results.push(healthResult);
  console.log(`   ${healthResult.message} (${healthResult.responseTime}ms)\n`);
  
  // Test 2: Trade Generation (requires auth)
  console.log('📋 Test 2: Trade Generation (GPT-5.1)');
  const generateResult = await testEndpoint(
    'Trade Generation',
    '/api/atge/generate',
    {
      method: 'POST',
      body: JSON.stringify({ symbol: 'BTC', timeframe: '1h' })
    },
    true
  );
  results.push(generateResult);
  console.log(`   ${generateResult.message} ${generateResult.responseTime ? `(${generateResult.responseTime}ms)` : ''}\n`);
  
  // Test 3: Trade Verification (requires auth)
  console.log('📋 Test 3: Trade Verification');
  const verifyResult = await testEndpoint(
    'Trade Verification',
    '/api/atge/verify-trades',
    { method: 'GET' },
    true
  );
  results.push(verifyResult);
  console.log(`   ${verifyResult.message} ${verifyResult.responseTime ? `(${verifyResult.responseTime}ms)` : ''}\n`);
  
  // Test 4: Statistics API (requires auth)
  console.log('📋 Test 4: Statistics API');
  const statsResult = await testEndpoint(
    'Statistics API',
    '/api/atge/statistics',
    { method: 'GET' },
    true
  );
  results.push(statsResult);
  console.log(`   ${statsResult.message} ${statsResult.responseTime ? `(${statsResult.responseTime}ms)` : ''}\n`);
  
  // Test 5: Analytics API (requires auth)
  console.log('📋 Test 5: Analytics API');
  const analyticsResult = await testEndpoint(
    'Analytics API',
    '/api/atge/analytics?symbol=BTC&dateRange=30d',
    { method: 'GET' },
    true
  );
  results.push(analyticsResult);
  console.log(`   ${analyticsResult.message} ${analyticsResult.responseTime ? `(${analyticsResult.responseTime}ms)` : ''}\n`);
  
  // Test 6: Pattern Recognition (requires auth)
  console.log('📋 Test 6: Pattern Recognition');
  const patternsResult = await testEndpoint(
    'Pattern Recognition',
    '/api/atge/patterns',
    { method: 'GET' },
    true
  );
  results.push(patternsResult);
  console.log(`   ${patternsResult.message} ${patternsResult.responseTime ? `(${patternsResult.responseTime}ms)` : ''}\n`);
  
  // Test 7: Batch Analysis (requires auth)
  console.log('📋 Test 7: Batch Analysis');
  const batchResult = await testEndpoint(
    'Batch Analysis',
    '/api/atge/batch-analysis?symbol=BTC&startDate=2025-01-01',
    { method: 'GET' },
    true
  );
  results.push(batchResult);
  console.log(`   ${batchResult.message} ${batchResult.responseTime ? `(${batchResult.responseTime}ms)` : ''}\n`);
  
  // Test 8: Cron Job Endpoint (requires CRON_SECRET)
  console.log('📋 Test 8: Cron Job Endpoint');
  const cronSecret = process.env.CRON_SECRET || '';
  if (cronSecret) {
    const cronResult = await testEndpoint(
      'Cron Job',
      '/api/cron/atge-verify-trades',
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${cronSecret}` }
      },
      false
    );
    results.push(cronResult);
    console.log(`   ${cronResult.message} ${cronResult.responseTime ? `(${cronResult.responseTime}ms)` : ''}\n`);
  } else {
    results.push({
      name: 'Cron Job',
      endpoint: '/api/cron/atge-verify-trades',
      status: 'skip',
      message: 'Skipped (CRON_SECRET not provided)'
    });
    console.log('   ⚠️  Skipped (CRON_SECRET not provided)\n');
  }
  
  // Summary
  console.log('=' .repeat(80));
  console.log('\n📊 Test Summary\n');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`\nSuccess Rate: ${((passed / (total - skipped)) * 100).toFixed(1)}%\n`);
  
  // Performance Summary
  const passedWithTime = results.filter(r => r.status === 'pass' && r.responseTime);
  if (passedWithTime.length > 0) {
    const avgResponseTime = passedWithTime.reduce((sum, r) => sum + (r.responseTime || 0), 0) / passedWithTime.length;
    console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms\n`);
  }
  
  // Failed Tests Details
  if (failed > 0) {
    console.log('❌ Failed Tests:\n');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`   ${r.name} (${r.endpoint})`);
      console.log(`   ${r.message}\n`);
    });
  }
  
  // Skipped Tests Details
  if (skipped > 0) {
    console.log('⚠️  Skipped Tests:\n');
    results.filter(r => r.status === 'skip').forEach(r => {
      console.log(`   ${r.name} (${r.endpoint})`);
      console.log(`   ${r.message}\n`);
    });
  }
  
  // Recommendations
  console.log('=' .repeat(80));
  console.log('\n💡 Recommendations\n');
  
  if (!AUTH_TOKEN) {
    console.log('⚠️  Set AUTH_TOKEN environment variable to test protected endpoints');
    console.log('   Example: AUTH_TOKEN=your_token npx tsx scripts/verify-production-deployment.ts\n');
  }
  
  if (!process.env.CRON_SECRET) {
    console.log('⚠️  Set CRON_SECRET environment variable to test cron endpoint');
    console.log('   Example: CRON_SECRET=your_secret npx tsx scripts/verify-production-deployment.ts\n');
  }
  
  if (failed > 0) {
    console.log('❌ Some tests failed. Check Vercel function logs for details:');
    console.log('   https://vercel.com/dashboard → Your Project → Functions\n');
  }
  
  if (passed === total - skipped) {
    console.log('✅ All tests passed! Deployment is successful.\n');
  }
  
  console.log('=' .repeat(80));
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
