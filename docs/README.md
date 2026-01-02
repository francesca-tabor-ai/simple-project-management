# Documentation Index

Welcome to the Tasks Kanban App documentation! This folder contains comprehensive guides for all features and integrations.

---

## 📚 Table of Contents

### Core Features

1. **[Database Setup](./DATABASE_SETUP.md)**
   - Supabase configuration
   - Schema creation
   - RLS policies
   - Authentication setup

2. **[Task Details Feature](./TASK_DETAILS_FEATURE.md)**
   - Task drawer UI
   - Rich task properties
   - Checklists, labels, attachments
   - Due dates and priorities

3. **[Visual Identity](./VISUAL_IDENTITY.md)**
   - Design system
   - Color palette
   - Typography
   - Component styling

---

### Task Management Features

4. **[Labels & Tags](./LABELS.md)**
   - Color-coded labels
   - Label creation and management
   - Label filtering

5. **[Bulk Actions](./BULK_ACTIONS.md)**
   - Multi-select tasks
   - Bulk move, label, delete
   - Selection management

6. **[Sorting](./SORTING.md)**
   - Sort by created date
   - Sort by due date
   - Sort by priority
   - Sort within swimlanes

7. **[Autosave](./AUTOSAVE.md)**
   - Automatic saving
   - Debounced updates
   - Save status indicators
   - Error handling

8. **[Undo/Redo](./UNDO_REDO.md)**
   - History management
   - Keyboard shortcuts
   - Undo toast notifications
   - State restoration

---

### Advanced Features

9. **[Search & Filters](./SEARCH_FILTERS.md)**
   - Full-text search
   - Label filters
   - Assignee filters
   - Due date filters
   - Priority filters
   - Active filter chips

10. **[Swimlanes](./SWIMLANES.md)**
    - Group by Assignee
    - Group by Priority
    - Group by Label
    - Lane management

11. **[Mobile Responsive](./MOBILE_RESPONSIVE.md)**
    - Horizontal scrolling columns
    - Touch-optimized UI
    - Responsive toolbar
    - Full-screen drawer on mobile
    - Safe area support

---

### Integrations

12. **[Google Calendar Integration](./GOOGLE_CALENDAR_SETUP.md)**
    - OAuth setup
    - Event synchronization
    - Calendar selection
    - Auto-update on task changes
    - Setup guide

13. **[Google Calendar Implementation](./IMPLEMENTATION_SUMMARY.md)**
    - Technical details
    - Architecture overview
    - API reference
    - Security implementation

14. **[WhatsApp Voice-to-Task](./WHATSAPP_VOICE_SETUP.md)**
    - Twilio setup
    - OpenAI transcription
    - Task extraction
    - Webhook configuration
    - Testing guide

15. **[WhatsApp Implementation](./WHATSAPP_IMPLEMENTATION_SUMMARY.md)**
    - Technical overview
    - Cost estimates
    - Security features
    - Quick reference

---

## 🚀 Quick Start Guides

### For Developers

1. Start with **[Database Setup](./DATABASE_SETUP.md)** to configure your backend
2. Review **[Visual Identity](./VISUAL_IDENTITY.md)** for design guidelines
3. Explore feature docs based on what you're building

### For Integrations

- **Google Calendar**: See [GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md)
- **WhatsApp**: See [WHATSAPP_VOICE_SETUP.md](./WHATSAPP_VOICE_SETUP.md)

### For Users

- **Task Management**: [TASK_DETAILS_FEATURE.md](./TASK_DETAILS_FEATURE.md)
- **Keyboard Shortcuts**: [UNDO_REDO.md](./UNDO_REDO.md)
- **Mobile Usage**: [MOBILE_RESPONSIVE.md](./MOBILE_RESPONSIVE.md)

---

## 📖 Documentation Structure

Each feature document includes:

- **Overview**: What the feature does
- **Setup**: How to configure it
- **Usage**: How to use it
- **Technical Details**: Architecture and implementation
- **Troubleshooting**: Common issues and fixes
- **Examples**: Code samples and screenshots

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **State Management**: React Hooks, Custom hooks for undo/redo
- **Integrations**: Google Calendar API, Twilio WhatsApp, OpenAI APIs

---

## 📝 Contributing to Documentation

When adding new features:

1. Create a new `.md` file in this folder
2. Follow the existing structure
3. Include setup, usage, and troubleshooting sections
4. Add entry to this README index
5. Cross-reference related docs

---

## 🔗 Related Resources

- **Main README**: `../README.md` (project overview)
- **Environment Template**: `../env.example.txt`
- **Database Schema**: `../supabase/schema.sql`

---

## 💡 Help & Support

- Check the relevant feature documentation
- Review troubleshooting sections
- Look for similar issues in code comments
- Test with simplified scenarios

---

**Last Updated**: January 2026  
**Version**: 1.0.0

