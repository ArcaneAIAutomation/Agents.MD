/**
 * Check Trade Status
 * Quick script to check the current state of trades in the database
 */

import { query } from '../lib/db';

async function checkTradeStatus() {
  console.log('🔍 Checking ATGE Trade Status...\n');
  
  try {
    // Check active trades
    const activeResult = await query(
      "SELECT COUNT(*) as count FROM trade_signals WHERE status = 'active'"
    );
    console.log(`Active trades: ${activeResult.rows[0].count}`);
    
    // Check recent trades
    const recentResult = await query(`
      SELECT 
        id, 
        symbol, 
        status, 
        confidence_score, 
        generated_at,
        expires_at
      FROM trade_signals 
      ORDER BY generated_at DESC 
      LIMIT 5
    `);
    
    console.log('\nRecent trades:');
    if (recentResult.rows.length === 0) {
      console.log('  No trades found');
    } else {
      recentResult.rows.forEach(r => {
        const id = r.id.substring(0, 8);
        const generatedAt = new Date(r.generated_at).toLocaleString();
        console.log(`  ${id}... ${r.symbol} ${r.status} (${r.confidence_score}%) ${generatedAt}`);
      });
    }
    
    // Check trade results
    const resultsCount = await query(
      'SELECT COUNT(*) as count FROM trade_results'
    );
    console.log(`\nTrade results records: ${resultsCount.rows[0].count}`);
    
    // Check completed trades
    const completedResult = await query(`
      SELECT 
        ts.id,
        ts.symbol,
        ts.status,
        tr.tp1_hit,
        tr.tp2_hit,
        tr.tp3_hit,
        tr.stop_loss_hit,
        tr.net_profit_loss,
        tr.profit_loss_percentage
      FROM trade_signals ts
      JOIN trade_results tr ON ts.id = tr.trade_signal_id
      WHERE ts.status IN ('completed_success', 'completed_failure')
      ORDER BY ts.generated_at DESC
      LIMIT 5
    `);
    
    console.log('\nCompleted trades with P/L:');
    if (completedResult.rows.length === 0) {
      console.log('  No completed trades found');
    } else {
      completedResult.rows.forEach(r => {
        const id = r.id.substring(0, 8);
        const pl = r.net_profit_loss ? `$${parseFloat(r.net_profit_loss).toFixed(2)}` : 'N/A';
        const plPct = r.profit_loss_percentage ? `${parseFloat(r.profit_loss_percentage).toFixed(2)}%` : 'N/A';
        const targets = [];
        if (r.tp1_hit) targets.push('TP1');
        if (r.tp2_hit) targets.push('TP2');
        if (r.tp3_hit) targets.push('TP3');
        if (r.stop_loss_hit) targets.push('SL');
        const targetsStr = targets.length > 0 ? targets.join(', ') : 'None';
        console.log(`  ${id}... ${r.symbol} ${r.status} - ${targetsStr} - ${pl} (${plPct})`);
      });
    }
    
    console.log('\n✅ Status check complete');
  } catch (error) {
    console.error('❌ Error checking trade status:', error);
    process.exit(1);
  }
}

checkTradeStatus();
