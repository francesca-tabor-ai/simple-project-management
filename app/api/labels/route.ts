import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/labels
 * List all labels for the authenticated user
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

    const { data: labels, error } = await supabase
      .from('labels')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (error) {
      console.error('[GET /api/labels] Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: labels }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/labels] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/labels
 * Create a new label for the authenticated user
 * 
 * Body:
 * {
 *   name: string (required)
 *   color: string (required, hex color)
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
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Label name is required' },
        { status: 400 }
      )
    }

    if (!body.color || typeof body.color !== 'string') {
      return NextResponse.json(
        { error: 'Label color is required' },
        { status: 400 }
      )
    }

    // Prepare label data
    const labelData = {
      user_id: user.id,
      name: body.name.trim(),
      color: body.color,
    }

    const { data: label, error } = await supabase
      .from('labels')
      .insert(labelData)
      .select()
      .single()

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A label with this name already exists' },
          { status: 409 }
        )
      }
      console.error('[POST /api/labels] Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: label }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/labels] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

