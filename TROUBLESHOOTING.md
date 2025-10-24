# 🔧 Troubleshooting Guide

## 🚨 Common Issues & Solutions

### **1. Trade Generation Engine Issues**

#### Problem: Password modal not appearing
- **Solution**: Component now uses inline expansion (no modals)
- **Check**: Ensure you're clicking "UNLOCK TRADE ENGINE" button

#### Problem: Password not working
- **Current Password**: `123qwe`
- **Case Sensitive**: Must be exact match
- **Reset**: Refresh page to reset authentication state

#### Problem: AI generation failing
- **Check**: OpenAI API key in environment variables
- **Fallback**: System shows demo data if API fails
- **Model**: Uses o1-preview (newest reasoning model)

### **2. API Data Issues**

#### Problem: "DEMO DATA" showing instead of live data
- **Cause**: API rate limits or network issues
- **Solution**: Wait 30 seconds and refresh
- **APIs Used**: Coinbase Pro, CoinGecko, Binance

#### Problem: Market ticker not updating
- **Check**: Network connection
- **Refresh**: Page refresh reloads ticker data
- **Animation**: Should scroll continuously (45s loop)

#### Problem: News articles not loading
- **APIs**: NewsAPI + 5 crypto news sites
- **Fallback**: Demo articles if scraping fails
- **Rate Limits**: May hit limits with frequent requests

### **3. Mobile Display Issues**

#### Problem: Components overlapping on mobile
- **Fixed**: All components now mobile-optimized with Bitcoin Sovereign design
- **Borders**: Thin orange borders (1-2px) responsive across breakpoints
- **Padding**: Adaptive (p-3 sm:p-6) with mobile-first approach
- **Design System**: Follow `.kiro/steering/bitcoin-sovereign-design.md`

#### Problem: Text too small on mobile
- **Solution**: Responsive typography implemented
- **Classes**: text-xs sm:text-sm, text-sm sm:text-base
- **Fonts**: Inter (UI) + Roboto Mono (data)
- **Minimum**: 16px base font size to prevent iOS zoom

