import { getCCTVDetailAPI } from '@/services/routes/SharedService'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { APIResponseCCTVDetail } from '@/types/cctv/shared-api'
import { CCTVModalExtraCell } from '@/types/layout'
import { useQuery } from '@tanstack/react-query'
import { Col, ConfigProvider, Empty, Modal, Row, Skeleton } from 'antd'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import HLSLivePlayer from '../video/HLSLivePlayer'
import {
  TbFileDescription, TbMapPin, TbRefresh, TbRss, TbScan, TbVideo,
  TbTrafficLights, TbCurlyLoop, TbTruck, TbVector, TbRoad,
} from 'react-icons/tb'
import dayjs from 'dayjs'
import { SOLUTION_BADGE_MAP, TEXT_CAMERA_STATUS } from '@/constants'

interface Props {

}

/** Icons for feature-specific extra cells, keyed by `CCTVModalExtraCell.iconKey`. */
const EXTRA_ICON_MAP: Record<string, React.ReactNode> = {
  phase: <TbTrafficLights className='fs-24' />,
  mode: <TbCurlyLoop className='fs-24' />,
  pcu: <TbTruck className='fs-24' />,
  green: <TbVideo className='fs-24' />,
  efficiency: <TbVector className='fs-24' />,
  road: <TbRoad className='fs-24' />,
}

interface ContentProps {
  data?: APIResponseCCTVDetail
  extraCells?: CCTVModalExtraCell[]
}

interface ConnectionLog {
  current_time: string;
  status: string;
  color: string;
}

