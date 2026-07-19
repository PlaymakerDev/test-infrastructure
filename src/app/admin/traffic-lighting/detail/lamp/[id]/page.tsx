import LampDetailScreen from '@/features/admin/traffic-lighting/detail/lamp/screen'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ imei?: string }>
}

export default async function LampDetailPage({ params, searchParams }: Props) {
  const [{ id }, { imei }] = await Promise.all([params, searchParams])
  return <LampDetailScreen id={id} imeiParam={imei} />
}
