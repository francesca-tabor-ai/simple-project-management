'use client'

import { useState } from 'react'
import { type Task, STATUS_LABELS } from '@/lib/task-types'
import { bulkMoveStatus, bulkAddLabel, bulkRemoveLabel, bulkDeleteTasks } from '@/app/actions/tasks'
import { type ActionMeta } from '@/hooks/useUndoableState'
import { makeLabel, getAllLabels } from '@/lib/label-utils'
import LabelChip from './LabelChip'

interface BulkActionBarProps {
  selectedTaskIds: Set<string>
  tasks: Task[]
  onClearSelection: () => void
  onTasksUpdate: (tasks: Task[], meta: ActionMeta) => void
}

export default function BulkActionBar({ selectedTaskIds, tasks, onClearSelection, onTasksUpdate }: BulkActionBarProps) {
  const [newLabel, setNewLabel] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const selectedCount = selectedTaskIds.size
  const selectedTasks = tasks.filter(t => selectedTaskIds.has(t.id))

  // Get all unique labels from selected tasks
  const allLabelsInSelection = getAllLabels(selectedTasks)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleBulkMove = async (status: Task['status']) => {
    setIsProcessing(true)
    
    // Optimistic update
    const updatedTasks = tasks.map(t =>
      selectedTaskIds.has(t.id) ? { ...t, status } : t
    )
    
    const meta: ActionMeta = {
      type: 'bulk-move',
      taskIds: Array.from(selectedTaskIds),
      description: `Moved ${selectedCount} task(s) to ${STATUS_LABELS[status]}`,
    }
    
    onTasksUpdate(updatedTasks, meta)
    onClearSelection()
    
    // Persist to server
    try {
      await bulkMoveStatus(Array.from(selectedTaskIds), status)
    } catch (error) {
      console.error('Bulk move failed:', error)
      showMessage('error', 'Failed to move tasks')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddLabel = async () => {
    const trimmed = newLabel.trim()
    if (!trimmed) return

    setIsProcessing(true)
    try {
      const labelObj = makeLabel(trimmed)
      await bulkAddLabel(Array.from(selectedTaskIds), labelObj, tasks)
      showMessage('success', `Added label "${trimmed}" to ${selectedCount} task(s)`)
      setNewLabel('')
    } catch (error) {
      console.error('Add label failed:', error)
      showMessage('error', error instanceof Error ? error.message : 'Failed to add label')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveLabel = async (labelName: string) => {
    setIsProcessing(true)
    try {
      await bulkRemoveLabel(Array.from(selectedTaskIds), labelName, tasks)
      showMessage('success', `Removed label "${labelName}" from ${selectedCount} task(s)`)
    } catch (error) {
      console.error('Remove label failed:', error)
      showMessage('error', 'Failed to remove label')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkDelete = async () => {
    const confirmText = `Delete ${selectedCount} task(s)?`
    if (!confirm(confirmText)) return

    setIsProcessing(true)
    
    // Optimistic update - remove deleted tasks
    const updatedTasks = tasks.filter(t => !selectedTaskIds.has(t.id))
    
    const meta: ActionMeta = {
      type: 'bulk-delete',
      taskIds: Array.from(selectedTaskIds),
      description: `Deleted ${selectedCount} task(s)`,
    }
    
    onTasksUpdate(updatedTasks, meta)
    onClearSelection()
    
    // Persist to server
    try {
      await bulkDeleteTasks(Array.from(selectedTaskIds))
    } catch (error) {
      console.error('Bulk delete failed:', error)
      showMessage('error', 'Failed to delete tasks')
    } finally {
      setIsProcessing(false)
    }
  }

  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-40 p-3 md:p-4 pb-safe">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {/* Selection count */}
          <div className="font-semibold text-gray-900">
            {selectedCount} selected
          </div>

          {/* Move to status */}
          <div className="flex items-center gap-2 flex-1 md:flex-initial">
            <label htmlFor="bulk-status" className="text-sm text-gray-600 whitespace-nowrap hidden md:inline">
              Move to:
            </label>
            <select
              id="bulk-status"
              onChange={(e) => handleBulkMove(e.target.value as Task['status'])}
              disabled={isProcessing}
              className="flex-1 md:flex-initial px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-[10px] text-sm text-gray-800 focus:outline-none focus:border-primary transition-all disabled:opacity-50 min-h-[44px]"
              defaultValue=""
            >
              <option value="" disabled>
                Select status...
              </option>
              {(['pending', 'in_progress', 'done'] as const).map(status => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          {/* Add label */}
          <div className="flex items-center gap-2 flex-1 md:flex-initial w-full md:w-auto">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
              placeholder="Add label..."
              disabled={isProcessing}
              className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-[10px] text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary transition-all disabled:opacity-50 min-h-[44px]"
            />
            <button
              onClick={handleAddLabel}
              disabled={isProcessing || !newLabel.trim()}
              className="px-3 py-2 bg-primary text-white text-sm font-medium rounded-[10px] hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] whitespace-nowrap"
              aria-label="Add label to selected tasks"
            >
              Add Label
            </button>
          </div>

          {/* Remove label (if there are common labels) */}
          {allLabelsInSelection.length > 0 && (
            <div className="flex items-center gap-2 flex-1 md:flex-initial">
              <label htmlFor="bulk-remove-label" className="text-sm text-gray-600 whitespace-nowrap hidden md:inline">
                Remove:
              </label>
              <select
                id="bulk-remove-label"
                onChange={(e) => {
                  if (e.target.value) {
                    handleRemoveLabel(e.target.value)
                    e.target.value = '' // Reset
                  }
                }}
                disabled={isProcessing}
                className="flex-1 md:flex-initial px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-[10px] text-sm text-gray-800 focus:outline-none focus:border-primary transition-all disabled:opacity-50 min-h-[44px]"
                defaultValue=""
              >
                <option value="" disabled>
                  Select label...
                </option>
                {allLabelsInSelection.map(label => (
                  <option key={label.id} value={label.name}>
                    {label.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Delete */}
          <button
            onClick={handleBulkDelete}
            disabled={isProcessing}
            className="flex-1 md:flex-initial px-3 md:px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-[10px] hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            aria-label="Delete selected tasks"
          >
            Delete
          </button>

          {/* Clear selection */}
          <button
            onClick={onClearSelection}
            disabled={isProcessing}
            className="flex-1 md:flex-initial px-3 md:px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-[10px] hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed md:ml-auto min-h-[44px]"
            aria-label="Clear selection"
          >
            Clear
          </button>
        </div>

        {/* Status message */}
        {message && (
          <div
            className={`mt-3 px-4 py-2 rounded-[10px] text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
            role="status"
            aria-live="polite"
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}

