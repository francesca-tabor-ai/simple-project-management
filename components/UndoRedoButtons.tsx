'use client'

import { type ActionMeta } from '@/hooks/useUndoableState'

interface UndoRedoButtonsProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  lastAction?: ActionMeta | null
}

export default function UndoRedoButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  lastAction,
}: UndoRedoButtonsProps) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform)
  const undoShortcut = isMac ? '⌘Z' : 'Ctrl+Z'
  const redoShortcut = isMac ? '⌘⇧Z' : 'Ctrl+Shift+Z'

  // Generate contextual tooltip based on last action
  const getUndoTooltip = () => {
    if (!canUndo) return `Undo (${undoShortcut})`
    if (lastAction?.description) {
      return `Undo: ${lastAction.description} (${undoShortcut})`
    }
    // Fallback based on action type
    const actionLabels: Record<string, string> = {
      delete: 'Delete task',
      move: 'Move task',
      edit: 'Edit task',
      'bulk-delete': 'Delete tasks',
      'bulk-move': 'Move tasks',
      create: 'Create task',
    }
    const label = lastAction?.type ? actionLabels[lastAction.type] || 'Last action' : 'Last action'
    return `Undo: ${label} (${undoShortcut})`
  }

  return (
    <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-start">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`p-2 md:p-2 rounded-[10px] transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
          canUndo
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
        }`}
        title={getUndoTooltip()}
        aria-label={getUndoTooltip()}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
          />
        </svg>
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`p-2 md:p-2 rounded-[10px] transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
          canRedo
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
        }`}
        title={`Redo (${redoShortcut})`}
        aria-label={`Redo (${redoShortcut})`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
          />
        </svg>
      </button>
    </div>
  )
}

