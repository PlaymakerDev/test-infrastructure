import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { getVMSOverviewRandomOnlineAPI } from '@/services/routes/VMSService'
import { useScopeAll } from '@/hooks/useScopeAll'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Skeleton, Tooltip } from 'antd'
import React, { useMemo } from 'react'
import { useOverallContext } from '../../../context'

interface Props {
  deptId?: string | string[] | number
  roadId?: string | string[] | number
}

const CCTVSection: React.FC<Props> = (props) => {
  const { deptId, roadId } = props
  // Reactive ?scope=all — subscribes this memo'd component to the URL so the
  // query key re-derives when scope toggles (render-time window reads go
  // stale during App Router transitions).
  const scope = useScopeAll() ? 'all' : 'own'
  const dispatch = useAppDispatch()
  const { setOpenVMSScreen } = useOverallContext()

  const { data, isLoading } = useQuery({
    // dept + scope + road in the key — same dept/scope/road must not share
    // cache entries (key previously had no road_id, so switching roads
    // reused the other road's stale cameras).
    queryKey: ['random_cctv', String(deptId ?? ''), scope, String(roadId ?? '')],
    queryFn: () => getVMSOverviewRandomOnlineAPI(Number(deptId)!, roadId ? { road_id: roadId, limit: 3 } : { limit: 3 }),
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

    return data?.data.map((item, idx) => (
      <div
        key={item.vms.camera?.id ?? idx}
        className='bg-(--mid-gray) p-3 rounded-lg flex-1 min-h-0 flex flex-col'
      >
        <HLSLivePlayer
          figureClassName='flex-1 min-h-0 mb-1.5 rounded-lg cursor-pointer'
          hlsUrl={item.vms.hls_url ? item.vms.hls_url : item.vms.desktop_screen}
          onClick={() => {
            if (item.vms.camera?.hls_url) {
              dispatch(setCCTVModalOpen({ open: true, camera_id: item.vms.camera?.id }))
            } else {
              setOpenVMSScreen({ open: true, data: { solution_id: item.solution.id, desktop_screen: item.vms.desktop_screen } })
            }
          }}
        />
        {item.vms.hls_url ?
          <>
            <Tooltip title={item.vms.camera?.camera_name || '-'}>
              <h4 className='camera-code truncate'>{item.vms.camera?.camera_name || '-'}</h4>
            </Tooltip>
            <p className='camera-location'>IP Address : {item.vms.camera?.ip_address || '-'}</p>
          </>
          :
          <>
            <Tooltip title={item.solution.solution_name || '-'}>
              <h4 className='camera-code truncate'>{item.solution.solution_name || '-'}</h4>
            </Tooltip>
          </>
        }
      </div>
    ))
  }, [data?.data, isLoading, dispatch, setOpenVMSScreen])

  return (
    <div className='h-full flex flex-col gap-4'>
      {renderCameraList}
    </div>
  )
}

export default React.memo<Props>(CCTVSection)
