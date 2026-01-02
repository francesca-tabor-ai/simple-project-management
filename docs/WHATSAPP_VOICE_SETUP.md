# WhatsApp Voice Note to Task Integration

Complete setup guide for converting WhatsApp voice notes into Kanban tasks using Twilio + OpenAI.

---

## Overview

Users can send WhatsApp voice notes (or text messages) to a Twilio number, and they're automatically:
1. **Transcribed** using OpenAI Whisper
2. **Analyzed** by ChatGPT to extract task details (title, priority, due date)
3. **Created** as tasks in the "To Do" column
4. **Confirmed** via WhatsApp with a deep link to the task

---

## Prerequisites

1. **Twilio Account** with WhatsApp capabilities
2. **OpenAI Account** with API access
3. **Public webhook URL** (ngrok for local dev, or production domain)
4. **Supabase database** with tasks table

---

## Part 1: Twilio Setup

### Step 1: Create Twilio Account

1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up or log in
3. Verify your phone number

### Step 2: Set Up WhatsApp Sandbox (Development)

For testing, use Twilio's WhatsApp Sandbox:

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow instructions to join the sandbox:
   - Send a WhatsApp message to the displayed number (e.g., +1 415 523 8886)
   - Send the code (e.g., "join <code>")
3. You should receive a confirmation message

### Step 3: Get Twilio Credentials

From Twilio Console Dashboard:
1. Copy **Account SID** (starts with `AC...`)
2. Copy **Auth Token** (click to reveal)
3. Note the **Sandbox WhatsApp Number** (e.g., `whatsapp:+14155238886`)

### Step 4: Configure Webhook (After Setting Up Locally)

1. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Scroll to **Sandbox Configuration**
3. Set **WHEN A MESSAGE COMES IN**:
   - URL: `https://your-ngrok-url.ngrok.io/api/twilio/whatsapp` (or production URL)
   - HTTP Method: `POST`
4. Save

---

## Part 2: OpenAI Setup

### Step 1: Create OpenAI Account

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Verify your account

### Step 2: Get API Key

1. Go to **API keys** page
2. Click **Create new secret key**
3. Name it (e.g., "Kanban WhatsApp Integration")
4. Copy the key (starts with `sk-...`)
5. **Save it securely** - you won't be able to see it again

### Step 3: Add Billing (If Required)

- OpenAI requires a payment method for API access
- Voice transcription costs: ~$0.006 per minute (Whisper)
- ChatGPT API costs: ~$0.0001-0.0005 per request (GPT-4o-mini)

---

## Part 3: Local Environment Setup

### Step 1: Add Environment Variables

Add to `.env.local`:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Your sandbox number

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# App Configuration
PUBLIC_APP_URL=http://localhost:3000  # Or your production URL
NEXTAUTH_URL=http://localhost:3000

# Optional: Skip signature verification in dev (NOT recommended for production)
TWILIO_VERIFY_SIGNATURE=false
```

### Step 2: Update Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- Add source column to tasks table (if not exists)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS source JSONB;

-- Add index for faster queries on WhatsApp tasks
CREATE INDEX IF NOT EXISTS idx_tasks_source_type
ON public.tasks USING gin ((source->>'type'));

-- Add index for deduplication by messageSid
CREATE INDEX IF NOT EXISTS idx_tasks_source_message_sid
ON public.tasks USING gin ((source->>'messageSid'));
```

### Step 3: Install ngrok (for Local Testing)

```bash
# Install ngrok
brew install ngrok  # macOS
# OR download from https://ngrok.com/download

# Start ngrok
ngrok http 3000
```

Copy the HTTPS forwarding URL (e.g., `https://abc123.ngrok.io`)

### Step 4: Configure Twilio Webhook

1. Go back to Twilio Sandbox Configuration
2. Set webhook URL to: `https://abc123.ngrok.io/api/twilio/whatsapp`
3. Save

---

## Part 4: Testing the Integration

### Test 1: Text Message → Task

1. Open WhatsApp on your phone
2. Send a text message to your Twilio sandbox number:
   ```
   Buy groceries tomorrow
   ```
