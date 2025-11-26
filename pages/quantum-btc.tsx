import Head from 'next/head';
import Navigation from '../components/Navigation';
import QuantumBTCDashboard from '../components/QuantumBTC/QuantumBTCDashboard';
import AccessGate from '../components/AccessGate';

/**
 * Quantum BTC Super Spec Page
 * 
 * Revolutionary Bitcoin-only intelligence engine combining:
 * - Quantum-pattern reasoning
 * - Multi-dimensional predictive modeling
 * - Hourly market validation
 * - GPT-5.1 with high reasoning effort
 * - Zero-hallucination protocols
 * 
 * Capability Level: Einstein × 10^15
 */

export default function QuantumBTCPage() {
  return (
    <AccessGate>
      <div className="min-h-screen bg-bitcoin-black">
        <Head>
          <title>Quantum BTC Super Spec | Bitcoin Sovereign Technology</title>
          <meta 
            name="description" 
            content="Revolutionary Bitcoin-only intelligence engine with quantum-pattern reasoning, GPT-5.1 integration, and hourly validation. Einstein × 10^15 capability level." 
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <Navigation />
        
        <main>
          <QuantumBTCDashboard />
        </main>

        {/* Footer */}
        <footer className="bg-bitcoin-black border-t-2 border-bitcoin-orange-20 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-bitcoin-white-60 text-sm">
              Quantum BTC Super Spec v1.0.0 | Bitcoin Sovereign Technology
            </p>
            <p className="text-bitcoin-white-60 text-xs mt-2">
              Powered by GPT-5.1, Multi-API Triangulation, and Zero-Hallucination Protocols
            </p>
          </div>
        </footer>
      </div>
    </AccessGate>
  );
}
