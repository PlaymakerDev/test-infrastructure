"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, ConfigProvider, Image, Input, Modal, Select, Skeleton, Switch, TimePicker } from 'antd'
import thTH from 'antd/locale/th_TH'
import dayjs, { Dayjs } from 'dayjs'
import { TbFolderOpen, TbMaximize, TbPlus, TbTrash, TbX } from 'react-icons/tb'
import BuddhistDatePicker from '@/components/date-picker/BuddhistDatePicker'
import DayList from '@/components/list/DayList'
import { useMediaCategoryCounts, useMediaLibraryList } from '../hooks/useMediaLibrary'
import { getThumbUrl, isVideoUrl } from '../utils/thumbnail'
import {
  availableDaysFor,
  invalidSlotIdsOf,
  nextId,
  overlappingSlotIdsOf,
  type CommandSetValue,
} from '../utils/commandSet'
import type { VMSMediaItem } from '@/types/vms/media-library-api'

const isVideoName = (s: string) => isVideoUrl(s)

interface Props {
  /** 0-based — the card header reads "ชุดคำสั่งที่ {index + 1}". */
  index: number
  value: CommandSetValue
  onChange: (patch: Partial<CommandSetValue>) => void
  /** Omitted for the first set — set 1 can't be removed. */
  onRemove?: () => void
  onGotoLibrary?: () => void
  /** Date ranges already taken by the sets above this one — greyed out in both pickers. */
  blockedDateRanges?: [Dayjs, Dayjs][]
  /** This set's range still collides with an earlier set (e.g. set 1 was widened afterwards). */
  hasDateConflict?: boolean
}

/**
 * One ชุดคำสั่ง card: name + working condition → date range → display windows
 * → weekdays → content (media library picker or plain message). Payload-
 * relevant state is owned by the parent Composer and patched through
 * `onChange`; the card keeps only its own view state (category filter, page
 * size, preview modal).
 */
