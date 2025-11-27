/**
 * Analysis Loading Message Component
 * 
 * Shows users what's happening during comprehensive AI analysis
 * Provides transparency about data sources and processing time
 */

import React, { useState, useEffect } from 'react';
import { Brain, Database, TrendingUp, Users, Globe, Zap } from 'lucide-react';

interface AnalysisLoadingMessageProps {
  symbol: string;
  timeframe: string;
}

export default function AnalysisLoadingMessage({ symbol, timeframe }: AnalysisLoadingMessageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const steps = [
    {
      icon: <Database size={24} className="text-bitcoin-orange" />,
      title: 'Fetching Real-Time Market Data',
      description: 'CoinMarketCap, CoinGecko, Kraken',
      duration: 2
    },
    {
      icon: <TrendingUp size={24} className="text-bitcoin-orange" />,
      title: 'Calculating Technical Indicators',
      description: 'Binance OHLC data (500 candles)',
      duration: 3
    },
    {
      icon: <Users size={24} className="text-bitcoin-orange" />,
      title: 'Analyzing Social Sentiment',
      description: 'LunarCrush, Twitter, Reddit',
      duration: 2
    },
    {
      icon: <Globe size={24} className="text-bitcoin-orange" />,
      title: 'Checking On-Chain Activity',
      description: 'Blockchain.com, Etherscan',
      duration: 2
    },
    {
      icon: <Brain size={24} className="text-bitcoin-orange" />,
      title: 'Running AI Analysis',
      description: 'OpenAI GPT-5.1 + Gemini AI',
      duration: 8
    },
    {
      icon: <Zap size={24} className="text-bitcoin-orange" />,
      title: 'Generating Trade Signal',
      description: 'Calculating optimal entry/exit levels',
      duration: 2
    }
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 3000); // Move to next step every 3 seconds

    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(timeInterval);
    };
  }, []);

  return (
    <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="animate-spin">
            <Brain size={32} className="text-bitcoin-orange" />
          </div>
          <h3 className="text-2xl font-bold text-bitcoin-white">
            Generating Comprehensive Analysis
          </h3>
        </div>
        <p className="text-bitcoin-white-60">
          {symbol} • {timeframe} • {elapsedTime}s elapsed
        </p>
      </div>

      {/* Progress Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`
              flex items-start gap-4 p-4 rounded-lg border-2 transition-all
              ${index === currentStep 
                ? 'bg-bitcoin-orange bg-opacity-10 border-bitcoin-orange' 
                : index < currentStep
                ? 'bg-bitcoin-orange bg-opacity-5 border-bitcoin-orange-20'
                : 'bg-bitcoin-black border-bitcoin-orange-20 opacity-50'
              }
            `}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-1">
              {index < currentStep ? (
                <div className="w-6 h-6 rounded-full bg-bitcoin-orange flex items-center justify-center">
                  <span className="text-bitcoin-black text-sm font-bold">✓</span>
                </div>
              ) : index === currentStep ? (
                <div className="animate-pulse">
                  {step.icon}
                </div>
              ) : (
                <div className="opacity-50">
                  {step.icon}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold mb-1 ${
                index === currentStep ? 'text-bitcoin-orange' : 'text-bitcoin-white'
              }`}>
                {step.title}
              </h4>
              <p className="text-bitcoin-white-60 text-sm">
                {step.description}
              </p>
            </div>

            {/* Status */}
            <div className="flex-shrink-0">
              {index < currentStep && (
                <span className="text-bitcoin-orange text-sm font-bold">
                  Complete
                </span>
              )}
              {index === currentStep && (
                <span className="text-bitcoin-orange text-sm font-bold animate-pulse">
                  Processing...
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Message */}
      <div className="mt-6 p-4 bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg">
        <p className="text-bitcoin-white-80 text-sm text-center">
          <span className="font-bold text-bitcoin-orange">⏱️ Estimated time:</span> 15-20 seconds
          <br />
          <span className="text-bitcoin-white-60 text-xs">
            We're analyzing data from 10+ sources to generate the most accurate trade signal possible.
            <br />
            Your trade will appear in the list once analysis is complete.
          </span>
        </p>
      </div>

      {/* Data Sources Badge */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <span className="px-2 py-1 bg-bitcoin-black border border-bitcoin-orange-20 rounded text-xs text-bitcoin-white-60">
          CoinMarketCap
        </span>
        <span className="px-2 py-1 bg-bitcoin-black border border-bitcoin-orange-20 rounded text-xs text-bitcoin-white-60">
          Binance
        </span>
        <span className="px-2 py-1 bg-bitcoin-black border border-bitcoin-orange-20 rounded text-xs text-bitcoin-white-60">
          LunarCrush
        </span>
        <span className="px-2 py-1 bg-bitcoin-black border border-bitcoin-orange-20 rounded text-xs text-bitcoin-white-60">
          Blockchain.com
        </span>
        <span className="px-2 py-1 bg-bitcoin-black border border-bitcoin-orange-20 rounded text-xs text-bitcoin-orange font-bold">
          OpenAI GPT-5.1
        </span>
        <span className="px-2 py-1 bg-bitcoin-black border border-bitcoin-orange-20 rounded text-xs text-bitcoin-orange font-bold">
          Gemini AI
        </span>
      </div>
    </div>
  );
}
