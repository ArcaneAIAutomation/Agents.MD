import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle, RefreshCw, Brain, ChevronDown, ChevronUp, Clock, Search, Loader, CheckCircle, Circle } from 'lucide-react';

interface AnalysisMetadata {
  model: string;
  provider: string;
  timestamp: string;
  processingTime: number;
  thinkingEnabled: boolean;
  dataSourcesUsed?: string[];
  analysisType?: string;
  blockchainDataAvailable?: boolean;
  dataSourceLimitations?: string[];
  blockchainErrors?: Array<{
    address: string;
    errorType: string;
    message: string;
  }>;
}

interface WhaleTransaction {
  txHash: string;
  blockchain: 'BTC';
  amount: number;
  amountUSD: number;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  type: 'exchange_deposit' | 'exchange_withdrawal' | 'whale_to_whale' | 'unknown';
  description: string;
  analysisJobId?: string;
  analysis?: any;
  thinking?: string; // AI reasoning process (Gemini thinking mode)
  analysisStatus?: 'pending' | 'analyzing' | 'completed' | 'failed';
  analysisProvider?: 'caesar' | 'gemini' | 'gemini-deep-dive';
  thinkingEnabled?: boolean; // Indicates if thinking mode was used
  metadata?: AnalysisMetadata; // Analysis metadata
  deepDiveStatus?: 'idle' | 'analyzing' | 'completed' | 'failed';
  deepDiveAnalysis?: any; // Deep dive analysis results
  blockchainData?: any; // Blockchain data from Deep Dive
}

interface WhaleData {
  success: boolean;
  whales: WhaleTransaction[];
  count: number;
  threshold: number;
}

