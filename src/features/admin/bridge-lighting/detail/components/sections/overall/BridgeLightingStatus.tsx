"use client"
import { ArrowDownOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { AnimatePresence, motion } from 'motion/react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { TbBulb, TbBulbOff, TbLoader2, TbSparkles } from 'react-icons/tb'
import dayjs from 'dayjs'
import FormUpdateBridgeLightingStatus from './FormUpdateBridgeLightingStatus'
import {
  APIResponseBridgeLightingWID,
  APIResponsePostShellyStatus,
} from '@/types/bridge-lighting/overall-api'

interface Props {
  widData?: APIResponseBridgeLightingWID
  shellyStatusData?: APIResponsePostShellyStatus
  isShellyStatusSuccess?: boolean
}

// Colour code approved by Keng 2026-07-18:
//   OFF (light off)  → #FCD116 yellow (accent to draw attention: state changed)
//   ON  (light on)   → #66AEFF blue   (calm, matches --default-blue token)
const ON_COLOR = '#66AEFF'
const OFF_COLOR = '#FCD116'

/** Bottom-left status card + remote ON/OFF form. Extra behaviours added
 *  after the 2026-07-18 review:
 *    - Colour-codes the current state (yellow=OFF, blue=ON) with an icon.
 *    - Watches the shelly-status poll (5 s) and shows a "กำลังดำเนินการ…"
 *      overlay from the moment the form is submitted until the reported
 *      output flips to the target state. `pendingTarget` is stored in a
 *      ref so the overlay survives a re-render of the poll payload. */
const BridgeLightingStatus: React.FC<Props> = ({
  widData,
  shellyStatusData,
  isShellyStatusSuccess,
}) => {
  const [editMode, setEditMode] = useState(false)
  const [pendingTarget, setPendingTarget] = useState<boolean | null>(null)
  const pendingSinceRef = useRef<number | null>(null)

  // `?.[0]` on the array — the shelly endpoint returns `data: null` for
  // never-connected wids (e.g. wid 1901); `data[0]` would crash on null.
  const shellyStatus = shellyStatusData?.data?.[0]
  const isOn = !!shellyStatus?.output

  // Clear the pending overlay once the poll reports the target state.
  // Also auto-clear after 30 s to avoid leaving a stuck overlay if the
  // upstream never applied the command.
  useEffect(() => {
    if (pendingTarget == null) return
    if (isOn === pendingTarget) {
      setPendingTarget(null)
      pendingSinceRef.current = null
    }
  }, [isOn, pendingTarget])
  useEffect(() => {
    if (pendingTarget == null) return
    const since = pendingSinceRef.current ?? Date.now()
    pendingSinceRef.current = since
    const t = setTimeout(() => {
      setPendingTarget(null)
      pendingSinceRef.current = null
    }, 30_000)
    return () => clearTimeout(t)
  }, [pendingTarget])

  const stateLabel = isOn ? 'เปิดไฟประดับสะพาน' : 'ปิดไฟประดับสะพาน'
  const stateColor = isOn ? ON_COLOR : OFF_COLOR
  const stateIcon = isOn ? <TbBulb size={22} /> : <TbBulbOff size={22} />

  const lastUpdate = useMemo(() => {
    if (!shellyStatus?.last_seen) return '—'
    return dayjs(shellyStatus.last_seen).format('DD MMM BBBB HH:mm:ss')
  }, [shellyStatus?.last_seen])

  if (!isShellyStatusSuccess) return null

  return (
    <div className='relative flex-1 min-h-0 flex flex-col bg-(--dark-black)/80 backdrop-blur-xs rounded-[20px] p-5'>
      {/* Status card — colour + icon adapt to current state. */}
      <section>
        <div
          className='flex-1 min-h-0 flex flex-col border-2 rounded-[20px] p-5 transition-colors'
          style={{
            borderColor: stateColor,
            background: `${stateColor}1A`,
          }}
        >
          <div className='flex items-start gap-2 mb-3'>
            <TbSparkles className='fs-22 shrink-0' style={{ color: stateColor }} />
            <h4 className='mb-0 text-white'>สถานะการทำงาน</h4>
          </div>
          <div className='flex items-center gap-3'>
            <div
              className='shrink-0 w-11 h-11 rounded-full flex items-center justify-center'
              style={{ background: `${stateColor}33`, color: stateColor }}
            >
              {stateIcon}
            </div>
            <div className='min-w-0'>
              <h3 className='mb-0' style={{ color: stateColor }}>
                {stateLabel}
              </h3>
              <p className='fs-12 text-gray-400 mb-0'>อัพเดตล่าสุด : {lastUpdate} น.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Remote command block. */}
      <section className='mt-5'>
        <div className='mb-3'>
          <h3 className='text-(--yellow) mb-0'>คำสั่งเปิด-ปิดระยะไกล</h3>
          <p className='fs-12 text-gray-400 mb-0'>
            การสั่งงานนี้อาจส่งผลต่ออุปกรณ์ไฟฟ้าและผู้ใช้งานในพื้นที่ กรุณาตรวจสอบความปลอดภัยก่อนดำเนินการทุกครั้ง
          </p>
        </div>

        <AnimatePresence mode='wait'>
          {!editMode ? (
            <motion.div
              key='toggle-btn'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                htmlType='button'
                type='primary'
                shape='circle'
                icon={<ArrowDownOutlined />}
                ghost
                onClick={() => setEditMode(true)}
              />
            </motion.div>
          ) : (
            <motion.div
              key='form'
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <FormUpdateBridgeLightingStatus
                widData={widData}
                shellyStatus={shellyStatus}
                editMode={editMode}
                setEditMode={setEditMode}
                onSubmitted={(nextIsOn) => setPendingTarget(nextIsOn)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Pending overlay — shows from submit until the poll confirms the
       *  new state (or 30 s timeout, whichever comes first). */}
      <AnimatePresence>
        {pendingTarget != null && (
          <motion.div
            key='pending'
            className='absolute inset-0 z-20 flex items-center justify-center rounded-[20px] bg-black/70 backdrop-blur-sm'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className='flex flex-col items-center gap-3 text-center px-6'>
              <TbLoader2 size={36} className='text-(--yellow) animate-spin' />
              <div className='fs-16 font-semibold text-white'>
                กำลังดำเนินการ…
              </div>
              <div className='fs-12 text-gray-300'>
                กำลังส่งคำสั่ง{pendingTarget ? 'เปิด' : 'ปิด'}ไฟประดับสะพาน
                <br />
                โปรดรอสักครู่จนกว่าจะเปลี่ยนคำสั่งสำเร็จ
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default React.memo(BridgeLightingStatus)
