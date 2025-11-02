/**
 * UCIE API Key Validation Script
 * 
 * Validates that all required API keys are configured and working.
 * Provides detailed feedback on missing keys and health status.
 * 
 * Usage:
 *   npx tsx scripts/validate-ucie-api-keys.ts
 * 
 * Requirements: 13.5, 14.2
 */

import { apiKeyManager, validateRequiredApiKeys, API_SERVICES } from '../lib/ucie/apiKeyManager';
import { getAllRateLimiterStates } from '../lib/ucie/rateLimiters';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(80));
}

async function main() {
  log('\n🔐 UCIE API Key Validation\n', colors.bright + colors.blue);

  // 1. Validate required API keys
  logSection('1. Required API Keys');
  const validation = validateRequiredApiKeys();

  if (validation.valid) {
    log('✓ All required API keys are configured', colors.green);
  } else {
    log('✗ Missing required API keys:', colors.red);
    validation.missing.forEach((key) => {
      log(`  - ${key}`, colors.red);
    });
  }

  if (validation.warnings.length > 0) {
    log('\n⚠ Warnings:', colors.yellow);
    validation.warnings.forEach((warning) => {
      log(`  - ${warning}`, colors.yellow);
    });
  }

  // 2. Check configured services
  logSection('2. Configured Services');
  const configuredServices = apiKeyManager.getConfiguredServices();
  const totalServices = Object.keys(API_SERVICES).length;

  log(`Configured: ${configuredServices.length}/${totalServices} services`, colors.cyan);
  
  configuredServices.forEach((service) => {
    const config = API_SERVICES[service];
    log(`  ✓ ${config.name}`, colors.green);
  });

  const unconfiguredServices = Object.keys(API_SERVICES).filter(
    (service) => !configuredServices.includes(service)
  );

  if (unconfiguredServices.length > 0) {
    log('\nUnconfigured services:', colors.yellow);
    unconfiguredServices.forEach((service) => {
      const config = API_SERVICES[service];
      const required = config.required ? ' (REQUIRED)' : ' (optional)';
      log(`  - ${config.name}${required}`, colors.yellow);
    });
  }

  // 3. Check API health
  logSection('3. API Health Check');
  log('Testing API connectivity (this may take a few seconds)...', colors.cyan);

  const healthStatuses = await apiKeyManager.checkAllHealth();
  const availableServices = healthStatuses.filter((s) => s.available).length;

  log(`\nAvailable: ${availableServices}/${healthStatuses.length} services`, colors.cyan);

  healthStatuses.forEach((status) => {
    const icon = status.available ? '✓' : '✗';
    const color = status.available ? colors.green : colors.red;
    const responseTime = status.responseTime > 0 ? ` (${status.responseTime}ms)` : '';
    const error = status.errorMessage ? ` - ${status.errorMessage}` : '';
    
    log(`  ${icon} ${status.name}${responseTime}${error}`, color);
  });

  // 4. Check rate limiters
  logSection('4. Rate Limiter Status');
  const rateLimitStates = getAllRateLimiterStates();

  Object.entries(rateLimitStates).forEach(([service, state]) => {
    const percentage = (state.availableTokens / state.maxTokens) * 100;
    const color = percentage > 50 ? colors.green : percentage > 20 ? colors.yellow : colors.red;
    
    log(
      `  ${service}: ${state.availableTokens}/${state.maxTokens} tokens (${percentage.toFixed(0)}%)`,
      color
    );
    
    if (state.queueLength > 0) {
      log(`    Queue: ${state.queueLength} pending requests`, colors.yellow);
    }
  });

  // 5. System health summary
  logSection('5. System Health Summary');
  const summary = apiKeyManager.getSystemHealthSummary();

  log(`Total Services: ${summary.totalServices}`, colors.cyan);
  log(`Configured: ${summary.configuredServices}`, colors.cyan);
  log(`Available: ${summary.availableServices}`, colors.cyan);
  log(`Total Requests: ${summary.totalRequests}`, colors.cyan);
  log(`Total Cost: $${summary.totalCost.toFixed(2)}`, colors.cyan);

  if (summary.missingRequiredKeys.length > 0) {
    log(`\nMissing Required Keys: ${summary.missingRequiredKeys.length}`, colors.red);
    summary.missingRequiredKeys.forEach((key) => {
      log(`  - ${key}`, colors.red);
    });
  }

  // 6. Final verdict
  logSection('6. Validation Result');

  const allRequiredConfigured = validation.valid;
  const allRequiredAvailable = validation.missing.every((key) => {
    const status = healthStatuses.find((s) => s.name === key);
    return status?.available || false;
  });

  if (allRequiredConfigured && allRequiredAvailable) {
    log('✓ UCIE is ready to use!', colors.bright + colors.green);
    log('All required API keys are configured and working.', colors.green);
  } else if (allRequiredConfigured) {
    log('⚠ UCIE is partially ready', colors.bright + colors.yellow);
    log('All required API keys are configured, but some services are unavailable.', colors.yellow);
    log('Check the health status above for details.', colors.yellow);
  } else {
    log('✗ UCIE is not ready', colors.bright + colors.red);
    log('Some required API keys are missing.', colors.red);
    log('Configure the missing keys in .env.local and try again.', colors.red);
  }

  // 7. Next steps
  logSection('7. Next Steps');

  if (!allRequiredConfigured) {
    log('1. Configure missing required API keys in .env.local', colors.cyan);
    log('2. Run this script again to validate', colors.cyan);
    log('3. See lib/ucie/README-API-KEYS.md for setup instructions', colors.cyan);
  } else if (!allRequiredAvailable) {
    log('1. Check API provider status pages', colors.cyan);
    log('2. Verify API keys are valid and not expired', colors.cyan);
    log('3. Check network connectivity', colors.cyan);
    log('4. Review error messages above', colors.cyan);
  } else {
    log('1. Start the development server: npm run dev', colors.cyan);
    log('2. Navigate to /ucie to use the analysis tool', colors.cyan);
    log('3. Monitor API usage: GET /api/ucie/health', colors.cyan);
    log('4. Track costs: GET /api/ucie/costs', colors.cyan);
  }

  console.log('\n');

  // Exit with appropriate code
  process.exit(allRequiredConfigured ? 0 : 1);
}

// Run the validation
main().catch((error) => {
  log('\n✗ Validation failed with error:', colors.red);
  console.error(error);
  process.exit(1);
});
