/**
 * OpenAI Analysis Progress Component
 * 
 * Displays real-time progress for GPT-5.1 analysis
 * Pattern matches Whale Watch Deep Dive progress UI
 */

import React from 'react';
import { Loader, CheckCircle, Circle, Clock, Brain } from 'lucide-react';

interface OpenAIAnalysisProgressProps {
  progress: string;
  elapsedTime: number;
  onCancel: () => void;
}

export const OpenAIAnalysisProgress: React.FC<OpenAIAnalysisProgressProps> = ({
  progress,
  elapsedTime,
  onCancel,
}) => {
  // Define analysis stages
  const stages = [
    'Starting analysis...',
    'Fetching market data...',
    'Analyzing technical indicators...',
    'Processing sentiment data...',
    'Generating comprehensive summary...',
    'Finalizing analysis...',
  ];

  // Calculate current stage index
  const currentIndex = stages.indexOf(progress);
  const completionPercentage = currentIndex >= 0 
    ? Math.round(((currentIndex + 1) / stages.length) * 100) 
    : 0;

  // Estimated total time: 2-10 minutes (use 5 minutes as average)
  const estimatedTotalTime = 300; // 5 minutes (300 seconds)
  const estimatedTimeRemaining = Math.max(0, Math.round(estimatedTotalTime - elapsedTime));

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="p-6 bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl shadow-[0_0_30px_rgba(247,147,26,0.5)] animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-bitcoin-orange animate-pulse" />
        <span className="text-bitcoin-white font-bold text-xl">
          🤖 ChatGPT 5.1 Analysis in Progress
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-bitcoin-white-80 font-medium">
            Progress: {completionPercentage}%
          </span>
          <span className="text-sm text-bitcoin-white-60 font-mono">
            {formatTime(elapsedTime)} / ~{formatTime(estimatedTotalTime)}
          </span>
        </div>
        <div className="w-full h-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-bitcoin-orange transition-all duration-500 ease-out shadow-[0_0_10px_rgba(247,147,26,0.5)]"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Stage List */}
      <div className="space-y-3 mb-6">
        {stages.map((stage, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isPending = i > currentIndex;

          return (
            <div key={i} className="flex items-center gap-3">
              {isCompleted && (
                <CheckCircle className="w-5 h-5 text-bitcoin-orange flex-shrink-0" />
              )}
              {isCurrent && (
                <Loader className="w-5 h-5 text-bitcoin-orange animate-spin flex-shrink-0" />
              )}
              {isPending && (
                <Circle className="w-5 h-5 text-bitcoin-white-60 flex-shrink-0" />
              )}
              <span 
                className={`text-sm ${
                  isCompleted || isCurrent 
                    ? 'text-bitcoin-white font-medium' 
                    : 'text-bitcoin-white-60'
                }`}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>

      {/* Time Estimate */}
      <div className="pt-4 border-t border-bitcoin-orange-20">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-bitcoin-white-80 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Estimated time remaining:
          </p>
          <p className="text-sm text-bitcoin-orange font-bold font-mono">
            ~{formatTime(estimatedTimeRemaining)}
          </p>
        </div>
        <p className="text-xs text-bitcoin-white-60 text-center mb-4">
          ChatGPT 5.1 (Latest) • Enhanced reasoning • Comprehensive analysis
        </p>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="w-full px-4 py-3 bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange 
                   font-bold rounded-lg hover:bg-bitcoin-orange hover:text-bitcoin-black 
                   transition-all shadow-[0_0_15px_rgba(247,147,26,0.3)] 
                   hover:shadow-[0_0_25px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 
                   min-h-[48px] uppercase text-sm"
          title="Cancel analysis"
        >
          ✕ Cancel Analysis
        </button>
        <p className="text-xs text-bitcoin-white-60 text-center mt-2">
          Analysis will be cancelled and you can retry
        </p>
      </div>
    </div>
  );
};
