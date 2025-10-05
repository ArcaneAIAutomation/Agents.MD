/**
 * Mobile Accessibility Testing Utilities
 * 
 * Provides utilities for validating touch target sizes, mobile accessibility compliance,
 * and comprehensive mobile accessibility testing helpers.
 */

import { ValidationWarning, ContrastResult } from './contrastValidation';

// Touch target size standards
export const TOUCH_TARGET_STANDARDS = {
  MINIMUM_SIZE: 44, // iOS/Android minimum (44px)
  RECOMMENDED_SIZE: 48, // Material Design recommendation
  MINIMUM_SPACING: 8, // Minimum spacing between targets
  RECOMMENDED_SPACING: 16, // Recommended spacing
} as const;

export interface TouchTargetResult {
  element: string;
  width: number;
  height: number;
  size: number; // Minimum of width/height
  passes: boolean;
  spacing: TouchTargetSpacing[];
  recommendations: string[];
}

export interface TouchTargetSpacing {
  direction: 'top' | 'right' | 'bottom' | 'left';
  distance: number;
  passes: boolean;
  nearestElement?: string;
}

export interface MobileAccessibilityReport {
  touchTargets: TouchTargetResult[];
  contrastIssues: ValidationWarning[];
  generalIssues: AccessibilityIssue[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    touchTargetIssues: number;
    contrastIssues: number;
    score: number; // 0-100
  };
}

export interface AccessibilityIssue {
  type: 'touch-target' | 'contrast' | 'focus' | 'aria' | 'semantic';
  severity: 'critical' | 'major' | 'minor';
  element: string;
  message: string;
  recommendation: string;
}

/**
 * Get element dimensions and position
 */
function getElementMetrics(element: Element): {
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
} {
  const rect = element.getBoundingClientRect();
  const computed = window.getComputedStyle(element);
  
  // Include padding in touch target size
  const paddingTop = parseFloat(computed.paddingTop) || 0;
  const paddingBottom = parseFloat(computed.paddingBottom) || 0;
  const paddingLeft = parseFloat(computed.paddingLeft) || 0;
  const paddingRight = parseFloat(computed.paddingRight) || 0;
  
  return {
    width: rect.width + paddingLeft + paddingRight,
    height: rect.height + paddingTop + paddingBottom,
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
  };
}

/**
 * Check if element is interactive (clickable/tappable)
 */
function isInteractiveElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute('role');
  const tabIndex = element.getAttribute('tabindex');
  
  // Standard interactive elements
  const interactiveTags = ['button', 'a', 'input', 'select', 'textarea', 'label'];
  if (interactiveTags.includes(tagName)) {
    return true;
  }
  
  // Elements with interactive roles
  const interactiveRoles = ['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio'];
  if (role && interactiveRoles.includes(role)) {
    return true;
  }
  
  // Elements with click handlers or tabindex
  if (tabIndex !== null || element.hasAttribute('onclick')) {
    return true;
  }
  
  // Check for event listeners (limited detection)
  const hasClickListener = (element as any)._listeners?.click || 
                          element.getAttribute('onclick') ||
                          element.classList.contains('cursor-pointer');
  
  return !!hasClickListener;
}

/**
 * Calculate spacing between two elements
 */
function calculateSpacing(element1: Element, element2: Element): number {
  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();
  
  // Calculate minimum distance between rectangles
  const horizontalDistance = Math.max(0, 
    Math.max(rect1.left - rect2.right, rect2.left - rect1.right)
  );
  
  const verticalDistance = Math.max(0,
    Math.max(rect1.top - rect2.bottom, rect2.top - rect1.bottom)
  );
  
  // If rectangles overlap, distance is 0
  if (horizontalDistance === 0 && verticalDistance === 0) {
    return 0;
  }
  
  // Return the minimum distance
  return Math.min(horizontalDistance || Infinity, verticalDistance || Infinity);
}

/**
 * Find nearby interactive elements
 */
function findNearbyInteractiveElements(
  targetElement: Element, 
  allInteractiveElements: Element[],
  maxDistance: number = 100
): Element[] {
  const targetRect = targetElement.getBoundingClientRect();
  
  return allInteractiveElements
    .filter(element => element !== targetElement)
    .filter(element => {
      const distance = calculateSpacing(targetElement, element);
      return distance <= maxDistance;
    })
    .sort((a, b) => {
      const distanceA = calculateSpacing(targetElement, a);
      const distanceB = calculateSpacing(targetElement, b);
      return distanceA - distanceB;
    });
}

