import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface SymbolSelectorProps {
  selected: 'BTC'; // ✅ BITCOIN-FIRST: Only BTC for now
  onChange: (symbol: 'BTC') => void;
  disabled?: boolean;
}

export default function SymbolSelector({ selected, onChange, disabled = false }: SymbolSelectorProps) {
  // ✅ BITCOIN-FIRST: Removed ETH functionality - focusing on perfecting Bitcoin features

  return (
    <div className="space-y-3">
      {/* Label */}
      <label className="block text-bitcoin-white-80 text-sm font-semibold uppercase tracking-wider">
        Select Cryptocurrency
      </label>

      {/* Bitcoin-Only Display - Perfecting BTC Features */}
      <div className="flex flex-col gap-3">
        {/* Bitcoin button - Always Active */}
        <button
          disabled={disabled}
          className={`
            relative px-4 sm:px-6 py-4 min-h-[48px] rounded-lg font-bold uppercase tracking-wider transition-all
            bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange shadow-[0_0_20px_rgba(247,147,26,0.5)]
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-default'}
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl sm:text-2xl">₿</span>
            <span className="text-sm sm:text-base">Bitcoin</span>
          </div>
          <div className="absolute -top-2 -right-2 bg-bitcoin-orange text-bitcoin-black text-xs font-bold px-2 py-1 rounded-full">
            ACTIVE
          </div>
        </button>

        {/* Info message about Bitcoin focus */}
        <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
          <p className="text-bitcoin-white-60 text-xs text-center">
            <span className="text-bitcoin-orange font-semibold">Bitcoin-First Platform:</span> We're perfecting Bitcoin analysis before expanding to other cryptocurrencies. Ethereum Report remains available.
          </p>
        </div>
      </div>

      {/* Info text */}
      <div className="flex items-start gap-2 bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
        <Info size={16} className="text-bitcoin-orange flex-shrink-0 mt-0.5" />
        <p className="text-bitcoin-white-60 text-xs">
          Bitcoin trade signals use real-time market data from 13+ APIs, advanced technical indicators, and dual AI analysis (ChatGPT 5.1 + Gemini 2.5 Pro) to generate actionable trading recommendations with 99% data accuracy.
        </p>
      </div>
    </div>
  );
}
