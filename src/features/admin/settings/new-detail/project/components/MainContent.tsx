import { Card, ConfigProvider, TabsProps } from 'antd'
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons'
import React, { useCallback, useMemo } from 'react'
import { Tabs } from 'antd'
import { CctvEquipmentSection, EmptyRoadSolution, SolutionContent } from '../components'
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

  // The tab to show: the context's `activeLocationId` while it still names a
  // point of the current road, else the road's first point. Derived on
  // render rather than synced into the context — `setActiveLocationId`
  // belongs to ProjectProvider, and calling it while MainContent renders
  // is React's "cannot update a component while rendering a different
  // component" error (only a component's OWN state may be set mid-render).
  // This also covers switching roads via TitleSection's SwapButton: the
  // previous road's id is no longer in `items`, so it falls back to the new
  // road's first point. `onCreate`/`onDelete` still set the context id
  // explicitly once their mutation lands.
  const firstPointKey = items.find((item) => item.key !== ADD_POINT_KEY)?.key
  const activeKey = items.some((item) => item.key === activeLocationId)
    ? activeLocationId
    : firstPointKey

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
    <>
      {/* CCTV is scoped to the whole สายทาง, not to one จุดติดตั้ง, so it sits
          above the tabs rather than inside one of them. */}
      <CctvEquipmentSection />
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
            activeKey={activeKey}
            items={items}
            onChange={handleChange}
            indicator={{ align: 'center' }}
            className='[&_.ant-tabs-nav::before]:hidden! [&_.ant-tabs-nav-list]:relative! [&_.ant-tabs-nav-list::after]:content-[""]! [&_.ant-tabs-nav-list::after]:absolute! [&_.ant-tabs-nav-list::after]:inset-x-0! [&_.ant-tabs-nav-list::after]:bottom-0! [&_.ant-tabs-nav-list::after]:border-b! [&_.ant-tabs-nav-list::after]:border-(--light-gray-3)!'
            destroyOnHidden
          />
        </ConfigProvider>
      </div>
    </>
  )
}

export default React.memo<Props>(MainContent)
