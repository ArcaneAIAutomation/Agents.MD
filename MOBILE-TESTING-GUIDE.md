# Mobile Testing Guide

## Overview

This guide provides comprehensive procedures for testing the Crypto Herald platform on mobile devices, ensuring optimal performance, accessibility, and user experience across all screen sizes and device types.

## Table of Contents

1. [Device Testing Matrix](#device-testing-matrix)
2. [Testing Procedures](#testing-procedures)
3. [Mobile Device Testing Checklist](#mobile-device-testing-checklist)
4. [Performance Monitoring Setup](#performance-monitoring-setup)
5. [Automated Testing](#automated-testing)
6. [Manual Testing Scenarios](#manual-testing-scenarios)
7. [Issue Reporting](#issue-reporting)

---

## Device Testing Matrix

### Physical Device Testing

#### iOS Devices (Priority)
| Device | Screen Size | Resolution | iOS Version | Priority |
|--------|-------------|------------|-------------|----------|
| iPhone SE (2nd/3rd gen) | 4.7" | 375x667 | 15+ | High |
| iPhone 12/13 Mini | 5.4" | 375x812 | 15+ | Medium |
| iPhone 12/13/14 | 6.1" | 390x844 | 15+ | High |
| iPhone 12/13/14 Pro Max | 6.7" | 428x926 | 15+ | High |
| iPhone 15/15 Pro | 6.1" | 393x852 | 17+ | High |
| iPad Mini | 8.3" | 744x1133 | 15+ | Medium |
| iPad Air/Pro | 10.9" | 820x1180 | 15+ | Medium |

#### Android Devices (Priority)
| Device | Screen Size | Resolution | Android Version | Priority |
|--------|-------------|------------|-----------------|----------|
| Samsung Galaxy S21 | 6.2" | 360x800 | 11+ | High |
| Samsung Galaxy S22/S23 | 6.1" | 360x800 | 12+ | High |
| Google Pixel 6/7 | 6.4" | 412x915 | 12+ | High |
| OnePlus 9/10 | 6.55" | 412x919 | 11+ | Medium |
| Samsung Galaxy Tab S8 | 11" | 800x1280 | 12+ | Medium |

### Browser Testing Matrix

#### Mobile Browsers
- **iOS Safari** (Primary) - Latest 2 versions
- **Chrome Mobile** (Android) - Latest 2 versions
- **Firefox Mobile** - Latest version
- **Samsung Internet** - Latest version
- **Edge Mobile** - Latest version

#### Responsive Testing (Desktop Browsers)
- Chrome DevTools Device Mode
- Firefox Responsive Design Mode
- Safari Responsive Design Mode

### Viewport Testing Breakpoints

Test at these specific widths:
- **320px** - Extra small mobile (smallest Android devices)
- **375px** - iPhone SE, iPhone 6/7/8
- **390px** - iPhone 12/13/14 standard
- **393px** - iPhone 15/15 Pro
- **412px** - Common Android width
- **428px** - iPhone 12/13/14 Pro Max
- **640px** - Large mobile/small tablet
- **768px** - iPad Mini, standard tablets
- **820px** - iPad Air
- **1024px** - iPad Pro landscape

---

## Testing Procedures

### 1. Pre-Testing Setup

#### Environment Preparation
```bash
# 1. Ensure development server is running
npm run dev

# 2. Access on mobile device (same network)
# Find your local IP address:
# Windows: ipconfig
# Mac/Linux: ifconfig

# 3. Access from mobile browser:
# http://[YOUR_IP]:3000
```

#### Testing Tools Setup
- Install **Chrome Remote Debugging** for Android
- Enable **Safari Web Inspector** for iOS
- Install **Lighthouse** browser extension
- Set up **BrowserStack** or **LambdaTest** account (optional)

### 2. Visual Testing Procedure

#### Step-by-Step Visual Inspection

1. **Load Homepage**
   - Verify black background loads correctly
   - Check orange borders are visible and thin (1-2px)
   - Confirm white text is readable
   - Validate logo and header display properly

2. **Navigation Testing**
   - Tap hamburger menu icon
   - Verify full-screen overlay appears
   - Check menu items are orange and readable
   - Test close button (X) functionality
   - Verify menu closes on item selection

3. **Content Blocks**
   - Scroll through all bitcoin-block containers
   - Verify no content overflows boundaries
   - Check all text fits within containers
   - Validate price displays scale properly
   - Confirm stat cards display correctly

4. **Interactive Elements**
   - Test all buttons (minimum 48px touch targets)
   - Verify hover states work (if applicable)
   - Check button text doesn't wrap awkwardly
   - Test form inputs and dropdowns
   - Validate all links are tappable

5. **Data Displays**
   - Check price displays use Roboto Mono font
   - Verify orange glow effects on prices
   - Confirm stat values fit in containers
   - Test zone cards for overflow
   - Validate whale transaction cards

### 3. Functional Testing Procedure

#### Core Functionality Tests

1. **Market Data Loading**
   - Verify real-time prices load
   - Check 24h change displays correctly
   - Confirm volume data appears
   - Test data refresh functionality

2. **News Feed**
   - Verify news articles load
   - Check article cards display properly
   - Test "Read More" functionality
   - Validate news ticker scrolls smoothly

3. **Trading Charts**
   - Confirm charts render on mobile
   - Test chart interactions (zoom, pan)
   - Verify technical indicators display
   - Check chart legends are readable

4. **Whale Watch** (if applicable)
   - Test whale transaction detection
   - Verify analyze button works
   - Check analysis status updates
   - Validate analysis lock system

5. **Page Navigation**
   - Test all menu links
   - Verify page transitions
   - Check back button functionality
   - Validate deep linking

### 4. Performance Testing Procedure

#### Load Time Testing
```bash
# Run Lighthouse audit
npm run lighthouse:mobile

# Or manually in Chrome DevTools:
# 1. Open DevTools (F12)
# 2. Go to Lighthouse tab
# 3. Select "Mobile" device
# 4. Run audit
```

#### Performance Metrics to Track
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Total Blocking Time (TBT)**: < 200ms
- **Cumulative Layout Shift (CLS)**: < 0.1

#### Network Throttling Tests
Test under different network conditions:
- **Fast 3G**: 1.6 Mbps down, 750 Kbps up
- **Slow 3G**: 400 Kbps down, 400 Kbps up
- **Offline**: Test offline functionality

### 5. Accessibility Testing Procedure

#### WCAG 2.1 AA Compliance Checks

1. **Color Contrast**
   - Use browser DevTools contrast checker
   - Verify white on black: 21:1 ratio ✓
   - Check orange on black: 5.8:1 ratio ✓
   - Validate all text meets minimum ratios

2. **Touch Targets**
   - Measure interactive elements (min 48px)
   - Check spacing between targets (min 8px)
   - Verify buttons are easily tappable

3. **Screen Reader Testing**
   - Enable VoiceOver (iOS) or TalkBack (Android)
   - Navigate through entire page
   - Verify all content is announced
   - Check heading hierarchy
   - Validate ARIA labels

4. **Keyboard Navigation**
   - Test tab order
   - Verify focus indicators are visible
   - Check all interactive elements are reachable
   - Validate escape key closes modals

---

## Mobile Device Testing Checklist

### Pre-Launch Checklist

#### Visual Design ✓
- [ ] All backgrounds are pure black (#000000)
- [ ] All text is white or orange only
- [ ] All borders are thin orange (1-2px)
- [ ] No horizontal scroll on any screen size
- [ ] All text is readable and properly contrasted
- [ ] All buttons have orange glow effects
- [ ] All containers clip overflow properly
- [ ] All data uses Roboto Mono, UI uses Inter
- [ ] All animations are smooth and performant
- [ ] Zero instances of forbidden colors

#### Layout & Responsiveness ✓
- [ ] Single-column layout on mobile (< 640px)
- [ ] Two-column layout on tablet (640px - 1024px)
- [ ] Multi-column layout on desktop (> 1024px)
- [ ] All content fits within viewport at 320px
- [ ] All content fits within viewport at 375px
- [ ] All content fits within viewport at 390px
- [ ] All content fits within viewport at 428px
- [ ] All content fits within viewport at 768px
- [ ] Portrait orientation works correctly
- [ ] Landscape orientation works correctly

#### Touch Interactions ✓
- [ ] All buttons are minimum 48px height
- [ ] All touch targets are minimum 48px × 48px
- [ ] Spacing between targets is minimum 8px
- [ ] Buttons provide visual feedback on tap
- [ ] Swipe gestures work (if applicable)
- [ ] Pinch-to-zoom disabled on UI elements
- [ ] Long-press actions work (if applicable)

#### Performance ✓
- [ ] Page loads in < 3 seconds on 4G
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.8s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Smooth scrolling at 60fps
- [ ] Animations don't cause jank
- [ ] Images are optimized for mobile

#### Functionality ✓
- [ ] All navigation links work
- [ ] Hamburger menu opens/closes
- [ ] All buttons trigger correct actions
- [ ] Forms submit successfully
- [ ] Data loads and displays correctly
- [ ] Real-time updates work
- [ ] Error states display properly
- [ ] Loading states are visible

#### Accessibility ✓
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Large text contrast meets WCAG AA (3:1)
- [ ] Focus indicators are visible
- [ ] Screen reader announces all content
- [ ] Heading hierarchy is correct
- [ ] ARIA labels are present
- [ ] Alt text on all images
- [ ] Keyboard navigation works

#### Content ✓
- [ ] All text is readable at mobile sizes
- [ ] No text overflow or clipping
- [ ] Price displays scale properly
- [ ] Stat cards fit in containers
- [ ] Zone cards display correctly
- [ ] Whale transaction cards work
- [ ] News articles are readable
- [ ] Charts render correctly

#### Browser Compatibility ✓
- [ ] Works in iOS Safari (latest)
- [ ] Works in Chrome Mobile (latest)
- [ ] Works in Firefox Mobile (latest)
- [ ] Works in Samsung Internet (latest)
- [ ] Works in Edge Mobile (latest)

---

## Performance Monitoring Setup

### 1. Lighthouse CI Integration

#### Setup Lighthouse CI
```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Create configuration file
touch lighthouserc.json
```

#### Configuration (lighthouserc.json)
```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/bitcoin-report",
        "http://localhost:3000/ethereum-report",
        "http://localhost:3000/whale-watch"
      ],
      "settings": {
        "preset": "desktop",
        "emulatedFormFactor": "mobile",
        "throttling": {
          "rttMs": 150,
          "throughputKbps": 1638.4,
          "cpuSlowdownMultiplier": 4
        }
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.8}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 1800}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

#### Run Lighthouse CI
```bash
# Start development server
npm run dev

# Run Lighthouse CI (in another terminal)
lhci autorun

# Or run specific URL
lhci collect --url=http://localhost:3000
```

### 2. Real User Monitoring (RUM)

#### Web Vitals Tracking

Create `utils/webVitals.ts`:
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals(metric: any) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(metric);
  }
  
  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // Send to your analytics service
    // Example: Google Analytics, Vercel Analytics, etc.
    const body = JSON.stringify(metric);
    const url = '/api/analytics';
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      fetch(url, { body, method: 'POST', keepalive: true });
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
```

#### Add to _app.tsx
```typescript
import { useEffect } from 'react';
import { initWebVitals } from '../utils/webVitals';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    initWebVitals();
  }, []);
  
  return <Component {...pageProps} />;
}
```

### 3. Mobile Performance Monitoring Script

Create `scripts/mobile-performance-test.js`:
```javascript
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');

const devices = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max', width: 428, height: 926 },
  { name: 'Samsung Galaxy S21', width: 360, height: 800 },
  { name: 'iPad Mini', width: 768, height: 1024 }
];

async function runLighthouse(url, device) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility'],
    port: chrome.port,
    emulatedFormFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: device.width,
      height: device.height,
      deviceScaleFactor: 2
    }
  };
  
  const runnerResult = await lighthouse(url, options);
  await chrome.kill();
  
  return {
    device: device.name,
    performance: runnerResult.lhr.categories.performance.score * 100,
    accessibility: runnerResult.lhr.categories.accessibility.score * 100,
    fcp: runnerResult.lhr.audits['first-contentful-paint'].numericValue,
    lcp: runnerResult.lhr.audits['largest-contentful-paint'].numericValue,
    cls: runnerResult.lhr.audits['cumulative-layout-shift'].numericValue
  };
}

async function testAllDevices() {
  const url = 'http://localhost:3000';
  const results = [];
  
  console.log('Starting mobile performance tests...\n');
  
  for (const device of devices) {
    console.log(`Testing ${device.name}...`);
    const result = await runLighthouse(url, device);
    results.push(result);
    console.log(`  Performance: ${result.performance.toFixed(0)}`);
    console.log(`  Accessibility: ${result.accessibility.toFixed(0)}`);
    console.log(`  FCP: ${(result.fcp / 1000).toFixed(2)}s`);
    console.log(`  LCP: ${(result.lcp / 1000).toFixed(2)}s`);
    console.log(`  CLS: ${result.cls.toFixed(3)}\n`);
  }
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `mobile-performance-report-${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${filename}`);
}

testAllDevices().catch(console.error);
```

#### Run Performance Tests
```bash
# Install dependencies
npm install lighthouse chrome-launcher --save-dev

# Run tests
node scripts/mobile-performance-test.js
```

### 4. Continuous Monitoring

#### GitHub Actions Workflow

Create `.github/workflows/mobile-performance.yml`:
```yaml
name: Mobile Performance Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start server
        run: npm start &
        
      - name: Wait for server
        run: npx wait-on http://localhost:3000
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-results
          path: .lighthouseci
```

---

## Automated Testing

### 1. Visual Regression Testing

#### Setup Playwright for Visual Testing
```bash
npm install -D @playwright/test
npx playwright install
```

#### Create Visual Tests (tests/mobile-visual.spec.ts)
```typescript
import { test, expect, devices } from '@playwright/test';

const mobileDevices = [
  { name: 'iPhone SE', ...devices['iPhone SE'] },
  { name: 'iPhone 12', ...devices['iPhone 12'] },
  { name: 'iPhone 14 Pro Max', ...devices['iPhone 14 Pro Max'] },
  { name: 'Pixel 5', ...devices['Pixel 5'] },
  { name: 'iPad Mini', ...devices['iPad Mini'] }
];

for (const device of mobileDevices) {
  test.describe(`Mobile Visual Tests - ${device.name}`, () => {
    test.use(device);
    
    test('homepage renders correctly', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await expect(page).toHaveScreenshot(`homepage-${device.name}.png`);
    });
    
    test('navigation menu displays properly', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await page.click('[aria-label="Open menu"]');
      await expect(page).toHaveScreenshot(`menu-${device.name}.png`);
    });
    
    test('bitcoin report page renders', async ({ page }) => {
      await page.goto('http://localhost:3000/bitcoin-report');
      await expect(page).toHaveScreenshot(`bitcoin-report-${device.name}.png`);
    });
  });
}
```

#### Run Visual Tests
```bash
npx playwright test tests/mobile-visual.spec.ts
```

### 2. Accessibility Testing

#### Create Accessibility Tests (tests/mobile-a11y.spec.ts)
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Mobile Accessibility Tests', () => {
  test('homepage meets WCAG AA standards', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('all touch targets are minimum 48px', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const buttons = await page.locator('button, a[href]').all();
    
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(48);
        expect(box.width).toBeGreaterThanOrEqual(48);
      }
    }
  });
});
```

---

## Manual Testing Scenarios

### Scenario 1: First-Time User Experience

**Objective**: Verify new user can navigate and understand the platform

**Steps**:
1. Open app on mobile device (clear cache first)
2. Observe initial load time and first impression
3. Scroll through homepage content
4. Tap hamburger menu and explore navigation
5. Visit each main section (Bitcoin Report, Ethereum Report, etc.)
6. Attempt to interact with charts and data
7. Read news articles
8. Test back button navigation

**Success Criteria**:
- Page loads in < 3 seconds
- All content is readable
- Navigation is intuitive
- No confusion about interactive elements
- All features work as expected

### Scenario 2: Data Consumption Flow

**Objective**: Verify user can efficiently consume market data

**Steps**:
1. Open Bitcoin Report page
2. Check current price display
3. Review 24h change and volume
4. Scroll through technical indicators
5. View trading zones
6. Check fear & greed indicator
7. Read market analysis
8. Switch to Ethereum Report
9. Compare data presentation

**Success Criteria**:
- All data displays correctly
- Numbers fit in containers
- Charts are readable
- No text overflow
- Smooth scrolling
- Quick page transitions

### Scenario 3: Whale Watch Analysis

**Objective**: Test whale transaction detection and analysis

**Steps**:
1. Navigate to Whale Watch page
2. Wait for whale transactions to load
3. Review transaction cards
4. Tap "Analyze" button on a transaction
5. Observe analysis status updates
6. Wait for analysis to complete
7. Review analysis results
8. Check source citations
9. Attempt to analyze another transaction (should be blocked)

**Success Criteria**:
- Transactions load correctly
- Analyze button is tappable (48px min)
- Status updates are visible
- Analysis lock prevents multiple requests
- Results display properly
- Sources are accessible

### Scenario 4: Network Resilience

**Objective**: Test app behavior under poor network conditions

**Steps**:
1. Enable network throttling (Slow 3G)
2. Load homepage
3. Observe loading states
4. Navigate to different pages
5. Test data refresh
6. Disable network completely
7. Observe offline behavior
8. Re-enable network
9. Verify data recovery

**Success Criteria**:
- Loading states are visible
- No crashes or errors
- Graceful degradation
- Clear offline indicators
- Smooth recovery when online

### Scenario 5: Orientation Changes

**Objective**: Verify layout adapts to orientation changes

**Steps**:
1. Open app in portrait mode
2. Review layout and content
3. Rotate device to landscape
4. Observe layout changes
5. Test navigation in landscape
6. Interact with charts and data
7. Rotate back to portrait
8. Verify no layout issues

**Success Criteria**:
- Layout adapts smoothly
- No content clipping
- All features remain accessible
- No horizontal scroll
- Smooth transitions

---

## Issue Reporting

### Issue Template

When reporting mobile issues, include:

**Device Information**:
- Device model: [e.g., iPhone 14 Pro]
- OS version: [e.g., iOS 17.2]
- Browser: [e.g., Safari 17.2]
- Screen size: [e.g., 390x844]

**Issue Description**:
- Clear description of the problem
- Expected behavior
- Actual behavior
- Steps to reproduce

**Screenshots/Videos**:
- Attach screenshots showing the issue
- Record video if issue involves animation/interaction

**Console Errors**:
- Include any JavaScript errors from console
- Network errors from Network tab

**Performance Data**:
- Lighthouse scores (if applicable)
- Load times
- FPS during issue

### Priority Levels

- **P0 - Critical**: App is unusable, data loss, security issue
- **P1 - High**: Major feature broken, poor UX, accessibility violation
- **P2 - Medium**: Minor feature issue, cosmetic problem
- **P3 - Low**: Enhancement, nice-to-have improvement

---

## Testing Schedule

### Pre-Release Testing
- **Week 1**: Device matrix testing (all devices)
- **Week 2**: Performance optimization and re-testing
- **Week 3**: Accessibility audit and fixes
- **Week 4**: Final validation and sign-off

### Ongoing Testing
- **Daily**: Automated CI/CD tests
- **Weekly**: Manual spot checks on key devices
- **Monthly**: Full device matrix regression testing
- **Quarterly**: Comprehensive accessibility audit

---

## Resources

### Testing Tools
- **Chrome DevTools**: https://developer.chrome.com/docs/devtools/
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse
- **WebPageTest**: https://www.webpagetest.org/
- **BrowserStack**: https://www.browserstack.com/
- **Playwright**: https://playwright.dev/

### Documentation
- **Web Vitals**: https://web.dev/vitals/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Mobile Testing Best Practices**: https://web.dev/mobile/

### Support
- **Internal**: Contact development team via Slack #mobile-testing
- **External**: Submit issues to GitHub repository

---

**Document Version**: 1.0.0  
**Last Updated**: January 2025  
**Maintained By**: Development Team  
**Review Cycle**: Quarterly
