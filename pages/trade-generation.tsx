import Head from 'next/head';
import Navigation from '../components/Navigation';
import TradeGenerationEngine from '../components/TradeGenerationEngine';

export default function TradeGenerationPage() {
  return (
    <>
      <Head>
        <title>AI Trade Generation Engine - Bitcoin Sovereign Technology</title>
        <meta name="description" content="ChatGPT 5.1 (Latest) powered trading signals with advanced reasoning and risk management" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <div className="min-h-screen bg-bitcoin-black">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="bitcoin-block mb-8">
            <div className="border-b-2 border-bitcoin-orange px-6 py-4 bg-bitcoin-black">
              <h1 className="text-3xl md:text-4xl font-bold text-bitcoin-white">
                🤖 AI Trade Generation Engine
              </h1>
              <p className="text-sm text-bitcoin-white-60 italic mt-2">
                Advanced algorithmic trading signals powered by ChatGPT 5.1 (Latest) with deep reasoning
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">ChatGPT 5.1</div>
                  <div className="text-sm text-bitcoin-white-60">AI Model</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">Live</div>
                  <div className="text-sm text-bitcoin-white-60">Signals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">Auto</div>
                  <div className="text-sm text-bitcoin-white-60">Risk Mgmt</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">BTC/ETH</div>
                  <div className="text-sm text-bitcoin-white-60">Supported</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trade Generation Component */}
          <div className="bitcoin-block">
            <div className="p-6">
              <TradeGenerationEngine />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
