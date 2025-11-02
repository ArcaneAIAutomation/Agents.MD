import type { NextApiRequest, NextApiResponse } from 'next';

interface ComprehensiveAnalysis {
  symbol: string;
  timestamp: string;
  dataQualityScore: number;
  marketData: any;
  research: any;
  onChain: any;
  sentiment: any;
  news: any;
  technical: any;
  predictions: any;
  risk: any;
  derivatives: any;
  defi: any;
  tokenomics: any;
  regulatory: any;
  anomalies: any;
  consensus: any;
  executiveSummary: any;
}

interface DataSource {
  name: string;
  phase: 1 | 2 | 3 | 4;
  fetch: (symbol: string) => Promise<any>;
  timeout: number;
  required: boolean;
}

/**
 * Main Analysis Orchestration API
 * 
 * Coordinates all data sources with 4-phase parallel fetching:
 * - Phase 1: Critical data (< 1s) - Price, volume, basic info
 * - Phase 2: Important data (1-3s) - News, sentiment
 * - Phase 3: Enhanced data (3-7s) - Technical, on-chain
 * - Phase 4: Deep analysis (7-15s) - AI research, predictions
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ success: false, error: 'Symbol is required' });
  }

  const normalizedSymbol = symbol.toUpperCase();

  try {
    // Initialize analysis structure
    const analysis: Partial<ComprehensiveAnalysis> = {
      symbol: normalizedSymbol,
      timestamp: new Date().toISOString(),
      dataQualityScore: 0,
    };

    // Define data sources with phases
    const dataSources: DataSource[] = [
      // Phase 1: Critical (< 1s)
      {
        name: 'marketData',
        phase: 1,
        fetch: fetchMarketData,
        timeout: 2000,
        required: true,
      },

      // Phase 2: Important (1-3s)
      {
        name: 'news',
        phase: 2,
        fetch: fetchNews,
        timeout: 3000,
        required: false,
      },
      {
        name: 'sentiment',
        phase: 2,
        fetch: fetchSentiment,
        timeout: 3000,
        required: false,
      },

      // Phase 3: Enhanced (3-7s)
      {
        name: 'technical',
        phase: 3,
        fetch: fetchTechnical,
        timeout: 5000,
        required: false,
      },
      {
        name: 'onChain',
        phase: 3,
        fetch: fetchOnChain,
        timeout: 5000,
        required: false,
      },
      {
        name: 'risk',
        phase: 3,
        fetch: fetchRisk,
        timeout: 5000,
        required: false,
      },
      {
        name: 'derivatives',
        phase: 3,
        fetch: fetchDerivatives,
        timeout: 5000,
        required: false,
      },
      {
        name: 'defi',
        phase: 3,
        fetch: fetchDeFi,
        timeout: 5000,
        required: false,
      },

      // Phase 4: Deep Analysis (7-15s)
      {
        name: 'research',
        phase: 4,
        fetch: fetchResearch,
        timeout: 10000,
        required: false,
      },
      {
        name: 'predictions',
        phase: 4,
        fetch: fetchPredictions,
        timeout: 10000,
        required: false,
      },
    ];

    // Execute phases in parallel
    const results = await executePhases(normalizedSymbol, dataSources);

    // Aggregate results into analysis
    Object.assign(analysis, results.data);

    // Generate consensus and executive summary
    analysis.consensus = generateConsensus(analysis);
    analysis.executiveSummary = generateExecutiveSummary(analysis);

    // Calculate data quality score
    analysis.dataQualityScore = calculateDataQuality(results.sources);

    return res.status(200).json({
      success: true,
      analysis,
      metadata: {
        totalSources: dataSources.length,
        successfulSources: results.sources.filter(s => s.success).length,
        failedSources: results.sources.filter(s => !s.success).length,
        dataQuality: analysis.dataQualityScore,
        processingTime: results.processingTime,
      },
    });
  } catch (error: any) {
    console.error('Analysis orchestration error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Analysis failed',
    });
  }
}

/**
 * Execute data fetching in 4 phases with parallel requests
 */
