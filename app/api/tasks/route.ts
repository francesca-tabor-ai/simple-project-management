import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/tasks
 * List all tasks for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/tasks] Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: tasks }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/tasks] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks
 * Create a new task for the authenticated user
 * 
 * Body:
 * {
 *   title: string (required)
 *   description?: string
 *   status?: 'pending' | 'in_progress' | 'done'
 *   priority?: 'low' | 'medium' | 'high' | 'urgent'
 *   dueDate?: string
 * }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Prepare task data with defaults
    const taskData = {
      user_id: user.id,
      title: body.title.trim(),
      description: body.description || '',
      status: body.status || 'pending',
      priority: body.priority || 'medium',
      dueDate: body.dueDate || null,
      labels: body.labels || [],
      checklist: body.checklist || [],
      attachments: body.attachments || [],
      assignee: body.assignee || null,
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single()

    if (error) {
      console.error('[POST /api/tasks] Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/tasks] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

