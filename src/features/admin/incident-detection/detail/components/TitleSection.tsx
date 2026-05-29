import SwapButton from '@/components/swap-button/SwapButton'
import { Button, ConfigProvider } from 'antd'
import { useRouter } from 'next/navigation'
import React from 'react'
import { TbAppWindow, TbArrowBigLeftFilled, TbInfoSquareRoundedFilled, TbWifi } from 'react-icons/tb'

interface Props {
  setCurrentTab: (value: string) => void
}

const OPTIONS = [
  { label: 'ภาพรวม', value: 'OVERALL' },
  { label: 'ข้อมูลเหตุการณ์ที่ตรวจพบ', value: 'EVENTS' },
]

const TitleSection: React.FC<Props> = ({ setCurrentTab }) => {
  const router = useRouter()

  return (
    <div className='px-3'>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled className='fs-24 text-(--yellow) cursor-pointer mt-2' onClick={() => router.back()} />
        <div className='flex-1 min-w-0'>
          <h1 className='text-(--yellow)'>Incident Detection : สายทาง นบ.3021</h1>
          <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center 2xl:shrink-0 gap-2'>
            <div className='flex items-center w-full gap-2'>
              <p className='text-(--yellow)'>{'นบ.3021 กม.33+200 – 35+510'}</p>
              <TbInfoSquareRoundedFilled size={24} className='text-white/50 cursor-pointer hover:text-(--yellow)' />
            </div>
            <span className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border border-emerald-500 text-emerald-500'>
              ในค้ำ
            </span>
            <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
              <Button type='primary' htmlType='submit' size='middle' shape='round' icon={<TbAppWindow />} className='w-full! sm:w-auto!'>
                <p className='fs-12'>Anydesk : 1194336831</p>
              </Button>
            </ConfigProvider>
            <ConfigProvider theme={{ token: { colorPrimary: '#1B3F8B', colorTextLightSolid: '#FFFFFF' } }}>
              <Button type='primary' size='middle' shape='round' className='w-full! sm:w-auto!'>
                <p>Google Map</p>
              </Button>
            </ConfigProvider>
            <span className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border border-blue-500 text-blue-500'>
              <TbWifi />ออนไลน์
            </span>
          </div>
        </div>
      </section>
      <section className='mt-5 px-10'>
        <SwapButton options={OPTIONS} defaultActive='OVERALL' setLabelValue={(value) => setCurrentTab(value)} />
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
