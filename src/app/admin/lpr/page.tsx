import React from 'react'
import LPROverallScreen from '@/features/admin/lpr/overall/screen'

interface Props {

}

const LPROverallPage: React.FC<Props> = (props) => {
  const { } = props

  return (
    <LPROverallScreen />
  )
}

export default React.memo<Props>(LPROverallPage)
