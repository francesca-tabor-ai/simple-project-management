import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isAppPage = request.nextUrl.pathname.startsWith('/app')
  const isRootPage = request.nextUrl.pathname === '/'

  // If user is logged in and trying to access auth pages, redirect to /app
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  // If user is logged in and on root, redirect to /app
  if (user && isRootPage) {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  // If user is NOT logged in and trying to access app pages or root, redirect to login
  if (!user && (isAppPage || isRootPage)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

