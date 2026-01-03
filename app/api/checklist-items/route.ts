import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/checklist-items?taskId=xxx
 * List all checklist items for a specific task
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify the task belongs to the user
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Fetch checklist items
    const { data: items, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('task_id', taskId)
      .order('order', { ascending: true })

    if (error) {
      console.error('[GET /api/checklist-items] Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: items }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/checklist-items] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/checklist-items
 * Create a new checklist item
 * 
 * Body:
 * {
 *   task_id: string (required)
 *   text: string (required)
 *   done?: boolean
 *   order?: number
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
    if (!body.task_id || typeof body.task_id !== 'string') {
      return NextResponse.json(
        { error: 'task_id is required' },
        { status: 400 }
      )
    }

    if (!body.text || typeof body.text !== 'string' || body.text.trim() === '') {
      return NextResponse.json(
        { error: 'text is required' },
        { status: 400 }
      )
    }

    // Verify the task belongs to the user
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', body.task_id)
      .eq('user_id', user.id)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // If order not provided, calculate next order
    let order = body.order
    if (order === undefined) {
      const { data: existingItems } = await supabase
        .from('checklist_items')
        .select('order')
        .eq('task_id', body.task_id)
        .order('order', { ascending: false })
        .limit(1)

      order = existingItems && existingItems.length > 0 
        ? existingItems[0].order + 1 
        : 0
    }

    // Prepare checklist item data
    const itemData = {
      task_id: body.task_id,
      text: body.text.trim(),
      done: body.done || false,
      order: order,
    }

    const { data: item, error } = await supabase
      .from('checklist_items')
      .insert(itemData)
      .select()
      .single()

    if (error) {
      console.error('[POST /api/checklist-items] Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: item }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/checklist-items] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

