"use client"
import React, { useEffect } from "react"
import { useAppSelector } from '@/stores/hooks'
import { useAppDispatch } from "@/stores/hooks"
import { getExampleData } from "@/stores/reducers/example/exampleSlice"


interface Props {

}

const ExampleScreen: React.FC<Props> = (props) => {
  const { } = props
  const { me } = useAppSelector((state) => state.example)
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(getExampleData())
  }, [dispatch])

  return (
    <div>
      {JSON.stringify(me)}
    </div>
  )
}

export default React.memo<Props>(ExampleScreen)
