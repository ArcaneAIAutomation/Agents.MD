/**
 * Script to fix the generateAISummary function in preview-data/[symbol].ts
 * Replaces the broken 250-line function with a simple 40-line version
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'pages', 'api', 'ucie', 'preview-data', '[symbol].ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Find the function start and end
const functionStart = content.indexOf('async function generateAISummary(');
const functionEnd = content.indexOf('\nfunction generateFallbackSummary(');

if (functionStart === -1 || functionEnd === -1) {
  console.error('❌ Could not find function boundaries');
  process.exit(1);
}

console.log(`✅ Found function at lines ${functionStart}-${functionEnd}`);

// Extract the parts before and after
const beforeFunction = content.substring(0, functionStart);
const afterFunction = content.substring(functionEnd);

// New simplified function
const newFunction = `async function generateAISummary(
  symbol: string,
  collectedData: any,
  apiStatus: any
): Promise<string> {
  console.log(\`📊 Generating basic summary for \${symbol} (NO job creation here)...\`);
  
  // ✅ SIMPLIFIED: Just generate a basic summary from collectedData
  // Don't start GPT-5.1 job here - let the main handler do it
  
  let summary = \`**\${symbol} Data Collection Summary**\\n\\n\`;
  summary += \`Data Quality: \${apiStatus.successRate}%\\n\`;
  summary += \`Working APIs: \${apiStatus.working.join(', ')}\\n\\n\`;

  // Market Data
  if (collectedData.marketData?.success && collectedData.marketData?.priceAggregation) {
    const agg = collectedData.marketData.priceAggregation;
    const price = agg.averagePrice || agg.aggregatedPrice || 0;
    const change = agg.averageChange24h || agg.aggregatedChange24h || 0;
    summary += \`**Market**: $\${price.toLocaleString()} (\${change > 0 ? '+' : ''}\${change.toFixed(2)}%)\\n\`;
  }

  // Sentiment
  if (collectedData.sentiment?.success && collectedData.sentiment?.sentiment) {
    const score = collectedData.sentiment.sentiment.overallScore || 0;
    summary += \`**Sentiment**: \${score}/100\\n\`;
  }

  // Technical
  if (collectedData.technical?.success && collectedData.technical?.indicators?.trend) {
    const trend = collectedData.technical.indicators.trend.direction || 'neutral';
    summary += \`**Technical**: \${trend}\\n\`;
  }

  // News
  if (collectedData.news?.success && collectedData.news?.articles?.length > 0) {
    summary += \`**News**: \${collectedData.news.articles.length} recent articles\\n\`;
  }

  // On-Chain
  if (collectedData.onChain?.success) {
    summary += \`**On-Chain**: Data available\\n\`;
  }

  summary += \`\\n✅ Data collection complete. GPT-5.1 analysis starting...\`;
  
  return summary;
}

`;

// Reconstruct the file
const newContent = beforeFunction + newFunction + afterFunction;

// Write the file
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('✅ Function replaced successfully!');
console.log(`   Old function: ${functionEnd - functionStart} characters`);
console.log(`   New function: ${newFunction.length} characters`);
console.log(`   Reduction: ${Math.round((1 - newFunction.length / (functionEnd - functionStart)) * 100)}%`);
