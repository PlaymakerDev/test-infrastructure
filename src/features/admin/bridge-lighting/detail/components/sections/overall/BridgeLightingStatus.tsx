"use client"
import { ArrowDownOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { AnimatePresence, motion } from 'motion/react'
import React, { useEffect, useState } from 'react'
import { TbBulb, TbBulbOff, TbLoader2, TbSparkles } from 'react-icons/tb'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'
import { useQueryClient } from '@tanstack/react-query'
import { bridgeLightingDetailKeys } from '@/features/admin/bridge-lighting/detail/data/queryKeys'
import FormUpdateBridgeLightingStatus from './FormUpdateBridgeLightingStatus'
import {
  APIResponseBridgeLightingWID,
  APIResponsePostShellyStatus,
} from '@/types/bridge-lighting/overall-api'

dayjs.extend(relativeTime)

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
 *      output flips to the target state. `pending` (target + submit time)
 *      is set once at submit; whether the overlay is actually showing is a
 *      derived `isPending` check against the latest polled `isOn`. */
const BridgeLightingStatus: React.FC<Props> = ({
  widData,
  shellyStatusData,
  isShellyStatusSuccess,
}) => {
  const queryClient = useQueryClient()
  const [editMode, setEditMode] = useState(false)
  // Set atomically at the one place a new pending command actually starts
  // (the form's onSubmitted below) instead of lazily inside an effect —
  // avoids the react-hooks/set-state-in-effect violation a "sync pendingSince
  // once pendingTarget appears" effect would trigger.
  const [pending, setPending] = useState<{ target: boolean; since: number } | null>(null)
  const [nowTick, setNowTick] = useState<number>(() => Date.now())

  // `?.[0]` on the array — the shelly endpoint returns `data: null` for
  // never-connected wids (e.g. wid 1901); `data[0]` would crash on null.
  const shellyStatus = shellyStatusData?.data?.[0]
  const isOn = !!shellyStatus?.output

  // Second-resolution ticker for the "อัพเดตล่าสุด" indicator + pending
  // "รอมา N วิ" counter. Cheap — one setState per second, no cascade.
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1_000)
    return () => clearInterval(t)
  }, [])

  // True while the poll hasn't yet caught up to the submitted target —
  // derived directly instead of clearing `pending` via an effect that
  // watches `isOn` (would need a synchronous setState in the effect body).
  const isPending = pending != null && isOn !== pending.target

  // Auto-clear the pending overlay after 30 s so it never gets stuck if the
  // upstream never applies the command. Stops as soon as the poll confirms
  // the target state too, since `isPending` flips false then.
  useEffect(() => {
    if (!isPending) return
    const t = setTimeout(() => setPending(null), 30_000)
    return () => clearTimeout(t)
  }, [isPending])

  // Real-time push while the overlay is up — invalidate the shelly-status
  // query every 2 s so React Query refetches faster than the idle 5 s
  // interval. Layered on top of the hook's default cadence. Stops the
  // instant `isPending` flips false (poll confirmed or 30 s elapsed).
  useEffect(() => {
    if (!isPending) return
    const t = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: bridgeLightingDetailKeys.shellyStatus(),
      })
    }, 2_000)
    return () => clearInterval(t)
  }, [isPending, queryClient])

  const stateLabel = isOn ? 'เปิดไฟประดับสะพาน' : 'ปิดไฟประดับสะพาน'
  const stateColor = isOn ? ON_COLOR : OFF_COLOR
  const stateIcon = isOn ? <TbBulb size={22} /> : <TbBulbOff size={22} />

  // No useMemo: React Compiler auto-memoizes when `reactCompiler: true`
  // (next.config.ts) — manual deps on an optional-chained expression here
  // blocked the compiler ("could not preserve existing memoization").
  const lastUpdate = !shellyStatus?.last_seen
    ? '—'
    : dayjs(shellyStatus.last_seen).format('DD MMM BBBB HH:mm:ss')

  // Recomputed against the second-resolution ticker (nowTick) below so the
  // label updates live even without a fresh payload arriving.
  const lastUpdateRelative = !shellyStatus?.last_seen
    ? '—'
    : dayjs(shellyStatus.last_seen).locale('th').fromNow()
  void nowTick

  const pendingElapsedSec = pending != null ? Math.max(0, Math.floor((nowTick - pending.since) / 1000)) : 0

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
              className='shrink-0 w-11 h-11 rounded-full flex items-center justify-center relative'
              style={{ background: `${stateColor}33`, color: stateColor }}
            >
              {stateIcon}
              {/* Live-tracking pulse — signals that the card is polling. */}
              <span
                className='absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full'
                style={{ background: stateColor, boxShadow: `0 0 8px ${stateColor}` }}
              >
                <span
                  className='absolute inset-0 rounded-full animate-ping'
                  style={{ background: stateColor, opacity: 0.5 }}
                />
              </span>
            </div>
            <div className='min-w-0 flex-1'>
              <h3 className='mb-0' style={{ color: stateColor }}>
                {stateLabel}
              </h3>
              <p className='fs-12 text-gray-400 mb-0'>
                อัพเดตล่าสุด : {lastUpdateRelative}
                <span className='ml-2 text-gray-500'>({lastUpdate} น.)</span>
              </p>
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
                onSubmitted={(nextIsOn) => setPending({ target: nextIsOn, since: Date.now() })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Pending overlay — shows from submit until the poll confirms the
       *  new state (or 30 s timeout, whichever comes first). */}
      <AnimatePresence>
        {isPending && pending && (
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
                กำลังส่งคำสั่ง{pending.target ? 'เปิด' : 'ปิด'}ไฟประดับสะพาน
                <br />
                โปรดรอสักครู่จนกว่าจะเปลี่ยนคำสั่งสำเร็จ
              </div>
              <div className='fs-11 text-(--yellow) tabular-nums mt-1'>
                รอมา {pendingElapsedSec} วินาที · ตรวจสอบทุก 2 วินาที
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default React.memo(BridgeLightingStatus)
