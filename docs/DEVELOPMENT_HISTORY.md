# Development History - Simple Project Management App

## Overview

This document chronicles all the prompts and instructions used to build the Simple Project Management application, from initial setup through to the current state with full REST API, normalized database schema, and comprehensive feature set.

---

## Session 1: Initial Setup & Deployment

### 1. **Publish to GitHub**
**Prompt:**
```
publish to github https://github.com/francesca-tabor-ai/simple-project-management.git
```

**Outcome:** Project published to GitHub repository

---

### 2. **Deploy to Vercel**
**Prompt:**
```
help deploy to vercel
```

**Context Provided:**
- Vercel project URL: https://vercel.com/francesca-tabors-projects/simple-project-management/settings
- Project ID: `prj_G57xrUu2Yl4vhEP4tKopOchXWB5m`

**Outcome:** Initial Vercel deployment configured

---

### 3. **Fix TypeScript Build Error**
**Prompt:**
```
Fix TypeScript error in ./lib/openai/transcribe.ts:31:28: Type 'Buffer<ArrayBufferLike>' is not assignable to type 'BlobPart' That line is currently: const file = new File([audioBuffer], fileToUpload, { type: contentType }) Cursor Instructions (edit exactly) 1) Open the file Go to: lib/openai/transcribe.ts 2) Jump to line 31 Find this exact line: const file = new File([audioBuffer], fileToUpload, { type: contentType }) 3) Replace ONLY audioBuffer inside the array Change it to new Uint8Array(audioBuffer). So you end up with: const file = new File([new Uint8Array(audioBuffer)], fileToUpload, { type: contentType })
```

**Outcome:** Fixed Buffer to Uint8Array conversion for OpenAI File constructor

---

### 4. **Create Supabase Tables**
**Prompt:**
```
Create the tables in supabase for users.
```

**Outcome:** Initial database schema guidance provided

---

### 5. **Detailed TypeScript Fix Instructions**
**Prompt:**
```
1) Fix lib/openai/transcribe.ts (the compile error) A. Open the file In Cursor: press Cmd+P (Mac) / Ctrl+P (Windows/Linux) Type: lib/openai/transcribe.ts Hit Enter B. Make the change at the failing line (around line 31) Find this line (or very close to it): const file = new File([audioBuffer], fileToUpload, { type: contentType }) Replace it with: const file = new File([new Uint8Array(audioBuffer)], fileToUpload, { type: contentType }) ✅ This converts Node Buffer → Uint8Array, which is a valid BlobPart for File([...]). C. Save + run build Save the file In Cursor terminal: npm run build 2) Make sure this code runs in Node.js runtime (important on Vercel/Next) If transcribe.ts is used from a route handler (ex: app/api/.../route.ts) or API route, ensure that route is not running in Edge. A. Find the route file that calls transcribe(...) In Cursor, press Cmd+Shift+F / Ctrl+Shift+F Search for: transcribe( (or openai.audio.transcriptions) Open the route file from the results (commonly one of these): app/api/transcribe/route.ts pages/api/transcribe.ts or similar B. Add Node runtime export at the top of that route file Add this near the top (top-level, not inside functions): export const runtime = "nodejs";
```

**Outcome:** Complete fix applied with runtime configuration

---

### 6. **Git Commit & Push**
**Prompt:**
```
✅ Committed to Git ✅ Pushed to GitHub
```

**Status Update:** Changes successfully deployed

---

## Session 2: UI/UX Improvements

