import React from 'react';
import TradingChart from './TradingChart';
import { useBTCData } from '../hooks/useMarketData';

export default function BTCTradingChart() {
  const { btcData, loading, error } = useBTCData();

  if (loading || !btcData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Loading Bitcoin chart data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64 text-red-600">
          <span>Error loading Bitcoin data: {error}</span>
        </div>
      </div>
    );
  }

  const currentPrice = btcData.currentPrice || 110500;
  
  // Transform supply/demand zones to trading zones format
  const tradingZones = btcData.technicalIndicators?.supplyDemandZones ? {
    buyZones: btcData.technicalIndicators.supplyDemandZones.demandZones.map(zone => ({
      ...zone,
      type: 'buy' as const
    })),
    sellZones: btcData.technicalIndicators.supplyDemandZones.supplyZones.map(zone => ({
      ...zone,
      type: 'sell' as const
    }))
  } : {
    buyZones: [
      { level: currentPrice - 3000, strength: 'Strong' as const, type: 'buy' as const, volume: 28500000 },
      { level: currentPrice - 1500, strength: 'Moderate' as const, type: 'buy' as const, volume: 18200000 }
    ],
    sellZones: [
      { level: currentPrice + 2000, strength: 'Moderate' as const, type: 'sell' as const, volume: 19500000 },
      { level: currentPrice + 4200, strength: 'Strong' as const, type: 'sell' as const, volume: 31200000 }
    ]
  };

  return (
    <TradingChart
      symbol="BTC"
      currentPrice={currentPrice}
      supportResistance={btcData.technicalIndicators?.supportResistance}
      tradingZones={tradingZones}
    />
  );
}
