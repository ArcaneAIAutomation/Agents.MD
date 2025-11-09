import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Brain, 
  Activity, 
  DollarSign, 
  AlertTriangle,
  Newspaper,
  BarChart3,
  Target,
  Shield,
  Coins,
  Download,
  Share2,
  RefreshCw,
  Bell,
  Star,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import MarketDataPanel from './MarketDataPanel';
import CaesarResearchPanel from './CaesarResearchPanel';
import CaesarAnalysisContainer from './CaesarAnalysisContainer';
import OnChainAnalyticsPanel from './OnChainAnalyticsPanel';
import SocialSentimentPanel from './SocialSentimentPanel';
import NewsPanel from './NewsPanel';
import TechnicalAnalysisPanel from './TechnicalAnalysisPanel';
import PredictiveModelPanel from './PredictiveModelPanel';
import RiskAssessmentPanel from './RiskAssessmentPanel';
import DerivativesPanel from './DerivativesPanel';
import DeFiMetricsPanel from './DeFiMetricsPanel';
import IntelligenceReportGenerator from './IntelligenceReportGenerator';
import DataPreviewModal from './DataPreviewModal';
import { useProgressiveLoading } from '../../hooks/useProgressiveLoading';
import { useUCIEMobile, useAdaptiveRequestStrategy } from '../../hooks/useUCIEMobile';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { useHaptic } from '../../lib/ucie/hapticFeedback';
import PullToRefresh from './PullToRefresh';

interface UCIEAnalysisHubProps {
  symbol: string;
  onBack?: () => void;
}

type TabId = 
  | 'overview'
  | 'market'
  | 'research'
  | 'onchain'
  | 'social'
  | 'news'
  | 'technical'
  | 'predictions'
  | 'risk'
  | 'derivatives'
  | 'defi';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  phase: 1 | 2 | 3 | 4;
}

interface LoadingPhase {
  phase: number;
  label: string;
  progress: number;
  complete: boolean;
}

