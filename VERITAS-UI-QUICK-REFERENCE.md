# Veritas Protocol UI Components - Quick Reference

**Last Updated**: January 27, 2025  
**Status**: Phase 9 Complete (4/6 tasks)

---

## 🎯 Quick Start

### 1. Import Components

```tsx
import VeritasConfidenceScoreBadge from '../components/UCIE/VeritasConfidenceScoreBadge';
import DataQualitySummary from '../components/UCIE/DataQualitySummary';
import ValidationAlertsPanel from '../components/UCIE/ValidationAlertsPanel';
```

### 2. Use in Your Component

```tsx
function MyAnalysisComponent({ data }) {
  // Components only render if validation data exists
  return (
    <div>
      {/* Your existing UI */}
      
      {/* Add Veritas validation display */}
      {data.veritasValidation && (
        <>
          <VeritasConfidenceScoreBadge 
            confidenceScore={data.veritasValidation.confidenceScore}
            showBreakdown={true}
          />
          
          <DataQualitySummary 
            dataQuality={data.veritasValidation.dataQualitySummary}
          />
          
          <ValidationAlertsPanel 
            alerts={data.veritasValidation.alerts}
            discrepancies={data.veritasValidation.discrepancies}
          />
        </>
      )}
    </div>
  );
}
```

---

## 📦 Component Reference

### VeritasConfidenceScoreBadge

**Purpose**: Display overall confidence score with optional breakdown

**Props**:
```tsx
interface VeritasConfidenceScoreBadgeProps {
  confidenceScore: ConfidenceScoreBreakdown;  // Required
  showBreakdown?: boolean;                     // Optional, default: false
  className?: string;                          // Optional
}
```

**Example**:
```tsx
<VeritasConfidenceScoreBadge 
  confidenceScore={{
    overallScore: 85,
    dataSourceAgreement: 90,
    logicalConsistency: 85,
    crossValidationSuccess: 80,
    completeness: 75,
    breakdown: {
      marketData: 95,
      socialSentiment: 80,
      onChainData: 85,
      newsData: 75
    },
    sourceWeights: {
      'CoinGecko': 1.0,
      'CoinMarketCap': 0.9,
      'Kraken': 1.0
    }
  }}
  showBreakdown={true}
/>
```

**Visual Output**:
- Badge with score (e.g., "85/100 - Very Good")
- Color-coded: Green (90+), Yellow (70-89), Orange (60-69), Red (<60)
- Expandable breakdown showing weighted components
- Individual data type scores
- Source trust weights with progress bars

---

### DataQualitySummary

**Purpose**: Display data quality metrics and validation check results

**Props**:
```tsx
interface DataQualitySummaryProps {
  dataQuality: DataQualitySummary;  // Required
  className?: string;                // Optional
}
```

**Example**:
```tsx
<DataQualitySummary 
  dataQuality={{
    overallScore: 85,
    marketDataQuality: 95,
    socialDataQuality: 80,
    onChainDataQuality: 85,
    newsDataQuality: 75,
    passedChecks: [
      'price_consistency',
      'volume_consistency',
      'sentiment_consistency'
    ],
    failedChecks: [
      'market_to_chain_consistency'
    ]
  }}
/>
```

**Visual Output**:
- Overall quality score with progress bar
- Warning banner if score < 70%
- Data type breakdown (4 cards)
- Expandable details with passed/failed checks
- Summary statistics

---

### ValidationAlertsPanel

**Purpose**: Display validation alerts and discrepancies

**Props**:
```tsx
interface ValidationAlertsPanelProps {
  alerts: ValidationAlert[];      // Required
  discrepancies: Discrepancy[];   // Required
  className?: string;              // Optional
}
```

**Example**:
```tsx
<ValidationAlertsPanel 
  alerts={[
    {
      severity: 'warning',
      type: 'market',
      message: 'Price discrepancy detected: 2.5% variance across sources',
      affectedSources: ['CoinGecko', 'CoinMarketCap'],
      recommendation: 'Using Kraken as tie-breaker for final price'
    }
  ]}
  discrepancies={[
    {
      metric: 'price',
      sources: [
        { name: 'CoinGecko', value: 95000 },
        { name: 'CoinMarketCap', value: 97500 }
      ],
      variance: 0.025,
      threshold: 0.015,
      exceeded: true
    }
  ]}
/>
```

**Visual Output**:
- Collapsible panel with alert count
- Severity filter buttons (All/Fatal/Error/Warning/Info)
- Color-coded alert cards
- Discrepancies section with source comparison
- Recommendations for each alert

---

## 🎨 Styling

All components use the **Bitcoin Sovereign** design system:

### Colors
```css
--bitcoin-black: #000000
--bitcoin-orange: #F7931A
--bitcoin-white: #FFFFFF
--bitcoin-white-80: rgba(255, 255, 255, 0.8)
--bitcoin-white-60: rgba(255, 255, 255, 0.6)
--bitcoin-orange-20: rgba(247, 147, 26, 0.2)
```