#### Problem: Market ticker not visible
- **Check**: Screen rotation (portrait vs landscape)
- **CSS**: Global animation with proper z-index
- **Colors**: Bitcoin Orange (#F7931A) on black background for high contrast

#### Problem: Colors not matching design system
- **Solution**: Use only Black (#000000), Orange (#F7931A), White (#FFFFFF)
- **Classes**: `.bitcoin-block`, `.text-bitcoin-orange`, `.bg-bitcoin-black`
- **Reference**: See `BITCOIN-SOVEREIGN-DOCUMENTATION-UPDATE.md`

### **4. Branch/Version Issues**

#### Problem: Lost changes after switching branches
- **Prevention**: Always commit before switching
- **Recovery**: `git reflog` to find lost commits
- **Safe Branch**: `stable-v1` has working version

#### Problem: Merge conflicts
- **Avoid**: Work on feature branches only
- **Current**: `visual-redesign` for experiments
- **Reset**: `git checkout stable-v1` for clean start

### **5. Deployment Issues**

#### Problem: Vercel deployment failing
- **Check**: Environment variables set correctly
- **Build**: `npm run build` locally first
- **Logs**: Check Vercel dashboard for errors

#### Problem: Environment variables missing
- **Required**: OPENAI_API_KEY
- **Optional**: NEWS_API_KEY, ALPHA_VANTAGE_KEY
- **Location**: Vercel dashboard → Settings → Environment Variables

### **6. Performance Issues**

#### Problem: Slow page loading
- **Check**: Network connection
- **Optimization**: Images are optimized
- **APIs**: May timeout (30s limit implemented)

#### Problem: High memory usage
- **Cause**: Multiple API calls
- **Solution**: Automatic cleanup implemented
- **Refresh**: Page refresh clears memory

### **7. Gemini AI Analysis Issues**

#### Problem: "GEMINI_API_KEY is missing" error
- **Cause**: Environment variable not set
- **Solution**: Add `GEMINI_API_KEY` to `.env.local`
- **Get Key**: https://aistudio.google.com/app/apikey
- **Format**: Must start with `AIzaSy` and be 39 characters long
- **Example**: `GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`

#### Problem: "Invalid GEMINI_API_KEY format" error
- **Cause**: API key doesn't match expected format
- **Check**: Key starts with `AIzaSy`
- **Check**: Key is exactly 39 characters
- **Check**: No extra spaces or quotes
- **Verify**: Key is active in Google AI Studio

#### Problem: Gemini analysis failing with 401 error
- **Cause**: Invalid or expired API key
- **Solution**: Generate new API key in Google AI Studio
- **Check**: API key is correctly copied (no truncation)
- **Verify**: No extra characters or whitespace

#### Problem: Gemini analysis failing with 429 error (Rate Limit)
- **Cause**: Too many requests in short time
- **Free Tier**: 15 requests per minute
- **Solution**: Wait 60 seconds before retrying
- **Upgrade**: Consider pay-as-you-go for 360 RPM
- **Config**: Adjust `GEMINI_MAX_REQUESTS_PER_MINUTE` in `.env.local`

#### Problem: Gemini analysis timing out
- **Default**: 15 second timeout
- **Solution**: Increase `GEMINI_TIMEOUT_MS` in `.env.local`
- **Example**: `GEMINI_TIMEOUT_MS=30000` (30 seconds)
- **Note**: Longer timeouts may indicate API issues

#### Problem: Analysis returns "unknown" or generic results
- **Cause**: Insufficient transaction data
- **Check**: All required fields are provided
- **Improve**: Add more context in transaction description
- **Model**: Try switching to Pro model for better analysis

#### Problem: Model selection not working
- **Check**: `GEMINI_MODEL` in `.env.local`
- **Valid Options**: `gemini-2.5-flash` or `gemini-2.5-pro`
- **Default**: Uses Flash if not specified
- **Threshold**: Pro used for transactions >= 100 BTC
- **Override**: Set `GEMINI_PRO_THRESHOLD_BTC` to change threshold

#### Problem: Thinking mode not showing
- **Check**: `GEMINI_ENABLE_THINKING=true` in `.env.local`
- **Default**: Enabled by default
- **UI**: Look for "AI Reasoning Process" collapsible section
- **Note**: Only available with Gemini 2.5 models

#### Problem: Deep Dive not available
- **Requirement**: Transaction must be >= 100 BTC
- **Config**: Check `GEMINI_PRO_THRESHOLD_BTC` setting
- **Lower Threshold**: Set to 50 for 50+ BTC transactions
- **Model**: Deep Dive requires Gemini 2.5 Pro

#### Problem: JSON parsing errors in analysis
- **Cause**: Gemini returned invalid JSON
- **Check**: Console logs for raw response
- **Retry**: Try analysis again (may be transient)
- **Report**: If persistent, check Gemini API status

#### Problem: High API costs
- **Monitor**: Check Google Cloud Console for usage
- **Optimize**: Use Flash model for smaller transactions
- **Reduce**: Lower `GEMINI_FLASH_MAX_OUTPUT_TOKENS` to 4096
- **Cache**: Implement caching for repeated analyses
- **Limit**: Set daily/monthly usage quotas

#### Problem: Slow analysis performance
- **Flash**: Should complete in ~3 seconds
- **Pro**: Should complete in ~7 seconds
- **Deep Dive**: Should complete in ~10-15 seconds
- **Check**: Network latency to Google APIs
- **Optimize**: Reduce `maxOutputTokens` for faster responses

#### Problem: Analysis quality is poor
- **Model**: Try switching from Flash to Pro
- **Context**: Provide more transaction details
- **Prompt**: Check if prompt includes current market data
- **Temperature**: Adjust in code (0.7-0.9 range)
- **Tokens**: Increase `maxOutputTokens` for longer analysis

#### Problem: Blockchain data not loading (Deep Dive)
- **Check**: Blockchain.com API key in `.env.local`
- **Fallback**: Analysis continues without blockchain data
- **Note**: Deep Dive shows data source limitations
- **Retry**: Try again after a few minutes

#### Problem: Exchange detection not working
- **Limited**: Only detects known exchange patterns
- **Database**: Uses simplified pattern matching
- **Improve**: Will be enhanced with comprehensive database
- **Manual**: Check addresses manually on blockchain explorer

### **Gemini API Debugging Commands**

```bash
# Test API key validity
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY"

# Check rate limit status (look for X-RateLimit headers)
curl -I "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"

# Validate configuration
npm run validate-gemini-config  # If script exists
```

### **Gemini Configuration Validation**

```typescript
// In browser console or Node.js
import { validateGeminiConfigAtStartup } from './utils/geminiConfig';

const result = validateGeminiConfigAtStartup();
console.log('Valid:', result.valid);
console.log('Errors:', result.errors);
console.log('Warnings:', result.warnings);
```

## 🛡️ Emergency Recovery

### **Complete Reset Procedure**
```bash
# 1. Return to stable version
git checkout stable-v1

# 2. Verify everything works
npm run dev

# 3. Create fresh experimental branch
git checkout -b visual-redesign-v2

# 4. Continue development
```

### **Component-Level Reset**
If specific component broken:
```bash
# Restore single component from stable
git checkout stable-v1 -- components/ComponentName.tsx
```

### **Database/State Reset**
- **No database**: All data is API-fetched
- **State Reset**: Page refresh clears all state
- **Cache**: Browser cache cleared with hard refresh (Ctrl+Shift+R)

## 🔍 Debugging Commands

### **Check Git Status**
```bash
git status                    # Current changes
git branch                    # Available branches
git log --oneline -5          # Recent commits
```

### **Check Dependencies**
```bash
npm list                      # Installed packages
npm outdated                  # Package updates available
npm audit                     # Security vulnerabilities
```

### **Test APIs**
```bash
# Test if APIs are responding
curl "https://api.coinbase.com/v2/exchange-rates?currency=BTC"
```

## 📞 Quick Reference

### **Current Passwords**
- Trade Generation Engine: `123qwe`

### **Key Branches**
- `stable-v1`: Safe working version
- `visual-redesign`: Current experimental branch
- `master`: Production deployment

### **Important URLs**
- Development: `http://localhost:3000`
- Production: Vercel deployment URL

### **Critical Files**
- `components/TradeGenerationEngine.tsx` - AI trading features
- `pages/api/trade-generation.ts` - AI reasoning endpoint
- `pages/api/whale-watch/analyze-gemini.ts` - Gemini AI analysis endpoint
- `utils/geminiConfig.ts` - Gemini configuration and validation
- `pages/index.tsx` - Main layout
- `styles/globals.css` - Global styles + Bitcoin Sovereign design system
- `.kiro/steering/bitcoin-sovereign-design.md` - Complete design guidelines
- `BITCOIN-SOVEREIGN-DOCUMENTATION-UPDATE.md` - Documentation update summary
- `.env.example` - Environment variable template with Gemini config

## 🎯 Prevention Tips

1. **Always commit before experimenting**
2. **Use feature branches for changes**
3. **Test on multiple devices** (320px - 1920px+)
4. **Check console for errors**
5. **Monitor API rate limits** (especially Gemini: 15 RPM free tier)
6. **Keep stable branch untouched**
7. **Follow Bitcoin Sovereign design system** - Black, Orange, White only
8. **Ensure WCAG 2.1 AA compliance** - Test color contrast and focus states
9. **Use mobile-first approach** - Start with mobile, enhance for desktop
10. **Reference design documentation** - Check `.kiro/steering/bitcoin-sovereign-design.md`
11. **Validate Gemini config on startup** - Use `validateGeminiConfigAtStartup()`
12. **Monitor Gemini costs** - Track token usage in Google Cloud Console
13. **Use Flash model by default** - Reserve Pro for large transactions (>= 100 BTC)
14. **Cache analysis results** - Avoid redundant API calls for same transaction

## 📚 Gemini AI Resources

### **Documentation**
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Gemini Pricing](https://ai.google.dev/pricing)
- [Rate Limits & Quotas](https://ai.google.dev/gemini-api/docs/quota)
- [Google AI Studio](https://aistudio.google.com/app/apikey)

### **Internal Documentation**
- `utils/README-gemini-config.md` - Configuration guide
- `.kiro/specs/gemini-model-upgrade/design.md` - Technical design
- `.kiro/specs/gemini-model-upgrade/requirements.md` - Requirements
- `.env.example` - Environment variable reference

### **Support Channels**
- Check console logs for detailed error messages
- Review `utils/geminiConfig.ts` for validation logic
- Test API key with curl commands above
- Monitor Google Cloud Console for usage/errors

---

*Last Updated: January 24, 2025*  
*All systems operational* ✅  
*Gemini 2.5 Integration: Ready for Implementation* 🚀
