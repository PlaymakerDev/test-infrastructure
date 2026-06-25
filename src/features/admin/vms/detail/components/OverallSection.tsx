import FeatureSectionLayout from '@/components/section/FeatureSectionLayout'
import { APIResponseVMSDetail } from '@/types/vms/detail-api'
import React from 'react'
import { LocationSection } from '../components'

interface Props {
  data?: APIResponseVMSDetail
}

const OverallSection: React.FC<Props> = ({ data }) => (
  <FeatureSectionLayout top={<LocationSection data={data} />} />
)

export default React.memo<Props>(OverallSection)
