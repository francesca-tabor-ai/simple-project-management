// Server-only task extraction from transcript using ChatGPT
// DO NOT use "use client" - this is server-only code

import OpenAI from 'openai'
import { z } from 'zod'
import { env } from '@/lib/env'

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
})

// Zod schema for task extraction
const TaskExtractionSchema = z.object({
  title: z.string().max(100).describe('Task title (max 100 chars)'),
  description: z.string().describe('Full task description including transcript'),
  labels: z.array(z.string()).default(['whatsapp', 'voice']).describe('Task labels'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('Task priority'),
  dueDate: z.string().nullable().optional().describe('Due date in YYYY-MM-DD format or null'),
})

export type ExtractedTask = z.infer<typeof TaskExtractionSchema>

/**
 * Extract structured task data from transcript using ChatGPT
 * @param transcript - Transcribed text from voice note
 * @returns Structured task object
 */
export async function extractTaskFromTranscript(transcript: string): Promise<ExtractedTask> {
  try {
    console.log(`Extracting task from transcript: "${transcript.substring(0, 100)}..."`)
    
    const systemPrompt = `You are a task extraction assistant. Given a voice note transcript, extract:
1. A concise title (max 100 chars) - the main action or task
2. A description that includes the full transcript
3. Relevant labels (always include "whatsapp" and "voice", plus any others that fit)
4. Priority (low/medium/high/urgent) if mentioned or implied
5. Due date in YYYY-MM-DD format if mentioned (e.g., "tomorrow", "next Friday", "January 15th")

Current date: ${new Date().toISOString().split('T')[0]}
Timezone: Europe/London

Return ONLY valid JSON matching this schema:
{
  "title": "string",
  "description": "string",
  "labels": ["whatsapp", "voice", ...],
  "priority": "low|medium|high|urgent" (optional),
  "dueDate": "YYYY-MM-DD" or null (optional)
}

Be concise and actionable. If the transcript is unclear, use the first 8-10 words as the title.`

    const userPrompt = `Transcript: "${transcript}"`
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cost-effective
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent output
      max_tokens: 500,
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from ChatGPT')
    }
    
    // Parse and validate JSON
    const parsed = JSON.parse(content)
    const validated = TaskExtractionSchema.parse(parsed)
    
    // Ensure description includes transcript
    if (!validated.description.includes(transcript)) {
      validated.description = `${validated.description}\n\nOriginal transcript: ${transcript}`
    }
    
    console.log(`Extracted task: "${validated.title}"`)
    
    return validated
  } catch (error: any) {
    console.error('Failed to extract task from transcript:', error.message)
    
    // Fallback: create a simple task from the transcript
    console.log('Using fallback task extraction')
    const fallbackTask: ExtractedTask = {
      title: transcript.substring(0, 80).split(' ').slice(0, 10).join(' ') + (transcript.length > 80 ? '...' : ''),
      description: `Voice note transcript:\n\n${transcript}`,
      labels: ['whatsapp', 'voice'],
      priority: 'medium',
      dueDate: null,
    }
    
    return fallbackTask
  }
}

/**
 * Simple text-only task creation (no AI extraction)
 * Used when user sends text message instead of voice note
 */
export function createTaskFromText(text: string): ExtractedTask {
  return {
    title: text.substring(0, 80).split(' ').slice(0, 10).join(' ') + (text.length > 80 ? '...' : ''),
    description: `WhatsApp message:\n\n${text}`,
    labels: ['whatsapp'],
    priority: 'medium',
    dueDate: null,
  }
}

