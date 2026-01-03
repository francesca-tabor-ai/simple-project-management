import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/checklist-items/[id]
 * Get a single checklist item by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch item and verify ownership through task
    const { data: item, error } = await supabase
      .from('checklist_items')
      .select(`
        *,
        tasks!inner (
          id,
          user_id
        )
      `)
      .eq('id', id)
      .eq('tasks.user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Checklist item not found' },
          { status: 404 }
        )
      }
      console.error('[GET /api/checklist-items/:id] Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: item }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/checklist-items/:id] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/checklist-items/[id]
 * Update a checklist item by ID
 * 
 * Body:
 * {
 *   text?: string
 *   done?: boolean
 *   order?: number
 * }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Verify ownership through task
    const { data: existingItem, error: fetchError } = await supabase
      .from('checklist_items')
      .select(`
        *,
        tasks!inner (
          id,
          user_id
        )
      `)
      .eq('id', id)
      .eq('tasks.user_id', user.id)
      .single()

    if (fetchError || !existingItem) {
      return NextResponse.json(
        { error: 'Checklist item not found' },
        { status: 404 }
      )
    }

    // Prepare updates
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.text !== undefined) {
      if (typeof body.text !== 'string' || body.text.trim() === '') {
        return NextResponse.json(
          { error: 'text cannot be empty' },
          { status: 400 }
        )
      }
      updates.text = body.text.trim()
    }

    if (body.done !== undefined) {
      updates.done = Boolean(body.done)
    }

    if (body.order !== undefined) {
      updates.order = Number(body.order)
    }

    const { data: item, error } = await supabase
      .from('checklist_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[PUT /api/checklist-items/:id] Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: item }, { status: 200 })
  } catch (error) {
    console.error('[PUT /api/checklist-items/:id] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/checklist-items/[id]
 * Delete a checklist item by ID
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify ownership through task
    const { data: existingItem, error: fetchError } = await supabase
      .from('checklist_items')
      .select(`
        id,
        tasks!inner (
          user_id
        )
      `)
      .eq('id', id)
      .eq('tasks.user_id', user.id)
      .single()

    if (fetchError || !existingItem) {
      return NextResponse.json(
        { error: 'Checklist item not found' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DELETE /api/checklist-items/:id] Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Checklist item deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[DELETE /api/checklist-items/:id] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

