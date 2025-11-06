/**
 * Comprehensive API Health Check Script
 * Tests all configured APIs and reports their status
 */

import * as dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface APIHealthResult {
  name: string;
  status: 'Working' | 'Failed' | 'Not Configured';
  responseTime?: number;
  rateLimit?: string;
  error?: string;
  suggestion?: string;
}

const results: APIHealthResult[] = [];

// Helper function to measure response time
async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
  const start = Date.now();
  const result = await fn();
  const time = Date.now() - start;
  return { result, time };
}

// 1. Caesar API Health Check
async function checkCaesarAPI(): Promise<APIHealthResult> {
  const apiKey = process.env.CAESAR_API_KEY;
  
  if (!apiKey) {
    return {
      name: 'Caesar API',
      status: 'Not Configured',
      suggestion: 'Set CAESAR_API_KEY in .env.local'
    };
  }

  try {
    const { result, time } = await measureTime(async () => {
      const response = await fetch('https://api.caesar.xyz/research', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
      return response;
    });

    if (result.ok) {
      return {
        name: 'Caesar API',
        status: 'Working',
        responseTime: time,
        rateLimit: result.headers.get('x-ratelimit-remaining') || 'Unknown'
      };
    } else if (result.status === 401) {
      return {
        name: 'Caesar API',
        status: 'Failed',
        responseTime: time,
        error: 'Authentication failed - Invalid API key',
        suggestion: 'Verify CAESAR_API_KEY is correct'
      };
    } else {
      return {
        name: 'Caesar API',
        status: 'Failed',
        responseTime: time,
        error: `HTTP ${result.status}: ${result.statusText}`,
        suggestion: 'Check Caesar API status at https://status.caesar.xyz'
      };
    }
  } catch (error: any) {
    return {
      name: 'Caesar API',
      status: 'Failed',
      error: error.message,
      suggestion: error.name === 'AbortError' ? 'Request timeout - Check network connection' : 'Verify API endpoint is accessible'
    };
  }
}

// 2. CoinGecko API Health Check
async function checkCoinGeckoAPI(): Promise<APIHealthResult> {
  const apiKey = process.env.COINGECKO_API_KEY;
  
  try {
    const url = apiKey 
      ? 'https://pro-api.coingecko.com/api/v3/ping'
      : 'https://api.coingecko.com/api/v3/ping';
    
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['x-cg-pro-api-key'] = apiKey;
    }

    const { result, time } = await measureTime(async () => {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(10000)
      });
      return response;
    });

    if (result.ok) {
      const data = await result.json();
      return {
        name: 'CoinGecko API',
        status: 'Working',
        responseTime: time,
        rateLimit: apiKey ? 'Pro tier (500 calls/min)' : 'Free tier (10-30 calls/min)'
      };
    } else if (result.status === 429) {
      return {
        name: 'CoinGecko API',
        status: 'Failed',
        responseTime: time,
        error: 'Rate limit exceeded',
        suggestion: 'Wait before retrying or upgrade to Pro tier'
      };
    } else {
      return {
        name: 'CoinGecko API',
        status: 'Failed',
        responseTime: time,
        error: `HTTP ${result.status}: ${result.statusText}`,
        suggestion: 'Check CoinGecko API status'
      };
    }
  } catch (error: any) {
    return {
      name: 'CoinGecko API',
      status: 'Failed',
      error: error.message,
      suggestion: 'Check network connection or API endpoint'
    };
  }
}

