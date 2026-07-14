import type { ReactNode } from 'react'
import AdminLayoutClient from './AdminLayoutClient'

// Admin routes are session-gated live dashboards — components all over the
// tree read the URL (dept_id / scope=all) via useSearchParams, so static
// prerender is pointless AND fails the build ("useSearchParams() should be
// wrapped in a suspense boundary" — this exact error killed the 2026-07-14
// production deploy at /admin/control-vms; dev builds never reached that
// stage because the type-check gate stops first). force-dynamic renders the
// whole /admin segment per-request and lifts the build-time requirement.
// NOTE: segment config must live in a SERVER file, hence this thin wrapper
// around the "use client" layout body.
export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
