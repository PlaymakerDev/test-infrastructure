"use client"
import React, { useState } from 'react'
import styles from './vms.module.css'

const TABS = ['Map', 'Time1', 'Time2', 'Text']

const DisplayFormatVms: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Map')
  const [durations, setDurations] = useState(['5', '5', '5', '5'])
  const [text, setText] = useState('กรมทางหลวงชนบท เชื่อมโยงทั่วไทย เชื่อมใจคนทั้งชาติ')

  return (
    <div className={styles.formatPanel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F8C318" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </span>
        <span className={styles.panelTitle}>รูปแบบการแสดงผล</span>
      </div>

      <div className={styles.formatTabs}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`${styles.formatTab} ${activeTab === tab ? styles.formatTabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
        <button className={styles.formatTabAdd} style={{ border: 'none', background: '#0052cc', color: '#fff' }}>+</button>
      </div>

      <div className={styles.formatDurations}>
        {durations.map((d, i) => (
          <input
            key={i}
            className={styles.durationInput}
            value={d}
            onChange={e => setDurations(prev => prev.map((v, j) => j === i ? e.target.value : v))}
          />
        ))}
      </div>

      <div className={styles.formatTextLabel}>ข้อความด้านล่าง</div>
      <textarea
        className={styles.formatTextarea}
        value={text}
        onChange={e => setText(e.target.value)}
        rows={2}
      />
    </div>
  )
}

export default React.memo(DisplayFormatVms)
