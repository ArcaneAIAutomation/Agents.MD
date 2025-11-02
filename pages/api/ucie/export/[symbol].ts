/**
 * UCIE Report Export API Endpoint
 * 
 * Generates comprehensive intelligence reports in PDF, JSON, or Markdown format.
 * Supports customization of included sections and chart inclusion.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface ExportRequest {
  format: 'pdf' | 'json' | 'markdown';
  includeCharts: boolean;
  sections: {
    executiveSummary: boolean;
    marketData: boolean;
    consensus: boolean;
    technical: boolean;
    sentiment: boolean;
    onChain: boolean;
    research: boolean;
    risk: boolean;
    predictions: boolean;
    derivatives: boolean;
    defi: boolean;
  };
  analysisData: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbol } = req.query;
    const { format, includeCharts, sections, analysisData }: ExportRequest = req.body;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Invalid symbol' });
    }

    if (!format || !['pdf', 'json', 'markdown'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format' });
    }

    if (!analysisData) {
      return res.status(400).json({ error: 'Missing analysis data' });
    }

    // Generate report based on format
    switch (format) {
      case 'json':
        return generateJSONReport(res, symbol, sections, analysisData);
      case 'markdown':
        return generateMarkdownReport(res, symbol, sections, analysisData);
      case 'pdf':
        return generatePDFReport(res, symbol, sections, analysisData, includeCharts);
      default:
        return res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
}

/**
 * Generate JSON report
 */
function generateJSONReport(
  res: NextApiResponse,
  symbol: string,
  sections: ExportRequest['sections'],
  analysisData: any
) {
  const report = {
    metadata: {
      symbol,
      generatedAt: new Date().toISOString(),
      format: 'json',
      version: '1.0.0',
    },
    disclaimer:
      'This report is for informational purposes only and does not constitute financial advice. Cryptocurrency investments carry significant risk.',
    data: filterSections(analysisData, sections),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${symbol}_UCIE_Report_${new Date().toISOString().split('T')[0]}.json"`
  );
  return res.status(200).json(report);
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(
  res: NextApiResponse,
  symbol: string,
  sections: ExportRequest['sections'],
  analysisData: any
) {
  const filteredData = filterSections(analysisData, sections);
  let markdown = '';

  // Header
  markdown += `# ${symbol} - UCIE Intelligence Report\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  markdown += `---\n\n`;

  // Executive Summary
  if (sections.executiveSummary && filteredData.executiveSummary) {
    markdown += `## Executive Summary\n\n`;
    markdown += `**${filteredData.executiveSummary.oneLineSummary}**\n\n`;

    markdown += `### Top 5 Findings\n\n`;
    filteredData.executiveSummary.topFindings.forEach((finding: string, i: number) => {
      markdown += `${i + 1}. ${finding}\n`;
    });

    markdown += `\n### Opportunities\n\n`;
    filteredData.executiveSummary.opportunities.forEach((opp: string, i: number) => {
      markdown += `${i + 1}. ${opp}\n`;
    });

    markdown += `\n### Risks\n\n`;
    filteredData.executiveSummary.risks.forEach((risk: string, i: number) => {
      markdown += `${i + 1}. ${risk}\n`;
    });

    markdown += `\n### Actionable Insights\n\n`;
    filteredData.executiveSummary.actionableInsights.forEach((insight: string, i: number) => {
      markdown += `${i + 1}. ${insight}\n`;
    });

    markdown += `\n---\n\n`;
  }

  // Market Data
  if (sections.marketData && filteredData.marketData) {
    markdown += `## Market Data\n\n`;
    markdown += `- **Current Price:** $${filteredData.marketData.prices?.vwap?.toLocaleString() || 'N/A'}\n`;
    markdown += `- **24h Volume:** $${(filteredData.marketData.volume24h / 1e6).toFixed(2)}M\n`;
    markdown += `- **Market Cap:** $${(filteredData.marketData.marketCap / 1e9).toFixed(2)}B\n`;
    markdown += `- **Circulating Supply:** ${filteredData.marketData.circulatingSupply?.toLocaleString() || 'N/A'}\n`;
    markdown += `\n---\n\n`;
  }

  // Consensus
  if (sections.consensus && filteredData.consensus) {
    markdown += `## Consensus Recommendation\n\n`;
    markdown += `- **Overall:** ${filteredData.consensus.recommendation.toUpperCase()}\n`;
    markdown += `- **Score:** ${filteredData.consensus.overallScore}/100\n`;
    markdown += `- **Confidence:** ${filteredData.consensus.confidence}%\n\n`;

    markdown += `### Timeframe Analysis\n\n`;
    markdown += `- **Short-term (1-7d):** ${filteredData.consensus.timeframes.shortTerm.signal.toUpperCase()} (${filteredData.consensus.timeframes.shortTerm.score}/100)\n`;
    markdown += `- **Medium-term (1-4w):** ${filteredData.consensus.timeframes.mediumTerm.signal.toUpperCase()} (${filteredData.consensus.timeframes.mediumTerm.score}/100)\n`;
    markdown += `- **Long-term (1-6m):** ${filteredData.consensus.timeframes.longTerm.signal.toUpperCase()} (${filteredData.consensus.timeframes.longTerm.score}/100)\n`;

    if (filteredData.consensus.keyFactors?.length > 0) {
      markdown += `\n### Key Factors\n\n`;
      filteredData.consensus.keyFactors.forEach((factor: string, i: number) => {
        markdown += `${i + 1}. ${factor}\n`;
      });
    }

    markdown += `\n---\n\n`;
  }

  // Technical Analysis
  if (sections.technical && filteredData.technical) {
    markdown += `## Technical Analysis\n\n`;
    markdown += `- **Signal:** ${filteredData.technical.multiTimeframeConsensus?.overall || 'N/A'}\n`;
    markdown += `- **RSI:** ${filteredData.technical.indicators?.rsi?.value || 'N/A'}\n`;
    markdown += `- **MACD:** ${filteredData.technical.indicators?.macd?.signal || 'N/A'}\n`;
    markdown += `\n---\n\n`;
  }

  // Sentiment Analysis
  if (sections.sentiment && filteredData.sentiment) {
    markdown += `## Social Sentiment\n\n`;
    markdown += `- **Overall Score:** ${filteredData.sentiment.overallScore}/100\n`;
    markdown += `- **Twitter:** ${filteredData.sentiment.twitterSentiment || 'N/A'}\n`;
    markdown += `- **Reddit:** ${filteredData.sentiment.redditSentiment || 'N/A'}\n`;
    markdown += `\n---\n\n`;
  }

  // On-Chain Analytics
  if (sections.onChain && filteredData.onChain) {
    markdown += `## On-Chain Analytics\n\n`;
    markdown += `- **Holder Concentration (Gini):** ${filteredData.onChain.holderConcentration?.giniCoefficient?.toFixed(4) || 'N/A'}\n`;
    markdown += `- **Top 10 Holders:** ${filteredData.onChain.holderConcentration?.top10Percentage?.toFixed(2) || 'N/A'}%\n`;
    markdown += `- **Whale Activity:** ${filteredData.onChain.walletBehavior?.whaleActivity || 'N/A'}\n`;
    markdown += `\n---\n\n`;
  }

  // Risk Assessment
  if (sections.risk && filteredData.risk) {
    markdown += `## Risk Assessment\n\n`;
    markdown += `- **Overall Risk Score:** ${filteredData.risk.overallScore}/100\n`;
    markdown += `- **30-day Volatility:** ${filteredData.risk.volatility?.std30d?.toFixed(2) || 'N/A'}%\n`;
    markdown += `- **BTC Correlation:** ${filteredData.risk.correlations?.btc?.toFixed(2) || 'N/A'}\n`;
    markdown += `\n---\n\n`;
  }

  // Predictions
  if (sections.predictions && filteredData.predictions) {
    markdown += `## Price Predictions\n\n`;
    markdown += `- **24h:** $${filteredData.predictions.price24h?.mid?.toLocaleString() || 'N/A'}\n`;
    markdown += `- **7d:** $${filteredData.predictions.price7d?.mid?.toLocaleString() || 'N/A'}\n`;
    markdown += `- **30d:** $${filteredData.predictions.price30d?.mid?.toLocaleString() || 'N/A'}\n`;
    markdown += `\n---\n\n`;
  }

  // Disclaimer
  markdown += `## Disclaimer\n\n`;
  markdown += `This report is for informational purposes only and does not constitute financial advice. `;
  markdown += `Cryptocurrency investments carry significant risk. Always conduct your own research and `;
  markdown += `consult with a qualified financial advisor before making investment decisions.\n\n`;

  markdown += `---\n\n`;
  markdown += `*Generated by Universal Crypto Intelligence Engine (UCIE)*\n`;
  markdown += `*Timestamp: ${new Date().toISOString()}*\n`;

  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${symbol}_UCIE_Report_${new Date().toISOString().split('T')[0]}.md"`
  );
  return res.status(200).send(markdown);
}

