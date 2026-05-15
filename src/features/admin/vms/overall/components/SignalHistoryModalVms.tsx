"use client"
import React from 'react'
import styles from './vms.module.css'

export type SignalEvent = {
  id: string
  timestamp: string
  status: 'online' | 'offline'
  duration?: string
  note?: string
}

export type SignalHistoryTarget = {
  routeName: string
  online: number
  offline?: number
}

interface Props {
  target: SignalHistoryTarget | null
  onClose: () => void
}

const MOCK_HISTORY: Record<string, SignalEvent[]> = {
  default: [
    { id: '1', timestamp: '20 เม.ย. 2569  14:32',  status: 'offline', note: 'ขาดการเชื่อมต่อ' },
    { id: '2', timestamp: '20 เม.ย. 2569  11:05',  status: 'online',  duration: '3 ชม. 27 นาที' },
    { id: '3', timestamp: '20 เม.ย. 2569  08:45',  status: 'offline', note: 'ไฟดับชั่วคราว', duration: '2 ชม. 20 นาที' },
    { id: '4', timestamp: '19 เม.ย. 2569  21:10',  status: 'online',  duration: '11 ชม. 35 นาที' },
    { id: '5', timestamp: '19 เม.ย. 2569  18:22',  status: 'offline', note: 'ขาดการเชื่อมต่อ', duration: '2 ชม. 48 นาที' },
    { id: '6', timestamp: '19 เม.ย. 2569  09:00',  status: 'online',  duration: '9 ชม. 22 นาที' },
    { id: '7', timestamp: '18 เม.ย. 2569  22:14',  status: 'offline', note: 'บำรุงรักษา',      duration: '10 ชม. 46 นาที' },
    { id: '8', timestamp: '18 เม.ย. 2569  08:00',  status: 'online',  duration: '14 ชม. 14 นาที' },
  ],
}

const SignalHistoryModalVms: React.FC<Props> = ({ target, onClose }) => {
  if (!target) return null

  const events = MOCK_HISTORY.default

  const totalOnline  = events.filter(e => e.status === 'online').length
  const totalOffline = events.filter(e => e.status === 'offline').length

  return (
    <div className={styles.signalModalOverlay} onClick={onClose}>
      <div className={styles.signalModal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.signalModalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F8C318" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span className={styles.signalModalTitle}>ประวัติสัญญาณ</span>
            <span className={styles.signalModalRoute}>{target.routeName}</span>
          </div>
          <button className={styles.signalModalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Summary pills */}
        <div className={styles.signalModalSummary}>
          <div className={`${styles.signalSummaryPill} ${styles.signalSummaryOnline}`}>
            <span className={styles.signalSummaryDot} style={{ background: '#05F2DB', boxShadow: '0 0 5px #05F2DB' }} />
            ออนไลน์ {totalOnline} ครั้ง
          </div>
          <div className={`${styles.signalSummaryPill} ${styles.signalSummaryOffline}`}>
            <span className={styles.signalSummaryDot} style={{ background: '#e63946', boxShadow: '0 0 5px #e63946' }} />
            ออฟไลน์ {totalOffline} ครั้ง
          </div>
          <span className={styles.signalSummaryNote}>ย้อนหลัง 7 วัน</span>
        </div>

        {/* Timeline */}
        <div className={styles.signalTimeline}>
          {events.map((ev, idx) => (
            <div key={ev.id} className={styles.signalTimelineItem}>
              <div className={styles.signalTimelineTrack}>
                <div
                  className={styles.signalTimelineDot}
                  style={{
                    background: ev.status === 'online' ? '#05F2DB' : '#e63946',
                    boxShadow: ev.status === 'online' ? '0 0 6px #05F2DB' : '0 0 6px #e63946',
                  }}
                />
                {idx < events.length - 1 && <div className={styles.signalTimelineLine} />}
              </div>

              <div className={styles.signalTimelineContent}>
                <div className={styles.signalTimelineTop}>
                  <span
                    className={styles.signalTimelineStatus}
                    style={{ color: ev.status === 'online' ? '#05F2DB' : '#e63946' }}
                  >
                    {ev.status === 'online' ? 'ออนไลน์' : 'ออฟไลน์'}
                  </span>
                  {ev.note && (
                    <span className={styles.signalTimelineNote}>{ev.note}</span>
                  )}
                </div>
                <div className={styles.signalTimelineTime}>{ev.timestamp}</div>
                {ev.duration && (
                  <div className={styles.signalTimelineDuration}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8c8c9e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    ระยะเวลา {ev.duration}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default React.memo(SignalHistoryModalVms)
