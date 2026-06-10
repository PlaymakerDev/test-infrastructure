import React, { useCallback, useMemo, useState } from 'react'
import { TableVMSData, VMSList } from '../../../components'
import SearchBar, { type FilterConfig, type FilterStats, type ViewMode } from '@/components/searchable/SearchBar'
import FormSearchVMS from './FormSearchVMS'
import { AxiosError } from 'axios'
import { message } from 'antd'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { getVMSOverviewListData, setSearchVMSList } from '@/stores/reducers/vms/vmsOverviewSlice'

interface Props { }

const VMS_FILTERS: FilterConfig[] = [
  {
    key: 'all',
    label: 'ทั้งหมด',
    colorPrimary: '#FCD116',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#8a7000] text-white',
    badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]',
  },
  {
    key: 'online',
    label: 'ออนไลน์',
    colorPrimary: '#66AEFF',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#1B3F8B] text-white',
    badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]',
  },
  {
    key: 'offline',
    label: 'ออฟไลน์',
    colorPrimary: '#E94C4C',
    colorTextLightSolid: '#ffffff',
    badgeActiveClass: 'bg-red-800 text-white',
    badgeIdleClass: 'bg-red-500/20 text-red-400',
  },
  {
    key: 'in-warranty',
    label: 'ในค้ำ',
    statKey: 'inWarranty',
    colorPrimary: '#05F2DB',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#016f64] text-white',
    badgeIdleClass: 'bg-[#05F2DB]/20 text-[#05F2DB]',
  },
  {
    key: 'expired',
    label: 'หมดค้ำ',
    colorPrimary: '#979797',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#4a4a4a] text-white',
    badgeIdleClass: 'bg-[#979797]/20 text-[#979797]',
  },
]

const VMS_STATS: FilterStats = {
  all: 207,
  online: 55,
  offline: 152,
  inWarranty: 115,
  expired: 92,
}

const DataDisplaySection: React.FC<Props> = () => {
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const dispatch = useAppDispatch()
  const { vms_list } = useAppSelector(state => state.vms_overview)

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableVMSData />
      case 'GRID':
        return <VMSList />
      default:
        return null
    }
  }, [displayType])

  const onSearch = useCallback(async (data: string) => {
    try {

    } catch (error) {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการค้นหา')
      } else {
        console.error(error)
      }
    }
  }, [])

  return (
    <div>
      <section>
        <SearchBar
          filters={VMS_FILTERS}
          stats={VMS_STATS}
          activeFilter={activeFilter}
          onFilterChange={(filter) => {
            setActiveFilter(filter)
            onSearch(filter)
          }}
          defaultViewMode={displayType}
          onViewModeChange={setDisplayType}
          formSearch={<FormSearchVMS />}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
