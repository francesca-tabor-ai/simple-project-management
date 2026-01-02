import { useEffect, useRef, useState, useCallback } from 'react'

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

interface AutosaveOptions {
  debounceMs?: number // Debounce delay in milliseconds (default: 400)
  onError?: (error: Error) => void
}

interface AutosaveReturn {
  status: SaveStatus
  error: string | null
  flush: () => Promise<void>
  reset: () => void
  isDirty: boolean
}

/**
 * Hook for autosaving data with debouncing and status tracking
 * 
 * @param value - Current value to save (compared by reference/deep equality)
 * @param onSave - Async function to persist the value
 * @param options - Configuration options
 * 
 * @example
 * const { status, error, flush } = useAutosave(
 *   draftTask,
 *   async (task) => await updateTask(task.id, task),
 *   { debounceMs: 400 }
 * )
 */
export function useAutosave<T>(
  value: T,
  onSave: (value: T) => Promise<void>,
  options: AutosaveOptions = {}
): AutosaveReturn {
  const { debounceMs = 400, onError } = options

  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  // Track the last saved value to detect changes
  const lastSavedValueRef = useRef<T>(value)
  const lastSaveVersionRef = useRef(0)
  const pendingSaveVersionRef = useRef(0)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const mountedRef = useRef(true)

  // Check if value has changed
  const isDirty = value !== lastSavedValueRef.current

  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(async (valueToSave: T, saveVersion: number) => {
    // Skip if already saving or unmounted
    if (isSavingRef.current || !mountedRef.current) {
      return
    }

    isSavingRef.current = true
    
    if (mountedRef.current) {
      setStatus('saving')
      setError(null)
    }

    try {
      await onSave(valueToSave)

      // Only update status if this is still the latest save request
      if (mountedRef.current && saveVersion >= lastSaveVersionRef.current) {
        lastSavedValueRef.current = valueToSave
        lastSaveVersionRef.current = saveVersion
        setStatus('saved')
        setError(null)

        // Auto-transition from "saved" to "idle" after 2 seconds
        setTimeout(() => {
          if (mountedRef.current && status !== 'dirty' && status !== 'saving') {
            setStatus('idle')
          }
        }, 2000)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save'
      
      if (mountedRef.current && saveVersion >= lastSaveVersionRef.current) {
        setStatus('error')
        setError(errorMessage)
        
        if (onError && err instanceof Error) {
          onError(err)
        }
      }
    } finally {
      isSavingRef.current = false
    }
  }, [onSave, onError, status])

  /**
   * Flush: Save immediately without debounce
   */
  const flush = useCallback(async () => {
    // Cancel pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    // Only save if there are changes
    if (isDirty && !isSavingRef.current) {
      const saveVersion = ++pendingSaveVersionRef.current
      await performSave(value, saveVersion)
    }
  }, [isDirty, value, performSave])

  /**
   * Reset status and error
   */
  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
    lastSavedValueRef.current = value
  }, [value])

  /**
   * Debounced autosave effect
   */
  useEffect(() => {
    // Skip if value hasn't changed
    if (!isDirty) {
      return
    }

    // Mark as dirty
    if (status !== 'dirty' && status !== 'saving') {
      setStatus('dirty')
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Schedule new save
    const saveVersion = ++pendingSaveVersionRef.current
    saveTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && !isSavingRef.current) {
        performSave(value, saveVersion)
      }
    }, debounceMs)

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [value, isDirty, debounceMs, performSave, status])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    mountedRef.current = true
    
    return () => {
      mountedRef.current = false
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    status,
    error,
    flush,
    reset,
    isDirty,
  }
}

