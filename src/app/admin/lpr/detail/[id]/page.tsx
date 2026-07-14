import React from 'react'
import LPRDetailScreen from '@/features/admin/lpr/detail/screen'

interface Props {

}

const LPRDetailPage: React.FC<Props> = (props) => {
  const { } = props

  return (
    <LPRDetailScreen />
  )
}

export default React.memo<Props>(LPRDetailPage)
