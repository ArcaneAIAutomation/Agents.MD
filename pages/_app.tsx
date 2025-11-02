import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { MobileErrorBoundary } from '../components/MobileErrorStates'
import AccessGate from '../components/AccessGate'
import { AuthProvider, useAuth } from '../components/auth/AuthProvider'
import { useEffect } from 'react'
import { initCSSValidation } from '../utils/cssValidation'

// Inner component that uses auth context
function AppContent({ Component, pageProps, router }: AppProps & { router: any }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Public pages that don't require authentication
  const publicPages: string[] = [
    '/verify-email',
    '/resend-verification'
  ];
  const isPublicPage = publicPages.includes(router.pathname);

  // Show loading state while checking authentication (skip for public pages)
  if (isLoading && !isPublicPage) {
    return (
      <div className="min-h-screen bg-bitcoin-black flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-large mb-4"></div>
          <p className="text-bitcoin-white-60">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access gate if not authenticated (skip for public pages)
  if (!isAuthenticated && !isPublicPage) {
    return <AccessGate onAccessGranted={() => {}} />;
  }

  // Show app if authenticated or on public page
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
  );
}

// Main App component wrapped with AuthProvider
export default function App(props: AppProps) {
  // Initialize CSS validation system on mount
  useEffect(() => {
    initCSSValidation();
  }, []);

  return (
    <AuthProvider>
      <AppContent {...props} router={props.router} />
    </AuthProvider>
  );
}
