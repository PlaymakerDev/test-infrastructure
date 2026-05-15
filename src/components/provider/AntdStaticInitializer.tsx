"use client"
import { App } from 'antd'
import { useEffect } from 'react'
import { setModalInstance } from '@/lib/antd-static'

export default function AntdStaticInitializer() {
  const { modal } = App.useApp()
  useEffect(() => {
    setModalInstance(modal)
  }, [modal])
  return null
}
