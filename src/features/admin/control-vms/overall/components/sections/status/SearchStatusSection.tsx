import React from 'react'
import { FormSearchStatus } from '../../../components'
import { Button, ConfigProvider } from 'antd'
import { TbPrinter } from 'react-icons/tb'

interface Props {
  /** Opens the นำออกเอกสาร modal — state lives in StatusSection (this button
   *  mounts twice: mobile there, desktop in ContentTab's tab bar). */
  onExport: () => void
}

const SearchStatusSection: React.FC<Props> = (props) => {
  const { onExport } = props

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <div className='w-full md:w-72 md:flex-none'>
        <FormSearchStatus />
      </div>
      <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
        <Button type="primary" htmlType="button" size="large" shape="round" icon={<TbPrinter />} className='w-full! md:w-auto!' onClick={onExport}>
          <p className='fs-12'>นำออกเอกสาร</p>
        </Button>
      </ConfigProvider>
    </div>
  )
}

export default React.memo<Props>(SearchStatusSection)
