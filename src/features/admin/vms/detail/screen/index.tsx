import React from 'react'
import { TitleSection, OverallSection } from '../components'
import { DetailProvider } from '../context'
import { keepPreviousData, QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { getVMSDetailAPI } from '@/services/routes/VMSService'
import { Skeleton } from 'antd'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'
import { useSearchParams } from 'next/navigation'

const queryClient = new QueryClient()

interface Props {
  id?: string | string[]
}

const VMSDetailScreen: React.FC<Props> = (props) => {
  const { id } = props
  const searchParams = useSearchParams()
  const isWarranty = searchParams.get('is_warranty')
  const isOnline = searchParams.get('is_online')

  const { data, isLoading } = useQuery({
    queryKey: ['vms_detail', id],
    queryFn: () => getVMSDetailAPI(Number(id)!),
    enabled: !!id,
    // placeholderData: keepPreviousData
  })

  if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />

  return (
    <QueryClientProvider client={queryClient}>
      <DetailProvider>
        <div className='main-screen'>
          <TitleSection
            data={data?.data}
            isWarranty={isWarranty === 'true'}
            isOnline={isOnline === 'true'}
          />
          <section className='mt-8'>
            <OverallSection
              data={data?.data}
            />
          </section>
        </div>
        <CCTVModal />
        <ProjectInfoModal />
      </DetailProvider>
    </QueryClientProvider>
  )
}

export default React.memo<Props>(VMSDetailScreen)
