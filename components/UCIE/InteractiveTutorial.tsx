import React, { useState, useEffect } from 'react';

interface TutorialStep {
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Welcome to UCIE',
    description: 'The Universal Crypto Intelligence Engine provides comprehensive analysis of any cryptocurrency. Let\'s take a quick tour!',
    position: 'center'
  },
  {
    title: 'Search for Any Token',
    description: 'Start by entering a token symbol (like BTC, ETH, or SOL) in the search bar. We support 10,000+ cryptocurrencies.',
    target: '[data-tutorial="search-bar"]',
    position: 'bottom'
  },
  {
    title: 'Real-Time Market Data',
    description: 'View live prices from multiple exchanges, 24h volume, market cap, and arbitrage opportunities.',
    target: '[data-tutorial="market-data"]',
    position: 'top'
  },
  {
    title: 'AI-Powered Research',
    description: 'Get deep research analysis with verified sources covering technology, team, partnerships, and risks.',
    target: '[data-tutorial="caesar-research"]',
    position: 'top'
  },
  {
    title: 'Technical Analysis',
    description: 'Access 15+ technical indicators with AI interpretation and multi-timeframe consensus signals.',
    target: '[data-tutorial="technical-analysis"]',
    position: 'top'
  },
  {
    title: 'On-Chain Analytics',
    description: 'Track whale movements, holder distribution, and exchange flows to anticipate market moves.',
    target: '[data-tutorial="on-chain"]',
    position: 'top'
  },
  {
    title: 'Risk Assessment',
    description: 'Understand volatility, correlations, and portfolio impact with comprehensive risk metrics.',
    target: '[data-tutorial="risk-assessment"]',
    position: 'top'
  },
  {
    title: 'Consensus Recommendation',
    description: 'Get a single actionable recommendation based on all analysis dimensions with confidence scores.',
    target: '[data-tutorial="consensus"]',
    position: 'top'
  },
  {
    title: 'Export Reports',
    description: 'Generate comprehensive intelligence reports in PDF, JSON, or Markdown format for sharing and record-keeping.',
    target: '[data-tutorial="export"]',
    position: 'left'
  },
  {
    title: 'Need Help?',
    description: 'Hover over any metric to see detailed explanations. Click the help icon (?) for more information.',
    position: 'center'
  }
];

interface InteractiveTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function InteractiveTutorial({ onComplete, onSkip }: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep, step.target]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('ucie_tutorial_completed', 'true');
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('ucie_tutorial_completed', 'true');
    onSkip();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-bitcoin-black bg-opacity-90 z-[9998]"
        style={{ backdropFilter: 'blur(2px)' }}
      />

      {/* Highlight spotlight */}
      {highlightedElement && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: highlightedElement.getBoundingClientRect().top - 8,
            left: highlightedElement.getBoundingClientRect().left - 8,
            width: highlightedElement.getBoundingClientRect().width + 16,
            height: highlightedElement.getBoundingClientRect().height + 16,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8), 0 0 30px rgba(247, 147, 26, 0.5)',
            borderRadius: '12px',
            border: '2px solid var(--bitcoin-orange)'
          }}
        />
      )}

      {/* Tutorial card */}
      <div
        className={`fixed z-[10000] bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-6 shadow-[0_0_40px_rgba(247,147,26,0.5)] max-w-md ${
          step.position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' :
          step.position === 'top' ? 'top-20 left-1/2 -translate-x-1/2' :
          step.position === 'bottom' ? 'bottom-20 left-1/2 -translate-x-1/2' :
          step.position === 'left' ? 'top-1/2 left-20 -translate-y-1/2' :
          'top-1/2 right-20 -translate-y-1/2'
        }`}
      >
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-bitcoin-orange'
                    : index < currentStep
                    ? 'w-4 bg-bitcoin-orange opacity-50'
                    : 'w-4 bg-bitcoin-white-60 opacity-30'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-sm text-bitcoin-white-60 hover:text-bitcoin-white transition-colors"
            aria-label="Skip tutorial"
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-bitcoin-white mb-3">
          {step.title}
        </h3>
        <p className="text-bitcoin-white-80 leading-relaxed mb-6">
          {step.description}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              isFirstStep
                ? 'text-bitcoin-white-60 opacity-50 cursor-not-allowed'
                : 'text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
            }`}
            aria-label="Previous step"
          >
            Previous
          </button>

          <span className="text-sm text-bitcoin-white-60">
            {currentStep + 1} of {tutorialSteps.length}
          </span>

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-bitcoin-orange text-bitcoin-black rounded-lg font-bold hover:bg-bitcoin-black hover:text-bitcoin-orange hover:border-2 hover:border-bitcoin-orange transition-all"
            aria-label={isLastStep ? 'Complete tutorial' : 'Next step'}
          >
            {isLastStep ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Hook to check if tutorial should be shown
 */
export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('ucie_tutorial_completed');
    if (!completed) {
      setShowTutorial(true);
    }
  }, []);

  const resetTutorial = () => {
    localStorage.removeItem('ucie_tutorial_completed');
    setShowTutorial(true);
  };

  return { showTutorial, setShowTutorial, resetTutorial };
}
