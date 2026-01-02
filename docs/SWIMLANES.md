# Swimlanes - Feature Documentation

## Overview

Swimlanes provide an alternative board view that groups tasks horizontally by **Assignee**, **Priority**, or **Label**, while maintaining the familiar three-column Kanban structure (To Do / In Progress / Done) within each lane.

---

## How to Use

### Group By Control

Located at the top of the board, the "Group by" dropdown allows you to switch between different views:

- **None** (default) - Standard single-row Kanban board
- **Assignee** - One lane per team member + "Unassigned" lane
- **Priority** - Lanes for Urgent, High, Medium, Low
- **Label** - One lane per label + "No Label" lane

The control also displays the number of lanes when grouping is active.

---

## Grouping Modes

### 1. None (Default)

Standard Kanban board with all tasks in a single row of three columns.

**Use when:** You want a simple overview of all tasks without categorization.

### 2. Group by Assignee

Tasks are separated by who they're assigned to.

**Lane structure:**
- One lane per assignee (sorted alphabetically)
- "Unassigned" lane at the bottom for tasks without an assignee

**Use when:** You want to see workload distribution across team members.

**Example lanes:**
```
Alex        [4 tasks]
Francesca   [2 tasks]
Priya       [1 task]
Sam         [2 tasks]
Unassigned  [2 tasks]
```

### 3. Group by Priority

Tasks are organized by urgency level.

**Lane structure (fixed order):**
1. Urgent
2. High
3. Medium
4. Low

**Use when:** You need to focus on high-priority work or balance workload by importance.

**Note:** Empty priority lanes are hidden automatically.

### 4. Group by Label

Tasks are grouped by their labels (tags).

**Lane structure:**
- One lane per unique label (sorted alphabetically)
- "No Label" lane for untagged tasks
- **Important:** Tasks with multiple labels appear in EACH corresponding lane (intentional duplication)

**Use when:** You want to organize work by category, feature, or project area.

**Example labels:**
```
Backend     [3 tasks]
Bug         [1 task]
Frontend    [2 tasks]
Security    [2 tasks]  <- Shared task appears here
No Label    [1 task]
```

---

## Visual Layout

### Toolbar

```
┌─────────────────────────────────────────────────┐
│ Group by: [Assignee ▼]           5 lanes       │
└─────────────────────────────────────────────────┘
```

