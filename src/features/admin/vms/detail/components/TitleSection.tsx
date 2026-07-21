import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { APIResponseVMSDetail } from '@/types/vms/detail-api'
import { LeftOutlined } from '@ant-design/icons'
import { Button, ConfigProvider } from 'antd'
import { useRouter } from 'next/navigation'
import React, { useMemo } from 'react'
import { TbAppWindow, TbArrowBigLeftFilled, TbInfoSquareRoundedFilled, TbWifi, TbWifiOff } from 'react-icons/tb'

interface Props {
  data?: APIResponseVMSDetail
  isWarranty?: boolean
  isOnline?: boolean
}

const TitleSection: React.FC<Props> = (props) => {
  const { data, isWarranty, isOnline } = props
  const router = useRouter()
  const dispatch = useAppDispatch()

  const renderIsWarranty = useMemo(() => {
    return (
      <span className={`inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border ${isWarranty ? 'border-[#05F2DB]' : 'border-gray-500'} ${isWarranty ? 'text-[#05F2DB]' : 'text-gray-500'} w-full sm:w-auto`}>
        {isWarranty ? 'ในค้ำ' : 'หมดค้ำ'}
      </span>
    )
  }, [isWarranty])

  const renderIsOnline = useMemo(() => {
    return (
      <span className={`inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border ${isOnline ? 'border-(--default-blue)' : 'border-red-500'} ${isOnline ? 'text-(--default-blue)' : 'text-red-500'} w-full sm:w-auto`}>
        {isOnline ? <><TbWifi className='fs-18' />ออนไลน์</> : <><TbWifiOff className='fs-18' />ออฟไลน์</>}
      </span>
    )
  }, [isOnline])

  return (
    <div className='px-8'>
      <p
        className='block mb-3 lg:hidden text-(--yellow) cursor-pointer'
        onClick={() => router.back()}
      >
        &lt; ย้อนกลับ
      </p>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-2 hidden lg:block'
          onClick={() => router.back()}
        />
        <div className='flex-1 min-w-0'>
          <h1 className='text-(--yellow)'>VMS : สายทาง {data?.solution.solution_location.project_roads.road.road_code || '-'}</h1>
          <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <p>{`VMS >> ${data?.solution.solution_name}` || '-'}</p>
              <TbInfoSquareRoundedFilled
                size={24}
                className='text-white cursor-pointer hover:text-(--yellow)'
                onClick={() => dispatch(setProjectInfoModalOpen({ open: true, project_id: data?.solution.solution_location.project_id, road_id: data?.solution.solution_location.project_roads.road_id }))}
              />
              {renderIsWarranty}
            </div>
            <ConfigProvider theme={{ token: { colorPrimary: '#003F87', colorTextLightSolid: '#FFFFFF' } }}>
              <Button
                type='primary'
                size='middle'
                shape='round'
                className='w-full sm:w-auto'
                onClick={() => window.open(`https://maps.google.com/?q=${data?.solution.geometry_point[1]},${data?.solution.geometry_point[0]}`, '_blank')}
              >
                <p className='fs-12'>Google Map</p>
              </Button>
            </ConfigProvider>
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: '#66AEFF',
                  colorTextLightSolid: '#0A0A0A',
                  colorBgContainerDisabled: '#3d3d3d',
                  colorTextDisabled: '#7d7d7d',
                  colorPrimaryBorder: !data?.solution.anydesk ? '#7d7d7d' : '#66AEFF'
                },
              }}
            >
              <Button
                disabled={!data?.solution.anydesk}
                type='primary'
                htmlType='submit'
                size='middle'
                shape='round'
                icon={<TbAppWindow />}
                className='w-full sm:w-auto border-transparent!'
                // onClick={() => window.open(data?.solution.anydesk ? `https://remote.anydesk.com/${data.solution.anydesk}` : '#', '_blank')}
                onClick={() => {
                  if (!data?.solution.anydesk) return
                  window.location.href = `anydesk:${data.solution.anydesk}`
                }}
              >
                <p className='fs-12'>Anydesk : {data?.solution.anydesk || '-'}</p>
              </Button>
            </ConfigProvider>
            {renderIsOnline}
          </div>
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
