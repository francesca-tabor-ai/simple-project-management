# Undo / Redo - Feature Documentation

## Overview

The Undo/Redo feature provides a complete history management system that allows users to undo and redo task operations, including deletions, moves, status changes, and edits. The system uses optimistic UI updates with server persistence and automatic rollback on failure.

---

## Features

✅ **Undo/Redo Support** - Full history stack with 50-state limit  
✅ **Keyboard Shortcuts** - Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo), Ctrl+Y (redo)  
✅ **Toast Notifications** - Action feedback with undo button for delete/move  
✅ **Optimistic Updates** - Instant UI response with server persistence  
✅ **Auto-Rollback** - Reverts on server errors  
✅ **Tracked Actions** - Delete, bulk delete, move, bulk move, edit  
✅ **Drawer Integration** - Updates tracked and undoable  
✅ **Bulk Operations** - Multi-task undo/redo support  
✅ **Selection Sync** - Removed tasks cleared from selection  
✅ **Stable UI** - Drawer auto-closes for deleted tasks  

---

## Using Undo/Redo

### Keyboard Shortcuts

| Shortcut | Action | Platform |
|----------|--------|----------|
| `Cmd+Z` | Undo | macOS |
| `Ctrl+Z` | Undo | Windows/Linux |
| `Cmd+Shift+Z` | Redo | macOS |
| `Ctrl+Shift+Z` | Redo | Windows/Linux |
| `Ctrl+Y` | Redo | Windows/Linux |

**Smart Context:**
- Shortcuts disabled when typing in inputs/textareas
- Work everywhere else in the app
- Fast repeat support (hold key)

### Toolbar Buttons

Located in the top toolbar next to Sort controls:

- **Undo Button** (↶ icon)
  - Disabled when no history
  - Tooltip shows shortcut hint
  - Click to undo last action

- **Redo Button** (↷ icon)
  - Disabled when nothing to redo
  - Tooltip shows shortcut hint
  - Click to redo undone action

### Toast Notifications

Actions that trigger toasts with Undo button:

1. **Task Deleted**
   - Message: "Task deleted"
   - Shows for 5 seconds
   - Click "Undo" to restore

2. **Tasks Bulk Deleted**
   - Message: "Deleted X task(s)"
   - Shows for 5 seconds
   - Click "Undo" to restore all

3. **Task Moved**
   - Message: "Moved to {Status}"
   - Shows for 5 seconds
   - Click "Undo" to revert move

4. **Tasks Bulk Moved**
   - Message: "Moved X task(s) to {Status}"
   - Shows for 5 seconds
   - Click "Undo" to revert all

---

## Supported Operations

### 1. Single Task Delete
**Action:** Delete task from drawer or card  
**Undo Behavior:** Restores task to original position  
**Toast:** "Task deleted" with Undo

### 2. Bulk Delete
**Action:** Select multiple tasks → Delete  
**Undo Behavior:** Restores all deleted tasks  
**Toast:** "Deleted X task(s)" with Undo

### 3. Status Change (Move)
**Actions:**
- Drag and drop to column
- Quick status menu on card
- Status change in drawer

**Undo Behavior:** Returns task to previous status  
**Toast:** "Moved to {Status}" with Undo

### 4. Bulk Move
**Action:** Select multiple tasks → Move to status  
**Undo Behavior:** Returns all tasks to previous statuses  
**Toast:** "Moved X task(s) to {Status}" with Undo

### 5. Title Edit
**Action:** Inline rename or drawer title edit  
**Undo Behavior:** Reverts to previous title  
**Toast:** None (minor edit)

### 6. Property Edits
**Actions:**
- Description change
- Due date change
- Priority change
- Labels add/remove
- Assignee change
- Checklist updates
- Attachments add/remove

**Undo Behavior:** Reverts property to previous value  
**Toast:** None (minor edits)

---

## Technical Architecture

### History Stack Structure

