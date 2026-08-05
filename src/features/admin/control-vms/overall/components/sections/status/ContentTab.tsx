import { Empty, Skeleton, Tabs, TabsProps } from 'antd'
import React, { useCallback, useMemo } from 'react'
import { SearchStatusSection, StatusTabContent } from '../../../components'
import { useVMSSettingStatusCount } from '../../../hooks/useVMSSettingStatusCount'

interface Props {
  /** นำออกเอกสาร wiring, owned by StatusSection — forwarded to the desktop
   *  SearchStatusSection button (open) and the active StatusTabContent
   *  pane (modal open/close). */
  exportOpen: boolean
  onExportOpen: () => void
  onExportClose: () => void
  /** ยกเลิกคำสั่งทั้งหมด wiring — same StatusSection-owned, forwarded shape. */
  onCancelAll: () => void
  cancelAllDisabled?: boolean
}

const ContentTab: React.FC<Props> = (props) => {
  const { exportOpen, onExportOpen, onExportClose, onCancelAll, cancelAllDisabled } = props

  const { data, isLoading, isError } = useVMSSettingStatusCount()

  const renderTabLabel = useCallback((statusName: string, count: number) => {
    return (
      <span className='flex items-center gap-2'>
        {statusName}
        <span className='inline-flex items-center justify-center min-w-6 px-2 py-0.5 rounded-full fs-12 font-medium bg-[#2A2A2A] text-white'>
          {count || 0}
        </span>
      </span>
    )
  }, [])

  const items: TabsProps['items'] = useMemo(() => {
    return [
      ...(data?.data ?? []).map((item) => ({
        key: String(item.status_id),
        label: renderTabLabel(item.status_name, item.count),
        children: <StatusTabContent item={item} exportOpen={exportOpen} onExportClose={onExportClose} />,
      }))
    ]
  }, [data?.data, renderTabLabel, exportOpen, onExportClose])

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />
  if (isError) return <Empty description="ไม่พบข้อมูล" />

  return (
    <Tabs
      defaultActiveKey={String(data?.data?.[0]?.status_id ?? '')}
      items={items}
      indicator={{ align: 'center' }}
      destroyOnHidden
      // AntD's default `.ant-tabs-nav::before` border spans the whole nav row
      // (tabs + tabBarExtraContent), since `.ant-tabs-nav-wrap` stretches with
      // `flex: auto` to fill space up to the extra content. Hide that and redraw
      // the line scoped to `.ant-tabs-nav-list`, which sizes to the tabs themselves.
      className='[&_.ant-tabs-nav::before]:hidden! [&_.ant-tabs-nav-list]:relative! [&_.ant-tabs-nav-list::after]:content-[""]! [&_.ant-tabs-nav-list::after]:absolute! [&_.ant-tabs-nav-list::after]:inset-x-0! [&_.ant-tabs-nav-list::after]:bottom-0! [&_.ant-tabs-nav-list::after]:border-b! [&_.ant-tabs-nav-list::after]:border-(--light-gray-3)!'
      tabBarExtraContent={{
        right: (
          <div className='hidden lg:block'>
            <SearchStatusSection onExport={onExportOpen} onCancelAll={onCancelAll} cancelAllDisabled={cancelAllDisabled} />
          </div>
        )
      }}
    />
  )
}

export default React.memo<Props>(ContentTab)
