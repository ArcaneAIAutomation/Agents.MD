import React from 'react';
import { Activity, AlertCircle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface DataQualityIndicatorsProps {
  dataQualityScore: number;
  apiReliability: {
    cmc: number;
    coingecko: number;
    kraken: number;
    blockchain: number;
    lunarcrush: number;
  };
  anomalyCount: number;
  className?: string;
}

export default function DataQualityIndicators({
  dataQualityScore,
  apiReliability,
  anomalyCount,
  className = ''
}: DataQualityIndicatorsProps) {
  const getQualityStatus = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-bitcoin-orange', icon: CheckCircle };
    if (score >= 70) return { label: 'Good', color: 'text-bitcoin-orange', icon: CheckCircle };
    if (score >= 50) return { label: 'Fair', color: 'text-bitcoin-white-80', icon: AlertCircle };
    return { label: 'Poor', color: 'text-bitcoin-white-60', icon: XCircle };
  };

  const getReliabilityStatus = (reliability: number) => {
    if (reliability >= 95) return { color: 'text-bitcoin-orange', bg: 'bg-bitcoin-orange' };
    if (reliability >= 85) return { color: 'text-bitcoin-white', bg: 'bg-bitcoin-white' };
    return { color: 'text-bitcoin-white-60', bg: 'bg-bitcoin-white-60' };
  };

  const qualityStatus = getQualityStatus(dataQualityScore);
  const QualityIcon = qualityStatus.icon;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Data Quality */}
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h3 className="text-lg font-bold text-bitcoin-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-bitcoin-orange" />
          Data Quality Score
        </h3>
        
        <div className="space-y-4">
          {/* Quality Score Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <QualityIcon className={`w-5 h-5 ${qualityStatus.color}`} />
                <span className={`text-sm font-semibold ${qualityStatus.color}`}>
                  {qualityStatus.label}
                </span>
              </div>
              <span className="font-mono text-2xl font-bold text-bitcoin-orange">
                {dataQualityScore}%
              </span>
            </div>
            
            <div className="relative w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-6 overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-bitcoin-orange transition-all duration-500 ease-out"
                style={{ width: `${dataQualityScore}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-bitcoin-orange opacity-50"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-bitcoin-white mix-blend-difference">
                  {dataQualityScore >= 70 ? 'READY FOR TRADE GENERATION' : 'INSUFFICIENT QUALITY'}
                </span>
              </div>
            </div>
          </div>

          {/* Quality Threshold Indicator */}
          <div className="flex items-center gap-2 text-sm">
            {dataQualityScore >= 70 ? (
              <>
                <CheckCircle className="w-4 h-4 text-bitcoin-orange" />
                <span className="text-bitcoin-white-80">
                  Quality meets minimum threshold (70%)
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-bitcoin-orange" />
                <span className="text-bitcoin-white-80">
                  Quality below minimum threshold (70% required)
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* API Reliability Grid */}
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h3 className="text-lg font-bold text-bitcoin-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-bitcoin-orange" />
          API Reliability
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(apiReliability).map(([api, reliability]) => {
            const status = getReliabilityStatus(reliability);
            return (
              <div
                key={api}
                className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4 transition-all hover:border-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.2)]"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-2">
                  {api.toUpperCase()}
                </p>
                
                {/* Reliability Bar */}
                <div className="mb-2">
                  <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${status.bg} transition-all duration-500`}
                      style={{ width: `${reliability}%` }}
                    />
                  </div>
                </div>
                
                <p className={`font-mono text-lg font-bold ${status.color}`}>
                  {reliability.toFixed(1)}%
                </p>
                
                {/* Status Indicator */}
                <div className="mt-2 flex items-center gap-1">
                  {reliability >= 95 ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-bitcoin-orange" />
                      <span className="text-xs text-bitcoin-white-60">Excellent</span>
                    </>
                  ) : reliability >= 85 ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-bitcoin-white-80" />
                      <span className="text-xs text-bitcoin-white-60">Good</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-bitcoin-white-60" />
                      <span className="text-xs text-bitcoin-white-60">Degraded</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Anomaly Counter */}
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h3 className="text-lg font-bold text-bitcoin-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-bitcoin-orange" />
          System Anomalies
        </h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-bitcoin-white-60 mb-1">
              Total Anomalies Detected
            </p>
            <p className="text-xs text-bitcoin-white-80">
              {anomalyCount === 0 
                ? 'System operating normally' 
                : anomalyCount === 1
                ? '1 anomaly detected - monitoring'
                : `${anomalyCount} anomalies detected - review recommended`
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {anomalyCount === 0 ? (
              <CheckCircle className="w-8 h-8 text-bitcoin-orange" />
            ) : (
              <AlertCircle className="w-8 h-8 text-bitcoin-orange" />
            )}
            <span className="font-mono text-4xl font-bold text-bitcoin-orange">
              {anomalyCount}
            </span>
          </div>
        </div>

        {/* Anomaly Status */}
        <div className="mt-4 pt-4 border-t border-bitcoin-orange-20">
          {anomalyCount === 0 ? (
            <div className="flex items-center gap-2 text-sm text-bitcoin-white-80">
              <CheckCircle className="w-4 h-4 text-bitcoin-orange" />
              <span>All systems operational - no anomalies detected</span>
            </div>
          ) : anomalyCount < 5 ? (
            <div className="flex items-center gap-2 text-sm text-bitcoin-white-80">
              <AlertCircle className="w-4 h-4 text-bitcoin-orange" />
              <span>Minor anomalies detected - system continues operating</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-bitcoin-orange">
              <AlertCircle className="w-4 h-4" />
              <span>Multiple anomalies detected - review system health</span>
            </div>
          )}
        </div>
      </div>

      {/* Data Quality Legend */}
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-3">
          Quality Score Guide
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-bitcoin-orange font-semibold">90-100%</p>
            <p className="text-bitcoin-white-60">Excellent</p>
          </div>
          <div>
            <p className="text-bitcoin-orange font-semibold">70-89%</p>
            <p className="text-bitcoin-white-60">Good</p>
          </div>
          <div>
            <p className="text-bitcoin-white-80 font-semibold">50-69%</p>
            <p className="text-bitcoin-white-60">Fair</p>
          </div>
          <div>
            <p className="text-bitcoin-white-60 font-semibold">&lt;50%</p>
            <p className="text-bitcoin-white-60">Poor</p>
          </div>
        </div>
      </div>
    </div>
  );
}
