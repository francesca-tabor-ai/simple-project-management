'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type Task, type Label } from '@/lib/task-types'

export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }

  return data || []
}

export async function createTask(title: string): Promise<Task> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Create task with sensible defaults and return the created task
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title,
      status: 'pending',
      user_id: user.id,
      description: '',
      dueDate: null,
      priority: 'medium',
      labels: [],
      assignee: null,
      checklist: [],
      attachments: [],
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating task:', error)
    throw new Error(`Failed to create task: ${error.message}`)
  }

  if (!data) {
    throw new Error('Task was created but not returned')
  }

  revalidatePath('/app')
  return data as Task
}

export async function updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'done') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('tasks')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .eq('user_id', user.id) // Ensures user can only update their own tasks

  if (error) {
    console.error('Error updating task:', error)
    throw new Error(`Failed to update task: ${error.message}`)
  }

  revalidatePath('/app')
}

// Helper function to update task status (wrapper for consistency)
export async function setTaskStatus(taskId: string, status: Task['status']) {
  return updateTaskStatus(taskId, status)
}

// Bulk operations
export async function bulkMoveStatus(taskIds: string[], status: Task['status']) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('tasks')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .in('id', taskIds)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error bulk updating status:', error)
    throw new Error(`Failed to update tasks: ${error.message}`)
  }

  revalidatePath('/app')
}

export async function bulkAddLabel(taskIds: string[], label: Label, existingTasks: Task[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const trimmedLabelName = label.name.trim()
  if (!trimmedLabelName) {
    throw new Error('Label cannot be empty')
  }

  // For each task, add the label if not already present (case-insensitive check)
  for (const taskId of taskIds) {
    const task = existingTasks.find(t => t.id === taskId)
    if (!task) continue

    const hasLabel = task.labels.some(l => l.name.toLowerCase() === trimmedLabelName.toLowerCase())
    if (!hasLabel) {
      const newLabels = [...task.labels, label]
      const { error } = await supabase
        .from('tasks')
        .update({ 
          labels: newLabels,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error adding label to task:', error)
      }
    }
  }

  revalidatePath('/app')
}

export async function bulkRemoveLabel(taskIds: string[], labelName: string, existingTasks: Task[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // For each task, remove the label (case-insensitive match)
  for (const taskId of taskIds) {
    const task = existingTasks.find(t => t.id === taskId)
    if (!task) continue

    const newLabels = task.labels.filter(l => l.name.toLowerCase() !== labelName.toLowerCase())
    if (newLabels.length !== task.labels.length) {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          labels: newLabels,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error removing label from task:', error)
      }
    }
  }

  revalidatePath('/app')
}

export async function bulkDeleteTasks(taskIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .in('id', taskIds)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error bulk deleting tasks:', error)
    throw new Error(`Failed to delete tasks: ${error.message}`)
  }

  revalidatePath('/app')
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id) // Ensures user can only delete their own tasks

  if (error) {
    console.error('Error deleting task:', error)
    throw new Error(`Failed to delete task: ${error.message}`)
  }

  revalidatePath('/app')
}

// Generic task update function for partial updates
export async function updateTask(taskId: string, updates: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .eq('user_id', user.id) // Ensures user can only update their own tasks

  if (error) {
    console.error('Error updating task:', error)
    throw new Error(`Failed to update task: ${error.message}`)
  }

  revalidatePath('/app')
}

