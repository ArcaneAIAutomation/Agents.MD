// API handler for Nexo regulatory news
import type { NextApiRequest, NextApiResponse } from 'next'

interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  relevanceScore: number;
}

// This would normally fetch from real APIs like:
// - Google News API
// - NewsAPI
// - RSS feeds from regulatory bodies
// - Nexo's official communications

const fetchNexoRegulatoryNews = async (): Promise<NewsItem[]> => {
  // Simulated news data - replace with real API calls
  const simulatedNews: NewsItem[] = [
    {
      id: '1',
      title: 'Nexo Receives Crypto Asset Service Provider License in Lithuania',
      description: 'Nexo has been granted a CASP license by the Bank of Lithuania, strengthening its regulatory compliance in the EU market. This license allows Nexo to provide digital asset custody and exchange services.',
      url: 'https://nexo.io/blog/nexo-receives-casp-license-lithuania',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      source: 'Nexo Official',
      relevanceScore: 95
    },
    {
      id: '2',
      title: 'UK FCA Reviews Nexo Operations Amid New Crypto Regulations',
      description: 'The Financial Conduct Authority is conducting a comprehensive review of Nexo\'s UK operations following the implementation of new cryptocurrency regulations under the Financial Services and Markets Act.',
      url: 'https://www.fca.org.uk/news/press-releases/fca-reviews-crypto-firms-2024',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      source: 'FCA Official',
      relevanceScore: 92
    },
    {
      id: '3',
      title: 'Nexo Implements Enhanced KYC Procedures for UK Customers',
      description: 'In response to regulatory requirements, Nexo has introduced stricter identity verification processes for UK-based users, including enhanced document verification and source of funds checks.',
      url: 'https://support.nexo.io/hc/en-us/articles/enhanced-kyc-uk',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      source: 'Nexo Support',
      relevanceScore: 88
    },
    {
      id: '4',
      title: 'European Banking Authority Updates Crypto Asset Guidelines',
      description: 'The EBA has released updated guidelines on crypto asset services that will impact platforms like Nexo operating in EU jurisdictions, focusing on consumer protection and operational resilience.',
      url: 'https://www.eba.europa.eu/publications-and-media/press-releases/eba-updates-guidelines-crypto-assets',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      source: 'EBA Official',
      relevanceScore: 85
    },
    {
      id: '5',
      title: 'Nexo Expands Compliance Team Following Regulatory Changes',
      description: 'Nexo announces significant expansion of its compliance and legal teams to better navigate the evolving regulatory landscape across multiple jurisdictions.',
      url: 'https://nexo.io/blog/compliance-team-expansion-2024',
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      source: 'CryptoNews',
      relevanceScore: 80
    }
  ];

  return simulatedNews;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NewsItem[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const news = await fetchNexoRegulatoryNews();
    
    // Add cache headers for 5 minute cache
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    res.status(200).json(news);
  } catch (error) {
    console.error('Error fetching Nexo news:', error);
    res.status(500).json({ error: 'Failed to fetch news data' });
  }
}