/**
 * Validate touch target size for a single element
 */
export function validateTouchTarget(element: Element): TouchTargetResult {
  const metrics = getElementMetrics(element);
  const size = Math.min(metrics.width, metrics.height);
  const passes = size >= TOUCH_TARGET_STANDARDS.MINIMUM_SIZE;
  
  // Find all interactive elements for spacing analysis
  const allInteractive = Array.from(document.querySelectorAll('*'))
    .filter(isInteractiveElement);
  
  const nearbyElements = findNearbyInteractiveElements(element, allInteractive);
  
  // Calculate spacing to nearby elements
  const spacing: TouchTargetSpacing[] = nearbyElements.slice(0, 4).map(nearbyElement => {
    const distance = calculateSpacing(element, nearbyElement);
    const nearbyRect = nearbyElement.getBoundingClientRect();
    const targetRect = element.getBoundingClientRect();
    
    // Determine direction
    let direction: TouchTargetSpacing['direction'] = 'right';
    if (nearbyRect.bottom < targetRect.top) direction = 'top';
    else if (nearbyRect.left > targetRect.right) direction = 'right';
    else if (nearbyRect.top > targetRect.bottom) direction = 'bottom';
    else if (nearbyRect.right < targetRect.left) direction = 'left';
    
    return {
      direction,
      distance,
      passes: distance >= TOUCH_TARGET_STANDARDS.MINIMUM_SPACING,
      nearestElement: nearbyElement.tagName.toLowerCase() + 
                     (nearbyElement.className ? `.${nearbyElement.className.split(' ').join('.')}` : ''),
    };
  });
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (size < TOUCH_TARGET_STANDARDS.MINIMUM_SIZE) {
    recommendations.push(`Increase size to at least ${TOUCH_TARGET_STANDARDS.MINIMUM_SIZE}px (currently ${size.toFixed(1)}px)`);
  }
  if (size < TOUCH_TARGET_STANDARDS.RECOMMENDED_SIZE) {
    recommendations.push(`Consider increasing to recommended ${TOUCH_TARGET_STANDARDS.RECOMMENDED_SIZE}px for better usability`);
  }
  
  const inadequateSpacing = spacing.filter(s => !s.passes);
  if (inadequateSpacing.length > 0) {
    recommendations.push(`Increase spacing to nearby elements (minimum ${TOUCH_TARGET_STANDARDS.MINIMUM_SPACING}px)`);
  }
  
  return {
    element: element.tagName.toLowerCase() + (element.className ? `.${element.className.split(' ').join('.')}` : ''),
    width: metrics.width,
    height: metrics.height,
    size,
    passes: passes && spacing.every(s => s.passes),
    spacing,
    recommendations,
  };
}

/**
 * Scan page for touch target violations
 */
export function scanTouchTargets(): TouchTargetResult[] {
  const interactiveElements = Array.from(document.querySelectorAll('*'))
    .filter(isInteractiveElement)
    .filter(element => {
      // Filter out hidden elements
      const computed = window.getComputedStyle(element);
      return computed.display !== 'none' && computed.visibility !== 'hidden';
    });
  
  return interactiveElements.map(validateTouchTarget);
}

/**
 * Check for common mobile accessibility issues
 */
export function scanMobileAccessibilityIssues(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  
  // Check for missing alt text on images
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.alt && !img.getAttribute('aria-label')) {
      issues.push({
        type: 'aria',
        severity: 'major',
        element: `img[src="${img.src}"]`,
        message: 'Image missing alt text',
        recommendation: 'Add descriptive alt text or aria-label for screen readers',
      });
    }
  });
  
  // Check for missing form labels
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    const id = input.id;
    const hasLabel = id && document.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
    
    if (!hasLabel && !hasAriaLabel) {
      issues.push({
        type: 'aria',
        severity: 'critical',
        element: input.tagName.toLowerCase() + (input.className ? `.${input.className}` : ''),
        message: 'Form input missing label',
        recommendation: 'Add a label element or aria-label attribute',
      });
    }
  });
  
  // Check for missing focus indicators
  const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
  focusableElements.forEach(element => {
    const computed = window.getComputedStyle(element, ':focus');
    const hasOutline = computed.outline !== 'none' && computed.outline !== '0px';
    const hasBoxShadow = computed.boxShadow !== 'none';
    const hasCustomFocus = element.classList.contains('focus:') || 
                          element.classList.toString().includes('focus:');
    
    if (!hasOutline && !hasBoxShadow && !hasCustomFocus) {
      issues.push({
        type: 'focus',
        severity: 'major',
        element: element.tagName.toLowerCase() + (element.className ? `.${element.className.split(' ').join('.')}` : ''),
        message: 'Missing focus indicator',
        recommendation: 'Add visible focus styles for keyboard navigation',
      });
    }
  });
  
  // Check for proper heading hierarchy
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let previousLevel = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level > previousLevel + 1) {
      issues.push({
        type: 'semantic',
        severity: 'minor',
        element: heading.tagName.toLowerCase(),
        message: `Heading level skipped (h${previousLevel} to h${level})`,
        recommendation: 'Use sequential heading levels for proper document structure',
      });
    }
    previousLevel = level;
  });
  
  return issues;
}

