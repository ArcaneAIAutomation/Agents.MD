/**
 * Mobile/Tablet Compliance Validation Script
 * Validates Bitcoin Sovereign color compliance and mobile optimizations
 */

const fs = require('fs');
const path = require('path');

// Bitcoin Sovereign Color Palette
const ALLOWED_COLORS = {
  black: '#000000',
  orange: '#F7931A',
  white: '#FFFFFF',
  orangeVariants: [
    'rgba(247, 147, 26, 0.05)',
    'rgba(247, 147, 26, 0.1)',
    'rgba(247, 147, 26, 0.2)',
    'rgba(247, 147, 26, 0.3)',
    'rgba(247, 147, 26, 0.5)',
    'rgba(247, 147, 26, 0.8)'
  ],
  whiteVariants: [
    'rgba(255, 255, 255, 0.6)',
    'rgba(255, 255, 255, 0.8)',
    'rgba(255, 255, 255, 0.9)'
  ]
};

// Forbidden color patterns
const FORBIDDEN_PATTERNS = [
  /rgb\(0,\s*128,\s*0\)/gi,      // Green
  /rgb\(255,\s*0,\s*0\)/gi,      // Red
  /rgb\(0,\s*0,\s*255\)/gi,      // Blue
  /rgb\(128,\s*0,\s*128\)/gi,    // Purple
  /rgb\(255,\s*255,\s*0\)/gi,    // Yellow
  /#00ff00/gi,                    // Green hex
  /#ff0000/gi,                    // Red hex
  /#0000ff/gi,                    // Blue hex
  /#800080/gi,                    // Purple hex
  /#ffff00/gi                     // Yellow hex
];

// Test results
const results = {
  totalFiles: 0,
  passedFiles: 0,
  failedFiles: 0,
  issues: [],
  summary: {
    colorViolations: 0,
    mobileOptimizations: 0,
    contrastIssues: 0,
    touchTargetIssues: 0
  }
};

/**
 * Check file for color compliance
 */
function checkColorCompliance(filePath, content) {
  const issues = [];
  
  // Check for forbidden colors
  FORBIDDEN_PATTERNS.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        file: filePath,
        type: 'FORBIDDEN_COLOR',
        severity: 'HIGH',
        message: `Forbidden color found: ${matches[0]}`,
        line: getLineNumber(content, matches.index)
      });
      results.summary.colorViolations++;
    }
  });
  
  return issues;
}

/**
 * Check for mobile optimizations
 */
function checkMobileOptimizations(filePath, content) {
  const issues = [];
  
  // Check for mobile media queries
  if (!content.includes('@media (max-width: 1023px)') && 
      !content.includes('@media (max-width: 768px)')) {
    issues.push({
      file: filePath,
      type: 'MISSING_MOBILE_QUERY',
      severity: 'MEDIUM',
      message: 'No mobile-specific media queries found'
    });
    results.summary.mobileOptimizations++;
  }
  
  // Check for touch target sizes
  if (content.includes('min-height') && !content.includes('min-height: 48px')) {
    issues.push({
      file: filePath,
      type: 'TOUCH_TARGET',
      severity: 'MEDIUM',
      message: 'Touch targets should be minimum 48px'
    });
    results.summary.touchTargetIssues++;
  }
  
  return issues;
}

/**
 * Get line number from index
 */
function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

/**
 * Scan directory for files
 */
function scanDirectory(dir, extensions = ['.tsx', '.ts', '.css', '.jsx', '.js']) {
  const files = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .next, .git
        if (!['node_modules', '.next', '.git', 'backups'].includes(item)) {
          scan(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    });
  }
  
  scan(dir);
  return files;
}

/**
 * Main validation function
 */
function validateCompliance() {
  console.log('🧪 Starting Mobile/Tablet Compliance Validation...\n');
  
  const projectRoot = process.cwd();
  const files = scanDirectory(projectRoot);
  
  results.totalFiles = files.length;
  console.log(`📁 Found ${files.length} files to check\n`);
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const relPath = path.relative(projectRoot, file);
    
    // Run checks
    const colorIssues = checkColorCompliance(relPath, content);
    const mobileIssues = checkMobileOptimizations(relPath, content);
    
    const allIssues = [...colorIssues, ...mobileIssues];
    
    if (allIssues.length > 0) {
      results.failedFiles++;
      results.issues.push(...allIssues);
    } else {
      results.passedFiles++;
    }
  });
  
  // Print results
  console.log('📊 Validation Results:\n');
  console.log(`✅ Passed: ${results.passedFiles} files`);
  console.log(`❌ Failed: ${results.failedFiles} files`);
  console.log(`📝 Total Issues: ${results.issues.length}\n`);
  
  console.log('🔍 Issue Summary:');
  console.log(`   Color Violations: ${results.summary.colorViolations}`);
  console.log(`   Mobile Optimizations: ${results.summary.mobileOptimizations}`);
  console.log(`   Contrast Issues: ${results.summary.contrastIssues}`);
  console.log(`   Touch Target Issues: ${results.summary.touchTargetIssues}\n`);
  
  // Print detailed issues
  if (results.issues.length > 0) {
    console.log('⚠️  Detailed Issues:\n');
    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity}] ${issue.type}`);
      console.log(`   File: ${issue.file}`);
      console.log(`   Message: ${issue.message}`);
      if (issue.line) {
        console.log(`   Line: ${issue.line}`);
      }
      console.log('');
    });
  }
  
  // Save report
  const reportPath = path.join(projectRoot, 'mobile-tablet-compliance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Full report saved to: ${reportPath}\n`);
  
  // Exit with appropriate code
  process.exit(results.failedFiles > 0 ? 1 : 0);
}

// Run validation
validateCompliance();
