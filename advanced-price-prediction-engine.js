const axios = require('axios');

class AdvancedPricePredictionEngine {
    constructor() {
        this.apis = {
            binance: 'https://api.binance.com/api/v3',
            coingecko: 'https://api.coingecko.com/api/v3'
        };
    }

    // Get comprehensive market data for all timeframes
    async getMultiTimeframeData(symbol = 'BTCUSDT') {
        try {
            const [
                data1m,   // 1-minute for micro trends
                data5m,   // 5-minute for short-term
                data15m,  // 15-minute for intraday
                data1h,   // 1-hour for hourly predictions
                data4h,   // 4-hour for daily predictions
                data1d,   // 1-day for weekly predictions
                data1w    // 1-week for long-term context
            ] = await Promise.all([
                this.getKlineData(symbol, '1m', 100),
                this.getKlineData(symbol, '5m', 288),  // 24 hours
                this.getKlineData(symbol, '15m', 96),  // 24 hours
                this.getKlineData(symbol, '1h', 168),  // 7 days
                this.getKlineData(symbol, '4h', 168),  // 28 days
                this.getKlineData(symbol, '1d', 100),  // 100 days
                this.getKlineData(symbol, '1w', 52)    // 1 year
            ]);

            return {
                '1m': data1m,
                '5m': data5m,
                '15m': data15m,
                '1h': data1h,
                '4h': data4h,
                '1d': data1d,
                '1w': data1w
            };
        } catch (error) {
            console.error('Error fetching multi-timeframe data:', error);
            return null;
        }
    }

    // Get candlestick data for specific timeframe
    async getKlineData(symbol, interval, limit) {
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
    }

    // Calculate RSI (Relative Strength Index)
    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return null;

        let gains = 0;
        let losses = 0;

        // Calculate initial average gain and loss
        for (let i = 1; i <= period; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        const rsiValues = [];

        // Calculate RSI for remaining periods
        for (let i = period + 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            const gain = change > 0 ? change : 0;
            const loss = change < 0 ? -change : 0;

            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;

            const rs = avgGain / avgLoss;
            const rsi = 100 - (100 / (1 + rs));
            rsiValues.push(rsi);
        }

        return rsiValues;
    }

    // Calculate MACD (Moving Average Convergence Divergence)
    calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        const emaFast = this.calculateEMA(prices, fastPeriod);
        const emaSlow = this.calculateEMA(prices, slowPeriod);

        if (!emaFast || !emaSlow) return null;

        const macdLine = [];
        const minLength = Math.min(emaFast.length, emaSlow.length);

        for (let i = 0; i < minLength; i++) {
            macdLine.push(emaFast[i] - emaSlow[i]);
        }

        const signalLine = this.calculateEMA(macdLine, signalPeriod);
        const histogram = [];

        if (signalLine) {
            for (let i = 0; i < signalLine.length; i++) {
                histogram.push(macdLine[macdLine.length - signalLine.length + i] - signalLine[i]);
            }
        }

