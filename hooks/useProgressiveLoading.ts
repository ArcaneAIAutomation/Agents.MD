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
  enabled?: boolean; // Only start loading if enabled (default: true)
  onPhaseComplete?: (phase: number, data: any) => void;
  onAllComplete?: (allData: any) => void;
  onError?: (phase: number, error: string) => void;
}

export function useProgressiveLoading({
  symbol,
  enabled = true, // Default to true for backward compatibility
  onPhaseComplete,
  onAllComplete,
  onError
}: ProgressiveLoadingOptions) {
  const [phases, setPhases] = useState<LoadingPhase[]>([
    {
      phase: 1,
      label: 'Critical Data (Market Data)',
      endpoints: [`/api/ucie/market-data/${symbol}`],
      priority: 'critical',
      targetTime: 10000, // 10 seconds
      progress: 0,
      complete: false,
    },
    {
      phase: 2,
      label: 'Important Data (News & Sentiment)',
      endpoints: [
        `/api/ucie/news/${symbol}`,
        `/api/ucie/sentiment/${symbol}`
      ],
      priority: 'important',
      targetTime: 15000, // 15 seconds
      progress: 0,
      complete: false,
    },
    {
      phase: 3,
      label: 'Enhanced Data (Technical, On-Chain, Risk, Derivatives, DeFi)',
      endpoints: [
        `/api/ucie/technical/${symbol}`,
        `/api/ucie/on-chain/${symbol}`,
        `/api/ucie/risk/${symbol}`,
        `/api/ucie/derivatives/${symbol}`,
        `/api/ucie/defi/${symbol}`
      ],
      priority: 'enhanced',
      targetTime: 20000, // 20 seconds
      progress: 0,
      complete: false,
    },
    {
      phase: 4,
      label: 'Deep Analysis (Predictions)',
      endpoints: [
        // Note: Caesar research is handled separately by CaesarAnalysisContainer
        // to avoid blocking the UI with 10-minute polling
        `/api/ucie/predictions/${symbol}`
      ],
      priority: 'deep',
      targetTime: 30000, // 30 seconds for predictions
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
          const url = endpoint;
          
          // For long-running endpoints (Phase 4), use a longer timeout
          const timeoutMs = phase.phase === 4 ? 600000 : phase.targetTime;
          
          // Log API calls
          console.log(`📡 Fetching: ${endpoint}`);
          
          let fetchOptions: RequestInit = {
            signal: AbortSignal.timeout(timeoutMs),
          };
          
          // Simple GET request for all endpoints (they handle their own logic)
          const response = await fetch(url, fetchOptions);

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

          // Extract endpoint name for data key
          const endpointName = endpoint.split('/').filter(Boolean).slice(-2, -1)[0]; // Get 'market-data', 'news', etc.
          
          console.log(`✅ ${endpointName} completed`);

          return { endpoint, endpointName, data: data.data || data };
        } catch (error: any) {
          const endpointName = endpoint.split('/').filter(Boolean).slice(-2, -1)[0];
          console.warn(`❌ ${endpointName} error:`, error.message);
          return { endpoint, endpointName, data: null, error: error.message };
        }
      });

      const results = await Promise.allSettled(promises);

      // Aggregate results
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.data) {
          const endpointName = result.value.endpointName;
          phaseData[endpointName] = result.value.data;
          console.log(`📦 Stored ${endpointName} data`);
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

      // Note: aggregatedData is set after all phases complete with transformation
      // Don't set it here to avoid partial updates

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

  // Transform UCIE data to match frontend expectations
  const transformUCIEData = useCallback((rawData: any) => {
    console.log('🔄 Transforming UCIE data for frontend...');
    console.log('📊 Raw data keys:', Object.keys(rawData));
    
    const transformed = {
      // Phase 1: Market Data
      'market-data': rawData['market-data'],
      marketData: rawData['market-data'],
      
      // Phase 2: News & Sentiment
      news: rawData['news'],
      sentiment: rawData['sentiment'],
      
      // Phase 3: Enhanced Data
      technical: rawData['technical'],
      onChain: rawData['on-chain'],
      'on-chain': rawData['on-chain'],
      risk: rawData['risk'],
      derivatives: rawData['derivatives'],
      defi: rawData['defi'],
      
      // Phase 4: Deep Analysis
      // Note: research is handled separately by CaesarAnalysisContainer
      research: rawData['research'] || null,
      predictions: rawData['predictions'],
      
      // Generate consensus from available data
      consensus: generateConsensus(rawData),
      
      // Generate executive summary
      executiveSummary: generateExecutiveSummary(rawData)
    };
    
    console.log('✅ Data transformation complete');
    console.log('  • Market Data:', transformed.marketData ? '✓' : '✗');
    console.log('  • News:', transformed.news ? '✓' : '✗');
    console.log('  • Sentiment:', transformed.sentiment ? '✓' : '✗');
    console.log('  • Technical:', transformed.technical ? '✓' : '✗');
    console.log('  • On-Chain:', transformed.onChain ? '✓' : '✗');
    console.log('  • Risk:', transformed.risk ? '✓' : '✗');
    console.log('  • Derivatives:', transformed.derivatives ? '✓' : '✗');
    console.log('  • DeFi:', transformed.defi ? '✓' : '✗');
    console.log('  • Research:', transformed.research ? '✓' : '✗');
    console.log('  • Predictions:', transformed.predictions ? '✓' : '✗');
    
    return transformed;
  }, []);
  
  // Generate consensus from multiple data sources
  function generateConsensus(data: any) {
    const signals: number[] = [];
    
    // Technical signals
    if (data.technical?.recommendation) {
      const rec = data.technical.recommendation.toLowerCase();
      if (rec.includes('strong buy')) signals.push(100);
      else if (rec.includes('buy')) signals.push(75);
      else if (rec.includes('hold')) signals.push(50);
      else if (rec.includes('sell')) signals.push(25);
    }
    
    // Sentiment signals
    if (data.sentiment?.overallScore !== undefined) {
      signals.push((data.sentiment.overallScore + 100) / 2);
    }
    
    // Risk signals (inverse)
    if (data.risk?.overallScore !== undefined) {
      signals.push(100 - data.risk.overallScore);
    }
    
    if (signals.length === 0) return null;
    
    const overallScore = Math.round(signals.reduce((a, b) => a + b, 0) / signals.length);
    
    let recommendation: string;
    if (overallScore >= 80) recommendation = 'STRONG_BUY';
    else if (overallScore >= 60) recommendation = 'BUY';
    else if (overallScore >= 40) recommendation = 'HOLD';
    else if (overallScore >= 20) recommendation = 'SELL';
    else recommendation = 'STRONG_SELL';
    
    return {
      overallScore,
      recommendation,
      confidence: signals.length >= 3 ? 85 : 70
    };
  }
  
  // Generate executive summary from available data
  function generateExecutiveSummary(data: any) {
    const topFindings: string[] = [];
    const opportunities: string[] = [];
    const risks: string[] = [];
    
    if (data['market-data']?.price) {
      topFindings.push(`Current price: $${data['market-data'].price.toLocaleString()}`);
    }
    
    if (data.sentiment?.overallScore !== undefined) {
      topFindings.push(`Sentiment: ${data.sentiment.overallScore > 0 ? 'Positive' : 'Negative'} (${data.sentiment.overallScore})`);
    }
    
    if (data.technical?.recommendation) {
      topFindings.push(`Technical: ${data.technical.recommendation}`);
    }
    
    if (data.risk?.keyRisks) {
      risks.push(...data.risk.keyRisks.slice(0, 3));
    }
    
    if (data.predictions?.priceTargets) {
      opportunities.push(`Price targets: ${data.predictions.priceTargets.join(', ')}`);
    }
    
    const consensus = generateConsensus(data);
    const oneLineSummary = consensus 
      ? `${data.symbol || 'Token'} shows ${consensus.recommendation} signals with ${consensus.confidence}% confidence.`
      : 'Analysis in progress...';
    
    return {
      topFindings,
      opportunities,
      risks,
      oneLineSummary
    };
  }

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

    // Transform data for frontend
    const transformedData = transformUCIEData(allData);
    setAggregatedData(transformedData);

    setLoading(false);

    // All phases complete callback with transformed data
    if (onAllComplete) {
      onAllComplete(transformedData);
    }

    console.log('🎉 All phases completed!');
  }, [phases, fetchPhaseData, onAllComplete, transformUCIEData]);

  // Start loading on mount (only if enabled)
  useEffect(() => {
    if (enabled) {
      loadAllPhases();
    }
  }, [symbol, enabled]); // Re-run when symbol or enabled changes

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
