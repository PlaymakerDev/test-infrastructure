import { ROLE } from '@/constants';
import { APIResponseDepartment } from '@/types/manage/department-api';
import { APIResponseGeneralUser, APIResponseGeneralUserListEnvelope } from '@/types/manage/general-user-api';
import { Empty, Table, TableProps } from 'antd';
import React, { useCallback } from 'react'
import { TbPencilMinus, TbTrash } from 'react-icons/tb';

interface Props {
  // GENERAL USERS
  data?: APIResponseGeneralUserListEnvelope
  isLoading?: boolean
  isError?: boolean
  // DEPARTMENTS
  departmentsData?: APIResponseDepartment[]
  isDepartmentsLoading?: boolean
  isDepartmentsError?: boolean
  onPageChange?: (page: number, pageSize: number) => void
}

const TableUserData: React.FC<Props> = (props) => {
  const { data, isLoading, isError, departmentsData, isDepartmentsLoading, isDepartmentsError, onPageChange } = props

  const renderIsLDAP = useCallback((isLDAP: boolean) => {
    const label = isLDAP ? 'LDAP' : 'DRR ITS';
    const textColor = isLDAP ? '#CA66FF' : 'var(--default-blue)'
    return (
      <span
        className='inline-flex items-center justify-center px-3 py-0.5 rounded-full fs-12 whitespace-nowrap'
        style={{ border: `1px solid ${textColor}`, color: textColor }}
      >
        {label}
      </span>
    )
  }, [])

  const renderRole = useCallback((role: string) => {
    return (
      <span
        className='inline-flex items-center justify-center px-3 py-0.5 rounded-full fs-12 whitespace-nowrap'
        style={{ border: `1px solid ${ROLE[role as keyof typeof ROLE]?.color}`, color: ROLE[role as keyof typeof ROLE]?.color }}
      >
        {ROLE[role as keyof typeof ROLE]?.text}
      </span>
    )
  }, [])

  const renderName = useCallback((firstName: string, lastName: string) => {
    return [firstName, lastName].filter(Boolean).join(' ') || '-'
  }, [])

  const renderDpt = useCallback((departmentId: string) => {
    if (isDepartmentsLoading) return 'กำลังโหลด...'
    if (isDepartmentsError) return 'เกิดข้อผิดพลาด'
    const department = departmentsData?.find(dpt => Number(dpt.id) === Number(departmentId))
    if (department?.department_name) return department.department_name
    return '-'
  }, [departmentsData, isDepartmentsLoading, isDepartmentsError])

  const columns: TableProps<APIResponseGeneralUser>['columns'] = [
    {
      title: 'Username',
      key: 'user_id',
      dataIndex: 'user_id',
      width: 200,
      render: (_, record) => {
        if (record.user?.username) return record.user?.username
        return '-'
      }
    },
    {
      title: 'ประเภทผู้ใช้งาน',
      key: 'is_ldap',
      dataIndex: 'is_ldap',
      width: 150,
      render: (text) => {
        return renderIsLDAP(text)
      }
    },
    {
      title: 'ชื่อผู้ใช้งาน',
      key: 'name',
      dataIndex: 'name',
      width: 200,
      render: (_, record) => renderName(record.first_name, record.lastname)
    },
    {
      title: 'หน่วยงาน',
      key: 'department_id',
      dataIndex: 'department_id',
      width: 200,
      render: (text) => {
        return renderDpt(text)
      }
    },
    {
      title: 'จังหวัด',
      key: 'province_id',
      dataIndex: 'province_id',
      width: 200,
      render: (_, record) => {
        if (record.province?.name_th) return record.province?.name_th
        return '-'
      }
    },
    {
      title: 'สิทธิ์การเข้าถึงข้อมูล',
      key: 'role',
      dataIndex: 'role',
      width: 200,
      render: (text) => renderRole(text)
    },
    {
      title: 'จัดการ',
      key: 'action',
      dataIndex: 'action',
      width: 200,
      render: (_, record) => {
        return (
          <div className='flex items-center gap-2 shrink-0'>
            <TbPencilMinus
              className='fs-22 text-orange-300 cursor-pointer'
              title='แก้ไขข้อมูลโครงการ'
            // onClick={() => onEdit?.(record)}
            />
            <TbTrash
              className='fs-22 text-red-500 cursor-pointer'
              title='ลบโครงการ'
            // onClick={() => onDelete?.(record)}
            />
          </div>
        )
      }
    },
  ];

  if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />

  return (
    <Table<APIResponseGeneralUser>
      rowKey={'id'}
      columns={columns}
      dataSource={data?.res_data || []}
      loading={isLoading}
      pagination={{
        current: data?.meta_data.page || 1,
        pageSize: data?.meta_data.limit,
        total: data?.meta_data.count || 0,
        showSizeChanger: true,
        onChange: (page, pageSize) => {
          onPageChange?.(page, pageSize)
        },
        locale: { items_per_page: '/ หน้า' }
      }}
      scroll={{ x: "max-content" }}
    />
  )
}

export default React.memo<Props>(TableUserData)