export default function WhaleWatchDashboard() {
  const [whaleData, setWhaleData] = useState<WhaleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [analyzingTx, setAnalyzingTx] = useState<string | null>(null);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const [deepDiveProgress, setDeepDiveProgress] = useState<Record<string, string>>({});
  const [deepDiveStartTime, setDeepDiveStartTime] = useState<Record<string, number>>({});
  const [deepDiveAbortControllers, setDeepDiveAbortControllers] = useState<Record<string, AbortController>>({});
  
  // Track if any transaction is currently being analyzed (includes both starting and in-progress)
  const hasActiveAnalysis = (whaleData?.whales.some(w => w.analysisStatus === 'analyzing') || analyzingTx !== null);
  
  // ModelBadge component for displaying model name and processing time
  const ModelBadge = ({ model, processingTime }: { model: string; processingTime?: number }) => {
    // Determine display name based on model
    const displayName = model.includes('gemini-2.5-pro') 
      ? 'Gemini 2.5 Pro' 
      : model.includes('gemini-2.5-flash')
      ? 'Gemini 2.5 Flash'
      : model.includes('gemini-exp')
      ? 'Gemini Experimental'
      : model.includes('gemini')
      ? 'Gemini AI'
      : model.includes('gpt-4')
      ? 'GPT-4'
      : model.includes('gpt-3.5')
      ? 'GPT-3.5'
      : model.includes('claude')
      ? 'Claude AI'
      : model.includes('caesar')
      ? 'Caesar AI'
      : 'AI Analysis';
    
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-3 py-1.5 bg-bitcoin-orange text-bitcoin-black rounded font-bold text-xs uppercase shadow-[0_0_15px_rgba(247,147,26,0.5)]">
          {displayName}
        </span>
        {processingTime !== undefined && processingTime > 0 && (
          <span className="flex items-center gap-1 text-bitcoin-white-60 text-xs font-mono">
            <Clock className="w-3 h-3" />
            {processingTime}ms
          </span>
        )}
      </div>
    );
  };

  // ConfidenceBadge component with color-coded indicator
  const ConfidenceBadge = ({ confidence }: { confidence: number }) => {
    // Color coding: green > 80, yellow 60-80, orange < 60
    // Since we only use Bitcoin Sovereign colors (black, orange, white), we'll use opacity variations
    const getConfidenceStyle = () => {
      if (confidence > 80) {
        // High confidence - solid orange with strong glow
        return 'bg-bitcoin-orange text-bitcoin-black shadow-[0_0_20px_rgba(247,147,26,0.6)]';
      } else if (confidence >= 60) {
        // Medium confidence - orange with medium glow
        return 'bg-bitcoin-orange text-bitcoin-black shadow-[0_0_15px_rgba(247,147,26,0.4)]';
      } else {
        // Low confidence - orange outline with subtle glow
        return 'border-2 border-bitcoin-orange text-bitcoin-orange shadow-[0_0_10px_rgba(247,147,26,0.3)]';
      }
    };
    
    return (
      <span className={`px-3 py-1.5 rounded font-bold text-xs uppercase font-mono ${getConfidenceStyle()}`}>
        {confidence}% Confidence
      </span>
    );
  };

  // ThinkingSection component for displaying AI reasoning process
  const ThinkingSection = ({ thinking, txHash }: { thinking: string; txHash: string }) => {
    const isExpanded = expandedThinking[txHash] || false;
    const shouldTruncate = thinking.length > 500;
    const displayText = shouldTruncate && !isExpanded 
      ? thinking.substring(0, 500) + '...' 
      : thinking;
    
    return (
      <div className="mt-4 border-t border-bitcoin-orange-20 pt-4">
        <button
          onClick={() => setExpandedThinking(prev => ({ ...prev, [txHash]: !prev[txHash] }))}
          className="flex items-center gap-2 text-bitcoin-orange hover:text-bitcoin-white transition-colors w-full text-left"
          aria-expanded={isExpanded}
          aria-label="Toggle AI reasoning process"
        >
          <Brain className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold text-base">AI Reasoning Process</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 ml-auto flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-auto flex-shrink-0" />
          )}
        </button>
        
        {isExpanded && (
          <div className="mt-3 p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
            <p className="text-bitcoin-white-80 text-sm whitespace-pre-wrap font-mono leading-relaxed">
              {displayText}
            </p>
            {shouldTruncate && !isExpanded && (
              <button
                onClick={() => setExpandedThinking(prev => ({ ...prev, [txHash]: true }))}
                className="mt-2 text-bitcoin-orange hover:text-bitcoin-white text-sm font-semibold transition-colors"
              >
                Show More →
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // DeepDiveButton component - shows for transactions >= 100 BTC
  const DeepDiveButton = ({ 
    whale, 
    onAnalyze, 
    isAnalyzing,
    isDisabled 
  }: { 
    whale: WhaleTransaction; 
    onAnalyze: () => void; 
    isAnalyzing: boolean;
    isDisabled: boolean;
  }) => {
    const shouldShowDeepDive = whale.amount >= 100;
    
    if (!shouldShowDeepDive) return null;
    
    return (
      <button
        onClick={onAnalyze}
        disabled={isAnalyzing || isDisabled}
        className={`flex items-center justify-center gap-2 px-4 py-3 bg-bitcoin-orange text-bitcoin-black 
                   font-bold rounded-lg hover:bg-bitcoin-black hover:text-bitcoin-orange 
                   border-2 border-bitcoin-orange transition-all disabled:opacity-50 disabled:cursor-not-allowed
                   shadow-[0_0_20px_rgba(247,147,26,0.5)] hover:shadow-[0_0_30px_rgba(247,147,26,0.6)]
                   hover:scale-105 active:scale-95 min-h-[48px] w-full md:w-auto ${
                     isDisabled ? 'pointer-events-none' : ''
                   }`}
        title={isDisabled ? 'Please wait for the current analysis to complete' : 'Deep blockchain analysis with Gemini 2.5 Pro'}
      >
        <Search className="w-5 h-5" />
        <span className="flex flex-col items-start">
          <span className="text-sm uppercase">🔬 Deep Dive Analysis</span>
          <span className="text-xs font-normal opacity-80">Gemini 2.5 Pro + Blockchain Data</span>
        </span>
        {isAnalyzing && <Loader className="w-4 h-4 animate-spin" />}
      </button>
    );
  };

  // DeepDiveProgress component - multi-stage progress indicator with completion percentage
  const DeepDiveProgress = ({ stage, txHash, startTime, onCancel }: { stage: string; txHash: string; startTime?: number; onCancel: () => void }) => {
    const [elapsedTime, setElapsedTime] = useState(0);
    
    const stages = [
      'Fetching blockchain data...',
      'Analyzing transaction history...',
      'Tracing fund flows...',
      'Identifying patterns...',
      'Generating comprehensive analysis...',
    ];
    
    const currentIndex = stages.indexOf(stage);
    const completionPercentage = currentIndex >= 0 ? Math.round(((currentIndex + 1) / stages.length) * 100) : 0;
    
    // Calculate estimated time remaining
    const estimatedTotalTime = 12.5; // Average of 10-15 seconds
    const timePerStage = estimatedTotalTime / stages.length;
    const estimatedTimeRemaining = Math.max(0, Math.round(estimatedTotalTime - (elapsedTime / 1000)));
    
    // Update elapsed time every second
    useEffect(() => {
      if (!startTime) return;
      
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
      
      return () => clearInterval(interval);
    }, [startTime]);
    
    return (
      <div className="p-4 bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg shadow-[0_0_30px_rgba(247,147,26,0.5)] animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <Loader className="w-5 h-5 text-bitcoin-orange animate-spin" />
          <span className="text-bitcoin-white font-bold text-lg">🔬 Deep Dive in Progress</span>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-bitcoin-white-80 font-medium">
              Progress: {completionPercentage}%
            </span>
            <span className="text-sm text-bitcoin-white-60 font-mono">
              {Math.floor(elapsedTime / 1000)}s / ~{Math.round(estimatedTotalTime)}s
            </span>
          </div>
          <div className="w-full h-2 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-bitcoin-orange transition-all duration-500 ease-out shadow-[0_0_10px_rgba(247,147,26,0.5)]"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
        
        {/* Stage List */}
        <div className="space-y-3 mb-4">
          {stages.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              {i < currentIndex && <CheckCircle className="w-5 h-5 text-bitcoin-orange flex-shrink-0" />}
              {i === currentIndex && <Loader className="w-5 h-5 text-bitcoin-orange animate-spin flex-shrink-0" />}
              {i > currentIndex && <Circle className="w-5 h-5 text-bitcoin-white-60 flex-shrink-0" />}
              <span className={`text-sm ${i <= currentIndex ? 'text-bitcoin-white font-medium' : 'text-bitcoin-white-60'}`}>
                {s}
              </span>
            </div>
          ))}
        </div>
        
        {/* Time Estimate */}
        <div className="pt-3 border-t border-bitcoin-orange-20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-bitcoin-white-80">
              ⏱️ Estimated time remaining:
            </p>
            <p className="text-sm text-bitcoin-orange font-bold font-mono">
              ~{estimatedTimeRemaining}s
            </p>
          </div>
          <p className="text-xs text-bitcoin-white-60 text-center mb-3">
            Gemini 2.5 Pro • Extended blockchain analysis • Real transaction data
          </p>
          
          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange 
                     font-bold rounded-lg hover:bg-bitcoin-orange hover:text-bitcoin-black 
                     transition-all shadow-[0_0_15px_rgba(247,147,26,0.3)] 
                     hover:shadow-[0_0_25px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 
                     min-h-[44px] uppercase text-sm"
            title="Cancel Deep Dive and use standard Gemini Flash analysis"
          >
            ✕ Cancel Deep Dive
          </button>
          <p className="text-xs text-bitcoin-white-60 text-center mt-2">
            Will fallback to Gemini 2.5 Flash (instant analysis)
          </p>
        </div>
      </div>
    );
  };

  // DeepDiveResults component - comprehensive analysis display
  const DeepDiveResults = ({ whale }: { whale: WhaleTransaction }) => {
    if (!whale.analysis) return null;
    
    const analysis = whale.analysis;
    
    return (
      <div className="space-y-4">
        {/* Model Badge - Gemini 2.5 Pro Deep Dive */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1.5 bg-bitcoin-orange text-bitcoin-black rounded font-bold text-xs uppercase shadow-[0_0_30px_rgba(247,147,26,0.6)]">
            🔬 Gemini 2.5 Pro - Deep Dive
          </span>
          {whale.metadata?.processingTime && (
            <span className="flex items-center gap-1 text-bitcoin-white-60 text-xs font-mono">
              <Clock className="w-3 h-3" />
              {whale.metadata.processingTime}ms
            </span>
          )}
          {whale.metadata?.dataSourcesUsed && (
            <span className="text-bitcoin-white-60 text-xs">
              • {whale.metadata.dataSourcesUsed.join(', ')}
            </span>
          )}
        </div>
        
        {/* Data Source Limitations Warning (if any) */}
        {whale.metadata?.dataSourceLimitations && whale.metadata.dataSourceLimitations.length > 0 && (
          <div className="p-4 bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-bitcoin-orange flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-bitcoin-orange font-bold mb-2 flex items-center gap-2">
                  ⚠️ Data Source Limitations
                </h4>
                <p className="text-bitcoin-white-80 text-sm mb-3">
                  The following limitations apply to this analysis:
                </p>
                <ul className="space-y-2">
                  {whale.metadata.dataSourceLimitations.map((limitation: string, idx: number) => (
                    <li key={idx} className="text-bitcoin-white-80 text-sm flex items-start gap-2">
                      <span className="text-bitcoin-orange font-bold flex-shrink-0">•</span>
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-bitcoin-white-60 text-xs mt-3 italic">
                  Analysis confidence may be adjusted to reflect these limitations.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Blockchain Data Availability Status */}
        {whale.metadata?.blockchainDataAvailable !== undefined && (
          <div className={`p-3 rounded-lg border ${
            whale.metadata.blockchainDataAvailable 
              ? 'bg-bitcoin-black border-bitcoin-orange-20' 
              : 'bg-bitcoin-black border-bitcoin-orange'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              {whale.metadata.blockchainDataAvailable ? (
                <>
                  <CheckCircle className="w-4 h-4 text-bitcoin-orange" />
                  <span className="text-bitcoin-white-80">
                    ✅ Complete blockchain data available for both addresses
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-bitcoin-orange" />
                  <span className="text-bitcoin-white-80">
                    ⚠️ Limited blockchain data - analysis based on available information
                  </span>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Address Behavior Section */}
        {analysis.address_behavior && (
          <div className="p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
            <h4 className="text-bitcoin-white font-bold mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-bitcoin-orange" />
              Address Behavior Analysis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-bitcoin-white-60 text-sm mb-1 uppercase font-semibold">Source Address</p>
                <p className="text-bitcoin-orange font-bold text-lg mb-2">
                  {analysis.address_behavior.source_classification}
                </p>
                <p className="text-bitcoin-white-80 text-sm leading-relaxed">
                  {analysis.address_behavior.source_strategy}
                </p>
              </div>
              <div>
                <p className="text-bitcoin-white-60 text-sm mb-1 uppercase font-semibold">Destination Address</p>
                <p className="text-bitcoin-orange font-bold text-lg mb-2">
                  {analysis.address_behavior.destination_classification}
                </p>
                <p className="text-bitcoin-white-80 text-sm leading-relaxed">
                  {analysis.address_behavior.destination_strategy}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Fund Flow Analysis */}
        {analysis.fund_flow_analysis && (
          <div className="p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
            <h4 className="text-bitcoin-white font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-bitcoin-orange" />
              Fund Flow Tracing
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-bitcoin-white-60 text-sm uppercase font-semibold mb-1">Origin Hypothesis</p>
                <p className="text-bitcoin-white-80 text-sm leading-relaxed">{analysis.fund_flow_analysis.origin_hypothesis}</p>
              </div>
              <div>
                <p className="text-bitcoin-white-60 text-sm uppercase font-semibold mb-1">Destination Hypothesis</p>
                <p className="text-bitcoin-white-80 text-sm leading-relaxed">{analysis.fund_flow_analysis.destination_hypothesis}</p>
              </div>
              {analysis.fund_flow_analysis.mixing_detected && (
                <div className="p-3 bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded">
                  <p className="text-bitcoin-orange font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    ⚠️ Mixing Behavior Detected
                  </p>
                </div>
              )}
              {analysis.fund_flow_analysis.cluster_analysis && (
                <div>
                  <p className="text-bitcoin-white-60 text-sm uppercase font-semibold mb-1">Cluster Analysis</p>
                  <p className="text-bitcoin-white-80 text-sm leading-relaxed">{analysis.fund_flow_analysis.cluster_analysis}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Market Prediction */}
        {analysis.market_prediction && (
          <div className="p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
            <h4 className="text-bitcoin-white font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-bitcoin-orange" />
              Market Prediction
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-bitcoin-white-60 text-sm uppercase font-semibold mb-1">24-Hour Outlook</p>
                <p className="text-bitcoin-white-80 text-sm leading-relaxed">{analysis.market_prediction.short_term_24h}</p>
              </div>
              <div>
                <p className="text-bitcoin-white-60 text-sm uppercase font-semibold mb-1">7-Day Outlook</p>
                <p className="text-bitcoin-white-80 text-sm leading-relaxed">{analysis.market_prediction.medium_term_7d}</p>
              </div>
              {analysis.market_prediction.key_price_levels && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-bitcoin-orange-20">
                  <div>
                    <p className="text-bitcoin-white-60 text-sm uppercase font-semibold mb-2">Support Levels</p>
                    <div className="space-y-1">
                      {analysis.market_prediction.key_price_levels.support.map((level: number, i: number) => (
                        <p key={i} className="text-bitcoin-orange font-mono font-bold text-lg">
                          ${level.toLocaleString()}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-bitcoin-white-60 text-sm uppercase font-semibold mb-2">Resistance Levels</p>
                    <div className="space-y-1">
                      {analysis.market_prediction.key_price_levels.resistance.map((level: number, i: number) => (
                        <p key={i} className="text-bitcoin-orange font-mono font-bold text-lg">
                          ${level.toLocaleString()}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {analysis.market_prediction.probability_further_movement !== undefined && (
                <div className="pt-3 border-t border-bitcoin-orange-20">
                  <p className="text-bitcoin-white-60 text-sm uppercase font-semibold mb-1">Probability of Further Movement</p>
                  <p className="text-bitcoin-orange font-mono font-bold text-2xl">
                    {analysis.market_prediction.probability_further_movement}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Strategic Intelligence */}
        {analysis.strategic_intelligence && (
          <div className="p-4 bg-bitcoin-orange text-bitcoin-black rounded-lg shadow-[0_0_30px_rgba(247,147,26,0.5)]">
            <h4 className="font-bold mb-3 text-lg">💡 Strategic Intelligence</h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Intent:</strong> {analysis.strategic_intelligence.intent}
              </div>
              <div>
                <strong>Sentiment:</strong> {analysis.strategic_intelligence.sentiment_indicator}
              </div>
              <div>
                <strong>Positioning:</strong> {analysis.strategic_intelligence.trader_positioning}
              </div>
              <div>
                <strong>Risk/Reward:</strong> {analysis.strategic_intelligence.risk_reward_ratio}
              </div>
            </div>
          </div>
        )}
        
        {/* Standard Analysis Sections */}
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-semibold text-bitcoin-white">Type:</span>
            <span className="ml-2 text-bitcoin-orange font-mono">{analysis.transaction_type?.replace(/_/g, ' ').toUpperCase()}</span>
          </div>
          
          <div>
            <span className="font-semibold text-bitcoin-white">Reasoning:</span>
            <p className="text-bitcoin-white-80 mt-1 leading-relaxed">{analysis.reasoning}</p>
          </div>
          
          {analysis.key_findings && analysis.key_findings.length > 0 && (
            <div>
              <span className="font-semibold text-bitcoin-white">Key Findings:</span>
              <ul className="mt-1 space-y-1">
                {analysis.key_findings.map((finding: string, idx: number) => (
                  <li key={idx} className="text-bitcoin-white-80">• {finding}</li>
                ))}
              </ul>
            </div>
          )}
          
          {analysis.trader_action && (
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded p-3 mt-3">
              <span className="font-semibold text-bitcoin-orange">💡 Trader Action:</span>
              <p className="text-bitcoin-white-80 mt-1 leading-relaxed">{analysis.trader_action}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const fetchWhaleData = async () => {
    // Guard clause: Prevent execution if any analysis is already in progress
    if (analyzingTx !== null || whaleData?.whales.some(w => w.analysisStatus === 'analyzing')) {
      console.log('⚠️ Cannot refresh while analysis is in progress');
      return;
    }
    
    // Guard clause: Prevent execution if already loading
    if (loading) {
      console.log('⚠️ Already loading whale data');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/whale-watch/detect?threshold=50');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setWhaleData(data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch whale data');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch whale data';
      setError(errorMsg);
      console.error('Whale detection error:', err);
      // Don't clear existing data on error
    } finally {
      setLoading(false);
    }
  };

  const cancelDeepDive = async (whale: WhaleTransaction) => {
    console.log('🚫 Cancelling Deep Dive analysis for', whale.txHash);
    
    // Abort the fetch request if it exists
    const abortController = deepDiveAbortControllers[whale.txHash];
    if (abortController) {
      abortController.abort();
      console.log('✅ Aborted Deep Dive fetch request');
    }
    
    // Clear progress and start time
    setDeepDiveProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[whale.txHash];
      return newProgress;
    });
    setDeepDiveStartTime(prev => {
      const newStartTime = { ...prev };
      delete newStartTime[whale.txHash];
      return newStartTime;
    });
    setDeepDiveAbortControllers(prev => {
      const newControllers = { ...prev };
      delete newControllers[whale.txHash];
      return newControllers;
    });
    
    // Reset analyzing state
    setAnalyzingTx(null);
    
    // Reset whale status to allow new analysis
    if (whaleData) {
      const updatedWhales = whaleData.whales.map(w =>
        w.txHash === whale.txHash
          ? { ...w, analysisStatus: undefined, analysisProvider: undefined }
          : w
      );
      setWhaleData({ ...whaleData, whales: updatedWhales });
    }
    
    console.log('🔄 Falling back to Gemini 2.5 Flash analysis...');
    
    // Fallback to standard Gemini Flash analysis
    await analyzeTransaction(whale, 'gemini');
  };

  const analyzeDeepDive = async (whale: WhaleTransaction) => {
    // Guard clause: Prevent execution if any analysis is already in progress
    if (analyzingTx !== null || whaleData?.whales.some(w => w.analysisStatus === 'analyzing')) {
      console.log('⚠️ Analysis already in progress, ignoring click');
      return;
    }
    
    try {
      // Immediately set analyzing state to prevent race condition
      setAnalyzingTx(whale.txHash);
      
      // Track start time for progress calculation
      const startTime = Date.now();
      setDeepDiveStartTime(prev => ({ ...prev, [whale.txHash]: startTime }));
      
      // Set initial progress stage
      setDeepDiveProgress(prev => ({ ...prev, [whale.txHash]: 'Fetching blockchain data...' }));
      
      // Update whale status to 'analyzing' with deep-dive provider
      if (whaleData) {
        const updatedWhales = whaleData.whales.map(w =>
          w.txHash === whale.txHash
            ? { ...w, analysisStatus: 'analyzing' as const, analysisProvider: 'gemini-deep-dive' as const }
            : w
        );
        setWhaleData({ ...whaleData, whales: updatedWhales });
      }
      
      console.log('🔬 Starting Deep Dive analysis (synchronous with extended timeout)...');
      console.log(`📡 API Endpoint: /api/whale-watch/deep-dive-gemini`);
      console.log(`⏱️ Start time: ${new Date(startTime).toISOString()}`);
      
      // Simulate progress stages
      const progressStages = [
        'Fetching blockchain data...',
        'Analyzing transaction history...',
        'Tracing fund flows...',
        'Identifying patterns...',
        'Generating comprehensive analysis...',
      ];
      
      let currentStage = 0;
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length - 1) {
          currentStage++;
          setDeepDiveProgress(prev => ({ ...prev, [whale.txHash]: progressStages[currentStage] }));
          console.log(`📊 Progress: Stage ${currentStage + 1}/${progressStages.length} - ${progressStages[currentStage]}`);
        }
      }, 3000);
      
      // Call Deep Dive API with extended timeout
      const response = await fetch('/api/whale-watch/deep-dive-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whale),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error(`Deep Dive API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.analysis) {
        console.log('✅ Deep Dive analysis completed');
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);
        console.log(`✅ Deep Dive completed in ${duration}s`);
        
        if (whaleData) {
          const updatedWhales = whaleData.whales.map(w =>
            w.txHash === whale.txHash
              ? { 
                  ...w, 
                  analysis: data.analysis,
                  blockchainData: data.blockchainData,
                  metadata: data.metadata,
                  analysisStatus: 'completed' as const,
                  analysisProvider: 'gemini-deep-dive' as const
                }
              : w
          );
          setWhaleData({ ...whaleData, whales: updatedWhales });
        }
        
        // Clear progress and start time
        setDeepDiveProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[whale.txHash];
          return newProgress;
        });
        setDeepDiveStartTime(prev => {
          const newStartTime = { ...prev };
          delete newStartTime[whale.txHash];
          return newStartTime;
        });
      } else {
        throw new Error(data.error || 'Failed to get Deep Dive analysis');
      }
      
    } catch (error) {
      console.error('Failed to start Deep Dive analysis:', error);
      
      // Mark as failed
      if (whaleData) {
        const updatedWhales = whaleData.whales.map(w =>
          w.txHash === whale.txHash
            ? { ...w, analysisStatus: 'failed' as const }
            : w
        );
        setWhaleData({ ...whaleData, whales: updatedWhales });
      }
      
      // Clear progress and start time
      setDeepDiveProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[whale.txHash];
        return newProgress;
      });
      setDeepDiveStartTime(prev => {
        const newStartTime = { ...prev };
        delete newStartTime[whale.txHash];
        return newStartTime;
      });
      
      setAnalyzingTx(null);
    }
  };
  


  const analyzeTransaction = async (whale: WhaleTransaction, provider: 'caesar' | 'gemini' = 'caesar') => {
    // Guard clause: Prevent execution if any analysis is already in progress
    if (analyzingTx !== null || whaleData?.whales.some(w => w.analysisStatus === 'analyzing')) {
      console.log('⚠️ Analysis already in progress, ignoring click');
      return;
    }
    
    try {
      // Immediately set analyzing state to prevent race condition
      setAnalyzingTx(whale.txHash);
      
      // Also immediately update the whale status to 'analyzing' to lock UI
      if (whaleData) {
        const updatedWhales = whaleData.whales.map(w =>
          w.txHash === whale.txHash
            ? { ...w, analysisStatus: 'analyzing' as const, analysisProvider: provider }
            : w
        );
        setWhaleData({ ...whaleData, whales: updatedWhales });
      }
      
      // Choose API endpoint based on provider
      const apiEndpoint = provider === 'gemini' 
        ? '/api/whale-watch/analyze-gemini'
        : '/api/whale-watch/analyze';
      
      console.log(`🤖 Starting ${provider === 'gemini' ? 'Gemini' : 'Caesar'} AI analysis...`);
      console.log(`📡 API Endpoint: ${apiEndpoint}`);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whale),
      });
      
      if (!response.ok) {
        throw new Error(`Analysis API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // GEMINI: Synchronous response (returns analysis immediately)
      if (provider === 'gemini' && data.success && data.analysis) {
        console.log(`✅ Gemini analysis completed synchronously`);
        
        // Update whale with completed analysis immediately
        if (whaleData) {
          const updatedWhales = whaleData.whales.map(w =>
            w.txHash === whale.txHash
              ? { 
                  ...w, 
                  analysis: data.analysis,
                  thinking: data.thinking,
                  thinkingEnabled: data.metadata?.thinkingEnabled,
                  metadata: data.metadata,
                  analysisStatus: 'completed' as const,
                  analysisProvider: provider
                }
              : w
          );
          setWhaleData({ ...whaleData, whales: updatedWhales });
        }
      }
      // CAESAR: Async response (returns jobId for polling)
      else if (provider === 'caesar' && data.success && data.jobId) {
        console.log(`✅ Caesar job created: ${data.jobId}`);
        
        // Update whale with job ID (keep analyzing status)
        if (whaleData) {
          const updatedWhales = whaleData.whales.map(w =>
            w.txHash === whale.txHash
              ? { ...w, analysisJobId: data.jobId, analysisStatus: 'analyzing' as const }
              : w
          );
          setWhaleData({ ...whaleData, whales: updatedWhales });
        }
        
        // Poll for Caesar results
        pollAnalysis(whale.txHash, data.jobId);
      } else {
        throw new Error(data.error || `Failed to start ${provider === 'gemini' ? 'Gemini' : 'Caesar'} analysis`);
      }
    } catch (error) {
      console.error('Failed to start analysis:', error);
      // Mark as failed
      if (whaleData) {
        const updatedWhales = whaleData.whales.map(w =>
          w.txHash === whale.txHash
            ? { ...w, analysisStatus: 'failed' as const }
            : w
        );
        setWhaleData({ ...whaleData, whales: updatedWhales });
      }
    } finally {
      setAnalyzingTx(null);
    }
  };

  const startDeepDive = async (whale: WhaleTransaction) => {
    // Guard clause: Prevent execution if any analysis is already in progress
    if (analyzingTx !== null || whaleData?.whales.some(w => w.analysisStatus === 'analyzing' || w.deepDiveStatus === 'analyzing')) {
      console.log('⚠️ Analysis already in progress, ignoring Deep Dive request');
      return;
    }
    
    try {
      console.log(`🔬 Starting Deep Dive analysis for ${whale.txHash.substring(0, 20)}...`);
      
      // Update whale status to analyzing
      if (whaleData) {
        const updatedWhales = whaleData.whales.map(w =>
          w.txHash === whale.txHash
            ? { ...w, deepDiveStatus: 'analyzing' as const }
            : w
        );
        setWhaleData({ ...whaleData, whales: updatedWhales });
      }
      
      const response = await fetch('/api/whale-watch/deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: whale.txHash,
          amount: whale.amount,
          fromAddress: whale.fromAddress,
          toAddress: whale.toAddress,
          timestamp: whale.timestamp,
          initialAnalysis: whale.analysis,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Deep Dive API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.analysis) {
        console.log(`✅ Deep Dive analysis completed`);
        
        // Update whale with deep dive results
        if (whaleData) {
          const updatedWhales = whaleData.whales.map(w =>
            w.txHash === whale.txHash
              ? { 
                  ...w, 
                  deepDiveStatus: 'completed' as const,
                  deepDiveAnalysis: data.analysis,
                  blockchainData: data.blockchainData,
                }
              : w
          );
          setWhaleData({ ...whaleData, whales: updatedWhales });
        }
      } else {
        throw new Error(data.error || 'Deep Dive analysis failed');
      }
    } catch (error) {
      console.error('Failed to start Deep Dive:', error);
      
      // Mark as failed
      if (whaleData) {
        const updatedWhales = whaleData.whales.map(w =>
          w.txHash === whale.txHash
            ? { ...w, deepDiveStatus: 'failed' as const }
            : w
        );
        setWhaleData({ ...whaleData, whales: updatedWhales });
      }
    }
  };

  const pollGeminiAnalysis = async (txHash: string, jobId: string) => {
    const maxAttempts = 10; // 10 minutes max (10 attempts × 60 seconds = 600 seconds)
    let attempts = 0;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.error('❌ Gemini analysis polling timeout after', attempts, 'attempts');
        // Mark as failed after timeout
        setWhaleData(prev => {
          if (!prev) return prev;
          const updatedWhales = prev.whales.map(w =>
            w.txHash === txHash
              ? { ...w, analysisStatus: 'failed' as const }
              : w
          );
          return { ...prev, whales: updatedWhales };
        });
        return;
      }
      attempts++;
      
      console.log(`📊 Gemini polling attempt ${attempts}/${maxAttempts} for job ${jobId}`);
      
      try {
        const response = await fetch(`/api/whale-watch/gemini-analysis/${jobId}`);
        
        if (!response.ok) {
          console.error(`❌ Gemini polling HTTP error: ${response.status}`);
          throw new Error(`Gemini polling error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'completed' && data.analysis) {
          console.log('✅ Gemini analysis completed');
          // Update whale with completed analysis
          setWhaleData(prev => {
            if (!prev) return prev;
            const updatedWhales = prev.whales.map(w =>
              w.txHash === txHash
                ? { 
                    ...w, 
                    analysis: data.analysis,
                    thinking: data.thinking,
                    thinkingEnabled: data.metadata?.thinkingEnabled,
                    metadata: data.metadata,
                    analysisStatus: 'completed' as const 
                  }
                : w
            );
            return { ...prev, whales: updatedWhales };
          });
          return; // Stop polling
        }
        
        if (data.status === 'failed') {
          console.error('❌ Gemini analysis failed');
          setWhaleData(prev => {
            if (!prev) return prev;
            const updatedWhales = prev.whales.map(w =>
              w.txHash === txHash
                ? { ...w, analysisStatus: 'failed' as const }
                : w
            );
            return { ...prev, whales: updatedWhales };
          });
          return; // Stop polling
        }
        
        // Still processing, poll again after 60 seconds
        console.log(`⏳ Gemini job ${jobId} still ${data.status}, polling again in 60s...`);
        setTimeout(poll, 60000); // 60 second interval
        
      } catch (error) {
        console.error('❌ Gemini polling error:', error);
        // Retry after 60 seconds
        setTimeout(poll, 60000);
      }
    };
    
    // Start polling
    poll();
  };

  const pollAnalysis = async (txHash: string, jobId: string) => {
    const maxAttempts = 10; // 10 minutes max (10 attempts × 60 seconds = 600 seconds)
    let attempts = 0;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.error('❌ Caesar analysis polling timeout after', attempts, 'attempts');
        // Mark as failed after timeout
        setWhaleData(prev => {
          if (!prev) return prev;
          const updatedWhales = prev.whales.map(w =>
            w.txHash === txHash
              ? { ...w, analysisStatus: 'failed' as const }
              : w
          );
          return { ...prev, whales: updatedWhales };
        });
        return;
      }
      attempts++;
      
      console.log(`📊 Caesar polling attempt ${attempts}/${maxAttempts} for job ${jobId}`);
      
      try {
        const response = await fetch(`/api/whale-watch/analysis/${jobId}`);
        
        if (!response.ok) {
          console.error(`❌ Caesar polling HTTP error: ${response.status}`);
          throw new Error(`Caesar polling error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`📡 Poll response:`, JSON.stringify(data, null, 2));
        
        // Check if API call itself failed
        if (data.success === false) {
          console.error('❌ API returned success: false', data.error);
          throw new Error(data.error || 'API request failed');
        }
        
        if (data.status === 'completed' && data.analysis) {
          console.log('✅ Analysis completed!', data.analysis);
          // Update whale with completed analysis
          setWhaleData(prev => {
            if (!prev) return prev;
            const updatedWhales = prev.whales.map(w =>
              w.txHash === txHash
                ? { ...w, analysis: data.analysis, analysisStatus: 'completed' as const, sources: data.sources }
                : w
            );
            return { ...prev, whales: updatedWhales };
          });
        } else if (data.status === 'failed' || data.status === 'cancelled' || data.status === 'expired') {
          console.error(`❌ Analysis ${data.status} on server`);
          // Mark as failed
          setWhaleData(prev => {
            if (!prev) return prev;
            const updatedWhales = prev.whales.map(w =>
              w.txHash === txHash
                ? { ...w, analysisStatus: 'failed' as const }
                : w
            );
            return { ...prev, whales: updatedWhales };
          });
        } else {
          console.log(`⏳ Still ${data.status}, polling again in 60s...`);
          // Still processing, poll again in 60 seconds
          setTimeout(poll, 60000);
        }
      } catch (error) {
        console.error('❌ Polling error:', error);
        // Don't retry on error - just mark as failed
        console.error('❌ Marking analysis as failed due to polling error');
        setWhaleData(prev => {
          if (!prev) return prev;
          const updatedWhales = prev.whales.map(w =>
            w.txHash === txHash
              ? { ...w, analysisStatus: 'failed' as const }
              : w
          );
          return { ...prev, whales: updatedWhales };
        });
      }
    };
    
    poll();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'exchange_deposit':
        return 'from-red-500 to-red-600';
      case 'exchange_withdrawal':
        return 'from-green-500 to-green-600';
      case 'whale_to_whale':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exchange_deposit':
        return <TrendingDown className="h-6 w-6" />;
      case 'exchange_withdrawal':
        return <TrendingUp className="h-6 w-6" />;
      default:
        return <Activity className="h-6 w-6" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'exchange_deposit':
        return 'Exchange Deposit';
      case 'exchange_withdrawal':
        return 'Exchange Withdrawal';
      case 'whale_to_whale':
        return 'Whale Transfer';
      default:
        return 'Unknown';
    }
  };

  const getImpactBadge = (type: string) => {
    switch (type) {
      case 'exchange_deposit':
        return <span className="px-2 py-1 bg-bitcoin-orange text-bitcoin-black text-xs font-bold rounded uppercase">BEARISH</span>;
      case 'exchange_withdrawal':
        return <span className="px-2 py-1 bg-bitcoin-orange text-bitcoin-black text-xs font-bold rounded uppercase">BULLISH</span>;
      default:
        return <span className="px-2 py-1 border border-bitcoin-orange text-bitcoin-orange text-xs font-bold rounded uppercase">NEUTRAL</span>;
    }
  };

  // Initial state - no data loaded yet
  if (!whaleData && !loading && !error) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4 md:p-6 whale-watch-initial-state">
        <div className="flex flex-col items-center justify-center min-h-[400px] md:min-h-[300px] py-6">
          <div className="text-center max-w-2xl w-full px-2">
            {/* Whale emoji - properly sized for mobile */}
            <div className="text-5xl md:text-6xl mb-6 md:mb-4">🐋</div>
            
            {/* Title */}
            <h3 className="text-xl md:text-2xl font-bold text-bitcoin-white mb-3 md:mb-2">
              Bitcoin Whale Watch
            </h3>
            
            {/* Description */}
            <p className="text-sm md:text-base text-bitcoin-white-80 mb-3 md:mb-2 leading-relaxed">
              Click below to scan for large Bitcoin transactions (&gt;50 BTC)
            </p>
            
            {/* Details */}
            <p className="text-xs md:text-sm text-bitcoin-white-60 mb-6 md:mb-6 leading-relaxed px-2">
              AI analysis powered by Caesar API • Analysis takes 5-7 minutes typically (max 10 minutes) • Will timeout if not completed
            </p>
            
            {/* Button */}
            <button
              onClick={fetchWhaleData}
              disabled={loading}
              className="btn-bitcoin-primary px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-bold rounded-lg transition-all w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
              aria-label="Scan for whale transactions"
            >
              🔍 Scan for Whale Transactions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !whaleData) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 text-bitcoin-orange animate-spin mx-auto mb-4" />
            <p className="text-bitcoin-white font-medium">Scanning blockchain for whale transactions...</p>
            <p className="text-bitcoin-white-60 text-sm mt-2">This may take a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-bitcoin-white flex items-center">
            🐋 Bitcoin Whale Watch
          </h2>
          <p className="text-sm text-bitcoin-white-60 mt-1">
            Live tracking of large BTC transactions (&gt;50 BTC) • Caesar AI analysis: 5-7 min (max 10 min timeout)
          </p>
        </div>
        
        <div className="flex items-center space-x-3 md:space-x-4">
          {lastUpdate && (
            <div className="text-right hidden sm:block">
              <div className="text-xs text-bitcoin-white-60">Last Updated</div>
              <div className="text-sm font-medium text-bitcoin-white">
                {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          )}
          <button
            onClick={fetchWhaleData}
            disabled={loading || hasActiveAnalysis}
            className="min-h-[48px] min-w-[48px] p-3 bg-bitcoin-orange text-bitcoin-black rounded-lg hover:bg-bitcoin-black hover:text-bitcoin-orange hover:border-2 hover:border-bitcoin-orange transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            title={hasActiveAnalysis ? "Cannot refresh while analysis is in progress" : "Refresh whale data"}
            aria-label="Refresh whale data"
          >
            <RefreshCw className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active Analysis Banner */}
      {hasActiveAnalysis && (
        <div className="mb-4 bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 animate-pulse">
          <div className="flex items-center">
            <RefreshCw className="h-5 w-5 text-bitcoin-orange animate-spin mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-bitcoin-white font-bold">🤖 Caesar AI Analysis in Progress</p>
              <p className="text-bitcoin-white-80 text-sm">
                Other transactions are temporarily disabled to prevent API overload. This typically takes 5-7 minutes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner (non-blocking) */}
      {error && (
        <div className="mb-4 bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-bitcoin-orange mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-bitcoin-white font-medium">Error loading whale data</p>
              <p className="text-bitcoin-white-80 text-sm">{error}</p>
            </div>
            <button
              onClick={fetchWhaleData}
              className="ml-4 btn-bitcoin-primary px-4 py-2 rounded transition-all text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 hover:shadow-bitcoin-glow transition-all">
          <div className="stat-label text-sm text-bitcoin-white-60 font-medium uppercase">Active Whales</div>
          <div className="stat-value text-3xl font-bold text-bitcoin-orange mt-1 font-mono">{whaleData?.count || 0}</div>
        </div>
        
        <div className="stat-card bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 hover:shadow-bitcoin-glow transition-all">
          <div className="stat-label text-sm text-bitcoin-white-60 font-medium uppercase">Withdrawals</div>
          <div className="stat-value text-3xl font-bold text-bitcoin-orange mt-1 font-mono">
            {whaleData?.whales.filter(w => w.type === 'exchange_withdrawal').length || 0}
          </div>
        </div>
        
        <div className="stat-card bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 hover:shadow-bitcoin-glow transition-all">
          <div className="stat-label text-sm text-bitcoin-white-60 font-medium uppercase">Deposits</div>
          <div className="stat-value text-3xl font-bold text-bitcoin-orange mt-1 font-mono">
            {whaleData?.whales.filter(w => w.type === 'exchange_deposit').length || 0}
          </div>
        </div>
      </div>

      {/* Whale Transactions */}
      {whaleData && whaleData.whales.length > 0 ? (
        <div className="space-y-4">
          {whaleData.whales.map((whale, index) => {
            // Check if this transaction is being analyzed or if another one is
            const isThisAnalyzing = whale.analysisStatus === 'analyzing';
            const isOtherAnalyzing = hasActiveAnalysis && !isThisAnalyzing;
            const isDisabled = isOtherAnalyzing;
            
            return (
            <div
              key={whale.txHash}
              className={`bitcoin-block border-2 rounded-lg p-4 transition-all ${
                isDisabled 
                  ? 'border-bitcoin-orange opacity-30 cursor-not-allowed bg-bitcoin-black pointer-events-none' 
                  : isThisAnalyzing
                  ? 'border-bitcoin-orange shadow-bitcoin-glow bg-bitcoin-black'
                  : 'border-bitcoin-orange hover:shadow-bitcoin-glow bg-bitcoin-black'
              }`}
              style={isDisabled ? { pointerEvents: 'none' } : undefined}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                {/* Left: Icon and Type */}
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-16 h-16 rounded-lg border-2 border-bitcoin-orange bg-bitcoin-black text-bitcoin-orange flex-shrink-0`}>
                    {getTypeIcon(whale.type)}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg font-bold text-bitcoin-white">
                        {getTypeLabel(whale.type)}
                      </span>
                      {getImpactBadge(whale.type)}
                    </div>
                    <p className="text-sm text-bitcoin-white-80">{whale.description}</p>
                    <p className="text-xs text-bitcoin-white-60 mt-1">
                      {new Date(whale.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="text-right">
                  <div className="price-display text-2xl md:text-3xl font-bold text-bitcoin-orange font-mono">
                    {whale.amount.toFixed(2)} BTC
                  </div>
                  <div className="text-lg text-bitcoin-white-80 font-mono">
                    ${(whale.amountUSD / 1000000).toFixed(2)}M
                  </div>
                  <a
                    href={`https://blockchain.com/btc/tx/${whale.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-bitcoin-orange hover:text-bitcoin-white mt-1 inline-block transition-colors"
                  >
                    View on Blockchain →
                  </a>
                </div>
              </div>

              {/* Addresses (Mobile: Collapsed, Desktop: Visible) */}
              <div className="mt-4 pt-4 border-t border-bitcoin-orange-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-bitcoin-white-60 font-medium uppercase">From:</span>
                    <div className="text-bitcoin-white font-mono mt-1 break-all">
                      {whale.fromAddress.substring(0, 20)}...
                    </div>
                  </div>
                  <div>
                    <span className="text-bitcoin-white-60 font-medium uppercase">To:</span>
                    <div className="text-bitcoin-white font-mono mt-1 break-all">
                      {whale.toAddress.substring(0, 20)}...
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis Section */}
              {!whale.analysisJobId && !whale.analysis && (
                <div className="mt-4 pt-4 border-t border-bitcoin-orange">
                  <div className="space-y-3">
                    <p className="text-sm text-bitcoin-white-80 text-center font-semibold">
                      Choose AI Analysis Provider:
                    </p>
                    
                    {/* Deep Dive Button (only for >= 100 BTC) */}
                    {whale.amount >= 100 && (
                      <div className="mb-3">
                        <DeepDiveButton
                          whale={whale}
                          onAnalyze={() => analyzeDeepDive(whale)}
                          isAnalyzing={analyzingTx === whale.txHash}
                          isDisabled={isDisabled}
                        />
                        <p className="text-xs text-bitcoin-white-60 text-center mt-2">
                          🔬 Recommended for large transactions • Includes blockchain data analysis
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Caesar AI Button */}
                      <button
                        onClick={() => analyzeTransaction(whale, 'caesar')}
                        disabled={analyzingTx === whale.txHash || isDisabled}
                        className={`btn-bitcoin-primary py-3 rounded-lg transition-all font-bold uppercase text-sm shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[48px] ${
                          isDisabled
                            ? 'opacity-30 cursor-not-allowed'
                            : ''
                        } disabled:opacity-50`}
                        title={isDisabled ? 'Please wait for the current analysis to complete' : 'Deep research analysis (5-7 min)'}
                      >
                        {analyzingTx === whale.txHash ? (
                          <span className="flex items-center justify-center">
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Starting...
                          </span>
                        ) : (
                          <span className="flex flex-col items-center">
                            <span>🔬 Caesar AI</span>
                            <span className="text-xs font-normal opacity-80">Deep Research</span>
                          </span>
                        )}
                      </button>

                      {/* Gemini AI Button */}
                      <button
                        onClick={() => analyzeTransaction(whale, 'gemini')}
                        disabled={analyzingTx === whale.txHash || isDisabled}
                        className={`btn-bitcoin-secondary py-3 rounded-lg transition-all font-bold uppercase text-sm shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[48px] ${
                          isDisabled
                            ? 'opacity-30 cursor-not-allowed'
                            : ''
                        } disabled:opacity-50`}
                        title={isDisabled ? 'Please wait for the current analysis to complete' : 'Instant AI analysis'}
                      >
                        {analyzingTx === whale.txHash ? (
                          <span className="flex items-center justify-center">
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Starting...
                          </span>
                        ) : (
                          <span className="flex flex-col items-center">
                            <span>⚡ Gemini 2.5 Flash</span>
                            <span className="text-xs font-normal opacity-80">Instant Analysis</span>
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {isDisabled && (
                    <p className="text-xs text-bitcoin-white-60 text-center mt-3">
                      ⏳ Please wait for the current analysis to complete before starting another
                    </p>
                  )}
                </div>
              )}

              {whale.analysisStatus === 'analyzing' && (
                <div className="mt-4 pt-4 border-t border-bitcoin-orange">
                  {whale.analysisProvider === 'gemini-deep-dive' && deepDiveProgress[whale.txHash] ? (
                    <DeepDiveProgress 
                      stage={deepDiveProgress[whale.txHash]} 
                      txHash={whale.txHash}
                      startTime={deepDiveStartTime[whale.txHash]}
                      onCancel={() => cancelDeepDive(whale)}
                    />
                  ) : (
                    <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 shadow-[0_0_30px_rgba(247,147,26,0.5)] animate-pulse">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="flex items-center">
                          <RefreshCw className="h-5 w-5 text-bitcoin-orange animate-spin mr-2" />
                          <span className="text-bitcoin-white font-medium">
                            {whale.analysisProvider === 'gemini' 
                              ? '⚡ Gemini 2.5 Flash is analyzing...' 
                              : whale.analysisProvider === 'caesar'
                              ? '🤖 Caesar AI is researching...'
                              : '🤖 AI Analysis in progress...'}
                          </span>
                        </div>
                        {whale.analysisProvider === 'gemini' ? (
                          <>
                            <p className="text-bitcoin-white-80 text-sm text-center">
                              Deep market intelligence analysis in progress
                            </p>
                            <p className="text-bitcoin-white-60 text-xs text-center">
                              Gemini 2.5 Flash • Advanced reasoning • Typically completes in 2-5 seconds
                            </p>
                          </>
                        ) : whale.analysisProvider === 'caesar' ? (
                          <>
                            <p className="text-bitcoin-white-80 text-sm text-center">
                              This typically takes 5-7 minutes with deep research (max 10 minutes)
                            </p>
                            <p className="text-bitcoin-white-60 text-xs text-center">
                              Checking status every 60 seconds • Analyzing market data, news, and historical patterns
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-bitcoin-white-80 text-sm text-center">
                              AI-powered analysis in progress
                            </p>
                            <p className="text-bitcoin-white-60 text-xs text-center">
                              Processing transaction data and market context
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {whale.analysisStatus === 'failed' && (
                <div className="mt-4 pt-4 border-t border-bitcoin-orange">
                  <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <AlertCircle className="h-5 w-5 text-bitcoin-orange mr-2" />
                      <span className="text-bitcoin-white font-medium">Analysis failed</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <button
                        onClick={() => analyzeTransaction(whale, 'caesar')}
                        disabled={isDisabled}
                        className={`btn-bitcoin-primary px-4 py-2 rounded transition-all text-xs uppercase font-bold shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[44px] ${
                          isDisabled
                            ? 'opacity-30 cursor-not-allowed'
                            : ''
                        }`}
                        title={isDisabled ? 'Please wait for the current analysis to complete' : 'Retry with Caesar AI'}
                      >
                        Retry Caesar AI
                      </button>
                      
                      <button
                        onClick={() => analyzeTransaction(whale, 'gemini')}
                        disabled={isDisabled}
                        className={`btn-bitcoin-secondary px-4 py-2 rounded transition-all text-xs uppercase font-bold shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[44px] ${
                          isDisabled
                            ? 'opacity-30 cursor-not-allowed'
                            : ''
                        }`}
                        title={isDisabled ? 'Please wait for the current analysis to complete' : 'Retry with Gemini AI'}
                      >
                        Retry Gemini AI
                      </button>
                    </div>
                    
                    {isDisabled && (
                      <p className="text-xs text-bitcoin-white-60 mt-2 text-center">
                        Another analysis is in progress. Please wait before retrying.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {whale.analysisStatus === 'completed' && whale.analysis && (
                <div className="mt-4 pt-4 border-t border-bitcoin-orange">
                  <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:shadow-[0_0_40px_rgba(247,147,26,0.6)] transition-all">
                    {/* Show Deep Dive Results if it's a deep dive analysis */}
                    {whale.analysisProvider === 'gemini-deep-dive' ? (
                      <DeepDiveResults whale={whale} />
                    ) : (
                      <>
                        {/* Metadata Header with Model Badge and Confidence */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-3">
                          <div className="space-y-2">
                            {/* Model Badge */}
                            <ModelBadge 
                              model={whale.metadata?.model || whale.analysis.model || (whale.analysisProvider === 'gemini' ? 'gemini-2.5-flash' : 'caesar')}
                              processingTime={whale.metadata?.processingTime}
                            />
                            
                            {/* Reasoning Available Badge */}
                            {whale.thinkingEnabled && whale.thinking && (
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-bitcoin-orange text-bitcoin-black text-xs font-bold rounded uppercase inline-flex items-center gap-1">
                                  <Brain className="w-3 h-3" />
                                  Reasoning Available
                                </span>
                              </div>
                            )}
                            
                            {/* Provider Info */}
                            {whale.analysisProvider === 'gemini' && (
                              <p className="text-xs text-bitcoin-white-60 font-mono">
                                {whale.metadata?.provider || 'Google Gemini'} • {whale.analysis.analysis_type || 'Deep Market Intelligence'}
                              </p>
                            )}
                            {whale.analysisProvider === 'caesar' && (
                              <p className="text-xs text-bitcoin-white-60 font-mono">
                                Caesar AI • Deep Research • Web Sources
                              </p>
                            )}
                            {!whale.analysisProvider && whale.metadata?.provider && (
                              <p className="text-xs text-bitcoin-white-60 font-mono">
                                {whale.metadata.provider} • {whale.metadata.model || 'AI Analysis'}
                              </p>
                            )}
                            
                            {/* Timestamp */}
                            {whale.metadata?.timestamp && (
                              <p className="text-xs text-bitcoin-white-60 font-mono">
                                Analyzed: {new Date(whale.metadata.timestamp).toLocaleString()}
                              </p>
                            )}
                          </div>
                          
                          {/* Confidence Badge */}
                          <div className="flex-shrink-0">
                            <ConfidenceBadge confidence={whale.analysis.confidence || 0} />
                          </div>
                        </div>
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-semibold text-bitcoin-white">Type:</span>
                        <span className="ml-2 text-bitcoin-orange font-mono">{whale.analysis.transaction_type?.replace(/_/g, ' ').toUpperCase()}</span>
                      </div>
                      
                      <div>
                        <span className="font-semibold text-bitcoin-white">Reasoning:</span>
                        <p className="text-bitcoin-white-80 mt-1">{whale.analysis.reasoning}</p>
                      </div>
                      
                      {whale.analysis.key_findings && whale.analysis.key_findings.length > 0 && (
                        <div>
                          <span className="font-semibold text-bitcoin-white">Key Findings:</span>
                          <ul className="mt-1 space-y-1">
                            {whale.analysis.key_findings.map((finding: string, idx: number) => (
                              <li key={idx} className="text-bitcoin-white-80">• {finding}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {whale.analysis.trader_action && (
                        <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded p-3 mt-3">
                          <span className="font-semibold text-bitcoin-orange">💡 Trader Action:</span>
                          <p className="text-bitcoin-white-80 mt-1">{whale.analysis.trader_action}</p>
                        </div>
                      )}
                      
                      {whale.analysis.sources && whale.analysis.sources.length > 0 && (
                        <div className="mt-3">
                          <span className="font-semibold text-bitcoin-white">📚 Sources ({whale.analysis.sources.length}):</span>
                          <div className="mt-2 space-y-1">
                            {whale.analysis.sources.slice(0, 3).map((source: any, idx: number) => (
                              <a
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-bitcoin-orange hover:text-bitcoin-white text-xs transition-colors"
                              >
                                {idx + 1}. {source.title} →
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                        {/* Deep Dive Button - Only show for completed Gemini analyses */}
                        {whale.analysisProvider === 'gemini' && !whale.deepDiveAnalysis && (
                          <div className="mt-4 pt-4 border-t border-bitcoin-orange-20">
                            <button
                              onClick={() => startDeepDive(whale)}
                              disabled={isDisabled || whale.deepDiveStatus === 'analyzing'}
                              className={`w-full btn-bitcoin-primary px-6 py-3 rounded-lg transition-all text-sm uppercase font-bold shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[48px] flex items-center justify-center gap-2 ${
                                isDisabled || whale.deepDiveStatus === 'analyzing'
                                  ? 'opacity-50 cursor-not-allowed'
                                  : ''
                              }`}
                              title="Analyze blockchain history of both addresses for deeper insights"
                            >
                              <Search className="w-5 h-5" />
                              <span className="flex flex-col items-start">
                                <span>🔬 Deep Dive Analysis</span>
                                <span className="text-xs font-normal opacity-80">Blockchain History + Advanced Intelligence</span>
                              </span>
                              {whale.deepDiveStatus === 'analyzing' && <Loader className="w-4 h-4 animate-spin" />}
                            </button>
                            <p className="text-xs text-bitcoin-white-60 text-center mt-2">
                              Analyzes transaction history of both addresses using Gemini 2.5 Pro
                            </p>
                          </div>
                        )}
                        
                        {/* Deep Dive Analysis Results */}
                        {whale.deepDiveAnalysis && (
                          <div className="mt-4 pt-4 border-t border-bitcoin-orange">
                            <div className="bg-bitcoin-orange text-bitcoin-black rounded-lg p-4 mb-4">
                              <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <Search className="w-5 h-5" />
                                🔬 Deep Dive Analysis Complete
                              </h4>
                              <p className="text-sm opacity-90">
                                Comprehensive blockchain history analysis with Gemini 2.5 Pro
                              </p>
                            </div>
                            
                            {/* Address Behavior */}
                            {whale.deepDiveAnalysis.address_behavior && (
                              <div className="mb-4 p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                                <h5 className="text-bitcoin-white font-bold mb-3 flex items-center gap-2">
                                  <Activity className="w-5 h-5 text-bitcoin-orange" />
                                  Address Behavior Analysis
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-bitcoin-white-60 text-sm uppercase font-semibold mb-1">Source Address</p>
                                    <p className="text-bitcoin-orange font-bold text-lg mb-2">
                                      {whale.deepDiveAnalysis.address_behavior.source_classification}
                                    </p>
                                    <p className="text-bitcoin-white-80 text-sm">
                                      {whale.deepDiveAnalysis.address_behavior.source_pattern}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-bitcoin-white-60 text-sm uppercase font-semibold mb-1">Destination Address</p>
                                    <p className="text-bitcoin-orange font-bold text-lg mb-2">
                                      {whale.deepDiveAnalysis.address_behavior.destination_classification}
                                    </p>
                                    <p className="text-bitcoin-white-80 text-sm">
                                      {whale.deepDiveAnalysis.address_behavior.destination_pattern}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Fund Flow Analysis */}
                            {whale.deepDiveAnalysis.fund_flow_analysis && (
                              <div className="mb-4 p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                                <h5 className="text-bitcoin-white font-bold mb-3 flex items-center gap-2">
                                  <TrendingUp className="w-5 h-5 text-bitcoin-orange" />
                                  Fund Flow Tracing
                                </h5>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-bitcoin-white-60 text-sm uppercase font-semibold mb-1">Origin Hypothesis</p>
                                    <p className="text-bitcoin-white-80 text-sm">{whale.deepDiveAnalysis.fund_flow_analysis.origin_hypothesis}</p>
                                  </div>
                                  <div>
                                    <p className="text-bitcoin-white-60 text-sm uppercase font-semibold mb-1">Destination Hypothesis</p>
                                    <p className="text-bitcoin-white-80 text-sm">{whale.deepDiveAnalysis.fund_flow_analysis.destination_hypothesis}</p>
                                  </div>
                                  {whale.deepDiveAnalysis.fund_flow_analysis.mixing_detected && (
                                    <div className="p-3 bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded">
                                      <p className="text-bitcoin-orange font-bold flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        ⚠️ Mixing Behavior Detected
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Market Prediction */}
                            {whale.deepDiveAnalysis.market_prediction && (
                              <div className="mb-4 p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                                <h5 className="text-bitcoin-white font-bold mb-3 flex items-center gap-2">
                                  <TrendingUp className="w-5 h-5 text-bitcoin-orange" />
                                  Market Prediction
                                </h5>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-bitcoin-white-60 text-sm uppercase font-semibold mb-1">24-Hour Outlook</p>
                                    <p className="text-bitcoin-white-80 text-sm">{whale.deepDiveAnalysis.market_prediction.short_term_24h}</p>
                                  </div>
                                  <div>
                                    <p className="text-bitcoin-white-60 text-sm uppercase font-semibold mb-1">7-Day Outlook</p>
                                    <p className="text-bitcoin-white-80 text-sm">{whale.deepDiveAnalysis.market_prediction.medium_term_7d}</p>
                                  </div>
                                  {whale.deepDiveAnalysis.market_prediction.key_price_levels && (
                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-bitcoin-orange-20">
                                      <div>
                                        <p className="text-bitcoin-white-60 text-sm uppercase font-semibold mb-2">Support Levels</p>
                                        {whale.deepDiveAnalysis.market_prediction.key_price_levels.support.map((level: number, i: number) => (
                                          <p key={i} className="text-bitcoin-orange font-mono font-bold text-lg">
                                            ${level.toLocaleString()}
                                          </p>
                                        ))}
                                      </div>
                                      <div>
                                        <p className="text-bitcoin-white-60 text-sm uppercase font-semibold mb-2">Resistance Levels</p>
                                        {whale.deepDiveAnalysis.market_prediction.key_price_levels.resistance.map((level: number, i: number) => (
                                          <p key={i} className="text-bitcoin-orange font-mono font-bold text-lg">
                                            ${level.toLocaleString()}
                                          </p>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Strategic Intelligence */}
                            {whale.deepDiveAnalysis.strategic_intelligence && (
                              <div className="p-4 bg-bitcoin-orange text-bitcoin-black rounded-lg">
                                <h5 className="font-bold mb-3 text-lg">💡 Strategic Intelligence</h5>
                                <div className="space-y-2 text-sm">
                                  <div><strong>Intent:</strong> {whale.deepDiveAnalysis.strategic_intelligence.intent}</div>
                                  <div><strong>Sentiment:</strong> {whale.deepDiveAnalysis.strategic_intelligence.sentiment_indicator}</div>
                                  <div><strong>Positioning:</strong> {whale.deepDiveAnalysis.strategic_intelligence.trader_positioning}</div>
                                  <div><strong>Risk/Reward:</strong> {whale.deepDiveAnalysis.strategic_intelligence.risk_reward_ratio}</div>
                                </div>
                              </div>
                            )}
                            
                            {/* Key Insights */}
                            {whale.deepDiveAnalysis.key_insights && whale.deepDiveAnalysis.key_insights.length > 0 && (
                              <div className="mt-4 p-4 bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg">
                                <h5 className="text-bitcoin-white font-bold mb-3">🎯 Key Insights</h5>
                                <ul className="space-y-2">
                                  {whale.deepDiveAnalysis.key_insights.map((insight: string, idx: number) => (
                                    <li key={idx} className="text-bitcoin-white-80 text-sm flex items-start gap-2">
                                      <span className="text-bitcoin-orange mt-1">•</span>
                                      <span>{insight}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                    
                        {/* Display thinking section if available */}
                        {whale.thinking && whale.thinkingEnabled && (
                          <ThinkingSection thinking={whale.thinking} txHash={whale.txHash} />
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Activity className="h-16 w-16 text-bitcoin-orange mx-auto mb-4" />
          <p className="text-bitcoin-white text-lg font-medium">No whale transactions detected</p>
          <p className="text-bitcoin-white-60 text-sm mt-2">
            Monitoring for transactions &gt;50 BTC
          </p>
        </div>
      )}
    </div>
  );
}
