# Visual Identity & Design System

## 🎨 Brand Overview

A modern, friendly, and soft UI design for a productivity-focused task management app.

---

## Color Palette

### Primary Colors
- **Background**: `#FAFAF8` - Off-white with warm undertones
- **Primary Accent**: `#F4B183` - Warm peach/soft orange
- **Primary Hover**: `#F6C19A` - Lighter warm peach

### Secondary Accents
- **Yellow**: `#F9D98C` - Muted yellow for highlights
- **Green**: `#B8E6B8` - Soft green for "done" states
- **Blue**: `#A8D8EA` - Soft blue for "in progress" states

### Neutrals
- **Gray 50**: `#F8F7F5` - Very light gray
- **Gray 100**: `#F0EEE9` - Light gray backgrounds
- **Gray 200**: `#E5E2DB` - Borders and dividers
- **Gray 500**: `#8A8A8A` - Secondary text
- **Gray 800**: `#2A2A2A` - Primary text
- **Gray 900**: `#1F1F1F` - Headings

### Surface Colors
- **Card Background**: `#FFFFFF` - Pure white
- **Card Shadow**: `rgba(0, 0, 0, 0.04)` - Very subtle

---

## Typography

### Font Stack
System fonts with humanist characteristics (similar to Inter):
```
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 
"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

### Hierarchy
- **Large headings**: Bold, generous line height
- **Body text**: Medium weight, 1.6 line height
- **Labels**: Regular/light weight
- **Anti-aliasing**: Always enabled for smooth rendering

---

## Layout & Spacing

### Border Radius
- **Small**: 8px
- **Medium**: 12px - Used for most buttons and inputs
- **Large**: 16px - Used for larger cards
- **Extra Large**: 20px - Used for major containers
- **Full**: 9999px - For pills and circular elements

### Spacing Philosophy
- Generous whitespace between sections
- Comfortable padding in interactive elements
- Airy layouts that are easy to scan

### Shadows
- **Small**: `0 1px 3px rgba(0, 0, 0, 0.04)` - Subtle elevation
- **Medium**: `0 4px 12px rgba(0, 0, 0, 0.04)` - Cards on hover
- **Large**: `0 8px 24px rgba(0, 0, 0, 0.04)` - Modals (if needed)

---

## UI Components

### Buttons
- **Primary**: Warm peach background, white text, 14px radius
- **Secondary**: Gray background, darker gray text, 12px radius
- **Hover**: Slightly darker shade + shadow lift
- **Disabled**: 50% opacity

### Input Fields
- **Default**: Light gray background, 2px border, 12-14px radius
- **Focus**: Primary color border, white background
- **Placeholder**: Medium gray (#8A8A8A)

### Cards
- **Background**: White
- **Border**: Light gray with 50% opacity
- **Radius**: 14-20px depending on size
- **Shadow**: Very subtle on default, more prominent on hover

### Kanban Columns
- **Pending**: Gray background (#F8F7F5)
- **In Progress**: Soft blue tint (#A8D8EA with 40% opacity)
- **Done**: Soft green tint (#B8E6B8 with 40% opacity)
- **Radius**: 16px
- **Border**: 2px with accent color

### Task Cards
- **Background**: White
- **Radius**: 14px
- **Border**: Light gray
- **Hover**: Scale 1.02, shadow increase
- **Drag**: Cursor change to move

---

## Motion & Interaction

### Transitions
- **Duration**: 150-200ms for most interactions
- **Easing**: `ease-in-out` for smooth feel
- **Properties**: Transform, opacity, colors, shadows

### Hover States
- **Buttons**: Color change + shadow
- **Cards**: Scale up slightly + shadow increase
- **Links**: Color change only

### Focus States
- **Ring**: 2px primary color
- **Offset**: 2px
- **Applied to**: All interactive elements

---

## Iconography

### Style Guidelines
- Rounded, simple shapes
- Consistent stroke width
- Minimal detail
- Friendly and approachable

### Avatar/Logo Style
- Circular or rounded square (12-16px radius)
- Gradient from primary to primary-hover
- Single letter or simple icon
- Shadow for depth

---

## Accessibility

### Contrast
- Primary text on light background: AAA compliant
- Secondary text: AA compliant
- Interactive elements: Clear visual indicators

### Focus Management
- Visible focus rings on all interactive elements
- Tab order follows visual hierarchy
- Screen reader friendly labels

---

## Design Principles

### Do's ✅
- Use generous whitespace
- Round corners consistently (12-20px)
- Soft shadows and subtle elevation
- Warm, friendly colors
- Clear visual hierarchy
- Smooth transitions (150-200ms)

### Don'ts ❌
- No dark mode (light theme only)
- No harsh borders or high contrast
- No saturated or neon colors
- No sharp edges
- No heavy shadows
- No complex animations

---

## Component Examples

### Task Card
```
- White background
- 14px border radius
- Light gray border (50% opacity)
- 4px padding
- Hover: scale 1.02 + shadow increase
```

### Primary Button
```
- Warm peach background (#F4B183)
- White text
- 14px border radius
- Medium font weight
- Hover: lighter shade + shadow
```

### Input Field
```
- Gray 50 background (#F8F7F5)
- 2px gray 200 border
- 12px border radius
- Focus: primary border + white background
```

---

## Brand Personality

**Modern** • **Friendly** • **Approachable** • **Productive** • **Calm** • **Organized**

The design should feel like a tool that helps you get work done without feeling corporate or cold. It's warm, inviting, and visually lightweight - perfect for daily task management.

