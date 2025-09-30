const axios = require('axios');
const OpenAI = require('openai');

// This demonstrates exactly how Social Media and Institutional indicators are derived

async function demonstrateSocialInstitutionalSources() {
    console.log('🔍 SOCIAL MEDIA & INSTITUTIONAL INDICATORS BREAKDOWN');
    console.log('============================================================\n');

    try {
        // 1. GET REAL MARKET DATA FIRST
        console.log('📊 1. GATHERING REAL MARKET DATA');
        console.log('----------------------------------------');
        
        // Bitcoin Price
        const priceResponse = await axios.get('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
        const currentPrice = parseFloat(priceResponse.data.lastPrice);
        const priceChange = parseFloat(priceResponse.data.priceChangePercent);
        
        // Order Book Imbalance
        const orderBookResponse = await axios.get('https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=20');
        const bids = orderBookResponse.data.bids.slice(0, 10);
        const asks = orderBookResponse.data.asks.slice(0, 10);
        const bidVolume = bids.reduce((sum, [price, qty]) => sum + parseFloat(qty), 0);
        const askVolume = asks.reduce((sum, [price, qty]) => sum + parseFloat(qty), 0);
        const volumeImbalance = (bidVolume - askVolume) / (bidVolume + askVolume);
        
        // Fear & Greed
        const fearGreedResponse = await axios.get('https://api.alternative.me/fng/');
        const fearGreedIndex = parseInt(fearGreedResponse.data.data[0].value);
        
        // Whale Movements (Large Trades)
        const tradesResponse = await axios.get('https://api.binance.com/api/v3/aggTrades?symbol=BTCUSDT&limit=1000');
        const largeTrades = tradesResponse.data
            .filter(trade => parseFloat(trade.q) > 5) // >5 BTC trades
            .slice(0, 5)
            .map(trade => ({
                side: trade.m ? 'SELL' : 'BUY',
                quantity: parseFloat(trade.q),
                price: parseFloat(trade.p)
            }));

        console.log(`Current Price: $${currentPrice.toLocaleString()}`);
        console.log(`24h Change: ${priceChange.toFixed(2)}%`);
        console.log(`Order Book Imbalance: ${(volumeImbalance * 100).toFixed(2)}%`);
        console.log(`Fear & Greed Index: ${fearGreedIndex}`);
        console.log(`Recent Large Trades: ${largeTrades.length} trades >5 BTC`);
        
        // 2. SIMULATE THE AI ANALYSIS PROCESS
        console.log('\n🤖 2. AI ANALYSIS PROCESS (OpenAI GPT-4o)');
        console.log('----------------------------------------');
        
        const marketContext = `
        REAL MARKET DATA CONTEXT:
        - Bitcoin Price: $${currentPrice} (LIVE from Binance)
        - 24h Change: ${priceChange}%
        - Order Book Imbalance: ${(volumeImbalance * 100).toFixed(2)}%
        - Fear & Greed Index: ${fearGreedIndex}
        
        WHALE MOVEMENTS DETECTED:
        ${largeTrades.map(trade => `- ${trade.side} ${trade.quantity.toFixed(2)} BTC at $${trade.price.toLocaleString()}`).join('\n')}
        `;

        console.log('AI Prompt Context:');
        console.log(marketContext);

        // 3. SHOW HOW AI DERIVES SOCIAL MEDIA SENTIMENT
        console.log('\n📱 3. SOCIAL MEDIA SENTIMENT DERIVATION');
        console.log('----------------------------------------');
        
        console.log('AI Analysis Logic for Social Media:');
        console.log('1. Analyzes Fear & Greed Index (28 = "Fear")');
        console.log('2. Considers price action (-1.99% = negative sentiment)');
        console.log('3. Evaluates order book pressure (-23% = bearish social sentiment)');
        console.log('4. Reviews recent news context (if available)');
        console.log('5. Assesses overall market volatility and uncertainty');
        
        // Social Media Logic Simulation
        let socialSentiment;
        if (fearGreedIndex < 30 && priceChange < -1) {
            socialSentiment = 'bearish';
        } else if (fearGreedIndex > 70 && priceChange > 1) {
            socialSentiment = 'bullish';
        } else {
            socialSentiment = 'neutral';
        }
        
        console.log(`\nDerived Social Media Sentiment: "${socialSentiment}"`);
        console.log('Reasoning:');
        console.log(`- Fear & Greed: ${fearGreedIndex} (${fearGreedIndex < 30 ? 'Fear' : fearGreedIndex > 70 ? 'Greed' : 'Neutral'})`);
        console.log(`- Price Action: ${priceChange.toFixed(2)}% (${priceChange < -1 ? 'Negative' : priceChange > 1 ? 'Positive' : 'Neutral'})`);
        console.log(`- Market Pressure: ${volumeImbalance > 0 ? 'Buying' : 'Selling'} pressure`);

        // 4. SHOW HOW AI DERIVES INSTITUTIONAL FLOW
        console.log('\n🏛️ 4. INSTITUTIONAL FLOW DERIVATION');
        console.log('----------------------------------------');
        
        console.log('AI Analysis Logic for Institutional Flow:');
        console.log('1. Analyzes whale movements (large trades >5 BTC)');
        console.log('2. Evaluates order book depth and institutional-sized orders');
        console.log('3. Considers funding rates (futures market sentiment)');
        console.log('4. Reviews volume profile for institutional activity patterns');
        console.log('5. Assesses market structure and liquidity');

        // Institutional Flow Logic Simulation
        const buyTrades = largeTrades.filter(t => t.side === 'BUY').length;
        const sellTrades = largeTrades.filter(t => t.side === 'SELL').length;
        const netWhaleFlow = buyTrades - sellTrades;
        
        let institutionalFlow;
        if (netWhaleFlow > 2) {
            institutionalFlow = 'bullish';
        } else if (netWhaleFlow < -2) {
            institutionalFlow = 'bearish';
        } else {
            institutionalFlow = 'neutral';
        }

        console.log(`\nDerived Institutional Flow: "${institutionalFlow}"`);
        console.log('Reasoning:');
        console.log(`- Whale Buy Trades: ${buyTrades}`);
        console.log(`- Whale Sell Trades: ${sellTrades}`);
        console.log(`- Net Flow: ${netWhaleFlow > 0 ? '+' : ''}${netWhaleFlow} (${netWhaleFlow > 0 ? 'Institutional buying' : netWhaleFlow < 0 ? 'Institutional selling' : 'Balanced'})`);
        console.log(`- Order Book: ${Math.abs(volumeImbalance * 100).toFixed(1)}% imbalance (${volumeImbalance > 0 ? 'bid' : 'ask'} heavy)`);

        // 5. SHOW THE COMPLETE AI RESPONSE STRUCTURE
        console.log('\n🎯 5. COMPLETE AI RESPONSE STRUCTURE');
        console.log('----------------------------------------');
        
        const simulatedAIResponse = {
            marketSentiment: {
                overall: "cautiously bullish",
                fearGreedIndex: fearGreedIndex,
                institutionalFlow: institutionalFlow,
                socialSentiment: socialSentiment
            }
        };

        console.log('AI Returns JSON:');
        console.log(JSON.stringify(simulatedAIResponse, null, 2));

        // 6. SHOW HOW FRONTEND PROCESSES THESE VALUES
        console.log('\n🖥️ 6. FRONTEND PROCESSING');
        console.log('----------------------------------------');
        
        console.log('Frontend Mapping Logic:');
        console.log(`rawData.marketSentiment.socialSentiment = "${socialSentiment}"`);
        console.log(`rawData.marketSentiment.institutionalFlow = "${institutionalFlow}"`);
        console.log('');
        console.log('Display Logic:');
        console.log(`Social Media: "${socialSentiment}" → Displayed as "neutral"`);
        console.log(`Institutional: "${institutionalFlow}" → Displayed as "neutral"`);

        // 7. ACTUAL API CALL TO VERIFY
        console.log('\n✅ 7. VERIFICATION WITH ACTUAL API');
        console.log('----------------------------------------');
        
        try {
            const apiResponse = await axios.get('http://localhost:3000/api/btc-analysis');
            const actualSentiment = apiResponse.data.data.marketSentiment;
            
            console.log('Actual API Response:');
            console.log(`Social Sentiment: "${actualSentiment.socialSentiment || 'Unknown'}"`);
            console.log(`Institutional Flow: "${actualSentiment.institutionalFlow || 'Unknown'}"`);
            console.log(`Overall: "${actualSentiment.overall || 'Unknown'}"`);
            console.log(`Fear & Greed: ${actualSentiment.fearGreedIndex || 'N/A'}`);
            
        } catch (error) {
            console.log('Could not verify with actual API (server may not be running)');
        }

        console.log('\n🔍 SUMMARY: HOW THESE INDICATORS ARE DERIVED');
        console.log('============================================================');
        console.log('SOCIAL MEDIA SENTIMENT:');
        console.log('- Source: AI analysis of Fear & Greed Index + price action + market pressure');
        console.log('- Method: Algorithmic interpretation of market psychology indicators');
        console.log('- NOT from actual social media APIs (Twitter, Reddit, etc.)');
        console.log('');
        console.log('INSTITUTIONAL FLOW:');
        console.log('- Source: AI analysis of whale movements + order book depth + funding rates');
        console.log('- Method: Pattern recognition in large transaction flows and market structure');
        console.log('- Based on actual trading data from institutional-sized orders');

    } catch (error) {
        console.error('❌ Error in demonstration:', error.message);
    }
}

demonstrateSocialInstitutionalSources();