# Search + Filters - Feature Documentation

## Overview

The Search + Filters feature provides powerful task discovery and organization capabilities. Users can quickly find tasks using full-text search and filter by label, assignee, due date, and priority. All filtering is client-side with a clean architecture that makes server-side filtering easy to implement later.

---

## How to Use

### Filter Toolbar

Located at the top of the board, the filter toolbar provides five filtering controls:

#### 1. **Search Box**
- Searches both task **title** and **description**
- Case-insensitive matching
- Debounced input (400ms) for smooth typing
- Clears with "Clear all" button or by emptying the field

**Example searches:**
- "authentication" - finds tasks with "authentication" in title or description
- "performance" - finds tasks related to performance optimization
- "client meeting" - finds meeting-related tasks

#### 2. **Labels Filter** (Multi-select)
- Dropdown showing all unique labels in your task list
- Select multiple labels at once
- **OR logic**: Shows tasks with ANY of the selected labels
- Special option: "No label" to find unlabeled tasks
- Selected count shown in button badge

**How it works:**
- Task matches if it contains ANY selected label
- Multiple selections broaden the results (OR logic)
- To change to AND logic (task must have ALL selected labels), see code comment in `lib/filters.ts`

#### 3. **Assignee Filter** (Single-select)
- Dropdown with all team members
- Options:
  - "All assignees" (default - shows all)
  - "Unassigned" - shows tasks without an assignee
  - Individual team members

**Use cases:**
- View your own tasks
- Check unassigned backlog
- Review specific person's workload

#### 4. **Due Date Filter**
Quick presets for common date scenarios:
- **All** (default) - Shows all tasks
- **Overdue** - Due date passed, not marked Done
- **Due today** - Due date is today
- **Next 7 days** - Due within the next week
- **No due date** - Tasks without a deadline

