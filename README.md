# Tasks - Simple Project Management

A modern, feature-rich Kanban task management application built with Next.js, React, TypeScript, and Supabase.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8)

---

## 🚀 Features

### Core Task Management
- ✅ **Kanban Board** - Drag & drop tasks between columns (To Do, In Progress, Done)
- ✅ **Rich Task Details** - Description, checklist, due dates, priorities, labels, assignees, attachments
- ✅ **Inline Editing** - Edit task titles and status directly on cards
- ✅ **Bulk Actions** - Multi-select and perform actions on multiple tasks
- ✅ **Search & Filters** - Full-text search with advanced filtering
- ✅ **Smart Sorting** - Sort by created date, due date, or priority
- ✅ **Swimlanes** - Group tasks by assignee, priority, or label
- ✅ **Autosave** - Automatic saving with debouncing and status indicators
- ✅ **Undo/Redo** - Full history with keyboard shortcuts (Ctrl+Z / Ctrl+Y)
- ✅ **Mobile Responsive** - Horizontal scrolling columns with touch optimization

### Integrations
- 🗓️ **Google Calendar** - Sync tasks with due dates to Google Calendar
- 📱 **WhatsApp Voice-to-Task** - Send voice notes via WhatsApp → auto-transcribed → tasks created
- 🔐 **Supabase Auth** - Secure authentication with row-level security

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **State Management**: React Hooks + Custom undo/redo
- **Auth**: NextAuth.js (Google OAuth) + Supabase Auth
- **APIs**: Google Calendar API, Twilio WhatsApp API, OpenAI API (Whisper + ChatGPT)
- **Deployment**: Vercel-ready

---

## 📦 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- (Optional) Google Cloud account for Calendar integration
- (Optional) Twilio + OpenAI accounts for WhatsApp integration

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd supabase-test

# Install dependencies
npm install

# Copy environment template
cp env.example.txt .env.local

# Configure your environment variables
# See env.example.txt for required variables
```

### Environment Setup

Edit `.env.local` with your credentials:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NextAuth (Required for Google Calendar)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32

# Google OAuth & Calendar (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Twilio WhatsApp (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# OpenAI (Optional, for WhatsApp voice transcription)
OPENAI_API_KEY=your_openai_api_key

# App Configuration
PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

Run the SQL migration in your Supabase SQL Editor:

```bash
# See supabase/schema.sql or docs/DATABASE_SETUP.md for full schema
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) folder:

### Getting Started
- **[Database Setup](./docs/DATABASE_SETUP.md)** - Configure Supabase
- **[Visual Identity](./docs/VISUAL_IDENTITY.md)** - Design system guide

### Features
- **[Task Details](./docs/TASK_DETAILS_FEATURE.md)** - Rich task properties
- **[Labels & Tags](./docs/LABELS.md)** - Color-coded labels
- **[Bulk Actions](./docs/BULK_ACTIONS.md)** - Multi-select operations
- **[Search & Filters](./docs/SEARCH_FILTERS.md)** - Advanced filtering
- **[Sorting](./docs/SORTING.md)** - Sort by date/priority
- **[Swimlanes](./docs/SWIMLANES.md)** - Group tasks by attributes
- **[Autosave](./docs/AUTOSAVE.md)** - Automatic persistence
- **[Undo/Redo](./docs/UNDO_REDO.md)** - History management
- **[Mobile Responsive](./docs/MOBILE_RESPONSIVE.md)** - Touch-optimized UI

### Integrations
- **[Google Calendar](./docs/GOOGLE_CALENDAR_SETUP.md)** - Calendar sync setup
- **[Google Calendar Tech](./docs/IMPLEMENTATION_SUMMARY.md)** - Technical details
- **[WhatsApp Voice](./docs/WHATSAPP_VOICE_SETUP.md)** - Voice-to-task setup
- **[WhatsApp Tech](./docs/WHATSAPP_IMPLEMENTATION_SUMMARY.md)** - Technical overview

👉 **[Full Documentation Index](./docs/README.md)**

---

## 🎯 Key Features Showcase

### Google Calendar Integration
Sync tasks with due dates to your Google Calendar. Changes to task details automatically update the calendar event.

**Cost**: Free (uses your Google account)

### WhatsApp Voice-to-Task
Send a WhatsApp voice note like:
> "Remind me to call the dentist next Friday. It's urgent."

