import React, { useCallback, useMemo, useState } from 'react'
import { APIResponseSolutionCameraList, SolutionCameraList } from '@/types/manage/project-detail-api'
import { ConfigProvider, Table, TableProps } from 'antd'

interface Props {
  data?: APIResponseSolutionCameraList | null
  /** Fires with the full set of currently-selected table records after every checkbox / select-all change. */
  onSelectedChange?: (records: SolutionCameraList[]) => void
}

const TableCameraList: React.FC<Props> = (props) => {
  const { data, onSelectedChange } = props

  // Source of truth is the selected RECORDS; the controlled keys are derived.
  const [selectedRows, setSelectedRows] = useState<SolutionCameraList[]>([])
  const selectedRowKeys = useMemo(() => selectedRows.map((r) => r.id), [selectedRows])

  // onChange (not onSelect) so select-all in the header also lands here —
  // onSelect only fires for individual row checkboxes.
  const handleSelectionChange = useCallback(
    (_keys: React.Key[], rows: SolutionCameraList[]) => {
      setSelectedRows(rows)
      onSelectedChange?.(rows)
    },
    [onSelectedChange],
  )

  const renderCurlStatus = useCallback(() => { }, [])

  const columns: TableProps<SolutionCameraList>['columns'] = [
    {
      title: 'ชื่ออุปกรณ์',
      dataIndex: 'camera_name',
      key: 'camera_name',
      width: 400,
      render: (text) => {
        if (text) return text
        return '-'
      }
    },
    {
      title: 'สถานะการเลือกใช้งาน',
      dataIndex: 'solution_id',
      key: 'solution_id',
      width: 200,
    },
    {
      title: 'สถานะการเชื่อมต่อ',
      dataIndex: 'curl_status',
      key: 'curl_status',
      width: 200,
      render: (text) => {
        if (text) return text
        return '-'
      }
    },
    {
      title: 'Live Stream',
      dataIndex: 'hls_url',
      key: 'hls_url',
      width: 200,
    },
  ];


  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerBg: "#66AEFF",
            headerColor: "#000000",
            headerSplitColor: "#00000020",
            colorText: "#FFFFFF",
            borderColor: "#66AEFF",
          },
        }
      }}
    >
      <Table<SolutionCameraList>
        rowKey="id"
        columns={columns}
        dataSource={data || []}
        rowSelection={{
          selectedRowKeys,
          onChange: handleSelectionChange,
          columnTitle: 'เลือก',
          columnWidth: 100,
        }}
        size='medium'
        // loading={isLoading}
        pagination={{
          locale: { items_per_page: '/ หน้า' }
        }}
        scroll={{ x: 'max-content' }}
      />
    </ConfigProvider>

  )
}

export default React.memo<Props>(TableCameraList)
