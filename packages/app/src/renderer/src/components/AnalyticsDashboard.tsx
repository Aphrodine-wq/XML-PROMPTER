import React, { useEffect, useState } from 'react'

interface AnalyticsStats {
  totalGenerations: number
  totalTokens: number
  totalCost: number
  avgDuration: number
  modelBreakdown: Record<string, number>
  providerBreakdown: Record<string, number>
}

export const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await (window as any).api.getAnalytics()
        setStats(data)
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
    const interval = setInterval(loadAnalytics, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div className="text-center text-gray-500">Loading analytics...</div>
  }

  if (!stats) {
    return <div className="text-center text-gray-500">No analytics data available</div>
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg shadow">
      <div className="p-3 bg-blue-50 rounded">
        <p className="text-xs font-semibold text-gray-600">Total Generations</p>
        <p className="text-2xl font-bold text-blue-600">{stats.totalGenerations}</p>
      </div>

      <div className="p-3 bg-green-50 rounded">
        <p className="text-xs font-semibold text-gray-600">Total Tokens</p>
        <p className="text-2xl font-bold text-green-600">{stats.totalTokens.toLocaleString()}</p>
      </div>

      <div className="p-3 bg-purple-50 rounded">
        <p className="text-xs font-semibold text-gray-600">Avg Duration</p>
        <p className="text-2xl font-bold text-purple-600">{stats.avgDuration.toFixed(1)}ms</p>
      </div>

      <div className="p-3 bg-orange-50 rounded">
        <p className="text-xs font-semibold text-gray-600">Est. Cost</p>
        <p className="text-2xl font-bold text-orange-600">${stats.totalCost.toFixed(2)}</p>
      </div>

      <div className="col-span-2 p-3 bg-gray-50 rounded">
        <p className="text-xs font-semibold text-gray-600 mb-2">Provider Breakdown</p>
        <div className="flex gap-2">
          {Object.entries(stats.providerBreakdown).map(([provider, count]) => (
            <div key={provider} className="flex-1 p-2 bg-white rounded text-center">
              <p className="text-xs text-gray-600">{provider}</p>
              <p className="text-lg font-semibold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-2 p-3 bg-gray-50 rounded">
        <p className="text-xs font-semibold text-gray-600 mb-2">Model Breakdown</p>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(stats.modelBreakdown).map(([model, count]) => (
            <span key={model} className="px-2 py-1 bg-white rounded text-xs border border-gray-200">
              {model}: <span className="font-semibold">{count}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
