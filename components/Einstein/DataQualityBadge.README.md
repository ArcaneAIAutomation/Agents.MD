# DataQualityBadge Component

## Overview

The `DataQualityBadge` component displays data quality scores with appropriate color coding and verification status. It follows the Bitcoin Sovereign Technology design system (black, orange, white only).

## Requirements

- **Requirements**: 15.2, 13.5
- **Validates**: Requirements 2.3, 2.5, 13.5

## Features

- ✅ Color-coded quality indicators (≥90%, 70-89%, <70%)
- ✅ "100% Data Verified" text with checkmark for perfect quality
- ✅ Orange glow effect for excellent quality (≥90%)
- ✅ Status messages for acceptable and poor quality
- ✅ Bitcoin Sovereign styling (black, orange, white only)
- ✅ Responsive and accessible design

## Usage

### Basic Usage

```tsx
import { DataQualityBadge } from '@/components/Einstein/DataQualityBadge';

// Excellent quality (≥90%)
<DataQualityBadge quality={100} />

// Acceptable quality (70-89%)
<DataQualityBadge quality={85} />

// Poor quality (<70%)
<DataQualityBadge quality={65} />
```

### Without Text Label

```tsx
// Show only percentage
<DataQualityBadge quality={95} showText={false} />
```

### With Custom Styling

```tsx
<DataQualityBadge 
  quality={100} 
  className="mb-4"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `quality` | `number` | Required | Data quality score (0-100) |
| `showText` | `boolean` | `true` | Show descriptive text label |
| `className` | `string` | `''` | Additional CSS classes |

## Quality Levels

### Excellent (≥90%)
- **Background**: Bitcoin Orange (#F7931A)
- **Text**: Black
- **Icon**: ✓ (checkmark)
- **Effect**: Orange glow
- **Label**: "100% Data Verified" (if 100%) or "X% Quality"

### Acceptable (70-89%)
- **Background**: Black
- **Border**: Bitcoin Orange
- **Text**: Bitcoin Orange
- **Icon**: ⚠ (warning)
- **Label**: "X% Quality"
- **Status**: "Acceptable data quality"

### Poor (<70%)
- **Background**: Black
- **Border**: Gray
- **Text**: Gray
- **Icon**: ✗ (cross)
- **Label**: "X% Quality"
- **Status**: "Insufficient data quality"

## Examples

### In Trade Signal Display

```tsx
import { DataQualityBadge } from '@/components/Einstein/DataQualityBadge';

function TradeSignalCard({ signal }) {
  return (
    <div className="bitcoin-block p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-bitcoin-white font-bold">Trade Signal</h3>
        <DataQualityBadge quality={signal.dataQuality} />
      </div>
      {/* Rest of trade signal content */}
    </div>
  );
}
```

### In Data Source Panel

```tsx
import { DataQualityBadge } from '@/components/Einstein/DataQualityBadge';

function DataSourcePanel({ sources }) {
  const quality = (sources.successful / sources.total) * 100;
  
  return (
    <div className="bitcoin-block-subtle p-4">
      <div className="flex items-center justify-between">
        <span className="text-bitcoin-white-60 text-sm">
          Data Sources: {sources.successful}/{sources.total}
        </span>
        <DataQualityBadge quality={quality} showText={false} />
      </div>
    </div>
  );
}
```

### In Analysis Modal Header

```tsx
import { DataQualityBadge } from '@/components/Einstein/DataQualityBadge';

function AnalysisModalHeader({ analysis }) {
  return (
    <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-bitcoin-white">
          Einstein Analysis
        </h2>
        <DataQualityBadge quality={analysis.dataQuality} />
      </div>
    </div>
  );
}
```

## Design System Compliance

This component follows the **Bitcoin Sovereign Technology** design system:

- ✅ **Colors**: Only black (#000000), orange (#F7931A), and white (#FFFFFF)
- ✅ **Typography**: Inter font for UI text
- ✅ **Borders**: Thin orange borders (2px) on black backgrounds
- ✅ **Effects**: Orange glow for emphasis
- ✅ **Accessibility**: High contrast ratios (WCAG AA compliant)

## Accessibility

- ✅ **Color Contrast**: All text meets WCAG AA standards
- ✅ **Icons**: Visual indicators supplemented with text
- ✅ **Status Messages**: Clear descriptions for screen readers
- ✅ **Semantic HTML**: Proper use of semantic elements

## Related Components

- `ExecutionStatusBadge` - Trade execution status indicator
- `PLIndicator` - Profit/loss display component
- `RefreshButton` - Data refresh functionality
- `DataSourceHealthPanel` - API health monitoring

## Testing

```tsx
import { render, screen } from '@testing-library/react';
import { DataQualityBadge } from './DataQualityBadge';

describe('DataQualityBadge', () => {
  it('displays excellent quality (≥90%)', () => {
    render(<DataQualityBadge quality={100} />);
    expect(screen.getByText('100% Data Verified')).toBeInTheDocument();
  });

  it('displays acceptable quality (70-89%)', () => {
    render(<DataQualityBadge quality={85} />);
    expect(screen.getByText('85% Quality')).toBeInTheDocument();
    expect(screen.getByText('Acceptable data quality')).toBeInTheDocument();
  });

  it('displays poor quality (<70%)', () => {
    render(<DataQualityBadge quality={65} />);
    expect(screen.getByText('65% Quality')).toBeInTheDocument();
    expect(screen.getByText('Insufficient data quality')).toBeInTheDocument();
  });

  it('hides text when showText is false', () => {
    render(<DataQualityBadge quality={95} showText={false} />);
    expect(screen.queryByText('95% Quality')).not.toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });
});
```

## Version History

- **v1.0.0** - Initial implementation
  - Color-coded quality indicators
  - "100% Data Verified" text
  - Bitcoin Sovereign styling
  - Status messages for quality levels
