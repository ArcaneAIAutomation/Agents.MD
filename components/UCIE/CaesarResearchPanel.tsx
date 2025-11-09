/**
 * Caesar Research Panel Component
 * Displays comprehensive AI-powered research for cryptocurrency tokens
 * 
 * Features:
 * - Technology overview with detailed analysis
 * - Team and leadership information
 * - Partnerships and ecosystem details
 * - Risk factors with visual warnings
 * - Source citations with clickable links
 * - Confidence score visualization
 */

import React from 'react';
import { AlertTriangle, ExternalLink, TrendingUp, Users, Briefcase, Shield, Clock } from 'lucide-react';
import { UCIECaesarResearch } from '../../lib/ucie/caesarClient';

interface CaesarResearchPanelProps {
  symbol: string;
  research: UCIECaesarResearch;
  loading?: boolean;
  error?: string | null;
}

/**
 * Confidence Score Indicator
 */
const ConfidenceIndicator: React.FC<{ confidence: number }> = ({ confidence }) => {
  const getConfidenceColor = (score: number): string => {
    if (score >= 80) return 'text-bitcoin-orange';
    if (score >= 60) return 'text-bitcoin-white';
    return 'text-bitcoin-white-60';
  };

  const getConfidenceLabel = (score: number): string => {
    if (score >= 80) return 'High Confidence';
    if (score >= 60) return 'Medium Confidence';
    if (score >= 40) return 'Low Confidence';
    return 'Very Low Confidence';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60">
            Analysis Confidence
          </span>
          <span className={`text-sm font-bold ${getConfidenceColor(confidence)}`}>
            {confidence}%
          </span>
        </div>
        <div className="w-full h-2 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
          <div
            className="h-full bg-bitcoin-orange transition-all duration-500"
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
      <span className={`text-xs font-semibold ${getConfidenceColor(confidence)}`}>
        {getConfidenceLabel(confidence)}
      </span>
    </div>
  );
};

/**
 * Section Header Component
 */
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="text-bitcoin-orange">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-bitcoin-white">
      {title}
    </h3>
  </div>
);

/**
 * Risk Factor Badge
 */
const RiskBadge: React.FC<{ risk: string }> = ({ risk }) => (
  <div className="flex items-start gap-2 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3 hover:border-bitcoin-orange transition-all">
    <AlertTriangle className="w-4 h-4 text-bitcoin-orange flex-shrink-0 mt-0.5" />
    <span className="text-sm text-bitcoin-white-80">
      {risk}
    </span>
  </div>
);

/**
 * Source Citation Component
 */
const SourceCitation: React.FC<{
  source: {
    title: string;
    url: string;
    relevance: number;
    citationIndex: number;
  };
}> = ({ source }) => (
  <a
    href={source.url}
    target="_blank"
    rel="noopener noreferrer"
    className="block bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3 hover:border-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.2)] transition-all group"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-bitcoin-orange">
            [{source.citationIndex}]
          </span>
          <span className="text-sm font-semibold text-bitcoin-white truncate">
            {source.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-bitcoin-white-60 truncate">
            {new URL(source.url).hostname}
          </span>
          <span className="text-xs text-bitcoin-white-60">
            •
          </span>
          <span className="text-xs text-bitcoin-white-60">
            Relevance: {(source.relevance * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      <ExternalLink className="w-4 h-4 text-bitcoin-orange flex-shrink-0 group-hover:scale-110 transition-transform" />
    </div>
  </a>
);

/**
 * Loading State
 */
const LoadingState: React.FC = () => (
  <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
    <div className="flex items-center justify-center gap-3 py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-bitcoin-orange border-t-transparent" />
      <div className="text-center">
        <p className="text-bitcoin-white font-semibold mb-1">
          Conducting Deep Research...
        </p>
        <p className="text-sm text-bitcoin-white-60">
          This may take 5-7 minutes for comprehensive analysis
        </p>
      </div>
    </div>
  </div>
);

/**
 * Error State
 */
const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-6 h-6 text-bitcoin-orange flex-shrink-0" />
      <div>
        <h3 className="text-bitcoin-white font-bold mb-2">
          Research Unavailable
        </h3>
        <p className="text-sm text-bitcoin-white-80">
          {error}
        </p>
      </div>
    </div>
  </div>
);

/**
 * Main Caesar Research Panel Component
 * ✅ UPDATED: Single-page display with context data visible
 */
export const CaesarResearchPanel: React.FC<CaesarResearchPanelProps> = ({
  symbol,
  research,
  loading = false,
  error = null
}) => {
  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} />;
  }

  // Combine all analysis into single text block
  const fullAnalysis = `
${research.technologyOverview}

${research.teamLeadership}

${research.partnerships}

${research.marketPosition}

${research.recentDevelopments}
`.trim();

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl overflow-hidden">
      {/* Header */}
      <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-bitcoin-white mb-1">
              Caesar AI Deep Research: {symbol}
            </h2>
            <p className="text-sm text-bitcoin-white-60 italic">
              Comprehensive AI-powered analysis with full context
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceIndicator confidence={research.confidence} />
          </div>
        </div>
      </div>

      {/* Content - Single Page */}
      <div className="p-6 space-y-6">
        
        {/* Context Data Fed to Caesar */}
        {research.rawContent && (
          <details className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg overflow-hidden">
            <summary className="cursor-pointer px-4 py-3 bg-bitcoin-orange-5 hover:bg-bitcoin-orange-10 transition-colors">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-bitcoin-orange" />
                <span className="text-sm font-bold text-bitcoin-white">
                  View Initial Prompt Data (What Caesar Received)
                </span>
              </div>
            </summary>
            <div className="p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-bitcoin-white-80 font-mono whitespace-pre-wrap break-words">
                {research.rawContent}
              </pre>
            </div>
          </details>
        )}

        {/* Full Analysis - Single Block */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-6">
          <h3 className="text-xl font-bold text-bitcoin-orange mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Complete Analysis
          </h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-base text-bitcoin-white-80 leading-relaxed whitespace-pre-wrap">
              {fullAnalysis}
            </p>
          </div>
        </div>

        {/* Risk Factors - Inline */}
        {research.riskFactors.length > 0 && (
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-6">
            <h3 className="text-xl font-bold text-bitcoin-orange mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Risk Factors ({research.riskFactors.length})
            </h3>
            <ul className="space-y-2">
              {research.riskFactors.map((risk, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-bitcoin-white-80">
                  <AlertTriangle className="w-4 h-4 text-bitcoin-orange flex-shrink-0 mt-0.5" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Source Citations - Compact */}
        {research.sources.length > 0 && (
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-6">
            <h3 className="text-lg font-bold text-bitcoin-white mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-bitcoin-orange" />
              Sources ({research.sources.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {research.sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors group"
                >
                  <span className="font-bold text-bitcoin-orange">[{source.citationIndex}]</span>
                  <span className="truncate group-hover:underline">{source.title}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
          <p className="text-xs text-bitcoin-white-60 leading-relaxed">
            <strong className="text-bitcoin-white">Disclaimer:</strong> This research is generated by AI and should not be considered financial advice. 
            Always conduct your own research and consult with financial professionals before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CaesarResearchPanel;