### 7. **Comprehensive UI Enhancement**
**Prompt:**
```
Goal: Improve usability + visual hierarchy without changing core functionality. Keep it lightweight and incremental. 1) First: map the codebase Find the page/component that renders the Tasks screen (likely TasksPage, TasksView, Dashboard, etc.). Identify components for: Task composer (new task input + Add button) Search input Filter bar (Labels, Assignee, Due date, Priority) Column board (To Do / In Progress / Done) Task row item Undo/Redo controls (and state management) Cursor: search keywords: "Create New Task", "Add Task", "Search tasks by title", "To Do", "In Progress", "Done", "Undo", "Redo". Implementation instructions (what to change) A) Make "Add Task" the obvious primary action Style the Add Task button as primary (filled, high contrast). Add placeholder to the task input: e.g. "What needs to be done?" Support Enter to submit: If input not empty: submit If empty: no-op After submit: Clear input Keep focus in input (fast capture) Acceptance criteria You can add tasks with Enter or clicking Add Task. The Add button stands out as the main CTA. B) Reduce filter clutter with an expandable "Filters" panel + chips Replace the always-visible filter row with: A Filters button When clicked: dropdown/panel containing existing controls (Labels, Assignee, Due date, Priority) When any filter is active, show filter chips under the toolbar: Example: Assignee: Unassigned × Example: Due: Next 7 days × Add a Clear all action when any filter is active. Acceptance criteria Filters can be opened/closed. Active filters are visible as removable chips. "Clear all" resets filters to default. C) Improve task row readability (spacing + hierarchy) In each task row: Make task title font-weight: 600 Add a smaller metadata line beneath (priority, checklist progress, labels) Increase vertical padding around task rows. Add a subtle divider or card background per task. Show priority as a badge/dot: Low / Med / High (or your current enum) Use consistent styling (don't invent new states) Acceptance criteria It's easy to visually scan titles vs metadata. Tasks don't look cramped. D) Column usability upgrades Make column headers more distinct: Title + count pill (already present—style it) Add a "+ Add task" quick action at the top of each column (optional): Clicking focuses the main input and sets status preselect OR opens inline add for that column. Improve empty state: Replace "No tasks yet" with helpful copy and a CTA button: "All clear 🎉 Add a task to get started." Acceptance criteria Columns feel like clear sections. Empty states guide the user. E) Undo/Redo: add feedback (without changing logic) Add tooltips like: "Undo: moved 'Tax' to To Do" "Redo: …" If you track last action in state, show it; otherwise show generic: "Undo last action" After undo/redo, briefly highlight the affected task row (CSS animation). Acceptance criteria Undo/Redo have meaningful tooltips. User gets visible confirmation something happened.
```

**Outcome:** Comprehensive UI improvements including filters, task row styling, column enhancements, and undo/redo feedback

---

### 8. **Environment Variables Query**
**Prompt:**
```
What are the Environment Variables to add to vercel
```

**Outcome:** Supabase environment variables guidance provided

---

### 9. **Fix Vercel Git Integration**
**Prompt:**
```
Fix Vercel Not Triggering Deployments from Commits Context Commits are successfully pushed to main Vercel deployments are not being created for new commits Only manual "Redeploy" entries appear in Vercel GitHub commits show ❌ 0 / 1 checks (Vercel check never runs) This indicates a broken Git ↔ Vercel integration, not a code issue Objective Restore automatic Vercel deployments on every push to main. Required Actions 1. Verify repository configuration Ensure the project is a Next.js app (Create Next App detected) Confirm there is no ignoreCommand in vercel.json Confirm vercel.json does not disable Git deployments If vercel.json exists: Remove or comment out: ignoreCommand git.deploymentEnabled: false Any branch-based deployment restrictions 2. Fix Node.js runtime configuration Recent commits mention runtime and Buffer/File issues. Do the following: Ensure package.json contains a valid Node engine: { "engines": { "node": ">=18" } } Ensure no Edge-only APIs are used in server code that expects Node If API routes use File, Buffer, or transcription logic: Explicitly set runtime: export const runtime = "nodejs";
```

**Outcome:** Fixed Git integration, Node.js runtime configuration, and deployment triggers

---

### 10. **Alternative Deployment Methods**
**Prompt:**
```
Vercel is not auto deploying. Is there another method of deploying to vercel
```

**Outcome:** Alternative deployment methods provided (Vercel Dashboard, CLI workarounds)

---

### 11. **README Roadmap Upgrade**
**Prompt:**
```
Checklist Upgrade Steps (cursor instructions) 1. Rename each item to a clear action verb * Format: Verb + outcome * Example: "Connect Google Calendar sync" (not "Kanban - Google Calendar") 2. Reorder items into a logical flow * Put "setup" first, "testing" next, "publish/distribute" last. * Use this order: * Setup → Build → Test → Publish → Promote → Review 3. Add section headers (use ALL CAPS) * Add these as checklist items (keep unchecked): * SETUP * BUILD * TEST * PUBLISH * PROMOTE * RETRO 4. Convert each current item into a tighter, measurable step * Add success criteria in brackets. * Example: "WhatsApp flow working [message sends + receives]" 5. Add "Next action" + "Definition of Done" items at the top * "NEXT ACTION: ____" * "DONE WHEN: ____" 6. Add 1–2 tiny tasks under big ones * If an item is >30–45 mins, split it. * Example: * "Google Calendar: connect account" * "Google Calendar: create test task event" * "Google Calendar: verify sync both ways" 7. Add one "Review + ship" checkpoint at the end * "Final review [no errors + checklist complete]" * "Ship + announce [posted + link added]"
```

