"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, ConfigProvider, Empty, Image, Input, Modal, Popover, Select, Skeleton, Switch, TimePicker } from 'antd'
import thTH from 'antd/locale/th_TH'
import { TbAlertTriangle, TbFolderOpen, TbMaximize, TbPlus, TbRocket, TbX } from 'react-icons/tb'
import dayjs, { Dayjs } from 'dayjs'
import BuddhistDatePicker from '@/components/date-picker/BuddhistDatePicker'
import DayList from '@/components/list/DayList'
import { useMediaCategoryCounts, useMediaLibraryList } from '../hooks/useMediaLibrary'
import { usePostVMSMedia } from '@/features/admin/control-vms/overall/hooks/usePostVMSMedia'
import { useVMSSettingByVMSID } from '@/features/admin/control-vms/overall/hooks/useVMSSettingByVMSID'
import { getThumbUrl, isVideoUrl } from '../utils/thumbnail'
import type { VMSMediaItem } from '@/types/vms/media-library-api'
import type { ScheduleByVMSID } from '@/types/control-vms/display-api'

const isVideoName = (s: string) => isVideoUrl(s)

interface TimeSlot {
  id: number
  range: [Dayjs, Dayjs]
}

const toMinutes = (d: Dayjs) => d.hour() * 60 + d.minute()
const slotsOverlap = (a: [Dayjs, Dayjs], b: [Dayjs, Dayjs]) =>
  toMinutes(a[0]) < toMinutes(b[1]) && toMinutes(b[0]) < toMinutes(a[1])

interface Props {
  vmsIds: number[]
  targetSignSummary: string
  onDispatched?: () => void
  onGotoLibrary?: () => void
}

const dateFmt = 'YYYY-MM-DD'
const timeFmt = 'HH:mm:ss'

