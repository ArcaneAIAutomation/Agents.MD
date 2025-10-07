/**
 * Breakpoint Validation Script
 * Validates that all mobile breakpoints are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Mobile Breakpoints Configuration...\n');

// Read Tailwind config
const tailwindConfigPath = path.join(__dirname, 'tailwind.config.js');
const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf8');

// Read globals.css
const globalsCssPath = path.join(__dirname, 'styles', 'globals.css');
const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');

// Expected breakpoints
const expectedBreakpoints = {
  'xs': '320px',
  'se': '375px',
  'ip': '390px',
  'ip-max': '428px',
  'sm': '480px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px'
};

// Validation results
const results = {
  tailwind: { passed: 0, failed: 0, details: [] },
  css: { passed: 0, failed: 0, details: [] },
  overall: 'PASS'
};

console.log('📋 Checking Tailwind Config Breakpoints...\n');

// Validate Tailwind breakpoints
Object.entries(expectedBreakpoints).forEach(([name, value]) => {
  const regex = new RegExp(`'${name}':\\s*'${value}'`);
  if (regex.test(tailwindConfig)) {
    results.tailwind.passed++;
    console.log(`  ✅ ${name}: ${value} - Found`);
  } else {
    results.tailwind.failed++;
    results.overall = 'FAIL';
    console.log(`  ❌ ${name}: ${value} - Missing or incorrect`);
    results.tailwind.details.push(`Missing or incorrect: ${name}: ${value}`);
  }
});

console.log('\n📋 Checking CSS Media Queries...\n');

// Expected CSS media queries
const expectedMediaQueries = [
  { name: 'iPhone SE (375px-389px)', pattern: /@media\s+\(min-width:\s*375px\)\s+and\s+\(max-width:\s*389px\)/ },
  { name: 'iPhone 12/13/14 (390px-427px)', pattern: /@media\s+\(min-width:\s*390px\)\s+and\s+\(max-width:\s*427px\)/ },
  { name: 'iPhone Pro Max (428px-479px)', pattern: /@media\s+\(min-width:\s*428px\)\s+and\s+\(max-width:\s*479px\)/ },
  { name: 'Universal Mobile (320px-767px)', pattern: /@media\s+\(min-width:\s*320px\)\s+and\s+\(max-width:\s*767px\)/ }
];

expectedMediaQueries.forEach(({ name, pattern }) => {
  if (pattern.test(globalsCss)) {
    results.css.passed++;
    console.log(`  ✅ ${name} - Found`);
  } else {
    results.css.failed++;
    results.overall = 'FAIL';
    console.log(`  ❌ ${name} - Missing`);
    results.css.details.push(`Missing media query: ${name}`);
  }
});

console.log('\n📋 Checking Responsive Text Scaling...\n');

// Check for clamp() usage
const clampPatterns = [
  { name: 'Zone card text scaling', pattern: /clamp\(0\.[89]rem,\s*3(\.\d+)?vw,\s*[01]\.\d+rem\)/ },
  { name: 'Badge text scaling', pattern: /clamp\(0\.75rem,\s*2\.5vw,\s*0\.875rem\)/ },
  { name: 'Button text scaling', pattern: /clamp\(0\.875rem,\s*3\.5vw,\s*1rem\)/ }
];

clampPatterns.forEach(({ name, pattern }) => {
  if (pattern.test(globalsCss)) {
    results.css.passed++;
    console.log(`  ✅ ${name} - Found`);
  } else {
    results.css.failed++;
    console.log(`  ⚠️  ${name} - Not found (may be optional)`);
  }
});

console.log('\n📋 Checking Touch Target Sizing...\n');

// Check for touch target sizing
const touchTargetPatterns = [
  { name: 'Minimum 44px touch targets', pattern: /min-height:\s*44px/ },
  { name: 'Minimum 48px touch targets (Pro Max)', pattern: /min-height:\s*48px/ }
];

touchTargetPatterns.forEach(({ name, pattern }) => {
  if (pattern.test(globalsCss)) {
    results.css.passed++;
    console.log(`  ✅ ${name} - Found`);
  } else {
    results.css.failed++;
    console.log(`  ⚠️  ${name} - Not found`);
  }
});

console.log('\n📋 Checking Container Padding Adjustments...\n');

// Check for container padding at different breakpoints
const paddingPatterns = [
  { name: 'iPhone SE padding (16px)', pattern: /padding(-left|-right)?:\s*16px/ },
  { name: 'iPhone 12/13/14 padding (18px)', pattern: /padding(-left|-right)?:\s*18px/ },
  { name: 'iPhone Pro Max padding (20px)', pattern: /padding(-left|-right)?:\s*20px/ }
];

paddingPatterns.forEach(({ name, pattern }) => {
  if (pattern.test(globalsCss)) {
    results.css.passed++;
    console.log(`  ✅ ${name} - Found`);
  } else {
    results.css.failed++;
    console.log(`  ⚠️  ${name} - Not found`);
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));
console.log(`\nTailwind Config:`);
console.log(`  ✅ Passed: ${results.tailwind.passed}`);
console.log(`  ❌ Failed: ${results.tailwind.failed}`);

console.log(`\nCSS Media Queries & Styles:`);
console.log(`  ✅ Passed: ${results.css.passed}`);
console.log(`  ❌ Failed: ${results.css.failed}`);

console.log(`\nOverall Status: ${results.overall === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);

if (results.overall === 'FAIL') {
  console.log('\n⚠️  Issues Found:');
  if (results.tailwind.details.length > 0) {
    console.log('\nTailwind Config Issues:');
    results.tailwind.details.forEach(detail => console.log(`  - ${detail}`));
  }
  if (results.css.details.length > 0) {
    console.log('\nCSS Issues:');
    results.css.details.forEach(detail => console.log(`  - ${detail}`));
  }
  process.exit(1);
} else {
  console.log('\n✅ All critical breakpoints are properly configured!');
  console.log('\n📝 Next Steps:');
  console.log('  1. Test at 320px, 375px, 390px, 428px, and 768px widths');
  console.log('  2. Verify text containment in zone cards and badges');
  console.log('  3. Check touch target sizes on physical devices');
  console.log('  4. Open test-mobile-breakpoints.html in browser for visual testing');
  process.exit(0);
}
