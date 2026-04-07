import { NextResponse, NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/defaultSession'
import menu from './configs/menu'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  const session = await getIronSession<SessionData>(request, response, sessionOptions)
  const isAuthenticated = !!session.access_token

  const path = menu[session.role as keyof typeof menu]

  // Authenticated user on /login → send to dashboard
  if (isAuthenticated && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL(path[0].path, request.url))
  }

  // Unauthenticated user on a protected route (not /login) → send to login
  if (!isAuthenticated && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  // Run on everything except static assets and api routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}