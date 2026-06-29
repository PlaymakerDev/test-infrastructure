"use client"
import React, { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import dayjs from 'dayjs'
import { Pagination, Skeleton } from 'antd'
import { FormSearchEvent, TableEventData, EventGridView } from '../components'
import { periodToRange, type EventFilterValues } from './sections/event/FormSearchEvent'
import SearchBar, { type ViewMode } from '@/components/searchable/SearchBar'
import EventDetailModal from '@/features/admin/incident-detection/components/EventDetailModal'
import { EVENT_TYPES } from '@/features/admin/incident-detection/components/eventTypes'
import {
  useIncidentTransactions,
  useIncidentCentralList,
} from '@/hooks/queries/incident-detection'
import { useDeptId } from '@/hooks/useDeptId'
import type { IncidentTransactionItem } from '@/types/incident-detection/details-api'

interface Props {}

const DEFAULT_LIMIT = 10

// FE enum name (eventType) → backend analytic_type id. 'ALL' → undefined (no filter).
const typeNameToId = (name: string): number | undefined =>
  name === 'ALL' ? undefined : EVENT_TYPES.find((t) => t.name === name)?.id

/** Detail Tab 2 (รายงานเหตุการณ์). Same UI as before — now wired to the live
 *  paginated event feed (`/analytic/details/transactions`). A filter bar
 *  (date / period / type) + a table/grid toggle over the same query; clicking
 *  a snapshot opens the shared event-detail modal (same as Tab 1). */
const EventSection: React.FC<Props> = () => {
  const params = useParams()
  const solutionId = Array.isArray(params.id) ? params.id[0] : params.id
  const deptId = useDeptId()

  const [filters, setFilters] = useState<EventFilterValues>(() => ({
    date: periodToRange('TODAY'),
    period: 'TODAY',
    eventType: 'ALL',
  }))
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [selected, setSelected] = useState<IncidentTransactionItem | null>(null)

  // Changing any filter restarts pagination at page 1.
  const handleFilterChange = (next: EventFilterValues) => {
    setFilters(next)
    setPage(1)
  }

  const { data, isLoading, isFetching } = useIncidentTransactions({
    solution_id: solutionId,
    start_date: filters.date ? filters.date[0].format('YYYY-MM-DD') : undefined,
    end_date: filters.date ? filters.date[1].format('YYYY-MM-DD') : undefined,
    analytic_type_id: typeNameToId(filters.eventType),
    page,
    limit,
  })

  const events = data?.res_data ?? []
  const total = data?.meta_data?.count ?? 0

  // Road code for the EventDetailModal "จุดติดตั้ง" line — same source/cache as
  // Tab 1's event list (not carried on the event row itself).
  const { data: central } = useIncidentCentralList(deptId)
  const roadCode = useMemo(() => {
    if (!solutionId || !central) return undefined
    const target = String(solutionId)
    for (const bureau of central) {
      for (const sub of bureau.sub_department) {
        for (const sol of sub.solutions) {
          if (String(sol.solution.id) === target) return sol.road.code_name
        }
      }
    }
    return undefined
  }, [central, solutionId])

  const handlePageChange = (nextPage: number, nextSize: number) => {
    setPage(nextPage)
    setLimit(nextSize)
  }

  return (
    <div>
      <section>
        <FormSearchEvent value={filters} onChange={handleFilterChange} />
      </section>
      <section className='mt-5'>
        <SearchBar
          mode='title'
          title='ตารางแสดงเหตุการณ์'
          defaultViewMode={displayType}
          onViewModeChange={setDisplayType}
          onExport={() => alert('TODO: นำออกเอกสาร')}
        />
      </section>
      <section className='mt-5'>
        {displayType === 'TABLE' ? (
          <TableEventData
            events={events}
            loading={isFetching}
            onSelect={setSelected}
            page={page}
            pageSize={limit}
            total={total}
            onPageChange={handlePageChange}
          />
        ) : (
          <div className='flex flex-col gap-5'>
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <div className={`transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
                <EventGridView events={events} onSelect={setSelected} />
              </div>
            )}
            {!isLoading && total > 0 && (
              <Pagination
                align='end'
                current={page}
                pageSize={limit}
                total={total}
                showSizeChanger
                pageSizeOptions={[10, 20, 50, 100]}
                showTotal={(t, range) => `${range[1] - range[0] + 1} จาก ${t}`}
                onChange={handlePageChange}
              />
            )}
          </div>
        )}
      </section>

      <EventDetailModal
        open={!!selected}
        event={selected}
        roadCode={roadCode}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

export default React.memo<Props>(EventSection)
