"use client"
import Map from '@/components/map/Map'
import ReactMap from '@/components/map/ReactMap'
import { useAppDispatch } from '@/stores/hooks'
import { getExampleData } from '@/stores/reducers/example/exampleSlice'
import React, { useEffect } from 'react'

interface Props {

}

const DashboardScreen: React.FC<Props> = (props) => {
  const { } = props
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(getExampleData())
  }, [dispatch])

  return (
    <div className='relative w-screen h-screen'>
      <ReactMap />

    </div>
  )
}

export default React.memo<Props>(DashboardScreen)
