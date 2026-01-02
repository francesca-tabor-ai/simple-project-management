// Hook to automatically sync task changes to Google Calendar
import { useEffect, useRef } from 'react'
import { syncTaskToCalendar } from '@/app/actions/google-calendar'
import type { Task } from '@/lib/task-types'

interface UseCalendarSyncOptions {
  task: Task | null // Allow null task
  enabled: boolean // Only sync if true
  debounceMs?: number
}

/**
 * Automatically syncs task changes to Google Calendar when:
 * - Task is marked for sync (googleCalendar.synced = true)
 * - Title, description, or dueDate changes
 * - Debounced to avoid excessive API calls
 * 
 * Safe to call unconditionally - guards against null task inside useEffect
 */
export function useCalendarSync({ task, enabled, debounceMs = 500 }: UseCalendarSyncOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSyncedValuesRef = useRef<{
    title: string
    description: string
    dueDate: string | null
  } | null>(null)
  
  useEffect(() => {
    // Guard: only sync if task exists, enabled, and task has googleCalendar.synced = true
    if (!task || !enabled || !task.googleCalendar?.synced) {
      return
    }
    
    // Check if relevant fields changed
    const currentValues = {
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
    }
    
    // Initialize on first run
    if (!lastSyncedValuesRef.current) {
      lastSyncedValuesRef.current = currentValues
      return
    }
    
    // Check if any relevant field changed
    const hasChanges =
      currentValues.title !== lastSyncedValuesRef.current.title ||
      currentValues.description !== lastSyncedValuesRef.current.description ||
      currentValues.dueDate !== lastSyncedValuesRef.current.dueDate
    
    if (!hasChanges) {
      return
    }
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Debounce the sync
    timeoutRef.current = setTimeout(async () => {
      // Double-check task still needs sync
      if (!task.dueDate) {
        console.warn('Cannot sync task without due date')
        return
      }
      
      try {
        console.log('Auto-syncing task to Google Calendar:', task.id)
        await syncTaskToCalendar(task.id)
        lastSyncedValuesRef.current = currentValues
      } catch (error) {
        console.error('Failed to auto-sync to calendar:', error)
        // Don't update lastSyncedValuesRef so it will retry on next change
      }
    }, debounceMs)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [task?.id, task?.title, task?.description, task?.dueDate, task?.googleCalendar?.synced, enabled, debounceMs])
}

