import { PlusOutlined } from '@ant-design/icons'
import { Badge, Button, ConfigProvider } from 'antd'
import React from 'react'
import { TbAppWindow } from 'react-icons/tb'
import { useVMSContext } from '../../../context'

interface Props {

}

const DetailTitle: React.FC<Props> = (props) => {
  const { } = props
  const { setAddMode, bureauRoute, bureauSign } = useVMSContext()

  // PREV 2xl:items-center
  return (
    <div className='flex flex-col gap-3 2xl:flex-row 2xl:items-start 2xl:justify-between'>
      <div className='min-w-0'>
        <h2>{bureauSign?.name || '-'}</h2>
        <p>รหัสสายทาง : {bureauRoute?.title || '-'}</p>
        <p className='text-gray-400 fs-12'>ปรับเปลี่ยนครั้งล่าสุด : 04 พ.ค. 2568 (Anydesk)</p>
      </div>
      <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center 2xl:shrink-0 gap-2'>
        <span className={`inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border ${bureauSign?.is_active ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'}`}>
          {bureauSign?.is_active ? 'Online' : 'Offline'} <Badge color={bureauSign?.is_active ? "green" : "red"} />
        </span>
        <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
          <Button type="primary" htmlType="submit" size="middle" shape="round" icon={<TbAppWindow />} className='w-full! sm:w-auto!'>
            <p className='fs-12'>Anydesk : {bureauSign?.anydesk || '-'}</p>
          </Button>
        </ConfigProvider>
        <Button
          type="primary"
          size="middle"
          shape="round"
          icon={<PlusOutlined />}
          className='w-full! sm:w-auto!'
          onClick={() => setAddMode(true)}
        >
          <p className='fs-12'>เพิ่มคำสั่ง</p>
        </Button>
      </div>
    </div>
  )
}

export default React.memo<Props>(DetailTitle)
