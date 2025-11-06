import { useState, useEffect, useCallback } from 'react';

/**
 * Generate or retrieve session ID from browser storage (client-side only)
 */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server-side-' + Date.now();
  }
  
  let sessionId = sessionStorage.getItem('ucie_session_id');
  if (!sessionId) {
    // Generate UUID v4 without external library
    sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    sessionStorage.setItem('ucie_session_id', sessionId);
    console.log(`🆔 Created new session: ${sessionId}`);
  } else {
    console.log(`🆔 Using existing session: ${sessionId}`);
  }
  
  return sessionId;
}

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
      label: 'Critical Data (Market Data from CoinMarketCap + Exchanges)',
      endpoints: [`/api/ucie-market-data?symbol=${symbol}`],
      priority: 'critical',
      targetTime: 5000, // 5 seconds for multi-source data
      progress: 0,
      complete: false,
    },
    {
      phase: 2,
      label: 'News & Sentiment Analysis',
      endpoints: [`/api/ucie-news?symbol=${symbol}&limit=10`],
      priority: 'important',
      targetTime: 8000, // 8 seconds for news aggregation
      progress: 0,
      complete: false,
    },
    {
      phase: 3,
      label: 'Technical Analysis (Coming Soon)',
      endpoints: [], // Will add ucie-technical endpoint
      priority: 'enhanced',
      targetTime: 5000,
      progress: 0,
      complete: false,
    },
    {
      phase: 4,
      label: 'Caesar AI Deep Research',
      endpoints: [`/api/ucie-research`], // POST endpoint, handled separately
      priority: 'deep',
      targetTime: 120000, // 2 minutes for Caesar polling
      progress: 0,
      complete: false,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [aggregatedData, setAggregatedData] = useState<any>({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [sessionId] = useState(() => getOrCreateSessionId());

  const fetchPhaseData = useCallback(async (phase: LoadingPhase, previousData: any = {}) => {
    const startTime = Date.now();
    const phaseData: any = {};
    let completedEndpoints = 0;

    console.log(`🚀 Starting Phase ${phase.phase}: ${phase.label} (timeout: ${phase.targetTime}ms)`);

    try {
      // Fetch all endpoints for this phase in parallel
      const promises = phase.endpoints.map(async (endpoint) => {
        try {
          // New flat endpoints already have query parameters, don't append symbol
          const url = endpoint;
          
          // For long-running endpoints (Phase 4), use a longer timeout
          const timeoutMs = phase.phase === 4 ? 120000 : phase.targetTime; // 2 min for Phase 4 (Caesar polling)
          
          // Log Caesar API calls specifically
          if (endpoint.includes('research')) {
            console.log(`🔍 Calling Caesar API for ${symbol} (timeout: ${timeoutMs}ms = ${timeoutMs/1000}s)`);
          }
          
          // For Phase 4 (Caesar research), use POST with all accumulated data
          let fetchUrl = url;
          let fetchOptions: RequestInit = {
            signal: AbortSignal.timeout(timeoutMs),
          };
          
          if (phase.phase === 4 && endpoint.includes('research')) {
            // POST request with market data and news data from previous phases
            fetchOptions.method = 'POST';
            fetchOptions.headers = { 'Content-Type': 'application/json' };
            fetchOptions.body = JSON.stringify({
              symbol,
              marketData: previousData['market-data'] || previousData['ucie-market-data'] || null,
              newsData: previousData['news'] || previousData['ucie-news'] || null,
              technicalData: previousData['technical'] || null,
              userQuery: `Provide comprehensive analysis for ${symbol}`
            });
            console.log(`📤 Sending comprehensive data to Caesar for ${symbol}`);
          }
          
          const response = await fetch(fetchUrl, fetchOptions);

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
          // Extract endpoint name from URL (handle query parameters)
          const endpointPath = result.value.endpoint.split('?')[0]; // Remove query params
          const endpointName = endpointPath.split('/').pop() || 'unknown';
          phaseData[endpointName] = result.value.data;
        }
      });

      const elapsedTime = Date.now() - startTime;
      
      // Store phase data in database AFTER phase completes
      if (phase.phase < 4 && Object.keys(phaseData).length > 0) {
        try {
          console.log(`💾 Storing Phase ${phase.phase} data in database...`);
          const storeResponse = await fetch('/api/ucie/store-phase-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              symbol,
              phaseNumber: phase.phase,
              data: phaseData
            })
          });
          
          if (storeResponse.ok) {
            console.log(`✅ Phase ${phase.phase} data stored in database`);
          } else {
            console.warn(`⚠️ Failed to store Phase ${phase.phase} data: ${storeResponse.status}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to store Phase ${phase.phase} data:`, error);
        }
      }
      
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

    // Load phases sequentially, passing accumulated data to each phase
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      setCurrentPhase(phase.phase);
      
      // Pass all previously collected data to this phase
      const phaseData = await fetchPhaseData(phase, allData);
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
