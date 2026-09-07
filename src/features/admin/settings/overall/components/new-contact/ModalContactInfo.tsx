import { Empty, Modal } from 'antd'
import React, { useMemo } from 'react'
import { INIT_CONTACT_INFO, useOverallContext } from '../../context'
import { ContractorData } from '@/types/manage/contractor-api'
import SolutionTagList from './SolutionTagList'
import {
  TbLetterCase,
  TbUser,
  TbHourglassHigh,
  TbCalendarWeekFilled,
  TbPhoneCalling,
  TbMail
} from 'react-icons/tb'
import dayjs from 'dayjs'

interface Props {

}

interface ContentProps {
  data: ContractorData
}

const Content: React.FC<ContentProps> = (props) => {
  const { data } = props

  return (
    <div>
      <section>
        <h2 className='text-(--default-blue) mb-1.5'>{data.company_name || '-'}</h2>
        <p className='fs-12 mb-3'>{data.address || '-'}</p>
        <SolutionTagList
          items={data.solution_group || []}
          display='all'
        />
      </section>
      <section className='mt-5'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-16'>
          <div className='flex flex-col items-center'>
            <TbLetterCase className='fs-24' />
            <p className='fs-12 text-white/50'>ชื่อย่อ</p>
            <p>{data.short_name || '-'}</p>
          </div>
          <div className='flex flex-col items-center'>
            <TbUser className='fs-24' />
            <p className='fs-12 text-white/50'>ผู้ติดต่อ</p>
            <p>{data.name || '-'}</p>
          </div>
          <div className='flex flex-col items-center'>
            <TbCalendarWeekFilled className='fs-24' />
            <p className='fs-12 text-white/50'>วันที่ลงทะเบียน</p>
            <p>{dayjs(data.created_at).format('DD MMM BBBB') || '-'}</p>
          </div>
          <div className='flex flex-col items-center'>
            <TbHourglassHigh className='fs-24' />
            <p className='fs-12 text-white/50'>จำนวนโครงการ</p>
            <p>{data.project_count || '-'}</p>
          </div>
          <div className='xl:col-span-2 flex flex-col items-center'>
            <TbPhoneCalling className='fs-24' />
            <p className='fs-12 text-white/50'>เบอร์ติดต่อ</p>
            <p>{data.phone || '-'}</p>
          </div>
          <div className='xl:col-span-2 flex flex-col items-center'>
            <TbMail className='fs-24' />
            <p className='fs-12 text-white/50'>อีเมล</p>
            <p>{data.email || '-'}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

const ModalContactInfo: React.FC<Props> = (props) => {
  const { } = props
  const { contactInfo, setContactInfo } = useOverallContext()

  const renderContent = useMemo(() => {
    if (!contactInfo.data) {
      return (
        <div className="block m-auto py-18">
          <Empty description="ไม่มีข้อมูล" />
        </div>
      )
    }
    return <Content data={contactInfo.data} />
  }, [contactInfo.data])

  return (
    <Modal
      title={false}
      // title="Basic Modal"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={contactInfo.open}
      footer={false}
      // onOk={() => setContactInfo(INIT_CONTACT_INFO)}
      onCancel={() => setContactInfo(INIT_CONTACT_INFO)}
      width={1000}
      destroyOnHidden
    >
      {renderContent}
    </Modal>
  )
}

export default React.memo<Props>(ModalContactInfo)
