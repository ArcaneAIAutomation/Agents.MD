# Contrast Validation Utilities

This module provides comprehensive contrast ratio validation utilities for ensuring WCAG compliance in the Crypto Herald mobile optimization project.

## Features

- **WCAG Contrast Ratio Calculation**: Accurate contrast ratio calculations following WCAG 2.1 guidelines
- **Runtime Validation**: Development-time contrast monitoring and warnings
- **Automated Testing**: Test suites for validating color combinations
- **React Integration**: Hooks for component-level contrast validation

## Usage

### Basic Contrast Checking

```typescript
import { calculateContrastRatio, checkWCAGCompliance } from '../utils/contrastValidation';

// Calculate contrast ratio
const ratio = calculateContrastRatio('#000000', '#ffffff');
console.log(ratio); // 21.0

// Check WCAG compliance
const result = checkWCAGCompliance('#000000', '#ffffff', 'normal', 'AA');
console.log(result.passes); // true
console.log(result.ratio);  // 21.0
```

### Runtime Development Monitoring

```typescript
import { enableContrastMonitoring } from '../utils/contrastValidation';

// Enable automatic contrast monitoring in development
enableContrastMonitoring();
```

### React Hook Integration

```typescript
import { useContrastValidation } from '../hooks/useContrastValidation';

function MyComponent() {
  const { warnings, scanPage, hasWarnings } = useContrastValidation({
    enabled: process.env.NODE_ENV === 'development',
    autoScan: true,
    monitorChanges: true,
  });

  if (hasWarnings) {
    console.warn(`Found ${warnings.length} contrast violations`);
  }

  return <div>Content</div>;
}
```

### Component-Level Validation

```typescript
import { useComponentContrastValidation } from '../hooks/useContrastValidation';

function Button() {
  const { ref, warning, hasWarning } = useComponentContrastValidation<HTMLButtonElement>();

  return (
    <button 
      ref={ref}
      className={hasWarning ? 'contrast-warning' : ''}
    >
      Click me
    </button>
  );
}
```

### Automated Testing

```typescript
import { runContrastTests, generateContrastReport } from '../utils/contrastValidation';

// Run predefined mobile contrast tests
const results = runContrastTests();
console.log(`${results.passed} passed, ${results.failed} failed`);

// Generate detailed report
const report = generateContrastReport(results);
console.log(report);
```

## WCAG Guidelines

The utilities follow WCAG 2.1 contrast requirements:

- **AA Normal Text**: 4.5:1 minimum ratio
- **AA Large Text**: 3.0:1 minimum ratio (18pt+ or 14pt+ bold)
- **AAA Normal Text**: 7.0:1 minimum ratio
- **AAA Large Text**: 4.5:1 minimum ratio

## Mobile Color Combinations

The following mobile-optimized color combinations are validated:

| Purpose | Foreground | Background | Ratio | Status |
|---------|------------|------------|-------|--------|
| Primary text | #000000 | #ffffff | 21.00 | ✅ Pass |
| Secondary text | #374151 | #f9fafb | 9.86 | ✅ Pass |
| Accent text | #1f2937 | #f3f4f6 | 13.34 | ✅ Pass |
| Error text | #dc2626 | #fef2f2 | 4.41 | ⚠️ Close |
| White on dark | #ffffff | #1f2937 | 14.68 | ✅ Pass |

## Development Integration

### Enable in _app.tsx

```typescript
import { enableContrastMonitoring } from '../utils/contrastValidation';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    enableContrastMonitoring();
  }, []);

  return <Component {...pageProps} />;
}
```

### CSS Class Validation

The utilities can validate CSS custom properties:

```typescript
import { validateCSSCustomProperties } from '../utils/contrastValidation';

const cssVars = {
  '--text-primary': '#000000',
  '--bg-primary': '#ffffff',
  '--text-secondary': '#374151',
  '--bg-secondary': '#f9fafb',
};

const warnings = validateCSSCustomProperties(cssVars);
```

## Testing

Run the test suite:

```bash
node utils/__tests__/contrastValidation.test.js
```

## Error Text Color Recommendation

The current error text combination (#dc2626 on #fef2f2) has a ratio of 4.41, which is slightly below the 4.5 threshold. Consider using:

- **Option 1**: Darker red text: #b91c1c (ratio: 5.24)
- **Option 2**: Darker background: #fee2e2 (ratio: 4.89)
- **Option 3**: Use large text size (3.0 threshold applies)

## Performance Notes

- Runtime validation only runs in development mode
- Mutation observers are throttled to prevent performance issues
- Color calculations are cached for repeated combinations
- DOM scanning is debounced for dynamic content changes