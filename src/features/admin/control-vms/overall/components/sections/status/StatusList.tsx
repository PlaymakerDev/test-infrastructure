import DayList from '@/components/list/DayList'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { VMSSettingByStatus } from '@/types/control-vms/display-api'
import { Button, ConfigProvider } from 'antd'
import dayjs from 'dayjs'
import React, { useCallback, useMemo } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useControlVMSContext } from '../../../context'

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
          <Button type='primary'>แสดงผลตลอดเวลา</Button>
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
        <h4 className='text-(--yellow)'>{item.solution_name || '-'}</h4>
        <div className='mt-3'>
          <div className='flex flex-wrap items-center gap-3'>
            <p className='fs-12 text-white/50'>สถานะ : <span className='text-white'>{item.status_name || '-'}</span></p>
            <span className={`inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border ${item.is_online ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'}`}>
              {item.is_online ? 'เชื่อมต่อปกติ' : 'เชื่อมต่อผิดปกติ'}
            </span>
          </div>
          <p className='fs-12 text-white/50'>วันที่และเวลาเริ่มต้น : <span className='text-white'>{dayjs(item.start_date).format('DD MMM BBBB') || '-'}</span></p>
          <p className='fs-12 text-white/50'>วันที่และเวลาสิ้นสุด : <span className='text-white'>{dayjs(item.end_date).format('DD MMM BBBB') || '-'}</span></p>
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
