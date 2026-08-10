"use client"
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, ConfigProvider } from 'antd'
import { TbArrowBigLeftFilled, TbPrinter } from 'react-icons/tb'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** Header badge/button sizing — copied verbatim from the shared
 *  `DetailTitleSection` (components/section/DetailTitleSection.tsx) so this
 *  hand-rolled header matches every other detail page: 14px text, 2px/14px
 *  padding, 28px tall. Colours are applied per-element via inline style;
 *  filled buttons pass `borderColor: 'transparent'` so their box maths match
 *  the outlined pills exactly. */
const BADGE_CLASS =
  'inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border'

interface Props {
  id: string
  title: string
  subtitle?: string
  onlineCount?: number
  offlineCount?: number
  warranty?: string
  /** Feeds the ⓘ icon → central Project Info modal. Icon is muted/inert without a projectId. */
  projectId?: number
  roadId?: number
  /** [lng, lat] from the feature's own overview endpoint. Null → fall back to a name-based text search. */
  coord?: [number, number] | null
  /** Opens the นำออกเอกสาร export modal — omit to hide the button. */
  onExport?: () => void
}

const TitleSection: React.FC<Props> = ({ id, title, subtitle, onlineCount = 0, offlineCount = 0, warranty = 'หมดค้ำ', projectId, roadId, coord = null, onExport }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()

  const handleBack = () => {
    router.push('/admin/maintenance?repair')
  }

  return (
    // Outer padding / arrow size / row spacing all mirror DetailTitleSection
    // (`px-8`, `fs-24` arrow at `mt-2`, no extra top padding) so this header
    // lines up with every other detail page. Mobile keeps its tighter `px-3`.
    <div className='px-3 sm:px-8'>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 cursor-pointer mt-2 shrink-0'
          style={{ color: '#FCD116' }}
          onClick={handleBack}
        />
        <div className='min-w-0 flex-1'>
          <h1 className='text-[18px] sm:text-[24px] font-bold wrap-break-word' style={{ color: '#FCD116' }}>
            {title}
          </h1>
          <div className='flex flex-wrap items-center gap-2'>
            {/* No font-size class — matches DetailTitleSection's plain
                `<p>{installPoint}</p>` (16px). The old `fs-12` pinned it to
                14px, 2px under every other detail header. */}
            {subtitle && (
              <p className='font-normal' style={{ color: '#FFFFFF' }}>
                {subtitle}
              </p>
            )}
            <span
              className={BADGE_CLASS}
              style={{ borderColor: warranty === 'ในค้ำ' ? '#05F2DB' : '#979797', color: warranty === 'ในค้ำ' ? '#05F2DB' : '#979797' }}
            >
              {warranty}
            </span>
            <img
              src={`${BASE_PATH}/images/statistics/icbt.png`}
              alt='ดูข้อมูลโครงการ'
              title='ดูข้อมูลโครงการ'
              width={24}
              height={24}
              className='shrink-0'
              onClick={() => projectId !== undefined && dispatch(setProjectInfoModalOpen({
                open: true,
                project_id: projectId,
                road_id: roadId ?? null,
              }))}
              style={{ cursor: projectId !== undefined ? 'pointer' : 'default', opacity: projectId !== undefined ? 1 : 0.5 }}
            />
            <span
              className={BADGE_CLASS}
              style={{ borderColor: '#66AEFF', color: '#66AEFF', minWidth: 60 }}
            >
              <img src={`${BASE_PATH}/images/Maintenance/icrpblue.png`} alt='' width={14} height={14} />
              {onlineCount}
            </span>
            <span
              className={BADGE_CLASS}
              style={{ borderColor: '#E94C4C', color: '#E94C4C', minWidth: 60 }}
            >
              <img src={`${BASE_PATH}/images/Maintenance/icrpred.png`} alt='' width={14} height={14} />
              {offlineCount}
            </span>
            {/* Action buttons are AntD `<Button type='primary' size='middle'
                shape='round'>` — NOT the 28px pill above. That's deliberate in
                DetailTitleSection: pills are 28px, buttons are AntD's 32px
                middle size (padding 0 15px). Matching them to the pills made
                this row 4px shorter than every other detail page. */}
            <ConfigProvider theme={{ token: { colorPrimary: '#003F87', colorTextLightSolid: '#FFFFFF' } }}>
              <Button
                type='primary'
                size='middle'
                shape='round'
                onClick={() => {
                  if (coord) {
                    window.open(`https://www.google.com/maps?q=${coord[1]},${coord[0]}`, '_blank')
                    return
                  }
                  const query = [title, subtitle].filter(Boolean).join(' ')
                  window.open(`https://www.google.com/maps?q=${encodeURIComponent(query)}`, '_blank')
                }}
              >
                <p className='fs-12'>Google Map</p>
              </Button>
            </ConfigProvider>
            <ConfigProvider theme={{ token: { colorPrimary: '#FCD116', colorTextLightSolid: '#212121' } }}>
              <Button
                type='primary'
                size='middle'
                shape='round'
                onClick={() => {
                  const query = searchParams.toString()
                  router.push(`/admin/maintenance/detail/${id}/repair-history${query ? `?${query}` : ''}`)
                }}
              >
                <p className='fs-12'>ประวัติการซ่อม</p>
              </Button>
            </ConfigProvider>
            {onExport && (
              <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
                <Button
                  type='primary'
                  size='middle'
                  shape='round'
                  icon={<TbPrinter />}
                  onClick={onExport}
                >
                  <p className='fs-12'>นำออกเอกสาร</p>
                </Button>
              </ConfigProvider>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default React.memo(TitleSection)
