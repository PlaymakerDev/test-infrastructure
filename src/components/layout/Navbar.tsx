"use client"
import menu from "@/configs/menu"
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TbMenu2,
  TbZoomInArea,
  TbSearch,
  TbBellRinging2,
  TbGripHorizontal,
  TbDots,
  // ICON
  TbForms,
  TbBrandDatabricks
} from "react-icons/tb";
/* SEY DEFAULT YEAR FORMAT */
import dayjs from 'dayjs';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import th from 'dayjs/locale/th';
import { useAppDispatch } from "@/stores/hooks";
import { setDrawerOpen } from "@/stores/reducers/layout/layoutSlice";
import { Button, ConfigProvider, Dropdown, MenuProps } from "antd";

/* VARIABLE */
dayjs.extend(buddhistEra);
dayjs().format("BBBB BB");
dayjs.locale(th);

const ICON_LIST: Record<string, React.ComponentType> = {
  TbForms,
  TbBrandDatabricks
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const iconClassName = "fs-24 cursor-pointer"
  const dispatch = useAppDispatch()
  const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm:ss'))

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs().format('HH:mm:ss'))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: <TbZoomInArea className={iconClassName} />
    },
    {
      key: '2',
      label: <TbSearch className={iconClassName} />
    },
    {
      key: '3',
      label: <TbBellRinging2 className={iconClassName} />
    },
    {
      key: '4',
      label: <TbGripHorizontal className={iconClassName} />
    },
  ]

  const Icon = useCallback((iconName: string, { ...props }) => {
    const IconComponent = ICON_LIST[iconName]
    return IconComponent ? <IconComponent {...props} /> : null
  }, [])

  const renderMenuList = useMemo(() => {
    return menu['EXAMPLE'].map((item) => {
      return (
        <li
          key={item.key}
          onClick={() => router.push(item.path)}
          className={`cursor-pointer ${pathname === item.path_active ? 'font-bold text-(--yellow)' : ''}`}
        >
          {Icon(item.icon, { className: pathname === item.path_active ? "text-4xl text-(--yellow)" : "text-3xl" })}
          {pathname === item.path_active ? item.label : null}
        </li>
      )
    })
  }, [Icon, router, pathname])

  return (
    <nav className="navbar flex items-center justify-between p-5">
      <div className="nav-main-menu">
        <TbMenu2
          className={`${iconClassName} mobile-hamburger-icon`}
          onClick={() => dispatch(setDrawerOpen({ open: true }))}
        />
        <div>
          <p className="fs-12">{currentTime}</p>
          <p className="fs-12">{dayjs().format('DD MMMM BBBB')}</p>
        </div>
      </div>
      <ul className="nav-menu-list">
        {renderMenuList}
      </ul>
      <div className="nav-side-menu">
        <TbZoomInArea
          className={iconClassName}
        />
        <TbSearch
          className={iconClassName}
        />
        <TbBellRinging2
          className={iconClassName}
        />
        <TbGripHorizontal
          className={iconClassName}
        />
      </div>
      <div className="mobile-side-menu">
        <Dropdown
          menu={{ items }}
          trigger={["click"]}
        >
          <Button
            shape="circle"
            icon={<TbDots />}
          />
        </Dropdown>
      </div>
    </nav>
  )
}