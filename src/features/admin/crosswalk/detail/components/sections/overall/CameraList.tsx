"use client"
import React from 'react'
import { Col, Row } from 'antd'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useCrosswalkCameras } from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import { extractIpFromHlsUrl } from '@/utils/extractIpFromHlsUrl'
import { useDetailContext } from '../../../context'

interface Props {
  /** 'all' | 'online' | 'offline' — filter cameras by connection status.
   *  Defaults to 'all' when omitted. */
  activeFilter?: string
}

const CameraList: React.FC<Props> = ({ activeFilter = 'all' }) => {
  const deptId = useDeptId()
  const { id } = useDetailContext()
  const dispatch = useAppDispatch()

  const { data, isLoading } = useCrosswalkCameras(deptId, {
    solution_id: id,
  })
  const cameras = (data?.cameras ?? []).filter((c) => {
    if (activeFilter === 'online') return c.is_online
    if (activeFilter === 'offline') return !c.is_online
    return true
  })

  const openCamera = (cameraId: string) =>
    dispatch(setCCTVModalOpen({ open: true, camera_id: cameraId }))

  if (isLoading && cameras.length === 0) {
    return (
      <Row gutter={[16, 16]}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Col key={i} xs={24} sm={24} md={12} lg={12} xl={12} xxl={6} xxxl={6}>
            <div className='bg-(--mid-gray) p-3 rounded-lg animate-pulse aspect-video' />
          </Col>
        ))}
      </Row>
    )
  }

  return (
    <Row gutter={[16, 16]}>
      {cameras.map((cam) => (
        <Col key={cam.id} xs={24} sm={24} md={12} lg={12} xl={12} xxl={6} xxxl={6}>
          <div
            className='bg-(--mid-gray) p-3 rounded-lg flex flex-col cursor-pointer'
            onClick={() => openCamera(cam.id)}
            role='button'
            tabIndex={0}
          >
            <div className='relative rounded-lg overflow-hidden bg-black/40 mb-2'>
              <HLSLivePlayer
                figureClassName='aspect-video rounded-lg'
                hlsUrl={cam.hls_url}
                cameraId={cam.id}
              />
            </div>
            <h4 className='text-blue-400 mb-0 fs-12 font-normal leading-snug line-clamp-2'>{cam.camera_name}</h4>
            <p className='fs-12 text-gray-400 mb-0'>
              IP Address : {cam.ip_address ?? extractIpFromHlsUrl(cam.hls_url)}
            </p>
          </div>
        </Col>
      ))}
    </Row>
  )
}

export default React.memo<Props>(CameraList)
