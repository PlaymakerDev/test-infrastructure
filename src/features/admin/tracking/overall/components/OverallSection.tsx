import FeatureSectionLayout from '@/components/section/FeatureSectionLayout'
import React from 'react'
import { ChartSection, OverallLocationSection, VehicleStatSection } from '.'

const OverallSection: React.FC = () => (
  <FeatureSectionLayout
    top={<OverallLocationSection />}
    middle={<VehicleStatSection />}
    bottom={<ChartSection />}
  />
)

export default React.memo(OverallSection)
