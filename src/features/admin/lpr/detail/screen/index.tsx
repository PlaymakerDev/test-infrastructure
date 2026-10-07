// "use client"
// import React from 'react'
// import ComingSoon from '@/components/common/ComingSoon'

// TEMP: LPR detail page is not ready for use yet — show the shared "under development" placeholder.
// The original implementation is kept below (commented out) so it can be restored by
// deleting this block and un-commenting the code underneath.

// interface Props {
//   id: string[] | string | number | undefined;
// }

// const LPRDetailScreen: React.FC<Props> = () => {
//   return <ComingSoon title="LPR" />
// }

// export default React.memo(LPRDetailScreen)

// ---------------------------------------------------------------------------
// ORIGINAL IMPLEMENTATION (disabled)
// ---------------------------------------------------------------------------
//
"use client"
import React, { useMemo, useState } from 'react'
import { TitleSection, NewOverallSection, ModalLicenseDetail, NewDetectionSection } from '../components'
import { DetailProvider, useLPRDetailContext, type LPRDetailTab } from '../context'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'
import { useSearchParams } from 'next/navigation'

interface Props {
  id: string[] | string | number | undefined;
}

const LPRDetailContent = () => {
  const { currentTab } = useLPRDetailContext()

  const content = useMemo(() => {
    switch (currentTab) {
      case 'OVERALL':
        // return <OverallSection onShowAllDetections={() => setCurrentTab('DETECTIONS')} />
        return <NewOverallSection />
      case 'DETECTIONS':
        // return <DetectionSection />
        return <NewDetectionSection />
      default:
        // return <OverallSection onShowAllDetections={() => setCurrentTab('DETECTIONS')} />
        return <NewOverallSection />
    }
  }, [currentTab])

  return (
    <div className='main-screen'>
      <TitleSection />
      <section className='mt-8 px-10 pb-8'>
        {content}
      </section>
    </div>
  )
}

const LPRDetailScreen: React.FC<Props> = (props) => {
  const { id } = props
  // PARAMS
  const params = useSearchParams()
  const solutionId = String(Array.isArray(id) ? id[0] : id ?? '')
  const departmentId = params.get('dept_id') ?? ''
  const roadId = params.get('road_id') ?? ''

  // Owned here (above DetailProvider) and handed in as props so the provider
  // can expose it via context — any section nested under it can then read
  // or switch tabs without prop-drilling through LPRDetailContent.
  const [currentTab, setCurrentTab] = useState<LPRDetailTab>('OVERALL')

  return (
    <DetailProvider
      solutionId={solutionId}
      departmentId={departmentId}
      roadId={roadId}
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
    >
      <LPRDetailContent />
      <ProjectInfoModal />
      <CCTVModal />
      <ModalLicenseDetail />
    </DetailProvider>
  )
}

export default React.memo(LPRDetailScreen)
