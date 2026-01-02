# Google Calendar Integration Setup Guide

This document provides step-by-step instructions to set up Google Calendar integration for your Kanban task management app.

---

## Overview

The Google Calendar integration allows users to:

- **Connect their Google account** via OAuth 2.0
- **Sync tasks** with due dates to Google Calendar as all-day events
- **Automatically update** calendar events when task details change (title, description, due date)
- **Choose which calendar** to sync to (Primary or any other)
- **Unsync tasks** by toggling off, which deletes the calendar event

---

## Prerequisites

1. A Google Cloud Platform (GCP) project
2. Access to the Google Cloud Console
3. A Supabase project with authentication set up
4. Next.js app with NextAuth configured

---

## Part 1: Google Cloud Console Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name: `Tasks Kanban App` (or your app name)
4. Click **Create**
5. Wait for project creation, then select your new project

### Step 2: Enable Google Calendar API

1. In your project, go to **APIs & Services** → **Library**
2. Search for **"Google Calendar API"**
3. Click on **Google Calendar API**
4. Click **Enable**
5. Wait for the API to be enabled

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace organization)
3. Click **Create**

**Fill in the form:**

- **App name**: `Tasks - Simple Project Management` (or your app name)
- **User support email**: Your email
- **App logo**: (Optional) Upload your app logo
- **App domain**: (Optional for local dev, required for production)
  - Application home page: `http://localhost:3000` (or your production URL)
  - Privacy policy: (Optional for local dev, required for production)
  - Terms of service: (Optional)
- **Authorized domains**: (Leave empty for local dev, add your domain for production)
- **Developer contact email**: Your email

4. Click **Save and Continue**

**Scopes:**

5. Click **Add or Remove Scopes**
6. Find and select these scopes:
   - `openid`
   - `email`
   - `profile`
   - Manually add: `https://www.googleapis.com/auth/calendar.events`
7. Click **Update**
8. Click **Save and Continue**

**Test users** (for external OAuth consent screen in development):

9. Click **Add Users**
10. Add your Google email and any other testers
11. Click **Add**
12. Click **Save and Continue**
13. Review and click **Back to Dashboard**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Application type**: **Web application**
4. **Name**: `Tasks App Web Client`

**Authorized JavaScript origins:**

5. Click **Add URI**
6. Add: `http://localhost:3000`
7. For production, add your domain: `https://yourdomain.com`

**Authorized redirect URIs:**

8. Click **Add URI**
9. Add: `http://localhost:3000/api/auth/callback/google`
10. For production, add: `https://yourdomain.com/api/auth/callback/google`

11. Click **Create**

**Download credentials:**

12. A popup will show your **Client ID** and **Client Secret**
13. **Copy both** — you'll need them for your `.env` file
14. Click **OK**

---

## Part 2: Local Environment Configuration

### Step 1: Update `.env.local`

Create or update `/Users/francescatabor/Documents/1.Technology/Github/supabase-test/.env.local`:

```bash
# Existing Supabase config
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_secret_here

# Google OAuth & Calendar API
GOOGLE_CLIENT_ID=your_client_id_from_step_4
GOOGLE_CLIENT_SECRET=your_client_secret_from_step_4
```

### Step 2: Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output and paste it as your `NEXTAUTH_SECRET` value.

### Step 3: Verify Environment Variables

Make sure all environment variables are set:

```bash
cat .env.local
```

Check that you have:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXTAUTH_URL` (http://localhost:3000 for local dev)
- ✅ `NEXTAUTH_SECRET` (random 32-char string)
- ✅ `GOOGLE_CLIENT_ID`
- ✅ `GOOGLE_CLIENT_SECRET`

---

## Part 3: Database Schema Update

### Step 1: Add `googleCalendar` Column to Tasks Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Add googleCalendar JSONB column to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS "googleCalendar" JSONB;

-- Add index for faster queries on synced tasks
CREATE INDEX IF NOT EXISTS idx_tasks_google_calendar_synced
ON public.tasks USING gin (("googleCalendar"->>'synced'));

-- Example structure (for reference, no need to run):
-- {
--   "synced": true,
--   "calendarId": "primary",
--   "eventId": "abc123xyz",
--   "lastSyncedAt": "2026-01-02T10:30:00.000Z"
-- }
```

### Step 2: Verify Schema

In Supabase Dashboard:
1. Go to **Table Editor** → **tasks**
2. Confirm `googleCalendar` column exists with type `jsonb`
3. Confirm RLS policies still allow users to read/update their own tasks

---

## Part 4: Testing the Integration

### Step 1: Start the Development Server

```bash
cd /Users/francescatabor/Documents/1.Technology/Github/supabase-test
npm run dev
```

