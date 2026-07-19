"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { Button, DatePicker, Image, Input, Modal, Radio, Skeleton, Switch, TimePicker } from 'antd'
import { TbAlertTriangle, TbFolderOpen, TbRocket } from 'react-icons/tb'
import dayjs, { Dayjs } from 'dayjs'
import { useMediaCategoryCounts, useMediaLibraryList } from '../hooks/useMediaLibrary'
import { usePostVMSMedia } from '@/features/admin/control-vms/overall/hooks/usePostVMSMedia'

interface Props {
  vmsIds: number[]
  targetSignSummary: string
  onDispatched?: () => void
  onGotoLibrary?: () => void
}

const dateFmt = 'YYYY-MM-DD'
const timeFmt = 'HH:mm:ss'

const isoDaysMask = (days: number[]) => days.reduce((m, d) => m | (1 << (d - 1)), 0)

const Composer: React.FC<Props> = React.memo(function Composer({ vmsIds, targetSignSummary, onDispatched, onGotoLibrary }) {
  const { data: countsData } = useMediaCategoryCounts()
  const counts = countsData?.data ?? []

  const [categoryFilter, setCategoryFilter] = useState<'all' | number>('all')
  const { data: mediaData, isLoading: mediaLoading } = useMediaLibraryList({
    setting_type_id: categoryFilter === 'all' ? undefined : categoryFilter,
    limit: 24,
    page: 1,
  })
  const mediaItems = mediaData?.data?.res_data ?? []
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

  const [message, setMessage] = useState<string>('')
  const [scheduleName, setScheduleName] = useState<string>('ประกาศ')
  const today = dayjs()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([today, today])
  const [isAllDay, setIsAllDay] = useState(false)
  // Default the slot to "now → now + 1 hr" so a one-tap dispatch actually
  // covers the current moment. Round to the nearest minute so the picker
  // shows clean values (13:07 rather than 13:07:42).
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs]>(() => {
    const now = dayjs().startOf('minute')
    return [now, now.add(1, 'hour')]
  })
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const post = usePostVMSMedia()

  const canDispatch = vmsIds.length > 0 && (!!selectedMedia?.url || message.trim().length > 0)

  const buildPayload = () => ({
    vms_ids: vmsIds,
    type_name: selectedMedia?.setting_type_name || 'ประกาศ',
    setting_type_id: selectedMedia?.setting_type_id ?? 0,
    date_since: dateRange[0].format(dateFmt),
    date_to: dateRange[1].format(dateFmt),
    is_all_day: isAllDay,
    schedules: [
      {
        schedule_name: scheduleName || 'ประกาศ',
        media_url: selectedMedia?.url ?? '',
        message: message,
        time_since: isAllDay ? '00:00:00' : timeRange[0].format(timeFmt),
        time_to: isAllDay ? '23:59:59' : timeRange[1].format(timeFmt),
        days_of_week: daysOfWeek,
      },
    ],
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
    <>
      <div className="flex flex-col h-full text-white/90 bg-(--dark-black)">
        <div className="px-4 py-3 border-b border-white/10">
          <div className="text-sm font-semibold text-(--yellow)">สร้างคำสั่งใหม่</div>
          <div className="text-xs text-(--default-blue) mt-0.5">{targetSignSummary}</div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-medium">เลือกรูป / วิดีโอที่จะแสดง</div>
              {onGotoLibrary && (
                <button
                  className="text-xs text-(--yellow) hover:underline inline-flex items-center gap-1"
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
              <Chip active={categoryFilter === 'all'} label="ทั้งหมด" onClick={() => setCategoryFilter('all')} />
              {counts.map((c) => (
                <Chip
                  key={c.setting_type_id ?? 'null'}
                  active={categoryFilter === (c.setting_type_id ?? -1)}
                  label={`${c.setting_type_name} (${c.count})`}
                  onClick={() => setCategoryFilter(c.setting_type_id ?? -1)}
                />
              ))}
            </div>
            {mediaLoading && <Skeleton active paragraph={{ rows: 3 }} />}
            {!mediaLoading && mediaItems.length === 0 && (
              <div className="text-xs text-white/50 border border-dashed border-white/15 rounded p-3 text-center">
                ยังไม่มีสื่อในหมวดนี้ — เพิ่มได้ที่แท็บ "คลังสื่อ"
              </div>
            )}
            {mediaItems.length > 0 && (
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
                      <div style={{ aspectRatio: '16/9', background: '#000' }}>
                        <Image
                          src={m.url}
                          alt={m.name}
                          width="100%"
                          height="100%"
                          preview={false}
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                      {m.setting_type_name && (
                        <div className="px-1.5 py-1 text-[10px] text-left truncate bg-black/50 text-(--yellow)">
                          {m.setting_type_name}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-medium mb-1">ข้อความประกอบ (ไม่บังคับ)</div>
            <Input.TextArea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="ข้อความที่จะขึ้นบนป้าย (ถ้าเป็น message-only ให้ปล่อยรูปว่างได้)"
            />
          </div>

          <div>
            <div className="text-xs font-medium mb-1">ชื่อกำหนดการ</div>
            <Input
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              placeholder="เช่น ประกาศเช้า"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-medium mb-1">ช่วงวันที่</div>
              <DatePicker.RangePicker
                value={dateRange}
                onChange={(v) => v && v[0] && v[1] && setDateRange([v[0], v[1]])}
                allowClear={false}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <div className="text-xs font-medium mb-1">โหมด</div>
              <div className="flex items-center gap-2 h-8">
                <Switch checked={isAllDay} onChange={setIsAllDay} />
                <span className="text-xs">{isAllDay ? 'ตลอดวัน' : 'ตามช่วงเวลา'}</span>
              </div>
            </div>
          </div>

          {!isAllDay && (
            <div>
              <div className="text-xs font-medium mb-1">ช่วงเวลาแสดงผล</div>
              <TimePicker.RangePicker
                value={timeRange}
                onChange={(v) => v && v[0] && v[1] && setTimeRange([v[0], v[1]])}
                format="HH:mm"
                allowClear={false}
                style={{ width: '100%' }}
              />
            </div>
          )}

          <div>
            <div className="text-xs font-medium mb-1">วันในสัปดาห์</div>
            <Radio.Group
              value={daysOfWeek.length === 0 ? 'all' : 'custom'}
              onChange={(e) => setDaysOfWeek(e.target.value === 'all' ? [] : [1, 2, 3, 4, 5])}
              size="small"
            >
              <Radio.Button value="all">ทุกวัน</Radio.Button>
              <Radio.Button value="custom">จันทร์–ศุกร์</Radio.Button>
            </Radio.Group>
            {daysOfWeek.length === 0 && (
              <div className="text-xs text-white/50 mt-1">ปล่อยว่าง = ทำงานทุกวันในช่วงวันที่</div>
            )}
            <div className="text-xs text-white/40 mt-1">
              mask = {isoDaysMask(daysOfWeek) || 127}
            </div>
          </div>

          {vmsIds.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-(--yellow)/60 bg-[#FCD1161A] text-(--yellow) text-xs">
              <TbAlertTriangle className="fs-16 shrink-0" />
              <span>เลือกอย่างน้อย 1 ป้ายจากคอลัมน์ซ้าย</span>
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-white/10">
          <Button
            type="primary"
            danger
            block
            size="large"
            icon={<TbRocket style={{ verticalAlign: -2 }} />}
            disabled={!canDispatch || post.isPending}
            loading={post.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            ส่งคำสั่งควบคุมไปยัง {vmsIds.length} ป้าย
          </Button>
        </div>
        <Modal
          open={confirmOpen}
          onOk={dispatch}
          onCancel={() => setConfirmOpen(false)}
          okText="ยืนยันการส่ง"
          cancelText="ยกเลิก"
          title="ยืนยันการส่งคำสั่งควบคุม"
        >
          <div className="text-sm">
            จะส่งคำสั่ง <b>{selectedMedia?.setting_type_name || selectedMedia?.name || 'ประกาศ'}</b> ไปยัง <b>{vmsIds.length}</b> ป้าย
            <br />
            ช่วง {dateRange[0].format(dateFmt)} → {dateRange[1].format(dateFmt)}{' '}
            {isAllDay
              ? '(ตลอดวัน)'
              : `(${timeRange[0].format('HH:mm')} – ${timeRange[1].format('HH:mm')})`}
            <br />
            {vmsIds.length > 3 && (
              <span className="text-xs text-white/50">
                คำสั่งเดิมที่กำลังแสดงอยู่จะถูกทำเครื่องหมาย "ถูกสั่งทับ" (status=7) โดยอัตโนมัติ
              </span>
            )}
          </div>
        </Modal>
      </div>
    </>
  )
})

const Chip: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-[11px] px-2.5 py-0.5 rounded-full transition-colors border"
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
