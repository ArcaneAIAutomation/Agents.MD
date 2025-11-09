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

  // Remove hyperlinks from text
  const removeHyperlinks = (text: string): string => {
    // Remove markdown-style links [text](url)
    let cleaned = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    // Remove bare URLs in square brackets [url]
    cleaned = cleaned.replace(/\[https?:\/\/[^\]]+\]/g, '');
    // Remove standalone URLs
    cleaned = cleaned.replace(/https?:\/\/[^\s\]]+/g, '');
    return cleaned;
  };

  // Simplify technical jargon for 18-year-olds
  const simplifyForTeens = (text: string): string => {
    return text
      // Technical terms
      .replace(/Proof-of-Work \(PoW\) consensus mechanism/gi, 'security system where computers compete to solve puzzles')
      .replace(/SHA-256 hashing/gi, 'advanced encryption')
      .replace(/public-key cryptography/gi, 'secure digital signatures')
      .replace(/decentralized, distributed public ledger/gi, 'shared digital record book')
      .replace(/quadrennial halving events/gi, 'events every 4 years that reduce new Bitcoin creation')
      .replace(/hash rate/gi, 'network security power')
      .replace(/EH\/s/gi, 'exahashes per second (massive computing power)')
      .replace(/Bitcoin Improvement Proposal \(BIP\)/gi, 'Bitcoin upgrade proposal')
      .replace(/Turing-complete/gi, 'able to run complex programs')
      .replace(/Layer 2 solutions/gi, 'add-on networks built on top of Bitcoin')
      .replace(/Proof-of-Transfer \(PoX\)/gi, 'security method using Bitcoin\'s power')
      .replace(/EVM-compatible sidechain/gi, 'parallel network that works with Ethereum apps')
      .replace(/merged mining/gi, 'mining two cryptocurrencies at once')
      
      // Financial terms
      .replace(/market capitalization/gi, 'total value')
      .replace(/liquidity/gi, 'ease of buying and selling')
      .replace(/OTC cash-settled/gi, 'private trading')
      .replace(/custody solutions/gi, 'secure storage services')
      .replace(/spot ETFs/gi, 'investment funds')
      .replace(/treasury holdings/gi, 'company reserves')
      
      // Governance terms
      .replace(/rough consensus/gi, 'general agreement')
      .replace(/maintainers/gi, 'core developers')
      .replace(/commit access/gi, 'permission to update code')
      
      // Market terms
      .replace(/on-chain data/gi, 'blockchain records')
      .replace(/whale activity/gi, 'large investor movements')
      .replace(/exchange reserves/gi, 'Bitcoin held on trading platforms')
      .replace(/Fear & Greed Index/gi, 'market emotion indicator');
  };

  // Combine all analysis into single text block
  const rawAnalysis = `
${research.technologyOverview}

${research.teamLeadership}

${research.partnerships}

${research.marketPosition}

${research.recentDevelopments}
`.trim();

  // Clean and simplify the analysis
  const fullAnalysis = simplifyForTeens(removeHyperlinks(rawAnalysis));

  // Extract positive factors for the new section
  const extractPositiveFactors = (text: string): string[] => {
    const positives: string[] = [];
    
    // Security & Technology
    if (text.includes('Never been successfully hacked') || text.includes('robust')) {
      positives.push('**Unbreakable Security**: Bitcoin has never been hacked in over 15 years. It\'s protected by more computing power than the world\'s top 500 supercomputers combined.');
    }
    if (text.includes('hash rate') || text.includes('EH/s')) {
      positives.push('**Growing Stronger**: The network\'s security power hit an all-time high in 2025, meaning it\'s getting more secure every day.');
    }
    if (text.includes('Layer 2') || text.includes('Stacks') || text.includes('Rootstock')) {
      positives.push('**Expanding Capabilities**: New add-on networks are being built on Bitcoin that enable smart contracts and DeFi apps, making it more useful beyond just payments.');
    }
    
    // Adoption & Market Position
    if (text.includes('$2 trillion') || text.includes('#1')) {
      positives.push('**Market Leader**: Bitcoin is worth $2 trillion - that\'s 5x bigger than Ethereum and larger than most countries\' economies. It\'s the undisputed king of crypto.');
    }
    if (text.includes('49 million') || text.includes('addresses')) {
      positives.push('**Mass Adoption**: Over 49 million people worldwide own Bitcoin, and that number is growing every day.');
    }
    if (text.includes('172') || text.includes('companies') || text.includes('treasury')) {
      positives.push('**Corporate Backing**: 172 publicly traded companies now hold Bitcoin in their reserves, including major corporations. This shows serious institutional confidence.');
    }
    if (text.includes('BlackRock') || text.includes('ETF') || text.includes('Fidelity')) {
      positives.push('**Wall Street Approved**: Major financial institutions like BlackRock and Fidelity now offer Bitcoin investment products, making it easier for everyone to invest.');
    }
    
    // Scarcity & Economics
    if (text.includes('21 million') || text.includes('fixed supply')) {
      positives.push('**Digital Scarcity**: Only 21 million Bitcoin will ever exist. Unlike regular money that governments can print endlessly, Bitcoin\'s supply is mathematically limited forever.');
    }
    if (text.includes('halving')) {
      positives.push('**Deflationary Design**: Every 4 years, new Bitcoin creation gets cut in half. This built-in scarcity has historically driven price increases.');
    }
    
    // Network Activity & Demand
    if (text.includes('accumulation') || text.includes('buying')) {
      positives.push('**Strong Demand**: Smart investors and institutions are actively buying Bitcoin, especially during price dips. This shows confidence in long-term value.');
    }
    if (text.includes('exchange reserves') && text.includes('low')) {
      positives.push('**Supply Squeeze**: Bitcoin held on exchanges is at a 5-year low, meaning people are moving it to long-term storage rather than selling. Less supply available = potential price increase.');
    }
    
    // Innovation & Development
    if (text.includes('OP_CAT') || text.includes('OP_CTV') || text.includes('upgrade')) {
      positives.push('**Continuous Innovation**: Developers are working on major upgrades to add new features like advanced smart contracts while maintaining Bitcoin\'s security.');
    }
    if (text.includes('quantum') || text.includes('Post-Quantum')) {
      positives.push('**Future-Proof**: Bitcoin developers are already preparing for quantum computers (which could break current encryption) with quantum-resistant security upgrades.');
    }
    
    // Global Impact
    if (text.includes('decentralized') || text.includes('no central authority')) {
      positives.push('**Financial Freedom**: Bitcoin isn\'t controlled by any government, bank, or company. It gives people financial independence and protection from inflation.');
    }
    if (text.includes('global') || text.includes('worldwide')) {
      positives.push('**Borderless Money**: Bitcoin works the same everywhere in the world. You can send it to anyone, anywhere, without banks or permission.');
    }
    
    return positives.length > 0 ? positives : [
      '**Proven Track Record**: Bitcoin has survived and thrived for over 15 years, outlasting countless competitors.',
      '**Network Effect**: As more people use Bitcoin, it becomes more valuable and useful - like how Facebook got better as more friends joined.',
      '**Store of Value**: Many see Bitcoin as "digital gold" - a way to preserve wealth over time, especially during economic uncertainty.'
    ];
  };

  const positiveFactors = extractPositiveFactors(rawAnalysis);

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

        {/* Positive Outlook Potential - NEW SECTION */}
        <div className="bg-gradient-to-br from-bitcoin-orange-10 to-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-6">
          <h3 className="text-xl font-bold text-bitcoin-orange mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Positive Outlook & Potential 🚀
          </h3>
          <div className="space-y-4">
            {positiveFactors.map((factor, index) => {
              // Extract title and description
              const [title, ...descParts] = factor.split(':');
              const description = descParts.join(':').trim();
              
              return (
                <div key={index} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 hover:border-bitcoin-orange transition-all">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-bitcoin-orange rounded-full flex items-center justify-center text-bitcoin-black font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-bold text-bitcoin-white mb-2">
                        {title.replace(/\*\*/g, '')}
                      </h4>
                      <p className="text-sm text-bitcoin-white-80 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
            <p className="text-sm text-bitcoin-white-80 italic">
              💡 <strong className="text-bitcoin-white">Bottom Line:</strong> Bitcoin combines proven security, growing adoption, 
              limited supply, and continuous innovation. While all investments carry risk, Bitcoin's fundamentals 
              suggest strong long-term potential as both a store of value and evolving technology platform.
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
