"use client"
import React from 'react'
import styles from './alertHistory.module.css'

const StatsCardsAlertHistory: React.FC = () => {
  return (
    <div className={styles.statsRow}>
      {/* Card 1 — ตารางเวลา */}
      <div className={`${styles.statCard} ${styles.statCardGreen}`}>
        <div className={styles.statIcon}>
          {/* <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
          </svg> */}
        </div>
        <span className={styles.statLabel}>ตารางเวลา</span>
        <div className={styles.statValueRow}>
          <span className={styles.statValueNum}>16</span>
          <span className={styles.statValueUnit}>คำสั่งใหม่</span>
        </div>
        <span className={styles.statSub}>สกข. 1 (ปฐมธานี) (38.9%)</span>
      </div>

      {/* Card 2 — คำสั่งที่กำลังจะมาถึง */}
      <div className={styles.statCard}>
        <div className={styles.statIcon}>
          {/* <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg> */}
        </div>
        <span className={styles.statLabel}>คำสั่งที่กำลังจะมาถึง</span>
        <span className={styles.statValueLarge}>การท่องเที่ยว</span>
        <span className={styles.statSub}>VMS &gt;&gt; ฉช.4050 จุดที่ 1</span>
      </div>
    </div>
  )
}

export default React.memo(StatsCardsAlertHistory)
