import { useState, useEffect, useCallback } from 'react';

export interface LoadingPhase {
  phase: number;
  label: string;
  endpoints: string[];
  priority: 'critical' | 'important' | 'enhanced' | 'deep';
  targetTime: number; // milliseconds
  progress: number;
  complete: boolean;
  data?: any;
  error?: string;
}

interface ProgressiveLoadingOptions {
  symbol: string;
  onPhaseComplete?: (phase: number, data: any) => void;
  onAllComplete?: (allData: any) => void;
  onError?: (phase: number, error: string) => void;
}

export function useProgressiveLoading({
  symbol,
  onPhaseComplete,
  onAllComplete,
  onError
}: ProgressiveLoadingOptions) {
  const [phases, setPhases] = useState<LoadingPhase[]>([
    {
      phase: 1,
      label: 'Critical Data (Price, Volume, Risk)',
      endpoints: ['/api/ucie/market-data', '/api/ucie/risk'],
      priority: 'critical',
      targetTime: 1000,
      progress: 0,
      complete: false,
    },
    {
      phase: 2,
      label: 'Important Data (News, Sentiment)',
      endpoints: ['/api/ucie/news', '/api/ucie/sentiment'],
      priority: 'important',
      targetTime: 3000,
      progress: 0,
      complete: false,
    },
    {
      phase: 3,
      label: 'Enhanced Data (Technical, On-Chain, DeFi)',
      endpoints: ['/api/ucie/technical', '/api/ucie/on-chain', '/api/ucie/defi'],
      priority: 'enhanced',
      targetTime: 7000,
      progress: 0,
      complete: false,
    },
    {
      phase: 4,
      label: 'Deep Analysis (AI Research, Predictions)',
      endpoints: ['/api/ucie/research', '/api/ucie/predictions'],
      priority: 'deep',
      targetTime: 15000,
      progress: 0,
      complete: false,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [aggregatedData, setAggregatedData] = useState<any>({});
  const [overallProgress, setOverallProgress] = useState(0);

  const fetchPhaseData = useCallback(async (phase: LoadingPhase) => {
    const startTime = Date.now();
    const phaseData: any = {};
    let completedEndpoints = 0;

    try {
      // Fetch all endpoints for this phase in parallel
      const promises = phase.endpoints.map(async (endpoint) => {
        try {
          const url = `${endpoint}/${encodeURIComponent(symbol)}`;
          const response = await fetch(url, {
            signal: AbortSignal.timeout(phase.targetTime),
          });

          if (!response.ok) {
            throw new Error(`${endpoint} failed: ${response.statusText}`);
          }

          const data = await response.json();
          
          // Update progress as each endpoint completes
          completedEndpoints++;
          const progress = (completedEndpoints / phase.endpoints.length) * 100;
          
          setPhases(prev => prev.map(p => 
            p.phase === phase.phase 
              ? { ...p, progress }
              : p
          ));

          return { endpoint, data: data.success ? data.data : data };
        } catch (error: any) {
          console.warn(`${endpoint} error:`, error.message);
          return { endpoint, data: null, error: error.message };
        }
      });

      const results = await Promise.allSettled(promises);

      // Aggregate results
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.data) {
          const endpointName = result.value.endpoint.split('/').pop();
          phaseData[endpointName!] = result.value.data;
        }
      });

      const elapsedTime = Date.now() - startTime;
      
      // Mark phase as complete
      setPhases(prev => prev.map(p => 
        p.phase === phase.phase 
          ? { ...p, progress: 100, complete: true, data: phaseData }
          : p
      ));

      // Update aggregated data
      setAggregatedData((prev: any) => ({ ...prev, ...phaseData }));

      // Callback
      if (onPhaseComplete) {
        onPhaseComplete(phase.phase, phaseData);
      }

      console.log(`✅ Phase ${phase.phase} completed in ${elapsedTime}ms (target: ${phase.targetTime}ms)`);

      return phaseData;
    } catch (error: any) {
      console.error(`❌ Phase ${phase.phase} error:`, error);
      
      setPhases(prev => prev.map(p => 
        p.phase === phase.phase 
          ? { ...p, complete: true, error: error.message }
          : p
      ));

      if (onError) {
        onError(phase.phase, error.message);
      }

      return null;
    }
  }, [symbol, onPhaseComplete, onError]);

  const loadAllPhases = useCallback(async () => {
    setLoading(true);
    setCurrentPhase(1);
    setOverallProgress(0);

    const allData: any = {};

    // Load phases sequentially
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      setCurrentPhase(phase.phase);
      
      const phaseData = await fetchPhaseData(phase);
      if (phaseData) {
        Object.assign(allData, phaseData);
      }
      
      // Update overall progress
      const progress = ((i + 1) / phases.length) * 100;
      setOverallProgress(progress);
    }

    setLoading(false);

    // All phases complete callback
    if (onAllComplete) {
      onAllComplete(allData);
    }

    console.log('🎉 All phases completed!');
  }, [phases, fetchPhaseData, onAllComplete]);

  // Start loading on mount
  useEffect(() => {
    loadAllPhases();
  }, [symbol]); // Only re-run when symbol changes

  const refresh = useCallback(() => {
    setPhases(prev => prev.map(p => ({ ...p, progress: 0, complete: false, data: undefined, error: undefined })));
    setAggregatedData({});
    loadAllPhases();
  }, [loadAllPhases]);

  return {
    phases,
    loading,
    currentPhase,
    overallProgress,
    data: aggregatedData,
    refresh,
  };
}
