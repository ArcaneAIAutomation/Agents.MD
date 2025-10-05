/**
 * Integration utilities for mobile accessibility testing
 * 
 * Provides integration between accessibility testing utilities and 
 * the mobile optimization components in the Crypto Herald platform.
 */

import { 
  generateMobileAccessibilityReport,
  enableAccessibilityMonitoring,
  MobileAccessibilityTester,
  formatAccessibilityReport,
  type MobileAccessibilityReport 
} from './accessibilityTesting';

import { 
  validateMobileColors,
  enableContrastMonitoring,
  useContrastValidation 
} from './contrastValidation';

/**
 * Comprehensive mobile accessibility validation for Crypto Herald
 */
export async function validateCryptoHeraldAccessibility(): Promise<{
  report: MobileAccessibilityReport;
  formattedReport: string;
  passed: boolean;
  recommendations: string[];
}> {
  // Run comprehensive accessibility tests
  const tester = new MobileAccessibilityTester();
  const report = await tester.runTests();
  
  // Validate mobile-specific color combinations
  const colorResults = validateMobileColors();
  const colorIssues = colorResults.filter(result => !result.passes);
  
  // Generate formatted report
  const formattedReport = formatAccessibilityReport(report);
  
  // Determine if validation passed
  const passed = report.summary.criticalIssues === 0 && colorIssues.length === 0;
  
  // Generate specific recommendations for Crypto Herald
  const recommendations = generateCryptoHeraldRecommendations(report, colorIssues);
  
  return {
    report,
    formattedReport,
    passed,
    recommendations,
  };
}

/**
 * Generate specific recommendations for Crypto Herald mobile optimization
 */
function generateCryptoHeraldRecommendations(
  report: MobileAccessibilityReport,
  colorIssues: any[]
): string[] {
  const recommendations: string[] = [];
  
  // Touch target recommendations
  if (report.summary.touchTargetIssues > 0) {
    recommendations.push(
      'Apply mobile-optimized button classes: Use "min-h-[44px] min-w-[44px] p-3" for all interactive elements'
    );
    recommendations.push(
      'Add proper spacing: Use "space-y-2" or "gap-2" between interactive elements'
    );
  }
  
  // Contrast recommendations
  if (report.summary.contrastIssues > 0 || colorIssues.length > 0) {
    recommendations.push(
      'Apply mobile contrast classes: Use "mobile-text-primary" and "mobile-bg-primary" classes'
    );
    recommendations.push(
      'Update trading chart text: Ensure chart labels use high-contrast colors on mobile'
    );
    recommendations.push(
      'Fix news article cards: Apply "mobile-text-primary" to article text and headlines'
    );
  }
  
  // Component-specific recommendations
  if (report.generalIssues.some(issue => issue.type === 'aria')) {
    recommendations.push(
      'Add ARIA labels to trading buttons: Label "Buy", "Sell", and analysis buttons with descriptive text'
    );
    recommendations.push(
      'Improve chart accessibility: Add alt text or ARIA descriptions to trading charts'
    );
  }
  
  if (report.generalIssues.some(issue => issue.type === 'focus')) {
    recommendations.push(
      'Add focus styles: Use Tailwind focus classes like "focus:ring-2 focus:ring-blue-500"'
    );
    recommendations.push(
      'Enhance navigation focus: Ensure header navigation items have visible focus indicators'
    );
  }
  
  // Mobile-specific recommendations
  if (report.summary.score < 90) {
    recommendations.push(
      'Test on real devices: Validate touch interactions on iPhone and Android devices'
    );
    recommendations.push(
      'Optimize for one-handed use: Ensure important actions are reachable with thumb navigation'
    );
  }
  
  return recommendations;
}

/**
 * Enable comprehensive accessibility monitoring for development
 */
export function enableCryptoHeraldAccessibilityMonitoring(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  console.log('🚀 Crypto Herald accessibility monitoring enabled');
  
  // Enable both contrast and general accessibility monitoring
  enableContrastMonitoring();
  enableAccessibilityMonitoring();
  
  // Add custom monitoring for crypto-specific elements
  setTimeout(() => {
    monitorCryptoSpecificElements();
  }, 2000);
}

/**
 * Monitor crypto-specific elements for accessibility issues
 */
