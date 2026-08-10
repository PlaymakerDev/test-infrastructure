import { NextResponse, NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/defaultSession'
import { deptQuery } from '@/lib/homeDept'
import menu from './configs/menu'

// `new URL('/foo', request.url)` strips basePath; manually prepend so deploys
// under /atlas keep their prefix. MUST come from the env ('' in dev): a
// hardcoded '/atlas' made dev redirect to /atlas/auth/login, whose pathname
// no longer matches the '/auth/login' guard below → infinite redirect loop
// (ERR_TOO_MANY_REDIRECTS on every page, found 2026-07-20).
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const withBase = (p: string, requestUrl: string) =>
  new URL(`${BASE_PATH}${p}`, requestUrl)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  const session = await getIronSession<SessionData>(request, response, sessionOptions)
  const isAuthenticated = !!session.access_token

  const path = menu[session.role as keyof typeof menu]

  // Landing query for the role's first menu entry — MUST match what the login
  // form builds (`deptQuery(resolveHomeDeptId(...))`), otherwise the two entry
  // paths disagree: a bare `/admin/dashboard` falls back to dept 0 WITHOUT
  // `scope=all`, i.e. ทช.ส่วนกลาง only (1 road / 22 cameras) instead of the
  // user's own scope — and a สทช./ขทช. user lands on the wrong department
  // entirely (bug found 2026-08-10). `home_dept_id` is stamped into the session
  // at login; sessions predating it get the old bare path.
  const landingPath = (p: string) =>
    session.home_dept_id != null ? `${p}?${deptQuery(session.home_dept_id)}` : p

  // Authenticated user on /auth/login → send to their dashboard
  if (isAuthenticated && pathname.startsWith('/auth/login')) {
    if (path && path.length > 0) {
      return NextResponse.redirect(withBase(landingPath(path[0].path), request.url))
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
      return NextResponse.redirect(withBase(landingPath(path[0].path), request.url))
    }
    return NextResponse.redirect(withBase('/', request.url))
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
