/**
 * Gemini Configuration Validation Script
 * 
 * Run this script to validate your Gemini API configuration:
 * node scripts/validate-gemini-config.js
 */

// Load environment variables from .env.local manually
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Parse .env file
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  });
} catch (error) {
  console.error('Warning: Could not load .env.local file');
  console.error('Make sure .env.local exists in the project root\n');
}

console.log('\n=== Gemini API Configuration Validation ===\n');

const errors = [];
const warnings = [];
const info = [];

// Check GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  errors.push('GEMINI_API_KEY is missing');
  errors.push('  → Get your API key from: https://aistudio.google.com/app/apikey');
} else if (!apiKey.startsWith('AIzaSy')) {
  errors.push('GEMINI_API_KEY has invalid format (must start with "AIzaSy")');
} else if (apiKey.length !== 39) {
  errors.push(`GEMINI_API_KEY has invalid length (${apiKey.length} chars, expected 39)`);
} else {
  info.push(`✅ GEMINI_API_KEY is valid (${apiKey.substring(0, 10)}...)`);
}

// Check GEMINI_MODEL
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const validModels = ['gemini-2.5-flash', 'gemini-2.5-pro'];
if (!validModels.includes(model)) {
  warnings.push(`GEMINI_MODEL="${model}" is invalid (valid: ${validModels.join(', ')})`);
  warnings.push('  → Using default: gemini-2.5-flash');
} else {
  info.push(`✅ GEMINI_MODEL: ${model}`);
}

// Check GEMINI_ENABLE_THINKING
const thinking = process.env.GEMINI_ENABLE_THINKING || 'true';
info.push(`✅ GEMINI_ENABLE_THINKING: ${thinking}`);

// Check GEMINI_PRO_THRESHOLD_BTC
const threshold = parseInt(process.env.GEMINI_PRO_THRESHOLD_BTC || '100', 10);
if (isNaN(threshold) || threshold < 1) {
  warnings.push(`GEMINI_PRO_THRESHOLD_BTC="${process.env.GEMINI_PRO_THRESHOLD_BTC}" is invalid`);
  warnings.push('  → Using default: 100');
} else {
  info.push(`✅ GEMINI_PRO_THRESHOLD_BTC: ${threshold} BTC`);
}

// Check GEMINI_MAX_RETRIES
const retries = parseInt(process.env.GEMINI_MAX_RETRIES || '2', 10);
if (isNaN(retries) || retries < 0 || retries > 5) {
  warnings.push(`GEMINI_MAX_RETRIES="${process.env.GEMINI_MAX_RETRIES}" is invalid (0-5)`);
  warnings.push('  → Using default: 2');
} else {
  info.push(`✅ GEMINI_MAX_RETRIES: ${retries}`);
}

// Check GEMINI_TIMEOUT_MS
const timeout = parseInt(process.env.GEMINI_TIMEOUT_MS || '15000', 10);
if (isNaN(timeout) || timeout < 1000 || timeout > 60000) {
  warnings.push(`GEMINI_TIMEOUT_MS="${process.env.GEMINI_TIMEOUT_MS}" is invalid (1000-60000)`);
  warnings.push('  → Using default: 15000');
} else {
  info.push(`✅ GEMINI_TIMEOUT_MS: ${timeout}ms`);
}

// Check token limits
const flashTokens = parseInt(process.env.GEMINI_FLASH_MAX_OUTPUT_TOKENS || '8192', 10);
const proTokens = parseInt(process.env.GEMINI_PRO_MAX_OUTPUT_TOKENS || '32768', 10);
info.push(`✅ GEMINI_FLASH_MAX_OUTPUT_TOKENS: ${flashTokens}`);
info.push(`✅ GEMINI_PRO_MAX_OUTPUT_TOKENS: ${proTokens}`);

// Display results
if (errors.length > 0) {
  console.log('❌ ERRORS:\n');
  errors.forEach(error => console.log(`  ${error}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  warnings.forEach(warning => console.log(`  ${warning}`));
  console.log('');
}

if (info.length > 0) {
  console.log('ℹ️  CONFIGURATION:\n');
  info.forEach(item => console.log(`  ${item}`));
  console.log('');
}

// Summary
if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Gemini API is properly configured.\n');
  process.exit(0);
} else if (errors.length === 0) {
  console.log('✅ Configuration is valid (with warnings)\n');
  process.exit(0);
} else {
  console.log('❌ Configuration has errors. Please fix them before using Gemini API.\n');
  console.log('For help, see:');
  console.log('  - .env.example');
  console.log('  - utils/README-gemini-config.md');
  console.log('  - https://aistudio.google.com/app/apikey\n');
  process.exit(1);
}
