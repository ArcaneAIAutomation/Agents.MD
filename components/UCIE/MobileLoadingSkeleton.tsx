import React from 'react';

interface MobileLoadingSkeletonProps {
  type?: 'card' | 'chart' | 'stat' | 'list';
  count?: number;
}

export default function MobileLoadingSkeleton({ type = 'card', count = 1 }: MobileLoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-4 animate-pulse">
            <div className="h-6 bg-bitcoin-orange-10 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-bitcoin-orange-10 rounded w-full mb-2"></div>
            <div className="h-4 bg-bitcoin-orange-10 rounded w-5/6 mb-2"></div>
            <div className="h-4 bg-bitcoin-orange-10 rounded w-4/6"></div>
          </div>
        );

      case 'chart':
        return (
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-4 animate-pulse">
            <div className="h-6 bg-bitcoin-orange-10 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-bitcoin-orange-10 rounded"></div>
          </div>
        );

      case 'stat':
        return (
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4 animate-pulse">
            <div className="h-3 bg-bitcoin-orange-10 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-bitcoin-orange-10 rounded w-3/4"></div>
          </div>
        );

      case 'list':
        return (
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-4 animate-pulse">
            <div className="h-6 bg-bitcoin-orange-10 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-bitcoin-orange-10 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-bitcoin-orange-10 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-bitcoin-orange-10 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index} className="mb-4">
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
}

// Phase-specific loading component
interface PhaseLoadingProps {
  phase: number;
  label: string;
  progress: number;
}

export function PhaseLoading({ phase, label, progress }: PhaseLoadingProps) {
  return (
    <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-6 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-bitcoin-orange-10 flex items-center justify-center">
            <span className="text-bitcoin-orange font-bold text-lg">{phase}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-bitcoin-white">
              Phase {phase}
            </h3>
            <p className="text-sm text-bitcoin-white-60">
              {label}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-bitcoin-orange">
            {progress}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
        <div
          className="h-full bg-bitcoin-orange transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
}
