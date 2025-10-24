import Head from 'next/head';
import Navigation from '../components/Navigation';
import BTCMarketAnalysis from '../components/BTCMarketAnalysis';

export default function BitcoinReportPage() {
  return (
    <>
      <Head>
        <title>Bitcoin Market Report - Bitcoin Sovereign Technology</title>
        <meta name="description" content="Comprehensive Bitcoin analysis with multi-timeframe technical indicators" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <div className="min-h-screen bg-bitcoin-black">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="bitcoin-block mb-8">
            <div className="border-b-2 border-bitcoin-orange px-6 py-4 bg-bitcoin-black">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-bitcoin-white">
                    ₿ Bitcoin Market Report
                  </h1>
                  <p className="text-sm text-bitcoin-white-60 italic mt-2">
                    Digital gold analysis with real-time market intelligence
                  </p>
                </div>
                <div className="bg-bitcoin-orange text-bitcoin-black px-3 py-1 text-xs font-bold tracking-wide rounded">
                  ENHANCED
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">4</div>
                  <div className="text-sm text-bitcoin-white-60">Timeframes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">10+</div>
                  <div className="text-sm text-bitcoin-white-60">Indicators</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">Live</div>
                  <div className="text-sm text-bitcoin-white-60">Data</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">S/D</div>
                  <div className="text-sm text-bitcoin-white-60">Zones</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bitcoin Analysis Component */}
          <div className="bitcoin-block">
            <div className="p-6">
              <BTCMarketAnalysis />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
