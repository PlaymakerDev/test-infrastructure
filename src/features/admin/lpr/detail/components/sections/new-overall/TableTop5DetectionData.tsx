import { Button, Table, TableProps } from 'antd'
import React from 'react'
import { TbCar } from 'react-icons/tb';

interface Props {

}

interface DataType {
  id: string;
  datetime: string;
  camera_name: string;
  install_location: string;
  province: string;
}

const TableTop5DetectionData: React.FC<Props> = (props) => {
  const { } = props

  const data: DataType[] = [
    {
      id: '1',
      datetime: '25 เม.ย. 2569 14:12:14',
      camera_name: '69MST-SBR2006-LPR002-จุดที่1-กม.0+500-มุ่งหน้าที่พักสายตรวจตำ...',
      install_location: 'สห.2006 กม.0+500',
      province: 'สิงห์บุรี',
    },
    {
      id: '2',
      datetime: '25 เม.ย. 2569 12:56:59',
      camera_name: '69MST-SBR2006-LPR001-จุดที่1-กม.0+500-มุ่งหน้าทางหลวงหมายเลข 32',
      install_location: 'สห.2006 กม.0+500',
      province: 'สิงห์บุรี',
    },
    {
      id: '3',
      datetime: '20 เม.ย. 2569 10:28:01',
      camera_name: '69MST-SBR2006-LPR004-จุดที่3-กม.7+400-มุ่งหน้าอินทร์บุรี',
      install_location: 'สห.2006 กม.7+400',
      province: 'สิงห์บุรี',
    },
    {
      id: '4',
      datetime: '18 เม.ย. 2569 18:02:29',
      camera_name: '69MST-SBR2006-LPR002-จุดที่1-กม.0+500-มุ่งหน้าที่พักสายตรวจตำ...',
      install_location: 'สห.2006 กม.0+500',
      province: 'สิงห์บุรี',
    },
    {
      id: '5',
      datetime: '17 เม.ย. 2569 12:02:18',
      camera_name: '69MST-SBR2006-LPR004-จุดที่3-กม.7+400-มุ่งหน้าอินทร์บุรี',
      install_location: 'สห.2006 กม.7+400',
      province: 'สิงห์บุรี',
    },
  ]

  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'วันที่และเวลา',
      dataIndex: 'datetime',
      key: 'datetime',
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
      ellipsis: true,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'จุดติดตั้ง',
      dataIndex: 'install_location',
      key: 'install_location',
      width: 200,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'จังหวัด',
      dataIndex: 'province',
      key: 'province',
      width: 150,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
  ];

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
          >
            ดูประวัติการเดินทาง
          </Button>
        </div>
      </section>
      <section className='mt-5'>
        <Table<DataType>
          rowKey={'id'}
          columns={columns}
          dataSource={data}
          loading={false}
          pagination={false}
          size='medium'
          scroll={{ x: "max-content" }}
        />
      </section>
    </>
  )
}

export default React.memo<Props>(TableTop5DetectionData)
