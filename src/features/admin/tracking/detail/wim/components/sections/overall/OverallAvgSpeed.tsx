import React from 'react'

interface Props {

}

const OverallAvgSpeed: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className="h-full border-2 rounded-lg p-5 border-(--yellow)">
      index
    </div>
  )
}

export default React.memo<Props>(OverallAvgSpeed)
