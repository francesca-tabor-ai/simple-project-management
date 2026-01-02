# Deployment Guide - Vercel

This guide will help you deploy your task management app to Vercel.

---

## 🚀 Quick Deploy (Recommended)

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel**: Visit https://vercel.com/new

2. **Import Repository**:
   - Click "Import Git Repository"
   - Select `francesca-tabor-ai/simple-project-management`
   - Click "Import"

3. **Configure Project**:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (keep default)
   - Build Command: `npm run build` (auto-detected)
   - Install Command: `npm install` (auto-detected)

4. **Add Environment Variables** (click "Environment Variables"):

   ```bash
   # Required - Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Required - NextAuth
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your_nextauth_secret
   
   # Optional - Google Calendar (if using this feature)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Optional - WhatsApp Voice (if using this feature)
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   OPENAI_API_KEY=your_openai_key
   
   # App Configuration
   PUBLIC_APP_URL=https://your-app.vercel.app
   NODE_ENV=production
   TWILIO_VERIFY_SIGNATURE=true
   ```

5. **Deploy**: Click "Deploy" button

6. **Wait for Build**: Takes 2-3 minutes

7. **Success!** 🎉 Your app is live at `https://your-app.vercel.app`

---

## 🖥️ Option 2: Deploy via CLI

### Step 1: Login to Vercel

```bash
vercel login
```

### Step 2: Deploy

From your project directory:

```bash
cd /Users/francescatabor/Documents/1.Technology/Github/supabase-test
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? `simple-project-management`
- In which directory is your code located? `./`
- Want to override settings? **N**

### Step 3: Add Environment Variables

After deployment, add environment variables:

```bash
# Required variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET

# Optional - Google Calendar
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET

# Optional - WhatsApp Voice
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add TWILIO_WHATSAPP_NUMBER
vercel env add OPENAI_API_KEY

# App config
vercel env add PUBLIC_APP_URL
```

### Step 4: Redeploy with Environment Variables

```bash
vercel --prod
```

---

## 🔧 Post-Deployment Configuration

### 1. Update Supabase Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration, add:

```
https://your-app.vercel.app/auth/callback
https://your-app.vercel.app/api/auth/callback/google
```

### 2. Update Google OAuth Redirect URIs

In Google Cloud Console → APIs & Services → Credentials:

Add Authorized redirect URIs:
```
https://your-app.vercel.app/api/auth/callback/google
```

### 3. Update Twilio Webhook URL

In Twilio Console → WhatsApp → Sandbox Settings:

Set webhook to:
```
https://your-app.vercel.app/api/twilio/whatsapp
```

### 4. Update NEXTAUTH_URL

Make sure the `NEXTAUTH_URL` environment variable matches your production URL:
```
NEXTAUTH_URL=https://your-app.vercel.app
```

---

## 🔍 Verify Deployment

### Check Build Logs

```bash
vercel logs
```

### Test Your App

1. Visit `https://your-app.vercel.app`
2. Sign up / Login
3. Create a test task
4. Verify features work:
   - ✅ Task creation
   - ✅ Drag and drop
   - ✅ Task details drawer
   - ✅ Filters and search
   - ✅ Google Calendar sync (if enabled)
   - ✅ WhatsApp integration (if enabled)

---

## 📊 Monitoring

### View Deployment Dashboard

```bash
vercel
```

Or visit: https://vercel.com/dashboard

### View Real-time Logs

```bash
vercel logs --follow
```

### View Analytics

Go to your Vercel dashboard → Project → Analytics

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically deploys! 🚀
```

### Preview Deployments

- Every git branch gets a preview URL
- Pull requests automatically get deployed
- Test before merging to production

---

## 🛠️ Troubleshooting

### Build Fails

1. **Check build logs**:
   ```bash
   vercel logs
   ```

2. **Common issues**:
   - Missing environment variables → Add them in Vercel dashboard
   - TypeScript errors → Fix in your code
   - Module not found → Check package.json dependencies

### App Doesn't Load

1. **Check environment variables** are set correctly
2. **Check Supabase connection** - verify URL and keys
3. **Check browser console** for errors
4. **Check Vercel logs** for runtime errors

### Authentication Not Working

1. **Verify NEXTAUTH_URL** matches your production URL
2. **Check Google OAuth redirect URIs** include production URL
3. **Verify Supabase redirect URLs** are configured

### WhatsApp Integration Not Working

1. **Check Twilio webhook URL** points to production
2. **Verify TWILIO_VERIFY_SIGNATURE=true** in production
3. **Check environment variables** are set correctly

---

## 🎯 Performance Optimization

### Enable Edge Functions (Optional)

For faster response times, deploy API routes to the edge:

```typescript
// In app/api/*/route.ts
export const runtime = 'edge'
```

### Enable Image Optimization

Already configured in Next.js 15 - images are automatically optimized!

### Enable Caching

Vercel automatically caches static assets and pages.

---

## 💰 Pricing

- **Hobby (Free)**:
  - Unlimited deployments
  - 100GB bandwidth/month
  - Automatic HTTPS
  - Perfect for personal projects!

- **Pro ($20/month)**:
  - 1TB bandwidth
  - Advanced analytics
  - Team collaboration
  - Priority support

Your app should work perfectly on the **free Hobby tier**! 🎉

---

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- GitHub Issues: Report bugs in your repository

---

## 🎉 Success Checklist

- [ ] App deployed to Vercel
- [ ] Environment variables configured
- [ ] Supabase redirect URLs updated
- [ ] Google OAuth configured (if using)
- [ ] Twilio webhooks configured (if using)
- [ ] Custom domain added (optional)
- [ ] HTTPS enabled (automatic)
- [ ] App accessible and working

**Congratulations! Your task management app is live! 🚀**

