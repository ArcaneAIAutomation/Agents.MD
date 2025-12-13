#!/usr/bin/env node
/**
 * UCIE Production Readiness Verification Script
 * 
 * This script verifies that the UCIE system is ready for production deployment.
 * Run this before deploying to Vercel to catch any issues early.
 * 
 * Usage: npx tsx scripts/verify-ucie-production-ready.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, passMsg: string, failMsg: string): void {
  results.push({
    name,
    status: condition ? 'pass' : 'fail',
    message: condition ? passMsg : failMsg
  });
}

function warn(name: string, message: string): void {
  results.push({
    name,
    status: 'warn',
    message
  });
}

console.log('🔍 UCIE Production Readiness Verification\n');
console.log('=' .repeat(60));

// Check 1: Verify vercel.json exists and has correct timeouts
console.log('\n📋 Checking Vercel Configuration...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf-8'));
  
  check(
    'vercel.json exists',
    true,
    '✅ vercel.json found',
    '❌ vercel.json not found'
  );
  
  const previewDataTimeout = vercelConfig.functions?.['pages/api/ucie/preview-data/**/*.ts']?.maxDuration;
  check(
    'Preview data timeout',
    previewDataTimeout === 300,
    `✅ Preview data timeout: ${previewDataTimeout}s (correct)`,
    `❌ Preview data timeout: ${previewDataTimeout}s (should be 300s)`
  );
  
  const openaiTimeout = vercelConfig.functions?.['pages/api/ucie/openai-summary-start/**/*.ts']?.maxDuration;
  check(
    'OpenAI analysis timeout',
    openaiTimeout === 300,
    `✅ OpenAI analysis timeout: ${openaiTimeout}s (correct)`,
    `❌ OpenAI analysis timeout: ${openaiTimeout}s (should be 300s)`
  );
  
  const pollingTimeout = vercelConfig.functions?.['pages/api/ucie/openai-summary-poll/**/*.ts']?.maxDuration;
  check(
    'OpenAI polling timeout',
    pollingTimeout === 10,
    `✅ OpenAI polling timeout: ${pollingTimeout}s (correct)`,
    `❌ OpenAI polling timeout: ${pollingTimeout}s (should be 10s)`
  );
  
} catch (error) {
  check(
    'vercel.json',
    false,
    '',
    `❌ Error reading vercel.json: ${error.message}`
  );
}

// Check 2: Verify .env.local exists
console.log('\n🔐 Checking Environment Configuration...');
try {
  const envExists = fs.existsSync('.env.local');
  check(
    '.env.local exists',
    envExists,
    '✅ .env.local found',
    '❌ .env.local not found - copy from .env.example'
  );
  
  if (envExists) {
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    
    // Check critical environment variables
    const criticalVars = [
      'OPENAI_API_KEY',
      'DATABASE_URL',
      'COINMARKETCAP_API_KEY',
      'NEWS_API_KEY',
      'LUNARCRUSH_API_KEY'
    ];
    
    criticalVars.forEach(varName => {
      const hasVar = envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your_`);
      check(
        varName,
        hasVar,
        `✅ ${varName} is set`,
        `❌ ${varName} is missing or not configured`
      );
    });
    
    // Check DATABASE_URL format
    const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
    if (dbUrlMatch) {
      const dbUrl = dbUrlMatch[1].trim();
      const hasSslMode = dbUrl.includes('?sslmode=');
      check(
        'DATABASE_URL format',
        !hasSslMode,
        '✅ DATABASE_URL format is correct (no ?sslmode parameter)',
        '❌ DATABASE_URL has ?sslmode parameter - remove it!'
      );
    }
  }
} catch (error) {
  check(
    '.env.local',
    false,
    '',
    `❌ Error reading .env.local: ${error.message}`
  );
}

// Check 3: Verify critical files exist
console.log('\n📁 Checking Critical Files...');
const criticalFiles = [
  'pages/api/ucie/preview-data/[symbol].ts',
  'pages/api/ucie/openai-summary-start/[symbol].ts',
  'pages/api/ucie/openai-summary-poll/[jobId].ts',
  'components/UCIE/DataPreviewModal.tsx',
  'lib/ucie/cacheUtils.ts',
  '.kiro/steering/ucie-system.md'
];

criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  check(
    path.basename(file),
    exists,
    `✅ ${file} exists`,
    `❌ ${file} not found`
  );
});

// Check 4: Verify package.json dependencies
console.log('\n📦 Checking Dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  
  const criticalDeps = [
    'next',
    'react',
    'openai',
    'pg',
    'uuid',
    'zod'
  ];
  
  criticalDeps.forEach(dep => {
    const hasDepInDeps = packageJson.dependencies?.[dep];
    const hasDepInDevDeps = packageJson.devDependencies?.[dep];
    const hasDep = hasDepInDeps || hasDepInDevDeps;
    
    check(
      dep,
      !!hasDep,
      `✅ ${dep} is installed`,
      `❌ ${dep} is missing`
    );
  });
} catch (error) {
  check(
    'package.json',
    false,
    '',
    `❌ Error reading package.json: ${error.message}`
  );
}

// Check 5: Verify .gitignore excludes sensitive files
console.log('\n🔒 Checking Security...');
try {
  const gitignore = fs.readFileSync('.gitignore', 'utf-8');
  
  const sensitivePatterns = [
    '.env',
    '.env.local',
    'node_modules',
    '.vercel'
  ];
  
  sensitivePatterns.forEach(pattern => {
    const isIgnored = gitignore.includes(pattern);
    check(
      `.gitignore: ${pattern}`,
      isIgnored,
      `✅ ${pattern} is ignored`,
      `❌ ${pattern} is NOT ignored - security risk!`
    );
  });
} catch (error) {
  check(
    '.gitignore',
    false,
    '',
    `❌ Error reading .gitignore: ${error.message}`
  );
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('\n📊 Verification Results:\n');

const passed = results.filter(r => r.status === 'pass').length;
const failed = results.filter(r => r.status === 'fail').length;
const warned = results.filter(r => r.status === 'warn').length;

results.forEach(result => {
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${result.name}: ${result.message}`);
});

console.log('\n' + '='.repeat(60));
console.log(`\n📈 Summary: ${passed} passed, ${failed} failed, ${warned} warnings`);

if (failed === 0) {
  console.log('\n🎉 SUCCESS! UCIE system is ready for production deployment!');
  console.log('\n📋 Next Steps:');
  console.log('1. Set environment variables in Vercel Dashboard');
  console.log('2. Run local tests: npm run dev');
  console.log('3. Test UCIE feature with BTC');
  console.log('4. Deploy: git add -A && git commit -m "feat: UCIE production ready" && git push origin main');
  console.log('\n📚 See: UCIE-PRODUCTION-DEPLOYMENT-CHECKLIST.md for complete guide');
  process.exit(0);
} else {
  console.log('\n❌ FAILED! Fix the issues above before deploying.');
  console.log('\n📚 See: UCIE-PRODUCTION-DEPLOYMENT-CHECKLIST.md for help');
  process.exit(1);
}
