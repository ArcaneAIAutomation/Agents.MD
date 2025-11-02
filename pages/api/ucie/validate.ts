import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  validateSymbolFormat, 
  sanitizeSymbol,
  checkTokenInHardcodedDatabase,
  checkTokenOnCoinGecko,
  checkTokenOnExchanges
} from '../../../lib/ucie/tokenValidation';
import { 
  checkTokenInDatabase,
  getSimilarTokensFromDatabase
} from '../../../lib/ucie/tokenValidation.server';

interface ValidationResponse {
  success: boolean;
  valid: boolean;
  symbol?: string;
  error?: string;
  suggestions?: string[];
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ValidationResponse | ErrorResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { symbol } = req.query;

    // Validate query parameter
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid symbol parameter',
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize input
    const sanitized = sanitizeSymbol(symbol);
    
    // Check format
    if (!validateSymbolFormat(sanitized)) {
      return res.status(200).json({
        success: true,
        valid: false,
        error: 'Invalid token symbol format. Use 1-10 alphanumeric characters (e.g., BTC, ETH, SOL).',
        timestamp: new Date().toISOString()
      });
    }

    // Layer 1: Try database first (fast, reliable)
    let tokenInfo = null;
    try {
      tokenInfo = await checkTokenInDatabase(sanitized);
      if (tokenInfo) {
        console.log(`✅ Token ${sanitized} found in database (layer 1)`);
        return res.status(200).json({
          success: true,
          valid: true,
          symbol: tokenInfo.symbol,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`❌ Database check failed for ${sanitized}:`, error);
    }

    // Layer 2: Fallback to CoinGecko API (slower, rate-limited)
    console.log(`⚠️ Token ${sanitized} not in database, checking CoinGecko API (layer 2)...`);
    try {
      tokenInfo = await checkTokenOnCoinGecko(sanitized);
      if (tokenInfo) {
        console.log(`✅ Token ${sanitized} found on CoinGecko (layer 2)`);
        return res.status(200).json({
          success: true,
          valid: true,
          symbol: tokenInfo.symbol,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`❌ CoinGecko API check failed for ${sanitized}:`, error);
    }

    // Layer 3: Check hardcoded database (guaranteed for top 50)
    console.log(`⚠️ Token ${sanitized} not found via API, checking hardcoded database (layer 3)...`);
    tokenInfo = checkTokenInHardcodedDatabase(sanitized);
    if (tokenInfo) {
      return res.status(200).json({
        success: true,
        valid: true,
        symbol: tokenInfo.symbol,
        timestamp: new Date().toISOString()
      });
    }

    // Layer 4: Try exchange APIs as last resort
    console.log(`⚠️ Token ${sanitized} not in hardcoded database, checking exchanges (layer 4)...`);
    const exchanges = await checkTokenOnExchanges(sanitized);
    if (exchanges.length > 0) {
      console.log(`✅ Token ${sanitized} found on exchanges: ${exchanges.join(', ')} (layer 4)`);
      return res.status(200).json({
        success: true,
        valid: true,
        symbol: sanitized.toUpperCase(),
        timestamp: new Date().toISOString()
      });
    }

    // Token not found - get suggestions
    console.error(`❌ Token ${sanitized} not found in any source (all 4 layers failed)`);
    
    // Try to get suggestions from database first
    let suggestions: string[] = [];
    try {
      suggestions = await getSimilarTokensFromDatabase(sanitized);
    } catch (error) {
      console.error('Failed to get database suggestions:', error);
    }

    // If no database suggestions, try CoinGecko
    if (suggestions.length === 0) {
      try {
        const apiKey = process.env.COINGECKO_API_KEY;
        const baseUrl = 'https://api.coingecko.com/api/v3';
        
        const searchUrl = apiKey
          ? `${baseUrl}/search?query=${encodeURIComponent(sanitized)}&x_cg_pro_api_key=${apiKey}`
          : `${baseUrl}/search?query=${encodeURIComponent(sanitized)}`;

        const response = await fetch(searchUrl, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const data = await response.json();
          suggestions = data.coins?.slice(0, 5).map((c: any) => c.symbol.toUpperCase()) || [];
        }
      } catch (error) {
        console.error('Failed to get CoinGecko suggestions:', error);
      }
    }

    // If still no suggestions, use hardcoded database
    if (suggestions.length === 0) {
      const upperSymbol = sanitized.toUpperCase();
      const { HARDCODED_TOKENS } = await import('../../../lib/ucie/tokenValidation');
      
      for (const [tokenSymbol, tokenInfo] of Object.entries(HARDCODED_TOKENS)) {
        if (tokenSymbol.startsWith(upperSymbol.charAt(0)) || 
            tokenSymbol.includes(upperSymbol) ||
            tokenInfo.name.toUpperCase().includes(upperSymbol)) {
          suggestions.push(tokenSymbol);
          if (suggestions.length >= 5) break;
        }
      }
    }

    return res.status(200).json({
      success: true,
      valid: false,
      error: `Token "${sanitized}" not found.`,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Validation API error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
