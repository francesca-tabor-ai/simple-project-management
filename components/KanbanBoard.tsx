'use client'

import { useState, useEffect, useCallback } from 'react'
import { type Task } from '@/lib/task-types'
import { updateTaskStatus, updateTask } from '@/app/actions/tasks'
import { migrateLegacyLabels } from '@/lib/label-utils'
import { useUndoableState, type ActionMeta } from '@/hooks/useUndoableState'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useToast } from './ToastContainer'
import TaskDetailsDrawer from './TaskDetailsDrawer'
import BulkActionBar from './BulkActionBar'
import KanbanColumns from './KanbanColumns'
import SwimlaneBoardView from './SwimlaneBoardView'
import FilterToolbar from './FilterToolbar'
import ActiveFilterChips from './ActiveFilterChips'
import UndoRedoButtons from './UndoRedoButtons'
import { type GroupBy, buildLanes, GROUP_BY_LABELS } from '@/lib/swimlanes'
import { type FiltersState, DEFAULT_FILTERS, filterTasks, countActiveFilters } from '@/lib/filters'
import { type SortState, DEFAULT_SORT } from '@/lib/sorting'
import { STATUS_LABELS } from '@/lib/task-types'
import SortControls from './SortControls'

type Status = 'pending' | 'in_progress' | 'done'

interface KanbanBoardProps {
  initialTasks: Task[]
}

