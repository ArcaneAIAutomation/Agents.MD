const axios = require('axios');

async function testCurrentAPI() {
    console.log('🧪 Testing Current API Response');
    console.log('============================================================');
    
    try {
        const response = await axios.get('http://localhost:3000/api/btc-analysis');
        const data = response.data;
        
        if (data.success) {
            console.log('✅ API Response: SUCCESS');
            console.log(`📊 Current Price: $${data.data.currentPrice.toLocaleString()}`);
            console.log(`🔴 Is Live Data: ${data.data.isLiveData}`);
            console.log(`🔵 Is Enhanced Data: ${data.data.isEnhancedData}`);
            
            console.log('\n📈 SUPPLY ZONES:');
            data.data.technicalIndicators.supplyDemandZones.supplyZones.forEach((zone, i) => {
                console.log(`  ${i + 1}. $${zone.level.toLocaleString()} - ${zone.strength} - ${zone.source} - Vol: ${zone.volume.toFixed(2)} BTC`);
            });
            
            console.log('\n📉 DEMAND ZONES:');
            data.data.technicalIndicators.supplyDemandZones.demandZones.forEach((zone, i) => {
                console.log(`  ${i + 1}. $${zone.level.toLocaleString()} - ${zone.strength} - ${zone.source} - Vol: ${zone.volume.toFixed(2)} BTC`);
            });
            
            console.log('\n🔍 DATA QUALITY:');
            if (data.data.enhancedMarketData && data.data.enhancedMarketData.dataQuality) {
                const quality = data.data.enhancedMarketData.dataQuality;
                console.log(`  Order Book: ${quality.orderBookData ? '✅ Available' : '❌ Missing'}`);
                console.log(`  Volume Data: ${quality.volumeData ? '✅ Available' : '❌ Missing'}`);
                console.log(`  Sentiment: ${quality.sentimentData ? '✅ Available' : '❌ Missing'}`);
                console.log(`  Whale Data: ${quality.whaleData ? '✅ Available' : '❌ Missing'}`);
            }
            
            // Count sources
            const supplyOrderBook = data.data.technicalIndicators.supplyDemandZones.supplyZones.filter(z => z.source === 'orderbook').length;
            const supplyHistorical = data.data.technicalIndicators.supplyDemandZones.supplyZones.filter(z => z.source === 'historical').length;
            const demandOrderBook = data.data.technicalIndicators.supplyDemandZones.demandZones.filter(z => z.source === 'orderbook').length;
            const demandHistorical = data.data.technicalIndicators.supplyDemandZones.demandZones.filter(z => z.source === 'historical').length;
            
            console.log('\n📊 SOURCE BREAKDOWN:');
            console.log(`  Supply: ${supplyOrderBook} OrderBook + ${supplyHistorical} Historical`);
            console.log(`  Demand: ${demandOrderBook} OrderBook + ${demandHistorical} Historical`);
            
        } else {
            console.log('❌ API Response: FAILED');
            console.log('Error:', data.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testCurrentAPI();