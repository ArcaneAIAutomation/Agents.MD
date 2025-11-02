# UCIE News Intelligence - Integration Example

## Complete UCIE Analysis Page with News

This example shows how to integrate the News Intelligence module into a complete UCIE analysis page.

```tsx
// pages/ucie/analyze/[symbol].tsx

import { useRouter } from 'next/router';
import { useState } from 'react';
import Layout from '../../../components/Layout';
import NewsPanel from '../../../components/UCIE/NewsPanel';
import { useUCIENews } from '../../../hooks/useUCIENews';

export default function UCIEAnalysisPage() {
  const router = useRouter();
  const { symbol } = router.query;
  const symbolStr = typeof symbol === 'string' ? symbol : 'BTC';
  
  // Fetch news data
  const { data: newsData, loading: newsLoading, error: newsError } = useUCIENews(symbolStr);
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-bitcoin-white mb-2">
            {symbolStr} Intelligence Analysis
          </h1>
          <p className="text-bitcoin-white-60">
            Comprehensive multi-dimensional cryptocurrency analysis
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Overall Sentiment"
            value={newsData?.summary.overallSentiment || 'neutral'}
            color="orange"
          />
          <StatCard
            label="Bullish News"
            value={newsData?.summary.bullishCount || 0}
            color="orange"
          />
          <StatCard
            label="Bearish News"
            value={newsData?.summary.bearishCount || 0}
            color="white"
          />
          <StatCard
            label="Data Quality"
            value={`${newsData?.dataQuality || 0}%`}
            color="orange"
          />
        </div>
        
        {/* Analysis Sections */}
        <div className="space-y-8">
          {/* Market Data Section */}
          <section>
            <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
              Market Data
            </h2>
            {/* Market data component here */}
          </section>
          
          {/* News Intelligence Section */}
          <section>
            <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
              News Intelligence
            </h2>
            <NewsPanel 
              articles={newsData?.articles || []}
              loading={newsLoading}
              error={newsError}
            />
          </section>
          
          {/* Caesar AI Research Section */}
          <section>
            <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
              Deep Research
            </h2>
            {/* Caesar research component here */}
          </section>
          
          {/* On-Chain Analytics Section */}
          <section>
            <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
              On-Chain Analytics
            </h2>
            {/* On-chain component here */}
          </section>
          
          {/* Social Sentiment Section */}
          <section>
            <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
              Social Sentiment
            </h2>
            {/* Social sentiment component here */}
          </section>
        </div>
      </div>
    </Layout>
  );
}

// Stat Card Component
function StatCard({ label, value, color }: { 
  label: string; 
  value: string | number; 
  color: 'orange' | 'white' 
}) {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 hover:border-bitcoin-orange transition-all">
      <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${color === 'orange' ? 'text-bitcoin-orange' : 'text-bitcoin-white'}`}>
        {value}
      </p>
    </div>
  );
}
```

## Tabbed Interface Example

```tsx
// pages/ucie/analyze/[symbol].tsx

import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import NewsPanel from '../../../components/UCIE/NewsPanel';
import { useUCIENews } from '../../../hooks/useUCIENews';

type Tab = 'overview' | 'news' | 'research' | 'onchain' | 'social' | 'technical';

