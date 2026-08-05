import React, { useMemo } from 'react'
import { Button, ConfigProvider, Empty, Modal, Skeleton } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { useQueries } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { getVMSSettingByStatusAPI } from '@/services/routes/ControlVMSService'
import type { MediaScheduleByID, VMSSettingByStatus } from '@/types/control-vms/display-api'
import { controlVmsKeys } from '../../../data/queryKeys'
import { useVMSSettingStatusCount } from '../../../hooks/useVMSSettingStatusCount'
import { usePostVMSCancelAll } from '../../../hooks/usePostVMSCancelAll'
import FormUpdateBatch from './FormUpdateBatch'

interface Props {
  open: boolean
  onClose: () => void
}

interface FormValues {
  schedule_ids: number[]
}

/** ScheduleByStatus → the shape FormUpdateBatch renders (MediaScheduleByID).
 *  by-status ships `schedule_id` (not `id`) and has no media fields. */
const toBatchRows = (setting: VMSSettingByStatus): MediaScheduleByID[] =>
  (setting.schedules ?? []).map((s) => ({
    id: s.schedule_id,
    days_of_week: s.days_of_week,
    media_url: '',
    message: '',
    schedule_name: s.schedule_name,
    time_since: s.time_since,
    time_to: s.time_to,
  }))

interface CancelAllFormProps {
  settings: VMSSettingByStatus[]
  isPending: boolean
  onClose: () => void
  /** Fire the batch cancel. The mutation + close live in the parent (which
   *  stays mounted) so the success auto-close isn't lost when this form
   *  unmounts as the deleted rows drop out — see the note on the parent. */
  onSubmit: (scheduleIds: number[], settingIds: (string | number)[]) => void
}

const CancelAllForm: React.FC<CancelAllFormProps> = ({ settings, isPending, onClose, onSubmit }) => {
  const allIds = useMemo(
    () => settings.flatMap((s) => (s.schedules ?? []).map((sc) => sc.schedule_id)),
    [settings],
  )

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    // Checked = will be cancelled; everything starts checked (same rule as the
    // per-card ยกเลิกคำสั่ง modal) — untick a row to keep it running.
    defaultValues: { schedule_ids: allIds },
  })
  const checked = watch('schedule_ids')

  const submit = (values: FormValues) => {
    // Only invalidate settings that actually had a schedule cancelled.
    const settingIds = settings
      .filter((s) => (s.schedules ?? []).some((sc) => values.schedule_ids.includes(sc.schedule_id)))
      .map((s) => s.setting_id)
    onSubmit(values.schedule_ids, settingIds)
  }

  return (
    <form onSubmit={handleSubmit(submit)} className='lg:px-8'>
      <section>
        <ExclamationCircleOutlined className='text-red-500! text-9xl! mb-5! mx-auto! block!' />
        <div className='text-center mt-3'>
          <h2 className='text-black'>ยืนยันยกเลิกคำสั่งทั้งหมดหรือไม่?</h2>
          <p className='text-black'>ระบบจะยกเลิกคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้</p>
          <p className='fs-12 text-(--light-gray)'>
            ติ๊กตารางเวลาที่ต้องการยกเลิก ปลดติ๊กรายการที่ต้องการเก็บไว้
          </p>
        </div>
      </section>

      <Controller
        control={control}
        name='schedule_ids'
        rules={{ validate: (v) => v.length > 0 || 'กรุณาเลือกตารางเวลาที่ต้องการยกเลิกอย่างน้อย 1 รายการ' }}
        render={({ field }) => (
          <section className='mt-5 max-h-[45vh] overflow-y-auto pr-1 flex flex-col gap-3'>
            {settings.map((setting) => {
              const boxIds = (setting.schedules ?? []).map((s) => s.schedule_id)
              return (
                <div
                  key={setting.setting_id}
                  className='bg-red-500/20 border-2 rounded-lg px-4 py-2 lg:px-8 lg:py-4 border-red-500'
                >
                  <p className='fs-12 text-(--light-gray)'>
                    จุดติดตั้ง : <span className='text-black'>{setting.solution_name || '-'}</span>
                  </p>
                  <p className='fs-12 text-(--light-gray)'>
                    หมวดหมู่ : <span className='text-black'>{setting.type_name || '-'}</span>
                  </p>
                  <div>
                    <p className='fs-12 text-(--light-gray)'>ระยะเวลาแสดงผล :</p>
                    <FormUpdateBatch
                      data={toBatchRows(setting)}
                      value={field.value.filter((id) => boxIds.includes(id))}
                      // Merge this box's picks back into the shared field —
                      // other settings' checked ids must survive untouched.
                      onChange={(ids) =>
                        field.onChange([...field.value.filter((id) => !boxIds.includes(id)), ...ids])
                      }
                    />
                  </div>
                  <p className='fs-12 text-(--light-gray)'>
                    สถานะการแสดงผล : <span className='text-red-500 font-bold'>{setting.status_name || '-'}</span>
                  </p>
                </div>
              )
            })}
            {!!errors.schedule_ids && <p className='text-red-500'>{errors.schedule_ids.message}</p>}
          </section>
        )}
      />

      <section className='mt-3'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <p className='fs-12 text-(--light-gray) mb-0'>
            จะยกเลิก <span className='text-red-500 font-bold'>{checked.length}</span> ตารางเวลา จาก{' '}
            {settings.length} คำสั่ง
          </p>
          <div className='flex flex-col sm:flex-row gap-3'>
            <ConfigProvider theme={{ token: { colorPrimary: '#6B6B6B', colorTextLightSolid: '#FFFFFF' } }}>
              <Button
                type='primary'
                htmlType='button'
                shape='round'
                className='w-full! sm:w-auto!'
                onClick={onClose}
                disabled={isPending}
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
                loading={isPending}
                disabled={isPending}
              >
                <p className='fs-12'>ยืนยัน</p>
              </Button>
            </ConfigProvider>
          </div>
        </div>
      </section>
    </form>
  )
}

