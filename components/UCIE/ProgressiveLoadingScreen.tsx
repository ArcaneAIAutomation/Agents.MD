/**
 * Progressive Loading Screen Component
 * 
 * Displays real-time progress updates during UCIE analysis by polling
 * the Supabase database for cached data entries.
 * 
 * Features:
 * - Real-time database polling (every 2 seconds)
 * - Visual progress bar (0-100%)
 * - Data source checklist (✅/⏳)
 * - AI analysis status with countdown
 * - Caesar button when ready
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Activity, 
  BarChart3, 
  Newspaper, 
  Link as LinkIcon,
  Brain,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';

interface ProgressiveLoadingScreenProps {
  symbol: string;
  onComplete: (data: any) => void;
  onError?: (error: string) => void;
}

interface DataSourceStatus {
  name: string;
  type: string;
  available: boolean;
  cached: boolean;
  quality: number | null;
  timestamp: string | null;
}

interface AnalysisStatus {
  status: 'initializing' | 'collecting' | 'analyzing' | 'complete' | 'error';
  progress: {
    dataCollection: {
      completed: number;
      total: number;
      percentage: number;
    };
    aiAnalysis: {
      started: boolean;
      complete: boolean;
      estimatedTimeRemaining: number | null;
    };
  };
  dataSources: DataSourceStatus[];
  geminiAnalysis: {
    available: boolean;
    wordCount: number | null;
    quality: number | null;
    timestamp: string | null;
  };
  caesarReady: boolean;
  message: string;
  estimatedTotalTime: number;
}

export default function ProgressiveLoadingScreen({ 
  symbol, 
  onComplete,
  onError 
}: ProgressiveLoadingScreenProps) {
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Trigger data collection and poll status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let timeInterval: NodeJS.Timeout;
    let dataCollectionTriggered = false;

    const triggerDataCollection = async () => {
      if (dataCollectionTriggered) return;
      dataCollectionTriggered = true;

      try {
        console.log(`🚀 Triggering data collection for ${symbol}...`);
        
        // ✅ CRITICAL: Trigger data collection by calling preview-data endpoint
        // This starts the background process that fetches and caches all data
        const triggerResponse = await fetch(`/api/ucie/preview-data/${symbol}?refresh=true`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!triggerResponse.ok) {
          console.warn(`⚠️ Data collection trigger returned ${triggerResponse.status}, but continuing to poll...`);
        } else {
          console.log(`✅ Data collection triggered successfully`);
        }
      } catch (err) {
        console.error('❌ Failed to trigger data collection:', err);
        // Don't throw - we'll still try to poll status
      }
    };

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/ucie/preview-data/${symbol}/status`);
        
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }
        
        const data: AnalysisStatus = await response.json();
        setStatus(data);
        
        // If complete, fetch full analysis and call onComplete
        if (data.status === 'complete') {
          clearInterval(pollInterval);
          clearInterval(timeInterval);
          
          try {
            console.log(`✅ Analysis complete! Fetching full data...`);
            const analysisResponse = await fetch(`/api/ucie/preview-data/${symbol}`);
            if (!analysisResponse.ok) {
              throw new Error(`Analysis fetch failed: ${analysisResponse.status}`);
            }
            const analysisData = await analysisResponse.json();
            console.log(`✅ Full analysis data retrieved`);
            onComplete(analysisData);
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch analysis';
            setError(errorMsg);
            onError?.(errorMsg);
          }
        }
      } catch (err) {
        console.error('Status poll error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to check status';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    };

    // ✅ STEP 1: Trigger data collection FIRST
    triggerDataCollection();

    // ✅ STEP 2: Start polling status after 3 seconds (give data collection time to start)
    const startPollingTimeout = setTimeout(() => {
      console.log(`📊 Starting status polling...`);
      pollStatus(); // Poll immediately
      pollInterval = setInterval(pollStatus, 2000); // Then poll every 2 seconds
    }, 3000);

    // Track elapsed time
    timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(startPollingTimeout);
      clearInterval(pollInterval);
      clearInterval(timeInterval);
    };
  }, [symbol, onComplete, onError]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get icon for data source
  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'market-data':
        return <TrendingUp className="w-5 h-5" />;
      case 'sentiment':
        return <Activity className="w-5 h-5" />;
      case 'technical':
        return <BarChart3 className="w-5 h-5" />;
      case 'news':
        return <Newspaper className="w-5 h-5" />;
      case 'on-chain':
        return <LinkIcon className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-bitcoin-black py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
                Analysis Error
              </h2>
              <p className="text-bitcoin-white-80 mb-6">
                {error}
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange min-h-[48px]"
              >
                Retry Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!status) {
    return (
      <div className="min-h-screen bg-bitcoin-black py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-bitcoin-orange animate-spin mx-auto mb-4" />
              <p className="text-bitcoin-white text-lg">Initializing analysis...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bitcoin-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-bitcoin-white mb-2">
            {symbol} Analysis
          </h1>
          <p className="text-bitcoin-orange font-mono text-xl">
            Universal Crypto Intelligence Engine
          </p>
        </div>

        {/* Main Progress Card */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 mb-6">
          {/* Status Message */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
              {status.message}
            </h2>
            <div className="flex items-center justify-center gap-4 text-bitcoin-white-60">
              <span className="text-sm">
                Elapsed: {formatTime(elapsedTime)}
              </span>
              <span className="text-sm">•</span>
              <span className="text-sm">
                Est. Total: ~5 minutes
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-bitcoin-white-60 mb-2">
              <span className="font-semibold">Data Collection Progress</span>
              <span className="font-mono">{status.progress.dataCollection.percentage}%</span>
            </div>
            <div className="w-full h-4 bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-bitcoin-orange transition-all duration-500 ease-out"
                style={{ width: `${status.progress.dataCollection.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-bitcoin-white-60 mt-1">
              <span>{status.progress.dataCollection.completed} of {status.progress.dataCollection.total} sources</span>
              {status.progress.aiAnalysis.estimatedTimeRemaining && (
                <span>~{Math.ceil(status.progress.aiAnalysis.estimatedTimeRemaining / 60)} min remaining</span>
              )}
            </div>
          </div>

          {/* Data Sources Checklist */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-bitcoin-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-bitcoin-orange" />
              Data Sources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {status.dataSources.map((source) => (
                <div 
                  key={source.type}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    source.available 
                      ? 'border-bitcoin-orange bg-bitcoin-orange bg-opacity-5' 
                      : 'border-bitcoin-orange-20'
                  }`}
                >
                  <div className={`flex-shrink-0 ${source.available ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                    {source.available ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Clock className="w-6 h-6 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={source.available ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}>
                        {getSourceIcon(source.type)}
                      </div>
                      <span className={`text-sm font-semibold ${source.available ? 'text-bitcoin-white' : 'text-bitcoin-white-60'}`}>
                        {source.name}
                      </span>
                    </div>
                  </div>
                  {source.quality !== null && (
                    <div className="flex-shrink-0">
                      <span className="text-xs font-mono text-bitcoin-orange">
                        {source.quality}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis Status */}
          {status.progress.aiAnalysis.started && (
            <div className="border-t-2 border-bitcoin-orange-20 pt-8">
              <h3 className="text-sm font-bold text-bitcoin-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-bitcoin-orange" />
                AI Analysis
              </h3>
              {status.progress.aiAnalysis.complete ? (
                <div className="flex items-center gap-3 p-4 rounded-lg border-2 border-bitcoin-orange bg-bitcoin-orange bg-opacity-5">
                  <CheckCircle className="w-8 h-8 text-bitcoin-orange flex-shrink-0" />
                  <div>
                    <p className="text-lg font-bold text-bitcoin-white">
                      Analysis Complete!
                    </p>
                    {status.geminiAnalysis.wordCount && (
                      <p className="text-sm text-bitcoin-white-60">
                        Generated {status.geminiAnalysis.wordCount.toLocaleString()} words of comprehensive analysis
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg border-2 border-bitcoin-orange-20">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="w-6 h-6 text-bitcoin-orange animate-spin flex-shrink-0" />
                    <p className="text-lg font-semibold text-bitcoin-white">
                      Generating comprehensive AI analysis...
                    </p>
                  </div>
                  {status.progress.aiAnalysis.estimatedTimeRemaining && (
                    <p className="text-sm text-bitcoin-white-60 ml-9">
                      Estimated time remaining: {Math.ceil(status.progress.aiAnalysis.estimatedTimeRemaining / 60)} minutes
                    </p>
                  )}
                  <div className="mt-4 ml-9">
                    <div className="flex items-start gap-2 text-xs text-bitcoin-white-60">
                      <span>•</span>
                      <span>Analyzing market conditions and trends</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-bitcoin-white-60 mt-1">
                      <span>•</span>
                      <span>Processing social sentiment and community insights</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-bitcoin-white-60 mt-1">
                      <span>•</span>
                      <span>Evaluating technical indicators and patterns</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-bitcoin-white-60 mt-1">
                      <span>•</span>
                      <span>Generating actionable trading insights</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Caesar Ready Indicator */}
          {status.caesarReady && (
            <div className="mt-8 p-6 rounded-lg border-2 border-bitcoin-orange bg-bitcoin-orange bg-opacity-10">
              <div className="text-center">
                <div className="text-4xl mb-3">🏛️</div>
                <h3 className="text-xl font-bold text-bitcoin-white mb-2">
                  Ready for Caesar AI Deep Research
                </h3>
                <p className="text-sm text-bitcoin-white-80">
                  All data collected and analyzed. You can now proceed to Caesar AI for comprehensive research and source verification.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6 text-center">
          <p className="text-sm text-bitcoin-white-60">
            <strong className="text-bitcoin-white">What's happening:</strong> UCIE is collecting data from 9 underlying APIs across 5 core sources, 
            then generating a comprehensive AI analysis using Gemini 2.5 Pro. This process typically takes 4-5 minutes to ensure 
            maximum data quality and analysis depth.
          </p>
        </div>
      </div>
    </div>
  );
}
