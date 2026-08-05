import React, { useCallback, useMemo, useState } from 'react'
import { ContentTab, ModalCancelAllCommands, ModalStatusVMSScreen, ModalUpdateSchedule, SearchStatusSection } from '../components'
import { useVMSSettingStatusCount } from '../hooks/useVMSSettingStatusCount'

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

  // ยกเลิกคำสั่งทั้งหมด — same double-mounted-trigger rule; the confirm modal
  // mounts once here (local modal state per the control-vms convention).
  const [cancelAllOpen, setCancelAllOpen] = useState(false)
  const openCancelAll = useCallback(() => setCancelAllOpen(true), [])
  const closeCancelAll = useCallback(() => setCancelAllOpen(false), [])
  // Disable the button when there is no command at all — reuses ContentTab's
  // status-count query (same key → no extra fetch).
  const { data: statusCounts } = useVMSSettingStatusCount()
  const totalCommands = useMemo(
    () => (statusCounts?.data ?? []).reduce((sum, item) => sum + (item.count || 0), 0),
    [statusCounts],
  )

  return (
    <div className='px-10 lg:px-0'>
      <div className='mb-5 lg:mb-0 lg:hidden'>
        <SearchStatusSection onExport={openExport} onCancelAll={openCancelAll} cancelAllDisabled={totalCommands === 0} />
      </div>
      <ContentTab
        exportOpen={exportOpen}
        onExportOpen={openExport}
        onExportClose={closeExport}
        onCancelAll={openCancelAll}
        cancelAllDisabled={totalCommands === 0}
      />
      <ModalStatusVMSScreen />
      <ModalUpdateSchedule />
      <ModalCancelAllCommands open={cancelAllOpen} onClose={closeCancelAll} />
    </div>
  )
}

export default React.memo<Props>(StatusSection)
