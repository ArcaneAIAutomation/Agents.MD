import Head from 'next/head';
import Navigation from '../components/Navigation';
import CryptoHerald from '../components/CryptoHerald';

export default function CryptoNewsPage() {
  return (
    <>
      <Head>
        <title>Crypto News Wire - Bitcoin Sovereign Technology</title>
        <meta name="description" content="Real-time cryptocurrency news with AI sentiment analysis" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <div className="min-h-screen bg-bitcoin-black">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="bitcoin-block mb-8">
            <div className="border-b-2 border-bitcoin-orange px-6 py-4 bg-bitcoin-black">
              <h1 className="text-3xl md:text-4xl font-bold text-bitcoin-white">
                📰 Crypto News Wire
              </h1>
              <p className="text-sm text-bitcoin-white-60 italic mt-2">
                Real-time cryptocurrency news aggregation with AI-powered sentiment analysis
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">15+</div>
                  <div className="text-sm text-bitcoin-white-60">Stories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">Live</div>
                  <div className="text-sm text-bitcoin-white-60">Updates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">AI</div>
                  <div className="text-sm text-bitcoin-white-60">Sentiment</div>
                </div>
              </div>
            </div>
          </div>

          {/* News Component */}
          <CryptoHerald />
        </div>
      </div>
    </>
  );
}
