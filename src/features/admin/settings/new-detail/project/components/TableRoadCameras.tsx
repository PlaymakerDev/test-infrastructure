import React, { useMemo } from 'react'
import { ConfigProvider, Empty, Popconfirm, Table, TableProps } from 'antd'
import { TbPencilMinus, TbTrash } from 'react-icons/tb'
import { ProjectRoadCamera } from '@/types/manage/project-detail-api'

/** Camera connection pill.
 *
 *  Same outlined shape and colours as the CCTV feature's own StatusPill
 *  (cctv/detail CameraInstallTable, CctvMarkerInfoPanel, CameraGridView,
 *  the overall table's count badges all use this blue/red pair) — written
 *  against the globals.css tokens, which hold exactly those two values:
 *  --default-blue #66AEFF, --default-red #E94C4C.
 *
 *  An AntD `Tag color="success"` was wrong here: stock AntD green/red is
 *  off-palette against the yellow-on-black admin theme. */
const ConnectionPill: React.FC<{ online: boolean }> = ({ online }) => (
  <span
    className={`inline-flex items-center px-3 py-0.5 rounded-full fs-12 whitespace-nowrap border ${online
      ? 'border-(--default-blue) text-(--default-blue)'
      : 'border-(--default-red) text-(--default-red)'
      }`}
  >
    {online ? 'ออนไลน์' : 'ออฟไลน์'}
  </span>
)

interface Props {
  data?: ProjectRoadCamera[]
  isLoading?: boolean
  isError?: boolean
  onEdit: (camera: ProjectRoadCamera) => void
  onDelete: (camera: ProjectRoadCamera) => void
  isDeleting?: boolean
}

/** "0+500" → 500 metres. Mirrors utils.ParseSta on the backend: find the
 *  first `km+metres` group anywhere in the value so "4+800 RT" and a
 *  trailing space still sort, and leave values carrying no chainage
 *  ("Online", "2", "") at the end rather than treating them as 0+000. */
const staMetres = (sta: string): number | null => {
  const match = /(\d+)\s*\+\s*(\d+)/.exec(sta ?? '')
  if (!match) return null
  return Number(match[1]) * 1000 + Number(match[2])
}

const compareSta = (a: ProjectRoadCamera, b: ProjectRoadCamera) => {
  const left = staMetres(a.sta)
  const right = staMetres(b.sta)
  if (left === null && right === null) return a.camera_name.localeCompare(b.camera_name)
  if (left === null) return 1
  if (right === null) return -1
  return left - right
}

/**
 * Every CCTV camera on one สายทาง, whichever จุดติดตั้ง it stands at.
 *
 * The จุดติดตั้ง column is the point of this table: cameras used to be
 * reachable only by drilling into a point's tab, which hid the fact that one
 * project's CCTV spans several of them.
 */
const TableRoadCameras: React.FC<Props> = (props) => {
  const { data, isLoading, isError, onEdit, onDelete, isDeleting } = props

  // Widths are sized from the real data (measured 2026-09-21 over the 10,226
  // CCTV cameras in production):
  //   camera_name    avg 42, p95 72, max 134 chars — by far the widest field,
  //                  and the reason this column gets the space and an
  //                  ellipsis+tooltip rather than wrapping rows 4 lines deep
  //   location_name  max 16 ("จุดติดตั้งที่ 10")
  //   sta            p95 6, max 15 ("18+465 RT")
  //   ip_address     max 15 ("255.255.255.255")
  // The last two columns are sized by their HEADERS, not their contents —
  // "สถานะการเชื่อมต่อ" is longer than the pill it sits above.
  const columns: TableProps<ProjectRoadCamera>['columns'] = useMemo(() => [
    {
      title: 'ชื่ออุปกรณ์',
      dataIndex: 'camera_name',
      key: 'camera_name',
      width: 340,
      // Names run to 134 chars; truncate with the full value on hover.
      ellipsis: { showTitle: true },
      render: (_, record) => record.camera_name || '-',
    },
    {
      title: 'จุดติดตั้ง',
      dataIndex: 'location_name',
      key: 'location_name',
      width: 150,
      render: (_, record) => record.location_name || '-',
    },
    {
      title: 'กม.ที่',
      dataIndex: 'sta',
      key: 'sta',
      width: 100,
      sorter: compareSta,
      render: (_, record) => record.sta || '-',
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 140,
      render: (_, record) => record.ip_address || '-',
    },
    {
      title: 'สถานะการเชื่อมต่อ',
      dataIndex: 'curl_status',
      key: 'curl_status',
      width: 160,
      render: (_, record) => <ConnectionPill online={record.curl_status} />,
    },
    {
      title: 'จัดการ',
      dataIndex: 'action',
      key: 'action',
      width: 90,
      render: (_, record) => (
        <div className='flex items-center gap-2 shrink-0'>
          <TbPencilMinus
            className='fs-22 text-(--default-orange) cursor-pointer'
            title='แก้ไขกล้อง'
            onClick={() => onEdit(record)}
          />
          <Popconfirm
            title='ลบกล้องนี้?'
            description='การลบไม่สามารถย้อนกลับได้'
            okText='ลบ'
            cancelText='ยกเลิก'
            okButtonProps={{ danger: true, loading: isDeleting }}
            onConfirm={() => onDelete(record)}
          >
            <TbTrash className='fs-22 text-(--default-red) cursor-pointer' title='ลบกล้อง' />
          </Popconfirm>
        </div>
      ),
    },
  ], [onEdit, onDelete, isDeleting])

  if (isError) return <Empty description='เกิดข้อผิดพลาดในการโหลดข้อมูล' />

  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerBg: '#66AEFF',
            headerColor: '#000000',
            headerSplitColor: '#00000020',
            colorText: '#FFFFFF',
            borderColor: '#66AEFF',
          },
        },
      }}
    >
      <Table<ProjectRoadCamera>
        rowKey='id'
        columns={columns}
        dataSource={data}
        size='medium'
        loading={isLoading}
        locale={{ emptyText: <Empty description='ยังไม่มีกล้องในสายทางนี้' /> }}
        pagination={{ locale: { items_per_page: '/ หน้า' } }}
        // A number, not 'max-content': max-content sizes columns to their
        // longest value, which would stretch the 134-char camera names
        // across the screen and stop `ellipsis` ever truncating. This is the
        // sum of the widths above — the table still fills a wider container
        // and scrolls on a narrower one.
        scroll={{ x: 980 }}
      />
    </ConfigProvider>
  )
}

export default React.memo<Props>(TableRoadCameras)
