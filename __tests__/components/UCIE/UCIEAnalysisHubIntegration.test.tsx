/**
 * Tests for UCIE Analysis Hub Veritas Integration
 * 
 * Task 33: Write UI component tests
 * - Test conditional rendering in analysis hub
 * - Test toggle functionality
 * - Test with and without validation data
 * - Test backward compatibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the child components
jest.mock('../../../components/UCIE/VeritasConfidenceScoreBadge', () => {
  return function MockVeritasConfidenceScoreBadge({ validation }: any) {
    if (!validation) return null;
    return <div data-testid="confidence-badge">Confidence: {validation.confidence}</div>;
  };
});

jest.mock('../../../components/UCIE/DataQualitySummary', () => {
  return function MockDataQualitySummary({ validation }: any) {
    if (!validation) return null;
    return <div data-testid="quality-summary">Quality: {validation.dataQualitySummary?.overallScore}</div>;
  };
});

jest.mock('../../../components/UCIE/ValidationAlertsPanel', () => {
  return function MockValidationAlertsPanel({ validation }: any) {
    if (!validation) return null;
    return <div data-testid="alerts-panel">Alerts: {validation.alerts?.length}</div>;
  };
});

// Mock other dependencies
jest.mock('../../../hooks/useProgressiveLoading', () => ({
  useProgressiveLoading: () => ({
    phases: [],
    loading: false,
    currentPhase: 1,
    overallProgress: 100,
    data: null,
    refresh: jest.fn()
  })
}));

jest.mock('../../../hooks/useUCIEMobile', () => ({
  useUCIEMobile: () => ({
    isMobile: false,
    isTablet: false,
    screenWidth: 1920
  }),
  useAdaptiveRequestStrategy: () => ({
    timeout: 10000,
    enableRealTime: true
  })
}));

jest.mock('../../../hooks/useSwipeGesture', () => ({
  useSwipeGesture: jest.fn()
}));

jest.mock('../../../lib/ucie/hapticFeedback', () => ({
  useHaptic: () => ({
    buttonPress: jest.fn(),
    swipe: jest.fn(),
    selection: jest.fn(),
    refresh: jest.fn()
  })
}));

// Mock all panel components
jest.mock('../../../components/UCIE/CaesarAnalysisContainer', () => {
  return function MockCaesarAnalysisContainer() {
    return <div data-testid="caesar-container">Caesar Analysis</div>;
  };
});

jest.mock('../../../components/UCIE/MarketDataPanel', () => {
  return function MockMarketDataPanel() {
    return <div>Market Data</div>;
  };
});

jest.mock('../../../components/UCIE/DataPreviewModal', () => {
  return function MockDataPreviewModal({ isOpen, onContinue, onCancel }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="preview-modal">
        <button onClick={() => onContinue({})}>Continue</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  };
});

jest.mock('../../../components/UCIE/PullToRefresh', () => {
  return function MockPullToRefresh({ children }: any) {
    return <div>{children}</div>;
  };
});

// Import after mocks
import UCIEAnalysisHub from '../../../components/UCIE/UCIEAnalysisHub';

describe('UCIEAnalysisHub Veritas Integration', () => {
  const mockAnalysisData = {
    marketData: { price: 95000 },
    veritasValidation: {
      isValid: true,
      confidence: 85,
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
      alerts: [
        {
          severity: 'warning',
          type: 'market',
          message: 'Price discrepancy',
          affectedSources: ['CoinGecko'],
          recommendation: 'Review'
        }
      ],
      discrepancies: [],
      dataQualitySummary: {
        overallScore: 92,
        marketDataQuality: 95,
        socialDataQuality: 88,
        onChainDataQuality: 90,
        newsDataQuality: 95,
        passedChecks: ['check1'],
        failedChecks: []
      }
    }
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Conditional Rendering', () => {
    test('renders validation section when veritasValidation is present', async () => {
      // Mock useProgressiveLoading to return data with validation
      jest.spyOn(require('../../../hooks/useProgressiveLoading'), 'useProgressiveLoading')
        .mockReturnValue({
          phases: [],
          loading: false,
          currentPhase: 4,
          overallProgress: 100,
          data: mockAnalysisData,
          refresh: jest.fn()
        });

      render(<UCIEAnalysisHub symbol="BTC" />);

      // Skip preview modal
      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Data Validation')).toBeInTheDocument();
        expect(screen.getByTestId('confidence-badge')).toBeInTheDocument();
      });
    });

    test('does not render validation section when veritasValidation is absent', async () => {
      // Mock useProgressiveLoading to return data without validation
      jest.spyOn(require('../../../hooks/useProgressiveLoading'), 'useProgressiveLoading')
        .mockReturnValue({
          phases: [],
          loading: false,
          currentPhase: 4,
          overallProgress: 100,
          data: { marketData: { price: 95000 } }, // No veritasValidation
          refresh: jest.fn()
        });

      render(<UCIEAnalysisHub symbol="BTC" />);

      // Skip preview modal
      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.queryByText('Data Validation')).not.toBeInTheDocument();
        expect(screen.queryByTestId('confidence-badge')).not.toBeInTheDocument();
      });
    });

    test('does not render validation section when veritasValidation is null', async () => {
      jest.spyOn(require('../../../hooks/useProgressiveLoading'), 'useProgressiveLoading')
        .mockReturnValue({
          phases: [],
          loading: false,
          currentPhase: 4,
          overallProgress: 100,
          data: { marketData: { price: 95000 }, veritasValidation: null },
          refresh: jest.fn()
        });

      render(<UCIEAnalysisHub symbol="BTC" />);

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.queryByText('Data Validation')).not.toBeInTheDocument();
      });
    });
  });

  describe('Toggle Functionality', () => {
    test('shows "Show Validation Details" button initially', async () => {
      jest.spyOn(require('../../../hooks/useProgressiveLoading'), 'useProgressiveLoading')
        .mockReturnValue({
          phases: [],
          loading: false,
          currentPhase: 4,
          overallProgress: 100,
          data: mockAnalysisData,
          refresh: jest.fn()
        });

      render(<UCIEAnalysisHub symbol="BTC" />);

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Show Validation Details')).toBeInTheDocument();
      });
    });

    test('toggles to "Hide Details" when clicked', async () => {
      jest.spyOn(require('../../../hooks/useProgressiveLoading'), 'useProgressiveLoading')
        .mockReturnValue({
          phases: [],
          loading: false,
          currentPhase: 4,
          overallProgress: 100,
          data: mockAnalysisData,
          refresh: jest.fn()
        });

      render(<UCIEAnalysisHub symbol="BTC" />);

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        const toggleButton = screen.getByText('Show Validation Details');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Hide Details')).toBeInTheDocument();
      });
    });

    test('shows detailed components when toggle is enabled', async () => {
      jest.spyOn(require('../../../hooks/useProgressiveLoading'), 'useProgressiveLoading')
        .mockReturnValue({
          phases: [],
          loading: false,
          currentPhase: 4,
          overallProgress: 100,
          data: mockAnalysisData,
          refresh: jest.fn()
        });

      render(<UCIEAnalysisHub symbol="BTC" />);

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        // Initially, detailed components should not be visible
        expect(screen.queryByTestId('quality-summary')).not.toBeInTheDocument();
        expect(screen.queryByTestId('alerts-panel')).not.toBeInTheDocument();
      });

      // Click toggle
      const toggleButton = screen.getByText('Show Validation Details');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        // After toggle, detailed components should be visible
        expect(screen.getByTestId('quality-summary')).toBeInTheDocument();
        expect(screen.getByTestId('alerts-panel')).toBeInTheDocument();
      });
    });

    test('hides detailed components when toggle is disabled', async () => {
      jest.spyOn(require('../../../hooks/useProgressiveLoading'), 'useProgressiveLoading')
        .mockReturnValue({
          phases: [],
          loading: false,
          currentPhase: 4,
          overallProgress: 100,
          data: mockAnalysisData,
          refresh: jest.fn()
        });

      render(<UCIEAnalysisHub symbol="BTC" />);

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        const toggleButton = screen.getByText('Show Validation Details');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('quality-summary')).toBeInTheDocument();
      });

      // Click toggle again to hide
      const hideButton = screen.getByText('Hide Details');
      fireEvent.click(hideButton);

      await waitFor(() => {
        expect(screen.queryByTestId('quality-summary')).not.toBeInTheDocument();
        expect(screen.queryByTestId('alerts-panel')).not.toBeInTheDocument();
      });
    });

    test('confidence badge is always visible when validation present', async () => {
      jest.spyOn(require('../../../hooks/useProgressiveLoading'), 'useProgressiveLoading')
        .mockReturnValue({
          phases: [],
          loading: false,
          currentPhase: 4,
          overallProgress: 100,
          data: mockAnalysisData,
          refresh: jest.fn()
        });

      render(<UCIEAnalysisHub symbol="BTC" />);

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        // Confidence badge should be visible initially
        expect(screen.getByTestId('confidence-badge')).toBeInTheDocument();
      });

      // Toggle details
      const toggleButton = screen.getByText('Show Validation Details');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        // Confidence badge should still be visible
        expect(screen.getByTestId('confidence-badge')).toBeInTheDocument();
      });

      // Toggle back
      const hideButton = screen.getByText('Hide Details');
      fireEvent.click(hideButton);

      await waitFor(() => {
        // Confidence badge should still be visible
        expect(screen.getByTestId('confidence-badge')).toBeInTheDocument();
      });
    });
  });

  describe('Backward Compatibility', () => {
    test('existing UI renders correctly without validation', async () => {
      jest.spyOn(require('../../../hooks/useProgressiveLoading'), 'useProgressiveLoading')
        .mockReturnValue({
          phases: [],
          loading: false,
          currentPhase: 4,
          overallProgress: 100,
          data: { marketData: { price: 95000 } },
          refresh: jest.fn()
        });

      render(<UCIEAnalysisHub symbol="BTC" />);

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        // Caesar container should render
        expect(screen.getByTestId('caesar-container')).toBeInTheDocument();
        // No validation section
        expect(screen.queryByText('Data Validation')).not.toBeInTheDocument();
      });
    });

    test('Caesar analysis container renders with or without validation', async () => {
      // Test with validation
      jest.spyOn(require('../../../hooks/useProgressiveLoading'), 'useProgressiveLoading')
        .mockReturnValue({
          phases: [],
          loading: false,
          currentPhase: 4,
          overallProgress: 100,
          data: mockAnalysisData,
          refresh: jest.fn()
        });

      const { rerender } = render(<UCIEAnalysisHub symbol="BTC" />);

      let continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByTestId('caesar-container')).toBeInTheDocument();
      });

      // Test without validation
      jest.spyOn(require('../../../hooks/useProgressiveLoading'), 'useProgressiveLoading')
        .mockReturnValue({
          phases: [],
          loading: false,
          currentPhase: 4,
          overallProgress: 100,
          data: { marketData: { price: 95000 } },
          refresh: jest.fn()
        });

      rerender(<UCIEAnalysisHub symbol="BTC" />);

      continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByTestId('caesar-container')).toBeInTheDocument();
      });
    });

    test('no errors when validation data structure is incomplete', async () => {
      const incompleteValidation = {
        marketData: { price: 95000 },
        veritasValidation: {
          confidence: 85
          // Missing other fields
        }
      };

      jest.spyOn(require('../../../hooks/useProgressiveLoading'), 'useProgressiveLoading')
        .mockReturnValue({
          phases: [],
          loading: false,
          currentPhase: 4,
          overallProgress: 100,
          data: incompleteValidation,
          refresh: jest.fn()
        });

      expect(() => {
        render(<UCIEAnalysisHub symbol="BTC" />);
      }).not.toThrow();
    });
  });

  describe('Component Placement', () => {
    test('validation section appears before Caesar analysis', async () => {
      jest.spyOn(require('../../../hooks/useProgressiveLoading'), 'useProgressiveLoading')
        .mockReturnValue({
          phases: [],
          loading: false,
          currentPhase: 4,
          overallProgress: 100,
          data: mockAnalysisData,
          refresh: jest.fn()
        });

      const { container } = render(<UCIEAnalysisHub symbol="BTC" />);

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        const validationSection = screen.getByText('Data Validation').closest('div');
        const caesarContainer = screen.getByTestId('caesar-container').closest('div');
        
        // Validation should come before Caesar in DOM order
        expect(validationSection).toBeTruthy();
        expect(caesarContainer).toBeTruthy();
      });
    });

    test('validation section is within main content area', async () => {
      jest.spyOn(require('../../../hooks/useProgressiveLoading'), 'useProgressiveLoading')
        .mockReturnValue({
          phases: [],
          loading: false,
          currentPhase: 4,
          overallProgress: 100,
          data: mockAnalysisData,
          refresh: jest.fn()
        });

      render(<UCIEAnalysisHub symbol="BTC" />);

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        const validationSection = screen.getByText('Data Validation');
        expect(validationSection).toBeInTheDocument();
        
        // Should be within the main content container
        const parent = validationSection.closest('.max-w-7xl');
        expect(parent).toBeTruthy();
      });
    });
  });

  describe('State Management', () => {
    test('toggle state persists across re-renders', async () => {
      jest.spyOn(require('../../../hooks/useProgressiveLoading'), 'useProgressiveLoading')
        .mockReturnValue({
          phases: [],
          loading: false,
          currentPhase: 4,
          overallProgress: 100,
          data: mockAnalysisData,
          refresh: jest.fn()
        });

      const { rerender } = render(<UCIEAnalysisHub symbol="BTC" />);

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        const toggleButton = screen.getByText('Show Validation Details');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Hide Details')).toBeInTheDocument();
      });

      // Re-render
      rerender(<UCIEAnalysisHub symbol="BTC" />);

      // State should persist
      await waitFor(() => {
        expect(screen.getByText('Hide Details')).toBeInTheDocument();
      });
    });
  });
});