### Swimlane Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Lane Header          Francesca                    2 tasks   │
├─────────────────────────────────────────────────────────────┤
│ [To Do]           [In Progress]         [Done]             │
│ • Task 1          • Task 2              • Task 3           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Lane Header          Alex                         3 tasks   │
├─────────────────────────────────────────────────────────────┤
│ [To Do]           [In Progress]         [Done]             │
│ • Task 4          • Task 5              (empty)            │
│ • Task 6                                                    │
└─────────────────────────────────────────────────────────────┘
```

Each lane:
- **Header** (gray background) - Shows lane name and task count
- **Content area** - Contains the 3 Kanban columns
- **Border** - Visual separation between lanes

---

## Feature Integration

### All Existing Features Work in Swimlanes

✅ **Task Creation** - New tasks appear in appropriate lanes based on their properties

✅ **Inline Title Edit** - Click task title to edit (works in any lane)

✅ **Status Menu** - Change task status within a lane

✅ **Task Details Drawer** - Click tasks to open full details

✅ **Multi-Select & Bulk Actions** - Select tasks across lanes, apply bulk operations

✅ **Drag & Drop** - Move tasks between columns within the same lane

### Automatic Lane Updates

When you edit a task's properties in the drawer:
- **Change assignee** → Task moves to new assignee's lane
- **Change priority** → Task moves to new priority lane
- **Add/remove labels** → Task appears/disappears from label lanes

Changes are reflected immediately after save.

---

## Label Lane Behavior (Important)

### Task Duplication in Label Lanes

Tasks with multiple labels intentionally appear in multiple label lanes.

**Example:**
```
Task: "Refactor authentication module"
Labels: ["backend", "security", "refactor"]
```

This task will appear in:
- Backend lane
- Security lane  
- Refactor lane

**Why?** This allows you to view work from multiple perspectives. A task can be both a backend task AND a security task.

**Note:** This is ONLY for label grouping. Assignee and Priority lanes never duplicate tasks.

---

## Drag & Drop in Lanes

### Supported
- ✅ Drag tasks between columns **within the same lane**
- ✅ Moving from "To Do" → "In Progress" → "Done"

### Not Supported (By Design)
- ❌ Dragging tasks between different lanes
- ❌ Changing assignee/priority/labels via drag

**Why?** To prevent accidental changes to task properties. Use the task drawer to intentionally change these fields.

**Behavior:** If you accidentally drop a task in a different lane, it reverts to its original position.

---

## Performance & Filtering

### Empty Lanes
- Empty lanes are automatically hidden
- Exception: "Unassigned" and "No Label" appear only if they contain tasks
- Improves clarity when you have many potential lanes

### Lane Counts
- Each lane header shows total tasks in that lane
- Each column header shows tasks in that status **within that lane**
- Makes it easy to see workload distribution

### Task Filtering
- Multi-select works across all lanes
- Bulk actions apply to selected tasks regardless of lane
- Search/filter features (if added) work across lanes

---

## Keyboard Shortcuts

All existing keyboard shortcuts work in swimlane view:

| Key | Action |
|-----|--------|
| `Escape` | Clear selection / Close drawer |
| `Ctrl/Cmd + Click` | Toggle task selection |
| `Enter` | Save inline edit |
| `Tab` | Navigate between controls |

---

## Use Cases

### By Assignee
- **Daily standups** - Quickly review each person's work
- **Workload balancing** - Identify overloaded team members
- **Assignment review** - Find unassigned work

### By Priority  
- **Sprint planning** - Focus on urgent items first
- **Risk management** - Ensure critical work is progressing
- **Backlog grooming** - Identify low-priority items to defer

### By Label
- **Feature tracking** - Group work by feature or epic
- **Technical organization** - Separate frontend/backend/infrastructure
- **Project views** - See all work related to a specific project
- **Bug triage** - View all bugs together

---

## Tips & Best Practices

### 1. Start with None, Switch as Needed
- Use default view for quick task creation
- Switch to grouped views for focused work sessions
- Return to None for overall project status

### 2. Consistent Labeling
- Use consistent label names (lowercase, singular)
- Avoid too many labels (5-10 categories is ideal)
- Remember: tasks with multiple labels appear in multiple lanes

### 3. Assignee Management
- Assign all tasks to prevent large "Unassigned" lane
- Use "Unassigned" for backlog items
- Reassign completed tasks for accurate metrics

### 4. Priority Discipline
- Be honest about urgency (not everything is urgent!)
- Review priority lanes weekly
- Move tasks up/down as deadlines approach

### 5. Combine with Bulk Actions
- Group by priority, bulk-assign to team members
- Group by assignee, bulk-add labels to categorize
- Group by label, bulk-move to different statuses

---

## Technical Details

### Data Model
No changes to the task schema required. Uses existing fields:
- `assignee: { id: string, name: string } | null`
- `priority: "low" | "medium" | "high" | "urgent"`
- `labels: string[]`
- `status: "pending" | "in_progress" | "done"`

### Implementation
- **Pure functions** for lane building (testable, predictable)
- **Reusable components** - `KanbanColumns` used in both views
- **No duplication** - All task data lives in single source
- **Efficient rendering** - Only visible lanes are rendered

### Component Structure
```
KanbanBoard
├── GroupBy Control
├── None View
│   └── KanbanColumns (all tasks)
└── Swimlane View
    └── SwimlaneBoardView
        ├── Lane 1
        │   └── KanbanColumns (lane tasks)
        ├── Lane 2
        │   └── KanbanColumns (lane tasks)
        └── ...
```

---

## Accessibility

- ✅ Keyboard navigable
- ✅ Semantic HTML (`<h2>` for lane headers, `<h3>` for column headers)
- ✅ ARIA labels on all controls
- ✅ Focus management maintained
- ✅ Screen reader compatible

---

## Future Enhancements

Potential improvements for future versions:

1. **Custom lane ordering** - Drag to reorder lanes
2. **Collapsed lanes** - Click to collapse/expand individual lanes
3. **Lane filtering** - Show/hide specific lanes
4. **Saved views** - Remember preferred grouping mode
5. **Multiple grouping** - Group by assignee + priority simultaneously
6. **Lane limits** - WIP limits per lane
7. **Lane statistics** - Charts and metrics per lane
8. **Cross-lane drag** - With confirmation dialog
9. **Custom grouping** - User-defined grouping criteria
10. **Export by lane** - Export tasks from specific lanes

---

## Troubleshooting

### Lane doesn't appear
- Verify tasks exist with that assignee/priority/label
- Check if lane is empty (empty lanes are hidden)
- Ensure data has synced from database

### Task appears in wrong lane
- Verify task's assignee/priority/labels in the drawer
- Remember: label grouping shows tasks in multiple lanes
- Check if task was recently updated (may need refresh)

### Can't drag between lanes
- This is by design for data integrity
- Use the task drawer to change assignee/priority/labels
- Then task will automatically move to correct lane

### Grouping feels slow
- Each grouping mode processes all tasks
- Performance is excellent up to 1000+ tasks
- If you notice lag, contact support

---

## Summary

Swimlanes provide powerful organization without changing your data structure:

- ✅ **4 viewing modes** - None, Assignee, Priority, Label
- ✅ **Flexible grouping** - Switch modes anytime
- ✅ **Full feature compatibility** - Everything works in lanes
- ✅ **Smart filtering** - Empty lanes hidden automatically
- ✅ **Label duplication** - Tasks appear in all relevant label lanes
- ✅ **Clean UI** - Minimal, consistent with app design

Use swimlanes to organize work your way, without rigid structures or complex configuration.

