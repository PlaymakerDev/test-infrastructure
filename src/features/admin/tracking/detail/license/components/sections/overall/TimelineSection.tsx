import { Button, ConfigProvider, Empty, Timeline } from 'antd'
import React from 'react'
import TimelineCard from './TimelineCard'
import { useLicenseContext } from '../../../context'
import { TbPrinter } from 'react-icons/tb'

const STAT_ITEMS = [
  { label: 'ประเภทป้ายทะเบียน', value: 'รถยนต์ส่วนบุคคล' },
  { label: 'ประเภทยานพาหนะ', value: 'รถยนต์' },
  { label: 'ยี่ห้อ', value: 'Toyota (Vios)' },
  { label: 'สียานพาหนะ', value: 'ขาว' },
]

const TimelineSection: React.FC = () => {
  const { license } = useLicenseContext()

  if (!license.id) return <Empty description='ไม่พบข้อมูลป้ายทะเบียน' />

  return (
    <div className='lg:px-8'>
      {/* Header */}
      <section className='flex flex-wrap items-start justify-between gap-4'>
        {/* License info */}
        <div className='flex flex-col gap-0.5'>
          <h1>{license.license_no}</h1>
          <p>{license.license_province}</p>
          <p className='text-gray-400'>ตรวจพบครั้งแรก {license.road_description} เมื่อวันที่ {license.timestamp}</p>
        </div>

        {/* Action buttons */}
        <div className='flex items-center gap-2 shrink-0'>
          <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
            <Button type='primary' size='medium' shape='round' icon={<TbPrinter />}>
              นำออกเอกสาร
            </Button>
          </ConfigProvider>
          <ConfigProvider theme={{ token: { colorPrimary: '#979797', colorTextLightSolid: '#0A0A0A' } }}>
            <Button type='primary' size='medium' shape='round'>
              ดูเพิ่มเติม
            </Button>
          </ConfigProvider>
        </div>
      </section>

      {/* Stats grid */}
      <section className='mt-10 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4'>
        {STAT_ITEMS.map(({ label, value }) => (
          <div key={label} className='bg-(--yellow)/10 border-2 border-(--yellow) rounded-lg p-5'>
            <p className='text-(--yellow)'>{label}</p>
            <p className='font-bold'>{value}</p>
          </div>
        ))}
      </section>

      {/* Timeline */}
      <section className='mt-5'>
        <div className='bg-(--gray) py-8 px-10 rounded-lg'>
          <h1 className='text-(--yellow) mb-5'>Vehicle Detection Timeline</h1>
          {license.timeline?.length ? (
            <Timeline
              variant='filled'
              mode='start'
              items={license.timeline.map((item, index) => ({
                children: <TimelineCard key={item.id} item={item} isFirst={index === 0} />,
              }))}
            />
          ) : (
            <Empty description='ไม่พบข้อมูลการตรวจจับยานพาหนะ' />
          )}
        </div>
      </section>
    </div>
  )
}

export default React.memo(TimelineSection)
