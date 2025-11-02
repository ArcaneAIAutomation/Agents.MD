import { useState, useEffect } from 'react';

export interface MobileCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  touchEnabled: boolean;
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';
  prefersReducedMotion: boolean;
  devicePixelRatio: number;
  isLowPowerMode: boolean;
}

export function useUCIEMobile(): MobileCapabilities {
  const [capabilities, setCapabilities] = useState<MobileCapabilities>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 1080,
    touchEnabled: false,
    connectionType: 'unknown',
    prefersReducedMotion: false,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    isLowPowerMode: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateCapabilities = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Determine device type
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      // Check touch support
      const touchEnabled = 
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0;

      // Check connection type
      let connectionType: MobileCapabilities['connectionType'] = 'unknown';
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        if (conn) {
          const effectiveType = conn.effectiveType;
          connectionType = effectiveType || 'unknown';
        }
      }

      // Check reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Check device pixel ratio
      const devicePixelRatio = window.devicePixelRatio || 1;

      // Estimate low power mode (battery API)
      let isLowPowerMode = false;
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          isLowPowerMode = battery.level < 0.2 && !battery.charging;
        });
      }

      setCapabilities({
        isMobile,
        isTablet,
        isDesktop,
        screenWidth: width,
        screenHeight: height,
        touchEnabled,
        connectionType,
        prefersReducedMotion,
        devicePixelRatio,
        isLowPowerMode,
      });
    };

    // Initial check
    updateCapabilities();

    // Listen for resize
    window.addEventListener('resize', updateCapabilities);

    // Listen for connection changes
    if ('connection' in navigator) {
      (navigator as any).connection?.addEventListener('change', updateCapabilities);
    }

    return () => {
      window.removeEventListener('resize', updateCapabilities);
      if ('connection' in navigator) {
        (navigator as any).connection?.removeEventListener('change', updateCapabilities);
      }
    };
  }, []);

  return capabilities;
}

// Hook for adaptive request strategy based on connection
export function useAdaptiveRequestStrategy() {
  const { connectionType, isMobile } = useUCIEMobile();

  const getStrategy = () => {
    // Mobile gets more conservative timeouts
    const mobileMultiplier = isMobile ? 1.5 : 1;

    switch (connectionType) {
      case 'slow-2g':
        return { 
          timeout: 30000 * mobileMultiplier, 
          retries: 1, 
          batchSize: 1,
          enableRealTime: false 
        };
      case '2g':
        return { 
          timeout: 20000 * mobileMultiplier, 
          retries: 2, 
          batchSize: 2,
          enableRealTime: false 
        };
      case '3g':
        return { 
          timeout: 15000 * mobileMultiplier, 
          retries: 3, 
          batchSize: 3,
          enableRealTime: true 
        };
      case '4g':
      case 'wifi':
      default:
        return { 
          timeout: 10000 * mobileMultiplier, 
          retries: 3, 
          batchSize: 5,
          enableRealTime: true 
        };
    }
  };

  return getStrategy();
}
