const axios = require('axios');

async function demonstrateLiveDataSources() {
    console.log('🔬 LIVE DATA SOURCES DEMONSTRATION');
    console.log('============================================================\n');

    try {
        // 1. FEAR & GREED INDEX
        console.log('📊 1. FEAR & GREED INDEX');
        console.log('API: https://api.alternative.me/fng/');
        const fearGreedResponse = await axios.get('https://api.alternative.me/fng/');
        const fearGreedValue = parseInt(fearGreedResponse.data.data[0].value);
        const fearGreedClass = fearGreedResponse.data.data[0].value_classification;
        
        console.log(`Raw API Response: ${JSON.stringify(fearGreedResponse.data.data[0], null, 2)}`);
        console.log(`Calculated Value: ${fearGreedValue}`);
        console.log(`Classification: ${fearGreedClass}`);
        console.log('Math: Direct integer parsing from API response\n');

        // 2. ORDER BOOK IMBALANCE
        console.log('📊 2. ORDER BOOK IMBALANCE');
        console.log('API: https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=20');
        const orderBookResponse = await axios.get('https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=20');
        
        const bids = orderBookResponse.data.bids.slice(0, 10).map(([price, quantity]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity)
        }));
        
        const asks = orderBookResponse.data.asks.slice(0, 10).map(([price, quantity]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity)
        }));

        const bidVolume = bids.reduce((sum, bid) => sum + bid.quantity, 0);
        const askVolume = asks.reduce((sum, ask) => sum + ask.quantity, 0);
        const volumeImbalance = (bidVolume - askVolume) / (bidVolume + askVolume);
        const bidPressure = bidVolume / (bidVolume + askVolume);
        const askPressure = askVolume / (bidVolume + askVolume);

        console.log(`Top 5 Bids: ${bids.slice(0, 5).map(b => `$${b.price}(${b.quantity})`).join(', ')}`);
        console.log(`Top 5 Asks: ${asks.slice(0, 5).map(a => `$${a.price}(${a.quantity})`).join(', ')}`);
        console.log(`\nCalculations:`);
        console.log(`  Total Bid Volume: ${bidVolume.toFixed(4)} BTC`);
        console.log(`  Total Ask Volume: ${askVolume.toFixed(4)} BTC`);
        console.log(`  Volume Imbalance: (${bidVolume.toFixed(2)} - ${askVolume.toFixed(2)}) / (${bidVolume.toFixed(2)} + ${askVolume.toFixed(2)}) = ${volumeImbalance.toFixed(4)}`);
        console.log(`  Percentage: ${(volumeImbalance * 100).toFixed(2)}%`);
        console.log(`  Bid Pressure: ${(bidPressure * 100).toFixed(2)}%`);
        console.log(`  Ask Pressure: ${(askPressure * 100).toFixed(2)}%\n`);

        // 3. CURRENT BITCOIN PRICE
        console.log('📊 3. CURRENT BITCOIN PRICE');
        console.log('API: https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
        const priceResponse = await axios.get('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
        const currentPrice = parseFloat(priceResponse.data.lastPrice);
        const priceChange = parseFloat(priceResponse.data.priceChangePercent);
        
        console.log(`Current Price: $${currentPrice.toLocaleString()}`);
        console.log(`24h Change: ${priceChange.toFixed(2)}%`);
        console.log(`Volume: ${parseFloat(priceResponse.data.volume).toLocaleString()} BTC\n`);

        // 4. FUNDING RATE
        console.log('📊 4. FUTURES FUNDING RATE');
        console.log('API: https://api.binance.com/api/v3/premiumIndex?symbol=BTCUSDT');
        const fundingResponse = await axios.get('https://api.binance.com/api/v3/premiumIndex?symbol=BTCUSDT');
        const fundingRate = parseFloat(fundingResponse.data.lastFundingRate);
        
        console.log(`Raw Funding Rate: ${fundingRate}`);
        console.log(`Percentage: ${(fundingRate * 100).toFixed(4)}%`);
        console.log(`Interpretation: ${fundingRate > 0 ? 'Longs pay shorts (bullish sentiment)' : 'Shorts pay longs (bearish sentiment)'}\n`);

        // 5. VOLUME PROFILE SAMPLE
        console.log('📊 5. HISTORICAL VOLUME PROFILE (Sample)');
        console.log('API: https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=24');
        const volumeResponse = await axios.get('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=24');
        
        const volumeData = volumeResponse.data.map(candle => ({
            time: new Date(candle[0]).toISOString(),
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5])
        }));

        console.log('Last 5 Hours Volume Data:');
        volumeData.slice(-5).forEach((candle, i) => {
            console.log(`  ${i + 1}. ${candle.time.slice(11, 16)} - Close: $${candle.close.toLocaleString()} - Volume: ${candle.volume.toFixed(2)} BTC`);
        });

        // Create price-volume histogram sample
        const priceVolumeMap = new Map();
        const priceRange = 100;
        
        volumeData.forEach(candle => {
            const priceKey = Math.round(candle.close / priceRange) * priceRange;
            const existing = priceVolumeMap.get(priceKey) || { volume: 0, touches: 0 };
            
            priceVolumeMap.set(priceKey, {
                volume: existing.volume + candle.volume,
                touches: existing.touches + 1
            });
        });

        console.log('\nPrice-Volume Histogram (Top 3):');
        const sortedLevels = Array.from(priceVolumeMap.entries())
            .map(([price, data]) => ({ price, ...data }))
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 3);

        sortedLevels.forEach((level, i) => {
            console.log(`  ${i + 1}. $${level.price.toLocaleString()} - Volume: ${level.volume.toFixed(2)} BTC - Touches: ${level.touches}`);
        });

        // 6. ZONE STRENGTH CALCULATION EXAMPLE
        console.log('\n📊 6. ZONE STRENGTH CALCULATION EXAMPLE');
        const exampleVolume = 12.06;
        const exampleValue = currentPrice * exampleVolume;
        const sentimentWeight = fearGreedValue > 50 ? 1.2 : 0.8;
        const imbalanceWeight = 1 + Math.abs(volumeImbalance);
        
        const baseStrength = Math.log10(exampleVolume) * Math.log10(exampleValue);
        const adjustedStrength = baseStrength * sentimentWeight * imbalanceWeight;
        
        let strengthClass;
        if (adjustedStrength > 15) strengthClass = 'VERY_STRONG';
        else if (adjustedStrength > 10) strengthClass = 'STRONG';
        else if (adjustedStrength > 5) strengthClass = 'MODERATE';
        else strengthClass = 'WEAK';

        console.log(`Example Zone Calculation:`);
        console.log(`  Volume: ${exampleVolume} BTC`);
        console.log(`  Dollar Value: $${exampleValue.toLocaleString()}`);
        console.log(`  Sentiment Weight: ${sentimentWeight} (Fear & Greed: ${fearGreedValue})`);
        console.log(`  Imbalance Weight: ${imbalanceWeight.toFixed(3)} (${(volumeImbalance * 100).toFixed(2)}% imbalance)`);
        console.log(`  Base Strength: log10(${exampleVolume}) * log10(${exampleValue.toFixed(0)}) = ${baseStrength.toFixed(3)}`);
        console.log(`  Adjusted Strength: ${baseStrength.toFixed(3)} * ${sentimentWeight} * ${imbalanceWeight.toFixed(3)} = ${adjustedStrength.toFixed(3)}`);
        console.log(`  Classification: ${strengthClass}`);

        console.log('\n✅ ALL DATA IS LIVE AND CALCULATED IN REAL-TIME');
        console.log('🚫 NO FALLBACK OR SIMULATED DATA USED');

    } catch (error) {
        console.error('❌ Error in demonstration:', error.message);
    }
}

demonstrateLiveDataSources();