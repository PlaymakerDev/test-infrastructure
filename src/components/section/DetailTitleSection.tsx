"use client"
import React from 'react'
import { Button, ConfigProvider } from 'antd'
import {
  TbAppWindow,
  TbArrowBigLeftFilled,
  TbInfoSquareRoundedFilled,
  TbWifi,
  TbWifiOff,
} from 'react-icons/tb'
import SwapButton from '@/components/swap-button/SwapButton'

/**
 * Shared detail-page header, modelled on the CCTV detail `TitleSection`
 * (`features/admin/cctv/detail/components/TitleSection.tsx`) — the canonical
 * layout for every device-detail header:
 *
 *   [< ย้อนกลับ]                                         ← mobile-only back link
 *   ◀  <feature> : สายทาง <roadCode>                     ← desktop back arrow + title
 *      <installPoint> ⓘ  [warranty]  [Google Map] [Anydesk] [online]
 *      [ tab-1 | tab-2 | … ]                             ← optional SwapButton row
 *
 * Every action/badge is opt-in via props so features render only what they own
 * (CCTV has no AnyDesk/online/tabs; the analytics features do). All colours and
 * spacing come from this one place so the six detail headers stay in lock-step.
 */

export interface DetailTitleTab {
  options: { label: string; value: string }[]
  defaultActive: string
  /** Controlled active tab — omit for uncontrolled `defaultActive`-only mode. */
  activeValue?: string
  onChange: (value: string) => void
}

export interface DetailTitleSectionProps {
  /** Feature label — rendered as "<feature> : สายทาง <roadCode>". */
  feature: string
  roadCode: string
  /** Install-point / location name shown under the title. */
  installPoint: string
  onBack: () => void
  /** ⓘ project-info handler. Omit to render a non-interactive icon. */
  onInfo?: () => void
  /** Warranty pill (label + border/text colour). Omit to hide. */
  warranty?: { label: string; color: string }
  /**
   * Google Map button. Omit to hide entirely.
   * - `coord` present → enabled button opening Google Maps.
   * - `coord` null + `keepWhenEmpty` → disabled button kept visible.
   * - `coord` null + no `keepWhenEmpty` → button hidden.
   * `coord` is `[lng, lat]` (Mapbox order); the link swaps to `lat,lng`.
   */
  googleMap?: { coord: [number, number] | null; keepWhenEmpty?: boolean }
  /** AnyDesk button. Omit to hide. Empty/undefined `id` → muted disabled style. */
  anydesk?: { id: string | undefined }
  /** Online/offline pill. Omit to hide. */
  online?: { isOnline: boolean }
  /** SwapButton tab row. Omit to hide. */
  tabs?: DetailTitleTab
  /** Outer horizontal padding — defaults to the CCTV reference's `px-8`. */
  className?: string
}

const DetailTitleSection: React.FC<DetailTitleSectionProps> = ({
  feature,
  roadCode,
  installPoint,
  onBack,
  onInfo,
  warranty,
  googleMap,
  anydesk,
  online,
  tabs,
  className = 'px-8',
}) => {
  const showGoogleMap = !!googleMap && (!!googleMap.coord || !!googleMap.keepWhenEmpty)
  // A real AnyDesk id always contains digits. The backend sometimes ships
  // placeholder strings instead (e.g. "SERVICE_NOT_RUNNING" on traffic-volume
  // solution 695, 2026-08-18) — those must render as "ไม่พบหมายเลข" (muted,
  // unclickable), not as a clickable id.
  const anydeskId = anydesk?.id && /\d/.test(anydesk.id) ? anydesk.id : undefined

  return (
    <div className={className}>
      {/* Mobile-only back link; desktop uses the arrow icon below. */}
      <p
        className='block mb-3 lg:hidden text-(--yellow) cursor-pointer'
        onClick={onBack}
      >
        &lt; ย้อนกลับ
      </p>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-2 hidden lg:block'
          onClick={onBack}
        />
        <div className='flex-1 min-w-0'>
          <h1 className='text-(--yellow)'>
            {feature} : สายทาง {roadCode}
          </h1>
          {/* Mobile (< sm): stacks vertically. Desktop (sm+): single inline row. */}
          <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <p>{installPoint}</p>
              <TbInfoSquareRoundedFilled
                size={24}
                title='ดูข้อมูลโครงการ'
                className='text-white cursor-pointer hover:text-(--yellow) shrink-0'
                onClick={onInfo}
              />
              {warranty && (
                <span
                  className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border'
                  style={{ borderColor: warranty.color, color: warranty.color }}
                >
                  {warranty.label}
                </span>
              )}
            </div>

            {/* Google Map + Anydesk buttons (Google Map first per Figma). */}
            {showGoogleMap && (
              <ConfigProvider
                theme={{ token: { colorPrimary: '#003F87', colorTextLightSolid: '#FFFFFF' } }}
              >
                <Button
                  type='primary'
                  size='middle'
                  shape='round'
                  className='w-full! sm:w-auto!'
                  disabled={!googleMap!.coord}
                  onClick={() => {
                    const coord = googleMap!.coord
                    if (!coord) return
                    window.open(
                      `https://maps.google.com/?q=${coord[1]},${coord[0]}`,
                      '_blank',
                    )
                  }}
                >
                  <p className='fs-12'>Google Map</p>
                </Button>
              </ConfigProvider>
            )}

            {anydesk && (
              <ConfigProvider
                theme={{
                  // No AnyDesk id → gray "disabled" tokens (per design
                  // 2026-07-13, same across the 6 menus); real `disabled`
                  // prop is avoided so the tooltip keeps firing.
                  token: anydeskId
                    ? { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' }
                    : { colorPrimary: '#3F3F3F', colorTextLightSolid: '#9CA3AF' },
                }}
              >
                <Button
                  type='primary'
                  size='middle'
                  shape='round'
                  icon={<TbAppWindow />}
                  className='w-full! sm:w-auto!'
                  style={{ cursor: anydeskId ? 'pointer' : 'not-allowed' }}
                  title={anydeskId ? `เปิด AnyDesk : ${anydeskId}` : 'ไม่มีรหัส AnyDesk'}
                  onClick={() => {
                    if (!anydeskId) return
                    // `anydesk:` protocol opens the installed desktop client.
                    // Use location.href to avoid a Chrome blank-tab race.
                    window.location.href = `anydesk:${anydeskId}`
                  }}
                >
                  <p className='fs-12'>Anydesk : {anydeskId || 'ไม่พบหมายเลข'}</p>
                </Button>
              </ConfigProvider>
            )}

            {/* Online = #66AEFF (per Figma); offline stays red. */}
            {online && (
              <span
                className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border'
                style={{
                  borderColor: online.isOnline ? '#66AEFF' : '#ef4444',
                  color: online.isOnline ? '#66AEFF' : '#ef4444',
                }}
              >
                {online.isOnline ? <TbWifi /> : <TbWifiOff />}
                {online.isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
              </span>
            )}
          </div>
        </div>
      </section>
      {tabs && (
        <section className='mt-5 px-10'>
          <SwapButton
            options={tabs.options}
            defaultActive={tabs.defaultActive}
            activeValue={tabs.activeValue}
            setLabelValue={tabs.onChange}
          />
        </section>
      )}
    </div>
  )
}

export default React.memo<DetailTitleSectionProps>(DetailTitleSection)
