import { useEffect } from 'react'

interface KeyboardShortcutsOptions {
  onUndo: () => void
  onRedo: () => void
  enabled?: boolean
}

/**
 * Hook to handle keyboard shortcuts for undo/redo
 * - Cmd/Ctrl+Z: Undo
 * - Cmd/Ctrl+Shift+Z: Redo
 * - Ctrl+Y: Redo (Windows convention)
 */
export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  enabled = true,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in input fields
      const target = e.target as HTMLElement
      const isInputField = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if (isInputField) return

      const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform)
      const modKey = isMac ? e.metaKey : e.ctrlKey

      // Undo: Cmd/Ctrl+Z (without Shift)
      if (modKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        onUndo()
        return
      }

      // Redo: Cmd/Ctrl+Shift+Z
      if (modKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        onRedo()
        return
      }

      // Redo: Ctrl+Y (Windows convention)
      if (!isMac && e.ctrlKey && e.key === 'y') {
        e.preventDefault()
        onRedo()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onUndo, onRedo, enabled])
}

