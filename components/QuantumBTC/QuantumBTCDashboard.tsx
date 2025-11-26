import React, { useState } from 'react';
import { Zap, TrendingUp, Activity } from 'lucide-react';
import TradeGenerationButton from './TradeGenerationButton';
import PerformanceDashboard from './PerformanceDashboard';
import TradeDetailModal from './TradeDetailModal';
import DataQualityIndicators from './DataQualityIndicators';

/**
 * Quantum BTC Dashboard - Main Component
 * 
 * Bitcoin Sovereign Technology Design:
 * - Black background (#000000) - The digital canvas
 * - Orange accents (#F7931A) - Energy, action, value
 * - White text - Headlines and critical data
 * - Thin orange borders - Signature look
 * - Glow effects - Depth and emphasis
 */

interface QuantumBTCDashboardProps {
  className?: string;
}

export default function QuantumBTCDashboard({ className = '' }: QuantumBTCDashboardProps) {
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [latestTrade, setLatestTrade] = useState<any>(null);

  // Mock data quality for demonstration
  const mockDataQuality = {
    dataQualityScore: 92,
    apiReliability: {
      cmc: 98.5,
      coingecko: 96.2,
      kraken: 99.1,
      blockchain: 97.8,
      lunarcrush: 95.4
    },
    anomalyCount: 0
  };

  const handleTradeGenerated = (trade: any) => {
    setLatestTrade(trade);
    // Optionally open modal to show the new trade
    if (trade.id) {
      setSelectedTradeId(trade.id);
      setIsModalOpen(true);
    }
  };

  const handleTradeClick = (tradeId: string) => {
    setSelectedTradeId(tradeId);
    setIsModalOpen(true);
  };

  return (
    <div className={`min-h-screen bg-bitcoin-black ${className}`}>
      {/* Hero Header */}
      <div className="bg-bitcoin-black border-b-2 border-bitcoin-orange">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-bitcoin-orange p-3 rounded-lg">
              <Zap className="w-8 h-8 text-bitcoin-black" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-bitcoin-white">
                Quantum BTC Super Spec
              </h1>
              <p className="text-bitcoin-white-60 text-sm italic mt-1">
                Einstein × 1000000000000000x Capability Level
              </p>
            </div>
          </div>
          <p className="text-bitcoin-white-80 max-w-3xl">
            Revolutionary Bitcoin-only intelligence engine combining quantum-pattern reasoning 
            with multi-dimensional predictive modeling and hourly market validation.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Trade Generation Section */}
        <section>
          <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-bitcoin-orange" />
              <h2 className="text-2xl font-bold text-bitcoin-white">
                Generate Trade Signal
              </h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <p className="text-bitcoin-white-80 mb-4">
                  Generate a quantum-powered Bitcoin trade signal using GPT-5.1 with high reasoning effort. 
                  The system analyzes market data from 7 approved APIs and applies zero-hallucination protocols 
                  to ensure 100% data accuracy.
                </p>
                
                <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-bold text-bitcoin-white mb-2">
                    System Requirements:
                  </h3>
                  <ul className="text-sm text-bitcoin-white-80 space-y-1">
                    <li>• Data quality score ≥ 70%</li>
                    <li>• All 7 APIs operational</li>
                    <li>• Zero hallucination enforcement</li>
                    <li>• Multi-API triangulation verified</li>
                  </ul>
                </div>

                <TradeGenerationButton 
                  onTradeGenerated={handleTradeGenerated}
                  className="w-full"
                />
              </div>

              <div className="lg:col-span-1">
                {latestTrade && (
                  <div className="bg-bitcoin-orange text-bitcoin-black rounded-xl p-4">
                    <h3 className="font-bold mb-2">Latest Trade Generated</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="opacity-80">Symbol</p>
                        <p className="font-mono font-bold">{latestTrade.symbol}</p>
                      </div>
                      <div>
                        <p className="opacity-80">Confidence</p>
                        <p className="font-mono font-bold">{latestTrade.confidence}%</p>
                      </div>
                      <div>
                        <p className="opacity-80">Timeframe</p>
                        <p className="font-mono font-bold">{latestTrade.timeframe}</p>
                      </div>
                      <button
                        onClick={() => handleTradeClick(latestTrade.id)}
                        className="w-full mt-3 bg-bitcoin-black text-bitcoin-orange border-2 border-bitcoin-black font-bold uppercase text-xs py-2 rounded hover:bg-transparent hover:text-bitcoin-black hover:border-bitcoin-black transition-all"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Data Quality Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-bitcoin-orange" />
            <h2 className="text-2xl font-bold text-bitcoin-white">
              System Health & Data Quality
            </h2>
          </div>
          
          <DataQualityIndicators
            dataQualityScore={mockDataQuality.dataQualityScore}
            apiReliability={mockDataQuality.apiReliability}
            anomalyCount={mockDataQuality.anomalyCount}
          />
        </section>

        {/* Performance Dashboard Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-bitcoin-orange" />
            <h2 className="text-2xl font-bold text-bitcoin-white">
              Performance Analytics
            </h2>
          </div>
          
          <PerformanceDashboard />
        </section>

        {/* System Info Footer */}
        <section className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-bitcoin-white-60 uppercase mb-1">System Status</p>
              <p className="font-mono text-sm text-bitcoin-orange font-bold">OPERATIONAL</p>
            </div>
            <div>
              <p className="text-xs text-bitcoin-white-60 uppercase mb-1">Capability Level</p>
              <p className="font-mono text-sm text-bitcoin-white">Einstein × 10¹⁵</p>
            </div>
            <div>
              <p className="text-xs text-bitcoin-white-60 uppercase mb-1">Version</p>
              <p className="font-mono text-sm text-bitcoin-white">1.0.0</p>
            </div>
          </div>
        </section>
      </div>

      {/* Trade Detail Modal */}
      {selectedTradeId && (
        <TradeDetailModal
          tradeId={selectedTradeId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTradeId(null);
          }}
        />
      )}
    </div>
  );
}
