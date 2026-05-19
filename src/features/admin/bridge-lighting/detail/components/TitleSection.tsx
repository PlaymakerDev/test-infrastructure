"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { Modal, message } from 'antd'
import {
  TbApps,
  TbArrowBigLeftFilled,
  TbInfoSquareRoundedFilled,
  TbMapPin,
  TbWifi,
  TbWifiOff,
} from 'react-icons/tb'
import type { BridgeProject } from '@/features/admin/bridge-lighting/overall/data/bridgeProjects'

interface Props {
  bridge: BridgeProject
}

/** Small pill — outlined, colored. Used for warranty / status badges. */
const Pill: React.FC<{
  text: string
  color: string
  icon?: React.ReactNode
}> = ({ text, color, icon }) => (
  <span
    className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap'
    style={{ border: `1px solid ${color}`, color }}
  >
    {icon}
    {text}
  </span>
)

const TitleSection: React.FC<Props> = ({ bridge }) => {
  const router = useRouter()

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleBack = () => {
    // `router.back()` falls back to navigating to the list page when there's
    // no history (e.g., the user opened the detail URL directly).
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/admin/bridge-lighting')
    }
  }

  // ── Click handlers — use AntD Modal/message per project convention ────────
  const handleShowContractInfo = () => {
    Modal.info({
      title: 'รายละเอียดสัญญา',
      content: (
        <div className='flex flex-col gap-2 mt-3 text-sm'>
          <div><span className='text-white/60'>เลขที่สัญญา: </span>{bridge.contractNo}</div>
          <div><span className='text-white/60'>ชื่อโครงการ: </span>{bridge.projectName}</div>
          <div><span className='text-white/60'>จุดติดตั้ง: </span>{bridge.installPoint}</div>
          <div>
            <span className='text-white/60'>การค้ำประกัน: </span>
            {bridge.warranty === 'in-warranty' ? 'ในค้ำ' : 'หมดค้ำ'}
          </div>
        </div>
      ),
      okText: 'ปิด',
      centered: true,
    })
  }

  const handleOpenGoogleMap = () => {
    // bridge.coord is [lng, lat]; Google Maps wants `q=lat,lng`.
    const [lng, lat] = bridge.coord
    window.open(
      `https://www.google.com/maps?q=${lat},${lng}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const handleCopyAnydesk = async () => {
    try {
      await navigator.clipboard.writeText(bridge.anydesk)
      message.success(`คัดลอก Anydesk ID แล้ว: ${bridge.anydesk}`)
    } catch {
      // Fallback if clipboard API isn't available (e.g., insecure context).
      message.info(`Anydesk ID: ${bridge.anydesk}`)
    }
  }

  return (
    <div className='px-10 pt-3 overflow-x-hidden'>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-1.5 shrink-0'
          onClick={handleBack}
        />
        <div className='min-w-0 flex-1'>
          {/* ── Main title ── */}
          <h1 className='text-(--yellow) leading-tight wrap-break-word'>
            BridgeLighting : {bridge.installPoint.replace('ไฟประดับ : ', '')}
          </h1>

          {/* ── Subtitle row with pills + buttons ── */}
          <div className='mt-2 flex items-center gap-2 flex-wrap'>
            <p className='text-white text-sm'>{bridge.installPoint}</p>
            <TbInfoSquareRoundedFilled
              className='text-white cursor-pointer hover:text-(--yellow) transition-colors'
              size={18}
              title='ดูรายละเอียดสัญญา'
              onClick={handleShowContractInfo}
            />

            {/* Warranty pill */}
            {bridge.warranty === 'in-warranty' ? (
              <Pill text='ในค้ำ' color='#05F2DB' />
            ) : (
              <Pill text='หมดค้ำ' color='#979797' />
            )}

            {/* Google Map button */}
            <button
              className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap text-white cursor-pointer hover:opacity-80 transition-opacity'
              style={{ background: '#4F84F0' }}
              type='button'
              onClick={handleOpenGoogleMap}
              title='เปิด Google Maps ที่ตำแหน่งสะพาน'
            >
              <TbMapPin size={14} />
              Google Map
            </button>

            {/* Anydesk pill — solid blue bg, black text, click to copy ID */}
            <button
              className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity'
              style={{ background: '#66AEFF', color: '#000' }}
              type='button'
              onClick={handleCopyAnydesk}
              title='คัดลอก Anydesk ID'
            >
              <TbApps size={14} />
              Anydesk : {bridge.anydesk}
            </button>

            {/* Connection pill */}
            {bridge.connection === 'online' ? (
              <Pill text='ออนไลน์' color='#66AEFF' icon={<TbWifi size={14} />} />
            ) : (
              <Pill text='ออฟไลน์' color='#E94C4C' icon={<TbWifiOff size={14} />} />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
