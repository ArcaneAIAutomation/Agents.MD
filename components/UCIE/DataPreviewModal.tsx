/**
 * UCIE Data Preview Modal
 * 
 * Displays collected data summary before Caesar AI analysis
 * Gives users option to Continue or Cancel
 */

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import DataSourceExpander from './DataSourceExpander';

interface DataPreviewModalProps {
  symbol: string;
  isOpen: boolean;
  onContinue: (previewData: DataPreview) => void; // ✅ Pass preview data to Caesar
  onCancel: () => void;
}

interface DataPreview {
  symbol: string;
  timestamp: string;
  dataQuality: number;
  summary: string;
  collectedData: {
    marketData: any;
    sentiment: any;
    technical: any;
    news: any;
    onChain: any;
  };
  apiStatus: {
    working: string[];
    failed: string[];
    total: number;
    successRate: number;
  };
}

export default function DataPreviewModal({
  symbol,
  isOpen,
  onContinue,
  onCancel
}: DataPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<DataPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && symbol) {
      fetchDataPreview();
    }
  }, [isOpen, symbol]);

  const fetchDataPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      // ✅ FORCE FRESH DATA: Always fetch fresh data when user clicks BTC/ETH
      // Add timestamp to prevent any caching
      const timestamp = Date.now();
      
      // ✅ EXTENDED TIMEOUT: 70 seconds to allow for 3 retries (3 x 10s) + delays (2 x 10s) + processing (10s)
      // This ensures the automatic retry logic has time to complete
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 70000); // 70 seconds
      
      console.log(`🔄 Fetching data with 70-second timeout (allows 3 automatic retries)...`);
      
      const response = await fetch(`/api/ucie/preview-data/${symbol}?refresh=true&t=${timestamp}`, {
        credentials: 'include', // Required for authentication cookie
        cache: 'no-store', // Prevent browser caching
        signal: controller.signal, // ✅ Add timeout signal
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setPreview(data.data);
        console.log('✅ Preview data loaded:', {
          dataQuality: data.data.dataQuality,
          sources: data.data.apiStatus.working.length,
          attempts: data.data.retryInfo?.attempts || 1,
          timestamp: data.data.timestamp
        });
      } else {
        setError(data.error || 'Failed to load data preview');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(`Failed to fetch data preview: ${errorMessage}`);
      console.error('Data preview error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bitcoin-black bg-opacity-90 p-4">
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-[0_0_40px_rgba(247,147,26,0.5)]">
        {/* Header */}
        <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-bitcoin-white">
              Data Collection Preview
            </h2>
            <p className="text-sm text-bitcoin-white-60 mt-1">
              Review collected data before proceeding with Caesar AI analysis
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-bitcoin-orange border-t-transparent"></div>
              <p className="text-bitcoin-white-80 mt-4">
                Collecting data from {symbol}...
              </p>
              <p className="text-bitcoin-white-60 text-sm mt-2">
                This may take 20-60 seconds
              </p>
              <p className="text-bitcoin-white-60 text-xs mt-1">
                Automatic retry system ensures 100% data collection
              </p>
            </div>
          )}

          {error && (
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-8 text-center">
              <XCircle className="mx-auto text-bitcoin-orange mb-4" size={64} />
              <h3 className="text-2xl font-bold text-bitcoin-white mb-3">
                Data Collection Error
              </h3>
              <p className="text-bitcoin-white-80 text-lg mb-4">
                {error}
              </p>
              <p className="text-bitcoin-white-60 mb-6">
                Please try again or contact support if the issue persists.
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={onCancel}
                  className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] min-h-[48px]"
                >
                  ← Go Back
                </button>
                <button
                  onClick={fetchDataPreview}
                  className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-8 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[48px]"
                >
                  Retry Collection
                </button>
              </div>
            </div>
          )}

          {preview && !loading && !error && (
            <div className="space-y-6">
              {/* Data Quality Score */}
              <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-bitcoin-white">
                    Data Quality Score
                  </h3>
                  <span className={`text-3xl font-mono font-bold ${
                    preview.dataQuality >= 80 ? 'text-bitcoin-orange' :
                    preview.dataQuality >= 60 ? 'text-bitcoin-white' :
                    'text-bitcoin-white-60'
                  }`}>
                    {preview.dataQuality}%
                  </span>
                </div>
                <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-bitcoin-orange h-full transition-all duration-500"
                    style={{ width: `${preview.dataQuality}%` }}
                  />
                </div>
                <p className="text-sm text-bitcoin-white-60 mt-2">
                  {preview.apiStatus.working.length} of {preview.apiStatus.total} data sources available
                </p>
              </div>

              {/* API Status */}
              <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                <h3 className="text-lg font-bold text-bitcoin-white mb-3">
                  Data Sources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {preview.apiStatus.working.map((api) => (
                    <div key={api} className="flex items-center gap-2">
                      <CheckCircle className="text-bitcoin-orange flex-shrink-0" size={20} />
                      <span className="text-bitcoin-white-80 capitalize">
                        {api.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  ))}
                  {preview.apiStatus.failed.map((api) => (
                    <div key={api} className="flex items-center gap-2">
                      <XCircle className="text-bitcoin-white-60 flex-shrink-0" size={20} />
                      <span className="text-bitcoin-white-60 capitalize line-through">
                        {api.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Overview */}
              {preview.collectedData.marketData?.success && preview.collectedData.marketData?.priceAggregation && (
                <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-bitcoin-white mb-3">
                    Market Overview
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-1">
                        Price
                      </p>
                      <p className="text-xl font-mono font-bold text-bitcoin-orange">
                        ${preview.collectedData.marketData.priceAggregation.averagePrice?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-1">
                        24h Change
                      </p>
                      <p className={`text-xl font-mono font-bold flex items-center gap-1 ${
                        (preview.collectedData.marketData.priceAggregation.averageChange24h || 0) > 0
                          ? 'text-bitcoin-orange'
                          : (preview.collectedData.marketData.priceAggregation.averageChange24h || 0) < 0
                          ? 'text-bitcoin-white-60'
                          : 'text-bitcoin-white'
                      }`}>
                        {(preview.collectedData.marketData.priceAggregation.averageChange24h || 0) > 0 && <TrendingUp size={20} />}
                        {(preview.collectedData.marketData.priceAggregation.averageChange24h || 0) < 0 && <TrendingDown size={20} />}
                        {(preview.collectedData.marketData.priceAggregation.averageChange24h || 0) === 0 && <Minus size={20} />}
                        {preview.collectedData.marketData.priceAggregation.averageChange24h?.toFixed(2) || 'N/A'}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-1">
                        Volume 24h
                      </p>
                      <p className="text-xl font-mono font-bold text-bitcoin-white">
                        ${((preview.collectedData.marketData.priceAggregation.totalVolume24h || 0) / 1e9)?.toFixed(2) || 'N/A'}B
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-1">
                        Market Cap
                      </p>
                      <p className="text-xl font-mono font-bold text-bitcoin-white">
                        ${((preview.collectedData.marketData.marketData?.marketCap || 0) / 1e9)?.toFixed(2) || 'N/A'}B
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Summary */}
              <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4">
                <h3 className="text-lg font-bold text-bitcoin-white mb-3 flex items-center gap-2">
                  <span className="text-bitcoin-orange">🤖</span>
                  AI Summary
                </h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-bitcoin-white-80 whitespace-pre-wrap leading-relaxed">
                    {preview.summary}
                  </p>
                </div>
              </div>

              {/* Data Source Expander */}
              <DataSourceExpander
                collectedData={preview.collectedData}
                apiStatus={preview.apiStatus}
              />

              {/* What Happens Next */}
              <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                <h3 className="text-lg font-bold text-bitcoin-white mb-3">
                  What Happens Next?
                </h3>
                <ul className="space-y-2 text-bitcoin-white-80">
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">•</span>
                    <span>
                      <strong className="text-bitcoin-white">Caesar AI Deep Analysis</strong> will use this data as context
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">•</span>
                    <span>
                      Research will take <strong className="text-bitcoin-white">5-7 minutes</strong> to complete
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">•</span>
                    <span>
                      You'll receive comprehensive analysis on technology, team, partnerships, risks, and more
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">•</span>
                    <span>
                      All findings will be backed by <strong className="text-bitcoin-white">source citations</strong>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {preview && !loading && !error && (
          <div className="border-t-2 border-bitcoin-orange bg-bitcoin-black px-6 py-4 flex items-center justify-between gap-4">
            <button
              onClick={onCancel}
              className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] min-h-[48px]"
            >
              Cancel Analysis
            </button>
            <button
              onClick={() => preview && onContinue(preview)}
              disabled={preview.dataQuality < 80}
              className={`font-bold uppercase tracking-wider px-8 py-3 rounded-lg transition-all min-h-[48px] ${
                preview.dataQuality < 80
                  ? 'bg-bitcoin-black text-bitcoin-white-60 border-2 border-bitcoin-white-60 cursor-not-allowed opacity-50'
                  : 'bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95'
              }`}
              title={preview.dataQuality < 80 ? 'Data quality must be at least 80% to continue' : 'Continue with Caesar AI Analysis'}
            >
              {preview.dataQuality < 80 ? (
                <>
                  <AlertCircle className="inline-block mr-2" size={20} />
                  Insufficient Data ({preview.dataQuality}%)
                </>
              ) : (
                'Continue with Caesar AI Analysis →'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
