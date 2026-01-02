'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import Toast, { type ToastProps } from './Toast'

type ToastConfig = Omit<ToastProps, 'id' | 'onDismiss'>

interface ToastContextValue {
  showToast: (config: ToastConfig) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<(ToastConfig & { id: string })[]>([])

  const showToast = useCallback((config: ToastConfig) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    setToasts((prev) => {
      // Keep only last 2 toasts to avoid clutter
      const updated = [...prev, { ...config, id }]
      return updated.slice(-3)
    })
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              {...toast}
              onDismiss={dismissToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

