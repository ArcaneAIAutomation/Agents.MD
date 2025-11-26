import React, { useState, useEffect } from 'react';
import { PLIndicator, CompactPLIndicator, PLCalculation } from './PLIndicator';

/**
 * PLIndicator Component Examples
 * 
 * This file demonstrates various use cases for the PLIndicator component.
 */

export const PLIndicatorExamples: React.FC = () => {
  return (
    <div className="bg-bitcoin-black min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-bitcoin-white mb-2">
            PLIndicator Component Examples
          </h1>
          <p className="text-bitcoin-white-80">
            Profit/Loss display with Bitcoin Sovereign design
          </p>
        </div>

        {/* Example 1: Basic Profit */}
        <section className="bitcoin-block p-6">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            1. Basic Profit Display
          </h2>
          <div className="space-y-4">
            <PLIndicator
              pl={{
                profitLoss: 1500.00,
                profitLossPercent: 5.25,
                isProfit: true,
                color: 'green',
                icon: 'up'
              }}
            />
            <p className="text-bitcoin-white-60 text-sm">
              Standard profit display with orange color and upward arrow
            </p>
          </div>
        </section>

        {/* Example 2: Basic Loss */}
        <section className="bitcoin-block p-6">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            2. Basic Loss Display
          </h2>
          <div className="space-y-4">
            <PLIndicator
              pl={{
                profitLoss: -750.00,
                profitLossPercent: -2.50,
                isProfit: false,
                color: 'red',
                icon: 'down'
              }}
            />
            <p className="text-bitcoin-white-60 text-sm">
              Standard loss display with white color and downward arrow
            </p>
          </div>
        </section>

        {/* Example 3: Size Variants */}
        <section className="bitcoin-block p-6">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            3. Size Variants
          </h2>
          <div className="space-y-6">
            <div>
              <p className="text-bitcoin-white-80 mb-2 text-sm">Small</p>
              <PLIndicator
                pl={{
                  profitLoss: 2500.00,
                  profitLossPercent: 8.33,
                  isProfit: true,
                  color: 'green',
                  icon: 'up'
                }}
                size="sm"
              />
            </div>
            <div>
              <p className="text-bitcoin-white-80 mb-2 text-sm">Medium (Default)</p>
              <PLIndicator
                pl={{
                  profitLoss: 2500.00,
                  profitLossPercent: 8.33,
                  isProfit: true,
                  color: 'green',
                  icon: 'up'
                }}
                size="md"
              />
            </div>
            <div>
              <p className="text-bitcoin-white-80 mb-2 text-sm">Large</p>
              <PLIndicator
                pl={{
                  profitLoss: 2500.00,
                  profitLossPercent: 8.33,
                  isProfit: true,
                  color: 'green',
                  icon: 'up'
                }}
                size="lg"
              />
            </div>
          </div>
        </section>

        {/* Example 4: Large Numbers */}
        <section className="bitcoin-block p-6">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            4. Large Number Formatting
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-bitcoin-white-80 mb-2 text-sm">Thousands (K)</p>
              <PLIndicator
                pl={{
                  profitLoss: 15000.00,
                  profitLossPercent: 12.50,
                  isProfit: true,
                  color: 'green',
                  icon: 'up'
                }}
              />
            </div>
            <div>
              <p className="text-bitcoin-white-80 mb-2 text-sm">Millions (M)</p>
              <PLIndicator
                pl={{
                  profitLoss: 1500000.00,
                  profitLossPercent: 15.00,
                  isProfit: true,
                  color: 'green',
                  icon: 'up'
                }}
              />
            </div>
          </div>
        </section>

        {/* Example 5: Compact Mode */}
        <section className="bitcoin-block p-6">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            5. Compact Mode (for tables)
          </h2>
          <div className="space-y-4">
            <div className="border border-bitcoin-orange-20 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-bitcoin-orange-10">
                  <tr>
                    <th className="px-4 py-2 text-left text-bitcoin-white text-sm font-semibold">
                      Trade
                    </th>
                    <th className="px-4 py-2 text-left text-bitcoin-white text-sm font-semibold">
                      Entry
                    </th>
                    <th className="px-4 py-2 text-left text-bitcoin-white text-sm font-semibold">
                      Current
                    </th>
                    <th className="px-4 py-2 text-left text-bitcoin-white text-sm font-semibold">
                      P/L
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-bitcoin-orange-20">
                    <td className="px-4 py-3 text-bitcoin-white-80">BTC LONG</td>
                    <td className="px-4 py-3 text-bitcoin-white-80 font-mono">$50,000</td>
                    <td className="px-4 py-3 text-bitcoin-white-80 font-mono">$51,500</td>
                    <td className="px-4 py-3">
                      <CompactPLIndicator
                        pl={{
                          profitLoss: 1500.00,
                          profitLossPercent: 3.00,
                          isProfit: true,
                          color: 'green',
                          icon: 'up'
                        }}
                      />
                    </td>
                  </tr>
                  <tr className="border-t border-bitcoin-orange-20">
                    <td className="px-4 py-3 text-bitcoin-white-80">ETH SHORT</td>
                    <td className="px-4 py-3 text-bitcoin-white-80 font-mono">$3,000</td>
                    <td className="px-4 py-3 text-bitcoin-white-80 font-mono">$3,150</td>
                    <td className="px-4 py-3">
                      <CompactPLIndicator
                        pl={{
                          profitLoss: -150.00,
                          profitLossPercent: -5.00,
                          isProfit: false,
                          color: 'red',
                          icon: 'down'
                        }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Example 6: Without Icon */}
        <section className="bitcoin-block p-6">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            6. Without Icon
          </h2>
          <div className="space-y-4">
            <PLIndicator
              pl={{
                profitLoss: 3200.00,
                profitLossPercent: 6.40,
                isProfit: true,
                color: 'green',
                icon: 'up'
              }}
              showIcon={false}
            />
          </div>
        </section>

        {/* Example 7: Without Percentage */}
        <section className="bitcoin-block p-6">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            7. Without Percentage
          </h2>
          <div className="space-y-4">
            <PLIndicator
              pl={{
                profitLoss: 4500.00,
                profitLossPercent: 9.00,
                isProfit: true,
                color: 'green',
                icon: 'up'
              }}
              showPercentage={false}
            />
          </div>
        </section>

        {/* Example 8: Real-Time Updates */}
        <section className="bitcoin-block p-6">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            8. Real-Time Updates (Simulated)
          </h2>
          <RealTimePLExample />
        </section>

        {/* Example 9: Trade Card Integration */}
        <section className="bitcoin-block p-6">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            9. Trade Card Integration
          </h2>
          <TradeCardExample />
        </section>
      </div>
    </div>
  );
};

