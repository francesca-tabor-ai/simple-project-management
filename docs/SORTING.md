# Sorting - Feature Documentation

## Overview

The Sorting feature allows users to organize tasks by Created Date, Due Date, or Priority within each Kanban column. Sorting works seamlessly with all existing features including search/filters, swimlanes, bulk actions, and inline editing.

---

## How to Use

### Sort Controls

Located in the board toolbar (next to Group By controls), the sort interface provides:

#### **1. Sort Field Dropdown**
Choose what to sort by:
- **Created date** (default) - When the task was created
- **Due date** - Task deadline
- **Priority** - Task urgency level

#### **2. Order Toggle Button**
Controls sort direction with context-aware labels:
- **Created date**: "Newest first" ↓ or "Oldest first" ↑
- **Due date**: "Soonest first" ↑ or "Latest first" ↓  
- **Priority**: "High to low" ↓ or "Low to high" ↑

Arrow icon shows current direction.

#### **3. Reset Button**
Returns to default sort (Created date, Newest first). Only visible when sort is changed.

---

## Sorting Behavior

### Default Sort
- **Field**: Created date
- **Order**: Newest first (descending)
- Tasks appear with most recently created at the top

### Sorting Scope
- Sorting applies **within each column** (To Do, In Progress, Done)
- In swimlane view, sorting applies **within each lane's columns**
- Column counts don't change - only task order

### Sort + Filters
Sorting applies AFTER filtering:
1. Search/filters narrow down tasks
2. Sorting organizes the filtered results
3. Both work together seamlessly

---

## Sort Field Details

### 1. Created Date

**What it does**: Orders by task creation timestamp

**Sort order**:
- **Desc (Newest first)**: Most recently created → oldest
- **Asc (Oldest first)**: Oldest created → most recent

**Use cases**:
- See what was added recently
- Review tasks in chronological order
- Find older tasks that might need attention

**Default**: Newest first (descending)

---

### 2. Due Date

**What it does**: Orders by deadline date

**Sort order**:
- **Asc (Soonest first)**: Earliest deadline → latest deadline → no deadline
- **Desc (Latest first)**: Latest deadline → earliest deadline → no deadline

**Special behavior**:
- **Tasks without due dates ALWAYS appear at the bottom**, regardless of asc/desc
- This ensures tasks with deadlines are always prioritized

**Use cases**:
- Focus on upcoming deadlines
- Plan work by urgency
- Identify tasks without deadlines

**Example** (Soonest first):
```
1. Task due Jan 2
2. Task due Jan 5
3. Task due Jan 10
4. Task with no due date
5. Task with no due date
```

---

### 3. Priority

**What it does**: Orders by task priority level

**Priority ranking** (high to low):
1. Urgent (highest)
2. High
3. Medium
4. Low (lowest)

**Sort order**:
- **Desc (High to low)**: Urgent → High → Medium → Low
- **Asc (Low to high)**: Low → Medium → High → Urgent

**Use cases**:
- Focus on critical work
- Balance workload by importance
- Review low-priority backlog

**Example** (High to low):
```
1. Critical bug fix (Urgent)
2. Feature deadline (High)
3. Code review (Medium)
4. Documentation (Low)
```

---

## Tie-Breaking

When multiple tasks have the same sort value, stable ordering is maintained using tie-breakers:

### Tie-breaker 1: Created Date (Newest first)
If primary sort values are equal, newer tasks appear first

### Tie-breaker 2: Title (A→Z)
If still tied, tasks are alphabetically sorted by title

**Example** (Priority: High to low):
```
Priority  Created     Title                 Order
Urgent    Jan 3       Deploy hotfix         1 (urgent)
Urgent    Jan 1       Fix critical bug      2 (urgent, older)
High      Jan 2       Update API            3 (high)
Medium    Jan 4       Code review           4 (medium)
```

---

## Integration with Features

### Search & Filters ✅
- Sorting applies AFTER filtering
- Filtered results are sorted within columns
- Results counter reflects filtered count
- Sort persists when changing filters

### Swimlanes ✅
- Sorting works within each lane
- Each lane's columns are independently sorted
- Lane switching doesn't reset sort
- All grouping modes supported

### Bulk Selection ✅
- Selection works normally with any sort
- Selected tasks remain selected when sort changes
- Bulk actions apply regardless of sort order
- Visual selection state persists

### Task Drawer ✅
- Opening tasks works with any sort
- Editing properties updates sort if needed
- If task's sort value changes, it moves position
- Drawer stays open during sort changes

### Inline Editing ✅
- Edit titles while sorted
- Title changes may affect alphabetical tie-breaker
- Status changes work normally
- Task remains visible after editing

### Drag & Drop
- Column-to-column moves work normally
- Within-column dragging is disabled while custom sort is active
- Default sort (Created date, Newest first) allows manual ordering
- Sort preference is preserved

---

## Visual Feedback

### Active Sort Indicator
- Current sort field shown in dropdown
- Order button shows direction with arrow icon
- Context-aware labels describe current sort
- Reset button appears when non-default

### Sort Changes
- Tasks reorder instantly
- Smooth visual updates
- Column counts remain stable
- No flickering or layout shifts

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate to sort controls |
| `Enter/Space` | Open dropdown (when focused) |
| `Arrow keys` | Navigate dropdown options |
| `Enter` | Select option |
| `Space` | Toggle order button |

