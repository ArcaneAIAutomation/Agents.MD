#!/usr/bin/env node

/**
 * Mobile/Tablet Color Audit Script
 * 
 * This script audits all components for Bitcoin Sovereign color compliance
 * on mobile and tablet devices (320px-1024px).
 * 
 * Checks for:
 * - Forbidden colors (anything not black, orange, white)
 * - Low contrast combinations
 * - Invisible elements (same color text/background)
 * - Missing mobile-specific styles
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

const fs = require('fs');
const path = require('path');

// Bitcoin Sovereign color palette
const ALLOWED_COLORS = {
  black: ['#000000', '#000', 'rgb(0, 0, 0)', 'rgba(0, 0, 0'],
  orange: ['#F7931A', '#f7931a', 'rgb(247, 147, 26)', 'rgba(247, 147, 26'],
  white: ['#FFFFFF', '#FFF', '#fff', 'rgb(255, 255, 255)', 'rgba(255, 255, 255']
};

// Forbidden color patterns
const FORBIDDEN_PATTERNS = [
  /green/i,
  /red/i,
  /blue/i,
  /purple/i,
  /yellow/i,
  /gray/i,
  /grey/i,
  /#[0-9A-F]{6}(?!.*F7931A|.*000000|.*FFFFFF)/i, // Hex colors not in palette
  /rgb\((?!0,\s*0,\s*0|255,\s*255,\s*255|247,\s*147,\s*26)/i // RGB not in palette
];

// Components to audit
const COMPONENTS_DIR = path.join(__dirname, '..', 'components');
const COMPONENTS = [
  'BTCMarketAnalysis.tsx',
  'ETHMarketAnalysis.tsx',
  'CryptoHerald.tsx',
  'WhaleWatch/WhaleWatchDashboard.tsx',
  'TradeGenerationEngine.tsx',
  'BTCTradingChart.tsx',
  'ETHTradingChart.tsx',
  'Header.tsx',
  'Footer.tsx',
  'Navigation.tsx'
];

// Severity levels
const SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

// Audit results
const auditResults = {
  totalIssues: 0,
  criticalIssues: 0,
  highIssues: 0,
  mediumIssues: 0,
  lowIssues: 0,
  components: {}
};

/**
 * Check if a color string is allowed
 */
function isColorAllowed(colorStr) {
  if (!colorStr) return true;
  
  const normalized = colorStr.toLowerCase().trim();
  
  // Check if it's in allowed colors
  for (const colorType in ALLOWED_COLORS) {
    for (const allowedColor of ALLOWED_COLORS[colorType]) {
      if (normalized.includes(allowedColor.toLowerCase())) {
        return true;
      }
    }
  }
  
  // Check for opacity variants (allowed)
  if (normalized.includes('rgba') && (
    normalized.includes('247, 147, 26') || // orange
    normalized.includes('0, 0, 0') || // black
    normalized.includes('255, 255, 255') // white
  )) {
    return true;
  }
  
  return false;
}

/**
 * Check if a color string is forbidden
 */
