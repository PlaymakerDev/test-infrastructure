import FeatureSectionLayout from '@/components/section/FeatureSectionLayout'
import React from 'react'
import { DataDisplaySection, LocationSection } from '../components'

const OverallSection: React.FC = () => (
  <FeatureSectionLayout
    top={<LocationSection />}
    bottom={<DataDisplaySection />}
  />
)

export default React.memo(OverallSection)
