"use client"
import React, { useMemo, useState } from 'react'
import styles from '@/features/admin/vms/overall/components/vms.module.css'

// ─── Types (export เพื่อให้ module อื่น import ไปกำหนดข้อมูล) ───────────────

export interface SidebarDot {
  variant: 'teal' | 'red' | 'yellow' | 'green'
  count: string
}

export interface SidebarSign {
  id: string
  name: string
  anydesk: string
  online: boolean
  hasDisplay: boolean
}

export interface SidebarRoute {
  id: string
  name: string
  dots: SidebarDot[]
  signs: SidebarSign[]
  defaultExpanded?: boolean
}

export interface SidebarVmsProps {
  routes: SidebarRoute[]
  selectedSignId?: string
  onSignSelect?: (sign: SidebarSign, routeId: string) => void
  onSelectAll?: () => void
  renderThumbnail?: (sign: SidebarSign) => React.ReactNode
  searchPlaceholder?: string
  helpTitle?: string
  helpText?: string
  selectLabel?: string
  selectAllLabel?: string
}

// ─── Internal helpers ────────────────────────────────────────────────────────

const DOT_CLASS: Record<SidebarDot['variant'], string> = {
  green: '',
  yellow: '',
  red: styles.pillRed,
  teal: styles.pillTeal,
}

// ─── Component ───────────────────────────────────────────────────────────────

const SidebarVms: React.FC<SidebarVmsProps> = ({
  routes,
  selectedSignId,
  onSignSelect,
  onSelectAll,
  renderThumbnail,
  searchPlaceholder = 'ค้นหาสายทาง...',
  helpTitle = 'เลือกป้ายที่ต้องการควบคุมแสดงผล',
  helpText = 'สามารถเลือกรูปแบบป้ายแสดงผลได้ทั้งแบบรายป้ายหรือทั้งหมดตามต้องการ',
  selectLabel = 'เลือก',
  selectAllLabel = 'เลือกทั้งหมด',
}) => {
  const [search, setSearch] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(routes.filter(r => r.defaultExpanded).map(r => r.id))
  )

  const toggleRoute = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return routes
    return routes
      .map(route => ({
        ...route,
        signs: route.signs.filter(s => s.name.toLowerCase().includes(q)),
      }))
      .filter(route =>
        route.name.toLowerCase().includes(q) || route.signs.length > 0
      )
  }, [search, routes])

  return (
    <>
      <div className={styles.sidebarSearch}>
        <div className={styles.searchRow}>
          <span className={styles.searchIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            className={styles.searchInput}
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {(helpTitle || helpText) && (
          <p className={styles.searchDesc}>
            {helpTitle && <span className={styles.searchDescBold}>{helpTitle}</span>}
            {helpTitle && helpText && <br />}
            {helpText}
          </p>
        )}
      </div>

      <div className={styles.routeListHeader}>
        <span>{selectLabel}</span>
        <span className={styles.routeListHeaderRight} onClick={onSelectAll} style={{ cursor: onSelectAll ? 'pointer' : 'default' }}>
          {selectAllLabel}
        </span>
      </div>

      <div>
        {filtered.map(route => {
          const isExpanded = expandedIds.has(route.id)
          return (
            <div key={route.id} className={`${styles.routeGroup} ${isExpanded ? styles.routeGroupActive : ''}`}>
              <div
                className={`${styles.routeGroupRow} ${isExpanded ? styles.routeGroupRowActive : ''}`}
                onClick={() => toggleRoute(route.id)}
              >
                <span className={`${styles.routeGroupChevron} ${isExpanded ? styles.routeGroupChevronOpen : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
                <span className={`${styles.routeGroupName} ${isExpanded ? styles.routeGroupNameActive : ''}`}>
                  {route.name}
                </span>
                <div className={styles.routeDots}>
                  {route.dots.map((d, i) => (
                    <div key={i} className={`${styles.pillWrap} ${DOT_CLASS[d.variant] || ''}`}>
                      <div className={styles.pillDot} />
                      {d.count}
                    </div>
                  ))}
                </div>
              </div>

              {isExpanded && route.signs.length > 0 && (
                <div className={styles.signItems}>
                  {route.signs.map(sign => {
                    const isActive = sign.id === selectedSignId
                    return (
                      <div
                        key={sign.id}
                        className={`${styles.signItem} ${isActive ? styles.signItemActive : ''}`}
                        onClick={() => onSignSelect?.(sign, route.id)}
                        style={{ cursor: onSignSelect ? 'pointer' : 'default' }}
                      >
                        {renderThumbnail?.(sign)}
                        <div className={styles.signItemInfo}>
                          <div className={`${styles.signItemName} ${isActive ? styles.signItemNameActive : ''}`}>
                            {sign.name}
                          </div>
                          <div className={styles.signItemAnydesk}>{sign.anydesk}</div>
                        </div>
                        <div className={`${styles.signItemStatus} ${sign.online ? styles.signItemOnline : styles.signItemOffline}`} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

export default React.memo(SidebarVms)
