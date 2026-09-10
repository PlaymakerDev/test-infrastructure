import { APIResponseProjectList, ProjectListData } from '@/types/manage/project-api';
import { Empty, Table, TableProps, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import React from 'react'
import StatusBadge from '../project/StatusBadge';
import { TbPencilMinus, TbTrash } from 'react-icons/tb';

interface Props {
  data?: APIResponseProjectList
  isLoading?: boolean
  isError?: boolean
  onTableChange?: NonNullable<TableProps<ProjectListData>['onChange']>
  onEdit?: (row: ProjectListData) => void
  onDelete?: (row: ProjectListData) => void
}

const ProjectListView: React.FC<Props> = (props) => {
  const { data, isLoading, isError, onTableChange, onEdit, onDelete } = props
  const router = useRouter()

  const columns: TableProps<ProjectListData>['columns'] = [
    {
      title: 'ผู้รับจ้าง',
      key: 'contractor_id',
      dataIndex: 'contractor_id',
      width: 200,
      render: (_, record) => {
        const companyName = record.contractor?.contractor?.company_name
        if (companyName) return companyName
        return '-'
      }
    },
    {
      title: 'รหัสโครงการ',
      key: 'project_no',
      dataIndex: 'project_no',
      width: 150,
      render: (text) => {
        if (text) return text
        return '-'
      }
    },
    {
      title: 'ชื่อโครงการ',
      key: 'project_name',
      dataIndex: 'project_name',
      width: 500,
      onCell: (row) => {
        return {
          onClick: () => router.push(`/admin/settings/detail/project?id=${row.id}`),
          className: 'cursor-pointer hover:text-(--yellow) transition-colors duration-200'
        }
      },
      render: (text) => {
        if (text) return <Tooltip title="กดเพื่อดูรายละเอียด">{text}</Tooltip>
        return '-'
      }
    },
    {
      title: 'ผู้ว่าจ้าง',
      key: 'department_id',
      dataIndex: 'department_id',
      width: 200,
      render: (_, record) => {
        const departmentName = record.department?.department_short_name
        if (departmentName) return departmentName
        return '-'
      }
    },
    {
      title: 'เลขที่สัญญา',
      key: 'contract_no',
      dataIndex: 'contract_no',
      width: 200,
      render: (text) => {
        if (text) return text
        return '-'
      }
    },
    {
      title: 'วันที่เริ่มต้นค้ำประกัน',
      key: 'warranty_start_date',
      dataIndex: 'warranty_start_date',
      width: 200,
      render: (text) => {
        if (text) return dayjs(text).format('DD MMM BBBB')
        return '-'
      }
    },
    {
      title: 'วันที่สิ้นสุดค้ำประกัน',
      key: 'warranty_end_date',
      dataIndex: 'warranty_end_date',
      width: 200,
      render: (text) => {
        if (text) return dayjs(text).format('DD MMM BBBB')
        return '-'
      }
    },
    {
      title: 'สถานะการค้ำประกัน',
      key: 'is_warranty',
      dataIndex: 'is_warranty',
      width: 200,
      render: (text) => {
        const status = text ? 'in-warranty' : 'expired'
        if (text) return <StatusBadge status={status} />
        return '-'
      }
    },
    {
      title: 'จัดการ',
      key: 'action',
      dataIndex: 'action',
      width: 150,
      render: (_, record) => {
        return (
          <div className='flex items-center gap-2 shrink-0'>
            <TbPencilMinus
              className='fs-22 text-orange-300 cursor-pointer'
              title='แก้ไขข้อมูลโครงการ'
              onClick={() => onEdit?.(record)}
            />
            <TbTrash
              className='fs-22 text-red-500 cursor-pointer'
              title='ลบโครงการ'
              onClick={() => onDelete?.(record)}
            />
          </div>
        )
      }
    },
  ];

  if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />

  return (
    <Table<ProjectListData>
      rowKey={"id"}
      columns={columns}
      dataSource={data?.res_data || []}
      loading={isLoading}
      pagination={{
        current: data?.meta_data.page,
        pageSize: data?.meta_data.limit,
        total: data?.meta_data.count,
        locale: { items_per_page: '/ หน้า' }
      }}
      onChange={onTableChange}
      scroll={{ x: 'max-content' }}
    />
  )
}

export default React.memo<Props>(ProjectListView)
