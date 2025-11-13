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
          `✅ Trade signal generated successfully! View your trade analysis below.`
        );
        
        // Keep success message visible longer so user can see it
        setTimeout(() => setSuccessMessage(null), 8000);

        // DO NOT reload the page - this logs the user out!
        // Instead, the TradeHistoryTable and PerformanceDashboard components
        // will automatically refresh their data when they detect lastGeneratedAt changed
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
        <div className={`flex items-center gap-3 mb-4 ${isMobile ? 'flex-col text-center' : ''}`}>
          <TrendingUp 
            size={isMobile ? 28 : 32} 
            className={`text-bitcoin-orange ${isMobile ? 'mb-2' : ''}`} 
          />
          <div className={isMobile ? 'w-full' : ''}>
            <h1 className={`font-bold text-bitcoin-white ${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'}`}>
              AI Trade Generation Engine
            </h1>
            <p className={`text-bitcoin-white-80 font-medium ${isMobile ? 'text-xs mt-1' : 'text-sm mt-1'}`}>
              {isMobile ? (
                <>Advanced AI-powered trade signals with 100% real data backtesting</>
              ) : (
                <>Advanced AI-powered trade signal generation with 100% real data backtesting</>
              )}
            </p>
          </div>
        </div>

        {/* API/AI Capabilities Showcase - Desktop */}
        {!isMobile && (
          <div className="grid grid-cols-4 gap-4 mt-4 mb-4">
            <div className="text-center">
              <div className="text-bitcoin-orange font-mono text-xl font-bold mb-1">Dual AI</div>
              <div className="text-bitcoin-white-60 text-xs uppercase tracking-wider">GPT-5.1 + Gemini</div>
            </div>
            <div className="text-center">
              <div className="text-bitcoin-orange font-mono text-xl font-bold mb-1">13 APIs</div>
              <div className="text-bitcoin-white-60 text-xs uppercase tracking-wider">Data Sources</div>
            </div>
            <div className="text-center">
              <div className="text-bitcoin-orange font-mono text-xl font-bold mb-1">4 Timeframes</div>
              <div className="text-bitcoin-white-60 text-xs uppercase tracking-wider">15m/1h/4h/1d</div>
            </div>
            <div className="text-center">
              <div className="text-bitcoin-orange font-mono text-xl font-bold mb-1">100%</div>
              <div className="text-bitcoin-white-60 text-xs uppercase tracking-wider">Real-Time Data</div>
            </div>
          </div>
        )}

        {/* API/AI Capabilities Showcase - Mobile */}
        {isMobile && (
          <div className="grid grid-cols-2 gap-3 mt-3 mb-3">
            <div className="text-center bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-2">
              <div className="text-bitcoin-orange font-mono text-lg font-bold mb-0.5">Dual AI</div>
              <div className="text-bitcoin-white-60 text-xs">GPT-5.1 + Gemini</div>
            </div>
            <div className="text-center bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-2">
              <div className="text-bitcoin-orange font-mono text-lg font-bold mb-0.5">13 APIs</div>
              <div className="text-bitcoin-white-60 text-xs">Data Sources</div>
            </div>
            <div className="text-center bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-2">
              <div className="text-bitcoin-orange font-mono text-lg font-bold mb-0.5">4 Timeframes</div>
              <div className="text-bitcoin-white-60 text-xs">15m/1h/4h/1d</div>
            </div>
            <div className="text-center bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-2">
              <div className="text-bitcoin-orange font-mono text-lg font-bold mb-0.5">100%</div>
              <div className="text-bitcoin-white-60 text-xs">Real-Time Data</div>
            </div>
          </div>
        )}

        {/* How It Works Section */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 mt-4">
          <h3 className="text-bitcoin-white font-bold text-sm mb-2 flex items-center gap-2">
            <span className="text-bitcoin-orange">⚡</span> How It Works
          </h3>
          <p className="text-bitcoin-white-60 text-xs leading-relaxed">
            The Ultimate AI Trade Generation Engine uses <span className="text-bitcoin-orange font-semibold">Dual AI Analysis</span> (OpenAI GPT-5.1 + Google Gemini 2.0 Flash) to analyze real-time data from <span className="text-bitcoin-orange font-semibold">13 APIs</span>: Market data (CoinMarketCap, CoinGecko, Kraken), Technical indicators (Binance - 500 candles), Social sentiment (LunarCrush, Twitter, Reddit), On-chain metrics (Blockchain.com, Etherscan), and News (NewsAPI). Each trade includes entry price, 3 take-profit levels, stop loss, timeframe (15m/1h/4h/1d), confidence score, and comprehensive AI reasoning. All data is <span className="text-bitcoin-orange font-semibold">force-refreshed</span> for 100% real-time accuracy with complete data source attribution.
          </p>
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
        lastGeneratedAt={lastGeneratedAt}
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
        <TradeHistoryTable 
          symbol={selectedSymbol} 
          lastGeneratedAt={lastGeneratedAt}
        />
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
