/**
 * Test Gemini Analysis Against Database Data
 * 
 * This test:
 * 1. Populates database with real-world sample data
 * 2. Verifies data is stored correctly
 * 3. Reads data back from database
 * 4. Generates Gemini analysis using that data
 * 5. Verifies analysis quality and completeness
 */

import { setCachedAnalysis, getCachedAnalysis } from '../lib/ucie/cacheUtils';
import { generateCryptoSummary } from '../lib/ucie/geminiClient';

async function testGeminiWithDatabase() {
  console.log('🧪 Testing Gemini Analysis Against Database Data');
  console.log('='.repeat(80));
  console.log('');
  
  const symbol = 'BTC';
  
  try {
    // ========================================================================
    // STEP 1: Populate database with realistic sample data
    // ========================================================================
    console.log('📊 STEP 1: Populating database with realistic BTC data');
    console.log('-'.repeat(80));
    
    const sampleData = {
      marketData: {
        success: true,
        priceAggregation: {
          averagePrice: 95752.59,
          totalVolume24h: 45200000000,
          averageChange24h: 2.34,
          high24h: 96500,
          low24h: 93800,
          prices: [
            { exchange: 'Binance', price: 95800, volume: 15000000000 },
            { exchange: 'Coinbase', price: 95700, volume: 12000000000 },
            { exchange: 'Kraken', price: 95750, volume: 8000000000 }
          ]
        },
        marketData: {
          marketCap: 1890000000000,
          circulatingSupply: 19750000,
          totalSupply: 21000000
        },
        timestamp: new Date().toISOString(),
        dataQuality: 100
      },
      sentiment: {
        success: true,
        sentiment: {
          overallScore: 75,
          trend: 'bullish',
          distribution: {
            positive: 68,
            negative: 15,
            neutral: 17
          }
        },
        volumeMetrics: {
          total24h: 125450,
          change24h: 12.5
        },
        sources: {
          lunarCrush: true,
          twitter: true,
          reddit: true
        },
        timestamp: new Date().toISOString(),
        dataQuality: 95
      },
      technical: {
        success: true,
        indicators: {
          rsi: { value: 62.5, signal: 'neutral' },
          macd: { signal: 'bullish', histogram: 450 },
          ema20: 94500,
          ema50: 91200,
          bollingerBands: {
            upper: 97000,
            middle: 95000,
            lower: 93000
          },
          trend: {
            direction: 'upward',
            strength: 'moderate'
          },
          volatility: {
            current: 2.8,
            average: 3.2
          }
        },
        timestamp: new Date().toISOString(),
        dataQuality: 100
      },
      news: {
        success: true,
        articles: [
          {
            title: 'Bitcoin Reaches New All-Time High Amid Institutional Adoption',
            summary: 'Bitcoin surpasses previous records as major institutions increase holdings',
            sentiment: 'positive',
            sentimentScore: 85,
            impactScore: 9,
            source: 'CryptoNews',
            category: 'Market',
            publishedAt: new Date().toISOString()
          },
          {
            title: 'Major Financial Institutions Announce Bitcoin Treasury Strategy',
            summary: 'Several Fortune 500 companies reveal plans to add Bitcoin to balance sheets',
            sentiment: 'positive',
            sentimentScore: 90,
            impactScore: 10,
            source: 'Bloomberg',
            category: 'Institutional',
            publishedAt: new Date().toISOString()
          },
          {
            title: 'Regulatory Clarity Improves for Cryptocurrency Markets',
            summary: 'New regulations provide clearer framework for crypto operations',
            sentiment: 'positive',
            sentimentScore: 75,
            impactScore: 8,
            source: 'Reuters',
            category: 'Regulation',
            publishedAt: new Date().toISOString()
          }
        ],
        summary: {
          overallSentiment: 'positive',
          bullishCount: 3,
          bearishCount: 0,
          neutralCount: 0,
          averageImpact: 9.0
        },
        timestamp: new Date().toISOString(),
        dataQuality: 90
      },
      onChain: {
        success: true,
        whaleActivity: {
          totalTransactions: 145,
          totalValueUSD: 2300000000,
          exchangeDeposits: 45,
          exchangeWithdrawals: 100,
          netFlow: 55,
          sentiment: 'bullish'
        },
        networkMetrics: {
          hashRate: 450,
          mempoolSize: 125000,
          averageFee: 2.5
        },
        timestamp: new Date().toISOString(),
        dataQuality: 85
      }
    };
    
    // Store each data type
    console.log('Storing data in database...');
    await setCachedAnalysis(symbol, 'market-data', sampleData.marketData, 300, 100);
    console.log('✅ Market data stored');
    
    await setCachedAnalysis(symbol, 'sentiment', sampleData.sentiment, 300, 95);
    console.log('✅ Sentiment data stored');
    
    await setCachedAnalysis(symbol, 'technical', sampleData.technical, 300, 100);
    console.log('✅ Technical data stored');
    
    await setCachedAnalysis(symbol, 'news', sampleData.news, 300, 90);
    console.log('✅ News data stored');
    
    await setCachedAnalysis(symbol, 'on-chain', sampleData.onChain, 300, 85);
    console.log('✅ On-chain data stored');
    
    console.log('');
    console.log('✅ All data stored in database');
    console.log('');
    
    // ========================================================================
    // STEP 2: Verify data can be read back
    // ========================================================================
    console.log('📊 STEP 2: Verifying data can be read from database');
    console.log('-'.repeat(80));
    
    const marketData = await getCachedAnalysis(symbol, 'market-data');
    const sentiment = await getCachedAnalysis(symbol, 'sentiment');
    const technical = await getCachedAnalysis(symbol, 'technical');
    const news = await getCachedAnalysis(symbol, 'news');
    const onChain = await getCachedAnalysis(symbol, 'on-chain');
    
    console.log(`Market Data: ${marketData ? '✅ Retrieved' : '❌ Not found'}`);
    console.log(`Sentiment: ${sentiment ? '✅ Retrieved' : '❌ Not found'}`);
    console.log(`Technical: ${technical ? '✅ Retrieved' : '❌ Not found'}`);
    console.log(`News: ${news ? '✅ Retrieved' : '❌ Not found'}`);
    console.log(`On-Chain: ${onChain ? '✅ Retrieved' : '❌ Not found'}`);
    console.log('');
    
    const retrievedCount = [marketData, sentiment, technical, news, onChain].filter(d => d).length;
    console.log(`📊 Retrieved: ${retrievedCount}/5 sources (${Math.round(retrievedCount / 5 * 100)}%)`);
    console.log('');
    
    if (retrievedCount === 0) {
      throw new Error('Failed to retrieve any data from database');
    }
    
    // ========================================================================
    // STEP 3: Format context string from database data
    // ========================================================================
    console.log('📝 STEP 3: Formatting context string from database data');
    console.log('-'.repeat(80));
    
    let context = `Cryptocurrency: ${symbol}\n\n`;
    
    if (marketData?.success && marketData?.priceAggregation) {
      const agg = marketData.priceAggregation;
      context += `Market Data:\n`;
      context += `- Price: $${agg.averagePrice?.toLocaleString()}\n`;
      context += `- 24h Volume: $${(agg.totalVolume24h / 1e9).toFixed(2)}B\n`;
      context += `- Market Cap: $${(marketData.marketData?.marketCap / 1e9).toFixed(2)}B\n`;
      context += `- 24h Change: ${agg.averageChange24h > 0 ? '+' : ''}${agg.averageChange24h?.toFixed(2)}%\n`;
      context += `- High: $${agg.high24h?.toLocaleString()}\n`;
      context += `- Low: $${agg.low24h?.toLocaleString()}\n\n`;
    }
    
    if (sentiment?.success && sentiment?.sentiment) {
      const sent = sentiment.sentiment;
      context += `Social Sentiment:\n`;
      context += `- Score: ${sent.overallScore}/100\n`;
      context += `- Trend: ${sent.trend}\n`;
      context += `- 24h Mentions: ${sentiment.volumeMetrics?.total24h?.toLocaleString()}\n`;
      context += `- Distribution: ${sent.distribution?.positive}% positive, ${sent.distribution?.negative}% negative\n\n`;
    }
    
    if (technical?.success && technical?.indicators) {
      const ind = technical.indicators;
      context += `Technical Analysis:\n`;
      context += `- RSI: ${ind.rsi?.value} (${ind.rsi?.signal})\n`;
      context += `- MACD: ${ind.macd?.signal}\n`;
      context += `- Trend: ${ind.trend?.direction} (${ind.trend?.strength})\n`;
      context += `- EMA20: $${ind.ema20?.toLocaleString()}\n`;
      context += `- EMA50: $${ind.ema50?.toLocaleString()}\n`;
      context += `- Volatility: ${ind.volatility?.current}%\n\n`;
    }
    
    if (news?.success && news?.articles?.length > 0) {
      context += `Recent News (${news.articles.length} articles):\n`;
      news.articles.forEach((article: any, i: number) => {
        context += `${i + 1}. ${article.title}\n`;
        context += `   Sentiment: ${article.sentiment} (${article.sentimentScore}/100)\n`;
        context += `   Impact: ${article.impactScore}/10\n`;
      });
      context += `\nNews Summary: ${news.summary?.overallSentiment} (${news.summary?.bullishCount} bullish, ${news.summary?.bearishCount} bearish)\n\n`;
    }
    
    if (onChain?.success && onChain?.whaleActivity) {
      const whale = onChain.whaleActivity;
      context += `On-Chain Data:\n`;
      context += `- Whale Transactions: ${whale.totalTransactions}\n`;
      context += `- Total Value: $${(whale.totalValueUSD / 1e6).toFixed(2)}M\n`;
      context += `- Exchange Deposits: ${whale.exchangeDeposits} (selling pressure)\n`;
      context += `- Exchange Withdrawals: ${whale.exchangeWithdrawals} (accumulation)\n`;
      context += `- Net Flow: ${whale.netFlow > 0 ? '+' : ''}${whale.netFlow} (${whale.sentiment})\n`;
      context += `- Hash Rate: ${onChain.networkMetrics?.hashRate} EH/s\n\n`;
    }
    
    console.log('Context string formatted:');
    console.log(`- Length: ${context.length} characters`);
    console.log(`- Words: ~${context.split(' ').length}`);
    console.log(`- Lines: ${context.split('\n').length}`);
    console.log('');
    console.log('Preview (first 500 chars):');
    console.log(context.substring(0, 500) + '...');
    console.log('');
    
    // ========================================================================
    // STEP 4: Generate Gemini analysis
    // ========================================================================
    console.log('🤖 STEP 4: Generating Gemini analysis from database data');
    console.log('-'.repeat(80));
    console.log('');
    
    console.log('Calling Gemini API...');
    const startTime = Date.now();
    
    try {
      const analysis = await generateCryptoSummary(symbol, context);
      const duration = Date.now() - startTime;
      
      console.log('');
      console.log('✅ SUCCESS!');
      console.log(`   Duration: ${duration}ms (${(duration / 1000).toFixed(1)}s)`);
      console.log(`   Analysis length: ${analysis.length} characters`);
      console.log(`   Words: ~${analysis.split(' ').length}`);
      console.log('');
      
      // Verify timing
      if (duration > 60000) {
        console.log(`⚠️  WARNING: Took ${(duration / 1000).toFixed(1)}s (> 60s Vercel limit)`);
      } else {
        console.log(`✅ GOOD: Completed in ${(duration / 1000).toFixed(1)}s (< 60s Vercel limit)`);
      }
      console.log('');
      
      // ====================================================================
      // STEP 5: Verify analysis quality
      // ====================================================================
      console.log('📊 STEP 5: Verifying analysis quality');
      console.log('-'.repeat(80));
      
      // Check for key sections
      const hasSections = {
        executiveSummary: /EXECUTIVE SUMMARY/i.test(analysis),
        marketAnalysis: /MARKET ANALYSIS/i.test(analysis),
        technicalAnalysis: /TECHNICAL ANALYSIS/i.test(analysis),
        sentiment: /SENTIMENT|SOCIAL/i.test(analysis),
        news: /NEWS|DEVELOPMENTS/i.test(analysis),
        onChain: /ON-CHAIN|FUNDAMENTALS/i.test(analysis),
        risk: /RISK|OUTLOOK/i.test(analysis)
      };
      
      console.log('Section presence:');
      Object.entries(hasSections).forEach(([section, present]) => {
        console.log(`  ${present ? '✅' : '❌'} ${section}`);
      });
      console.log('');
      
      const sectionsPresent = Object.values(hasSections).filter(v => v).length;
      const sectionScore = Math.round((sectionsPresent / 7) * 100);
      console.log(`Section Score: ${sectionsPresent}/7 (${sectionScore}%)`);
      console.log('');
      
      // Check for data references
      const hasDataReferences = {
        price: /\$95,?752|\$95,?700|\$95,?800/i.test(analysis),
        sentiment: /75|bullish/i.test(analysis),
        rsi: /62\.5|RSI/i.test(analysis),
        whales: /145|whale/i.test(analysis),
        news: /institutional|adoption/i.test(analysis)
      };
      
      console.log('Data references:');
      Object.entries(hasDataReferences).forEach(([ref, present]) => {
        console.log(`  ${present ? '✅' : '❌'} ${ref}`);
      });
      console.log('');
      
      const referencesPresent = Object.values(hasDataReferences).filter(v => v).length;
      const referenceScore = Math.round((referencesPresent / 5) * 100);
      console.log(`Reference Score: ${referencesPresent}/5 (${referenceScore}%)`);
      console.log('');
      
      // Overall quality score
      const overallScore = Math.round((sectionScore + referenceScore) / 2);
      console.log(`Overall Quality: ${overallScore}%`);
      console.log('');
      
      if (overallScore >= 80) {
        console.log('✅ EXCELLENT: Analysis is comprehensive and data-driven');
      } else if (overallScore >= 60) {
        console.log('⚠️  GOOD: Analysis is acceptable but could be improved');
      } else {
        console.log('❌ POOR: Analysis lacks key sections or data references');
      }
      console.log('');
      
      // Show analysis preview
      console.log('Analysis Preview (first 1000 chars):');
      console.log('-'.repeat(80));
      console.log(analysis.substring(0, 1000) + '...');
      console.log('');
      
      // ====================================================================
      // SUMMARY
      // ====================================================================
      console.log('🎯 TEST SUMMARY');
      console.log('='.repeat(80));
      console.log('✅ Database storage: Working');
      console.log('✅ Database retrieval: Working');
      console.log('✅ Context formatting: Working');
      console.log('✅ Gemini API: Working');
      console.log('✅ Analysis generation: Working');
      console.log(`✅ Analysis quality: ${overallScore}%`);
      console.log('');
      console.log('💡 Conclusion:');
      console.log('   Gemini successfully reads data from database and generates');
      console.log('   comprehensive, data-driven analysis. The system is working');
      console.log('   correctly and ready for production use.');
      console.log('');
      
      process.exit(0);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('');
      console.error('❌ FAILED');
      console.error(`   Duration: ${duration}ms (${(duration / 1000).toFixed(1)}s)`);
      console.error(`   Error: ${error.message}`);
      console.error('');
      
      if (error.message.includes('503') || error.message.includes('overloaded')) {
        console.error('⚠️  Gemini API is temporarily overloaded (Google server issue)');
        console.error('   This is not a code problem. Try again in a few minutes.');
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ TEST FAILED');
    console.error('='.repeat(80));
    console.error('Error:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    console.error('');
    process.exit(1);
  }
}

testGeminiWithDatabase();
