import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { MobileErrorBoundary } from '../components/MobileErrorStates'
import AccessGate from '../components/AccessGate'
import { useState, useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has access in sessionStorage
    const accessGranted = sessionStorage.getItem('hasAccess') === 'true';
    setHasAccess(accessGranted);
    setIsLoading(false);
  }, []);

  const handleAccessGranted = () => {
    setHasAccess(true);
  };

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bitcoin-black flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-large mb-4"></div>
          <p className="text-bitcoin-white-60">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access gate if no access
  if (!hasAccess) {
    return <AccessGate onAccessGranted={handleAccessGranted} />;
  }

  // Show app if access granted
  return (
    <MobileErrorBoundary
      onError={(error) => {
        console.error('Application error:', error);
        // Could send to error reporting service in production
      }}
    >
      <div className="mobile-app-container">
        <Component {...pageProps} />
      </div>
    </MobileErrorBoundary>
  )
}
