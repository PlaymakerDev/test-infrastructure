import { SessionData, sessionOptions } from "@/lib/defaultSession";
import axios from "axios";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, 'username is required'),
  password: z.string().min(1, 'password is required'),
});

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
        expires_at: session.expires_at ?? 0,
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
        session.refresh_at = now + 12 * 60 * 1000
        session.expires_at = now + 30 * 24 * 60 * 60 * 1000
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
    // REFRESH — uses server-side session.refresh_token; never reads from client body
    if (all.includes('refresh')) {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_HOST_BACKEND}/auth/refresh`,
        { refresh_token: session.refresh_token },
        {
          headers: {
            ["x-api-key"]: process.env.NEXT_PUBLIC_API_KEY || '',
            "Authorization": `Bearer ${session.access_token}`
          }
        }
      )
      if (response.status === 200) {
        const now = Date.now()
        session.access_token = response.data.access_token;
        session.refresh_token = response.data.refresh_token;
        session.refresh_at = now + 12 * 60 * 1000;          // now + 12 min
        session.expires_at = now + 30 * 24 * 60 * 60 * 1000; // now + 30 days
        await session.save();
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