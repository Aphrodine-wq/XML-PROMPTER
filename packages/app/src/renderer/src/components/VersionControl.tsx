import React, { useEffect, useState } from 'react'
import type { PromptVersion } from '@xmlpg/core'

interface VersionControlProps {
  promptId: string
  currentContent: string
  currentAuthor: string
}

export const VersionControl: React.FC<VersionControlProps> = ({
  promptId,
  currentContent,
  currentAuthor
}) => {
  const [history, setHistory] = useState<PromptVersion[]>([])
  const [commitMessage, setCommitMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [comparing, setComparing] = useState<{v1: number, v2: number} | null>(null)
  const [diff, setDiff] = useState<any>(null)

  useEffect(() => {
    loadHistory()
  }, [promptId])

  const loadHistory = async () => {
    try {
      const result = await (window as any).api.getPromptHistory(promptId)
      setHistory(result || [])
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  const handleCreateVersion = async () => {
    if (!commitMessage.trim()) {
      alert('Please enter a commit message')
      return
    }

    setLoading(true)
    try {
      await (window as any).api.createPromptVersion(
        promptId,
        currentContent,
        currentAuthor,
        commitMessage
      )
      setCommitMessage('')
      await loadHistory()
    } catch (error) {
      console.error('Failed to create version:', error)
      alert('Failed to create version')
    } finally {
      setLoading(false)
    }
  }

  const handleComparVersions = async (v1: number, v2: number) => {
    try {
      const result = await (window as any).api.getPromptDiff(promptId, v1, v2)
      setDiff(result)
      setComparing({v1, v2})
    } catch (error) {
      console.error('Failed to get diff:', error)
    }
  }

  return (
    <div className="space-y-4 p-4 max-h-96 overflow-y-auto">
      <div className="bg-white rounded-lg shadow p-3">
        <h3 className="text-sm font-semibold mb-2">Create Version</h3>
        <input
          type="text"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message"
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2 focus:outline-none focus:ring-blue-500"
        />
        <button
          onClick={handleCreateVersion}
          disabled={loading}
          className="w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Version'}
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">History</h3>
        {history.length === 0 ? (
          <p className="text-xs text-gray-500">No versions yet</p>
        ) : (
          <div className="space-y-1">
            {history.map((version, idx) => (
              <div key={version.id} className="p-2 bg-gray-50 rounded border border-gray-200 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">v{version.version}</p>
                    <p className="text-gray-600">{version.author}</p>
                    <p className="text-gray-500">{version.message}</p>
                  </div>
                  {idx > 0 && (
                    <button
                      onClick={() => handleComparVersions(version.version, history[idx - 1].version)}
                      className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                    >
                      Diff
                    </button>
                  )}
                </div>
                <p className="text-gray-400 mt-1">{new Date(version.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {diff && comparing && (
        <div className="bg-yellow-50 rounded-lg shadow p-3 border border-yellow-200">
          <h4 className="text-sm font-semibold mb-2">
            Diff: v{comparing.v1} ← v{comparing.v2}
          </h4>
          <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
            {diff.changes?.map((change: any, idx: number) => (
              <div
                key={idx}
                className={`px-2 py-1 rounded font-mono ${
                  change.type === 'add'
                    ? 'bg-green-100 text-green-800'
                    : change.type === 'remove'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                }`}
              >
                {change.type === 'add' && '+'}
                {change.type === 'remove' && '−'}
                {change.type === 'modify' && '~'} {change.content?.substring(0, 60)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
