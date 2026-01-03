'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type Task, type Label } from '@/lib/task-types'

export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log('[getTasks] No authenticated user')
    return []
  }

  // Fetch tasks with normalized labels
  const { data: tasksData, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (tasksError) {
    console.error('[getTasks] Supabase error:', tasksError)
    return []
  }

  if (!tasksData || tasksData.length === 0) {
    console.log('[getTasks] No tasks found')
    return []
  }

  // Fetch labels for all tasks
  const taskIds = tasksData.map(t => t.id)
  const { data: taskLabelsData, error: labelsError } = await supabase
    .from('task_labels')
    .select(`
      task_id,
      labels (
        id,
        name,
        color
      )
    `)
    .in('task_id', taskIds)

  if (labelsError) {
    console.warn('[getTasks] Error fetching labels, falling back to JSONB:', labelsError)
    // Fallback: use JSONB labels column
    console.log('[getTasks] Fetched', tasksData.length, 'tasks (with JSONB labels)')
    return tasksData as Task[]
  }

  // Build a map of taskId -> labels[]
  const labelsByTaskId: Record<string, Label[]> = {}
  if (taskLabelsData) {
    for (const tl of taskLabelsData) {
      if (!tl.labels) continue
      const label = tl.labels as unknown as Label
      if (!labelsByTaskId[tl.task_id]) {
        labelsByTaskId[tl.task_id] = []
      }
      labelsByTaskId[tl.task_id].push(label)
    }
  }

  // Merge labels into tasks, fallback to JSONB if no normalized labels
  const tasks: Task[] = tasksData.map(task => {
    const normalizedLabels = labelsByTaskId[task.id] || []
    const jsonbLabels = (task.labels || []) as Label[]
    
    return {
      ...task,
      // Use normalized labels if available, otherwise fallback to JSONB
      labels: normalizedLabels.length > 0 ? normalizedLabels : jsonbLabels,
    } as Task
  })

  console.log('[getTasks] Fetched', tasks.length, 'tasks with normalized labels')
  return tasks
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
    console.error('[updateTask] User not authenticated')
    throw new Error('User not authenticated')
  }

  console.log('[updateTask] Updating task:', taskId, 'with fields:', Object.keys(updates))

  const { error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .eq('user_id', user.id) // Ensures user can only update their own tasks

  if (error) {
    console.error('[updateTask] Supabase error:', {
      taskId,
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      updates: Object.keys(updates)
    })
    throw new Error(`Failed to update task: ${error.message}`)
  }

  console.log('[updateTask] Successfully updated task:', taskId)
  revalidatePath('/app')
}