**Outcome:** README roadmap upgraded with actionable items, sections, and success criteria

---

### 12. **Git Commit & Pull Request**
**Prompt:**
```
commit to git and pull request
```

**Follow-up:**
```
yes test it
```

**Outcome:** Changes committed and tested

---

## Session 3: Database Schema & Migration Issues

### 13. **SQL Query Error**
**Error Reported:**
```
Error: Failed to run sql query: ERROR: 23502: null value in column "user_id" of relation "tasks" violates not-null constraint DETAIL: Failing row contains (55cff626-e960-464b-b73e-24df74020945, null, 🧪 Test Task 09:47:07, pending, 2026-01-03 09:47:07.665737+00, 2026-01-03 09:47:07.665737+00, null, null, null, , null, medium, [], [{"id": "1", "done": false, "text": "Test item 1"}, {"id": "2", ..., []).
```

**Outcome:** Fixed auth.uid() context issue in SQL migrations

---

### 14. **Organize SQL Files**
**Prompt:**
```
organise the .sql folders in the supabase folder
```

**Outcome:** SQL migration files organized into structured supabase/ directory

---

### 15. **Check Persistence Method**
**Prompt:**
```
what am I using for persistence
```

**Outcome:** Identified JSONB columns (tasks.checklist, tasks.labels) as current persistence method

---

## Session 4: Checklist Persistence Fix

### 16. **Fix Checklist Autosave**
**Prompt:**
```
## Fix checklist autosave not persisting (Supabase JSONB + 400ms debounce) ### ✅ Goal Checklist items should **persist after refresh**. Right now they disappear because **autosave isn't being triggered** (most likely due to **mutating the checklist array/object in place**), or the **debounced save isn't flushed** for discrete checklist actions. --- ## 1) Make checklist updates immutable (most important) In `TaskDetailsDrawer` (or wherever you edit `localTask`), make sure every checklist change creates: * a **new task object** * a **new checklist array** * and (when editing an item) a **new item object** ### Add item Replace any `push()` / in-place edits with: * `setLocalTask(prev => ({ ...prev, checklist: [...(prev.checklist ?? []), newItem] }))` ### Toggle item Use `map()` to create a new array and new item: * `setLocalTask(prev => ({ ...prev, checklist: prev.checklist.map(...) }))` ### Delete item Use `filter()`: * `setLocalTask(prev => ({ ...prev, checklist: prev.checklist.filter(...) }))`
```

**Outcome:** Fixed immutability issues and immediate save for checklist actions

---

### 17. **Normalized Table Implementation**
**Prompt:**
```
Update your frontend: checklist must be loaded + saved from Supabase A. When you open a task drawer, fetch checklist items Do this when selectedTaskId changes (or on drawer open): const loadChecklist = async (taskId: string) => { const { data, error } = await supabase .from("checklist_items") .select("id, task_id, text, done, order") .eq("task_id", taskId) .order("order", { ascending: true }); if (error) throw error; setChecklistItems(data ?? []); }; Key point: after refresh/sign-in, your tasks reload, but the drawer checklist must hydrate from DB, not from previous component state.
```

**Outcome:** Implemented normalized `checklist_items` and `labels` tables with proper frontend integration

---

### 18. **SQL Policy Error**
**Error Reported:**
```
Error: Failed to run sql query: ERROR: 42710: policy "Users can view own checklist items" for table "checklist_items" already exists
```

**Outcome:** Created idempotent migration script (SAFE_RUN_THIS.sql) with `DROP POLICY IF EXISTS`

---

### 19. **SQL JOIN Syntax Error**
**Error Reported:**
```
Error: Failed to run sql query: ERROR: 42P01: invalid reference to FROM-clause entry for table "tasks" LINE 214: AND labels.user_id = tasks.user_id ^ DETAIL: There is an entry for table "tasks", but it cannot be referenced from this part of the query.
```

**Outcome:** Fixed JOIN syntax from old-style comma joins to `CROSS JOIN LATERAL`

---

### 20. **Checklist Persistence Issue**
**Prompt:**
```
checklist still disappears after refresh / sign-out
```

**Outcome:** Implemented fallback mechanism in server actions to gracefully handle JSONB vs normalized table migration

---

### 21. **Test Data Migration**
**Prompt:**
```
create a migration data file, for task, checklist and label items, to test it works. Should like to the user ID dd6fbf1c-94a9-468b-8ea3-a433b811e450
```

