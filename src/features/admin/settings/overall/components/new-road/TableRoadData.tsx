import { APIResponsePaginateRoadList, RoadData } from '@/types/manage/road-api'
import { Empty, Table, TableProps } from 'antd'
import React, { useMemo } from 'react'
import { TbPencilMinus, TbTrash } from 'react-icons/tb'

interface Props {
  data?: APIResponsePaginateRoadList
  isLoading?: boolean
  isError?: boolean
  onPageChange?: (page: number, pageSize: number) => void
}

interface RowData extends RoadData {
  regionSpan: number
  departmentSpan: number
}

// Rows arrive sorted by region then department. Merge consecutive rows that
// share the same region / department into one spanned cell instead of
// repeating the label on every road row (matches the grouped table design).
const buildRows = (list: RoadData[]): RowData[] =>
  list.map((item, index) => {
    const prev = list[index - 1]
    const sameRegion = !!prev && prev.department.region_id === item.department.region_id
    const sameDepartment = sameRegion && prev!.department_id === item.department_id

    let regionSpan = 0
    if (!sameRegion) {
      regionSpan = 1
      for (
        let i = index + 1;
        i < list.length && list[i].department.region_id === item.department.region_id;
        i++
      ) {
        regionSpan++
      }
    }

    let departmentSpan = 0
    if (!sameDepartment) {
      departmentSpan = 1
      for (
        let i = index + 1;
        i < list.length &&
        list[i].department.region_id === item.department.region_id &&
        list[i].department_id === item.department_id;
        i++
      ) {
        departmentSpan++
      }
    }

    return { ...item, regionSpan, departmentSpan }
  })

const TableRoadData: React.FC<Props> = (props) => {
  const { data, isLoading, isError, onPageChange } = props

  const rows = useMemo(() => buildRows(data?.res_data ?? []), [data?.res_data])

  // AntD can leave a stale rowSpan DOM attribute behind when a rowKey stays
  // put but its span changes — remount whenever the merged-row structure
  // changes so rowSpans rebuild cleanly.
  const tableKey = useMemo(
    () => rows.map((r) => `${r.id}:${r.regionSpan}:${r.departmentSpan}`).join('|'),
    [rows],
  )

  const columns: TableProps<RowData>['columns'] = [
    {
      title: 'ภูมิภาค',
      dataIndex: 'region',
      key: 'region',
      width: 150,
      onCell: (record) => ({ rowSpan: record.regionSpan }),
      render: (_, record) => {
        if (record.department.region.name_th) return record.department.region.name_th
        return '-'
      }
    },
    {
      title: 'หน่วยงาน',
      dataIndex: 'department',
      key: 'department',
      width: 150,
      onCell: (record) => ({ rowSpan: record.departmentSpan }),
      render: (_, record) => {
        if (record.department.department_short_name) return record.department.department_short_name
        return '-'
      }
    },
    {
      title: 'รหัสสายทาง',
      dataIndex: 'road_code',
      key: 'road_code',
      width: 200,
      render: (text) => {
        if (text) return text
        return '-'
      }
    },
    {
      title: 'ชื่อสายทาง',
      dataIndex: 'road_name',
      key: 'road_name',
      width: 200,
      render: (text) => {
        if (text) return text
        return '-'
      }
    },
    {
      title: 'ตำบล',
      dataIndex: 'subdistrict',
      key: 'subdistrict',
      width: 200,
      render: (text) => {
        if (text) return text
        return '-'
      }
    },
    {
      title: 'เขต',
      dataIndex: 'district',
      key: 'district',
      width: 200,
      render: (text) => {
        if (text) return text
        return '-'
      }
    },
    {
      title: 'จังหวัด',
      dataIndex: 'province',
      key: 'province',
      width: 200,
      render: (text) => {
        if (text) return text
        return '-'
      }
    },
    {
      title: 'ระยะทาง (กิโลเมตร)',
      dataIndex: 'distance',
      key: 'distance',
      width: 150,
      render: (text) => {
        if (text) return text
        return '-'
      }
    },
    {
      title: 'จัดการ',
      dataIndex: 'action',
      key: 'action',
      width: 100,
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
    <Table<RowData>
      key={tableKey}
      rowKey="id"
      columns={columns}
      dataSource={rows}
      loading={isLoading}
      pagination={{
        current: data?.meta_data.page || 1,
        pageSize: data?.meta_data.limit,
        total: data?.meta_data.count || 0,
        showSizeChanger: true,
        onChange: (page, pageSize) => onPageChange?.(page, pageSize),
        locale: { items_per_page: '/ หน้า' }
      }}
      scroll={{ x: 'max-content' }}
    />
  )
}

export default React.memo<Props>(TableRoadData)
