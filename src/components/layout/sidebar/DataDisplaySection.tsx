"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { Empty } from 'antd'
import { motion, AnimatePresence } from 'motion/react'
import { TbChevronRight } from 'react-icons/tb'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useSideMenuRoad } from '@/hooks/queries/shared/useSideMenuRoad'
import {
  SOLUTION_ICON_MAP,
  SOLUTION_DISPLAY_LABEL,
  buildPathMap,
  collapseVariants,
  solutionContainerVariants,
  solutionItemVariants,
} from './solutionMenu'

interface Props {
  /** The road picked from FormSearchRoute's autocomplete (SidebarRoute owns
   *  the selection state and passes it down). Null before anything is picked. */
  road?: { id: number; code: string; departmentId: number } | null
}

/** สายทาง tab's per-road solution list — the road-scoped counterpart of
 *  SidebarContent's per-department collapse. Selecting a road in
 *  FormSearchRoute calls getSideMenuRoadAPI({road_id}) and renders a single,
 *  default-open collapse (road code as header) listing each solution type
 *  with its icon + count ("N จุดติดตั้ง" — installation points on THIS road,
 *  vs. SidebarContent's "N สายทาง" which counts roads under a department).
 *  Counting/active-highlight/redirect mirror SidebarContent exactly — the
 *  redirect attaches `?dept_id=` (the road's own department_id), not
 *  `?road_id=`, so it lands on the same scoped view SidebarContent itself
 *  would navigate to. */
const DataDisplaySection: React.FC<Props> = (props) => {
  const { road } = props
  const [isOpen, setIsOpen] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // The dept_id currently in the URL — scopes the active highlight to the
  // solution actually clicked from THIS road (mirrors SidebarContent's
  // activeDeptId check).
  const activeDeptId = searchParams.get('dept_id')

  const pathMap = useMemo(() => buildPathMap(), [])
  const { data: solutions, isLoading, refetch } = useSideMenuRoad(road?.id)

  // Force a fresh network call on every selection — even re-picking a road
  // whose result is still cached — rather than trusting cache staleness alone.
  useEffect(() => {
    if (road?.id) refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [road?.id])

  if (!road) return <Empty description="กรุณากรอกสายที่ต้องการค้นหา" />

  return (
    <div>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`p-3 bg-(--light-gray) rounded-md mb-3 cursor-pointer hover:bg-(--light-gray)/80 transition-colors border ${isOpen ? 'border-(--yellow)' : 'border-transparent'}`}
      >
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex shrink-0"
          >
            <TbChevronRight className="text-(--yellow) fs-18" />
          </motion.span>
          <h5 className="font-normal! text-(--yellow)">{road.code}</h5>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={`road-${road.id}`}
            variants={collapseVariants}
            initial="closed"
            animate="open"
            exit="closed"
            style={{ overflow: "hidden" }}
          >
            {isLoading ? (
              <div className="p-3 text-center text-white/50 fs-12">กำลังโหลด...</div>
            ) : !solutions || solutions.length === 0 ? (
              <Empty description="ไม่พบข้อมูล" />
            ) : (
              <motion.div
                className="mb-3"
                variants={solutionContainerVariants}
                initial="hidden"
                animate="show"
              >
                {solutions.map((solution) => {
                  const IconComp = SOLUTION_ICON_MAP[solution.solution_type_name]
                  const route = pathMap[solution.solution_type_name]
                  const pathActive = route
                    ? pathname === route.path || pathname === route.path_active || route.path_list.includes(pathname)
                    : false
                  const isActive = pathActive && activeDeptId === String(road.departmentId)
                  return (
                    <motion.div
                      key={solution.solution_type_id ?? solution.solution_type_name}
                      variants={solutionItemVariants}
                      onClick={() => route && router.push(`${route.path}?dept_id=${road.departmentId}`)}
                      className={`pl-10 py-3 pr-3 flex items-center justify-between mb-2 rounded-md transition-colors ${route ? 'cursor-pointer' : 'cursor-default opacity-50'} ${isActive ? 'bg-(--yellow)' : 'bg-(--light-black) hover:bg-(--mid-gray)'}`}
                    >
                      <div className="flex items-center gap-2">
                        {IconComp && (
                          <IconComp className={`fs-18 shrink-0 ${isActive ? 'text-black' : 'text-(--default-blue)'}`} />
                        )}
                        <span className={`fs-12 ${isActive ? 'text-black font-medium' : 'text-(--default-blue)'}`}>
                          {SOLUTION_DISPLAY_LABEL[solution.solution_type_name] ?? solution.solution_type_name}
                        </span>
                      </div>
                      {!!solution.roads_count && (
                        <span className={`fs-12 py-0.5 px-2 border rounded-3xl whitespace-nowrap ${isActive ? 'border-(--light-black) bg-(--light-black) text-white/50' : 'border-(--default-blue) text-(--default-blue)'}`}>
                          {solution.roads_count} จุดติดตั้ง
                        </span>
                      )}
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
