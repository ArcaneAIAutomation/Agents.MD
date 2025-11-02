#!/usr/bin/env tsx
/**
 * UCIE Token Seeding Script
 * 
 * Seeds the ucie_tokens table with top cryptocurrencies from CoinGecko.
 * 
 * Usage:
 *   npx tsx scripts/seed-ucie-tokens.ts
 * 
 * Options:
 *   --limit=N    Number of tokens to fetch (default: 250, max: 250)
 *   --force      Force refresh even if tokens exist
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logHeader(message: string) {
  log(`\n${'='.repeat(70)}`, colors.blue);
  log(`  ${message}`, colors.bright + colors.blue);
  log(`${'='.repeat(70)}\n`, colors.blue);
}

interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
}

/**
 * Fetch tokens from CoinGecko
 */
async function fetchTokensFromCoinGecko(limit: number = 250): Promise<CoinGeckoToken[]> {
  const apiKey = process.env.COINGECKO_API_KEY;
  
  // CoinGecko allows max 250 per page
  const perPage = Math.min(limit, 250);
  
  // Always use public API (demo keys don't work with pro-api)
  const baseUrl = 'https://api.coingecko.com/api/v3';
  
  const url = apiKey
    ? `${baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false&x_cg_demo_api_key=${apiKey}`
    : `${baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false`;

  logInfo(`Fetching top ${perPage} tokens from CoinGecko...`);
  logInfo(`Using ${apiKey ? 'Demo API with key' : 'Public API (no key)'}`);

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const data: CoinGeckoToken[] = await response.json();
  logSuccess(`Fetched ${data.length} tokens from CoinGecko`);
  
  return data;
}

/**
 * Seed tokens into database
 */
async function seedTokens(pool: Pool, tokens: CoinGeckoToken[], force: boolean = false) {
  logInfo('Checking existing tokens in database...');
  
  // Check if tokens already exist
  const countResult = await pool.query('SELECT COUNT(*) FROM ucie_tokens');
  const existingCount = parseInt(countResult.rows[0].count);

  if (existingCount > 0 && !force) {
    logWarning(`Database already contains ${existingCount} tokens`);
    logInfo('Use --force flag to refresh existing tokens');
    return;
  }

  if (existingCount > 0 && force) {
    logWarning(`Deleting ${existingCount} existing tokens...`);
    await pool.query('DELETE FROM ucie_tokens');
    logSuccess('Existing tokens deleted');
  }

  logInfo(`Inserting ${tokens.length} tokens into database...`);

  let inserted = 0;
  let failed = 0;

  for (const token of tokens) {
    try {
      await pool.query(`
        INSERT INTO ucie_tokens (
          coingecko_id,
          symbol,
          name,
          market_cap_rank,
          image_url,
          current_price_usd,
          market_cap_usd,
          total_volume_usd,
          price_change_24h,
          is_active,
          last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (coingecko_id) 
        DO UPDATE SET
          symbol = EXCLUDED.symbol,
          name = EXCLUDED.name,
          market_cap_rank = EXCLUDED.market_cap_rank,
          image_url = EXCLUDED.image_url,
          current_price_usd = EXCLUDED.current_price_usd,
          market_cap_usd = EXCLUDED.market_cap_usd,
          total_volume_usd = EXCLUDED.total_volume_usd,
          price_change_24h = EXCLUDED.price_change_24h,
          last_updated = NOW()
      `, [
        token.id,
        token.symbol.toUpperCase(),
        token.name,
        token.market_cap_rank,
        token.image,
        token.current_price,
        token.market_cap,
        token.total_volume,
        token.price_change_percentage_24h,
        true
      ]);

      inserted++;

      // Progress indicator
      if (inserted % 50 === 0) {
        logInfo(`Progress: ${inserted}/${tokens.length} tokens inserted...`);
      }
    } catch (error) {
      failed++;
      console.error(`Failed to insert ${token.symbol}:`, error);
    }
  }

  logSuccess(`Successfully inserted ${inserted} tokens`);
  if (failed > 0) {
    logWarning(`Failed to insert ${failed} tokens`);
  }
}

