import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { getVMSOverviewRandomOnlineAPI } from '@/services/routes/VMSService'
// import { useAppSelector } from '@/stores/hooks'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Skeleton } from 'antd'
import React, { useMemo } from 'react'

interface Props {
  deptId?: string | string[] | number
}

const CCTVSection: React.FC<Props> = (props) => {
  const { deptId } = props
  // const { vms_random_online } = useAppSelector(state => state.vms_overview)

  const { data, isLoading } = useQuery({
    queryKey: ['random_cctv'],
    queryFn: () => getVMSOverviewRandomOnlineAPI(Number(deptId)!, { limit: 3 }),
    enabled: !!deptId,
    placeholderData: keepPreviousData
  })

  const renderCameraList = useMemo(() => {
    if (isLoading) {
      // return <Skeleton loading={isLoading} active paragraph={{ rows: 3 }} />
      return Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className='bg-(--mid-gray) p-3 rounded-lg flex-1 min-h-0 flex flex-col'
        >
          <Skeleton loading={isLoading} active paragraph={{ rows: 3 }} />
        </div>
      ))
    }

    return data?.data.map((item) => (
      <div
        key={item.solution.id}
        className='bg-(--mid-gray) p-3 rounded-lg flex-1 min-h-0 flex flex-col'
      >
        <HLSLivePlayer
          figureClassName='flex-1 min-h-0 mb-1.5 rounded-lg'
          hlsUrl={item.vms.hls_url}
        />
        <h4 className='camera-code'>{item.solution.solution_name}</h4>
        <p className='camera-location'>เชื่อมต่อล่าสุด :{item.vms.last_connected}</p>
      </div>
    ))
  }, [data?.data, isLoading])

  return (
    <div className='h-full flex flex-col gap-4'>
      {renderCameraList}
    </div>
  )
}

export default React.memo<Props>(CCTVSection)
