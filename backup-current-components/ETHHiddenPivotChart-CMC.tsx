import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Eye } from 'lucide-react';

interface HiddenPivotData {
  success: boolean;
  data: Array<{
    timestamp: number;
    price: number;
    volume: number;
    high: number;
    low: number;
    open: number;
    close: number;
  }>;
  analysis: {
    hiddenPivots: {
      highs: Array<{ price: number; timestamp: number }>;
      lows: Array<{ price: number; timestamp: number }>;
    };
    supportLevels: number[];
    resistanceLevels: number[];
    fibonacciLevels: {
      retracement: number[];
      extension: number[];
    };
  };
  source: string;
  cached?: boolean;
}

export default function ETHHiddenPivotChart() {
  const [pivotData, setPivotData] = useState<HiddenPivotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('1D');
  const [selectedPivot, setSelectedPivot] = useState<{ price: number; timestamp: number; type: 'high' | 'low' } | null>(null);

  // Fetch hidden pivot analysis from CoinMarketCap
  const fetchPivotData = async (tf: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Fetching ETH hidden pivot analysis from CoinMarketCap (${tf})`);
      
      const response = await fetch(`/api/cmc-trading-analysis?symbol=ETH&timeframe=${tf}`);
      const result = await response.json();

      if (result.success || result.data.length > 0) {
        console.log(`✅ ETH hidden pivot analysis received:`, {
          pivotHighs: result.analysis.hiddenPivots.highs.length,
          pivotLows: result.analysis.hiddenPivots.lows.length,
          dataPoints: result.data.length,
          source: result.source
        });
        
        setPivotData(result);
      } else {
        throw new Error(result.error || 'Failed to fetch pivot data');
      }
    } catch (err) {
      console.error('❌ ETH hidden pivot analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPivotData(timeframe);
  }, [timeframe]);

  if (loading || !pivotData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Analyzing ETH hidden pivots via CoinMarketCap...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64 text-red-600">
          <span>Error loading ETH pivot data: {error}</span>
          <button 
            onClick={() => fetchPivotData(timeframe)}
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentPrice = pivotData.data.length > 0 ? 
    pivotData.data[pivotData.data.length - 1].close : 4000;

  const { hiddenPivots } = pivotData.analysis;
  const allPivots = [
    ...hiddenPivots.highs.map(p => ({ ...p, type: 'high' as const })),
    ...hiddenPivots.lows.map(p => ({ ...p, type: 'low' as const }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  // Calculate pivot strength based on volume and price deviation
  const calculatePivotStrength = (pivot: { price: number; timestamp: number; type: 'high' | 'low' }) => {
    const priceDeviation = Math.abs(pivot.price - currentPrice) / currentPrice;
    const timeDistance = (Date.now() - pivot.timestamp) / (24 * 60 * 60 * 1000); // days ago
    
    // Stronger pivots are recent and have significant price deviations
    const strength = (priceDeviation * 100) / Math.sqrt(timeDistance + 1);
    
    if (strength > 4) return 'Strong';
    if (strength > 1.5) return 'Moderate';
    return 'Weak';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Eye className="mr-2 text-blue-500" size={20} />
              ETH Hidden Pivot Analysis
            </h3>
            <p className="text-sm text-gray-600">
              📊 Data Source: <span className="font-semibold text-blue-600">{pivotData.source}</span>
              {pivotData.cached && <span className="ml-2 text-green-600">📦 Cached</span>}
            </p>
          </div>
          
          {/* Timeframe selector */}
          <div className="flex space-x-2">
            {['1H', '4H', '1D'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timeframe === tf
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        {/* Pivot summary */}
        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-red-600">{hiddenPivots.highs.length}</div>
            <div className="text-gray-600">Pivot Highs</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">{hiddenPivots.lows.length}</div>
            <div className="text-gray-600">Pivot Lows</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">{allPivots.length}</div>
            <div className="text-gray-600">Total Pivots</div>
          </div>
        </div>
      </div>

      {/* Pivot List */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-4 border-b">
          <h4 className="font-semibold text-gray-800">Recent Hidden Pivots</h4>
          <p className="text-sm text-gray-600">Click on a pivot to view details</p>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {allPivots.slice(0, 10).map((pivot, index) => {
            const strength = calculatePivotStrength(pivot);
            const isSelected = selectedPivot?.timestamp === pivot.timestamp;
            const priceChange = ((pivot.price - currentPrice) / currentPrice * 100);
            
            return (
              <div
                key={`${pivot.timestamp}-${pivot.type}`}
                onClick={() => setSelectedPivot(isSelected ? null : pivot)}
                className={`p-4 border-b cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    {pivot.type === 'high' ? (
                      <TrendingDown className="text-red-500" size={18} />
                    ) : (
                      <TrendingUp className="text-green-500" size={18} />
                    )}
                    
                    <div>
                      <div className="font-semibold text-gray-800">
                        ${pivot.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(pivot.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      strength === 'Strong' ? 'text-red-600' :
                      strength === 'Moderate' ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {strength}
                    </div>
                    <div className={`text-sm ${
                      priceChange > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="mt-3 pt-3 border-t bg-blue-50 rounded p-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <span className="ml-2">{pivot.type === 'high' ? 'Resistance Pivot' : 'Support Pivot'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Strength:</span>
                        <span className="ml-2">{strength}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Distance:</span>
                        <span className="ml-2">${Math.abs(pivot.price - currentPrice).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Age:</span>
                        <span className="ml-2">
                          {Math.floor((Date.now() - pivot.timestamp) / (24 * 60 * 60 * 1000))} days
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">Analysis:</span>
                      <p className="text-sm text-gray-600 mt-1">
                        {pivot.type === 'high' 
                          ? `This pivot high at $${pivot.price.toLocaleString()} represents a potential resistance level. 
                             Price rejected this level ${Math.floor((Date.now() - pivot.timestamp) / (24 * 60 * 60 * 1000))} days ago.`
                          : `This pivot low at $${pivot.price.toLocaleString()} represents a potential support level. 
                             Price found support at this level ${Math.floor((Date.now() - pivot.timestamp) / (24 * 60 * 60 * 1000))} days ago.`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fibonacci Extensions based on pivots */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
          <Target className="mr-2 text-blue-500" size={18} />
          Fibonacci Extensions from Hidden Pivots
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {pivotData.analysis.fibonacciLevels.extension.slice(0, 5).map((level, index) => {
            const extensionRatios = [1.272, 1.414, 1.618, 2.0, 2.618];
            return (
              <div key={index} className="text-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                <div className="font-semibold text-blue-700">${level.toLocaleString()}</div>
                <div className="text-xs text-blue-600">{extensionRatios[index]}x Extension</div>
                <div className={`text-xs mt-1 ${
                  level > currentPrice ? 'text-red-600' : 'text-green-600'
                }`}>
                  {((level - currentPrice) / currentPrice * 100).toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
        
        <p className="text-xs text-gray-600 mt-3">
          * Fibonacci extensions calculated from major hidden pivot highs and lows
        </p>
      </div>
    </div>
  );
}
