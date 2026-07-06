"use client"
import { ConfigProvider, Modal } from 'antd'
import dayjs from 'dayjs'
import React, { useEffect, useRef } from 'react'
import { TbCamera, TbDeviceCctv, TbMapPin, TbNetwork, TbPlayerPlay, TbRefresh } from 'react-icons/tb'
import type { Equipment } from '../../types'

interface Props {
  open: boolean
  equipment: Equipment | null
  pointLabel?: string
  onClose: () => void
}

const InfoStat: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({
  icon, label, children,
}) => (
  <div className='flex flex-col items-center gap-1'>
    <span className='text-(--default-blue)'>{icon}</span>
    <span className='text-white/60 text-xs'>{label}</span>
    <div className='text-white text-sm'>{children}</div>
  </div>
)

const Pill: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span
    className='inline-flex items-center px-3 py-0.5 rounded-full text-xs'
    style={{ border: `1px solid ${color}`, color }}
  >
    {text}
  </span>
)

const LiveStreamModal: React.FC<Props> = ({ open, equipment, pointLabel, onClose }) => {
  // NOTE: Real HLS playback requires hls.js — hooking it in is trivial once the
  // backend hands us a genuine .m3u8 URL. For now show a placeholder frame so
  // the layout matches Figma exactly.
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!open) return
    // Placeholder — real HLS binding wires here.
  }, [open])

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: { contentBg: '#0e0e0e', headerBg: '#0e0e0e', footerBg: '#0e0e0e', colorIcon: '#FFF', titleColor: '#FFF' },
        },
      }}
    >
      <Modal open={open} onCancel={onClose} footer={null} destroyOnHidden width={900} title={null}>
        <div className='mb-2 flex items-center gap-2 text-(--default-blue)'>
          <TbPlayerPlay size={22} />
          <h3 className='font-bold mb-0 text-white'>Live Stream</h3>
        </div>
        <p className='text-(--default-blue) text-sm break-words mb-3'>{equipment?.name}</p>

        <div className='rounded-lg overflow-hidden bg-black' style={{ aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            className='w-full h-full object-cover'
            controls
            poster='/next.svg'
          />
        </div>

        <div className='mt-4'>
          <p className='text-(--default-blue) font-bold mb-2'>ข้อมูลอุปกรณ์</p>
          <div className='grid grid-cols-2 sm:grid-cols-6 gap-3'>
            <InfoStat icon={<TbMapPin size={20} />} label='จุดติดตั้ง'>
              {pointLabel ?? '-'}
            </InfoStat>
            <InfoStat icon={<TbDeviceCctv size={20} />} label='ประเภทอุปกรณ์'>
              <div className='flex gap-1'>
                <Pill text='CCTV' color='#FF9F1C' />
              </div>
            </InfoStat>
            <InfoStat icon={<TbCamera size={20} />} label='Stream Status'>
              <Pill
                text={equipment?.streamConnected ? 'Connect' : 'Disconnect'}
                color={equipment?.streamConnected ? '#66AEFF' : '#FF6666'}
              />
            </InfoStat>
            <InfoStat icon={<TbDeviceCctv size={20} />} label='Device Status'>
              <Pill
                text={equipment?.isOnline ? 'Connect' : 'Disconnect'}
                color={equipment?.isOnline ? '#66AEFF' : '#FF6666'}
              />
            </InfoStat>
            <InfoStat icon={<TbNetwork size={20} />} label='IP Address'>
              {equipment?.ipAddress ?? '-'}
            </InfoStat>
            <InfoStat icon={<TbRefresh size={20} />} label='อัพเดตล่าสุด'>
              {equipment ? dayjs(equipment.lastUpdated).format('DD MMM YYYY HH:mm:ss') : '-'}
            </InfoStat>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(LiveStreamModal)
