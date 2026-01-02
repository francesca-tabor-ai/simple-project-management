import { type Task } from '@/lib/task-types'

export type DuePreset = 'all' | 'overdue' | 'today' | 'next7' | 'none' | 'range'

export interface FiltersState {
  query: string
  labels: string[] // Selected label strings
  assigneeId: string | 'all' | 'unassigned'
  due: {
    preset: DuePreset
    from?: string // ISO date string
    to?: string // ISO date string
  }
  priorities: Task['priority'][]
}

export const DEFAULT_FILTERS: FiltersState = {
  query: '',
  labels: [],
  assigneeId: 'all',
  due: { preset: 'all' },
  priorities: [],
}

/**
 * Pure function to filter tasks based on filters state
 * All filtering is client-side for now, easy to move to server later
 */
export function filterTasks(tasks: Task[], filters: FiltersState): Task[] {
  return tasks.filter(task => {
    // Search filter - matches title OR description (case-insensitive)
    if (filters.query.trim()) {
      const queryLower = filters.query.toLowerCase()
      const matchesTitle = task.title.toLowerCase().includes(queryLower)
      const matchesDescription = task.description.toLowerCase().includes(queryLower)
      if (!matchesTitle && !matchesDescription) return false
    }

    // Label filter - OR logic: task matches if it contains ANY selected label
    // Note: This uses OR logic. To change to AND logic (task must have ALL selected labels),
    // replace with: filters.labels.every(label => task.labels.some(...)
    if (filters.labels.length > 0) {
      const hasNoLabelFilter = filters.labels.includes('__no_label__')
      const otherLabels = filters.labels.filter(l => l !== '__no_label__')

      const matchesNoLabel = hasNoLabelFilter && task.labels.length === 0
      const matchesAnyLabel = otherLabels.length > 0 && otherLabels.some(filterLabel =>
        task.labels.some(taskLabel => taskLabel.name.toLowerCase() === filterLabel.toLowerCase())
      )

      if (!matchesNoLabel && !matchesAnyLabel) return false
    }

    // Assignee filter
    if (filters.assigneeId !== 'all') {
      if (filters.assigneeId === 'unassigned') {
        if (task.assignee !== null) return false
      } else {
        if (!task.assignee || task.assignee.id !== filters.assigneeId) return false
      }
    }

    // Due date filter
    if (filters.due.preset !== 'all') {
      const today = getTodayDateString()
      
      switch (filters.due.preset) {
        case 'overdue':
          // Overdue: has due date, date < today, AND status not done
          if (!task.dueDate || task.dueDate >= today || task.status === 'done') {
            return false
          }
          break

        case 'today':
          // Due today
          if (task.dueDate !== today) return false
          break

        case 'next7':
          // Due in next 7 days (inclusive of today)
          if (!task.dueDate) return false
          const next7 = getDatePlusDays(today, 7)
          if (task.dueDate < today || task.dueDate > next7) return false
          break

        case 'none':
          // No due date set
          if (task.dueDate !== null) return false
          break

        case 'range':
          // Custom date range
          if (!task.dueDate) return false
          const { from, to } = filters.due
          if (from && task.dueDate < from) return false
          if (to && task.dueDate > to) return false
          break
      }
    }

    // Priority filter - matches if task.priority is in selected set
    if (filters.priorities.length > 0) {
      if (!filters.priorities.includes(task.priority)) return false
    }

    return true
  })
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

/**
 * Add days to a date string
 */
function getDatePlusDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

/**
 * Extract unique labels from tasks (returns label names for filtering)
 */
export function getUniqueLabels(tasks: Task[]): string[] {
  const labelSet = new Set<string>()
  tasks.forEach(task => {
    task.labels.forEach(label => labelSet.add(label.name))
  })
  return Array.from(labelSet).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
}

/**
 * Extract unique assignees from tasks
 */
export function getUniqueAssignees(tasks: Task[]): Array<{ id: string; name: string }> {
  const assigneeMap = new Map<string, { id: string; name: string }>()
  tasks.forEach(task => {
    if (task.assignee) {
      assigneeMap.set(task.assignee.id, task.assignee)
    }
  })
  return Array.from(assigneeMap.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  )
}

/**
 * Count active filters
 */
export function countActiveFilters(filters: FiltersState): number {
  let count = 0
  if (filters.query.trim()) count++
  if (filters.labels.length > 0) count += filters.labels.length
  if (filters.assigneeId !== 'all') count++
  if (filters.due.preset !== 'all') count++
  if (filters.priorities.length > 0) count += filters.priorities.length
  return count
}

