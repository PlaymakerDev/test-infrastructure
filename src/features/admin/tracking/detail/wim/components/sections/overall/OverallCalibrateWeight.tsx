import { Button, ConfigProvider } from 'antd'
import React from 'react'
import { TbArticle, TbBrandCoinbase, TbCalendarStats, TbClipboardList, TbUser } from 'react-icons/tb'

interface Props { }

const OverallCalibrateWeight: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className="h-full bg-[#FFFFFF1A] border-2 rounded-lg p-5 border-white">
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6'>
        <h3 className='mb-0'>ข้อมูลการ Calibrate เครื่องชั่ง</h3>
        <ConfigProvider theme={{ token: { colorPrimary: '#212121', colorTextLightSolid: '#FFFFFF' } }}>
          <Button type="primary" shape="round">
            ดูเพิ่มเติม
          </Button>
        </ConfigProvider>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4'>
        <div className='flex flex-col items-center text-center'>
          <TbClipboardList className='text-5xl text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>Calibrate ครั้งล่าสุด</p>
          <p className='fs-12 text-[#66AEFF] mb-0.5'>10 ส.ค. 2567</p>
          <p className='fs-12 text-white mb-0'>(2 ปีที่แล้ว)</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbCalendarStats className='text-5xl text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>กำหนด Calibrate ครั้งถัดไป</p>
          <p className='fs-12 text-[#66AEFF] mb-0'>10 ส.ค. 2568</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbArticle className='text-5xl text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>เลขที่ Certificate</p>
          <p className='fs-12 text-[#66AEFF] mb-0'>CERT-2024-102</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbUser className='text-5xl text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>ผู้ทำการ Calibrate</p>
          <p className='fs-12 text-[#66AEFF] mb-0'>นายวิชัย สุขสันต์</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbBrandCoinbase className='text-5xl text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>บริษัททำการ Calibrate</p>
          <p className='fs-12 text-[#66AEFF] mb-0'>บริษัท เทคโนโลยีชั่งน้ำหนัก จำกัด</p>
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(OverallCalibrateWeight)
