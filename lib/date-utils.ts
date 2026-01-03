// Date formatting utilities for HTML date inputs

/**
 * Formats a date value for use in <input type="date">
 * HTML date inputs require "YYYY-MM-DD" format
 * 
 * Handles various input formats:
 * - "2026-01-10 00:00:00" (PostgreSQL timestamp)
 * - "2026-01-10T00:00:00Z" (ISO string)
 * - "2026-01-10" (already correct)
 * - null/undefined (returns empty string)
 */
export function formatDateForInput(value: string | null | undefined): string {
  if (!value) {
    return ''
  }

  // If value contains a space, it's likely "YYYY-MM-DD HH:MM:SS" format
  // Just take the date part before the space
  if (value.includes(' ')) {
    return value.split(' ')[0]
  }

  // If value contains 'T', it's likely ISO format "YYYY-MM-DDT..."
  // Try parsing it
  if (value.includes('T')) {
    try {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10)
      }
    } catch {
      // Fall through to regex check
    }
  }

  // Check if it's already in YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (dateRegex.test(value)) {
    return value
  }

  // Try parsing as a date
  try {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10)
    }
  } catch {
    // Invalid date
  }

  // If all else fails, return empty string
  console.warn('[formatDateForInput] Could not parse date:', value)
  return ''
}

/**
 * Converts a date input value to ISO format for storage
 * Takes "YYYY-MM-DD" and returns "YYYY-MM-DD" (or ISO string if needed)
 */
export function formatDateForStorage(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  // If already in YYYY-MM-DD format, return as-is
  // Most backends can handle this format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (dateRegex.test(value)) {
    return value
  }

  // Otherwise try to parse and format
  try {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10)
    }
  } catch {
    // Invalid date
  }

  return null
}

