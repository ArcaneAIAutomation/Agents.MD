import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { MobileErrorBoundary } from '../components/MobileErrorStates'

export default function App({ Component, pageProps }: AppProps) {
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
