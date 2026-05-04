"use client"
import ReactMap from '@/components/map/ReactMap'
import { useAppDispatch } from '@/stores/hooks'
import { getExampleData } from '@/stores/reducers/example/exampleSlice'
import React, { useEffect } from 'react'
import { RatioChart, StatusChart } from '../components'

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
      {/* <div className='absolute top-25 left-0 w-full h-full p-5'>
        <StatusChart />
      </div>
      <div className='absolute top-70 left-0 w-full h-full p-5'>
        <RatioChart />
      </div> */}
    </div>
  )
}

export default React.memo<Props>(DashboardScreen)
