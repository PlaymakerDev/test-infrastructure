"use client"
import React, { useCallback, useState } from 'react'
import { Button, ConfigProvider, Empty, Modal, Popover, Skeleton } from 'antd'
import thTH from 'antd/locale/th_TH'
import { TbAlertTriangle, TbPlus, TbRocket } from 'react-icons/tb'
import dayjs from 'dayjs'
import { useVMSSettingByVMSID } from '@/features/admin/control-vms/overall/hooks/useVMSSettingByVMSID'
import { useDispatchCommand } from '../hooks/useDispatchCommand'
import CommandSetCard from './CommandSetCard'
import { conflictingSetIds, createCommandSet, isCommandSetValid, type CommandSetValue } from '../utils/commandSet'
import type { ScheduleByVMSID } from '@/types/control-vms/display-api'
import type { APIRequestVMSDispatch } from '@/types/vms/command-center-api'

interface Props {
  vmsIds: number[]
  targetSignSummary: string
  /** Fired after the dispatch call succeeds — lets the tab refocus the monitor. */
  onDispatched?: () => void
  onGotoLibrary?: () => void
}

const dateFmt = 'YYYY-MM-DD'
const timeFmt = 'HH:mm:ss'

const Composer: React.FC<Props> = React.memo(function Composer({ vmsIds, targetSignSummary, onDispatched, onGotoLibrary }) {
  const dispatchCommand = useDispatchCommand()
  // Each ชุดคำสั่ง carries its own name, working condition, date range,
  // display windows and content, and becomes one `settings[]` entry in the
  // dispatch body — so a sign can be given several commands in one go.
  const [sets, setSets] = useState<CommandSetValue[]>(() => [createCommandSet()])
  const patchSet = useCallback((id: number, patch: Partial<CommandSetValue>) => {
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])
  // A new set starts the day after the last one ends — sets can't share a
  // display date, so defaulting to today would land on a blocked day.
  const addSet = () =>
    setSets((prev) => [...prev, createCommandSet(prev[prev.length - 1].dateRange[1].add(1, 'day'))])
  const removeSet = (id: number) => setSets((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev))

  const [confirmOpen, setConfirmOpen] = useState(false)

  // What's currently playing on the target signs — fetched only while the
  // confirm modal is open (mirrors legacy's ContentConfirmCreate) so the
  // operator can see exactly what's about to get overwritten, not just a
  // "3 signs will be affected" count.
  const { data: currentSettingData, isLoading: currentSettingLoading } = useVMSSettingByVMSID(vmsIds, confirmOpen)
  const currentSettings = currentSettingData?.data ?? []

  const formatScheduleDuration = (timeSince: string, timeTo: string) => {
    const diffMinutes = dayjs(timeTo, 'HH:mm').diff(dayjs(timeSince, 'HH:mm'), 'minute', true)
    const diffHours = diffMinutes / 60
    if (diffHours >= 1) return `${Math.round(diffHours * 100) / 100} ชั่วโมง`
    if (diffMinutes >= 1) return `${Math.round(diffMinutes * 100) / 100} นาที`
    return `${Math.round(diffMinutes * 60 * 100) / 100} วินาที`
  }

  const renderScheduleTimes = (schedule: ScheduleByVMSID[] | undefined) => {
    if (!schedule?.length) return <li>-</li>
    return schedule.map((item) => (
      <li key={`${item.schedule_name}-${item.time_since}`}>
        {item.schedule_name} {item.time_since}–{item.time_to} ({formatScheduleDuration(item.time_since, item.time_to)})
      </li>
    ))
  }

  const dateConflictIds = conflictingSetIds(sets)
  const canDispatch = vmsIds.length > 0 && sets.every(isCommandSetValid) && dateConflictIds.size === 0

  /** The set's own ชื่อกำหนดการ, suffixed `(i)` when it has several windows. */
  const scheduleNameFor = (set: CommandSetValue, slotIndex: number, slotCount: number) => {
    const base = set.scheduleName.trim() || 'ประกาศ'
    return slotCount > 1 ? `${base} (${slotIndex + 1})` : base
  }

  // One `settings[]` entry per ชุดคำสั่ง card, `vms_ids` once at the top —
  // field order matches the agreed sample body so a console diff lines up.
  // media_url / message stay mutually exclusive regardless of leftover state
  // in the other field: only the active โหมดเนื้อหา's content goes out. The
  // configured windows are sent in BOTH เงื่อนไขการทำงาน modes (2026-08-20
  // request) — "แสดงผลตลอดเวลา" only sets that set's is_all_day flag.
  const buildRequestBody = (): APIRequestVMSDispatch => ({
    settings: sets.map((set) => ({
      date_since: set.dateRange[0].format(dateFmt),
      date_to: set.dateRange[1].format(dateFmt),
      is_all_day: set.isAllDay,
      schedules: set.timeSlots.map((slot, slotIndex) => ({
        days_of_week: set.daysOfWeek,
        media_url: set.isMessageOnly ? '' : (set.selectedMedia?.url ?? ''),
        message: set.isMessageOnly ? set.message : '',
        schedule_name: scheduleNameFor(set, slotIndex, set.timeSlots.length),
        time_since: slot.range[0].format(timeFmt),
        time_to: slot.range[1].format(timeFmt),
      })),
      setting_type_id: set.selectedMedia?.setting_type_id ?? 0,
      type_name: set.selectedMedia?.setting_type_name || 'ประกาศ',
    })),
    vms_ids: vmsIds,
  })

  const dispatch = () => {
    // mutate + callback (not mutateAsync) — the modal closes only on success,
    // so a failed call leaves the composed sets on screen for a retry.
    dispatchCommand.mutate(buildRequestBody(), {
      onSuccess: () => {
        setConfirmOpen(false)
        onDispatched?.()
      },
    })
  }

  return (
    <ConfigProvider locale={thTH}>
      <div className="flex flex-col h-full rounded-xl text-white/90 bg-(--dark-black)">
        <div className="px-4 py-3 border-b border-white/10">
          <h4 className="text-(--yellow)">สร้างคำสั่งใหม่</h4>
          <p className="fs-12 text-(--default-blue) mt-0.5">{targetSignSummary}</p>
        </div>
        <div className="flex-1 px-4 py-3 space-y-4">
          {sets.map((set, index) => (
            <React.Fragment key={set.id}>
              {index > 0 && <div className="border-t border-white/10 pt-1" />}
              <CommandSetCard
                index={index}
                value={set}
                onChange={(patch) => patchSet(set.id, patch)}
                onRemove={index > 0 ? () => removeSet(set.id) : undefined}
                onGotoLibrary={onGotoLibrary}
                blockedDateRanges={sets.slice(0, index).map((s) => s.dateRange)}
                hasDateConflict={dateConflictIds.has(set.id)}
              />
            </React.Fragment>
          ))}

          {vmsIds.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-(--yellow)/60 bg-[#FCD1161A] text-(--yellow) fs-12">
              <TbAlertTriangle className="fs-16 shrink-0" />
              <span>เลือกอย่างน้อย 1 ป้ายจากคอลัมน์ซ้าย</span>
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-white/10 space-y-2">
          {/* เพิ่มชุดคำสั่ง — available in both เงื่อนไขการทำงาน modes. */}
          <button
            type="button"
            onClick={addSet}
            className="w-full py-2 rounded-lg bg-(--yellow) text-(--dark-black) fs-12 font-semibold inline-flex items-center justify-center gap-1 transition-colors hover:bg-(--yellow)/90"
          >
            <TbPlus size={14} />
            <span>เพิ่มชุดคำสั่ง</span>
          </button>
          {/* Blue dispatch button — --default-blue (#66AEFF). Text is
              --dark-black for legibility (the light blue fails contrast with
              white). Hover/active are lighter/darker shades of the same hue. */}
          <ConfigProvider
            theme={{
              components: {
                Button: {
                  colorPrimary: '#66AEFF',
                  colorPrimaryHover: '#85BFFF',
                  colorPrimaryActive: '#4D9DFF',
                  primaryColor: '#191919',
                },
              },
            }}
          >
            <Button
              type="primary"
              block
              size="large"
              icon={<TbRocket style={{ verticalAlign: -2 }} />}
              disabled={!canDispatch || dispatchCommand.isPending}
              loading={dispatchCommand.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              ส่งคำสั่งควบคุมไปยัง {vmsIds.length} ป้าย
            </Button>
          </ConfigProvider>
        </div>
        <Modal
          open={confirmOpen}
          onOk={dispatch}
          onCancel={() => setConfirmOpen(false)}
          okText="ยืนยันการส่ง"
          cancelText="ยกเลิก"
          title="ยืนยันการส่งคำสั่งควบคุม"
          confirmLoading={dispatchCommand.isPending}
        >
          <div className="fs-12 space-y-3">
            {currentSettingLoading && <Skeleton active paragraph={{ rows: 2 }} />}
            {/* Dark confirm modal text scheme (2026-07-27): bold/headings →
                yellow, body text → white; STATUS values keep their own
                state colours (orange รอดำเนินการ ฯลฯ). */}
            {!currentSettingLoading && currentSettings.length > 0 && (
              <div className="bg-orange-500/20 border-2 border-orange-500 rounded-lg px-4 py-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-(--yellow)! m-0">คำสั่งเดิม (จะถูกทับ)</h4>
                  {currentSettings.length > 1 && (
                    <Popover
                      placement="right"
                      content={currentSettings.slice(1).map((item, i) => (
                        <div key={`${item.solution_name}-${i}`} className="mb-2 last:mb-0">
                          <p className="fs-12 text-white m-0">จุดติดตั้ง: <span className="text-white">{item.solution_name || '-'}</span></p>
                          <ul className="fs-12 text-white m-0 pl-4">{renderScheduleTimes(item.schedule)}</ul>
                        </div>
                      ))}
                    >
                      <p className="fs-12 text-white underline cursor-pointer m-0">และอีก {currentSettings.length - 1} ป้าย</p>
                    </Popover>
                  )}
                </div>
                <p className="fs-12 text-white mt-1 mb-0">จุดติดตั้ง: <span className="text-white">{currentSettings[0].solution_name || '-'}</span></p>
                <ul className="fs-12 text-white mt-0.5 mb-0 pl-4">{renderScheduleTimes(currentSettings[0].schedule)}</ul>
                <p className="fs-12 text-white mt-1 mb-0">สถานะ: <span className="text-orange-600 font-bold">{currentSettings[0].status_name || '-'}</span></p>
              </div>
            )}
            {!currentSettingLoading && currentSettings.length === 0 && vmsIds.length > 0 && (
              <Empty description="ป้ายที่เลือกยังไม่มีคำสั่งแสดงผลอยู่" className="my-2" />
            )}
            <div className="bg-blue-500/20 border-2 border-blue-500 rounded-lg px-4 py-2">
              <h4 className="text-(--yellow)! m-0">
                คำสั่งใหม่{sets.length > 1 ? ` (${sets.length} ชุดคำสั่ง)` : ''}
              </h4>
              {sets.map((set, index) => (
                <div key={set.id} className="mt-2 first:mt-1">
                  <p className="fs-12 text-(--yellow) m-0">
                    ชุดคำสั่งที่ {index + 1} — {set.scheduleName.trim() || 'ประกาศ'}
                    {set.isAllDay ? ' (แสดงผลตลอดเวลา)' : ''}
                  </p>
                  <p className="fs-12 text-white mt-0.5 mb-0">
                    จะส่ง <b className="text-(--yellow)">
                      {set.isMessageOnly
                        ? `ข้อความ: "${set.message.trim()}"`
                        : set.selectedMedia?.setting_type_name || set.selectedMedia?.name || 'ประกาศ'}
                    </b> ไปยัง <b className="text-(--yellow)">{vmsIds.length}</b> ป้าย
                  </p>
                  <p className="fs-12 text-white mt-1 mb-0">
                    ช่วง {set.dateRange[0].format(dateFmt)} → {set.dateRange[1].format(dateFmt)}
                  </p>
                  <ul className="fs-12 text-white mt-1 mb-0 pl-4">
                    {set.timeSlots.map((slot) => (
                      <li key={slot.id}>{slot.range[0].format('HH:mm')} – {slot.range[1].format('HH:mm')}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      </div>
    </ConfigProvider>
  )
})

export default Composer
