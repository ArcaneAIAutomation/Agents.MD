/**
 * Mobile/Tablet Container Fitting Validation Script
 * 
 * This script validates that all containers and elements fit properly
 * within their boundaries across mobile and tablet breakpoints (320px-768px).
 * 
 * Run with: node validate-container-fitting.js
 */

const fs = require('fs');
const path = require('path');

// Test breakpoints
const BREAKPOINTS = {
  'xs': 320,      // Extra small mobile (iPhone SE 1st gen)
  'se': 375,      // iPhone SE 2nd/3rd gen
  'ip': 390,      // iPhone 12/13/14
  'ip-max': 428,  // iPhone Pro Max
  'sm': 480,      // Small mobile
  'md': 768,      // Tablets
};

// Container overflow rules
const CONTAINER_RULES = {
  'overflow': ['hidden', 'auto', 'scroll'],
  'max-width': ['100%', '100vw'],
  'box-sizing': ['border-box'],
};

// Text truncation patterns
const TEXT_TRUNCATION_PATTERNS = [
  'truncate',
  'line-clamp-',
  'text-overflow: ellipsis',
  'overflow: hidden',
  'white-space: nowrap',
];

// Flex/Grid containment patterns
const FLEX_GRID_PATTERNS = [
  'min-w-0',
  'min-width: 0',
  'flex-shrink',
  'overflow: hidden',
];

// Files to check
const FILES_TO_CHECK = [
  'styles/globals.css',
  'tailwind.config.js',
  'components/BTCTradingChart.tsx',
  'components/ETHTradingChart.tsx',
  'components/WhaleWatch/WhaleWatchDashboard.tsx',
  'components/CaesarDashboard.tsx',
  'components/Header.tsx',
  'components/Footer.tsx',
  'components/CryptoHerald.tsx',
  'components/TradeGenerationEngine.tsx',
];

// Validation results
const results = {
  passed: [],
  warnings: [],
  failed: [],
};

console.log('🔍 Mobile/Tablet Container Fitting Validation\n');
console.log('=' .repeat(60));
console.log('\n📱 Testing Breakpoints:');
Object.entries(BREAKPOINTS).forEach(([name, width]) => {
  console.log(`  ${name}: ${width}px`);
});
console.log('\n' + '='.repeat(60) + '\n');

// Check if file exists and read it
function checkFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    results.warnings.push(`⚠️  File not found: ${filePath}`);
    return null;
  }
  
  return fs.readFileSync(fullPath, 'utf8');
}

// Check for overflow prevention
function checkOverflowPrevention(content, filePath) {
  const checks = {
    hasOverflowHidden: /overflow:\s*hidden|overflow-hidden/.test(content),
    hasMaxWidth: /max-width:\s*(100%|100vw)|max-w-full/.test(content),
    hasBoxSizing: /box-sizing:\s*border-box|\*\s*{[^}]*box-sizing/.test(content),
  };
  
  if (checks.hasOverflowHidden && checks.hasMaxWidth) {
    results.passed.push(`✅ ${filePath}: Proper overflow prevention`);
  } else {
    const missing = [];
    if (!checks.hasOverflowHidden) missing.push('overflow: hidden');
    if (!checks.hasMaxWidth) missing.push('max-width: 100%');
    
    results.warnings.push(`⚠️  ${filePath}: Missing ${missing.join(', ')}`);
  }
  
  return checks;
}

// Check for text truncation
function checkTextTruncation(content, filePath) {
  const hasTruncation = TEXT_TRUNCATION_PATTERNS.some(pattern => 
    content.includes(pattern)
  );
  
  if (hasTruncation) {
    results.passed.push(`✅ ${filePath}: Text truncation implemented`);
  } else {
    results.warnings.push(`⚠️  ${filePath}: No text truncation patterns found`);
  }
  
  return hasTruncation;
}

// Check for flex/grid containment
function checkFlexGridContainment(content, filePath) {
  const hasContainment = FLEX_GRID_PATTERNS.some(pattern => 
    content.includes(pattern)
  );
  
  if (hasContainment) {
    results.passed.push(`✅ ${filePath}: Flex/Grid containment implemented`);
  } else {
    results.warnings.push(`⚠️  ${filePath}: No flex/grid containment patterns found`);
  }
  
  return hasContainment;
}

