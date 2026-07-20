"use client"
import React, { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TbChevronDown } from 'react-icons/tb'
import { Collapse } from 'antd'
import { SearchCard } from '@/components/search-card'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { setMapPanelsOpen } from '@/stores/reducers/layout/layoutSlice'
import { DrawerMapSearchCard } from '../../../overall/components/shared'
import { useIncidentDetailContext } from '../context'
import { useLiveIncidentRouteItems } from '../../../data/useLiveIncidentRouteItems'
import { routeKey, detailKey, detailLabel } from '../../../data/routeItems'

const IncidentDetailSidebar: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const routeParam = searchParams.get('route') || ''
  const detailParam = searchParams.get('detail') || ''
  const { searchText, setSearchText } = useIncidentDetailContext()

  // Same Navbar zoom-in-area toggle as StatisticsMapPanel — always start
  // visible on mount so a hide left on a different page never carries over.
  const dispatch = useAppDispatch()
  const searchOpen = useAppSelector((state) => state.layout.map_panels.open)
  useEffect(() => {
    dispatch(setMapPanelsOpen({ open: true }))
  }, [dispatch])

  // ค้นหาสายทาง — same live data (GET /analytic/departments/0/overview/central/list
  // ?scope=all) as the overview map, via the shared hook, so this sidebar and
  // /admin/statistics?incident always agree.
  const { routeItems } = useLiveIncidentRouteItems()

  const filteredRoutes = React.useMemo(() => {
    if (!searchText) return routeItems
    const keyword = searchText.toLowerCase()
    return routeItems
      .map((item) => ({
        ...item,
        sub3: item.sub3.filter(
          (sub) =>
            sub.label.toLowerCase().includes(keyword) ||
            sub.detail.some((d) => detailLabel(d).toLowerCase().includes(keyword))
        ),
      }))
      .filter((item) => item.name.toLowerCase().includes(keyword) || item.sub3.length > 0)
  }, [searchText, routeItems])

  const searchCardCollapse = (
    <Collapse
      ghost
      expandIcon={({ isActive }) => (
        <TbChevronDown
          size={20}
          style={{
            color: '#FCD116',
            transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      )}
      style={{ marginTop: 16 }}
      defaultActiveKey={routeParam ? [routeParam] : []}
      items={filteredRoutes.map((item) => {
        const key = routeKey(item)
        const noti = item.notiTotal ?? 0
        const bc = noti === 0 ? '#979797' : '#FCD116'
        return {
          key,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>{item.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: bc, width: 50, height: 22, borderRadius: 88, border: `1px solid ${bc}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: bc }} />
                  {noti}
                </span>
              </div>
            </div>
          ),
          style: { marginBottom: 4 },
          classNames: { header: 'rounded-lg bg-[#363636]' },
          styles: { header: { borderRadius: 8, paddingBlock: 12, paddingInline: 16 }, content: { padding: '8px 0 0 0' }, body: { padding: 0 } },
          children: (
            <Collapse
              ghost
              expandIcon={({ isActive }) => (
                <span style={{ marginLeft: 24 }}>
                  <TbChevronDown size={20} style={{ color: '#FCD116', transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </span>
              )}
              style={{ marginTop: 4 }}
              defaultActiveKey={routeParam === key ? [`${key}-sub`] : []}
              items={[{
                key: `${key}-sub`,
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>{item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: bc, width: 50, height: 22, borderRadius: 88, border: `1px solid ${bc}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: bc }} />
                        {noti}
                      </span>
                    </div>
                  </div>
                ),
                style: { marginBottom: 4 },
                classNames: { header: 'rounded-lg bg-[#4B4B4B]' },
                styles: { header: { borderRadius: 8, paddingBlock: 12, paddingInline: 16 }, body: { padding: 0 } },
                children: (
                  <Collapse
                    ghost
                    expandIcon={({ isActive }) => (
                      <span style={{ marginLeft: 56 }}>
                        <TbChevronDown size={20} style={{ color: '#FCD116', transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                      </span>
                    )}
                    style={{ marginTop: 4 }}
                    defaultActiveKey={
                      routeParam === key
                        ? item.sub3
                          .filter((sub) => sub.detail.some((d) => detailKey(d) === detailParam))
                          .map((sub) => `${key}-${sub.label}`)
                        : []
                    }
                    items={item.sub3.map((sub) => ({
                      key: `${key}-${sub.label}`,
                      label: (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>{sub.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: '#FCD116', flexShrink: 0, marginLeft: 8 }}>{sub.detail.length}</span>
                        </div>
                      ),
                      style: { marginBottom: 4 },
                      classNames: { header: 'rounded-lg' },
                      styles: { header: { borderRadius: 8, paddingBlock: 12, paddingInline: 16, backgroundColor: '#212121' }, content: { padding: '8px 0 0 0' }, body: { padding: 0 } },
                      children: (
                        <div style={{ marginTop: 4 }}>
                          {sub.detail.map((d) => {
                            const dKey = detailKey(d)
                            return (
                              <div
                                key={dKey}
                                onClick={() => router.push(`/admin/statistics/detail/incident?route=${encodeURIComponent(key)}&detail=${encodeURIComponent(dKey)}`)}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  width: '100%', backgroundColor: dKey === detailParam ? '#FCD11630' : '#000000',
                                  border: dKey === detailParam ? '1px solid #FCD116' : 'none',
                                  borderRadius: 8, paddingBlock: 12, paddingInline: 16, marginBottom: 4, cursor: 'pointer',
                                }}
                              >
                                <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0, paddingLeft: 36 }}>{detailLabel(d)}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                  {typeof d !== 'string' && d.is_online === false
                                    ? <img src="/atlas/images/statistics/iconnoconnect.png" alt="no connect" width={20} height={20} />
                                    : <img src="/atlas/images/statistics/iconconnect.png" alt="connected" width={20} height={20} />
                                  }
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ),
                    }))}
                  />
                ),
              }]}
            />
          ),
        }
      })}
    />
  )

  return (
    <>
      {/* ══ MOBILE: drawer search card — matches /admin/statistics?incident ══ */}
      <DrawerMapSearchCard>
        <SearchCard placeholder="ค้นหาสายทาง..." onChange={(value) => setSearchText(value)}>
          {searchCardCollapse}
        </SearchCard>
      </DrawerMapSearchCard>

      {/* ══ DESKTOP: collapsible SearchCard panel — xl+ only ══ */}
      <div className='relative shrink-0 max-xl:hidden self-stretch'>
        <div className={[
          'overflow-hidden transition-[width] duration-300 ease-in-out bg-(--dark-black) h-full',
          searchOpen ? 'w-[370px] rounded-lg' : 'w-0',
        ].join(' ')}>
          <div className='w-[370px] h-full overflow-y-auto'>
            <SearchCard placeholder="ค้นหาสายทาง..." onChange={(value) => setSearchText(value)} className="h-full">
              {searchCardCollapse}
            </SearchCard>
          </div>
        </div>
      </div>
    </>
  )
}

export default React.memo(IncidentDetailSidebar)
