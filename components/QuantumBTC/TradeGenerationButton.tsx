import React, { useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';

interface TradeGenerationButtonProps {
  onTradeGenerated?: (trade: any) => void;
  disabled?: boolean;
  className?: string;
}

export default function TradeGenerationButton({
  onTradeGenerated,
  disabled = false,
  className = ''
}: TradeGenerationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateTrade = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quantum/generate-btc-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate trade');
      }

      if (data.success && data.trade) {
        onTradeGenerated?.(data.trade);
      } else {
        throw new Error('No trade data received');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Trade generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={handleGenerateTrade}
        disabled={disabled || loading}
        className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-bitcoin-orange disabled:hover:text-bitcoin-black disabled:hover:shadow-none flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating Quantum Trade...</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            <span>Generate BTC Trade Signal</span>
          </>
        )}
      </button>

      {error && (
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
          <p className="text-bitcoin-orange text-sm font-semibold mb-1">
            Trade Generation Failed
          </p>
          <p className="text-bitcoin-white-80 text-sm">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
