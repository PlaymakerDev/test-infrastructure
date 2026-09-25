"use client"
import { useQuery } from '@tanstack/react-query'

export type UserKind = 'admin' | 'contractor' | 'user'

// Hard fetches aren't basePath-prefixed automatically (mirrors BaseService).
const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? ''

/** Which kind of account is signed in, read from the iron-session cookie via
 *  `/api/auth/session` (resolved once at login from `GET /manage/info` — see
 *  SessionData.user_kind).
 *
 *  Used by the maintenance screens to pick the officer vs contractor view
 *  without a `?role=` query param. Defaults to 'admin' while loading and on
 *  any failure, so a hiccup never hides an officer's own controls. */
export const useUserKind = (): {
  userKind: UserKind
  /** tbl_contractors PK — contractors only. */
  contractorId: string | null
  isLoading: boolean
} => {
  const { data, isLoading } = useQuery({
    queryKey: ['session', 'user-kind'] as const,
    queryFn: async (): Promise<{ kind: UserKind; contractorId: string | null }> => {
      const res = await fetch(`${BASE_PATH}/api/auth/session`, { credentials: 'include' })
      if (!res.ok) return { kind: 'admin', contractorId: null }
      const body = await res.json()
      const kind = body?.user_kind
      return {
        kind: kind === 'contractor' || kind === 'user' ? kind : 'admin',
        contractorId: typeof body?.contractor_id === 'string' ? body.contractor_id : null,
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })
  return { userKind: data?.kind ?? 'admin', contractorId: data?.contractorId ?? null, isLoading }
}
