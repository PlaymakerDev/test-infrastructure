import { Button, ConfigProvider } from 'antd'
import React from 'react'
import { TbPrinter } from 'react-icons/tb'
import { FormSearchDisplay } from '../../../components'

interface Props {
  /** Opens the นำออกเอกสาร modal — data + modal live in DataDisplaySection. */
  onExport: () => void
}

const DisplayTitle: React.FC<Props> = (props) => {
  const { onExport } = props

  return (
    <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
      <h3 className='text-(--yellow) shrink-0'>สายทางที่มีตารางเวลา</h3>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='w-full md:w-72 md:flex-none'>
          <FormSearchDisplay />
        </div>
        <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
          <Button type="primary" htmlType="button" size="large" shape="round" icon={<TbPrinter />} className='w-full! md:w-auto!' onClick={onExport}>
            <p className='fs-12'>นำออกเอกสาร</p>
          </Button>
        </ConfigProvider>
      </div>
    </div>
  )
}

export default React.memo<Props>(DisplayTitle)
