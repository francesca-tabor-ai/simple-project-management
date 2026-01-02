'use client'

import { type SortState, type SortField, type SortOrder, DEFAULT_SORT, SORT_FIELD_LABELS } from '@/lib/sorting'

interface SortControlsProps {
  sort: SortState
  onSortChange: (sort: SortState) => void
}

export default function SortControls({ sort, onSortChange }: SortControlsProps) {
  const handleFieldChange = (field: SortField) => {
    onSortChange({ ...sort, field })
  }

  const handleOrderToggle = () => {
    onSortChange({ ...sort, order: sort.order === 'asc' ? 'desc' : 'asc' })
  }

  const handleReset = () => {
    onSortChange(DEFAULT_SORT)
  }

  const isDefaultSort = sort.field === DEFAULT_SORT.field && sort.order === DEFAULT_SORT.order

  // Get friendly order label based on field
  const getOrderLabel = () => {
    if (sort.field === 'createdAt') {
      return sort.order === 'desc' ? 'Newest first' : 'Oldest first'
    } else if (sort.field === 'dueDate') {
      return sort.order === 'asc' ? 'Soonest first' : 'Latest first'
    } else if (sort.field === 'priority') {
      return sort.order === 'desc' ? 'High to low' : 'Low to high'
    }
    return sort.order === 'asc' ? 'Ascending' : 'Descending'
  }

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full">
      <span className="text-sm font-medium text-gray-700 whitespace-nowrap hidden md:inline">Sort by:</span>

      {/* Sort Field Dropdown */}
      <select
        value={sort.field}
        onChange={(e) => handleFieldChange(e.target.value as SortField)}
        className="flex-1 md:flex-initial px-3 md:px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-[12px] text-sm text-gray-800 focus:outline-none focus:border-primary transition-all min-h-[44px]"
        aria-label="Sort field"
      >
        {(Object.keys(SORT_FIELD_LABELS) as SortField[]).map((field) => (
          <option key={field} value={field}>
            {SORT_FIELD_LABELS[field]}
          </option>
        ))}
      </select>

      {/* Order Toggle Button */}
      <button
        onClick={handleOrderToggle}
        className="flex-1 md:flex-initial px-3 md:px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-[12px] text-sm font-medium text-gray-800 hover:bg-gray-100 focus:outline-none focus:border-primary transition-all flex items-center justify-center gap-2 min-h-[44px]"
        aria-label={`Sort order: ${getOrderLabel()}`}
        aria-pressed={sort.order === 'desc'}
      >
        {sort.order === 'desc' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
        <span className="text-xs md:text-sm whitespace-nowrap">{getOrderLabel()}</span>
      </button>

      {/* Reset Button (only show if not default) */}
      {!isDefaultSort && (
        <button
          onClick={handleReset}
          className="px-3 py-2 bg-gray-100 text-gray-600 rounded-[12px] text-sm font-medium hover:bg-gray-200 transition-colors min-h-[44px]"
          aria-label="Reset to default sort"
        >
          Reset
        </button>
      )}
    </div>
  )
}

