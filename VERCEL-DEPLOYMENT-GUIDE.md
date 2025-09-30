# 🚀 Vercel Deployment Guide - Agents.MD V2.0

## 📋 Pre-Deployment Checklist

### ✅ Repository Setup
- [x] V2.0 code pushed to GitHub main branch
- [x] Vercel configuration optimized (`vercel.json`)
- [x] Environment variables template created (`.env.example`)
- [x] Package.json updated to version 2.0.0

### 🔑 Required Environment Variables
Add these in your Vercel dashboard under **Settings > Environment Variables**:

```bash
# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-2024-08-06

# News APIs
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
NEWSAPI_KEY=your_newsapi_key_here

# Market Data APIs
COINMARKETCAP_API_KEY=your_coinmarketcap_key_here
BINANCE_API_KEY=your_binance_api_key_here
BINANCE_SECRET_KEY=your_binance_secret_key_here

# Application Settings
ENABLE_LIVE_DATA=true
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret_here
```

## 🚀 Automated Deployment Steps

### Option 1: GitHub Integration (Recommended)
1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import from GitHub: `ArcaneAIAutomation/Agents.MD`
   - Select `main` branch

2. **Configure Project**
   - Project Name: `agents-md-v2`
   - Framework: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto-detected)

3. **Add Environment Variables**
   - Go to Settings > Environment Variables
   - Add all required variables from the list above
   - Set for: Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy

### Option 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel --prod
```

## 🔧 Vercel Configuration Features

### Performance Optimizations
- **Memory**: 1024MB for API functions
- **Timeout**: 30 seconds for API calls
- **Caching**: 60s cache with 300s stale-while-revalidate
- **Regions**: US East (iad1) for optimal performance

### Security Headers
- Content Security Policy
- XSS Protection
- Frame Options
- Referrer Policy
- Permissions Policy

### API Route Optimization
- Automatic caching for market data
- Memory allocation for AI processing
- Timeout handling for external APIs

## 🌐 Post-Deployment Verification

### 1. Check Core Functionality
- [ ] Homepage loads with newspaper theme
- [ ] Bitcoin analysis displays live data
- [ ] Ethereum analysis shows real-time information
- [ ] News feed updates with live articles
- [ ] AI predictions generate successfully

### 2. Verify API Endpoints
- [ ] `/api/btc-analysis` - Bitcoin market analysis
- [ ] `/api/eth-analysis` - Ethereum market analysis
- [ ] `/api/crypto-herald` - News feed
- [ ] `/api/trade-generation` - AI trade signals
- [ ] `/api/historical-prices` - Price data

### 3. Performance Checks
- [ ] Page load time < 3 seconds
- [ ] API response time < 2 seconds
- [ ] No console errors
- [ ] Mobile responsiveness

## 🔄 Automatic Deployments

### Branch Strategy
- **main**: Production deployments (V2.0)
- **development**: Preview deployments
- **V1.0-Working.Old**: Backup/rollback version

### Deployment Triggers
- Push to `main` → Production deployment
- Push to `development` → Preview deployment
- Pull requests → Preview deployments

## 🛠️ Troubleshooting

### Common Issues
1. **Build Failures**
   - Check Node.js version (>=18.0.0)
   - Verify all dependencies in package.json
   - Check TypeScript compilation

2. **API Errors**
   - Verify environment variables are set
   - Check API key validity
   - Monitor function timeout limits

3. **Performance Issues**
   - Review API caching settings
   - Check memory allocation
   - Monitor function execution time

### Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [GitHub Repository](https://github.com/ArcaneAIAutomation/Agents.MD)

## 📊 Monitoring & Analytics

### Built-in Monitoring
- Vercel Analytics (automatic)
- Function logs and metrics
- Performance insights
- Error tracking

### Custom Monitoring
- API response times
- Market data accuracy
- AI prediction success rates
- User engagement metrics

---

**🎉 Ready for Production!**
Your Agents.MD V2.0 is now configured for seamless Vercel deployment with automated CI/CD from GitHub.