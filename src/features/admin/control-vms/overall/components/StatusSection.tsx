import React, { useCallback, useState } from 'react'
import { ContentTab, ModalStatusVMSScreen, ModalUpdateSchedule, SearchStatusSection } from '../components'

interface Props {

}

const StatusSection: React.FC<Props> = (props) => {
  const { } = props
  // นำออกเอกสาร — state lives here because the trigger button mounts twice
  // (mobile below, desktop inside ContentTab's tab bar) while the modal +
  // data live in the active StatusTabContent pane.
  const [exportOpen, setExportOpen] = useState(false)
  const openExport = useCallback(() => setExportOpen(true), [])
  const closeExport = useCallback(() => setExportOpen(false), [])

  return (
    <div className='px-10'>
      <div className='mb-5 lg:mb-0 lg:hidden'>
        <SearchStatusSection onExport={openExport} />
      </div>
      <ContentTab exportOpen={exportOpen} onExportOpen={openExport} onExportClose={closeExport} />
      <ModalStatusVMSScreen />
      <ModalUpdateSchedule />
    </div>
  )
}

export default React.memo<Props>(StatusSection)
