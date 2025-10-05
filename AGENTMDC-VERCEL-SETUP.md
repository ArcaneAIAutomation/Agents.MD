# AgentMDC Vercel Deployment Setup

## Project Information
- **Project Name**: agentmdc
- **Production URL**: https://agentmdc-4vf3ox2yc-arcane-ai-automations-projects.vercel.app
- **GitHub Repository**: https://github.com/ArcaneAIAutomation/Agents.MD
- **Active Branch**: AgentMDC

## Environment Variables Configuration

All environment variables from `.env.local` need to be added to Vercel for the deployment to work properly.

### Required API Keys

#### AI & Analysis
- `OPENAI_API_KEY` - GPT-4o for AI-powered market analysis
- `OPENAI_MODEL` - Model version (gpt-4o-2024-08-06)
- `CAESAR_API_KEY` - Advanced market analysis and trading intelligence

#### Market Data APIs
- `KRAKEN_API_KEY` - Exchange data source
- `KRAKEN_PRIVATE_KEY` - Kraken private key for authenticated requests
- `COINMARKETCAP_API_KEY` - Premium market data
- `COINGECKO_API_KEY` - Alternative market data source
- `ALPHA_VANTAGE_API_KEY` - Financial data and news sentiment

#### News & Sentiment APIs
- `NEWS_API_KEY` - Global news aggregation
- `CRYPTO_NEWS_API_KEY` - Specialized crypto news
- `CRYPTOCOMPARE_API_KEY` - Alternative crypto news source

#### Search & Web Data APIs
- `BRAVE_SEARCH_API_KEY` - Web search for market sentiment
- `SCRAPINGBEE_API_KEY` - Web scraping for additional data sources

#### Application Configuration
- `NEXT_PUBLIC_API_URL` - API base URL (set to production URL)
- `USE_REAL_AI_ANALYSIS` - Enable real AI analysis (true)
- `API_CACHE_DURATION` - Cache duration in ms (300000)
- `MAX_API_REQUESTS_PER_MINUTE` - Rate limiting (60)

#### Feature Flags
- `ENABLE_LIVE_DATA` - Enable real-time data fetching (true)
- `ENABLE_AI_NEWS_ANALYSIS` - Enable AI-powered news analysis (true)
- `ENABLE_ADVANCED_TA` - Enable advanced technical analysis (true)
- `ENABLE_REGULATORY_MONITORING` - Enable regulatory monitoring (true)

## Deployment Configuration

### Automatic Deployments
- **AgentMDC Branch**: Auto-deploys on every push
- **Main Branch**: Protected, no automatic deployments
- **Pull Requests**: Preview deployments for testing

### Build Settings
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

## Manual Deployment Commands

```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel

# Check deployment status
vercel ls

# View logs
vercel logs
```

## Post-Deployment Checklist

- [ ] All environment variables added to Vercel
- [ ] Production URL is accessible
- [ ] API endpoints are responding correctly
- [ ] Mobile optimization is working
- [ ] All cryptocurrency data sources are functioning
- [ ] AI analysis is generating properly
- [ ] News aggregation is working
- [ ] Error handling and fallbacks are active

## Monitoring & Maintenance

- **Dashboard**: https://vercel.com/arcane-ai-automations-projects/agentmdc
- **Analytics**: Monitor performance and usage
- **Logs**: Check for API errors and performance issues
- **Alerts**: Set up notifications for deployment failures

## Troubleshooting

### Common Issues
1. **Missing Environment Variables**: Check Vercel dashboard settings
2. **API Rate Limits**: Monitor API usage in logs
3. **Build Failures**: Check build logs in Vercel dashboard
4. **Runtime Errors**: Review function logs for API issues

### Support Resources
- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Project Repository: https://github.com/ArcaneAIAutomation/Agents.MD
