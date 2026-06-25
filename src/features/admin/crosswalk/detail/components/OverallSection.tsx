import FeatureSectionLayout from '@/components/section/FeatureSectionLayout'
import React from 'react'
import { ChartSection, DataDisplaySection, LocationSection } from '../components'

const OverallSection: React.FC = () => (
  <FeatureSectionLayout
    top={<LocationSection />}
    middle={<DataDisplaySection />}
    bottom={<ChartSection />}
  />
)

export default React.memo(OverallSection)
