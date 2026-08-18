"use client"
import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { setAuthInfoFailed, setAuthInfoState } from '@/stores/reducers/auth/authSlice'
import { getAuthInfoAPI } from '@/services/routes/AdminService'
import { syncAuthTokenToStore } from '@/services/BaseService'

/**
 * Re-hydrates `authSlice` once per hard entry into /admin. A full page reload
 * re-instantiates the Redux store (see StoreProvider) at initialState, losing
 * `auth_token`/`info` even though the session cookie — and its access token —
 * is still perfectly valid server-side (proxy.ts already gated this route on
 * it). Skips the fetch entirely when the slice is already populated, e.g.
 * arriving here via client-side navigation straight from the login screen,
 * which already dispatched both. Renders nothing — mirrors ScopeUrlSync's
 * bootstrap-component pattern.
 */
const AuthHydrator = () => {
  const dispatch = useAppDispatch()
  const hasToken = useAppSelector((state) => !!state.auth.auth_token.access_token)
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current || hasToken) return
    ranRef.current = true

    void (async () => {
      await syncAuthTokenToStore()
      try {
        const info = await getAuthInfoAPI()
        dispatch(setAuthInfoState(info.data))
      } catch {
        // profile info fetch failed — non-fatal, authSlice.info stays at
        // initialState. Still mark resolution done so role-gated UI (useUserRole)
        // renders its fallback instead of spinning forever.
        dispatch(setAuthInfoFailed())
      }
    })()
  }, [dispatch, hasToken])

  return null
}

export default AuthHydrator
