'use client'

import { type Task } from '@/lib/task-types'
import { type Lane } from '@/lib/swimlanes'
import { type SortState } from '@/lib/sorting'
import KanbanColumns from './KanbanColumns'

type Status = 'pending' | 'in_progress' | 'done'

interface SwimlaneBoardViewProps {
  lanes: Lane[]
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

export default function SwimlaneBoardView({
  lanes,
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
}: SwimlaneBoardViewProps) {
  return (
    <div className="space-y-6 mb-20">
      {lanes.map((lane) => (
        <div
          key={lane.laneId}
          className="bg-white rounded-[20px] border-2 border-gray-200 overflow-hidden"
        >
          {/* Lane Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {lane.laneTitle}
            </h2>
            <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full font-medium">
              {lane.tasks.length} {lane.tasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {/* Lane Content - 3 Columns */}
          <div className="p-2 md:p-6">
            <KanbanColumns
              tasks={lane.tasks}
              selectedTaskIds={selectedTaskIds}
              editingTaskId={editingTaskId}
              draftTitle={draftTitle}
              titleError={titleError}
              sort={sort}
              onTaskClick={onTaskClick}
              onCheckboxChange={onCheckboxChange}
              onStartEditTitle={onStartEditTitle}
              onSaveTitle={onSaveTitle}
              onCancelEdit={onCancelEdit}
              onTitleChange={onTitleChange}
              onTitleKeyDown={onTitleKeyDown}
              onDragStart={onDragStart}
              onDrop={onDrop}
              isSelectionMode={isSelectionMode}
            />
          </div>
        </div>
      ))}

      {lanes.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No tasks to display</p>
          <p className="text-sm mt-2">Create a task to get started</p>
        </div>
      )}
    </div>
  )
}

