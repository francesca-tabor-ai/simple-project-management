// Shared task types and constants (NOT a server action file)

export type Label = {
  id: string
  name: string
  color: string // hex color like "#3B82F6"
}

export type Task = {
  id: string
  user_id: string
  title: string
  status: 'pending' | 'in_progress' | 'done'
  created_at: string
  updated_at: string
  // Extended fields for task details
  description: string
  dueDate: string | null // ISO date string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  labels: Label[]
  assignee: { id: string; name: string } | null
  checklist: { id: string; text: string; done: boolean }[]
  attachments: { id: string; title: string; url: string }[]
  // Google Calendar integration
  googleCalendar?: {
    synced: boolean          // whether user wants sync for this task
    calendarId?: string      // usually "primary" unless user chooses a calendar
    eventId?: string         // created event id
    lastSyncedAt?: string    // ISO timestamp
  }
  // Task source tracking (WhatsApp, manual, etc.)
  source?: {
    type: 'whatsapp' | 'manual'
    from?: string            // sender identifier (hashed/masked)
    messageSid?: string      // Twilio message ID for deduplication
    mediaSid?: string        // Twilio media ID if audio
    receivedAt?: string      // ISO timestamp
  }
}

// Status label mapping for consistent display
export const STATUS_LABELS: Record<Task['status'], string> = {
  pending: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

