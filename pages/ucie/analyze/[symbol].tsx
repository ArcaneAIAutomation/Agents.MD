import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import UCIEAnalysisHub from '../../../components/UCIE/UCIEAnalysisHub';

export default function AnalyzePage() {
  const router = useRouter();
  const { symbol } = router.query;

  const handleBack = () => {
    router.push('/ucie');
  };

  if (!symbol || typeof symbol !== 'string') {
    return (
      <Layout>
        <Head>
          <title>UCIE Analysis | Bitcoin Sovereign Technology</title>
        </Head>
        <div className="min-h-screen bg-bitcoin-black py-8 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-bitcoin-white mb-4">
              Invalid Token Symbol
            </h1>
            <button
              onClick={handleBack}
              className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange min-h-[48px]"
            >
              Go Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{symbol.toUpperCase()} Analysis | UCIE | Bitcoin Sovereign Technology</title>
        <meta 
          name="description" 
          content={`Comprehensive analysis of ${symbol.toUpperCase()} with AI-powered research, real-time data, and multi-dimensional intelligence.`} 
        />
      </Head>
      <UCIEAnalysisHub symbol={symbol.toUpperCase()} onBack={handleBack} />
    </Layout>
  );
}
