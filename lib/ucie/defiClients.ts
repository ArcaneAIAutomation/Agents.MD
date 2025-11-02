/**
 * DeFi Data Fetching Utilities
 * 
 * This module provides clients for fetching DeFi protocol data from multiple sources:
 * - DeFiLlama: TVL data and protocol metrics
 * - The Graph: Protocol-specific queries
 * - Messari: Fundamental data and tokenomics
 * 
 * Requirements: 18.1, 18.2
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface DeFiLlamaTVLData {
  tvl: number;
  tvlPrevDay: number;
  tvlPrevWeek: number;
  tvlPrevMonth: number;
  chainTvls: Record<string, number>;
  change_1d: number;
  change_7d: number;
  change_1m: number;
  mcap?: number;
  symbol: string;
  name: string;
  chains: string[];
}

export interface DeFiLlamaProtocolData {
  id: string;
  name: string;
  address: string;
  symbol: string;
  url: string;
  description: string;
  chain: string;
  logo: string;
  audits: string;
  audit_note: string;
  gecko_id: string;
  cmcId: string;
  category: string;
  chains: string[];
  module: string;
  twitter: string;
  forkedFrom: string[];
  oracles: string[];
  listedAt: number;
  methodology: string;
  slug: string;
  tvl: number;
  chainTvls: Record<string, number>;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  fdv?: number;
  mcap?: number;
}

export interface TheGraphProtocolData {
  id: string;
  totalValueLockedUSD: string;
  totalVolumeUSD: string;
  txCount: string;
  totalFees: string;
  totalRevenue: string;
}

export interface MessariAssetData {
  id: string;
  symbol: string;
  name: string;
  slug: string;
  metrics: {
    market_data: {
      price_usd: number;
      volume_last_24_hours: number;
      real_volume_last_24_hours: number;
      percent_change_usd_last_24_hours: number;
    };
    marketcap: {
      current_marketcap_usd: number;
      y_2050_marketcap_usd: number;
      liquid_marketcap_usd: number;
      volume_turnover_last_24_hours_percent: number;
    };
    supply: {
      y_2050: number;
      y_plus10: number;
      liquid: number;
      circulating: number;
      y_2050_issued_percent: number;
      annual_inflation_percent: number;
      stock_to_flow: number;
    };
    developer_activity: {
      stars: number;
      watchers: number;
      commits_last_3_months: number;
      commits_last_1_year: number;
      lines_added_last_3_months: number;
      lines_added_last_1_year: number;
    };
    roi_data: {
      percent_change_last_1_week: number;
      percent_change_last_1_month: number;
      percent_change_last_3_months: number;
      percent_change_last_1_year: number;
    };
  };
}

export interface DeFiProtocolMetrics {
  tvl: number;
  tvlChange7d: number;
  tvlChange30d: number;
  chainTvls: Record<string, number>;
  volume24h?: number;
  fees24h?: number;
  revenue24h?: number;
  protocolRevenue?: number;
  holderRevenue?: number;
  category: string;
  chains: string[];
  source: 'defillama' | 'thegraph' | 'messari';
}

// ============================================================================
// DeFiLlama API Client
// ============================================================================

const DEFILLAMA_BASE_URL = 'https://api.llama.fi';

/**
 * Fetch TVL data for a specific protocol from DeFiLlama
 */
export async function fetchDeFiLlamaTVL(protocolSlug: string): Promise<DeFiLlamaTVLData | null> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/protocol/${protocolSlug}`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.warn(`DeFiLlama TVL fetch failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Calculate changes from historical data
    const tvlData = data.tvl || [];
    const currentTVL = tvlData[tvlData.length - 1]?.totalLiquidityUSD || data.tvl || 0;
    const prevDayTVL = tvlData[tvlData.length - 2]?.totalLiquidityUSD || currentTVL;
    const prevWeekTVL = tvlData[Math.max(0, tvlData.length - 8)]?.totalLiquidityUSD || currentTVL;
    const prevMonthTVL = tvlData[Math.max(0, tvlData.length - 31)]?.totalLiquidityUSD || currentTVL;

    return {
      tvl: currentTVL,
      tvlPrevDay: prevDayTVL,
      tvlPrevWeek: prevWeekTVL,
      tvlPrevMonth: prevMonthTVL,
      chainTvls: data.chainTvls || {},
      change_1d: ((currentTVL - prevDayTVL) / prevDayTVL) * 100,
      change_7d: ((currentTVL - prevWeekTVL) / prevWeekTVL) * 100,
      change_1m: ((currentTVL - prevMonthTVL) / prevMonthTVL) * 100,
      mcap: data.mcap,
      symbol: data.symbol || '',
      name: data.name || '',
      chains: data.chains || [],
    };
  } catch (error) {
    console.error('Error fetching DeFiLlama TVL:', error);
    return null;
  }
}

/**
 * Fetch detailed protocol data from DeFiLlama
 */
export async function fetchDeFiLlamaProtocol(protocolSlug: string): Promise<DeFiLlamaProtocolData | null> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/protocol/${protocolSlug}`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`DeFiLlama protocol fetch failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching DeFiLlama protocol:', error);
    return null;
  }
}

/**
 * Search for a protocol by token symbol
 */