/**
 * Generate comprehensive mobile accessibility report
 */
export function generateMobileAccessibilityReport(): MobileAccessibilityReport {
  // Import contrast validation - handle both browser and Node.js environments
  let contrastIssues: any[] = [];
  
  try {
    if (typeof window !== 'undefined') {
      // Browser environment - use dynamic import or direct function call
      const { scanPageContrast } = require('./contrastValidation');
      contrastIssues = scanPageContrast();
    }
  } catch (error) {
    // Fallback for environments where contrast validation is not available
    console.warn('Contrast validation not available:', error);
    contrastIssues = [];
  }
  
  const touchTargets = scanTouchTargets();
  const generalIssues = scanMobileAccessibilityIssues();
  
  const touchTargetIssues = touchTargets.filter(target => !target.passes).length;
  const criticalIssues = generalIssues.filter(issue => issue.severity === 'critical').length;
  const totalIssues = touchTargetIssues + contrastIssues.length + generalIssues.length;
  
  // Calculate accessibility score (0-100)
  const maxPossibleIssues = touchTargets.length + 20; // Rough estimate
  const score = Math.max(0, Math.round(100 - (totalIssues / maxPossibleIssues) * 100));
  
  return {
    touchTargets,
    contrastIssues,
    generalIssues,
    summary: {
      totalIssues,
      criticalIssues,
      touchTargetIssues,
      contrastIssues: contrastIssues.length,
      score,
    },
  };
}

/**
 * Format accessibility report as readable text
 */
export function formatAccessibilityReport(report: MobileAccessibilityReport): string {
  let output = '# Mobile Accessibility Report\n\n';
  
  // Summary
  output += `## Summary\n`;
  output += `- **Accessibility Score:** ${report.summary.score}/100\n`;
  output += `- **Total Issues:** ${report.summary.totalIssues}\n`;
  output += `- **Critical Issues:** ${report.summary.criticalIssues}\n`;
  output += `- **Touch Target Issues:** ${report.summary.touchTargetIssues}\n`;
  output += `- **Contrast Issues:** ${report.summary.contrastIssues}\n\n`;
  
  // Touch Target Issues
  if (report.summary.touchTargetIssues > 0) {
    output += `## Touch Target Issues\n\n`;
    const failedTargets = report.touchTargets.filter(target => !target.passes);
    failedTargets.forEach(target => {
      output += `### ❌ ${target.element}\n`;
      output += `- **Size:** ${target.size.toFixed(1)}px (minimum: ${TOUCH_TARGET_STANDARDS.MINIMUM_SIZE}px)\n`;
      output += `- **Dimensions:** ${target.width.toFixed(1)}px × ${target.height.toFixed(1)}px\n`;
      if (target.recommendations.length > 0) {
        output += `- **Recommendations:**\n`;
        target.recommendations.forEach(rec => {
          output += `  - ${rec}\n`;
        });
      }
      output += '\n';
    });
  }
  
  // Contrast Issues
  if (report.summary.contrastIssues > 0) {
    output += `## Contrast Issues\n\n`;
    report.contrastIssues.forEach(issue => {
      output += `### ❌ ${issue.element}\n`;
      output += `- **Colors:** ${issue.foreground} on ${issue.background}\n`;
      output += `- **Ratio:** ${issue.ratio.toFixed(2)} (required: ${issue.required})\n`;
      output += `- **Issue:** ${issue.message}\n\n`;
    });
  }
  
  // General Issues
  if (report.generalIssues.length > 0) {
    output += `## Other Accessibility Issues\n\n`;
    const groupedIssues = report.generalIssues.reduce((groups, issue) => {
      const key = issue.severity;
      if (!groups[key]) groups[key] = [];
      groups[key].push(issue);
      return groups;
    }, {} as Record<string, AccessibilityIssue[]>);
    
    ['critical', 'major', 'minor'].forEach(severity => {
      const issues = groupedIssues[severity];
      if (issues && issues.length > 0) {
        output += `### ${severity.charAt(0).toUpperCase() + severity.slice(1)} Issues\n\n`;
        issues.forEach(issue => {
          const icon = severity === 'critical' ? '🚨' : severity === 'major' ? '⚠️' : 'ℹ️';
          output += `${icon} **${issue.element}:** ${issue.message}\n`;
          output += `   - *Recommendation:* ${issue.recommendation}\n\n`;
        });
      }
    });
  }
  
  return output;
}

