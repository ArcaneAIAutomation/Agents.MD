# Mobile Accessibility Testing Utilities

This module provides comprehensive utilities for testing mobile accessibility compliance, including contrast ratio validation, touch target size validation, and general mobile accessibility testing helpers.

## Features

- **Touch Target Validation**: Ensures interactive elements meet minimum size requirements (44px)
- **Contrast Ratio Testing**: Validates WCAG contrast compliance (extends existing contrastValidation.ts)
- **Mobile Accessibility Scanning**: Comprehensive accessibility issue detection
- **Automated Testing Support**: Integration with testing frameworks
- **Development Monitoring**: Real-time accessibility feedback during development

## Quick Start

```typescript
import { 
  MobileAccessibilityTester,
  generateMobileAccessibilityReport,
  enableAccessibilityMonitoring 
} from './utils/accessibilityTesting';

// Enable development monitoring
enableAccessibilityMonitoring();

// Generate a comprehensive report
const report = generateMobileAccessibilityReport();
console.log(`Accessibility Score: ${report.summary.score}/100`);

// Use in automated testing
const tester = new MobileAccessibilityTester();
await tester.runTests();
tester.assertCompliance({ maxScore: 90 });
```

## API Reference

### Touch Target Validation

#### `validateTouchTarget(element: Element): TouchTargetResult`

Validates a single interactive element for touch target compliance.

```typescript
const button = document.querySelector('button');
const result = validateTouchTarget(button);

console.log(result.passes); // true/false
console.log(result.size); // minimum dimension in pixels
console.log(result.recommendations); // array of improvement suggestions
```

#### `scanTouchTargets(): TouchTargetResult[]`

Scans the entire page for touch target violations.

```typescript
const results = scanTouchTargets();
const failedTargets = results.filter(target => !target.passes);
console.log(`Found ${failedTargets.length} touch target issues`);
```

### Mobile Accessibility Scanning

#### `scanMobileAccessibilityIssues(): AccessibilityIssue[]`

Detects common mobile accessibility issues:
- Missing alt text on images
- Missing form labels
- Missing focus indicators
- Improper heading hierarchy

```typescript
const issues = scanMobileAccessibilityIssues();
const criticalIssues = issues.filter(issue => issue.severity === 'critical');
```

### Comprehensive Reporting

#### `generateMobileAccessibilityReport(): MobileAccessibilityReport`

Generates a complete accessibility assessment including:
- Touch target analysis
- Contrast ratio validation
- General accessibility issues
- Overall accessibility score (0-100)

```typescript
const report = generateMobileAccessibilityReport();

console.log(`Score: ${report.summary.score}/100`);
console.log(`Total Issues: ${report.summary.totalIssues}`);
console.log(`Critical Issues: ${report.summary.criticalIssues}`);
```

#### `formatAccessibilityReport(report: MobileAccessibilityReport): string`

Formats the report as readable markdown text.

```typescript
const report = generateMobileAccessibilityReport();
const formatted = formatAccessibilityReport(report);
console.log(formatted); // Markdown formatted report
```

### Automated Testing Class

#### `MobileAccessibilityTester`

A comprehensive testing class for integration with testing frameworks.

```typescript
const tester = new MobileAccessibilityTester();

// Run all tests
const results = await tester.runTests();

// Check if tests passed (no critical issues)
const passed = tester.passed();

// Assert compliance with specific requirements
tester.assertCompliance({
  allowTouchTargetIssues: false,
  allowContrastIssues: false,
  maxScore: 90
});

// Get formatted report
const report = tester.getReport();
```

### React Hooks

#### `useMobileAccessibilityTesting(enabled?: boolean)`

React hook for accessibility testing in components.

```typescript
import { useMobileAccessibilityTesting } from './utils/accessibilityTesting';

function MyComponent() {
  const { runTests, validateTouchTarget, scanTouchTargets } = useMobileAccessibilityTesting();
  
  const handleTestAccessibility = async () => {
    const report = await runTests();
    console.log(`Accessibility score: ${report?.summary.score}/100`);
  };
  
  return (
    <button onClick={handleTestAccessibility}>
      Test Accessibility
    </button>
  );
}
```

### Development Monitoring

#### `enableAccessibilityMonitoring(): void`

Enables real-time accessibility monitoring during development.

