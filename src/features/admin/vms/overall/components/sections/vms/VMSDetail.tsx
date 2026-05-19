import React from 'react'
import { TbCalendarEvent, TbClipboard, TbClipboardCopy, TbFileDescription, TbHourglass, TbLock, TbUserCircle } from 'react-icons/tb'

interface Props {

}

const VMSDetail: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className="h-full bg-(--dark-black) rounded-lg p-5">
      <div className='flex items-center gap-2 mb-5'>
        <TbClipboard className='fs-22 shrink-0' />
        <h4 className='mb-0'>ข้อมูลโครงการ</h4>
      </div>

      <div className='mb-5'>
        <p className='fs-12'>
          จ้างก่อสร้างโครงการปรับปรุงทางเพื่อความปลอดภัย ถนนสาย ฉช.4050 แยกทางหลวงหมายเลข 3200 - บ้านบางขนาก อ.เมืองฉะเชิงเทรา, คลองเขื่อน, บางน้ำเปรี้ยว จ.ฉะเชิงเทรา 1 แห่ง
        </p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4'>
        <div className='flex flex-col items-center text-center'>
          <TbLock className='fs-22 text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>รหัสโครงการ</p>
          <p className='text-white mb-0'>MT25029</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbFileDescription className='fs-22 text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>เลขที่สัญญา</p>
          <p className='text-white mb-0'>สอป.67/2568</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbUserCircle className='fs-22 text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>ผู้รับจ้าง</p>
          <p className='text-white mb-0'>MST</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbCalendarEvent className='fs-22 text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>เริ่มต้นการรับประกัน</p>
          <p className='text-white mb-0'>25 พ.ค. 2568</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbCalendarEvent className='fs-22 text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>สิ้นสุดการรับประกัน</p>
          <p className='text-white mb-0'>26 พ.ค. 2570</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbHourglass className='fs-22 text-teal-400 mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>ระยะเวลาที่เหลือ</p>
          <p className='text-teal-400 mb-0'>416 วัน</p>
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(VMSDetail)