const CommandSetCard: React.FC<Props> = ({
  index,
  value,
  onChange,
  onRemove,
  onGotoLibrary,
  blockedDateRanges = [],
  hasDateConflict = false,
}) => {
  const isAllDay = value.isAllDay
  const isDateBlocked = (d: Dayjs) =>
    blockedDateRanges.some(([start, end]) => !d.isBefore(start, 'day') && !d.isAfter(end, 'day'))
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
  const selectedMedia = value.selectedMedia

  // Auto-select first media whenever the list changes and current selection
  // isn't in the new list — one-click flow when picking a category.
  useEffect(() => {
    if (mediaItems.length === 0) {
      if (selectedMedia) onChange({ selectedMedia: undefined })
      return
    }
    if (!selectedMedia || !mediaItems.find((m) => m.id === selectedMedia.id)) {
      onChange({ selectedMedia: mediaItems[0] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaItems, selectedMedia])

  const availableDays = useMemo(() => availableDaysFor(value.dateRange), [value.dateRange])
  // Full resync (not prune-only) when the date range changes, same as legacy —
  // widening the range back out has to bring previously-pruned days back. The
  // ref guard means an identity-only rerender doesn't clobber a manual pick
  // (and doesn't loop through the parent's patch → rerender cycle).
  const prevAvailableDaysRef = useRef<number[] | null>(null)
  useEffect(() => {
    const prev = prevAvailableDaysRef.current
    const changed =
      !prev || prev.length !== availableDays.length || prev.some((d, i) => d !== availableDays[i])
    prevAvailableDaysRef.current = availableDays
    if (changed) onChange({ daysOfWeek: availableDays })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableDays])

  const timeSlots = value.timeSlots
  const addTimeSlot = () => {
    const lastEnd = timeSlots[timeSlots.length - 1].range[1]
    onChange({ timeSlots: [...timeSlots, { id: nextId(), range: [lastEnd, lastEnd.add(1, 'hour')] }] })
  }
  const removeTimeSlot = (id: number) => {
    if (timeSlots.length <= 1) return
    onChange({ timeSlots: timeSlots.filter((s) => s.id !== id) })
  }
  const setSlotTime = (id: number, side: 'start' | 'end', v: Dayjs) => {
    onChange({
      timeSlots: timeSlots.map((s) =>
        s.id === id ? { ...s, range: side === 'start' ? [v, s.range[1]] : [s.range[0], v] } : s
      ),
    })
  }

  // `open` is deliberately left uncontrolled — controlling it was tried and
  // made the panel need two clicks to open (verified live, reproducible: the
  // first click only focuses the input, the panel itself doesn't render
  // until a second click). Closing from the custom footer button instead
  // dispatches a real Escape keydown at the picker's own input — the picker
  // already wires Escape → close internally (rc-picker's useInputProps), and
  // unlike ref.focus()/.blur() this doesn't depend on the input's current
  // focus state, which proved unreliable.
  // Keyed `${slot.id}:start` / `${slot.id}:end` — one ref per picker side.
  const timePickerRefs = useRef(new Map<string, React.ComponentRef<typeof TimePicker>>())
  const closeTimePanel = (id: number, side: 'start' | 'end') => {
    const input = timePickerRefs.current.get(`${id}:${side}`)?.nativeElement?.querySelector('input')
    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  }

  const invalidSlotIds = useMemo(() => invalidSlotIdsOf(timeSlots), [timeSlots])
  const overlappingSlotIds = useMemo(() => overlappingSlotIdsOf(timeSlots), [timeSlots])

  // Preview modal — click the maximize icon on any tile to open the
  // full-res original in a dark overlay (matches MediaLibraryTab's
  // preview modal so operators get the same shortcut everywhere).
  // Selecting a media (click on the card body) is a separate action;
  // the icon uses stopPropagation so it doesn't double-fire.
  const [previewing, setPreviewing] = useState<VMSMediaItem | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-(--yellow) m-0">ชุดคำสั่งที่ {index + 1} :</h4>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="fs-12 text-red-400 hover:text-red-300 inline-flex items-center gap-1 shrink-0"
          >
            <TbTrash size={14} />
            <span>ลบชุดคำสั่งนี้</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-(--yellow) block mb-1">ชื่อกำหนดการ</label>
          <Input
            value={value.scheduleName}
            onChange={(e) => onChange({ scheduleName: e.target.value })}
            placeholder="เช่น ประกาศเช้า"
            size="large"
          />
        </div>
        {/* เงื่อนไขการทำงาน — a Select (same two options as legacy
            FormAddDetail's display_type field) rather than a Switch, so it
            reads the same as the rest of the VMS forms. Per set: the dispatch
            body carries is_all_day per setting. */}
        <div>
          <label className="text-(--yellow) block mb-1">เงื่อนไขการทำงาน</label>
          <Select
            value={isAllDay ? 'ALL_DAY' : 'SCHEDULE'}
            onChange={(v) => onChange({ isAllDay: v === 'ALL_DAY' })}
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

      <div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-(--yellow) block mb-1">
              เริ่มต้นการแสดงผล <span className="text-red-500">*</span>
            </label>
            {/* Days already used by an earlier ชุดคำสั่ง are greyed out — two
                sets must not display on the same date. */}
            <BuddhistDatePicker
              value={value.dateRange[0]}
              onChange={(date) => {
                if (!date) return
                const next = date as Dayjs
                const end = next.isAfter(value.dateRange[1], 'day') ? next : value.dateRange[1]
                onChange({ dateRange: [next, end] })
              }}
              disabledDate={isDateBlocked}
              status={hasDateConflict ? 'error' : undefined}
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
              value={value.dateRange[1]}
              onChange={(date) => {
                if (!date) return
                onChange({ dateRange: [value.dateRange[0], date as Dayjs] })
              }}
              disabledDate={(current) => current.isBefore(value.dateRange[0], 'day') || isDateBlocked(current)}
              status={hasDateConflict ? 'error' : undefined}
              allowClear={false}
              className="w-full"
              format="DD MMMM BBBB"
              size="large"
              placeholder="กรุณาเลือกวันที่สิ้นสุด..."
            />
          </div>
        </div>
        {hasDateConflict && (
          <p className="fs-12 text-red-400 mt-1 mb-0">
            วันที่ซ้อนกับชุดคำสั่งก่อนหน้า — เลือกวันที่ไม่ซ้ำก่อนส่งคำสั่ง
          </p>
        )}
      </div>

      {/* ช่วงเวลาแสดงผล — one labelled column per side, mirroring the date row
          above. Extra windows stack below the first; the labels only head the
          first row. needConfirm={false} — no "ตกลง" button; picking a value
          doesn't require an explicit confirm click. The panel still only
          closes on an outside click, so the custom footer button (mirrors the
          built-in "Now" button's spot/style) gives a one-click way to fill the
          field with the current time and close. */}
      <div className="space-y-2">
        {timeSlots.map((slot, slotIndex) => {
          const status = invalidSlotIds.has(slot.id) || overlappingSlotIds.has(slot.id) ? 'error' : undefined
          return (
            <div key={slot.id}>
              {slotIndex > 0 && (
                <div className="flex items-center justify-between mb-1">
                  <span className="fs-12 text-white/50">ช่วงเวลาลำดับที่ {slotIndex + 1}</span>
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
                    {slotIndex === 0 && (
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
          {overlappingSlotIds.size > 0 && (
            <p className="m-0">ช่วงเวลาที่เลือกซ้อนกันอยู่ — แก้ให้ไม่ทับกันก่อนส่งคำสั่ง</p>
          )}
        </div>
        {/* Hidden in "แสดงผลตลอดเวลา" mode — an all-day command is one window,
            so multiple windows don't apply there. */}
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
          <DayList
            value={value.daysOfWeek}
            onChange={(days) => onChange({ daysOfWeek: days })}
            disabledDate={(day) => !availableDays.includes(day)}
          />
          <p className="fs-12 text-white/50 mt-1">
            เลือกได้เฉพาะวันที่อยู่ในช่วงวันที่ด้านบน — ไม่เลือกวันไหนเลย = ทำงานทุกวันในช่วงนั้น
          </p>
        </div>
      )}

      {/* Content mode toggle — media and message are mutually exclusive on the
          sign itself, so only one input surface shows at a time instead of
          both being visible and risking both fields being non-empty on
          submit. */}
      <div className="flex items-center justify-between px-3 py-2 rounded-md bg-white/[.03] border border-white/10">
        <span className="fs-12 font-medium">โหมดเนื้อหา</span>
        <div className="flex items-center gap-2 fs-12">
          <span className={!value.isMessageOnly ? 'text-(--yellow)' : 'opacity-60'}>รูป/วิดีโอ</span>
          <Switch
            checked={value.isMessageOnly}
            onChange={(checked) => onChange({ isMessageOnly: checked })}
          />
          <span className={value.isMessageOnly ? 'text-(--yellow)' : 'opacity-60'}>ข้อความอย่างเดียว</span>
        </div>
      </div>

      {!value.isMessageOnly && (
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
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))' }}>
                {mediaItems.map((m) => {
                  const active = m.id === selectedMedia?.id
                  return (
                    <button
                      key={m.id}
                      onClick={() => onChange({ selectedMedia: m })}
                      className="relative rounded-md overflow-hidden border cursor-pointer group"
                      style={{
                        borderColor: active ? '#FCD116' : 'rgba(255,255,255,0.12)',
                        outline: active ? '2px solid #FCD116' : 'none',
                        outlineOffset: -2,
                      }}
                      title={m.name}
                    >
                      <div style={{ aspectRatio: '16/9', background: '#000', position: 'relative' }}>
                        {/* Composer grid uses the JPEG q85 thumbnail (~15 KB)
                          instead of the full-res PNG (~2 MB). Backend
                          ffmpeg-extracts the first frame for videos so the
                          same <img> path handles both. onError falls back to
                          original for older uploads that predate the
                          backfill. */}
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
                            <span className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white fs-12">
                              ▶
                            </span>
                          </span>
                        )}
                      </div>
                      {/* Maximize/preview affordance — top-right corner.
                        stopPropagation so the outer <button>'s select-media
                        handler doesn't also fire. */}
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
                  <Button size="small" onClick={() => setPageSize((n) => n + 12)}>
                    โหลดเพิ่ม ({mediaItems.length}/{totalCount})
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {value.isMessageOnly && (
        <div>
          <label className="text-(--yellow) block mb-1">
            ข้อความที่จะขึ้นบนป้าย <span className="text-red-500">*</span>
          </label>
          <Input.TextArea
            rows={3}
            value={value.message}
            onChange={(e) => onChange({ message: e.target.value })}
            placeholder="พิมพ์ข้อความที่จะแสดงบนป้าย..."
            size="large"
          />
        </div>
      )}

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
                  <span>
                    หมวด: <b className="text-white">{previewing.setting_type_name}</b>
                  </span>
                )}
                {previewing.name && (
                  <span className="truncate">
                    ชื่อ: <span className="text-white">{previewing.name}</span>
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <Button onClick={() => setPreviewing(null)}>ปิด</Button>
                <Button
                  type="primary"
                  onClick={() => {
                    const item = previewing
                    setPreviewing(null)
                    onChange({ selectedMedia: item })
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
  )
}

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

export default CommandSetCard
