import React, { useState, useEffect } from 'react';
import DataChangeIndicator, { 
  DataChangeWrapper, 
  useDataChangeTracking 
} from './DataChangeIndicator';

/**
 * DataChangeIndicator Example Component
 * 
 * Demonstrates how to use the DataChangeIndicator component
 * to highlight changed data with orange glow and "Updated" badges.
 * 
 * Features demonstrated:
 * - Single value change detection
 * - Multiple value change tracking
 * - Custom hook for change tracking
 * - Auto-fade after 3 seconds
 */

export const DataChangeIndicatorExample: React.FC = () => {
  // Example 1: Single value tracking
  const [price, setPrice] = useState(95000);
  const [previousPrice, setPreviousPrice] = useState<number | undefined>(undefined);

  // Example 2: Multiple values tracking
  const [marketData, setMarketData] = useState({
    price: 95000,
    volume: 1250000000,
    marketCap: 1850000000000,
    change24h: 2.5
  });
  const [previousMarketData, setPreviousMarketData] = useState<typeof marketData | undefined>(undefined);

  // Example 3: Using custom hook
  const tradeSignal = {
    entry: 94500,
    stopLoss: 93000,
    tp1: 96000,
    tp2: 97500,
    tp3: 99000
  };
  const changeState = useDataChangeTracking(tradeSignal);

  // Simulate data updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Update single value
      setPreviousPrice(price);
      setPrice(prev => prev + Math.floor(Math.random() * 1000) - 500);

      // Update multiple values
      setPreviousMarketData(marketData);
      setMarketData(prev => ({
        price: prev.price + Math.floor(Math.random() * 1000) - 500,
        volume: prev.volume + Math.floor(Math.random() * 10000000) - 5000000,
        marketCap: prev.marketCap + Math.floor(Math.random() * 1000000000) - 500000000,
        change24h: prev.change24h + (Math.random() * 2 - 1)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [price, marketData]);

  return (
    <div className="bg-bitcoin-black min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-bitcoin-white mb-4">
            Data Change Indicator Examples
          </h1>
          <p className="text-bitcoin-white-80">
            Watch for orange glows and "Updated" badges when data changes
          </p>
          <p className="text-bitcoin-white-60 text-sm mt-2">
            Data updates every 5 seconds
          </p>
        </div>

        {/* Example 1: Single Value with Change Indicator */}
        <div className="bitcoin-block">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            Example 1: Single Value Change Detection
          </h2>
          <p className="text-bitcoin-white-80 mb-6">
            The price value will glow orange and show an "Updated" badge when it changes.
          </p>
          
          <DataChangeIndicator
            value={price}
            previousValue={previousPrice}
            showBadge={true}
            glowDuration={3000}
          >
            <div className="stat-card">
              <div className="stat-label">Bitcoin Price</div>
              <div className="stat-value-orange">
                ${price.toLocaleString()}
              </div>
            </div>
          </DataChangeIndicator>
        </div>

        {/* Example 2: Multiple Values with Wrapper */}
        <div className="bitcoin-block">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            Example 2: Multiple Values with Wrapper
          </h2>
          <p className="text-bitcoin-white-80 mb-6">
            Each stat card will independently show change indicators when its value updates.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DataChangeIndicator
              value={marketData.price}
              previousValue={previousMarketData?.price}
            >
              <div className="stat-card">
                <div className="stat-label">Price</div>
                <div className="stat-value">
                  ${marketData.price.toLocaleString()}
                </div>
              </div>
            </DataChangeIndicator>

            <DataChangeIndicator
              value={marketData.volume}
              previousValue={previousMarketData?.volume}
            >
              <div className="stat-card">
                <div className="stat-label">24h Volume</div>
                <div className="stat-value">
                  ${(marketData.volume / 1000000000).toFixed(2)}B
                </div>
              </div>
            </DataChangeIndicator>

            <DataChangeIndicator
              value={marketData.marketCap}
              previousValue={previousMarketData?.marketCap}
            >
              <div className="stat-card">
                <div className="stat-label">Market Cap</div>
                <div className="stat-value">
                  ${(marketData.marketCap / 1000000000000).toFixed(2)}T
                </div>
              </div>
            </DataChangeIndicator>

            <DataChangeIndicator
              value={marketData.change24h}
              previousValue={previousMarketData?.change24h}
            >
              <div className="stat-card">
                <div className="stat-label">24h Change</div>
                <div className={`stat-value ${marketData.change24h >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'}`}>
                  {marketData.change24h >= 0 ? '+' : ''}{marketData.change24h.toFixed(2)}%
                </div>
              </div>
            </DataChangeIndicator>
          </div>
        </div>

        {/* Example 3: Using Custom Hook */}
        <div className="bitcoin-block">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            Example 3: Using Custom Hook
          </h2>
          <p className="text-bitcoin-white-80 mb-6">
            The useDataChangeTracking hook provides change detection state for complex objects.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-bitcoin-white-60 font-semibold">
                Changed Keys:
              </span>
              <div className="flex gap-2">
                {changeState.changedKeys.size > 0 ? (
                  Array.from(changeState.changedKeys).map(key => (
                    <span
                      key={key}
                      className="px-3 py-1 bg-bitcoin-orange text-bitcoin-black rounded-md text-sm font-bold"
                    >
                      {key}
                    </span>
                  ))
                ) : (
                  <span className="text-bitcoin-white-60 italic">
                    No changes detected
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(changeState.currentData).map(([key, value]) => (
                <div
                  key={key}
                  className={`
                    stat-card transition-all duration-300
                    ${changeState.changedKeys.has(key) ? 'border-bitcoin-orange shadow-[0_0_20px_rgba(247,147,26,0.5)]' : ''}
                  `}
                >
                  <div className="stat-label">{key}</div>
                  <div className="stat-value font-mono">
                    ${typeof value === 'number' ? value.toLocaleString() : value}
                  </div>
                  {changeState.changedKeys.has(key) && (
                    <div className="mt-2 text-xs text-bitcoin-orange font-bold uppercase">
                      ✓ Updated
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Example 4: Without Badge */}
        <div className="bitcoin-block">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            Example 4: Glow Only (No Badge)
          </h2>
          <p className="text-bitcoin-white-80 mb-6">
            You can disable the "Updated" badge and show only the orange glow effect.
          </p>
          
          <DataChangeIndicator
            value={price}
            previousValue={previousPrice}
            showBadge={false}
            glowDuration={3000}
          >
            <div className="stat-card">
              <div className="stat-label">Bitcoin Price (Glow Only)</div>
              <div className="stat-value-orange">
                ${price.toLocaleString()}
              </div>
            </div>
          </DataChangeIndicator>
        </div>

        {/* Example 5: Custom Glow Duration */}
        <div className="bitcoin-block">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            Example 5: Custom Glow Duration
          </h2>
          <p className="text-bitcoin-white-80 mb-6">
            You can customize how long the glow effect lasts (default is 3 seconds).
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DataChangeIndicator
              value={price}
              previousValue={previousPrice}
              glowDuration={1000}
            >
              <div className="stat-card">
                <div className="stat-label">1 Second Glow</div>
                <div className="stat-value">
                  ${price.toLocaleString()}
                </div>
              </div>
            </DataChangeIndicator>

            <DataChangeIndicator
              value={price}
              previousValue={previousPrice}
              glowDuration={3000}
            >
              <div className="stat-card">
                <div className="stat-label">3 Seconds Glow (Default)</div>
                <div className="stat-value">
                  ${price.toLocaleString()}
                </div>
              </div>
            </DataChangeIndicator>

            <DataChangeIndicator
              value={price}
              previousValue={previousPrice}
              glowDuration={5000}
            >
              <div className="stat-card">
                <div className="stat-label">5 Seconds Glow</div>
                <div className="stat-value">
                  ${price.toLocaleString()}
                </div>
              </div>
            </DataChangeIndicator>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bitcoin-block-subtle">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            Usage Instructions
          </h2>
          <div className="space-y-4 text-bitcoin-white-80">
            <div>
              <h3 className="text-lg font-bold text-bitcoin-white mb-2">
                Basic Usage:
              </h3>
              <pre className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 overflow-x-auto">
                <code className="text-bitcoin-orange text-sm">{`<DataChangeIndicator
  value={currentValue}
  previousValue={previousValue}
  showBadge={true}
  glowDuration={3000}
>
  <YourComponent />
</DataChangeIndicator>`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-bold text-bitcoin-white mb-2">
                With Custom Hook:
              </h3>
              <pre className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 overflow-x-auto">
                <code className="text-bitcoin-orange text-sm">{`const changeState = useDataChangeTracking(data);

// Access changed keys
changeState.changedKeys.has('price') // true if price changed

// Check if any value changed
changeState.isAnyChanged // true if any key changed`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataChangeIndicatorExample;