/**
 * Mobile accessibility testing suite for automated testing
 */
export class MobileAccessibilityTester {
  private results: MobileAccessibilityReport | null = null;
  
  /**
   * Run complete accessibility test suite
   */
  async runTests(): Promise<MobileAccessibilityReport> {
    // Wait for page to be fully loaded
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve);
      });
    }
    
    this.results = generateMobileAccessibilityReport();
    return this.results;
  }
  
  /**
   * Get test results
   */
  getResults(): MobileAccessibilityReport | null {
    return this.results;
  }
  
  /**
   * Check if tests passed (no critical issues)
   */
  passed(): boolean {
    return this.results ? this.results.summary.criticalIssues === 0 : false;
  }
  
  /**
   * Get formatted report
   */
  getReport(): string {
    return this.results ? formatAccessibilityReport(this.results) : 'No test results available';
  }
  
  /**
   * Assert accessibility compliance for testing frameworks
   */
  assertCompliance(options: {
    allowTouchTargetIssues?: boolean;
    allowContrastIssues?: boolean;
    maxScore?: number;
  } = {}): void {
    if (!this.results) {
      throw new Error('No test results available. Run tests first.');
    }
    
    const { allowTouchTargetIssues = false, allowContrastIssues = false, maxScore = 90 } = options;
    
    if (this.results.summary.criticalIssues > 0) {
      throw new Error(`Critical accessibility issues found: ${this.results.summary.criticalIssues}`);
    }
    
    if (!allowTouchTargetIssues && this.results.summary.touchTargetIssues > 0) {
      throw new Error(`Touch target issues found: ${this.results.summary.touchTargetIssues}`);
    }
    
    if (!allowContrastIssues && this.results.summary.contrastIssues > 0) {
      throw new Error(`Contrast issues found: ${this.results.summary.contrastIssues}`);
    }
    
    if (this.results.summary.score < maxScore) {
      throw new Error(`Accessibility score ${this.results.summary.score} below required ${maxScore}`);
    }
  }
}

/**
 * React hook for mobile accessibility testing
 */
export function useMobileAccessibilityTesting(enabled: boolean = process.env.NODE_ENV === 'development') {
  if (typeof window === 'undefined' || !enabled) {
    return {
      runTests: async () => null,
      validateTouchTarget: () => null,
      scanTouchTargets: () => [],
    };
  }
  
  return {
    runTests: async () => generateMobileAccessibilityReport(),
    validateTouchTarget,
    scanTouchTargets,
  };
}

/**
 * Development helper to enable accessibility monitoring
 */
export function enableAccessibilityMonitoring(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  console.log('♿ Mobile accessibility monitoring enabled');
  
  // Run initial accessibility scan
  setTimeout(async () => {
    const tester = new MobileAccessibilityTester();
    const report = await tester.runTests();
    
    if (report.summary.totalIssues > 0) {
      console.group('♿ Accessibility Issues Found');
      console.log(`Score: ${report.summary.score}/100`);
      console.log(`Total Issues: ${report.summary.totalIssues}`);
      
      if (report.summary.criticalIssues > 0) {
        console.error(`🚨 Critical Issues: ${report.summary.criticalIssues}`);
      }
      if (report.summary.touchTargetIssues > 0) {
        console.warn(`👆 Touch Target Issues: ${report.summary.touchTargetIssues}`);
      }
      if (report.summary.contrastIssues > 0) {
        console.warn(`🎨 Contrast Issues: ${report.summary.contrastIssues}`);
      }
      
      console.log('Run generateMobileAccessibilityReport() for detailed report');
      console.groupEnd();
    } else {
      console.log('✅ No accessibility issues found');
    }
  }, 1500);
}

// Export all utilities
export const accessibilityTestUtils = {
  validateTouchTarget,
  scanTouchTargets,
  scanMobileAccessibilityIssues,
  generateMobileAccessibilityReport,
  formatAccessibilityReport,
  MobileAccessibilityTester,
  TOUCH_TARGET_STANDARDS,
};