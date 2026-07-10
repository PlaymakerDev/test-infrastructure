"use client"
import SwapButton from '@/components/swap-button/SwapButton'
import { Segmented } from 'antd'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const useIsMobile = (breakpoint = 640) => {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

// Fades whichever edge(s) of a horizontally-scrollable row currently hide
// content, so a narrow viewport shows "there's more, swipe" instead of an
// abrupt cut-off. Recomputed on scroll/resize; both edges clear once the
// row's full content fits (or has been scrolled all the way to that side).
// Takes the container ref rather than creating+returning one itself, since
// returning a ref wrapped in an object defeats the react-hooks/refs lint
// rule's ability to verify it's used correctly at the JSX `ref=` callsite.
const EDGE_FADE_PX = '28px'
const useEdgeFadeStyle = (ref: React.RefObject<HTMLDivElement | null>) => {
  const [fade, setFade] = useState({ left: false, right: false })

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setFade({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    })
  }, [ref])

  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, update])

  const maskImage = fade.left && fade.right
    ? `linear-gradient(to right, transparent 0, black ${EDGE_FADE_PX}, black calc(100% - ${EDGE_FADE_PX}), transparent 100%)`
    : fade.right
      ? `linear-gradient(to right, black calc(100% - ${EDGE_FADE_PX}), transparent 100%)`
      : fade.left
        ? `linear-gradient(to right, transparent 0, black ${EDGE_FADE_PX})`
        : undefined

  return {
    onScroll: update,
    style: maskImage ? { WebkitMaskImage: maskImage, maskImage } : undefined,
  }
}

const TAB_OPTIONS = [
  { label: 'ภาพรวม', value: 'OVERVIEW' },
  { label: 'รายงานเหตุการณ์', value: 'INCIDENT' },
  { label: 'ไฟฟ้าแจ้งเตือน', value: 'ALERT' },
  { label: 'สถานะและการปรับเปลี่ยนข้อความ', value: 'STATUS' },
]

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ปีที่ผ่านมา', value: 'LAST_YEAR' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

const TitleSection: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const tabScrollRef = useRef<HTMLDivElement>(null)
  const tabScroll = useEdgeFadeStyle(tabScrollRef)

  // Determine current tab from boolean params
  const hasStatus = searchParams.has('status')
  const hasIncident = searchParams.has('incident')
  const hasAlert = searchParams.has('alert')
  const currentTab = hasStatus ? 'STATUS' : hasIncident ? 'INCIDENT' : hasAlert ? 'ALERT' : 'OVERVIEW'

  const activePeriod = searchParams.get('period') || 'ALL'

  const handleTabChange = (value: string) => {
    // Build query string without = for boolean params
    const queryParts: string[] = []

    if (value === 'STATUS') {
      queryParts.push('status')
    } else if (value === 'INCIDENT') {
      queryParts.push('incident')
    } else if (value === 'ALERT') {
      queryParts.push('alert')
    }

    // Keep period if exists
    const period = searchParams.get('period')
    if (period && value !== 'STATUS') {
      queryParts.push(`period=${period}`)
    }

    const query = queryParts.join('&')
    router.push(`/admin/statistics${query ? `?${query}` : ''}`)
  }

  const handlePeriodChange = (value: string) => {
    // Build query string without = for boolean params
    const queryParts: string[] = []

    // Preserve current tab
    if (searchParams.has('status')) {
      queryParts.push('status')
    } else if (searchParams.has('incident')) {
      queryParts.push('incident')
    } else if (searchParams.has('alert')) {
      queryParts.push('alert')
    }

    queryParts.push(`period=${value}`)

    const query = queryParts.join('&')
    router.push(`/admin/statistics${query ? `?${query}` : ''}`)
  }

  return (
    <div>
      {currentTab !== 'STATUS' && currentTab !== 'ALERT' && currentTab !== 'INCIDENT' && (
        <section>
          <h1 className='text-(--yellow)'>Statistics</h1>
          <p className='text-(--yellow)'>สถิติและรายงานการแจ้งเตือนเหตุการณ์</p>
        </section>
      )}
      <section className={`${currentTab !== 'STATUS' && currentTab !== 'ALERT' && currentTab !== 'INCIDENT' ? 'mt-5' : 'mt-0'} flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4`}>
        {currentTab !== 'STATUS' && currentTab !== 'ALERT' && currentTab !== 'INCIDENT' && (
          <div
            ref={tabScrollRef}
            onScroll={tabScroll.onScroll}
            className='flex-1 min-w-0 w-full sm:w-auto overflow-x-auto no-scrollbar'
            style={!isMobile ? tabScroll.style : undefined}
          >
            <SwapButton
              options={TAB_OPTIONS}
              defaultActive={currentTab}
              setLabelValue={handleTabChange}
              size={isMobile ? 'middle' : 'large'}
              mobileWrap
            />
          </div>
        )}
        {currentTab !== 'STATUS' && currentTab !== 'ALERT' && currentTab !== 'INCIDENT' && (
          isMobile ? (
            // Segmented is a single connected pill — it can't wrap without
            // looking broken, so mobile gets its own wrap-grid of chips
            // instead of the horizontal-scroll treatment used for the tabs.
            <div className='flex flex-wrap gap-1 w-full rounded-xl border border-(--yellow) p-1'>
              {PERIOD_OPTIONS.map((opt) => {
                const isActive = activePeriod === opt.value
                return (
                  <button
                    key={opt.value}
                    type='button'
                    onClick={() => handlePeriodChange(opt.value)}
                    className='px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors'
                    style={isActive
                      ? { background: 'var(--yellow)', color: '#212121' }
                      : { background: 'transparent', color: 'var(--yellow)' }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className='shrink-0 w-auto'>
              <Segmented
                value={activePeriod}
                onChange={(value) => handlePeriodChange(value as string)}
                options={PERIOD_OPTIONS}
                size='large'
                classNames={{
                  root: 'min-w-max border! border-(--yellow)!',
                }}
              />
            </div>
          )
        )}
      </section>
    </div>
  )
}

export default React.memo(TitleSection)