// 3. CoinMarketCap API Health Check
async function checkCoinMarketCapAPI(): Promise<APIHealthResult> {
  const apiKey = process.env.COINMARKETCAP_API_KEY;
  
  if (!apiKey) {
    return {
      name: 'CoinMarketCap API',
      status: 'Not Configured',
      suggestion: 'Set COINMARKETCAP_API_KEY in .env.local'
    };
  }

  try {
    const { result, time } = await measureTime(async () => {
      const response = await fetch('https://pro-api.coinmarketcap.com/v1/key/info', {
        headers: {
          'X-CMC_PRO_API_KEY': apiKey,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
      return response;
    });

    if (result.ok) {
      const data = await result.json();
      const credits = data.data?.usage?.current_day?.credits_used || 0;
      const limit = data.data?.plan?.credit_limit_daily || 'Unknown';
      
      return {
        name: 'CoinMarketCap API',
        status: 'Working',
        responseTime: time,
        rateLimit: `${credits}/${limit} credits used today`
      };
    } else if (result.status === 401) {
      return {
        name: 'CoinMarketCap API',
        status: 'Failed',
        responseTime: time,
        error: 'Authentication failed - Invalid API key',
        suggestion: 'Verify COINMARKETCAP_API_KEY is correct'
      };
    } else if (result.status === 429) {
      return {
        name: 'CoinMarketCap API',
        status: 'Failed',
        responseTime: time,
        error: 'Rate limit exceeded',
        suggestion: 'Daily credit limit reached - Wait until reset or upgrade plan'
      };
    } else {
      return {
        name: 'CoinMarketCap API',
        status: 'Failed',
        responseTime: time,
        error: `HTTP ${result.status}: ${result.statusText}`,
        suggestion: 'Check CoinMarketCap API status'
      };
    }
  } catch (error: any) {
    return {
      name: 'CoinMarketCap API',
      status: 'Failed',
      error: error.message,
      suggestion: 'Check network connection or API endpoint'
    };
  }
}

// 4. NewsAPI Health Check
async function checkNewsAPI(): Promise<APIHealthResult> {
  const apiKey = process.env.NEWS_API_KEY;
  
  if (!apiKey) {
    return {
      name: 'NewsAPI',
      status: 'Not Configured',
      suggestion: 'Set NEWS_API_KEY in .env.local'
    };
  }

  try {
    const { result, time } = await measureTime(async () => {
      const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${apiKey}`, {
        signal: AbortSignal.timeout(10000)
      });
      return response;
    });

    if (result.ok) {
      const data = await result.json();
      return {
        name: 'NewsAPI',
        status: 'Working',
        responseTime: time,
        rateLimit: 'Check dashboard for usage'
      };
    } else if (result.status === 401) {
      return {
        name: 'NewsAPI',
        status: 'Failed',
        responseTime: time,
        error: 'Authentication failed - Invalid API key',
        suggestion: 'Verify NEWS_API_KEY is correct'
      };
    } else if (result.status === 429) {
      return {
        name: 'NewsAPI',
        status: 'Failed',
        responseTime: time,
        error: 'Rate limit exceeded',
        suggestion: 'Daily request limit reached - Upgrade plan or wait for reset'
      };
    } else {
      return {
        name: 'NewsAPI',
        status: 'Failed',
        responseTime: time,
        error: `HTTP ${result.status}: ${result.statusText}`,
        suggestion: 'Check NewsAPI status'
      };
    }
  } catch (error: any) {
    return {
      name: 'NewsAPI',
      status: 'Failed',
      error: error.message,
      suggestion: 'Check network connection or API endpoint'
    };
  }
}

// 5. OpenAI API Health Check
async function checkOpenAIAPI(): Promise<APIHealthResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      name: 'OpenAI API',
      status: 'Not Configured',
      suggestion: 'Set OPENAI_API_KEY in .env.local'
    };
  }

  try {
    const { result, time } = await measureTime(async () => {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
      return response;
    });

    if (result.ok) {
      const data = await result.json();
      const hasGPT4 = data.data?.some((m: any) => m.id.includes('gpt-4'));
      
      return {
        name: 'OpenAI API',
        status: 'Working',
        responseTime: time,
        rateLimit: hasGPT4 ? 'GPT-4 access confirmed' : 'GPT-3.5 only'
      };
    } else if (result.status === 401) {
      return {
        name: 'OpenAI API',
        status: 'Failed',
        responseTime: time,
        error: 'Authentication failed - Invalid API key',
        suggestion: 'Verify OPENAI_API_KEY is correct'
      };
    } else if (result.status === 429) {
      return {
        name: 'OpenAI API',
        status: 'Failed',
        responseTime: time,
        error: 'Rate limit exceeded',
        suggestion: 'Wait before retrying or check usage limits'
      };
    } else {
      return {
        name: 'OpenAI API',
        status: 'Failed',
        responseTime: time,
        error: `HTTP ${result.status}: ${result.statusText}`,
        suggestion: 'Check OpenAI API status at https://status.openai.com'
      };
    }
  } catch (error: any) {
    return {
      name: 'OpenAI API',
      status: 'Failed',
      error: error.message,
      suggestion: 'Check network connection or API endpoint'
    };
  }
}

// 6. Gemini API Health Check
async function checkGeminiAPI(): Promise<APIHealthResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return {
      name: 'Gemini API',
      status: 'Not Configured',
      suggestion: 'Set GEMINI_API_KEY in .env.local for Whale Watch analysis'
    };
  }

  try {
    const { result, time } = await measureTime(async () => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        signal: AbortSignal.timeout(10000)
      });
      return response;
    });

    if (result.ok) {
      const data = await result.json();
      const hasGemini25 = data.models?.some((m: any) => m.name.includes('gemini-2.5'));
      
      return {
        name: 'Gemini API',
        status: 'Working',
        responseTime: time,
        rateLimit: hasGemini25 ? 'Gemini 2.5 available' : 'Older models only'
      };
    } else if (result.status === 401 || result.status === 403) {
      return {
        name: 'Gemini API',
        status: 'Failed',
        responseTime: time,
        error: 'Authentication failed - Invalid API key',
        suggestion: 'Verify GEMINI_API_KEY is correct (should start with AIzaSy)'
      };
    } else if (result.status === 429) {
      return {
        name: 'Gemini API',
        status: 'Failed',
        responseTime: time,
        error: 'Rate limit exceeded',
        suggestion: 'Wait before retrying or check quota limits'
      };
    } else {
      return {
        name: 'Gemini API',
        status: 'Failed',
        responseTime: time,
        error: `HTTP ${result.status}: ${result.statusText}`,
        suggestion: 'Check Gemini API status'
      };
    }
  } catch (error: any) {
    return {
      name: 'Gemini API',
      status: 'Failed',
      error: error.message,
      suggestion: 'Check network connection or API endpoint'
    };
  }
}

// 7. Database Connection Health Check
async function checkDatabaseConnection(): Promise<APIHealthResult> {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return {
      name: 'PostgreSQL Database',
      status: 'Not Configured',
      suggestion: 'Set DATABASE_URL in .env.local'
    };
  }

  let pool: Pool | null = null;
  
  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false
      },
      max: 1,
      connectionTimeoutMillis: 10000
    });

    const start = Date.now();
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    const time = Date.now() - start;

    const version = result.rows[0].version;
    const postgresVersion = version.match(/PostgreSQL (\d+\.\d+)/)?.[1] || 'Unknown';

    return {
      name: 'PostgreSQL Database',
      status: 'Working',
      responseTime: time,
      rateLimit: `PostgreSQL ${postgresVersion} - Connection pool active`
    };
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      return {
        name: 'PostgreSQL Database',
        status: 'Failed',
        error: 'Connection refused',
        suggestion: 'Verify database is running and DATABASE_URL is correct'
      };
    } else if (error.code === 'ETIMEDOUT') {
      return {
        name: 'PostgreSQL Database',
        status: 'Failed',
        error: 'Connection timeout',
        suggestion: 'Check network connectivity or firewall settings'
      };
    } else if (error.message.includes('password authentication failed')) {
      return {
        name: 'PostgreSQL Database',
        status: 'Failed',
        error: 'Authentication failed',
        suggestion: 'Verify database credentials in DATABASE_URL'
      };
    } else if (error.message.includes('self-signed certificate')) {
      return {
        name: 'PostgreSQL Database',
        status: 'Failed',
        error: 'SSL certificate error',
        suggestion: 'Ensure ssl: { rejectUnauthorized: false } is set in connection config'
      };
    } else {
      return {
        name: 'PostgreSQL Database',
        status: 'Failed',
        error: error.message,
        suggestion: 'Check database connection string and network access'
      };
    }
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Main execution
async function runHealthCheck() {
  console.log('🏥 API Health Check Starting...\n');
  console.log('═'.repeat(80));
  
  // Run all checks in parallel
  const checks = await Promise.all([
    checkCaesarAPI(),
    checkCoinGeckoAPI(),
    checkCoinMarketCapAPI(),
    checkNewsAPI(),
    checkOpenAIAPI(),
    checkGeminiAPI(),
    checkDatabaseConnection()
  ]);

  results.push(...checks);

  // Print results
  console.log('\n📊 API HEALTH CHECK RESULTS\n');
  console.log('═'.repeat(80));

  let workingCount = 0;
  let failedCount = 0;
  let notConfiguredCount = 0;

  results.forEach(result => {
    const statusEmoji = result.status === 'Working' ? '✅' : result.status === 'Failed' ? '❌' : '⚠️';
    console.log(`\n${statusEmoji} ${result.name}`);
    console.log('─'.repeat(80));
    console.log(`Status: ${result.status}`);
    
    if (result.responseTime !== undefined) {
      console.log(`⏱️  Response Time: ${result.responseTime}ms`);
    }
    
    if (result.rateLimit) {
      console.log(`📊 Rate Limit: ${result.rateLimit}`);
    }
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    }
    
    if (result.suggestion) {
      console.log(`💡 Suggestion: ${result.suggestion}`);
    }

    if (result.status === 'Working') workingCount++;
    else if (result.status === 'Failed') failedCount++;
    else notConfiguredCount++;
  });

  // Summary
  console.log('\n═'.repeat(80));
  console.log('\n📈 SUMMARY\n');
  console.log(`✅ Working: ${workingCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`⚠️  Not Configured: ${notConfiguredCount}`);
  console.log(`📊 Total APIs Checked: ${results.length}`);
  
  const healthPercentage = workingCount > 0 ? Math.round((workingCount / (workingCount + failedCount)) * 100) : 0;
  console.log(`\n🏥 Overall Health: ${healthPercentage}%`);
  
  if (failedCount > 0) {
    console.log('\n⚠️  ACTION REQUIRED: Some APIs are not working. Review errors above.');
  } else if (notConfiguredCount > 0) {
    console.log('\n💡 TIP: Configure additional APIs for enhanced functionality.');
  } else {
    console.log('\n🎉 All configured APIs are working perfectly!');
  }
  
  console.log('\n═'.repeat(80));
}

// Run the health check
runHealthCheck().catch(error => {
  console.error('❌ Health check failed:', error);
  process.exit(1);
});
