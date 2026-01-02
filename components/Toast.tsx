'use client'

import { useEffect } from 'react'

export interface ToastProps {
  id: string
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  showUndo?: boolean
  onUndo?: () => void
  onDismiss: (id: string) => void
}

export default function Toast({
  id,
  message,
  type = 'info',
  duration = 4000,
  showUndo = false,
  onUndo,
  onDismiss,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onDismiss])

  const typeStyles = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-gray-800 text-white',
  }

  return (
    <div
      className={`${typeStyles[type]} px-4 py-3 rounded-[12px] shadow-lg flex items-center gap-3 min-w-[300px] max-w-[500px] animate-slide-up`}
      role="alert"
    >
      <span className="flex-1 text-sm font-medium">{message}</span>
      
      {showUndo && onUndo && (
        <button
          onClick={() => {
            onUndo()
            onDismiss(id)
          }}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-[8px] text-sm font-medium transition-colors"
        >
          Undo
        </button>
      )}
      
      <button
        onClick={() => onDismiss(id)}
        className="p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

