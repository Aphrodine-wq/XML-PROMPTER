import React, { useEffect, useState } from 'react'
import type { AIProvider } from '@xmlpg/core'

interface ProviderSelectorProps {
  onProviderChange: (provider: AIProvider) => void
  currentProvider: AIProvider
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  onProviderChange,
  currentProvider
}) => {
  const [availableProviders, setAvailableProviders] = useState<AIProvider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const providers = await (window as any).api.getAvailableProviders()
        setAvailableProviders(providers)
      } catch (error) {
        console.error('Failed to load providers:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProviders()
  }, [])

  const handleProviderChange = async (provider: AIProvider) => {
    try {
      await (window as any).api.setProvider(provider)
      onProviderChange(provider)
    } catch (error) {
      console.error('Failed to set provider:', error)
    }
  }

  const providerLabels: Record<AIProvider, string> = {
    'ollama': 'Ollama (Local)',
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'groq': 'Groq',
    'lm-studio': 'LM Studio',
    'huggingface': 'HuggingFace'
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading providers...</div>
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">AI Provider</label>
      <select
        value={currentProvider}
        onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        {availableProviders.map((provider) => (
          <option key={provider} value={provider}>
            {providerLabels[provider]}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        {availableProviders.length === 0 ? 'No providers available' : `${availableProviders.length} provider(s) available`}
      </p>
    </div>
  )
}