const Content = (props: ContentProps) => {
  const { data, extraCells } = props
  const [connectionStatus, setConnectionStatus] = useState<ConnectionLog[]>([]);

  const checkStatusRef = useRef((status: string) => {
    const entry = TEXT_CAMERA_STATUS[status as keyof typeof TEXT_CAMERA_STATUS]
    setConnectionStatus(prev => [{
      current_time: dayjs().format('DD MMM YYYY HH:mm:ss'),
      status: entry?.name ?? status,
      color: entry?.color ?? '#6b7280',
    }, ...prev].slice(0, 5))
  })

  const checkStatus = useCallback((status: string) => checkStatusRef.current(status), [])
  const solutionName =
    data?.vms?.solution_name ??
    data?.wim_camera?.solution_name ??
    data?.counting?.solution_name ??
    data?.analytic?.solution_name ??
    data?.traffic?.solution_name ??
    data?.crosswalk?.solution_name ??
    data?.camera_name ??
    '-'

  // Subtitle = the camera's own name (unique per camera) so it changes when you
  // switch cameras. `solution_name` is shared by every camera in a solution, so
  // using it here made the title look "stuck". For VMS, camera_name mirrors the
  // solution name, so the display is unchanged there.
  const cameraName = data?.camera_name ?? solutionName

  const solutionBadges = SOLUTION_BADGE_MAP.filter(s => data?.[s.key as keyof typeof data])
  const deviceTypeBadges = solutionBadges.length > 0
    ? solutionBadges
    : [{ label: 'CCTV', color: '#F97316' }]

  const renderStatusBadge = useMemo(() => {
    return (
      <span
        className='inline-flex items-center px-3 py-1 rounded-full fs-11 whitespace-nowrap'
        style={{ border: `1px solid ${connectionStatus[0]?.color}`, color: connectionStatus[0]?.color }}
      >
        {connectionStatus[0]?.status || '-'}
      </span>
    )
  }, [connectionStatus])

  const renderConnectionBadge = useMemo(() => {
    return (
      <span
        className='inline-flex items-center px-3 py-1 rounded-full fs-11 whitespace-nowrap'
        style={{ border: `1px solid ${data?.is_online ? '#00FF00' : '#FF0000'}`, color: data?.is_online ? '#00FF00' : '#FF0000' }}
      >
        {data?.is_online ? 'Online' : 'Offline'}
      </span>
    )
  }, [data])

  return (
    <div>
      <section>
        <p className='text-(--default-blue)'>{cameraName}</p>
      </section>
      <section className='mt-2'>
        <HLSLivePlayer
          cameraId={String(data?.id)}
          hlsUrl={data?.hls_url}
          enableViewportPause
          figureClassName='figure-extra-large w-full mb-2 rounded-lg overflow-hidden'
          onStatusChange={checkStatus}
        />
      </section>
      <section className='mt-5'>
        <h3 className='text-(--default-blue) mb-5'>ข้อมูลอุปกรณ์</h3>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={4} xl={4} xxl={4} xxxl={4}>
            <div className='flex flex-col items-center justify-center text-center gap-1'>
              <TbMapPin className='fs-24' />
              <h5 className='font-normal text-gray-400/50'>จุดติดตั้ง</h5>
              <p className='fs-12'>{solutionName}</p>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4} xl={4} xxl={4} xxxl={4}>
            <div className='flex flex-col items-center justify-center text-center gap-1'>
              <TbRss className='fs-24' />
              <h5 className='font-normal text-gray-400/50'>ประเภทอุปกรณ์</h5>
              <div className='flex flex-wrap justify-center gap-1 mt-1'>
                {deviceTypeBadges.map(b => (
                  <span
                    key={b.label}
                    className='inline-flex items-center px-2 py-0.5 rounded-full fs-11 whitespace-nowrap'
                    style={{ border: `1px solid ${b.color}`, color: b.color }}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4} xl={4} xxl={4} xxxl={4}>
            <div className='flex flex-col items-center justify-center text-center gap-1'>
              <TbScan className='fs-24' />
              <h5 className='font-normal text-gray-400/50'>Stream Status</h5>
              {renderStatusBadge}
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4} xl={4} xxl={4} xxxl={4}>
            <div className='flex flex-col items-center justify-center text-center gap-1'>
              <TbVideo className='fs-24' />
              <h5 className='font-normal text-gray-400/50'>Device Status</h5>
              {renderConnectionBadge}
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4} xl={4} xxl={4} xxxl={4}>
            <div className='flex flex-col items-center justify-center text-center gap-1'>
              <TbFileDescription className='fs-24' />
              <h5 className='font-normal text-gray-400/50'>IP Address</h5>
              <p className='fs-12'>{data?.ip_address || '-'}</p>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4} xl={4} xxl={4} xxxl={4}>
            <div className='flex flex-col items-center justify-center text-center gap-1'>
              <TbRefresh className='animate-spin fs-24' />
              <h5 className='font-normal text-gray-400/50'>อัพเดตล่าสุด</h5>
              <p className='fs-12'>{connectionStatus[0]?.current_time || '-'}</p>
            </div>
          </Col>

          {/* Feature-specific extra cells (e.g. Traffic Signal's phase/PCU row).
            * Flow into the same auto-fit grid so they wrap onto a 2nd row. */}
          {extraCells?.map((cell) => (
            <Col key={cell.label} xs={24} sm={12} md={8} lg={4} xl={4} xxl={4} xxxl={4}>
              <div className='flex flex-col items-center justify-center text-center gap-1'>
                <span style={{ color: cell.color }}>
                  {EXTRA_ICON_MAP[cell.iconKey ?? ''] ?? <TbRss className='fs-24' />}
                </span>
                <h5 className='font-normal text-gray-400/50'>{cell.label}</h5>
                {cell.pill ? (
                  <span
                    className='inline-flex items-center px-3 py-1 rounded-full fs-11 whitespace-nowrap'
                    style={{ border: `1px solid ${cell.color ?? '#fff'}`, color: cell.color ?? '#fff' }}
                  >
                    {cell.value}
                  </span>
                ) : (
                  <p className='fs-12' style={{ color: cell.color }}>{cell.value}</p>
                )}
              </div>
            </Col>
          ))}
        </Row>
      </section>
    </div>
  )
}

const CCTVModal: React.FC<Props> = (props) => {
  const { } = props
  const { open, camera_id, extra_cells } = useAppSelector(state => state.layout.cctv_modal)
  const dispatch = useAppDispatch()

  const { data, isLoading, isError } = useQuery({
    // camera_id MUST be in the key — the modal stays mounted at the screen level,
    // so without it every camera shares one cache slot and the stream/name never
    // changes when you open a different camera.
    queryKey: ['cctv_detail', String(camera_id ?? '')],
    queryFn: () => getCCTVDetailAPI(String(camera_id)!),
    enabled: !!camera_id,
    // placeholderData: keepPreviousData
  })

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูลกล้องวงจรปิด" />
    return <Content data={data?.data} extraCells={extra_cells} />
  }, [isLoading, isError, data, extra_cells])

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#FFFFFF',
          }
        }
      }}>
      <Modal
        title="Live Stream"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        onOk={() => dispatch(resetCCTVModalOpen())}
        onCancel={() => dispatch(resetCCTVModalOpen())}
        footer={null}
        destroyOnHidden
        classNames={{
          container: 'border-2! border-(--default-blue)!'
        }}
        width={1000}
      >
        {renderContent}
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(CCTVModal)
