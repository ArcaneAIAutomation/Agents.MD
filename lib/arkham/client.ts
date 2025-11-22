/**
 * Arkham Intelligence API Client
 * https://intel.arkm.com/
 * 
 * Provides blockchain address intelligence and entity identification
 */

interface ArkhamAddressInfo {
  address: string;
  chain: string;
  entity?: {
    name: string;
    type: string; // 'exchange', 'whale', 'institution', 'defi', etc.
    verified: boolean;
  };
  labels?: string[];
  riskScore?: number;
  totalValueUSD?: number;
  transactionCount?: number;
}

interface ArkhamResponse {
  success: boolean;
  data?: ArkhamAddressInfo;
  error?: string;
}

/**
 * Identify a Bitcoin address using Arkham Intelligence
 */
export async function identifyAddress(address: string): Promise<ArkhamAddressInfo | null> {
  try {
    console.log(`🔍 Querying Arkham Intelligence for ${address.substring(0, 20)}...`);
    
    // Arkham Intelligence API endpoint
    // Note: This may require an API key - check Arkham docs
    const apiKey = process.env.ARKHAM_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ ARKHAM_API_KEY not configured, skipping Arkham lookup');
      return null;
    }
    
    const response = await fetch(
      `https://api.arkhamintelligence.com/intelligence/address/${address}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      }
    );
    
    if (!response.ok) {
      console.warn(`⚠️ Arkham API returned ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    console.log(`✅ Arkham identified address:`, data.entity?.name || 'Unknown');
    
    return {
      address,
      chain: 'BTC',
      entity: data.entity,
      labels: data.labels || [],
      riskScore: data.riskScore,
      totalValueUSD: data.totalValueUSD,
      transactionCount: data.transactionCount,
    };
    
  } catch (error) {
    console.error(`❌ Arkham lookup failed:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Identify multiple addresses in parallel
 */
export async function identifyAddresses(addresses: string[]): Promise<Map<string, ArkhamAddressInfo | null>> {
  console.log(`🔍 Querying Arkham for ${addresses.length} addresses...`);
  
  const results = await Promise.all(
    addresses.map(addr => identifyAddress(addr))
  );
  
  const map = new Map<string, ArkhamAddressInfo | null>();
  addresses.forEach((addr, i) => {
    map.set(addr, results[i]);
  });
  
  return map;
}

/**
 * Format Arkham data for AI prompt
 */
export function formatArkhamDataForPrompt(arkhamData: ArkhamAddressInfo | null): string {
  if (!arkhamData || !arkhamData.entity) {
    return 'Unknown entity (not identified by Arkham Intelligence)';
  }
  
  const { entity, labels, riskScore } = arkhamData;
  
  let description = `${entity.name} (${entity.type})`;
  
  if (entity.verified) {
    description += ' ✓ Verified';
  }
  
  if (labels && labels.length > 0) {
    description += `\nLabels: ${labels.join(', ')}`;
  }
  
  if (riskScore !== undefined) {
    description += `\nRisk Score: ${riskScore}/100`;
  }
  
  return description;
}

/**
 * Determine transaction type based on Arkham intelligence
 */
export function determineTransactionType(
  fromArkham: ArkhamAddressInfo | null,
  toArkham: ArkhamAddressInfo | null
): 'exchange_deposit' | 'exchange_withdrawal' | 'whale_to_whale' | 'unknown' {
  
  const fromType = fromArkham?.entity?.type;
  const toType = toArkham?.entity?.type;
  
  // Exchange deposit: From whale/unknown to exchange
  if (toType === 'exchange' && fromType !== 'exchange') {
    return 'exchange_deposit';
  }
  
  // Exchange withdrawal: From exchange to whale/unknown
  if (fromType === 'exchange' && toType !== 'exchange') {
    return 'exchange_withdrawal';
  }
  
  // Whale to whale: Both are whales or large holders
  if (
    (fromType === 'whale' || fromType === 'institution') &&
    (toType === 'whale' || toType === 'institution')
  ) {
    return 'whale_to_whale';
  }
  
  return 'unknown';
}