function isForbiddenColor(colorStr) {
  if (!colorStr) return false;
  
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(colorStr)) {
      // Double-check it's not an allowed color
      if (!isColorAllowed(colorStr)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Extract color-related code from a file
 */
function extractColorCode(content) {
  const colorMatches = [];
  
  // Match className with color-related classes
  const classNameRegex = /className=["']([^"']*)["']/g;
  let match;
  
  while ((match = classNameRegex.exec(content)) !== null) {
    const classes = match[1];
    if (classes.includes('bg-') || classes.includes('text-') || classes.includes('border-')) {
      colorMatches.push({
        type: 'className',
        value: classes,
        line: content.substring(0, match.index).split('\n').length
      });
    }
  }
  
  // Match inline styles
  const styleRegex = /style=\{\{([^}]*)\}\}/g;
  while ((match = styleRegex.exec(content)) !== null) {
    colorMatches.push({
      type: 'inlineStyle',
      value: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  // Match CSS color properties
  const cssColorRegex = /(background|color|border):\s*([^;}\n]+)/g;
  while ((match = cssColorRegex.exec(content)) !== null) {
    colorMatches.push({
      type: 'cssProperty',
      property: match[1],
      value: match[2],
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  return colorMatches;
}

/**
 * Analyze a component file for color issues
 */
function auditComponent(componentPath) {
  const fullPath = path.join(COMPONENTS_DIR, componentPath);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  Component not found: ${componentPath}`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const colorCode = extractColorCode(content);
  
  const issues = [];
  
  // Check each color usage
  for (const code of colorCode) {
    // Check for forbidden colors
    if (isForbiddenColor(code.value)) {
      issues.push({
        severity: SEVERITY.CRITICAL,
        type: 'FORBIDDEN_COLOR',
        line: code.line,
        code: code.value,
        message: `Forbidden color detected: ${code.value}`
      });
    }
    
    // Check for potential invisible elements
    if (code.value.includes('white') && code.value.includes('bg-white')) {
      issues.push({
        severity: SEVERITY.HIGH,
        type: 'INVISIBLE_ELEMENT',
        line: code.line,
        code: code.value,
        message: 'Potential white-on-white combination'
      });
    }
    
    if (code.value.includes('black') && code.value.includes('text-black') && code.value.includes('bg-black')) {
      issues.push({
        severity: SEVERITY.HIGH,
        type: 'INVISIBLE_ELEMENT',
        line: code.line,
        code: code.value,
        message: 'Potential black-on-black combination'
      });
    }
    
    // Check for missing mobile-specific classes
    if (!content.includes('@media') && !content.includes('md:') && !content.includes('sm:')) {
      issues.push({
        severity: SEVERITY.MEDIUM,
        type: 'MISSING_MOBILE_STYLES',
        line: 0,
        code: 'N/A',
        message: 'Component may lack mobile-specific responsive styles'
      });
    }
  }
  
  // Check for button state management
  if (content.includes('button') && !content.includes('hover:')) {
    issues.push({
      severity: SEVERITY.MEDIUM,
      type: 'MISSING_HOVER_STATE',
      line: 0,
      code: 'N/A',
      message: 'Buttons may lack hover state definitions'
    });
  }
  
  // Check for active state management
  if (content.includes('active') && !content.includes('active:')) {
    issues.push({
      severity: SEVERITY.LOW,
      type: 'MISSING_ACTIVE_STATE',
      line: 0,
      code: 'N/A',
      message: 'Active states may not be properly styled'
    });
  }
  
  // Store results
  auditResults.components[componentPath] = {
    totalIssues: issues.length,
    issues: issues
  };
  
  // Update totals
  auditResults.totalIssues += issues.length;
  issues.forEach(issue => {
    switch (issue.severity) {
      case SEVERITY.CRITICAL:
        auditResults.criticalIssues++;
        break;
      case SEVERITY.HIGH:
        auditResults.highIssues++;
        break;
      case SEVERITY.MEDIUM:
        auditResults.mediumIssues++;
        break;
      case SEVERITY.LOW:
        auditResults.lowIssues++;
        break;
    }
  });
}

/**
 * Generate audit report
 */
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 MOBILE/TABLET COLOR AUDIT REPORT');
  console.log('='.repeat(80) + '\n');
  
  console.log('📈 SUMMARY:');
  console.log(`   Total Issues: ${auditResults.totalIssues}`);
  console.log(`   🔴 Critical: ${auditResults.criticalIssues}`);
  console.log(`   🟠 High: ${auditResults.highIssues}`);
  console.log(`   🟡 Medium: ${auditResults.mediumIssues}`);
  console.log(`   🟢 Low: ${auditResults.lowIssues}\n`);
  
  console.log('📋 COMPONENT BREAKDOWN:\n');
  
  for (const [component, data] of Object.entries(auditResults.components)) {
    if (data.totalIssues === 0) {
      console.log(`✅ ${component}: No issues found`);
      continue;
    }
    
    console.log(`\n❌ ${component}: ${data.totalIssues} issue(s)`);
    console.log('-'.repeat(80));
    
    data.issues.forEach((issue, index) => {
      const severityIcon = {
        [SEVERITY.CRITICAL]: '🔴',
        [SEVERITY.HIGH]: '🟠',
        [SEVERITY.MEDIUM]: '🟡',
        [SEVERITY.LOW]: '🟢'
      }[issue.severity];
      
      console.log(`\n  ${severityIcon} Issue #${index + 1} [${issue.severity}]`);
      console.log(`     Type: ${issue.type}`);
      console.log(`     Line: ${issue.line}`);
      console.log(`     Message: ${issue.message}`);
      if (issue.code !== 'N/A') {
        console.log(`     Code: ${issue.code.substring(0, 100)}${issue.code.length > 100 ? '...' : ''}`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 RECOMMENDATIONS:\n');
  
  if (auditResults.criticalIssues > 0) {
    console.log('🔴 CRITICAL: Fix forbidden colors immediately');
    console.log('   - Replace all non-Bitcoin Sovereign colors');
    console.log('   - Use only #000000 (black), #F7931A (orange), #FFFFFF (white)\n');
  }
  
  if (auditResults.highIssues > 0) {
    console.log('🟠 HIGH: Fix invisible elements');
    console.log('   - Ensure proper contrast between text and backgrounds');
    console.log('   - Avoid white-on-white or black-on-black combinations\n');
  }
  
  if (auditResults.mediumIssues > 0) {
    console.log('🟡 MEDIUM: Add mobile-specific styles');
    console.log('   - Use responsive breakpoints (sm:, md:, lg:)');
    console.log('   - Add hover and active states for interactive elements\n');
  }
  
  console.log('='.repeat(80) + '\n');
  
  // Save report to file
  const reportPath = path.join(__dirname, '..', 'mobile-color-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  console.log(`📄 Full report saved to: ${reportPath}\n`);
}

/**
 * Main audit function
 */
function runAudit() {
  console.log('🔍 Starting Mobile/Tablet Color Audit...\n');
  
  COMPONENTS.forEach(component => {
    console.log(`   Auditing: ${component}`);
    auditComponent(component);
  });
  
  console.log('\n✅ Audit complete!\n');
  generateReport();
}

// Run the audit
runAudit();
