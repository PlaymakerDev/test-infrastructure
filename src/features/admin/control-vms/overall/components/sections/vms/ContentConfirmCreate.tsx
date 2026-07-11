import { APIResponseVMSSettingByVMSID, ScheduleByVMSID } from '@/types/control-vms/display-api'
import { Button, ConfigProvider, Empty, Popover } from 'antd'
import React, { useCallback, useMemo } from 'react'
import { INIT_OPEN_CONFIRM_CREATE, INIT_UPDATE_SCHEDULE, useControlVMSContext } from '../../../context'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { usePostVMSMedia } from '../../../hooks/usePostVMSMedia'
import { usePutVMSMedia } from '../../../hooks/usePutVMSMedia'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { APIRequestPostVMSMedia } from '@/types/control-vms/vms-api'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {
  data?: APIResponseVMSSettingByVMSID
  body?: APIRequestPostVMSMedia
  /** Present when confirming an EDIT (routes to PUT); absent for CREATE (POST). */
  id?: string | number
}

const ContentConfirmCreate: React.FC<Props> = (props) => {
  const { data, body, id } = props
  const { setOpenConfirmCreate, setAddMode, setUpdateScheduleState, setCurrentTab } = useControlVMSContext()
  const postMedia = usePostVMSMedia()
  const putMedia = usePutVMSMedia()
  const isPending = postMedia.isPending || putMedia.isPending

  const handleConfirm = () => {
    if (!body) return
    // `id` is only present when confirming an EDIT (PUT) — its absence means
    // this was a CREATE (POST), whether from FormAddDetail or FormUpdateSchedule
    // with type === 'CREATE'. Only a brand-new schedule should jump to STATUS.
    const isCreate = !id
    const onSuccess = () => {
      setOpenConfirmCreate(INIT_OPEN_CONFIRM_CREATE)
      setAddMode(false)
      setUpdateScheduleState(INIT_UPDATE_SCHEDULE)
      if (isCreate) setCurrentTab('STATUS')
    }
    if (id) {
      putMedia.mutate({ id, data: body }, { onSuccess })
    } else {
      postMedia.mutate(body, { onSuccess })
    }
  }

  const formatScheduleDuration = useCallback((timeSince: string, timeTo: string) => {
    // Recompute the value fresh in whichever unit is chosen — do not just relabel
    // a value already rounded in a bigger unit (e.g. 0.98 ชั่วโมง -> "0.98 นาที"
    // is wrong; the correct minute value for that same span is ~59 นาที).
    const diffMinutes = dayjs(timeTo, 'HH:mm').diff(dayjs(timeSince, 'HH:mm'), 'minute', true)
    const diffHours = diffMinutes / 60
    if (diffHours >= 1) return `${Math.round(diffHours * 100) / 100} ชั่วโมง`
    if (diffMinutes >= 1) return `${Math.round(diffMinutes * 100) / 100} นาที`
    return `${Math.round(diffMinutes * 60 * 100) / 100} วินาที`
  }, [])

  const renderCurrentScheduleTime = useCallback((schedule: ScheduleByVMSID[] | undefined) => {
    const list = schedule ?? []
    if (!list.length) return <li>-</li>
    return list.map((item) => {
      return (
        <li key={`${item.schedule_name}-${item.time_since}`}>
          <p className='fs-12 text-black'>{item.schedule_name} {item.time_since} - {item.time_to} ({formatScheduleDuration(item.time_since, item.time_to)})</p>
        </li>
      )
    })
  }, [formatScheduleDuration])

  const renderNewScheduleTime = useCallback((schedule: APIRequestPostVMSMedia | undefined) => {
    if (!schedule?.schedules?.length) return <li>-</li>
    return schedule.schedules.map((item) => {
      return (
        <li key={`${item.schedule_name}-${item.time_since}`}>
          <p className='fs-12 text-black'>{item.schedule_name} {item.time_since} - {item.time_to} ({schedule.is_all_day ? 'แสดงผลตลอดเวลา' : formatScheduleDuration(item.time_since, item.time_to)})</p>
        </li>
      )
    })
  }, [formatScheduleDuration])

  const renderPopoverContent = useCallback((data: APIResponseVMSSettingByVMSID) => {
    return (data ?? []).slice(1).map((item, index) => {
      return (
        <div
          key={`${item.solution_name}-${index}`}
          className='h-full bg-orange-500/20 border-2 rounded-lg px-4 py-2 lg:px-8 lg:py-4 border-orange-500 mb-3'
        >
          <h4 className='text-black'>คำสั่งเดิม</h4>
          <div className='mt-1.5'>
            <p className='fs-12 text-(--light-gray)'>จุดติดตั้ง : <span className='text-black'>{item?.solution_name || '-'}</span></p>
            <p className='fs-12 text-(--light-gray)'>ระยะเวลาแสดงผล :</p>
            <ul>
              {renderCurrentScheduleTime(item?.schedule)}
            </ul>
            <p className='fs-12 text-(--light-gray)'>สถานะการแสดงผล : <span className='text-orange-500 font-bold'>{item.status_name || '-'}</span></p>
          </div>
        </div>
      )
    })
  }, [renderCurrentScheduleTime])

  const renderCurrentSchedule = useMemo(() => {
    // if (!data || data.length === 0) return <Empty description="ไม่พบข้อมูล" />
    if (!data || data.length === 0) return
    return (
      <div
        className='h-full bg-orange-500/20 border-2 rounded-lg px-4 py-2 lg:px-8 lg:py-4 border-orange-500'
      >
        <div className='flex items-center justify-between gap-2'>
          <h4 className='text-black'>คำสั่งเดิม</h4>
          {data.length === 1 ? null : (
            <Popover
              content={renderPopoverContent(data)}
              placement='right'
            >
              <p className='fs-12 text-black underline cursor-pointer'>และอีก {data.length - 1} รายการ</p>
            </Popover>
          )}
        </div>
        <div className='mt-1.5'>
          <p className='fs-12 text-(--light-gray)'>จุดติดตั้ง : <span className='text-black'>{data[0]?.solution_name || '-'}</span></p>
          <p className='fs-12 text-(--light-gray)'>ระยะเวลาแสดงผล :</p>
          <ul>
            {renderCurrentScheduleTime(data[0]?.schedule)}
          </ul>
          <p className='fs-12 text-(--light-gray)'>สถานะการแสดงผล : <span className='text-orange-500 font-bold'>{data[0]?.status_name || '-'}</span></p>
        </div>
      </div>
    )
  }, [data, renderCurrentScheduleTime, renderPopoverContent])

  return (
    <div className='lg:px-8'>
      <section>
        <ExclamationCircleOutlined
          className='text-orange-500! text-9xl! mb-5! mx-auto! block!'
        />
        <div className='text-center mt-3'>
          <h2 className='text-black'>ยืนยันเพิ่มคำสั่งใหม่หรือไม่?</h2>
          <p className='text-black'>ระบบจะลบคำสั่งเดิมและดำเนินการคำสั่งใหม่ทันที</p>
        </div>
      </section>

      <section className='mt-3'>
        {renderCurrentSchedule}
      </section>

      <section className='mt-3'>
        <div className='h-full bg-blue-500/20 border-2 rounded-lg px-4 py-2 lg:px-8 lg:py-4 border-blue-500'>
          <h4 className='text-black'>คำสั่งใหม่</h4>
          <div className='mt-1.5'>
            <p className='fs-12 text-(--light-gray)'>ระยะเวลาแสดงผล :</p>
            <ul>
              {renderNewScheduleTime(body)}
            </ul>
          </div>
        </div>
      </section>

      <section className='mt-3'>
        <div className='flex flex-col sm:flex-row sm:justify-end gap-3'>
          <ConfigProvider theme={{ token: { colorPrimary: '#6B6B6B', colorTextLightSolid: '#FFFFFF' } }}>
            <Button
              type='primary'
              htmlType='button'
              shape='round'
              className='w-full! sm:w-auto!'
              onClick={() => setOpenConfirmCreate(INIT_OPEN_CONFIRM_CREATE)}
              disabled={isPending}
            >
              <p className='fs-12'>ยกเลิก</p>
            </Button>
          </ConfigProvider>
          <Button
            type='primary'
            htmlType='button'
            shape='round'
            className='w-full! sm:w-auto!'
            loading={isPending}
            disabled={isPending}
            onClick={handleConfirm}
          >
            <p className='fs-12'>ยืนยัน</p>
          </Button>
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(ContentConfirmCreate)
