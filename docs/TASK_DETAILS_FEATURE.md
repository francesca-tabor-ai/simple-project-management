# Task Details Drawer - Feature Documentation

## Overview

The Task Details Drawer is a comprehensive right-side panel that provides rich task management capabilities. It opens when clicking any task card in the Kanban board.

## Features

### 1. Task Description
- Multi-line textarea for detailed task descriptions
- Auto-save on blur
- Debounced updates to prevent excessive API calls

### 2. Priority Management
- Four priority levels: Low, Medium, High, Urgent
- Visual color coding:
  - **Low**: Gray
  - **Medium**: Blue
  - **High**: Orange
  - **Urgent**: Red
- One-click priority updates

### 3. Due Dates
- Date picker for setting deadlines
- Clear button to remove due date
- Overdue indicators (red badge) on task cards when past due
- Only shows overdue for tasks not marked as "Done"

### 4. Assignee
- Dropdown to assign tasks to team members
- Predefined users: Francesca, Alex, Sam, Priya, Jordan
- Avatar with initials displayed on task cards
- Clear button to unassign

### 5. Labels
- Add custom labels to categorize tasks
- Chip-style display with remove buttons
- Prevents duplicate labels (case-insensitive)
- Task cards show up to 3 labels + counter for additional ones

### 6. Checklist
- Add sub-tasks with checkbox and text
- Visual progress indicator (completed/total count)
- Animated progress bar
- Strike-through styling for completed items
- Delete individual checklist items
- Enter key to quickly add items

### 7. Attachments & Links
- Add links with custom titles
- URL validation (must start with http:// or https://)
- Opens in new tab with security (rel="noreferrer")
- Delete individual attachments
- Useful for linking to:
  - Design mockups
  - Documentation
  - Related resources
  - Issue trackers
  - External tools

## User Experience

### Opening the Drawer
- Click any task card to open
- Drawer slides in from the right side
- Full width on mobile (~520px on desktop)
- Overlay backdrop

### Closing the Drawer
Three ways to close:
1. Click the X button in the header
2. Press Escape key
3. Click the backdrop overlay

### Focus Management
- Basic focus trapping implemented
- Tab key cycles through interactive elements
- Shift+Tab moves backward
- Maintains focus within drawer when open

### Data Persistence
- All changes automatically saved to Supabase
- Optimistic updates for smooth UX
- Page revalidation after updates
- Changes reflect immediately on task cards

## Task Card Enhancements

Task cards now display rich metadata:

### Priority Badge
- Small colored pill showing priority level
- Color matches priority selection in drawer

### Due Date Badge
- Shows formatted date (e.g., "Jan 15")
- Red background if overdue (and not done)
- Gray background for upcoming dates

### Checklist Progress
- Shows completion ratio (e.g., "2/5")
- Small checklist icon for visual clarity
- Only appears if task has checklist items

### Labels
- Up to 3 labels shown as chips
- "+N" indicator if more than 3 labels
- Yellow/amber background for visibility

### Assignee Avatar
- Circular avatar with gradient background
- Shows initials (up to 2 letters)
- Name displayed next to avatar
- Peach gradient matching app theme

## State Management

### Single Source of Truth
- All task data stored in database
- No duplicated state
- Drawer reads from `tasks` array + `selectedTaskId`

### Update Flow
```
User Edit → updateTask() → Supabase → revalidatePath() → UI Update
```

### Handling Edge Cases
- If selected task is deleted, drawer auto-closes
- Handles concurrent updates gracefully
- Validates input before saving (URLs, empty strings)

## Accessibility

### Keyboard Navigation
- Full keyboard support
- Enter to submit forms
- Escape to close
- Tab to navigate fields
- Focus trap prevents tabbing outside drawer

### ARIA Labels
- Proper dialog role and aria-modal
- aria-labelledby for drawer title
- aria-label for icon-only buttons
- Descriptive button labels

### Visual Feedback
- Clear hover states
- Focus rings on interactive elements
- Loading states during saves
- Color contrast meets WCAG standards

## Technical Implementation

### Components
- **TaskDetailsDrawer.tsx** - Main drawer component
- **KanbanBoard.tsx** - Updated with task selection and enhanced cards
- **Task type** - Extended with new fields
- **Server actions** - Generic updateTask() function

### Data Model
```typescript
type Task = {
  // Core fields
  id: string
  user_id: string
  title: string
  status: 'pending' | 'in_progress' | 'done'
  created_at: string
  updated_at: string
  
  // Extended fields
  description: string
  dueDate: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  labels: string[]
  assignee: { id: string; name: string } | null
  checklist: { id: string; text: string; done: boolean }[]
  attachments: { id: string; title: string; url: string }[]
}
```

### Default Values
New tasks are created with sensible defaults:
- description: ''
- dueDate: null
- priority: 'medium'
- labels: []
- assignee: null
- checklist: []
- attachments: []

## Future Enhancements

Potential improvements for future versions:

1. **Rich Text Description** - Markdown support for formatted text
2. **Real Assignees** - Fetch from team members table
3. **File Uploads** - Direct file attachments (not just links)
4. **Comments** - Discussion thread on tasks
5. **Activity Log** - Track changes and updates
6. **Subtasks** - Nested task hierarchy
7. **Time Tracking** - Log time spent on tasks
8. **Dependencies** - Link related tasks
9. **Recurring Tasks** - Automated task creation
10. **Custom Fields** - User-defined metadata

## Styling

The drawer follows the app's soft, modern design system:
- Rounded corners (12-20px)
- Soft shadows
- Warm peach accents
- Gray neutral palette
- Generous spacing
- Smooth transitions (150-200ms)

All styles are consistent with the app's visual identity documented in `VISUAL_IDENTITY.md`.

