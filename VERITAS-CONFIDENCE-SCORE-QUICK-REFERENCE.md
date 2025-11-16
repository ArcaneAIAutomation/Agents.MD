# Veritas Confidence Score - Quick Reference

## Overview

The Veritas Confidence Score is a 0-100 metric that indicates the reliability of UCIE analysis based on data quality and consistency.

---

## Score Components (Weighted)

| Component | Weight | Description |
|-----------|--------|-------------|
| **Data Source Agreement** | 40% | How well different data sources agree with each other |
| **Logical Consistency** | 30% | Whether data passes logical impossibility checks |
| **Cross-Validation Success** | 20% | Percentage of validation checks that passed |
| **Completeness** | 10% | Number of available data sources (0-4) |

---

## Score Interpretation

| Score Range | Level | Meaning | Action |
|-------------|-------|---------|--------|
| **90-100** | Excellent | High confidence, strong data quality | ✅ Safe for trading decisions |
| **80-89** | Good | Strong confidence, good data quality | ✅ Reliable for analysis |
| **70-79** | Acceptable | Moderate confidence, acceptable quality | ⚠️ Use with caution |
| **60-69** | Fair | Limited confidence, fair quality | ⚠️ Cross-check before acting |
| **0-59** | Poor | Low confidence, poor quality | ❌ Avoid trading decisions |

---

## Usage

### Basic Usage

```typescript
import { calculateVeritasConfidenceScore } from '@/lib/ucie/veritas';

const score = calculateVeritasConfidenceScore({
  market: marketValidationResult,
  social: socialValidationResult,
  onChain: onChainValidationResult,
  news: newsValidationResult
});

console.log(`Confidence: ${score.overallScore}%`);
```

### Check Threshold

```typescript
import { meetsConfidenceThreshold } from '@/lib/ucie/veritas';

if (meetsConfidenceThreshold(score.overallScore)) {
  // Proceed with analysis
} else {
  // Show warning to user
}
```

### Get Confidence Level

```typescript
import { getConfidenceLevel } from '@/lib/ucie/veritas';

const level = getConfidenceLevel(score.overallScore);
// Returns: 'excellent' | 'good' | 'acceptable' | 'fair' | 'poor'
```

### Get Recommendations

```typescript
import { getRecommendations } from '@/lib/ucie/veritas';

const recommendations = getRecommendations(score);
recommendations.forEach(rec => console.log(rec));
```

---

## Score Breakdown

```typescript
{
  overallScore: 92,                    // Overall confidence (0-100)
  dataSourceAgreement: 95,             // Source agreement score
  logicalConsistency: 100,             // Logical consistency score
  crossValidationSuccess: 87,          // Validation success rate
  completeness: 100,                   // Data completeness
  breakdown: {
    marketData: 95,                    // Individual scores
    socialSentiment: 90,
    onChainData: 92,
    newsData: 88
  },
  sourceWeights: {                     // Dynamic trust weights
    'CoinGecko': 1.0,
    'CoinMarketCap': 0.9,
    'Kraken': 1.0
  },
  explanation: "Excellent data quality...",
  timestamp: "2025-01-27T..."
}
```

---

## Common Scenarios

### Scenario 1: All Sources Available, High Quality
```
Market: 95, Social: 90, OnChain: 92, News: 88
→ Overall Score: ~91 (Excellent)
→ Recommendation: ✅ High confidence - data quality is excellent
```

### Scenario 2: Partial Sources, Good Quality
```
Market: 95, Social: 90
→ Overall Score: ~77 (Acceptable)
→ Recommendation: ⚠️ Limited data sources available
```

### Scenario 3: Fatal Errors Detected
```
Market: 95 (1 fatal error), Social: 90 (1 fatal error)
→ Logical Consistency: 0 (100 - 2*50)
→ Overall Score: ~63 (Fair)
→ Recommendation: 🔍 Logical inconsistencies detected
```

### Scenario 4: Source Disagreement
```
Market: 50, Social: 90
→ Data Source Agreement: Low
→ Overall Score: ~65 (Fair)
→ Recommendation: 📊 Data sources show disagreement
```

---

## Penalties

| Issue | Penalty | Impact |
|-------|---------|--------|
| **Fatal Error** | -50 points | Reduces logical consistency by 50 per error |
| **Failed Check** | Proportional | Reduces cross-validation success rate |
| **Missing Source** | -25% completeness | Reduces completeness score by 25% per missing source |
| **High Variance** | Proportional | Reduces data source agreement |

---

## Recommendations

### Low Confidence (<60)
- ⚠️ Avoid making trading decisions
- Cross-check with additional sources
- Wait for data refresh

### Fair Confidence (60-69)
- ⚠️ Use caution when making decisions
- Review data quality alerts
- Consider waiting for better data

### Acceptable Confidence (70-79)
- ✓ Acceptable for analysis
- Review discrepancies
- Monitor for improvements

### Good Confidence (80-89)
- ✅ Reliable for analysis
- Proceed with confidence
- Minor issues may exist

### Excellent Confidence (90-100)
- ✅ Highest quality data
- Safe for trading decisions
- All checks passed

---

## Integration Points

### API Response
```typescript
{
  // ... existing UCIE data
  veritasValidation: {
    enabled: true,
    confidenceScore: { /* breakdown */ },
    dataQualitySummary: { /* summary */ },
    alerts: [ /* alerts */ ],
    discrepancies: [ /* discrepancies */ ]
  }
}
```

### UI Display
```tsx
<VeritasConfidenceScoreBadge score={confidenceScore} />
```

### Decision Logic
```typescript
if (confidenceScore.overallScore >= 70) {
  // Proceed with analysis
} else {
  // Show warning
}
```

---

## Quick Checklist

Before trusting analysis:
- [ ] Overall score ≥ 70%
- [ ] No fatal errors (logical consistency = 100)
- [ ] At least 2 data sources available (completeness ≥ 50%)
- [ ] Data source agreement ≥ 70%
- [ ] Cross-validation success ≥ 80%

---

## API Reference

### Functions

```typescript
// Calculate confidence score
calculateVeritasConfidenceScore(validationResults): ConfidenceScoreBreakdown

// Get confidence level category
getConfidenceLevel(score: number): 'excellent' | 'good' | 'acceptable' | 'fair' | 'poor'

// Check if score meets threshold
meetsConfidenceThreshold(score: number, threshold?: number): boolean

// Get actionable recommendations
getRecommendations(breakdown: ConfidenceScoreBreakdown): string[]
```

---

## Troubleshooting

### Score Lower Than Expected?
1. Check for fatal errors (logical inconsistencies)
2. Review data source agreement (high variance?)
3. Check completeness (missing data sources?)
4. Review failed validation checks

### Score Too High?
1. Verify all data sources are working
2. Check for false positives in validation
3. Review source reliability weights
4. Ensure validation checks are comprehensive

---

**For detailed implementation, see**: `VERITAS-TASK-18-COMPLETE.md`

