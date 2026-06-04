import SwapButton from '@/components/swap-button/SwapButton'
import { Badge, Button, ConfigProvider } from 'antd'
import { useRouter } from 'next/navigation'
import React from 'react'
import { TbAppWindow, TbArrowBigLeftFilled, TbInfoSquareRoundedFilled, TbWifi } from 'react-icons/tb'

interface Props {
}

const TitleSection: React.FC<Props> = (props) => {
  const { } = props
  const router = useRouter()

  return (
    <div className='px-3'>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-2'
          onClick={() => router.back()}
        />
        <div className='flex-1 min-w-0'>
          <h1 className='text-(--yellow)'>BridgeLighting : สายทาง บทช.กัลปพฤกษ์</h1>
          <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2'>
            <div className='flex items-center gap-2'>
              <p>{'ไฟประดับ : สะพานกรุงเทพ ฝั่งพระนคร'}</p>
              <TbInfoSquareRoundedFilled
                size={24}
                className='text-white/50 cursor-pointer hover:text-(--yellow)'
              />
              <span className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border border-emerald-500 text-emerald-500'>
                ในค้ำ
              </span>
            </div>
            <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
              <Button
                type='primary'
                htmlType='submit'
                size='middle'
                shape='round'
                icon={<TbAppWindow />}
                className='w-full sm:w-auto'
              >
                <p className='fs-12'>Anydesk : 1194336831</p>
              </Button>
            </ConfigProvider>
            <ConfigProvider theme={{ token: { colorPrimary: '#1B3F8B', colorTextLightSolid: '#FFFFFF' } }}>
              <Button
                type='primary'
                size='middle'
                shape='round'
                className='w-full sm:w-auto'
              >
                <p>Google Map</p>
              </Button>
            </ConfigProvider>
            <span className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border border-blue-500 text-blue-500 w-full sm:w-auto'>
              <TbWifi />ออนไลน์
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
