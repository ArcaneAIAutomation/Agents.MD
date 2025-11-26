import React from 'react';
import { DataQualityBadge } from './DataQualityBadge';

/**
 * DataQualityBadge Examples
 * 
 * Demonstrates various use cases and configurations of the DataQualityBadge component.
 */

export const DataQualityBadgeExamples: React.FC = () => {
  return (
    <div className="bg-bitcoin-black min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b-2 border-bitcoin-orange pb-4">
          <h1 className="text-3xl font-bold text-bitcoin-white mb-2">
            DataQualityBadge Examples
          </h1>
          <p className="text-bitcoin-white-80">
            Visual examples of data quality indicators with different quality levels
          </p>
        </div>

        {/* Excellent Quality (≥90%) */}
        <section className="bitcoin-block p-6">
          <h2 className="text-xl font-bold text-bitcoin-white mb-4">
            Excellent Quality (≥90%)
          </h2>
          <div className="space-y-4">
            {/* 100% Quality */}
            <div className="flex items-center justify-between p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
              <div>
                <p className="text-bitcoin-white font-semibold">Perfect Data Quality</p>
                <p className="text-bitcoin-white-60 text-sm">All 13+ APIs responding successfully</p>
              </div>
              <DataQualityBadge quality={100} />
            </div>

            {/* 95% Quality */}
            <div className="flex items-center justify-between p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
              <div>
                <p className="text-bitcoin-white font-semibold">Excellent Data Quality</p>
                <p className="text-bitcoin-white-60 text-sm">12/13 APIs responding</p>
              </div>
              <DataQualityBadge quality={95} />
            </div>

            {/* 90% Quality */}
            <div className="flex items-center justify-between p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
              <div>
                <p className="text-bitcoin-white font-semibold">High Data Quality</p>
                <p className="text-bitcoin-white-60 text-sm">11/13 APIs responding</p>
              </div>
              <DataQualityBadge quality={90} />
            </div>
          </div>
        </section>

        {/* Acceptable Quality (70-89%) */}
        <section className="bitcoin-block p-6">
          <h2 className="text-xl font-bold text-bitcoin-white mb-4">
            Acceptable Quality (70-89%)
          </h2>
          <div className="space-y-4">
            {/* 85% Quality */}
            <div className="flex items-center justify-between p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
              <div>
                <p className="text-bitcoin-white font-semibold">Good Data Quality</p>
                <p className="text-bitcoin-white-60 text-sm">10/13 APIs responding</p>
              </div>
              <DataQualityBadge quality={85} />
            </div>

            {/* 75% Quality */}
            <div className="flex items-center justify-between p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
              <div>
                <p className="text-bitcoin-white font-semibold">Acceptable Data Quality</p>
                <p className="text-bitcoin-white-60 text-sm">9/13 APIs responding</p>
              </div>
              <DataQualityBadge quality={75} />
            </div>

            {/* 70% Quality */}
            <div className="flex items-center justify-between p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
              <div>
                <p className="text-bitcoin-white font-semibold">Minimum Acceptable Quality</p>
                <p className="text-bitcoin-white-60 text-sm">8/13 APIs responding</p>
              </div>
              <DataQualityBadge quality={70} />
            </div>
          </div>
        </section>

        {/* Poor Quality (<70%) */}
        <section className="bitcoin-block p-6">
          <h2 className="text-xl font-bold text-bitcoin-white mb-4">
            Poor Quality (&lt;70%)
          </h2>
          <div className="space-y-4">
            {/* 65% Quality */}
            <div className="flex items-center justify-between p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
              <div>
                <p className="text-bitcoin-white font-semibold">Insufficient Data Quality</p>
                <p className="text-bitcoin-white-60 text-sm">7/13 APIs responding</p>
              </div>
              <DataQualityBadge quality={65} />
            </div>

            {/* 50% Quality */}
            <div className="flex items-center justify-between p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
              <div>
                <p className="text-bitcoin-white font-semibold">Poor Data Quality</p>
                <p className="text-bitcoin-white-60 text-sm">6/13 APIs responding</p>
              </div>
              <DataQualityBadge quality={50} />
            </div>

            {/* 30% Quality */}
            <div className="flex items-center justify-between p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
              <div>
                <p className="text-bitcoin-white font-semibold">Very Poor Data Quality</p>
                <p className="text-bitcoin-white-60 text-sm">3/13 APIs responding</p>
              </div>
              <DataQualityBadge quality={30} />
            </div>
          </div>
        </section>

        {/* Compact Mode (No Text) */}
        <section className="bitcoin-block p-6">
          <h2 className="text-xl font-bold text-bitcoin-white mb-4">
            Compact Mode (No Text)
          </h2>
          <div className="flex items-center gap-4 flex-wrap">
            <DataQualityBadge quality={100} showText={false} />
            <DataQualityBadge quality={95} showText={false} />
            <DataQualityBadge quality={85} showText={false} />
            <DataQualityBadge quality={75} showText={false} />
            <DataQualityBadge quality={65} showText={false} />
            <DataQualityBadge quality={50} showText={false} />
          </div>
        </section>

        {/* Real-World Usage Examples */}
        <section className="bitcoin-block p-6">
          <h2 className="text-xl font-bold text-bitcoin-white mb-4">
            Real-World Usage Examples
          </h2>

          {/* Trade Signal Card */}
          <div className="space-y-4">
            <div className="bitcoin-block-subtle p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-bitcoin-white font-bold">BTC/USD Trade Signal</h3>
                <DataQualityBadge quality={100} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-bitcoin-white-60">Entry Price</p>
                  <p className="text-bitcoin-orange font-mono font-bold">$95,000</p>
                </div>
                <div>
                  <p className="text-bitcoin-white-60">Position Type</p>
                  <p className="text-bitcoin-white font-bold">LONG</p>
                </div>
              </div>
            </div>

            {/* Data Source Health Panel */}
            <div className="bitcoin-block-subtle p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-bitcoin-white font-bold">Data Source Health</h3>
                <DataQualityBadge quality={92} showText={false} />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-bitcoin-white-60">CoinGecko</span>
                  <span className="text-bitcoin-orange">✓ 82ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-bitcoin-white-60">CoinMarketCap</span>
                  <span className="text-bitcoin-orange">✓ 320ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-bitcoin-white-60">Kraken</span>
                  <span className="text-bitcoin-orange">✓ 89ms</span>
                </div>
              </div>
            </div>

            {/* Analysis Modal Header */}
            <div className="border-2 border-bitcoin-orange rounded-xl overflow-hidden">
              <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-bitcoin-white">
                    Einstein Analysis
                  </h2>
                  <DataQualityBadge quality={100} />
                </div>
              </div>
              <div className="p-6 bg-bitcoin-black">
                <p className="text-bitcoin-white-80">
                  Comprehensive multi-dimensional analysis with verified data from all sources.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Color Reference */}
        <section className="bitcoin-block p-6">
          <h2 className="text-xl font-bold text-bitcoin-white mb-4">
            Color Reference (Bitcoin Sovereign)
          </h2>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-bitcoin-orange rounded border-2 border-bitcoin-orange"></div>
              <span className="text-bitcoin-white-80">Excellent (≥90%): Orange background, black text</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-bitcoin-black rounded border-2 border-bitcoin-orange"></div>
              <span className="text-bitcoin-white-80">Acceptable (70-89%): Black background, orange border/text</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-bitcoin-black rounded border-2 border-gray-500"></div>
              <span className="text-bitcoin-white-80">Poor (&lt;70%): Black background, gray border/text</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DataQualityBadgeExamples;
