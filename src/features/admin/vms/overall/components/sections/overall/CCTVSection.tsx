import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { getVMSOverviewRandomOnlineAPI } from '@/services/routes/VMSService'
import { scopeKey } from '@/services/routes/scopeParam'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Skeleton } from 'antd'
import React, { useMemo } from 'react'

interface Props {
  deptId?: string | string[] | number
}

const CCTVSection: React.FC<Props> = (props) => {
  const { deptId } = props
  const dispatch = useAppDispatch()

  const { data, isLoading } = useQuery({
    // dept + scope in the key — same dept/scope must not share cache entries
    // (key previously had neither, so switching departments reused stale data).
    queryKey: ['random_cctv', String(deptId ?? ''), scopeKey()],
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
          className='bg-(--mid-gray) p-3 rounded-2xl flex-1 min-h-0 flex flex-col'
        >
          <Skeleton loading={isLoading} active paragraph={{ rows: 3 }} />
        </div>
      ))
    }

    return data?.data.map((item, idx) => (
      <div
        key={item.vms.camera?.id ?? idx}
        className='bg-(--mid-gray) p-3 rounded-2xl flex-1 min-h-0 flex flex-col'
      >
        <HLSLivePlayer
          figureClassName='flex-1 min-h-0 mb-1.5 rounded-2xl cursor-pointer'
          hlsUrl={item.vms.hls_url}
          onClick={() => dispatch(setCCTVModalOpen({ open: true, camera_id: item.vms.camera?.id }))}
        />
        <h4 className='camera-code'>{item.vms.camera?.camera_name || '-'}</h4>
        <p className='camera-location'>IP Address : {item.vms.camera?.ip_address || '-'}</p>
      </div>
    ))
  }, [data?.data, isLoading, dispatch])

  return (
    <div className='h-full flex flex-col gap-4'>
      {renderCameraList}
    </div>
  )
}

export default React.memo<Props>(CCTVSection)
