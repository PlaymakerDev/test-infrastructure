import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/defaultSession'
import { cookies } from 'next/headers'

export async function allowAdmin(): Promise<boolean> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  return session.role === 'ADMIN'
}
