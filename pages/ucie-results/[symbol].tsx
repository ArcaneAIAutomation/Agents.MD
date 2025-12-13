import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getCachedAnalysis } from '../../lib/ucie/cacheUtils';
import { TrendingUp, TrendingDown, Activity, DollarSign, Users, Newspaper, Link as LinkIcon } from 'lucide-react';

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
        
        // Fetch all cached data from database
        const [marketData, sentiment, technical, news, onChain] = await Promise.all([
          getCachedAnalysis(symbol, 'market-data'),
          getCachedAnalysis(symbol, 'sentiment'),
          getCachedAnalysis(symbol, 'technical'),
          getCachedAnalysis(symbol, 'news'),
          getCachedAnalysis(symbol, 'on-chain')
        ]);

        // Calculate data quality
        const sources = [marketData, sentiment, technical, news, onChain];
        const workingSources = sources.filter