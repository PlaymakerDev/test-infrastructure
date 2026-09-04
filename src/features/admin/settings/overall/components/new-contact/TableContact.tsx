import { ContractorData } from '@/types/manage/contractor-api';
import { APIResponseProjectList, ProjectListData } from '@/types/manage/project-api';
import { getRowNumber } from '@/utils/pagination';
import { Empty, Table, TableProps } from 'antd';
import dayjs from 'dayjs';
import React from 'react'
import StatusBadge from '../project/StatusBadge';
import SolutionTagList from './SolutionTagList';

interface Props {
  data?: APIResponseProjectList
  item: ContractorData
  page: number
  limit: number
  isLoading: boolean;
  isError: boolean;
  handlePageChange: (newPage: number, newLimit: number) => void;
}

const TableContact: React.FC<Props> = (props) => {
  const { data, page, limit, isLoading, isError, handlePageChange } = props

  const columns: TableProps<ProjectListData>['columns'] = [
    {
      title: 'ลำดับ',
      dataIndex: 'no',
      key: 'no',
      width: 80,
      render: (text, record, index) => getRowNumber(page, limit, index)
    },
    {
      title: 'รหัสโครงการ',
      dataIndex: 'project_no',
      key: 'project_no',
      width: 120,
      render: (text) => {
        if (text) return text
        return '-'
      }
    },
    {
      title: 'ชื่อโครงการ',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 500,
    },
    {
      title: 'การทำงาน',
      key: 'workProcess',
      dataIndex: 'solution_group',
      width: 300,
      render: (solutionGroup: ProjectListData['solution_group']) => (
        <SolutionTagList
          items={solutionGroup}
          display='all'
        />
      ),
    },
    {
      title: 'ผู้ว่าจ้าง',
      key: 'client',
      width: 150,
      render: (_, row) => row.department?.department_short_name || '-',
    },
    {
      title: 'เลขที่สัญญา',
      key: 'contract_no',
      dataIndex: 'contract_no',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: 'วันที่เริ่มต้นค้ำประกัน',
      key: 'warranty_end_date',
      dataIndex: 'warranty_end_date',
      width: 150,
      render: (text) => {
        if (text) return dayjs(text).format('DD MMM BBBB')
        return '-'
      }
    },
    {
      title: 'วันที่สิ้นสุดค้ำประกัน',
      key: 'warranty_start_date',
      dataIndex: 'warranty_start_date',
      width: 150,
      render: (text) => {
        if (text) return dayjs(text).format('DD MMM BBBB')
        return '-'
      }
    },
    {
      title: 'สถานะการค้ำประกัน',
      key: 'guaranteeStatus',
      width: 150,
      render: (_, row) => (
        <StatusBadge status={row.is_warranty ? 'in-warranty' : 'expired'} />
      ),
    },
  ];

  if (isError) return <Empty description="เกิดข้อผิดพลาด" />

  return (
    <Table<ProjectListData>
      columns={columns}
      dataSource={data?.res_data}
      loading={isLoading}
      rowKey='id'
      pagination={{
        current: page,
        pageSize: limit,
        total: data?.meta_data.count,
        onChange: (newPage, newPageSize) => handlePageChange(newPage, newPageSize)
      }}
      scroll={{ x: "max-content" }}
    />
  )
}

export default React.memo<Props>(TableContact)
