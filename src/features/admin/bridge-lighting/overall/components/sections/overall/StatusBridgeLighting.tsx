"use client"
import BLStarIcon from '@/components/icon/BLStarIcon'
import { getBridgeLightingOverviewAPI } from '@/services/routes/BridgeLightingService'
import { useScopeAll } from '@/hooks/useScopeAll'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/th'
import { TbCircleFilled, TbArrowRight } from 'react-icons/tb'
import React, { useMemo } from 'react'
import type { BridgeLightingLocation } from '@/types/bridge-lighting/overall-api'

dayjs.extend(relativeTime)
dayjs.extend(customParseFormat)

interface Props {
  deptId: string | string[] | number
}

// Parse the backend's Buddhist-era timestamp — the /overview endpoint ships
// last_update as a Thai-formatted string like "18/07/2569 12:45:00" (พ.ศ.).
// dayjs's default ISO parse doesn't understand it, so we parse manually.
const parseThaiTimestamp = (raw: string | null | undefined): dayjs.Dayjs | null => {
  if (!raw) return null
  // Try Buddhist DD/MM/YYYY HH:mm:ss first.
  const buddhist = dayjs(raw, 'DD/MM/YYYY HH:mm:ss', true)
  if (buddhist.isValid()) {
    // Convert พ.ศ. → ค.ศ. for accurate `fromNow` math.
    return buddhist.year(buddhist.year() - 543)
  }
  // Fallback: try plain ISO in case the backend switches to ISO later.
  const iso = dayjs(raw)
  return iso.isValid() ? iso : null
}

interface FeedCardProps {
  location: BridgeLightingLocation
  onClick: () => void
}

const FeedCard: React.FC<FeedCardProps> = ({ location, onClick }) => {
  const online = location.is_online
  const dotColor = online ? '#05F2DB' : '#FF6666'
  const borderColor = online ? 'rgba(5,242,219,0.35)' : 'rgba(255,102,102,0.35)'
  const bgColor = online ? 'rgba(5,242,219,0.06)' : 'rgba(255,102,102,0.06)'
  const parsed = parseThaiTimestamp(location.last_update)
  const relative = parsed ? parsed.locale('th').fromNow() : '—'

  return (
    <button
      type='button'
      onClick={onClick}
      className='w-full text-left rounded-xl p-3 transition-colors hover:brightness-110 focus:outline-none cursor-pointer'
      style={{ background: bgColor, border: `1px solid ${borderColor}` }}
    >
      <div className='flex items-center gap-2 mb-1'>
        <TbCircleFilled size={9} color={dotColor} />
        <span className='fs-11 font-medium' style={{ color: dotColor }}>
          {online ? 'ออนไลน์' : 'ออฟไลน์'}
        </span>
        <span className='fs-11 text-white/40 ml-auto'>{relative}</span>
      </div>
      <p className='fs-13 font-semibold text-white mb-0.5 leading-snug'>
        {location.solution.solution_name}
      </p>
      <p className='fs-11 text-white/50 mb-0'>{location.road.code_name}</p>
    </button>
  )
}

/**
 * Left-rail "recent activity" panel on the bridge-lighting overview.
 *
 * Reuses the exact same query key + queryFn as MapBridgeLighting so the
 * data is fetched once and served from cache to both consumers. Sorts
 * locations by `last_update` (parsed from the backend's Buddhist-era
 * DD/MM/YYYY format) and renders the 5 freshest — enough to fill the
 * 360 px rail without scrolling on a typical laptop.
 */
const StatusBridgeLighting: React.FC<Props> = ({ deptId }) => {
  const router = useRouter()
  const scope = useScopeAll() ? 'all' : 'own'

  const { data } = useQuery({
    queryKey: ['bridge_lighting_overview', String(deptId ?? ''), scope],
    // MUST forward `scope` to the backend — /departments/0/overview
    // without ?scope=all returns zero locations (dept 0 = ส่วนกลาง has no
    // solutions directly assigned to it). Same call MapBridgeLighting
    // makes; they share the query key so the payload must match too.
    queryFn: () => getBridgeLightingOverviewAPI(Number(deptId), { scope }),
    enabled: !!deptId || deptId === 0 || deptId === '0',
    placeholderData: keepPreviousData,
  })

  const locations = data?.data.locations ?? []

  const { recent, total, onlineCount } = useMemo(() => {
    const withTime = locations
      .map((loc) => ({ loc, ts: parseThaiTimestamp(loc.last_update)?.valueOf() ?? 0 }))
      .sort((a, b) => b.ts - a.ts)
    return {
      recent: withTime.slice(0, 5).map((x) => x.loc),
      total: locations.length,
      onlineCount: locations.filter((l) => l.is_online).length,
    }
  }, [locations])

  const goToDetail = (loc: BridgeLightingLocation) => {
    router.push(
      `/admin/bridge-lighting/detail/${loc.solution.id}?dept_id=${String(deptId)}&is_online=${loc.is_online}${scope === 'all' ? '&scope=all' : ''}`,
    )
  }

  return (
    <div className='bg-[#FFFFFF10] border-2 rounded-2xl p-4 border-white/80 flex flex-col gap-3'>
      {/* Header */}
      <div>
        <div className='flex items-center gap-2 mb-1'>
          <BLStarIcon className='fs-20' />
          <p className='fs-13 font-bold text-white mb-0'>ไฟประดับสะพานแสดงผลล่าสุด</p>
        </div>
        {total > 0 && (
          <p className='fs-11 text-white/60 mb-0 pl-7'>
            <span className='text-white/90 font-semibold'>{total}</span> จุด ·{' '}
            <span style={{ color: '#05F2DB' }}>{onlineCount} ออนไลน์</span>
            {total - onlineCount > 0 && (
              <>
                {' · '}
                <span style={{ color: '#FF6666' }}>{total - onlineCount} ออฟไลน์</span>
              </>
            )}
          </p>
        )}
      </div>

      {/* Feed */}
      <div className='flex flex-col gap-2'>
        {recent.length === 0 ? (
          <div className='rounded-xl p-4 text-center' style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className='fs-12 text-white/50 mb-0'>ยังไม่มีข้อมูลไฟประดับสะพาน</p>
          </div>
        ) : (
          recent.map((loc) => (
            <FeedCard key={loc.solution.id} location={loc} onClick={() => goToDetail(loc)} />
          ))
        )}
      </div>

      {/* Footer link → drop the user into the table */}
      {total > recent.length && (
        <a
          href='#bridge-lighting-summary-table'
          className='text-center fs-12 text-white/60 hover:text-white transition-colors flex items-center justify-center gap-1 py-1'
          onClick={(e) => {
            e.preventDefault()
            document
              .getElementById('bridge-lighting-summary-table')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        >
          ดูทั้งหมด {total} จุดในตาราง <TbArrowRight size={14} />
        </a>
      )}
    </div>
  )
}

export default React.memo<Props>(StatusBridgeLighting)
