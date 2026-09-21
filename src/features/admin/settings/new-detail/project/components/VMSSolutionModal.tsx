"use client"
import { App, Input, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useCallback, useMemo, useState } from 'react'
import { useCreateVMSSolutionExistingCamera, useVMSSolutionDetail } from '@/hooks/queries/manage'
import type { APIResponseCamera } from '@/types/manage/solution-api'
import { errText } from '@/features/admin/settings/new-detail/project/context'
import { useEquipmentModal } from '../hooks/useEquipmentModal'
import { EquipmentLiveButton, EquipmentModalFooter, EquipmentModalShell, EquipmentStatusPill } from '../components'

interface Props {

}

/** VMS provisioning modal (`equipment_modal`, type VMS). Backend contract
 *  (`POST /solution/vms/solution/existing_camera`): upsert on solution_id —
 *  the desktop-screen URL is overwritten and the camera links are DELETED then
 *  re-INSERTed from `camera_id`, so the picker is seeded with what the VMS
 *  currently carries and submits the full list going forward. Same
 *  replace-on-write shape as the other pickers. */
const VMSSolutionModal: React.FC<Props> = (props) => {
  const { } = props
  const { open, item, record, cameras, camerasLoading, close, openLiveStream } = useEquipmentModal('VMS')
  const { message } = App.useApp()
  const { mutate: createVms, isPending } = useCreateVMSSolutionExistingCamera()

  // Both fields are `null` while untouched → show whatever the VMS currently
  // has. Only once the operator edits does a field hold its own value. Seeding
  // via an effect instead would fight a late refetch and cascade a render.
  const [typedUrl, setTypedUrl] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [picked, setPicked] = useState<string[] | null>(null)

  // The VMS's current desktop-screen URL + linked cameras. Prefilling matters:
  // the backend upserts, so a blank URL or an unticked camera is a deletion.
  const provisioned = useVMSSolutionDetail(open && record ? record.id : null)

  const linkedIds = useMemo(() => provisioned.data?.camera_id ?? [], [provisioned.data])
  const selectedIds = picked ?? linkedIds
  const desktopUrl = typedUrl ?? provisioned.data?.desktop_screen_url ?? ''

  // State lives across open/close (the modal component itself never unmounts),
  // so clear it on the way out rather than on the way in.
  const handleClose = useCallback(() => {
    setPicked(null)
    setTypedUrl(null)
    setUrlError(null)
    close()
  }, [close])

  const columns: ColumnsType<APIResponseCamera> = useMemo(
    () => [
      {
        title: 'ชื่ออุปกรณ์',
        dataIndex: 'camera_name',
        key: 'camera_name',
        ellipsis: true,
        render: (v: string) => v || '-',
      },
      {
        title: 'กม.ที่ / STA',
        dataIndex: 'sta',
        key: 'sta',
        width: 140,
        render: (v: string | null | undefined) => v || '-',
      },
      {
        title: 'IP Address',
        dataIndex: 'ip_address',
        key: 'ip_address',
        width: 160,
        render: (v: string | null | undefined) => v || '-',
      },
      {
        title: 'สถานะการเชื่อมต่อ',
        dataIndex: 'curl_status',
        key: 'curl_status',
        width: 160,
        render: (v: boolean | undefined) => <EquipmentStatusPill online={Boolean(v)} />,
      },
      {
        title: 'Live Stream',
        key: 'live',
        width: 130,
        align: 'center',
        render: (_: unknown, row) => <EquipmentLiveButton onClick={() => openLiveStream(row)} />,
      },
    ],
    [openLiveStream],
  )

  const handleConfirm = useCallback(() => {
    if (!record) return
    const url = desktopUrl.trim()
    if (!url) {
      setUrlError('กรุณาระบุ Desktop Screen URL')
      return
    }
    try {
      new URL(url)
    } catch {
      setUrlError('URL ไม่ถูกต้อง')
      return
    }
    setUrlError(null)
    createVms(
      { solution_id: record.id, desktop_screen_url: url, camera_id: selectedIds },
      {
        onSuccess: () => {
          message.success('บันทึกอุปกรณ์ VMS สำเร็จ')
          handleClose()
        },
        onError: (error) => {
          message.error(errText(error, 'บันทึกอุปกรณ์ VMS ไม่สำเร็จ'))
        },
      },
    )
  }, [record, desktopUrl, selectedIds, createVms, message, handleClose])

  const loading = camerasLoading || provisioned.isLoading

  return (
    <EquipmentModalShell
      open={open}
      onClose={handleClose}
      title={record?.solution_type.solution_name_atlas || 'VMS'}
      subtitle={item?.location_name || '-'}
    >
      <div className='mb-4'>
        <label className='block mb-2 text-white fs-12 font-medium'>
          Desktop Screen URL
          <span className='text-(--red) ml-0.5'>*</span>
        </label>
        <Input
          value={desktopUrl}
          onChange={(e) => {
            setTypedUrl(e.target.value)
            if (urlError) setUrlError(null)
          }}
          placeholder='https://...'
          // Locked until the prefill lands, so an empty box is never mistaken
          // for "this VMS has no URL".
          disabled={isPending || loading}
          status={urlError ? 'error' : undefined}
          style={{
            background: 'transparent',
            borderColor: urlError ? '#FF6666' : 'rgba(252,209,22,0.25)',
            color: '#FFFFFF',
            height: 44,
            borderRadius: 8,
          }}
        />
        {urlError && <p className='text-(--red) fs-12 mt-1.5 mb-0'>{urlError}</p>}
      </div>

      <p className={`fs-12 mb-2 ${selectedIds.length === 0 ? 'text-(--red)' : 'text-white/75'}`}>
        {selectedIds.length === 0
          ? 'ไม่ได้เลือกกล้องใดเลย — บันทึกแล้วกล้องทั้งหมดจะถูกถอดออกจากอุปกรณ์ VMS นี้'
          : 'เลือกกล้องที่ต้องการผูกกับอุปกรณ์ VMS นี้ (รายการที่เลือกจะแทนที่รายการเดิมทั้งหมด)'}
      </p>

      <Table<APIResponseCamera>
        rowKey='id'
        columns={columns}
        dataSource={cameras}
        loading={loading}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setPicked(keys as string[]),
          columnTitle: 'เลือก',
          columnWidth: 70,
        }}
        pagination={false}
        size='middle'
        locale={{ emptyText: 'ยังไม่มีกล้อง CCTV ที่จุดติดตั้งนี้ให้เลือก' }}
      />

      <EquipmentModalFooter
        onCancel={handleClose}
        onConfirm={handleConfirm}
        confirmLoading={isPending}
        // Saving with nothing ticked is allowed on purpose — it unlinks every
        // camera, which is the step before deleting the VMS.
        confirmDisabled={loading}
        busy={isPending}
      />
    </EquipmentModalShell>
  )
}

export default React.memo<Props>(VMSSolutionModal)
