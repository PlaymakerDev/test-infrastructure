import FeatureSectionLayout from '@/components/section/FeatureSectionLayout'
import React from 'react'
import { DataDisplaySection, LocationSection } from '../components'

interface Props {
  deptId?: string | string[] | number
}

const OverallSection: React.FC<Props> = ({ deptId }) => (
  <FeatureSectionLayout
    top={<LocationSection deptId={deptId!} />}
    bottom={<DataDisplaySection deptId={deptId!} />}
  />
)

export default React.memo<Props>(OverallSection)
