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
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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
      <div className="bg-white rounded-lg shadow-lg p-6 border-4 border-black">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-black" />
          <span className="ml-2 text-gray-600 font-bold">Loading regulatory analysis...</span>
        </div>
      </div>
    )
  }

  if (!data && !loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border-4 border-black">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gray-100 rounded-lg border-2 border-black">
              <AlertTriangle className="h-8 w-8 text-black" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-black mb-2" style={{ fontFamily: 'Times, serif' }}>
            NEXO.COM UK REGULATORY UPDATES
          </h2>
          <p className="text-gray-600 mb-6">Click below to load the latest regulatory monitoring and compliance alerts</p>
          <button 
            onClick={refetch}
            className="bg-black text-white font-bold py-3 px-6 border-4 border-black hover:bg-gray-800 transition-colors flex items-center mx-auto"
            style={{ fontFamily: 'Times, serif' }}
          >
            <AlertTriangle className="h-5 w-5 mr-2" />
            LOAD REGULATORY DATA
          </button>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border-4 border-black">
        <div className="flex items-center justify-center h-64 text-red-600">
          <AlertTriangle className="h-8 w-8 mr-2" />
          <div className="text-center">
            <p className="font-bold text-black">Error loading regulatory data</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <button 
              onClick={refetch}
              className="mt-3 px-4 py-2 bg-black text-white rounded border-2 border-black hover:bg-gray-800 transition-colors font-bold"
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
    <div className="bg-white rounded-lg shadow-lg p-6 border-4 border-black">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 rounded-lg border-2 border-black">
            <AlertTriangle className="h-6 w-6 text-black" />
          </div>
          <div>
            <h2 className="text-xl font-black text-black" style={{ fontFamily: 'Times, serif' }}>Nexo.com UK Regulatory Updates</h2>
            <p className="text-sm text-gray-600">Real-time regulatory monitoring and compliance alerts</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Last Updated</div>
          <div className="font-bold">{lastUpdated ? formatDate(lastUpdated) : 'N/A'}</div>
          <button
            onClick={refetch}
            className="mt-1 p-1 bg-black text-white hover:bg-gray-800 rounded border-2 border-black"
            title="Refresh analysis"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg border-2 border-black">
        {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
          <button
            key={severity}
            onClick={() => setSelectedSeverity(severity)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-colors border-2 ${
              selectedSeverity === severity
                ? 'bg-black text-white border-black shadow-sm'
                : 'bg-white text-black border-gray-300 hover:bg-gray-100'
            }`}
          >
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </button>
        ))}
      </div>

      {/* Updates List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredUpdates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No regulatory updates found for the selected filter.</p>
          </div>
        ) : (
          filteredUpdates.map((update: NexoUpdate) => (
            <div key={update.id} className="border-2 border-black rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border-2 border-black ${getSeverityColor(update.severity)}`}>
                    {update.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-black bg-gray-100 px-2 py-1 rounded border border-black">
                    {update.source}
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(update.date)}
                </div>
              </div>
              
              <h3 className="font-black text-black mb-2" style={{ fontFamily: 'Times, serif' }}>
                {update.title}
              </h3>
              
              <p className="text-gray-700 text-sm mb-3">
                {update.summary}
              </p>

              <div className="border-t-2 border-black pt-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">
                      <strong>Impact Assessment:</strong>
                    </p>
                    <p className="text-xs text-gray-700">
                      {update.impact}
                    </p>
                  </div>
                  {update.complianceDeadline && (
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Compliance Deadline</p>
                      <p className="text-xs font-bold text-red-600">
                        {formatDate(update.complianceDeadline)}
                      </p>
                    </div>
                  )}
                </div>
                
                {update.tags && update.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {update.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-black text-xs rounded border border-black">
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
        <div className="mt-4 p-3 bg-gray-100 rounded-lg border-2 border-black">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <span className={`px-2 py-1 rounded border-2 border-black font-bold ${dataSourceColor}`}>
                {isLiveData ? '🔴 LIVE DATA' : '⚠️ DEMO DATA'}
              </span>
              <span className="text-gray-600 font-medium">
                {isLiveData 
                  ? 'Real-time updates from regulatory sources' 
                  : 'Simulated data for demonstration purposes'
                }
              </span>
            </div>
            <span className="text-gray-600 font-bold">
              Last refresh: {lastUpdated ? formatDate(lastUpdated) : 'N/A'}
            </span>
          </div>
          {!isLiveData && (
            <div className="mt-2 text-xs text-black bg-orange-100 p-2 rounded border-2 border-black">
              <strong>Note:</strong> This is demonstration data. To access live regulatory updates, 
              configure a full-access OpenAI API key or integrate with real news sources.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
