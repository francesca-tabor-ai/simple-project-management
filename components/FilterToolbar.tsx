'use client'

import { useState, useEffect, useRef } from 'react'
import { type Task } from '@/lib/task-types'
import { type FiltersState, type DuePreset, getUniqueLabels, getUniqueAssignees } from '@/lib/filters'
import LabelChip from './LabelChip'

interface FilterToolbarProps {
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

const duePresetLabels: Record<DuePreset, string> = {
  all: 'All',
  overdue: 'Overdue',
  today: 'Due today',
  next7: 'Next 7 days',
  none: 'No due date',
  range: 'Custom range',
}

export default function FilterToolbar({ filters, tasks, onFiltersChange }: FilterToolbarProps) {
  const [searchValue, setSearchValue] = useState(filters.query)
  const [isLabelMenuOpen, setIsLabelMenuOpen] = useState(false)
  const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState(false)
  const labelMenuRef = useRef<HTMLDivElement>(null)
  const priorityMenuRef = useRef<HTMLDivElement>(null)

  const uniqueLabels = getUniqueLabels(tasks)
  const uniqueAssignees = getUniqueAssignees(tasks)
  const hasUnassignedTasks = tasks.some(t => !t.assignee)
  const hasUnlabeledTasks = tasks.some(t => t.labels.length === 0)

  // Debounced search (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.query) {
        onFiltersChange({ ...filters, query: searchValue })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchValue])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (labelMenuRef.current && !labelMenuRef.current.contains(e.target as Node)) {
        setIsLabelMenuOpen(false)
      }
      if (priorityMenuRef.current && !priorityMenuRef.current.contains(e.target as Node)) {
        setIsPriorityMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLabelToggle = (label: string) => {
    const newLabels = filters.labels.includes(label)
      ? filters.labels.filter(l => l !== label)
      : [...filters.labels, label]
    onFiltersChange({ ...filters, labels: newLabels })
  }

  const handlePriorityToggle = (priority: Task['priority']) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority]
    onFiltersChange({ ...filters, priorities: newPriorities })
  }

  return (
    <div className="bg-white rounded-[16px] border-2 border-gray-200 p-3 md:p-4 mb-6">
      <div className="flex flex-wrap gap-2 md:gap-3 items-stretch">
        {/* Search Input */}
        <div className="flex-1 min-w-full md:min-w-[200px]">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search tasks..."
            className="w-full px-3 md:px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-[12px] text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary transition-all min-h-[44px]"
            aria-label="Search tasks by title or description"
          />
        </div>

        {/* Label Filter (Multi-select) */}
        <div className="relative flex-1 md:flex-initial" ref={labelMenuRef}>
          <button
            onClick={() => setIsLabelMenuOpen(!isLabelMenuOpen)}
            className={`w-full md:w-auto px-3 md:px-4 py-2 rounded-[12px] text-sm font-medium transition-all min-h-[44px] ${
              filters.labels.length > 0
                ? 'bg-primary text-white'
                : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
            }`}
            aria-haspopup="menu"
            aria-expanded={isLabelMenuOpen}
          >
            Labels {filters.labels.length > 0 && `(${filters.labels.length})`}
          </button>

          {isLabelMenuOpen && (
            <div
              className="absolute top-full mt-2 left-0 bg-white rounded-[12px] shadow-lg border-2 border-gray-200 py-2 min-w-[200px] z-50 max-h-[300px] overflow-y-auto"
              role="menu"
            >
              {hasUnlabeledTasks && (
                <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.labels.includes('__no_label__')}
                    onChange={() => handleLabelToggle('__no_label__')}
                    className="w-4 h-4 rounded border-2 border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 italic">No label</span>
                </label>
              )}
              {uniqueLabels.length > 0 && hasUnlabeledTasks && (
                <div className="border-t border-gray-200 my-1" />
              )}
              {uniqueLabels.map(label => (
                <label key={label} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.labels.includes(label)}
                    onChange={() => handleLabelToggle(label)}
                    className="w-4 h-4 rounded border-2 border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
              {uniqueLabels.length === 0 && !hasUnlabeledTasks && (
                <div className="px-4 py-2 text-sm text-gray-400">No labels available</div>
              )}
            </div>
          )}
        </div>

        {/* Assignee Filter (Single-select) */}
        <select
          value={filters.assigneeId}
          onChange={(e) => onFiltersChange({ ...filters, assigneeId: e.target.value })}
          className={`flex-1 md:flex-initial px-3 md:px-4 py-2 rounded-[12px] text-sm font-medium transition-all min-h-[44px] ${
            filters.assigneeId !== 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-50 text-gray-700 border-2 border-gray-200'
          }`}
          aria-label="Filter by assignee"
        >
          <option value="all">All assignees</option>
          {hasUnassignedTasks && <option value="unassigned">Unassigned</option>}
          {uniqueAssignees.map(assignee => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.name}
            </option>
          ))}
        </select>

        {/* Due Date Filter */}
        <select
          value={filters.due.preset}
          onChange={(e) => onFiltersChange({
            ...filters,
            due: { preset: e.target.value as DuePreset }
          })}
          className={`flex-1 md:flex-initial px-3 md:px-4 py-2 rounded-[12px] text-sm font-medium transition-all min-h-[44px] ${
            filters.due.preset !== 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-50 text-gray-700 border-2 border-gray-200'
          }`}
          aria-label="Filter by due date"
        >
          {(Object.keys(duePresetLabels) as DuePreset[])
            .filter(preset => preset !== 'range') // Hide range for now (can add custom inputs later)
            .map(preset => (
              <option key={preset} value={preset}>
                {duePresetLabels[preset]}
              </option>
            ))}
        </select>

        {/* Priority Filter (Multi-select) */}
        <div className="relative flex-1 md:flex-initial" ref={priorityMenuRef}>
          <button
            onClick={() => setIsPriorityMenuOpen(!isPriorityMenuOpen)}
            className={`w-full md:w-auto px-3 md:px-4 py-2 rounded-[12px] text-sm font-medium transition-all min-h-[44px] ${
              filters.priorities.length > 0
                ? 'bg-primary text-white'
                : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
            }`}
            aria-haspopup="menu"
            aria-expanded={isPriorityMenuOpen}
          >
            Priority {filters.priorities.length > 0 && `(${filters.priorities.length})`}
          </button>

          {isPriorityMenuOpen && (
            <div
              className="absolute top-full mt-2 right-0 bg-white rounded-[12px] shadow-lg border-2 border-gray-200 py-2 min-w-[160px] z-50"
              role="menu"
            >
              {(['urgent', 'high', 'medium', 'low'] as Task['priority'][]).map(priority => (
                <label key={priority} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.priorities.includes(priority)}
                    onChange={() => handlePriorityToggle(priority)}
                    className="w-4 h-4 rounded border-2 border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 capitalize">{priorityLabels[priority]}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