export default function UCIEAnalysisPage() {
  const router = useRouter();
  const { symbol } = router.query;
  const symbolStr = typeof symbol === 'string' ? symbol : 'BTC';
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Fetch news data
  const { data: newsData, loading: newsLoading, error: newsError } = useUCIENews(symbolStr);
  
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'news', label: 'News' },
    { id: 'research', label: 'Research' },
    { id: 'onchain', label: 'On-Chain' },
    { id: 'social', label: 'Social' },
    { id: 'technical', label: 'Technical' }
  ];
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-bitcoin-white mb-2">
            {symbolStr} Intelligence Analysis
          </h1>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-bitcoin-orange text-bitcoin-black'
                  : 'bg-bitcoin-black text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <OverviewTab newsData={newsData} />
          )}
          
          {activeTab === 'news' && (
            <NewsPanel 
              articles={newsData?.articles || []}
              loading={newsLoading}
              error={newsError}
            />
          )}
          
          {activeTab === 'research' && (
            <div>Caesar Research Component</div>
          )}
          
          {activeTab === 'onchain' && (
            <div>On-Chain Analytics Component</div>
          )}
          
          {activeTab === 'social' && (
            <div>Social Sentiment Component</div>
          )}
          
          {activeTab === 'technical' && (
            <div>Technical Analysis Component</div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function OverviewTab({ newsData }: { newsData: any }) {
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-6">
          <h3 className="text-bitcoin-white-60 text-sm mb-2">News Sentiment</h3>
          <p className="text-bitcoin-orange text-3xl font-bold">
            {newsData?.summary.overallSentiment || 'neutral'}
          </p>
        </div>
        
        <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-6">
          <h3 className="text-bitcoin-white-60 text-sm mb-2">Average Impact</h3>
          <p className="text-bitcoin-orange text-3xl font-bold">
            {newsData?.summary.averageImpact || 50}/100
          </p>
        </div>
        
        <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-6">
          <h3 className="text-bitcoin-white-60 text-sm mb-2">Data Quality</h3>
          <p className="text-bitcoin-orange text-3xl font-bold">
            {newsData?.dataQuality || 0}%
          </p>
        </div>
      </div>
      
      {/* Major News */}
      {newsData?.summary.majorNews && newsData.summary.majorNews.length > 0 && (
        <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-6">
          <h3 className="text-bitcoin-white text-xl font-bold mb-4">
            Major News (High Impact)
          </h3>
          <div className="space-y-4">
            {newsData.summary.majorNews.slice(0, 3).map((article: any) => (
              <div key={article.id} className="border-l-2 border-bitcoin-orange pl-4">
                <h4 className="text-bitcoin-white font-bold mb-1">
                  {article.title}
                </h4>
                <p className="text-bitcoin-white-60 text-sm">
                  {article.assessment.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickLinkCard title="Latest News" count={newsData?.articles.length || 0} />
        <QuickLinkCard title="Bullish" count={newsData?.summary.bullishCount || 0} />
        <QuickLinkCard title="Bearish" count={newsData?.summary.bearishCount || 0} />
        <QuickLinkCard title="Neutral" count={newsData?.summary.neutralCount || 0} />
      </div>
    </div>
  );
}

function QuickLinkCard({ title, count }: { title: string; count: number }) {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 hover:border-bitcoin-orange transition-all">
      <p className="text-bitcoin-white-60 text-sm mb-1">{title}</p>
      <p className="text-bitcoin-orange text-2xl font-bold">{count}</p>
    </div>
  );
}
```

## Progressive Loading Example

```tsx
// pages/ucie/analyze/[symbol].tsx

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../../components/Layout';
import NewsPanel from '../../../components/UCIE/NewsPanel';
import { useUCIENews } from '../../../hooks/useUCIENews';

export default function UCIEAnalysisPage() {
  const router = useRouter();
  const { symbol } = router.query;
  const symbolStr = typeof symbol === 'string' ? symbol : 'BTC';
  
  const [loadingPhase, setLoadingPhase] = useState(1);
  
  // Phase 1: Critical data (< 1s)
  const { data: newsData, loading: newsLoading } = useUCIENews(symbolStr);
  
  useEffect(() => {
    // Simulate progressive loading phases
    const timer1 = setTimeout(() => setLoadingPhase(2), 1000);
    const timer2 = setTimeout(() => setLoadingPhase(3), 3000);
    const timer3 = setTimeout(() => setLoadingPhase(4), 7000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-bitcoin-white mb-8">
          {symbolStr} Analysis
        </h1>
        
        {/* Phase 1: Critical Data (< 1s) */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            Market Overview
          </h2>
          {loadingPhase >= 1 ? (
            <div>Price, Volume, Market Cap</div>
          ) : (
            <LoadingSkeleton />
          )}
        </section>
        
        {/* Phase 2: Important Data (1-3s) */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            News Intelligence
          </h2>
          {loadingPhase >= 2 ? (
            <NewsPanel 
              articles={newsData?.articles || []}
              loading={newsLoading}
            />
          ) : (
            <LoadingSkeleton />
          )}
        </section>
        
        {/* Phase 3: Enhanced Data (3-7s) */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            On-Chain Analytics
          </h2>
          {loadingPhase >= 3 ? (
            <div>On-Chain Data</div>
          ) : (
            <LoadingSkeleton />
          )}
        </section>
        
        {/* Phase 4: Deep Analysis (7-15s) */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
            AI Research
          </h2>
          {loadingPhase >= 4 ? (
            <div>Caesar AI Research</div>
          ) : (
            <LoadingSkeleton />
          )}
        </section>
      </div>
    </Layout>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-bitcoin-orange-20 rounded w-3/4 mb-4"></div>
      <div className="h-3 bg-bitcoin-orange-10 rounded w-full mb-2"></div>
      <div className="h-3 bg-bitcoin-orange-10 rounded w-5/6"></div>
    </div>
  );
}
```

## Mobile-Optimized Example

```tsx
// pages/ucie/analyze/[symbol].tsx

import { useRouter } from 'next/router';
import { useState } from 'react';
import Layout from '../../../components/Layout';
import NewsPanel from '../../../components/UCIE/NewsPanel';
import { useUCIENews } from '../../../hooks/useUCIENews';
import { useMobileViewport } from '../../../hooks/useMobileViewport';

export default function UCIEAnalysisPage() {
  const router = useRouter();
  const { symbol } = router.query;
  const symbolStr = typeof symbol === 'string' ? symbol : 'BTC';
  
  const { isMobile } = useMobileViewport();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['news']));
  
  const { data: newsData, loading: newsLoading, error: newsError } = useUCIENews(symbolStr);
  
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-bitcoin-white mb-6">
          {symbolStr} Analysis
        </h1>
        
        {/* Mobile: Collapsible Sections */}
        {isMobile ? (
          <div className="space-y-4">
            <CollapsibleSection
              title="News Intelligence"
              expanded={expandedSections.has('news')}
              onToggle={() => toggleSection('news')}
              badge={newsData?.articles.length}
            >
              <NewsPanel 
                articles={newsData?.articles || []}
                loading={newsLoading}
                error={newsError}
              />
            </CollapsibleSection>
            
            <CollapsibleSection
              title="Market Data"
              expanded={expandedSections.has('market')}
              onToggle={() => toggleSection('market')}
            >
              <div>Market Data Component</div>
            </CollapsibleSection>
            
            <CollapsibleSection
              title="On-Chain"
              expanded={expandedSections.has('onchain')}
              onToggle={() => toggleSection('onchain')}
            >
              <div>On-Chain Component</div>
            </CollapsibleSection>
          </div>
        ) : (
          /* Desktop: Full Layout */
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
                News Intelligence
              </h2>
              <NewsPanel 
                articles={newsData?.articles || []}
                loading={newsLoading}
                error={newsError}
              />
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
                Market Data
              </h2>
              <div>Market Data Component</div>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}

function CollapsibleSection({ 
  title, 
  expanded, 
  onToggle, 
  badge,
  children 
}: { 
  title: string; 
  expanded: boolean; 
  onToggle: () => void;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-bitcoin-black hover:bg-bitcoin-orange-10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-bitcoin-white">{title}</h3>
          {badge !== undefined && (
            <span className="bg-bitcoin-orange text-bitcoin-black text-xs font-bold px-2 py-1 rounded">
              {badge}
            </span>
          )}
        </div>
        <span className="text-bitcoin-orange text-2xl">
          {expanded ? '−' : '+'}
        </span>
      </button>
      
      {expanded && (
        <div className="p-4 border-t border-bitcoin-orange-20">
          {children}
        </div>
      )}
    </div>
  );
}
```

## Summary

These examples demonstrate how to integrate the News Intelligence module into:

1. **Complete Analysis Page** - Full UCIE analysis with all sections
2. **Tabbed Interface** - Organized tabs for different analysis types
3. **Progressive Loading** - Phased loading for better UX
4. **Mobile-Optimized** - Collapsible sections for mobile devices

Choose the pattern that best fits your application architecture and user experience goals.
