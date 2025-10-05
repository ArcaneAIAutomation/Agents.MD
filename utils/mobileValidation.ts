/**
 * Mobile Performance and Accessibility Validation Utilities
 * Comprehensive testing for WCAG compliance and mobile optimization
 */

interface ContrastResult {
  ratio: number;
  passes: boolean;
  level: 'AA' | 'AAA' | 'FAIL';
}

interface TouchTargetResult {
  width: number;
  height: number;
  passes: boolean;
  element: string;
}

interface MobileValidationResult {
  contrast: {
    total: number;
    passed: number;
    failed: number;
    results: ContrastResult[];
  };
  touchTargets: {
    total: number;
    passed: number;
    failed: number;
    results: TouchTargetResult[];
  };
  performance: {
    loadTime: number;
    renderTime: number;
    memoryUsage?: number;
    score: number;
  };
  accessibility: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.1 guidelines
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate contrast ratios for all text elements
 */
export function validateContrastRatios(): ContrastResult[] {
  const results: ContrastResult[] = [];
  
  // Define high-contrast color pairs that should be used on mobile
  const mobileColorPairs = [
    { fg: '#000000', bg: '#ffffff', name: 'Primary text on white' },
    { fg: '#374151', bg: '#f9fafb', name: 'Secondary text on light gray' },
    { fg: '#1f2937', bg: '#f3f4f6', name: 'Accent text on gray-100' },
    { fg: '#6b7280', bg: '#ffffff', name: 'Muted text on white' },
    { fg: '#059669', bg: '#ffffff', name: 'Success text on white' },
    { fg: '#dc2626', bg: '#ffffff', name: 'Error text on white' },
    { fg: '#d97706', bg: '#ffffff', name: 'Warning text on white' },
    { fg: '#1d4ed8', bg: '#ffffff', name: 'Info text on white' },
    { fg: '#000000', bg: '#d1fae5', name: 'Text on success background' },
    { fg: '#991b1b', bg: '#fef2f2', name: 'Text on error background' },
    { fg: '#92400e', bg: '#fef3c7', name: 'Text on warning background' },
    { fg: '#1e40af', bg: '#dbeafe', name: 'Text on info background' },
  ];

  mobileColorPairs.forEach(pair => {
    const ratio = calculateContrastRatio(pair.fg, pair.bg);
    const passes = ratio >= 4.5; // WCAG AA standard for normal text
    const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'FAIL';
    
    results.push({
      ratio: Math.round(ratio * 100) / 100,
      passes,
      level
    });
  });

  return results;
}

/**
 * Validate touch target sizes
 */
export function validateTouchTargets(): TouchTargetResult[] {
  const results: TouchTargetResult[] = [];
  
  if (typeof document === 'undefined') {
    return results; // Server-side rendering
  }

  // Find all interactive elements
  const interactiveSelectors = [
    'button',
    'a',
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="reset"]',
    '[role="button"]',
    '[onclick]',
    'select',
    'input[type="checkbox"]',
    'input[type="radio"]',
    '.mobile-retry-button',
    '.mobile-hamburger-btn',
    '.mobile-nav-item'
  ];

  interactiveSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      // WCAG 2.1 AA requires minimum 44x44px touch targets
      const passes = width >= 44 && height >= 44;
      
      results.push({
        width: Math.round(width),
        height: Math.round(height),
        passes,
        element: `${selector}[${index}]`
      });
    });
  });

  return results;
}

/**
 * Measure mobile performance metrics
 */
export function measureMobilePerformance(): Promise<MobileValidationResult['performance']> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({
        loadTime: 0,
        renderTime: 0,
        score: 0
      });
      return;
    }

    const startTime = performance.now();
    
    // Measure load time
    window.addEventListener('load', () => {
      const loadTime = performance.now() - startTime;
      
      // Measure render time
      requestAnimationFrame(() => {
        const renderTime = performance.now() - startTime;
        
        // Get memory usage if available
        const memoryUsage = (performance as any).memory?.usedJSHeapSize;
        
        // Calculate performance score (0-100)
        let score = 100;
        if (loadTime > 3000) score -= 30; // Penalize slow load times
        if (renderTime > 1000) score -= 20; // Penalize slow render times
        if (memoryUsage && memoryUsage > 50 * 1024 * 1024) score -= 20; // Penalize high memory usage
        
        resolve({
          loadTime: Math.round(loadTime),
          renderTime: Math.round(renderTime),
          memoryUsage,
          score: Math.max(0, score)
        });
      });
    });
  });
}

/**
 * Validate mobile accessibility features
 */
