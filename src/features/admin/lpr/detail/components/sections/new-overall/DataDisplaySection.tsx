import SearchBar, { FilterConfig, ViewMode } from '@/components/searchable/SearchBar'
import React, { useMemo, useState } from 'react'
import { ContentCCTV, TableCCTVData } from '../../../components'

interface Props {

}

const LPR_FILTERS: FilterConfig[] = [
  {
    key: 'all',
    label: 'ทั้งหมด',
    colorPrimary: '#FCD116',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#8a7000] text-white',
    badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]',
  },
  {
    key: 'online',
    label: 'ออนไลน์',
    colorPrimary: '#66AEFF',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#1B3F8B] text-white',
    badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]',
  },
  {
    key: 'offline',
    label: 'ออฟไลน์',
    colorPrimary: '#E94C4C',
    colorTextLightSolid: '#ffffff',
    badgeActiveClass: 'bg-red-800 text-white',
    badgeIdleClass: 'bg-red-500/20 text-red-400',
  },
]

const DataDisplaySection: React.FC<Props> = (props) => {
  const { } = props
  const [displayType, setDisplayType] = useState<ViewMode>('GRID')
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableCCTVData />
      case 'GRID':
        return <ContentCCTV />
      default:
        return null
    }
  }, [displayType])

  return (
    <div>
      <section>
        <SearchBar
          filters={LPR_FILTERS}
          stats={{
            all: 0,
            online: 0,
            offline: 0,
          }}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={displayType}
          onViewModeChange={setDisplayType}
        // formSearch={<FormSearchVMS onSearch={onSearch} />}
        // onExport={() => setExportOpen(true)}
        />
      </section>

      {/* ── นำออกเอกสาร — exports the CURRENTLY FILTERED rows (what the
                  table/card grid shows), mirroring the CCTV overview report. */}
      {/* <ExportFileModal
              open={exportOpen}
              onClose={() => setExportOpen(false)}
              count={exportRows.length}
              onExportPdf={async () => {
                const { exportTablePdf } = await import('@/utils/export/pdf')
                await exportTablePdf({
                  filenameBase: 'VMS_Overview_Report',
                  title: 'รายงานสรุปภาพรวมป้าย VMS (VMS Overview)',
                  filterNote: exportFilterNote,
                  columns: hideProjectNameColumns(VMS_EXPORT_COLUMNS).map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
                  rows: exportRows,
                })
              }}
              onExportExcel={async () => {
                const { exportExcel } = await import('@/utils/export/excel')
                exportExcel({
                  filenameBase: 'VMS_Overview_Report',
                  title: 'รายงานสรุปภาพรวมป้าย VMS (VMS Overview)',
                  filterNote: exportFilterNote,
                  sheetName: 'VMS Overview',
                  columns: hideProjectNameColumns(VMS_EXPORT_COLUMNS).map(({ header, width, value }) => ({ header, width, value })),
                  rows: exportRows,
                })
              }}
            /> */}

      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
