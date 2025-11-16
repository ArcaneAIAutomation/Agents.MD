/**
 * Data Quality Summary Tests
 * 
 * Tests for the data quality reporting and recommendation system
 */

import { describe, test, expect } from 'vitest';
import { generateDataQualitySummary, suggestActionForDiscrepancy } from '../dataQualitySummary';
import type {
  ValidationAlert,
  Discrepancy,
  VeritasValidationResult,
  DataQualitySummary
} from '../../types/validationTypes';

// ============================================================================
// Mock Data
// ============================================================================

const mockMarketValidationResult: VeritasValidationResult = {
  isValid: true,
  confidence: 95,
  alerts: [
    {
      severity: 'info',
      type: 'market',
      message: 'All market data sources agree',
      affectedSources: ['CoinGecko', 'CoinMarketCap', 'Kraken'],
      recommendation: 'No action required'
    }
  ],
  discrepancies: [],
  dataQualitySummary: {
    overallScore: 95,
    marketDataQuality: 95,
    socialDataQuality: 0,
    onChainDataQuality: 0,
    newsDataQuality: 0,
    passedChecks: ['price_consistency', 'volume_consistency'],
    failedChecks: []
  }
};

const mockSocialValidationResult: VeritasValidationResult = {
  isValid: true,
  confidence: 85,
  alerts: [
    {
      severity: 'warning',
      type: 'social',
      message: 'Social Sentiment Mismatch: LunarCrush (65) vs Reddit (45)',
      affectedSources: ['LunarCrush', 'Reddit'],
      recommendation: 'Review both sources - significant divergence detected'
    }
  ],
  discrepancies: [
    {
      metric: 'sentiment_score',
      sources: [
        { name: 'LunarCrush', value: 65 },
        { name: 'Reddit', value: 45 }
      ],
      variance: 20,
      threshold: 30,
      exceeded: false
    }
  ],
  dataQualitySummary: {
    overallScore: 85,
    marketDataQuality: 0,
    socialDataQuality: 85,
    onChainDataQuality: 0,
    newsDataQuality: 0,
    passedChecks: ['social_impossibility_check'],
    failedChecks: []
  }
};

const mockFatalErrorResult: VeritasValidationResult = {
  isValid: false,
  confidence: 0,
  alerts: [
    {
      severity: 'fatal',
      type: 'social',
      message: 'Fatal Social Data Error: Contradictory mention count and distribution',
      affectedSources: ['LunarCrush'],
      recommendation: 'Discarding social data - cannot have sentiment without mentions'
    }
  ],
  discrepancies: [],
  dataQualitySummary: {
    overallScore: 0,
    marketDataQuality: 0,
    socialDataQuality: 0,
    onChainDataQuality: 0,
    newsDataQuality: 0,
    passedChecks: [],
    failedChecks: ['social_impossibility_check']
  }
};

const mockPriceDiscrepancyResult: VeritasValidationResult = {
  isValid: true,
  confidence: 75,
  alerts: [
    {
      severity: 'warning',
      type: 'market',
      message: 'Price discrepancy detected: 2.50% variance across sources',
      affectedSources: ['CoinGecko', 'CoinMarketCap', 'Kraken'],
      recommendation: 'Using weighted average with dynamic trust scores'
    }
  ],
  discrepancies: [
    {
      metric: 'price',
      sources: [
        { name: 'CoinGecko', value: 95000 },
        { name: 'CoinMarketCap', value: 97000 },
        { name: 'Kraken', value: 96000 }
      ],
      variance: 0.025,
      threshold: 0.015,
      exceeded: true
    }
  ],
  dataQualitySummary: {
    overallScore: 75,
    marketDataQuality: 75,
    socialDataQuality: 0,
    onChainDataQuality: 0,
    newsDataQuality: 0,
    passedChecks: ['volume_consistency'],
    failedChecks: ['price_consistency']
  }
};

// ============================================================================
// Tests
// ============================================================================

