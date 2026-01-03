'use server'

import { createClient } from '@/lib/supabase/server'
import { type Label } from '@/lib/task-types'

/**
 * Add a label to a task (creates label if doesn't exist, links to task)
 */
export async function addLabelToTask(taskId: string, labelName: string, labelColor: string): Promise<Label> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  console.log(`[addLabelToTask] Adding label "${labelName}" to task ${taskId}`)

  // 1. Check if normalized tables exist
  const { data: tableCheck, error: tableError } = await supabase
    .from('labels')
    .select('id')
    .limit(1)

  // If tables don't exist, fall back to JSONB update
  if (tableError && tableError.code === '42P01') {
    console.warn('[addLabelToTask] Normalized tables not found, falling back to JSONB')
    return await addLabelToTaskJSONB(taskId, labelName, labelColor, user.id)
  }

  // 2. Insert or get existing label
  const { data: existingLabel, error: findError } = await supabase
    .from('labels')
    .select('*')
    .eq('user_id', user.id)
    .eq('name', labelName)
    .maybeSingle()

  let labelId: string

  if (existingLabel) {
    labelId = existingLabel.id
    console.log(`[addLabelToTask] Label "${labelName}" already exists with id ${labelId}`)
  } else {
    // Create new label
    const { data: newLabel, error: createError } = await supabase
      .from('labels')
      .insert({
        user_id: user.id,
        name: labelName,
        color: labelColor,
      })
      .select()
      .single()

    if (createError) {
      console.error('[addLabelToTask] Error creating label:', createError)
      throw new Error(`Failed to create label: ${createError.message}`)
    }

    labelId = newLabel.id
    console.log(`[addLabelToTask] Created new label "${labelName}" with id ${labelId}`)
  }

  // 3. Link label to task (if not already linked)
  const { error: linkError } = await supabase
    .from('task_labels')
    .insert({
      task_id: taskId,
      label_id: labelId,
    })

  if (linkError) {
    // Ignore duplicate key errors (already linked)
    if (linkError.code !== '23505') {
      console.error('[addLabelToTask] Error linking label to task:', linkError)
      throw new Error(`Failed to link label to task: ${linkError.message}`)
    }
    console.log(`[addLabelToTask] Label already linked to task`)
  } else {
    console.log(`[addLabelToTask] Successfully linked label to task`)
  }

  // 4. Return the label
  const label: Label = existingLabel || {
    id: labelId,
    name: labelName,
    color: labelColor,
  }

  return label
}

/**
 * Remove a label from a task
 */
export async function removeLabelFromTask(taskId: string, labelId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  console.log(`[removeLabelFromTask] Removing label ${labelId} from task ${taskId}`)

  // Check if normalized tables exist
  const { error: tableError } = await supabase
    .from('task_labels')
    .select('task_id')
    .limit(1)

  if (tableError && tableError.code === '42P01') {
    console.warn('[removeLabelFromTask] Normalized tables not found, falling back to JSONB')
    return await removeLabelFromTaskJSONB(taskId, labelId, user.id)
  }

  // Delete the task-label link
  const { error } = await supabase
    .from('task_labels')
    .delete()
    .eq('task_id', taskId)
    .eq('label_id', labelId)

  if (error) {
    console.error('[removeLabelFromTask] Error removing label:', error)
    throw new Error(`Failed to remove label: ${error.message}`)
  }

  console.log(`[removeLabelFromTask] Successfully removed label from task`)
}

/**
 * Update label color
 */
export async function updateLabelColor(labelId: string, color: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  console.log(`[updateLabelColor] Updating label ${labelId} to color ${color}`)

  const { error } = await supabase
    .from('labels')
    .update({ color, updated_at: new Date().toISOString() })
    .eq('id', labelId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[updateLabelColor] Error updating label color:', error)
    throw new Error(`Failed to update label color: ${error.message}`)
  }

  console.log(`[updateLabelColor] Successfully updated label color`)
}

// ============================================================================
// JSONB Fallback Functions
// ============================================================================

/**
 * Fallback: Add label using JSONB column
 */
async function addLabelToTaskJSONB(
  taskId: string,
  labelName: string,
  labelColor: string,
  userId: string
): Promise<Label> {
  const supabase = await createClient()

  // Get current task
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('labels')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch task: ${fetchError.message}`)
  }

  const currentLabels = (task.labels || []) as Label[]
  
  // Check if label already exists
  const existingLabel = currentLabels.find(l => l.name === labelName)
  if (existingLabel) {
    return existingLabel
  }

  // Add new label
  const newLabel: Label = {
    id: crypto.randomUUID(),
    name: labelName,
    color: labelColor,
  }

  const { error: updateError } = await supabase
    .from('tasks')
    .update({
      labels: [...currentLabels, newLabel],
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('user_id', userId)

  if (updateError) {
    throw new Error(`Failed to update task labels: ${updateError.message}`)
  }

  return newLabel
}

/**
 * Fallback: Remove label using JSONB column
 */
async function removeLabelFromTaskJSONB(
  taskId: string,
  labelId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient()

  // Get current task
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('labels')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch task: ${fetchError.message}`)
  }

  const currentLabels = (task.labels || []) as Label[]
  const updatedLabels = currentLabels.filter(l => l.id !== labelId)

  const { error: updateError } = await supabase
    .from('tasks')
    .update({
      labels: updatedLabels,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('user_id', userId)

  if (updateError) {
    throw new Error(`Failed to update task labels: ${updateError.message}`)
  }
}

