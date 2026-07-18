"use client"
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TbChevronDown, TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand } from 'react-icons/tb'
import { Button, Collapse } from 'antd'
import { SearchCard } from '@/components/search-card'
import { useAlertDetailContext } from '../context'
import { useLiveAlertRouteItems } from '../../../data/useLiveAlertRouteItems'
import { routeKey, detailLabel, detailKey } from '../../../data/routeItems'

const renderCount = (count: string) => {
  const [left, right] = count.split('/')
  const l = parseInt(left, 10)
  const r = parseInt(right, 10)
  if (l === r) {
    return <span style={{ fontSize: 12, fontWeight: 500, color: '#FFFFFF', width: 28, textAlign: 'right' }}>{count}</span>
  }
  if (l === 0) {
    return <span style={{ fontSize: 12, fontWeight: 500, color: '#E94C4C', width: 28, textAlign: 'right' }}>{count}</span>
  }
  return (
    <span style={{ fontSize: 12, fontWeight: 500, width: 28, textAlign: 'right' }}>
      <span style={{ color: '#05F2DB' }}>{left}</span>
      <span style={{ color: '#FCD116' }}>/{right}</span>
    </span>
  )
}

const AlertDetailSidebar: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const routeParam = searchParams.get('route') || ''
  const detailParam = searchParams.get('detail') || ''
  const { searchText, setSearchText, searchOpen, setSearchOpen } = useAlertDetailContext()

  const { routeItems } = useLiveAlertRouteItems()

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

  return (
    <div className='relative shrink-0'>
      <div className={[
        'overflow-hidden transition-[width] duration-300 ease-in-out bg-(--dark-black) h-full',
        searchOpen ? 'w-[370px] rounded-lg' : 'w-0',
      ].join(' ')}>
        <div className='w-[370px] h-full overflow-y-auto'>
          <SearchCard placeholder="ค้นหาสายทาง..." onChange={(value) => setSearchText(value)}>
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
                return {
                  key,
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>{item.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {renderCount(item.count)}
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
                              {renderCount(item.count)}
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
                            items={item.sub3.filter((sub) => sub.connected).map((sub) => ({
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
                                    const isOnline = typeof d === 'string' ? sub.connected : (d.connected ?? sub.connected)
                                    return (
                                      <div
                                        key={dKey}
                                        onClick={() => router.push(`/admin/statistics/detail/alert?route=${encodeURIComponent(key)}&detail=${encodeURIComponent(dKey)}`)}
                                        style={{
                                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                          width: '100%', backgroundColor: dKey === detailParam ? '#FCD11630' : '#000000',
                                          border: dKey === detailParam ? '1px solid #FCD116' : 'none',
                                          borderRadius: 8, paddingBlock: 12, paddingInline: 16, marginBottom: 4, cursor: 'pointer',
                                        }}
                                      >
                                        <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0, paddingLeft: 36 }}>{detailLabel(d)}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                          <img src={isOnline ? '/images/statistics/iconconnect.png' : '/images/statistics/iconnoconnect.png'} alt={isOnline ? 'connected' : 'disconnected'} width={20} height={20} />
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
          </SearchCard>
        </div>
      </div>

      <Button
        type='primary'
        shape='circle'
        title={searchOpen ? 'ซ่อนรายการสายทาง' : 'แสดงรายการสายทาง'}
        icon={searchOpen
          ? <TbLayoutSidebarLeftCollapse className='fs-18' />
          : <TbLayoutSidebarLeftExpand className='fs-18' />
        }
        onClick={() => setSearchOpen(!searchOpen)}
        className='absolute! top-10 -right-5 z-20 w-10! h-10! shadow-lg'
      />
    </div>
  )
}

export default React.memo(AlertDetailSidebar)
