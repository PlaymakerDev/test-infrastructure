"use client"
import { useSearchParams } from 'next/navigation'
import { setRouterScopeAll } from '@/services/routes/scopeParam'

/**
 * Mirrors the committed URL's `?scope=all` into `scopeParam`'s module state
 * on every render. Mounted as the FIRST child of the admin layout, so within
 * a render pass it runs before any page component — every `scopeKey()` /
 * `centralScope()` call below then sees the scope of the COMMITTED router
 * state, not whatever `window.location` holds mid-transition.
 *
 * Without this, navigating `?dept_id=0` ↔ `?dept_id=0&scope=all` re-rendered
 * the overall pages with the OLD scope in their query keys (window lags the
 * tree by a render during App Router transitions), so TanStack Query never
 * refetched until a hard refresh.
 *
 * The write-during-render is deliberate and safe: it's an idempotent sync of
 * derived state (same input → same value), read only by code running later
 * in the same pass.
 */
const ScopeUrlSync = () => {
  const params = useSearchParams()
  setRouterScopeAll(params.get('scope') === 'all')
  return null
}

export default ScopeUrlSync
