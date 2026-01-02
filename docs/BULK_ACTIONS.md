# Bulk Actions - Feature Documentation

## Overview

The Bulk Actions feature allows users to select multiple tasks and perform operations on them simultaneously, including moving them to different statuses, adding/removing labels, and deleting them in batch.

---

## How to Use

### Selecting Tasks

There are **three ways** to select tasks:

1. **Checkbox** - Click the checkbox at the top-left of any task card
2. **Ctrl/Cmd + Click** - Hold Ctrl (Windows/Linux) or Cmd (Mac) and click on a task card
3. **Selection Mode** - Once you have 1+ tasks selected, clicking any card will toggle its selection

### Selection Mode Behavior

When tasks are selected (selection mode active):

- ✅ **Normal click** on a card → toggles selection (doesn't open drawer)
- ✅ **Checkbox click** → toggles selection
- ✅ **Ctrl/Cmd + Click** → toggles selection
- ✅ **Click title to edit** → still works (opens inline edit)
- ✅ **Click status menu** → still works (opens menu)
- ✅ **Escape key** → clears all selections
- ⚠️ **Drag & drop** → disabled while in selection mode

### Clearing Selection

- Click **Clear** button in the bulk action bar
- Press **Escape** key
- After successfully completing a bulk move or delete operation (auto-clears)

---

## Bulk Action Bar

A fixed bar appears at the **bottom of the screen** when 1+ tasks are selected.

### Components

**Selection Count**
- Shows how many tasks are currently selected
- Example: "3 selected"

**Move to Status**
- Dropdown with: To Do, In Progress, Done
- Select a status to move all selected tasks
- Auto-applies immediately when selected
- Success message confirms the operation

**Add Label**
- Text input to type a new label
- Click "Add Label" button or press Enter
- Adds the label to all selected tasks
- Prevents duplicates (case-insensitive check)
- Shows success message with label name

**Remove Label**
- Dropdown showing all unique labels across selected tasks
- Select a label to remove it from all selected tasks
- Only appears if selected tasks have labels
- Case-insensitive removal

**Delete**
- Red danger button
- Confirmation dialog before deletion
- Deletes all selected tasks permanently
- Auto-closes drawer if open task is deleted

**Clear**
- Gray button on the far right
- Clears all selections without making changes

---

## Features & Behavior

### Visual Feedback

**Selected Tasks**
- Blue border (primary color)
- Light blue background tint
- Checkbox is checked

**Status Messages**
- Success messages (green) appear in the bulk action bar
- Error messages (red) appear if operation fails
- Auto-dismiss after 3 seconds

### Data Integrity

**Immutable Updates**
- All operations use server actions
- Database updates via Supabase
- Automatic page revalidation after changes
- Selection state auto-updates if tasks are deleted

**Label Management**
- **Adding labels**: Case-insensitive duplicate check (preserves original casing)
- **Removing labels**: Case-insensitive match
- Empty/whitespace-only labels are rejected

### Interaction with Other Features

**Task Drawer**
- Drawer can remain open while in selection mode
- If the open task is bulk-deleted, drawer auto-closes
- You can select tasks while drawer is open

**Inline Title Edit**
- Clicking title to edit still works (doesn't toggle selection)
- Editing a task doesn't affect its selection state

**Status Menu**
- Clicking status menu still works (doesn't toggle selection)
- Can change individual task status while others are selected

**Drag & Drop**
- Disabled when tasks are selected
- Re-enabled when selection is cleared

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Clear all selections |
| `Ctrl/Cmd + Click` | Toggle task selection |
| `Enter` | Submit label in Add Label input |

---

## Examples

### Example 1: Move Multiple Tasks to "Done"

1. Click checkboxes on 3 tasks
2. Bulk action bar appears showing "3 selected"
3. Click "Move to:" dropdown
4. Select "Done"
5. All 3 tasks move to the Done column
6. Success message: "Moved 3 task(s) to Done"
7. Selection auto-clears

### Example 2: Add Label to Multiple Tasks

1. Select 5 tasks using Ctrl+Click
2. Type "urgent" in the "Add label..." input
3. Click "Add Label" button (or press Enter)
4. All 5 tasks now have "urgent" label
5. Success message: "Added label 'urgent' to 5 task(s)"
6. Selection remains active

### Example 3: Remove Label from Tasks

1. Select 4 tasks that have the label "bug"
2. Click "Remove:" dropdown
3. Select "bug" from the list
4. The "bug" label is removed from all 4 tasks
5. Success message: "Removed label 'bug' from 4 task(s)"

### Example 4: Bulk Delete with Confirmation

1. Select 2 tasks
2. Click red "Delete" button
3. Confirmation dialog: "Delete 2 task(s)? This cannot be undone."
4. Click OK
5. Tasks are permanently deleted
6. Success message: "Deleted 2 task(s)"
7. Selection auto-clears

---

## Technical Implementation

### State Management

```typescript
selectedTaskIds: Set<string> // Tracks selected task IDs
```

Using a `Set` for O(1) lookups and automatic deduplication.

### Server Actions

All bulk operations are implemented as server actions:

- `bulkMoveStatus(taskIds, status)` - Updates status for multiple tasks
- `bulkAddLabel(taskIds, label, existingTasks)` - Adds label to multiple tasks
- `bulkRemoveLabel(taskIds, label, existingTasks)` - Removes label from multiple tasks
- `bulkDeleteTasks(taskIds)` - Deletes multiple tasks

### Data Flow

```
User Action → BulkActionBar Component → Server Action → Supabase → Revalidate → UI Update
```

### Edge Cases Handled

1. **Task deleted elsewhere** - Auto-removed from selection
2. **Empty label** - Rejected with error message
3. **Duplicate label** - Silently skipped (doesn't add duplicate)
4. **Open drawer task deleted** - Drawer auto-closes
5. **Selection cleared** - All UI returns to normal mode
6. **Escape while editing title** - Cancels edit, doesn't clear selection

---

## Accessibility

### ARIA Labels

- Checkbox: `aria-label="Select task"`
- Add Label button: `aria-label="Add label to selected tasks"`
- Delete button: `aria-label="Delete selected tasks"`
- Clear button: `aria-label="Clear selection"`

### Keyboard Navigation

- All controls are keyboard accessible
- Tab order: checkbox → title → status menu → next card
- Focus management in bulk action bar

### Screen Readers

- Status messages use `role="status"` and `aria-live="polite"`
- Selection count announced
- Success/error messages announced

---

## Performance

### Optimizations

- **Set data structure** for O(1) selection lookups
- **Batch operations** - all tasks updated in parallel where possible
- **Single revalidation** after bulk operations
- **Auto-cleanup** of invalid selections

### Limitations

- Maximum recommended selections: ~100 tasks (UI remains responsive)
- Database operations run sequentially for labels (to preserve data integrity)
- Status and delete operations run as single SQL queries

---

## Future Enhancements

Potential improvements for future versions:

1. **Multi-drag** - Drag multiple selected tasks at once
2. **Select all in column** - Checkbox in column header
3. **Bulk assign** - Assign multiple tasks to a user
4. **Bulk priority change** - Change priority for selected tasks
5. **Bulk due date** - Set due date for multiple tasks
6. **Export selection** - Export selected tasks as CSV/JSON
7. **Undo bulk action** - Revert last bulk operation
8. **Keyboard range selection** - Shift+Click to select range
9. **Bulk copy/duplicate** - Create copies of selected tasks
10. **Smart selection** - "Select all with label X"

---

## Troubleshooting

### Selection doesn't work
- Make sure you're clicking the checkbox or using Ctrl/Cmd+Click
- Check that tasks aren't being edited (inline edit mode)

### Bulk action bar doesn't appear
- Verify at least one task is selected
- Check browser console for errors
- Ensure `BulkActionBar` component is rendered

### Labels not adding
- Check that label isn't empty (whitespace only)
- Verify you have permission to edit the tasks
- Labels are case-insensitive for duplicate checking

### Tasks don't move
- Check internet connection
- Verify database permissions
- Check browser console for errors

---

## Summary

Bulk Actions provide a powerful way to manage multiple tasks efficiently:

- ✅ Multi-select via checkbox or Ctrl/Cmd+Click
- ✅ Move, label, and delete operations
- ✅ Fixed bulk action bar at bottom
- ✅ Accessible and keyboard-friendly
- ✅ Integrates seamlessly with existing features
- ✅ Success/error feedback
- ✅ Auto-cleanup and data integrity

The feature is designed to save time when managing large numbers of tasks while maintaining a clean, intuitive interface.

