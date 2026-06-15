import CctvDetailScreen from "@/features/admin/cctv/detail/screen"

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ dept_id?: string }>
}

export default async function CctvDetailPage({ params, searchParams }: Props) {
  const [{ id }, { dept_id = '' }] = await Promise.all([params, searchParams])
  return <CctvDetailScreen id={id} deptId={dept_id} />
}
