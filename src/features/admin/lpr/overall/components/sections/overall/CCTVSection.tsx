"use client"
import React, { useMemo } from 'react'
import { useDeptId } from '@/hooks/useDeptId'
import { useQuery } from '@tanstack/react-query'
import { getLPRRandomOnlineAPI } from '@/services/routes/NewLPRService'
import { Skeleton, Tooltip } from 'antd'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'

dayjs.extend(relativeTime)

interface Props {
  deptId?: string | string[] | number
}

const CCTVSection: React.FC<Props> = (props) => {
  const { deptId: deptIdProp } = props
  const deptIdFromUrl = useDeptId()
  const deptId = String(deptIdProp ?? deptIdFromUrl ?? '0')
  const dispatch = useAppDispatch()

  const { data, isLoading } = useQuery({
    queryKey: ['lpr-random-onine', deptId],
    queryFn: () => getLPRRandomOnlineAPI(deptId, { scope: 'all', limit: 3 }),
    enabled: !!deptId,
  })

  // if (isLoading) return <Skeleton loading={isLoading} active />
  // if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />

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

    return data?.data?.data.map((item) => (
      <div
        key={item.camera.id}
        className='bg-(--mid-gray) p-3 rounded-lg flex-1 min-h-0 flex flex-col'
      >
        <HLSLivePlayer
          figureClassName='flex-1 min-h-0 mb-1.5 rounded-lg cursor-pointer'
          hlsUrl={item.camera.hls_url}
          onClick={() => {
            dispatch(setCCTVModalOpen({ open: true, camera_id: item.camera.id }))
          }}
        />
        <Tooltip title={item.camera.name || '-'}>
          <h4 className='camera-code truncate'>{item.camera.name || '-'}</h4>
        </Tooltip>
        <p className='camera-location'>IP Address : {item.camera.ip_address || '-'}</p>

      </div>
    ))
  }, [data?.data?.data, dispatch, isLoading])

  return (
    <div className='h-full flex flex-col gap-4'>
      {renderCameraList}
    </div>
  )
}

export default React.memo<Props>(CCTVSection)
