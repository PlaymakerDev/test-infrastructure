import React, { useMemo } from 'react'
import { Button, ConfigProvider, Empty, Modal, Skeleton } from 'antd'
import { useQueries } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { getVMSSettingByStatusAPI } from '@/services/routes/ControlVMSService'
import type { VMSSettingByStatus } from '@/types/control-vms/display-api'
import { controlVmsKeys } from '../../../data/queryKeys'
import { useVMSSettingStatusCount } from '../../../hooks/useVMSSettingStatusCount'
import { usePostVMSCancelAll } from '../../../hooks/usePostVMSCancelAll'

interface Props {
  open: boolean
  onClose: () => void
}

/** Statuses cancel-all flips to 6: active (0-3) plus queued-behind (8). */
const CANCELLABLE_STATUSES = [0, 1, 2, 3, 8]

/**
 * "ยกเลิกคำสั่งทั้งหมด" — bulk stop for the STATUS tab toolbar. Since
 * 2026-08-20 this fires POST /vms/settings/cancel-all with the affected
 * vms_ids: the endpoint cancels each sign's active commands AND its queue in
 * one transaction, so there is nothing to tick per schedule any more — the
 * dialog is a plain confirmation that lists what is about to stop.
 *
 * The affected list comes from the same by-status queries the tabs use
 * (cache-shared), so no extra endpoint is needed. Modal state is local to
 * StatusSection per the control-vms convention.
 */
const ModalCancelAllCommands: React.FC<Props> = ({ open, onClose }) => {
  // Mutation lives HERE (not in a child form): on success the cancelled rows
  // drop out of by-status and any child would unmount mid-flight — a mutate()
  // callback whose owner unmounts is dropped by React Query, which is what
  // used to leave this modal hanging open (reported 2026-08-05).
  const cancelAll = usePostVMSCancelAll()

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
  const allSettings = useMemo(() => {
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

  // Only what cancel-all actually touches: active (0-3) + queued (8). Terminal
  // rows (done / lost / cancelled / overwritten) still show up in by-status,
  // and listing them here would overstate what the button does.
  const settings = useMemo(
    () => allSettings.filter((s) => CANCELLABLE_STATUSES.includes(s.status)),
    [allSettings],
  )

  // One entry per sign — the endpoint keys on vms_id, and several settings of
  // the same sign collapse into a single id.
  const vmsIds = useMemo(
    () => Array.from(new Set(settings.map((s) => s.vms_id).filter((id) => !!id))),
    [settings],
  )

  const handleConfirm = () => {
    cancelAll.mutate({ vms_ids: vmsIds }, { onSuccess: onClose })
  }

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
          // being cancelled; the modal closes on success right after.
          <Empty description='ไม่มีคำสั่งที่ยกเลิกได้' />
        ) : (
          <div className='lg:px-8'>
            <section>
              <ExclamationCircleOutlined className='text-red-500! text-9xl! mb-5! mx-auto! block!' />
              <div className='text-center mt-3'>
                <h2 className='text-black'>ยืนยันยกเลิกคำสั่งทั้งหมดหรือไม่?</h2>
                <p className='text-black'>ระบบจะยกเลิกคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้</p>
                <p className='fs-12 text-(--light-gray)'>
                  ยกเลิกทั้งคำสั่งที่กำลังแสดงผลและคำสั่งที่รออยู่ในคิว — ป้ายจะว่างจนกว่าจะมีคำสั่งใหม่
                </p>
              </div>
            </section>

            <section className='mt-5 max-h-[45vh] overflow-y-auto pr-1 flex flex-col gap-3'>
              {settings.map((setting) => (
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
                    <ul className='fs-12 text-black mt-0.5 mb-1 pl-4'>
                      {(setting.schedules ?? []).length === 0 ? (
                        <li>-</li>
                      ) : (
                        (setting.schedules ?? []).map((schedule) => (
                          <li key={schedule.schedule_id}>
                            {schedule.schedule_name} {schedule.time_since} - {schedule.time_to}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <p className='fs-12 text-(--light-gray)'>
                    สถานะการแสดงผล : <span className='text-red-500 font-bold'>{setting.status_name || '-'}</span>
                  </p>
                </div>
              ))}
            </section>

            <section className='mt-3'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                <p className='fs-12 text-(--light-gray) mb-0'>
                  จะยกเลิกคำสั่งของ <span className='text-red-500 font-bold'>{vmsIds.length}</span> ป้าย (
                  {settings.length} คำสั่ง)
                </p>
                <div className='flex flex-col sm:flex-row gap-3'>
                  <ConfigProvider theme={{ token: { colorPrimary: '#6B6B6B', colorTextLightSolid: '#FFFFFF' } }}>
                    <Button
                      type='primary'
                      shape='round'
                      className='w-full! sm:w-auto!'
                      onClick={onClose}
                      disabled={cancelAll.isPending}
                    >
                      <p className='fs-12'>ยกเลิก</p>
                    </Button>
                  </ConfigProvider>
                  <ConfigProvider theme={{ token: { colorPrimary: '#ef4444', colorTextLightSolid: '#FFFFFF' } }}>
                    <Button
                      type='primary'
                      shape='round'
                      className='w-full! sm:w-auto!'
                      loading={cancelAll.isPending}
                      disabled={cancelAll.isPending || vmsIds.length === 0}
                      onClick={handleConfirm}
                    >
                      <p className='fs-12'>ยืนยัน</p>
                    </Button>
                  </ConfigProvider>
                </div>
              </div>
            </section>
          </div>
        )}
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalCancelAllCommands)
