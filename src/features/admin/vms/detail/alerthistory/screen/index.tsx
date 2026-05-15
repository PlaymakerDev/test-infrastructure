"use client"
import React from 'react'
import styles from '../components/alertHistory.module.css'
import StatsCardsAlertHistory from '../components/StatsCardsAlertHistory'
import TableAlertHistory from '../components/TableAlertHistory'
import CalendarPanelAlertHistory from '../components/CalendarPanelAlertHistory'

const AlertHistoryScreen: React.FC = () => {
  return (
    <div>
      <div className={styles.body}>
        <div className={styles.leftPanel}>
          <StatsCardsAlertHistory />
          <TableAlertHistory />
        </div>
        <div className={styles.rightPanel}>
          <CalendarPanelAlertHistory />
        </div>
      </div>
    </div>
  )
}

export default React.memo(AlertHistoryScreen)
