import React, { useMemo } from 'react'
import FormSearchRoute from './FormSearchRoute'
import { RoadList } from '@/components/list'
import { useGPSContext } from '../../../context'
import { Empty, Skeleton } from 'antd'
import { AllVehicleLocationData } from '@/types/tracking/detail-gps-api'
interface Props {
  openFromDrawer?: boolean
  data?: AllVehicleLocationData
  isLoading?: boolean
  isError?: boolean
  onSearch?: (search: string) => void
}

const SearchRouteSection: React.FC<Props> = (props) => {
  const { openFromDrawer, data, isLoading, isError, onSearch } = props
  const { setSelectRoute } = useGPSContext()

  const renderRoadList = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 5 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return (
      <RoadList
        data={data?.list || []}
        onSelect={(item) => setSelectRoute(item)}
      />
    )
  }, [isLoading, isError, setSelectRoute, data?.list])

  return (
    <div className={`bg-(--dark-black) rounded-tr-lg ${openFromDrawer ? 'p-5' : 'py-10 px-12'} h-full`}>
      <section>
        <FormSearchRoute onSearch={onSearch} />
      </section>
      <section className='mt-5'>
        {renderRoadList}
      </section>
    </div>
  )
}

export default React.memo<Props>(SearchRouteSection)
