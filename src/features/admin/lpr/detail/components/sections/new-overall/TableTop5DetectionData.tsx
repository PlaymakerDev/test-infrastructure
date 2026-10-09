import { Button, Empty, Table, TableProps } from 'antd'
import React, { useCallback } from 'react'
import { TbCar } from 'react-icons/tb';
import { useLPRDetailContext } from '../../../context';
import { useQuery } from '@tanstack/react-query';
import { getLPRPlateAPI } from '@/services/routes/NewLPRService';
import { LPRPlateData } from '@/types/lpr/new-lpr-api';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/stores/hooks';
import { resetLicenseDetailModalData } from '@/stores/reducers/modal/customModalSlice';
import { setLPRLicenseSearch } from '@/stores/reducers/lpr/lprSlice';

interface Props {
  data?: LPRPlateData | null
}

const TableTop5DetectionData: React.FC<Props> = (props) => {
  const { data: plateData } = props
  const { solutionId, departmentId } = useLPRDetailContext()
  const router = useRouter()
  const dispatch = useAppDispatch()

  const handleCloseModal = useCallback(() => {
    dispatch(resetLicenseDetailModalData())
  }, [dispatch])

  const plateNumber = plateData?.plate_number?.trim()

  // → overall page, plate-search tab, whole department scope, with the search
  // box pre-filled with this plate. `departmentId` is '' when the detail page
  // was opened without ?dept_id — omit it then so the overall page falls back to
  // its own default instead of reading `dept_id=`.
  const handleViewHistory = useCallback(() => {
    // CLOSE MODAL BEFORE NAVIGATING TO HISTORY PAGE
    handleCloseModal()
    // The plate rides in the store (silent), not the URL — the overall page
    // consumes it once at mount. See lprSlice.
    if (plateNumber) dispatch(setLPRLicenseSearch(plateNumber))
    // DO THE NAVIGATION AFTER CLOSING THE MODAL
    const params = new URLSearchParams()
    if (departmentId) params.set('dept_id', departmentId)
    params.set('scope', 'all')
    params.set('tab', 'LICENSE')
    router.push(`/admin/lpr?${params.toString()}`)
  }, [departmentId, router, handleCloseModal, dispatch, plateNumber])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lpr-plate-table-top5', solutionId],
    queryFn: () => getLPRPlateAPI(solutionId, { limit: 5 }),
    enabled: !!solutionId,
  })

  const columns: TableProps<LPRPlateData>['columns'] = [
    {
      title: 'วันที่และเวลา',
      dataIndex: 'captured_at_display',
      key: 'captured_at_display',
      width: 150,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'กล้อง',
      dataIndex: 'camera_name',
      key: 'camera_name',
      width: 300,
      onCell: () => ({
        style: {
          whiteSpace: 'normal',
          wordBreak: 'break-word',
        }
      }),
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'จุดติดตั้ง',
      dataIndex: 'detection_point',
      key: 'detection_point',
      width: 200,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'จังหวัด',
      dataIndex: 'plate_province',
      key: 'plate_province',
      width: 150,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
  ];

  if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />

  return (
    <>
      <section>
        <div className='flex justify-between items-center mb-3'>
          <div className='flex items-center gap-2'>
            <TbCar className='fs-22 text-(--yellow)' />
            <h4 className='text-(--yellow) font-normal!'>ประวัติการตรวจจับป้ายทะเบียนย้อนหลัง 5 อันดับล่าสุด</h4>
          </div>
          <Button
            type="primary"
            shape='round'
            onClick={handleViewHistory}
          >
            ดูประวัติการเดินทาง
          </Button>
        </div>
      </section>
      <section className='mt-5'>
        <Table<LPRPlateData>
          rowKey={'id'}
          columns={columns}
          dataSource={data?.data?.res_data}
          loading={isLoading}
          pagination={false}
          // size='medium'
          scroll={{ x: "max-content" }}
        />
      </section>
    </>
  )
}

export default React.memo<Props>(TableTop5DetectionData)
