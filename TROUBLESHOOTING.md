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
- `pages/index.tsx` - Main layout
- `styles/globals.css` - Global styles + Bitcoin Sovereign design system
- `.kiro/steering/bitcoin-sovereign-design.md` - Complete design guidelines
- `BITCOIN-SOVEREIGN-DOCUMENTATION-UPDATE.md` - Documentation update summary

## 🎯 Prevention Tips

1. **Always commit before experimenting**
2. **Use feature branches for changes**
3. **Test on multiple devices** (320px - 1920px+)
4. **Check console for errors**
5. **Monitor API rate limits**
6. **Keep stable branch untouched**
7. **Follow Bitcoin Sovereign design system** - Black, Orange, White only
8. **Ensure WCAG 2.1 AA compliance** - Test color contrast and focus states
9. **Use mobile-first approach** - Start with mobile, enhance for desktop
10. **Reference design documentation** - Check `.kiro/steering/bitcoin-sovereign-design.md`

---

*Last Updated: August 21, 2025*  
*All systems operational* ✅
