import MaintenanceDetailScreen from '@/features/admin/maintenance/detail/screen'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MaintenanceDetailPage({ params }: Props) {
  const { id } = await params
  return <MaintenanceDetailScreen id={id} />
}
