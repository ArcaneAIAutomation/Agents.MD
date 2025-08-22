import { useState, useEffect } from 'react';

interface MarketData {
  currentPrice?: number;
  technicalIndicators?: {
    supportResistance?: {
      strongSupport: number;
      support: number;
      resistance: number;
      strongResistance: number;
    };
    supplyDemandZones?: {
      demandZones: Array<{ level: number; strength: 'Strong' | 'Moderate' | 'Weak'; volume: number }>;
      supplyZones: Array<{ level: number; strength: 'Strong' | 'Moderate' | 'Weak'; volume: number }>;
    };
  };
}

export function useBTCData() {
  const [btcData, setBTCData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBTCData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/btc-analysis');
      if (!response.ok) {
        throw new Error('Failed to fetch BTC analysis');
      }
      const rawData = await response.json();
      
      // Transform API response to our format
      const transformedData: MarketData = {
        currentPrice: rawData.currentPrice || rawData.priceAnalysis?.current || rawData.marketData?.price || 110500,
        technicalIndicators: rawData.technicalIndicators
      };
      
      setBTCData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Provide fallback data
      const fallbackData: MarketData = {
        currentPrice: 110500,
        technicalIndicators: {
          supportResistance: {
            strongSupport: 105500,
            support: 107500,
            resistance: 112500,
            strongResistance: 115500
          },
          supplyDemandZones: {
            demandZones: [
              { level: 107500, strength: 'Strong', volume: 28500000 },
              { level: 109000, strength: 'Moderate', volume: 18200000 },
              { level: 109700, strength: 'Weak', volume: 12100000 }
            ],
            supplyZones: [
              { level: 111300, strength: 'Weak', volume: 11800000 },
              { level: 112500, strength: 'Moderate', volume: 19500000 },
              { level: 114700, strength: 'Strong', volume: 31200000 }
            ]
          }
        }
      };
      setBTCData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBTCData();
  }, []);

  return { btcData, loading, error, refetch: fetchBTCData };
}

export function useETHData() {
  const [ethData, setEthData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchETHData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/eth-analysis');
      if (!response.ok) {
        throw new Error('Failed to fetch ETH analysis');
      }
      const rawData = await response.json();
      
      // Transform API response to our format
      const transformedData: MarketData = {
        currentPrice: rawData.currentPrice || rawData.priceAnalysis?.current || rawData.marketData?.price || 3850,
        technicalIndicators: rawData.technicalIndicators || {
          supportResistance: rawData.priceAnalysis ? {
            strongSupport: parseFloat(rawData.priceAnalysis.supportLevels?.support2?.replace('$', '') || '3450'),
            support: parseFloat(rawData.priceAnalysis.supportLevels?.support1?.replace('$', '') || '3650'),
            resistance: parseFloat(rawData.priceAnalysis.resistanceLevels?.resistance1?.replace('$', '') || '4050'),
            strongResistance: parseFloat(rawData.priceAnalysis.resistanceLevels?.resistance2?.replace('$', '') || '4250')
          } : undefined,
          supplyDemandZones: {
            demandZones: [
              { level: (rawData.currentPrice || 3850) - 300, strength: 'Strong', volume: 2850000 },
              { level: (rawData.currentPrice || 3850) - 150, strength: 'Moderate', volume: 1820000 }
            ],
            supplyZones: [
              { level: (rawData.currentPrice || 3850) + 180, strength: 'Moderate', volume: 1950000 },
              { level: (rawData.currentPrice || 3850) + 350, strength: 'Strong', volume: 3120000 }
            ]
          }
        }
      };
      
      setEthData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Provide fallback data
      const fallbackData: MarketData = {
        currentPrice: 3850,
        technicalIndicators: {
          supportResistance: {
            strongSupport: 3450,
            support: 3650,
            resistance: 4050,
            strongResistance: 4250
          },
          supplyDemandZones: {
            demandZones: [
              { level: 3550, strength: 'Strong', volume: 2850000 },
              { level: 3700, strength: 'Moderate', volume: 1820000 },
              { level: 3775, strength: 'Weak', volume: 1210000 }
            ],
            supplyZones: [
              { level: 3925, strength: 'Weak', volume: 1180000 },
              { level: 4030, strength: 'Moderate', volume: 1950000 },
              { level: 4200, strength: 'Strong', volume: 3120000 }
            ]
          }
        }
      };
      setEthData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchETHData();
  }, []);

  return { ethData, loading, error, refetch: fetchETHData };
}