export default function UCIEAnalysisHub({ symbol, onBack }: UCIEAnalysisHubProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [error, setError] = useState<string | null>(null);
  const [dataQuality, setDataQuality] = useState<number>(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [collapsedSections, setCollapsedSections] = useState<Set<TabId>>(new Set());
  
  // Data Preview Modal State
  const [showPreview, setShowPreview] = useState(true); // Show preview on mount
  const [proceedWithAnalysis, setProceedWithAnalysis] = useState(false);

  // Mobile capabilities
  const mobileCapabilities = useUCIEMobile();
  const requestStrategy = useAdaptiveRequestStrategy();
  const haptic = useHaptic();

  // Define tabs array BEFORE using it
  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" />, phase: 1 },
    { id: 'market', label: 'Market Data', icon: <DollarSign className="w-4 h-4" />, phase: 1 },
    { id: 'research', label: 'AI Research', icon: <Brain className="w-4 h-4" />, phase: 4 },
    { id: 'onchain', label: 'On-Chain', icon: <Activity className="w-4 h-4" />, phase: 3 },
    { id: 'social', label: 'Social', icon: <Share2 className="w-4 h-4" />, phase: 2 },
    { id: 'news', label: 'News', icon: <Newspaper className="w-4 h-4" />, phase: 2 },
    { id: 'technical', label: 'Technical', icon: <BarChart3 className="w-4 h-4" />, phase: 3 },
    { id: 'predictions', label: 'Predictions', icon: <Target className="w-4 h-4" />, phase: 4 },
    { id: 'risk', label: 'Risk', icon: <Shield className="w-4 h-4" />, phase: 3 },
    { id: 'derivatives', label: 'Derivatives', icon: <AlertTriangle className="w-4 h-4" />, phase: 3 },
    { id: 'defi', label: 'DeFi', icon: <Coins className="w-4 h-4" />, phase: 3 },
  ];

  // Swipe gestures for tab navigation (mobile only)
  const currentTabIndex = tabs.findIndex(t => t.id === activeTab);
  
  useSwipeGesture({
    onSwipeLeft: () => {
      if (mobileCapabilities.isMobile && currentTabIndex < tabs.length - 1) {
        setActiveTab(tabs[currentTabIndex + 1].id);
        haptic.swipe();
      }
    },
    onSwipeRight: () => {
      if (mobileCapabilities.isMobile && currentTabIndex > 0) {
        setActiveTab(tabs[currentTabIndex - 1].id);
        haptic.swipe();
      }
    },
  });

  // Progressive loading - only start if user proceeded with analysis
  const {
    phases: loadingPhases,
    loading,
    currentPhase,
    overallProgress,
    data: analysisData,
    refresh: refreshAnalysis,
  } = useProgressiveLoading({
    symbol,
    enabled: proceedWithAnalysis, // Only load if user clicked Continue
    onPhaseComplete: (phase, data) => {
      console.log(`Phase ${phase} completed with data:`, data);
      setLastUpdate(new Date());
    },
    onAllComplete: (allData) => {
      console.log('All phases completed:', allData);
      // Calculate data quality based on successful endpoints
      const totalEndpoints = loadingPhases.reduce((sum, p) => sum + p.endpoints.length, 0);
      const successfulEndpoints = Object.keys(allData).length;
      const quality = Math.round((successfulEndpoints / totalEndpoints) * 100);
      setDataQuality(quality);
    },
    onError: (phase, errorMsg) => {
      console.error(`Phase ${phase} error:`, errorMsg);
      setError(`Phase ${phase} failed: ${errorMsg}`);
    },
  });

  // Handle preview modal actions
  const handlePreviewContinue = () => {
    setShowPreview(false);
    setProceedWithAnalysis(true);
    haptic.buttonPress();
  };

  const handlePreviewCancel = () => {
    setShowPreview(false);
    if (onBack) {
      onBack();
    }
  };

  // Real-time updates (adaptive based on connection and device)
  useEffect(() => {
    if (!realTimeEnabled || !analysisData || !requestStrategy.enableRealTime) return;

    // Adjust interval based on connection quality
    const interval = mobileCapabilities.isMobile ? 10000 : 5000; // 10s mobile, 5s desktop

    const timer = setInterval(() => {
      updateRealTimeData();
    }, interval);

    return () => clearInterval(timer);
  }, [realTimeEnabled, analysisData, symbol, mobileCapabilities.isMobile, requestStrategy.enableRealTime]);

  const updateRealTimeData = async () => {
    try {
      // Only update price data for real-time updates (lightweight)
      const response = await fetch(`/api/ucie/market-data/${encodeURIComponent(symbol)}`, {
        signal: AbortSignal.timeout(requestStrategy.timeout),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && analysisData) {
          // Merge new market data without replacing entire object
          const updatedData = {
            ...analysisData,
            'market-data': data.data || data.marketData,
          };
          setLastUpdate(new Date());
        }
      }
    } catch (err) {
      console.error('Real-time update error:', err);
    }
  };

  const handleRefresh = async () => {
    haptic.refresh();
    refreshAnalysis();
  };

  const toggleSection = (sectionId: TabId) => {
    haptic.selection();
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleTabChange = (tabId: TabId) => {
    haptic.buttonPress();
    setActiveTab(tabId);
  };

  const handleExport = (format: 'pdf' | 'json' | 'markdown') => {
    setShowExportMenu(false);
    // Export functionality will be handled by IntelligenceReportGenerator
    console.log(`Exporting as ${format}...`);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/ucie/analyze/${symbol}`;
    navigator.clipboard.writeText(url);
    setShowShareMenu(false);
    // Show toast notification (implement toast system)
    alert('Link copied to clipboard!');
  };

  const toggleWatchlist = async () => {
    try {
      const response = await fetch('/api/ucie/watchlist', {
        method: isInWatchlist ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });

      if (response.ok) {
        setIsInWatchlist(!isInWatchlist);
      }
    } catch (err) {
      console.error('Watchlist error:', err);
    }
  };

  const renderLoadingPhases = () => (
    <div className="space-y-4">
      {loadingPhases.map((phase) => (
        <div key={phase.phase} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-bitcoin-white-80">
              Phase {phase.phase}: {phase.label}
            </span>
            <span className="text-bitcoin-orange font-mono">
              {phase.progress}%
            </span>
          </div>
          <div className="w-full h-2 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
            <div
              className="h-full bg-bitcoin-orange transition-all duration-500"
              style={{ width: `${phase.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderOverview = () => {
    if (!analysisData) return null;

    const { consensus, executiveSummary, marketData } = analysisData;

    return (
      <div className="space-y-6">
        {/* Executive Summary */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-6">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            Executive Summary
          </h2>
          <div className="space-y-4">
            {executiveSummary?.oneLineSummary && (
              <p className="text-lg text-bitcoin-orange font-semibold">
                {executiveSummary.oneLineSummary}
              </p>
            )}
            
            {/* Consensus Recommendation */}
            {consensus && (
              <div className="flex items-center gap-4 p-4 bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-bitcoin-orange font-mono">
                    {consensus.overallScore}
                  </div>
                  <div className="text-xs text-bitcoin-white-60 uppercase">
                    Score
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold text-bitcoin-white uppercase">
                    {consensus.recommendation}
                  </div>
                  <div className="text-sm text-bitcoin-white-80">
                    Confidence: {consensus.confidence}%
                  </div>
                </div>
              </div>
            )}

            {/* Top Findings */}
            {executiveSummary?.topFindings && executiveSummary.topFindings.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-bitcoin-white mb-3">
                  Key Findings
                </h3>
                <ul className="space-y-2">
                  {executiveSummary.topFindings.map((finding: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-bitcoin-white-80">
                      <span className="text-bitcoin-orange mt-1">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Opportunities & Risks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {executiveSummary?.opportunities && executiveSummary.opportunities.length > 0 && (
                <div className="p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                  <h4 className="text-sm font-bold text-bitcoin-orange mb-2 uppercase">
                    Opportunities
                  </h4>
                  <ul className="space-y-1 text-sm text-bitcoin-white-80">
                    {executiveSummary.opportunities.map((opp: string, index: number) => (
                      <li key={index}>• {opp}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {executiveSummary?.risks && executiveSummary.risks.length > 0 && (
                <div className="p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                  <h4 className="text-sm font-bold text-bitcoin-orange mb-2 uppercase">
                    Risks
                  </h4>
                  <ul className="space-y-1 text-sm text-bitcoin-white-80">
                    {executiveSummary.risks.map((risk: string, index: number) => (
                      <li key={index}>• {risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        {marketData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Price"
              value={`$${marketData.prices?.vwap?.toLocaleString() || 'N/A'}`}
              change={marketData.volume24h}
            />
            <StatCard
              label="Market Cap"
              value={`$${(marketData.marketCap / 1e9).toFixed(2)}B`}
            />
            <StatCard
              label="24h Volume"
              value={`$${(marketData.volume24h / 1e6).toFixed(2)}M`}
            />
            <StatCard
              label="Data Quality"
              value={`${dataQuality}%`}
              highlight={dataQuality >= 90}
            />
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    // Special case: research tab can render without analysisData
    // because CaesarAnalysisContainer handles its own loading
    if (activeTab === 'research') {
      return <CaesarAnalysisContainer 
        symbol={symbol} 
        jobId={analysisData?.research?.jobId}
        progressiveLoadingComplete={!loading}
      />;
    }

    if (!analysisData) return null;

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'market':
        return <MarketDataPanel symbol={symbol} data={analysisData['market-data'] || analysisData.marketData} />;
      case 'research':
        return <CaesarAnalysisContainer 
          symbol={symbol} 
          jobId={analysisData.research?.jobId}
          progressiveLoadingComplete={!loading}
        />;
      case 'onchain':
        return <OnChainAnalyticsPanel symbol={symbol} data={analysisData['on-chain'] || analysisData.onChain} />;
      case 'social':
        return <SocialSentimentPanel symbol={symbol} data={analysisData.sentiment} />;
      case 'news':
        return <NewsPanel symbol={symbol} data={analysisData.news} />;
      case 'technical':
        return <TechnicalAnalysisPanel symbol={symbol} data={analysisData.technical} />;
      case 'predictions':
        return <PredictiveModelPanel symbol={symbol} data={analysisData.predictions} />;
      case 'risk':
        return <RiskAssessmentPanel symbol={symbol} data={analysisData.risk} />;
      case 'derivatives':
        return <DerivativesPanel symbol={symbol} data={analysisData.derivatives} />;
      case 'defi':
        return <DeFiMetricsPanel symbol={symbol} data={analysisData.defi} />;
      default:
        return null;
    }
  };

  // Mobile-optimized: Render all sections as collapsible cards
  const renderMobileView = () => {
    if (!analysisData) return null;

    const sections = [
      { id: 'overview' as TabId, title: 'Overview', icon: <TrendingUp className="w-5 h-5" />, content: renderOverview() },
      { id: 'market' as TabId, title: 'Market Data', icon: <DollarSign className="w-5 h-5" />, content: <MarketDataPanel symbol={symbol} data={analysisData['market-data'] || analysisData.marketData} /> },
      { id: 'risk' as TabId, title: 'Risk Assessment', icon: <Shield className="w-5 h-5" />, content: <RiskAssessmentPanel symbol={symbol} data={analysisData.risk} /> },
      { id: 'news' as TabId, title: 'News & Intelligence', icon: <Newspaper className="w-5 h-5" />, content: <NewsPanel symbol={symbol} data={analysisData.news} /> },
      { id: 'social' as TabId, title: 'Social Sentiment', icon: <Share2 className="w-5 h-5" />, content: <SocialSentimentPanel symbol={symbol} data={analysisData.sentiment} /> },
      { id: 'technical' as TabId, title: 'Technical Analysis', icon: <BarChart3 className="w-5 h-5" />, content: <TechnicalAnalysisPanel symbol={symbol} data={analysisData.technical} /> },
      { id: 'onchain' as TabId, title: 'On-Chain Analytics', icon: <Activity className="w-5 h-5" />, content: <OnChainAnalyticsPanel symbol={symbol} data={analysisData['on-chain'] || analysisData.onChain} /> },
      { id: 'defi' as TabId, title: 'DeFi Metrics', icon: <Coins className="w-5 h-5" />, content: <DeFiMetricsPanel symbol={symbol} data={analysisData.defi} /> },
      { id: 'derivatives' as TabId, title: 'Derivatives', icon: <AlertTriangle className="w-5 h-5" />, content: <DerivativesPanel symbol={symbol} data={analysisData.derivatives} /> },
      { id: 'predictions' as TabId, title: 'Predictions & AI', icon: <Target className="w-5 h-5" />, content: <PredictiveModelPanel symbol={symbol} data={analysisData.predictions} /> },
      { id: 'research' as TabId, title: 'AI Research', icon: <Brain className="w-5 h-5" />, content: <CaesarAnalysisContainer symbol={symbol} jobId={analysisData.research?.jobId} progressiveLoadingComplete={!loading} /> },
    ];

    return (
      <div className="space-y-4">
        {sections.map((section) => {
          const isCollapsed = collapsedSections.has(section.id);
          
          return (
            <div key={section.id} className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl overflow-hidden">
              {/* Collapsible Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 bg-bitcoin-orange-5 border-b-2 border-bitcoin-orange hover:bg-bitcoin-orange-10 transition-colors min-h-[56px]"
              >
                <div className="flex items-center gap-3">
                  <div className="text-bitcoin-orange">
                    {section.icon}
                  </div>
                  <h3 className="text-lg font-bold text-bitcoin-white">
                    {section.title}
                  </h3>
                </div>
                <div className="text-bitcoin-orange">
                  {isCollapsed ? (
                    <ChevronDown className="w-6 h-6" />
                  ) : (
                    <ChevronUp className="w-6 h-6" />
                  )}
                </div>
              </button>

              {/* Collapsible Content */}
              {!isCollapsed && (
                <div className="p-4">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Show Data Preview Modal first
  if (showPreview) {
    return (
      <>
        <DataPreviewModal
          symbol={symbol}
          isOpen={showPreview}
          onContinue={handlePreviewContinue}
          onCancel={handlePreviewCancel}
        />
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bitcoin-black py-4 md:py-8 px-2 md:px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-4 md:p-8">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-bitcoin-white mb-2">
                Analyzing {symbol}
              </h2>
              <p className="text-sm md:text-base text-bitcoin-white-80">
                Fetching data from 15+ sources and running AI analysis...
              </p>
              <div className="mt-4">
                <div className="text-4xl md:text-5xl font-mono font-bold text-bitcoin-orange">
                  {Math.round(overallProgress)}%
                </div>
                <div className="text-sm text-bitcoin-white-60 mt-1">
                  Phase {currentPhase} of 4
                </div>
              </div>
            </div>
            
            {/* Progress Phases */}
            <div className="space-y-3 md:space-y-4">
              {renderLoadingPhases()}
            </div>

            {/* Mobile-specific loading tip */}
            {mobileCapabilities.isMobile && (
              <div className="mt-6 p-3 bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded-lg">
                <p className="text-xs text-bitcoin-white-80 text-center">
                  💡 Tip: Critical data loads first for faster insights
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bitcoin-black py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-bitcoin-orange mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
              Analysis Failed
            </h2>
            <p className="text-bitcoin-white-80 mb-6">
              {error}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRefresh}
                className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange min-h-[48px]"
              >
                Try Again
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black min-h-[48px]"
                >
                  Go Back
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Wrap content in PullToRefresh for mobile
  const content = (
    <div className="min-h-screen bg-bitcoin-black py-4 md:py-8 px-2 md:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 md:gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="text-bitcoin-orange hover:text-bitcoin-white transition-colors min-h-[44px] flex items-center"
                >
                  ← Back
                </button>
              )}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-bitcoin-white">
                {symbol} Analysis
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={toggleWatchlist}
                className={`p-2 rounded-lg border-2 transition-all min-h-[44px] min-w-[44px] ${
                  isInWatchlist
                    ? 'bg-bitcoin-orange text-bitcoin-black border-bitcoin-orange'
                    : 'bg-transparent text-bitcoin-orange border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
                }`}
                title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                <Star className="w-5 h-5" fill={isInWatchlist ? 'currentColor' : 'none'} />
              </button>

              <button
                onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                className={`p-2 rounded-lg border-2 transition-all min-h-[44px] min-w-[44px] ${
                  realTimeEnabled
                    ? 'bg-bitcoin-orange text-bitcoin-black border-bitcoin-orange'
                    : 'bg-transparent text-bitcoin-orange border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
                }`}
                title={realTimeEnabled ? 'Disable real-time updates' : 'Enable real-time updates'}
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg border-2 border-bitcoin-orange bg-transparent text-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black transition-all min-h-[44px] min-w-[44px]"
                title="Refresh analysis"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 rounded-lg border-2 border-bitcoin-orange bg-transparent text-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black transition-all min-h-[44px] min-w-[44px]"
                  title="Export report"
                >
                  <Download className="w-5 h-5" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full text-left px-4 py-2 text-bitcoin-white hover:bg-bitcoin-orange-10 transition-colors"
                    >
                      Export as PDF
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full text-left px-4 py-2 text-bitcoin-white hover:bg-bitcoin-orange-10 transition-colors"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => handleExport('markdown')}
                      className="w-full text-left px-4 py-2 text-bitcoin-white hover:bg-bitcoin-orange-10 transition-colors"
                    >
                      Export as Markdown
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleShare}
                className="p-2 rounded-lg border-2 border-bitcoin-orange bg-transparent text-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black transition-all min-h-[44px] min-w-[44px]"
                title="Share analysis"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Last Update Info */}
          <div className="flex items-center gap-4 text-sm text-bitcoin-white-60">
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            <span>•</span>
            <span>Data Quality: {dataQuality}%</span>
            {realTimeEnabled && (
              <>
                <span>•</span>
                <span className="text-bitcoin-orange">Live Updates Active</span>
              </>
            )}
          </div>
        </div>

        {/* Desktop: Tabs | Mobile: Collapsible Sections */}
        {mobileCapabilities.isDesktop ? (
          <>
            {/* Tabs (Desktop Only) */}
            <div className="mb-6 overflow-x-auto">
              <div className="flex gap-2 min-w-max pb-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all min-h-[44px] whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange'
                        : 'bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content (Desktop) */}
            <div className="mb-8">
              {renderTabContent()}
            </div>
          </>
        ) : (
          <>
            {/* Mobile: Single-Column Collapsible Sections */}
            <div className="mb-6">
              {renderMobileView()}
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Return with pull-to-refresh on mobile
  if (mobileCapabilities.isMobile && !loading && !error) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        {content}
      </PullToRefresh>
    );
  }

  return content;
}

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  highlight?: boolean;
}

function StatCard({ label, value, change, highlight }: StatCardProps) {
  return (
    <div className={`p-4 rounded-lg border-2 ${
      highlight 
        ? 'bg-bitcoin-orange-5 border-bitcoin-orange' 
        : 'bg-bitcoin-black border-bitcoin-orange-20'
    }`}>
      <div className="text-xs text-bitcoin-white-60 uppercase mb-1">
        {label}
      </div>
      <div className="text-xl font-bold text-bitcoin-white font-mono">
        {value}
      </div>
      {change !== undefined && (
        <div className={`text-sm font-semibold ${
          change >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'
        }`}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </div>
      )}
    </div>
  );
}