async function executePhases(
  symbol: string,
  dataSources: DataSource[]
): Promise<{
  data: Record<string, any>;
  sources: Array<{ name: string; success: boolean; error?: string }>;
  processingTime: number;
}> {
  const startTime = Date.now();
  const data: Record<string, any> = {};
  const sources: Array<{ name: string; success: boolean; error?: string }> = [];

  // Group sources by phase
  const phases = [1, 2, 3, 4] as const;

  for (const phase of phases) {
    const phaseSources = dataSources.filter(s => s.phase === phase);

    // Execute all sources in this phase in parallel
    const phaseResults = await Promise.allSettled(
      phaseSources.map(source =>
        fetchWithTimeout(source.fetch(symbol), source.timeout, source.name)
      )
    );

    // Process results
    phaseResults.forEach((result, index) => {
      const source = phaseSources[index];

      if (result.status === 'fulfilled') {
        data[source.name] = result.value;
        sources.push({ name: source.name, success: true });
      } else {
        // Handle failure
        const error = result.reason?.message || 'Unknown error';
        console.warn(`${source.name} failed:`, error);

        sources.push({ name: source.name, success: false, error });

        // If required source fails, throw error
        if (source.required) {
          throw new Error(`Required source ${source.name} failed: ${error}`);
        }

        // Set null data for failed optional sources
        data[source.name] = null;
      }
    });
  }

  const processingTime = Date.now() - startTime;

  return { data, sources, processingTime };
}

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  sourceName: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${sourceName} timeout after ${timeout}ms`)), timeout)
    ),
  ]);
}

/**
 * Data fetching functions
 */
async function fetchMarketData(symbol: string): Promise<any> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ucie/market-data/${symbol}`
  );

  if (!response.ok) {
    throw new Error(`Market data fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.marketData || data;
}

async function fetchNews(symbol: string): Promise<any> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ucie/news/${symbol}`
  );

  if (!response.ok) {
    throw new Error(`News fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.news || data;
}

async function fetchSentiment(symbol: string): Promise<any> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ucie/sentiment/${symbol}`
  );

  if (!response.ok) {
    throw new Error(`Sentiment fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.sentiment || data;
}

async function fetchTechnical(symbol: string): Promise<any> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ucie/technical/${symbol}`
  );

  if (!response.ok) {
    throw new Error(`Technical fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.technical || data;
}

async function fetchOnChain(symbol: string): Promise<any> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ucie/on-chain/${symbol}`
  );

  if (!response.ok) {
    throw new Error(`On-chain fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.onChain || data;
}

async function fetchRisk(symbol: string): Promise<any> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ucie/risk/${symbol}`
  );

  if (!response.ok) {
    throw new Error(`Risk fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.risk || data;
}

async function fetchDerivatives(symbol: string): Promise<any> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ucie/derivatives/${symbol}`
  );

  if (!response.ok) {
    throw new Error(`Derivatives fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.derivatives || data;
}

async function fetchDeFi(symbol: string): Promise<any> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ucie/defi/${symbol}`
  );

  if (!response.ok) {
    throw new Error(`DeFi fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.defi || data;
}

async function fetchResearch(symbol: string): Promise<any> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ucie/research/${symbol}`
  );

  if (!response.ok) {
    throw new Error(`Research fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.research || data;
}

async function fetchPredictions(symbol: string): Promise<any> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ucie/predictions/${symbol}`
  );

  if (!response.ok) {
    throw new Error(`Predictions fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.predictions || data;
}

/**
 * Generate consensus recommendation
 */
function generateConsensus(analysis: Partial<ComprehensiveAnalysis>): any {
  const signals: number[] = [];

  // Technical signals
  if (analysis.technical?.multiTimeframeConsensus?.overall) {
    const signal = analysis.technical.multiTimeframeConsensus.overall;
    if (signal === 'strong_buy') signals.push(100);
    else if (signal === 'buy') signals.push(75);
    else if (signal === 'neutral') signals.push(50);
    else if (signal === 'sell') signals.push(25);
    else if (signal === 'strong_sell') signals.push(0);
  }

  // Sentiment signals
  if (analysis.sentiment?.overallScore !== undefined) {
    // Convert -100 to +100 scale to 0-100
    signals.push((analysis.sentiment.overallScore + 100) / 2);
  }

  // Risk signals (inverse - lower risk = higher score)
  if (analysis.risk?.overallScore !== undefined) {
    signals.push(100 - analysis.risk.overallScore);
  }

  // Calculate overall score
  const overallScore = signals.length > 0
    ? Math.round(signals.reduce((a, b) => a + b, 0) / signals.length)
    : 50;

  // Determine recommendation
  let recommendation: string;
  if (overallScore >= 80) recommendation = 'STRONG_BUY';
  else if (overallScore >= 60) recommendation = 'BUY';
  else if (overallScore >= 40) recommendation = 'HOLD';
  else if (overallScore >= 20) recommendation = 'SELL';
  else recommendation = 'STRONG_SELL';

  // Calculate confidence
  const confidence = signals.length >= 3 ? 85 : signals.length >= 2 ? 70 : 50;

  return {
    overallScore,
    recommendation,
    confidence,
    shortTerm: { score: overallScore, signal: recommendation, confidence },
    mediumTerm: { score: overallScore, signal: recommendation, confidence },
    longTerm: { score: overallScore, signal: recommendation, confidence },
    keyFactors: [],
    conflicts: [],
  };
}

/**
 * Generate executive summary
 */
function generateExecutiveSummary(analysis: Partial<ComprehensiveAnalysis>): any {
  const topFindings: string[] = [];
  const opportunities: string[] = [];
  const risks: string[] = [];

  // Add key findings based on available data
  if (analysis.marketData) {
    topFindings.push(
      `Current price: $${analysis.marketData.prices?.vwap?.toLocaleString() || 'N/A'}`
    );
  }

  if (analysis.sentiment?.overallScore !== undefined) {
    const sentiment = analysis.sentiment.overallScore;
    topFindings.push(
      `Social sentiment: ${sentiment > 0 ? 'Positive' : sentiment < 0 ? 'Negative' : 'Neutral'} (${sentiment})`
    );
  }

  if (analysis.risk?.overallScore !== undefined) {
    topFindings.push(`Risk score: ${analysis.risk.overallScore}/100`);
  }

  // Add opportunities
  if (analysis.technical?.tradingSignals && analysis.technical.tradingSignals.length > 0) {
    opportunities.push('Technical indicators show potential entry points');
  }

  if (analysis.sentiment?.overallScore > 50) {
    opportunities.push('Strong positive social sentiment');
  }

  // Add risks
  if (analysis.risk?.overallScore > 70) {
    risks.push('High volatility risk detected');
  }

  if (analysis.onChain?.holderConcentration?.top10Percentage > 50) {
    risks.push('High holder concentration');
  }

  const oneLineSummary = `${analysis.symbol} shows ${
    analysis.consensus?.recommendation || 'NEUTRAL'
  } signals with ${analysis.dataQualityScore}% data quality.`;

  return {
    topFindings,
    opportunities,
    risks,
    actionableInsights: [],
    oneLineSummary,
  };
}

/**
 * Calculate data quality score
 */
function calculateDataQuality(
  sources: Array<{ name: string; success: boolean; error?: string }>
): number {
  if (sources.length === 0) return 0;

  const successCount = sources.filter(s => s.success).length;
  return Math.round((successCount / sources.length) * 100);
}
