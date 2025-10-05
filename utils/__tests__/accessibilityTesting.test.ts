/**
 * Tests for Mobile Accessibility Testing Utilities
 */

import {
  validateTouchTarget,
  scanTouchTargets,
  scanMobileAccessibilityIssues,
  generateMobileAccessibilityReport,
  formatAccessibilityReport,
  MobileAccessibilityTester,
  TOUCH_TARGET_STANDARDS,
  accessibilityTestUtils,
} from '../accessibilityTesting';

// Mock DOM environment for testing
const mockElement = (options: {
  tagName?: string;
  className?: string;
  width?: number;
  height?: number;
  attributes?: Record<string, string>;
}) => {
  const element = {
    tagName: options.tagName || 'BUTTON',
    className: options.className || '',
    getAttribute: jest.fn((attr: string) => options.attributes?.[attr] || null),
    hasAttribute: jest.fn((attr: string) => !!options.attributes?.[attr]),
    getBoundingClientRect: jest.fn(() => ({
      width: options.width || 44,
      height: options.height || 44,
      top: 0,
      left: 0,
      right: options.width || 44,
      bottom: options.height || 44,
    })),
    classList: {
      contains: jest.fn(() => false),
      toString: jest.fn(() => options.className || ''),
    },
  } as any;
  
  return element;
};

const mockWindow = () => {
  global.window = {
    getComputedStyle: jest.fn(() => ({
      paddingTop: '0px',
      paddingBottom: '0px',
      paddingLeft: '0px',
      paddingRight: '0px',
      display: 'block',
      visibility: 'visible',
      fontSize: '16px',
      fontWeight: 'normal',
      outline: 'none',
      boxShadow: 'none',
    })),
  } as any;
  
  global.document = {
    readyState: 'complete',
    querySelectorAll: jest.fn(() => []),
    querySelector: jest.fn(() => null),
  } as any;
};

describe('Touch Target Validation', () => {
  beforeEach(() => {
    mockWindow();
  });
  
  test('should validate minimum touch target size', () => {
    const smallButton = mockElement({ width: 30, height: 30 });
    const largeButton = mockElement({ width: 48, height: 48 });
    
    document.querySelectorAll = jest.fn(() => [smallButton, largeButton]);
    
    const smallResult = validateTouchTarget(smallButton);
    const largeResult = validateTouchTarget(largeButton);
    
    expect(smallResult.passes).toBe(false);
    expect(smallResult.size).toBe(30);
    expect(smallResult.recommendations).toContain(
      expect.stringContaining('Increase size to at least 44px')
    );
    
    expect(largeResult.passes).toBe(true);
    expect(largeResult.size).toBe(48);
  });
  
  test('should check touch target standards', () => {
    expect(TOUCH_TARGET_STANDARDS.MINIMUM_SIZE).toBe(44);
    expect(TOUCH_TARGET_STANDARDS.RECOMMENDED_SIZE).toBe(48);
    expect(TOUCH_TARGET_STANDARDS.MINIMUM_SPACING).toBe(8);
    expect(TOUCH_TARGET_STANDARDS.RECOMMENDED_SPACING).toBe(16);
  });
  
  test('should generate recommendations for small targets', () => {
    const tinyButton = mockElement({ width: 20, height: 20 });
    document.querySelectorAll = jest.fn(() => [tinyButton]);
    
    const result = validateTouchTarget(tinyButton);
    
    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations[0]).toContain('Increase size to at least 44px');
    expect(result.recommendations[1]).toContain('Consider increasing to recommended 48px');
  });
});

describe('Mobile Accessibility Issues Scanner', () => {
  beforeEach(() => {
    mockWindow();
  });
  
  test('should detect missing alt text on images', () => {
    const imageWithoutAlt = mockElement({ 
      tagName: 'IMG',
      attributes: { src: 'test.jpg' }
    });
    
    document.querySelectorAll = jest.fn((selector) => {
      if (selector === 'img') return [imageWithoutAlt];
      return [];
    });
    
    const issues = scanMobileAccessibilityIssues();
    
    const altTextIssue = issues.find(issue => 
      issue.type === 'aria' && issue.message === 'Image missing alt text'
    );
    
    expect(altTextIssue).toBeDefined();
    expect(altTextIssue?.severity).toBe('major');
    expect(altTextIssue?.recommendation).toContain('alt text');
  });
  
  test('should detect missing form labels', () => {
    const inputWithoutLabel = mockElement({ 
      tagName: 'INPUT',
      attributes: { type: 'text' }
    });
    
    document.querySelectorAll = jest.fn((selector) => {
      if (selector === 'input, select, textarea') return [inputWithoutLabel];
      return [];
    });
    
    document.querySelector = jest.fn(() => null); // No label found
    
    const issues = scanMobileAccessibilityIssues();
    
    const labelIssue = issues.find(issue => 
      issue.type === 'aria' && issue.message === 'Form input missing label'
    );
    
    expect(labelIssue).toBeDefined();
    expect(labelIssue?.severity).toBe('critical');
  });
  
  test('should detect missing focus indicators', () => {
    const buttonWithoutFocus = mockElement({ tagName: 'BUTTON' });
    
    document.querySelectorAll = jest.fn((selector) => {
      if (selector === 'button, a, input, select, textarea, [tabindex]') {
        return [buttonWithoutFocus];
      }
      return [];
    });
    
    const issues = scanMobileAccessibilityIssues();
    
    const focusIssue = issues.find(issue => 
      issue.type === 'focus' && issue.message === 'Missing focus indicator'
    );
    
    expect(focusIssue).toBeDefined();
    expect(focusIssue?.severity).toBe('major');
  });
});