export async function searchDeFiLlamaProtocol(symbol: string): Promise<string | null> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/protocols`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return null;
    }

    const protocols = await response.json();
    const normalizedSymbol = symbol.toUpperCase();
    
    // Find protocol matching the symbol
    const protocol = protocols.find((p: any) => 
      p.symbol?.toUpperCase() === normalizedSymbol ||
      p.name?.toUpperCase().includes(normalizedSymbol)
    );

    return protocol?.slug || null;
  } catch (error) {
    console.error('Error searching DeFiLlama protocols:', error);
    return null;
  }
}

// ============================================================================
// The Graph API Client
// ============================================================================

const THEGRAPH_BASE_URL = 'https://api.thegraph.com/subgraphs/name';

/**
 * Query The Graph for Uniswap V3 protocol data
 */
export async function fetchUniswapV3Data(tokenAddress: string): Promise<TheGraphProtocolData | null> {
  const query = `
    {
      token(id: "${tokenAddress.toLowerCase()}") {
        id
        totalValueLockedUSD
        totalVolumeUSD
        txCount
      }
    }
  `;

  try {
    const response = await fetch(`${THEGRAPH_BASE_URL}/uniswap/uniswap-v3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`The Graph Uniswap query failed: ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data?.token || null;
  } catch (error) {
    console.error('Error fetching Uniswap data from The Graph:', error);
    return null;
  }
}

/**
 * Query The Graph for Aave protocol data
 */
export async function fetchAaveData(tokenAddress: string): Promise<TheGraphProtocolData | null> {
  const query = `
    {
      reserve(id: "${tokenAddress.toLowerCase()}") {
        id
        totalLiquidity
        totalBorrows
        totalDeposits
      }
    }
  `;

  try {
    const response = await fetch(`${THEGRAPH_BASE_URL}/aave/protocol-v3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`The Graph Aave query failed: ${response.status}`);
      return null;
    }

    const result = await response.json();
    const reserve = result.data?.reserve;
    
    if (!reserve) return null;

    return {
      id: reserve.id,
      totalValueLockedUSD: reserve.totalLiquidity || '0',
      totalVolumeUSD: '0',
      txCount: '0',
      totalFees: '0',
      totalRevenue: '0',
    };
  } catch (error) {
    console.error('Error fetching Aave data from The Graph:', error);
    return null;
  }
}

// ============================================================================
// Messari API Client
// ============================================================================

const MESSARI_BASE_URL = 'https://data.messari.io/api/v1';

/**
 * Fetch asset fundamentals from Messari
 */
export async function fetchMessariAsset(symbol: string): Promise<MessariAssetData | null> {
  try {
    const response = await fetch(`${MESSARI_BASE_URL}/assets/${symbol}/metrics`, {
      headers: {
        'Accept': 'application/json',
        // Note: Add 'x-messari-api-key' header if you have an API key
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`Messari asset fetch failed: ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching Messari asset:', error);
    return null;
  }
}

/**
 * Fetch protocol revenue data from Messari
 */
export async function fetchMessariProtocolRevenue(symbol: string): Promise<{
  revenue24h: number;
  fees24h: number;
  protocolRevenue: number;
  holderRevenue: number;
} | null> {
  try {
    const response = await fetch(`${MESSARI_BASE_URL}/assets/${symbol}/metrics/revenue`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    const data = result.data;

    return {
      revenue24h: data?.revenue_24h || 0,
      fees24h: data?.fees_24h || 0,
      protocolRevenue: data?.protocol_revenue || 0,
      holderRevenue: data?.holder_revenue || 0,
    };
  } catch (error) {
    console.error('Error fetching Messari revenue:', error);
    return null;
  }
}

// ============================================================================
// Aggregated DeFi Data Fetcher
// ============================================================================

/**
 * Fetch comprehensive DeFi metrics from multiple sources
 */
export async function fetchDeFiMetrics(symbol: string): Promise<DeFiProtocolMetrics | null> {
  try {
    // Try to find protocol slug for DeFiLlama
    const protocolSlug = await searchDeFiLlamaProtocol(symbol);
    
    if (!protocolSlug) {
      console.log(`No DeFi protocol found for symbol: ${symbol}`);
      return null;
    }

    // Fetch from DeFiLlama (primary source)
    const [tvlData, protocolData] = await Promise.all([
      fetchDeFiLlamaTVL(protocolSlug),
      fetchDeFiLlamaProtocol(protocolSlug),
    ]);

    if (!tvlData && !protocolData) {
      return null;
    }

    const data = tvlData || protocolData;

    return {
      tvl: data?.tvl || 0,
      tvlChange7d: data?.change_7d || 0,
      tvlChange30d: data?.change_1m || 0,
      chainTvls: data?.chainTvls || {},
      category: protocolData?.category || 'Unknown',
      chains: data?.chains || [],
      source: 'defillama',
    };
  } catch (error) {
    console.error('Error fetching DeFi metrics:', error);
    return null;
  }
}

/**
 * Check if a token is a DeFi protocol token
 */
export async function isDeFiProtocol(symbol: string): Promise<boolean> {
  const protocolSlug = await searchDeFiLlamaProtocol(symbol);
  return protocolSlug !== null;
}