export function validateMobileAccessibility(): MobileValidationResult['accessibility'] {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  if (typeof document === 'undefined') {
    return { score: 0, issues, recommendations };
  }

  // Check for proper viewport meta tag
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    issues.push('Missing viewport meta tag');
    recommendations.push('Add <meta name="viewport" content="width=device-width, initial-scale=1">');
  }

  // Check for proper heading hierarchy
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level > previousLevel + 1) {
      issues.push(`Heading hierarchy skip: ${heading.tagName} after h${previousLevel}`);
      recommendations.push('Maintain proper heading hierarchy (h1 → h2 → h3, etc.)');
    }
    previousLevel = level;
  });

  // Check for alt text on images
  const images = document.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.getAttribute('alt')) {
      issues.push(`Image ${index + 1} missing alt text`);
      recommendations.push('Add descriptive alt text to all images');
    }
  });

  // Check for form labels
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach((input, index) => {
    const id = input.getAttribute('id');
    const label = id ? document.querySelector(`label[for="${id}"]`) : null;
    const ariaLabel = input.getAttribute('aria-label');
    
    if (!label && !ariaLabel) {
      issues.push(`Form input ${index + 1} missing label`);
      recommendations.push('Associate all form inputs with labels or aria-label');
    }
  });

  // Check for focus indicators
  const focusableElements = document.querySelectorAll(
    'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  
  // Check for ARIA landmarks
  const landmarks = document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer');
  if (landmarks.length === 0) {
    issues.push('No ARIA landmarks found');
    recommendations.push('Add semantic HTML elements or ARIA landmarks for screen readers');
  }

  // Calculate accessibility score
  const totalChecks = 6; // Number of accessibility checks
  const passedChecks = totalChecks - issues.length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    score,
    issues,
    recommendations
  };
}

/**
 * Run comprehensive mobile validation
 */
export async function runMobileValidation(): Promise<MobileValidationResult> {
  const contrastResults = validateContrastRatios();
  const touchTargetResults = validateTouchTargets();
  const performanceResults = await measureMobilePerformance();
  const accessibilityResults = validateMobileAccessibility();

  const contrastPassed = contrastResults.filter(r => r.passes).length;
  const touchTargetsPassed = touchTargetResults.filter(r => r.passes).length;

  return {
    contrast: {
      total: contrastResults.length,
      passed: contrastPassed,
      failed: contrastResults.length - contrastPassed,
      results: contrastResults
    },
    touchTargets: {
      total: touchTargetResults.length,
      passed: touchTargetsPassed,
      failed: touchTargetResults.length - touchTargetsPassed,
      results: touchTargetResults
    },
    performance: performanceResults,
    accessibility: accessibilityResults
  };
}

/**
 * Generate mobile validation report
 */
export function generateMobileValidationReport(results: MobileValidationResult): string {
  const report = `
# Mobile Optimization Validation Report

## Contrast Ratio Validation
- **Total Tests**: ${results.contrast.total}
- **Passed**: ${results.contrast.passed} (${Math.round((results.contrast.passed / results.contrast.total) * 100)}%)
- **Failed**: ${results.contrast.failed}

### Contrast Results:
${results.contrast.results.map((result, index) => 
  `${index + 1}. Ratio: ${result.ratio}:1 - ${result.level} ${result.passes ? '✅' : '❌'}`
).join('\n')}

## Touch Target Validation
- **Total Elements**: ${results.touchTargets.total}
- **Passed**: ${results.touchTargets.passed} (${Math.round((results.touchTargets.passed / results.touchTargets.total) * 100)}%)
- **Failed**: ${results.touchTargets.failed}

### Failed Touch Targets:
${results.touchTargets.results
  .filter(r => !r.passes)
  .map(result => `- ${result.element}: ${result.width}x${result.height}px (minimum 44x44px required)`)
  .join('\n')}

## Performance Metrics
- **Load Time**: ${results.performance.loadTime}ms
- **Render Time**: ${results.performance.renderTime}ms
- **Memory Usage**: ${results.performance.memoryUsage ? `${Math.round(results.performance.memoryUsage / 1024 / 1024)}MB` : 'N/A'}
- **Performance Score**: ${results.performance.score}/100

## Accessibility Validation
- **Accessibility Score**: ${results.accessibility.score}/100

### Issues Found:
${results.accessibility.issues.map(issue => `- ${issue}`).join('\n')}

### Recommendations:
${results.accessibility.recommendations.map(rec => `- ${rec}`).join('\n')}

## Overall Assessment
${getOverallAssessment(results)}
`;

  return report;
}

function getOverallAssessment(results: MobileValidationResult): string {
  const contrastScore = (results.contrast.passed / results.contrast.total) * 100;
  const touchTargetScore = (results.touchTargets.passed / results.touchTargets.total) * 100;
  const performanceScore = results.performance.score;
  const accessibilityScore = results.accessibility.score;
  
  const overallScore = (contrastScore + touchTargetScore + performanceScore + accessibilityScore) / 4;
  
  if (overallScore >= 90) {
    return '🎉 **EXCELLENT** - Mobile optimization meets all requirements with high performance and accessibility standards.';
  } else if (overallScore >= 80) {
    return '✅ **GOOD** - Mobile optimization is solid with minor areas for improvement.';
  } else if (overallScore >= 70) {
    return '⚠️ **NEEDS IMPROVEMENT** - Some mobile optimization issues need to be addressed.';
  } else {
    return '❌ **POOR** - Significant mobile optimization issues require immediate attention.';
  }
}

export default {
  calculateContrastRatio,
  validateContrastRatios,
  validateTouchTargets,
  measureMobilePerformance,
  validateMobileAccessibility,
  runMobileValidation,
  generateMobileValidationReport
};