import { Button, Table, TableProps } from 'antd'
import React from 'react'
import { TbCar } from 'react-icons/tb'
import { useLPRDetailContext } from '../../../context';

interface Props {

}

interface DataType {
  license_number: string;
  license_province: string;
  license_type: string;
  datetime: string;
}

const TableDailyLicenseData: React.FC<Props> = (props) => {
  const { } = props
  const { setCurrentTab } = useLPRDetailContext()

  const data: DataType[] = [
    {
      license_number: 'กต196',
      license_province: 'สิงห์บุรี',
      license_type: 'รถยนต์',
      datetime: '25 เม.ย. 2569 14:12:14',
    },
    {
      license_number: '809619',
      license_province: 'สิงห์บุรี',
      license_type: 'รถบรรทุก',
      datetime: '25 เม.ย. 2569 14:10:37',
    },
    {
      license_number: 'กจ9236',
      license_province: 'สิงห์บุรี',
      license_type: 'รถยนต์',
      datetime: '25 เม.ย. 2569 14:12:14',
    },
    {
      license_number: 'บฉ2540',
      license_province: 'สิงห์บุรี',
      license_type: 'รถยนต์',
      datetime: '25 เม.ย. 2569 14:12:14',
    },
    {
      license_number: '1ขร774',
      license_province: 'กรุงเทพมหานคร',
      license_type: 'รถยนต์',
      datetime: '25 เม.ย. 2569 14:12:14',
    },
    {
      license_number: 'บง806',
      license_province: 'สิงห์บุรี',
      license_type: 'รถกระบะ',
      datetime: '25 เม.ย. 2569 14:12:14',
    },
    {
      license_number: '713153',
      license_province: 'นครสวรรค์',
      license_type: 'รถพ่วง',
      datetime: '25 เม.ย. 2569 14:12:14',
    },
    {
      license_number: 'บจ7898',
      license_province: 'อุทัยธานี',
      license_type: 'รถยนต์',
      datetime: '25 เม.ย. 2569 14:12:14',
    },
  ]

  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'ป้ายทะเบียน',
      dataIndex: 'license_number',
      key: 'license_number',
      width: 150,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'จังหวัด',
      dataIndex: 'license_province',
      key: 'license_province',
      width: 150,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'ประเภท',
      dataIndex: 'license_type',
      key: 'license_type',
      width: 150,
      render: (item) => {
        const color = item === 'รถยนต์' ? '#66AEFF' : '#E94C4C'
        return (
          <span
            className='inline-flex items-center gap-1 px-3 rounded-full fs-12 whitespace-nowrap'
            style={{
              border: `1px solid ${color}`,
              color: color
            }}
          >
            {item}
          </span>
        )
      }
    },
    {
      title: 'วันที่และเวลา',
      dataIndex: 'datetime',
      key: 'datetime',
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
        <Table<DataType>
          key={'key'}
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={false}
          pagination={{
            showSizeChanger: true,
            onChange: (page, pageSize) => console.log(page, pageSize),
            locale: { items_per_page: '/ หน้า' }
          }}
          scroll={{ x: 'max-content' }}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(TableDailyLicenseData)
