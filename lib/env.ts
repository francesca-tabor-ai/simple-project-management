/**
 * Environment Variable Validation & Typed Access
 * 
 * This module validates all required environment variables at startup
 * and provides type-safe access to them throughout the application.
 * 
 * Import this module early in the app lifecycle (e.g., in root layout)
 * to fail fast if configuration is missing.
 */

// Required environment variables (app won't start without these)
const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

// Optional environment variables (features may be disabled if missing)
const optionalEnv = [
  // NextAuth (required for Google Calendar integration)
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  
  // Google OAuth & Calendar (optional feature)
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  
  // Twilio WhatsApp (optional feature)
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_NUMBER',
  
  // OpenAI (optional feature - for WhatsApp transcription)
  'OPENAI_API_KEY',
  
  // App Configuration
  'PUBLIC_APP_URL',
  'NODE_ENV',
  'TWILIO_VERIFY_SIGNATURE',
] as const

/**
 * Validate required environment variables
 * Throws an error if any required variable is missing
 */
function validateEnv() {
  const missing: string[] = []
  
  requiredEnv.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key)
    }
  })
  
  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\n` +
      `Please check your .env.local file and ensure all required variables are set.\n` +
      `See env.example.txt for a template.`
    )
  }
}

/**
 * Check for optional environment variables and log warnings
 */
function checkOptionalEnv() {
  const missing: string[] = []
  
  optionalEnv.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key)
    }
  })
  
  if (missing.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn(
      `⚠️  Missing optional environment variables (some features may be disabled):\n${missing.map(k => `  - ${k}`).join('\n')}`
    )
  }
}

// Run validation
validateEnv()
checkOptionalEnv()

/**
 * Typed environment variable access
 * These are guaranteed to be defined (or empty string for optional vars)
 */
export const env = {
  // Required - Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  
  // Optional - NextAuth
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  
  // Optional - Google OAuth & Calendar
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  
  // Optional - Twilio WhatsApp
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || '',
  
  // Optional - OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  
  // Optional - App Configuration
  PUBLIC_APP_URL: process.env.PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  TWILIO_VERIFY_SIGNATURE: process.env.TWILIO_VERIFY_SIGNATURE === 'true',
}

/**
 * Feature flags based on environment variable availability
 */
export const features = {
  googleCalendar: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.NEXTAUTH_SECRET),
  whatsappVoice: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.OPENAI_API_KEY),
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
}

// Log enabled features in development
if (features.isDevelopment) {
  console.log('🚀 Enabled features:', {
    'Google Calendar': features.googleCalendar,
    'WhatsApp Voice': features.whatsappVoice,
  })
}

// Type exports for external use
export type Env = typeof env
export type Features = typeof features

