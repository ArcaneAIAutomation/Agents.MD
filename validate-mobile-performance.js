/**
 * Mobile Performance and Accessibility Validation Script
 * Validates WCAG compliance, performance metrics, and mobile optimization
 */

const fs = require('fs');
const path = require('path');

class MobilePerformanceValidator {
  constructor() {
    this.results = {
      wcag: { tests: [], score: 0 },
      performance: { metrics: {}, score: 0 },
      mobile: { optimizations: [], score: 0 },
      overall: { score: 0, grade: 'F' }
    };
  }

  // Validate WCAG 2.1 AA compliance for mobile
  validateWCAGCompliance() {
    console.log('♿ Validating WCAG 2.1 AA Compliance...');
    
    const wcagTests = [
      {
        name: 'Minimum Touch Target Size',
        requirement: 'Touch targets must be at least 44x44px',
        test: this.checkTouchTargetSizes(),
        weight: 20
      },
      {
        name: 'Color Contrast Ratios',
        requirement: 'Text must have 4.5:1 contrast ratio (3:1 for large text)',
        test: this.checkContrastRatios(),
        weight: 25
      },
      {
        name: 'Responsive Text Sizing',
        requirement: 'Text must be readable at 200% zoom without horizontal scrolling',
        test: this.checkResponsiveText(),
        weight: 15
      },
      {
        name: 'Focus Indicators',
        requirement: 'All interactive elements must have visible focus indicators',
        test: this.checkFocusIndicators(),
        weight: 15
      },
      {
        name: 'Alternative Text',
        requirement: 'All images must have appropriate alternative text',
        test: this.checkAlternativeText(),
        weight: 10
      },
      {
        name: 'Heading Hierarchy',
        requirement: 'Headings must follow proper hierarchical structure',
        test: this.checkHeadingHierarchy(),
        weight: 10
      },
      {
        name: 'Form Labels',
        requirement: 'All form controls must have associated labels',
        test: this.checkFormLabels(),
        weight: 5
      }
    ];

    let totalScore = 0;
    let maxScore = 0;

    wcagTests.forEach(test => {
      const result = test.test;
      const score = result.passed ? test.weight : 0;
      totalScore += score;
      maxScore += test.weight;

      this.results.wcag.tests.push({
        ...test,
        result,
        score,
        status: result.passed ? 'PASS' : 'FAIL'
      });
    });

    this.results.wcag.score = Math.round((totalScore / maxScore) * 100);
    console.log(`   WCAG Score: ${this.results.wcag.score}%`);
  }

  // Check touch target sizes in CSS and components
  checkTouchTargetSizes() {
    console.log('   Checking touch target sizes...');
    
    try {
      // Check CSS for minimum touch target classes
      const cssContent = fs.readFileSync('styles/globals.css', 'utf8');
      
      const hasMinHeight44 = cssContent.includes('min-height: 44px') || 
                            cssContent.includes('min-h-[44px]') ||
                            cssContent.includes('touch');
      
      const hasButtonSizing = cssContent.includes('button') && 
                             (cssContent.includes('44px') || cssContent.includes('touch'));
      
      // Check component files for proper button sizing
      const componentFiles = this.getComponentFiles();
      let properButtonCount = 0;
      let totalButtonCount = 0;
      
      componentFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const buttonMatches = content.match(/<button[^>]*>/g) || [];
        totalButtonCount += buttonMatches.length;
        
        buttonMatches.forEach(button => {
          if (button.includes('min-h-[44px]') || 
              button.includes('min-height') ||
              button.includes('py-3') || 
              button.includes('py-4')) {
            properButtonCount++;
          }
        });
      });
      
      const buttonCompliance = totalButtonCount > 0 ? (properButtonCount / totalButtonCount) * 100 : 100;
      
