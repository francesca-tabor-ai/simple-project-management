// Server-only task creation from inbound messages (WhatsApp, etc.)
// DO NOT use "use client" - this is server-only code

import { createClient } from '@/lib/supabase/server'
import type { ExtractedTask } from '@/lib/openai/extractTaskFromTranscript'
import { makeLabel } from '@/lib/label-utils'
import crypto from 'crypto'

interface CreateTaskFromInboundParams {
  extractedTask: ExtractedTask
  sender: string         // Phone number or identifier
  messageSid: string     // Twilio Message SID for deduplication
  mediaSid?: string      // Twilio Media SID if audio
  userId?: string        // Optional: specific user to assign task to
}

/**
 * Create a task from inbound message with deduplication
 * @returns Created task ID or existing task ID if duplicate
 */
export async function createTaskFromInbound(
  params: CreateTaskFromInboundParams
): Promise<{ taskId: string; isDuplicate: boolean }> {
  const { extractedTask, sender, messageSid, mediaSid, userId } = params
  
  try {
    const supabase = await createClient()
    
    // Get current user (or use provided userId)
    let targetUserId = userId
    if (!targetUserId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }
      targetUserId = user.id
    }
    
    // Check for duplicate by messageSid
    const { data: existingTasks, error: checkError } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', targetUserId)
      .filter('source->>messageSid', 'eq', messageSid)
      .limit(1)
    
    if (checkError) {
      console.error('Failed to check for duplicate task:', checkError)
      // Continue anyway - better to create duplicate than fail
    }
    
    if (existingTasks && existingTasks.length > 0) {
      console.log(`Duplicate task detected for messageSid: ${messageSid}`)
      return {
        taskId: existingTasks[0].id,
        isDuplicate: true,
      }
    }
    
    // Hash sender for privacy (store last 4 digits only)
    const hashedSender = hashPhoneNumber(sender)
    
    // Convert label strings to Label objects
    const labelObjects = extractedTask.labels.map(labelName => makeLabel(labelName))
    
    // Prepare task data
    const now = new Date().toISOString()
    const taskData = {
      user_id: targetUserId,
      title: extractedTask.title,
      description: extractedTask.description,
      status: 'pending' as const,
      priority: extractedTask.priority || 'medium',
      dueDate: extractedTask.dueDate || null,
      labels: labelObjects,
      assignee: null,
      checklist: [],
      attachments: [],
      created_at: now,
      updated_at: now,
      source: {
        type: 'whatsapp' as const,
        from: hashedSender,
        messageSid,
        mediaSid,
        receivedAt: now,
      },
    }
    
    // Insert task
    const { data: createdTask, error: insertError } = await supabase
      .from('tasks')
      .insert(taskData)
      .select('id')
      .single()
    
    if (insertError) {
      console.error('Failed to create task:', insertError)
      throw new Error(`Task creation failed: ${insertError.message}`)
    }
    
    if (!createdTask) {
      throw new Error('Task created but no ID returned')
    }
    
    console.log(`Created task ${createdTask.id} from WhatsApp message ${messageSid}`)
    
    return {
      taskId: createdTask.id,
      isDuplicate: false,
    }
  } catch (error: any) {
    console.error('createTaskFromInbound error:', error)
    throw error
  }
}

/**
 * Hash phone number for privacy
 * Returns masked version like "****1234"
 */
function hashPhoneNumber(phoneNumber: string): string {
  // Remove whatsapp: prefix if present
  const cleaned = phoneNumber.replace(/^whatsapp:/, '')
  
  // Keep last 4 digits, mask the rest
  const last4 = cleaned.slice(-4)
  return `****${last4}`
}

/**
 * Get app URL for deep links
 */
export function getAppUrl(): string {
  // Use the validated env module
  const { env } = require('@/lib/env')
  return env.PUBLIC_APP_URL
}

/**
 * Generate deep link to task
 */
export function getTaskDeepLink(taskId: string): string {
  const baseUrl = getAppUrl()
  return `${baseUrl}/app?task=${taskId}`
}

