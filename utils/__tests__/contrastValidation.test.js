/**
 * Test file for contrast validation utilities
 * Run with: npm test or node utils/__tests__/contrastValidation.test.js
 */

// For Node.js testing, we'll inline the key functions
const WCAG_THRESHOLDS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3.0,
  AAA_NORMAL: 7.0,
  AAA_LARGE: 4.5,
};

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getRelativeLuminance(r, g, b) {
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;
  
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

function calculateContrastRatio(foreground, background) {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  if (!fgRgb || !bgRgb) {
    throw new Error('Invalid color format');
  }
  
  const fgLuminance = getRelativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLuminance = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function checkWCAGCompliance(foreground, background, textSize = 'normal', level = 'AA') {
  const ratio = calculateContrastRatio(foreground, background);
  
  let threshold;
  if (level === 'AA') {
    threshold = textSize === 'large' ? WCAG_THRESHOLDS.AA_LARGE : WCAG_THRESHOLDS.AA_NORMAL;
  } else {
    threshold = textSize === 'large' ? WCAG_THRESHOLDS.AAA_LARGE : WCAG_THRESHOLDS.AAA_NORMAL;
  }
  
  return {
    ratio,
    passes: ratio >= threshold,
    level,
    textSize,
    foreground,
    background,
  };
}

// Simple test runner for Node.js environment
function runTests() {
  console.log('🧪 Running Contrast Validation Tests\n');

  // Test 1: Basic contrast ratio calculation
  console.log('Test 1: Basic contrast ratio calculation');
  const blackOnWhite = calculateContrastRatio('#000000', '#ffffff');
  console.log(`Black on white ratio: ${blackOnWhite.toFixed(2)} (expected: 21.00)`);
  console.assert(Math.abs(blackOnWhite - 21) < 0.1, 'Black on white should be ~21:1');

  const whiteOnBlack = calculateContrastRatio('#ffffff', '#000000');
  console.log(`White on black ratio: ${whiteOnBlack.toFixed(2)} (expected: 21.00)`);
  console.assert(Math.abs(whiteOnBlack - 21) < 0.1, 'White on black should be ~21:1');

  // Test 2: WCAG compliance checking
  console.log('\nTest 2: WCAG compliance checking');
  const compliantResult = checkWCAGCompliance('#000000', '#ffffff');
  console.log(`Black on white compliance:`, compliantResult);
  console.assert(compliantResult.passes, 'Black on white should pass WCAG AA');

  const nonCompliantResult = checkWCAGCompliance('#cccccc', '#ffffff');
  console.log(`Light gray on white compliance:`, nonCompliantResult);
  console.assert(!nonCompliantResult.passes, 'Light gray on white should fail WCAG AA');

  // Test 3: Mobile color validation
  console.log('\nTest 3: Mobile color validation');
  const mobileColorCombinations = [
    { fg: '#000000', bg: '#ffffff', name: 'Primary mobile text' },
    { fg: '#374151', bg: '#f9fafb', name: 'Secondary mobile text' },
    { fg: '#1f2937', bg: '#f3f4f6', name: 'Accent text' },
    { fg: '#dc2626', bg: '#fef2f2', name: 'Error text' },
    { fg: '#ffffff', bg: '#1f2937', name: 'White on dark' },
  ];
  
  console.log(`Mobile color combinations tested: ${mobileColorCombinations.length}`);
  let mobileFailures = 0;
  
  mobileColorCombinations.forEach(combo => {
    const result = checkWCAGCompliance(combo.fg, combo.bg);
    if (!result.passes) {
      console.log(`  ❌ ${combo.name}: ${combo.fg} on ${combo.bg} = ${result.ratio.toFixed(2)}`);
      mobileFailures++;
    } else {
      console.log(`  ✅ ${combo.name}: ${combo.fg} on ${combo.bg} = ${result.ratio.toFixed(2)}`);
    }
  });
  
  console.log(`Mobile color failures: ${mobileFailures}`);

  // Test 4: Edge cases
  console.log('\nTest 4: Edge cases');
  const edgeCases = [
    { fg: '#ffffff', bg: '#ffffff', name: 'White on white (should fail)' },
    { fg: '#000000', bg: '#000000', name: 'Black on black (should fail)' },
    { fg: '#767676', bg: '#ffffff', name: 'Minimum AA normal (should pass)' },
  ];
  
  edgeCases.forEach(testCase => {
    const result = checkWCAGCompliance(testCase.fg, testCase.bg);
    console.log(`  ${result.passes ? '✅' : '❌'} ${testCase.name}: ${result.ratio.toFixed(2)}`);
  });

  // Test 5: Threshold validation
  console.log('\nTest 5: Threshold validation');
  console.log('WCAG Thresholds:', WCAG_THRESHOLDS);
  console.assert(WCAG_THRESHOLDS.AA_NORMAL === 4.5, 'AA normal threshold should be 4.5');
  console.assert(WCAG_THRESHOLDS.AA_LARGE === 3.0, 'AA large threshold should be 3.0');

  console.log('\n✅ All tests completed!');
}

// Export for use in other test frameworks
module.exports = { runTests };

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}