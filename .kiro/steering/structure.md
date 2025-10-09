# Project Structure & Organization

## Directory Layout

```
Agents.MD/
├── components/              # React components (PascalCase naming)
│   ├── BTCTradingChart.tsx     # Bitcoin-specific trading charts
│   ├── ETHTradingChart.tsx     # Ethereum-specific trading charts
│   ├── TradingChart.tsx        # Base chart component
│   ├── CryptoHerald.tsx        # News aggregation component
│   ├── TradeGenerationEngine.tsx # AI trading signals (mobile-optimized)
│   ├── MobileErrorStates.tsx   # Mobile error handling components
│   ├── MobileLoadingComponents.tsx # Mobile loading states
│   ├── MobileFinalIntegration.tsx # Mobile integration testing
│   ├── WhaleWatch/             # Whale Watch feature components
│   │   └── WhaleWatchDashboard.tsx # Main whale tracking dashboard
│   └── Layout.tsx              # Page layout wrapper
├── pages/                   # Next.js pages and API routes
│   ├── api/                    # Backend API endpoints
│   │   ├── btc-analysis.ts     # Bitcoin market analysis
│   │   ├── eth-analysis.ts     # Ethereum market analysis
│   │   ├── crypto-herald.ts    # News aggregation
│   │   ├── crypto-herald-15-stories.ts # Optimized news endpoint
│   │   ├── live-trade-generation.ts # Real-time trade signals
│   │   ├── reliable-trade-generation.ts # Fallback trade signals
│   │   ├── diagnostic.ts       # API health monitoring
│   │   └── whale-watch/        # Whale Watch API endpoints
│   │       ├── detect.ts       # Whale transaction detection
│   │       ├── analyze.ts      # Start Caesar AI analysis
│   │       └── analysis/[jobId].ts # Poll analysis results
│   ├── _app.tsx               # App configuration
│   ├── _document.tsx          # HTML document structure
│   └── index.tsx              # Main dashboard page
├── hooks/                   # Custom React hooks (camelCase)
│   ├── useMarketData.ts       # Market data fetching
│   ├── useApiData.ts          # Generic API data hook
│   ├── useMobileViewport.ts   # Mobile viewport detection
│   ├── useContrastValidation.ts # Accessibility validation
│   └── useNewspaperAudio.ts   # Audio features
├── styles/                  # CSS and styling
│   └── globals.css            # Global styles with Tailwind + mobile animations
├── public/                  # Static assets
│   └── icons/                  # Icon assets
│       ├── caesar-api-placeholder.svg # Caesar API icon
│       └── README.md           # Icon replacement instructions
├── utils/                   # Utility functions
│   ├── accessibilityTesting.ts # Mobile accessibility testing
│   ├── contrastValidation.ts   # Color contrast validation
│   └── __tests__/              # Utility tests
├── backups/                 # Version backups (organized by version)
│   ├── version-1.3/           # Previous stable version
│   └── version-1.4/           # Pre-mobile optimization
├── .kiro/                   # Kiro configuration and steering
│   ├── specs/                 # Feature specifications
│   │   └── mobile-optimization/ # Mobile optimization spec
│   └── steering/              # Agent steering files
└── mobile-validation-report.md # Mobile performance report
```

## Naming Conventions

### Components
- **PascalCase** for component files: `BTCTradingChart.tsx`
- **Descriptive prefixes**: BTC/ETH for crypto-specific components, Mobile for mobile-specific
- **Functional naming**: Component name matches primary function
- **Mobile components**: Prefix with `Mobile` for mobile-specific implementations
- **Feature folders**: Group related components in folders (e.g., `WhaleWatch/`)

### API Routes
- **kebab-case** for endpoints: `btc-analysis.ts`, `crypto-herald-15-stories.ts`
- **RESTful patterns**: Use HTTP methods appropriately
- **Descriptive paths**: `/api/btc-analysis`, `/api/crypto-herald`
- **Versioned endpoints**: Include version or variant in filename for specialized endpoints

### Hooks
- **camelCase** with `use` prefix: `useMarketData.ts`, `useMobileViewport.ts`
- **Single responsibility**: Each hook handles one data concern
- **TypeScript interfaces**: Define return types clearly
- **Mobile hooks**: Include mobile-specific functionality for responsive behavior

### CSS Classes
- **Mobile-first utilities**: `mobile-text-primary`, `mobile-bg-secondary`
- **Animation classes**: `animate-fade-in`, `animate-slide-up`
- **Touch targets**: `mobile-touch-target` for accessibility compliance

## Code Organization Patterns

### Component Structure
```typescript
// 1. Imports (React, external libs, internal components, mobile hooks)
// 2. TypeScript interfaces with mobile-specific props
// 3. Component function with proper typing
// 4. Mobile viewport detection and device capabilities
// 5. State management (useState, useEffect) with mobile considerations
// 6. Event handlers and utility functions (touch-friendly)
// 7. Mobile-first render logic with progressive enhancement
// 8. Default export with proper mobile error boundaries
```

### Mobile Component Requirements
- **Touch targets**: Minimum 48px for accessibility
- **Responsive design**: Mobile-first with progressive enhancement
- **Performance**: Optimized animations and lazy loading
- **Accessibility**: WCAG 2.1 AA compliance with proper contrast ratios
- **Error handling**: Graceful degradation with mobile-specific error states

### API Route Structure
```typescript
// 1. Import statements with timeout and error handling utilities
// 2. Type definitions for request/response with mobile considerations
// 3. Helper functions with fallback mechanisms
// 4. Main handler function with proper HTTP method handling
// 5. Multiple data source integration with failover logic
// 6. Comprehensive error handling and response formatting
// 7. Performance monitoring and rate limit handling
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