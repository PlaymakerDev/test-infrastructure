"use client"
import { Button, Empty, Skeleton, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import React, { useMemo } from 'react'
import { ContentSetting } from '../../../components'
import { useVMSSettingTypes } from '../../../hooks/useVMSSettingTypes'
import { useControlVMSContext } from '../../../context'

interface Props {
  /** When provided, forwarded to every tab's ContentSetting (picker mode) —
   *  also hides "จัดการประเภท" since managing types isn't relevant while picking. */
  onSelect?: (url: string) => void
  /** Forwarded to every tab's ContentSetting — see its own doc comment. */
  inModal?: boolean
}

const DetailTabContent: React.FC<Props> = ({ onSelect, inModal }) => {
  const { data, isLoading, isError } = useVMSSettingTypes()
  const { setOpenUpdateType } = useControlVMSContext()

  const items: TabsProps['items'] = useMemo(() => {
    return [
      {
        key: 'all',
        label: 'ทั้งหมด',
        children: <ContentSetting settingTypeId={undefined} onSelect={onSelect} inModal={inModal} />,
      },
      ...(data?.data ?? []).map((item) => ({
        key: String(item.id),
        label: item.name,
        children: <ContentSetting settingTypeId={item.id} onSelect={onSelect} inModal={inModal} />,
      }))
    ]
  }, [data?.data, onSelect, inModal])

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />
  if (isError) return <Empty description="ไม่พบข้อมูล" />

  return (
    <Tabs
      defaultActiveKey='all'
      items={items}
      indicator={{ align: 'center' }}
      destroyOnHidden
      tabBarExtraContent={onSelect ? undefined : {
        right: <Button htmlType='button' type='primary' onClick={() => setOpenUpdateType({ open: true })}>จัดการประเภท</Button>
      }}
    />
  )
}

export default React.memo(DetailTabContent)
