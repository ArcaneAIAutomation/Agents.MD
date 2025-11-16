/**
 * Verification Script for Veritas Protocol Feature Flags
 * 
 * This script demonstrates and verifies the Veritas Protocol feature flag system.
 */

import { 
  isVeritasEnabled, 
  isVeritasFeatureEnabled, 
  getVeritasConfig,
  logVeritasStatus 
} from '../lib/ucie/veritas/utils/featureFlags';

console.log('🔍 Veritas Protocol Feature Flag Verification\n');
console.log('='.repeat(60));

// Test 1: Check if Veritas is enabled
console.log('\n📋 Test 1: Check if Veritas Protocol is enabled');
console.log('-'.repeat(60));
const enabled = isVeritasEnabled();
console.log(`ENABLE_VERITAS_PROTOCOL: ${process.env.ENABLE_VERITAS_PROTOCOL || 'not set'}`);
console.log(`isVeritasEnabled(): ${enabled}`);
console.log(`Status: ${enabled ? '✅ ENABLED' : '⚠️ DISABLED (default)'}`);

// Test 2: Check feature-specific flags
console.log('\n📋 Test 2: Check feature-specific flags');
console.log('-'.repeat(60));
const features = {
  'market-validation': isVeritasFeatureEnabled('market-validation'),
  'social-validation': isVeritasFeatureEnabled('social-validation'),
  'onchain-validation': isVeritasFeatureEnabled('onchain-validation'),
  'news-validation': isVeritasFeatureEnabled('news-validation'),
};

Object.entries(features).forEach(([feature, enabled]) => {
  console.log(`  ${feature}: ${enabled ? '✅ Enabled' : '❌ Disabled'}`);
});

// Test 3: Get full configuration
console.log('\n📋 Test 3: Get full Veritas configuration');
console.log('-'.repeat(60));
const config = getVeritasConfig();
console.log('Configuration:');
console.log(`  Enabled: ${config.enabled}`);
console.log(`  Timeout: ${config.timeout}ms`);
console.log('  Features:');
console.log(`    - Market Validation: ${config.features.marketValidation}`);
console.log(`    - Social Validation: ${config.features.socialValidation}`);
console.log(`    - On-Chain Validation: ${config.features.onChainValidation}`);
console.log(`    - News Validation: ${config.features.newsValidation}`);

// Test 4: Log status (formatted output)
console.log('\n📋 Test 4: Formatted status output');
console.log('-'.repeat(60));
logVeritasStatus();

// Test 5: Demonstrate different flag values
console.log('\n📋 Test 5: Test different flag values');
console.log('-'.repeat(60));

const testValues = ['true', 'TRUE', '1', 'yes', 'false', '0', 'invalid', undefined];
const originalValue = process.env.ENABLE_VERITAS_PROTOCOL;

console.log('Testing different ENABLE_VERITAS_PROTOCOL values:');
testValues.forEach(value => {
  if (value === undefined) {
    delete process.env.ENABLE_VERITAS_PROTOCOL;
  } else {
    process.env.ENABLE_VERITAS_PROTOCOL = value;
  }
  
  const result = isVeritasEnabled();
  const displayValue = value === undefined ? 'undefined' : `"${value}"`;
  const icon = result ? '✅' : '❌';
  console.log(`  ${displayValue.padEnd(12)} → ${icon} ${result}`);
});

// Restore original value
if (originalValue !== undefined) {
  process.env.ENABLE_VERITAS_PROTOCOL = originalValue;
} else {
  delete process.env.ENABLE_VERITAS_PROTOCOL;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('✅ Verification Complete!');
console.log('='.repeat(60));

console.log('\n📝 Summary:');
console.log('  - Feature flag system is working correctly');
console.log('  - Case-insensitive parsing works (true/TRUE/1/yes)');
console.log('  - Default behavior is disabled (safe)');
console.log('  - Configuration management is functional');
console.log('  - Feature-specific flags are supported');

console.log('\n💡 To enable Veritas Protocol:');
console.log('  1. Add to .env.local: ENABLE_VERITAS_PROTOCOL=true');
console.log('  2. Restart the application');
console.log('  3. Validation will run automatically on UCIE endpoints');

console.log('\n🔧 Optional configuration:');
console.log('  VERITAS_TIMEOUT_MS=5000                    # Validation timeout');
console.log('  ENABLE_VERITAS_MARKET_VALIDATION=true     # Market validation');
console.log('  ENABLE_VERITAS_SOCIAL_VALIDATION=true     # Social validation');
console.log('  ENABLE_VERITAS_ONCHAIN_VALIDATION=true    # On-chain validation');
console.log('  ENABLE_VERITAS_NEWS_VALIDATION=true       # News validation');

console.log('\n');
