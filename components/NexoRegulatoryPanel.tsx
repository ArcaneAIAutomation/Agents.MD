import { useState } from 'react'
import { AlertTriangle, FileText, Calendar, RefreshCw } from 'lucide-react'
import { useNexoRegulatory } from '../hooks/useApiData'

export interface NexoUpdate {
  id: string
  title: string
  summary: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  impact: string
  source: string
  date: string
  complianceDeadline?: string
  tags: string[]
}

export default function NexoRegulatoryPanel() {
  const { data, loading, error, refetch } = useNexoRegulatory()
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  
  // Type the data properly
  const updates: NexoUpdate[] = (data as any)?.updates || []
  const filteredUpdates = selectedSeverity === 'all' 
    ? updates 
    : updates.filter((update: NexoUpdate) => update.severity.toLowerCase() === selectedSeverity)

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-bitcoin-orange text-bitcoin-black border-bitcoin-orange'
      case 'high': return 'bg-bitcoin-orange text-bitcoin-black border-bitcoin-orange opacity-80'
      case 'medium': return 'bg-bitcoin-black text-bitcoin-orange border-bitcoin-orange'
      case 'low': return 'bg-bitcoin-black text-bitcoin-white border-bitcoin-white opacity-60'
      default: return 'bg-bitcoin-black text-bitcoin-white border-bitcoin-white opacity-60'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }

  // Determine if we're using live or fallback data
  const isLiveData = data && !(data as any).isFallback
  const dataSourceType = isLiveData ? 'LIVE' : 'DEMO'
  const dataSourceColor = isLiveData ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'

  if (loading) {
    return (
      <div className="bg-bitcoin-black rounded-lg p-3 sm:p-6 border border-bitcoin-orange">
        <div className="flex items-center justify-center h-32 sm:h-64">
          <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-bitcoin-orange" />
          <span className="ml-2 text-bitcoin-white font-bold text-sm sm:text-base">Loading regulatory analysis...</span>
        </div>
      </div>
    )
  }

  if (!data && !loading) {
    return (
      <div className="bg-bitcoin-black rounded-lg p-3 sm:p-6 border border-bitcoin-orange">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-2 sm:p-3 bg-bitcoin-black rounded-lg border border-bitcoin-orange">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-bitcoin-orange" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-bitcoin-white mb-2">
            NEXO.COM UK REGULATORY UPDATES
          </h2>
          <p className="text-bitcoin-white opacity-80 mb-4 sm:mb-6 text-sm sm:text-base">Click below to load the latest regulatory monitoring and compliance alerts</p>
          <button 
            onClick={refetch}
            className="btn-bitcoin-primary bg-bitcoin-orange text-bitcoin-black font-bold py-2 sm:py-3 px-4 sm:px-6 border-2 border-bitcoin-orange hover:bg-bitcoin-black hover:text-bitcoin-orange transition-all flex items-center mx-auto text-sm sm:text-base min-h-touch uppercase"
          >
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            LOAD REGULATORY DATA
          </button>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="bg-bitcoin-black rounded-lg p-3 sm:p-6 border border-bitcoin-orange">
        <div className="flex items-center justify-center h-32 sm:h-64">
          <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 mr-2 text-bitcoin-orange" />
          <div className="text-center">
            <p className="font-bold text-bitcoin-white text-sm sm:text-base">Error loading regulatory data</p>
            <p className="text-xs sm:text-sm text-bitcoin-white opacity-60 mt-1">{error}</p>
            <button 
              onClick={refetch}
              className="mt-3 px-3 sm:px-4 py-2 bg-bitcoin-orange text-bitcoin-black rounded border-2 border-bitcoin-orange hover:bg-bitcoin-black hover:text-bitcoin-orange transition-all font-bold text-sm sm:text-base uppercase"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      </div>
    )
  }

  const lastUpdated = (data as any)?.lastUpdated

  return (
    <div className="bitcoin-block bg-bitcoin-black rounded-lg p-3 sm:p-6 border border-bitcoin-orange transition-all hover:shadow-bitcoin-glow">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-1 sm:p-2 bg-bitcoin-black rounded-lg border border-bitcoin-orange">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-bitcoin-orange" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-bitcoin-white">Nexo.com UK Regulatory Updates</h2>
            <p className="text-xs sm:text-sm text-bitcoin-white opacity-60">Real-time regulatory monitoring and compliance alerts</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs sm:text-sm text-bitcoin-white opacity-60">Last Updated</div>
          <div className="font-bold text-xs sm:text-sm text-bitcoin-orange">{lastUpdated ? formatDate(lastUpdated) : 'N/A'}</div>
          <button
            onClick={refetch}
            className="mt-1 p-1 bg-bitcoin-orange text-bitcoin-black hover:bg-bitcoin-black hover:text-bitcoin-orange rounded border border-bitcoin-orange transition-all"
            title="Refresh analysis"
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
      
      {/* Section divider */}
      <div className="section-divider w-full h-px bg-gradient-to-r from-transparent via-bitcoin-orange to-transparent my-4"></div>

      {/* Severity Filter Tabs */}
      <div className="flex space-x-1 mb-4 sm:mb-6 bg-bitcoin-black p-1 rounded-lg border border-bitcoin-orange opacity-20">
        {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
          <button
            key={severity}
            onClick={() => setSelectedSeverity(severity)}
            className={`flex-1 py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-bold transition-all border uppercase ${
              selectedSeverity === severity
                ? 'bg-bitcoin-orange text-bitcoin-black border-bitcoin-orange shadow-bitcoin-glow'
                : 'bg-bitcoin-black text-bitcoin-white border-bitcoin-orange opacity-60 hover:opacity-100 hover:border-bitcoin-orange'
            }`}
          >
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </button>
        ))}
      </div>

      {/* Updates List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredUpdates.length === 0 ? (
          <div className="text-center py-8 text-bitcoin-white opacity-60">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50 text-bitcoin-orange" />
            <p>No regulatory updates found for the selected filter.</p>
          </div>
        ) : (
          filteredUpdates.map((update: NexoUpdate) => (
            <div key={update.id} className="bitcoin-block border border-bitcoin-orange rounded-lg p-3 sm:p-4 hover:shadow-bitcoin-glow transition-all bg-bitcoin-black">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className={`px-1 sm:px-2 py-1 rounded-full text-xs font-bold border border-bitcoin-orange ${getSeverityColor(update.severity)}`}>
                    {update.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-bitcoin-white bg-bitcoin-black px-1 sm:px-2 py-1 rounded border border-bitcoin-orange opacity-60">
                    {update.source}
                  </span>
                </div>
                <div className="flex items-center text-xs text-bitcoin-orange">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span className="text-xs">{formatDate(update.date)}</span>
                </div>
              </div>
              
              <h3 className="font-black text-bitcoin-white mb-2 text-sm sm:text-base">
                {update.title}
              </h3>
              
              <p className="text-bitcoin-white opacity-80 text-xs sm:text-sm mb-2 sm:mb-3">
                {update.summary}
              </p>

              <div className="border-t border-bitcoin-orange opacity-20 pt-2 sm:pt-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-bitcoin-white opacity-60 mb-1">
                      <strong>Impact Assessment:</strong>
                    </p>
                    <p className="text-xs text-bitcoin-white opacity-80">
                      {update.impact}
                    </p>
                  </div>
                  {update.complianceDeadline && (
                    <div className="text-right">
                      <p className="text-xs text-bitcoin-white opacity-60">Compliance Deadline</p>
                      <p className="text-xs font-bold text-bitcoin-orange">
                        {formatDate(update.complianceDeadline)}
                      </p>
                    </div>
                  )}
                </div>
                
                {update.tags && update.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {update.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-bitcoin-black text-bitcoin-white text-xs rounded border border-bitcoin-orange opacity-60">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {updates.length > 0 && (
        <div className="mt-4 p-2 sm:p-3 bg-bitcoin-black rounded-lg border border-bitcoin-orange opacity-20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-1 sm:gap-0">
              <span className={`px-2 py-1 rounded border-2 font-bold self-start uppercase ${isLiveData ? 'border-bitcoin-orange text-bitcoin-orange bg-bitcoin-black' : 'border-bitcoin-orange text-bitcoin-orange bg-bitcoin-black opacity-60'}`}>
                {isLiveData ? '🔴 LIVE DATA' : '⚠️ DEMO DATA'}
              </span>
              <span className="text-bitcoin-white opacity-60 font-medium">
                {isLiveData 
                  ? 'Real-time updates from regulatory sources' 
                  : 'Simulated data for demonstration purposes'
                }
              </span>
            </div>
            <span className="text-bitcoin-orange font-bold font-mono">
              Last refresh: {lastUpdated ? formatDate(lastUpdated) : 'N/A'}
            </span>
          </div>
          {!isLiveData && (
            <div className="mt-2 text-xs text-bitcoin-white bg-bitcoin-black p-2 rounded border border-bitcoin-orange">
              <strong>Note:</strong> This is demonstration data. To access live regulatory updates, 
              configure a full-access OpenAI API key or integrate with real news sources.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
