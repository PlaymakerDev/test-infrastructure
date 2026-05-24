import { NextResponse, NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/defaultSession'
import menu from './configs/menu'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  const session = await getIronSession<SessionData>(request, response, sessionOptions)
  const isAuthenticated = !!session.access_token

  const menuItems = menu[session.role as keyof typeof menu]

  // Authenticated user on /auth/login → send to dashboard
  if (isAuthenticated && pathname.startsWith('/auth/login')) {
    const firstPath = menuItems?.[0]?.path ?? '/admin/dashboard'
    return NextResponse.redirect(new URL(firstPath, request.url))
  }

  // Unauthenticated user on a protected route (not /auth/login) → send to login
  if (!isAuthenticated && !pathname.startsWith('/auth/login')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  // Run on everything except static assets and api routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}