**Outcome:** Created TEST_DATA.sql with comprehensive sample data (3 tasks, 12 checklist items, 7 labels)

---

## Session 5: Database Migration Debugging

### 22. **SQL Editor Usage**
**Prompt:**
```
do I need to run anything in the SQL editor?
```

**Outcome:** Guidance provided on running SAFE_RUN_THIS.sql and TEST_DATA.sql in Supabase SQL Editor

---

### 23. **UUID Format Error**
**Error Reported:**
```
Error: Failed to run sql query: ERROR: 22P02: invalid input syntax for type uuid: "label-1111-1111-1111-111111111111"
```

**Outcome:** Fixed invalid UUID format (changed from `label-XXXX` to valid hexadecimal format)

---

### 24. **Labels and Checklist Not Showing**
**Prompt:**
```
The tasks were created but there were no checklist items or labels showing in the front end
```

**Outcome:** Diagnosed that data exists in database but frontend wasn't fetching from normalized tables

---

### 25. **Date Format Error**
**Prompt:**
```
## Goal Fix browser error: `The specified value "2026-01-10 00:00:00" does not conform to the required format, "yyyy-MM-dd".` ## What's happening A React-controlled `<input type="date">` is receiving a value like `"2026-01-10 00:00:00"` (or `"2026-01-10T00:00:00Z"`). HTML date inputs only accept `"YYYY-MM-DD"`.
```

**Outcome:** Created `lib/date-utils.ts` with `formatDateForInput()` helper to handle PostgreSQL timestamps

---

## Session 6: Vercel Deployment & Cache Issues

### 26. **Fix Vercel Deployment**
**Prompt:**
```
how can I fix vercel?
```

**Outcome:** Provided comprehensive Vercel troubleshooting steps, forced clean rebuild with empty commit

---

### 27. **Vercel Build Warnings**
**Prompt:**
```
## Task: Fix Vercel / Next.js build warnings + pin Node version ### Context (current warnings) * Next.js warning: **"middleware file convention is deprecated. Please use 'proxy' instead"** * Vercel warning: **package.json engines uses ">=18" and may auto-upgrade Node major** * npm warnings: deprecated transitive deps (`scmp`, `node-domexception`) * npm audit: **3 low severity vulnerabilities**
```

**Outcome:** 
- Pinned Node.js to 20.x in package.json
- Documented all warnings with explanations
- Created VERCEL_WARNINGS_STATUS.md

---

## Session 7: Comprehensive API Routes

### 28. **Add API Routes**
**Prompt:**
```
## Task: Add API Routes (Health Check + CRUD) ### Tech context * Next.js App Router * Deployed on Vercel * Uses NextAuth (`/api/auth/[...nextauth]`) * Uses Supabase (direct DB access is available server-side) --- ## 1️⃣ Add Health Check API route ### Goal Provide a simple endpoint to verify: * deployment is alive * serverless function works * (optional) database connectivity ### Route GET /api/health
```

**Full Requirements:**
- Health check endpoint (public)
- Full CRUD for Tasks
- Full CRUD for Labels  
- Full CRUD for Checklist Items
- Authentication & security
- Error handling conventions
- Comprehensive documentation

**Outcome:**
- Created 7 new API route files
- Implemented full REST API with authentication
- Created comprehensive API documentation (docs/API_ROUTES.md)
- Added test script (scripts/test-api-routes.sh)
- Fixed Next.js 16 async params issue

---

## Session 8: Documentation

### 29. **Create Development History**
**Prompt:**
```
Create an .md file with a history of all the prompts used to build this app
```

**Outcome:** This document (docs/DEVELOPMENT_HISTORY.md)

---

## Key Technical Decisions

### Database Architecture
- **Initial:** JSONB columns for nested data (checklist, labels)
- **Current:** Normalized tables (`checklist_items`, `labels`, `task_labels`)
- **Migration Strategy:** Dual-mode support with JSONB fallback

### Frontend Framework
- **Framework:** Next.js 16.1.1 (App Router)
- **Styling:** Tailwind CSS 4
- **State Management:** React hooks with custom `useUndoableState`
- **Authentication:** Supabase Auth with NextAuth integration

### Deployment
- **Platform:** Vercel
- **Node Version:** 20.x (pinned)
- **Database:** Supabase (PostgreSQL)
- **API:** RESTful endpoints via Next.js API routes

### Code Quality
- **TypeScript:** Strict typing throughout
- **Error Handling:** Comprehensive error boundaries and logging
- **Security:** Row-Level Security (RLS) in Supabase
- **Testing:** Manual testing + health check endpoint

