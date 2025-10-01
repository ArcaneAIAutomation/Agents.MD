#!/usr/bin/env node

/**
 * Verify Trading Signals Fix
 * This script analyzes the API code to ensure all signals have the correct structure
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function analyzeApiFile(filePath) {
  const fileName = path.basename(filePath);
  const symbol = fileName.includes('btc') ? 'BTC' : 'ETH';
  
  log('yellow', `\n📊 Analyzing ${symbol} API: ${fileName}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for helper function
    const hasHelperFunction = content.includes('function formatTradingSignal');
    if (hasHelperFunction) {
      log('green', '  ✅ formatTradingSignal helper function found');
    } else {
      log('red', '  ❌ formatTradingSignal helper function missing');
    }
    
    // Check for old format signals
    const oldFormatSignals = content.match(/signals\.push\(\s*\{[^}]*signal:\s*['"`]/g);
    if (oldFormatSignals && oldFormatSignals.length > 0) {
      log('red', `  ❌ Found ${oldFormatSignals.length} old format signals`);
      oldFormatSignals.forEach((match, index) => {
        log('red', `    ${index + 1}. ${match.substring(0, 50)}...`);
      });
    } else {
      log('green', '  ✅ No old format signals found');
    }
    
    // Check for new format signals using helper function
    const newFormatSignals = content.match(/formatTradingSignal\(/g);
    if (newFormatSignals && newFormatSignals.length > 0) {
      log('green', `  ✅ Found ${newFormatSignals.length} new format signals using helper function`);
    } else {
      log('yellow', '  ⚠️ No new format signals found (might be using direct object creation)');
    }
    
    // Check for @ symbols that might cause issues
    const atSymbols = content.match(/@\d+/g);
    if (atSymbols && atSymbols.length > 0) {
      log('red', `  ❌ Found potential @ formatting issues: ${atSymbols.join(', ')}`);
    } else {
      log('green', '  ✅ No @ formatting issues detected');
    }
    
    // Check for required fields in signal objects
    const requiredFields = ['signal', 'type', 'strength', 'timeframe', 'confidence', 'price', 'reason', 'reasoning'];
    const missingFields = [];
    
    requiredFields.forEach(field => {
      if (!content.includes(`${field}:`)) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length === 0) {
      log('green', '  ✅ All required signal fields are referenced in code');
    } else {
      log('yellow', `  ⚠️ Some fields might be missing: ${missingFields.join(', ')}`);
    }
    
    // Check for hold signal structure
    const holdSignalMatch = content.match(/const holdSignal = \{[^}]*\}/s);
    if (holdSignalMatch) {
      const holdSignal = holdSignalMatch[0];
      if (holdSignal.includes('type:') && holdSignal.includes('price:') && holdSignal.includes('reasoning:')) {
        log('green', '  ✅ Hold signal has correct structure');
      } else {
        log('red', '  ❌ Hold signal missing required fields');
      }
    } else {
      log('yellow', '  ⚠️ Hold signal not found or different structure');
    }
    
    return {
      hasHelper: hasHelperFunction,
      oldSignals: oldFormatSignals ? oldFormatSignals.length : 0,
      newSignals: newFormatSignals ? newFormatSignals.length : 0,
      hasAtIssues: atSymbols && atSymbols.length > 0
    };
    
  } catch (error) {
    log('red', `  ❌ Error reading file: ${error.message}`);
    return null;
  }
}

function main() {
  log('cyan', '🔍 TRADING SIGNALS FIX VERIFICATION');
  log('cyan', '=' .repeat(50));
  
  const apiFiles = [
    'pages/api/btc-analysis-enhanced.ts',
    'pages/api/eth-analysis-enhanced.ts'
  ];
  
  let totalIssues = 0;
  const results = [];
  
  apiFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const result = analyzeApiFile(filePath);
      if (result) {
        results.push(result);
        if (result.oldSignals > 0 || result.hasAtIssues || !result.hasHelper) {
          totalIssues++;
        }
      }
    } else {
      log('red', `❌ File not found: ${filePath}`);
      totalIssues++;
    }
  });
  
  log('cyan', '\n' + '=' .repeat(50));
  log('bright', '📋 SUMMARY:');
  
  if (totalIssues === 0) {
    log('green', '✅ All trading signals appear to be fixed!');
    log('green', '✅ Helper functions are in place');
    log('green', '✅ No old format signals detected');
    log('green', '✅ No @ formatting issues found');
  } else {
    log('red', `❌ Found ${totalIssues} files with potential issues`);
  }
  
  log('bright', '\n🎯 EXPECTED SIGNAL STRUCTURE:');
  log('cyan', '• signal: "BUY"|"SELL"|"HOLD"');
  log('cyan', '• type: "BUY"|"SELL"|"HOLD" (frontend compatibility)');
  log('cyan', '• strength: "WEAK"|"MEDIUM"|"STRONG"');
  log('cyan', '• timeframe: "30M"|"1H"|"4H"|"1D"');
  log('cyan', '• confidence: 50-95 (number)');
  log('cyan', '• price: target price (number)');
  log('cyan', '• reason: detailed explanation (string)');
  log('cyan', '• reasoning: same as reason (frontend compatibility)');
  
  log('bright', '\n🚀 NEXT STEPS:');
  if (totalIssues === 0) {
    log('green', '1. Start the development server: npm run dev');
    log('green', '2. Test the APIs: http://localhost:3000/api/btc-analysis-enhanced');
    log('green', '3. Check the Trading Signals section in the frontend');
  } else {
    log('yellow', '1. Fix remaining issues identified above');
    log('yellow', '2. Re-run this verification script');
    log('yellow', '3. Test the APIs once all issues are resolved');
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeApiFile };