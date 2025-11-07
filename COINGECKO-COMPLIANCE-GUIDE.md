# CoinGecko API Compliance Guide

**Date**: January 27, 2025  
**Status**: ✅ **IMPLEMENTING FULL COMPLIANCE**  
**Reference**: https://brand.coingecko.com/resources/attribution-guide

---

## CoinGecko Attribution Requirements

### ✅ MUST DO:

1. **Text Attribution** (Choose one):
   - "Data provided by CoinGecko"
   - "Price data by CoinGecko"
   - "Source: CoinGecko"
   - "Powered by CoinGecko API"

2. **Logo Attribution**:
   - Include CoinGecko logo with hyperlink
   - Link to: https://www.coingecko.com or https://www.coingecko.com/en/api
   - Use official SVG/PNG from Brand Kit
   - Add UTM parameters: `?utm_source=bitcoin-sovereign-tech&utm_medium=referral`

3. **Placement**:
   - Visible location
   - Close to where data is displayed
   - Above or below the data set

4. **Font Recommendation**:
   - Use Inter (sans-serif) for attribution text
   - Keep it professional and simple

### ❌ DON'T DO:

1. **Don't modify logos** - Use them as-is
2. **Don't remove attribution** - Always visible
3. **Don't misattribute** - Only for CoinGecko data
4. **Don't claim partnership** without authorization:
   - ❌ "We partner with CoinGecko"
   - ❌ "Our app is in collaboration with CoinGecko"
   - ❌ "CoinGecko is our official data partner"
   - ❌ "CoinGecko recommends our app"
   - ❌ "Endorsed by CoinGecko"

5. **Don't overload** - Keep attributions minimal yet clear

---

## Implementation Plan

### Components Created:

1. **CoinGeckoAttribution.tsx** - Main attribution component
   - `variant="full"` - Logo + text in bordered box
   - `variant="compact"` - Logo + text inline
   - `variant="text-only"` - Text link only

2. **CoinGeckoFooterAttribution** - For page footers

3. **CoinGeckoInlineAttribution** - For inline data displays

### Where to Add Attribution:

#### 1. Market Data Displays ✅
- **Components**:
  - `BTCTradingChart.tsx`
  - `ETHTradingChart.tsx`
  - `TradingChart.tsx`
  - `BTCMarketAnalysis.tsx`
  - `ETHMarketAnalysis.tsx`
  - `CryptoHerald.tsx` (market ticker)

- **Placement**: Below price displays, near market data

#### 2. UCIE Market Data Tab ✅
- **Component**: `MarketDataPanel.tsx`
- **Placement**: Footer of market data panel

#### 3. UCIE Search Results ✅
- **Component**: `UCIESearchBar.tsx`
- **Placement**: Below search results

#### 4. Price Tickers ✅
- **Component**: `Header.tsx` (BTC/ETH prices)
- **Placement**: Near price display

#### 5. Dashboard Overview ✅
- **Page**: `pages/index.tsx`
- **Placement**: Footer section

#### 6. API Responses (Optional) ✅
- **Endpoints**: All `/api/ucie/market-data/*`
- **Field**: Add `attribution` field to responses

---

## Attribution Examples

### Full Attribution (Bordered Box):
```tsx
import CoinGeckoAttribution from '../components/CoinGeckoAttribution';

<CoinGeckoAttribution 
  variant="full" 
  dataType="market"
  className="mt-4"
/>
```

### Compact Attribution (Inline):
```tsx
<CoinGeckoAttribution 
  variant="compact" 
  dataType="price"
/>
```

### Text-Only Attribution:
```tsx
<CoinGeckoAttribution 
  variant="text-only"
/>
```

### Footer Attribution:
```tsx
import { CoinGeckoFooterAttribution } from '../components/CoinGeckoAttribution';

<CoinGeckoFooterAttribution className="border-t border-bitcoin-orange-20" />
```

### Inline Attribution:
```tsx
import { CoinGeckoInlineAttribution } from '../components/CoinGeckoAttribution';

<div>
  Price: $95,000 <CoinGeckoInlineAttribution />
</div>
```

---

## Compliance Checklist

### Phase 1: Core Components ✅
- [ ] Create CoinGeckoAttribution component
- [ ] Add to BTCTradingChart
- [ ] Add to ETHTradingChart
- [ ] Add to TradingChart
- [ ] Add to BTCMarketAnalysis
- [ ] Add to ETHMarketAnalysis
- [ ] Add to CryptoHerald (market ticker)

### Phase 2: UCIE Components ✅
- [ ] Add to MarketDataPanel
- [ ] Add to UCIESearchBar
- [ ] Add to UCIEAnalysisHub
- [ ] Add to token search results

### Phase 3: Layout Components ✅
- [ ] Add to Header (price ticker)
- [ ] Add to Footer
- [ ] Add to Dashboard (index.tsx)

### Phase 4: API Responses ✅
- [ ] Add attribution field to market-data API
- [ ] Add attribution field to search API
- [ ] Add attribution field to validate API

### Phase 5: Documentation ✅
- [ ] Update README with attribution info
- [ ] Add compliance guide
- [ ] Document all attribution placements

---

## UTM Parameters

All CoinGecko links must include UTM parameters:

```
https://www.coingecko.com?utm_source=bitcoin-sovereign-tech&utm_medium=referral
```

**Benefits**:
- Tracks referral traffic
- Shows CoinGecko our usage
- Maintains good relationship
- May qualify for benefits

---

## Logo Usage

### Official Logo:
- Download from: https://brand.coingecko.com/resources/brand-kit
- Use SVG format for scalability
- Maintain aspect ratio
- Don't modify colors or design

### Our Implementation:
- Embedded SVG in component
- Green gecko (#8DC63F)
- White background
- Proper sizing (h-4 to h-6)

---

## Testing Compliance

### Visual Check:
1. Open each page with CoinGecko data
2. Verify attribution is visible
3. Check logo displays correctly
4. Test hyperlink works
5. Verify UTM parameters in URL

### Automated Check:
```bash
# Search for CoinGecko data without attribution
grep -r "coinGeckoClient" --include="*.tsx" | grep -v "CoinGeckoAttribution"
```

---

## Maintenance

### Regular Reviews:
- **Monthly**: Check all attributions are visible
- **Quarterly**: Review CoinGecko brand guidelines for updates
- **Annually**: Verify compliance with terms of service

### Updates:
- Monitor CoinGecko brand guidelines
- Update logo if they release new version
- Adjust attribution text if requirements change

---

## Contact

### If Unsure:
- File support request with CoinGecko
- Email: support@coingecko.com
- Reference: Attribution Guide

### For Marketing Use:
- Must get explicit authorization
- Contact CoinGecko before using logo in marketing
- Follow partnership guidelines

---

## Legal Compliance

### Terms of Service:
- Attribution is REQUIRED for free API usage
- Failure to attribute may result in API access revocation
- Proper attribution maintains good standing

### Best Practices:
- Always attribute
- Never claim partnership
- Use official logos only
- Keep attribution visible
- Update if guidelines change

---

**Status**: ✅ **IMPLEMENTING**  
**Priority**: HIGH  
**Deadline**: Immediate (required for API usage)

---

*Proper attribution ensures continued free access to CoinGecko's excellent API!* 🦎✅
