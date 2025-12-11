/**
 * OpenAI GPT-5.1 Analysis Component
 * 
 * Generates comprehensive analysis using GPT-5.1 after data collection
 * Displays results and prepares Caesar prompt
 */

import React, { useState, useEffect } from 'react';
import { Brain, RefreshCw, AlertTriangle } from 'lucide-react';

interface OpenAIAnalysisProps {
  symbol: string;
  collectedData: any;
  onAnalysisComplete?: (analysis: any) => void;
}

export function OpenAIAnalysis({ symbol, collectedData, onAnalysisComplete }: OpenAIAnalysisProps) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (collectedData) {
      startAnalysis();
    }
  }, [collectedData, symbol]);

  const startAnalysis = async () => {
    try {
      console.log(`🚀 Starting GPT-5.1 analysis for ${symbol}...`);
      setLoading(true);
      setError(null);
      setProgress(10);

      // Step 1: Start the analysis job
      console.log(`📤 Starting GPT-5.1 analysis job...`);
      const startResponse = await fetch(`/api/ucie/openai-summary-start/${encodeURIComponent(symbol)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          collectedData,
          symbol
        }),
      });

      setProgress(20);

      if (!startResponse.ok) {
        throw new Error(`Failed to start analysis: ${startResponse.statusText}`);
      }

      const startData = await startResponse.json();
      
      if (!startData.success || !startData.jobId) {
        throw new Error(startData.error || 'Failed to start analysis job');
      }

      const jobId = startData.jobId;
      console.log(`✅ Analysis job started: ${jobId}`);
      setProgress(30);

      // Step 2: Poll for completion
      console.log(`🔄 Polling for analysis completion...`);
      let attempts = 0;
      const maxAttempts = 60; // 60 attempts × 5 seconds = 5 minutes max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        attempts++;
        
        const pollProgress = 30 + (attempts / maxAttempts) * 60; // Progress from 30% to 90%
        setProgress(Math.round(pollProgress));
        
        console.log(`🔄 Polling attempt ${attempts}/${maxAttempts}...`);
        
        const pollResponse = await fetch(`/api/ucie/openai-summary-poll/${jobId}`, {
          credentials: 'include',
        });
        
        if (!pollResponse.ok) {
          console.warn(`⚠️ Poll request failed: ${pollResponse.statusText}`);
          continue;
        }
        
        const pollData = await pollResponse.json();
        console.log(`📊 Poll response:`, pollData);
        
        if (pollData.status === 'completed' && pollData.result) {
          console.log(`✅ GPT-5.1 analysis complete!`);
          setAnalysis(pollData.result);
          setProgress(100);
          setLoading(false);
          
          if (onAnalysisComplete) {
            onAnalysisComplete(pollData.result);
          }
          
          return;
        }
        
        if (pollData.status === 'failed') {
          throw new Error(pollData.error || 'Analysis failed');
        }
        
        // Status is still 'processing', continue polling
        console.log(`⏳ Status: ${pollData.status}, continuing to poll...`);
      }
      
      // If we get here, we timed out
      throw new Error('Analysis timed out after 5 minutes');

    } catch (err) {
      console.error(`❌ GPT-5.1 analysis failed:`, err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8">
        <div className="text-center">
          <Brain className="w-16 h-16 text-bitcoin-orange mx-auto mb-4 animate-pulse" />
          <h2 className="text-3xl font-bold text-bitcoin-white mb-2">
            GPT-5.1 Analysis
          </h2>
          <p className="text-bitcoin-white-80 mb-6">
            Analyzing {symbol} with advanced AI...
          </p>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-bitcoin-white-60 uppercase">
                Progress
              </span>
              <span className="text-2xl font-mono font-bold text-bitcoin-orange">
                {progress}%
              </span>
            </div>
            <div className="w-full h-4 bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-full overflow-hidden">
              <div
                className="h-full bg-bitcoin-orange transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="text-sm text-bitcoin-white-60">
            Generating consensus, executive summary, and insights...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-8">
        <div className="flex flex-col items-center text-center">
          <AlertTriangle className="w-16 h-16 text-bitcoin-orange mb-4" />
          <h3 className="text-2xl font-bold text-bitcoin-white mb-2">
            Analysis Failed
          </h3>
          <p className="text-bitcoin-white-80 mb-6 max-w-md">
            {error}
          </p>
          <button
            onClick={startAnalysis}
            className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange min-h-[48px]"
          >
            <RefreshCw className="w-5 h-5 inline mr-2" />
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* Consensus Recommendation */}
      {analysis.consensus && (
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-6">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            AI Consensus
          </h2>
          <div className="flex items-center gap-4 p-4 bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-bitcoin-orange font-mono">
                {analysis.consensus.overallScore}
              </div>
              <div className="text-xs text-bitcoin-white-60 uppercase">
                Score
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold text-bitcoin-white uppercase">
                {analysis.consensus.recommendation}
              </div>
              <div className="text-sm text-bitcoin-white-80">
                Confidence: {analysis.consensus.confidence}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {analysis.executiveSummary && (
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-6">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            Executive Summary
          </h2>
          <div className="space-y-4">
            {analysis.executiveSummary.oneLineSummary && (
              <p className="text-lg text-bitcoin-orange font-semibold">
                {analysis.executiveSummary.oneLineSummary}
              </p>
            )}

            {analysis.executiveSummary.topFindings && analysis.executiveSummary.topFindings.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-bitcoin-white mb-3">
                  Key Findings
                </h3>
                <ul className="space-y-2">
                  {analysis.executiveSummary.topFindings.map((finding: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-bitcoin-white-80">
                      <span className="text-bitcoin-orange mt-1">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.executiveSummary.opportunities && analysis.executiveSummary.opportunities.length > 0 && (
                <div className="p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                  <h4 className="text-sm font-bold text-bitcoin-orange mb-2 uppercase">
                    Opportunities
                  </h4>
                  <ul className="space-y-1 text-sm text-bitcoin-white-80">
                    {analysis.executiveSummary.opportunities.map((opp: string, index: number) => (
                      <li key={index}>• {opp}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysis.executiveSummary.risks && analysis.executiveSummary.risks.length > 0 && (
                <div className="p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                  <h4 className="text-sm font-bold text-bitcoin-orange mb-2 uppercase">
                    Risks
                  </h4>
                  <ul className="space-y-1 text-sm text-bitcoin-white-80">
                    {analysis.executiveSummary.risks.map((risk: string, index: number) => (
                      <li key={index}>• {risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Market Outlook */}
      {analysis.marketOutlook && (
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-bitcoin-white mb-3">
            Market Outlook (24-48h)
          </h3>
          <p className="text-bitcoin-white-80">
            {analysis.marketOutlook}
          </p>
        </div>
      )}
    </div>
  );
}
