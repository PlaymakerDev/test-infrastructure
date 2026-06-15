import React, { useCallback, useMemo, useState } from 'react'
import { TableVMSData, VMSList } from '../../../components'
import SearchBar, { type FilterConfig, type FilterStats, type ViewMode } from '@/components/searchable/SearchBar'
import FormSearchVMS, { FormValues } from './FormSearchVMS'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { setSearchVMSList } from '@/stores/reducers/vms/vmsOverviewSlice'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getVMSOverviewListAPI } from '@/services/routes/VMSService'


interface Props {
  deptId?: string | string[] | number
}

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

const DataDisplaySection: React.FC<Props> = (props) => {
  const { deptId } = props
  const dispatch = useAppDispatch()
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const { vms_list } = useAppSelector(state => state.vms_overview)

  const { data, isLoading } = useQuery({
    queryKey: ['vms_list', vms_list.search],
    queryFn: () => getVMSOverviewListAPI(Number(deptId)!, vms_list.search),
    enabled: !!deptId,
    placeholderData: keepPreviousData
  })

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableVMSData data={data?.data} loading={isLoading} />
      case 'GRID':
        return <VMSList data={data?.data} loading={isLoading} />
      default:
        return null
    }
  }, [displayType, data, isLoading])

  const onSearch = useCallback((formData: FormValues) => {
    if (activeFilter === 'in-warranty' || activeFilter === 'expired') {
      dispatch(setSearchVMSList({
        ...vms_list.search,
        ...formData,
        status_name: undefined,
        warranty_name: activeFilter === 'in-warranty' ? 'อยู่ในค้ำ' : 'หมดค้ำ',
        page: 1,
      }))
    } else {
      dispatch(setSearchVMSList({
        ...vms_list.search,
        ...formData,
        status_name: activeFilter === 'all' ? undefined : activeFilter,
        warranty_name: undefined,
        page: 1,
      }))
    }
  }, [dispatch, vms_list.search, activeFilter])

  return (
    <div>
      <section>
        <SearchBar
          filters={VMS_FILTERS}
          stats={VMS_STATS}
          activeFilter={activeFilter}
          onFilterChange={(filter) => {
            setActiveFilter(filter)
            if (filter === 'in-warranty' || filter === 'expired') {
              dispatch(setSearchVMSList({
                ...vms_list.search,
                status_name: undefined,
                warranty_name: filter === 'in-warranty' ? 'อยู่ในค้ำ' : 'หมดค้ำ',
                page: 1,
              }))
            } else {
              dispatch(setSearchVMSList({
                ...vms_list.search,
                status_name: filter === 'all' ? undefined : filter,
                warranty_name: undefined,
                page: 1,
              }))
            }
          }}
          defaultViewMode={displayType}
          onViewModeChange={setDisplayType}
          formSearch={<FormSearchVMS onSearch={onSearch} />}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
