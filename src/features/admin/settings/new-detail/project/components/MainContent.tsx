import { Card, ConfigProvider, TabsProps } from 'antd'
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons'
import React, { useCallback, useMemo, useState } from 'react'
import { Tabs } from 'antd'
import { EmptyRoadSolution, SolutionContent } from '../components'
import { useProjectContext } from '../context'

interface Props {

}

const ADD_POINT_KEY = 'ADD'

const MainContent: React.FC<Props> = (props) => {
  const { } = props
  const { roadSolution, onCreate, isCreating, activeLocationId, setActiveLocationId } = useProjectContext()

  const items: TabsProps['items'] = useMemo(() => {
    const mappedItems = roadSolution.solution_locations.map((item) => {
      return {
        key: String(item.solution_location_id),
        label: item.location_name,
        children: <SolutionContent item={item} />,
      }
    })
    return [
      ...mappedItems,
      {
        key: ADD_POINT_KEY,
        label: 'เพิ่มจุดติดตั้ง',
        icon: isCreating ? <LoadingOutlined /> : <PlusOutlined />,
        disabled: isCreating,
      },
    ]
  }, [roadSolution, isCreating])

  // Reset to the road's first point whenever the point list changes for a
  // reason `onCreate`/`onDelete` didn't already pick a specific tab for
  // (e.g. switching roads via the SwapButton in TitleSection), so the tab
  // never points at a `solution_location_id` that belonged to the previous
  // road. `activeLocationId` lives in context (not local state) because
  // `onCreate`/`onDelete` — which run there — are the ones that know which
  // tab should become active once their mutation lands; adjusting it here
  // directly during render (React's documented pattern for "reset state
  // when a prop changes") is still safe since it's this component's own
  // top-level read of that context value.
  const [syncedItems, setSyncedItems] = useState(items)
  if (items !== syncedItems) {
    setSyncedItems(items)
    if (!activeLocationId || !items.some((item) => item.key === activeLocationId)) {
      const firstPointKey = items.find((item) => item.key !== ADD_POINT_KEY)?.key
      setActiveLocationId(firstPointKey !== undefined ? String(firstPointKey) : undefined)
    }
  }

  const handleChange = useCallback((key: string) => {
    // The "เพิ่มจุดติดตั้ง" entry is an action, not a real tab — it has no
    // `children`, so letting it become the active tab would show a blank
    // pane. Create the next point directly and leave the current point
    // selected; the new tab appears once the create call resolves.
    if (key === ADD_POINT_KEY) {
      onCreate()
      return
    }
    setActiveLocationId(key)
  }, [onCreate, setActiveLocationId])

  if (!roadSolution.solution_locations.length) return <EmptyRoadSolution />

  return (
    <div
      className='bg-(--dark-black) py-4 px-8 rounded-lg'
      style={{
        boxShadow: '0px 8px 10px 0px #00000040',
      }}
    >
      <ConfigProvider
        theme={{
          components: {
            Tabs: {
              // No dark algorithm → default inactive tab text is too dark on this bg.
              itemColor: "rgba(255,255,255,0.55)",
              itemHoverColor: "#FFFFFF",
              itemActiveColor: "var(--default-blue)",
              itemSelectedColor: "var(--default-blue)",
              inkBarColor: "var(--default-blue)",
            }
          }
        }}
      >
        <Tabs
          activeKey={activeLocationId}
          items={items}
          onChange={handleChange}
          indicator={{ align: 'center' }}
          className='[&_.ant-tabs-nav::before]:hidden! [&_.ant-tabs-nav-list]:relative! [&_.ant-tabs-nav-list::after]:content-[""]! [&_.ant-tabs-nav-list::after]:absolute! [&_.ant-tabs-nav-list::after]:inset-x-0! [&_.ant-tabs-nav-list::after]:bottom-0! [&_.ant-tabs-nav-list::after]:border-b! [&_.ant-tabs-nav-list::after]:border-(--light-gray-3)!'
          destroyOnHidden
        />
      </ConfigProvider>
    </div>
  )
}

export default React.memo<Props>(MainContent)