const Composer: React.FC<Props> = React.memo(function Composer({ vmsIds, targetSignSummary, onDispatched, onGotoLibrary }) {
  const { data: countsData } = useMediaCategoryCounts()
  const counts = countsData?.data ?? []

  // Default to the first non-empty category rather than "ทั้งหมด" —
  // operators almost always know the setting type they're about to send,
  // and defaulting to "all" pulled 60+ thumbnails on first paint. Once a
  // user explicitly clicks "ทั้งหมด" that stays. First non-empty is picked
  // once when the counts load; a manual filter later is respected.
  const [categoryFilter, setCategoryFilter] = useState<'all' | number>('all')
  const [categoryTouched, setCategoryTouched] = useState(false)
  useEffect(() => {
    if (categoryTouched) return
    const firstWithItems = counts.find((c) => c.count > 0)
    if (firstWithItems?.setting_type_id != null) {
      setCategoryFilter(firstWithItems.setting_type_id)
    }
  }, [counts, categoryTouched])
  const chooseCategory = (v: 'all' | number) => {
    setCategoryTouched(true)
    setCategoryFilter(v)
  }
  const [pageSize, setPageSize] = useState(12)
  const { data: mediaData, isLoading: mediaLoading } = useMediaLibraryList({
    setting_type_id: categoryFilter === 'all' ? undefined : categoryFilter,
    limit: pageSize,
    page: 1,
  })
  const mediaItems = mediaData?.data?.res_data ?? []
  const totalCount = mediaData?.data?.meta_data?.count ?? mediaItems.length
  const hasMore = mediaItems.length < totalCount
  const [selectedMediaId, setSelectedMediaId] = useState<number | undefined>()
  const selectedMedia = useMemo(
    () => mediaItems.find((m) => m.id === selectedMediaId),
    [mediaItems, selectedMediaId]
  )

  // Auto-select first media whenever the list changes and current selection
  // isn't in the new list — one-click flow when picking a category.
  useEffect(() => {
    if (mediaItems.length === 0) {
      setSelectedMediaId(undefined)
      return
    }
    if (!selectedMediaId || !mediaItems.find((m) => m.id === selectedMediaId)) {
      setSelectedMediaId(mediaItems[0].id)
    }
  }, [mediaItems, selectedMediaId])

  // Media and message are mutually exclusive on the sign (mirrors legacy
  // FormUpdateSchedule.tsx's radio: 'รูปภาพหรือวิดิโอ' vs 'ข้อความ' — the
  // backend/firmware contract is "populate exactly one of media_url/message,
  // leave the other empty"). Media auto-selects on load, so the message field
  // stays hidden by default — showing it unconditionally invited operators to
  // type a caption alongside an auto-picked media, which would have sent BOTH
  // fields non-empty and produced undefined behavior on the physical sign.
  const [isMessageOnly, setIsMessageOnly] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [scheduleName, setScheduleName] = useState<string>('ประกาศ')
  const today = dayjs()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([today, today])
  const [isAllDay, setIsAllDay] = useState(false)
  // Default the first slot to "now → now + 1 hr" so a one-tap dispatch
  // actually covers the current moment. Round to the nearest minute so the
  // picker shows clean values (13:07 rather than 13:07:42). Mirrors legacy's
  // FormAddDetail — an operator can add more slots (e.g. 08:00-09:00 AND
  // 17:00-18:00 for rush hour) instead of being limited to one window.
  const slotIdRef = useRef(1)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    const now = dayjs().startOf('minute')
    return [{ id: 0, range: [now, now.add(1, 'hour')] }]
  })
  const addTimeSlot = () => {
    setTimeSlots((prev) => {
      const lastEnd = prev[prev.length - 1].range[1]
      return [...prev, { id: slotIdRef.current++, range: [lastEnd, lastEnd.add(1, 'hour')] }]
    })
  }
  const removeTimeSlot = (id: number) => {
    setTimeSlots((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev))
  }
  // `open` is deliberately left uncontrolled — controlling it was tried and
  // made the panel need two clicks to open (verified live, reproducible: the
  // first click only focuses the input, the panel itself doesn't render
  // until a second click). Closing from the custom footer button instead
  // dispatches a real Escape keydown at the picker's own input — the picker
  // already wires Escape → close internally (rc-picker's useInputProps), and
  // unlike ref.focus()/.blur() this doesn't depend on the input's current
  // focus state, which proved unreliable (e.g. right after a value pick, a
  // focus()-then-blur() pair sometimes silently didn't close the panel).
  // (Also verified live: despite needConfirm={false}, this antd version does
  // not actually auto-advance start→end or auto-close on a completed range in
  // either mode — an explicit close, via this button or a real outside click,
  // is required either way.)
  // Keyed `${slot.id}:start` / `${slot.id}:end` — the range picker was split
  // into two standalone TimePickers (2026-08-20 layout request), so each side
  // owns its own ref for the Escape-close trick above.
  const timePickerRefs = useRef(new Map<string, React.ComponentRef<typeof TimePicker>>())
  const setSlotTime = (id: number, side: 'start' | 'end', value: Dayjs) => {
    setTimeSlots((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, range: side === 'start' ? [value, s.range[1]] : [s.range[0], value] }
          : s
      )
    )
  }
  const closeTimePanel = (id: number, side: 'start' | 'end') => {
    const input = timePickerRefs.current.get(`${id}:${side}`)?.nativeElement?.querySelector('input')
    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  }
  // A slot whose end is at or before its start can't produce a display window
  // — the RangePicker used to make this impossible, two separate pickers don't.
  const invalidSlotIds = useMemo(
    () => new Set(timeSlots.filter((s) => toMinutes(s.range[1]) <= toMinutes(s.range[0])).map((s) => s.id)),
    [timeSlots]
  )
  const overlappingSlotIds = useMemo(() => {
    const bad = new Set<number>()
    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = i + 1; j < timeSlots.length; j++) {
        if (slotsOverlap(timeSlots[i].range, timeSlots[j].range)) {
          bad.add(timeSlots[i].id)
          bad.add(timeSlots[j].id)
        }
      }
    }
    return bad
  }, [timeSlots])

  // Which weekdays actually fall inside the date range — mirrors legacy's
  // FormAddDetail.tsx exactly. A 1-2 day range can only ever hit 1-2
  // distinct weekdays, so offering all 7 toggles is misleading; a 7+ day
  // range can hit any weekday, so nothing gets disabled.
  const availableDays = useMemo(() => {
    const [start, end] = dateRange
    if (!start.isValid() || !end.isValid() || end.isBefore(start, 'day')) return [1, 2, 3, 4, 5, 6, 7]
    if (end.diff(start, 'day') >= 6) return [1, 2, 3, 4, 5, 6, 7]
    const days = new Set<number>()
    for (let i = 0; i <= end.diff(start, 'day'); i++) {
      const d = start.add(i, 'day').day()
      days.add(d === 0 ? 7 : d)
    }
    return Array.from(days).sort((a, b) => a - b)
  }, [dateRange])
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
  // Full resync (not prune-only) on every range change, same as legacy —
  // widening the range back out has to bring previously-pruned days back.
  useEffect(() => {
    setDaysOfWeek(availableDays)
  }, [availableDays])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const post = usePostVMSMedia()

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

  // Preview modal — click the maximize icon on any tile to open the
  // full-res original in a dark overlay (matches MediaLibraryTab's
  // preview modal so operators get the same shortcut everywhere).
  // Selecting a media (click on the card body) is a separate action;
  // the icon uses stopPropagation so it doesn't double-fire.
  const [previewing, setPreviewing] = useState<VMSMediaItem | null>(null)

  const canDispatch =
    vmsIds.length > 0 &&
    (isMessageOnly ? message.trim().length > 0 : !!selectedMedia?.url) &&
    overlappingSlotIds.size === 0 &&
    invalidSlotIds.size === 0

  const buildPayload = () => ({
    vms_ids: vmsIds,
    type_name: selectedMedia?.setting_type_name || 'ประกาศ',
    setting_type_id: selectedMedia?.setting_type_id ?? 0,
    date_since: dateRange[0].format(dateFmt),
    date_to: dateRange[1].format(dateFmt),
    is_all_day: isAllDay,
    // Enforced mutually exclusive regardless of leftover state in the other
    // field — only the active mode's content goes out. One schedule per
    // configured time slot, e.g. 08:00-09:00 AND 17:00-18:00 for rush-hour
    // signage. The configured slots are sent in BOTH เงื่อนไขการทำงาน modes
    // (2026-08-20 request): "แสดงผลตลอดเวลา" no longer collapses them to a
    // single 00:00-23:59 window — it only sets the is_all_day flag, the
    // operator still picks the windows.
    schedules: timeSlots.map((slot, i) => ({
      schedule_name: timeSlots.length > 1 ? `${scheduleName || 'ประกาศ'} (${i + 1})` : (scheduleName || 'ประกาศ'),
      media_url: isMessageOnly ? '' : (selectedMedia?.url ?? ''),
      message: isMessageOnly ? message : '',
      time_since: slot.range[0].format(timeFmt),
      time_to: slot.range[1].format(timeFmt),
      days_of_week: daysOfWeek,
    })),
  })

  const dispatch = async () => {
    setConfirmOpen(false)
    const payload = buildPayload()
    try {
      await post.mutateAsync(payload)
      onDispatched?.()
    } catch {
      // usePostVMSMedia already surfaces error via antd message; no re-throw
    }
  }

  return (
    <ConfigProvider locale={thTH}>
      <div className="flex flex-col h-full rounded-xl text-white/90 bg-(--dark-black)">
        <div className="px-4 py-3 border-b border-white/10">
          <h4 className="text-(--yellow)">สร้างคำสั่งใหม่</h4>
          <p className="fs-12 text-(--default-blue) mt-0.5">{targetSignSummary}</p>
        </div>
        <div className="flex-1 px-4 py-3 space-y-4">
          {/* Field order follows the 2026-08-20 mock: schedule name + working
              condition, then the display date range, then the display time
              range, then the weekday picker — content mode + media picker come
              last. */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-(--yellow) block mb-1">ชื่อกำหนดการ</label>
              <Input
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder="เช่น ประกาศเช้า"
                size="large"
              />
            </div>
            {/* เงื่อนไขการทำงาน — a Select (same two options/labels as legacy
                FormAddDetail's display_type field) rather than the Switch this
                used to be, so it reads the same as the rest of the VMS forms.
                Bound to the same `isAllDay` state the payload builder uses. */}
            <div>
              <label className="text-(--yellow) block mb-1">เงื่อนไขการทำงาน</label>
              <Select
                value={isAllDay ? 'ALL_DAY' : 'SCHEDULE'}
                onChange={(v) => setIsAllDay(v === 'ALL_DAY')}
                options={[
                  { label: 'แสดงผลตลอดเวลา', value: 'ALL_DAY' },
                  { label: 'เลือกช่วงเวลาที่ต้องการแสดงผล', value: 'SCHEDULE' },
                ]}
                placeholder="กรุณาเลือกเงื่อนไขการทำงาน..."
                className="w-full"
                size="large"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-(--yellow) block mb-1">
                เริ่มต้นการแสดงผล <span className="text-red-500">*</span>
              </label>
              <BuddhistDatePicker
                value={dateRange[0]}
                onChange={(date) => {
                  if (!date) return
                  const next = date as Dayjs
                  setDateRange((prev) => {
                    const end = prev[1] && next.isAfter(prev[1], 'day') ? next : prev[1]
                    return [next, end ?? next]
                  })
                }}
                allowClear={false}
                className="w-full"
                format="DD MMMM BBBB"
                size="large"
                placeholder="กรุณาเลือกวันที่เริ่มต้น..."
              />
            </div>
            <div>
              <label className="text-(--yellow) block mb-1">
                สิ้นสุดการแสดงผล <span className="text-red-500">*</span>
              </label>
              <BuddhistDatePicker
                value={dateRange[1]}
                onChange={(date) => {
                  if (!date) return
                  setDateRange((prev) => [prev[0], date as Dayjs])
                }}
                disabledDate={(current) => !!dateRange[0] && current.isBefore(dateRange[0], 'day')}
                allowClear={false}
                className="w-full"
                format="DD MMMM BBBB"
                size="large"
                placeholder="กรุณาเลือกวันที่สิ้นสุด..."
              />
            </div>
          </div>

          {/* ช่วงเวลาแสดงผล — one labelled column per side, mirroring the date
              row above (was a single TimePicker.RangePicker). Extra slots
              stack below the first; the labels only head the first row.
              needConfirm={false} — no "ตกลง" button; picking a value doesn't
              require an explicit confirm click. The panel still only closes on
              an outside click, so the custom footer button (mirrors the
              built-in "Now" button's spot/style) gives a one-click way to fill
              the field with the current time and close. */}
          <div className="space-y-2">
            {timeSlots.map((slot, index) => {
              const invalid = invalidSlotIds.has(slot.id)
              const overlapping = overlappingSlotIds.has(slot.id)
              const status = invalid || overlapping ? 'error' : undefined
              return (
                <div key={slot.id}>
                  {index > 0 && (
                    <div className="flex items-center justify-between mb-1">
                      <span className="fs-12 text-white/50">ช่วงเวลาลำดับที่ {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(slot.id)}
                        className="text-white/50 hover:text-white shrink-0"
                        aria-label="ลบช่วงเวลานี้"
                      >
                        <TbX size={16} />
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {(['start', 'end'] as const).map((side) => (
                      <div key={side}>
                        {index === 0 && (
                          <label className="text-(--yellow) block mb-1">
                            {side === 'start' ? 'ช่วงเวลาเริ่มต้นการแสดงผล' : 'ช่วงเวลาสิ้นสุดการแสดงผล'}
                            <span className="text-red-500">*</span>
                          </label>
                        )}
                        <TimePicker
                          ref={(el) => {
                            const key = `${slot.id}:${side}`
                            if (el) timePickerRefs.current.set(key, el)
                            else timePickerRefs.current.delete(key)
                          }}
                          value={side === 'start' ? slot.range[0] : slot.range[1]}
                          onChange={(v) => v && setSlotTime(slot.id, side, v)}
                          format="HH:mm"
                          needConfirm={false}
                          allowClear={false}
                          className="w-full"
                          size="large"
                          status={status}
                          placeholder={side === 'start' ? 'เวลาเริ่มต้น' : 'เวลาสิ้นสุด'}
                          renderExtraFooter={() => (
                            <div className="flex justify-start px-3 py-2 border-t border-white/10">
                              <Button
                                type="link"
                                size="small"
                                className="px-0!"
                                onClick={() => {
                                  setSlotTime(slot.id, side, dayjs().startOf('minute'))
                                  closeTimePanel(slot.id, side)
                                }}
                              >
                                เลือกเวลาปัจจุบัน
                              </Button>
                            </div>
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            <div className="fs-12 text-red-400 space-y-0.5">
              {invalidSlotIds.size > 0 && <p className="m-0">เวลาสิ้นสุดต้องมาหลังเวลาเริ่มต้น</p>}
              {overlappingSlotIds.size > 0 && <p className="m-0">ช่วงเวลาที่เลือกซ้อนกันอยู่ — แก้ให้ไม่ทับกันก่อนส่งคำสั่ง</p>}
            </div>
            {/* Full-width outlined block button (2026-08-20 mock) — same
                yellow-border/tinted-fill treatment as the "เลือกอย่างน้อย 1
                ป้าย" notice below. Hidden in "แสดงผลตลอดเวลา" mode: an all-day
                command is one window, so multiple slots don't apply there. */}
            {!isAllDay && (
              <button
                type="button"
                onClick={addTimeSlot}
                className="w-full py-2 rounded-lg border border-(--yellow)/60 bg-[#FCD1161A] text-(--yellow) fs-12 inline-flex items-center justify-center gap-1 transition-colors hover:bg-(--yellow)/20"
              >
                <TbPlus size={14} />
                <span>เพิ่มช่วงเวลา</span>
              </button>
            )}
          </div>

          {availableDays.length > 1 && (
            <div>
              <label className="text-(--yellow) block mb-1">วันในสัปดาห์</label>
              <DayList value={daysOfWeek} onChange={setDaysOfWeek} disabledDate={(day) => !availableDays.includes(day)} />
              <p className="fs-12 text-white/50 mt-1">เลือกได้เฉพาะวันที่อยู่ในช่วงวันที่ด้านบน — ไม่เลือกวันไหนเลย = ทำงานทุกวันในช่วงนั้น</p>
            </div>
          )}

          {/* Content mode toggle — media and message are mutually exclusive
              on the sign itself, so only one input surface shows at a time
              instead of both being visible and risking both fields being
              non-empty on submit. */}
          <div className="flex items-center justify-between px-3 py-2 rounded-md bg-white/[.03] border border-white/10">
            <span className="fs-12 font-medium">โหมดเนื้อหา</span>
            <div className="flex items-center gap-2 fs-12">
              <span className={!isMessageOnly ? 'text-(--yellow)' : 'opacity-60'}>รูป/วิดีโอ</span>
              <Switch checked={isMessageOnly} onChange={setIsMessageOnly} />
              <span className={isMessageOnly ? 'text-(--yellow)' : 'opacity-60'}>ข้อความอย่างเดียว</span>
            </div>
          </div>

          {!isMessageOnly && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-(--yellow) block">เลือกรูป / วิดีโอที่จะแสดง</label>
                {onGotoLibrary && (
                  <button
                    className="fs-12 px-2 py-0.5 rounded-full border border-(--yellow) bg-(--yellow) text-(--dark-black) font-semibold inline-flex items-center gap-1 transition-colors hover:bg-(--yellow)/90"
                    onClick={onGotoLibrary}
                    type="button"
                  >
                    <TbFolderOpen size={14} />
                    <span>ไปคลังสื่อ →</span>
                  </button>
                )}
              </div>
              {/* Category chip filter */}
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                <Chip active={categoryFilter === 'all'} label="ทั้งหมด" onClick={() => chooseCategory('all')} />
                {counts.map((c) => (
                  <Chip
                    key={c.setting_type_id ?? 'null'}
                    active={categoryFilter === (c.setting_type_id ?? -1)}
                    label={`${c.setting_type_name} (${c.count})`}
                    onClick={() => chooseCategory(c.setting_type_id ?? -1)}
                  />
                ))}
              </div>
              {mediaLoading && <Skeleton active paragraph={{ rows: 3 }} />}
              {!mediaLoading && mediaItems.length === 0 && (
                <div className="fs-12 text-white/50 border border-dashed border-white/15 rounded p-3 text-center">
                  ยังไม่มีสื่อในหมวดนี้ — เพิ่มได้ที่แท็บ &quot;คลังสื่อ&quot;
                </div>
              )}
              {mediaItems.length > 0 && (
                <>
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))' }}
                  >
                    {mediaItems.map((m) => {
                      const active = m.id === selectedMediaId
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMediaId(m.id)}
                          className="relative rounded-md overflow-hidden border cursor-pointer group"
                          style={{
                            borderColor: active ? '#FCD116' : 'rgba(255,255,255,0.12)',
                            outline: active ? '2px solid #FCD116' : 'none',
                            outlineOffset: -2,
                          }}
                          title={m.name}
                        >
                          <div style={{ aspectRatio: '16/9', background: '#000', position: 'relative' }}>
                            {/* Composer grid uses the JPEG q85 thumbnail
                              (~15 KB) instead of the full-res PNG (~2 MB).
                              Backend ffmpeg-extracts the first frame for
                              videos so the same <img> path handles both.
                              onError falls back to original for older
                              uploads that predate the backfill. */}
                            <img
                              src={getThumbUrl(m.url)}
                              alt={m.name}
                              loading="lazy"
                              onError={(e) => {
                                const img = e.currentTarget
                                if (img.dataset.fallback !== '1') {
                                  img.dataset.fallback = '1'
                                  img.src = isVideoName(m.filename || m.url) ? '' : m.url
                                }
                              }}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                            {isVideoName(m.filename || m.url) && (
                              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white fs-12">▶</span>
                              </span>
                            )}
                          </div>
                          {/* Maximize/preview affordance — top-right corner.
                            stopPropagation so the outer <button>'s
                            select-media handler doesn't also fire. */}
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation()
                              setPreviewing(m)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation()
                                e.preventDefault()
                                setPreviewing(m)
                              }
                            }}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity bg-black/70 hover:bg-black text-white rounded p-1 cursor-pointer"
                            title="ดูตัวอย่างเต็ม"
                            aria-label="ดูตัวอย่างเต็ม"
                          >
                            <TbMaximize size={14} />
                          </span>
                          {m.setting_type_name && (
                            <div className="px-1.5 py-1 fs-12 text-left truncate bg-black/50 text-(--yellow)">
                              {m.setting_type_name}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {hasMore && (
                    <div className="mt-2 text-center">
                      <Button
                        size="small"
                        onClick={() => setPageSize((n) => n + 12)}
                      >
                        โหลดเพิ่ม ({mediaItems.length}/{totalCount})
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {isMessageOnly && (
            <div>
              <label className="text-(--yellow) block mb-1">
                ข้อความที่จะขึ้นบนป้าย <span className="text-red-500">*</span>
              </label>
              <Input.TextArea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="พิมพ์ข้อความที่จะแสดงบนป้าย..."
                size="large"
              />
            </div>
          )}

          {vmsIds.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-(--yellow)/60 bg-[#FCD1161A] text-(--yellow) fs-12">
              <TbAlertTriangle className="fs-16 shrink-0" />
              <span>เลือกอย่างน้อย 1 ป้ายจากคอลัมน์ซ้าย</span>
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-white/10">
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
              disabled={!canDispatch || post.isPending}
              loading={post.isPending}
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
          confirmLoading={post.isPending}
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
              <h4 className="text-(--yellow)! m-0">คำสั่งใหม่</h4>
              <p className="fs-12 text-white mt-1 mb-0">
                จะส่ง <b className="text-(--yellow)">
                  {isMessageOnly
                    ? `ข้อความ: "${message.trim()}"`
                    : selectedMedia?.setting_type_name || selectedMedia?.name || 'ประกาศ'}
                </b> ไปยัง <b className="text-(--yellow)">{vmsIds.length}</b> ป้าย
              </p>
              <p className="fs-12 text-white mt-1 mb-0">
                ช่วง {dateRange[0].format(dateFmt)} → {dateRange[1].format(dateFmt)}
              </p>
              {isAllDay && (
                <p className="fs-12 text-white mt-1 mb-0">เงื่อนไขการทำงาน: แสดงผลตลอดเวลา</p>
              )}
              <ul className="fs-12 text-white mt-1 mb-0 pl-4">
                {timeSlots.map((slot) => (
                  <li key={slot.id}>{slot.range[0].format('HH:mm')} – {slot.range[1].format('HH:mm')}</li>
                ))}
              </ul>
            </div>
          </div>
        </Modal>

        {/* Full-size preview modal — dark shell, matches MediaLibraryTab. */}
        <ConfigProvider locale={thTH} theme={{ components: { Modal: { colorIcon: '#FFFFFF' } } }}>
          <Modal
            open={!!previewing}
            onCancel={() => setPreviewing(null)}
            footer={null}
            width={900}
            title={previewing?.setting_type_name || 'สื่อ'}
            destroyOnHidden
            classNames={{ container: 'border-2! border-(--default-blue)!' }}
          >
            {previewing && (
              <div>
                <div className="bg-black rounded overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  {isVideoName(previewing.filename || previewing.url) ? (
                    <video
                      src={previewing.url}
                      controls
                      autoPlay
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <Image
                      src={previewing.url}
                      alt={previewing.name}
                      width="100%"
                      height="100%"
                      preview={false}
                      style={{ objectFit: 'contain' }}
                    />
                  )}
                </div>
                <div className="mt-3 fs-12 text-white/70 flex items-center gap-3 flex-wrap">
                  {previewing.setting_type_name && (
                    <span>หมวด: <b className="text-white">{previewing.setting_type_name}</b></span>
                  )}
                  {previewing.name && (
                    <span className="truncate">ชื่อ: <span className="text-white">{previewing.name}</span></span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    onClick={() => setPreviewing(null)}
                  >
                    ปิด
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      const id = previewing.id
                      setPreviewing(null)
                      setSelectedMediaId(id)
                    }}
                  >
                    เลือกสื่อนี้
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        </ConfigProvider>
      </div>
    </ConfigProvider>
  )
})

const Chip: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="fs-12 px-2.5 py-0.5 rounded-full transition-colors border"
    style={{
      background: active ? '#FCD116' : 'transparent',
      color: active ? '#191919' : '#FCD116',
      borderColor: '#FCD116',
      fontWeight: active ? 600 : 400,
    }}
  >
    {label}
  </button>
)

export default Composer
