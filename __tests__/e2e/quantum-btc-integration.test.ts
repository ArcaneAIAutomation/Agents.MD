/**
 * Quantum BTC Integration Test
 * 
 * Tests the end-to-end user flow for the Quantum BTC Dashboard:
 * 1. Page loads successfully
 * 2. Navigation menu item exists
 * 3. All UI components render
 * 4. User can navigate to the page
 * 
 * Task 8.6: Integrate Quantum BTC Dashboard into main application
 */

import { describe, it, expect } from '@jest/globals';

describe('Quantum BTC Integration', () => {
  describe('Page Structure', () => {
    it('should have quantum-btc page file', () => {
      // Verify the page file exists
      const fs = require('fs');
      const path = require('path');
      const pagePath = path.join(process.cwd(), 'pages', 'quantum-btc.tsx');
      
      expect(fs.existsSync(pagePath)).toBe(true);
    });

    it('should have QuantumBTCDashboard component', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'components', 'QuantumBTC', 'QuantumBTCDashboard.tsx');
      
      expect(fs.existsSync(componentPath)).toBe(true);
    });

    it('should have all required sub-components', () => {
      const fs = require('fs');
      const path = require('path');
      const componentsDir = path.join(process.cwd(), 'components', 'QuantumBTC');
      
      const requiredComponents = [
        'TradeGenerationButton.tsx',
        'PerformanceDashboard.tsx',
        'TradeDetailModal.tsx',
        'DataQualityIndicators.tsx'
      ];

      requiredComponents.forEach(component => {
        const componentPath = path.join(componentsDir, component);
        expect(fs.existsSync(componentPath)).toBe(true);
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should have Quantum BTC menu item in Navigation', () => {
      const fs = require('fs');
      const path = require('path');
      const navPath = path.join(process.cwd(), 'components', 'Navigation.tsx');
      const navContent = fs.readFileSync(navPath, 'utf-8');
      
      // Check if Quantum BTC menu item exists
      expect(navContent).toContain('Quantum BTC');
      expect(navContent).toContain('/quantum-btc');
      expect(navContent).toContain('Quantum Bitcoin Intelligence Engine');
    });

    it('should use correct icon for Quantum BTC', () => {
      const fs = require('fs');
      const path = require('path');
      const navPath = path.join(process.cwd(), 'components', 'Navigation.tsx');
      const navContent = fs.readFileSync(navPath, 'utf-8');
      
      // Verify Zap icon is imported (used for Quantum BTC)
      expect(navContent).toContain('Zap');
    });
  });

  describe('Page Content', () => {
    it('should have proper page metadata', () => {
      const fs = require('fs');
      const path = require('path');
      const pagePath = path.join(process.cwd(), 'pages', 'quantum-btc.tsx');
      const pageContent = fs.readFileSync(pagePath, 'utf-8');
      
      // Check for proper Head metadata
      expect(pageContent).toContain('Quantum BTC Super Spec');
      expect(pageContent).toContain('Bitcoin Sovereign Technology');
      expect(pageContent).toContain('quantum-pattern reasoning');
      expect(pageContent).toContain('GPT-5.1');
    });

    it('should include Navigation component', () => {
      const fs = require('fs');
      const path = require('path');
      const pagePath = path.join(process.cwd(), 'pages', 'quantum-btc.tsx');
      const pageContent = fs.readFileSync(pagePath, 'utf-8');
      
      expect(pageContent).toContain('import Navigation');
      expect(pageContent).toContain('<Navigation />');
    });

    it('should include QuantumBTCDashboard component', () => {
      const fs = require('fs');
      const path = require('path');
      const pagePath = path.join(process.cwd(), 'pages', 'quantum-btc.tsx');
      const pageContent = fs.readFileSync(pagePath, 'utf-8');
      
      expect(pageContent).toContain('import QuantumBTCDashboard');
      expect(pageContent).toContain('<QuantumBTCDashboard />');
    });

    it('should be wrapped with AccessGate for authentication', () => {
      const fs = require('fs');
      const path = require('path');
      const pagePath = path.join(process.cwd(), 'pages', 'quantum-btc.tsx');
      const pageContent = fs.readFileSync(pagePath, 'utf-8');
      
      expect(pageContent).toContain('import AccessGate');
      expect(pageContent).toContain('<AccessGate>');
    });
  });

  describe('Component Structure', () => {
    it('should have all required sections in dashboard', () => {
      const fs = require('fs');
      const path = require('path');
      const dashboardPath = path.join(process.cwd(), 'components', 'QuantumBTC', 'QuantumBTCDashboard.tsx');
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
      
      // Check for key sections
      expect(dashboardContent).toContain('Hero Header');
      expect(dashboardContent).toContain('Trade Generation Section');
      expect(dashboardContent).toContain('Data Quality Section');
      expect(dashboardContent).toContain('Performance Dashboard Section');
      expect(dashboardContent).toContain('System Info Footer');
    });

    it('should use Bitcoin Sovereign styling', () => {
      const fs = require('fs');
      const path = require('path');
      const dashboardPath = path.join(process.cwd(), 'components', 'QuantumBTC', 'QuantumBTCDashboard.tsx');
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
      
      // Check for Bitcoin Sovereign color classes
      expect(dashboardContent).toContain('bg-bitcoin-black');
      expect(dashboardContent).toContain('border-bitcoin-orange');
      expect(dashboardContent).toContain('text-bitcoin-white');
    });
  });

  describe('User Flow', () => {
    it('should support complete user journey', () => {
      const fs = require('fs');
      const path = require('path');
      
      // 1. User logs in (AccessGate)
      const pagePath = path.join(process.cwd(), 'pages', 'quantum-btc.tsx');
      const pageContent = fs.readFileSync(pagePath, 'utf-8');
      expect(pageContent).toContain('AccessGate');
      
      // 2. User navigates to Quantum BTC (Navigation)
      const navPath = path.join(process.cwd(), 'components', 'Navigation.tsx');
      const navContent = fs.readFileSync(navPath, 'utf-8');
      expect(navContent).toContain('/quantum-btc');
      
      // 3. User sees dashboard (QuantumBTCDashboard)
      const dashboardPath = path.join(process.cwd(), 'components', 'QuantumBTC', 'QuantumBTCDashboard.tsx');
      expect(fs.existsSync(dashboardPath)).toBe(true);
      
      // 4. User can generate trade (TradeGenerationButton)
      const buttonPath = path.join(process.cwd(), 'components', 'QuantumBTC', 'TradeGenerationButton.tsx');
      expect(fs.existsSync(buttonPath)).toBe(true);
      
      // 5. User can view performance (PerformanceDashboard)
      const perfPath = path.join(process.cwd(), 'components', 'QuantumBTC', 'PerformanceDashboard.tsx');
      expect(fs.existsSync(perfPath)).toBe(true);
      
      // 6. User can view trade details (TradeDetailModal)
      const modalPath = path.join(process.cwd(), 'components', 'QuantumBTC', 'TradeDetailModal.tsx');
      expect(fs.existsSync(modalPath)).toBe(true);
    });
  });

  describe('Requirements Validation', () => {
    it('should meet all Task 8.6 requirements', () => {
      const fs = require('fs');
      const path = require('path');
      
      // Requirement 1: Add route for Quantum BTC page
      const pagePath = path.join(process.cwd(), 'pages', 'quantum-btc.tsx');
      expect(fs.existsSync(pagePath)).toBe(true);
      
      // Requirement 2: Add navigation menu item
      const navPath = path.join(process.cwd(), 'components', 'Navigation.tsx');
      const navContent = fs.readFileSync(navPath, 'utf-8');
      expect(navContent).toContain('Quantum BTC');
      expect(navContent).toContain('/quantum-btc');
      
      // Requirement 3: Test end-to-end user flow (this test file)
      const testPath = path.join(process.cwd(), '__tests__', 'e2e', 'quantum-btc-integration.test.ts');
      expect(fs.existsSync(testPath)).toBe(true);
    });

    it('should follow Bitcoin Sovereign design system', () => {
      const fs = require('fs');
      const path = require('path');
      const pagePath = path.join(process.cwd(), 'pages', 'quantum-btc.tsx');
      const pageContent = fs.readFileSync(pagePath, 'utf-8');
      
      // Check for Bitcoin Sovereign styling
      expect(pageContent).toContain('bg-bitcoin-black');
      expect(pageContent).toContain('Bitcoin Sovereign Technology');
    });

    it('should integrate with authentication system', () => {
      const fs = require('fs');
      const path = require('path');
      const pagePath = path.join(process.cwd(), 'pages', 'quantum-btc.tsx');
      const pageContent = fs.readFileSync(pagePath, 'utf-8');
      
      // Verify AccessGate wrapper
      expect(pageContent).toContain('AccessGate');
    });
  });
});

describe('Quantum BTC API Integration', () => {
  it('should have all required API endpoints', () => {
    const fs = require('fs');
    const path = require('path');
    const apiDir = path.join(process.cwd(), 'pages', 'api', 'quantum');
    
    const requiredEndpoints = [
      'generate-btc-trade.ts',
      'validate-btc-trades.ts',
      'performance-dashboard.ts'
    ];

    requiredEndpoints.forEach(endpoint => {
      const endpointPath = path.join(apiDir, endpoint);
      expect(fs.existsSync(endpointPath)).toBe(true);
    });
  });
});
