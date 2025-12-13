import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Activity, DollarSign, Users, Newspaper, Link as LinkIcon } from 'lucide-react';

interface UCIEResultsData {
  symbol: string;
  timestamp: string;
  dataQuality: number;
  marketData?: any;
  sentiment?: any;
  technical?: any;
  news?: any;
  onChain?: any;
}

export default function UCIEResultsPage() {
  const router = useRouter();
  const { symbol } = router.query;
  const [data, setData] = useState<UCIEResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol || typeof symbol !== 'string') return;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch all cached data via API routes
        const [marketData, sentiment, technical, news, onChain] = await Promise.all([
          fetch(`/api/ucie/market-data/${symbol}`).then(r => r.ok ? r.json() : null),
          fetch(`/api/ucie/sentiment/${symbol}`).then(r => r.ok ? r.json() : null),
          fetch(`/api/ucie/technical/${symbol}`).then(r => r.ok ? r.json() : null),
          fetch(`/api/ucie/news/${symbol}`).then(r => r.ok ? r.json() : null),
          fetch(`/api/ucie/on-chain/${symbol}`).then(r => r.ok ? r.json() : null)
        ]);

        // Calculate data quality
        const sources = [marketData, sentiment, technical, news, onChain];
        const workingSources = sources.filter(s => s !== null);
        const dataQuality = (workingSources.length / sources.length) * 100;

        setData({
          symbol,
          timestamp: new Date().toISOString(),
          dataQuality,
          marketData,
          sentiment,
          technical,
          news,
          onChain
        });
      } catch (err) {
        console.error('Error loading UCIE data:', err);
        setError('Failed to load analysis data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [symbol]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bitcoin-black flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-bitcoin-orange animate-spin mx-auto mb-4" />
          <p className="text-bitcoin-white text-xl">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-bitcoin-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-bitcoin-orange text-xl mb-4">{error || 'No data available'}</p>
          <button
            onClick={() => router.push('/ucie')}
            className="bg-bitcoin-orange text-bitcoin-black px-6 py-3 rounded-lg font-bold"
          >
            Back to UCIE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bitcoin-black text-bitcoin-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-bitcoin-white mb-2">
            {data.symbol} Analysis Results
          </h1>
          <p className="text-bitcoin-white-60">
            Data Quality: {data.dataQuality.toFixed(0)}% | Updated: {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Data Quality Indicator */}
        <div className="bitcoin-block mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Data Quality</h2>
            <span className={`text-2xl font-bold ${data.dataQuality >= 70 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
              {data.dataQuality.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-4">
            <div
              className="bg-bitcoin-orange h-full rounded-full transition-all"
              style={{ width: `${data.dataQuality}%` }}
            />
          </div>
        </div>

        {/* Data Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Market Data */}
          {data.marketData && (
            <div className="bitcoin-block">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-6 h-6 text-bitcoin-orange" />
                <h3 className="text-xl font-bold">Market Data</h3>
              </div>
              <pre className="text-sm text-bitcoin-white-80 overflow-auto">
                {JSON.stringify(data.marketData, null, 2)}
              </pre>
            </div>
          )}

          {/* Sentiment */}
          {data.sentiment && (
            <div className="bitcoin-block">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-bitcoin-orange" />
                <h3 className="text-xl font-bold">Sentiment</h3>
              </div>
              <pre className="text-sm text-bitcoin-white-80 overflow-auto">
                {JSON.stringify(data.sentiment, null, 2)}
              </pre>
            </div>
          )}

          {/* Technical */}
          {data.technical && (
            <div className="bitcoin-block">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-6 h-6 text-bitcoin-orange" />
                <h3 className="text-xl font-bold">Technical Analysis</h3>
              </div>
              <pre className="text-sm text-bitcoin-white-80 overflow-auto">
                {JSON.stringify(data.technical, null, 2)}
              </pre>
            </div>
          )}

          {/* News */}
          {data.news && (
            <div className="bitcoin-block">
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="w-6 h-6 text-bitcoin-orange" />
                <h3 className="text-xl font-bold">News</h3>
              </div>
              <pre className="text-sm text-bitcoin-white-80 overflow-auto">
                {JSON.stringify(data.news, null, 2)}
              </pre>
            </div>
          )}

          {/* On-Chain */}
          {data.onChain && (
            <div className="bitcoin-block">
              <div className="flex items-center gap-2 mb-4">
                <LinkIcon className="w-6 h-6 text-bitcoin-orange" />
                <h3 className="text-xl font-bold">On-Chain Data</h3>
              </div>
              <pre className="text-sm text-bitcoin-white-80 overflow-auto">
                {JSON.stringify(data.onChain, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/ucie')}
            className="bg-bitcoin-orange text-bitcoin-black px-8 py-3 rounded-lg font-bold hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange transition-all"
          >
            Back to UCIE
          </button>
        </div>
      </div>
    </div>
  );
}