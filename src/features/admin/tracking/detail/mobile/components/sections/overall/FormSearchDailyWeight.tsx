import React from 'react'
import { Button, ConfigProvider, Segmented } from 'antd';
import { AppstoreOutlined, BarsOutlined } from '@ant-design/icons';
import { TbPrinter } from 'react-icons/tb';

interface Props {
  displayType: 'TABLE' | 'GRID'
  setDisplayType: (value: 'TABLE' | 'GRID') => void
}

const FormSearchDailyWeight: React.FC<Props> = (props) => {
  const { displayType, setDisplayType } = props

  return (
    <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3'>
      <h3 className='text-(--yellow)'>ตารางข้อมูลรถเข้าชั่งประจำวัน</h3>
      <div className='flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto lg:shrink-0'>
        <Segmented
          value={displayType}
          onChange={setDisplayType}
          options={[
            { value: 'TABLE', icon: <BarsOutlined /> },
            { value: 'GRID', icon: <AppstoreOutlined /> },
          ]}
          size='large'
          block
        />
        <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
          <Button type="primary" htmlType="submit" size="large" shape="round" icon={<TbPrinter />} className='w-full! md:w-auto!'>
            <p>นำออกเอกสาร</p>
          </Button>
        </ConfigProvider>
      </div>
    </div>
  )
}

export default React.memo<Props>(FormSearchDailyWeight)