/**
 * Real-Time P/L Update Example
 * 
 * Simulates real-time P/L updates every 2 seconds
 */
const RealTimePLExample: React.FC = () => {
  const [pl, setPL] = useState<PLCalculation>({
    profitLoss: 1000.00,
    profitLossPercent: 2.00,
    isProfit: true,
    color: 'green',
    icon: 'up'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate price changes
      const change = (Math.random() - 0.5) * 500;
      const newProfitLoss = pl.profitLoss + change;
      const newPercent = (newProfitLoss / 50000) * 100;

      setPL({
        profitLoss: newProfitLoss,
        profitLossPercent: newPercent,
        isProfit: newProfitLoss > 0,
        color: newProfitLoss > 0 ? 'green' : 'red',
        icon: newProfitLoss > 0 ? 'up' : 'down'
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [pl.profitLoss]);

  return (
    <div className="space-y-4">
      <PLIndicator pl={pl} size="lg" />
      <p className="text-bitcoin-white-60 text-sm">
        P/L updates every 2 seconds (simulated)
      </p>
    </div>
  );
};

/**
 * Trade Card Example
 * 
 * Shows how to integrate PLIndicator into a trade card
 */
const TradeCardExample: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Profitable Trade */}
      <div className="border-2 border-bitcoin-orange rounded-xl p-4 bg-bitcoin-black">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-bitcoin-white font-bold text-lg">BTC LONG</h3>
            <p className="text-bitcoin-white-60 text-sm">Entry: $50,000</p>
          </div>
          <span className="px-2 py-1 bg-bitcoin-orange text-bitcoin-black text-xs font-bold rounded">
            EXECUTED
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-bitcoin-white-60 text-sm">Current Price</span>
            <span className="text-bitcoin-white font-mono font-semibold">$51,500</span>
          </div>

          <div className="border-t border-bitcoin-orange-20 pt-3">
            <PLIndicator
              pl={{
                profitLoss: 1500.00,
                profitLossPercent: 3.00,
                isProfit: true,
                color: 'green',
                icon: 'up'
              }}
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Losing Trade */}
      <div className="border-2 border-gray-700 rounded-xl p-4 bg-bitcoin-black">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-bitcoin-white font-bold text-lg">ETH SHORT</h3>
            <p className="text-bitcoin-white-60 text-sm">Entry: $3,000</p>
          </div>
          <span className="px-2 py-1 bg-bitcoin-orange text-bitcoin-black text-xs font-bold rounded">
            EXECUTED
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-bitcoin-white-60 text-sm">Current Price</span>
            <span className="text-bitcoin-white font-mono font-semibold">$3,150</span>
          </div>

          <div className="border-t border-gray-700 pt-3">
            <PLIndicator
              pl={{
                profitLoss: -150.00,
                profitLossPercent: -5.00,
                isProfit: false,
                color: 'red',
                icon: 'down'
              }}
              size="md"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PLIndicatorExamples;