/**
 * "ยกเลิกคำสั่งทั้งหมด" — bulk version of the per-card ยกเลิกคำสั่ง modal
 * (same white dialog, same red summary boxes, one box per setting). Pulls
 * every ACTIVE setting across ALL status tabs from the same by-status queries
 * the tabs use (cache-shared), so no extra endpoint is needed: by-status rows
 * already carry their schedule_ids. Modal state is local to StatusSection per
 * the control-vms convention.
 */
const ModalCancelAllCommands: React.FC<Props> = ({ open, onClose }) => {
  // Mutation lives HERE (not in CancelAllForm): on success the deleted rows
  // drop out of by-status, `settings` empties, and the form below unmounts
  // (swapped for <Empty>). A mutate() callback whose owner unmounts is dropped
  // by React Query — that's why the modal used to hang open (reported
  // 2026-08-05). This component stays mounted, so its onSuccess→onClose always
  // fires.
  const cancelAll = usePostVMSCancelAll()
  const handleSubmit = (schedule_ids: number[], setting_ids: (string | number)[]) => {
    cancelAll.mutate({ schedule_ids, setting_ids }, { onSuccess: onClose })
  }

  const { data: counts } = useVMSSettingStatusCount()
  const statusIds = useMemo(
    () => (counts?.data ?? []).filter((s) => (s.count ?? 0) > 0).map((s) => s.status_id),
    [counts],
  )

  const results = useQueries({
    queries: statusIds.map((id) => ({
      queryKey: controlVmsKeys.byStatusList(id),
      queryFn: () => getVMSSettingByStatusAPI({ status_id: id }),
      placeholderData: keepPreviousData,
      enabled: open,
    })),
  })
  const isLoading = open && results.some((r) => r.isLoading)
  const settings = useMemo(() => {
    const seen = new Set<number>()
    const out: VMSSettingByStatus[] = []
    for (const r of results) {
      for (const s of r.data?.data ?? []) {
        if (seen.has(s.setting_id)) continue
        seen.add(s.setting_id)
        out.push(s)
      }
    }
    return out
  }, [results])

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#000000',
            contentBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            footerBg: '#FFFFFF',
          },
        },
      }}
    >
      <Modal open={open} onCancel={onClose} onOk={onClose} footer={null} destroyOnHidden width={700}>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : settings.length === 0 && !cancelAll.isPending ? (
          // Skip the empty flash while a cancel is in flight — the rows are
          // being deleted; the modal closes on success right after.
          <Empty description='ไม่มีคำสั่งที่ยกเลิกได้' />
        ) : (
          <CancelAllForm
            settings={settings}
            isPending={cancelAll.isPending}
            onClose={onClose}
            onSubmit={handleSubmit}
          />
        )}
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalCancelAllCommands)
