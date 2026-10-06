import { Button, Empty, Skeleton, Table, TableProps } from 'antd'
import React from 'react'
import { TbCar } from 'react-icons/tb'
import { useLPRDetailContext } from '../../../context';
import { useQuery } from '@tanstack/react-query';
import { getLPRPlateAPI } from '@/services/routes/NewLPRService';
import { LPRPlateData } from '@/types/lpr/new-lpr-api';
import { VEHICLE_TYPE_COLOR } from '@/constants';

interface Props {

}

const TableDailyLicenseData: React.FC<Props> = (props) => {
  const { } = props
  const { setCurrentTab, solutionId } = useLPRDetailContext()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lpr-plate-table', solutionId],
    queryFn: () => getLPRPlateAPI(solutionId, { limit: 10 }),
    enabled: !!solutionId,
  })

  if (isLoading) {
    return (
      <div className='p-5 bg-(--dark-black) rounded-2xl h-full'>
        <div className='m-auto block'>
          <Skeleton loading={isLoading} active paragraph={{ rows: 4 }} />
        </div>
      </div>
    )
  }
  if (isError) {
    return (
      <div className='p-5 bg-(--dark-black) rounded-2xl h-full'>
        <div className='m-auto block'>
          <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />
        </div>
      </div>
    )
  }

  const columns: TableProps<LPRPlateData>['columns'] = [
    {
      title: 'ป้ายทะเบียน',
      dataIndex: 'plate_number',
      key: 'plate_number',
      width: 150,
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
    {
      title: 'ประเภท',
      dataIndex: 'vehicle_type_name',
      key: 'vehicle_type_name',
      width: 150,
      render: (item) => {
        return (
          <span
            className={`shrink-0 fs-12 border rounded-full px-3 whitespace-nowrap`}
            style={{
              color: VEHICLE_TYPE_COLOR[item as keyof typeof VEHICLE_TYPE_COLOR] || '#FFFFFF50',
              borderColor: VEHICLE_TYPE_COLOR[item as keyof typeof VEHICLE_TYPE_COLOR] || '#FFFFFF50',
            }}
          >
            {item || 'ไม่ระบุ'}
          </span>
        )
      }
    },
    {
      title: 'วันที่และเวลา',
      dataIndex: 'captured_at_display',
      key: 'captured_at_display',
      width: 200,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
  ];

  return (
    <div className='p-5 bg-(--dark-black) rounded-2xl h-full'>
      <section>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <TbCar className='text-(--yellow) fs-22' />
            <h4 className='text-(--yellow) font-normal!'>ข้อมูลป้ายทะเบียนประจำวัน</h4>
          </div>
          <Button
            type='primary'
            shape='round'
            onClick={() => setCurrentTab('DETECTIONS')}
          >
            ดูเพิ่มเติม
          </Button>
        </div>
      </section>
      <section className='mt-5'>
        <Table<LPRPlateData>
          key={'key'}
          rowKey="id"
          columns={columns}
          dataSource={data?.data.res_data || []}
          loading={isLoading}
          pagination={false}
          // pagination={{
          //   showSizeChanger: true,
          //   onChange: (page, pageSize) => console.log(page, pageSize),
          //   locale: { items_per_page: '/ หน้า' }
          // }}
          scroll={{ x: 'max-content' }}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(TableDailyLicenseData)
