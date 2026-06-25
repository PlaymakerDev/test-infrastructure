"use client"
import FeatureSectionLayout from '@/components/section/FeatureSectionLayout'
import React from 'react'
import LocationTrafficSignal from './sections/overall/LocationTrafficSignal'
import DataDisplayTrafficSignal from './sections/overall/DataDisplayTrafficSignal'

const OverallSection: React.FC = () => (
  <FeatureSectionLayout
    top={<LocationTrafficSignal />}
    bottom={<DataDisplayTrafficSignal />}
  />
)

export default React.memo(OverallSection)
