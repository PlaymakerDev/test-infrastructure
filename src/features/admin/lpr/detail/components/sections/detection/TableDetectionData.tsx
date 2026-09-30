import { useAppDispatch } from '@/stores/hooks';
import { setLicenseDetailModalOpen } from '@/stores/reducers/modal/customModalSlice';
import { Image, Table, TableProps } from 'antd';
import React, { useState } from 'react'

interface Props {

}

interface DataType {
  id: string
  timestamp: string
  license_number: string
  license_province: string
  license_type: string
  confidence_level: string
  camera_name: string
  ip_address: string
  license_image: string
}

const TableDetectionData: React.FC<Props> = (props) => {
  const { } = props
  const dispatch = useAppDispatch()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const data: DataType[] = [
    {
      id: '1',
      timestamp: '20 เม.ย. 2569 15:20:36',
      license_number: 'กจ3849',
      license_province: 'สิงห์บุรี',
      license_type: 'รถกระบะ',
      confidence_level: '44.0%',
      camera_name: '69MST-SBR2006-LPR002-จุดที่1-กม.0+500-มุ่งหน้าที่พักสายตรวจตำบลน้ำตาล',
      ip_address: '192.168.3.171',
      license_image: 'https://i.pinimg.com/1200x/10/98/6b/10986b50aa46e4326e085125534046bd.jpg',
    },
    {
      id: '2',
      timestamp: '20 เม.ย. 2569 14:19:03',
      license_number: 'วง5692',
      license_province: 'สิงห์บุรี',
      license_type: 'รถยนต์',
      confidence_level: '44.0%',
      camera_name: '69MST-SBR2006-LPR002-จุดที่1-กม.0+500-มุ่งหน้าที่พักสายตรวจตำบลน้ำตาล',
      ip_address: '192.168.3.171',
      license_image: 'https://i.pinimg.com/1200x/10/98/6b/10986b50aa46e4326e085125534046bd.jpg',
    },
    {
      id: '3',
      timestamp: '20 เม.ย. 2569 12:29:29',
      license_number: 'กบ6554',
      license_province: 'สิงห์บุรี',
      license_type: 'รถกระบะ',
      confidence_level: '50.0%',
      camera_name: '69MST-SBR2006-LPR002-จุดที่1-กม.0+500-มุ่งหน้าที่พักสายตรวจตำบลน้ำตาล',
      ip_address: '192.168.3.171',
      license_image: 'https://i.pinimg.com/1200x/10/98/6b/10986b50aa46e4326e085125534046bd.jpg',
    },
    {
      id: '4',
      timestamp: '20 เม.ย. 2569 11:37:28',
      license_number: 'กว5168',
      license_province: 'สุพรรณบุรี',
      license_type: 'รถกระบะ',
      confidence_level: '51.0%',
      camera_name: '69MST-SBR2006-LPR001-จุดที่1-กม.0+500-มุ่งหน้าทางหลวงหมายเลข 32',
      ip_address: '192.168.3.170',
      license_image: 'https://i.pinimg.com/1200x/10/98/6b/10986b50aa46e4326e085125534046bd.jpg',
    },
    {
      id: '5',
      timestamp: '20 เม.ย. 2569 11:02:17',
      license_number: '2ขร2201',
      license_province: 'สิงห์บุรี',
      license_type: 'รถกระบะ',
      confidence_level: '12.8%',
      camera_name: '69MST-SBR2006-LPR001-จุดที่1-กม.0+500-มุ่งหน้าทางหลวงหมายเลข 32',
      ip_address: '192.168.3.170',
      license_image: 'https://i.pinimg.com/1200x/10/98/6b/10986b50aa46e4326e085125534046bd.jpg',
    },
  ]

  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'วันที่และเวลา',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 200,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
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
      title: 'ประเภทรถ',
      dataIndex: 'license_type',
      key: 'license_type',
      width: 150,
      render: (item) => {
        if (item) {
          return (
            <div className='inline-block text-[#00FFAA] border border-[#00FFAA] rounded-3xl px-3 text-center'>
              <p className='fs-12'>{item}</p>
            </div>
          )
        }
        return '-'
      }
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence_level',
      key: 'confidence_level',
      width: 150,
      render: (item) => {
        if (item) {
          return (
            <div className='inline-block text-(--yellow) border border-(--yellow) rounded-3xl px-3 text-center'>
              <p className='fs-12'>{item}</p>
            </div>
          )
        }
        return '-'
      }
    },
    {
      title: 'ชื่อกล้อง',
      dataIndex: 'camera_name',
      key: 'camera_name',
      width: 300,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 150,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'ภาพป้ายทะเบียน',
      dataIndex: 'license_image',
      key: 'license_image',
      width: 150,
      render: (item) => {
        return (
          <div className='inline-flex justify-center'>
            <figure
              className='w-full h-28 relative overflow-hidden rounded-sm'
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={item}
                alt={item}
                width={'100%'}
                height={'100%'}
                className='object-cover object-center'
              />
            </figure>
          </div>
        )
      }
    },
  ];

  return (
    <Table<DataType>
      rowKey="id"
      columns={columns}
      dataSource={data}
      size="middle"
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: data.length,
        showSizeChanger: true,
        placement: ['bottomEnd'],
        onChange: (page, size) => {
          setCurrentPage(page)
          setPageSize(size)
        },
        locale: { items_per_page: '/ หน้า' }
      }}
      onRow={() => {
        return {
          className: 'cursor-pointer',
          onClick: () => dispatch(setLicenseDetailModalOpen({ open: true }))
        }
      }}
      scroll={{ x: 'max-content' }}
    />
  )
}

export default React.memo<Props>(TableDetectionData)