```typescript
{
  present: Task[],        // Current state
  past: Task[][],         // Previous states (max 50)
  future: Task[][],       // States available for redo
  lastAction: ActionMeta | null  // Metadata for toasts
}
```

### Action Metadata

```typescript
type ActionType = 'delete' | 'move' | 'edit' | 'bulk-delete' | 'bulk-move' | 'create' | 'other'

interface ActionMeta {
  type: ActionType
  taskIds?: string[]
  description?: string  // For toast messages
}
```

### Flow Diagram

```
User Action
    ↓
Optimistic Update (commit with metadata)
    ↓
Local State Updated (instant UI)
    ↓
Server Persistence (async)
    ↓
Success → Continue
    OR
Failure → Undo + Show Error Toast
```

---

## Implementation Details

### `useUndoableState` Hook

Core hook managing history:

```typescript
const {
  state,              // Current tasks
  commit,             // Update with history
  undo,               // Go back in history
  redo,               // Go forward in history
  canUndo,            // Boolean for UI
  canRedo,            // Boolean for UI
  lastAction,         // Metadata for toasts
  reset,              // Clear history
  historySize,        // Debug info
  futureSize,         // Debug info
} = useUndoableState<Task[]>(initialTasks, { limit: 50 })
```

**Key Features:**
- Generic implementation (works with any data type)
- Configurable history limit
- Efficient shallow equality checks
- Prevents duplicate pushes

### Commit Function

Wrapper around state updates:

```typescript
commit(nextTasks, {
  type: 'delete',
  taskIds: ['task-123'],
  description: 'Task deleted'
})
```

**Behavior:**
- Pushes current state to `past`
- Updates `present` to next state
- Clears `future` (new commits invalidate redo)
- Stores metadata for toasts
- Limits history size (keeps last 50)

### Keyboard Shortcuts

```typescript
useKeyboardShortcuts({
  onUndo: undo,
  onRedo: redo,
  enabled: true,
})
```

**Smart Detection:**
- Checks for input/textarea focus
- Detects Mac vs Windows/Linux
- Prevents default browser behavior
- Multiple shortcut mappings

### Toast System

```typescript
showToast({
  message: 'Task deleted',
  type: 'info',
  showUndo: true,
  onUndo: undo,
  duration: 5000,
})
```

**Features:**
- Auto-dismiss after duration
- Manual dismiss button
- Undo action button
- Stacks up to 3 toasts
- Slide-up animation

---

## Integration Points

### KanbanBoard Component

Central orchestration:

```typescript
// Initialize undoable state
const { state: tasks, commit, undo, redo, canUndo, canRedo } = 
  useUndoableState<Task[]>(initialTasks)

// Keyboard shortcuts
useKeyboardShortcuts({ onUndo: undo, onRedo: redo })

// Toast on actions
useEffect(() => {
  if (lastAction && shouldShowToast(lastAction.type)) {
    showToast({ 
      message: lastAction.description,
      showUndo: true,
      onUndo: undo 
    })
  }
}, [lastAction])
```

### BulkActionBar

Updated for commit support:

```typescript
interface BulkActionBarProps {
  onTasksUpdate: (tasks: Task[], meta: ActionMeta) => void
}

// Optimistic delete
const updatedTasks = tasks.filter(t => !selectedTaskIds.has(t.id))
onTasksUpdate(updatedTasks, {
  type: 'bulk-delete',
  taskIds: Array.from(selectedTaskIds),
  description: `Deleted ${count} task(s)`
})

// Then persist to server
await bulkDeleteTasks(taskIds)
```

### TaskDetailsDrawer

Updated for commit support:

```typescript
interface TaskDetailsDrawerProps {
  onTaskUpdate?: (task: Task, meta: ActionMeta) => void
}

// Optimistic update
const updatedTask = { ...task, ...updates }
onTaskUpdate(updatedTask, { type: 'edit', taskIds: [task.id] })

// Then persist
await updateTask(task.id, updates)
```

### StatusMenu & Drag/Drop

