import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { MobileErrorBoundary } from '../components/MobileErrorStates'
import AccessGate from '../components/AccessGate'
import { AuthProvider, useAuth } from '../components/auth/AuthProvider'

// Inner component that uses auth context
function AppContent({ Component, pageProps }: AppProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
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

  // Show access gate if not authenticated
  if (!isAuthenticated) {
    return <AccessGate onAccessGranted={() => {}} />;
  }

  // Show app if authenticated
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
  return (
    <AuthProvider>
      <AppContent {...props} />
    </AuthProvider>
  );
}
