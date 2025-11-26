/**
 * Quantum BTC Super Spec - API Integration Layer
 * Central export for all API clients
 */

// Export API clients
export { coinMarketCapClient } from './coinmarketcap';
export { coinGeckoClient } from './coingecko';
export { krakenClient } from './kraken';
export { blockchainClient } from './blockchain';
export { lunarCrushClient } from './lunarcrush';

// Export types
export type { CMCMarketData } from './coinmarketcap';
export type { CoinGeckoMarketData } from './coingecko';
export type { KrakenMarketData, LiquidityHarmonics, OrderBookLevel } from './kraken';
export type { BlockchainOnChainData, WhaleTransaction, MempoolInfo } from './blockchain';
export type { LunarCrushSentimentData, InfluencerData } from './lunarcrush';

/**
 * Unified API health check
 */
export async function checkAllAPIsHealth(): Promise<{
  coinMarketCap: { healthy: boolean; latency: number | null; error: string | null };
  coinGecko: { healthy: boolean; latency: number | null; error: string | null };
  kraken: { healthy: boolean; latency: number | null; error: string | null };
  blockchain: { healthy: boolean; latency: number | null; error: string | null };
  lunarCrush: { healthy: boolean; latency: number | null; error: string | null };
}> {
  const { coinMarketCapClient } = await import('./coinmarketcap');
  const { coinGeckoClient } = await import('./coingecko');
  const { krakenClient } = await import('./kraken');
  const { blockchainClient } = await import('./blockchain');
  const { lunarCrushClient } = await import('./lunarcrush');

  const [coinMarketCap, coinGecko, kraken, blockchain, lunarCrush] = await Promise.all([
    coinMarketCapClient.healthCheck(),
    coinGeckoClient.healthCheck(),
    krakenClient.healthCheck(),
    blockchainClient.healthCheck(),
    lunarCrushClient.healthCheck(),
  ]);

  return {
    coinMarketCap,
    coinGecko,
    kraken,
    blockchain,
    lunarCrush,
  };
}
