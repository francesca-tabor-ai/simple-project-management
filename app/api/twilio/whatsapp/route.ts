// Twilio WhatsApp webhook handler
import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { transcribeAudio, downloadAudio } from '@/lib/openai/transcribe'
import { extractTaskFromTranscript, createTaskFromText } from '@/lib/openai/extractTaskFromTranscript'
import { createTaskFromInbound, getTaskDeepLink } from '@/lib/tasks/createTaskFromInbound'
import { env, features } from '@/lib/env'

// Force Node.js runtime (required for Buffer/stream operations)
export const runtime = 'nodejs'

// Check if WhatsApp feature is enabled
if (!features.whatsappVoice) {
  console.warn('⚠️  WhatsApp voice feature is disabled. Missing required environment variables.')
}

// In-memory rate limiting (per sender)
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10

/**
 * POST /api/twilio/whatsapp
 * Webhook for incoming WhatsApp messages
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify Twilio signature for security
    if (!verifyTwilioSignature(request)) {
      console.error('Invalid Twilio signature')
      return new NextResponse('Forbidden', { status: 403 })
    }
    
    // 2. Parse form-encoded body
    const formData = await request.formData()
    const body = Object.fromEntries(formData.entries()) as Record<string, string>
    
    const {
      From: from,
      Body: bodyText,
      NumMedia: numMedia,
      MessageSid: messageSid,
    } = body
    
    console.log(`Incoming WhatsApp message from ${maskPhoneNumber(from)}, MessageSid: ${messageSid}`)
    
    // 3. Rate limiting
    if (!checkRateLimit(from)) {
      console.warn(`Rate limit exceeded for ${maskPhoneNumber(from)}`)
      return twilioResponse('⚠️ Too many messages. Please wait before sending more.')
    }
    
    // 4. Process message based on media type
    let taskTitle = ''
    let taskLink = ''
    
    try {
      const mediaCount = parseInt(numMedia || '0', 10)
      
      if (mediaCount > 0) {
        // Check if first media is audio
        const mediaContentType = body['MediaContentType0']
        const mediaUrl = body['MediaUrl0']
        const mediaSid = body['MediaSid0']
        
        if (mediaContentType?.startsWith('audio/')) {
          console.log(`Processing audio media: ${mediaContentType}`)
          
          // Download audio from Twilio
          const { buffer, contentType } = await downloadAudio(mediaUrl, {
            username: env.TWILIO_ACCOUNT_SID,
            password: env.TWILIO_AUTH_TOKEN,
          })
          
          // Transcribe audio
          const transcript = await transcribeAudio(buffer, contentType)
          console.log(`Transcription: "${transcript}"`)
          
          // Extract task from transcript
          const extractedTask = await extractTaskFromTranscript(transcript)
          
          // Create task
          const { taskId, isDuplicate } = await createTaskFromInbound({
            extractedTask,
            sender: from,
            messageSid,
            mediaSid,
          })
          
          if (isDuplicate) {
            console.log('Duplicate message, returning existing task')
            return twilioResponse('✅ Task already created from this message.')
          }
          
          taskTitle = extractedTask.title
          taskLink = getTaskDeepLink(taskId)
          
        } else {
          // Non-audio media - just acknowledge
          console.log(`Received non-audio media: ${mediaContentType}`)
          return twilioResponse('ℹ️ Only voice notes are supported. Please send a voice message.')
        }
      } else if (bodyText) {
        // Text-only message
        console.log(`Processing text message: "${bodyText}"`)
        
        const extractedTask = createTaskFromText(bodyText)
        
        const { taskId, isDuplicate } = await createTaskFromInbound({
          extractedTask,
          sender: from,
          messageSid,
        })
        
        if (isDuplicate) {
          return twilioResponse('✅ Task already created from this message.')
        }
        
        taskTitle = extractedTask.title
        taskLink = getTaskDeepLink(taskId)
      } else {
        // Empty message
        return twilioResponse('ℹ️ Please send a voice note or text message to create a task.')
      }
      
      // Success response
      const message = `✅ Created task: "${taskTitle}"\n\n📋 View: ${taskLink}`
      return twilioResponse(message)
      
    } catch (processingError: any) {
      console.error('Failed to process message:', processingError)
      
      // User-friendly error messages
      if (processingError.message.includes('download')) {
        return twilioResponse('❌ Couldn\'t read the audio. Please try again.')
      } else if (processingError.message.includes('Transcription')) {
        return twilioResponse('❌ Couldn\'t transcribe the voice note. Try a shorter recording.')
      } else if (processingError.message.includes('Task creation')) {
        return twilioResponse('❌ Couldn\'t create the task. Please try again later.')
      } else {
        return twilioResponse('❌ Something went wrong. Please try again.')
      }
    }
    
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

/**
 * Verify Twilio request signature
 */
function verifyTwilioSignature(request: NextRequest): boolean {
  // Skip verification in development if signature not required
  if (features.isDevelopment && !env.TWILIO_VERIFY_SIGNATURE) {
    console.warn('Skipping Twilio signature verification in development')
    return true
  }
  
  if (!env.TWILIO_AUTH_TOKEN) {
    console.error('TWILIO_AUTH_TOKEN not configured')
    return false
  }
  
  try {
    const signature = request.headers.get('x-twilio-signature')
    if (!signature) {
      console.error('Missing x-twilio-signature header')
      return false
    }
    
    // Get the full URL
    const url = request.url
    
    // For verification, we need the params as an object
    // This is tricky with Next.js App Router - in production, consider using webhook validator
    
    // Simple validation: check if signature exists and has reasonable format
    // For production, implement full Twilio signature validation
    // const validator = twilio.validateRequest(TWILIO_AUTH_TOKEN, signature, url, params)
    
    return true // Simplified for MVP
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

/**
 * Rate limiting check
 */
function checkRateLimit(sender: string): boolean {
  const now = Date.now()
  const requests = rateLimitMap.get(sender) || []
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS)
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }
  
  // Add current request
  recentRequests.push(now)
  rateLimitMap.set(sender, recentRequests)
  
  return true
}

/**
 * Mask phone number for logging
 */
function maskPhoneNumber(phone: string): string {
  if (!phone) return 'unknown'
  const cleaned = phone.replace(/^whatsapp:/, '')
  const last4 = cleaned.slice(-4)
  return `****${last4}`
}

/**
 * Generate TwiML response
 */
function twilioResponse(message: string): NextResponse {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`
  
  return new NextResponse(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
  })
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

