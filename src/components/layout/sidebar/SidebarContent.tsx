"use client"
import React, { useCallback, useMemo, useState } from 'react'
import {
  TbLayoutDashboard,
  TbVideo,
  TbTruckDelivery,
  TbTrafficLights,
  TbWalk,
  TbBolt,
  TbDeviceDesktop,
  TbBuildingBridge,
  TbBuildingBridge2,
  TbTopologyStar3,
  TbAdjustmentsHorizontal,
  TbBriefcase,
  // TbChartBar,
  // TbTool,
  TbShieldHalf,
  TbCarCrash,
  TbChevronRight,
  TbBrandGithubCopilot,
} from "react-icons/tb";
import { motion, AnimatePresence } from 'motion/react'
// import mockData from '@/mock/test.json'
import menu from '@/configs/menu'
import { useRouter, usePathname } from 'next/navigation'
// import { useAppSelector } from '@/stores/hooks';
import { APIResponseSidebar } from '@/types/layout/api';

const SOLUTION_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "Dashboard": TbLayoutDashboard,
  "CCTV": TbVideo,
  "Traffic Volume": TbTruckDelivery,
  "Incident Detection": TbCarCrash,
  "Traffic Signal": TbTrafficLights,
  "Crosswalk": TbWalk,
  "Traffic Lighting": TbBolt,
  "VMS": TbDeviceDesktop,
  "Bridge Lighting": TbBuildingBridge,
  "Tunnel": TbBuildingBridge2,
  "Tracking": TbTopologyStar3,
  "Control VMS": TbAdjustmentsHorizontal,
  "Statistic": TbBriefcase,
  "Maintenance": TbShieldHalf,
  "Smart Search": TbBrandGithubCopilot,
}

const collapseVariants = {
  open: { height: "auto", opacity: 1, transition: { duration: 0.28, ease: "easeInOut" as const } },
  closed: { height: 0, opacity: 0, transition: { duration: 0.22, ease: "easeInOut" as const } },
}

const solutionContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
}

const solutionItemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
}

type RouteEntry = { path: string; path_active: string; path_list: string[] }

interface Props {
  data?: APIResponseSidebar
}

const SidebarContent: React.FC<Props> = (props) => {
  const { data } = props
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set())
  const [openDepts, setOpenDepts] = useState<Set<string>>(new Set())
  const router = useRouter()
  const pathname = usePathname()
  // const { sidebar } = useAppSelector(state => state.layout)

  const pathMap = useMemo<Record<string, RouteEntry>>(() => {
    const map: Record<string, RouteEntry> = {}
    for (const item of menu["ADMIN"]) {
      map[item.label] = { path: item.path, path_active: item.path_active, path_list: item.path_list ?? [] }
    }
    return map
  }, [])

  const toggleGroup = useCallback((index: number) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(index)) { next.delete(index) } else { next.add(index) }
      return next
    })
  }, [])

  const toggleDept = useCallback((key: string) => {
    setOpenDepts(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }, [])

  return (
    <div>
      {data?.map((group, groupIndex) => {
        const isGroupOpen = openGroups.has(groupIndex)
        return (
          <React.Fragment key={groupIndex}>
            <div
              onClick={() => toggleGroup(groupIndex)}
              className={`p-3 bg-(--light-gray) rounded-md mb-3 cursor-pointer hover:bg-(--light-gray)/80 transition-colors border ${isGroupOpen ? 'border-(--yellow)' : 'border-transparent'}`}
            >
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: isGroupOpen ? 90 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="flex shrink-0"
                >
                  <TbChevronRight className="text-(--yellow) fs-18" />
                </motion.span>
                <h5 className="font-normal! text-(--yellow)">{group.department_short_name}</h5>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {isGroupOpen && (
                <motion.div
                  key={`group-${groupIndex}`}
                  variants={collapseVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  style={{ overflow: "hidden" }}
                >
                  {group.sub_department.map((dept) => {
                    const deptKey = `${groupIndex}-${dept.department_id}`
                    const isDeptOpen = openDepts.has(deptKey)
                    return (
                      <React.Fragment key={deptKey}>
                        <div
                          onClick={() => toggleDept(deptKey)}
                          className={`pl-6 pr-3 py-3 bg-(--gray) rounded-md mb-3 cursor-pointer hover:bg-(--gray)/80 transition-colors border ${isDeptOpen ? 'border-(--yellow)' : 'border-transparent'}`}
                        >
                          <div className="flex items-center gap-2">
                            <motion.span
                              animate={{ rotate: isDeptOpen ? 90 : 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              className="flex shrink-0"
                            >
                              <TbChevronRight className="text-(--yellow) fs-18" />
                            </motion.span>
                            <h5 className="font-normal! text-(--yellow)">{dept.department_short_name}</h5>
                          </div>
                        </div>

                        <AnimatePresence initial={false}>
                          {isDeptOpen && (
                            <motion.div
                              key={`dept-${deptKey}`}
                              variants={collapseVariants}
                              initial="closed"
                              animate="open"
                              exit="closed"
                              style={{ overflow: "hidden" }}
                            >
                              <motion.div
                                className="mb-3"
                                variants={solutionContainerVariants}
                                initial="hidden"
                                animate="show"
                              >
                                {dept.solutions.map((solution) => {
                                  const IconComp = SOLUTION_ICON_MAP[solution.solution_type_name]
                                  const route = pathMap[solution.solution_type_name]
                                  const isActive = route
                                    ? pathname === route.path || pathname === route.path_active || route.path_list.includes(pathname)
                                    : false
                                  return (
                                    <motion.div
                                      key={solution.solution_type_id}
                                      variants={solutionItemVariants}
                                      onClick={() => route && router.push(`${route.path}?dept_id=${dept.department_id}`)}
                                      className={`pl-10 py-3 pr-3 flex items-center justify-between mb-2 rounded-md transition-colors ${route ? 'cursor-pointer' : 'cursor-default opacity-50'} ${isActive ? 'bg-(--yellow)' : 'bg-(--light-black) hover:bg-(--mid-gray)'}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {IconComp && (
                                          <IconComp className={`fs-18 shrink-0 ${isActive ? 'text-black' : 'text-(--default-blue)'}`} />
                                        )}
                                        <span className={`fs-12 ${isActive ? 'text-black font-medium' : 'text-(--default-blue)'}`}>
                                          {solution.solution_type_name}
                                        </span>
                                      </div>
                                      <span className={`fs-11 py-0.5 px-2 border rounded-3xl whitespace-nowrap ${isActive ? 'border-(--light-black) bg-(--light-black) text-white/50' : 'border-(--default-blue) text-(--default-blue)'}`}>
                                        {solution.roads_count} สายทาง
                                      </span>
                                    </motion.div>
                                  )
                                })}
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default React.memo(SidebarContent)
