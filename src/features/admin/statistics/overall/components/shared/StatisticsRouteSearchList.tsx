"use client"
import React, { useMemo } from 'react'
import { Collapse } from 'antd'
import { TbChevronDown } from 'react-icons/tb'
import { detailKey, detailLabel, routeKey, type RouteItem } from '../../../data/routeItems'

const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? ''

interface StatisticsRouteSearchListProps {
  routeItems: RouteItem[]
  selectedRoute: string
  selectedDetail: string
  onSelect: (route: string, detail: string) => void
}

const renderCount = (count?: string) => {
  if (!count) return null
  const [left, right] = count.split('/')
  const online = Number.parseInt(left, 10)
  const total = Number.parseInt(right, 10)
  if (online === total) return <span style={{ fontSize: "var(--fs-12)", fontWeight: 500, color: '#FFFFFF', width: 28, textAlign: 'right' }}>{count}</span>
  if (online === 0) return <span style={{ fontSize: "var(--fs-12)", fontWeight: 500, color: '#E94C4C', width: 28, textAlign: 'right' }}>{count}</span>
  return (
    <span style={{ fontSize: "var(--fs-12)", fontWeight: 500, width: 28, textAlign: 'right' }}>
      <span style={{ color: '#05F2DB' }}>{left}</span>
      <span style={{ color: '#FCD116' }}>/{right}</span>
    </span>
  )
}

const renderBadge = (value: number, color: string, maxChars: number) => (
  <span
    style={{
      fontSize: "var(--fs-12)",
      fontWeight: 500,
      fontVariantNumeric: 'tabular-nums',
      color,
      minWidth: `calc(${maxChars}ch + 30px)`,
      height: 22,
      borderRadius: 88,
      border: `1px solid ${color}`,
      boxSizing: 'border-box',
      paddingInline: 8,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    }}
  >
    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
    {value}
  </span>
)

/**
 * The route picker used by every Statistics detail view. It mirrors the
 * hierarchy and styling of the picker over the Statistics overview map:
 * bureau → department → device, with the same notification and connection
 * counts. Keeping it shared prevents detail pages from drifting visually.
 */
const StatisticsRouteSearchList: React.FC<StatisticsRouteSearchListProps> = ({
  routeItems,
  selectedRoute,
  selectedDetail,
  onSelect,
}) => {
  const maxBureauBadgeChars = useMemo(
    () => Math.max(1, ...routeItems.map((item) => String(item.notiTotal ?? 0).length)),
    [routeItems],
  )
  const maxDepartmentBadgeChars = useMemo(
    () => Math.max(1, ...routeItems.flatMap((item) => item.sub3.map((sub) => String(sub.notiTotal ?? 0).length))),
    [routeItems],
  )

  return (
    <Collapse
      ghost
      expandIcon={({ isActive }) => (
        <TbChevronDown
          size={20}
          style={{ color: '#FCD116', transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        />
      )}
      style={{ marginTop: 16 }}
      defaultActiveKey={selectedRoute ? [selectedRoute] : []}
      items={routeItems.map((item) => {
        const key = routeKey(item)
        const noti = item.notiTotal ?? 0
        const badgeColor = noti === 0 ? '#979797' : '#FCD116'
        return {
          key,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ fontSize: "var(--fs-12)", fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>{item.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {renderBadge(noti, badgeColor, maxBureauBadgeChars)}
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
              defaultActiveKey={
                selectedRoute === key
                  ? item.sub3.filter((sub) => sub.detail.some((detail) => detailKey(detail) === selectedDetail)).map((sub) => `${key}-${sub.label}`)
                  : []
              }
              items={item.sub3.map((sub) => {
                const subNoti = sub.notiTotal ?? 0
                const subBadgeColor = subNoti === 0 ? '#979797' : '#FCD116'
                return {
                  key: `${key}-${sub.label}`,
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: "var(--fs-12)", fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>{sub.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                        {renderBadge(subNoti, subBadgeColor, maxDepartmentBadgeChars)}
                        {renderCount(sub.count)}
                      </div>
                    </div>
                  ),
                  style: { marginBottom: 4 },
                  classNames: { header: 'rounded-lg bg-[#4B4B4B]' },
                  styles: { header: { borderRadius: 8, paddingBlock: 12, paddingInline: 16 }, content: { padding: '8px 0 0 0' }, body: { padding: 0 } },
                  children: (
                    <div style={{ marginTop: 4 }}>
                      {sub.detail.map((detail) => {
                        const detailId = detailKey(detail)
                        const isOnline = typeof detail === 'string' ? sub.connected : (detail.connected ?? detail.is_online ?? sub.connected)
                        const isSelected = selectedRoute === key && selectedDetail === detailId
                        return (
                          <div
                            key={detailId}
                            onClick={() => onSelect(key, detailId)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                              backgroundColor: isSelected ? '#FCD11630' : '#000000',
                              border: isSelected ? '1px solid #FCD116' : 'none',
                              borderRadius: 8, paddingBlock: 12, paddingInline: 16, marginBottom: 4, cursor: 'pointer',
                            }}
                          >
                            <span style={{ fontSize: "var(--fs-12)", fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0, paddingLeft: 36 }}>{detailLabel(detail)}</span>
                            <img
                              src={`${BASE_PATH}/images/statistics/${isOnline ? 'iconconnect.png' : 'iconnoconnect.png'}`}
                              alt={isOnline ? 'connected' : 'disconnected'}
                              width={20}
                              height={20}
                            />
                          </div>
                        )
                      })}
                    </div>
                  ),
                }
              })}
            />
          ),
        }
      })}
    />
  )
}

export default React.memo(StatisticsRouteSearchList)
