# Project Structure & Organization

## Directory Layout

```
Agents.MD/
├── components/              # React components (PascalCase naming)
│   ├── BTCTradingChart.tsx     # Bitcoin-specific trading charts
│   ├── ETHTradingChart.tsx     # Ethereum-specific trading charts
│   ├── TradingChart.tsx        # Base chart component
│   ├── CryptoHerald.tsx        # News aggregation component
│   ├── TradeGenerationEngine.tsx # AI trading signals
│   └── Layout.tsx              # Page layout wrapper
├── pages/                   # Next.js pages and API routes
│   ├── api/                    # Backend API endpoints
│   │   ├── btc-analysis.ts     # Bitcoin market analysis
│   │   ├── crypto-herald.ts    # News aggregation
│   │   └── historical-prices.ts # Price history data
│   ├── _app.tsx               # App configuration
│   ├── _document.tsx          # HTML document structure
│   └── index.tsx              # Main dashboard page
├── hooks/                   # Custom React hooks (camelCase)
│   ├── useMarketData.ts       # Market data fetching
│   ├── useApiData.ts          # Generic API data hook
│   └── useNewspaperAudio.ts   # Audio features
├── styles/                  # CSS and styling
│   └── globals.css            # Global styles with Tailwind
├── public/                  # Static assets
├── backups/                 # Version backups (organized by version)
└── .kiro/                   # Kiro configuration and steering
```

## Naming Conventions

### Components
- **PascalCase** for component files: `BTCTradingChart.tsx`
- **Descriptive prefixes**: BTC/ETH for crypto-specific components
- **Functional naming**: Component name matches primary function

### API Routes
- **kebab-case** for endpoints: `btc-analysis.ts`
- **RESTful patterns**: Use HTTP methods appropriately
- **Descriptive paths**: `/api/btc-analysis`, `/api/crypto-herald`

### Hooks
- **camelCase** with `use` prefix: `useMarketData.ts`
- **Single responsibility**: Each hook handles one data concern
- **TypeScript interfaces**: Define return types clearly

## Code Organization Patterns

### Component Structure
```typescript
// 1. Imports (React, external libs, internal components)
// 2. TypeScript interfaces
// 3. Component function with proper typing
// 4. State management (useState, useEffect)
// 5. Event handlers and utility functions
// 6. Render logic with JSX
// 7. Default export
```

### API Route Structure
```typescript
// 1. Import statements
// 2. Type definitions
// 3. Helper functions
// 4. Main handler function with proper HTTP method handling
// 5. Error handling and response formatting
```

## File Organization Rules

### Backups
- Version-specific folders: `backups/version-1.3/`
- Complete component snapshots before major changes
- Preserve working states for rollback capability

### Documentation
- Markdown files in root for project-level docs
- Component-specific docs inline with JSDoc comments
- API documentation in route files

### Environment Files
- `.env.local` for development secrets (gitignored)
- `.env.example` as template (committed)
- Vercel environment variables for production

## Import Patterns
- **Relative imports** for local components: `../components/TradingChart`
- **Absolute imports** using `@/` alias when configured
- **External libraries** imported before internal modules
- **Type-only imports** when importing just TypeScript types