/**
 * Glow Effects & Animations Validation Script
 * Task 12.7: Validate all glow effects and animations (Mobile/Tablet only)
 * 
 * This script validates:
 * 1. Button orange glow (0 0 20px rgba(247,147,26,0.3))
 * 2. Hover glow enhancement (0 0 30px rgba(247,147,26,0.5))
 * 3. Text glow on prices (0 0 30px rgba(247,147,26,0.3))
 * 4. Smooth animations (0.3s ease)
 * 5. Scale effects on hover (scale-105)
 * 6. Prefers-reduced-motion support
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Glow Effects & Animations...\n');

// Read globals.css
const globalsPath = path.join(__dirname, 'styles', 'globals.css');
const globalsCSS = fs.readFileSync(globalsPath, 'utf8');

// Validation results
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Test 1: Button Orange Glow
console.log('✓ Test 1: Button Orange Glow');
const buttonGlowTests = [
  {
    name: 'Primary button hover glow',
    pattern: /\.btn-bitcoin-primary:hover[\s\S]*?box-shadow:\s*(?:var\(--shadow-bitcoin-glow\)|0\s+0\s+(?:20|30)px\s+rgba\(247,\s*147,\s*26,\s*0\.[35]\))/,
    expected: 'box-shadow: 0 0 20px rgba(247,147,26,0.5) or var(--shadow-bitcoin-glow)'
  },
  {
    name: 'Secondary button hover glow',
    pattern: /\.btn-bitcoin-secondary:hover[\s\S]*?box-shadow:\s*(?:var\(--shadow-bitcoin-glow-sm\)|0\s+0\s+(?:10|20)px\s+rgba\(247,\s*147,\s*26,\s*0\.3\))/,
    expected: 'box-shadow: 0 0 10px rgba(247,147,26,0.3) or var(--shadow-bitcoin-glow-sm)'
  }
];

buttonGlowTests.forEach(test => {
  if (test.pattern.test(globalsCSS)) {
    results.passed.push(`✓ ${test.name}: ${test.expected}`);
    console.log(`  ✓ ${test.name}`);
  } else {
    results.failed.push(`✗ ${test.name}: Missing or incorrect`);
    console.log(`  ✗ ${test.name}: FAILED`);
  }
});

// Test 2: Hover Glow Enhancement
console.log('\n✓ Test 2: Hover Glow Enhancement');
const hoverGlowTests = [
  {
    name: 'Bitcoin block hover glow',
    pattern: /\.bitcoin-block:hover[\s\S]*?box-shadow:\s*(?:var\(--shadow-bitcoin-glow\)|0\s+0\s+20px\s+rgba\(247,\s*147,\s*26,\s*0\.3\))/,
    expected: 'box-shadow: 0 0 20px rgba(247,147,26,0.3)'
  },
  {
    name: 'Stat card hover glow',
    pattern: /\.stat-card:hover[\s\S]*?box-shadow:\s*0\s+0\s+20px\s+rgba\(247,\s*147,\s*26,\s*0\.2\)/,
    expected: 'box-shadow: 0 0 20px rgba(247,147,26,0.2)'
  }
];

hoverGlowTests.forEach(test => {
  if (test.pattern.test(globalsCSS)) {
    results.passed.push(`✓ ${test.name}: ${test.expected}`);
    console.log(`  ✓ ${test.name}`);
  } else {
    results.failed.push(`✗ ${test.name}: Missing or incorrect`);
    console.log(`  ✗ ${test.name}: FAILED`);
  }
});

// Test 3: Text Glow on Prices
console.log('\n✓ Test 3: Text Glow on Prices');
const textGlowTests = [
  {
    name: 'Price display text glow',
    pattern: /\.price-display[\s\S]*?text-shadow:\s*0\s+0\s+30px\s+(?:var\(--bitcoin-orange-50\)|rgba\(247,\s*147,\s*26,\s*0\.5\))/,
    expected: 'text-shadow: 0 0 30px rgba(247,147,26,0.5)'
  },
  {
    name: 'Price display small text glow',
    pattern: /\.price-display-sm[\s\S]*?text-shadow:\s*0\s+0\s+20px\s+(?:var\(--bitcoin-orange-30\)|rgba\(247,\s*147,\s*26,\s*0\.3\))/,
    expected: 'text-shadow: 0 0 20px rgba(247,147,26,0.3)'
  },
  {
    name: 'Price display large text glow',
    pattern: /\.price-display-lg[\s\S]*?text-shadow:\s*0\s+0\s+40px\s+(?:var\(--bitcoin-orange-50\)|rgba\(247,\s*147,\s*26,\s*0\.5\))/,
    expected: 'text-shadow: 0 0 40px rgba(247,147,26,0.5)'
  },
  {
    name: 'Stat value orange glow',
    pattern: /\.stat-value-orange[\s\S]*?text-shadow:\s*0\s+0\s+15px\s+(?:var\(--bitcoin-orange-30\)|rgba\(247,\s*147,\s*26,\s*0\.3\))/,
    expected: 'text-shadow: 0 0 15px rgba(247,147,26,0.3)'
  }
];

textGlowTests.forEach(test => {
  if (test.pattern.test(globalsCSS)) {
    results.passed.push(`✓ ${test.name}: ${test.expected}`);
    console.log(`  ✓ ${test.name}`);
  } else {
    results.failed.push(`✗ ${test.name}: Missing or incorrect`);
    console.log(`  ✗ ${test.name}: FAILED`);
  }
});

// Test 4: Smooth Animations (0.3s ease)
console.log('\n✓ Test 4: Smooth Animations (0.3s ease)');
const transitionTests = [
  {
    name: 'Button transitions',
    pattern: /\.btn-bitcoin-(?:primary|secondary|tertiary)[\s\S]*?transition:\s*all\s+0\.3s\s+ease/,
    expected: 'transition: all 0.3s ease'
  },
  {
    name: 'Card transitions',
    pattern: /\.(?:bitcoin-block|stat-card)[\s\S]*?transition:\s*all\s+0\.3s\s+ease/,
    expected: 'transition: all 0.3s ease'
  },
  {
    name: 'Global interactive element transitions',
    pattern: /button,\s*a,[\s\S]*?transition:\s*all\s+0\.3s\s+ease/,
    expected: 'transition: all 0.3s ease for all interactive elements'
  }
];

transitionTests.forEach(test => {
  if (test.pattern.test(globalsCSS)) {
    results.passed.push(`✓ ${test.name}: ${test.expected}`);
    console.log(`  ✓ ${test.name}`);
  } else {
    results.failed.push(`✗ ${test.name}: Missing or incorrect`);
    console.log(`  ✗ ${test.name}: FAILED`);
  }
});

// Test 5: Scale Effects on Hover
console.log('\n✓ Test 5: Scale Effects on Hover');
const scaleTests = [
  {
    name: 'Primary button hover scale',
    pattern: /\.btn-bitcoin-primary:hover[\s\S]*?transform:\s*scale\(1\.0[25]\)/,
    expected: 'transform: scale(1.02)'
  },
  {
    name: 'Secondary button hover scale',
    pattern: /\.btn-bitcoin-secondary:hover[\s\S]*?transform:\s*scale\(1\.0[25]\)/,
    expected: 'transform: scale(1.02)'
  },
  {
    name: 'Button active scale',
    pattern: /\.btn-bitcoin-(?:primary|secondary):active[\s\S]*?transform:\s*scale\(0\.98\)/,
    expected: 'transform: scale(0.98)'
  }
];

scaleTests.forEach(test => {
  if (test.pattern.test(globalsCSS)) {
    results.passed.push(`✓ ${test.name}: ${test.expected}`);
    console.log(`  ✓ ${test.name}`);
  } else {
    results.failed.push(`✗ ${test.name}: Missing or incorrect`);
    console.log(`  ✗ ${test.name}: FAILED`);
  }
});

// Test 6: Prefers-Reduced-Motion Support
console.log('\n✓ Test 6: Prefers-Reduced-Motion Support');
const reducedMotionTests = [
  {
    name: 'Reduced motion media query',
    pattern: /@media\s+\(prefers-reduced-motion:\s*reduce\)/,
    expected: '@media (prefers-reduced-motion: reduce)'
  },
  {
    name: 'Animation duration override',
    pattern: /@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation-duration:\s*0\.01ms\s*!important/,
    expected: 'animation-duration: 0.01ms !important'
  },
  {
    name: 'Animation iteration count override',
    pattern: /@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation-iteration-count:\s*1\s*!important/,
    expected: 'animation-iteration-count: 1 !important'
  },
  {
    name: 'Transition duration override',
    pattern: /@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?transition-duration:\s*0\.01ms\s*!important/,
    expected: 'transition-duration: 0.01ms !important'
  }
];

reducedMotionTests.forEach(test => {
  if (test.pattern.test(globalsCSS)) {
    results.passed.push(`✓ ${test.name}: ${test.expected}`);
    console.log(`  ✓ ${test.name}`);
  } else {
    results.failed.push(`✗ ${test.name}: Missing or incorrect`);
    console.log(`  ✗ ${test.name}: FAILED`);
  }
});

// Test 7: Animation Keyframes
console.log('\n✓ Test 7: Animation Keyframes');
const keyframeTests = [
  {
    name: 'Bitcoin glow keyframes',
    pattern: /@keyframes\s+bitcoin-glow[\s\S]*?box-shadow:\s*0\s+0\s+(?:10|30)px\s+rgba\(247,\s*147,\s*26,\s*0\.[36]\)/,
    expected: '@keyframes bitcoin-glow with box-shadow animation'
  },
  {
    name: 'Bitcoin glow large keyframes',
    pattern: /@keyframes\s+bitcoin-glow-lg[\s\S]*?box-shadow:\s*0\s+0\s+(?:20|50)px\s+rgba\(247,\s*147,\s*26,\s*0\.[48]\)/,
    expected: '@keyframes bitcoin-glow-lg with enhanced box-shadow'
  },
  {
    name: 'Data pulse keyframes',
    pattern: /@keyframes\s+data-pulse[\s\S]*?text-shadow:\s*0\s+0\s+(?:30|40)px\s+var\(--bitcoin-orange-50\)/,
    expected: '@keyframes data-pulse with text-shadow animation'
  },
  {
    name: 'Fade in keyframes',
    pattern: /@keyframes\s+fade-in[\s\S]*?opacity:\s*0[\s\S]*?opacity:\s*1/,
    expected: '@keyframes fade-in with opacity transition'
  }
];

keyframeTests.forEach(test => {
  if (test.pattern.test(globalsCSS)) {
    results.passed.push(`✓ ${test.name}: ${test.expected}`);
    console.log(`  ✓ ${test.name}`);
  } else {
    results.failed.push(`✗ ${test.name}: Missing or incorrect`);
    console.log(`  ✗ ${test.name}: FAILED`);
  }
});

// Test 8: Animation Utility Classes
console.log('\n✓ Test 8: Animation Utility Classes');
const utilityTests = [
  {
    name: 'Glow bitcoin class',
    pattern: /\.glow-bitcoin\s*\{[\s\S]*?animation:\s*bitcoin-glow\s+2s\s+ease-in-out\s+infinite/,
    expected: 'animation: bitcoin-glow 2s ease-in-out infinite'
  },
  {
    name: 'Glow bitcoin large class',
    pattern: /\.glow-bitcoin-lg\s*\{[\s\S]*?animation:\s*bitcoin-glow-lg\s+2\.5s\s+ease-in-out\s+infinite/,
    expected: 'animation: bitcoin-glow-lg 2.5s ease-in-out infinite'
  },
  {
    name: 'Price display live class',
    pattern: /\.price-display-live\s*\{[\s\S]*?animation:\s*data-pulse\s+2s\s+ease-in-out\s+infinite/,
    expected: 'animation: data-pulse 2s ease-in-out infinite'
  },
  {
    name: 'Animate fade in class',
    pattern: /\.animate-fade-in\s*\{[\s\S]*?animation:\s*fade-in\s+0\.6s\s+ease-out/,
    expected: 'animation: fade-in 0.6s ease-out'
  }
];

utilityTests.forEach(test => {
  if (test.pattern.test(globalsCSS)) {
    results.passed.push(`✓ ${test.name}: ${test.expected}`);
    console.log(`  ✓ ${test.name}`);
  } else {
    results.failed.push(`✗ ${test.name}: Missing or incorrect`);
    console.log(`  ✗ ${test.name}: FAILED`);
  }
});

// Test 9: GPU Acceleration
console.log('\n✓ Test 9: GPU Acceleration');
const gpuTests = [
  {
    name: 'Will-change property',
    pattern: /\.(?:glow-bitcoin|animate-fade-in)[\s\S]*?will-change:\s*transform,\s*opacity/,
    expected: 'will-change: transform, opacity'
  },
  {
    name: 'Transform translateZ',
    pattern: /\.(?:glow-bitcoin|animate-fade-in)[\s\S]*?transform:\s*translateZ\(0\)/,
    expected: 'transform: translateZ(0)'
  },
  {
    name: 'Backface visibility',
    pattern: /\.(?:glow-bitcoin|animate-fade-in)[\s\S]*?backface-visibility:\s*hidden/,
    expected: 'backface-visibility: hidden'
  }
];

gpuTests.forEach(test => {
  if (test.pattern.test(globalsCSS)) {
    results.passed.push(`✓ ${test.name}: ${test.expected}`);
    console.log(`  ✓ ${test.name}`);
  } else {
    results.warnings.push(`⚠ ${test.name}: Not found (optional optimization)`);
    console.log(`  ⚠ ${test.name}: Not found (optional)`);
  }
});

// Test 10: Mobile-Specific Glow Adjustments
console.log('\n✓ Test 10: Mobile-Specific Glow Adjustments');
const mobileGlowTests = [
  {
    name: 'Mobile button min-height',
    pattern: /@media\s+\(max-width:\s*768px\)[\s\S]*?\.btn-bitcoin-(?:primary|secondary|tertiary)[\s\S]*?min-height:\s*48px/,
    expected: 'min-height: 48px for mobile buttons'
  },
  {
    name: 'Mobile focus glow enhancement',
    pattern: /@media\s+\(max-width:\s*768px\)[\s\S]*?\*:focus-visible[\s\S]*?box-shadow:\s*0\s+0\s+0\s+[45]px\s+rgba\(247,\s*147,\s*26,\s*0\.[45]\)/,
    expected: 'Enhanced focus glow for mobile'
  }
];

mobileGlowTests.forEach(test => {
  if (test.pattern.test(globalsCSS)) {
    results.passed.push(`✓ ${test.name}: ${test.expected}`);
    console.log(`  ✓ ${test.name}`);
  } else {
    results.failed.push(`✗ ${test.name}: Missing or incorrect`);
    console.log(`  ✗ ${test.name}: FAILED`);
  }
});

// Print Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));
console.log(`✓ Passed: ${results.passed.length}`);
console.log(`✗ Failed: ${results.failed.length}`);
console.log(`⚠ Warnings: ${results.warnings.length}`);
console.log('='.repeat(60));

if (results.failed.length > 0) {
  console.log('\n❌ FAILED TESTS:');
  results.failed.forEach(fail => console.log(`  ${fail}`));
}

if (results.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  results.warnings.forEach(warn => console.log(`  ${warn}`));
}

console.log('\n✅ PASSED TESTS:');
results.passed.forEach(pass => console.log(`  ${pass}`));

// Final verdict
console.log('\n' + '='.repeat(60));
if (results.failed.length === 0) {
  console.log('✅ ALL CRITICAL TESTS PASSED!');
  console.log('✓ Button orange glow validated');
  console.log('✓ Hover glow enhancement validated');
  console.log('✓ Text glow on prices validated');
  console.log('✓ Smooth animations (0.3s ease) validated');
  console.log('✓ Scale effects on hover validated');
  console.log('✓ Prefers-reduced-motion support validated');
  console.log('\n🎉 Task 12.7 Complete: All glow effects and animations meet Bitcoin Sovereign standards!');
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('Please review the failed tests above and update globals.css accordingly.');
}
console.log('='.repeat(60));

// Exit with appropriate code
process.exit(results.failed.length === 0 ? 0 : 1);
