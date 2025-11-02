// Performance monitoring utilities for UCIE mobile optimization

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  tti: number; // Time to Interactive
  tbt: number; // Total Blocking Time
}

export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window === 'undefined') return;
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe paint timing (FCP, LCP)
    if ('PerformanceObserver' in window) {
      try {
        // LCP Observer
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // FID Observer
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // CLS Observer
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.metrics.cls = clsValue;
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }

    // FCP from Navigation Timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime;
      }
    }
  }

  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public logMetrics() {
    console.group('📊 UCIE Performance Metrics');
    console.log('FCP (First Contentful Paint):', this.formatTime(this.metrics.fcp));
    console.log('LCP (Largest Contentful Paint):', this.formatTime(this.metrics.lcp));
    console.log('FID (First Input Delay):', this.formatTime(this.metrics.fid));
    console.log('CLS (Cumulative Layout Shift):', this.metrics.cls?.toFixed(3));
    console.log('TTI (Time to Interactive):', this.formatTime(this.metrics.tti));
    console.groupEnd();

    // Check against targets
    this.checkTargets();
  }

  private checkTargets() {
    const targets = {
      fcp: 1800, // < 1.8s
      lcp: 2500, // < 2.5s
      fid: 100,  // < 100ms
      cls: 0.1,  // < 0.1
      tti: 3000, // < 3s
    };

    console.group('🎯 Performance Target Check');
    
    if (this.metrics.fcp) {
      const fcpStatus = this.metrics.fcp < targets.fcp ? '✅' : '❌';
      console.log(`${fcpStatus} FCP: ${this.formatTime(this.metrics.fcp)} (target: < ${targets.fcp}ms)`);
    }

    if (this.metrics.lcp) {
      const lcpStatus = this.metrics.lcp < targets.lcp ? '✅' : '❌';
      console.log(`${lcpStatus} LCP: ${this.formatTime(this.metrics.lcp)} (target: < ${targets.lcp}ms)`);
    }

    if (this.metrics.fid) {
      const fidStatus = this.metrics.fid < targets.fid ? '✅' : '❌';
      console.log(`${fidStatus} FID: ${this.formatTime(this.metrics.fid)} (target: < ${targets.fid}ms)`);
    }

    if (this.metrics.cls !== undefined) {
      const clsStatus = this.metrics.cls < targets.cls ? '✅' : '❌';
      console.log(`${clsStatus} CLS: ${this.metrics.cls.toFixed(3)} (target: < ${targets.cls})`);
    }

    if (this.metrics.tti) {
      const ttiStatus = this.metrics.tti < targets.tti ? '✅' : '❌';
      console.log(`${ttiStatus} TTI: ${this.formatTime(this.metrics.tti)} (target: < ${targets.tti}ms)`);
    }

    console.groupEnd();
  }

  private formatTime(ms?: number): string {
    if (ms === undefined) return 'N/A';
    return `${ms.toFixed(0)}ms`;
  }

  public measureTTI() {
    if (typeof window === 'undefined') return;

    // Simple TTI estimation: when main thread is idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.metrics.tti = performance.now();
      });
    } else {
      // Fallback: use setTimeout
      setTimeout(() => {
        this.metrics.tti = performance.now();
      }, 0);
    }
  }

  public cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

// Hook for React components
export function usePerformanceMonitor() {
  const monitor = getPerformanceMonitor();

  React.useEffect(() => {
    // Measure TTI when component mounts
    monitor.measureTTI();

    // Log metrics after 5 seconds
    const timer = setTimeout(() => {
      monitor.logMetrics();
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [monitor]);

  return monitor;
}

// Bundle size analyzer
export function analyzeBundleSize() {
  if (typeof window === 'undefined') return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  let totalJS = 0;
  let totalCSS = 0;
  let totalImages = 0;
  let totalFonts = 0;

  resources.forEach((resource) => {
    const size = resource.transferSize || 0;
    
    if (resource.name.endsWith('.js')) {
      totalJS += size;
    } else if (resource.name.endsWith('.css')) {
      totalCSS += size;
    } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      totalImages += size;
    } else if (resource.name.match(/\.(woff|woff2|ttf|otf)$/i)) {
      totalFonts += size;
    }
  });

  console.group('📦 Bundle Size Analysis');
  console.log('JavaScript:', formatBytes(totalJS));
  console.log('CSS:', formatBytes(totalCSS));
  console.log('Images:', formatBytes(totalImages));
  console.log('Fonts:', formatBytes(totalFonts));
  console.log('Total:', formatBytes(totalJS + totalCSS + totalImages + totalFonts));
  console.groupEnd();

  // Check JS bundle size target (< 200KB)
  if (totalJS > 200 * 1024) {
    console.warn(`⚠️ JavaScript bundle exceeds 200KB target: ${formatBytes(totalJS)}`);
  } else {
    console.log(`✅ JavaScript bundle within target: ${formatBytes(totalJS)}`);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Add React import for useEffect
import React from 'react';
