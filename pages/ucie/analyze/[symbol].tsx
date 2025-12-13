import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import UCIEAnalysisHub from '../../../components/UCIE/UCIEAnalysisHub';
import ProgressiveLoadingScreen from '../../../components/UCIE/ProgressiveLoadingScreen';

export default function AnalyzePage() {
  const router = useRouter();
  const { symbol } = router.query;
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    router.push('/ucie');
  };

  const handleAnalysisComplete = (data: any) => {
    console.log('✅ Analysis complete:', data);
    
    // ✅ CRITICAL FIX: Transform data structure for UCIEAnalysisHub
    // The preview-data API returns: { success: true, data: { collectedData: {...}, summary, dataQuality, ... } }
    // UCIEAnalysisHub expects: { marketData, sentiment, technical, news, onChain, summary, dataQuality, ... }
    let transformedData = data;
    
    if (data?.success && data?.data) {
      // Extract from nested structure
      const apiData = data.data;
      transformedData = {
        // Flatten collectedData to top level
        marketData: apiData.collectedData?.marketData,
        sentiment: apiData.collectedData?.sentiment,
        technical: apiData.collectedData?.technical,
        news: apiData.collectedData?.news,
        onChain: apiData.collectedData?.onChain,
        // Also support hyphenated keys for compatibility
        'market-data': apiData.collectedData?.marketData,
        'on-chain': apiData.collectedData?.onChain,
        // Include other important fields
        summary: apiData.summary,
        aiAnalysis: apiData.aiAnalysis,
        dataQuality: apiData.dataQuality,
        apiStatus: apiData.apiStatus,
        caesarPromptPreview: apiData.caesarPromptPreview,
        gptJobId: apiData.gptJobId,
        timing: apiData.timing,
        databaseStatus: apiData.databaseStatus,
        // Keep original data for reference
        _originalData: apiData
      };
      console.log('📦 Transformed data structure:', {
        hasMarketData: !!transformedData.marketData,
        hasSentiment: !!transformedData.sentiment,
        hasTechnical: !!transformedData.technical,
        hasNews: !!transformedData.news,
        hasOnChain: !!transformedData.onChain,
        hasSummary: !!transformedData.summary,
        dataQuality: transformedData.dataQuality
      });
    }
    
    setAnalysisData(transformedData);
    setIsLoading(false);
  };

  const handleAnalysisError = (errorMsg: string) => {
    console.error('❌ Analysis error:', errorMsg);
    setError(errorMsg);
    setIsLoading(false);
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
          content={`Comprehensive analysis of ${symbol.toUpperCase()} with ChatGPT 5.1 (Latest) powered research, real-time data, and multi-dimensional intelligence.`} 
        />
      </Head>
      
      {/* Show progressive loading screen while analysis is in progress */}
      {isLoading && !error && (
        <ProgressiveLoadingScreen 
          symbol={symbol.toUpperCase()}
          onComplete={handleAnalysisComplete}
          onError={handleAnalysisError}
        />
      )}

      {/* Show error state */}
      {error && !isLoading && (
        <div className="min-h-screen bg-bitcoin-black py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
                Analysis Failed
              </h2>
              <p className="text-bitcoin-white-80 mb-6">
                {error}
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange min-h-[48px]"
                >
                  Retry Analysis
                </button>
                <button 
                  onClick={handleBack}
                  className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black min-h-[48px]"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show analysis hub when data is ready */}
      {analysisData && !isLoading && !error && (
        <UCIEAnalysisHub 
          symbol={symbol.toUpperCase()} 
          onBack={handleBack}
          initialData={analysisData}
        />
      )}
    </Layout>
  );
}
