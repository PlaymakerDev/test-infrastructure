"use client"
import React, { useState } from 'react'
import { TbChevronDown, TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand, TbLayoutSidebarRightCollapse, TbLayoutSidebarRightExpand } from 'react-icons/tb'
import { Button, Collapse } from 'antd'
import { useRouter } from 'next/navigation'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { SearchCard } from '@/components/search-card'
import DrawerMapSearchCard from './DrawerMapSearchCard'
import { ROUTE_ITEMS } from '../../../data/routeItems'

export interface StatCard {
  borderColor: string
  icon: string
  label: string
  labelColor: string
  value: string
  unit?: string
  sub: string
}

export interface StatisticsMapPanelProps {
  markerColor?: string
  markerAltColor?: string
  markerTextColor?: string
  markerShadowColor?: string
  detailUrl?: string
  onMarkerClick?: (item: (typeof ROUTE_ITEMS)[number]) => void
  searchText?: string
  onSearchChange?: (value: string) => void
  statsCards?: StatCard[]
  hideIndexBadge?: boolean
  hideCount?: boolean
  markerColorFn?: (item: (typeof ROUTE_ITEMS)[number], index: number) => string
  markerLabelFn?: (item: (typeof ROUTE_ITEMS)[number], index: number) => string | number
  badgeColorFn?: (item: (typeof ROUTE_ITEMS)[number], index: number) => string
}

const renderCount = (count: string) => {
  const [left, right] = count.split('/')
  const l = parseInt(left, 10)
  const r = parseInt(right, 10)
  if (l === r) return <span style={{ fontSize: 12, fontWeight: 500, color: '#FFFFFF', width: 28, textAlign: 'right' }}>{count}</span>
  if (l === 0) return <span style={{ fontSize: 12, fontWeight: 500, color: '#E94C4C', width: 28, textAlign: 'right' }}>{count}</span>
  return (
    <span style={{ fontSize: 12, fontWeight: 500, width: 28, textAlign: 'right' }}>
      <span style={{ color: '#05F2DB' }}>{left}</span>
      <span style={{ color: '#FCD116' }}>/{right}</span>
    </span>
  )
}