All controls are fully keyboard accessible.

---

## Use Cases

### 1. Review Recent Work
```
Sort: Created date
Order: Newest first

Result: See what was added today/this week
```

### 2. Plan by Deadlines
```
Sort: Due date
Order: Soonest first

Result: Tasks with earliest deadlines at top, 
        no-deadline tasks at bottom
```

### 3. Focus on Critical Tasks
```
Sort: Priority
Order: High to low
Filter: Status = In Progress

Result: Urgent and high-priority active work first
```

### 4. Review Old Backlog
```
Sort: Created date
Order: Oldest first
Filter: Status = To Do

Result: Long-pending tasks that need attention
```

### 5. Sprint Planning
```
Sort: Priority
Order: High to low
Filter: Due = Next 7 days

Result: Prioritized view of this week's work
```

---

## Technical Details

### Pure Function Implementation

```typescript
function sortTasks(tasks: Task[], sort: SortState): Task[]
```

- No mutations (creates sorted copy)
- Deterministic output
- Testable in isolation
- Easy to extend

### Sort Logic

```typescript
// Primary sort
switch (sort.field) {
  case 'createdAt': compare timestamps
  case 'dueDate': compare dates (null → bottom)
  case 'priority': compare rank values
}

// Apply order (asc/desc)
comparison = order === 'asc' ? comparison : -comparison

// Tie-breaker 1: Created date (newest first)
if (comparison === 0) {
  comparison = -compareCreatedAt(a, b)
}

// Tie-breaker 2: Title (A→Z)
if (comparison === 0) {
  comparison = a.title.localeCompare(b.title)
}
```

### Due Date Null Handling

Special logic ensures tasks without due dates always appear last:

```typescript
// Null checks first
if (a.dueDate === null && b.dueDate === null) return 0
if (a.dueDate === null) return 1  // a goes after b
if (b.dueDate === null) return -1 // a goes before b

// Then compare actual dates
const dateA = new Date(a.dueDate + 'T00:00:00').getTime()
const dateB = new Date(b.dueDate + 'T00:00:00').getTime()
return dateA - dateB
```

### Date Comparison

Dates are compared as local dates (ignoring time):
```typescript
new Date(dueDate + 'T00:00:00').getTime()
```

This ensures consistent comparisons regardless of timezone.

---

## Performance

### Optimization
- Pure function allows memoization
- Single sort per render
- No unnecessary re-sorts
- Efficient with 1000+ tasks

### Sort Complexity
- Time: O(n log n) per column
- Space: O(n) for sorted copy
- Fast even with many tasks

---

## Accessibility

### ARIA Attributes
- Sort dropdown: Proper `aria-label`
- Order button: `aria-pressed` for toggle state
- Clear labels describing current state
- Screen reader friendly

### Keyboard Navigation
- Full keyboard access
- Logical tab order
- Clear focus states
- Escape to close dropdowns

### Visual States
- Clear active states
- Direction arrows
- Context-aware labels
- High contrast

---

## Future Enhancements

Potential improvements:

1. **Custom sort orders** - User-defined sorting
2. **Multi-field sorting** - Sort by priority, then due date
3. **Save sort preferences** - Remember user's preferred sort
4. **Per-column sorting** - Different sort for each column
5. **Manual ordering** - Drag to reorder with custom sort
6. **Sort animations** - Smooth task movements
7. **Quick sort presets** - One-click common sorts
8. **Sort by custom fields** - User-defined properties
9. **Reverse all** - Quick flip all columns
10. **Sort indicators on cards** - Visual cues

---

## Troubleshooting

### Sort not working
- Check if filters are active (may hide tasks)
- Verify tasks have the field you're sorting by
- Refresh page if data seems stale
- Check browser console for errors

### Tasks in unexpected order
- Remember tie-breakers (created date, then title)
- Check if multiple tasks have same sort value
- Due date null tasks always at bottom
- Verify sort order (asc/desc)

### Sort resets unexpectedly
- Sort persists during session
- Page refresh resets to default
- Check if code has default sort logic

### Performance issues
- Sort is O(n log n) - should be fast
- Check if other features are causing lag
- Try with fewer filters active
- Reduce browser tab count

---

## Examples

### Example 1: Find Overdue Tasks
```
Filter: Due date = Overdue
Sort: Due date
Order: Soonest first

Result: Most overdue tasks first
```

### Example 2: Review Team's Work by Priority
```
Filter: Assignee = Alex
Sort: Priority
Order: High to low
Group by: Status

Result: Alex's tasks organized by priority in each column
```

### Example 3: Check Recent Additions
```
Sort: Created date
Order: Newest first

Result: Tasks added today/recently at top of each column
```

---

## Summary

Sorting provides:
- ✅ **3 sort fields** - Created date, Due date, Priority
- ✅ **Bi-directional** - Ascending and descending
- ✅ **Smart null handling** - Due date nulls always at bottom
- ✅ **Stable tie-breakers** - Created date → Title
- ✅ **Pure function** - Testable, predictable, no mutations
- ✅ **Seamless integration** - Works with all features
- ✅ **Context-aware UI** - Clear labels for each mode
- ✅ **Reset function** - Quick return to default
- ✅ **Keyboard accessible** - Full keyboard support
- ✅ **No performance impact** - Fast with many tasks

The sorting feature enhances task organization without complexity, providing powerful control over task visibility while maintaining all existing functionality.

