import React, { useEffect, useState } from 'react'
import type { BatchJob } from '@xmlpg/core'

interface BatchItem {
  prompt: string
}

export const BatchProcessor: React.FC = () => {
  const [jobName, setJobName] = useState('')
  const [prompts, setPrompts] = useState('')
  const [jobs, setJobs] = useState<BatchJob[]>([])
  const [creating, setCreating] = useState(false)
  const [executing, setExecuting] = useState<string | null>(null)

  useEffect(() => {
    loadJobs()
    const interval = setInterval(loadJobs, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadJobs = async () => {
    try {
      const result = await (window as any).api.listBatchJobs()
      setJobs(result || [])
    } catch (error) {
      console.error('Failed to load batch jobs:', error)
    }
  }

  const handleCreateBatch = async () => {
    if (!jobName.trim() || !prompts.trim()) {
      alert('Please enter job name and prompts')
      return
    }

    setCreating(true)
    try {
      const items: BatchItem[] = prompts
        .split('\n')
        .filter(p => p.trim())
        .map(prompt => ({ prompt: prompt.trim() }))

      const jobId = await (window as any).api.createBatchJob(jobName, items)
      if (jobId) {
        setJobName('')
        setPrompts('')
        await loadJobs()
      }
    } catch (error) {
      console.error('Failed to create batch job:', error)
      alert('Failed to create batch job')
    } finally {
      setCreating(false)
    }
  }

  const handleExecuteBatch = async (jobId: string) => {
    setExecuting(jobId)
    try {
      await (window as any).api.executeBatch(jobId)
      await loadJobs()
    } catch (error) {
      console.error('Failed to execute batch:', error)
    } finally {
      setExecuting(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'running': return 'text-blue-600 bg-blue-50'
      case 'failed': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Create Batch Job</h3>
        <input
          type="text"
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
          placeholder="Job name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-blue-500"
        />
        <textarea
          value={prompts}
          onChange={(e) => setPrompts(e.target.value)}
          placeholder="Enter prompts (one per line)"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-blue-500"
        />
        <button
          onClick={handleCreateBatch}
          disabled={creating}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create Batch'}
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Batch Jobs</h3>
        {jobs.length === 0 ? (
          <p className="text-gray-500">No batch jobs yet</p>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className={`p-3 rounded-lg border ${getStatusColor(job.status)}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{job.name}</p>
                  <p className="text-sm text-gray-600">Status: {job.status}</p>
                </div>
                {job.status === 'pending' && (
                  <button
                    onClick={() => handleExecuteBatch(job.id)}
                    disabled={executing === job.id}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {executing === job.id ? 'Running...' : 'Execute'}
                  </button>
                )}
              </div>
              <div className="text-sm space-y-1">
                <p>Total: {job.totalItems}</p>
                <p>Completed: {job.completedItems}</p>
                <p>Failed: {job.failedItems}</p>
                <div className="w-full bg-gray-300 rounded h-2 mt-1">
                  <div
                    className="bg-green-500 h-2 rounded transition-all"
                    style={{
                      width: `${job.totalItems > 0 ? (job.completedItems / job.totalItems) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
