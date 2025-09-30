const axios = require('axios');

async function testAdvancedPredictions() {
    console.log('🧪 TESTING ADVANCED PREDICTIONS API');
    console.log('============================================================');
    
    try {
        const response = await axios.get('http://localhost:3000/api/btc-analysis');
        const data = response.data;
        
        if (data.success) {
            console.log('✅ API Response: SUCCESS');
            console.log(`📊 Current Price: $${data.data.currentPrice.toLocaleString()}`);
            console.log(`🔴 Is Live Data: ${data.data.isLiveData}`);
            console.log(`🔵 Is Enhanced Data: ${data.data.isEnhancedData}`);
            console.log(`🚀 Is Advanced Predictions: ${data.data.isAdvancedPredictions}`);
            
            console.log('\n🔮 ADVANCED PRICE PREDICTIONS:');
            if (data.data.predictions) {
                console.log(`1 Hour:  $${data.data.predictions.hourly.target.toLocaleString()} (${data.data.predictions.hourly.confidence}% confidence)`);
                console.log(`24 Hour: $${data.data.predictions.daily.target.toLocaleString()} (${data.data.predictions.daily.confidence}% confidence)`);
                console.log(`7 Days:  $${data.data.predictions.weekly.target.toLocaleString()} (${data.data.predictions.weekly.confidence}% confidence)`);
            }
            
            console.log('\n📊 TECHNICAL INDICATORS (REAL DATA):');
            if (data.data.technicalIndicators) {
                const ti = data.data.technicalIndicators;
                console.log(`RSI: ${typeof ti.rsi === 'number' ? ti.rsi.toFixed(2) : ti.rsi?.value || 'N/A'}`);
                console.log(`EMA20: $${ti.ema20 ? ti.ema20.toLocaleString() : 'N/A'}`);
                console.log(`EMA50: $${ti.ema50 ? ti.ema50.toLocaleString() : 'N/A'}`);
                console.log(`MACD: ${ti.macd?.signal || 'N/A'}`);
                if (ti.bollinger) {
                    console.log(`Bollinger Upper: $${ti.bollinger.upper.toLocaleString()}`);
                    console.log(`Bollinger Lower: $${ti.bollinger.lower.toLocaleString()}`);
                }
            }
            
            console.log('\n🎯 PREDICTION METHOD:');
            if (data.data.advancedPredictionData) {
                console.log(`Method: ${data.data.advancedPredictionData.predictionMethod}`);
                console.log(`Data Quality:`, data.data.advancedPredictionData.dataQuality);
            }
            
            console.log('\n📈 SUPPLY/DEMAND ZONES (REAL):');
            if (data.data.technicalIndicators?.supplyDemandZones) {
                const zones = data.data.technicalIndicators.supplyDemandZones;
                console.log('Supply Zones:');
                zones.supplyZones.forEach((zone, i) => {
                    console.log(`  ${i + 1}. $${zone.level.toLocaleString()} - ${zone.strength} - ${zone.source} - Vol: ${zone.volume.toFixed(2)} BTC`);
                });
                console.log('Demand Zones:');
                zones.demandZones.forEach((zone, i) => {
                    console.log(`  ${i + 1}. $${zone.level.toLocaleString()} - ${zone.strength} - ${zone.source} - Vol: ${zone.volume.toFixed(2)} BTC`);
                });
            }
            
        } else {
            console.log('❌ API Response: FAILED');
            console.log('Error:', data.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAdvancedPredictions();