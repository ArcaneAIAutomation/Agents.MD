/**
 * Whale Watch Database Utilities
 * Stores whale transactions and analysis in Supabase
 */

import { query, queryOne } from '../db';

interface WhaleTransaction {
  txHash: string;
  blockchain: string;
  amount: number;
  amountUSD: number;
  fromAddress: string;
  toAddress: string;
  transactionType?: string;
  description?: string;
  blockHeight?: number;
  transactionTimestamp: Date;
}

interface WhaleAnalysis {
  txHash: string;
  analysisProvider: string;
  analysisType: string;
  analysisData: any;
  blockchainData?: any;
  metadata?: any;
  confidence?: number;
  status?: string;
}

/**
 * Store whale transaction in database
 */
export async function storeWhaleTransaction(whale: WhaleTransaction): Promise<void> {
  try {
    await query(
      `INSERT INTO whale_transactions 
       (tx_hash, blockchain, amount, amount_usd, from_address, to_address, 
        transaction_type, description, block_height, transaction_timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (tx_hash) 
       DO UPDATE SET
         amount_usd = EXCLUDED.amount_usd,
         transaction_type = EXCLUDED.transaction_type,
         description = EXCLUDED.description,
         updated_at = NOW()`,
      [
        whale.txHash,
        whale.blockchain,
        whale.amount,
        whale.amountUSD,
        whale.fromAddress,
        whale.toAddress,
        whale.transactionType,
        whale.description,
        whale.blockHeight,
        whale.transactionTimestamp
      ]
    );
    console.log(`✅ Stored whale transaction ${whale.txHash.substring(0, 20)}... in database`);
  } catch (error) {
    console.error('❌ Failed to store whale transaction:', error);
    // Don't throw - allow whale watch to continue even if DB fails
  }
}

/**
 * Store whale analysis in database
 */
export async function storeWhaleAnalysis(analysis: WhaleAnalysis): Promise<void> {
  try {
    await query(
      `INSERT INTO whale_analysis 
       (tx_hash, analysis_provider, analysis_type, analysis_data, 
        blockchain_data, metadata, confidence, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (tx_hash, analysis_provider, analysis_type)
       DO UPDATE SET
         analysis_data = EXCLUDED.analysis_data,
         blockchain_data = EXCLUDED.blockchain_data,
         metadata = EXCLUDED.metadata,
         confidence = EXCLUDED.confidence,
         status = EXCLUDED.status,
         updated_at = NOW()`,
      [
        analysis.txHash,
        analysis.analysisProvider,
        analysis.analysisType,
        JSON.stringify(analysis.analysisData),
        analysis.blockchainData ? JSON.stringify(analysis.blockchainData) : null,
        analysis.metadata ? JSON.stringify(analysis.metadata) : null,
        analysis.confidence,
        analysis.status || 'completed'
      ]
    );
    console.log(`✅ Stored ${analysis.analysisProvider} analysis for ${analysis.txHash.substring(0, 20)}... in database`);
  } catch (error) {
    console.error('❌ Failed to store whale analysis:', error);
    // Don't throw - allow whale watch to continue even if DB fails
  }
}

/**
 * Get whale transactions from database
 */
export async function getWhaleTransactions(limit: number = 50): Promise<any[]> {
  try {
    const result = await query(
      `SELECT * FROM whale_transactions 
       ORDER BY detected_at DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (error) {
    console.error('❌ Failed to get whale transactions:', error);
    return [];
  }
}

/**
 * Get whale analysis from database
 */
export async function getWhaleAnalysis(txHash: string): Promise<any[]> {
  try {
    const result = await query(
      `SELECT * FROM whale_analysis 
       WHERE tx_hash = $1 
       ORDER BY created_at DESC`,
      [txHash]
    );
    return result.rows;
  } catch (error) {
    console.error('❌ Failed to get whale analysis:', error);
    return [];
  }
}

/**
 * Cache whale detection results
 */
export async function cacheWhaleDetection(
  cacheKey: string,
  thresholdBTC: number,
  whaleData: any[]
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + 30000); // 30 seconds
    
    await query(
      `INSERT INTO whale_watch_cache 
       (cache_key, threshold_btc, whale_count, whale_data, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (cache_key)
       DO UPDATE SET
         whale_count = EXCLUDED.whale_count,
         whale_data = EXCLUDED.whale_data,
         expires_at = EXCLUDED.expires_at,
         created_at = NOW()`,
      [
        cacheKey,
        thresholdBTC,
        whaleData.length,
        JSON.stringify(whaleData),
        expiresAt
      ]
    );
    console.log(`✅ Cached whale detection results (${whaleData.length} whales)`);
  } catch (error) {
    console.error('❌ Failed to cache whale detection:', error);
  }
}

/**
 * Get cached whale detection results
 */
export async function getCachedWhaleDetection(cacheKey: string): Promise<any[] | null> {
  try {
    const result = await queryOne(
      `SELECT whale_data FROM whale_watch_cache 
       WHERE cache_key = $1 AND expires_at > NOW()`,
      [cacheKey]
    );
    
    if (result) {
      console.log(`✅ Using cached whale detection results`);
      return result.whale_data;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Failed to get cached whale detection:', error);
    return null;
  }
}

/**
 * Clean up expired cache entries
 */
export async function cleanupExpiredCache(): Promise<void> {
  try {
    await query('SELECT cleanup_whale_cache()');
    console.log(`✅ Cleaned up expired whale cache entries`);
  } catch (error) {
    console.error('❌ Failed to cleanup expired cache:', error);
  }
}