/**
 * Generate PDF report (placeholder - requires jsPDF or similar)
 */
function generatePDFReport(
  res: NextApiResponse,
  symbol: string,
  sections: ExportRequest['sections'],
  analysisData: any,
  includeCharts: boolean
) {
  // For now, return markdown as PDF generation requires additional libraries
  // In production, use jsPDF, pdfkit, or similar library
  
  // Placeholder: Return error indicating PDF generation not yet implemented
  return res.status(501).json({
    error: 'PDF generation not yet implemented',
    message: 'Please use JSON or Markdown format. PDF support coming soon.',
    alternativeFormats: ['json', 'markdown'],
  });
}

/**
 * Filter analysis data based on selected sections
 */
function filterSections(analysisData: any, sections: ExportRequest['sections']): any {
  const filtered: any = {};

  if (sections.executiveSummary && analysisData.executiveSummary) {
    filtered.executiveSummary = analysisData.executiveSummary;
  }

  if (sections.marketData && analysisData.marketData) {
    filtered.marketData = analysisData.marketData;
  }

  if (sections.consensus && analysisData.consensus) {
    filtered.consensus = analysisData.consensus;
  }

  if (sections.technical && analysisData.technical) {
    filtered.technical = analysisData.technical;
  }

  if (sections.sentiment && analysisData.sentiment) {
    filtered.sentiment = analysisData.sentiment;
  }

  if (sections.onChain && analysisData.onChain) {
    filtered.onChain = analysisData.onChain;
  }

  if (sections.research && analysisData.research) {
    filtered.research = analysisData.research;
  }

  if (sections.risk && analysisData.risk) {
    filtered.risk = analysisData.risk;
  }

  if (sections.predictions && analysisData.predictions) {
    filtered.predictions = analysisData.predictions;
  }

  if (sections.derivatives && analysisData.derivatives) {
    filtered.derivatives = analysisData.derivatives;
  }

  if (sections.defi && analysisData.defi) {
    filtered.defi = analysisData.defi;
  }

  return filtered;
}
