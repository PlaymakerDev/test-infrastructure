"use client"
import React from 'react'
import Image from 'next/image'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'
import { TbArrowRight, TbLicense } from 'react-icons/tb'
import { useLPRPointPlates } from '@/hooks/queries/lpr'
import { useLPRDetailContext } from '../../../context'

dayjs.extend(relativeTime)

interface Props {
  onShowAll?: () => void
}

// Backend serves images from /api-v2/lpr proxy — the payload gives us a path
// like "/anpr/2026/07/18/..." that must be joined with the backend base. Use
// NEXT_PUBLIC_HOST_BACKEND (same env the auth layer uses) so dev + prod
// both resolve to the right host.
const resolveImg = (path?: string | null): string => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const base = process.env.NEXT_PUBLIC_HOST_BACKEND ?? ''
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

/** Latest 5 plate detections at this install-point. Card-style with vehicle
 *  thumbnail + plate text + timestamp. Card click → open the plate detail
 *  page (existing /admin/lpr LICENSE tab search). */
const RecentPlatesSection: React.FC<Props> = ({ onShowAll }) => {
  const { solutionId } = useLPRDetailContext()
  const { data, isLoading } = useLPRPointPlates(solutionId, { limit: 5 })
  const items = data?.pages?.[0]?.res_data ?? []

  return (
    <div className='bg-(--mid-gray) rounded-2xl p-4 flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2 text-(--yellow)'>
          <TbLicense size={18} />
          <h4 className='mb-0'>ตรวจจับล่าสุด</h4>
        </div>
        {onShowAll && (
          <button
            type='button'
            onClick={onShowAll}
            className='fs-11 text-(--default-blue) hover:text-(--yellow) transition-colors flex items-center gap-1'
          >
            ดูทั้งหมด <TbArrowRight size={12} />
          </button>
        )}
      </div>

      {isLoading && (
        <div className='py-6 text-center text-gray-400 fs-12'>กำลังโหลด…</div>
      )}
      {!isLoading && items.length === 0 && (
        <div className='py-6 text-center text-gray-500 fs-12'>ยังไม่มีการตรวจจับ</div>
      )}

      <div className='flex flex-col gap-2'>
        {items.map((it) => (
          <div
            key={it.id}
            className='flex items-center gap-3 rounded-xl bg-(--light-black) p-2 hover:bg-black/40 transition-colors'
          >
            {it.vehicle_image ? (
              <Image
                src={resolveImg(it.vehicle_image)}
                alt={it.plate_number}
                width={64}
                height={48}
                unoptimized
                className='rounded-lg object-cover shrink-0 w-16 h-12 bg-black'
              />
            ) : (
              <div className='w-16 h-12 rounded-lg bg-black/40 shrink-0' />
            )}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2'>
                <span className='fs-14 font-bold text-white tabular-nums'>
                  {it.plate_number || '-'}
                </span>
                <span className='fs-11 text-gray-400 truncate'>
                  {it.plate_province || ''}
                </span>
              </div>
              <div className='fs-11 text-gray-400 truncate'>
                {it.vehicle_type_name || '-'}
                {it.vehicle_brand ? ` · ${it.vehicle_brand}` : ''}
                {it.vehicle_color && it.vehicle_color !== '-' ? ` · ${it.vehicle_color}` : ''}
              </div>
              <div className='fs-11 text-gray-500'>
                {dayjs(it.captured_at).locale('th').fromNow()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo<Props>(RecentPlatesSection)
