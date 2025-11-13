import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface SymbolSelectorProps {
  selected: 'BTC' | 'ETH';
  onChange: (symbol: 'BTC' | 'ETH') => void;
  disabled?: boolean;
}

export default function SymbolSelector({ selected, onChange, disabled = false }: SymbolSelectorProps) {
  const [showEthTooltip, setShowEthTooltip] = useState(false);

  const handleEthClick = () => {
    // Show tooltip when clicking disabled ETH button
    setShowEthTooltip(true);
    setTimeout(() => setShowEthTooltip(false), 3000);
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <label className="block text-bitcoin-white-80 text-sm font-semibold uppercase tracking-wider">
        Select Cryptocurrency
      </label>

      {/* Button group - Mobile Optimized with 48px minimum touch targets */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Bitcoin button - Active - Touch-friendly */}
        <button
          onClick={() => !disabled && onChange('BTC')}
          disabled={disabled}
          className={`
            flex-1 relative px-4 sm:px-6 py-4 min-h-[48px] rounded-lg font-bold uppercase tracking-wider transition-all
            ${selected === 'BTC'
              ? 'bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange shadow-[0_0_20px_rgba(247,147,26,0.5)]'
              : 'bg-bitcoin-black text-bitcoin-orange border-2 border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)]'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl sm:text-2xl">₿</span>
            <span className="text-sm sm:text-base">Bitcoin</span>
          </div>
          {selected === 'BTC' && (
            <div className="absolute -top-2 -right-2 bg-bitcoin-orange text-bitcoin-black text-xs font-bold px-2 py-1 rounded-full">
              ACTIVE
            </div>
          )}
        </button>

        {/* Ethereum button - Disabled/In Development - Touch-friendly */}
        <div className="flex-1 relative">
          <button
            onClick={handleEthClick}
            disabled={true}
            className="w-full px-4 sm:px-6 py-4 min-h-[48px] rounded-lg font-bold uppercase tracking-wider transition-all bg-bitcoin-black text-bitcoin-white-60 border-2 border-bitcoin-orange-20 cursor-not-allowed opacity-50"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl sm:text-2xl">Ξ</span>
              <span className="text-sm sm:text-base">Ethereum</span>
            </div>
          </button>

          {/* "In Development" badge */}
          <div className="absolute -top-2 -right-2 bg-bitcoin-orange text-bitcoin-black text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
            IN DEV
          </div>

          {/* Tooltip */}
          {showEthTooltip && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-10 w-64">
              <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-3 shadow-[0_0_20px_rgba(247,147,26,0.3)]">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-bitcoin-orange flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-bitcoin-white text-sm font-semibold mb-1">
                      Coming Soon
                    </p>
                    <p className="text-bitcoin-white-60 text-xs">
                      Ethereum support is currently under development and will be available in a future update.
                    </p>
                  </div>
                </div>
                {/* Arrow */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-bitcoin-orange"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info text */}
      <div className="flex items-start gap-2 bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
        <Info size={16} className="text-bitcoin-orange flex-shrink-0 mt-0.5" />
        <p className="text-bitcoin-white-60 text-xs">
          {selected === 'BTC' 
            ? 'Bitcoin trade signals use real-time market data, technical indicators, and AI analysis to generate actionable trading recommendations.'
            : 'Select a cryptocurrency to generate AI-powered trade signals.'
          }
        </p>
      </div>
    </div>
  );
}
