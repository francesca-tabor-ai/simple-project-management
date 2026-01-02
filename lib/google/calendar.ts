// Server-side Google Calendar utilities
// DO NOT use "use client" - this is server-only code

import { google, calendar_v3 } from 'googleapis'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextauth'
import { env } from '@/lib/env'

/**
 * Get an authenticated Google Calendar client for the current user
 * Uses OAuth tokens from NextAuth session
 */
export async function getCalendarClient(): Promise<calendar_v3.Calendar | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      console.warn('No access token in session')
      return null
    }
    
    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.NEXTAUTH_URL
    )
    
    // Set credentials
    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
    })
    
    // Handle token refresh automatically
    oauth2Client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        // Store refresh token if provided (first time)
        console.log('Got new refresh token')
      }
      if (tokens.access_token) {
        // New access token received
        console.log('Access token refreshed')
      }
    })
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    return calendar
  } catch (error) {
    console.error('Failed to get calendar client:', error)
    return null
  }
}

/**
 * List user's calendars
 */
export async function listCalendars(): Promise<calendar_v3.Schema$CalendarListEntry[]> {
  const calendar = await getCalendarClient()
  if (!calendar) {
    throw new Error('Not authenticated with Google')
  }
  
  try {
    const response = await calendar.calendarList.list()
    return response.data.items || []
  } catch (error) {
    console.error('Failed to list calendars:', error)
    throw new Error('Failed to fetch calendars')
  }
}

/**
 * Create an all-day event for a task
 */
export async function createTaskEvent(
  calendarId: string,
  taskId: string,
  title: string,
  description: string,
  dueDate: string, // ISO date string like "2026-01-02"
  userId: string
): Promise<string> {
  const calendar = await getCalendarClient()
  if (!calendar) {
    throw new Error('Not authenticated with Google')
  }
  
  try {
    // Parse due date and add one day for end date (all-day events are exclusive)
    const startDate = new Date(dueDate)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 1)
    
    const event: calendar_v3.Schema$Event = {
      summary: title,
      description: description || undefined,
      start: {
        date: dueDate, // YYYY-MM-DD format for all-day
      },
      end: {
        date: endDate.toISOString().split('T')[0], // Next day for all-day events
      },
      extendedProperties: {
        private: {
          taskId,
          appUserId: userId,
          appName: 'Tasks - Simple Project Management',
        },
      },
      colorId: '9', // Blue
    }
    
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    })
    
    if (!response.data.id) {
      throw new Error('No event ID returned from Google Calendar')
    }
    
    return response.data.id
  } catch (error: any) {
    console.error('Failed to create event:', error)
    throw new Error(`Failed to create calendar event: ${error.message}`)
  }
}

/**
 * Update an existing event
 */
export async function updateTaskEvent(
  calendarId: string,
  eventId: string,
  title: string,
  description: string,
  dueDate: string
): Promise<void> {
  const calendar = await getCalendarClient()
  if (!calendar) {
    throw new Error('Not authenticated with Google')
  }
  
  try {
    const startDate = new Date(dueDate)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 1)
    
    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: {
        summary: title,
        description: description || undefined,
        start: {
          date: dueDate,
        },
        end: {
          date: endDate.toISOString().split('T')[0],
        },
      },
    })
  } catch (error: any) {
    console.error('Failed to update event:', error)
    // If event doesn't exist (404), that's okay
    if (error.code === 404) {
      console.warn('Event not found, may have been deleted')
      return
    }
    throw new Error(`Failed to update calendar event: ${error.message}`)
  }
}

/**
 * Delete an event
 */
export async function deleteTaskEvent(
  calendarId: string,
  eventId: string
): Promise<void> {
  const calendar = await getCalendarClient()
  if (!calendar) {
    throw new Error('Not authenticated with Google')
  }
  
  try {
    await calendar.events.delete({
      calendarId,
      eventId,
    })
  } catch (error: any) {
    console.error('Failed to delete event:', error)
    // If event doesn't exist (404), that's fine
    if (error.code === 404) {
      console.warn('Event not found, may have been already deleted')
      return
    }
    throw new Error(`Failed to delete calendar event: ${error.message}`)
  }
}

/**
 * Get event details (for "Open event" link)
 */
export async function getEventUrl(
  calendarId: string,
  eventId: string
): Promise<string> {
  // Google Calendar event URLs follow this pattern
  // For primary calendar, use the email; otherwise use the calendarId
  const encodedCalendarId = encodeURIComponent(calendarId)
  return `https://calendar.google.com/calendar/u/0/r/eventedit/${eventId}?cid=${encodedCalendarId}`
}

