import React from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../../hooks/useSwipeGesture';
import { hapticRefresh } from '../../lib/ucie/hapticFeedback';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  threshold?: number;
}

export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
}: PullToRefreshProps) {
  const { isPulling, pullDistance, isRefreshing, shouldTrigger } = usePullToRefresh({
    onRefresh: async () => {
      hapticRefresh();
      await onRefresh();
    },
    threshold,
  });

  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const rotation = (pullDistance / threshold) * 360;

  return (
    <div className="relative">
      {/* Pull-to-refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200"
          style={{
            height: `${Math.min(pullDistance, threshold * 1.5)}px`,
            opacity: Math.min(pullDistance / threshold, 1),
          }}
        >
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-full p-3 shadow-lg">
            <RefreshCw
              className={`w-6 h-6 text-bitcoin-orange ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              style={{
                transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
                transition: isRefreshing ? 'none' : 'transform 0.1s ease-out',
              }}
            />
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {isPulling && !isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-40">
          <div
            className="h-1 bg-bitcoin-orange transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Release message */}
      {shouldTrigger && !isRefreshing && (
        <div className="fixed top-20 left-0 right-0 z-40 flex justify-center">
          <div className="bg-bitcoin-orange text-bitcoin-black px-4 py-2 rounded-full font-semibold text-sm shadow-lg">
            Release to refresh
          </div>
        </div>
      )}

      {/* Refreshing message */}
      {isRefreshing && (
        <div className="fixed top-20 left-0 right-0 z-40 flex justify-center">
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange text-bitcoin-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg">
            Refreshing...
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: isPulling && !isRefreshing ? `translateY(${pullDistance}px)` : 'none',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
