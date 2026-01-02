import { useState, useCallback, useRef } from 'react'

export type ActionType = 'delete' | 'move' | 'edit' | 'bulk-delete' | 'bulk-move' | 'create' | 'other'

export interface ActionMeta {
  type: ActionType
  taskIds?: string[]
  description?: string // For toast messages
}

interface UndoableStateOptions {
  limit?: number // Max history size (default: 50)
}

interface UndoableState<T> {
  present: T
  past: T[]
  future: T[]
  lastAction: ActionMeta | null
}

export function useUndoableState<T>(
  initialState: T,
  options: UndoableStateOptions = {}
) {
  const { limit = 50 } = options
  
  const [state, setState] = useState<UndoableState<T>>({
    present: initialState,
    past: [],
    future: [],
    lastAction: null,
  })

  // Track if this is the initial mount to avoid pushing initial state to history
  const isInitialMount = useRef(true)

  /**
   * Commit a new state to history
   * This is the main function for updating state with undo/redo support
   */
  const commit = useCallback(
    (nextState: T | ((prev: T) => T), meta?: ActionMeta) => {
      setState((current) => {
        const next = typeof nextState === 'function' 
          ? (nextState as (prev: T) => T)(current.present)
          : nextState

        // Skip if no actual change (referential equality check)
        if (next === current.present) {
          return current
        }

        // For initial mount or programmatic updates without meta, don't push to history
        if (isInitialMount.current) {
          isInitialMount.current = false
          return {
            present: next,
            past: [],
            future: [],
            lastAction: meta || null,
          }
        }

        // Build new past array with current present added
        const newPast = [...current.past, current.present]
        
        // Limit history size (keep most recent states)
        const trimmedPast = newPast.length > limit 
          ? newPast.slice(newPast.length - limit)
          : newPast

        return {
          present: next,
          past: trimmedPast,
          future: [], // Clear future on new commit
          lastAction: meta || null,
        }
      })
    },
    [limit]
  )

  /**
   * Undo: Move back in history
   */
  const undo = useCallback(() => {
    setState((current) => {
      if (current.past.length === 0) {
        return current
      }

      const previous = current.past[current.past.length - 1]
      const newPast = current.past.slice(0, current.past.length - 1)

      return {
        present: previous,
        past: newPast,
        future: [current.present, ...current.future],
        lastAction: null, // Clear last action on undo
      }
    })
  }, [])

  /**
   * Redo: Move forward in history
   */
  const redo = useCallback(() => {
    setState((current) => {
      if (current.future.length === 0) {
        return current
      }

      const next = current.future[0]
      const newFuture = current.future.slice(1)

      return {
        present: next,
        past: [...current.past, current.present],
        future: newFuture,
        lastAction: null, // Clear last action on redo
      }
    })
  }, [])

  /**
   * Reset history (useful after server refresh or data reload)
   */
  const reset = useCallback((newState: T) => {
    setState({
      present: newState,
      past: [],
      future: [],
      lastAction: null,
    })
    isInitialMount.current = false
  }, [])

  return {
    state: state.present,
    setState: commit,
    commit,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    lastAction: state.lastAction,
    reset,
    // Expose for debugging
    historySize: state.past.length,
    futureSize: state.future.length,
  }
}

