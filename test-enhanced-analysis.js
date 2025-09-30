const { EnhancedSupplyDemandCalculator } = require('./enhanced-supply-demand-calculator');

async function compareOldVsNew() {
    console.log('🔬 COMPARISON: OLD vs NEW SUPPLY/DEMAND CALCULATION');
    console.log('============================================================\n');

    // OLD METHOD (Static offsets)
    console.log('❌ OLD METHOD - Static Mathematical Offsets:');
    console.log('Supply Zones: currentPrice + [800, 2000, 4200]');
    console.log('Demand Zones: currentPrice - [800, 1500, 3000]');
    console.log('Data Source: Fixed mathematical formulas');
    console.log('Accuracy: Low (ignores market reality)\n');

    // NEW METHOD (Real market data)
    console.log('✅ NEW METHOD - Real Market Data Analysis:');
    const calculator = new EnhancedSupplyDemandCalculator();
    
    try {
        const analysis = await calculator.calculateEnhancedZones('BTCUSDT');
        
        console.log('📊 Data Sources:');
        console.log('  • Live Order Book (Binance API)');
        console.log('  • Historical Volume Profile (168 hours)');
        console.log('  • Fear & Greed Index');
        console.log('  • Futures Funding Rates');
        console.log('  • Whale Movement Detection');
        console.log('  • Order Book Imbalance Analysis\n');

        console.log('🎯 ACCURACY IMPROVEMENTS:');
        console.log('  • Zones based on ACTUAL buy/sell walls');
        console.log('  • Historical price levels with HIGH volume');
        console.log('  • Market sentiment weighting');
        console.log('  • Institutional activity detection');
        console.log('  • Dynamic strength calculation\n');

        console.log('📈 REAL-TIME MARKET CONDITIONS:');
        if (analysis.marketSentiment) {
            console.log(`  Fear & Greed: ${analysis.marketSentiment.fearGreedIndex}/100`);
            console.log(`  Funding Rate: ${(analysis.marketSentiment.fundingRate * 100).toFixed(4)}%`);
        }
        if (analysis.orderBookImbalance) {
            console.log(`  Order Book Bias: ${(analysis.orderBookImbalance.volumeImbalance * 100).toFixed(2)}%`);
        }

    } catch (error) {
        console.error('Error running enhanced analysis:', error.message);
    }
}

// Additional utility: Real-time zone monitoring
async function monitorZones() {
    console.log('\n🔄 REAL-TIME ZONE MONITORING');
    console.log('============================================================');
    
    const calculator = new EnhancedSupplyDemandCalculator();
    let previousAnalysis = null;
    
    const monitor = async () => {
        try {
            const currentAnalysis = await calculator.calculateEnhancedZones('BTCUSDT');
            
            if (previousAnalysis) {
                console.log('\n📊 ZONE CHANGES DETECTED:');
                
                // Compare supply zones
                const supplyChanges = currentAnalysis.enhancedZones.supply.filter(zone => 
                    !previousAnalysis.enhancedZones.supply.some(prevZone => 
                        Math.abs(prevZone.price - zone.price) < 100
                    )
                );
                
                if (supplyChanges.length > 0) {
                    console.log('🔴 New Supply Zones:');
                    supplyChanges.forEach(zone => {
                        console.log(`  $${zone.price.toLocaleString()} - ${zone.strength} (${zone.source})`);
                    });
                }
                
                // Compare demand zones
                const demandChanges = currentAnalysis.enhancedZones.demand.filter(zone => 
                    !previousAnalysis.enhancedZones.demand.some(prevZone => 
                        Math.abs(prevZone.price - zone.price) < 100
                    )
                );
                
                if (demandChanges.length > 0) {
                    console.log('🟢 New Demand Zones:');
                    demandChanges.forEach(zone => {
                        console.log(`  $${zone.price.toLocaleString()} - ${zone.strength} (${zone.source})`);
                    });
                }
            }
            
            previousAnalysis = currentAnalysis;
            
        } catch (error) {
            console.error('Monitoring error:', error.message);
        }
    };
    
    // Run initial analysis
    await monitor();
    
    console.log('\n⏰ Monitoring every 30 seconds... (Press Ctrl+C to stop)');
    setInterval(monitor, 30000);
}

// Run comparison
if (require.main === module) {
    compareOldVsNew().then(() => {
        console.log('\n🚀 Want to see real-time monitoring? Uncomment the line below:');
        console.log('// monitorZones();');
    });
}