        return {
            macd: macdLine,
            signal: signalLine,
            histogram: histogram
        };
    }

    // Calculate EMA (Exponential Moving Average)
    calculateEMA(prices, period) {
        if (prices.length < period) return null;

        const multiplier = 2 / (period + 1);
        const emaValues = [];
        
        // Start with SMA for first value
        let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
        emaValues.push(ema);

        // Calculate EMA for remaining values
        for (let i = period; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
            emaValues.push(ema);
        }

        return emaValues;
    }

    // Calculate Bollinger Bands
    calculateBollingerBands(prices, period = 20, stdDev = 2) {
        if (prices.length < period) return null;

        const smaValues = this.calculateSMA(prices, period);
        const bands = [];

        for (let i = 0; i < smaValues.length; i++) {
            const slice = prices.slice(i, i + period);
            const mean = smaValues[i];
            const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
            const standardDeviation = Math.sqrt(variance);

            bands.push({
                upper: mean + (standardDeviation * stdDev),
                middle: mean,
                lower: mean - (standardDeviation * stdDev)
            });
        }

        return bands;
    }

    // Calculate SMA (Simple Moving Average)
    calculateSMA(prices, period) {
        if (prices.length < period) return null;

        const smaValues = [];
        for (let i = period - 1; i < prices.length; i++) {
            const slice = prices.slice(i - period + 1, i + 1);
            const average = slice.reduce((sum, price) => sum + price, 0) / period;
            smaValues.push(average);
        }

        return smaValues;
    }

    // Calculate Stochastic Oscillator
    calculateStochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
        if (closes.length < kPeriod) return null;

        const kValues = [];
        
        for (let i = kPeriod - 1; i < closes.length; i++) {
            const highestHigh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
            const lowestLow = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
            const currentClose = closes[i];
            
            const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
            kValues.push(k);
        }

        const dValues = this.calculateSMA(kValues, dPeriod);

        return {
            k: kValues,
            d: dValues
        };
    }

    // Calculate Williams %R
    calculateWilliamsR(highs, lows, closes, period = 14) {
        if (closes.length < period) return null;

        const wrValues = [];
        
        for (let i = period - 1; i < closes.length; i++) {
            const highestHigh = Math.max(...highs.slice(i - period + 1, i + 1));
            const lowestLow = Math.min(...lows.slice(i - period + 1, i + 1));
            const currentClose = closes[i];
            
            const wr = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
            wrValues.push(wr);
        }

        return wrValues;
    }

    // Calculate Average True Range (ATR)
    calculateATR(highs, lows, closes, period = 14) {
        if (closes.length < 2) return null;

        const trueRanges = [];
        
        for (let i = 1; i < closes.length; i++) {
            const tr1 = highs[i] - lows[i];
            const tr2 = Math.abs(highs[i] - closes[i - 1]);
            const tr3 = Math.abs(lows[i] - closes[i - 1]);
            
            trueRanges.push(Math.max(tr1, tr2, tr3));
        }

        return this.calculateEMA(trueRanges, period);
    }

    // Advanced momentum analysis
    calculateMomentumSignals(data) {
        const closes = data.map(d => d.close);
        const highs = data.map(d => d.high);
        const lows = data.map(d => d.low);
        const volumes = data.map(d => d.volume);

        const rsi = this.calculateRSI(closes);
        const macd = this.calculateMACD(closes);
        const bollinger = this.calculateBollingerBands(closes);
        const stochastic = this.calculateStochastic(highs, lows, closes);
        const williamsR = this.calculateWilliamsR(highs, lows, closes);
        const atr = this.calculateATR(highs, lows, closes);
        const ema20 = this.calculateEMA(closes, 20);
        const ema50 = this.calculateEMA(closes, 50);
        const ema200 = this.calculateEMA(closes, 200);

        return {
            rsi: rsi ? rsi[rsi.length - 1] : null,
            macd: macd ? {
                line: macd.macd[macd.macd.length - 1],
                signal: macd.signal ? macd.signal[macd.signal.length - 1] : null,
                histogram: macd.histogram ? macd.histogram[macd.histogram.length - 1] : null
            } : null,
            bollinger: bollinger ? bollinger[bollinger.length - 1] : null,
            stochastic: stochastic ? {
                k: stochastic.k[stochastic.k.length - 1],
                d: stochastic.d ? stochastic.d[stochastic.d.length - 1] : null
            } : null,
            williamsR: williamsR ? williamsR[williamsR.length - 1] : null,
            atr: atr ? atr[atr.length - 1] : null,
            ema20: ema20 ? ema20[ema20.length - 1] : null,
            ema50: ema50 ? ema50[ema50.length - 1] : null,
            ema200: ema200 ? ema200[ema200.length - 1] : null,
            currentPrice: closes[closes.length - 1],
            volume: volumes[volumes.length - 1]
        };
    }

    // Calculate price prediction based on technical indicators
    calculatePricePrediction(signals, timeframe) {
        const { currentPrice, rsi, macd, bollinger, stochastic, williamsR, ema20, ema50, ema200 } = signals;
        
        let bullishSignals = 0;
        let bearishSignals = 0;
        let totalSignals = 0;

        // RSI Analysis
        if (rsi !== null) {
            totalSignals++;
            if (rsi < 30) bullishSignals++; // Oversold
            else if (rsi > 70) bearishSignals++; // Overbought
            else if (rsi > 50) bullishSignals += 0.5; // Bullish momentum
            else bearishSignals += 0.5; // Bearish momentum
        }

        // MACD Analysis
        if (macd && macd.line !== null && macd.signal !== null) {
            totalSignals++;
            if (macd.line > macd.signal && macd.histogram > 0) bullishSignals++;
            else if (macd.line < macd.signal && macd.histogram < 0) bearishSignals++;
        }

        // Bollinger Bands Analysis
        if (bollinger) {
            totalSignals++;
            const position = (currentPrice - bollinger.lower) / (bollinger.upper - bollinger.lower);
            if (position < 0.2) bullishSignals++; // Near lower band
            else if (position > 0.8) bearishSignals++; // Near upper band
        }

        // Stochastic Analysis
        if (stochastic && stochastic.k !== null) {
            totalSignals++;
            if (stochastic.k < 20) bullishSignals++; // Oversold
            else if (stochastic.k > 80) bearishSignals++; // Overbought
        }

        // Williams %R Analysis
        if (williamsR !== null) {
            totalSignals++;
            if (williamsR < -80) bullishSignals++; // Oversold
            else if (williamsR > -20) bearishSignals++; // Overbought
        }

        // EMA Trend Analysis
        if (ema20 && ema50 && ema200) {
            totalSignals++;
            if (currentPrice > ema20 && ema20 > ema50 && ema50 > ema200) {
                bullishSignals++; // Strong uptrend
            } else if (currentPrice < ema20 && ema20 < ema50 && ema50 < ema200) {
                bearishSignals++; // Strong downtrend
            }
        }

        // Calculate prediction
        const bullishRatio = bullishSignals / totalSignals;
        const bearishRatio = bearishSignals / totalSignals;
        const netSentiment = bullishRatio - bearishRatio;

        // Timeframe-specific volatility adjustments
        let volatilityMultiplier;
        let baseConfidence;
        
        switch (timeframe) {
            case '1h':
                volatilityMultiplier = 0.005; // 0.5% max move
                baseConfidence = 85;
                break;
            case '24h':
                volatilityMultiplier = 0.02; // 2% max move
                baseConfidence = 70;
                break;
            case '7d':
                volatilityMultiplier = 0.05; // 5% max move
                baseConfidence = 60;
                break;
            default:
                volatilityMultiplier = 0.02;
                baseConfidence = 70;
        }

        // Calculate price target
        const priceChange = netSentiment * volatilityMultiplier * currentPrice;
        const targetPrice = currentPrice + priceChange;

        // Calculate confidence based on signal strength
        const signalStrength = Math.abs(netSentiment);
        const confidence = Math.min(95, baseConfidence + (signalStrength * 20));

        return {
            target: Math.round(targetPrice),
            confidence: Math.round(confidence),
            signals: {
                bullish: bullishSignals,
                bearish: bearishSignals,
                total: totalSignals,
                netSentiment: netSentiment.toFixed(3)
            }
        };
    }

    // Main prediction function
    async generateAdvancedPredictions(symbol = 'BTCUSDT') {
        console.log('🔮 ADVANCED PRICE PREDICTION ENGINE');
        console.log('============================================================');

        try {
            // Get multi-timeframe data
            const multiTimeframeData = await this.getMultiTimeframeData(symbol);
            
            if (!multiTimeframeData) {
                throw new Error('Failed to fetch multi-timeframe data');
            }

            // Calculate signals for each timeframe
            const signals1h = this.calculateMomentumSignals(multiTimeframeData['15m']); // Use 15m for 1h prediction
            const signals24h = this.calculateMomentumSignals(multiTimeframeData['1h']); // Use 1h for 24h prediction
            const signals7d = this.calculateMomentumSignals(multiTimeframeData['4h']); // Use 4h for 7d prediction

            console.log('📊 TECHNICAL INDICATORS CALCULATED:');
            console.log(`Current Price: $${signals1h.currentPrice.toLocaleString()}`);
            console.log(`RSI (1h): ${signals24h.rsi?.toFixed(2) || 'N/A'}`);
            console.log(`MACD Signal: ${signals24h.macd?.line > signals24h.macd?.signal ? 'Bullish' : 'Bearish'}`);
            console.log(`Bollinger Position: ${signals24h.bollinger ? ((signals24h.currentPrice - signals24h.bollinger.lower) / (signals24h.bollinger.upper - signals24h.bollinger.lower) * 100).toFixed(1) + '%' : 'N/A'}`);

            // Generate predictions
            const prediction1h = this.calculatePricePrediction(signals1h, '1h');
            const prediction24h = this.calculatePricePrediction(signals24h, '24h');
            const prediction7d = this.calculatePricePrediction(signals7d, '7d');

            console.log('\n🎯 ADVANCED PREDICTIONS:');
            console.log(`1 Hour:  $${prediction1h.target.toLocaleString()} (${prediction1h.confidence}% confidence)`);
            console.log(`24 Hour: $${prediction24h.target.toLocaleString()} (${prediction24h.confidence}% confidence)`);
            console.log(`7 Days:  $${prediction7d.target.toLocaleString()} (${prediction7d.confidence}% confidence)`);

            console.log('\n📈 SIGNAL BREAKDOWN:');
            console.log('1 Hour Signals:', prediction1h.signals);
            console.log('24 Hour Signals:', prediction24h.signals);
            console.log('7 Day Signals:', prediction7d.signals);

            return {
                predictions: {
                    hourly: prediction1h,
                    daily: prediction24h,
                    weekly: prediction7d
                },
                technicalIndicators: {
                    '1h': signals1h,
                    '24h': signals24h,
                    '7d': signals7d
                },
                dataQuality: {
                    multiTimeframe: true,
                    realTimeData: true,
                    technicalAnalysis: true
                }
            };

        } catch (error) {
            console.error('Error generating predictions:', error);
            return null;
        }
    }
}

// Demo execution
async function runAdvancedPredictions() {
    const engine = new AdvancedPricePredictionEngine();
    const results = await engine.generateAdvancedPredictions('BTCUSDT');
    
    if (results) {
        console.log('\n✅ ADVANCED PREDICTION ENGINE COMPLETE');
        console.log('📊 Using 100% Real Market Data + Advanced Technical Analysis');
    }
}

module.exports = { AdvancedPricePredictionEngine };

// Run if called directly
if (require.main === module) {
    runAdvancedPredictions();
}