describe('Mobile Accessibility Report Generation', () => {
  beforeEach(() => {
    mockWindow();
    
    // Mock the contrast validation import
    jest.mock('../contrastValidation', () => ({
      scanPageContrast: jest.fn(() => [
        {
          element: 'div.test',
          foreground: '#cccccc',
          background: '#ffffff',
          ratio: 1.5,
          required: 4.5,
          message: 'Insufficient contrast',
        }
      ]),
    }));
  });
  
  test('should generate comprehensive accessibility report', () => {
    const smallButton = mockElement({ width: 30, height: 30 });
    const imageWithoutAlt = mockElement({ 
      tagName: 'IMG',
      attributes: { src: 'test.jpg' }
    });
    
    document.querySelectorAll = jest.fn((selector) => {
      if (selector === '*') return [smallButton];
      if (selector === 'img') return [imageWithoutAlt];
      return [];
    });
    
    const report = generateMobileAccessibilityReport();
    
    expect(report.summary.totalIssues).toBeGreaterThan(0);
    expect(report.touchTargets).toHaveLength(1);
    expect(report.generalIssues).toHaveLength(1);
    expect(report.summary.score).toBeLessThan(100);
  });
  
  test('should format accessibility report correctly', () => {
    const mockReport = {
      touchTargets: [{
        element: 'button.small',
        width: 30,
        height: 30,
        size: 30,
        passes: false,
        spacing: [],
        recommendations: ['Increase size to at least 44px'],
      }],
      contrastIssues: [{
        element: 'div.low-contrast',
        foreground: '#cccccc',
        background: '#ffffff',
        ratio: 1.5,
        required: 4.5,
        message: 'Insufficient contrast',
      }],
      generalIssues: [{
        type: 'aria' as const,
        severity: 'critical' as const,
        element: 'img.no-alt',
        message: 'Missing alt text',
        recommendation: 'Add alt attribute',
      }],
      summary: {
        totalIssues: 3,
        criticalIssues: 1,
        touchTargetIssues: 1,
        contrastIssues: 1,
        score: 75,
      },
    };
    
    const formatted = formatAccessibilityReport(mockReport);
    
    expect(formatted).toContain('# Mobile Accessibility Report');
    expect(formatted).toContain('Accessibility Score: 75/100');
    expect(formatted).toContain('Total Issues: 3');
    expect(formatted).toContain('Touch Target Issues');
    expect(formatted).toContain('Contrast Issues');
    expect(formatted).toContain('Critical Issues');
  });
});

describe('MobileAccessibilityTester Class', () => {
  beforeEach(() => {
    mockWindow();
  });
  
  test('should run tests and return results', async () => {
    document.querySelectorAll = jest.fn(() => []);
    
    const tester = new MobileAccessibilityTester();
    const results = await tester.runTests();
    
    expect(results).toBeDefined();
    expect(results.summary).toBeDefined();
    expect(tester.getResults()).toBe(results);
  });
  
  test('should check if tests passed', async () => {
    document.querySelectorAll = jest.fn(() => []);
    
    const tester = new MobileAccessibilityTester();
    await tester.runTests();
    
    // Should pass with no critical issues
    expect(tester.passed()).toBe(true);
  });
  
  test('should assert compliance', async () => {
    document.querySelectorAll = jest.fn(() => []);
    
    const tester = new MobileAccessibilityTester();
    await tester.runTests();
    
    // Should not throw with no issues
    expect(() => tester.assertCompliance()).not.toThrow();
    
    // Should not throw with high score requirement
    expect(() => tester.assertCompliance({ maxScore: 95 })).not.toThrow();
  });
  
  test('should throw on compliance failure', async () => {
    // Mock critical issue
    const inputWithoutLabel = mockElement({ 
      tagName: 'INPUT',
      attributes: { type: 'text' }
    });
    
    document.querySelectorAll = jest.fn((selector) => {
      if (selector === 'input, select, textarea') return [inputWithoutLabel];
      return [];
    });
    
    document.querySelector = jest.fn(() => null);
    
    const tester = new MobileAccessibilityTester();
    await tester.runTests();
    
    expect(() => tester.assertCompliance()).toThrow('Critical accessibility issues');
  });
  
  test('should generate formatted report', async () => {
    document.querySelectorAll = jest.fn(() => []);
    
    const tester = new MobileAccessibilityTester();
    await tester.runTests();
    
    const report = tester.getReport();
    expect(report).toContain('Mobile Accessibility Report');
  });
});

describe('Accessibility Test Utils Export', () => {
  test('should export all utilities', () => {
    expect(accessibilityTestUtils.validateTouchTarget).toBeDefined();
    expect(accessibilityTestUtils.scanTouchTargets).toBeDefined();
    expect(accessibilityTestUtils.scanMobileAccessibilityIssues).toBeDefined();
    expect(accessibilityTestUtils.generateMobileAccessibilityReport).toBeDefined();
    expect(accessibilityTestUtils.formatAccessibilityReport).toBeDefined();
    expect(accessibilityTestUtils.MobileAccessibilityTester).toBeDefined();
    expect(accessibilityTestUtils.TOUCH_TARGET_STANDARDS).toBeDefined();
  });
  
  test('should have correct touch target standards', () => {
    const standards = accessibilityTestUtils.TOUCH_TARGET_STANDARDS;
    expect(standards.MINIMUM_SIZE).toBe(44);
    expect(standards.RECOMMENDED_SIZE).toBe(48);
    expect(standards.MINIMUM_SPACING).toBe(8);
    expect(standards.RECOMMENDED_SPACING).toBe(16);
  });
});