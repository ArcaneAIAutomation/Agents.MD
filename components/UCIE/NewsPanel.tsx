/**
 * NewsPanel Component for UCIE
 * 
 * Displays cryptocurrency news with AI-powered impact assessment
 * 
 * Features:
 * - 20 most recent news articles
 * - AI-generated impact assessment for each
 * - Category-based color coding
 * - Breaking news visual emphasis
 * - "Read More" links to original sources
 */

import React from 'react';
import { AssessedNewsArticle } from '../../lib/ucie/newsImpactAssessment';
import { ExternalLink, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface NewsPanelProps {
  articles: AssessedNewsArticle[];
  loading?: boolean;
  error?: string | null;
}

export default function NewsPanel({ articles, loading, error }: NewsPanelProps) {
  if (loading) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-4">News Intelligence</h2>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-bitcoin-orange-20 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-bitcoin-orange-10 rounded w-full mb-1"></div>
              <div className="h-3 bg-bitcoin-orange-10 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-4">News Intelligence</h2>
        <div className="text-bitcoin-white-60 text-center py-8">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 text-bitcoin-orange" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-4">News Intelligence</h2>
        <div className="text-bitcoin-white-60 text-center py-8">
          <p>No recent news articles found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl overflow-hidden">
      {/* Header */}
      <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-4">
        <h2 className="text-2xl font-bold text-bitcoin-white">News Intelligence</h2>
        <p className="text-sm text-bitcoin-white-60 italic mt-1">
          AI-powered news analysis with market impact assessment
        </p>
      </div>

      {/* News Articles */}
      <div className="p-6 space-y-4 max-h-[800px] overflow-y-auto">
        {articles.map((article) => (
          <NewsArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual news article card
 */
function NewsArticleCard({ article }: { article: AssessedNewsArticle }) {
  const { assessment } = article;
  
  return (
    <div className={`
      bg-bitcoin-black border rounded-lg p-4 transition-all hover:shadow-[0_0_20px_rgba(247,147,26,0.3)]
      ${article.isBreaking ? 'border-bitcoin-orange border-2' : 'border-bitcoin-orange-20'}
    `}>
      {/* Breaking News Badge */}
      {article.isBreaking && (
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-bitcoin-orange text-bitcoin-black text-xs font-bold px-2 py-1 rounded uppercase">
            Breaking News
          </span>
          <span className="text-bitcoin-white-60 text-xs">
            Published {getTimeAgo(article.publishedAt)}
          </span>
        </div>
      )}

      {/* Title and Source */}
      <div className="mb-3">
        <h3 className="text-lg font-bold text-bitcoin-white mb-1 line-clamp-2">
          {article.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-bitcoin-white-60">
          <span>{article.source}</span>
          <span>•</span>
          <span className={getCategoryColor(article.category)}>
            {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
          </span>
          {!article.isBreaking && (
            <>
              <span>•</span>
              <span>{getTimeAgo(article.publishedAt)}</span>
            </>
          )}
        </div>
      </div>

      {/* Impact Assessment */}
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getImpactIcon(assessment.impact)}
            <span className={`font-bold ${getImpactColor(assessment.impact)}`}>
              {assessment.impact.charAt(0).toUpperCase() + assessment.impact.slice(1)}
            </span>
            <span className="text-bitcoin-white-60 text-sm">
              Impact: {assessment.impactScore}/100
            </span>
          </div>
          <div className="text-bitcoin-white-60 text-sm">
            Confidence: {assessment.confidence}%
          </div>
        </div>
        
        {/* AI Summary */}
        <p className="text-bitcoin-white-80 text-sm mb-2">
          {assessment.summary}
        </p>
        
        {/* Market Implications */}
        {assessment.marketImplications && (
          <div className="text-bitcoin-white-60 text-xs italic border-l-2 border-bitcoin-orange-20 pl-2">
            {assessment.marketImplications}
          </div>
        )}
      </div>

      {/* Key Points */}
      {assessment.keyPoints && assessment.keyPoints.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-bitcoin-white-60 uppercase mb-1">Key Points:</p>
          <ul className="space-y-1">
            {assessment.keyPoints.slice(0, 3).map((point, index) => (
              <li key={index} className="text-sm text-bitcoin-white-80 flex items-start gap-2">
                <span className="text-bitcoin-orange mt-1">•</span>
                <span className="line-clamp-2">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Read More Link */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-bitcoin-orange hover:text-bitcoin-white transition-colors text-sm font-semibold"
      >
        Read Full Article
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}

/**
 * Get impact icon based on sentiment
 */
function getImpactIcon(impact: 'bullish' | 'bearish' | 'neutral') {
  switch (impact) {
    case 'bullish':
      return <TrendingUp className="w-5 h-5 text-bitcoin-orange" />;
    case 'bearish':
      return <TrendingDown className="w-5 h-5 text-bitcoin-white" />;
    case 'neutral':
      return <Minus className="w-5 h-5 text-bitcoin-white-60" />;
  }
}

/**
 * Get impact color class
 */
function getImpactColor(impact: 'bullish' | 'bearish' | 'neutral'): string {
  switch (impact) {
    case 'bullish':
      return 'text-bitcoin-orange';
    case 'bearish':
      return 'text-bitcoin-white';
    case 'neutral':
      return 'text-bitcoin-white-60';
  }
}

/**
 * Get category color class
 */
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    partnerships: 'text-bitcoin-orange',
    technology: 'text-bitcoin-orange',
    regulatory: 'text-bitcoin-white',
    market: 'text-bitcoin-white-80',
    community: 'text-bitcoin-white-60'
  };
  
  return colors[category] || 'text-bitcoin-white-60';
}

/**
 * Get time ago string
 */
function getTimeAgo(publishedAt: string): string {
  const now = Date.now();
  const published = new Date(publishedAt).getTime();
  const diffMs = now - published;
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return new Date(publishedAt).toLocaleDateString();
  }
}
