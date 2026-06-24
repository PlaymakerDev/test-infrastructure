import React, { useDeferredValue, useMemo, useState } from 'react'
import { FormSearchSection } from '@/features/admin/control-vms/overall/components'
import { useControlVMSContext } from '../../../context'
import { BureauList } from '@/components/list'
import { Empty, Skeleton } from 'antd'
import { useVMSDepartments } from '../../../hooks/useVMSDepartments'
import type { VMSDepartmentList, SubDepartment, Road } from '@/types/control-vms/vms-api'

function filterBureauData(data: VMSDepartmentList[], term: string): VMSDepartmentList[] {
  const t = term.toLowerCase()
  if (!t) return data

  return data.reduce<VMSDepartmentList[]>((acc, bureau) => {
    if (bureau.department_short_name.toLowerCase().includes(t)) {
      acc.push(bureau)
      return acc
    }

    const filteredStates = (bureau.sub_department ?? []).reduce<SubDepartment[]>((sacc, state) => {
      if (state.department_short_name.toLowerCase().includes(t)) {
        sacc.push(state)
        return sacc
      }

      const filteredRoads = (state.roads ?? []).reduce<Road[]>((racc, road) => {
        if (road.road_name.toLowerCase().includes(t) || road.road_code.toLowerCase().includes(t)) {
          racc.push(road)
          return racc
        }

        const filteredSigns = (road.solution ?? []).filter(sign =>
          sign.solution_name.toLowerCase().includes(t)
        )
        if (filteredSigns.length > 0) racc.push({ ...road, solution: filteredSigns })

        return racc
      }, [])

      if (filteredRoads.length > 0) sacc.push({ ...state, roads: filteredRoads })
      return sacc
    }, [])

    if (filteredStates.length > 0) acc.push({ ...bureau, sub_department: filteredStates })
    return acc
  }, [])
}

interface Props {
  openFromDrawer?: boolean
}

const SearchSection: React.FC<Props> = ({ openFromDrawer }) => {
  const { setBureau, setBureauState, setBureauRoute, setBureauSign, setVMSIdList } = useControlVMSContext()
  const [searchTerm, setSearchTerm] = useState('')
  const deferredTerm = useDeferredValue(searchTerm)

  const { data, isLoading, isError } = useVMSDepartments()

  const filteredData = useMemo(
    () => filterBureauData(data?.data ?? [], deferredTerm),
    [data, deferredTerm]
  )

  const renderBureauList = useMemo(() => {
    if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    if (deferredTerm && !filteredData.length) return <Empty description="ไม่พบผลการค้นหา" />
    return (
      <BureauList
        key={deferredTerm ? 'filtered' : 'full'}
        data={filteredData}
        defaultExpandAll={!!deferredTerm}
        onBureauClick={(item) => setBureau(item)}
        onStateClick={(item) => setBureauState(item)}
        onRouteClick={(item) => setBureauRoute(item)}
        onSignClick={(item) => setBureauSign(item)}
        onSelectionChange={(item) => {
          const ids = item.signs.map(s => s.vms_id).filter((id): id is number => id != null)
          setVMSIdList(ids)
        }}
      />
    )
  }, [isLoading, isError, filteredData, deferredTerm, setBureau, setBureauState, setBureauRoute, setBureauSign, setVMSIdList])

  return (
    <div className={`bg-(--dark-black) rounded-tr-lg ${openFromDrawer ? 'p-5' : 'py-10 px-12'} h-full`}>
      <section>
        <FormSearchSection onSearch={setSearchTerm} />
      </section>
      <section className='mt-5'>
        <h3 className='text-(--yellow)'>เลือกป้ายที่ต้องการควบคุมการแสดงผล</h3>
        <p className='fs-12 text-gray-400'>เลือกควบคุมป้ายแสดงผลได้ทั้งแบบรายป้ายหรือทั้งหมดตามต้องการ</p>
      </section>
      <section className='mt-5'>
        {renderBureauList}
      </section>
    </div>
  )
}

export default React.memo<Props>(SearchSection)
