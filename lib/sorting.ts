import { type Task } from '@/lib/task-types'

export type SortField = 'createdAt' | 'dueDate' | 'priority'
export type SortOrder = 'asc' | 'desc'

export interface SortState {
  field: SortField
  order: SortOrder
}

export const DEFAULT_SORT: SortState = {
  field: 'createdAt',
  order: 'desc', // Newest first
}

// Priority ranking (higher number = higher priority)
const PRIORITY_RANK: Record<Task['priority'], number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
}

/**
 * Pure function to sort tasks based on sort state
 * Includes proper null handling for due dates and tie-breakers
 */
export function sortTasks(tasks: Task[], sort: SortState): Task[] {
  // Create a copy to avoid mutation
  const sortedTasks = [...tasks]

  sortedTasks.sort((a, b) => {
    let comparison = 0

    // Primary sort field
    switch (sort.field) {
      case 'createdAt':
        comparison = compareCreatedAt(a, b)
        break

      case 'dueDate':
        comparison = compareDueDate(a, b)
        break

      case 'priority':
        comparison = comparePriority(a, b)
        break
    }

    // Apply sort order (asc/desc)
    // Note: For dueDate, null handling is in compareDueDate
    if (sort.field !== 'dueDate') {
      comparison = sort.order === 'asc' ? comparison : -comparison
    } else {
      // For dueDate, we already handled the order in compareDueDate
      comparison = sort.order === 'asc' ? comparison : -comparison
    }

    // Tie-breaker 1: Created date (newest first)
    if (comparison === 0) {
      comparison = -compareCreatedAt(a, b) // Negative for newest first
    }

    // Tie-breaker 2: Title (A→Z)
    if (comparison === 0) {
      comparison = a.title.localeCompare(b.title)
    }

    return comparison
  })

  return sortedTasks
}

/**
 * Compare tasks by created date (timestamp)
 */
function compareCreatedAt(a: Task, b: Task): number {
  const dateA = new Date(a.created_at).getTime()
  const dateB = new Date(b.created_at).getTime()
  return dateA - dateB
}

/**
 * Compare tasks by due date
 * Tasks with null dueDate ALWAYS go to the bottom (regardless of asc/desc)
 */
function compareDueDate(a: Task, b: Task): number {
  // Null dueDate always goes to bottom
  if (a.dueDate === null && b.dueDate === null) return 0
  if (a.dueDate === null) return 1 // a goes after b
  if (b.dueDate === null) return -1 // a goes before b

  // Compare dates (use local date comparison)
  const dateA = new Date(a.dueDate + 'T00:00:00').getTime()
  const dateB = new Date(b.dueDate + 'T00:00:00').getTime()
  return dateA - dateB
}

/**
 * Compare tasks by priority
 */
function comparePriority(a: Task, b: Task): number {
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
}

export const SORT_FIELD_LABELS: Record<SortField, string> = {
  createdAt: 'Created date',
  dueDate: 'Due date',
  priority: 'Priority',
}

export const SORT_ORDER_LABELS: Record<SortOrder, string> = {
  asc: 'Ascending',
  desc: 'Descending',
}

