/**
 * Contrast Ratio Validation Utilities
 * 
 * Provides utilities for checking WCAG contrast compliance,
 * runtime validation in development, and automated testing helpers.
 */

// WCAG contrast ratio thresholds
export const WCAG_THRESHOLDS = {
  AA_NORMAL: 4.5,     // WCAG AA for normal text (< 18pt or < 14pt bold)
  AA_LARGE: 3.0,      // WCAG AA for large text (>= 18pt or >= 14pt bold)
  AAA_NORMAL: 7.0,    // WCAG AAA for normal text
  AAA_LARGE: 4.5,     // WCAG AAA for large text
} as const;

export type WCAGLevel = 'AA' | 'AAA';
export type TextSize = 'normal' | 'large';

export interface ContrastResult {
  ratio: number;
  passes: boolean;
  level: WCAGLevel;
  textSize: TextSize;
  foreground: string;
  background: string;
}

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle 3-digit hex
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

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 specification
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  // Convert RGB to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;
  
  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  if (!fgRgb || !bgRgb) {
    throw new Error('Invalid color format. Please use hex colors (e.g., #ffffff)');
  }
  
  const fgLuminance = getRelativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLuminance = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // Ensure lighter color is in numerator
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG guidelines
 */
export function checkWCAGCompliance(
  foreground: string,
  background: string,
  textSize: TextSize = 'normal',
  level: WCAGLevel = 'AA'
): ContrastResult {
  const ratio = calculateContrastRatio(foreground, background);
  
  let threshold: number;
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

/**
 * Get contrast validation for mobile-specific color combinations
 */
export function validateMobileColors(): ContrastResult[] {
  const mobileColorCombinations = [
    { fg: '#000000', bg: '#ffffff', size: 'normal' as TextSize }, // mobile-text-primary on mobile-bg-primary
    { fg: '#374151', bg: '#f9fafb', size: 'normal' as TextSize }, // mobile-text-secondary on mobile-bg-secondary
    { fg: '#1f2937', bg: '#f3f4f6', size: 'normal' as TextSize }, // accent text
    { fg: '#dc2626', bg: '#fef2f2', size: 'normal' as TextSize }, // error states
    { fg: '#ffffff', bg: '#1f2937', size: 'normal' as TextSize }, // white text on dark
    { fg: '#000000', bg: '#ffffff', size: 'large' as TextSize },  // large text combinations
    { fg: '#374151', bg: '#ffffff', size: 'large' as TextSize },
  ];
  
  return mobileColorCombinations.map(combo => 
    checkWCAGCompliance(combo.fg, combo.bg, combo.size)
  );
}
/**
 *
 Runtime contrast validation for development
 */

export interface ValidationWarning {
  element: string;
  foreground: string;
  background: string;
  ratio: number;
  required: number;
  message: string;
}

/**
 * Extract computed color from CSS
 */
function getComputedColor(element: Element, property: 'color' | 'background-color'): string {
  const computed = window.getComputedStyle(element);
  const color = computed.getPropertyValue(property);
  
  // Convert rgb/rgba to hex
  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      const r = parseInt(matches[0]);
      const g = parseInt(matches[1]);
      const b = parseInt(matches[2]);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }
  
  return color;
}

/**
 * Determine if text is considered large based on font size and weight
 */