describe('generateDataQualitySummary', () => {
  test('generates summary with all data types available', () => {
    const results = {
      market: mockMarketValidationResult,
      social: mockSocialValidationResult
    };
    
    const summary = generateDataQualitySummary(results);
    
    // Check basic structure
    expect(summary).toBeDefined();
    expect(summary.overallScore).toBeGreaterThan(0);
    expect(summary.generatedAt).toBeDefined();
    
    // Check alert aggregation
    expect(summary.totalAlerts).toBe(2); // 1 info + 1 warning
    expect(summary.criticalAlerts).toBe(0); // No fatal or error
    
    // Check discrepancy aggregation
    expect(summary.totalDiscrepancies).toBe(1);
    expect(summary.exceededThresholds).toBe(0); // Sentiment discrepancy didn't exceed threshold
    
    // Check recommendations
    expect(summary.recommendations).toBeDefined();
    expect(Array.isArray(summary.recommendations)).toBe(true);
    
    // Check reliability guidance
    expect(summary.reliabilityGuidance).toBeDefined();
    expect(summary.reliabilityGuidance.canProceedWithAnalysis).toBe(true);
  });
  
  test('handles fatal errors correctly', () => {
    const results = {
      social: mockFatalErrorResult
    };
    
    const summary = generateDataQualitySummary(results);
    
    // Overall score should be very low (fatal error = -50 points, but gets +2.5 bonus for 1/4 data types)
    expect(summary.overallScore).toBeLessThan(60);
    
    // Should have critical alerts
    expect(summary.criticalAlerts).toBeGreaterThan(0);
    expect(summary.alertsBySeverity.fatal.length).toBe(1);
    
    // Should not be able to proceed with analysis
    expect(summary.reliabilityGuidance.canProceedWithAnalysis).toBe(false);
    expect(summary.reliabilityGuidance.overallReliability).toBe('poor'); // Score is 53, which is 40-60 range
    
    // Should have high-priority recommendations
    const highPriorityRecs = summary.recommendations.filter(r => r.priority === 'high');
    expect(highPriorityRecs.length).toBeGreaterThan(0);
  });
  
  test('detects price discrepancies and generates recommendations', () => {
    const results = {
      market: mockPriceDiscrepancyResult
    };
    
    const summary = generateDataQualitySummary(results);
    
    // Should have discrepancies
    expect(summary.totalDiscrepancies).toBe(1);
    expect(summary.exceededThresholds).toBe(1);
    
    // Should have price discrepancy grouped
    expect(summary.discrepanciesByMetric.price).toBeDefined();
    expect(summary.discrepanciesByMetric.price.length).toBe(1);
    
    // Should have recommendation for price discrepancy
    const priceRec = summary.recommendations.find(r => r.title.includes('Price Discrepancy'));
    expect(priceRec).toBeDefined();
    expect(priceRec?.priority).toBe('medium'); // 2.5% is not critical (>5%)
  });
  
  test('groups alerts by type correctly', () => {
    const results = {
      market: mockMarketValidationResult,
      social: mockSocialValidationResult
    };
    
    const summary = generateDataQualitySummary(results);
    
    // Check alert grouping by type
    expect(summary.alertsByType.market.length).toBe(1);
    expect(summary.alertsByType.social.length).toBe(1);
    expect(summary.alertsByType.onchain.length).toBe(0);
    expect(summary.alertsByType.news.length).toBe(0);
  });
  
  test('groups alerts by severity correctly', () => {
    const results = {
      market: mockMarketValidationResult,
      social: mockSocialValidationResult
    };
    
    const summary = generateDataQualitySummary(results);
    
    // Check alert grouping by severity
    expect(summary.alertsBySeverity.info.length).toBe(1);
    expect(summary.alertsBySeverity.warning.length).toBe(1);
    expect(summary.alertsBySeverity.error.length).toBe(0);
    expect(summary.alertsBySeverity.fatal.length).toBe(0);
  });
  
  test('calculates data quality breakdown by type', () => {
    const results = {
      market: mockMarketValidationResult,
      social: mockSocialValidationResult
    };
    
    const summary = generateDataQualitySummary(results);
    
    // Check quality scores by type
    expect(summary.marketDataQuality).toBe(95);
    expect(summary.socialDataQuality).toBe(85);
    expect(summary.onChainDataQuality).toBe(0); // Not available
    expect(summary.newsDataQuality).toBe(0); // Not available
  });
  
  test('lists passed and failed checks', () => {
    const results = {
      market: mockMarketValidationResult,
      social: mockSocialValidationResult
    };
    
    const summary = generateDataQualitySummary(results);
    
    // Check passed checks
    expect(summary.passedChecks).toContain('price_consistency');
    expect(summary.passedChecks).toContain('volume_consistency');
    expect(summary.passedChecks).toContain('social_impossibility_check');
    
    // Check failed checks
    expect(summary.failedChecks.length).toBe(0);
  });
  
  test('provides reliability guidance based on score', () => {
    // Test excellent reliability (score >= 90)
    const excellentResults = {
      market: mockMarketValidationResult
    };
    const excellentSummary = generateDataQualitySummary(excellentResults);
    expect(excellentSummary.reliabilityGuidance.overallReliability).toBe('excellent');
    expect(excellentSummary.reliabilityGuidance.confidenceLevel).toBe('high');
    
    // Test good reliability (score >= 75)
    const goodResults = {
      market: mockPriceDiscrepancyResult
    };
    const goodSummary = generateDataQualitySummary(goodResults);
    expect(goodSummary.reliabilityGuidance.overallReliability).toBe('good');
    
    // Test poor reliability (score 40-60 with fatal error)
    const criticalResults = {
      social: mockFatalErrorResult
    };
    const criticalSummary = generateDataQualitySummary(criticalResults);
    expect(criticalSummary.reliabilityGuidance.overallReliability).toBe('poor');
    expect(criticalSummary.reliabilityGuidance.confidenceLevel).toBe('low'); // Score is 53, which is >= 50
  });
  
  test('generates recommendations sorted by priority', () => {
    const results = {
      market: mockPriceDiscrepancyResult,
      social: mockFatalErrorResult
    };
    
    const summary = generateDataQualitySummary(results);
    
    // Should have multiple recommendations
    expect(summary.recommendations.length).toBeGreaterThan(0);
    
    // High priority should come first
    if (summary.recommendations.length > 1) {
      const priorities = summary.recommendations.map(r => r.priority);
      const highIndex = priorities.indexOf('high');
      const lowIndex = priorities.indexOf('low');
      
      if (highIndex !== -1 && lowIndex !== -1) {
        expect(highIndex).toBeLessThan(lowIndex);
      }
    }
  });
  
  test('includes validation duration if provided', () => {
    const results = {
      market: mockMarketValidationResult
    };
    
    const summary = generateDataQualitySummary(results, 5000);
    
    expect(summary.validationDuration).toBe(5000);
  });
  
  test('handles empty results gracefully', () => {
    const results = {};
    
    const summary = generateDataQualitySummary(results);
    
    // Should still generate a summary
    expect(summary).toBeDefined();
    expect(summary.totalAlerts).toBe(0);
    expect(summary.totalDiscrepancies).toBe(0);
    
    // With no data, starts at 100 but gets no penalties or bonuses
    expect(summary.overallScore).toBe(100);
    
    // Should recommend waiting for more data
    const incompleteness = summary.recommendations.find(r => r.title.includes('Incomplete Data'));
    expect(incompleteness).toBeDefined();
  });
  
  test('deduplicates similar alerts', () => {
    const duplicateAlert: ValidationAlert = {
      severity: 'warning',
      type: 'market',
      message: 'Price discrepancy detected',
      affectedSources: ['CoinGecko'],
      recommendation: 'Review'
    };
    
    const resultWithDuplicates: VeritasValidationResult = {
      isValid: true,
      confidence: 80,
      alerts: [duplicateAlert, duplicateAlert, duplicateAlert], // 3 identical alerts
      discrepancies: [],
      dataQualitySummary: {
        overallScore: 80,
        marketDataQuality: 80,
        socialDataQuality: 0,
        onChainDataQuality: 0,
        newsDataQuality: 0,
        passedChecks: [],
        failedChecks: []
      }
    };
    
    const results = {
      market: resultWithDuplicates
    };
    
    const summary = generateDataQualitySummary(results);
    
    // Should deduplicate to 1 alert
    expect(summary.totalAlerts).toBe(1);
  });
});

