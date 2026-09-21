"use client"
import { ConfigProvider, Modal } from 'antd'
import dayjs from 'dayjs'
import React, { useCallback } from 'react'
import { TbCamera, TbDeviceCctv, TbMapPin, TbNetwork, TbPlayerPlay, TbRefresh } from 'react-icons/tb'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetLiveStreamModalData } from '@/stores/reducers/modal/customModalSlice'
import { extractIpFromHlsUrl } from '@/utils/extractIpFromHlsUrl'

interface Props {

}

const InfoStat: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({
  icon, label, children,
}) => (
  <div className='flex flex-col items-center gap-1'>
    <span className='text-(--default-blue)'>{icon}</span>
    <span className='fs-12 text-white/65'>{label}</span>
    <div className='fs-12 text-white font-medium'>{children}</div>
  </div>
)

const Pill: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span
    className='inline-flex items-center px-3 py-0.5 rounded-full fs-12'
    style={{ border: `1px solid ${color}`, color }}
  >
    {text}
  </span>
)

/** Live-stream viewer for one camera, opened from any "รายการอุปกรณ์" modal via
 *  the `live_stream_modal` Redux state. Mounted once on the screen (after the
 *  equipment modals, so it stacks above them). Mirrors settings/detail's
 *  LiveStreamModal, driven by APIResponseCamera. */
const ModalLiveStream: React.FC<Props> = (props) => {
  const { } = props
  const { open, data: camera, item } = useAppSelector((state) => state.custom_modal.live_stream_modal)
  const dispatch = useAppDispatch()

  const handleClose = useCallback(() => {
    dispatch(resetLiveStreamModalData())
  }, [dispatch])

  const connected = Boolean(camera?.curl_status)
  const lastUpdated =
    camera?.curl_updated ?? camera?.curl_updated_at ?? camera?.ping_updated ?? camera?.updated_at ?? camera?.created_at

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: { contentBg: '#1A1A1A', headerBg: '#1A1A1A', footerBg: '#1A1A1A', colorIcon: '#FFFFFF', titleColor: '#FFFFFF', borderRadiusLG: 16 },
        },
      }}
    >
      <Modal
        wrapClassName='light-modal'
        open={open}
        onCancel={handleClose}
        footer={null}
        destroyOnHidden
        width={900}
        styles={{ container: { padding: '28px 32px', borderRadius: 16, background: '#1A1A1A' }, mask: { background: 'rgba(0,0,0,0.55)' } }}
        title={null}
      >
        <div className='mb-1 flex items-center gap-2'>
          <TbPlayerPlay size={22} className='text-(--default-blue)' />
          <h3 className='text-white text-xl font-bold m-0'>Live Stream</h3>
        </div>
        <p className='text-(--default-blue) fs-12 break-words m-0 mb-4'>
          {camera?.camera_name}
        </p>

        <HLSLivePlayer
          hlsUrl={camera?.hls_url ?? ''}
          cameraId={camera?.id ?? 'unknown'}
          figureClassName='aspect-video rounded-lg'
        />

        <div className='mt-6'>
          <p className='text-(--default-blue) font-bold mb-3'>ข้อมูลอุปกรณ์</p>
          <div className='grid grid-cols-2 sm:grid-cols-6 gap-3'>
            <InfoStat icon={<TbMapPin size={20} />} label='จุดติดตั้ง'>
              {item?.location_name || '-'}
            </InfoStat>
            <InfoStat icon={<TbDeviceCctv size={20} />} label='ประเภทอุปกรณ์'>
              <div className='flex gap-1'>
                <Pill text='CCTV' color='#FF9F1C' />
              </div>
            </InfoStat>
            <InfoStat icon={<TbCamera size={20} />} label='Stream Status'>
              <Pill text={connected ? 'Connect' : 'Disconnect'} color={connected ? '#66AEFF' : '#FF6666'} />
            </InfoStat>
            <InfoStat icon={<TbDeviceCctv size={20} />} label='Device Status'>
              <Pill text={connected ? 'Connect' : 'Disconnect'} color={connected ? '#66AEFF' : '#FF6666'} />
            </InfoStat>
            <InfoStat icon={<TbNetwork size={20} />} label='IP Address'>
              {camera?.ip_address || extractIpFromHlsUrl(camera?.hls_url)}
            </InfoStat>
            <InfoStat icon={<TbRefresh size={20} />} label='อัพเดตล่าสุด'>
              {lastUpdated && dayjs(lastUpdated).isValid()
                ? dayjs(lastUpdated).format('DD MMM YYYY HH:mm:ss')
                : '-'}
            </InfoStat>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalLiveStream)
