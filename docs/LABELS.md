# Color-Coded Labels - Feature Documentation

## Overview

The Labels feature provides a robust tagging system where each label has a **name** and a **color**, displayed as beautiful color chips throughout the app. Labels help organize and categorize tasks visually.

---

## Features

✅ **Color-coded chips** - Each label has a unique color for instant visual recognition  
✅ **Deterministic colors** - Same label name always gets the same default color  
✅ **Custom colors** - Change label colors on individual tasks  
✅ **Smart text contrast** - Automatically uses dark or light text based on background  
✅ **Add/remove labels** - Easy label management in task drawer  
✅ **Duplicate prevention** - Case-insensitive duplicate detection  
✅ **Color picker** - Visual color selection from 14 accessible colors  
✅ **Bulk operations** - Add/remove labels on multiple tasks at once  
✅ **Filter by labels** - Multi-select label filtering  
✅ **Legacy migration** - Automatically converts old string labels to Label objects  

---

## Using Labels

### On Task Cards

Labels appear as small, colored chips below the task metadata:

```
┌─────────────────────────────┐
│ ☐ Fix payment bug           │
│ [High] [Jan 15]             │
│ [bug] [critical] [payments] │  ← Color chips (up to 3)
│ +2                          │  ← "+N" for overflow
└─────────────────────────────┘
```

- **Up to 3 labels** shown as colored chips
- **"+N" indicator** if task has more than 3 labels
- Each chip shows the label name with its color

### In Task Details Drawer

The Labels section in the drawer provides full label management:

#### **Viewing Labels**
- All labels displayed as colored chips
- Click any chip to change its color
- Remove button (×) on each chip

#### **Adding Labels**
1. Type label name in the input field
2. Color auto-generates based on name (deterministic)
3. Click color button to choose custom color
4. Press Enter or click "Add"

#### **Changing Colors**
1. Click on an existing label chip
2. Color picker popover appears
3. Select new color from palette
4. Color updates immediately

#### **Error Handling**
- Empty labels rejected with error message
- Duplicate labels (case-insensitive) rejected
- Error messages clear when typing

---

## Color System

### Color Palette

14 accessible, distinct colors:

| Color | Hex | Use Case |
|-------|-----|----------|
| Red | `#EF4444` | Bugs, urgent, critical |
| Amber | `#F59E0B` | Warnings, security |
| Emerald | `#10B981` | Success, payments, money |
| Blue | `#3B82F6` | Features, frontend, info |
| Violet | `#8B5CF6` | Backend, server |
| Pink | `#EC4899` | Design, UI/UX |
| Cyan | `#06B6D4` | Documentation, water |
| Lime | `#84CC16` | Refactor, optimization |
| Orange | `#F97316` | Deployment, alerts |
| Indigo | `#6366F1` | Client, business |
| Teal | `#14B8A6` | Planning, strategy |
| Purple | `#A855F7` | Research, exploration |
| Yellow | `#EAB308` | Performance, speed |
| Green | `#22C55E` | DevOps, automation |

### Deterministic Color Assignment

Labels automatically get consistent colors based on their name:

```typescript
// Same name → same color (case-insensitive)
"bug" → #EF4444 (red)
"Bug" → #EF4444 (red)
"BUG" → #EF4444 (red)

// Different names → different colors
"frontend" → #3B82F6 (blue)
"backend" → #8B5CF6 (violet)
```

This uses a hash function on the lowercase label name to pick from the palette.

### Text Contrast

Text color (black or white) is automatically chosen for readability:

```typescript
// Light backgrounds → dark text
#EAB308 (yellow) → black text

// Dark backgrounds → light text
#8B5CF6 (violet) → white text
```

Uses ITU-R BT.709 relative luminance calculation.

---

## Bulk Label Operations

### Adding Labels to Multiple Tasks

1. Select tasks using checkboxes
2. Bulk action bar appears at bottom
3. Type label name in "Add label" input
4. Click "Add Label"
5. Label added to all selected tasks (skips if already present)

### Removing Labels from Multiple Tasks

1. Select tasks with the label
2. Use "Remove" dropdown in bulk bar
3. Select label to remove
4. Label removed from all selected tasks

---

## Filtering by Labels

### Multi-Select Label Filter

In the filter toolbar:

1. Click "Labels" dropdown
2. Select one or more labels
3. Tasks shown if they have **any** selected label (OR logic)
4. Special "No label" option for tasks without labels

### Active Filter Chips

Selected label filters appear as chips:
- Shows label name with color
- Click × to remove filter
- "Clear all" removes all filters

---

## Technical Details

### Data Model

```typescript
type Label = {
  id: string        // Unique identifier
  name: string      // Display name
  color: string     // Hex color like "#3B82F6"
}

type Task = {
  // ... other fields
  labels: Label[]   // Array of Label objects
}
```

### Label Utilities

**`makeLabel(name, color?)`**
- Creates a new Label object
- Generates unique ID
- Uses deterministic color if none provided

**`normalizeLabelName(name)`**
- Trims whitespace
- Collapses multiple spaces to one

**`equalsLabel(a, b)`**
- Case-insensitive name comparison
- Works with Label objects or strings

**`getColorForLabel(name)`**
- Deterministic color based on name hash
- Always returns same color for same name

**`shouldUseDarkText(hexColor)`**
- Calculates if dark text needed for contrast
- Based on background luminance

**`getAllLabels(tasks)`**
- Extracts unique labels from task list
- Sorted alphabetically by name

**`migrateLegacyLabels(labels)`**
- Converts old `string[]` to `Label[]`
- Backward compatibility for existing data

### Server Actions

