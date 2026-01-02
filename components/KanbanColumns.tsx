'use client'

import { type Task } from '@/lib/task-types'
import { updateTaskStatus, updateTask } from '@/app/actions/tasks'
import StatusMenu from './StatusMenu'
import { type SortState, sortTasks } from '@/lib/sorting'
import LabelChip from './LabelChip'
import { useState } from 'react'

type Status = 'pending' | 'in_progress' | 'done'

const statusConfig: Record<Status, { label: string; bg: string; accent: string }> = {
  pending: { 
    label: 'To Do', 
    bg: 'bg-gray-50',
    accent: 'border-gray-200'
  },
  in_progress: { 
    label: 'In Progress', 
    bg: 'bg-blue-50/40',
    accent: 'border-accent-blue'
  },
  done: { 
    label: 'Done', 
    bg: 'bg-green-50/40',
    accent: 'border-accent-green'
  },
}

const priorityConfig = {
  low: { color: 'bg-gray-200 text-gray-700', label: 'Low' },
  medium: { color: 'bg-blue-200 text-blue-700', label: 'Med' },
  high: { color: 'bg-orange-200 text-orange-700', label: 'High' },
  urgent: { color: 'bg-red-200 text-red-700', label: 'Urgent' },
}

interface KanbanColumnsProps {
  tasks: Task[]
  selectedTaskIds: Set<string>
  editingTaskId: string | null
  draftTitle: string
  titleError: string | null
  sort: SortState
  onTaskClick: (taskId: string, e: React.MouseEvent) => void
  onCheckboxChange: (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => void
  onStartEditTitle: (task: Task, e: React.MouseEvent) => void
  onSaveTitle: (taskId: string) => void
  onCancelEdit: () => void
  onTitleChange: (title: string) => void
  onTitleKeyDown: (e: React.KeyboardEvent, taskId: string) => void
  onDragStart: (taskId: string, e: React.DragEvent) => void
  onDrop: (status: Status) => void
  isSelectionMode: boolean
}

export default function KanbanColumns({
  tasks,
  selectedTaskIds,
  editingTaskId,
  draftTitle,
  titleError,
  sort,
  onTaskClick,
  onCheckboxChange,
  onStartEditTitle,
  onSaveTitle,
  onCancelEdit,
  onTitleChange,
  onTitleKeyDown,
  onDragStart,
  onDrop,
  isSelectionMode,
}: KanbanColumnsProps) {
  // Filter by status, then sort within each column
  const tasksByStatus = {
    pending: sortTasks(tasks.filter(t => t.status === 'pending'), sort),
    in_progress: sortTasks(tasks.filter(t => t.status === 'in_progress'), sort),
    done: sortTasks(tasks.filter(t => t.status === 'done'), sort),
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const isOverdue = (dueDate: string | null, status: Status) => {
    if (!dueDate || status === 'done') return false
    return new Date(dueDate) < new Date()
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="flex-1 overflow-x-auto md:overflow-x-visible px-4 md:px-0 -mx-4 md:mx-0 scroll-smooth kanban-scroll-container">
      <div className="flex md:grid md:grid-cols-3 gap-5 min-w-min md:min-w-0 pb-4 md:pb-0" style={{ scrollSnapType: 'x mandatory' }}>
        {(Object.keys(statusConfig) as Status[]).map((status) => (
          <div
            key={status}
            className={`rounded-[16px] border-2 p-5 min-h-[400px] transition-all flex-shrink-0 w-[85vw] max-w-[320px] md:w-auto md:max-w-none md:flex-shrink snap-start ${statusConfig[status].bg} ${statusConfig[status].accent}`}
            style={{ scrollSnapAlign: 'start' }}
            onDragOver={handleDragOver}
            onDrop={() => onDrop(status)}
          >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-base text-gray-800">
              {statusConfig[status].label}
            </h3>
            <span className="text-sm font-medium text-gray-500 bg-white/60 px-3 py-1 rounded-full">
              {tasksByStatus[status].length}
            </span>
          </div>
          
          <div className="space-y-3">
            {tasksByStatus[status].map((task) => {
              const completedChecklist = task.checklist.filter(item => item.done).length
              const totalChecklist = task.checklist.length
              const overdueDate = isOverdue(task.dueDate, task.status)
              const isEditing = editingTaskId === task.id
              const isSelected = selectedTaskIds.has(task.id)

              return (
                <div
                  key={task.id}
                  draggable={!isEditing && !isSelectionMode}
                  onDragStart={(e) => onDragStart(task.id, e)}
                  onClick={(e) => onTaskClick(task.id, e)}
                  className={`bg-card p-4 rounded-[14px] shadow-sm border-2 transition-all duration-200 group ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200/50'
                  } ${
                    !isEditing ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''
                  }`}
                >
                  <div className="task-card-content space-y-3">
                    {/* Header with Checkbox, Title, and Status */}
                    <div className="flex items-start gap-2">
                      {/* Selection checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onCheckboxChange(task.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-4 h-4 rounded border-2 border-gray-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer flex-shrink-0"
                        aria-label="Select task"
                      />

                      {/* Title */}
                      {isEditing ? (
                        <div className="flex-1">
                          <input
                            type="text"
                            value={draftTitle}
                            onChange={(e) => onTitleChange(e.target.value)}
                            onBlur={() => onSaveTitle(task.id)}
                            onKeyDown={(e) => onTitleKeyDown(e, task.id)}
                            autoFocus
                            className="w-full text-sm text-gray-800 font-medium leading-relaxed bg-white border-2 border-primary rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {titleError && (
                            <p className="text-xs text-red-600 mt-1">{titleError}</p>
                          )}
                        </div>
                      ) : (
                        <p
                          onClick={(e) => onStartEditTitle(task, e)}
                          className="text-sm text-gray-800 flex-1 leading-relaxed font-medium hover:text-primary transition-colors cursor-text"
                          title="Click to edit"
                        >
                          {task.title}
                        </p>
                      )}
                      
                      {/* Status menu */}
                      <StatusMenu 
                        taskId={task.id} 
                        currentStatus={task.status}
                      />
                    </div>

                    {/* Metadata badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Priority badge */}
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${priorityConfig[task.priority].color}`}>
                        {priorityConfig[task.priority].label}
                      </span>

                      {/* WhatsApp source badge */}
                      {task.source?.type === 'whatsapp' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                          WhatsApp
                        </span>
                      )}

                      {/* Due date */}
                      {task.dueDate && (
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                          overdueDate 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}

                      {/* Checklist progress */}
                      {totalChecklist > 0 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {completedChecklist}/{totalChecklist}
                        </span>
                      )}
                    </div>

                    {/* Labels */}
                    {task.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {task.labels.slice(0, 3).map(label => (
                          <LabelChip
                            key={label.id}
                            label={label}
                            size="sm"
                          />
                        ))}
                        {task.labels.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            +{task.labels.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Assignee */}
                    {task.assignee && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white text-xs font-medium">
                          {getInitials(task.assignee.name)}
                        </div>
                        <span className="text-xs text-gray-600">{task.assignee.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            
            {tasksByStatus[status].length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">
                No tasks yet
              </div>
            )}
          </div>
        </div>
      ))}
      </div>
    </div>
  )
}

