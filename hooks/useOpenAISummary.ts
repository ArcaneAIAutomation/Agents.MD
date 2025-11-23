/**
 * UCIE OpenAI Summary - React Hook
 * 
 * Manages async GPT-5.1 analysis with polling
 * Pattern matches Whale Watch Deep Dive (proven in production)
 * 
 * Usage:
 * const { status, result, error, progress, elapsedTime, startAnalysis, cancelAnalysis } = useOpenAISummary('BTC');
 */

import { useState, useCallback, useRef } from 'react';

interface OpenAISummaryResult {
  summary: string;
  confidence: number;
  key_insights: string[];
  market_outlook: string;
  risk_factors: string[];
  opportunities: string[];
  [key: string]: any;
}

interface UseOpenAISummaryReturn {
  status: 'idle' | 'starting' | 'polling' | 'completed' | 'error';
  result: OpenAISummaryResult | null;
  error: string | null;
  progress: string;
  elapsedTime: number;
  jobId: number | null;
  startAnalysis: () => Promise<void>;
  cancelAnalysis: () => void;
  reset: () => void;
}

export const useOpenAISummary = (symbol: string): UseOpenAISummaryReturn => {
  const [status, setStatus] = useState<'idle' | 'starting' | 'polling' | 'completed' | 'error'>('idle');
  const [result, setResult] = useState<OpenAISummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [jobId, setJobId] = useState<number | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const elapsedTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    // Clear all timers and abort controllers
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    if (elapsedTimeIntervalRef.current) {
      clearInterval(elapsedTimeIntervalRef.current);
      elapsedTimeIntervalRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const updateProgress = useCallback((elapsed: number) => {
    // Update progress stage based on elapsed time
    if (elapsed < 10) {
      setProgress('Starting analysis...');
    } else if (elapsed < 30) {
      setProgress('Fetching market data...');
    } else if (elapsed < 60) {
      setProgress('Analyzing technical indicators...');
    } else if (elapsed < 90) {
      setProgress('Processing sentiment data...');
    } else if (elapsed < 120) {
      setProgress('Generating comprehensive summary...');
    } else {
      setProgress('Finalizing analysis...');
    }
  }, []);

  const startAnalysis = useCallback(async () => {
    // Prevent multiple simultaneous analyses
    if (status === 'starting' || status === 'polling') {
      console.log('⚠️ Analysis already in progress');
      return;
    }

    try {
      // Reset state
      setStatus('starting');
      setError(null);
      setResult(null);
      setProgress('Initializing...');
      setElapsedTime(0);
      setJobId(null);
      cleanup();

      console.log(`🚀 Starting OpenAI analysis for ${symbol}...`);

      // Step 1: Start the job
      const startResponse = await fetch(`/api/ucie/openai-summary-start/${symbol}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!startResponse.ok) {
        const errorData = await startResponse.json();
        throw new Error(errorData.error || `Failed to start analysis: ${startResponse.status}`);
      }

      const startData = await startResponse.json();
      
      if (!startData.success || !startData.jobId) {
        throw new Error('Invalid response from start endpoint');
      }

      const newJobId = startData.jobId;
      setJobId(newJobId);
      setStatus('polling');
      
      console.log(`✅ Job ${newJobId} created, polling for results...`);

      // Track start time
      const startTime = Date.now();
      startTimeRef.current = startTime;

      // Update elapsed time every second
      elapsedTimeIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
        updateProgress(elapsed);
      }, 1000);

      // Step 2: Poll for results (every 5 seconds, max 3 minutes)
      const maxAttempts = 36; // 3 minutes (36 × 5 seconds = 180 seconds)
      let attempts = 0;

      const poll = async () => {
        if (attempts >= maxAttempts) {
          cleanup();
          setStatus('error');
          setError('Analysis timeout after 3 minutes. Please try again.');
          return;
        }

        attempts++;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);

        console.log(`📊 Polling attempt ${attempts}/${maxAttempts} for job ${newJobId} (${elapsed}s elapsed)`);

        try {
          // Create abort controller for this poll request
          abortControllerRef.current = new AbortController();

          const pollResponse = await fetch(`/api/ucie/openai-summary-poll/${newJobId}`, {
            signal: abortControllerRef.current.signal,
          });

          if (!pollResponse.ok) {
            throw new Error(`Poll error: ${pollResponse.status}`);
          }

          const pollData = await pollResponse.json();
          console.log(`📊 Job ${newJobId} status: ${pollData.status}`);

          // Update progress from server if available
          if (pollData.progress) {
            setProgress(pollData.progress);
          }

          if (pollData.status === 'completed') {
            console.log('✅ OpenAI analysis completed');
            cleanup();

            if (!pollData.result) {
              throw new Error('No result data in completed response');
            }

            // Parse result
            let parsedResult: OpenAISummaryResult;
            try {
              parsedResult = typeof pollData.result === 'string' 
                ? JSON.parse(pollData.result) 
                : pollData.result;
            } catch (parseError) {
              console.error('Failed to parse result:', parseError);
              throw new Error('Failed to parse analysis result');
            }

            setResult(parsedResult);
            setStatus('completed');
            setProgress('Analysis complete!');
            return;
          }

          if (pollData.status === 'error') {
            cleanup();
            setStatus('error');
            setError(pollData.error || 'Analysis failed on server');
            return;
          }

          // Still processing (queued or processing), poll again in 5 seconds
          console.log(`⏳ Job ${newJobId} still ${pollData.status}, polling again in 5s...`);
          pollingTimeoutRef.current = setTimeout(poll, 5000);

        } catch (pollError: any) {
          // Check if this was an abort (user cancelled)
          if (pollError.name === 'AbortError') {
            console.log('🚫 Polling aborted by user');
            return;
          }

          console.error('❌ Polling error:', pollError);
          
          // Retry on network errors (up to max attempts)
          if (attempts < maxAttempts) {
            console.log(`⚠️ Retrying poll in 3s... (attempt ${attempts}/${maxAttempts})`);
            pollingTimeoutRef.current = setTimeout(poll, 3000);
          } else {
            cleanup();
            setStatus('error');
            setError(pollError.message || 'Failed to poll analysis status');
          }
        }
      };

      // Start polling
      poll();

    } catch (err: any) {
      console.error('Failed to start OpenAI analysis:', err);
      cleanup();
      setStatus('error');
      setError(err.message || 'Failed to start analysis');
    }
  }, [symbol, status, cleanup, updateProgress]);

  const cancelAnalysis = useCallback(() => {
    console.log('🚫 Cancelling OpenAI analysis...');
    cleanup();
    setStatus('idle');
    setProgress('');
    setElapsedTime(0);
    setError(null);
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setStatus('idle');
    setResult(null);
    setError(null);
    setProgress('');
    setElapsedTime(0);
    setJobId(null);
  }, [cleanup]);

  return {
    status,
    result,
    error,
    progress,
    elapsedTime,
    jobId,
    startAnalysis,
    cancelAnalysis,
    reset,
  };
};
