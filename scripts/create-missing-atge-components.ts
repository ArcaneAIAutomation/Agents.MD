/**
 * Create Missing ATGE Components
 * 
 * This script creates only the missing ATGE database components:
 * - atge_performance_cache table
 * - vw_complete_trades view
 * - calculate_atge_performance function
 */

import { query } from '../lib/db';

async function createMissingComponents() {
  console.log('🚀 Creating Missing ATGE Components...\n');
  
  try {
    // 1. Create atge_performance_cache table
    console.log('📊 Creating atge_performance_cache table...');
    
    await query(`
      CREATE TABLE IF NOT EXISTS atge_performance_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        
        -- Aggregate Statistics
        total_trades INTEGER NOT NULL DEFAULT 0,
        winning_trades INTEGER NOT NULL DEFAULT 0,
        losing_trades INTEGER NOT NULL DEFAULT 0,
        success_rate DECIMAL(5, 2),
        
        -- Profit/Loss
        total_profit_loss DECIMAL(20, 2),
        total_profit DECIMAL(20, 2),
        total_loss DECIMAL(20, 2),
        average_win DECIMAL(20, 2),
        average_loss DECIMAL(20, 2),
        
        -- Best/Worst
        best_trade_id UUID REFERENCES trade_signals(id),
        best_trade_profit DECIMAL(20, 2),
        worst_trade_id UUID REFERENCES trade_signals(id),
        worst_trade_loss DECIMAL(20, 2),
        
        -- Advanced Metrics
        sharpe_ratio DECIMAL(10, 4),
        max_drawdown DECIMAL(10, 4),
        profit_factor DECIMAL(10, 4),
        win_loss_ratio DECIMAL(10, 4),
        
        -- Social Intelligence Performance
        avg_galaxy_score_wins DECIMAL(5, 2),
        avg_galaxy_score_losses DECIMAL(5, 2),
        social_correlation DECIMAL(5, 4),
        
        -- Cache Metadata
        last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        
        -- Unique constraint: one cache per user
        UNIQUE(user_id)
      )
    `);
    
    console.log('✅ atge_performance_cache table created\n');
    
    // 2. Create index
    console.log('📊 Creating index on atge_performance_cache...');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_atge_performance_cache_user_id 
      ON atge_performance_cache(user_id)
    `);
    
    console.log('✅ Index created\n');
    
    // 3. Create trigger for updated_at (skip if exists)
    console.log('📊 Creating trigger for atge_performance_cache...');
    
    try {
      await query(`
        DROP TRIGGER IF EXISTS update_atge_performance_cache_updated_at ON atge_performance_cache
      `);
      
      await query(`
        CREATE TRIGGER update_atge_performance_cache_updated_at
          BEFORE UPDATE ON atge_performance_cache
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `);
      
      console.log('✅ Trigger created\n');
    } catch (error) {
      console.log('⚠️  Trigger already exists, skipping\n');
    }
    
    // 4. Create view
    console.log('📊 Creating vw_complete_trades view...');
    
    await query(`
      CREATE OR REPLACE VIEW vw_complete_trades AS
      SELECT 
        ts.id,
        ts.user_id,
        ts.symbol,
        ts.timeframe,
        ts.entry_price,
        ts.stop_loss_price,
        ts.tp1_price,
        ts.tp2_price,
        ts.tp3_price,
        ts.confidence_score,
        ts.ai_reasoning,
        ts.status,
        ts.generated_at,
        ts.expires_at,
        
        -- Results
        tr.tp1_hit,
        tr.tp1_hit_at,
        tr.tp2_hit,
        tr.tp2_hit_at,
        tr.tp3_hit,
        tr.tp3_hit_at,
        tr.stop_loss_hit AS sl_hit,
        tr.stop_loss_hit_at AS sl_hit_at,
        tr.net_profit_loss_usd AS net_profit_loss,
        tr.profit_loss_percentage,
        tr.trade_duration_minutes AS time_to_completion_minutes,
        tr.ai_analysis,
        
        -- Technical Indicators
        tti.rsi_value AS rsi_14,
        tti.macd_value AS macd_line,
        tti.ema_20,
        tti.ema_50,
        tti.ema_200,
        
        -- Market Snapshot (basic columns only)
        tms.current_price,
        tms.market_cap,
        tms.volume_24h,
        tms.social_sentiment_score,
        tms.whale_activity_count,
        tms.fear_greed_index
        
      FROM trade_signals ts
      LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
      LEFT JOIN trade_technical_indicators tti ON ts.id = tti.trade_signal_id
      LEFT JOIN trade_market_snapshot tms ON ts.id = tms.trade_signal_id
    `);
    
    console.log('✅ vw_complete_trades view created\n');
    
    // 5. Create calculate_atge_performance function
    console.log('📊 Creating calculate_atge_performance function...');
    
    await query(`
      CREATE OR REPLACE FUNCTION calculate_atge_performance(p_user_id UUID)
      RETURNS VOID AS $func$
      DECLARE
        v_total_trades INTEGER;
        v_winning_trades INTEGER;
        v_losing_trades INTEGER;
        v_success_rate DECIMAL(5, 2);
        v_total_profit_loss DECIMAL(20, 2);
        v_total_profit DECIMAL(20, 2);
        v_total_loss DECIMAL(20, 2);
        v_avg_win DECIMAL(20, 2);
        v_avg_loss DECIMAL(20, 2);
        v_best_trade_id UUID;
        v_best_trade_profit DECIMAL(20, 2);
        v_worst_trade_id UUID;
        v_worst_trade_loss DECIMAL(20, 2);
        v_avg_galaxy_wins DECIMAL(5, 2);
        v_avg_galaxy_losses DECIMAL(5, 2);
      BEGIN
        -- Calculate total trades
        SELECT COUNT(*) INTO v_total_trades
        FROM trade_signals
        WHERE user_id = p_user_id AND status IN ('completed_success', 'completed_failure');
        
        -- Calculate winning/losing trades
        SELECT 
          COUNT(*) FILTER (WHERE tr.net_profit_loss_usd > 0),
          COUNT(*) FILTER (WHERE tr.net_profit_loss_usd <= 0)
        INTO v_winning_trades, v_losing_trades
        FROM trade_signals ts
        JOIN trade_results tr ON ts.id = tr.trade_signal_id
        WHERE ts.user_id = p_user_id AND ts.status IN ('completed_success', 'completed_failure');
        
        -- Calculate success rate
        v_success_rate := CASE 
          WHEN v_total_trades > 0 THEN (v_winning_trades::DECIMAL / v_total_trades) * 100
          ELSE 0
        END;
        
        -- Calculate profit/loss
        SELECT 
          COALESCE(SUM(tr.net_profit_loss_usd), 0),
          COALESCE(SUM(tr.net_profit_loss_usd) FILTER (WHERE tr.net_profit_loss_usd > 0), 0),
          COALESCE(ABS(SUM(tr.net_profit_loss_usd) FILTER (WHERE tr.net_profit_loss_usd <= 0)), 0),
          COALESCE(AVG(tr.net_profit_loss_usd) FILTER (WHERE tr.net_profit_loss_usd > 0), 0),
          COALESCE(AVG(tr.net_profit_loss_usd) FILTER (WHERE tr.net_profit_loss_usd <= 0), 0)
        INTO v_total_profit_loss, v_total_profit, v_total_loss, v_avg_win, v_avg_loss
        FROM trade_signals ts
        JOIN trade_results tr ON ts.id = tr.trade_signal_id
        WHERE ts.user_id = p_user_id AND ts.status IN ('completed_success', 'completed_failure');
        
        -- Find best trade
        SELECT ts.id, tr.net_profit_loss_usd INTO v_best_trade_id, v_best_trade_profit
        FROM trade_signals ts
        JOIN trade_results tr ON ts.id = tr.trade_signal_id
        WHERE ts.user_id = p_user_id AND ts.status IN ('completed_success', 'completed_failure')
        ORDER BY tr.net_profit_loss_usd DESC
        LIMIT 1;
        
        -- Find worst trade
        SELECT ts.id, tr.net_profit_loss_usd INTO v_worst_trade_id, v_worst_trade_loss
        FROM trade_signals ts
        JOIN trade_results tr ON ts.id = tr.trade_signal_id
        WHERE ts.user_id = p_user_id AND ts.status IN ('completed_success', 'completed_failure')
        ORDER BY tr.net_profit_loss_usd ASC
        LIMIT 1;
        
        -- Calculate average Galaxy Score for wins vs losses
        SELECT 
          COALESCE(AVG(tms.galaxy_score) FILTER (WHERE tr.net_profit_loss_usd > 0), 0),
          COALESCE(AVG(tms.galaxy_score) FILTER (WHERE tr.net_profit_loss_usd <= 0), 0)
        INTO v_avg_galaxy_wins, v_avg_galaxy_losses
        FROM trade_signals ts
        JOIN trade_results tr ON ts.id = tr.trade_signal_id
        JOIN trade_market_snapshot tms ON ts.id = tms.trade_signal_id
        WHERE ts.user_id = p_user_id AND ts.status IN ('completed_success', 'completed_failure');
        
        -- Insert or update cache
        INSERT INTO atge_performance_cache (
          user_id,
          total_trades,
          winning_trades,
          losing_trades,
          success_rate,
          total_profit_loss,
          total_profit,
          total_loss,
          average_win,
          average_loss,
          best_trade_id,
          best_trade_profit,
          worst_trade_id,
          worst_trade_loss,
          avg_galaxy_score_wins,
          avg_galaxy_score_losses,
          last_calculated_at
        ) VALUES (
          p_user_id,
          v_total_trades,
          v_winning_trades,
          v_losing_trades,
          v_success_rate,
          v_total_profit_loss,
          v_total_profit,
          v_total_loss,
          v_avg_win,
          v_avg_loss,
          v_best_trade_id,
          v_best_trade_profit,
          v_worst_trade_id,
          v_worst_trade_loss,
          v_avg_galaxy_wins,
          v_avg_galaxy_losses,
          NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          total_trades = EXCLUDED.total_trades,
          winning_trades = EXCLUDED.winning_trades,
          losing_trades = EXCLUDED.losing_trades,
          success_rate = EXCLUDED.success_rate,
          total_profit_loss = EXCLUDED.total_profit_loss,
          total_profit = EXCLUDED.total_profit,
          total_loss = EXCLUDED.total_loss,
          average_win = EXCLUDED.average_win,
          average_loss = EXCLUDED.average_loss,
          best_trade_id = EXCLUDED.best_trade_id,
          best_trade_profit = EXCLUDED.best_trade_profit,
          worst_trade_id = EXCLUDED.worst_trade_id,
          worst_trade_loss = EXCLUDED.worst_trade_loss,
          avg_galaxy_score_wins = EXCLUDED.avg_galaxy_score_wins,
          avg_galaxy_score_losses = EXCLUDED.avg_galaxy_score_losses,
          last_calculated_at = NOW();
      END;
      $func$ LANGUAGE plpgsql
    `);
    
    console.log('✅ calculate_atge_performance function created\n');
    
    console.log('='.repeat(60));
    console.log('🎉 SUCCESS: All missing ATGE components created!');
    console.log('='.repeat(60));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating components:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

createMissingComponents();