function monitorCryptoSpecificElements(): void {
  const cryptoElements = {
    tradingButtons: document.querySelectorAll('[class*="trading"], [class*="buy"], [class*="sell"]'),
    chartElements: document.querySelectorAll('[class*="chart"], [class*="trading-chart"]'),
    priceElements: document.querySelectorAll('[class*="price"], [class*="ticker"]'),
    newsCards: document.querySelectorAll('[class*="article"], [class*="news"]'),
  };
  
  let issuesFound = 0;
  
  // Check trading buttons
  cryptoElements.tradingButtons.forEach(button => {
    const rect = button.getBoundingClientRect();
    if (rect.width < 44 || rect.height < 44) {
      console.warn('🎯 Trading button below minimum touch target:', button);
      issuesFound++;
    }
  });
  
  // Check chart accessibility
  cryptoElements.chartElements.forEach(chart => {
    if (!chart.getAttribute('aria-label') && !chart.querySelector('[aria-label]')) {
      console.warn('📊 Chart missing accessibility label:', chart);
      issuesFound++;
    }
  });
  
  // Check price element contrast
  cryptoElements.priceElements.forEach(price => {
    const computed = window.getComputedStyle(price);
    const color = computed.color;
    const backgroundColor = computed.backgroundColor;
    
    if (color === backgroundColor || (color === 'rgb(255, 255, 255)' && backgroundColor === 'rgb(255, 255, 255)')) {
      console.warn('💰 Price element has contrast issues:', price);
      issuesFound++;
    }
  });
  
  if (issuesFound === 0) {
    console.log('✅ Crypto-specific elements accessibility check passed');
  } else {
    console.warn(`⚠️ Found ${issuesFound} crypto-specific accessibility issues`);
  }
}

/**
 * React hook for Crypto Herald accessibility testing
 */
export function useCryptoHeraldAccessibility() {
  const contrastValidation = useContrastValidation();
  
  const runFullAccessibilityTest = async () => {
    return await validateCryptoHeraldAccessibility();
  };
  
  const validateTradingElements = () => {
    const tradingButtons = document.querySelectorAll('[class*="trading"], [class*="buy"], [class*="sell"]');
    const issues: string[] = [];
    
    tradingButtons.forEach(button => {
      const rect = button.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        issues.push(`Trading button too small: ${rect.width}x${rect.height}px`);
      }
    });
    
    return issues;
  };
  
  const validateChartAccessibility = () => {
    const charts = document.querySelectorAll('[class*="chart"], [class*="trading-chart"]');
    const issues: string[] = [];
    
    charts.forEach(chart => {
      if (!chart.getAttribute('aria-label') && !chart.querySelector('[aria-label]')) {
        issues.push('Chart missing accessibility label');
      }
    });
    
    return issues;
  };
  
  return {
    runFullAccessibilityTest,
    validateTradingElements,
    validateChartAccessibility,
    validateContrast: contrastValidation.validateElement,
    scanPageContrast: contrastValidation.scanPage,
  };
}

/**
 * Accessibility testing configuration for Crypto Herald components
 */
export const cryptoHeraldAccessibilityConfig = {
  // Component-specific touch target requirements
  touchTargets: {
    tradingButtons: { minSize: 48, recommended: 56 }, // Larger for financial actions
    navigationButtons: { minSize: 44, recommended: 48 },
    chartControls: { minSize: 44, recommended: 48 },
    newsCards: { minSize: 44, recommended: 48 },
  },
  
  // Component-specific contrast requirements
  contrast: {
    priceText: { level: 'AAA', textSize: 'large' }, // Higher standard for price info
    tradingSignals: { level: 'AAA', textSize: 'normal' }, // Critical information
    newsText: { level: 'AA', textSize: 'normal' },
    chartLabels: { level: 'AA', textSize: 'normal' },
  },
  
  // ARIA requirements
  aria: {
    tradingButtons: ['aria-label', 'role'],
    charts: ['aria-label', 'aria-describedby'],
    priceAlerts: ['aria-live', 'aria-label'],
    newsCards: ['aria-label'],
  },
};

/**
 * Validate specific Crypto Herald component accessibility
 */
export async function validateComponentAccessibility(componentName: string): Promise<{
  passed: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  switch (componentName) {
    case 'TradingChart':
      // Validate trading chart accessibility
      const charts = document.querySelectorAll('[class*="trading-chart"]');
      charts.forEach(chart => {
        if (!chart.getAttribute('aria-label')) {
          issues.push('Trading chart missing aria-label');
          recommendations.push('Add aria-label describing the chart content and current data');
        }
      });
      break;
      
    case 'CryptoHerald':
      // Validate news component accessibility
      const newsCards = document.querySelectorAll('[class*="article"], [class*="news-card"]');
      newsCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        if (rect.height < 44) {
          issues.push('News card touch target too small');
          recommendations.push('Increase card padding or minimum height to 44px');
        }
      });
      break;
      
    case 'TradeGenerationEngine':
      // Validate trading engine accessibility
      const tradingButtons = document.querySelectorAll('[class*="buy"], [class*="sell"], [class*="trade"]');
      tradingButtons.forEach(button => {
        const rect = button.getBoundingClientRect();
        if (rect.width < 48 || rect.height < 48) {
          issues.push('Trading action button below recommended size');
          recommendations.push('Increase trading button size to 48px minimum for financial actions');
        }
      });
      break;
  }
  
  return {
    passed: issues.length === 0,
    issues,
    recommendations,
  };
}

// Export all utilities
export const cryptoHeraldAccessibilityUtils = {
  validateCryptoHeraldAccessibility,
  enableCryptoHeraldAccessibilityMonitoring,
  useCryptoHeraldAccessibility,
  validateComponentAccessibility,
  cryptoHeraldAccessibilityConfig,
};