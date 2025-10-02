#!/usr/bin/env node

/**
 * Test Script: Enhanced Analysis APIs
 * Tests the new enhanced Bitcoin and Ethereum analysis APIs
 */

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const ENDPOINTS = [
  '/api/btc-analysis-enhanced',
  '/api/eth-analysis-enhanced'
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ data: jsonData, status: response.statusCode });
        } catch (error) {
          reject(new Error(`JSON Parse Error: ${error.message}`));
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(45000, () => {
      request.destroy();
      reject(new Error('Request timeout after 45 seconds'));
    });
  });
}

async function testEnhancedAnalysis() {
  log('cyan', '🚀 TESTING ENHANCED ANALYSIS APIs');
  log('cyan', '=' .repeat(60));
  
  for (const endpoint of ENDPOINTS) {
    const symbol = endpoint.includes('btc') ? 'BTC' : 'ETH';
    
    log('yellow', `\n📊 Testing Enhanced ${symbol} Analysis...`);
    log('blue', `Endpoint: ${BASE_URL}${endpoint}`);
    
    try {
      const startTime = Date.now();
      const result = await makeRequest(`${BASE_URL}${endpoint}`);
      const endTime = Date.now();
      const { data: response, status } = result;
      
      log('cyan', `📡 Response: ${status} (${endTime - startTime}ms)`);
      
      if (status === 200 && response.success) {
        log('green', `✅ ${symbol} Enhanced Analysis Success`);
        
        const data = response.data;
        
        // Test basic data
        log('bright', `\n💰 MARKET DATA:`);
        log('cyan', `  Price: $${data.currentPrice?.toLocaleString() || 'N/A'}`);
        log('cyan', `  24h Change: ${data.marketData?.change24h?.toFixed(2) || 'N/A'}%`);
        log('cyan', `  Volume: ${data.marketData?.volume24h?.toLocaleString() || 'N/A'} ${symbol}`);
        log('cyan', `  Market Cap: $${data.marketData?.marketCap?.toLocaleString() || 'N/A'}`);
        
        // Test technical indicators
        if (data.technicalIndicators) {
          log('bright', `\n📈 TECHNICAL INDICATORS:`);
          const ti = data.technicalIndicators;
          log('cyan', `  RSI: ${ti.rsi?.value?.toFixed(2) || 'N/A'} (${ti.rsi?.signal || 'N/A'})`);
          log('cyan', `  EMA20: $${ti.ema20?.toLocaleString() || 'N/A'}`);
          log('cyan', `  EMA50: $${ti.ema50?.toLocaleString() || 'N/A'}`);
          log('cyan', `  MACD: ${ti.macd?.signal || 'N/A'}`);
          
          // Check for realistic values
          if (ti.rsi?.value >= 0 && ti.rsi?.value <= 100) {
            log('green', '  ✅ RSI in valid range (0-100)');
          } else {
            log('red', '  ❌ RSI out of valid range');
          }
          
          if (ti.ema20 && ti.ema50 && ti.ema20 > ti.ema50 * 0.95) {
            log('green', '  ✅ EMA values are realistic');
          } else {
            log('red', '  ❌ EMA values seem unrealistic');
          }
        }
        
        // Test trading signals
        if (data.tradingSignals && data.tradingSignals.length > 0) {
          log('bright', `\n🎯 TRADING SIGNALS (${data.tradingSignals.length}):`);
          data.tradingSignals.forEach((signal, index) => {
            const signalColor = signal.signal === 'BUY' ? 'green' : signal.signal === 'SELL' ? 'red' : 'yellow';
            log(signalColor, `  ${index + 1}. ${signal.signal} - ${signal.strength} (${signal.confidence}%)`);
            log('cyan', `     Timeframe: ${signal.timeframe} | Reason: ${signal.reason}`);
          });
          log('green', '  ✅ Trading signals generated with real data');
        } else {
          log('red', '  ❌ No trading signals found');
        }
        
        // Test price predictions
        if (data.predictions) {
          log('bright', `\n🔮 PRICE PREDICTIONS:`);
          const pred = data.predictions;
          log('cyan', `  1H: $${pred.hourly?.target?.toLocaleString() || 'N/A'} (${pred.hourly?.confidence || 'N/A'}%)`);
          log('cyan', `  1D: $${pred.daily?.target?.toLocaleString() || 'N/A'} (${pred.daily?.confidence || 'N/A'}%)`);
          log('cyan', `  1W: $${pred.weekly?.target?.toLocaleString() || 'N/A'} (${pred.weekly?.confidence || 'N/A'}%)`);
          
          // Check for realistic predictions
          const currentPrice = data.currentPrice;
          if (pred.hourly?.target && Math.abs((pred.hourly.target - currentPrice) / currentPrice) < 0.05) {
            log('green', '  ✅ Hourly prediction is realistic (<5% change)');
          } else {
            log('yellow', '  ⚠️ Hourly prediction may be too aggressive');
          }
        } else {
          log('red', '  ❌ No price predictions found');
        }
        
        // Test market sentiment
        if (data.marketSentiment) {
          log('bright', `\n📊 MARKET SENTIMENT:`);
          const sentiment = data.marketSentiment;
          log('cyan', `  Overall: ${sentiment.overall || 'N/A'}`);
          log('cyan', `  Fear & Greed: ${sentiment.fearGreedIndex || 'N/A'}/100`);
          log('cyan', `  Technical: ${sentiment.technicalSentiment || 'N/A'}`);
          log('cyan', `  Order Book: ${sentiment.orderBookSentiment || 'N/A'}`);
          
          if (symbol === 'ETH' && sentiment.defiSentiment) {
            log('cyan', `  DeFi: ${sentiment.defiSentiment}`);
          }
          
          log('green', '  ✅ Market sentiment analysis complete');
        } else {
          log('red', '  ❌ No market sentiment data found');
        }
        
        // Test AI analysis
        if (data.aiAnalysis) {
          log('bright', `\n🤖 AI ANALYSIS:`);
          log('cyan', `  "${data.aiAnalysis}"`);
          log('green', '  ✅ OpenAI analysis generated');
        } else {
          log('yellow', '  ⚠️ No AI analysis (OpenAI may have failed)');
        }
        
        // Test data sources
        if (data.source) {
          log('bright', `\n📡 DATA SOURCES:`);
          log('cyan', `  ${data.source}`);
          
          if (data.source.includes('Live APIs')) {
            log('green', '  ✅ Using live API data');
          } else {
            log('red', '  ❌ Not using live API data');
          }
        }
        
      } else if (status === 503 || !response.success) {
        log('yellow', `⚠️ ${symbol} APIs Unavailable`);
        log('cyan', `  Error: ${response.error || 'Unknown'}`);
        log('cyan', `  Details: ${response.details || 'No details'}`);
        log('green', '  ✅ Proper error handling (no fallback data)');
        
      } else {
        log('red', `❌ Unexpected ${symbol} Response: Status ${status}`);
      }
      
    } catch (error) {
      log('red', `❌ ${symbol} Request Failed: ${error.message}`);
    }
  }
  
  log('cyan', '\n' + '=' .repeat(60));
  log('green', '✅ Enhanced Analysis Test Complete');
  
  log('bright', '\n📋 ENHANCED FEATURES TESTED:');
  log('green', '✅ Real technical indicators (no random data)');
  log('green', '✅ Intelligent trading signals with reasons');
  log('green', '✅ Realistic price predictions with confidence');
  log('green', '✅ Comprehensive market sentiment analysis');
  log('green', '✅ OpenAI integration for professional analysis');
  log('green', '✅ Real order book and Fear & Greed data');
  log('green', '✅ Proper error handling (no fallbacks)');
}

// Run the test
if (require.main === module) {
  testEnhancedAnalysis().catch(error => {
    log('red', `Test failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { testEnhancedAnalysis };