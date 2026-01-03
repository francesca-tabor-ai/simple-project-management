'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { type Task, type Label } from '@/lib/task-types'
import { updateTask, deleteTask } from '@/app/actions/tasks'
import { type ActionMeta } from '@/hooks/useUndoableState'
import { useAutosave } from '@/hooks/useAutosave'
import { useCalendarSync } from '@/hooks/useCalendarSync'
import { makeLabel, equalsLabel, normalizeLabelName, getColorForLabel } from '@/lib/label-utils'
import LabelChip from './LabelChip'
import ColorPicker from './ColorPicker'
import SaveStatusIndicator from './SaveStatusIndicator'
import GoogleCalendarSection from './GoogleCalendarSection'

interface TaskDetailsDrawerProps {
  task: Task | null
  onClose: () => void
  onTaskUpdate?: (task: Task, meta: ActionMeta) => void
}

// Hardcoded users for assignee dropdown
const AVAILABLE_USERS = [
  { id: '1', name: 'Francesca' },
  { id: '2', name: 'Alex' },
  { id: '3', name: 'Sam' },
  { id: '4', name: 'Priya' },
  { id: '5', name: 'Jordan' },
]

export default function TaskDetailsDrawer({ task, onClose, onTaskUpdate }: TaskDetailsDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const [localTask, setLocalTask] = useState<Task | null>(task)
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newLabelColor, setNewLabelColor] = useState<string>('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [labelError, setLabelError] = useState('')
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null)
  const [newAttachment, setNewAttachment] = useState({ title: '', url: '' })

  // Sync local state when task prop changes
  useEffect(() => {
    setLocalTask(task)
  }, [task])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Focus trap (basic implementation)
  useEffect(() => {
    if (!task) return
    const drawer = drawerRef.current
    if (!drawer) return

    const focusableElements = drawer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    drawer.addEventListener('keydown', handleTab as any)
    return () => drawer.removeEventListener('keydown', handleTab as any)
  }, [task])

  // Autosave hook for remote persistence
  const { status: saveStatus, error: saveError, flush: flushSave } = useAutosave(
    localTask,
    async (draftTask) => {
      if (!task || !draftTask) return
      
      // Calculate diff to send only changed fields
      const updates: Record<string, any> = {}
      const keys = Object.keys(draftTask) as (keyof Task)[]
      
      for (const key of keys) {
        if (key !== 'id' && key !== 'user_id' && key !== 'created_at' && key !== 'updated_at') {
          if (JSON.stringify(draftTask[key]) !== JSON.stringify(task[key])) {
            updates[key] = draftTask[key]
          }
        }
      }
      
      // Only persist if there are actual changes
      if (Object.keys(updates).length > 0) {
        console.log('[TaskDetailsDrawer] Saving changes:', Object.keys(updates))
        try {
          await updateTask(task.id, updates as Partial<Task>)
          console.log('[TaskDetailsDrawer] Save successful')
        } catch (error) {
          console.error('[TaskDetailsDrawer] Save failed:', error)
          throw error // Re-throw so useAutosave can handle it
        }
      }
    },
    { 
      debounceMs: 400,
      onError: (error) => {
        console.error('[TaskDetailsDrawer] Autosave error:', error)
        // The SaveStatusIndicator will show the error state
      }
    }
  )

  // Flush autosave on close
  useEffect(() => {
    return () => {
      flushSave()
    }
  }, [flushSave])

  // Auto-sync to Google Calendar when task changes
  // IMPORTANT: Call this hook BEFORE any early returns to maintain hooks order
  useCalendarSync({
    task: localTask,
    enabled: !!(localTask?.googleCalendar?.synced),
    debounceMs: 500,
  })

  // Early return AFTER all hooks have been called
  if (!task || !localTask) return null

  const handleUpdate = (updates: Partial<Task>) => {
    const updatedTask = { ...localTask, ...updates }
    setLocalTask(updatedTask)
    
    // Optimistic update to global state
    if (onTaskUpdate) {
      const meta: ActionMeta = {
        type: 'edit',
        taskIds: [task.id],
      }
      onTaskUpdate(updatedTask, meta)
    }
    
    // Autosave will handle remote persistence with debouncing
  }

  const handleTitleChange = (title: string) => {
    handleUpdate({ title })
  }

  const handleDescriptionBlur = () => {
    if (localTask.description !== task.description) {
      handleUpdate({ description: localTask.description })
    }
  }

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return
    const newItem = {
      id: crypto.randomUUID(),
      text: newChecklistItem.trim(),
      done: false,
    }
    // Immutable update - create new array
    const updatedChecklist = [...localTask.checklist, newItem]
    handleUpdate({ checklist: updatedChecklist })
    setNewChecklistItem('')
    
    // Flush immediately for discrete checklist actions (don't wait for 400ms debounce)
    await flushSave()
  }

  const handleToggleChecklistItem = async (itemId: string) => {
    // Immutable update - create new array and new item objects
    const updated = localTask.checklist.map(item =>
      item.id === itemId ? { ...item, done: !item.done } : item
    )
    handleUpdate({ checklist: updated })
    
    // Flush immediately for discrete actions
    await flushSave()
  }

  const handleDeleteChecklistItem = async (itemId: string) => {
    // Immutable update - create new array via filter
    const updatedChecklist = localTask.checklist.filter(item => item.id !== itemId)
    handleUpdate({ checklist: updatedChecklist })
    
    // Flush immediately for discrete actions
    await flushSave()
  }

  const handleAddLabel = () => {
    const trimmed = normalizeLabelName(newLabel)
    if (!trimmed) {
      setLabelError('Label cannot be empty')
      return
    }
    
    // Check for duplicate (case-insensitive)
    const isDuplicate = localTask.labels.some(label => equalsLabel(label, trimmed))
    if (isDuplicate) {
      setLabelError('Label already exists')
      setNewLabel('')
      return
    }
    
    // Create new label with color
    const color = newLabelColor || getColorForLabel(trimmed)
    const newLabelObj = makeLabel(trimmed, color)
    
    handleUpdate({ labels: [...localTask.labels, newLabelObj] })
    setNewLabel('')
    setNewLabelColor('')
    setShowColorPicker(false)
    setLabelError('')
  }

  const handleRemoveLabel = (labelId: string) => {
    handleUpdate({ labels: localTask.labels.filter(l => l.id !== labelId) })
  }
  
  const handleChangeLabelColor = (labelId: string, color: string) => {
    const updatedLabels = localTask.labels.map(label =>
      label.id === labelId ? { ...label, color } : label
    )
    handleUpdate({ labels: updatedLabels })
    setEditingLabelId(null)
  }

  const handleAddAttachment = () => {
    const { title, url } = newAttachment
    if (!title.trim() || !url.trim()) return
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      alert('URL must start with http:// or https://')
      return
    }
    const newItem = {
      id: crypto.randomUUID(),
      title: title.trim(),
      url: url.trim(),
    }
    handleUpdate({ attachments: [...localTask.attachments, newItem] })
    setNewAttachment({ title: '', url: '' })
  }

  const handleDeleteAttachment = (attachmentId: string) => {
    handleUpdate({ attachments: localTask.attachments.filter(a => a.id !== attachmentId) })
  }

  const completedCount = localTask.checklist.filter(item => item.done).length
  const totalCount = localTask.checklist.length
  const checklistProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const statusLabels = {
    pending: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 h-full w-full md:w-[520px] bg-card shadow-2xl z-50 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-gray-200 p-4 md:p-6 z-10">
          <div className="flex items-start justify-between gap-2 md:gap-4 mb-3">
            <input
              id="drawer-title"
              type="text"
              value={localTask.title}
              onChange={(e) => setLocalTask({ ...localTask, title: e.target.value })}
              onBlur={(e) => handleTitleChange(e.target.value)}
              className="flex-1 text-xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded-md px-2 py-1 -ml-2"
            />
            
            <div className="flex items-center gap-3">
              {/* Save Status Indicator */}
              <SaveStatusIndicator
                status={saveStatus}
                error={saveError}
                onRetry={flushSave}
              />
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close drawer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
              {statusLabels[localTask.status]}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 space-y-6 md:space-y-8 pb-20 md:pb-6">
          {/* Description */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Description</h3>
            <textarea
              value={localTask.description}
              onChange={(e) => setLocalTask({ ...localTask, description: e.target.value })}
              onBlur={handleDescriptionBlur}
              placeholder="Add a description..."
              className="w-full min-h-[120px] px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-[12px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white resize-y transition-all"
            />
          </section>

          {/* Priority */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Priority</h3>
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                <button
                  key={priority}
                  onClick={() => handleUpdate({ priority })}
                  className={`px-4 py-2 rounded-[10px] text-sm font-medium capitalize transition-all ${
                    localTask.priority === priority
                      ? priorityColors[priority]
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </section>

          {/* Due Date */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Due Date</h3>
            <div className="flex gap-2">
              <input
                type="date"
                value={localTask.dueDate || ''}
                onChange={(e) => handleUpdate({ dueDate: e.target.value || null })}
                className="flex-1 px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-[12px] text-gray-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
              />
              {localTask.dueDate && (
                <button
                  onClick={() => handleUpdate({ dueDate: null })}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-[12px] hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </section>

          {/* Assignee */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Assignee</h3>
            <div className="flex gap-2">
              <select
                value={localTask.assignee?.id || ''}
                onChange={(e) => {
                  const user = AVAILABLE_USERS.find(u => u.id === e.target.value)
                  handleUpdate({ assignee: user || null })
                }}
                className="flex-1 px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-[12px] text-gray-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
              >
                <option value="">Unassigned</option>
                {AVAILABLE_USERS.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              {localTask.assignee && (
                <button
                  onClick={() => handleUpdate({ assignee: null })}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-[12px] hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </section>

          {/* Labels */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Labels</h3>
            
            {/* Existing labels */}
            <div className="flex flex-wrap gap-2 mb-3">
              {localTask.labels.map(label => (
                <div key={label.id} className="relative">
                  <LabelChip
                    label={label}
                    size="md"
                    onRemove={() => handleRemoveLabel(label.id)}
                    onClick={() => setEditingLabelId(editingLabelId === label.id ? null : label.id)}
                  />
                  
                  {/* Color picker popover */}
                  {editingLabelId === label.id && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border-2 border-gray-200 z-20">
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-600 mb-2 px-2">Change color</p>
                        <ColorPicker
                          selectedColor={label.color}
                          onSelectColor={(color) => handleChangeLabelColor(label.id, color)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Add new label */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => {
                    setNewLabel(e.target.value)
                    setLabelError('')
                    // Auto-generate color preview
                    if (e.target.value.trim()) {
                      setNewLabelColor(getColorForLabel(e.target.value.trim()))
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddLabel()
                    }
                  }}
                  placeholder="Add label..."
                  className="flex-1 px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-[12px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
                />
                
                {/* Color preview/picker toggle */}
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-10 h-10 rounded-[12px] border-2 border-gray-200 hover:border-gray-300 transition-colors flex-shrink-0"
                  style={{ backgroundColor: newLabelColor || '#E5E7EB' }}
                  aria-label="Choose label color"
                  title="Choose color"
                />
                
                <button
                  onClick={handleAddLabel}
                  className="px-4 py-2 bg-primary text-white rounded-[12px] hover:bg-primary-hover transition-colors text-sm font-medium"
                >
                  Add
                </button>
              </div>
              
              {/* Color picker */}
              {showColorPicker && (
                <div className="bg-gray-50 rounded-lg border-2 border-gray-200 p-2">
                  <ColorPicker
                    selectedColor={newLabelColor}
                    onSelectColor={setNewLabelColor}
                  />
                </div>
              )}
              
              {/* Error message */}
              {labelError && (
                <p className="text-xs text-red-600">{labelError}</p>
              )}
            </div>
          </section>

          {/* Checklist */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Checklist</h3>
              {totalCount > 0 && (
                <span className="text-xs text-gray-500">
                  {completedCount}/{totalCount} completed
                </span>
              )}
            </div>
            {totalCount > 0 && (
              <div className="mb-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-green transition-all duration-300"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
            )}
            <div className="space-y-2 mb-3">
              {localTask.checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleToggleChecklistItem(item.id)}
                    className="w-5 h-5 rounded-md border-2 border-gray-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                  />
                  <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {item.text}
                  </span>
                  <button
                    onClick={() => handleDeleteChecklistItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                    aria-label="Delete checklist item"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                placeholder="Add checklist item..."
                className="flex-1 px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-[12px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
              />
              <button
                onClick={handleAddChecklistItem}
                className="px-4 py-2 bg-primary text-white rounded-[12px] hover:bg-primary-hover transition-colors text-sm font-medium"
              >
                Add
              </button>
            </div>
          </section>

          {/* Attachments */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Attachments & Links</h3>
            {localTask.attachments.length > 0 && (
              <div className="space-y-2 mb-4">
                {localTask.attachments.map(attachment => (
                  <div key={attachment.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-[10px] group">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-sm text-primary hover:underline truncate"
                    >
                      {attachment.title}
                    </a>
                    <button
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                      aria-label="Delete attachment"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <input
                type="text"
                value={newAttachment.title}
                onChange={(e) => setNewAttachment({ ...newAttachment, title: e.target.value })}
                placeholder="Link title..."
                className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-[12px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
              />
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newAttachment.url}
                  onChange={(e) => setNewAttachment({ ...newAttachment, url: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-[12px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
                />
                <button
                  onClick={handleAddAttachment}
                  className="px-4 py-2 bg-primary text-white rounded-[12px] hover:bg-primary-hover transition-colors text-sm font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          </section>

          {/* Google Calendar Integration */}
          <GoogleCalendarSection
            task={localTask}
            onTaskUpdate={(updates) => {
              const updatedTask = { ...localTask, ...updates }
              setLocalTask(updatedTask)
              if (onTaskUpdate) {
                onTaskUpdate(updatedTask, { type: 'edit' })
              }
            }}
          />
        </div>
      </div>
    </>
  )
}