Integrated in KanbanBoard:

```typescript
const handleDrop = async (status) => {
  // Optimistic
  const updated = tasks.map(t => 
    t.id === draggedTaskId ? { ...t, status } : t
  )
  commit(updated, {
    type: 'move',
    taskIds: [draggedTaskId],
    description: `Moved to ${STATUS_LABELS[status]}`
  })
  
  // Persist
  try {
    await updateTaskStatus(draggedTaskId, status)
  } catch {
    undo() // Rollback on error
  }
}
```

---

## Edge Cases & Correctness

### 1. Deleted Task Drawer

**Scenario:** User has drawer open for a task that gets deleted (undo)

**Behavior:**
```typescript
useEffect(() => {
  if (selectedTaskId && !tasks.find(t => t.id === selectedTaskId)) {
    setSelectedTaskId(null)  // Auto-close drawer
  }
}, [tasks, selectedTaskId])
```

**Result:** Drawer closes automatically when task disappears

### 2. Bulk Selection Sync

**Scenario:** Selected tasks are deleted via undo/redo

**Behavior:**
```typescript
useEffect(() => {
  if (selectedTaskIds.size > 0) {
    const validIds = new Set(
      Array.from(selectedTaskIds).filter(id => tasks.some(t => t.id === id))
    )
    if (validIds.size !== selectedTaskIds.size) {
      setSelectedTaskIds(validIds)
    }
  }
}, [tasks, selectedTaskIds])
```

**Result:** Invalid IDs automatically removed from selection

### 3. Server Persistence Failure

**Scenario:** Local update succeeds, server call fails

**Behavior:**
```typescript
try {
  await updateTask(taskId, updates)
} catch (error) {
  showToast({ message: 'Failed to save. Changes reverted.', type: 'error' })
  undo()  // Automatic rollback
}
```

**Result:** User sees error, state reverts automatically

### 4. Initial Load

**Scenario:** Tasks loaded from server on mount

**Behavior:**
```typescript
const isInitialMount = useRef(true)

if (isInitialMount.current) {
  isInitialMount.current = false
  return {
    present: nextState,
    past: [],  // Don't push initial state to history
    future: [],
  }
}
```

**Result:** No history entry for initial data load

### 5. Referential Equality

**Scenario:** Commit called with same object reference

**Behavior:**
```typescript
if (next === current.present) {
  return current  // Skip, no change
}
```

**Result:** Prevents unnecessary history entries

### 6. History Limit

**Scenario:** User performs 51+ actions

**Behavior:**
```typescript
const trimmedPast = newPast.length > limit 
  ? newPast.slice(newPast.length - limit)
  : newPast
```

**Result:** Keeps only last 50 states (FIFO)

### 7. Redo Invalidation

**Scenario:** User undoes, then makes new change

**Behavior:**
```typescript
return {
  present: next,
  past: trimmedPast,
  future: [],  // Clear future on new commit
}
```

**Result:** Redo history cleared (standard undo/redo behavior)

---

## Performance Considerations

### Memory Usage

- **50-state limit** prevents unbounded growth
- Each state is a shallow reference (not deep clone)
- Tasks array itself is copied, but task objects are reused
- Typical memory: ~50 × array length × 8 bytes = ~400 bytes per 100 tasks

### Computational Cost

- **Commit:** O(1) for history push, O(1) for equality check
- **Undo/Redo:** O(1) array operations
- **Optimistic Update:** O(n) for array map/filter operations
- Overall: Very efficient, no noticeable lag even with 1000+ tasks

### Optimization Strategies

1. **Shallow Equality Check**
   ```typescript
   if (next === current.present) return current
   ```

2. **Immutable Updates**
   ```typescript
   const updated = tasks.map(t => t.id === id ? { ...t, ...changes } : t)
   ```

3. **Debounced Commits** (for rapid edits)
   ```typescript
   // Description edit uses onBlur, not onChange
   ```

---

## User Experience

### Visual Feedback