describe('suggestActionForDiscrepancy', () => {
  test('suggests action for price discrepancy within threshold', () => {
    const discrepancy: Discrepancy = {
      metric: 'price',
      sources: [
        { name: 'CoinGecko', value: 95000 },
        { name: 'Kraken', value: 95100 }
      ],
      variance: 0.001,
      threshold: 0.015,
      exceeded: false
    };
    
    const action = suggestActionForDiscrepancy(discrepancy);
    
    expect(action).toContain('No action required');
  });
  
  test('suggests action for critical price discrepancy', () => {
    const discrepancy: Discrepancy = {
      metric: 'price',
      sources: [
        { name: 'CoinGecko', value: 95000 },
        { name: 'Kraken', value: 100000 }
      ],
      variance: 0.06,
      threshold: 0.015,
      exceeded: true
    };
    
    const action = suggestActionForDiscrepancy(discrepancy);
    
    expect(action).toContain('Critical');
    expect(action).toContain('Investigate');
  });
  
  test('suggests action for volume discrepancy', () => {
    const discrepancy: Discrepancy = {
      metric: 'volume_24h',
      sources: [
        { name: 'CoinGecko', value: 1000000000 },
        { name: 'Kraken', value: 1200000000 }
      ],
      variance: 0.15,
      threshold: 0.10,
      exceeded: true
    };
    
    const action = suggestActionForDiscrepancy(discrepancy);
    
    expect(action).toContain('Volume variance');
    expect(action).toContain('weighted average');
  });
  
  test('suggests action for sentiment discrepancy', () => {
    const discrepancy: Discrepancy = {
      metric: 'sentiment_score',
      sources: [
        { name: 'LunarCrush', value: 70 },
        { name: 'Reddit', value: 30 }
      ],
      variance: 40,
      threshold: 30,
      exceeded: true
    };
    
    const action = suggestActionForDiscrepancy(discrepancy);
    
    expect(action).toContain('Sentiment divergence');
    expect(action).toContain('Review both sources');
  });
});

console.log('✅ All data quality summary tests defined');
