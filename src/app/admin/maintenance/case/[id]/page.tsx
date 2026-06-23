export const dynamic = "force-dynamic";
import MaintenanceCaseScreen from '@/features/admin/maintenance/case/screen'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MaintenanceCasePage({ params }: Props) {
  const { id } = await params
  return <MaintenanceCaseScreen id={id} />
}
