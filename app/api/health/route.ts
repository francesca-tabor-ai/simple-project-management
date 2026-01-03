import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Health Check Endpoint
 * 
 * GET /api/health
 * 
 * Returns:
 * - 200 OK if service is healthy
 * - Includes database connectivity check
 * - No authentication required (public endpoint)
 */
export async function GET() {
  const startedAt = Date.now()

  // Check database connectivity
  let dbStatus = 'unknown'
  let dbError = null
  
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('tasks')
      .select('id')
      .limit(1)
    
    if (error) {
      dbStatus = 'error'
      dbError = error.message
    } else {
      dbStatus = 'ok'
    }
  } catch (err) {
    dbStatus = 'unavailable'
    dbError = err instanceof Error ? err.message : 'Unknown error'
  }

  const responseTime = Date.now() - startedAt

  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'simple-project-management',
      version: '1.0.0',
      uptime: {
        responseTimeMs: responseTime,
      },
      checks: {
        database: {
          status: dbStatus,
          ...(dbError && { error: dbError }),
        },
      },
    },
    { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  )
}

