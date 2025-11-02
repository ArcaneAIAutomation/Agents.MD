/**
 * Caesar Research Example Component
 * Demonstrates how to use Caesar AI research integration
 * 
 * This is an example component showing the complete workflow:
 * 1. User enters a token symbol
 * 2. Research is fetched from Caesar AI
 * 3. Results are displayed in CaesarResearchPanel
 */

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useCaesarResearch } from '../../hooks/useCaesarResearch';
import CaesarResearchPanel from './CaesarResearchPanel';

export const CaesarResearchExample: React.FC = () => {
  const [inputSymbol, setInputSymbol] = useState<string>('');
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);

  // Use the Caesar research hook
  const { research, loading, error, cached, refetch } = useCaesarResearch(activeSymbol);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputSymbol.trim()) {
      setActiveSymbol(inputSymbol.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-bitcoin-black p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-bitcoin-white mb-2">
            Caesar AI Research
          </h1>
          <p className="text-bitcoin-white-60">
            Deep cryptocurrency analysis powered by AI
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputSymbol}
                onChange={(e) => setInputSymbol(e.target.value)}
                placeholder="Enter token symbol (e.g., BTC, ETH, SOL)"
                className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg px-4 py-3 text-bitcoin-white placeholder-bitcoin-white-60 focus:border-bitcoin-orange focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!inputSymbol.trim() || loading}
              className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Research
            </button>
          </div>
        </form>

        {/* Cache Indicator */}
        {activeSymbol && !loading && !error && cached && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-bitcoin-white-60">
                Showing cached results for {activeSymbol}
              </span>
              <button
                onClick={refetch}
                className="text-sm text-bitcoin-orange hover:text-bitcoin-white transition-colors font-semibold"
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Research Panel */}
        {activeSymbol && (
          <CaesarResearchPanel
            symbol={activeSymbol}
            research={research!}
            loading={loading}
            error={error}
          />
        )}

        {/* Instructions */}
        {!activeSymbol && (
          <div className="max-w-2xl mx-auto bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6">
            <h3 className="text-bitcoin-white font-bold mb-3">
              How it works:
            </h3>
            <ul className="space-y-2 text-sm text-bitcoin-white-80">
              <li className="flex items-start gap-2">
                <span className="text-bitcoin-orange font-bold">1.</span>
                <span>Enter a cryptocurrency token symbol (e.g., BTC, ETH, SOL)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-bitcoin-orange font-bold">2.</span>
                <span>Caesar AI will conduct deep research (5-7 minutes)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-bitcoin-orange font-bold">3.</span>
                <span>View comprehensive analysis with sources and citations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-bitcoin-orange font-bold">4.</span>
                <span>Results are cached for 24 hours for instant access</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaesarResearchExample;
