"use client"
import React from 'react'
import BaseMap from '@/components/map/BaseMap'
import { useLPRDetailContext } from '../../../context'

interface Props {

}

/** Center map — fills the full remaining device height below the fixed
 *  chrome above it (navbar + `DetailTitleSection` + the page's own margins),
 *  same `calc(viewport - Npx)` technique as cctv detail's map row
 *  (`cctv/detail/components/OverallSection.tsx`, 280px there). LPR's chrome
 *  budget: navbar `--nav-h` (72) + `DetailTitleSection` (~164, same shared
 *  component) + screen `mt-8` (32) + `NewOverallSection`'s own `mt-5` (20)
 *  before this row ⇒ 288px. `dvh` (not `vh`) so mobile browsers' collapsing
 *  address bar doesn't leave a gap at the bottom. `minHeight` guards very
 *  short viewports the same way cctv's `minHeight: 480` does.
 *
 *  No `relative`/`absolute` wrapper needed here: this component always
 *  renders inside an antd `<Col>` (`NewOverallSection.tsx`), and antd's own
 *  grid CSS already sets `.ant-col { position: relative }` — BaseMap's
 *  internal `absolute inset-0` layers bind to that for free. */
const ContentMap: React.FC<Props> = () => {
  const { point } = useLPRDetailContext()
  const hasCoord = !!point && !!point.lat && !!point.lng
  const center: [number, number] = hasCoord ? [point.lng, point.lat] : [100.5, 13.75]

  return (
    <div className='h-[calc(100dvh-288px)] min-h-120 rounded-2xl overflow-hidden'>
      <BaseMap
        initialCenter={center}
        initialZoom={hasCoord ? 15 : 6}
        initialPitch={30}
        edgeFade={{ all: 10 }}
      />
    </div>
  )
}

export default React.memo<Props>(ContentMap)