1. **Toolbar Buttons**
   - Disabled state (gray) when unavailable
   - Enabled state (interactive) when history exists
   - Hover effects for better discoverability
   - Tooltips with keyboard shortcuts

2. **Toast Notifications**
   - Slide-up animation
   - Auto-dismiss (5 seconds)
   - Manual dismiss (X button)
   - Undo action button
   - Stacks gracefully (max 3)

3. **Keyboard Shortcuts**
   - Works immediately after action
   - No confirmation needed
   - Instant feedback
   - Muscle memory friendly

### Accessibility

- **Keyboard Navigation:** All controls keyboard-accessible
- **Screen Readers:** ARIA labels on all buttons
- **Focus Management:** Clear focus states
- **Error Messages:** Announced via toasts
- **Undo Hints:** Tooltips and labels

---

## Testing Checklist

### Basic Functionality
- [ ] Undo button disabled when no history
- [ ] Redo button disabled when no future
- [ ] Keyboard shortcuts work (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
- [ ] Toasts appear for delete/move
- [ ] Undo button in toast works

### Delete Operations
- [ ] Single task delete → undo restores
- [ ] Bulk delete → undo restores all
- [ ] Drawer closes when task deleted
- [ ] Selection updated when tasks deleted

### Move Operations
- [ ] Drag & drop → undo reverts
- [ ] Status menu → undo reverts
- [ ] Bulk move → undo reverts all
- [ ] Toast shows correct status name

### Edit Operations
- [ ] Title edit → undo reverts
- [ ] Description edit → undo reverts
- [ ] Label changes → undo reverts
- [ ] Property changes → undo reverts

### Edge Cases
- [ ] Undo after server failure rolls back
- [ ] New commit clears redo history
- [ ] 50+ actions keeps last 50
- [ ] Shortcuts disabled in inputs
- [ ] Multiple toasts stack properly

---

## Troubleshooting

### Undo Button Always Disabled

**Cause:** No actions committed to history  
**Fix:** Ensure operations call `commit()` with metadata

### Shortcuts Not Working

**Cause:** Focus in input field  
**Fix:** This is intentional - blur input first

### Toast Not Showing

**Cause:** Action type not in toast list  
**Fix:** Add type to `shouldShowToast` check:
```typescript
['delete', 'bulk-delete', 'move', 'bulk-move'].includes(type)
```

### Undo Doesn't Revert

**Cause:** Server persistence not using commit  
**Fix:** Ensure all mutations use commit pattern:
```typescript
commit(updatedTasks, meta)
await persist()  // Then persist
```

### Memory Growing

**Cause:** History limit not enforced  
**Fix:** Check `useUndoableState` has limit option set

---

## Future Enhancements

Potential improvements:

1. **Persistent History** - Save history to localStorage
2. **Undo Preview** - Show what will be undone
3. **Named Checkpoints** - "Save point" markers
4. **Undo Groups** - Group related changes
5. **Selective Undo** - Undo specific action from history
6. **Undo Count** - Show "X actions available"
7. **Conflict Resolution** - Handle concurrent edits
8. **Compressed History** - Reduce memory footprint
9. **Undo Animation** - Visual feedback on undo
10. **Redo Shortcut** - Additional Ctrl+Shift+Y

---

## Summary

The Undo/Redo system provides:

- ✅ **Complete history management** - 50-state stack
- ✅ **Multiple interfaces** - Keyboard, buttons, toasts
- ✅ **Optimistic updates** - Instant UI response
- ✅ **Auto-rollback** - Handles server failures
- ✅ **Smart integration** - Works with all features
- ✅ **Efficient** - Minimal memory/performance impact
- ✅ **Accessible** - Keyboard, ARIA, tooltips
- ✅ **Reliable** - Edge cases handled
- ✅ **User-friendly** - Clear feedback
- ✅ **Type-safe** - Full TypeScript support

The system makes task management safer and more forgiving, allowing users to experiment without fear of losing data! ↶↷

