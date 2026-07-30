import React, { useMemo } from 'react'
import { TitleSection, OverallSection } from '../components'
import { DetailProvider } from '../context'
import { useSearchParams } from 'next/navigation'
import {
  useBridgeLightingDetailMap,
  useBridgeLightingWID,
  useBridgeLightingPmChart,
  useBridgeLightingShellyStatus,
} from '../hooks'
import { useScopeAll } from '@/hooks/useScopeAll'
import { ProjectInfoModal } from '@/components/modal'
import { Empty, Skeleton } from 'antd'

interface Props {
  id?: string | string[]
}

const DetailScreen: React.FC<Props> = (props) => {
  const { id } = props
  const searchParams = useSearchParams()
  const deptId = searchParams.get('dept_id')
  const projectId = searchParams.get('project_id')
  const isWarranty = searchParams.get('is_warranty')
  const scope = useScopeAll() ? 'all' : 'own'

  const {
    data: locationData,
    isLoading: isLocationLoading,
    isError: isLocationError,
    isSuccess: isLocationSuccess
  } = useBridgeLightingDetailMap(id, String(deptId ?? ''), scope)

  const {
    data: widData,
    isLoading: isWidLoading,
    isError: isWidError,
    isSuccess: isWidSuccess
  } = useBridgeLightingWID(id, String(deptId ?? ''), scope)

  const {
    data: pmChartData,
    isLoading: isPmChartLoading,
    isError: isPmChartError,
    isSuccess: isPmChartSuccess
  } = useBridgeLightingPmChart(id, String(deptId ?? ''), scope, widData?.data.wid, isWidSuccess)

  const {
    data: shellyStatusData,
    isLoading: isShellyStatusLoading,
    isError: isShellyStatusError,
    isSuccess: isShellyStatusSuccess
  } = useBridgeLightingShellyStatus(id, String(deptId ?? ''), scope, widData?.data.wid, isWidSuccess)

  const renderTitleSection = useMemo(() => {
    if (isLocationLoading) return <Skeleton loading={isLocationLoading} active paragraph={{ rows: 1 }} />
    if (isLocationError) return <Empty description="ไม่พบข้อมูล" />
    return (
      <TitleSection
        data={locationData?.data}
        projectId={projectId}
        isWarranty={isWarranty}
      />
    )
  }, [isLocationLoading, isLocationError, locationData, projectId, isWarranty])

  const renderOverallSection = useMemo(() => {
    if (isLocationLoading || isWidLoading || isPmChartLoading || isShellyStatusLoading) return <Skeleton loading={isLocationLoading || isWidLoading || isPmChartLoading || isShellyStatusLoading} active paragraph={{ rows: 10 }} />
    if (isLocationError || isWidError || isPmChartError || isShellyStatusError) return <Empty description="ไม่พบข้อมูล" />
    return (
      <OverallSection
        locationData={locationData?.data}
        pmChartData={pmChartData?.data}
        widData={widData?.data}
        shellyStatusData={shellyStatusData?.data}
        isLocationSuccess={isLocationSuccess}
        isPmChartSuccess={isPmChartSuccess}
        isShellyStatusSuccess={isShellyStatusSuccess}
      />
    )
  }, [
    isLocationLoading,
    isLocationError,
    isWidLoading,
    isWidError,
    isPmChartLoading,
    isPmChartError,
    locationData,
    pmChartData,
    widData,
    shellyStatusData,
    isLocationSuccess,
    isPmChartSuccess,
    isShellyStatusSuccess,
    isShellyStatusLoading,
    isShellyStatusError
  ])

  return (
    <DetailProvider>
      <div className='main-screen flex flex-col'>
        {renderTitleSection}
        <section className='mt-5'>
          {renderOverallSection}
        </section>
      </div>
      <ProjectInfoModal />
    </DetailProvider>
  )
}

export default React.memo<Props>(DetailScreen)
