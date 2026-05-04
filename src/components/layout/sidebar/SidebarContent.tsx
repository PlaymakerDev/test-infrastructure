"use client"
import React, { useCallback, useMemo } from 'react'
import Link from 'next/link';
import {
  TbForms,
  TbBrandDatabricks,
  TbLayoutDashboard,
  TbVideo,
  TbCar,
  TbTruckDelivery,
  TbTrafficLights,
  TbWalk,
  TbBolt,
  TbDeviceDesktop,
  TbBuildingBridge,
  TbBuildingBridge2,
  TbTopologyStar3,
  TbAdjustmentsHorizontal,
  TbBriefcase
} from "react-icons/tb";
import menu from '@/configs/menu';
import { usePathname } from 'next/navigation';

interface Props {

}

const ICON_LIST: Record<string, React.ComponentType> = {
  TbForms,
  TbBrandDatabricks,
  // ADMIN
  TbLayoutDashboard,
  TbVideo,
  TbCar,
  TbTruckDelivery,
  TbTrafficLights,
  TbWalk,
  TbBolt,
  TbDeviceDesktop,
  TbBuildingBridge,
  TbBuildingBridge2,
  TbTopologyStar3,
  TbAdjustmentsHorizontal,
  TbBriefcase
}
const Sidebar: React.FC<Props> = (props) => {
  const { } = props
  const pathname = usePathname()

  const Icon = useCallback((iconName: string, { ...props }) => {
    const IconComponent = ICON_LIST[iconName]
    return IconComponent ? <IconComponent {...props} /> : null
  }, [])

  const renderMenuList = useMemo(() => {
    const newList = menu["ADMIN"]?.map((item, index) => {
      if (pathname === item.path) {
        return (
          <li
            key={index}
            className={
              item.path_list?.some((item: string) => item === pathname) ? 'text-black bg-(--yellow) p-3 mb-2 rounded-md cursor-pointer' : pathname === item.path ?
                'text-black bg-(--yellow) p-3 mb-2 rounded-md cursor-pointer' :
                'transition duration-300 text-white p-3 mb-2 rounded-md hover:bg-gray-300 hover:text-black cursor-pointer'
            }
          >
            <div className='flex flex-wrap items-center gap-3'>
              {Icon(item.icon, {})}{item.label}
            </div>
          </li>
        )
      } else {
        return (
          <Link href={item.path} key={index}>
            <li key={index} className={
              item.path_list?.some((item: string) => item === pathname) ? 'text-black bg-(--yellow) p-3 mb-2 rounded-md' : pathname === item.path ?
                'text-black bg-(--yellow) p-3 mb-2 rounded-md' :
                'transition duration-300 text-white p-3 mb-2 rounded-md hover:bg-gray-300 hover:text-black'}>
              <div className='flex flex-wrap items-center gap-3'>
                {Icon(item.icon, {})}{item.label}
              </div>
            </li>
          </Link>
        )
      }
    })
    return newList
  }, [Icon, pathname])

  return (
    <ul>
      {renderMenuList || []}
    </ul>
  )
}

export default React.memo<Props>(Sidebar)
