'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ChecklistItem {
  id: string
  task_id: string
  text: string
  done: boolean
  order: number
  created_at?: string
  updated_at?: string
}

/**
 * Get all checklist items for a task
 * Falls back to JSONB column if normalized table is empty
 */
export async function getChecklistItems(taskId: string): Promise<ChecklistItem[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('[getChecklistItems] User not authenticated')
    return []
  }

  console.log('[getChecklistItems] Fetching items for task:', taskId)

  // First, try to get from normalized table
  const { data: items, error: itemsError } = await supabase
    .from('checklist_items')
    .select('id, task_id, text, done, "order", created_at, updated_at')
    .eq('task_id', taskId)
    .order('order', { ascending: true })

  // If table doesn't exist or query fails, fall back to JSONB
  if (itemsError) {
    console.warn('[getChecklistItems] Normalized table error, falling back to JSONB:', itemsError.message)
    
    // Fall back to JSONB column
    const { data: task } = await supabase
      .from('tasks')
      .select('checklist')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (task?.checklist && Array.isArray(task.checklist)) {
      console.log('[getChecklistItems] Using JSONB fallback, found', task.checklist.length, 'items')
      // Convert JSONB format to ChecklistItem format
      return task.checklist.map((item: any, index: number) => ({
        id: item.id || crypto.randomUUID(),
        task_id: taskId,
        text: item.text || '',
        done: item.done || false,
        order: index
      }))
    }
    
    return []
  }

  // If normalized table exists but is empty, check JSONB for migration
  if (!items || items.length === 0) {
    console.log('[getChecklistItems] Normalized table empty, checking JSONB...')
    
    const { data: task } = await supabase
      .from('tasks')
      .select('checklist')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (task?.checklist && Array.isArray(task.checklist) && task.checklist.length > 0) {
      console.log('[getChecklistItems] Found', task.checklist.length, 'items in JSONB, using as fallback')
      return task.checklist.map((item: any, index: number) => ({
        id: item.id || crypto.randomUUID(),
        task_id: taskId,
        text: item.text || '',
        done: item.done || false,
        order: index
      }))
    }
  }

  console.log('[getChecklistItems] Found', items?.length || 0, 'items from normalized table')
  return items || []
}

/**
 * Add a new checklist item
 * Falls back to JSONB if normalized table doesn't exist
 */
export async function addChecklistItem(taskId: string, text: string): Promise<ChecklistItem | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('[addChecklistItem] User not authenticated')
    throw new Error('User not authenticated')
  }

  console.log('[addChecklistItem] Adding item to task:', taskId)

  // Try normalized table first
  const { data: items, error: checkError } = await supabase
    .from('checklist_items')
    .select('order')
    .eq('task_id', taskId)
    .order('order', { ascending: false })
    .limit(1)

  // If table doesn't exist, fall back to JSONB
  if (checkError && checkError.code === '42P01') {
    console.warn('[addChecklistItem] Normalized table not found, using JSONB fallback')
    
    // Get current task
    const { data: task } = await supabase
      .from('tasks')
      .select('checklist')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (!task) {
      throw new Error('Task not found')
    }

    const newItem = {
      id: crypto.randomUUID(),
      text: text.trim(),
      done: false
    }

    const updatedChecklist = [...(task.checklist || []), newItem]

    await supabase
      .from('tasks')
      .update({ checklist: updatedChecklist, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('user_id', user.id)

    console.log('[addChecklistItem] Added to JSONB')
    return {
      id: newItem.id,
      task_id: taskId,
      text: newItem.text,
      done: newItem.done,
      order: (task.checklist || []).length
    }
  }

  // Use normalized table
  const nextOrder = items && items.length > 0 ? items[0].order + 1 : 0

  const { data, error } = await supabase
    .from('checklist_items')
    .insert({
      task_id: taskId,
      text: text.trim(),
      done: false,
      order: nextOrder
    })
    .select()
    .single()

  if (error) {
    console.error('[addChecklistItem] Supabase error:', error)
    throw new Error(`Failed to add checklist item: ${error.message}`)
  }

  console.log('[addChecklistItem] Successfully added item:', data.id)
  revalidatePath('/app')
  return data
}

/**
 * Toggle a checklist item's done status
 */
export async function toggleChecklistItem(itemId: string, done: boolean): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('[toggleChecklistItem] User not authenticated')
    throw new Error('User not authenticated')
  }

  console.log('[toggleChecklistItem] Toggling item:', itemId, 'to', done)

  const { error } = await supabase
    .from('checklist_items')
    .update({ done, updated_at: new Date().toISOString() })
    .eq('id', itemId)

  if (error) {
    console.error('[toggleChecklistItem] Supabase error:', error)
    throw new Error(`Failed to toggle checklist item: ${error.message}`)
  }

  console.log('[toggleChecklistItem] Successfully toggled item')
  revalidatePath('/app')
}

/**
 * Update checklist item text
 */
export async function updateChecklistItemText(itemId: string, text: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('[updateChecklistItemText] User not authenticated')
    throw new Error('User not authenticated')
  }

  console.log('[updateChecklistItemText] Updating item:', itemId)

  const { error } = await supabase
    .from('checklist_items')
    .update({ text: text.trim(), updated_at: new Date().toISOString() })
    .eq('id', itemId)

  if (error) {
    console.error('[updateChecklistItemText] Supabase error:', error)
    throw new Error(`Failed to update checklist item: ${error.message}`)
  }

  console.log('[updateChecklistItemText] Successfully updated item')
  revalidatePath('/app')
}

/**
 * Delete a checklist item
 */
export async function deleteChecklistItem(itemId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('[deleteChecklistItem] User not authenticated')
    throw new Error('User not authenticated')
  }

  console.log('[deleteChecklistItem] Deleting item:', itemId)

  const { error } = await supabase
    .from('checklist_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('[deleteChecklistItem] Supabase error:', error)
    throw new Error(`Failed to delete checklist item: ${error.message}`)
  }

  console.log('[deleteChecklistItem] Successfully deleted item')
  revalidatePath('/app')
}

/**
 * Reorder checklist items
 */
export async function reorderChecklistItems(taskId: string, orderedIds: string[]): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('[reorderChecklistItems] User not authenticated')
    throw new Error('User not authenticated')
  }

  console.log('[reorderChecklistItems] Reordering items for task:', taskId)

  // Verify user owns the task
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single()

  if (!task) {
    throw new Error('Task not found or unauthorized')
  }

  // Update each item's order
  const updates = orderedIds.map((id, index) => 
    supabase
      .from('checklist_items')
      .update({ order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('task_id', taskId)
  )

  const results = await Promise.allSettled(updates.map(u => u))
  
  const failed = results.filter(r => r.status === 'rejected')
  if (failed.length > 0) {
    console.error('[reorderChecklistItems] Some updates failed:', failed)
    throw new Error('Failed to reorder some items')
  }

  console.log('[reorderChecklistItems] Successfully reordered', orderedIds.length, 'items')
  revalidatePath('/app')
}

