import Head from 'next/head';
import Navigation from '../components/Navigation';
import NexoRegulatoryPanel from '../components/NexoRegulatoryPanel';

export default function RegulatoryWatchPage() {
  return (
    <>
      <Head>
        <title>Regulatory Watch - Bitcoin Sovereign Technology</title>
        <meta name="description" content="Monitor cryptocurrency regulatory developments and compliance updates" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <div className="min-h-screen bg-bitcoin-black">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="bitcoin-block mb-8">
            <div className="border-b-2 border-bitcoin-orange px-6 py-4 bg-bitcoin-black">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-bitcoin-white">
                    ⚖️ Regulatory Watch
                  </h1>
                  <p className="text-sm text-bitcoin-white-60 italic mt-2">
                    Latest regulatory developments and compliance monitoring
                  </p>
                </div>
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 text-sm font-bold tracking-wide rounded">
                  NEXO.COM
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">UK</div>
                  <div className="text-sm text-bitcoin-white-60">Focus Region</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">Live</div>
                  <div className="text-sm text-bitcoin-white-60">Updates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bitcoin-orange font-mono">NEXO</div>
                  <div className="text-sm text-bitcoin-white-60">Platform</div>
                </div>
              </div>
            </div>
          </div>

          {/* Regulatory Panel Component */}
          <div className="bitcoin-block">
            <div className="p-6">
              <NexoRegulatoryPanel />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