function isLargeText(element: Element): boolean {
  const computed = window.getComputedStyle(element);
  const fontSize = parseFloat(computed.fontSize);
  const fontWeight = computed.fontWeight;
  
  // Large text: >= 18pt (24px) or >= 14pt (18.67px) and bold
  return fontSize >= 24 || (fontSize >= 18.67 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
}

/**
 * Validate contrast for a specific element
 */
export function validateElementContrast(element: Element): ValidationWarning | null {
  try {
    const foreground = getComputedColor(element, 'color');
    const background = getComputedColor(element, 'background-color');
    
    // Skip if we can't get valid colors
    if (!foreground.startsWith('#') || !background.startsWith('#')) {
      return null;
    }
    
    const textSize = isLargeText(element) ? 'large' : 'normal';
    const result = checkWCAGCompliance(foreground, background, textSize);
    
    if (!result.passes) {
      const required = textSize === 'large' ? WCAG_THRESHOLDS.AA_LARGE : WCAG_THRESHOLDS.AA_NORMAL;
      
      return {
        element: element.tagName.toLowerCase() + (element.className ? `.${element.className.split(' ').join('.')}` : ''),
        foreground,
        background,
        ratio: result.ratio,
        required,
        message: `Contrast ratio ${result.ratio.toFixed(2)} is below required ${required} for ${textSize} text`,
      };
    }
    
    return null;
  } catch (error) {
    console.warn('Error validating element contrast:', error);
    return null;
  }
}

/**
 * Scan entire page for contrast violations
 */
export function scanPageContrast(): ValidationWarning[] {
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, button, label, input, textarea');
  const warnings: ValidationWarning[] = [];
  
  textElements.forEach(element => {
    const warning = validateElementContrast(element);
    if (warning) {
      warnings.push(warning);
    }
  });
  
  return warnings;
}

/**
 * Development-only contrast monitoring
 */
export function enableContrastMonitoring(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  console.log('🎨 Contrast monitoring enabled for development');
  
  // Initial scan
  setTimeout(() => {
    const warnings = scanPageContrast();
    if (warnings.length > 0) {
      console.group('⚠️ Contrast Violations Found');
      warnings.forEach(warning => {
        console.warn(`${warning.element}: ${warning.message}`, {
          foreground: warning.foreground,
          background: warning.background,
          ratio: warning.ratio,
          required: warning.required,
        });
      });
      console.groupEnd();
    } else {
      console.log('✅ No contrast violations found');
    }
  }, 1000);
  
  // Monitor for dynamic content changes
  const observer = new MutationObserver(() => {
    setTimeout(() => {
      const warnings = scanPageContrast();
      if (warnings.length > 0) {
        console.warn(`🔄 New contrast violations detected: ${warnings.length} issues`);
      }
    }, 500);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style'],
  });
}

/**
 * React hook for contrast validation
 */
export function useContrastValidation(enabled: boolean = process.env.NODE_ENV === 'development') {
  if (typeof window === 'undefined' || !enabled) {
    return { validateElement: () => null, scanPage: () => [] };
  }
  
  return {
    validateElement: validateElementContrast,
    scanPage: scanPageContrast,
  };
}/**

 * Automated contrast testing helpers
 */

export interface ContrastTestCase {
  name: string;
  foreground: string;
  background: string;
  textSize: TextSize;
  expectedLevel: WCAGLevel;
  shouldPass: boolean;
}

/**
 * Predefined test cases for mobile optimization
 */
export const MOBILE_CONTRAST_TEST_CASES: ContrastTestCase[] = [
  {
    name: 'Primary mobile text on white background',
    foreground: '#000000',
    background: '#ffffff',
    textSize: 'normal',
    expectedLevel: 'AA',
    shouldPass: true,
  },
  {
    name: 'Secondary mobile text on light gray',
    foreground: '#374151',
    background: '#f9fafb',
    textSize: 'normal',
    expectedLevel: 'AA',
    shouldPass: true,
  },
  {
    name: 'Accent text on gray background',
    foreground: '#1f2937',
    background: '#f3f4f6',
    textSize: 'normal',
    expectedLevel: 'AA',
    shouldPass: true,
  },
  {
    name: 'Error text on error background',
    foreground: '#dc2626',
    background: '#fef2f2',
    textSize: 'normal',
    expectedLevel: 'AA',
    shouldPass: true,
  },
  {
    name: 'White text on dark background',
    foreground: '#ffffff',
    background: '#1f2937',
    textSize: 'normal',
    expectedLevel: 'AA',
    shouldPass: true,
  },
  {
    name: 'Large primary text (should pass with lower threshold)',
    foreground: '#000000',
    background: '#ffffff',
    textSize: 'large',
    expectedLevel: 'AA',
    shouldPass: true,
  },
  {
    name: 'Insufficient contrast (should fail)',
    foreground: '#cccccc',
    background: '#ffffff',
    textSize: 'normal',
    expectedLevel: 'AA',
    shouldPass: false,
  },
];

/**
 * Run automated contrast tests
 */
export function runContrastTests(testCases: ContrastTestCase[] = MOBILE_CONTRAST_TEST_CASES): {
  passed: number;
  failed: number;
  results: Array<ContrastTestCase & ContrastResult & { testPassed: boolean }>;
} {
  const results = testCases.map(testCase => {
    const contrastResult = checkWCAGCompliance(
      testCase.foreground,
      testCase.background,
      testCase.textSize,
      testCase.expectedLevel
    );
    
    const testPassed = contrastResult.passes === testCase.shouldPass;
    
    return {
      ...testCase,
      ...contrastResult,
      testPassed,
    };
  });
  
  const passed = results.filter(r => r.testPassed).length;
  const failed = results.filter(r => !r.testPassed).length;
  
  return { passed, failed, results };
}

/**
 * Generate contrast test report
 */
export function generateContrastReport(testResults?: ReturnType<typeof runContrastTests>): string {
  const results = testResults || runContrastTests();
  
  let report = '# Contrast Validation Report\n\n';
  report += `**Summary:** ${results.passed} passed, ${results.failed} failed\n\n`;
  
  if (results.failed > 0) {
    report += '## Failed Tests\n\n';
    results.results
      .filter(r => !r.testPassed)
      .forEach(result => {
        report += `### ❌ ${result.name}\n`;
        report += `- **Colors:** ${result.foreground} on ${result.background}\n`;
        report += `- **Ratio:** ${result.ratio.toFixed(2)} (required: ${result.textSize === 'large' ? WCAG_THRESHOLDS.AA_LARGE : WCAG_THRESHOLDS.AA_NORMAL})\n`;
        report += `- **Expected:** ${result.shouldPass ? 'Pass' : 'Fail'}, **Actual:** ${result.passes ? 'Pass' : 'Fail'}\n\n`;
      });
  }
  
  report += '## All Test Results\n\n';
  results.results.forEach(result => {
    const status = result.testPassed ? '✅' : '❌';
    report += `${status} **${result.name}:** ${result.ratio.toFixed(2)} (${result.passes ? 'Pass' : 'Fail'})\n`;
  });
  
  return report;
}

/**
 * Validate CSS custom properties for contrast
 */
export function validateCSSCustomProperties(cssVars: Record<string, string>): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  // Common text/background combinations to check
  const combinations = [
    { fg: '--text-primary', bg: '--bg-primary' },
    { fg: '--text-secondary', bg: '--bg-secondary' },
    { fg: '--text-accent', bg: '--bg-accent' },
    { fg: '--text-error', bg: '--bg-error' },
  ];
  
  combinations.forEach(combo => {
    const fgColor = cssVars[combo.fg];
    const bgColor = cssVars[combo.bg];
    
    if (fgColor && bgColor) {
      try {
        const result = checkWCAGCompliance(fgColor, bgColor);
        if (!result.passes) {
          warnings.push({
            element: `CSS variables: ${combo.fg} on ${combo.bg}`,
            foreground: fgColor,
            background: bgColor,
            ratio: result.ratio,
            required: WCAG_THRESHOLDS.AA_NORMAL,
            message: `CSS custom property combination fails contrast requirements`,
          });
        }
      } catch (error) {
        console.warn(`Error validating CSS variables ${combo.fg}/${combo.bg}:`, error);
      }
    }
  });
  
  return warnings;
}

/**
 * Export utility for testing frameworks
 */
export const contrastTestUtils = {
  calculateContrastRatio,
  checkWCAGCompliance,
  validateMobileColors,
  runContrastTests,
  generateContrastReport,
  WCAG_THRESHOLDS,
  MOBILE_CONTRAST_TEST_CASES,
};