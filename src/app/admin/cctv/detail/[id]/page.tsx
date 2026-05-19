import CctvDetailScreen from "@/features/admin/cctv/detail/screen"

interface Props {
  params: Promise<{ id: string }>
}

export default async function CctvDetailPage({ params }: Props) {
  const { id } = await params
  return <CctvDetailScreen id={id} />
}
