import React, { useState } from 'react'
import { TitleSection, OverallSection } from '../components'
import { DetailProvider } from '../context'
import { useQuery } from '@tanstack/react-query'
import { getVMSDetailAPI } from '@/services/routes/VMSService'
import { Skeleton } from 'antd'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'
import { useSearchParams } from 'next/navigation'
import { vmsDetailKeys } from '../data/queryKeys'
import ChartElectricalVMS from '../components/sections/overall/ChartElectricalVMS'
import ExportVMSPmModal from '../components/sections/overall/ExportVMSPmModal'

interface Props {
  id?: string | string[]
}

const VMSDetailScreen: React.FC<Props> = (props) => {
  const { id } = props
  const searchParams = useSearchParams()
  const isWarranty = searchParams.get('is_warranty')
  const isOnline = searchParams.get('is_online')
  const [exportOpen, setExportOpen] = useState(false)
  const solutionId = Number(id) || undefined

  const { data, isLoading } = useQuery({
    queryKey: vmsDetailKeys.detail(String(id ?? '')),
    queryFn: () => getVMSDetailAPI(Number(id)!),
    enabled: !!id,
  })

  if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />

  return (
    <DetailProvider>
      <div className='main-screen'>
        <TitleSection
          data={data?.data}
          isWarranty={isWarranty === 'true'}
          isOnline={isOnline === 'true'}
          onExport={() => setExportOpen(true)}
        />
        <section className='mt-8'>
          <OverallSection
            data={data?.data}
            isWarranty={isWarranty === 'true'}
            isOnline={isOnline === 'true'}
          />
        </section>
        {/* แรงดัน/กระแสไฟฟ้าตู้ควบคุม 24 ชม. — single-phase PM charts below the
          * map row, ported from bridge-lighting's ChartElectricalBridgeLighting
          * (data: POST /vms/pm-chart, keyed by this solution id). No overlap
          * defense needed here anymore — LocationSection's map block now grows
          * with its left overlay column, so this section always starts below
          * it. `pb-8`: .main-screen has no bottom padding, so without this the
          * cards' bottom edge sat flush against the viewport end — and it must
          * be PADDING, not margin: as the last child of the scroll container a
          * bottom margin collapses away and adds no scrollable space
          * (verified live — mb-8 here left the cards touching the browser
          * edge, 2026-09-02).
          * Horizontal insets mirror the sibling cards exactly — the map's
          * overlay panels sit at `left-4`/`right-4` (16px) on xl and `px-10`
          * (40px) in mobile flow, so this row uses the same values or its
          * cards jut out past every other card's edge (2026-09-02 feedback). */}
        <section className='mt-4 pb-8 px-10 xl:px-4'>
          <ChartElectricalVMS solutionId={solutionId} />
        </section>
      </div>
      <CCTVModal />
      <ProjectInfoModal />
      {/* นำออกเอกสาร — mounted at the screen (the data owner) so the report
        * always exports the same PM series the charts above render. */}
      <ExportVMSPmModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        solutionId={solutionId}
        detailData={data?.data}
      />
    </DetailProvider>
  )
}

export default React.memo<Props>(VMSDetailScreen)
