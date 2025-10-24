#!/usr/bin/env node

/**
 * Mobile Performance Monitoring Setup Script
 * 
 * This script sets up comprehensive mobile performance monitoring including:
 * - Lighthouse CI configuration
 * - Web Vitals tracking
 * - Performance testing scripts
 * - GitHub Actions workflow
 * - Monitoring utilities
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Mobile Performance Monitoring...\n');

// Create directories if they don't exist
const directories = [
  'scripts',
  '.github/workflows',
  'utils',
  'tests'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// 1. Create Lighthouse CI configuration
const lighthouseConfig = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: [
        'http://localhost:3000',
        'http://localhost:3000/bitcoin-report',
        'http://localhost:3000/ethereum-report',
        'http://localhost:3000/whale-watch',
        'http://localhost:3000/crypto-news'
      ],
      settings: {
        preset: 'desktop',
        emulatedFormFactor: 'mobile',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};

fs.writeFileSync('lighthouserc.json', JSON.stringify(lighthouseConfig, null, 2));
console.log('✅ Created lighthouserc.json');

// 2. Create Web Vitals tracking utility
const webVitalsCode = `import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

export function reportWebVitals(metric: WebVitalMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(\`[\${metric.name}] \${metric.value.toFixed(2)}ms (\${metric.rating})\`);
  }
  
  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });
    
    const url = '/api/analytics/web-vitals';
    
    // Use sendBeacon if available (more reliable)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      fetch(url, { 
        body, 
        method: 'POST', 
        keepalive: true,
        headers: { 'Content-Type': 'application/json' }
      }).catch(console.error);
    }
  }
}

// Initialize Web Vitals tracking
export function initWebVitals() {
  getCLS(reportWebVitals);
  getFID(reportWebVitals);
  getFCP(reportWebVitals);
  getLCP(reportWebVitals);
  getTTFB(reportWebVitals);
}

// Get current Web Vitals snapshot
export async function getWebVitalsSnapshot(): Promise<Record<string, number>> {
  return new Promise((resolve) => {
    const vitals: Record<string, number> = {};
    let count = 0;
    const total = 5;
    
    const checkComplete = () => {
      count++;
      if (count === total) {
        resolve(vitals);
      }
    };
    
    getCLS((metric) => { vitals.CLS = metric.value; checkComplete(); });
    getFID((metric) => { vitals.FID = metric.value; checkComplete(); });
    getFCP((metric) => { vitals.FCP = metric.value; checkComplete(); });
    getLCP((metric) => { vitals.LCP = metric.value; checkComplete(); });
    getTTFB((metric) => { vitals.TTFB = metric.value; checkComplete(); });
  });
}
`;

if (!fs.existsSync('utils/webVitals.ts')) {
  fs.writeFileSync('utils/webVitals.ts', webVitalsCode);
  console.log('✅ Created utils/webVitals.ts');
}

// 3. Create mobile performance test script
const performanceTestScript = `const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const devices = [
  { name: 'iPhone SE', width: 375, height: 667, deviceScaleFactor: 2 },
  { name: 'iPhone 12', width: 390, height: 844, deviceScaleFactor: 3 },
  { name: 'iPhone 14 Pro Max', width: 428, height: 926, deviceScaleFactor: 3 },
  { name: 'Samsung Galaxy S21', width: 360, height: 800, deviceScaleFactor: 3 },
  { name: 'iPad Mini', width: 768, height: 1024, deviceScaleFactor: 2 }
];

const pages = [
  { name: 'Homepage', url: 'http://localhost:3000' },
  { name: 'Bitcoin Report', url: 'http://localhost:3000/bitcoin-report' },
  { name: 'Ethereum Report', url: 'http://localhost:3000/ethereum-report' },
  { name: 'Whale Watch', url: 'http://localhost:3000/whale-watch' },
  { name: 'Crypto News', url: 'http://localhost:3000/crypto-news' }
];

async function runLighthouse(url, device) {
  const chrome = await chromeLauncher.launch({ 
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });
  
  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility'],
    port: chrome.port,
    emulatedFormFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: device.width,
      height: device.height,
      deviceScaleFactor: device.deviceScaleFactor
    },
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4
    }
  };
  
  try {
    const runnerResult = await lighthouse(url, options);
    await chrome.kill();
    
    return {
      device: device.name,
      performance: Math.round(runnerResult.lhr.categories.performance.score * 100),
      accessibility: Math.round(runnerResult.lhr.categories.accessibility.score * 100),
      fcp: runnerResult.lhr.audits['first-contentful-paint'].numericValue,
      lcp: runnerResult.lhr.audits['largest-contentful-paint'].numericValue,
      cls: runnerResult.lhr.audits['cumulative-layout-shift'].numericValue,
      tbt: runnerResult.lhr.audits['total-blocking-time'].numericValue,
      tti: runnerResult.lhr.audits['interactive'].numericValue
    };
  } catch (error) {
    await chrome.kill();
    throw error;
  }
}

async function testAllDevices() {
  const allResults = [];
  
  console.log('🚀 Starting Mobile Performance Tests\\n');
  console.log('Testing', devices.length, 'devices across', pages.length, 'pages\\n');
  
  for (const page of pages) {
    console.log(\`\\n📄 Testing: \${page.name}\`);
    console.log('─'.repeat(60));
    
    const pageResults = {
      page: page.name,
      url: page.url,
      devices: []
    };
    
    for (const device of devices) {
      try {
        console.log(\`  Testing \${device.name}...\`);
        const result = await runLighthouse(page.url, device);
        pageResults.devices.push(result);
        
        console.log(\`    Performance: \${result.performance}/100\`);
        console.log(\`    Accessibility: \${result.accessibility}/100\`);
        console.log(\`    FCP: \${(result.fcp / 1000).toFixed(2)}s\`);
        console.log(\`    LCP: \${(result.lcp / 1000).toFixed(2)}s\`);
        console.log(\`    CLS: \${result.cls.toFixed(3)}\`);
        console.log(\`    TBT: \${result.tbt.toFixed(0)}ms\`);
        console.log(\`    TTI: \${(result.tti / 1000).toFixed(2)}s\\n\`);
      } catch (error) {
        console.error(\`    ❌ Error testing \${device.name}:\`, error.message);
      }
    }
    
    allResults.push(pageResults);
  }
  
  // Calculate averages
  console.log('\\n📊 Summary Statistics');
  console.log('─'.repeat(60));
  
  const totalTests = allResults.reduce((sum, page) => sum + page.devices.length, 0);
  const avgPerformance = allResults.reduce((sum, page) => 
    sum + page.devices.reduce((s, d) => s + d.performance, 0), 0) / totalTests;
  const avgAccessibility = allResults.reduce((sum, page) => 
    sum + page.devices.reduce((s, d) => s + d.accessibility, 0), 0) / totalTests;
  
  console.log(\`Total Tests: \${totalTests}\`);
  console.log(\`Average Performance Score: \${avgPerformance.toFixed(0)}/100\`);
  console.log(\`Average Accessibility Score: \${avgAccessibility.toFixed(0)}/100\`);
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const filename = \`mobile-performance-report-\${timestamp}.json\`;
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      avgPerformance: Math.round(avgPerformance),
      avgAccessibility: Math.round(avgAccessibility)
    },
    results: allResults
  };
  
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(\`\\n✅ Results saved to \${filename}\`);
  
  // Check if any tests failed thresholds
  const failedTests = allResults.flatMap(page => 
    page.devices.filter(d => d.performance < 80 || d.accessibility < 90)
  );
  
  if (failedTests.length > 0) {
    console.log(\`\\n⚠️  \${failedTests.length} test(s) failed performance/accessibility thresholds\`);
    process.exit(1);
  } else {
    console.log('\\n✅ All tests passed!');
  }
}

// Run tests
testAllDevices().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
`;

fs.writeFileSync('scripts/mobile-performance-test.js', performanceTestScript);
console.log('✅ Created scripts/mobile-performance-test.js');

// 4. Create GitHub Actions workflow
const githubWorkflow = `name: Mobile Performance Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production
      
      - name: Start server
        run: npm start &
        env:
          NODE_ENV: production
      
      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 60000
      
      - name: Install Lighthouse CI
        run: npm install -g @lhci/cli
      
      - name: Run Lighthouse CI
        run: lhci autorun
      
      - name: Upload Lighthouse results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: lighthouse-results
          path: .lighthouseci
          retention-days: 30
      
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('.lighthouseci/manifest.json'));
            // Add PR comment logic here

  mobile-performance:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Lighthouse and Chrome Launcher
        run: npm install lighthouse chrome-launcher --no-save
      
      - name: Build application
        run: npm run build
      
      - name: Start server
        run: npm start &
      
      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 60000
      
      - name: Run mobile performance tests
        run: node scripts/mobile-performance-test.js
      
      - name: Upload performance report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: mobile-performance-report
          path: mobile-performance-report-*.json
          retention-days: 30
`;

const workflowPath = '.github/workflows/mobile-performance.yml';
if (!fs.existsSync(workflowPath)) {
  fs.writeFileSync(workflowPath, githubWorkflow);
  console.log('✅ Created .github/workflows/mobile-performance.yml');
}

// 5. Create package.json scripts
console.log('\n📝 Add these scripts to your package.json:');
console.log(`
{
  "scripts": {
    "lighthouse": "lhci autorun",
    "lighthouse:mobile": "lhci autorun --config=lighthouserc.json",
    "test:mobile-performance": "node scripts/mobile-performance-test.js",
    "test:mobile": "npm run test:mobile-performance"
  }
}
`);

// 6. Create README for monitoring
const monitoringReadme = `# Mobile Performance Monitoring

## Overview

This directory contains tools and scripts for monitoring mobile performance of the Crypto Herald platform.

## Quick Start

### 1. Install Dependencies

\`\`\`bash
npm install lighthouse chrome-launcher @lhci/cli web-vitals --save-dev
\`\`\`

### 2. Run Lighthouse CI

\`\`\`bash
# Start development server
npm run dev

# Run Lighthouse CI (in another terminal)
npm run lighthouse:mobile
\`\`\`

### 3. Run Mobile Performance Tests

\`\`\`bash
# Start development server
npm run dev

# Run comprehensive mobile tests (in another terminal)
npm run test:mobile-performance
\`\`\`

## Available Scripts

- \`npm run lighthouse\` - Run Lighthouse CI with default config
- \`npm run lighthouse:mobile\` - Run mobile-optimized Lighthouse tests
- \`npm run test:mobile-performance\` - Run comprehensive device matrix tests
- \`npm run test:mobile\` - Alias for mobile performance tests

## Configuration Files

- \`lighthouserc.json\` - Lighthouse CI configuration
- \`scripts/mobile-performance-test.js\` - Device matrix testing script
- \`.github/workflows/mobile-performance.yml\` - CI/CD workflow

## Web Vitals Tracking

Web Vitals are automatically tracked in production. To view metrics:

1. Check browser console in development
2. View analytics dashboard in production
3. Check Vercel Analytics (if enabled)

## Performance Thresholds

### Lighthouse Scores
- Performance: ≥ 80/100
- Accessibility: ≥ 90/100

### Core Web Vitals
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Total Blocking Time (TBT): < 200ms
- Time to Interactive (TTI): < 3.8s

## Tested Devices

- iPhone SE (375x667)
- iPhone 12 (390x844)
- iPhone 14 Pro Max (428x926)
- Samsung Galaxy S21 (360x800)
- iPad Mini (768x1024)

## CI/CD Integration

Performance tests run automatically on:
- Every push to main branch
- Every pull request
- Daily at 2 AM UTC (scheduled)

Results are uploaded as artifacts and available for 30 days.

## Troubleshooting

### Lighthouse fails to run
- Ensure Chrome/Chromium is installed
- Check that port 3000 is not in use
- Verify server is running before tests

### Tests timeout
- Increase timeout in wait-on command
- Check network connectivity
- Verify server starts successfully

### Low performance scores
- Check for console errors
- Review network requests
- Analyze bundle size
- Check for render-blocking resources

## Resources

- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
`;

fs.writeFileSync('scripts/MONITORING-README.md', monitoringReadme);
console.log('✅ Created scripts/MONITORING-README.md');

// 7. Summary
console.log('\n✅ Mobile Performance Monitoring Setup Complete!\n');
console.log('📋 Next Steps:');
console.log('1. Install dependencies: npm install lighthouse chrome-launcher @lhci/cli web-vitals --save-dev');
console.log('2. Add scripts to package.json (see output above)');
console.log('3. Run tests: npm run test:mobile-performance');
console.log('4. Review documentation: scripts/MONITORING-README.md');
console.log('\n📚 Documentation created:');
console.log('   - MOBILE-TESTING-GUIDE.md (comprehensive guide)');
console.log('   - MOBILE-TESTING-CHECKLIST.md (quick reference)');
console.log('   - scripts/MONITORING-README.md (monitoring setup)');
console.log('\n🎉 Happy testing!');
