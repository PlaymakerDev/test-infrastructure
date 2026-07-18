"use client"
import { ConfigProvider, Modal } from 'antd'
import dayjs from 'dayjs'
import React from 'react'
import { TbCamera, TbDeviceCctv, TbMapPin, TbNetwork, TbPlayerPlay, TbRefresh } from 'react-icons/tb'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { extractIpFromHlsUrl } from '@/utils/extractIpFromHlsUrl'
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
    <span style={{ color: '#66AEFF' }}>{icon}</span>
    <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{label}</span>
    <div style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 500 }}>{children}</div>
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
        onCancel={onClose}
        footer={null}
        destroyOnHidden
        width={900}
        styles={{ container: { padding: '28px 32px', borderRadius: 16, background: '#1A1A1A' }, mask: { background: 'rgba(0,0,0,0.55)' } }}
        title={null}
      >
        <div className='mb-1 flex items-center gap-2'>
          <TbPlayerPlay size={22} style={{ color: '#66AEFF' }} />
          <h3 style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700, margin: 0 }}>Live Stream</h3>
        </div>
        <p style={{ color: '#66AEFF', fontSize: 13, wordBreak: 'break-word', margin: 0, marginBottom: 16 }}>
          {equipment?.name}
        </p>

        <HLSLivePlayer
          hlsUrl={equipment?.hlsUrl ?? ''}
          cameraId={equipment?.id ?? 'unknown'}
          figureClassName='aspect-video rounded-lg'
        />

        <div className='mt-6'>
          <p style={{ color: '#66AEFF', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>ข้อมูลอุปกรณ์</p>
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
              {equipment?.ipAddress ?? extractIpFromHlsUrl(equipment?.hlsUrl ?? undefined)}
            </InfoStat>
            <InfoStat icon={<TbRefresh size={20} />} label='อัพเดตล่าสุด'>
              {equipment?.lastUpdated && dayjs(equipment.lastUpdated).isValid()
                ? dayjs(equipment.lastUpdated).format('DD MMM YYYY HH:mm:ss')
                : '-'}
            </InfoStat>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(LiveStreamModal)