/**
 * Display token statistics
 */
async function displayStatistics(pool: Pool) {
  logHeader('Token Statistics');

  // Total count
  const countResult = await pool.query('SELECT COUNT(*) FROM ucie_tokens');
  const totalCount = parseInt(countResult.rows[0].count);
  logInfo(`Total tokens: ${totalCount}`);

  // Top 10 by market cap
  const top10Result = await pool.query(`
    SELECT symbol, name, market_cap_rank, current_price_usd, market_cap_usd
    FROM ucie_tokens
    WHERE market_cap_rank IS NOT NULL
    ORDER BY market_cap_rank ASC
    LIMIT 10
  `);

  log('\nTop 10 tokens by market cap:', colors.cyan);
  top10Result.rows.forEach((token, index) => {
    const price = token.current_price_usd ? `$${parseFloat(token.current_price_usd).toLocaleString()}` : 'N/A';
    const marketCap = token.market_cap_usd ? `$${(token.market_cap_usd / 1e9).toFixed(2)}B` : 'N/A';
    log(`  ${index + 1}. ${token.symbol.padEnd(8)} ${token.name.padEnd(20)} ${price.padStart(15)} (MC: ${marketCap})`, colors.reset);
  });

  // Recently updated
  const recentResult = await pool.query(`
    SELECT symbol, name, last_updated
    FROM ucie_tokens
    ORDER BY last_updated DESC
    LIMIT 5
  `);

  log('\nRecently updated tokens:', colors.cyan);
  recentResult.rows.forEach(token => {
    const updated = new Date(token.last_updated).toLocaleString();
    log(`  ${token.symbol.padEnd(8)} ${token.name.padEnd(20)} (${updated})`, colors.reset);
  });
}

/**
 * Main seeding function
 */
async function main() {
  logHeader('UCIE Token Seeding');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const force = args.includes('--force');
  
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 250;

  if (limit < 1 || limit > 250) {
    logError('Limit must be between 1 and 250');
    process.exit(1);
  }

  logInfo(`Limit: ${limit} tokens`);
  logInfo(`Force refresh: ${force ? 'Yes' : 'No'}`);

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    logError('DATABASE_URL environment variable is not set');
    logInfo('Please set DATABASE_URL in your .env.local file');
    process.exit(1);
  }

  // Create database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    // Test connection
    logInfo('Testing database connection...');
    await pool.query('SELECT NOW()');
    logSuccess('Database connected');

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ucie_tokens'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      logError('Table ucie_tokens does not exist');
      logInfo('Run the migration first: npx tsx scripts/run-ucie-tokens-migration.ts');
      process.exit(1);
    }

    // Fetch tokens from CoinGecko
    const tokens = await fetchTokensFromCoinGecko(limit);

    // Seed tokens
    await seedTokens(pool, tokens, force);

    // Display statistics
    await displayStatistics(pool);

    logHeader('Seeding Complete! 🎉');
    logSuccess('UCIE tokens are ready for validation and search');

  } catch (error) {
    logHeader('Seeding Failed');
    logError('An error occurred during seeding:');
    
    if (error instanceof Error) {
      log(`\n${error.message}`, colors.red);
      
      if (error.message.includes('rate limit')) {
        logWarning('\nCoinGecko API rate limit exceeded');
        logInfo('Wait a few minutes and try again, or use a CoinGecko API key');
      }

      if (error.message.includes('timeout')) {
        logWarning('\nConnection timeout detected');
        logInfo('Check your network connection and try again');
      }
    } else {
      console.error(error);
    }

    process.exit(1);
  } finally {
    await pool.end();
    logInfo('Database connection closed');
  }
}

// Run seeding
main().catch(error => {
  logError('Unexpected error:');
  console.error(error);
  process.exit(1);
});
