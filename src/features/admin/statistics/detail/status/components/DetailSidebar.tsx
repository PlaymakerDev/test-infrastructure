"use client"
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TbChevronDown, TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand } from 'react-icons/tb'
import { Button, Collapse } from 'antd'
import { SearchCard } from '@/components/search-card'
import { useStatusDetailContext } from '../context'
import { useLiveStatusRouteItems } from '../../../data/useLiveStatusRouteItems'
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

interface DetailSidebarProps {
  fromDrawer?: boolean
}

const DetailSidebar: React.FC<DetailSidebarProps> = ({ fromDrawer = false }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const routeParam = searchParams.get('route') || ''
  const detailParam = searchParams.get('detail') || ''
  const { searchText, setSearchText, searchOpen, setSearchOpen } = useStatusDetailContext()
  const { routeItems } = useLiveStatusRouteItems()

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

  const collapseContent = (
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
        const badgeColor = noti === 0 ? '#979797' : '#FCD116'
        return {
        key,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>
              {item.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{
                fontSize: 12, fontWeight: 500, color: badgeColor,
                width: 50, height: 22, borderRadius: 88,
                border: `1px solid ${badgeColor}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: badgeColor }} />
                {noti}
              </span>
              {renderCount(item.count)}
            </div>
          </div>
        ),
        style: { marginBottom: 4 },
        classNames: { header: 'rounded-lg bg-[#363636]' },
        styles: {
          header: { borderRadius: 8, paddingBlock: 12, paddingInline: 16 },
          content: { padding: '8px 0 0 0' },
          body: { padding: 0 },
        },
        children: (
          <Collapse
            ghost
            expandIcon={({ isActive }) => (
              <span style={{ marginLeft: 24 }}>
                <TbChevronDown
                  size={20}
                  style={{
                    color: '#FCD116',
                    transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                />
              </span>
            )}
            style={{ marginTop: 4 }}
            defaultActiveKey={routeParam === key ? [`${key}-sub`] : []}
            items={[{
              key: `${key}-sub`,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>
                    {item.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 500, color: badgeColor,
                      width: 50, height: 22, borderRadius: 88,
                      border: `1px solid ${badgeColor}`,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: badgeColor }} />
                      {noti}
                    </span>
                    {renderCount(item.count)}
                  </div>
                </div>
              ),
              style: { marginBottom: 4 },
              classNames: { header: 'rounded-lg bg-[#4B4B4B]' },
              styles: {
                header: { borderRadius: 8, paddingBlock: 12, paddingInline: 16 },
                body: { padding: 0 },
              },
              children: (
                <div style={{ marginTop: 4 }}>
                  {item.sub3.map((sub) =>
                    sub.detail.map((d) => {
                      const dKey = detailKey(d)
                      const isActive = dKey === detailParam
                      const isOnline = typeof d === 'string' ? sub.connected : (d.connected ?? sub.connected)
                      return (
                        <div
                          key={`${key}-${sub.label}-${dKey}`}
                          onClick={() => router.push(`/admin/statistics/detail/status?route=${encodeURIComponent(key)}&detail=${encodeURIComponent(dKey)}`)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', borderRadius: 8,
                            paddingBlock: 12, paddingInline: 16, marginBottom: 4, cursor: 'pointer',
                            backgroundColor: isActive ? '#FCD11630' : '#212121',
                            border: isActive ? '1px solid #FCD116' : 'none',
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0, paddingLeft: 36 }}>
                            {detailLabel(d)}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            {isOnline ? (
                              <img src="/images/statistics/iconconnect.png" alt="connected" width={20} height={20} />
                            ) : (
                              <img src="/images/statistics/iconnoconnect.png" alt="no connect" width={20} height={20} />
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              ),
            }]}
          />
        ),
      }})}
    />
  )

  if (fromDrawer) {
    return (
      <div className='bg-(--dark-black) h-full'>
        <div className='w-full h-full overflow-y-auto'>
          <SearchCard placeholder="ค้นหาสายทาง..." onChange={(value) => setSearchText(value)}>
            {collapseContent}
          </SearchCard>
        </div>
      </div>
    )
  }

  return (
    <div className='shrink-0 max-xl:hidden' style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 370 }}>
      <div className={[
        'overflow-hidden transition-[width] duration-300 ease-in-out bg-(--dark-black) h-full',
        searchOpen ? 'w-[370px] rounded-lg' : 'w-0',
      ].join(' ')}>
        <div className='w-[370px] h-full overflow-y-auto'>
          <SearchCard placeholder="ค้นหาสายทาง..." onChange={(value) => setSearchText(value)}>
            {collapseContent}
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

export default React.memo(DetailSidebar)