**How overdue works:**
- Must have a due date
- Due date < today
- Status is NOT "Done" (completed tasks aren't overdue)

#### 5. **Priority Filter** (Multi-select)
- Checkboxes for: Urgent, High, Medium, Low
- Select multiple priorities
- Shows tasks matching ANY selected priority
- Selected count shown in button badge

---

## Active Filter Chips

When filters are active, colored chips appear below the toolbar showing:
- Each active filter with its value
- Remove button (×) on each chip
- "Clear all" button to reset everything

**Chip colors:**
- **Search**: Primary (peach)
- **Labels**: Yellow/amber
- **Assignee**: Blue
- **Due date**: Purple
- **Priority**: Orange

---

## Filter Behavior

### Combining Filters

Multiple filters use **AND logic** - tasks must match ALL active filters:
- Search + Label: Must match search AND have the label
- Assignee + Priority: Must be assigned to that person AND have that priority
- All filters together: Must match every condition

**Example:**
```
Search: "authentication"
Labels: "backend", "security"
Assignee: Alex
Priority: High

Result: Tasks assigned to Alex, with high priority, 
containing "authentication", and having either "backend" 
OR "security" label
```

### Empty Results

If no tasks match your filters, the board will be empty. The results counter shows "Showing 0 of X tasks".

**Tips when you see no results:**
- Remove filters one at a time
- Check if you're combining too many filters
- Use "Clear all" to start over

---

## Integration with Other Features

### Swimlanes
- Filters apply BEFORE grouping
- Filtered tasks are then organized into lanes
- Empty lanes are hidden (as usual)
- Lane counts reflect filtered results

### Bulk Selection
- Can select filtered tasks normally
- Selected tasks that are filtered out remain selected but hidden
- Yellow notice appears: "X selected tasks are hidden by filters"
- Bulk actions still apply to all selected tasks (even hidden ones)

### Task Drawer
- Opening a task drawer works normally
- Editing task properties (labels, assignee, etc.) updates filters immediately
- If edited task no longer matches filters, it disappears from view

### Inline Editing
- Edit task titles directly while filtered
- Status changes work normally
- Changes don't affect filter state

---

## Search Details

### What Gets Searched
- **Title** - Primary task title
- **Description** - Full task description text

### Search Behavior
- Case-insensitive
- Substring matching (matches anywhere in text)
- Matches if found in EITHER title OR description

### Search Examples

| Search | Matches |
|--------|---------|
| "auth" | "Authentication module", "OAuth integration" |
| "performance" | Tasks with "performance" in title or description |
| "client" | "Client meeting", description: "discuss client requirements" |

### Tips for Better Search
- Use specific keywords
- Try singular/plural forms separately
- Check both title and description
- Use labels for categorization instead of keywords

---

## Filter Logic (Technical)

### Date Comparisons

All date comparisons use ISO date strings (YYYY-MM-DD) for consistency:

```
Today: 2026-01-02
Due date: 2026-01-15

Comparison: "2026-01-15" > "2026-01-02" = Due in future
```

**Overdue Logic:**
```typescript
task.dueDate !== null &&
task.dueDate < today &&
task.status !== 'done'
```

**Next 7 Days:**
```typescript
task.dueDate !== null &&
task.dueDate >= today &&
task.dueDate <= (today + 7 days)
```

### Label Matching

**Current (OR logic):**
```typescript
// Task matches if it has ANY selected label
selectedLabels.some(filterLabel =>
  task.labels.some(taskLabel => 
    taskLabel.toLowerCase() === filterLabel.toLowerCase()
  )
)
```

**To change to AND logic:**
```typescript
// Task matches if it has ALL selected labels
selectedLabels.every(filterLabel =>
  task.labels.some(taskLabel => 
    taskLabel.toLowerCase() === filterLabel.toLowerCase()
  )
)
```

Code comment marks this in `lib/filters.ts` for easy modification.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Type in search` | Start filtering |
| `Esc` | Clear search field (if focused) |
| `Tab` | Navigate between filters |
| `Enter` | Open dropdown (when button focused) |
| `Space` | Toggle checkbox (when focused) |

All controls are fully keyboard accessible.

---

## Performance

### Client-Side Filtering
- All filtering happens in browser
- Instant results (no server round-trips)
- Works with up to 1000+ tasks smoothly
- Pure function implementation (testable, predictable)

### Optimization Techniques
- Debounced search input (400ms)
- Single filter computation per render
- Efficient Set operations for selection
- Memoization opportunities (can add later)

### Moving to Server-Side

The architecture makes server-side filtering easy:

**Current:**
```typescript
const filtered = filterTasks(tasks, filters)
```

**Future (server-side):**
```typescript
const filtered = await fetchFilteredTasks(filters)
```

Just replace the pure function with an API call. The `FiltersState` type is already structured for API queries.

---

## Sample Data

The schema includes 12 sample tasks demonstrating all filter features:

### Search Testing
- Task 10: Description contains "authentication flow"
- Task 12: Description has "GitHub Actions", "CI/CD pipeline"

### Label Variety
- Backend (4 tasks)
- Security (2 tasks)
- Frontend, Bug, API, Documentation, Deployment, Performance, etc.
- 2 tasks with no labels

### Assignee Distribution
- Alex (4 tasks)
- Francesca (2 tasks)
- Sam (3 tasks)
- Priya (2 tasks)
- Unassigned (2 tasks)

### Due Date Examples
- Overdue: Task 3 (2026-01-01, not done)
- Today: Task 11 (uses CURRENT_DATE)
- Future: Multiple tasks with various dates
- No due date: Task 8, Task 12

### Priority Mix
- Urgent (3 tasks)
- High (3 tasks)
- Medium (4 tasks)
- Low (2 tasks)

---

## Accessibility

### ARIA Labels
- Search input: `aria-label="Search tasks by title or description"`
- Filter buttons: `aria-haspopup="menu"` and `aria-expanded`
- Assignee dropdown: `aria-label="Filter by assignee"`
- Due date dropdown: `aria-label="Filter by due date"`
- Remove chip buttons: Descriptive `aria-label` for each

### Keyboard Navigation
- All controls are keyboard accessible
- Logical tab order
- Dropdown menus navigate with arrow keys
- Checkboxes toggle with Space
- Enter activates buttons

### Screen Readers
- Results counter announces filtered count
- Filter chips announce when added/removed
- Loading states announced (if added)

---

## Use Cases

### 1. Find Overdue Work
```
Due Date: Overdue
Priority: Urgent, High

Result: Critical tasks that need immediate attention
```

### 2. Review Team Member's Work
```
Assignee: Alex
Status: Can group by status for better view

Result: All of Alex's tasks organized by progress
```

### 3. Sprint Planning
```
Labels: Current sprint label
Priority: High, Medium

Result: Important work for current sprint
```

### 4. Find Specific Task
```
Search: "authentication"

Result: All auth-related tasks
```

### 5. Unassigned Backlog
```
Assignee: Unassigned
Labels: No label

Result: Tasks needing assignment and categorization
```

### 6. This Week's Work
```
Due Date: Next 7 days
Assignee: [Your name]

Result: Your tasks due this week
```

---

## Tips & Best Practices

### Effective Searching
1. **Use keywords**: Search for specific technical terms
2. **Check descriptions**: Many tasks have details in description
3. **Combine with labels**: Search narrows, labels categorize
4. **Try variations**: "auth" vs "authentication"

### Smart Filtering
1. **Start broad**: Begin with one filter, add more to narrow
2. **Use presets**: Due date presets are faster than manual dates
3. **Bookmark combos**: Frequently used filter combinations in notes
4. **Clear often**: Reset filters between different searches

### Organization Strategy
1. **Consistent labels**: Use same label names across tasks
2. **Always set due dates**: Makes due date filter more useful
3. **Assign everything**: Reduces "Unassigned" clutter
4. **Set priorities**: Makes priority filter meaningful

### Performance Tips
1. **Limit active filters**: More filters = slower (but still fast)
2. **Clear when done**: Reset filters after finding what you need
3. **Use search last**: Other filters narrow results first

---

## Troubleshooting

### No results showing
- Check active filters (look for chips)
- Click "Clear all" to reset
- Verify tasks exist with those properties
- Check if search typo

### Search not finding task
- Search is case-insensitive but spelling matters
- Check both title AND description
- Try shorter search terms
- Use labels for categorization instead

### Filter doesn't appear
- Label: Only shows labels that exist on tasks
- Assignee: Only shows assignees with tasks
- Refresh page if data seems stale

### Selected tasks hidden
- This is normal - they're filtered out
- Yellow notice shows hidden count
- Bulk actions still work on hidden tasks
- Clear filters to see them again

---

## Future Enhancements

Potential improvements for future versions:

1. **Custom date ranges** - "From" and "To" date pickers
2. **Save filter presets** - Save common filter combinations
3. **Filter by status** - Dedicated status filter
4. **Advanced search** - Regex, exact match, exclude
5. **Search history** - Recent searches dropdown
6. **Filter templates** - Pre-configured filters for common tasks
7. **URL parameters** - Share filtered views via link
8. **Server-side filtering** - For large datasets
9. **Sort options** - Sort filtered results
10. **Export filtered** - Export only filtered tasks

---

## Technical Details

### File Structure
```
lib/filters.ts           - Pure filtering logic
components/
  FilterToolbar.tsx      - Main filter controls
  ActiveFilterChips.tsx  - Active filter display
  KanbanBoard.tsx        - Integration point
```

### Type Definitions
```typescript
type FiltersState = {
  query: string
  labels: string[]
  assigneeId: string | 'all' | 'unassigned'
  due: {
    preset: 'all' | 'overdue' | 'today' | 'next7' | 'none' | 'range'
    from?: string
    to?: string
  }
  priorities: Task['priority'][]
}
```

### Pure Function
```typescript
function filterTasks(
  tasks: Task[], 
  filters: FiltersState
): Task[]
```

- No side effects
- Deterministic output
- Easy to test
- Easy to move to server

---

## Summary

Search + Filters provides:
- ✅ Full-text search (title + description)
- ✅ Multi-select label filter (OR logic)
- ✅ Single-select assignee filter
- ✅ Due date presets (overdue, today, next 7 days, none)
- ✅ Multi-select priority filter
- ✅ Active filter chips with individual remove
- ✅ Clear all functionality
- ✅ Debounced search (400ms)
- ✅ Results counter
- ✅ Hidden selection notice
- ✅ Full keyboard accessibility
- ✅ Clean, minimal UI
- ✅ Client-side with easy server migration path

The feature integrates seamlessly with existing functionality (swimlanes, bulk actions, task drawer) and provides powerful task discovery without complexity.

