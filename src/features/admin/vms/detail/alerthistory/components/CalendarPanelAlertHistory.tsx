"use client"
import React, { useState } from 'react'
import styles from './alertHistory.module.css'
import ModalAddCommand, { CommandEditData } from './ModalAddCommand'
import ModalDeleteCommand, { DeleteCommandData } from './ModalDeleteCommand'
import { TbEdit, TbTrash, TbWifi, TbHourglass } from 'react-icons/tb'

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

const DAY_HEADERS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']

const EVENT_DAYS = [8, 12, 23]

const SCHEDULE_ITEMS = [
  {
    id: '1',
    timeRange: '16:00 - 24:00',
    date: '23 เม.ย. 2569',
    route: 'ฉช.4050',
    sign: 'VMS >> ฉช.4050 จุดที่ 1',
    anydesk: '1194336831',
    online: true,
    duration: '3 วัน',
    category: 'การท่องเที่ยว',
    agency: 'แขวงทางหลวงชนบทฉะเชิงเทรา',
  },
  {
    id: '2',
    timeRange: '16:00 - 24:00',
    date: '23 เม.ย. 2569',
    route: 'ฉช.4050',
    sign: 'VMS >> ฉช.4050 จุดที่ 2',
    anydesk: '1150133823',
    online: true,
    duration: '3 วัน',
    category: 'การท่องเที่ยว',
    agency: 'แขวงทางหลวงชนบทฉะเชิงเทรา',
  },
]

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  const remaining = (7 - (days.length % 7)) % 7
  for (let i = 0; i < remaining; i++) days.push(null)
  return days
}


const CalendarPanelAlertHistory: React.FC = () => {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<CommandEditData | undefined>(undefined)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteData, setDeleteData] = useState<DeleteCommandData | undefined>(undefined)

  const openAdd = () => { setEditData(undefined); setModalOpen(true) }
  const openEdit = (item: typeof SCHEDULE_ITEMS[0]) => {
    setEditData({ installPoint: item.sign })
    setModalOpen(true)
  }
  const openDelete = (item: typeof SCHEDULE_ITEMS[0]) => {
    setDeleteData({ sign: item.sign, category: item.category, agency: item.agency, date: item.date, timeRange: item.timeRange, duration: item.duration })
    setDeleteOpen(true)
  }

  const days = buildCalendarDays(viewYear, viewMonth)
  const thaiYear = viewYear + 543

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const isToday = (day: number) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear()

  return (
    <>
    <div className={styles.calendarPanelWrap}>
      {/* Calendar Card */}
      <div className={styles.calendarCard}>
        <div className={styles.calendarNav}>
          <button className={styles.calNavBtn} onClick={prevMonth}>←</button>
          <span className={styles.calMonthTitle}>
            {THAI_MONTHS[viewMonth]} {thaiYear}
          </span>
          <button className={styles.calNavBtn} onClick={nextMonth}>→</button>
        </div>

        <div className={styles.calDayHeaders}>
          {DAY_HEADERS.map(h => (
            <div key={h} className={styles.calDayHeader}>{h}</div>
          ))}
        </div>

        <div className={styles.calDays}>
          {days.map((day, i) => (
            <div
              key={i}
              className={[
                styles.calDay,
                day === null ? styles.calDayEmpty : '',
                day !== null && isToday(day) ? styles.calDayToday : '',
                day !== null && !isToday(day) && EVENT_DAYS.includes(day) ? styles.calDayHasEvent : '',
              ].filter(Boolean).join(' ')}
            >
              {day ?? ''}
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Section */}
      <div className={styles.scheduleSection}>
        <div className={styles.scheduleSectionTitle}>ตารางเวลาเดือนนี้</div>

        <div className={styles.schedulePills}>
          <span className={styles.pillGreen}>5 จุดติดตั้ง</span>
          <span className={styles.pillGreen}>3 คำสั่ง</span>
          <button className={styles.pillAddCmd} onClick={openAdd}>+ เพิ่มคำสั่ง</button>
        </div>

        <div className={styles.scheduleList}>
          {SCHEDULE_ITEMS.map(item => (
            <div key={item.id} className={styles.scheduleCard}>
              <div className={styles.scheduleCardTopRow}>
                <span className={styles.scheduleTime}>{item.timeRange}</span>
                <div className={styles.scheduleCardActions}>
                  <button className={styles.scheduleActionBtn} onClick={() => openEdit(item)}><TbEdit size={14} color="#F8C318" /></button>
                  <button className={styles.scheduleActionBtn} onClick={() => openDelete(item)}><TbTrash size={14} color="#e63946" /></button>
                </div>
              </div>

              <div className={styles.scheduleDate}>{item.date}</div>

              <div className={styles.scheduleMeta}>
                <span className={styles.scheduleMetaLabel}>สายทาง : </span>{item.route}<br />
                <span className={styles.scheduleMetaLabel}>จุดติดตั้ง : </span>{item.sign}<br />
                <span className={styles.scheduleMetaLabel}>Anydesk : </span>{item.anydesk}
                {item.online && (
                  <span style={{ marginLeft: 6, color: '#00e27a', fontSize: 10 }}>●</span>
                )}
              </div>

              <div className={styles.scheduleBadgeRow}>
                {item.online && (
                  <span className={styles.scheduleBadgeOnline}>
                    <TbWifi size={14} /> ออนไลน์
                  </span>
                )}
                <span className={styles.scheduleBadgeDays}>
                  <TbHourglass size={13} />
                  {item.duration}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
      <ModalAddCommand open={modalOpen} onClose={() => setModalOpen(false)} editData={editData} />
      <ModalDeleteCommand open={deleteOpen} onClose={() => setDeleteOpen(false)} data={deleteData} />
    </>
  )
}

export default React.memo(CalendarPanelAlertHistory)
