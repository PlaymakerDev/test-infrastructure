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
    // LOGIN
    if (all.includes('login')) {
      const parsed = loginSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
      }
      const response = await axios.post(`${process.env.NEXT_PUBLIC_HOST_BACKEND}/auth/login`, parsed.data, {
        headers: { ["x-api-key"]: process.env.NEXT_PUBLIC_API_KEY || '' }
      })
      if (response.status === 200) {
        session.access_token = response.data.access_token;
        session.refresh_token = response.data.refresh_token;
        session.role = "ADMIN"; // Set role based on your application's logic
        await session.save();
      }
      return NextResponse.json({ message: 'success' }, { status: 200 })
    }
    // LOGOUT
    if (all.includes('logout')) {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_HOST_BACKEND}/auth/logout`, {}, {
        headers: {
          ["x-api-key"]: process.env.NEXT_PUBLIC_API_KEY || '',
          "Authorization": `Bearer ${session.access_token}`
        }
      })
      if (response.status === 200) {
        session.destroy()
      }
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
        session.access_token = response.data.access_token;
        session.refresh_token = response.data.refresh_token;
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