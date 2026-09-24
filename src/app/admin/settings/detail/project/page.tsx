import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ id?: string | string[] }>
}

/** Legacy `?id=` address of the project page. The live page is
 *  /admin/settings/detail/project/[id] (new-detail, 2026-09-23 road-level CCTV
 *  redesign); the old screen can no longer show CCTV, since the backend stopped
 *  listing it per install point. Every in-app link now uses the new route —
 *  this only catches bookmarks and browser history. */
export default async function SettingProjectDetailLegacyPage({ searchParams }: Props) {
  const { id } = await searchParams
  const projectId = Array.isArray(id) ? id[0] : id
  redirect(projectId ? `/admin/settings/detail/project/${encodeURIComponent(projectId)}` : '/admin/settings')
}