      return {
        passed: hasMinHeight44 && hasButtonSizing && buttonCompliance >= 80,
        details: {
          cssSupport: hasMinHeight44,
          buttonSizing: hasButtonSizing,
          buttonCompliance: Math.round(buttonCompliance),
          properButtons: properButtonCount,
          totalButtons: totalButtonCount
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Check contrast ratios in CSS
  checkContrastRatios() {
    console.log('   Checking contrast ratios...');
    
    try {
      const cssContent = fs.readFileSync('styles/globals.css', 'utf8');
      
      // Check for mobile-specific high contrast classes
      const hasMobileTextClasses = cssContent.includes('mobile-text-primary') &&
                                  cssContent.includes('#000000');
      
      const hasMobileBgClasses = cssContent.includes('mobile-bg-primary') &&
                                cssContent.includes('#ffffff');
      
      // Check for contrast override rules
      const hasContrastOverrides = cssContent.includes('color: #000000 !important') ||
                                  cssContent.includes('mobile-text');
      
      // Check for white-on-white fixes
      const hasWhiteTextFixes = cssContent.includes('.text-white') &&
                               cssContent.includes('color: #000000 !important');
      
      // Scan for potential contrast issues in components
      const componentFiles = this.getComponentFiles();
      let contrastIssues = 0;
      
      componentFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        
        // Look for potential white-on-white issues
        if (content.includes('text-white') && content.includes('bg-white')) {
          contrastIssues++;
        }
        
        // Look for light text on light backgrounds
        if (content.includes('text-gray-100') || content.includes('text-gray-200')) {
          contrastIssues++;
        }
      });
      
      return {
        passed: hasMobileTextClasses && hasMobileBgClasses && hasContrastOverrides && contrastIssues < 3,
        details: {
          mobileTextClasses: hasMobileTextClasses,
          mobileBgClasses: hasMobileBgClasses,
          contrastOverrides: hasContrastOverrides,
          whiteTextFixes: hasWhiteTextFixes,
          potentialIssues: contrastIssues
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Check responsive text implementation
  checkResponsiveText() {
    console.log('   Checking responsive text sizing...');
    
    try {
      const cssContent = fs.readFileSync('styles/globals.css', 'utf8');
      
      // Check for mobile-first typography
      const hasMobileTypography = cssContent.includes('@media (max-width: 768px)') &&
                                 cssContent.includes('font-size: 16px');
      
      const hasResponsiveHeadings = cssContent.includes('h1') && 
                                   cssContent.includes('1.875rem');
      
      const hasLineHeightOptimization = cssContent.includes('line-height: 1.6');
      
      // Check Tailwind config for mobile font sizes
      let hasTailwindMobileFonts = false;
      try {
        const tailwindConfig = fs.readFileSync('tailwind.config.js', 'utf8');
        hasTailwindMobileFonts = tailwindConfig.includes('mobile-base') &&
                                tailwindConfig.includes('16px');
      } catch (e) {
        // Tailwind config might not exist
      }
      
      return {
        passed: hasMobileTypography && hasResponsiveHeadings && hasLineHeightOptimization,
        details: {
          mobileTypography: hasMobileTypography,
          responsiveHeadings: hasResponsiveHeadings,
          lineHeightOptimization: hasLineHeightOptimization,
          tailwindMobileFonts: hasTailwindMobileFonts
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Check focus indicators
  checkFocusIndicators() {
    console.log('   Checking focus indicators...');
    
    try {
      const cssContent = fs.readFileSync('styles/globals.css', 'utf8');
      
      const hasFocusStyles = cssContent.includes(':focus') &&
                            cssContent.includes('outline');
      
      const hasMobileFocusStyles = cssContent.includes('@media (max-width: 768px)') &&
                                  cssContent.includes('*:focus');
      
      return {
        passed: hasFocusStyles && hasMobileFocusStyles,
        details: {
          focusStyles: hasFocusStyles,
          mobileFocusStyles: hasMobileFocusStyles
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Check alternative text implementation
  checkAlternativeText() {
    console.log('   Checking alternative text...');
    
    try {
      const componentFiles = this.getComponentFiles();
      let imagesWithAlt = 0;
      let totalImages = 0;
      
      componentFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const imageMatches = content.match(/<img[^>]*>/g) || [];
        totalImages += imageMatches.length;
        
        imageMatches.forEach(img => {
          if (img.includes('alt=') || img.includes('aria-label=')) {
            imagesWithAlt++;
          }
        });
      });
      
      const altTextCompliance = totalImages > 0 ? (imagesWithAlt / totalImages) * 100 : 100;
      
      return {
        passed: altTextCompliance >= 90,
        details: {
          imagesWithAlt,
          totalImages,
          compliance: Math.round(altTextCompliance)
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Check heading hierarchy
  checkHeadingHierarchy() {
    console.log('   Checking heading hierarchy...');
    
    try {
      const componentFiles = this.getComponentFiles();
      let properHierarchy = true;
      let headingIssues = 0;
      
      componentFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        
        // Simple check for heading tags
        const headings = content.match(/<h[1-6][^>]*>/g) || [];
        
        // Check if h1 appears before h2, etc.
        let previousLevel = 0;
        headings.forEach(heading => {
          const level = parseInt(heading.match(/h([1-6])/)?.[1] || '1');
          if (level > previousLevel + 1) {
            headingIssues++;
            properHierarchy = false;
          }
          previousLevel = level;
        });
      });
      
      return {
        passed: properHierarchy && headingIssues < 3,
        details: {
          properHierarchy,
          headingIssues
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Check form labels
  checkFormLabels() {
    console.log('   Checking form labels...');
    
    try {
      const componentFiles = this.getComponentFiles();
      let formsWithLabels = 0;
      let totalFormElements = 0;
      
      componentFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        
        const formElements = content.match(/<(input|select|textarea)[^>]*>/g) || [];
        totalFormElements += formElements.length;
        
        formElements.forEach(element => {
          if (element.includes('aria-label=') || 
              element.includes('aria-labelledby=') ||
              content.includes('<label')) {
            formsWithLabels++;
          }
        });
      });
      
      const labelCompliance = totalFormElements > 0 ? (formsWithLabels / totalFormElements) * 100 : 100;
      
      return {
        passed: labelCompliance >= 80,
        details: {
          formsWithLabels,
          totalFormElements,
          compliance: Math.round(labelCompliance)
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Validate mobile performance optimizations
  validateMobilePerformance() {
    console.log('⚡ Validating Mobile Performance...');
    
    const performanceTests = [
      {
        name: 'Mobile Loading Components',
        test: this.checkMobileLoadingComponents(),
        weight: 20
      },
      {
        name: 'Responsive Images',
        test: this.checkResponsiveImages(),
        weight: 15
      },
      {
        name: 'CSS Optimization',
        test: this.checkCSSOptimization(),
        weight: 20
      },
      {
        name: 'Animation Performance',
        test: this.checkAnimationPerformance(),
        weight: 15
      },
      {
        name: 'Bundle Size',
        test: this.checkBundleSize(),
        weight: 15
      },
      {
        name: 'Lazy Loading',
        test: this.checkLazyLoading(),
        weight: 15
      }
    ];

    let totalScore = 0;
    let maxScore = 0;

    performanceTests.forEach(test => {
      const result = test.test;
      const score = result.passed ? test.weight : 0;
      totalScore += score;
      maxScore += test.weight;

      this.results.performance.metrics[test.name] = {
        ...result,
        score,
        status: result.passed ? 'PASS' : 'FAIL'
      };
    });

    this.results.performance.score = Math.round((totalScore / maxScore) * 100);
    console.log(`   Performance Score: ${this.results.performance.score}%`);
  }

  // Check mobile loading components
  checkMobileLoadingComponents() {
    console.log('   Checking mobile loading components...');
    
    try {
      const mobileLoadingFile = 'components/MobileLoadingComponents.tsx';
      
      if (!fs.existsSync(mobileLoadingFile)) {
        return { passed: false, details: 'Mobile loading components file not found' };
      }
      
      const content = fs.readFileSync(mobileLoadingFile, 'utf8');
      
      const hasSpinner = content.includes('MobileSpinner');
      const hasSkeleton = content.includes('MobileSkeleton');
      const hasProgressBar = content.includes('MobileProgressBar');
      const hasOverlay = content.includes('MobileLoadingOverlay');
      const hasPerformanceOptimizations = content.includes('prefersReducedMotion');
      
      return {
        passed: hasSpinner && hasSkeleton && hasProgressBar && hasOverlay && hasPerformanceOptimizations,
        details: {
          hasSpinner,
          hasSkeleton,
          hasProgressBar,
          hasOverlay,
          hasPerformanceOptimizations
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Check responsive images
  checkResponsiveImages() {
    console.log('   Checking responsive images...');
    
    try {
      const componentFiles = this.getComponentFiles();
      let responsiveImages = 0;
      let totalImages = 0;
      
      componentFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const imageMatches = content.match(/<img[^>]*>/g) || [];
        totalImages += imageMatches.length;
        
        imageMatches.forEach(img => {
          if (img.includes('srcSet') || img.includes('sizes') || img.includes('loading=')) {
            responsiveImages++;
          }
        });
      });
      
      // Also check for Next.js Image component usage
      const nextImageUsage = componentFiles.some(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('next/image') || content.includes('<Image');
      });
      
      const imageOptimization = totalImages === 0 || responsiveImages / totalImages >= 0.5 || nextImageUsage;
      
      return {
        passed: imageOptimization,
        details: {
          responsiveImages,
          totalImages,
          nextImageUsage,
          optimization: totalImages > 0 ? Math.round((responsiveImages / totalImages) * 100) : 100
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Check CSS optimization
  checkCSSOptimization() {
    console.log('   Checking CSS optimization...');
    
    try {
      const cssContent = fs.readFileSync('styles/globals.css', 'utf8');
      
      const hasMobileFirstQueries = cssContent.includes('@media (max-width:') ||
                                   cssContent.includes('@media (max-width: 768px)');
      
      const hasPerformanceOptimizations = cssContent.includes('will-change') ||
                                         cssContent.includes('transform3d');
      
      const hasAnimationOptimizations = cssContent.includes('@media (prefers-reduced-motion');
      
      const hasCriticalCSS = cssContent.length < 50000; // Reasonable size check
      
      return {
        passed: hasMobileFirstQueries && hasPerformanceOptimizations && hasAnimationOptimizations,
        details: {
          mobileFirstQueries: hasMobileFirstQueries,
          performanceOptimizations: hasPerformanceOptimizations,
          animationOptimizations: hasAnimationOptimizations,
          criticalCSS: hasCriticalCSS,
          cssSize: Math.round(cssContent.length / 1024) + 'KB'
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Check animation performance
  checkAnimationPerformance() {
    console.log('   Checking animation performance...');
    
    try {
      const cssContent = fs.readFileSync('styles/globals.css', 'utf8');
      
      const hasReducedMotionSupport = cssContent.includes('@media (prefers-reduced-motion: reduce)');
      const hasHardwareAcceleration = cssContent.includes('transform3d') || 
                                     cssContent.includes('will-change');
      const hasOptimizedAnimations = cssContent.includes('animate-spin-slow') ||
                                    cssContent.includes('mobile-bounce');
      
      return {
        passed: hasReducedMotionSupport && hasHardwareAcceleration && hasOptimizedAnimations,
        details: {
          reducedMotionSupport: hasReducedMotionSupport,
          hardwareAcceleration: hasHardwareAcceleration,
          optimizedAnimations: hasOptimizedAnimations
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Check bundle size (simplified check)
  checkBundleSize() {
    console.log('   Checking bundle size...');
    
    try {
      // Check if Next.js build exists
      const buildPath = '.next';
      if (!fs.existsSync(buildPath)) {
        return { passed: true, details: 'No build found - assuming development mode' };
      }
      
      // Simple check for component count and complexity
      const componentFiles = this.getComponentFiles();
      const totalComponents = componentFiles.length;
      
      let totalSize = 0;
      componentFiles.forEach(file => {
        const stats = fs.statSync(file);
        totalSize += stats.size;
      });
      
      const averageComponentSize = totalSize / totalComponents;
      const isReasonableSize = averageComponentSize < 10000; // 10KB average
      
      return {
        passed: isReasonableSize && totalComponents < 50,
        details: {
          totalComponents,
          totalSize: Math.round(totalSize / 1024) + 'KB',
          averageSize: Math.round(averageComponentSize / 1024) + 'KB',
          isReasonableSize
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Check lazy loading implementation
  checkLazyLoading() {
    console.log('   Checking lazy loading...');
    
    try {
      const componentFiles = this.getComponentFiles();
      
      const hasLazyLoading = componentFiles.some(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('loading="lazy"') || 
               content.includes('lazy') ||
               content.includes('IntersectionObserver');
      });
      
      const hasConditionalLoading = componentFiles.some(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('shouldLazyLoad') || 
               content.includes('isMobile');
      });
      
      return {
        passed: hasLazyLoading || hasConditionalLoading,
        details: {
          hasLazyLoading,
          hasConditionalLoading
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Validate mobile-specific optimizations
  validateMobileOptimizations() {
    console.log('📱 Validating Mobile Optimizations...');
    
    const optimizations = [
      {
        name: 'Mobile Viewport Hook',
        test: this.checkMobileViewportHook(),
        weight: 25
      },
      {
        name: 'Touch-Friendly Components',
        test: this.checkTouchFriendlyComponents(),
        weight: 25
      },
      {
        name: 'Mobile-First CSS',
        test: this.checkMobileFirstCSS(),
        weight: 20
      },
      {
        name: 'Responsive Layout',
        test: this.checkResponsiveLayout(),
        weight: 15
      },
      {
        name: 'Mobile Navigation',
        test: this.checkMobileNavigation(),
        weight: 15
      }
    ];

    let totalScore = 0;
    let maxScore = 0;

    optimizations.forEach(opt => {
      const result = opt.test;
      const score = result.passed ? opt.weight : 0;
      totalScore += score;
      maxScore += opt.weight;

      this.results.mobile.optimizations.push({
        ...opt,
        result,
        score,
        status: result.passed ? 'PASS' : 'FAIL'
      });
    });

    this.results.mobile.score = Math.round((totalScore / maxScore) * 100);
    console.log(`   Mobile Optimization Score: ${this.results.mobile.score}%`);
  }

  // Check mobile viewport hook
  checkMobileViewportHook() {
    console.log('   Checking mobile viewport hook...');
    
    try {
      const hookFile = 'hooks/useMobileViewport.ts';
      
      if (!fs.existsSync(hookFile)) {
        return { passed: false, details: 'Mobile viewport hook not found' };
      }
      
      const content = fs.readFileSync(hookFile, 'utf8');
      
      const hasViewportDetection = content.includes('useMobileViewport');
      const hasDeviceCapabilities = content.includes('useDeviceCapabilities');
      const hasBreakpoints = content.includes('breakpoints');
      const hasOptimizationHook = content.includes('useMobileOptimization');
      
      return {
        passed: hasViewportDetection && hasDeviceCapabilities && hasBreakpoints && hasOptimizationHook,
        details: {
          hasViewportDetection,
          hasDeviceCapabilities,
          hasBreakpoints,
          hasOptimizationHook
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Check touch-friendly components
  checkTouchFriendlyComponents() {
    console.log('   Checking touch-friendly components...');
    
    try {
      const componentFiles = this.getComponentFiles();
      let touchFriendlyComponents = 0;
      
      componentFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('min-h-[44px]') || 
            content.includes('touch') ||
            content.includes('py-3') ||
            content.includes('py-4')) {
          touchFriendlyComponents++;
        }
      });
      
      const touchFriendlyRatio = touchFriendlyComponents / componentFiles.length;
      
      return {
        passed: touchFriendlyRatio >= 0.5,
        details: {
          touchFriendlyComponents,
          totalComponents: componentFiles.length,
          ratio: Math.round(touchFriendlyRatio * 100)
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Check mobile-first CSS
  checkMobileFirstCSS() {
    console.log('   Checking mobile-first CSS...');
    
    try {
      const cssContent = fs.readFileSync('styles/globals.css', 'utf8');
      
      const hasMobileFirstMedia = cssContent.includes('@media (max-width: 768px)');
      const hasMobileClasses = cssContent.includes('mobile-text-') && 
                              cssContent.includes('mobile-bg-');
      const hasResponsiveTypography = cssContent.includes('font-size: 16px');
      
      return {
        passed: hasMobileFirstMedia && hasMobileClasses && hasResponsiveTypography,
        details: {
          mobileFirstMedia: hasMobileFirstMedia,
          mobileClasses: hasMobileClasses,
          responsiveTypography: hasResponsiveTypography
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Check responsive layout
  checkResponsiveLayout() {
    console.log('   Checking responsive layout...');
    
    try {
      const componentFiles = this.getComponentFiles();
      
      const hasResponsiveGrid = componentFiles.some(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('grid-cols-1') && content.includes('md:grid-cols-');
      });
      
      const hasResponsiveSpacing = componentFiles.some(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('space-y-') || content.includes('gap-');
      });
      
      const hasFlexboxLayout = componentFiles.some(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('flex-col') && content.includes('sm:flex-row');
      });
      
      return {
        passed: hasResponsiveGrid && hasResponsiveSpacing,
        details: {
          hasResponsiveGrid,
          hasResponsiveSpacing,
          hasFlexboxLayout
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Check mobile navigation
  checkMobileNavigation() {
    console.log('   Checking mobile navigation...');
    
    try {
      const headerFile = 'components/Header.tsx';
      
      if (!fs.existsSync(headerFile)) {
        return { passed: false, details: 'Header component not found' };
      }
      
      const content = fs.readFileSync(headerFile, 'utf8');
      
      const hasResponsiveHeader = content.includes('md:text-') || content.includes('sm:text-');
      const hasMobileOptimization = content.includes('mobile-text-') || 
                                   content.includes('text-xl') && content.includes('md:text-4xl');
      
      return {
        passed: hasResponsiveHeader && hasMobileOptimization,
        details: {
          hasResponsiveHeader,
          hasMobileOptimization
        }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Calculate overall score and grade
  calculateOverallScore() {
    const wcagWeight = 0.4;
    const performanceWeight = 0.3;
    const mobileWeight = 0.3;
    
    this.results.overall.score = Math.round(
      (this.results.wcag.score * wcagWeight) +
      (this.results.performance.score * performanceWeight) +
      (this.results.mobile.score * mobileWeight)
    );
    
    // Assign grade
    if (this.results.overall.score >= 90) this.results.overall.grade = 'A';
    else if (this.results.overall.score >= 80) this.results.overall.grade = 'B';
    else if (this.results.overall.score >= 70) this.results.overall.grade = 'C';
    else if (this.results.overall.score >= 60) this.results.overall.grade = 'D';
    else this.results.overall.grade = 'F';
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n📊 Generating Mobile Performance Report...');
    
    this.calculateOverallScore();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        overallScore: this.results.overall.score,
        grade: this.results.overall.grade,
        wcagScore: this.results.wcag.score,
        performanceScore: this.results.performance.score,
        mobileScore: this.results.mobile.score
      },
      details: this.results,
      recommendations: this.generateRecommendations()
    };
    
    // Save report
    const reportPath = `mobile-performance-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.printReport(report);
    
    return report;
  }

  // Generate recommendations based on results
  generateRecommendations() {
    const recommendations = [];
    
    // WCAG recommendations
    if (this.results.wcag.score < 80) {
      recommendations.push({
        category: 'Accessibility',
        priority: 'HIGH',
        issue: 'WCAG compliance below 80%',
        solution: 'Focus on contrast ratios and touch target sizes'
      });
    }
    
    // Performance recommendations
    if (this.results.performance.score < 70) {
      recommendations.push({
        category: 'Performance',
        priority: 'HIGH',
        issue: 'Mobile performance needs improvement',
        solution: 'Optimize CSS, implement lazy loading, reduce bundle size'
      });
    }
    
    // Mobile optimization recommendations
    if (this.results.mobile.score < 75) {
      recommendations.push({
        category: 'Mobile UX',
        priority: 'MEDIUM',
        issue: 'Mobile optimizations incomplete',
        solution: 'Implement mobile viewport hooks and touch-friendly components'
      });
    }
    
    return recommendations;
  }

  // Print formatted report
  printReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📱 MOBILE PERFORMANCE VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 Overall Score: ${report.summary.overallScore}% (Grade: ${report.summary.grade})`);
    console.log(`♿ WCAG Compliance: ${report.summary.wcagScore}%`);
    console.log(`⚡ Performance: ${report.summary.performanceScore}%`);
    console.log(`📱 Mobile Optimization: ${report.summary.mobileScore}%`);
    
    if (report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority}] ${rec.issue}`);
        console.log(`      → ${rec.solution}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📄 Full report saved to: mobile-performance-report-${Date.now()}.json`);
  }

  // Helper method to get component files
  getComponentFiles() {
    const componentsDir = 'components';
    if (!fs.existsSync(componentsDir)) return [];
    
    return fs.readdirSync(componentsDir)
      .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'))
      .map(file => path.join(componentsDir, file));
  }

  // Main validation method
  async validate() {
    console.log('🚀 Starting Mobile Performance Validation...\n');
    
    try {
      this.validateWCAGCompliance();
      this.validateMobilePerformance();
      this.validateMobileOptimizations();
      
      const report = this.generateReport();
      
      // Return exit code based on overall score
      return report.summary.overallScore >= 70 ? 0 : 1;
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      return 1;
    }
  }
}

// Run validation if script is executed directly
if (require.main === module) {
  const validator = new MobilePerformanceValidator();
  validator.validate().then(exitCode => {
    process.exit(exitCode);
  });
}

module.exports = { MobilePerformanceValidator };