3. You should receive a confirmation:
   ```
   ✅ Created task: "Buy groceries tomorrow"
   📋 View: http://localhost:3000/app?task=xxx
   ```
4. Check your Kanban board - task should appear in "To Do"

### Test 2: Voice Note → Task

1. Open WhatsApp
2. **Record a voice note** saying:
   ```
   "Remind me to call the dentist next Friday at 2pm. It's urgent."
   ```
3. Send the voice note
4. Wait ~5-10 seconds for processing
5. You should receive:
   ```
   ✅ Created task: "Call dentist"
   📋 View: http://localhost:3000/app?task=xxx
   ```
6. Check the task on your board:
   - Title: "Call dentist" (or similar)
   - Description: Full transcript
   - Priority: "urgent" (extracted from voice)
   - Due Date: Next Friday's date (extracted from voice)
   - Labels: "whatsapp", "voice"
   - Source badge: Green "WhatsApp" badge

### Test 3: Rate Limiting

1. Send 11 messages rapidly
2. The 11th should respond:
   ```
   ⚠️ Too many messages. Please wait before sending more.
   ```

### Test 4: Duplicate Detection

1. Send the same voice note twice
2. Second attempt should respond:
   ```
   ✅ Task already created from this message.
   ```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User's Phone                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │         WhatsApp App                               │    │
│  │  - Records voice note                              │    │
│  │  - Sends to Twilio number                          │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Voice message
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  Twilio WhatsApp API                        │
│  - Receives message                                         │
│  - Hosts media (audio file)                                 │
│  - Calls webhook with message metadata                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ POST /api/twilio/whatsapp
                           │
┌──────────────────────────▼──────────────────────────────────┐
│               Next.js Webhook Handler                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │  1. Verify Twilio signature                       │    │
│  │  2. Check rate limits                             │    │
│  │  3. Download audio from Twilio                    │    │
│  │  4. Transcribe with OpenAI Whisper               │    │
│  │  5. Extract task details with ChatGPT            │    │
│  │  6. Create task in Supabase                       │    │
│  │  7. Reply with TwiML confirmation                 │    │
│  └────────────────────────────────────────────────────┘    │
└───────────────────────┬─────────────────┬───────────────────┘
                        │                 │
        ┌───────────────┼─────────────────┼──────────────┐
        │               │                 │              │
        ▼               ▼                 ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐
│  OpenAI API  │ │ Supabase │ │    Twilio    │ │   User's     │
│  - Whisper   │ │  (tasks) │ │ (TwiML reply)│ │  WhatsApp    │
│  - ChatGPT   │ │          │ │              │ │  (confirm)   │
└──────────────┘ └──────────┘ └──────────────┘ └──────────────┘
```

---

## Features Implemented

### ✅ Voice Note Transcription
- Automatically transcribes audio using OpenAI Whisper
- Supports multiple audio formats (OGG, MP3, M4A, WAV, etc.)
- Handles audio download from Twilio with authentication

### ✅ Intelligent Task Extraction
- Uses ChatGPT (GPT-4o-mini) to analyze transcript
- Extracts:
  - **Title**: Concise action-oriented title (max 100 chars)
  - **Description**: Full transcript + context
  - **Priority**: low/medium/high/urgent (if mentioned)
  - **Due Date**: Parsed from natural language ("tomorrow", "next Friday")
  - **Labels**: Auto-tags with "whatsapp" and "voice"

### ✅ Text Message Support
- Plain text messages also create tasks
- Auto-tagged with "whatsapp" label
- No voice transcription needed

### ✅ Security
- **Signature verification**: Validates Twilio requests
- **Rate limiting**: Max 10 messages/hour per sender
- **Phone masking**: Logs only last 4 digits (e.g., ****1234)
- **Deduplication**: Prevents duplicate tasks from Twilio retries

### ✅ Error Handling
- User-friendly error messages:
  - Audio download failure → "Couldn't read the audio"
  - Transcription failure → "Couldn't transcribe the voice note"
  - Task creation failure → "Couldn't create the task"
- Server logs detailed errors for debugging

### ✅ UI Integration
- **WhatsApp badge**: Green badge on tasks created via WhatsApp
- **Source tracking**: Stores sender, message ID, timestamp
- **Deep links**: WhatsApp replies include direct link to task

---

## API Costs Estimate

### Per Voice Note (~30 seconds)

- **Whisper transcription**: ~$0.003
- **ChatGPT extraction**: ~$0.0005
- **Total**: ~$0.0035 per voice note

### Monthly Usage Examples

| Voice Notes/Month | Cost     |
|-------------------|----------|
| 100               | $0.35    |
| 500               | $1.75    |
| 1,000             | $3.50    |
| 5,000             | $17.50   |

Text messages cost less (only ChatGPT, no Whisper).

---

## Production Deployment

### Step 1: Approved WhatsApp Sender

For production (not sandbox):
1. Go to Twilio Console → **Messaging** → **Senders** → **WhatsApp senders**
2. Click **New WhatsApp sender**
3. Follow approval process (requires business verification)
4. Update `TWILIO_WHATSAPP_NUMBER` to approved number

### Step 2: Environment Variables

Update `.env` (or deployment platform):

```bash
TWILIO_ACCOUNT_SID=your_production_account_sid
TWILIO_AUTH_TOKEN=your_production_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+your_approved_number
OPENAI_API_KEY=your_production_openai_key
PUBLIC_APP_URL=https://yourdomain.com
TWILIO_VERIFY_SIGNATURE=true  # IMPORTANT: Enable in production
```

### Step 3: Webhook Configuration

1. Update Twilio webhook to production URL:
   `https://yourdomain.com/api/twilio/whatsapp`
