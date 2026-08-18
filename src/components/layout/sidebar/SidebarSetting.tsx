import menu from '@/configs/menu'
import type { AdminMenuItem } from '@/configs/menu/admin'
import { useUserRole } from '@/hooks/useUserRole'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useCallback, useMemo } from 'react'
import { TbAdjustmentsHorizontal, TbChartColumn, TbShieldHalf, TbSettings } from 'react-icons/tb'

interface Props { }

const mappingTransaction = {
  TbAdjustmentsHorizontal,
  TbChartColumn,
  TbShieldHalf,
  TbSettings
}

const ALLOWED_KEYS: AdminMenuItem['label_key'][] = ['control_vms', 'statistic', 'maintenance', 'settings']

const SidebarSetting: React.FC<Props> = () => {
  const pathname = usePathname()
  // ระบบและการตั้งค่า is hidden from a general `user` — the page has no tab they
  // may open (see `features/admin/settings/overall/data/tabs.ts`), and the same
  // entry is dropped from the Navbar menus. `isUser` is only true once the role
  // has resolved, so an admin's entry never blinks out.
  const { isUser } = useUserRole()

  const Icon = useCallback((iconName: string, iconCls: string) => {
    if (!(iconName in mappingTransaction)) return null
    const IconResult = mappingTransaction[iconName as keyof typeof mappingTransaction]
    return <IconResult className={`fs-18 shrink-0 ${iconCls}`} />
  }, [])

  const renderMenuList = useMemo(() => {
    return menu['ADMIN']?.filter(item =>
      ALLOWED_KEYS.includes(item.label_key) && !(isUser && item.label_key === 'settings')
    ).map((item, index) => {
      const isActive = pathname === item.path || !!item.path_list?.includes(pathname)
      const containerCls = `p-3 mb-2 rounded-md flex items-center gap-2 transition-colors cursor-pointer ${isActive ? 'bg-(--yellow)' : 'bg-(--light-black) hover:bg-(--mid-gray)'}`
      const textCls = `fs-12 ${isActive ? 'text-black font-medium' : 'text-(--default-blue)'}`
      const iconCls = isActive ? 'text-black' : 'text-(--default-blue)'

      return (
        <Link href={item.path} key={index}>
          <li className={containerCls}>
            {Icon(item.icon, iconCls)}
            <span className={textCls}>{item.label}</span>
          </li>
        </Link>
      )
    })
  }, [Icon, pathname, isUser])

  return (
    <ul>
      {renderMenuList}
    </ul>
  )
}

export default React.memo<Props>(SidebarSetting)
