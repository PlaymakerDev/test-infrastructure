import { SessionData, sessionOptions } from "@/lib/defaultSession";
import { resolveHomeDeptId } from "@/lib/homeDept";
import type { APIResponseDepartment } from "@/types/manage/department-api";
import axios from "axios";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, 'username is required'),
  password: z.string().min(1, 'password is required'),
});

// Refresh this long before the access token's own `exp`. Deriving refresh_at
// from the JWT auto-tracks the backend TTL (no manual sync with JWT_EXPIRATION).
const REFRESH_LEAD_MS = 3 * 60 * 1000;

/** Resolve the user's landing department from the token-scoped department list,
 *  reusing the SAME `resolveHomeDeptId` rule the login screen and navbar use.
 *  Non-fatal: on any failure we return `undefined` and the session simply
 *  carries no `home_dept_id` — `proxy.ts` then falls back to a bare path, i.e.
 *  the pre-2026-08-10 behaviour, instead of blocking the login. */
async function fetchHomeDeptId(accessToken: string): Promise<number | undefined> {
  try {
    const { data } = await axios.get<APIResponseDepartment[]>(
      `${process.env.NEXT_PUBLIC_HOST_BACKEND}/manage/departments`,
      {
        headers: {
          ['x-api-key']: process.env.NEXT_PUBLIC_API_KEY || '',
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 8000,
      },
    )
    return resolveHomeDeptId(data)
  } catch {
    return undefined
  }
}

// Read `exp` (unix seconds) from the JWT payload — no signature check needed, the
// token is issued by our backend. Returns exp − lead, clamped so it's never in
// the past; falls back to a fixed lead if the token can't be parsed.
function computeRefreshAt(accessToken: string, now: number): number {
  try {
    const exp = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64url").toString(),
    ).exp;
    if (typeof exp === "number") return Math.max(now + 30_000, exp * 1000 - REFRESH_LEAD_MS);
  } catch {
    // unreadable token — use the fallback below
  }
  return now + 12 * 60 * 1000;
}

// GET /api/auth/session — used by BaseService client-side to retrieve token
export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) => {
  try {
    const { all } = await params
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    if (all.includes('session')) {
      return NextResponse.json({
        access_token: session.access_token ?? null,
        refresh_at: session.refresh_at ?? 0,
      }, { status: 200 })
    }

    return NextResponse.json({ message: 'Bad request' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error', data: error }, { status: 500 })
  }
}

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) => {
  try {
    const body = await request.json()
    const { all } = await params
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    // LOGIN — always via /api-v2/auth/login. The backend inspects the local
    // user record: if is_ldap=true it delegates password verification to the
    // upstream SSO endpoint, otherwise bcrypt-compares locally. Either way we
    // get back a single api-v2-shaped JWT that works for subsequent /manage/*
    // calls, so no client-side fallback is needed.
    if (all.includes('login')) {
      const parsed = loginSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
      }
      const now = Date.now()
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_HOST_BACKEND}/auth/login`,
        parsed.data,
        { headers: { ['x-api-key']: process.env.NEXT_PUBLIC_API_KEY || '' } },
      )
      if (response.status === 200 && response.data?.access_token) {
        session.access_token = response.data.access_token
        session.refresh_token = response.data.refresh_token
        session.role = 'ADMIN'
        session.refresh_at = computeRefreshAt(response.data.access_token, now)
        // Landing department — resolved server-side with the fresh token so
        // EVERY entry path lands on the same scope (login form, and
        // proxy.ts's already-logged-in redirect). See SessionData.home_dept_id.
        session.home_dept_id = await fetchHomeDeptId(response.data.access_token)
        await session.save()
        return NextResponse.json({ message: 'success' }, { status: 200 })
      }
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 })
    }
    // LOGOUT — always destroy session even if backend rejects the token
    if (all.includes('logout')) {
      try {
        await axios.post(`${process.env.NEXT_PUBLIC_HOST_BACKEND}/auth/logout`, {}, {
          headers: {
            ["x-api-key"]: process.env.NEXT_PUBLIC_API_KEY || '',
            "Authorization": `Bearer ${session.access_token}`
          }
        })
      } catch {
        // backend rejected the token (already invalid/expired) — still clear the session
      }
      await session.destroy()
      return NextResponse.json({ message: 'success' }, { status: 200 })
    }
    // REFRESH — uses server-side session.refresh_token; never reads from client body.
    // Deploy/rotation-race safety: the backend rotates the refresh_token on every
    // use, so two parallel refresh calls with the same cookie make the second one
    // 40100. On that failure we re-read the cookie ONCE (a concurrent Next.js
    // handler may have just persisted a new one via session.save()) and retry
    // with the fresh refresh_token before giving up. Only if THAT also fails do
    // we surface the 40100 to the client (which then decides whether to logout).
    if (all.includes('refresh')) {
      const doRefresh = async (rt: string, at: string) =>
        axios.post(
          `${process.env.NEXT_PUBLIC_HOST_BACKEND}/auth/refresh`,
          { refresh_token: rt },
          {
            headers: {
              ['x-api-key']: process.env.NEXT_PUBLIC_API_KEY || '',
              Authorization: `Bearer ${at}`,
            },
          },
        )

      let response
      try {
        response = await doRefresh(session.refresh_token, session.access_token)
      } catch (err) {
        const resCode =
          axios.isAxiosError(err) && (err.response?.data as { res_code?: number } | undefined)?.res_code
        if (resCode === 40100) {
          // Small yield: give any concurrent handler that already rotated the
          // token a moment to finish persisting its session.save() before we
          // re-read the cookie. 100 ms is plenty; the actual write is
          // microseconds — this just avoids racing our own event loop.
          await new Promise((r) => setTimeout(r, 100))
          const fresh = await getIronSession<SessionData>(await cookies(), sessionOptions)
          if (fresh.refresh_token && fresh.refresh_token !== session.refresh_token) {
            response = await doRefresh(fresh.refresh_token, fresh.access_token)
            session.access_token = fresh.access_token
            session.refresh_token = fresh.refresh_token
            session.refresh_at = fresh.refresh_at
          } else {
            throw err
          }
        } else {
          throw err
        }
      }

      if (response.status === 200) {
        const now = Date.now()
        session.access_token = response.data.access_token
        session.refresh_token = response.data.refresh_token
        session.refresh_at = computeRefreshAt(response.data.access_token, now)
        await session.save()
      }
      return NextResponse.json({ message: 'success' }, { status: 200 })
    }
    return NextResponse.json({ message: 'Bad request' }, { status: 400 })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 500
      const data = error.response?.data ?? { message: 'Internal server error' }
      return NextResponse.json(data, { status })
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}