2. Verify HTTPS is enabled (required by Twilio)

### Step 4: Security Checklist

- [ ] Enable Twilio signature verification
- [ ] Use HTTPS for webhook URL
- [ ] Rotate OpenAI API key regularly
- [ ] Monitor API usage and costs
- [ ] Set up error alerts (e.g., Sentry)
- [ ] Configure rate limits in production
- [ ] Review logs for sensitive data leaks

### Step 5: Monitoring

Set up monitoring for:
- Webhook response times
- OpenAI API errors
- Task creation failures
- Twilio delivery failures
- Rate limit violations

---

## Troubleshooting

### "Couldn't read the audio"

**Cause**: Audio download from Twilio failed

**Fixes**:
1. Check `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are correct
2. Verify network can reach Twilio URLs
3. Check server logs for detailed error

### "Couldn't transcribe the voice note"

**Cause**: OpenAI Whisper API failed

**Fixes**:
1. Verify `OPENAI_API_KEY` is valid
2. Check OpenAI account has credits
3. Try shorter voice note (<1 minute)
4. Check audio format is supported

### "Couldn't create the task"

**Cause**: Database insert failed

**Fixes**:
1. Check Supabase connection
2. Verify RLS policies allow task creation
3. Check database schema has `source` column
4. Review server logs for SQL errors

### No response from WhatsApp

**Cause**: Webhook not reached or TwiML error

**Fixes**:
1. Check ngrok is running (local dev)
2. Verify webhook URL in Twilio console
3. Check firewall allows Twilio IPs
4. Review Next.js logs for errors
5. Test webhook manually with Postman

### "Rate limit exceeded"

**Cause**: Too many messages from same number

**Fix**: Wait 1 hour or adjust rate limits in code:
```typescript
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10 // Max requests per window
```

### Signature verification failed

**Cause**: Twilio signature doesn't match

**Fixes**:
1. Ensure webhook URL in Twilio matches exactly (no trailing slash differences)
2. Check `TWILIO_AUTH_TOKEN` is correct
3. For local dev, set `TWILIO_VERIFY_SIGNATURE=false` temporarily
4. **Never** disable verification in production

---

## Advanced Configuration

### Custom User Assignment

By default, tasks are created for the authenticated user. To assign to specific user:

```typescript
// In createTaskFromInbound
const userId = await mapPhoneNumberToUserId(sender)
// Then pass userId parameter
```

### Multi-Language Support

Update `transcribeAudio` to remove language constraint:

```typescript
const transcription = await openai.audio.transcriptions.create({
  file: file,
  model: 'whisper-1',
  // language: 'en', // Remove this line for auto-detect
  response_format: 'text',
})
```

### Custom Task Status

Change default status from "pending" to another:

```typescript
// In createTaskFromInbound
const taskData = {
  // ...
  status: 'in_progress', // or 'done'
  // ...
}
```

### Timezone Configuration

Update ChatGPT prompt in `extractTaskFromTranscript.ts`:

```typescript
const systemPrompt = `...
Current date: ${new Date().toISOString().split('T')[0]}
Timezone: America/New_York  // Change this
...`
```

---

## File Structure

```
lib/
├── openai/
│   ├── transcribe.ts                    # Whisper transcription + audio download
│   └── extractTaskFromTranscript.ts     # ChatGPT task extraction
├── tasks/
│   └── createTaskFromInbound.ts         # Task creation with deduplication
└── task-types.ts                        # Updated Task type with source field