export default function KanbanBoard({ initialTasks }: KanbanBoardProps) {
  // Migrate legacy labels on initial load
  const migratedInitialTasks = initialTasks.map(task => ({
    ...task,
    labels: migrateLegacyLabels(task.labels)
  }))

  // Undoable state management
  const {
    state: tasks,
    commit,
    undo,
    redo,
    canUndo,
    canRedo,
    lastAction,
    reset,
  } = useUndoableState<Task[]>(migratedInitialTasks, { limit: 50 })

  const { showToast } = useToast()
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)

  // Apply filters to get filtered tasks
  const filteredTasks = filterTasks(tasks, filters)

  // Build lanes based on filtered tasks
  const lanes = buildLanes(filteredTasks, groupBy)

  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) || null : null
  const isSelectionMode = selectedTaskIds.size > 0

  // Keyboard shortcuts for undo/redo
  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    enabled: true,
  })

  // Show toast notifications for actions with undo option
  useEffect(() => {
    if (!lastAction) return

    const shouldShowToast = [
      'delete',
      'bulk-delete',
      'move',
      'bulk-move',
    ].includes(lastAction.type)

    if (shouldShowToast && lastAction.description) {
      showToast({
        message: lastAction.description,
        type: 'info',
        showUndo: true,
        onUndo: undo,
        duration: 5000,
      })
    }
  }, [lastAction, showToast, undo])

  // Count hidden selected tasks (selected but filtered out)
  const hiddenSelectedCount = Array.from(selectedTaskIds).filter(
    id => !filteredTasks.some(t => t.id === id)
  ).length

  // Clear selection on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelectionMode) {
        setSelectedTaskIds(new Set())
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isSelectionMode])

  // Auto-close drawer if selected task is deleted
  useEffect(() => {
    if (selectedTaskId && !tasks.find(t => t.id === selectedTaskId)) {
      setSelectedTaskId(null)
    }
  }, [tasks, selectedTaskId])

  // Remove deleted tasks from selection
  useEffect(() => {
    if (selectedTaskIds.size > 0) {
      const validIds = new Set(
        Array.from(selectedTaskIds).filter(id => tasks.some(t => t.id === id))
      )
      if (validIds.size !== selectedTaskIds.size) {
        setSelectedTaskIds(validIds)
      }
    }
  }, [initialTasks, selectedTaskIds])

  const handleDragStart = (taskId: string, e: React.DragEvent) => {
    // Prevent drag when editing title or in selection mode
    if (editingTaskId === taskId || isSelectionMode) {
      e.preventDefault()
      return
    }
    setDraggedTaskId(taskId)
  }

  const handleDrop = async (status: Status) => {
    if (!draggedTaskId) return

    const draggedTask = tasks.find(t => t.id === draggedTaskId)
    if (!draggedTask) return

    // Optimistic update with undo support
    const updatedTasks = tasks.map(t =>
      t.id === draggedTaskId ? { ...t, status } : t
    )

    const meta: ActionMeta = {
      type: 'move',
      taskIds: [draggedTaskId],
      description: `Moved to ${STATUS_LABELS[status]}`,
    }

    commit(updatedTasks, meta)
    setDraggedTaskId(null)

    // Persist to server
    try {
      await updateTaskStatus(draggedTaskId, status)
    } catch (error) {
      console.error('Failed to update task:', error)
      showToast({
        message: 'Failed to move task. Changes reverted.',
        type: 'error',
      })
      // Rollback by undoing
      undo()
    }
  }

  const handleTaskClick = (taskId: string, e: React.MouseEvent) => {
    // Don't open drawer if we're editing this task
    if (editingTaskId === taskId) return

    // Check for modifier keys (Ctrl/Cmd click)
    const isModifierClick = e.ctrlKey || e.metaKey

    if (isModifierClick) {
      // Toggle selection
      e.stopPropagation()
      toggleTaskSelection(taskId)
      return
    }

    // If in selection mode, clicking toggles selection instead of opening drawer
    if (isSelectionMode) {
      toggleTaskSelection(taskId)
      return
    }

    // Normal click - open drawer
    setSelectedTaskId(taskId)
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const handleCheckboxChange = (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    toggleTaskSelection(taskId)
  }

  const handleCloseDrawer = () => {
    setSelectedTaskId(null)
  }

  const handleClearSelection = () => {
    setSelectedTaskIds(new Set())
  }

  const handleStartEditTitle = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening drawer or toggling selection
    setEditingTaskId(task.id)
    setDraftTitle(task.title)
    setTitleError(null)
  }

  const handleSaveTitle = async (taskId: string) => {
    const trimmed = draftTitle.trim()
    
    if (!trimmed) {
      setTitleError('Title cannot be empty')
      return
    }

    // Optimistic update
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, title: trimmed } : t
    )

    const meta: ActionMeta = {
      type: 'edit',
      taskIds: [taskId],
    }

    commit(updatedTasks, meta)
    setEditingTaskId(null)
    setTitleError(null)

    // Persist to server
    try {
      await updateTask(taskId, { title: trimmed })
    } catch (error) {
      console.error('Failed to update title:', error)
      setTitleError('Failed to save')
      showToast({
        message: 'Failed to save title. Changes reverted.',
        type: 'error',
      })
      undo()
    }
  }

  const handleCancelEdit = () => {
    setEditingTaskId(null)
    setDraftTitle('')
    setTitleError(null)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent, taskId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveTitle(taskId)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  const activeFilterCount = countActiveFilters(filters)

  return (
    <>
      {/* Filter Toolbar */}
      <FilterToolbar
        filters={filters}
        tasks={tasks}
        onFiltersChange={setFilters}
      />

      {/* Active Filter Chips */}
      <ActiveFilterChips
        filters={filters}
        tasks={tasks}
        onFiltersChange={setFilters}
      />

      {/* Results Info */}
      {activeFilterCount > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      )}

      {/* Group By & Sort Controls */}
      <div className="mb-6 bg-white rounded-[16px] border-2 border-gray-200 p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          {/* Group By Control */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
            <label htmlFor="group-by" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Group by:
            </label>
            <select
              id="group-by"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="px-3 md:px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-[12px] text-sm text-gray-800 focus:outline-none focus:border-primary transition-all flex-1 md:flex-initial min-h-[44px]"
            >
              {(Object.keys(GROUP_BY_LABELS) as GroupBy[]).map((mode) => (
                <option key={mode} value={mode}>
                  {GROUP_BY_LABELS[mode]}
                </option>
              ))}
            </select>
            
            {groupBy !== 'none' && (
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {lanes.length} {lanes.length === 1 ? 'lane' : 'lanes'}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-8 bg-gray-200" />

          {/* Sort Controls */}
          <div className="w-full md:w-auto">
            <SortControls sort={sort} onSortChange={setSort} />
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-8 bg-gray-200" />

          {/* Undo/Redo Controls */}
          <div className="w-full md:w-auto">
            <UndoRedoButtons
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              lastAction={lastAction}
            />
          </div>
        </div>
      </div>

      {/* Board Content */}
      {groupBy === 'none' ? (
        // Regular ungrouped view
        <div className="mb-20">
          <KanbanColumns
            tasks={filteredTasks}
            selectedTaskIds={selectedTaskIds}
            editingTaskId={editingTaskId}
            draftTitle={draftTitle}
            titleError={titleError}
            sort={sort}
            onTaskClick={handleTaskClick}
            onCheckboxChange={handleCheckboxChange}
            onStartEditTitle={handleStartEditTitle}
            onSaveTitle={handleSaveTitle}
            onCancelEdit={handleCancelEdit}
            onTitleChange={setDraftTitle}
            onTitleKeyDown={handleTitleKeyDown}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            isSelectionMode={isSelectionMode}
          />
        </div>
      ) : (
        // Swimlane view
        <SwimlaneBoardView
          lanes={lanes}
          selectedTaskIds={selectedTaskIds}
          editingTaskId={editingTaskId}
          draftTitle={draftTitle}
          titleError={titleError}
          sort={sort}
          onTaskClick={handleTaskClick}
          onCheckboxChange={handleCheckboxChange}
          onStartEditTitle={handleStartEditTitle}
          onSaveTitle={handleSaveTitle}
          onCancelEdit={handleCancelEdit}
          onTitleChange={setDraftTitle}
          onTitleKeyDown={handleTitleKeyDown}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          isSelectionMode={isSelectionMode}
        />
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar 
        selectedTaskIds={selectedTaskIds}
        tasks={tasks}
        onClearSelection={handleClearSelection}
        onTasksUpdate={(updatedTasks, meta) => commit(updatedTasks, meta)}
      />

      {/* Hidden selection notice in bulk bar */}
      {hiddenSelectedCount > 0 && isSelectionMode && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-yellow-100 border-2 border-yellow-300 text-yellow-800 px-4 py-2 rounded-[12px] text-sm font-medium shadow-lg z-40">
          {hiddenSelectedCount} selected {hiddenSelectedCount === 1 ? 'task is' : 'tasks are'} hidden by filters
        </div>
      )}

      {/* Task Details Drawer */}
      <TaskDetailsDrawer 
        task={selectedTask} 
        onClose={handleCloseDrawer}
        onTaskUpdate={(updatedTask, meta) => {
          const updatedTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
          commit(updatedTasks, meta)
        }}
      />
    </>
  )
}
