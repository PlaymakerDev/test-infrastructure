"use client"
import React, { useMemo, useState } from 'react'
import { Alert, Button, ConfigProvider, DatePicker, Image, Input, Modal, Radio, Select, Skeleton, Switch, TimePicker } from 'antd'
import { TbRocket } from 'react-icons/tb'
import dayjs, { Dayjs } from 'dayjs'
import { useVMSSettingTypes } from '@/features/admin/control-vms/overall/hooks/useVMSSettingTypes'
import { useVMSMediaUrlList } from '@/features/admin/control-vms/overall/hooks/useVMSMediaUrlList'
import { usePostVMSMedia } from '@/features/admin/control-vms/overall/hooks/usePostVMSMedia'

interface Props {
  vmsIds: number[]
  targetSignSummary: string
  onDispatched?: () => void
}

const dateFmt = 'YYYY-MM-DD'
const timeFmt = 'HH:mm:ss'

const isoDaysMask = (days: number[]) => days.reduce((m, d) => m | (1 << (d - 1)), 0)

const Composer: React.FC<Props> = React.memo(function Composer({ vmsIds, targetSignSummary, onDispatched }) {
  const { data: typesData, isLoading: typesLoading } = useVMSSettingTypes()
  const settingTypes = typesData?.data ?? []
  const [settingTypeId, setSettingTypeId] = useState<number | undefined>()
  const selectedType = useMemo(
    () => settingTypes.find((t) => t.id === settingTypeId),
    [settingTypes, settingTypeId]
  )

  const { data: mediaData, isLoading: mediaLoading } = useVMSMediaUrlList(settingTypeId, 1, 12)
  const mediaUrls = mediaData?.data?.res_data?.map((m) => m.media_url) ?? []
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | undefined>()

  const [message, setMessage] = useState<string>('')
  const [scheduleName, setScheduleName] = useState<string>('ประกาศ')
  const today = dayjs()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([today, today])
  const [isAllDay, setIsAllDay] = useState(false)
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('day'),
    dayjs().endOf('day').startOf('minute'),
  ])
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const post = usePostVMSMedia()

  const canDispatch = vmsIds.length > 0 && settingTypeId != null && (selectedMediaUrl || message.trim())

  const buildPayload = () => ({
    vms_ids: vmsIds,
    type_name: selectedType?.name ?? '',
    setting_type_id: settingTypeId as number,
    date_since: dateRange[0].format(dateFmt),
    date_to: dateRange[1].format(dateFmt),
    is_all_day: isAllDay,
    schedules: [
      {
        schedule_name: scheduleName || 'ประกาศ',
        media_url: selectedMediaUrl ?? '',
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
    <ConfigProvider theme={{ token: { colorTextBase: '#1f2937' } }}>
      <div className="flex flex-col h-full text-slate-900 bg-white/95">
        <div className="px-4 py-3 border-b border-slate-200/60">
          <div className="text-sm font-semibold">แต่งคำสั่งใหม่</div>
          <div className="text-xs text-slate-500 mt-0.5">{targetSignSummary}</div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <div>
            <div className="text-xs font-medium mb-1">ประเภทเนื้อหา</div>
            {typesLoading ? (
              <Skeleton.Input active block />
            ) : (
              <Select
                placeholder="เลือกประเภท เช่น ไว้อาลัย, ซ่อมแซมถนน"
                value={settingTypeId}
                onChange={(v) => {
                  setSettingTypeId(v)
                  setSelectedMediaUrl(undefined)
                }}
                options={settingTypes.map((t) => ({ label: t.name, value: t.id }))}
                style={{ width: '100%' }}
              />
            )}
          </div>

          <div>
            <div className="text-xs font-medium mb-1">
              เลือกรูปที่จะแสดง{' '}
              {selectedType?.name && <span className="text-slate-400">({selectedType.name})</span>}
            </div>
            {mediaLoading && <Skeleton active paragraph={{ rows: 3 }} />}
            {!mediaLoading && mediaUrls.length === 0 && (
              <div className="text-xs text-slate-500 border border-dashed border-slate-300 rounded p-3 text-center">
                {settingTypeId ? 'ยังไม่มีรูปในประเภทนี้ (อัปโหลดในหน้า Control VMS)' : 'เลือกประเภทก่อน'}
              </div>
            )}
            {mediaUrls.length > 0 && (
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(96px,1fr))' }}
              >
                {mediaUrls.map((url) => {
                  const active = url === selectedMediaUrl
                  return (
                    <button
                      key={url}
                      onClick={() => setSelectedMediaUrl(url)}
                      className="relative rounded-md overflow-hidden border cursor-pointer"
                      style={{
                        borderColor: active ? '#f59e0b' : '#e5e7eb',
                        outline: active ? '2px solid #f59e0b' : 'none',
                        outlineOffset: -2,
                      }}
                    >
                      <Image
                        src={url}
                        alt=""
                        width="100%"
                        height={72}
                        preview={false}
                        style={{ objectFit: 'cover' }}
                      />
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
              <div className="text-xs text-slate-500 mt-1">ปล่อยว่าง = ทำงานทุกวันในช่วงวันที่</div>
            )}
            <div className="text-xs text-slate-400 mt-1">
              mask = {isoDaysMask(daysOfWeek) || 127}
            </div>
          </div>

          {vmsIds.length === 0 && (
            <Alert type="warning" showIcon message="เลือกอย่างน้อย 1 ป้ายจากคอลัมน์ซ้าย" />
          )}
        </div>
        <div className="px-4 py-3 border-t border-slate-200/60">
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
            ยิงคำสั่งไปยัง {vmsIds.length} ป้าย
          </Button>
        </div>
        <Modal
          open={confirmOpen}
          onOk={dispatch}
          onCancel={() => setConfirmOpen(false)}
          okText="ยืนยันส่ง"
          cancelText="ยกเลิก"
          title="ยืนยันการยิงคำสั่ง"
        >
          <div className="text-sm">
            จะส่งคำสั่ง <b>{selectedType?.name ?? ''}</b> ไปยัง <b>{vmsIds.length}</b> ป้าย
            <br />
            ช่วง {dateRange[0].format(dateFmt)} → {dateRange[1].format(dateFmt)}{' '}
            {isAllDay
              ? '(ตลอดวัน)'
              : `(${timeRange[0].format('HH:mm')} – ${timeRange[1].format('HH:mm')})`}
            <br />
            {vmsIds.length > 3 && (
              <span className="text-xs text-slate-500">
                คำสั่งเดิมที่กำลังแสดงอยู่จะถูกทำเครื่องหมาย "ถูกสั่งทับ" (status=7) โดยอัตโนมัติ
              </span>
            )}
          </div>
        </Modal>
      </div>
    </ConfigProvider>
  )
})

export default Composer
