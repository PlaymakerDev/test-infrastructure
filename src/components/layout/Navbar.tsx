"use client"
import menu from "@/configs/menu"
import dayjs from "dayjs"
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  TbMenu2,
  TbZoomInArea,
  TbSearch,
  TbBellRinging2,
  TbGripHorizontal,
  // ICON
  TbForms,
} from "react-icons/tb";

const ICON_LIST: Record<string, React.ComponentType> = {
  TbForms
}

export default function Navbar() {
  const router = useRouter()
  const Icon = useCallback((iconName: string, { ...props }) => {
    const IconComponent = ICON_LIST[iconName]
    return IconComponent ? <IconComponent {...props} /> : null
  }, [])

  const renderMenuList = useMemo(() => {
    return menu['EXAMPLE'].map((item) => {
      console.log(item.icon)
      return (
        <li
          key={item.key}
          onClick={() => router.push(item.path)}
        >
          {Icon(item.icon, { className: "text-3xl" })}
        </li>
      )
    })
  }, [Icon, router])

  return (
    <nav className="flex items-center justify-between">
      <div className="flex items-center gap-5">
        <TbMenu2
          className="text-3xl"
        />
        <div>
          <p>{dayjs().format('HH:mm:ss')}</p>
          <p>{dayjs().format('DD MMMM YYYY')}</p>
        </div>
      </div>
      <ul className="">
        {renderMenuList}
      </ul>
      <div className="flex items-center gap-5">
        <TbZoomInArea
          className="text-3xl"
        />
        <TbSearch
          className="text-3xl"
        />
        <TbBellRinging2
          className="text-3xl"
        />
        <TbGripHorizontal
          className="text-3xl"
        />

      </div>
    </nav>
  )
}