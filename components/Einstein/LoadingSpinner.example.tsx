/**
 * Einstein Loading Spinner - Usage Examples
 * 
 * This file demonstrates various use cases for the LoadingSpinner component
 * and its preset variants.
 */

import React, { useState } from 'react';
import {
  LoadingSpinner,
  VerifyingDataSpinner,
  GeneratingSignalSpinner,
  AnalyzingMarketSpinner,
  LoadingHistorySpinner,
  LoadingOverlay,
  InlineLoading
} from './LoadingSpinner';

// ============================================================================
// Example 1: Basic Loading Spinner
// ============================================================================

export const BasicSpinnerExample = () => {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <h3 className="text-bitcoin-white font-bold mb-4">Basic Spinner</h3>
      
      <div className="grid grid-cols-4 gap-4">
        {/* Small */}
        <div className="text-center">
          <LoadingSpinner size="sm" />
          <p className="text-bitcoin-white-60 text-xs mt-2">Small</p>
        </div>
        
        {/* Medium */}
        <div className="text-center">
          <LoadingSpinner size="md" />
          <p className="text-bitcoin-white-60 text-xs mt-2">Medium</p>
        </div>
        
        {/* Large */}
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-bitcoin-white-60 text-xs mt-2">Large</p>
        </div>
        
        {/* Extra Large */}
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="text-bitcoin-white-60 text-xs mt-2">Extra Large</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Example 2: Spinner with Text
// ============================================================================

export const SpinnerWithTextExample = () => {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <h3 className="text-bitcoin-white font-bold mb-4">Spinner with Text</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <LoadingSpinner
          size="lg"
          text="Loading data..."
        />
        
        <LoadingSpinner
          size="lg"
          text="Processing request..."
          pulse
        />
      </div>
    </div>
  );
};

// ============================================================================
// Example 3: Progress Indicator
// ============================================================================

export const ProgressIndicatorExample = () => {
  const [progress, setProgress] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <h3 className="text-bitcoin-white font-bold mb-4">Progress Indicator</h3>
      
      <LoadingSpinner
        size="xl"
        text="Fetching data from APIs..."
        progress={progress}
      />
    </div>
  );
};

// ============================================================================
// Example 4: Preset Loading States
// ============================================================================

export const PresetLoadingStatesExample = () => {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <h3 className="text-bitcoin-white font-bold mb-4">Preset Loading States</h3>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Verifying Data */}
        <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
          <VerifyingDataSpinner />
        </div>
        
        {/* Generating Signal */}
        <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
          <GeneratingSignalSpinner />
        </div>
        
        {/* Analyzing Market */}
        <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
          <AnalyzingMarketSpinner />
        </div>
        
        {/* Loading History */}
        <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
          <LoadingHistorySpinner />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Example 5: Full Page Loading Overlay
// ============================================================================

export const LoadingOverlayExample = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleStartLoading = () => {
    setShowOverlay(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowOverlay(false), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <h3 className="text-bitcoin-white font-bold mb-4">Full Page Loading Overlay</h3>
      
      <button
        onClick={handleStartLoading}
        className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange"
      >
        Show Loading Overlay
      </button>

      <LoadingOverlay
        show={showOverlay}
        text="Generating trade signal..."
        progress={progress}
      />
    </div>
  );
};

// ============================================================================
// Example 6: Inline Loading States
// ============================================================================

export const InlineLoadingExample = () => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <h3 className="text-bitcoin-white font-bold mb-4">Inline Loading States</h3>
      
      <div className="space-y-4">
        {/* In Button */}
        <button
          onClick={() => setLoading(!loading)}
          disabled={loading}
          className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <InlineLoading text="Processing..." size="sm" />
          ) : (
            'Start Process'
          )}
        </button>

        {/* In Card */}
        <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
          {loading ? (
            <InlineLoading text="Loading trade data..." size="md" />
          ) : (
            <p className="text-bitcoin-white-80">Trade data will appear here</p>
          )}
        </div>

        {/* In List Item */}
        <div className="space-y-2">
          <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3 flex items-center justify-between">
            <span className="text-bitcoin-white-80">Market Data</span>
            {loading && <InlineLoading size="sm" />}
          </div>
          <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3 flex items-center justify-between">
            <span className="text-bitcoin-white-80">Technical Indicators</span>
            {loading && <InlineLoading size="sm" />}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Example 7: Refresh Button Integration
// ============================================================================

export const RefreshButtonIntegrationExample = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <h3 className="text-bitcoin-white font-bold mb-4">Refresh Button Integration</h3>
      
      <div className="space-y-4">
        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="relative bg-transparent border-2 border-bitcoin-orange text-bitcoin-orange font-bold px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] w-full"
        >
          {isRefreshing ? (
            <VerifyingDataSpinner />
          ) : (
            'Refresh Data'
          )}
        </button>

        {/* Last Refresh Timestamp */}
        {lastRefresh && (
          <p className="text-center text-bitcoin-white-60 text-sm">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </p>
        )}

        {/* Data Display */}
        <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
          {isRefreshing ? (
            <InlineLoading text="Updating data..." size="md" />
          ) : (
            <div>
              <p className="text-bitcoin-white-80 font-semibold">BTC Price</p>
              <p className="text-bitcoin-orange font-mono text-2xl font-bold">$95,000</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Example 8: Trade Signal Generation
// ============================================================================

export const TradeSignalGenerationExample = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const steps = [
    'Fetching market data...',
    'Analyzing technical indicators...',
    'Checking sentiment data...',
    'Evaluating on-chain metrics...',
    'Calculating risk parameters...',
    'Generating AI analysis...',
    'Finalizing trade signal...'
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i]);
      setProgress(((i + 1) / steps.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsGenerating(false);
    setProgress(0);
    setCurrentStep('');
  };

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <h3 className="text-bitcoin-white font-bold mb-4">Trade Signal Generation</h3>
      
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange disabled:opacity-50 disabled:cursor-not-allowed w-full mb-4"
      >
        {isGenerating ? 'Generating...' : 'Generate Trade Signal'}
      </button>

      {isGenerating && (
        <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-6">
          <LoadingSpinner
            size="xl"
            text={currentStep}
            progress={progress}
            pulse
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// All Examples Component
// ============================================================================

export default function LoadingSpinnerExamples() {
  return (
    <div className="min-h-screen bg-bitcoin-black p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-bitcoin-white mb-2">
            Einstein Loading Spinner Examples
          </h1>
          <p className="text-bitcoin-white-60">
            Comprehensive examples of loading states for the Einstein Trade Engine
          </p>
        </div>

        <BasicSpinnerExample />
        <SpinnerWithTextExample />
        <ProgressIndicatorExample />
        <PresetLoadingStatesExample />
        <LoadingOverlayExample />
        <InlineLoadingExample />
        <RefreshButtonIntegrationExample />
        <TradeSignalGenerationExample />
      </div>
    </div>
  );
}
