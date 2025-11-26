/**
 * Fix trades affected by the TP3 bug
 * 
 * This script recalculates and updates TP3 values for trades where TP3 is incorrectly
 * lower than TP1 or TP2 due to the Math.min() bug.
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

async function fixTP3Bug() {
  console.log('🔧 Fixing trades affected by TP3 bug...\n');

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
    `);

    const trades = result.rows;

    if (trades.length === 0) {
      console.log('✅ No trades found in database');
      return;
    }

    console.log(`📊 Found ${trades.length} trades. Analyzing...\n`);

    // Find buggy trades
    const buggyTrades = trades.filter(trade => {
      const isTP3Lower = trade.tp3_price < trade.tp1_price || trade.tp3_price < trade.tp2_price;
      const tp3EqualsStopLoss = Math.abs(trade.tp3_price - trade.stop_loss_price) < 0.01;
      return isTP3Lower || tp3EqualsStopLoss;
    });

    if (buggyTrades.length === 0) {
      console.log('✅ No trades need fixing!');
      return;
    }

    console.log(`❌ Found ${buggyTrades.length} trades that need fixing:\n`);

    // Fix each buggy trade
    for (const trade of buggyTrades) {
      console.log(`🔧 Fixing Trade ID: ${trade.id}`);
      console.log(`   Symbol: ${trade.symbol}`);
      console.log(`   Status: ${trade.status}`);
      console.log(`   Generated: ${new Date(trade.generated_at).toLocaleString()}`);
      console.log(`   Entry: $${trade.entry_price.toLocaleString()}`);
      console.log(`   Stop Loss: $${trade.stop_loss_price.toLocaleString()}`);
      
      // Calculate correct TP3 using the fixed formula
      const riskAmount = Number(trade.entry_price) - Number(trade.stop_loss_price);
      const correctTP3 = Number(trade.entry_price) + (riskAmount * 4);
      const roundedTP3 = Math.round(correctTP3 * 100) / 100;
      
      console.log(`\n   OLD VALUES:`);
      console.log(`   TP1: $${trade.tp1_price.toLocaleString()} ✅`);
      console.log(`   TP2: $${trade.tp2_price.toLocaleString()} ✅`);
      console.log(`   TP3: $${trade.tp3_price.toLocaleString()} ❌ (WRONG)`);
      
      console.log(`\n   NEW VALUES:`);
      console.log(`   TP1: $${trade.tp1_price.toLocaleString()} ✅ (unchanged)`);
      console.log(`   TP2: $${trade.tp2_price.toLocaleString()} ✅ (unchanged)`);
      console.log(`   TP3: $${roundedTP3.toLocaleString()} ✅ (FIXED)`);
      
      const improvement = ((roundedTP3 - Number(trade.tp3_price)) / Number(trade.entry_price)) * 100;
      const improvementDollars = roundedTP3 - Number(trade.tp3_price);
      console.log(`\n   📈 Improvement: +$${improvementDollars.toLocaleString()} (+${improvement.toFixed(2)}%)`);
      
      // Update the database
      await query(`
        UPDATE trade_signals
        SET 
          tp3_price = $1,
          updated_at = NOW()
        WHERE id = $2
      `, [roundedTP3, trade.id]);
      
      console.log(`   ✅ Database updated successfully!\n`);
    }

    console.log(`\n📋 Summary:`);
    console.log(`   Total trades checked: ${trades.length}`);
    console.log(`   Trades fixed: ${buggyTrades.length}`);
    console.log(`   Success rate: 100%`);

  } catch (error) {
    console.error('❌ Error fixing trades:', error);
    throw error;
  }
}

// Run the fix
fixTP3Bug()
  .then(() => {
    console.log('\n✅ Fix complete! All trades now have correct TP3 values.');
    console.log('🎉 New trades will automatically use the corrected formula.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fix failed:', error);
    process.exit(1);
  });