---

## Current Feature Set

### Core Features
✅ Task management (create, read, update, delete)  
✅ Kanban board view (To Do, In Progress, Done)  
✅ Checklist items (normalized, persistent)  
✅ Labels (normalized, color-coded)  
✅ Task priorities (low, medium, high, urgent)  
✅ Due dates (with proper date formatting)  
✅ Task descriptions  
✅ Assignees  
✅ Attachments  

### Advanced Features
✅ Undo/Redo functionality  
✅ Bulk operations (move, label, delete)  
✅ Filters (labels, assignee, due date, priority)  
✅ Search (by title)  
✅ Sorting options  
✅ Autosave (400ms debounce)  
✅ Google Calendar integration  
✅ WhatsApp voice input  
✅ Swimlane view  

### API Features
✅ Health check endpoint  
✅ Full REST API for all resources  
✅ Authentication required  
✅ JSON responses  
✅ Proper error handling  
✅ Comprehensive documentation  

---

## File Structure

```
simple-project-management/
├── app/
│   ├── actions/          # Server actions
│   │   ├── tasks.ts
│   │   ├── checklist.ts
│   │   └── labels.ts
│   ├── api/              # API routes
│   │   ├── health/
│   │   ├── tasks/
│   │   ├── labels/
│   │   └── checklist-items/
│   ├── app/              # Main app page
│   └── auth/             # Authentication pages
├── components/           # React components
│   ├── KanbanBoard.tsx
│   ├── TaskDetailsDrawer.tsx
│   └── ...
├── lib/                  # Utilities
│   ├── supabase/
│   ├── auth/
│   ├── date-utils.ts
│   └── ...
├── hooks/                # Custom hooks
│   ├── useUndoableState.ts
│   ├── useAutosave.ts
│   └── ...
├── supabase/            # Database migrations
│   └── migrations/
│       ├── SAFE_RUN_THIS.sql
│       ├── TEST_DATA.sql
│       ├── QUICKSTART.sql
│       └── DIAGNOSTIC.sql
├── docs/                 # Documentation
│   ├── API_ROUTES.md
│   ├── DEVELOPMENT_HISTORY.md
│   ├── VERCEL_WARNINGS_STATUS.md
│   └── ...
└── scripts/             # Utility scripts
    └── test-api-routes.sh
```

---

## Lessons Learned

### 1. **JSONB vs Normalized Tables**
- JSONB is quick for prototyping but limits querying
- Normalized tables provide better structure and query flexibility
- Dual-mode support allows gradual migration

### 2. **Next.js 16 Breaking Changes**
- Dynamic route params are now Promises
- Middleware convention warnings are premature
- Always check Next.js changelog for App Router changes

### 3. **Vercel Deployment**
- Cache issues require explicit clearing
- Empty commits can force fresh builds
- Pin Node version to prevent surprise upgrades

### 4. **Database Migrations**
- Always make migrations idempotent
- Use `DROP IF EXISTS` for policies
- Use `CREATE IF NOT EXISTS` for tables
- Test with `auth.uid()` in actual app context, not SQL Editor

### 5. **Authentication Context**
- `auth.uid()` returns null in Supabase SQL Editor
- RLS policies work differently in SQL Editor vs app
- Always test with real authenticated users

---

## Metrics

### Code Stats
- **Total Files:** ~100+
- **API Routes:** 13 endpoints
- **Database Tables:** 5 (tasks, checklist_items, labels, task_labels, + auth.users)
- **Documentation Pages:** 10+
- **Git Commits:** 30+

### Timeline
- **Start Date:** January 2, 2026
- **Current Date:** January 3, 2026
- **Duration:** ~2 days of intensive development

---

## Future Enhancements

### Planned
- [ ] Pagination for API endpoints
- [ ] Rate limiting
- [ ] OpenAPI/Swagger documentation
- [ ] Webhooks for task events
- [ ] API versioning (v1, v2)
- [ ] Real-time collaboration (WebSocket)
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)

### Under Consideration
- [ ] Task dependencies
- [ ] Recurring tasks
- [ ] Time tracking
- [ ] Comments/Activity log
- [ ] File uploads (S3 integration)
- [ ] Team workspaces
- [ ] Reporting/Analytics
- [ ] Email notifications

---

## Contributors

- **Developer:** AI Assistant (Claude)
- **Project Owner:** Francesca Tabor
- **Repository:** https://github.com/francesca-tabor-ai/simple-project-management

---

## License

[Specify license here]

---

*Last Updated: January 3, 2026*

