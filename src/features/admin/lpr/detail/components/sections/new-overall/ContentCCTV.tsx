import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { APIResponseLPRRandomOnline } from '@/types/lpr/new-lpr-api'
import { Col, Empty, Row, Skeleton } from 'antd'
import React, { useMemo } from 'react'

interface Props {
  data?: APIResponseLPRRandomOnline
  isLoading?: boolean
  isError?: boolean
}

const ContentCCTV: React.FC<Props> = (props) => {
  const { data, isLoading, isError } = props
  const dispatch = useAppDispatch()

  const renderCCTVContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 4 }} />
    if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />
    if (!data || data.data.length === 0) {
      return (
        <div className='block mx-auto my-16'>
          <Empty description="ไม่มีข้อมูล" />
        </div>
      )
    }
    return data.data.map((item) => {
      return (
        <Col key={item.camera.id} xs={24} sm={24} md={12} lg={12} xl={8} xxl={6} xxxl={6}>
          <div className='p-5 bg-(--mid-gray) rounded-2xl h-full'>
            <HLSLivePlayer
              hlsUrl={item.camera.hls_url || '-'}
              showLiveBadge={true}
              cameraId={String(item.camera.id)}
              enableViewportPause
              figureClassName='figure-normal min-h-0 overflow-hidden rounded-lg cursor-pointer'
              onClick={() => dispatch(setCCTVModalOpen({ open: true, camera_id: item.camera.id }))}
            />
            <section className='mt-3'>
              <h4 className='text-(--default-blue) font-normal!'>{item.camera.name || '-'}</h4>
              <p className='text-white/50 fs-12'>IP Address : {item.camera.ip_address || '-'}</p>
            </section>
          </div>
        </Col>
      )
    })
  }, [isLoading, isError, data, dispatch])

  return (
    <Row gutter={[16, 16]}>
      {renderCCTVContent}
    </Row>
  )
}

export default React.memo<Props>(ContentCCTV)
