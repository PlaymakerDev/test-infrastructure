"use client"
import React from 'react'
import styles from './alertHistory.module.css'

const HeaderAlertHistory: React.FC = () => {
  return (
    <div className={styles.header}>
      <span className={styles.headerTitle}>Alert History</span>
    </div>
  )
}

export default React.memo(HeaderAlertHistory)