```typescript
// In your main app file or _app.tsx
import { enableAccessibilityMonitoring } from './utils/accessibilityTesting';

if (process.env.NODE_ENV === 'development') {
  enableAccessibilityMonitoring();
}
```

This will automatically:
- Scan for accessibility issues on page load
- Log issues to the console with detailed information
- Provide actionable recommendations for fixes

## Standards and Thresholds

### Touch Target Standards

```typescript
export const TOUCH_TARGET_STANDARDS = {
  MINIMUM_SIZE: 44,        // iOS/Android minimum (44px)
  RECOMMENDED_SIZE: 48,    // Material Design recommendation
  MINIMUM_SPACING: 8,      // Minimum spacing between targets
  RECOMMENDED_SPACING: 16, // Recommended spacing
};
```

### WCAG Contrast Standards

The utilities use the same standards as `contrastValidation.ts`:
- **AA Normal Text**: 4.5:1 ratio
- **AA Large Text**: 3.0:1 ratio
- **AAA Normal Text**: 7.0:1 ratio
- **AAA Large Text**: 4.5:1 ratio

## Integration with Testing Frameworks

### Jest/Vitest Example

```typescript
import { MobileAccessibilityTester } from './utils/accessibilityTesting';

describe('Mobile Accessibility', () => {
  let tester: MobileAccessibilityTester;
  
  beforeEach(() => {
    tester = new MobileAccessibilityTester();
  });
  
  test('should meet accessibility standards', async () => {
    await tester.runTests();
    
    // Assert no critical issues
    expect(tester.passed()).toBe(true);
    
    // Assert specific compliance requirements
    tester.assertCompliance({
      maxScore: 90,
      allowTouchTargetIssues: false,
      allowContrastIssues: false
    });
  });
  
  test('should have proper touch targets', async () => {
    const report = await tester.runTests();
    expect(report.summary.touchTargetIssues).toBe(0);
  });
});
```

### Cypress Example

```typescript
// cypress/support/commands.ts
Cypress.Commands.add('checkAccessibility', (options = {}) => {
  cy.window().then((win) => {
    return cy.wrap(
      win.eval(`
        import('./utils/accessibilityTesting').then(module => {
          const tester = new module.MobileAccessibilityTester();
          return tester.runTests();
        })
      `)
    ).then((report) => {
      if (report.summary.criticalIssues > 0) {
        throw new Error(\`Critical accessibility issues: \${report.summary.criticalIssues}\`);
      }
    });
  });
});

// In your test
it('should be accessible', () => {
  cy.visit('/');
  cy.checkAccessibility();
});
```

## Common Issues and Solutions

### Touch Target Issues

**Problem**: Buttons or links smaller than 44px
**Solution**: 
```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}
```

**Problem**: Interactive elements too close together
**Solution**:
```css
.interactive-element {
  margin: 8px; /* Minimum spacing */
}
```

### Contrast Issues

**Problem**: Insufficient color contrast
**Solution**: Use the mobile-specific CSS classes:
```css
.mobile-text-primary { color: #000000 !important; }
.mobile-bg-primary { background-color: #ffffff !important; }
```

### Focus Indicators

**Problem**: Missing focus styles
**Solution**:
```css
button:focus, a:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

### Form Labels

**Problem**: Form inputs without labels
**Solution**:
```html
<!-- Use explicit labels -->
<label for="email">Email Address</label>
<input type="email" id="email" name="email" />

<!-- Or use aria-label -->
<input type="email" aria-label="Email Address" />
```

## Performance Considerations

- The accessibility scanner runs asynchronously to avoid blocking the UI
- Touch target validation uses efficient DOM queries
- Development monitoring is automatically disabled in production
- Results are cached to avoid redundant calculations

## Browser Support

- Modern browsers with ES2017+ support
- Requires DOM APIs: `getBoundingClientRect`, `getComputedStyle`
- Works in both browser and Node.js environments (with jsdom)

## Related Files

- `contrastValidation.ts` - Contrast ratio validation utilities
- `useMobileViewport.ts` - Mobile viewport detection
- `useContrastValidation.ts` - React hook for contrast validation

## Contributing

When adding new accessibility checks:

1. Add the check function to `scanMobileAccessibilityIssues()`
2. Include appropriate severity levels (`critical`, `major`, `minor`)
3. Provide actionable recommendations
4. Add test cases to `accessibilityTesting.test.ts`
5. Update this documentation

## Examples

See the `__tests__` directory for comprehensive examples of how to use each utility function.