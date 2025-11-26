/**
 * Check for trades affected by the TP3 bug
 * 
 * This script identifies trades where TP3 is lower than TP1 or TP2,
 * which indicates the bug where Math.min() was capping TP3 at Bollinger Band upper.
 */

import { query } from '../lib/db';

interface TradeSignal {
  id: string;
  symbol: string;
  entry_price: number;
  tp1_price: number;
  tp2_price: number;
  tp3_price: number;
  stop_loss_price: number;
  generated_at: Date;
  status: string;
}

async function checkTP3Bug() {
  console.log('🔍 Checking for trades affected by TP3 bug...\n');

  try {
    // Query all trade signals
    const result = await query<TradeSignal>(`
      SELECT 
        id,
        symbol,
        entry_price,
        tp1_price,
        tp2_price,
        tp3_price,
        stop_loss_price,
        generated_at,
        status
      FROM trade_signals
      ORDER BY generated_at DESC
      LIMIT 100
    `);

    const trades = result.rows;

    if (trades.length === 0) {
      console.log('✅ No trades found in database');
      return;
    }

    console.log(`📊 Found ${trades.length} trades. Analyzing...\n`);

    // Check for buggy trades
    const buggyTrades = trades.filter(trade => {
      // For long positions, TP3 should be higher than TP1 and TP2
      const isTP3Lower = trade.tp3_price < trade.tp1_price || trade.tp3_price < trade.tp2_price;
      
      // Also check if TP3 equals stop loss (another symptom of the bug)
      const tp3EqualsStopLoss = Math.abs(trade.tp3_price - trade.stop_loss_price) < 0.01;
      
      return isTP3Lower || tp3EqualsStopLoss;
    });

    if (buggyTrades.length === 0) {
      console.log('✅ No trades affected by TP3 bug!');
      console.log(`   All ${trades.length} trades have correct TP3 values.\n`);
    } else {
      console.log(`❌ Found ${buggyTrades.length} trades affected by TP3 bug:\n`);
      
      buggyTrades.forEach((trade, index) => {
        console.log(`${index + 1}. Trade ID: ${trade.id}`);
        console.log(`   Symbol: ${trade.symbol}`);
        console.log(`   Generated: ${new Date(trade.generated_at).toLocaleString()}`);
        console.log(`   Status: ${trade.status}`);
        console.log(`   Entry: $${trade.entry_price.toLocaleString()}`);
        console.log(`   TP1: $${trade.tp1_price.toLocaleString()} ✅`);
        console.log(`   TP2: $${trade.tp2_price.toLocaleString()} ✅`);
        console.log(`   TP3: $${trade.tp3_price.toLocaleString()} ❌ (LOWER THAN TP1/TP2!)`);
        console.log(`   Stop Loss: $${trade.stop_loss_price.toLocaleString()}`);
        
        if (Math.abs(trade.tp3_price - trade.stop_loss_price) < 0.01) {
          console.log(`   ⚠️  TP3 equals Stop Loss - this trade would close at a loss!`);
        }
        
        console.log('');
      });

      console.log(`\n📋 Summary:`);
      console.log(`   Total trades: ${trades.length}`);
      console.log(`   Affected by bug: ${buggyTrades.length} (${((buggyTrades.length / trades.length) * 100).toFixed(1)}%)`);
      console.log(`   Correct trades: ${trades.length - buggyTrades.length} (${(((trades.length - buggyTrades.length) / trades.length) * 100).toFixed(1)}%)`);
    }

    // Show statistics
    console.log(`\n📈 Trade Statistics:`);
    console.log(`   Active trades: ${trades.filter(t => t.status === 'active').length}`);
    console.log(`   Completed trades: ${trades.filter(t => t.status.startsWith('completed')).length}`);
    console.log(`   Expired trades: ${trades.filter(t => t.status === 'expired').length}`);

  } catch (error) {
    console.error('❌ Error checking trades:', error);
    throw error;
  }
}

// Run the check
checkTP3Bug()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
