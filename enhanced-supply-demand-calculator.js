const axios = require('axios');

class EnhancedSupplyDemandCalculator {
    constructor() {
        this.apis = {
            binance: 'https://api.binance.com/api/v3',
            coinbase: 'https://api.exchange.coinbase.com',
            kraken: 'https://api.kraken.com/0/public',
            coingecko: 'https://api.coingecko.com/api/v3'
        };
    }

    // Get real order book data to identify actual supply/demand levels
    async getOrderBookData(symbol = 'BTCUSDT') {
        try {
            const response = await axios.get(`${this.apis.binance}/depth`, {
                params: { symbol, limit: 1000 }
            });
            
            return {
                bids: response.data.bids.map(([price, quantity]) => ({
                    price: parseFloat(price),
                    quantity: parseFloat(quantity),
                    total: parseFloat(price) * parseFloat(quantity)
                })),
                asks: response.data.asks.map(([price, quantity]) => ({
                    price: parseFloat(price),
                    quantity: parseFloat(quantity),
                    total: parseFloat(price) * parseFloat(quantity)
                }))
            };
        } catch (error) {
            console.error('Error fetching order book:', error.message);
            return null;
        }
    }

    // Get historical volume profile data
    async getVolumeProfile(symbol = 'BTCUSDT', interval = '1h', limit = 168) {
        try {
            const response = await axios.get(`${this.apis.binance}/klines`, {
                params: { symbol, interval, limit }
            });
            
            return response.data.map(candle => ({
                openTime: candle[0],
                open: parseFloat(candle[1]),
                high: parseFloat(candle[2]),
                low: parseFloat(candle[3]),
                close: parseFloat(candle[4]),
                volume: parseFloat(candle[5]),
                closeTime: candle[6],
                quoteVolume: parseFloat(candle[7]),
                trades: candle[8],
                buyBaseVolume: parseFloat(candle[9]),
                buyQuoteVolume: parseFloat(candle[10])
            }));
        } catch (error) {
            console.error('Error fetching volume profile:', error.message);
            return null;
        }
    }

    // Analyze real support/resistance from historical price action
    findHistoricalLevels(volumeData, currentPrice) {
        if (!volumeData) return { support: [], resistance: [] };

        // Create price-volume histogram
        const priceVolumeMap = new Map();
        const priceRange = 100; // Group prices within $100 ranges
        
        volumeData.forEach(candle => {
            const priceKey = Math.round(candle.close / priceRange) * priceRange;
            const existing = priceVolumeMap.get(priceKey) || { volume: 0, touches: 0, high: 0, low: Infinity };
            
            priceVolumeMap.set(priceKey, {
                volume: existing.volume + candle.volume,
                touches: existing.touches + 1,
                high: Math.max(existing.high, candle.high),
                low: Math.min(existing.low, candle.low)
            });
        });

        // Sort by volume to find significant levels
        const significantLevels = Array.from(priceVolumeMap.entries())
            .map(([price, data]) => ({ price, ...data }))
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 10); // Top 10 volume levels

        const support = significantLevels
            .filter(level => level.price < currentPrice)
            .sort((a, b) => b.price - a.price)
            .slice(0, 3);

        const resistance = significantLevels
            .filter(level => level.price > currentPrice)
            .sort((a, b) => a.price - b.price)
            .slice(0, 3);

