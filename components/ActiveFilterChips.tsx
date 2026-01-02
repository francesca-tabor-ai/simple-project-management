'use client'

import { type Task } from '@/lib/task-types'
import { type FiltersState, DEFAULT_FILTERS, getUniqueAssignees } from '@/lib/filters'
import LabelChip from './LabelChip'

interface ActiveFilterChipsProps {
  filters: FiltersState
  tasks: Task[]
  onFiltersChange: (filters: FiltersState) => void
}

const priorityLabels: Record<Task['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

const dueLabels: Record<string, string> = {
  overdue: 'Overdue',
  today: 'Due today',
  next7: 'Next 7 days',
  none: 'No due date',
}

export default function ActiveFilterChips({ filters, tasks, onFiltersChange }: ActiveFilterChipsProps) {
  const hasActiveFilters = 
    filters.query.trim() ||
    filters.labels.length > 0 ||
    filters.assigneeId !== 'all' ||
    filters.due.preset !== 'all' ||
    filters.priorities.length > 0

  if (!hasActiveFilters) return null

  const uniqueAssignees = getUniqueAssignees(tasks)

  const handleRemoveQuery = () => {
    onFiltersChange({ ...filters, query: '' })
  }

  const handleRemoveLabel = (label: string) => {
    onFiltersChange({
      ...filters,
      labels: filters.labels.filter(l => l !== label)
    })
  }

  const handleRemoveAssignee = () => {
    onFiltersChange({ ...filters, assigneeId: 'all' })
  }

  const handleRemoveDue = () => {
    onFiltersChange({ ...filters, due: { preset: 'all' } })
  }

  const handleRemovePriority = (priority: Task['priority']) => {
    onFiltersChange({
      ...filters,
      priorities: filters.priorities.filter(p => p !== priority)
    })
  }

  const handleClearAll = () => {
    onFiltersChange(DEFAULT_FILTERS)
  }

  const getAssigneeName = (id: string) => {
    if (id === 'unassigned') return 'Unassigned'
    return uniqueAssignees.find(a => a.id === id)?.name || id
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm font-medium text-gray-600">Active filters:</span>

      {/* Search Query */}
      {filters.query.trim() && (
        <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
          <span>Search: "{filters.query}"</span>
          <button
            onClick={handleRemoveQuery}
            className="ml-1 hover:text-primary-hover"
            aria-label="Remove search filter"
          >
            ×
          </button>
        </div>
      )}

      {/* Labels */}
      {filters.labels.map(label => (
        <div
          key={label}
          className="inline-flex items-center gap-1 px-3 py-1 bg-accent-yellow/30 text-gray-800 rounded-full text-sm"
        >
          <span>Label: {label === '__no_label__' ? 'No label' : label}</span>
          <button
            onClick={() => handleRemoveLabel(label)}
            className="ml-1 hover:text-gray-900"
            aria-label={`Remove ${label} filter`}
          >
            ×
          </button>
        </div>
      ))}

      {/* Assignee */}
      {filters.assigneeId !== 'all' && (
        <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          <span>Assignee: {getAssigneeName(filters.assigneeId)}</span>
          <button
            onClick={handleRemoveAssignee}
            className="ml-1 hover:text-blue-900"
            aria-label="Remove assignee filter"
          >
            ×
          </button>
        </div>
      )}

      {/* Due Date */}
      {filters.due.preset !== 'all' && (
        <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
          <span>Due: {dueLabels[filters.due.preset] || filters.due.preset}</span>
          <button
            onClick={handleRemoveDue}
            className="ml-1 hover:text-purple-900"
            aria-label="Remove due date filter"
          >
            ×
          </button>
        </div>
      )}

      {/* Priorities */}
      {filters.priorities.map(priority => (
        <div
          key={priority}
          className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
        >
          <span>Priority: {priorityLabels[priority]}</span>
          <button
            onClick={() => handleRemovePriority(priority)}
            className="ml-1 hover:text-orange-900"
            aria-label={`Remove ${priority} priority filter`}
          >
            ×
          </button>
        </div>
      ))}

      {/* Clear All */}
      <button
        onClick={handleClearAll}
        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
        aria-label="Clear all filters"
      >
        Clear all
      </button>
    </div>
  )
}