The app will:
1. Transcribe the audio (OpenAI Whisper)
2. Extract task details with AI (ChatGPT)
3. Create a task with:
   - Title: "Call dentist"
   - Priority: Urgent
   - Due date: Next Friday
   - Labels: whatsapp, voice

**Cost**: ~$0.0035 per voice note

---

## 🧪 Testing

### Run Tests

```bash
npm run test        # Run all tests
npm run test:watch  # Watch mode
npm run test:e2e    # End-to-end tests (if configured)
```

### Manual Testing

See feature-specific docs for testing guides:
- [Google Calendar Testing](./docs/GOOGLE_CALENDAR_SETUP.md#testing)
- [WhatsApp Testing](./docs/WHATSAPP_VOICE_SETUP.md#testing-the-integration)

---

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub/GitLab
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to update:
- `NEXTAUTH_URL` → your production domain
- `PUBLIC_APP_URL` → your production domain
- `TWILIO_VERIFY_SIGNATURE=true` (if using WhatsApp)
- Generate new `NEXTAUTH_SECRET` for production

See [deployment docs](./docs/GOOGLE_CALENDAR_SETUP.md#production-deployment) for details.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update documentation in `docs/`
5. Submit a pull request

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- **Next.js** - React framework
- **Supabase** - Backend platform
- **Tailwind CSS** - Styling framework
- **Vercel** - Deployment platform
- **Google** - Calendar API
- **Twilio** - WhatsApp API
- **OpenAI** - Whisper + ChatGPT APIs

---

## 📞 Support

- **Documentation**: See [`docs/`](./docs/) folder
- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions

---

## 🗺️ Roadmap

### NEXT ACTION
- [ ] **NEXT:** Deploy to Vercel [auto-deploy working + production live]

### DONE WHEN
- [ ] **DONE WHEN:** All features deployed, tested in prod, and checklist 100% complete

---

### **SETUP**
- [ ] **SETUP** *(section header)*

#### Fix Deployment Pipeline
- [ ] Connect Vercel Git integration [GitHub webhooks firing]
- [ ] Verify production environment variables [all keys present in Vercel dashboard]
- [ ] Test auto-deploy [push triggers deployment within 30s]

---

### **BUILD**
- [ ] **BUILD** *(section header)*

#### Core Features
- [ ] Build recurring tasks [create + test daily/weekly repeat]
- [ ] Build task templates [save template + reuse in <3 clicks]
- [ ] Add dark mode toggle [persists across sessions]
- [ ] Add CSV/PDF export [downloads all tasks with filters applied]

#### Team Features  
- [ ] Enable team collaboration [invite users + shared workspace]
- [ ] Build activity feed [shows last 50 actions with timestamps]

#### Platform
- [ ] Add offline support [tasks cached + sync on reconnect]
- [ ] Package desktop app [Electron build for macOS + Windows]

---

### **TEST**
- [ ] **TEST** *(section header)*

#### Manual Testing
- [ ] Test recurring tasks [daily task creates tomorrow's copy]
- [ ] Test templates [create "Meeting Notes" template + use 3x]
- [ ] Test dark mode [toggle works + no contrast issues]
- [ ] Test export [CSV opens in Excel + PDF renders correctly]

#### Integration Testing
- [ ] Test team workspace [invite user + verify shared tasks]
- [ ] Test activity feed [create/edit/delete shows in feed]
- [ ] Test offline mode [disconnect WiFi + create task + reconnect]

---

### **PUBLISH**
- [ ] **PUBLISH** *(section header)*

- [ ] Deploy to production [Vercel build passes + live URL accessible]
- [ ] Update production docs [README + /docs reflect new features]
- [ ] Tag release [git tag v1.0.0 + push tags]

---

### **PROMOTE**
- [ ] **PROMOTE** *(section header)*

- [ ] Write launch post [tweet/LinkedIn with demo GIF]
- [ ] Share on Product Hunt [post + gather 10 upvotes]
- [ ] Update portfolio [add project link + screenshots]

---

### **RETRO**
- [ ] **RETRO** *(section header)*

- [ ] Final review [no console errors + checklist 100% complete]
- [ ] Ship + announce [posted publicly + link added to README]
- [ ] Retrospective [document wins + lessons learned in /docs/RETRO.md]

---

**Built with ❤️ using Next.js and modern web technologies**
