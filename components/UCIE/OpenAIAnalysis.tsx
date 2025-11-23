/**
 * OpenAI Analysis Component
 * 
 * Main orchestrator for GPT-5.1 analysis
 * Manages state and displays appropriate UI based on status
 */

import React from 'react';
import { Brain, AlertCircle } from 'lucide-react';
import { useOpenAISummary } from '../../hooks/useOpenAISummary';
import { OpenAIAnalysisProgress } from './OpenAIAnalysisProgress';
import { OpenAIAnalysisResults } from './OpenAIAnalysisResults';

interface OpenAIAnalysisProps {
  symbol: string;
  className?: string;
}

export const OpenAIAnalysis: React.FC<OpenAIAnalysisProps> = ({ 
  symbol,
  className = '',
}) => {
  const {
    status,
    result,
    error,
    progress,
    elapsedTime,
    startAnalysis,
    cancelAnalysis,
    reset,
  } = useOpenAISummary(symbol);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Idle State - Show Start Button */}
      {status === 'idle' && (
        <div className="p-8 bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl text-center">
          <Brain className="w-16 h-16 text-bitcoin-orange mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-bitcoin-white mb-3">
            ChatGPT 5.1 AI Analysis
          </h3>
          <p className="text-bitcoin-white-80 mb-6 max-w-2xl mx-auto">
            Get comprehensive market analysis powered by ChatGPT 5.1 (Latest) with enhanced reasoning. 
            Analysis includes market outlook, key insights, opportunities, and risk factors.
          </p>
          <button
            onClick={startAnalysis}
            className="px-8 py-4 bg-bitcoin-orange text-bitcoin-black font-bold rounded-lg 
                     hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange
                     transition-all shadow-[0_0_20px_rgba(247,147,26,0.5)] 
                     hover:shadow-[0_0_30px_rgba(247,147,26,0.6)] hover:scale-105 active:scale-95 
                     min-h-[56px] uppercase text-base"
          >
            <span className="flex items-center gap-3">
              <Brain className="w-6 h-6" />
              Start AI Analysis
            </span>
          </button>
          <p className="text-bitcoin-white-60 text-sm mt-4">
            Analysis typically takes 2-10 minutes
          </p>
        </div>
      )}

      {/* Starting State - Brief Loading */}
      {status === 'starting' && (
        <div className="p-8 bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl text-center">
          <Brain className="w-16 h-16 text-bitcoin-orange mx-auto mb-4 animate-pulse" />
          <h3 className="text-2xl font-bold text-bitcoin-white mb-3">
            Initializing Analysis...
          </h3>
          <p className="text-bitcoin-white-80">
            Setting up ChatGPT 5.1 analysis for {symbol}
          </p>
        </div>
      )}

      {/* Polling State - Show Progress */}
      {status === 'polling' && (
        <OpenAIAnalysisProgress
          progress={progress}
          elapsedTime={elapsedTime}
          onCancel={cancelAnalysis}
        />
      )}

      {/* Completed State - Show Results */}
      {status === 'completed' && result && (
        <OpenAIAnalysisResults
          result={result}
          symbol={symbol}
          onReset={reset}
        />
      )}

      {/* Error State - Show Error Message */}
      {status === 'error' && (
        <div className="p-8 bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-bitcoin-orange flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-bitcoin-white mb-3">
                Analysis Failed
              </h3>
              <p className="text-bitcoin-white-80 mb-6">
                {error || 'An unexpected error occurred during analysis.'}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={startAnalysis}
                  className="px-6 py-3 bg-bitcoin-orange text-bitcoin-black font-bold rounded-lg 
                           hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange
                           transition-all shadow-[0_0_15px_rgba(247,147,26,0.3)] 
                           hover:shadow-[0_0_25px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 
                           min-h-[48px] uppercase text-sm"
                >
                  Retry Analysis
                </button>
                <button
                  onClick={reset}
                  className="px-6 py-3 bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange 
                           font-bold rounded-lg hover:bg-bitcoin-orange hover:text-bitcoin-black 
                           transition-all shadow-[0_0_15px_rgba(247,147,26,0.3)] 
                           hover:shadow-[0_0_25px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 
                           min-h-[48px] uppercase text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
