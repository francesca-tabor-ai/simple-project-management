// Server-only OpenAI transcription utility
// DO NOT use "use client" - this is server-only code

import OpenAI from 'openai'
import { env } from '@/lib/env'

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
})

/**
 * Transcribe audio file using OpenAI Whisper
 * @param audioBuffer - Audio file buffer
 * @param contentType - MIME type (e.g., 'audio/ogg', 'audio/mpeg')
 * @param filename - Optional filename for the audio
 * @returns Transcribed text
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  contentType: string,
  filename?: string
): Promise<string> {
  try {
    // Determine file extension from content type
    const extension = getExtensionFromContentType(contentType)
    const fileToUpload = filename || `audio.${extension}`
    
    console.log(`Transcribing audio: ${fileToUpload}, size: ${audioBuffer.length} bytes, type: ${contentType}`)
    
    // Convert Buffer to Uint8Array (required for File constructor)
    const bytes = Uint8Array.from(audioBuffer)
    
    // Convert to File-like object for OpenAI
    const file = new File([bytes], fileToUpload, { type: contentType })
    
    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en', // Can be removed to auto-detect, or made configurable
      response_format: 'text',
    })
    
    console.log(`Transcription successful: ${transcription.substring(0, 100)}...`)
    
    return transcription.trim()
  } catch (error: any) {
    console.error('Failed to transcribe audio:', error.message)
    throw new Error(`Transcription failed: ${error.message}`)
  }
}

/**
 * Map content type to file extension
 */
function getExtensionFromContentType(contentType: string): string {
  const mapping: Record<string, string> = {
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/flac': 'flac',
  }
  
  return mapping[contentType.toLowerCase()] || 'mp3'
}

/**
 * Download audio from URL with authentication
 * @param url - Audio file URL
 * @param auth - Basic auth credentials { username, password }
 * @returns Audio buffer
 */
export async function downloadAudio(
  url: string,
  auth?: { username: string; password: string }
): Promise<{ buffer: Buffer; contentType: string }> {
  try {
    const headers: HeadersInit = {}
    
    if (auth) {
      const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64')
      headers['Authorization'] = `Basic ${credentials}`
    }
    
    const response = await fetch(url, { headers })
    
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`)
    }
    
    const contentType = response.headers.get('content-type') || 'audio/mpeg'
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    console.log(`Downloaded audio: ${buffer.length} bytes, type: ${contentType}`)
    
    return { buffer, contentType }
  } catch (error: any) {
    console.error('Failed to download audio:', error.message)
    throw new Error(`Audio download failed: ${error.message}`)
  }
}

