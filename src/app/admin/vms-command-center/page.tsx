import { redirect } from 'next/navigation'

// Merged into /admin/control-vms as a tab set. Keep this route as a permanent
// redirect so any bookmarks / old links keep working.
export default function VMSCommandCenterRedirect() {
  redirect('/admin/control-vms')
}
