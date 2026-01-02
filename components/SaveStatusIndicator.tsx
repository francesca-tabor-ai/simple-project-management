'use client'

import { type SaveStatus } from '@/hooks/useAutosave'

interface SaveStatusIndicatorProps {
  status: SaveStatus
  error: string | null
  onRetry?: () => void
}

export default function SaveStatusIndicator({
  status,
  error,
  onRetry,
}: SaveStatusIndicatorProps) {
  if (status === 'idle') {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {status === 'dirty' && (
        <span className="text-gray-500 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="3" />
          </svg>
          Unsaved
        </span>
      )}

      {status === 'saving' && (
        <span className="text-primary flex items-center gap-2">
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Saving…
        </span>
      )}

      {status === 'saved' && (
        <span className="text-green-600 flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Saved
        </span>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2">
          <span className="text-red-600 flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error || 'Couldn\'t save'}
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  )
}