### Step 2: Test Google OAuth Connection

1. Open [http://localhost:3000/app](http://localhost:3000/app) in your browser
2. Create or open a task
3. Scroll to **Google Calendar** section
4. Click **Connect Google Calendar**
5. You should be redirected to Google OAuth consent screen
6. **Grant permissions** (Calendar access will be requested)
7. You should be redirected back to your app

**Troubleshooting:**

- If you see "Access blocked: This app's request is invalid":
  - Check that your redirect URI in Google Cloud Console matches exactly: `http://localhost:3000/api/auth/callback/google`
  - Ensure OAuth consent screen is configured
- If you see "Developer hasn't verified this app":
  - Click **Advanced** → **Go to Tasks App (unsafe)**
  - This is normal for external OAuth apps in development

### Step 3: Test Task Sync

1. In a task with a due date, toggle **Sync to Google Calendar** to **ON**
2. You should see:
   - Status changes to "Synced" with a green checkmark
   - "Open in Google Calendar" link appears
3. Click **Open in Google Calendar**
4. Verify the event was created in your Google Calendar
5. Event should be:
   - All-day event on the due date
   - Title matches task title
   - Description matches task description

### Step 4: Test Auto-Sync on Edit

1. With sync enabled, edit the task title
2. Wait ~500ms (debounce delay)
3. Check that the calendar event title updated (refresh Google Calendar if needed)
4. Change the due date
5. Verify the event moves to the new date

### Step 5: Test Unsync

1. Toggle **Sync to Google Calendar** to **OFF**
2. Verify:
   - "Synced" status disappears
   - "Open in Google Calendar" link is removed
3. Check Google Calendar — event should be deleted

---

## Part 5: Calendar Selection (Optional)

### Test Multiple Calendars

1. Create additional calendars in Google Calendar (e.g., "Work", "Personal")
2. In a synced task, click on the calendar name (e.g., "Primary Calendar")
3. Select dropdown should show all your calendars
4. Select a different calendar
5. Verify:
   - Event is moved to the new calendar
   - Old event is deleted from the previous calendar

---

## Architecture Overview

### Authentication Flow

```
User clicks "Connect Google Calendar"
    ↓
NextAuth initiates OAuth with Google
    ↓
User grants calendar.events permission
    ↓
Google returns access_token + refresh_token
    ↓
NextAuth stores tokens in session (server-side only)
    ↓
App can now make Google Calendar API calls
```

### Sync Flow

```
User toggles sync ON
    ↓
TaskDetailsDrawer calls toggleCalendarSync() server action
    ↓
Server action:
  - Validates task has due date
  - Calls Google Calendar API to create event
  - Stores eventId in task.googleCalendar
  - Updates Supabase task record
    ↓
UI shows "Synced" status
```

### Auto-Sync Flow (on Edit)

```
User edits task title/description/due date
    ↓
useCalendarSync hook detects change
    ↓
Debounced sync (500ms)
    ↓
Calls syncTaskToCalendar() server action
    ↓
Server action patches existing Google Calendar event
    ↓
Updates task.googleCalendar.lastSyncedAt
```

---

## File Structure

```
lib/
├── auth/
│   └── nextauth.ts                 # NextAuth configuration
├── google/
│   └── calendar.ts                 # Google Calendar API utilities (server-only)
├── task-types.ts                   # Updated Task type with googleCalendar field

app/
├── api/
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts            # NextAuth API route
└── actions/
    └── google-calendar.ts          # Server actions for calendar sync

components/
├── GoogleCalendarSection.tsx       # UI for calendar sync controls
└── TaskDetailsDrawer.tsx           # Updated with GoogleCalendarSection

hooks/
└── useCalendarSync.ts              # Hook for auto-syncing task changes

types/
└── next-auth.d.ts                  # TypeScript definitions for NextAuth session
```

---

## API Reference

### Server Actions (`app/actions/google-calendar.ts`)

#### `syncTaskToCalendar(taskId: string)`

Creates or updates a Google Calendar event for a task.

**Returns:**
```ts
{
  success: boolean
  error?: string
  eventId?: string
}
```

#### `unsyncTaskFromCalendar(taskId: string)`

Deletes the Google Calendar event and clears sync info.

**Returns:**
```ts
{
  success: boolean
  error?: string
}
```

#### `toggleCalendarSync(taskId: string, enabled: boolean)`

Convenience wrapper for sync/unsync.

#### `getUserCalendars()`

Fetches the user's Google Calendars.

**Returns:**
```ts
{
  success: boolean
  calendars?: Array<{
    id: string
    name: string
    primary?: boolean
  }>
  error?: string
}
```

#### `changeTaskCalendar(taskId: string, newCalendarId: string)`

Moves a synced task to a different calendar.

---

## Security Considerations

### Token Storage

- ✅ Access tokens and refresh tokens are stored in **server-side session only**
- ✅ Tokens are **never exposed to the client**
- ✅ All Google API calls happen in **server actions or API routes**

### Data Privacy

- ✅ Each user can only access their own tasks (enforced by RLS)
- ✅ Calendar event `extendedProperties.private` stores `taskId` and `appUserId` for correlation
- ✅ Events are linked to the authenticated user's calendar

### Production Recommendations

1. **Use HTTPS** in production (required for OAuth)
2. **Encrypt refresh tokens** if your database supports it
3. **Implement token rotation** (NextAuth handles this automatically)
4. **Add rate limiting** to server actions (e.g., 100 calendar API calls per user per day)
5. **Monitor API quotas** in Google Cloud Console
6. **Verify OAuth consent screen** before publishing

---

## Troubleshooting

### "Error: Not authenticated with Google"

**Cause:** User hasn't connected their Google account or session expired.

**Fix:**
1. Click "Connect Google Calendar" in the Task Details Drawer
2. Complete OAuth flow
3. Try syncing again

### "Error: Task must have a due date to sync to calendar"

**Cause:** Task doesn't have a `dueDate` set.

**Fix:**
1. Set a due date in the Task Details Drawer
2. Enable calendar sync

### "Error: Failed to sync with Google Calendar"

**Possible causes:**
- Google Calendar API quota exceeded
- Invalid OAuth tokens
- Network error

**Fix:**
1. Check browser console for detailed error
2. Try disconnecting and reconnecting Google account
3. Check Google Cloud Console for API errors/logs
4. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

### "Access blocked: This app's request is invalid"

**Cause:** OAuth redirect URI mismatch.

**Fix:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit your OAuth client
3. Verify **Authorized redirect URIs** includes:
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
4. Ensure no typos (trailing slashes, http vs https)
5. Save and wait ~5 minutes for Google to propagate changes

### Calendar event not updating automatically

**Cause:** Auto-sync debounce delay or sync disabled.

**Fix:**
1. Ensure "Sync to Google Calendar" toggle is **ON**
2. Wait ~500ms after making changes
3. Check browser console for sync logs
4. Manually click "Resync" if needed (future feature)

### "Error: Rate limit exceeded"

**Cause:** Too many Google Calendar API calls.

**Fix:**
1. Wait a few minutes
2. Reduce frequency of task edits
3. Check Google Cloud Console → APIs & Services → Dashboard for quota usage
4. Request quota increase if needed for production

---

## Google Calendar API Quotas

**Free tier limits (as of 2026):**

- **Queries per day:** 1,000,000
- **Queries per 100 seconds per user:** 10,000
- **Queries per 100 seconds:** 10,000

**Per-user limits:**

- Creating events: typically 500/day per user
- Updating events: typically 1,000/day per user

**Monitoring:**

- Go to [Google Cloud Console → APIs & Services → Dashboard](https://console.cloud.google.com/apis/dashboard)
- Select **Google Calendar API**
- View quota usage and errors

**Request increase:**

- Click **Quotas** → **Edit quotas**
- Fill out form explaining your use case
- Typical approval: 1-2 business days

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Generate new `NEXTAUTH_SECRET` for production
- [ ] Add production domain to Google Cloud Console:
  - Authorized JavaScript origins
  - Authorized redirect URIs
- [ ] Update OAuth consent screen with production URLs
- [ ] Submit OAuth consent screen for verification (if publishing publicly)
- [ ] Test OAuth flow on production domain
- [ ] Enable HTTPS (required for OAuth)
- [ ] Monitor Google Calendar API quotas
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Test calendar sync on production
- [ ] Document user-facing features in your app's help docs

---

## Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [NextAuth Google Provider](https://next-auth.js.org/providers/google)
- [googleapis npm package](https://www.npmjs.com/package/googleapis)

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Check server logs (`npm run dev` output)
3. Verify all environment variables are set
4. Review Google Cloud Console error logs
5. Test with a different Google account
6. Create a GitHub issue with:
   - Error message
   - Steps to reproduce
   - Browser/OS information
   - Sanitized error logs

---

## Summary

You've now successfully integrated Google Calendar with your Kanban app! Users can:

✅ Connect their Google account  
✅ Sync tasks with due dates to Google Calendar  
✅ Auto-update events when tasks change  
✅ Choose which calendar to sync to  
✅ Unsync tasks to remove events  

The integration is secure, uses server-side OAuth tokens, and follows Google's best practices.

Happy coding! 🎉