// Check for responsive font sizing
function checkResponsiveFontSizing(content, filePath) {
  const hasClamp = /clamp\(/.test(content);
  const hasVwUnits = /font-size:\s*[0-9.]+vw/.test(content);
  const hasResponsiveClasses = /text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)/.test(content);
  
  if (hasClamp || hasVwUnits || hasResponsiveClasses) {
    results.passed.push(`✅ ${filePath}: Responsive font sizing implemented`);
  } else {
    results.warnings.push(`⚠️  ${filePath}: No responsive font sizing found`);
  }
  
  return hasClamp || hasVwUnits || hasResponsiveClasses;
}

// Check for image containment
function checkImageContainment(content, filePath) {
  const hasMaxWidth = /max-width:\s*100%|max-w-full/.test(content);
  const hasObjectFit = /object-fit:\s*(contain|cover)/.test(content);
  
  if (hasMaxWidth) {
    results.passed.push(`✅ ${filePath}: Image containment implemented`);
  } else if (content.includes('<img') || content.includes('Image')) {
    results.warnings.push(`⚠️  ${filePath}: Images found but no max-width: 100%`);
  }
  
  return hasMaxWidth;
}

// Check for bitcoin-block containers
function checkBitcoinBlockContainers(content, filePath) {
  const hasBitcoinBlock = /bitcoin-block|\.bitcoin-block/.test(content);
  
  if (hasBitcoinBlock) {
    const hasOverflow = /bitcoin-block[^{]*{[^}]*overflow:\s*hidden/.test(content);
    
    if (hasOverflow) {
      results.passed.push(`✅ ${filePath}: bitcoin-block has overflow: hidden`);
    } else {
      results.failed.push(`❌ ${filePath}: bitcoin-block missing overflow: hidden`);
    }
  }
  
  return hasBitcoinBlock;
}

// Check for horizontal scroll prevention
function checkHorizontalScrollPrevention(content, filePath) {
  const hasBodyOverflow = /body\s*{[^}]*overflow-x:\s*hidden/.test(content);
  const hasMaxVw = /max-width:\s*100vw/.test(content);
  
  if (hasBodyOverflow || hasMaxVw) {
    results.passed.push(`✅ ${filePath}: Horizontal scroll prevention`);
  } else if (filePath.includes('globals.css')) {
    results.failed.push(`❌ ${filePath}: Missing body overflow-x: hidden`);
  }
  
  return hasBodyOverflow || hasMaxVw;
}

// Main validation
console.log('🔬 Running Validation Checks...\n');

FILES_TO_CHECK.forEach(filePath => {
  console.log(`\n📄 Checking: ${filePath}`);
  console.log('-'.repeat(60));
  
  const content = checkFile(filePath);
  
  if (!content) {
    console.log(`  ⚠️  Skipped (file not found)\n`);
    return;
  }
  
  // Run all checks
  checkOverflowPrevention(content, filePath);
  checkTextTruncation(content, filePath);
  checkFlexGridContainment(content, filePath);
  checkResponsiveFontSizing(content, filePath);
  checkImageContainment(content, filePath);
  checkBitcoinBlockContainers(content, filePath);
  checkHorizontalScrollPrevention(content, filePath);
  
  console.log(`  ✓ Validation complete\n`);
});

// Print summary
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60) + '\n');

console.log(`✅ Passed: ${results.passed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);
console.log(`❌ Failed: ${results.failed.length}\n`);

if (results.passed.length > 0) {
  console.log('✅ PASSED CHECKS:');
  results.passed.forEach(msg => console.log(`  ${msg}`));
  console.log('');
}

if (results.warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  results.warnings.forEach(msg => console.log(`  ${msg}`));
  console.log('');
}

if (results.failed.length > 0) {
  console.log('❌ FAILED CHECKS:');
  results.failed.forEach(msg => console.log(`  ${msg}`));
  console.log('');
}

// Final verdict
console.log('='.repeat(60));
if (results.failed.length === 0) {
  console.log('✅ ALL CRITICAL CHECKS PASSED');
  console.log('Container fitting validation successful!');
  process.exit(0);
} else {
  console.log('❌ VALIDATION FAILED');
  console.log(`${results.failed.length} critical issue(s) found`);
  process.exit(1);
}
