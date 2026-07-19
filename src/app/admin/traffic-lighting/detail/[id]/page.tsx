import TrafficLightingDetailScreen from '@/features/admin/traffic-lighting/detail/screen'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ imei?: string; type?: string }>
}

export default async function TrafficLightingDetailPage({ params, searchParams }: Props) {
  const [{ id }, { imei, type }] = await Promise.all([params, searchParams])
  return <TrafficLightingDetailScreen id={id} imeiParam={imei} typeParam={type} />
}
