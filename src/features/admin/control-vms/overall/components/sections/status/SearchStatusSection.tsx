import React from 'react'
import { FormSearchStatus } from '../../../components'
import { Button, ConfigProvider } from 'antd'
import { TbPlaylistX, TbPrinter } from 'react-icons/tb'

interface Props {
  /** Opens the นำออกเอกสาร modal — state lives in StatusSection (this button
   *  mounts twice: mobile there, desktop in ContentTab's tab bar). */
  onExport: () => void
  /** Opens the ยกเลิกคำสั่งทั้งหมด confirm modal — state lives in
   *  StatusSection, same double-mount rule as onExport. */
  onCancelAll: () => void
  /** True when no command exists at all — the bulk-cancel has nothing to do. */
  cancelAllDisabled?: boolean
}

const SearchStatusSection: React.FC<Props> = (props) => {
  const { onExport, onCancelAll, cancelAllDisabled } = props

  return (
    <div className='flex flex-wrap items-center gap-3'>
      {/* Bulk cancel sits before the search box (2026-08-05 request) — solid
          red like the per-card ยกเลิกคำสั่ง button so both actions read as the
          same destructive family. ConfigProvider (not `danger`): the app
          theme's colorTextLightSolid is near-black, which made the danger
          button's label/icon dark — this pins white text on #ef4444, same as
          the modal's ยืนยัน button. */}
      <ConfigProvider theme={{ token: { colorPrimary: '#ef4444', colorTextLightSolid: '#FFFFFF' } }}>
        <Button
          type='primary'
          htmlType='button'
          size='large'
          shape='round'
          icon={<TbPlaylistX />}
          className='w-full! md:w-auto!'
          onClick={onCancelAll}
          disabled={cancelAllDisabled}
        >
          <p className='fs-12'>ยกเลิกคำสั่งทั้งหมด</p>
        </Button>
      </ConfigProvider>
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
