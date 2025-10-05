/**
 * Example usage of Mobile Accessibility Testing Utilities
 * 
 * This file demonstrates how to use the accessibility testing utilities
 * in the Crypto Herald mobile optimization project.
 */

import {
  MobileAccessibilityTester,
  generateMobileAccessibilityReport,
  validateTouchTarget,
  scanTouchTargets,
  enableAccessibilityMonitoring,
  formatAccessibilityReport,
} from '../accessibilityTesting';

import {
  validateCryptoHeraldAccessibility,
  enableCryptoHeraldAccessibilityMonitoring,
  useCryptoHeraldAccessibility,
  validateComponentAccessibility,
} from '../accessibilityIntegration';

/**
 * Example 1: Basic accessibility testing
 */
export async function basicAccessibilityTest() {
  console.log('🧪 Running basic accessibility test...');
  
  // Generate a comprehensive report
  const report = generateMobileAccessibilityReport();
  
  console.log(`📊 Accessibility Score: ${report.summary.score}/100`);
  console.log(`🎯 Touch Target Issues: ${report.summary.touchTargetIssues}`);
  console.log(`🎨 Contrast Issues: ${report.summary.contrastIssues}`);
  console.log(`🚨 Critical Issues: ${report.summary.criticalIssues}`);
  
  // Get formatted report
  const formattedReport = formatAccessibilityReport(report);
  console.log('\n📋 Detailed Report:');
  console.log(formattedReport);
  
  return report;
}

/**
 * Example 2: Touch target validation
 */
export function validateTouchTargetsExample() {
  console.log('👆 Validating touch targets...');
  
  // Scan all touch targets on the page
  const results = scanTouchTargets();
  
  // Filter failed targets
  const failedTargets = results.filter(target => !target.passes);
  
  if (failedTargets.length > 0) {
    console.log(`❌ Found ${failedTargets.length} touch target issues:`);
    failedTargets.forEach(target => {
      console.log(`  - ${target.element}: ${target.size}px (needs ${44}px)`);
      target.recommendations.forEach(rec => {
        console.log(`    💡 ${rec}`);
      });
    });
  } else {
    console.log('✅ All touch targets meet minimum size requirements');
  }
  
  return results;
}

/**
 * Example 3: Automated testing with assertions
 */
export async function automatedAccessibilityTest() {
  console.log('🤖 Running automated accessibility test...');
  
  const tester = new MobileAccessibilityTester();
  
  try {
    // Run comprehensive tests
    const results = await tester.runTests();
    
    // Assert compliance with strict requirements
    tester.assertCompliance({
      allowTouchTargetIssues: false,
      allowContrastIssues: false,
      maxScore: 90
    });
    
    console.log('✅ All accessibility tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Accessibility test failed:', error.message);
    
    // Get detailed report for debugging
    const report = tester.getReport();
    console.log('\n📋 Failure Report:');
    console.log(report);
    
    return false;
  }
}

/**
 * Example 4: Crypto Herald specific testing
 */
export async function cryptoHeraldAccessibilityTest() {
  console.log('🚀 Running Crypto Herald specific accessibility test...');
  
  const result = await validateCryptoHeraldAccessibility();
  
  if (result.passed) {
    console.log('✅ Crypto Herald accessibility validation passed!');
  } else {
    console.log('❌ Crypto Herald accessibility issues found:');
    result.recommendations.forEach(rec => {
      console.log(`  💡 ${rec}`);
    });
  }
  
  console.log(`📊 Overall Score: ${result.report.summary.score}/100`);
  
  return result;
}

/**
 * Example 5: Component-specific testing
 */
export async function testSpecificComponents() {
  console.log('🧩 Testing specific components...');
  
  const components = ['TradingChart', 'CryptoHerald', 'TradeGenerationEngine'];
  
  for (const component of components) {
    console.log(`\n🔍 Testing ${component}...`);
    
    const result = await validateComponentAccessibility(component);
    
    if (result.passed) {
      console.log(`✅ ${component} accessibility passed`);
    } else {
      console.log(`❌ ${component} has ${result.issues.length} issues:`);
      result.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
      
      console.log('💡 Recommendations:');
      result.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }
  }
}

/**
 * Example 6: Development monitoring setup
 */
export function setupDevelopmentMonitoring() {
  console.log('🔧 Setting up development accessibility monitoring...');
  
  // Enable comprehensive monitoring
  enableCryptoHeraldAccessibilityMonitoring();
  
  // Set up periodic checks
  setInterval(() => {
    console.log('🔄 Running periodic accessibility check...');
    
    const report = generateMobileAccessibilityReport();
    
    if (report.summary.totalIssues > 0) {
      console.warn(`⚠️ Found ${report.summary.totalIssues} accessibility issues`);
    }
  }, 30000); // Check every 30 seconds
  
  console.log('✅ Development monitoring enabled');
}

/**
 * Example 7: React component usage
 */
export function ReactComponentExample() {
  // This would be used in a React component
  const accessibility = useCryptoHeraldAccessibility();
  
  const handleTestAccessibility = async () => {
    console.log('🧪 Testing accessibility from React component...');
    
    // Run full test
    const result = await accessibility.runFullAccessibilityTest();
    console.log(`Score: ${result.report.summary.score}/100`);
    
    // Test specific elements
    const tradingIssues = accessibility.validateTradingElements();
    if (tradingIssues.length > 0) {
      console.log('Trading element issues:', tradingIssues);
    }
    
    const chartIssues = accessibility.validateChartAccessibility();
    if (chartIssues.length > 0) {
      console.log('Chart accessibility issues:', chartIssues);
    }
  };
  
  return {
    testAccessibility: handleTestAccessibility,
    // Other component logic...
  };
}

/**
 * Example 8: Testing framework integration
 */
export const testFrameworkExamples = {
  
  // Jest/Vitest test example
  jestExample: async () => {
    const tester = new MobileAccessibilityTester();
    const results = await tester.runTests();
    
    // Assertions
    expect(results.summary.criticalIssues).toBe(0);
    expect(results.summary.score).toBeGreaterThanOrEqual(90);
    expect(results.summary.touchTargetIssues).toBe(0);
  },
  
  // Cypress test example
  cypressExample: () => {
    cy.window().then(async (win) => {
      const report = await win.generateMobileAccessibilityReport();
      expect(report.summary.criticalIssues).to.equal(0);
    });
  },
  
  // Playwright test example
  playwrightExample: async (page: any) => {
    const report = await page.evaluate(() => {
      return window.generateMobileAccessibilityReport();
    });
    
    expect(report.summary.criticalIssues).toBe(0);
    expect(report.summary.score).toBeGreaterThanOrEqual(90);
  },
};

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('🚀 Running all accessibility testing examples...\n');
  
  try {
    await basicAccessibilityTest();
    console.log('\n' + '='.repeat(50) + '\n');
    
    validateTouchTargetsExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await automatedAccessibilityTest();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await cryptoHeraldAccessibilityTest();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await testSpecificComponents();
    console.log('\n' + '='.repeat(50) + '\n');
    
    setupDevelopmentMonitoring();
    
    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// Export for use in other files
export default {
  basicAccessibilityTest,
  validateTouchTargetsExample,
  automatedAccessibilityTest,
  cryptoHeraldAccessibilityTest,
  testSpecificComponents,
  setupDevelopmentMonitoring,
  ReactComponentExample,
  testFrameworkExamples,
  runAllExamples,
};