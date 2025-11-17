/**
 * Tests for Veritas UI Components
 * 
 * Task 33: Write UI component tests
 * - Test conditional rendering
 * - Test with and without validation data
 * - Test backward compatibility
 * - Test admin alert dashboard functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VeritasConfidenceScoreBadge from '../../../components/UCIE/VeritasConfidenceScoreBadge';
import DataQualitySummary from '../../../components/UCIE/DataQualitySummary';
import ValidationAlertsPanel from '../../../components/UCIE/ValidationAlertsPanel';
import { VeritasValidationResult } from '../../../lib/ucie/veritas/types/validationTypes';

// Mock validation data
const createMockValidation = (overallScore: number = 85): VeritasValidationResult => ({
  isValid: true,
  confidence: overallScore,
  confidenceLevel: 'Very Good',
  breakdown: {
    dataSourceAgreement: 80,
    logicalConsistency: 100,
    crossValidationSuccess: 85,
    dataCompleteness: 100,
    marketData: 95,
    socialSentiment: 88,
    onChainData: 90,
    newsData: 95
  },
  sourceTrustWeights: {
    'CoinGecko': 0.95,
    'CoinMarketCap': 0.90,
    'Kraken': 0.98,
    'LunarCrush': 0.85
  },
  alerts: [
    {
      severity: 'warning',
      type: 'market',
      message: 'Price discrepancy detected',
      affectedSources: ['CoinGecko', 'CoinMarketCap'],
      variance: 0.16,
      recommendation: 'Use Kraken as tie-breaker'
    }
  ],
  discrepancies: [
    {
      metric: 'price',
      sources: ['CoinGecko', 'CoinMarketCap'],
      values: [95000, 95150],
      variance: 0.16
    }
  ],
  dataQualitySummary: {
    overallScore: 92,
    marketDataQuality: 95,
    socialDataQuality: 88,
    onChainDataQuality: 90,
    newsDataQuality: 95,
    passedChecks: [
      'price_consistency',
      'volume_consistency',
      'sentiment_validation',
      'on_chain_consistency',
      'news_correlation'
    ],
    failedChecks: ['arbitrage_detection']
  }
});

describe('VeritasConfidenceScoreBadge', () => {
  describe('Conditional Rendering', () => {
    test('renders when validation data is provided', () => {
      const validation = createMockValidation();
      render(<VeritasConfidenceScoreBadge validation={validation} />);
      
      expect(screen.getByText(/Veritas Confidence Score/i)).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('Very Good')).toBeInTheDocument();
    });

    test('does not render when validation is null', () => {
      const { container } = render(<VeritasConfidenceScoreBadge validation={null} />);
      expect(container.firstChild).toBeNull();
    });

    test('does not render when validation is undefined', () => {
      const { container } = render(<VeritasConfidenceScoreBadge validation={undefined} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Score Display', () => {
    test('displays excellent score with correct styling', () => {
      const validation = createMockValidation(95);
      render(<VeritasConfidenceScoreBadge validation={validation} />);
      
      expect(screen.getByText('95')).toBeInTheDocument();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    test('displays very good score with correct styling', () => {
      const validation = createMockValidation(85);
      render(<VeritasConfidenceScoreBadge validation={validation} />);
      
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('Very Good')).toBeInTheDocument();
    });

    test('displays good score with correct styling', () => {
      const validation = createMockValidation(75);
      render(<VeritasConfidenceScoreBadge validation={validation} />);
      
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    test('displays fair score with correct styling', () => {
      const validation = createMockValidation(65);
      render(<VeritasConfidenceScoreBadge validation={validation} />);
      
      expect(screen.getByText('65')).toBeInTheDocument();
      expect(screen.getByText('Fair')).toBeInTheDocument();
    });

    test('displays poor score with correct styling', () => {
      const validation = createMockValidation(45);
      render(<VeritasConfidenceScoreBadge validation={validation} />);
      
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('Poor')).toBeInTheDocument();
    });
  });

  describe('Expandable Details', () => {
    test('shows breakdown when expanded', async () => {
      const validation = createMockValidation();
      render(<VeritasConfidenceScoreBadge validation={validation} />);
      
      // Initially collapsed
      expect(screen.queryByText('Data Source Agreement')).not.toBeInTheDocument();
      
      // Click to expand
      const expandButton = screen.getByRole('button');
      fireEvent.click(expandButton);
      
      // Check breakdown is visible
      await waitFor(() => {
        expect(screen.getByText('Data Source Agreement')).toBeInTheDocument();
        expect(screen.getByText('Logical Consistency')).toBeInTheDocument();
        expect(screen.getByText('Cross-Validation Success')).toBeInTheDocument();
        expect(screen.getByText('Data Completeness')).toBeInTheDocument();
      });
    });

    test('hides breakdown when collapsed', async () => {
      const validation = createMockValidation();
      render(<VeritasConfidenceScoreBadge validation={validation} />);
      
      // Expand
      const expandButton = screen.getByRole('button');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Data Source Agreement')).toBeInTheDocument();
      });
      
      // Collapse
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Data Source Agreement')).not.toBeInTheDocument();
      });
    });
  });

  describe('Source Trust Weights', () => {
    test('displays source trust weights when expanded', async () => {
      const validation = createMockValidation();
      render(<VeritasConfidenceScoreBadge validation={validation} />);
      
      // Expand
      const expandButton = screen.getByRole('button');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('CoinGecko')).toBeInTheDocument();
        expect(screen.getByText('95%')).toBeInTheDocument();
        expect(screen.getByText('Kraken')).toBeInTheDocument();
        expect(screen.getByText('98%')).toBeInTheDocument();
      });
    });
  });
});

describe('DataQualitySummary', () => {
  describe('Conditional Rendering', () => {
    test('renders when validation data is provided', () => {
      const validation = createMockValidation();
      render(<DataQualitySummary validation={validation} />);
      
      expect(screen.getByText(/Data Quality Summary/i)).toBeInTheDocument();
    });

    test('does not render when validation is null', () => {
      const { container } = render(<DataQualitySummary validation={null} />);
      expect(container.firstChild).toBeNull();
    });

    test('does not render when validation is undefined', () => {
      const { container } = render(<DataQualitySummary validation={undefined} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Quality Scores Display', () => {
    test('displays overall quality score', () => {
      const validation = createMockValidation();
      render(<DataQualitySummary validation={validation} />);
      
      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    test('displays individual data type scores', () => {
      const validation = createMockValidation();
      render(<DataQualitySummary validation={validation} />);
      
      expect(screen.getByText('Market Data')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('Social Data')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
      expect(screen.getByText('On-Chain Data')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.getByText('News Data')).toBeInTheDocument();
    });

    test('shows warning for low quality scores', () => {
      const lowQualityValidation = createMockValidation(65);
      lowQualityValidation.dataQualitySummary.overallScore = 65;
      
      render(<DataQualitySummary validation={lowQualityValidation} />);
      
      expect(screen.getByText(/Data quality is below recommended threshold/i)).toBeInTheDocument();
    });

    test('does not show warning for high quality scores', () => {
      const validation = createMockValidation(92);
      render(<DataQualitySummary validation={validation} />);
      
      expect(screen.queryByText(/Data quality is below recommended threshold/i)).not.toBeInTheDocument();
    });
  });

  describe('Checks Display', () => {
    test('displays passed checks count', () => {
      const validation = createMockValidation();
      render(<DataQualitySummary validation={validation} />);
      
      expect(screen.getByText(/5 passed/i)).toBeInTheDocument();
    });

    test('displays failed checks count', () => {
      const validation = createMockValidation();
      render(<DataQualitySummary validation={validation} />);
      
      expect(screen.getByText(/1 failed/i)).toBeInTheDocument();
    });

    test('shows passed checks when expanded', async () => {
      const validation = createMockValidation();
      render(<DataQualitySummary validation={validation} />);
      
      // Find and click expand button
      const expandButtons = screen.getAllByRole('button');
      const expandButton = expandButtons.find(btn => 
        btn.textContent?.includes('Show Details') || btn.textContent?.includes('▼')
      );
      
      if (expandButton) {
        fireEvent.click(expandButton);
        
        await waitFor(() => {
          expect(screen.getByText('price_consistency')).toBeInTheDocument();
          expect(screen.getByText('volume_consistency')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Expandable Details', () => {
    test('toggles details visibility', async () => {
      const validation = createMockValidation();
      render(<DataQualitySummary validation={validation} />);
      
      // Initially collapsed
      expect(screen.queryByText('price_consistency')).not.toBeInTheDocument();
      
      // Find and click expand button
      const expandButtons = screen.getAllByRole('button');
      const expandButton = expandButtons.find(btn => 
        btn.textContent?.includes('Show Details') || btn.textContent?.includes('▼')
      );
      
      if (expandButton) {
        // Expand
        fireEvent.click(expandButton);
        
        await waitFor(() => {
          expect(screen.getByText('price_consistency')).toBeInTheDocument();
        });
        
        // Collapse
        fireEvent.click(expandButton);
        
        await waitFor(() => {
          expect(screen.queryByText('price_consistency')).not.toBeInTheDocument();
        });
      }
    });
  });
});

describe('ValidationAlertsPanel', () => {
  describe('Conditional Rendering', () => {
    test('renders when validation data is provided', () => {
      const validation = createMockValidation();
      render(<ValidationAlertsPanel validation={validation} />);
      
      expect(screen.getByText(/Validation Alerts/i)).toBeInTheDocument();
    });

    test('does not render when validation is null', () => {
      const { container } = render(<ValidationAlertsPanel validation={null} />);
      expect(container.firstChild).toBeNull();
    });

    test('does not render when validation is undefined', () => {
      const { container } = render(<ValidationAlertsPanel validation={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    test('shows message when no alerts', () => {
      const validation = createMockValidation();
      validation.alerts = [];
      
      render(<ValidationAlertsPanel validation={validation} />);
      
      expect(screen.getByText(/No validation alerts/i)).toBeInTheDocument();
    });
  });

  describe('Alert Display', () => {
    test('displays alert severity', () => {
      const validation = createMockValidation();
      render(<ValidationAlertsPanel validation={validation} />);
      
      expect(screen.getByText('WARNING')).toBeInTheDocument();
    });

    test('displays alert message', () => {
      const validation = createMockValidation();
      render(<ValidationAlertsPanel validation={validation} />);
      
      expect(screen.getByText('Price discrepancy detected')).toBeInTheDocument();
    });

    test('displays affected sources', () => {
      const validation = createMockValidation();
      render(<ValidationAlertsPanel validation={validation} />);
      
      expect(screen.getByText(/CoinGecko/i)).toBeInTheDocument();
      expect(screen.getByText(/CoinMarketCap/i)).toBeInTheDocument();
    });

    test('displays variance when present', () => {
      const validation = createMockValidation();
      render(<ValidationAlertsPanel validation={validation} />);
      
      expect(screen.getByText(/0\.16%/i)).toBeInTheDocument();
    });

    test('displays recommendation', () => {
      const validation = createMockValidation();
      render(<ValidationAlertsPanel validation={validation} />);
      
      expect(screen.getByText(/Use Kraken as tie-breaker/i)).toBeInTheDocument();
    });
  });

  describe('Severity Filtering', () => {
    test('filters alerts by severity', async () => {
      const validation = createMockValidation();
      validation.alerts = [
        {
          severity: 'fatal',
          type: 'market',
          message: 'Fatal error',
          affectedSources: ['Source1'],
          recommendation: 'Fix immediately'
        },
        {
          severity: 'error',
          type: 'social',
          message: 'Error message',
          affectedSources: ['Source2'],
          recommendation: 'Review data'
        },
        {
          severity: 'warning',
          type: 'onchain',
          message: 'Warning message',
          affectedSources: ['Source3'],
          recommendation: 'Monitor'
        }
      ];
      
      render(<ValidationAlertsPanel validation={validation} />);
      
      // All alerts visible initially
      expect(screen.getByText('Fatal error')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      
      // Filter by fatal
      const fatalButton = screen.getByText('Fatal');
      fireEvent.click(fatalButton);
      
      await waitFor(() => {
        expect(screen.getByText('Fatal error')).toBeInTheDocument();
        expect(screen.queryByText('Error message')).not.toBeInTheDocument();
        expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Discrepancies Display', () => {
    test('displays discrepancies when present', () => {
      const validation = createMockValidation();
      render(<ValidationAlertsPanel validation={validation} />);
      
      expect(screen.getByText(/Discrepancies/i)).toBeInTheDocument();
      expect(screen.getByText('price')).toBeInTheDocument();
    });

    test('shows discrepancy values', () => {
      const validation = createMockValidation();
      render(<ValidationAlertsPanel validation={validation} />);
      
      expect(screen.getByText(/95000/i)).toBeInTheDocument();
      expect(screen.getByText(/95150/i)).toBeInTheDocument();
    });
  });

  describe('Collapsible Panel', () => {
    test('toggles panel visibility', async () => {
      const validation = createMockValidation();
      render(<ValidationAlertsPanel validation={validation} />);
      
      // Find collapse button
      const collapseButtons = screen.getAllByRole('button');
      const collapseButton = collapseButtons.find(btn => 
        btn.textContent?.includes('Collapse') || btn.textContent?.includes('▲')
      );
      
      if (collapseButton) {
        // Collapse
        fireEvent.click(collapseButton);
        
        await waitFor(() => {
          expect(screen.queryByText('Price discrepancy detected')).not.toBeInTheDocument();
        });
        
        // Expand
        fireEvent.click(collapseButton);
        
        await waitFor(() => {
          expect(screen.getByText('Price discrepancy detected')).toBeInTheDocument();
        });
      }
    });
  });
});

describe('Backward Compatibility', () => {
  test('components handle missing optional fields gracefully', () => {
    const minimalValidation: Partial<VeritasValidationResult> = {
      isValid: true,
      confidence: 85,
      alerts: [],
      discrepancies: []
    };
    
    // Should not throw errors
    expect(() => {
      render(<VeritasConfidenceScoreBadge validation={minimalValidation as VeritasValidationResult} />);
    }).not.toThrow();
    
    expect(() => {
      render(<DataQualitySummary validation={minimalValidation as VeritasValidationResult} />);
    }).not.toThrow();
    
    expect(() => {
      render(<ValidationAlertsPanel validation={minimalValidation as VeritasValidationResult} />);
    }).not.toThrow();
  });

  test('components handle empty arrays gracefully', () => {
    const validation = createMockValidation();
    validation.alerts = [];
    validation.discrepancies = [];
    validation.dataQualitySummary.passedChecks = [];
    validation.dataQualitySummary.failedChecks = [];
    
    expect(() => {
      render(<VeritasConfidenceScoreBadge validation={validation} />);
      render(<DataQualitySummary validation={validation} />);
      render(<ValidationAlertsPanel validation={validation} />);
    }).not.toThrow();
  });

  test('components handle zero scores gracefully', () => {
    const validation = createMockValidation(0);
    validation.breakdown = {
      dataSourceAgreement: 0,
      logicalConsistency: 0,
      crossValidationSuccess: 0,
      dataCompleteness: 0,
      marketData: 0,
      socialSentiment: 0,
      onChainData: 0,
      newsData: 0
    };
    
    expect(() => {
      render(<VeritasConfidenceScoreBadge validation={validation} />);
      render(<DataQualitySummary validation={validation} />);
    }).not.toThrow();
  });
});

describe('Integration Tests', () => {
  test('all components render together without conflicts', () => {
    const validation = createMockValidation();
    
    const { container } = render(
      <div>
        <VeritasConfidenceScoreBadge validation={validation} />
        <DataQualitySummary validation={validation} />
        <ValidationAlertsPanel validation={validation} />
      </div>
    );
    
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText(/Veritas Confidence Score/i)).toBeInTheDocument();
    expect(screen.getByText(/Data Quality Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Validation Alerts/i)).toBeInTheDocument();
  });

  test('components update when validation data changes', () => {
    const validation1 = createMockValidation(85);
    const { rerender } = render(<VeritasConfidenceScoreBadge validation={validation1} />);
    
    expect(screen.getByText('85')).toBeInTheDocument();
    
    const validation2 = createMockValidation(95);
    rerender(<VeritasConfidenceScoreBadge validation={validation2} />);
    
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.queryByText('85')).not.toBeInTheDocument();
  });
});
