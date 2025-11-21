import Head from 'next/head';
import Navigation from '../components/Navigation';
import WhaleWatchDashboard from '../components/WhaleWatch/WhaleWatchDashboard';

export default function WhaleWatchPage() {
  return (
    <>
      <Head>
        <title>Bitcoin Whale Watch - Bitcoin Sovereign Technology</title>
        <meta name="description" content="Real-time tracking of large Bitcoin transactions with ChatGPT 5.1 (Latest) deep dive analysis" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <div className="min-h-screen bg-bitcoin-black">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="bitcoin-block mb-8">
            <div className="border-b-2 border-bitcoin-orange px-6 py-4 bg-bitcoin-black">
              <h1 className="text-3xl md:text-4xl font-bold text-bitcoin-white">
                🐋 Bitcoin Whale Watch
              </h1>
              <p className="text-sm text-bitcoin-white-60 italic mt-2">
                Real-time tracking of large Bitcoin transactions and market movements
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">50+</div>
                  <div className="text-sm text-bitcoin-white-60">BTC Threshold</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">ChatGPT 5.1</div>
                  <div className="text-sm text-bitcoin-white-60">AI Analysis</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">Live</div>
                  <div className="text-sm text-bitcoin-white-60">Tracking</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">5-7min</div>
                  <div className="text-sm text-bitcoin-white-60">Analysis Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Whale Watch Component */}
          <div className="bitcoin-block">
            <div className="p-6">
              <WhaleWatchDashboard />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
