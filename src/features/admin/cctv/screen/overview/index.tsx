import SearchBar from '@/components/searchable/SearchBar'
import React from 'react'

interface Props {

}

const OverviewScreen: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <SearchBar />
    </div>
  )
}

export default React.memo<Props>(OverviewScreen)
