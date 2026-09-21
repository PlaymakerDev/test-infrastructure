"use client"
import { App, Button, Popconfirm, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useCallback, useMemo } from 'react'
import { TbPlus, TbTrash } from 'react-icons/tb'
import { useDeleteCamera } from '@/hooks/queries/manage'
import { useAppDispatch } from '@/stores/hooks'
import { setCreateDeviceModalOpen } from '@/stores/reducers/modal/customModalSlice'
import type { APIResponseCamera } from '@/types/manage/solution-api'
import { errText } from '@/features/admin/settings/new-detail/project/context'
import { useEquipmentModal } from '../hooks/useEquipmentModal'
import { EquipmentLiveButton, EquipmentModalFooter, EquipmentModalShell, EquipmentStatusPill } from '../components'

interface Props {

}

/** CCTV camera list at the install point, opened from the "รายการอุปกรณ์"
 *  column (`equipment_modal`, type CCTV_LIST). Row delete goes straight to
 *  `DELETE /cctv/cameras/{id}`; "เพิ่มอุปกรณ์" opens ModalCreateDevice in its
 *  CREATE_CAMERA mode. Both refresh this list through the shared
 *  `manageKeys.solutions` invalidation, so no manual refetch is needed. */
const EquipmentCCTVListModal: React.FC<Props> = (props) => {
  const { } = props
  const { open, item, record, cameras, camerasLoading, close, openLiveStream } = useEquipmentModal('CCTV_LIST')
  const dispatch = useAppDispatch()
  const { message } = App.useApp()
  const { mutate: deleteCamera, isPending: isDeleting, variables: deletingId } = useDeleteCamera()

  const handleAdd = useCallback(() => {
    dispatch(setCreateDeviceModalOpen({ open: true, type: 'CREATE_CAMERA', item, record }))
  }, [dispatch, item, record])

  const handleDelete = useCallback((id: string) => {
    deleteCamera(id, {
      onSuccess: () => {
        message.success('ลบอุปกรณ์สำเร็จ')
      },
      onError: (error) => {
        message.error(errText(error, 'ลบอุปกรณ์ไม่สำเร็จ'))
      },
    })
  }, [deleteCamera, message])

  const columns: ColumnsType<APIResponseCamera> = useMemo(
    () => [
      { title: 'ลำดับ', key: 'no', width: 60, render: (_: unknown, __: APIResponseCamera, i: number) => i + 1 },
      {
        title: 'ชื่ออุปกรณ์',
        dataIndex: 'camera_name',
        key: 'camera_name',
        ellipsis: true,
        render: (v: string) => v || '-',
      },
      {
        title: 'อัพเดตล่าสุด',
        key: 'lastUpdated',
        width: 200,
        // Health-check timestamps first — /manage/solution/camera/list returns
        // the raw model (`curl_updated` / `ping_updated`, not `..._at`).
        render: (_: unknown, row) => {
          const v = row.curl_updated ?? row.curl_updated_at ?? row.ping_updated ?? row.updated_at ?? row.created_at
          return v && dayjs(v).isValid() ? dayjs(v).format('DD MMM YYYY HH:mm:ss') : '-'
        },
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
      {
        title: 'จัดการ',
        key: 'actions',
        width: 90,
        align: 'center',
        render: (_: unknown, row) => (
          <Popconfirm
            title='ลบอุปกรณ์นี้?'
            description='การลบไม่สามารถย้อนกลับได้'
            okText='ลบ'
            cancelText='ยกเลิก'
            okButtonProps={{ loading: isDeleting && deletingId === row.id }}
            onConfirm={() => handleDelete(row.id)}
            placement='topRight'
          >
            <button type='button' className='text-(--red) cursor-pointer hover:opacity-80' title='ลบ'>
              <TbTrash size={18} />
            </button>
          </Popconfirm>
        ),
      },
    ],
    [openLiveStream, handleDelete, isDeleting, deletingId],
  )

  return (
    <EquipmentModalShell
      open={open}
      onClose={close}
      width={1100}
      title={record?.solution_type.solution_name_atlas || record?.solution_type.solution_name || '-'}
      subtitle={item?.location_name || '-'}
      headerExtra={
        <Button
          shape='round'
          icon={<TbPlus size={16} />}
          onClick={handleAdd}
          style={{
            background: '#FCD116',
            color: '#1A1A1A',
            borderColor: '#FCD116',
            fontWeight: 600,
            padding: '6px 18px',
            height: 'auto',
          }}
        >
          เพิ่มอุปกรณ์
        </Button>
      }
    >
      <Table<APIResponseCamera>
        rowKey='id'
        columns={columns}
        dataSource={cameras}
        loading={camerasLoading}
        pagination={false}
        size='middle'
        locale={{ emptyText: 'ยังไม่มีอุปกรณ์ในจุดติดตั้งนี้' }}
      />

      <EquipmentModalFooter onCancel={close} cancelText='ปิด' />
    </EquipmentModalShell>
  )
}

export default React.memo<Props>(EquipmentCCTVListModal)
