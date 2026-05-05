import SearchCard from '@/components/searchable/SearchCard'
import React from 'react'

interface Props {

}

const OverviewScreen: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <SearchCard />
    </div>
  )
}

export default React.memo<Props>(OverviewScreen)