### Common Classes
```css
.bitcoin-block          /* Black bg, orange border, rounded */
.bitcoin-block-subtle   /* Black bg, subtle orange border */
.btn-bitcoin-primary    /* Orange solid button */
.btn-bitcoin-secondary  /* Orange outline button */
```

---

## 🔧 TypeScript Types

### ConfidenceScoreBreakdown
```typescript
interface ConfidenceScoreBreakdown {
  overallScore: number;           // 0-100
  dataSourceAgreement: number;    // 0-100
  logicalConsistency: number;     // 0-100
  crossValidationSuccess: number; // 0-100
  completeness: number;           // 0-100
  breakdown: {
    marketData: number;
    socialSentiment: number;
    onChainData: number;
    newsData: number;
  };
  sourceWeights?: {
    [sourceName: string]: number; // 0-1
  };
}
```

### DataQualitySummary
```typescript
interface DataQualitySummary {
  overallScore: number;        // 0-100
  marketDataQuality: number;   // 0-100
  socialDataQuality: number;   // 0-100
  onChainDataQuality: number;  // 0-100
  newsDataQuality: number;     // 0-100
  passedChecks: string[];
  failedChecks: string[];
}
```

### ValidationAlert
```typescript
interface ValidationAlert {
  severity: 'info' | 'warning' | 'error' | 'fatal';
  type: 'market' | 'social' | 'onchain' | 'news';
  message: string;
  affectedSources: string[];
  recommendation: string;
}
```

### Discrepancy
```typescript
interface Discrepancy {
  metric: string;
  sources: { name: string; value: any }[];
  variance: number;    // 0-1 (percentage as decimal)
  threshold: number;   // 0-1 (percentage as decimal)
  exceeded: boolean;
}
```

---

## 🚀 Admin Dashboard

### Access
Navigate to `/admin/veritas-alerts` (requires authentication)

### Features
- View all validation alerts
- Filter by status (Pending/Reviewed/All)
- Mark alerts as reviewed with notes
- View review history

### API Endpoints
```typescript
// Get alerts
GET /api/admin/veritas-alerts?filter=pending|reviewed|all

// Mark as reviewed
POST /api/admin/veritas-alerts/review
Body: {
  alertId: string;
  reviewedBy: string;
  notes?: string;
}
```

---

## 🧪 Testing

### Component Testing
```tsx
import { render, screen } from '@testing-library/react';
import VeritasConfidenceScoreBadge from './VeritasConfidenceScoreBadge';

test('renders confidence score', () => {
  render(
    <VeritasConfidenceScoreBadge 
      confidenceScore={{ overallScore: 85, ... }}
    />
  );
  
  expect(screen.getByText('85/100')).toBeInTheDocument();
  expect(screen.getByText('Very Good')).toBeInTheDocument();
});

test('does not render without data', () => {
  const { container } = render(
    <VeritasConfidenceScoreBadge confidenceScore={null} />
  );
  
  expect(container.firstChild).toBeNull();
});
```

---

## 📋 Checklist for Integration

### Before Using Components
- [ ] Ensure `ENABLE_VERITAS_PROTOCOL=true` in environment
- [ ] Verify API endpoints return `veritasValidation` field
- [ ] Check TypeScript types are imported
- [ ] Test with and without validation data

### After Integration
- [ ] Test conditional rendering
- [ ] Verify backward compatibility
- [ ] Check responsive design (mobile/tablet/desktop)
- [ ] Test accessibility (keyboard navigation, screen readers)
- [ ] Verify Bitcoin Sovereign styling

---

## 🐛 Troubleshooting

### Components Not Rendering
**Problem**: Components don't appear  
**Solution**: Check if `veritasValidation` data exists in API response

### TypeScript Errors
**Problem**: Type errors when using components  
**Solution**: Import types from `lib/ucie/veritas/types/validationTypes`

### Styling Issues
**Problem**: Components don't match design  
**Solution**: Ensure Tailwind CSS is configured with Bitcoin Sovereign colors

### Admin Dashboard 401 Error
**Problem**: Unauthorized access  
**Solution**: Ensure user is authenticated before accessing `/admin/veritas-alerts`

---

## 📚 Additional Resources

- **Full Documentation**: `VERITAS-PHASE-9-COMPLETE.md`
- **Implementation Tasks**: `.kiro/specs/ucie-veritas-protocol/tasks.md`
- **Design Spec**: `.kiro/specs/ucie-veritas-protocol/design.md`
- **Requirements**: `.kiro/specs/ucie-veritas-protocol/requirements.md`

---

**Status**: Ready for integration and testing  
**Next Steps**: Integrate into UCIE Analysis Hub (Task 32)
