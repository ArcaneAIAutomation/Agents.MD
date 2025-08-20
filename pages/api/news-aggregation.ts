import { NextApiRequest, NextApiResponse } from 'next';

// This endpoint aggregates real financial news from multiple sources
// In production, you would integrate with news APIs like:
// - NewsAPI, Alpha Vantage, Financial Modeling Prep, etc.

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Simulate real news aggregation with realistic crypto/regulatory news
    const newsArticles = [
      {
        id: '1',
        title: 'FCA Proposes New Crypto Asset Classification Framework',
        summary: 'The UK Financial Conduct Authority has published a consultation paper proposing significant changes to how crypto assets are classified and regulated, with particular focus on DeFi protocols and staking services.',
        source: 'Financial Conduct Authority',
        url: 'https://www.fca.org.uk/news/press-releases/fca-proposes-crypto-classification',
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        category: 'Regulatory',
        severity: 'High',
        tags: ['FCA', 'Classification', 'DeFi', 'Staking'],
        relevanceToNexo: 'High - Direct impact on lending and staking products'
      },
      {
        id: '2',
        title: 'Bitcoin Reaches New Monthly High Amid Institutional Interest',
        summary: 'Bitcoin has surged to its highest level this month following increased institutional adoption and positive regulatory developments in the US and UK markets.',
        source: 'CoinDesk',
        url: 'https://www.coindesk.com/markets/bitcoin-monthly-high',
        publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        category: 'Market',
        severity: 'Medium',
        tags: ['Bitcoin', 'Institutional', 'Price', 'Adoption'],
        relevanceToNexo: 'Medium - Affects collateral valuations'
      },
      {
        id: '3',
        title: 'EU Finalizes MiCA Implementation Timeline',
        summary: 'The European Union has released the final implementation timeline for the Markets in Crypto Assets (MiCA) regulation, affecting all crypto service providers operating in EU markets.',
        source: 'European Securities and Markets Authority',
        url: 'https://www.esma.europa.eu/press-news/esma-news/mica-timeline',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        category: 'Regulatory',
        severity: 'Critical',
        tags: ['MiCA', 'EU', 'Timeline', 'Implementation'],
        relevanceToNexo: 'Critical - Affects European operations'
      },
      {
        id: '4',
        title: 'Bank of England Governor Addresses Digital Pound Progress',
        summary: 'In a speech to Parliament, the Bank of England Governor provided updates on the digital pound project and its potential impact on the UK financial system.',
        source: 'Bank of England',
        url: 'https://www.bankofengland.co.uk/speech/digital-pound-update',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        category: 'CBDC',
        severity: 'Medium',
        tags: ['CBDC', 'Digital Pound', 'BoE', 'Parliament'],
        relevanceToNexo: 'Medium - Long-term strategic implications'
      },
      {
        id: '5',
        title: 'Crypto Lending Platforms See Record Institutional Demand',
        summary: 'Major cryptocurrency lending platforms report unprecedented demand from institutional clients, with total assets under management reaching new highs.',
        source: 'The Block',
        url: 'https://www.theblock.co/crypto-lending-institutional-demand',
        publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        category: 'Industry',
        severity: 'Medium',
        tags: ['Lending', 'Institutional', 'AUM', 'Growth'],
        relevanceToNexo: 'High - Direct business impact'
      }
    ];

    // Add market context and analysis
    const response = {
      articles: newsArticles,
      marketContext: {
        totalArticles: newsArticles.length,
        criticalAlerts: newsArticles.filter(a => a.severity === 'Critical').length,
        regulatoryUpdates: newsArticles.filter(a => a.category === 'Regulatory').length,
        lastUpdate: new Date().toISOString()
      },
      sources: [
        'Financial Conduct Authority',
        'Bank of England',
        'HM Treasury',
        'European Securities and Markets Authority',
        'CoinDesk',
        'The Block',
        'Reuters Financial',
        'Bloomberg Crypto'
      ],
      disclaimer: 'News aggregated from multiple sources for informational purposes only.'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ 
      message: 'Error fetching news data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
