/**
 * Caesar Analysis Container
 * Handles Caesar AI research polling with progress updates
 * 
 * Features:
 * - Automatic polling every 60 seconds
 * - Progress bar with percentage
 * - Console logging for debugging
 * - Displays full analysis when complete
 * - Shows initial prompt data
 */

import React, { useState, useEffect, useRef } from 'react';
import { Brain, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import CaesarResearchPanel from './CaesarResearchPanel';
import { UCIECaesarResearch } from '../../lib/ucie/caesarClient';

interface CaesarAnalysisContainerProps {
  symbol: string;
  jobId?: string;
  progressiveLoadingComplete?: boolean;
  previewData?: any; // ✅ Preview data from DataPreviewModal
}

interface AnalysisStatus {
  status: 'queued' | 'pending' | 'researching' | 'completed' | 'failed' | 'cancelled' | 'expired';
  progress: number;
  estimatedTimeRemaining?: number;
}

// Maximum wait time: 15 minutes (900 seconds)
const MAX_WAIT_TIME = 900000; // 15 minutes in milliseconds
const POLL_INTERVAL = 60000; // 60 seconds in milliseconds

export default function CaesarAnalysisContainer({ symbol, jobId: initialJobId, progressiveLoadingComplete = true, previewData }: CaesarAnalysisContainerProps) {
  const [jobId, setJobId] = useState<string | null>(initialJobId || null);
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [research, setResearch] = useState<UCIECaesarResearch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [preparingData, setPreparingData] = useState(true);
  const [queryPrompt, setQueryPrompt] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [lastPollTime, setLastPollTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [userWantsAnalysis, setUserWantsAnalysis] = useState(false); // ✅ NEW: Track user opt-in

  // Calculate fallback progress based on elapsed time
  // Uses a logarithmic curve to show faster progress at start, slower near end
  const calculateFallbackProgress = (elapsedMs: number): number => {
    const elapsedMinutes = elapsedMs / 60000;
    const expectedDuration = 10; // Expected 10 minutes for analysis
    
    // Logarithmic progress curve
    // Fast progress initially, slows down as it approaches completion
    const rawProgress = (Math.log(elapsedMinutes + 1) / Math.log(expectedDuration + 1)) * 100;
    
    // Cap at 95% until actually completed (never show 100% prematurely)
    return Math.min(95, Math.max(0, rawProgress));
  };

  // ✅ MODIFIED: Only start analysis when user clicks button
  // Wait for progressive loading to complete + user opt-in
  useEffect(() => {
    if (!initialJobId && progressiveLoadingComplete && userWantsAnalysis) {
      console.log('⏳ [Caesar] User opted in. Waiting 3 seconds for database writes to finalize...');
      
      // Add 3-second delay to ensure database writes are complete
      const timer = setTimeout(() => {
        console.log('✅ [Caesar] Database should be ready. Starting analysis...');
        setPreparingData(false);
        startAnalysis();
      }, 3000); // 3 second buffer
      
      return () => clearTimeout(timer);
    } else if (!progressiveLoadingComplete) {
      console.log('⏳ [Caesar] Waiting for progressive loading to complete...');
    } else if (!userWantsAnalysis) {
      console.log('⏳ [Caesar] Waiting for user to click "Start Caesar Deep Dive" button...');
    }
  }, [initialJobId, progressiveLoadingComplete, userWantsAnalysis]);

  // Update elapsed time every second for live display
  useEffect(() => {
    if (!jobId || status?.status === 'completed' || status?.status === 'failed') {
      return;
    }

    const timer = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, [jobId, status?.status]);

  // Poll for status updates every 60 seconds
  useEffect(() => {
    if (!jobId || status?.status === 'completed' || status?.status === 'failed') {
      return;
    }

    // Initial poll
    pollStatus();

    // Set up 60-second polling
    pollingIntervalRef.current = setInterval(() => {
      pollStatus();
    }, POLL_INTERVAL); // 60 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [jobId, status?.status]);

  const startAnalysis = async () => {
    try {
      console.log(`🚀 [Caesar] Starting analysis for ${symbol}...`);
      setLoading(true);
      setError(null);
      startTimeRef.current = Date.now();

      const response = await fetch(`/api/ucie/research/${encodeURIComponent(symbol)}`, {
        credentials: 'include', // Required for authentication cookie
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectedData: previewData?.collectedData, // ✅ Pass preview data to Caesar
          gptAnalysis: previewData?.gptAnalysis, // ✅ Include GPT-5.1 analysis
          summary: previewData?.summary,
          dataQuality: previewData?.dataQuality,
          apiStatus: previewData?.apiStatus
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start analysis: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start Caesar analysis');
      }

      if (data.jobId) {
        console.log(`✅ [Caesar] Analysis started with job ID: ${data.jobId}`);
        setJobId(data.jobId);
        // Store the query prompt if provided
        if (data.query) {
          setQueryPrompt(data.query);
        }
      } else if (data.data) {
        // Analysis completed immediately (cached)
        console.log(`✅ [Caesar] Analysis completed (cached)`);
        setResearch(data.data);
        setStatus({ status: 'completed', progress: 100 });
        setLoading(false);
        // Store query from cached data
        if (data.data.rawContent) {
          const queryMatch = data.data.rawContent.match(/=== INITIAL QUERY SENT TO CAESAR ===\n\n([\s\S]*?)\n\n=== CAESAR'S RAW RESPONSE ===/);
          if (queryMatch) {
            setQueryPrompt(queryMatch[1]);
          }
        }
      }
    } catch (err) {
      console.error(`❌ [Caesar] Failed to start analysis:`, err);
      setError(err instanceof Error ? err.message : 'Failed to start analysis');
      setLoading(false);
    }
  };

  const pollStatus = async () => {
    if (!jobId) return;

    try {
      const currentPollCount = pollCount + 1;
      setPollCount(currentPollCount);
      setLastPollTime(new Date());

      const elapsedMs = Date.now() - startTimeRef.current;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      
      console.log(`🔄 [Caesar] Poll #${currentPollCount} - Checking status for job ${jobId} (${elapsedMinutes}m ${elapsedSeconds % 60}s elapsed)...`);

      // Check for timeout (15 minutes)
      if (elapsedMs > MAX_WAIT_TIME) {
        console.error(`❌ [Caesar] Analysis timed out after 15 minutes`);
        setError('Analysis timed out after 15 minutes. Please try again.');
        setLoading(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        return;
      }

      const response = await fetch(`/api/ucie/research/${encodeURIComponent(symbol)}?jobId=${jobId}`, {
        credentials: 'include' // Required for authentication cookie
      });

      if (!response.ok) {
        throw new Error(`Failed to check status: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to check analysis status');
      }

      // Calculate fallback progress if API doesn't provide it
      const apiProgress = data.progress || 0;
      const fallbackProgress = calculateFallbackProgress(elapsedMs);
      const displayProgress = apiProgress > 0 ? apiProgress : fallbackProgress;

      // Update status
      const newStatus: AnalysisStatus = {
        status: data.status || 'researching',
        progress: Math.round(displayProgress),
        estimatedTimeRemaining: data.estimatedTimeRemaining,
      };

      setStatus(newStatus);

      console.log(`📊 [Caesar] Status: ${newStatus.status} | Progress: ${newStatus.progress}% | ETA: ${newStatus.estimatedTimeRemaining || 'calculating...'}s`);

      // Check if completed
      if (newStatus.status === 'completed' && data.data) {
        console.log(`✅ [Caesar] Analysis completed! Confidence: ${data.data.confidence}%`);
        console.log(`📚 [Caesar] Sources found: ${data.data.sources?.length || 0}`);
        setResearch(data.data);
        setLoading(false);

        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else if (newStatus.status === 'failed') {
        console.error(`❌ [Caesar] Analysis failed`);
        setError('Caesar analysis failed. Please try again.');
        setLoading(false);

        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error(`❌ [Caesar] Failed to poll status:`, err);
      // Don't set error here, just log it - we'll retry on next poll
    }
  };

  const handleRetry = () => {
    setJobId(null);
    setStatus(null);
    setResearch(null);
    setError(null);
    setPollCount(0);
    startAnalysis();
  };

  // ✅ NEW: Show opt-in button when data is ready but user hasn't started analysis
  if (!userWantsAnalysis && progressiveLoadingComplete) {
    return (
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8">
        <div className="text-center">
          <Brain className="w-16 h-16 text-bitcoin-orange mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-bitcoin-white mb-2">
            Caesar AI Deep Dive Research
          </h2>
          <p className="text-bitcoin-white-80 mb-6 max-w-2xl mx-auto">
            All data has been collected and GPT-5.1 analysis is complete. 
            You can now review all the information above, or proceed with Caesar AI's comprehensive deep dive research.
          </p>
          
          {/* What Caesar Will Do */}
          <div className="bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded-lg p-6 mb-6 text-left max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-bitcoin-white mb-4">
              What Caesar AI Will Analyze:
            </h3>
            <div className="space-y-3 text-sm text-bitcoin-white-80">
              <div className="flex items-start gap-2">
                <span className="text-bitcoin-orange mt-1">•</span>
                <span>Search 15+ authoritative sources for latest information</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-bitcoin-orange mt-1">•</span>
                <span>Analyze technology, team, partnerships, and market position</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-bitcoin-orange mt-1">•</span>
                <span>Identify risks, opportunities, and recent developments</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-bitcoin-orange mt-1">•</span>
                <span>Generate comprehensive research report with citations</span>
              </div>
            </div>
          </div>

          {/* Time Warning */}
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 justify-center text-bitcoin-orange">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Expected Duration: 15-20 minutes</span>
            </div>
            <p className="text-xs text-bitcoin-white-60 mt-2">
              This is a comprehensive deep dive analysis. You can review other data while waiting.
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={() => {
              console.log('🚀 [Caesar] User clicked "Start Caesar Deep Dive" button');
              setUserWantsAnalysis(true);
            }}
            className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase px-8 py-4 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[56px] text-lg"
          >
            <Brain className="w-6 h-6 inline mr-2" />
            Start Caesar Deep Dive (15-20 min)
          </button>

          {/* Optional: Skip Button */}
          <div className="mt-4">
            <p className="text-xs text-bitcoin-white-60">
              You can review all the data above and come back to start Caesar analysis later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show preparing data state (only after user clicks button)
  if (preparingData && !progressiveLoadingComplete) {
    return (
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8">
        <div className="text-center">
          <Brain className="w-16 h-16 text-bitcoin-orange mx-auto mb-4 animate-pulse" />
          <h2 className="text-3xl font-bold text-bitcoin-white mb-2">
            Waiting for Data Collection
          </h2>
          <p className="text-bitcoin-white-80">
            Progressive loading is still in progress...
          </p>
          <div className="mt-4 text-sm text-bitcoin-white-60">
            Caesar analysis will start when you click the button
          </div>
        </div>
      </div>
    );
  }

  if (preparingData && progressiveLoadingComplete && userWantsAnalysis) {
    return (
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8">
        <div className="text-center">
          <Brain className="w-16 h-16 text-bitcoin-orange mx-auto mb-4 animate-pulse" />
          <h2 className="text-3xl font-bold text-bitcoin-white mb-2">
            Preparing Caesar Analysis
          </h2>
          <p className="text-bitcoin-white-80">
            Finalizing data collection from database...
          </p>
          <div className="mt-4 text-sm text-bitcoin-white-60">
            This will take just a few seconds
          </div>
        </div>
      </div>
    );
  }

  // Show completed analysis
  if (research && !loading) {
    return <CaesarResearchPanel symbol={symbol} research={research} />;
  }

  // Show error state
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
            onClick={handleRetry}
            className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange min-h-[48px]"
          >
            <RefreshCw className="w-5 h-5 inline mr-2" />
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  // Show loading state with progress
  return (
    <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8">
      <div className="text-center">
        {/* Header */}
        <div className="mb-8">
          <Brain className="w-16 h-16 text-bitcoin-orange mx-auto mb-4 animate-pulse" />
          <h2 className="text-3xl font-bold text-bitcoin-white mb-2">
            Caesar AI Deep Research
          </h2>
          <p className="text-bitcoin-white-80">
            Analyzing {symbol} with advanced AI research...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-bitcoin-white-60 uppercase tracking-wider">
              Analysis Progress
            </span>
            <span className="text-2xl font-mono font-bold text-bitcoin-orange">
              {status?.progress || 0}%
            </span>
          </div>
          <div className="w-full h-4 bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-full overflow-hidden">
            <div
              className="h-full bg-bitcoin-orange transition-all duration-1000 ease-out"
              style={{ width: `${status?.progress || 0}%` }}
            />
          </div>
        </div>

        {/* Status Information */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center gap-2 text-bitcoin-white-80">
            <Clock className="w-5 h-5 text-bitcoin-orange animate-pulse" />
            <span>
              Status: <span className="text-bitcoin-white font-semibold capitalize">{status?.status || 'Starting'}</span>
            </span>
          </div>

          {/* Elapsed Time (Live Counter) */}
          <div className="text-bitcoin-white-60 font-mono">
            Elapsed: {Math.floor(elapsedTime / 60000)}m {Math.floor((elapsedTime % 60000) / 1000)}s
          </div>

          {/* Estimated Time Remaining */}
          {status?.estimatedTimeRemaining && status.estimatedTimeRemaining > 0 ? (
            <div className="text-bitcoin-white-60">
              Estimated time remaining: {Math.ceil(status.estimatedTimeRemaining / 60)} minutes
            </div>
          ) : (
            <div className="text-bitcoin-white-60">
              Estimated time remaining: Calculating...
            </div>
          )}

          {/* Poll Information */}
          <div className="text-sm text-bitcoin-white-60">
            Poll #{pollCount} • Checking every 60 seconds
          </div>

          {/* Last Poll Time */}
          <div className="text-xs text-bitcoin-white-60">
            Last checked: {lastPollTime.toLocaleTimeString()}
          </div>

          {/* Timeout Warning */}
          {(Date.now() - startTimeRef.current) > 600000 && (
            <div className="text-xs text-bitcoin-orange">
              ⚠️ Analysis taking longer than expected (15 min timeout)
            </div>
          )}
        </div>

        {/* Status Details */}
        <div className="bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded-lg p-6">
          <h3 className="text-lg font-bold text-bitcoin-white mb-4">
            What's Happening?
          </h3>
          <div className="space-y-3 text-left text-sm text-bitcoin-white-80">
            <div className="flex items-start gap-2">
              <span className="text-bitcoin-orange mt-1">•</span>
              <span>Searching 15+ authoritative sources</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-bitcoin-orange mt-1">•</span>
              <span>Analyzing technology, team, partnerships, and market position</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-bitcoin-orange mt-1">•</span>
              <span>Identifying risks and recent developments</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-bitcoin-orange mt-1">•</span>
              <span>Generating comprehensive research report</span>
            </div>
          </div>
        </div>

        {/* Expandable Prompt Viewer */}
        {queryPrompt && (
          <details className="mt-6 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg overflow-hidden text-left">
            <summary className="cursor-pointer px-4 py-3 bg-bitcoin-orange-5 hover:bg-bitcoin-orange-10 transition-colors">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-bitcoin-orange" />
                <span className="text-sm font-bold text-bitcoin-white">
                  View Prompt Sent to Caesar (Click to expand)
                </span>
              </div>
            </summary>
            <div className="p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-bitcoin-white-80 font-mono whitespace-pre-wrap break-words">
                {queryPrompt}
              </pre>
            </div>
          </details>
        )}

        {/* Disclaimer */}
        <div className="mt-6 text-xs text-bitcoin-white-60">
          This process typically takes 5-10 minutes for comprehensive analysis.
          <br />
          Progress updates every 60 seconds.
        </div>
      </div>
    </div>
  );
}
