'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import {
  toggleCalendarSync,
  getUserCalendars,
  changeTaskCalendar,
} from '@/app/actions/google-calendar'
import type { Task } from '@/lib/task-types'

interface GoogleCalendarSectionProps {
  task: Task
  onTaskUpdate: (updates: Partial<Task>) => void
}

export default function GoogleCalendarSection({ task, onTaskUpdate }: GoogleCalendarSectionProps) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calendars, setCalendars] = useState<Array<{ id: string; name: string; primary?: boolean }>>([])
  const [showCalendarSelect, setShowCalendarSelect] = useState(false)
  
  const isGoogleConnected = status === 'authenticated' && session?.accessToken
  const isSynced = task.googleCalendar?.synced || false
  const selectedCalendarId = task.googleCalendar?.calendarId || 'primary'
  const hasEventId = !!task.googleCalendar?.eventId
  const lastSynced = task.googleCalendar?.lastSyncedAt
  
  // Load calendars when connected
  useEffect(() => {
    if (isGoogleConnected && showCalendarSelect && calendars.length === 0) {
      loadCalendars()
    }
  }, [isGoogleConnected, showCalendarSelect])
  
  const loadCalendars = async () => {
    try {
      const result = await getUserCalendars()
      if (result.success && result.calendars) {
        setCalendars(result.calendars)
      } else {
        setError(result.error || 'Failed to load calendars')
      }
    } catch (err) {
      console.error('Failed to load calendars:', err)
      setError('Failed to load calendars')
    }
  }
  
  const handleConnectGoogle = async () => {
    await signIn('google', { callbackUrl: window.location.href })
  }
  
  const handleToggleSync = async (enabled: boolean) => {
    // Check if task has due date
    if (enabled && !task.dueDate) {
      setError('Set a due date before syncing to calendar')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await toggleCalendarSync(task.id, enabled)
      
      if (result.success) {
        // Update local task state
        if (enabled) {
          onTaskUpdate({
            googleCalendar: {
              synced: true,
              calendarId: selectedCalendarId,
              eventId: result.eventId,
              lastSyncedAt: new Date().toISOString(),
            },
          })
        } else {
          onTaskUpdate({
            googleCalendar: undefined,
          })
        }
      } else {
        setError(result.error || 'Failed to sync')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleChangeCalendar = async (newCalendarId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await changeTaskCalendar(task.id, newCalendarId)
      
      if (result.success) {
        onTaskUpdate({
          googleCalendar: task.googleCalendar ? {
            synced: task.googleCalendar.synced,
            calendarId: newCalendarId,
            eventId: task.googleCalendar.eventId,
            lastSyncedAt: task.googleCalendar.lastSyncedAt,
          } : {
            synced: true,
            calendarId: newCalendarId,
          },
        })
        setShowCalendarSelect(false)
      } else {
        setError(result.error || 'Failed to change calendar')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  const getEventUrl = () => {
    if (!hasEventId || !task.googleCalendar?.eventId) return null
    const eventId = task.googleCalendar.eventId
    const calendarId = encodeURIComponent(selectedCalendarId)
    return `https://calendar.google.com/calendar/u/0/r/eventedit/${eventId}`
  }
  
  const formatLastSynced = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }
  
  const selectedCalendarName = calendars.find(c => c.id === selectedCalendarId)?.name || 'Primary Calendar'
  
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Google Calendar</h3>
      
      {!isGoogleConnected ? (
        <div className="bg-gray-50 rounded-[12px] p-4 border-2 border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
            Connect your Google account to sync tasks with Google Calendar
          </p>
          <button
            onClick={handleConnectGoogle}
            className="w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-[12px] text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Connect Google Calendar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Sync Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label htmlFor="calendar-sync-toggle" className="text-sm text-gray-700 cursor-pointer">
                Sync to Google Calendar
              </label>
              {isSynced && lastSynced && (
                <span className="text-xs text-gray-500">
                  ({formatLastSynced(lastSynced)})
                </span>
              )}
            </div>
            <button
              id="calendar-sync-toggle"
              onClick={() => handleToggleSync(!isSynced)}
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isSynced ? 'bg-primary' : 'bg-gray-200'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              role="switch"
              aria-checked={isSynced}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isSynced ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {/* Status */}
          {isSynced && (
            <div className="flex items-center gap-2 text-sm">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-600">Syncing...</span>
                </>
              ) : hasEventId ? (
                <>
                  <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-600">Synced</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600">Pending</span>
                </>
              )}
            </div>
          )}
          
          {/* Calendar Selection */}
          {isSynced && !showCalendarSelect && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Calendar:</span>
              <button
                onClick={() => setShowCalendarSelect(true)}
                className="text-primary hover:underline"
              >
                {selectedCalendarName}
              </button>
            </div>
          )}
          
          {showCalendarSelect && (
            <div>
              <label htmlFor="calendar-select" className="text-sm text-gray-600 block mb-2">
                Choose calendar:
              </label>
              <select
                id="calendar-select"
                value={selectedCalendarId}
                onChange={(e) => handleChangeCalendar(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-[12px] text-sm text-gray-800 focus:outline-none focus:border-primary transition-all"
              >
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.name}{cal.primary ? ' (Primary)' : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowCalendarSelect(false)}
                className="mt-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          )}
          
          {/* Open Event Link */}
          {isSynced && hasEventId && (
            <a
              href={getEventUrl() || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in Google Calendar
            </a>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-[12px] p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          
          {/* No Due Date Warning */}
          {isSynced && !task.dueDate && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-[12px] p-3 text-sm text-yellow-700">
              Set a due date to sync this task to your calendar
            </div>
          )}
        </div>
      )}
    </section>
  )
}

