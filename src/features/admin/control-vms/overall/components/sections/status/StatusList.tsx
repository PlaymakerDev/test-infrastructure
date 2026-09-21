import DayList from '@/components/list/DayList'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { VMSSettingByStatus } from '@/types/control-vms/display-api'
import { Button, ConfigProvider, Tooltip } from 'antd'
import { TbAppWindow } from 'react-icons/tb'
import dayjs from 'dayjs'
import React, { useCallback, useMemo } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useControlVMSContext } from '../../../context'
import StatusPill from '@/features/admin/vms-command-center/components/StatusPill'
import { combineDateTime } from '@/features/admin/vms-command-center/utils/displayWindow'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'

// `BBBB` + ชื่อเดือนไทย เคยทำงานได้เพราะไฟล์แม่ (StatusTabContent) บังเอิญ
// extend ไว้ให้ — ผูกไว้ตรงนี้เองจะได้ไม่พังถ้าลำดับ import เปลี่ยน
dayjs.extend(buddhistEra)

interface Props {
  item: VMSSettingByStatus
}

const StatusList: React.FC<Props> = (props) => {
  const { item } = props
  const dispatch = useAppDispatch()
  const { setOpenVMSScreen, setUpdateScheduleState } = useControlVMSContext()

  const activeDays = useMemo(
    () => Array.from(new Set((item.schedules ?? []).flatMap((s) => s.days_of_week))),
    [item.schedules]
  )

  const getDayTooltip = useCallback((day: number) => {
    const schedules = (item.schedules ?? []).filter((s) => s.days_of_week.includes(day))
    if (!schedules.length) return null
    return (
      <div>
        {schedules.map((s) => (
          <div key={s.schedule_id}>
            <p className='fs-12 text-white/50'>{s.schedule_name} :</p>
            <p className='fs-12'>{s.time_since} - {s.time_to}</p>
          </div>
        ))}
      </div>
    )
  }, [item.schedules])

  /**
   * ป้ายกำกับเดิมเขียนว่า "วันที่และเวลาเริ่มต้น/สิ้นสุด" แต่แสดงแค่วันที่ —
   * ทั้งที่ **เวลาคือตัวที่ตัดสินว่าจอขึ้นและดับตอนไหน** และข้อมูลก็ส่งมาครบ
   * อยู่ใน item.schedules แล้ว (วัดจริง 20 ก.ย. 2569: setting 1208 คือ
   * 20/09 01:35 -> 22/09 02:30 แต่การ์ดโชว์แค่ "20 ก.ย. 2569 / 22 ก.ย. 2569")
   *
   * โหมดต่อเนื่อง (is_all_day) เวลาสองตัวผูกกับ "วันแรก" กับ "วันสุดท้าย"
   * คนละวันกัน · โหมดรายวันเวลาเดิมซ้ำทุกวัน จึงไม่ใช่ "เวลาเริ่ม/สิ้นสุด"
   * ของช่วง — ป้ายกำกับสองโหมดนี้ต้องคนละแบบ ห้ามรวบเป็นอันเดียว
   */
  const firstSchedule = item.schedules?.[0]
  const allDayStart = item.is_all_day ? combineDateTime(item.start_date, firstSchedule?.time_since) : null
  const allDayEnd = item.is_all_day ? combineDateTime(item.end_date, firstSchedule?.time_to) : null

  const fmtDate = useCallback((v?: string | null) => {
    const d = dayjs(v)
    // `format()` ของ dayjs คืนสตริง "Invalid Date" ซึ่งเป็น truthy —
    // ของเดิมเขียน `format(...) || '-'` จึงไม่เคยทำงาน
    return d.isValid() ? d.locale('th').format('DD MMM BBBB') : '-'
  }, [])

  const fmtDateTime = useCallback((d: ReturnType<typeof combineDateTime>) =>
    d ? d.locale('th').format('DD MMM BBBB HH:mm') : '-', [])

  /** ช่วงเวลาต่อวันของโหมดรายวัน — ย่อเป็นบรรทัดเดียว (รายละเอียดรายวันอยู่ใน tooltip ของ DayList) */
  const perDayWindows = useMemo(() => {
    const uniq = Array.from(
      new Set((item.schedules ?? []).map((s) => `${(s.time_since ?? '').slice(0, 5)}–${(s.time_to ?? '').slice(0, 5)}`))
    ).filter((s) => s !== '–')
    return uniq.join(' · ')
  }, [item.schedules])

  const renderCondition = useMemo(() => {
    if (item.is_all_day) {
      return (
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#66AEFF',
              colorTextLightSolid: '#0A0A0A'
            }
          }}
        >
          <Tooltip title='ช่วงเดียวยาวต่อเนื่อง ไม่ดับกลางคืน — ดับจริงตาม "วันที่และเวลาดับจอ" ด้านบน ไม่ใช่แสดงไปเรื่อย ๆ ไม่มีวันจบ'>
            <Button type='primary'>แสดงผลตลอดเวลา</Button>
          </Tooltip>
        </ConfigProvider>
      )
    }
    return <DayList value={activeDays} getTooltip={getDayTooltip} />
  }, [item.is_all_day, activeDays, getDayTooltip])

  return (
    <div className='bg-(--light-gray-2) rounded-lg p-5'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <span className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border border-(--default-blue) text-(--default-blue)'>
          {item.road_code || '-'}
        </span>
        <Button
          htmlType='button'
          type='primary'
          shape='round'
          danger
          onClick={() => setUpdateScheduleState({ open: true, id: item.setting_id, type: 'BATCH_DELETE' })}
        >
          <p className='fs-12 text-white'>ยกเลิกคำสั่ง</p>
        </Button>
      </div>
      <section className='mt-3'>
        <div className='flex items-center gap-1.5'>
          <h4 className='text-(--yellow)'>{item.solution_name || '-'}</h4>
          <Tooltip title={item.anydesk_id ? `เปิด Anydesk #${item.anydesk_id}` : 'ไม่มี Anydesk ID'}>
            <button
              type='button'
              disabled={!item.anydesk_id}
              onClick={(e) => {
                e.stopPropagation()
                if (!item.anydesk_id) return
                window.location.href = `anydesk:${item.anydesk_id}`
              }}
              className='inline-flex items-center shrink-0 disabled:opacity-30 disabled:cursor-default'
              style={{ color: item.anydesk_id ? 'var(--default-blue)' : 'rgba(255,255,255,0.4)', cursor: item.anydesk_id ? 'pointer' : 'default' }}
            >
              <TbAppWindow size={14} />
            </button>
          </Tooltip>
        </div>
        <div className='mt-3'>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='flex items-center gap-2'>
              <span className='fs-12 text-white/50'>สถานะการแสดงผล :</span>
              <StatusPill
                status={item.status}
                size='sm'
                tooltip={<span className='fs-12'>สถานะ playback ของคำสั่งบนป้าย</span>}
              />
            </div>
            <span
              className={`inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border ${item.is_online ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'}`}
              title='สถานะการเชื่อมต่อของฮาร์ดแวร์ป้าย (คนละอันกับสถานะการแสดงผล)'
            >
              เชื่อมต่อฮาร์ดแวร์ · {item.is_online ? 'ปกติ' : 'ผิดปกติ'}
            </span>
          </div>
          {item.is_all_day ? (
            <>
              <p className='fs-12 text-white/50'>วันที่และเวลาขึ้นจอ : <span className='text-white'>{fmtDateTime(allDayStart)}</span></p>
              <p className='fs-12 text-white/50'>วันที่และเวลาดับจอ : <span className='text-white'>{fmtDateTime(allDayEnd)}</span></p>
            </>
          ) : (
            <>
              <p className='fs-12 text-white/50'>วันที่เริ่มต้น : <span className='text-white'>{fmtDate(item.start_date)}</span></p>
              <p className='fs-12 text-white/50'>วันที่สิ้นสุด : <span className='text-white'>{fmtDate(item.end_date)}</span></p>
              {perDayWindows && (
                <p className='fs-12 text-white/50'>ช่วงเวลาต่อวัน : <span className='text-white'>{perDayWindows}</span></p>
              )}
            </>
          )}
          <div>
            <p className='fs-12 text-white/50'>เงื่อนไขการทำงาน :</p>
            {renderCondition}
          </div>
        </div>
      </section>
      <section className='mt-3'>
        {/* Additional content can be added here */}
        <HLSLivePlayer
          cameraId={String(item.vms_id)}
          hlsUrl={item.screen_capture_url}
          enableViewportPause
          figureClassName='figure-extra-large lg:h-60! lg:min-h-0! lg:max-h-none! w-full mb-2 rounded-lg overflow-hidden cursor-pointer'
          onClick={() => setOpenVMSScreen({ open: true, id: item.vms_id, vms_url: item.screen_capture_url })}
        />
      </section>
      <section className='mt-3'>
        <Swiper
          loop={item.cameras.length > 1}
          modules={[Pagination]}
          pagination={{ clickable: true }}
          autoHeight
          className='w-full'
        >
          {item.cameras.map((cameraItem, index) => (
            <SwiperSlide key={cameraItem.camera_id ?? index} className='bg-transparent! pb-7'>
              <HLSLivePlayer
                cameraId={String(cameraItem.camera_id)}
                hlsUrl={cameraItem.hls_url}
                enableViewportPause
                figureClassName='figure-extra-large lg:h-60! lg:min-h-0! lg:max-h-none! w-full mb-2 rounded-lg overflow-hidden cursor-pointer'
                onClick={() => dispatch(setCCTVModalOpen({ open: true, camera_id: cameraItem.camera_id }))}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
    </div>
  )
}

export default React.memo<Props>(StatusList)
