"use client"
import React from 'react'
import { CctvDetail } from '../components'

interface Props {
  id: string
}

const CctvDetailScreen: React.FC<Props> = ({ id }) => {
  return <CctvDetail id={id} />
}

export default React.memo<Props>(CctvDetailScreen)