app/
└── api/
    └── twilio/
        └── whatsapp/
            └── route.ts                 # Twilio webhook handler

components/
└── KanbanColumns.tsx                    # Updated with WhatsApp badge
```

---

## Security Best Practices

### ✅ Implemented

1. **Signature verification** - Validates Twilio requests
2. **Phone number masking** - Logs only last 4 digits
3. **Rate limiting** - Prevents spam
4. **Deduplication** - Uses messageSid to prevent duplicates
5. **No audio storage** - Audio processed in memory, not saved
6. **HTTPS required** - Twilio only calls HTTPS webhooks

### 🔒 Additional Recommendations

1. **API key rotation** - Rotate OpenAI key every 90 days
2. **Error monitoring** - Use Sentry or similar
3. **Access logs** - Monitor webhook access patterns
4. **IP whitelisting** - Restrict webhook to Twilio IPs (optional)
5. **Audit trail** - Log all task creations with source metadata

---

## Limitations & Future Enhancements

### Current Limitations

1. **One-way sync**: WhatsApp → App only (no app → WhatsApp)
2. **Single user**: All tasks created for webhook caller
3. **English-focused**: ChatGPT prompts assume English
4. **No conversation**: Each message is independent
5. **Basic rate limiting**: In-memory, resets on restart

### Possible Enhancements

1. **Two-way sync**: Update task → notify on WhatsApp
2. **Multi-tenant**: Route tasks based on phone number
3. **Conversation context**: Remember previous messages
4. **Voice commands**: "Mark task X as done"
5. **Task search**: "What's on my todo list?"
6. **Rich formatting**: Send task lists back to WhatsApp
7. **Image OCR**: Extract tasks from photos
8. **Persistent rate limiting**: Use Redis or database
9. **Analytics dashboard**: Track usage and costs
10. **Custom prompts**: User-configurable extraction logic

---

## Support

### Getting Help

1. Check server logs: `npm run dev` output
2. Check Twilio logs: Console → Monitor → Logs → Errors
3. Check OpenAI usage: Platform → Usage
4. Review this documentation
5. Test with simpler messages first

### Common Questions

**Q: Can I use a different phone number?**  
A: Yes, but you need an approved WhatsApp Business Account (not sandbox).

**Q: How much does it cost?**  
A: ~$0.0035 per voice note. Text messages are cheaper (~$0.0005).

**Q: Can I use a different AI model?**  
A: Yes, change `model: 'gpt-4o-mini'` to `'gpt-4'` for better quality (higher cost).

**Q: Does it work with other messaging apps?**  
A: With modifications, yes. Twilio supports SMS, which would need similar setup.

**Q: Can multiple users use the same number?**  
A: Yes, but you'd need to implement phone → user mapping.

---

## Summary

You now have a fully functional WhatsApp → Task integration! Users can:

✅ Send voice notes → Auto-transcribed → Tasks created  
✅ Send text messages → Tasks created  
✅ Get instant WhatsApp confirmation with link  
✅ See WhatsApp badge on tasks  
✅ Smart extraction of priority, due dates, and labels  
✅ Secure, rate-limited, with error handling  

**Next steps:**
1. Set up Twilio sandbox
2. Get OpenAI API key
3. Configure webhook with ngrok
4. Test with voice notes
5. Deploy to production

Happy task creating! 🎉