        return { support, resistance };
    }

    // Calculate order book imbalance to predict price direction
    calculateOrderBookImbalance(orderBook) {
        if (!orderBook) return null;

        const topBids = orderBook.bids.slice(0, 20);
        const topAsks = orderBook.asks.slice(0, 20);

        const bidVolume = topBids.reduce((sum, bid) => sum + bid.quantity, 0);
        const askVolume = topAsks.reduce((sum, ask) => sum + ask.quantity, 0);
        const bidValue = topBids.reduce((sum, bid) => sum + bid.total, 0);
        const askValue = topAsks.reduce((sum, ask) => sum + ask.total, 0);

        return {
            volumeImbalance: (bidVolume - askVolume) / (bidVolume + askVolume),
            valueImbalance: (bidValue - askValue) / (bidValue + askValue),
            bidPressure: bidVolume / (bidVolume + askVolume),
            askPressure: askVolume / (bidVolume + askVolume),
            strongestBid: Math.max(...topBids.map(b => b.quantity)),
            strongestAsk: Math.max(...topAsks.map(a => a.quantity))
        };
    }

    // Get real-time market sentiment from multiple sources
    async getMarketSentiment() {
        try {
            // Fear & Greed Index
            const fearGreedResponse = await axios.get('https://api.alternative.me/fng/');
            const fearGreed = fearGreedResponse.data.data[0];

            // Funding rates (futures market sentiment)
            const fundingResponse = await axios.get(`${this.apis.binance}/premiumIndex`, {
                params: { symbol: 'BTCUSDT' }
            });

            return {
                fearGreedIndex: parseInt(fearGreed.value),
                fearGreedClassification: fearGreed.value_classification,
                fundingRate: parseFloat(fundingResponse.data.lastFundingRate),
                nextFundingTime: fundingResponse.data.nextFundingTime
            };
        } catch (error) {
            console.error('Error fetching market sentiment:', error.message);
            return null;
        }
    }

    // Enhanced supply/demand calculation using real data
    async calculateEnhancedZones(symbol = 'BTCUSDT') {
        console.log('🔬 ENHANCED SUPPLY/DEMAND ANALYSIS');
        console.log('============================================================');

        // Get current price
        const priceResponse = await axios.get(`${this.apis.binance}/ticker/price`, {
            params: { symbol }
        });
        const currentPrice = parseFloat(priceResponse.data.price);
        console.log(`📊 Current ${symbol} Price: $${currentPrice.toLocaleString()}`);

        // Get real market data
        const [orderBook, volumeData, sentiment] = await Promise.all([
            this.getOrderBookData(symbol),
            this.getVolumeProfile(symbol),
            this.getMarketSentiment()
        ]);

        // Analyze order book imbalance
        const imbalance = this.calculateOrderBookImbalance(orderBook);
        console.log('\n📈 ORDER BOOK ANALYSIS:');
        console.log(`Volume Imbalance: ${(imbalance.volumeImbalance * 100).toFixed(2)}%`);
        console.log(`Bid Pressure: ${(imbalance.bidPressure * 100).toFixed(2)}%`);
        console.log(`Ask Pressure: ${(imbalance.askPressure * 100).toFixed(2)}%`);

        // Find historical support/resistance
        const historicalLevels = this.findHistoricalLevels(volumeData, currentPrice);
        console.log('\n🏛️ HISTORICAL VOLUME LEVELS:');
        console.log('Support Levels (High Volume):');
        historicalLevels.support.forEach((level, i) => {
            console.log(`  ${i + 1}. $${level.price.toLocaleString()} - Volume: ${level.volume.toLocaleString()} - Touches: ${level.touches}`);
        });
        console.log('Resistance Levels (High Volume):');
        historicalLevels.resistance.forEach((level, i) => {
            console.log(`  ${i + 1}. $${level.price.toLocaleString()} - Volume: ${level.volume.toLocaleString()} - Touches: ${level.touches}`);
        });

        // Market sentiment analysis
        if (sentiment) {
            console.log('\n🧠 MARKET SENTIMENT:');
            console.log(`Fear & Greed Index: ${sentiment.fearGreedIndex}/100 (${sentiment.fearGreedClassification})`);
            console.log(`Funding Rate: ${(sentiment.fundingRate * 100).toFixed(4)}%`);
        }

        // Calculate enhanced zones using real data
        const enhancedZones = this.calculateRealSupplyDemandZones(
            currentPrice, 
            orderBook, 
            historicalLevels, 
            imbalance, 
            sentiment
        );

        console.log('\n🎯 ENHANCED SUPPLY/DEMAND ZONES:');
        console.log('📈 SUPPLY ZONES (Real Resistance):');
        enhancedZones.supply.forEach((zone, i) => {
            console.log(`  Zone ${i + 1}: $${zone.price.toLocaleString()} - Strength: ${zone.strength} - Volume: ${zone.volume.toLocaleString()}`);
        });
        console.log('📉 DEMAND ZONES (Real Support):');
        enhancedZones.demand.forEach((zone, i) => {
            console.log(`  Zone ${i + 1}: $${zone.price.toLocaleString()} - Strength: ${zone.strength} - Volume: ${zone.volume.toLocaleString()}`);
        });

        return {
            currentPrice,
            orderBookImbalance: imbalance,
            historicalLevels,
            marketSentiment: sentiment,
            enhancedZones
        };
    }  
  // Calculate real supply/demand zones using multiple data sources
    calculateRealSupplyDemandZones(currentPrice, orderBook, historicalLevels, imbalance, sentiment) {
        const zones = { supply: [], demand: [] };

        // Weight factors based on market conditions
        const sentimentWeight = sentiment ? (sentiment.fearGreedIndex > 50 ? 1.2 : 0.8) : 1;
        const imbalanceWeight = imbalance ? (1 + Math.abs(imbalance.volumeImbalance)) : 1;

        // Supply zones (resistance) - combine order book and historical data
        if (orderBook && orderBook.asks) {
            // Find significant ask walls
            const askWalls = orderBook.asks
                .filter(ask => ask.quantity > 10) // Significant size
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);

            askWalls.forEach((wall, index) => {
                const strength = this.calculateZoneStrength(wall.quantity, wall.total, sentimentWeight, imbalanceWeight);
                zones.supply.push({
                    price: wall.price,
                    volume: wall.quantity,
                    strength: strength,
                    source: 'orderbook',
                    confidence: Math.min(95, 60 + (wall.quantity / 100))
                });
            });
        }

        // Add historical resistance levels
        historicalLevels.resistance.forEach(level => {
            const strength = this.calculateZoneStrength(level.volume, level.touches * 1000, sentimentWeight, imbalanceWeight);
            zones.supply.push({
                price: level.price,
                volume: level.volume,
                strength: strength,
                source: 'historical',
                confidence: Math.min(90, 40 + (level.touches * 10))
            });
        });

        // Demand zones (support) - combine order book and historical data
        if (orderBook && orderBook.bids) {
            // Find significant bid walls
            const bidWalls = orderBook.bids
                .filter(bid => bid.quantity > 10) // Significant size
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);

            bidWalls.forEach((wall, index) => {
                const strength = this.calculateZoneStrength(wall.quantity, wall.total, sentimentWeight, imbalanceWeight);
                zones.demand.push({
                    price: wall.price,
                    volume: wall.quantity,
                    strength: strength,
                    source: 'orderbook',
                    confidence: Math.min(95, 60 + (wall.quantity / 100))
                });
            });
        }

        // Add historical support levels
        historicalLevels.support.forEach(level => {
            const strength = this.calculateZoneStrength(level.volume, level.touches * 1000, sentimentWeight, imbalanceWeight);
            zones.demand.push({
                price: level.price,
                volume: level.volume,
                strength: strength,
                source: 'historical',
                confidence: Math.min(90, 40 + (level.touches * 10))
            });
        });

        // Sort and limit to top zones
        zones.supply = zones.supply
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 3);
        
        zones.demand = zones.demand
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 3);

        return zones;
    }

    // Calculate zone strength based on multiple factors
    calculateZoneStrength(volume, value, sentimentWeight, imbalanceWeight) {
        const baseStrength = Math.log10(volume) * Math.log10(value);
        const adjustedStrength = baseStrength * sentimentWeight * imbalanceWeight;
        
        if (adjustedStrength > 15) return 'VERY_STRONG';
        if (adjustedStrength > 10) return 'STRONG';
        if (adjustedStrength > 5) return 'MODERATE';
        return 'WEAK';
    }

    // Get whale movement data (large transactions)
    async getWhaleMovements() {
        try {
            // This would typically require a premium API like Whale Alert
            // For demo, we'll simulate whale detection from large trades
            const tradesResponse = await axios.get(`${this.apis.binance}/aggTrades`, {
                params: { symbol: 'BTCUSDT', limit: 1000 }
            });

            const largeTrades = tradesResponse.data
                .filter(trade => parseFloat(trade.q) > 10) // > 10 BTC trades
                .map(trade => ({
                    price: parseFloat(trade.p),
                    quantity: parseFloat(trade.q),
                    time: trade.T,
                    isBuyerMaker: trade.m
                }));

            return largeTrades;
        } catch (error) {
            console.error('Error fetching whale movements:', error.message);
            return [];
        }
    }
}

// Demo execution
async function runEnhancedAnalysis() {
    const calculator = new EnhancedSupplyDemandCalculator();
    
    try {
        const analysis = await calculator.calculateEnhancedZones('BTCUSDT');
        
        console.log('\n🐋 WHALE MOVEMENT ANALYSIS:');
        const whaleMovements = await calculator.getWhaleMovements();
        const recentWhales = whaleMovements.slice(0, 5);
        
        recentWhales.forEach((whale, i) => {
            const side = whale.isBuyerMaker ? 'SELL' : 'BUY';
            console.log(`  ${i + 1}. ${side} ${whale.quantity.toFixed(2)} BTC at $${whale.price.toLocaleString()}`);
        });

        console.log('\n✅ ANALYSIS COMPLETE - Using 100% Real Market Data');
        console.log('📊 Data Sources: Binance Order Book, Historical Volume, Fear & Greed Index, Funding Rates');
        
        return analysis;
    } catch (error) {
        console.error('Analysis failed:', error.message);
    }
}

module.exports = { EnhancedSupplyDemandCalculator, runEnhancedAnalysis };

// Run if called directly
if (require.main === module) {
    runEnhancedAnalysis();
}