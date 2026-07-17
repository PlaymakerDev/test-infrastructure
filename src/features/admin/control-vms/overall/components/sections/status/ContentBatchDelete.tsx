import { APIResponseVMSMediaById } from '@/types/control-vms/display-api'
import { Button, ConfigProvider } from 'antd'
import React, { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { INIT_UPDATE_SCHEDULE, useControlVMSContext } from '../../../context'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { usePostVMSBatchDelete } from '../../../hooks/usePostVMSBatchDelete'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { FormUpdateBatch } from '../../../components'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {
  id?: string | number
  data?: APIResponseVMSMediaById
}

interface FormValues {
  schedule_ids: number[]
}

const ContentBatchDelete: React.FC<Props> = (props) => {
  const { id, data } = props
  const { setUpdateScheduleState } = useControlVMSContext()
  const batchDelete = usePostVMSBatchDelete()
  const allScheduleIds = useMemo(() => (data?.schedules ?? []).map((s) => s.id), [data])

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    // Checked = will be cancelled. Default every schedule checked so
    // confirming this "ยกเลิกคำสั่ง" action cancels everything right away —
    // the common case of a single schedule needs zero clicks to confirm.
    // Unchecking a row keeps it running, for the rarer case of a
    // multi-schedule order where only some entries should be cancelled.
    defaultValues: { schedule_ids: allScheduleIds },
  })

  const onSubmit = (values: FormValues) => {
    if (!id) return
    batchDelete.mutate(
      { id, schedule_ids: values.schedule_ids },
      { onSuccess: () => setUpdateScheduleState(INIT_UPDATE_SCHEDULE) },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='lg:px-8'>
      <section>
        <ExclamationCircleOutlined
          className='text-red-500! text-9xl! mb-5! mx-auto! block!'
        />
        <div className='text-center mt-3'>
          <h2 className='text-black'>ยืนยันยกเลิกคำสั่งหรือไม่?</h2>
          <p className='text-black'>ระบบจะยกเลิกคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้</p>
        </div>
      </section>

      <section className='mt-5'>
        <div className='h-full bg-red-500/20 border-2 rounded-lg px-4 py-2 lg:px-8 lg:py-4 border-red-500'>
          <p className='fs-12 text-(--light-gray)'>จุดติดตั้ง : <span className='text-black'>{data?.solution_name || '-'}</span></p>
          <p className='fs-12 text-(--light-gray)'>หมวดหมู่ : <span className='text-black'>{data?.setting_type_name || '-'}</span></p>
          <p className='fs-12 text-(--light-gray)'>หน่วยงานรับผิดชอบ : <span className='text-black'>{data?.department_short_name || '-'}</span></p>
          <div>
            <p className='fs-12 text-(--light-gray)'>ระยะเวลาแสดงผล :</p>
            {allScheduleIds.length > 1 && (
              <p className='fs-12 text-(--light-gray) mb-1'>ติ๊กตารางเวลาที่ต้องการยกเลิก ปลดติ๊กรายการที่ต้องการเก็บไว้</p>
            )}
            <Controller
              control={control}
              name="schedule_ids"
              rules={{ validate: (v) => v.length > 0 || 'กรุณาเลือกตารางเวลาที่ต้องการยกเลิกอย่างน้อย 1 รายการ' }}
              render={({ field }) => (
                <fieldset>
                  <FormUpdateBatch data={data?.schedules} value={field.value} onChange={field.onChange} />
                  {!!errors.schedule_ids && <p className='text-red-500 mt-2'>{errors.schedule_ids.message}</p>}
                </fieldset>
              )}
            />
          </div>
          <p className='fs-12 text-(--light-gray)'>สถานะการแสดงผล : <span className='text-red-500 font-bold'>{data?.status_name || '-'}</span></p>
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
              onClick={() => setUpdateScheduleState(INIT_UPDATE_SCHEDULE)}
              disabled={batchDelete.isPending}
            >
              <p className='fs-12'>ยกเลิก</p>
            </Button>
          </ConfigProvider>
          <ConfigProvider theme={{ token: { colorPrimary: '#ef4444', colorTextLightSolid: '#FFFFFF' } }}>
            <Button
              type='primary'
              htmlType='submit'
              shape='round'
              className='w-full! sm:w-auto!'
              loading={batchDelete.isPending}
              disabled={batchDelete.isPending}
            >
              <p className='fs-12'>ยืนยัน</p>
            </Button>
          </ConfigProvider>
        </div>
      </section>
    </form>
  )
}

export default React.memo<Props>(ContentBatchDelete)
