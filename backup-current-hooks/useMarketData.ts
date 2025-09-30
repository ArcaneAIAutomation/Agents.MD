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
      // First try to get live price data for consistency
      let livePrice = null;
      try {
        const priceResponse = await fetch('/api/crypto-prices');
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          const btcPrice = priceData.prices?.find((p: any) => p.symbol === 'BTC');
          if (btcPrice) {
            livePrice = btcPrice.price;
          }
        }
      } catch (priceError) {
        console.log('Live price fetch failed, using API fallback');
      }

      const response = await fetch('/api/btc-analysis');
      if (!response.ok) {
        throw new Error('Failed to fetch BTC analysis');
      }
      const rawData = await response.json();
      
      // Transform API response to our format, prioritizing live price for consistency
      const transformedData: MarketData = {
        currentPrice: livePrice || rawData.currentPrice || rawData.priceAnalysis?.current || rawData.marketData?.price || 64800, // Updated realistic BTC price
        technicalIndicators: rawData.technicalIndicators
      };
      
      setBTCData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Provide fallback data with consistent pricing
      const fallbackData: MarketData = {
        currentPrice: 64800, // Updated realistic BTC fallback price
        technicalIndicators: {
          supportResistance: {
            strongSupport: 62500,
            support: 63500,
            resistance: 66500,
            strongResistance: 68000
          },
          supplyDemandZones: {
            demandZones: [
              { level: 63500, strength: 'Strong', volume: 28500000 },
              { level: 64000, strength: 'Moderate', volume: 18200000 },
              { level: 64300, strength: 'Weak', volume: 12100000 }
            ],
            supplyZones: [
              { level: 65200, strength: 'Weak', volume: 11800000 },
              { level: 66500, strength: 'Moderate', volume: 19500000 },
              { level: 67800, strength: 'Strong', volume: 31200000 }
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
      // First try to get live price data for consistency
      let livePrice = null;
      try {
        const priceResponse = await fetch('/api/crypto-prices');
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          const ethPrice = priceData.prices?.find((p: any) => p.symbol === 'ETH');
          if (ethPrice) {
            livePrice = ethPrice.price;
          }
        }
      } catch (priceError) {
        console.log('Live price fetch failed, using API fallback');
      }

      const response = await fetch('/api/eth-analysis');
      if (!response.ok) {
        throw new Error('Failed to fetch ETH analysis');
      }
      const rawData = await response.json();
      
      // Transform API response to our format, prioritizing live price for consistency
      const transformedData: MarketData = {
        currentPrice: livePrice || rawData.currentPrice || rawData.priceAnalysis?.current || rawData.marketData?.price || 2650, // Updated realistic ETH price
        technicalIndicators: rawData.technicalIndicators || {
          supportResistance: rawData.priceAnalysis ? {
            strongSupport: parseFloat(rawData.priceAnalysis.supportLevels?.support2?.replace('$', '') || '3450'),
            support: parseFloat(rawData.priceAnalysis.supportLevels?.support1?.replace('$', '') || '3650'),
            resistance: parseFloat(rawData.priceAnalysis.resistanceLevels?.resistance1?.replace('$', '') || '4050'),
            strongResistance: parseFloat(rawData.priceAnalysis.resistanceLevels?.resistance2?.replace('$', '') || '4250')
          } : undefined,
          supplyDemandZones: {
            demandZones: [
              { level: (rawData.currentPrice || 3380) - 300, strength: 'Strong', volume: 2850000 },
              { level: (rawData.currentPrice || 3380) - 150, strength: 'Moderate', volume: 1820000 }
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
        currentPrice: 2650, // Updated realistic ETH fallback price
        technicalIndicators: {
          supportResistance: {
            strongSupport: 2550,
            support: 2600,
            resistance: 2750,
            strongResistance: 2850
          },
          supplyDemandZones: {
            demandZones: [
              { level: 2600, strength: 'Strong', volume: 2850000 },
              { level: 2620, strength: 'Moderate', volume: 1820000 },
              { level: 2630, strength: 'Weak', volume: 1210000 }
            ],
            supplyZones: [
              { level: 2670, strength: 'Weak', volume: 1180000 },
              { level: 2720, strength: 'Moderate', volume: 1950000 },
              { level: 2800, strength: 'Strong', volume: 3120000 }
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
