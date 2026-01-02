'use server'

// Server actions for Google Calendar integration
// IMPORTANT: Only export async functions from "use server" files

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  createTaskEvent,
  updateTaskEvent,
  deleteTaskEvent,
  listCalendars,
} from '@/lib/google/calendar'
import type { Task } from '@/lib/task-types'

/**
 * Sync a task to Google Calendar
 * Creates or updates an event based on whether eventId exists
 */
export async function syncTaskToCalendar(
  taskId: string
): Promise<{ success: boolean; error?: string; eventId?: string }> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Fetch task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()
    
    if (taskError || !task) {
      return { success: false, error: 'Task not found' }
    }
    
    // Validate task has due date
    if (!task.dueDate) {
      return { success: false, error: 'Task must have a due date to sync to calendar' }
    }
    
    const calendarId = task.googleCalendar?.calendarId || 'primary'
    const existingEventId = task.googleCalendar?.eventId
    
    let eventId: string
    
    try {
      if (existingEventId) {
        // Update existing event
        await updateTaskEvent(
          calendarId,
          existingEventId,
          task.title,
          task.description || '',
          task.dueDate
        )
        eventId = existingEventId
      } else {
        // Create new event
        eventId = await createTaskEvent(
          calendarId,
          taskId,
          task.title,
          task.description || '',
          task.dueDate,
          user.id
        )
      }
      
      // Update task with calendar info
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          googleCalendar: {
            synced: true,
            calendarId,
            eventId,
            lastSyncedAt: new Date().toISOString(),
          },
        })
        .eq('id', taskId)
      
      if (updateError) {
        console.error('Failed to update task with calendar info:', updateError)
        return { success: false, error: 'Failed to save calendar info' }
      }
      
      revalidatePath('/app')
      return { success: true, eventId }
    } catch (calendarError: any) {
      console.error('Calendar API error:', calendarError)
      return { success: false, error: calendarError.message || 'Failed to sync with Google Calendar' }
    }
  } catch (error: any) {
    console.error('syncTaskToCalendar error:', error)
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}

/**
 * Unsync a task from Google Calendar
 * Deletes the event and clears calendar info from task
 */
export async function unsyncTaskFromCalendar(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Fetch task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()
    
    if (taskError || !task) {
      return { success: false, error: 'Task not found' }
    }
    
    const calendarId = task.googleCalendar?.calendarId || 'primary'
    const eventId = task.googleCalendar?.eventId
    
    // Delete event if it exists
    if (eventId) {
      try {
        await deleteTaskEvent(calendarId, eventId)
      } catch (calendarError: any) {
        console.error('Failed to delete calendar event:', calendarError)
        // Continue anyway to clear the local reference
      }
    }
    
    // Clear calendar info from task
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        googleCalendar: null,
      })
      .eq('id', taskId)
    
    if (updateError) {
      console.error('Failed to clear calendar info:', updateError)
      return { success: false, error: 'Failed to clear calendar info' }
    }
    
    revalidatePath('/app')
    return { success: true }
  } catch (error: any) {
    console.error('unsyncTaskFromCalendar error:', error)
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}

/**
 * Toggle calendar sync for a task
 */
export async function toggleCalendarSync(
  taskId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string; eventId?: string }> {
  if (enabled) {
    return await syncTaskToCalendar(taskId)
  } else {
    return await unsyncTaskFromCalendar(taskId)
  }
}

/**
 * Get list of user's Google Calendars
 */
export async function getUserCalendars(): Promise<
  { success: boolean; calendars?: Array<{ id: string; name: string; primary?: boolean }>; error?: string }
> {
  try {
    const calendars = await listCalendars()
    
    const formatted = calendars.map((cal) => ({
      id: cal.id || '',
      name: cal.summary || cal.id || 'Unknown',
      primary: cal.primary || false,
    }))
    
    return { success: true, calendars: formatted }
  } catch (error: any) {
    console.error('getUserCalendars error:', error)
    return { success: false, error: error.message || 'Failed to fetch calendars' }
  }
}

/**
 * Change which calendar a task syncs to
 */
export async function changeTaskCalendar(
  taskId: string,
  newCalendarId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Fetch task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()
    
    if (taskError || !task) {
      return { success: false, error: 'Task not found' }
    }
    
    // If task was synced to a different calendar, delete old event
    if (task.googleCalendar?.eventId && task.googleCalendar.calendarId !== newCalendarId) {
      try {
        await deleteTaskEvent(
          task.googleCalendar.calendarId || 'primary',
          task.googleCalendar.eventId
        )
      } catch (error) {
        console.warn('Failed to delete old event:', error)
        // Continue anyway
      }
      
      // Update task with new calendar and clear event ID
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          googleCalendar: {
            ...task.googleCalendar,
            calendarId: newCalendarId,
            eventId: undefined,
          },
        })
        .eq('id', taskId)
      
      if (updateError) {
        return { success: false, error: 'Failed to update calendar' }
      }
      
      // Re-sync to new calendar if sync was enabled
      if (task.googleCalendar.synced) {
        return await syncTaskToCalendar(taskId)
      }
    } else {
      // Just update the calendar ID
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          googleCalendar: {
            ...task.googleCalendar,
            calendarId: newCalendarId,
          },
        })
        .eq('id', taskId)
      
      if (updateError) {
        return { success: false, error: 'Failed to update calendar' }
      }
    }
    
    revalidatePath('/app')
    return { success: true }
  } catch (error: any) {
    console.error('changeTaskCalendar error:', error)
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}

