# 🚀 Quick Deploy to Vercel (5 Minutes)

Follow these steps to deploy your app in 5 minutes!

---

## Step 1: Go to Vercel

Click this link: **https://vercel.com/new**

(Login with your GitHub account if needed)

---

## Step 2: Import Your Repository

1. Click **"Import Git Repository"**
2. Search for: `simple-project-management`
3. Click **"Import"** next to `francesca-tabor-ai/simple-project-management`

---

## Step 3: Configure Project

Vercel will auto-detect Next.js. Just click **"Deploy"** button at the bottom!

**Wait! Before clicking Deploy, add environment variables →**

---

## Step 4: Add Environment Variables

Click **"Environment Variables"** section to expand it.

Add these variables (get values from your `.env.local` file):

### ✅ Required Variables

```bash
NEXT_PUBLIC_SUPABASE_URL
# Value: Your Supabase project URL from Supabase dashboard
# Example: https://abcdefgh.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
# Value: Your Supabase anon key from Supabase dashboard
# Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

NEXTAUTH_SECRET
# Value: Generate with: openssl rand -base64 32
# Or use your existing one from .env.local

NEXTAUTH_URL
# Value: Leave blank for now - we'll update after deployment
# Or use format: https://your-project-name.vercel.app
```

### 🔧 Optional Variables (for advanced features)

**Google Calendar Integration:**
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**WhatsApp Voice Integration:**
```bash
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
OPENAI_API_KEY=sk-...
```

**App Configuration:**
```bash
PUBLIC_APP_URL=https://your-project-name.vercel.app
NODE_ENV=production
TWILIO_VERIFY_SIGNATURE=true
```

---

## Step 5: Deploy!

Click the **"Deploy"** button at the bottom.

⏱️ Wait 2-3 minutes for the build to complete...

---

## Step 6: 🎉 Success!

Your app is live! Vercel will show you the URL:

```
https://your-project-name.vercel.app
```

Click **"Visit"** to see your live app!

---

## Step 7: Update NEXTAUTH_URL

1. Copy your Vercel app URL (e.g., `https://your-project-name.vercel.app`)
2. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
3. Find `NEXTAUTH_URL` (or add it if you skipped it)
4. Set value to: `https://your-project-name.vercel.app`
5. Click **"Save"**
6. Go to **Deployments** tab → Click **"..."** → **"Redeploy"**

---

## Step 8: Update Supabase Redirect URLs

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add these to **Redirect URLs**:
   ```
   https://your-project-name.vercel.app/auth/callback
   https://your-project-name.vercel.app/api/auth/callback/google
   ```
3. Click **"Save"**

---

## Step 9: Update Google OAuth (if using Google Calendar)

1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID
3. Add to **Authorized redirect URIs**:
   ```
   https://your-project-name.vercel.app/api/auth/callback/google
   ```
4. Click **"Save"**

---

## Step 10: Update Twilio Webhook (if using WhatsApp)

1. Go to Twilio Console: https://console.twilio.com/
2. Navigate to WhatsApp → Sandbox Settings
3. Set webhook URL to:
   ```
   https://your-project-name.vercel.app/api/twilio/whatsapp
   ```
4. Click **"Save"**

---

## ✅ Done! Test Your App

Visit your live app and test:

- [ ] Sign up / Login works
- [ ] Create a task
- [ ] Task appears in "To Do" column
- [ ] Click task to open details drawer
- [ ] Edit task details
- [ ] Drag task between columns
- [ ] Search and filters work
- [ ] Google Calendar sync (if enabled)
- [ ] WhatsApp integration (if enabled)

---

## 🔄 Future Deployments

Every time you push to GitHub, Vercel **automatically deploys**! 🚀

```bash
git add .
git commit -m "Add new feature"
git push origin main
# Vercel auto-deploys! ✨
```

---

## 🆘 Troubleshooting

### App doesn't load

1. Check **Vercel Logs**: Dashboard → Your Project → Logs
2. Verify all environment variables are set
3. Make sure Supabase URLs are correct

### Authentication not working

1. Verify `NEXTAUTH_URL` matches your Vercel URL
2. Check Supabase redirect URLs include your Vercel URL
3. Check Google OAuth redirect URIs (if using)

### Need help?

Check the detailed guide: **DEPLOYMENT.md**

---

## 🎊 Congratulations!

Your task management app is now live on the internet!

**Share your app**: `https://your-project-name.vercel.app`

Enjoy! 🚀

