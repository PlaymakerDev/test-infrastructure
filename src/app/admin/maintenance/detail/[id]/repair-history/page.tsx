import RepairHistoryScreen from '@/features/admin/maintenance/repair-history/screen'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RepairHistoryPage({ params }: Props) {
  const { id } = await params
  return <RepairHistoryScreen id={id} />
}
