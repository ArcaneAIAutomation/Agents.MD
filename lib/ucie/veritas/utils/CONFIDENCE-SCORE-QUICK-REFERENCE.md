# Veritas Confidence Score Calculator - Quick Reference

## Import

```typescript
import {
  calculateVeritasConfidenceScore,
  getConfidenceLevel,
  isSufficientConfidence,
  getConfidenceRecommendation
} from './confidenceScoreCalculator';
```

## Basic Usage

```typescript
// Calculate confidence score
const score = calculateVeritasConfidenceScore({
  market: marketValidationResult,
  social: socialValidationResult,
  onChain: onChainValidationResult,
  news: newsValidationResult
});

console.log(score.overallScore); // 0-100
console.log(score.explanation); // Human-readable explanation
```

## With Dynamic Trust Weights

```typescript
import { getSourceReliabilityTracker } from './sourceReliabilityTracker';

const tracker = await getSourceReliabilityTracker();

const score = calculateVeritasConfidenceScore(
  validationResults,
  tracker // Optional: adds dynamic trust weights
);

console.log(score.sourceWeights); // { "CoinGecko": 1.0, "CoinMarketCap": 0.9, ... }
```

## Helper Functions

### Get Confidence Level
```typescript
const level = getConfidenceLevel(85);
// Returns: 'excellent' | 'good' | 'acceptable' | 'fair' | 'poor'
```

### Check Sufficient Confidence
```typescript
if (isSufficientConfidence(score.overallScore, 70)) {
  // Proceed with analysis
} else {
  // Warn user
}
```

### Get Recommendation
```typescript
const recommendation = getConfidenceRecommendation(score.overallScore);
// Returns human-readable recommendation string
```

## Score Breakdown

```typescript
const score = calculateVeritasConfidenceScore(results);

// Overall score (0-100)
score.overallScore

// Component scores
score.dataSourceAgreement    // 40% weight
score.logicalConsistency      // 30% weight
score.crossValidationSuccess  // 20% weight
score.completeness            // 10% weight

// Individual data source scores
score.breakdown.marketData
score.breakdown.socialSentiment
score.breakdown.onChainData
score.breakdown.newsData

// Dynamic trust weights (if tracker provided)
score.sourceWeights // { "SourceName": 0.9, ... }

// Human-readable explanation
score.explanation
```

## Confidence Levels

| Score | Level | Action |
|-------|-------|--------|
| 90+ | Excellent | Proceed with high confidence |
| 80-89 | Good | Proceed with confidence |
| 70-79 | Acceptable | Proceed with caution |
| 60-69 | Fair | Review discrepancies |
| <60 | Poor | Do not trade |

## Example: Complete Workflow

```typescript
// 1. Run all validators
const validationResults = {
  market: await validateMarketData(symbol, data),
  social: await validateSocialSentiment(symbol, data),
  onChain: await validateOnChainData(symbol, data),
  news: await validateNewsCorrelation(symbol, data)
};

// 2. Get reliability tracker
const tracker = await getSourceReliabilityTracker();

// 3. Calculate confidence score
const confidence = calculateVeritasConfidenceScore(
  validationResults,
  tracker
);

// 4. Check if sufficient
if (!isSufficientConfidence(confidence.overallScore, 70)) {
  return {
    error: 'Insufficient data quality',
    confidence: confidence.overallScore,
    recommendation: getConfidenceRecommendation(confidence.overallScore)
  };
}

// 5. Proceed with analysis
return {
  analysis: performAnalysis(data),
  veritasValidation: {
    confidenceScore: confidence,
    level: getConfidenceLevel(confidence.overallScore),
    recommendation: getConfidenceRecommendation(confidence.overallScore)
  }
};
```

## Partial Validation Results

The calculator handles partial results gracefully:

```typescript
// Only market and social data available
const score = calculateVeritasConfidenceScore({
  market: marketValidation,
  social: socialValidation
  // onChain and news are undefined
});

// Completeness will be 50% (2/4 sources)
console.log(score.completeness); // 50
```

## Empty Validation Results

```typescript
const score = calculateVeritasConfidenceScore({});

// Returns valid score with logical defaults
console.log(score.overallScore); // 30 (only logical consistency contributes)
console.log(score.completeness); // 0
console.log(score.logicalConsistency); // 100 (no fatal errors)
```

## TypeScript Types

```typescript
interface ConfidenceScoreBreakdown {
  overallScore: number;
  dataSourceAgreement: number;
  logicalConsistency: number;
  crossValidationSuccess: number;
  completeness: number;
  breakdown: {
    marketData: number;
    socialSentiment: number;
    onChainData: number;
    newsData: number;
  };
  sourceWeights: {
    [sourceName: string]: number;
  };
  explanation: string;
}

type ConfidenceLevel = 'excellent' | 'good' | 'acceptable' | 'fair' | 'poor';
```

## Common Patterns

### Display in UI
```typescript
<div className="confidence-badge">
  <span className="score">{score.overallScore}%</span>
  <span className="level">{getConfidenceLevel(score.overallScore)}</span>
  <p className="explanation">{score.explanation}</p>
</div>
```

### API Response
```typescript
return res.json({
  ...data,
  veritasValidation: {
    enabled: true,
    confidenceScore: score,
    level: getConfidenceLevel(score.overallScore),
    recommendation: getConfidenceRecommendation(score.overallScore),
    timestamp: new Date().toISOString()
  }
});
```

### Conditional Analysis
```typescript
const minConfidence = 70;

if (isSufficientConfidence(score.overallScore, minConfidence)) {
  // High confidence - proceed with full analysis
  return performFullAnalysis(data);
} else if (score.overallScore >= 60) {
  // Moderate confidence - proceed with warnings
  return {
    ...performBasicAnalysis(data),
    warning: 'Data quality is fair. Review carefully.'
  };
} else {
  // Low confidence - return error
  return {
    error: 'Insufficient data quality for reliable analysis',
    confidence: score.overallScore,
    recommendation: getConfidenceRecommendation(score.overallScore)
  };
}
```

## Performance Notes

- Calculation is synchronous and fast (< 1ms)
- No external API calls
- Safe to call on every request
- Results can be cached if needed

## Error Handling

The calculator never throws errors:
- Missing validation results default to 0
- Invalid inputs are handled gracefully
- Always returns a valid ConfidenceScoreBreakdown

```typescript
try {
  const score = calculateVeritasConfidenceScore(results);
  // Always succeeds
} catch (error) {
  // This will never happen
}
```
