import { NextResponse, NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/defaultSession'
import menu from './configs/menu'

// `new URL('/foo', request.url)` strips basePath; manually prepend so deploys under /atlas keep their prefix.
const BASE_PATH = '/atlas'
const withBase = (p: string, requestUrl: string) =>
  new URL(`${BASE_PATH}${p}`, requestUrl)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  const session = await getIronSession<SessionData>(request, response, sessionOptions)
  const isAuthenticated = !!session.access_token

  const path = menu[session.role as keyof typeof menu]

  // Authenticated user on /auth/login → send to their dashboard
  if (isAuthenticated && pathname.startsWith('/auth/login')) {
    if (path && path.length > 0) {
      return NextResponse.redirect(withBase(path[0].path, request.url))
    }
    return NextResponse.redirect(withBase('/', request.url))
  }

  // Unauthenticated user on a protected route → send to login
  if (!isAuthenticated && !pathname.startsWith('/auth/login')) {
    return NextResponse.redirect(withBase('/auth/login', request.url))
  }

  // Authenticated but wrong role trying to access /admin/* → send to their own landing
  if (isAuthenticated && pathname.startsWith('/admin') && session.role !== 'ADMIN') {
    if (path && path.length > 0) {
      return NextResponse.redirect(new URL(path[0].path, request.url))
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  // Run on everything except API routes, Next internals, and static public
  // assets. The trailing extension guard is essential: without it, requests for
  // files in `public/` (e.g. /images/login/login-hero.png) hit this middleware
  // while unauthenticated and get redirected to /auth/login — which breaks the
  // login page's own background image (you're not logged in *on* the login page).
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff2?|ttf)).*)',
  ],
}
