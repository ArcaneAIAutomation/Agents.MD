import React from 'react';
import TradingChart from './TradingChart';
import { useETHData } from '../hooks/useMarketData';

export default function ETHTradingChart() {
  const { ethData, loading, error } = useETHData();

  if (loading || !ethData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading Ethereum chart data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64 text-red-600">
          <span>Error loading Ethereum data: {error}</span>
        </div>
      </div>
    );
  }

  const currentPrice = ethData.currentPrice || 3850;
  
  // Transform supply/demand zones to trading zones format
  const tradingZones = ethData.technicalIndicators?.supplyDemandZones ? {
    buyZones: ethData.technicalIndicators.supplyDemandZones.demandZones.map((zone: any) => ({
      ...zone,
      type: 'buy' as const
    })),
    sellZones: ethData.technicalIndicators.supplyDemandZones.supplyZones.map((zone: any) => ({
      ...zone,
      type: 'sell' as const
    }))
  } : {
    buyZones: [
      { level: currentPrice - 300, strength: 'Strong' as const, type: 'buy' as const, volume: 2850000 },
      { level: currentPrice - 150, strength: 'Moderate' as const, type: 'buy' as const, volume: 1820000 }
    ],
    sellZones: [
      { level: currentPrice + 180, strength: 'Moderate' as const, type: 'sell' as const, volume: 1950000 },
      { level: currentPrice + 350, strength: 'Strong' as const, type: 'sell' as const, volume: 3120000 }
    ]
  };

  return (
    <TradingChart
      symbol="ETH"
      currentPrice={currentPrice}
      supportResistance={ethData.technicalIndicators?.supportResistance}
      tradingZones={tradingZones}
    />
  );
}