**`bulkAddLabel(taskIds, label, tasks)`**
- Adds Label object to multiple tasks
- Skips if label already exists (case-insensitive)
- Revalidates `/app` path

**`bulkRemoveLabel(taskIds, labelName, tasks)`**
- Removes label by name from multiple tasks
- Case-insensitive matching
- Revalidates `/app` path

**`updateTask(taskId, updates)`**
- Generic update including labels
- Used by drawer for single-task label changes

### Components

**`<LabelChip>`**
- Displays single label as colored chip
- Props: `label`, `size`, `onRemove`, `onClick`
- Handles text contrast automatically
- Keyboard accessible

**`<ColorPicker>`**
- Grid of 14 color swatches
- Shows selected color with ring
- Hover effects for better UX
- Click to select color

**`<TaskDetailsDrawer>` (Labels section)**
- Existing labels with remove buttons
- Add label input with color preview
- Color picker toggle
- Error messages for duplicates/empty

---

## Migration from String Labels

If you have existing tasks with `labels: string[]`, they are automatically migrated:

```typescript
// Old format (string[])
labels: ["bug", "frontend", "urgent"]

// Automatically converted to (Label[])
labels: [
  { id: "label-123", name: "bug", color: "#EF4444" },
  { id: "label-456", name: "frontend", color: "#3B82F6" },
  { id: "label-789", name: "urgent", color: "#EF4444" }
]
```

Migration happens in `KanbanBoard` component using `migrateLegacyLabels()`.

---

## Accessibility

### Keyboard Navigation
- All controls are keyboard accessible
- Tab through label chips, inputs, buttons
- Enter/Space to activate buttons
- Arrow keys in color picker

### ARIA Attributes
- Remove buttons: `aria-label="Remove label {name}"`
- Color buttons: `aria-label="Choose label color"`
- Proper roles and labels throughout

### Visual Accessibility
- High contrast color palette
- Automatic text contrast
- Clear focus states
- Screen reader friendly

---

## Use Cases

### 1. Categorize by Type
```
Labels: "bug", "feature", "enhancement", "documentation"
Colors: Red, Blue, Lime, Cyan
```

### 2. Priority Tagging
```
Labels: "critical", "high-priority", "low-priority"
Colors: Red, Orange, Gray
```

### 3. Team/Area
```
Labels: "frontend", "backend", "devops", "design"
Colors: Blue, Violet, Green, Pink
```

### 4. Status Indicators
```
Labels: "blocked", "in-review", "needs-testing"
Colors: Red, Yellow, Cyan
```

### 5. Client/Project
```
Labels: "client-a", "client-b", "internal"
Colors: Indigo, Purple, Teal
```

---

## Best Practices

### Label Naming
✅ **Do:**
- Use lowercase for consistency
- Keep names short (1-2 words)
- Use hyphens for multi-word: "high-priority"
- Be specific: "payment-bug" not just "bug"

❌ **Don't:**
- Use very long names (hard to read on chips)
- Use special characters (keep it simple)
- Create too many similar labels
- Use ALL CAPS (looks aggressive)

### Color Selection
✅ **Do:**
- Use red for urgent/critical/bugs
- Use green for success/money/complete
- Use blue for features/info
- Keep related labels in similar color families

❌ **Don't:**
- Use too many similar colors
- Change colors frequently (consistency matters)
- Use colors that clash
- Ignore the default color (it's deterministic for a reason)

### Organization
✅ **Do:**
- Limit to 3-5 labels per task
- Use bulk operations for consistency
- Filter by labels to see related tasks
- Remove unused labels

❌ **Don't:**
- Add 10+ labels to one task
- Create duplicate labels with different casing
- Use labels instead of proper task fields (priority, assignee, etc.)

---

## Troubleshooting

### Labels not showing
- Check that task has `labels` field as array
- Verify labels are Label objects, not strings
- Migration should happen automatically

### Colors look wrong
- Check hex color format: `#RRGGBB`
- Verify color is in uppercase or lowercase consistently
- Text contrast is automatic - don't override

### Duplicate labels
- System prevents duplicates (case-insensitive)
- If you see duplicates, they have different IDs
- Remove and re-add to fix

### Filter not working
- Labels filter uses OR logic (any match)
- Check that filter chips show selected labels
- Try "Clear all" and reapply

### Bulk operations failing
- Ensure tasks are selected (checkboxes)
- Check console for error messages
- Verify network connection (server actions)

---

## Future Enhancements

Potential improvements:

1. **Global label library** - Manage labels across all tasks
2. **Label descriptions** - Hover tooltips explaining label meaning
3. **Label groups** - Organize labels into categories
4. **Custom color input** - Beyond the 14 palette colors
5. **Label templates** - Quick-add common label sets
6. **Label analytics** - See most-used labels, stats
7. **Label hierarchy** - Parent/child label relationships
8. **Emoji support** - Add emojis to label names
9. **Label search** - Typeahead when adding labels
10. **Keyboard shortcuts** - Quick label assignment

---

## Summary

The color-coded labels system provides:

- ✅ **Visual organization** - Instant recognition with colors
- ✅ **Flexible tagging** - Add any label to any task
- ✅ **Smart defaults** - Deterministic colors for consistency
- ✅ **Easy management** - Add, remove, change colors easily
- ✅ **Bulk operations** - Manage labels on multiple tasks
- ✅ **Filtering** - Find tasks by labels quickly
- ✅ **Accessible** - Keyboard navigation, ARIA labels
- ✅ **Beautiful UI** - Polished chips and color picker
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Backward compatible** - Migrates legacy string labels

Labels make task organization visual, intuitive, and powerful! 🏷️

