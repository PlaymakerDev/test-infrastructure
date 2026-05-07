"use client"
import { useContext } from 'react'
import { MapContext } from '../MapContext'

export function useMap() {
  return useContext(MapContext)
}
