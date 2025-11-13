import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import UnlockModal from './UnlockModal';
import SymbolSelector from './SymbolSelector';
import GenerateButton from './GenerateButton';
import PerformanceDashboard from './PerformanceDashboard';
import TradeHistoryTable from './TradeHistoryTable';
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface ATGEInterfaceProps {
  className?: string;
}

// Mobile viewport detection hook
function useMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return { isMobile, isTablet };
}

export default function ATGEInterface({ className = '' }: ATGEInterfaceProps) {
  const { user, loading: authLoading } = useAuth();
  const { isMobile, isTablet } = useMobileViewport();
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<'BTC' | 'ETH'>('BTC');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setError('Please log in to access the AI Trade Generation Engine');
    } else {
      setError(null);
    }
  }, [user, authLoading]);

  // Handle unlock
  const handleUnlock = async (password: string): Promise<boolean> => {
    try {
      // Verify password against environment variable
      const ATGE_PASSWORD = process.env.NEXT_PUBLIC_ATGE_PASSWORD || 'tothemoon';
      
      if (password === ATGE_PASSWORD) {
        setIsUnlocked(true);
        setSuccessMessage('Trade Engine unlocked successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Unlock error:', err);
      return false;
    }
  };

  // Handle generate button click
  const handleGenerateClick = () => {
    if (!isUnlocked) {
      setIsUnlockModalOpen(true);
      return;
    }

    handleGenerateSignal();
  };

  // Handle trade signal generation
  const handleGenerateSignal = async () => {
    if (!user) {
      setError('Please log in to generate trade signals');
      return;
    }

    if (selectedSymbol === 'ETH') {
      setError('Ethereum support is coming soon. Please select Bitcoin.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Call the real API endpoint to generate trade signal
      const response = await fetch('/api/atge/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: selectedSymbol,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate trade signal');
      }

      if (data.success) {
        setLastGeneratedAt(new Date());
        setSuccessMessage(
          `Trade signal generated successfully! ${data.message || 'Check the trade history below.'}`
        );
        setTimeout(() => setSuccessMessage(null), 5000);

        // Trigger a page refresh to update all components with new data
        // This will refresh the performance dashboard and trade history
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to generate trade signal');
      }
    } catch (err: any) {
      console.error('Generate signal error:', err);
      setError(err.message || 'Failed to generate trade signal. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin-orange mx-auto mb-4"></div>
          <p className="text-bitcoin-white-60">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className={`bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 ${className}`}>
        <div className="text-center max-w-md mx-auto">
          <AlertCircle size={48} className="text-bitcoin-orange mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-bitcoin-white mb-3">
            Authentication Required
          </h2>
          <p className="text-bitcoin-white-60 mb-6">
            Please log in to access the AI Trade Generation Engine and start generating trade signals.
          </p>
          <a
            href="/auth/login"
            className="inline-block bg-bitcoin-orange text-bitcoin-black font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)]"
          >
            Log In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 md:space-y-6 ${className}`}>
      {/* Header - Mobile Optimized */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-4 md:p-6">
        <div className={`flex items-center gap-3 mb-3 ${isMobile ? 'flex-col text-center' : ''}`}>
          <TrendingUp 
            size={isMobile ? 28 : 32} 
            className={`text-bitcoin-orange ${isMobile ? 'mb-2' : ''}`} 
          />
          <div className={isMobile ? 'w-full' : ''}>
            <h1 className={`font-bold text-bitcoin-white ${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'}`}>
              AI Trade Generation Engine
            </h1>
            <p className={`text-bitcoin-white-60 ${isMobile ? 'text-xs mt-1' : 'text-sm'}`}>
              {isMobile ? (
                <>GPT-4o • Real-time Analysis</>
              ) : (
                <>Powered by GPT-4o • Real-time Market Analysis • Backtested Results</>
              )}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className={`flex items-center gap-2 mt-4 ${isMobile ? 'justify-center' : ''}`}>
          <div className={`w-2 h-2 rounded-full ${isUnlocked ? 'bg-bitcoin-orange' : 'bg-bitcoin-white-60'}`}></div>
          <span className="text-bitcoin-white-60 text-sm">
            Status: {isUnlocked ? 'Unlocked' : 'Locked'}
          </span>
        </div>
      </div>

      {/* Success message - Mobile Optimized */}
      {successMessage && (
        <div className="bg-bitcoin-orange bg-opacity-10 border-2 border-bitcoin-orange rounded-xl p-3 md:p-4">
          <div className={`flex items-start gap-2 md:gap-3 ${isMobile ? 'flex-col text-center' : ''}`}>
            <CheckCircle 
              size={isMobile ? 18 : 20} 
              className={`text-bitcoin-orange flex-shrink-0 ${isMobile ? 'mx-auto mb-1' : 'mt-0.5'}`} 
            />
            <p className={`text-bitcoin-orange font-semibold ${isMobile ? 'text-sm' : ''}`}>
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* Error message - Mobile Optimized */}
      {error && (
        <div className="bg-bitcoin-orange bg-opacity-10 border-2 border-bitcoin-orange rounded-xl p-3 md:p-4">
          <div className={`flex items-start gap-2 md:gap-3 ${isMobile ? 'flex-col text-center' : ''}`}>
            <AlertCircle 
              size={isMobile ? 18 : 20} 
              className={`text-bitcoin-orange flex-shrink-0 ${isMobile ? 'mx-auto mb-1' : 'mt-0.5'}`} 
            />
            <p className={`text-bitcoin-orange font-semibold ${isMobile ? 'text-sm' : ''}`}>
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Main controls - Mobile Optimized */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Symbol selector - Responsive */}
        <SymbolSelector
          selected={selectedSymbol}
          onChange={setSelectedSymbol}
          disabled={isGenerating}
        />

        {/* Generate button - Touch-friendly */}
        <GenerateButton
          onClick={handleGenerateClick}
          isLoading={isGenerating}
          isUnlocked={isUnlocked}
          disabled={!user}
          lastGeneratedAt={lastGeneratedAt}
          cooldownSeconds={60}
        />
      </div>

      {/* Performance Dashboard */}
      <PerformanceDashboard
        symbol={selectedSymbol}
        onViewAllTrades={() => {
          // Scroll to trade history section
          const tradeHistoryElement = document.getElementById('trade-history-section');
          if (tradeHistoryElement) {
            tradeHistoryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
      />

      {/* Trade History Table */}
      <div id="trade-history-section">
        <TradeHistoryTable symbol={selectedSymbol} />
      </div>

      {/* Unlock modal */}
      <UnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        onUnlock={handleUnlock}
      />
    </div>
  );
}