const StatisticsMapPanel: React.FC<StatisticsMapPanelProps> = ({
  markerColor = '#B2FF00',
  markerAltColor,
  markerTextColor = '#000000',
  markerShadowColor = 'rgba(178, 255, 0, 0.5)',
  detailUrl = '/admin/statistics/detail/status',
  onMarkerClick,
  searchText = '',
  onSearchChange,
  statsCards,
  hideIndexBadge = false,
  hideCount = false,
  markerColorFn,
  markerLabelFn,
  badgeColorFn,
}) => {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(true)
  const [cardsOpen, setCardsOpen] = useState(true)

  const filteredRoutes = React.useMemo(() => {
    if (!searchText) return ROUTE_ITEMS
    const keyword = searchText.toLowerCase()
    return ROUTE_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.sub3.some((sub) => sub.label.toLowerCase().includes(keyword) || sub.detail.some((d) => d.toLowerCase().includes(keyword)))
    )
  }, [searchText])

  const handleMarkerClick = (item: (typeof ROUTE_ITEMS)[number]) => {
    if (onMarkerClick) {
      onMarkerClick(item)
    } else {
      router.push(`${detailUrl}?route=${encodeURIComponent(item.name)}`)
    }
  }

  const searchCardCollapse = (
    <Collapse
                ghost
                expandIcon={({ isActive }) => (
                  <TbChevronDown size={20} style={{ color: '#FCD116', transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                )}
                style={{ marginTop: 16 }}
                items={filteredRoutes.map((item, index) => ({
                  key: item.name,
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>{item.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {!hideIndexBadge && (() => {
                          const badgeColor = badgeColorFn
                            ? badgeColorFn(item, index)
                            : item.sub3.length === 0 ? '#979797' : item.sub3.length > 263 ? '#E94C4C' : '#B2FF00'
                          return (
                            <span style={{ fontSize: 12, fontWeight: 500, color: badgeColor, width: 50, height: 22, borderRadius: 88, border: `1px solid ${badgeColor}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: badgeColor }} />
                              {item.sub3.length}
                            </span>
                          )
                        })()}
                        {!hideCount && renderCount(item.count)}
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
                      items={[{
                        key: `${item.name}-sub`,
                        label: (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>{item.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              {!hideIndexBadge && (() => {
                                const bc = badgeColorFn
                                  ? badgeColorFn(item, index)
                                  : item.sub3.length === 0 ? '#979797' : item.sub3.length > 263 ? '#E94C4C' : '#B2FF00'
                                return (
                                  <span style={{ fontSize: 12, fontWeight: 500, color: bc, width: 50, height: 22, borderRadius: 88, border: `1px solid ${bc}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: bc }} />
                                    {item.sub3.length}
                                  </span>
                                )
                              })()}
                              {!hideCount && renderCount(`${item.sub3.filter(s => s.connected).length}/${item.sub3.length}`)}
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
                            items={item.sub3.filter((sub) => sub.connected).map((sub) => ({
                              key: `${item.name}-${sub.label}`,
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
                                  {sub.detail.map((d) => (
                                    <div
                                      key={d}
                                      onClick={() => router.push(`${detailUrl}?route=${encodeURIComponent(item.name)}&detail=${encodeURIComponent(d)}`)}
                                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: '#000000', borderRadius: 8, paddingBlock: 12, paddingInline: 16, marginBottom: 4, cursor: 'pointer' }}
                                    >
                                      <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0, paddingLeft: 36 }}>{d}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                        <img src="/images/statistics/iconconnect.png" alt="connected" width={20} height={20} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ),
                            }))}
                          />
                        ),
                      }]}
                    />
                  ),
                }))}
              />
  )

  return (
    <>
      {/* ══ MOBILE: drawer search card — outside flex to escape map stacking context ══ */}
      <DrawerMapSearchCard>
        <SearchCard placeholder="ค้นหาสายทาง..." onChange={(value) => onSearchChange?.(value)}>
          {searchCardCollapse}
        </SearchCard>
      </DrawerMapSearchCard>

      <div className="mt-8 overflow-hidden flex" style={{ height: 'calc(100vh - 200px)' }}>

        {/* ══ LEFT: collapsible SearchCard panel — xl+ only ══ */}
        <div className='relative shrink-0 max-xl:hidden self-stretch'>
          <div className={[
            'overflow-hidden transition-[width] duration-300 ease-in-out bg-(--dark-black) h-full',
            searchOpen ? 'w-[370px] rounded-lg' : 'w-0',
          ].join(' ')}>
            <div className='w-[370px] h-full overflow-y-auto'>
              <SearchCard placeholder="ค้นหาสายทาง..." onChange={(value) => onSearchChange?.(value)} className="h-full">
                {searchCardCollapse}
              </SearchCard>
            </div>
          </div>
          <Button
            type='primary' shape='circle'
            title={searchOpen ? 'ซ่อนรายการสายทาง' : 'แสดงรายการสายทาง'}
            icon={searchOpen ? <TbLayoutSidebarLeftCollapse className='fs-18' /> : <TbLayoutSidebarLeftExpand className='fs-18' />}
            onClick={() => setSearchOpen((prev) => !prev)}
            className='absolute! top-10 -right-5 z-20 w-10! h-10! shadow-lg'
          />
        </div>

        {/* ══ MAIN: map + stats cards ══ */}
        <div className='flex-1 min-w-0 relative overflow-hidden rounded-[20px]'>
          <BaseMap initialCenter={[102.0, 14.0]} initialZoom={4.8}>
            {filteredRoutes.map((item, index) => {
              const count = item.sub3.length
              const isOverflow = count > 263
              const bgColor = markerColorFn
                ? markerColorFn(item, index)
                : isOverflow ? '#E94C4C' : '#B2FF00'
              const shadow = bgColor === '#E94C4C' ? 'rgba(233,76,76,0.5)' : bgColor === '#FCD116' ? 'rgba(252,209,22,0.5)' : 'rgba(178,255,0,0.5)'
              return (
                <HTMLMarker key={item.name} lngLat={item.lngLat}>
                  <div
                    onClick={() => handleMarkerClick(item)}
                    style={{
                      width: 50, height: 50, borderRadius: '50%',
                      backgroundColor: bgColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: '#000000',
                      boxShadow: `0 0 12px ${shadow}`,
                      cursor: 'pointer',
                    }}
                  >
                    {markerLabelFn ? markerLabelFn(item, index) : isOverflow ? '263+' : count}
                  </div>
                </HTMLMarker>
              )
            })}
          </BaseMap>
          {statsCards && statsCards.length > 0 && (
            <>
              <Button
                type='primary' shape='circle'
                title={cardsOpen ? 'ซ่อนการ์ดสถิติ' : 'แสดงการ์ดสถิติ'}
                icon={cardsOpen ? <TbLayoutSidebarRightCollapse className='fs-18' /> : <TbLayoutSidebarRightExpand className='fs-18' />}
                onClick={() => setCardsOpen((prev) => !prev)}
                className={`absolute! top-3 z-20 w-10! h-10! shadow-lg transition-[right] duration-300 ease-in-out ${cardsOpen ? 'right-[208px] sm:right-[258px] lg:right-[318px]' : 'right-3'}`}
              />
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 pb-3 overflow-hidden transition-[width] duration-300 ease-in-out" style={{ width: cardsOpen ? undefined : 0 }}>
                <div className="flex flex-col gap-2 pb-3">
                  {statsCards.map((card, i) => (
                    <div key={i} className="w-[200px] sm:w-[250px] lg:w-[310px] h-[120px] sm:h-[145px] lg:h-[175px] rounded-[12px] border-2 border-solid bg-[#333333]/80 backdrop-blur-[10px] p-2.5 sm:p-3 lg:p-3.5 flex flex-col justify-between shrink-0" style={{ borderColor: card.borderColor }}>
                      <div className="flex flex-col gap-0.5 sm:gap-1">
                        <img src={card.icon} alt="" className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
                        <p className="text-[9px] sm:text-[10px] lg:text-sm font-bold m-0 leading-tight truncate" style={{ color: card.labelColor }}>{card.label}</p>
                      </div>
                      <div className="flex items-baseline gap-0.5 sm:gap-1">
                        <span className="text-base sm:text-lg lg:text-[28px] font-bold text-white leading-none">{card.value}</span>
                        {card.unit && <span className="text-[8px] sm:text-[9px] lg:text-xs text-white">{card.unit}</span>}
                      </div>
                      <p className="text-[8px] sm:text-[9px] lg:text-xs text-[#979797] m-0 truncate">{card.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default StatisticsMapPanel
