"use client"
import React, { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import { Pagination, Skeleton } from 'antd'
import { FormSearchEvent, TableEventData, EventGridView } from '../components'
import { periodToRange, type EventFilterValues } from './sections/event/FormSearchEvent'
import { fmtThaiDate, fmtTime } from './sections/event/EventGridView'
import SearchBar, { type ViewMode } from '@/components/searchable/SearchBar'
import ExportFileModal from '@/components/export/ExportFileModal'
import EventDetailModal from '@/features/admin/incident-detection/components/EventDetailModal'
import { EVENT_TYPES, getEventTypeLabel } from '@/features/admin/incident-detection/components/eventTypes'
import {
  useIncidentTransactions,
  useIncidentCentralList,
  useIncidentDaily,
} from '@/hooks/queries/incident-detection'
import { useDeptId } from '@/hooks/useDeptId'
import type { IncidentTransactionItem } from '@/types/incident-detection/details-api'

// `BBBB` (Buddhist-Era year) in the export date column / filter note.
dayjs.extend(buddhistEra)

interface Props {}

const DEFAULT_LIMIT = 10

// Excel export columns — SAME columns, SAME order as the on-screen
// TableEventData; the snapshot column exports its image URL (Excel can't
// embed images). `width` = Excel chars. The PDF export is card-based
// (`entries` block), not a table, so no widthPct here.
const EVENT_EXPORT_COLUMNS: {
  header: string
  width: number
  value: (row: IncidentTransactionItem, index: number) => string | number
}[] = [
  {
    header: 'วันที่และเวลา',
    width: 18,
    value: (r) => {
      const d = dayjs(r.date_time)
      return d.isValid() ? d.format('DD/MM/BBBB HH:mm') : r.date_time
    },
  },
  {
    header: 'ประเภทเหตุการณ์',
    width: 20,
    value: (r) => getEventTypeLabel(r.analytic_type_info.id, r.analytic_type_info.analytic_type_name_th),
  },
  { header: 'ชื่อกล้อง', width: 42, value: (r) => r.camera.camera_name || '-' },
  { header: 'IP Address', width: 16, value: (r) => r.camera.ip_address || '-' },
  { header: 'ภาพขณะเกิดเหตุ', width: 50, value: (r) => r.image_path || '-' },
]

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
  const [exportOpen, setExportOpen] = useState(false)

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

  // First calendar day that actually has events — used to fill the picker's
  // start when ช่วงเวลา = ทั้งหมด (display only; the ALL query stays unfiltered).
  // Query the daily breakdown over a wide window and take the earliest bucket
  // that has any event. Gated to ALL: passing an undefined solution_id disables
  // the hook (its `enabled` is `!!solution_id`), so it doesn't fetch otherwise.
  const { data: dailyAll } = useIncidentDaily({
    solution_id: filters.period === 'ALL' ? solutionId : undefined,
    start_date: '2020-01-01',
    end_date: dayjs().format('YYYY-MM-DD'),
  })
  const allStartDate = useMemo(() => {
    const firstWithData = (dailyAll ?? [])
      .filter((b) => (b.data ?? []).some((d) => d.count > 0))
      .map((b) => b.date)
      .sort()[0]
    return firstWithData ? dayjs(firstWithData) : null
  }, [dailyAll])

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

  // Human-readable note of the active filters — printed in the export header
  // so a reader knows the date window / event type of this page of events.
  const exportNote = useMemo(() => {
    const parts: string[] = [
      filters.date
        ? `ช่วงวันที่ ${filters.date[0].format('DD/MM/BBBB')} - ${filters.date[1].format('DD/MM/BBBB')}`
        : 'ช่วงเวลา ทั้งหมด',
    ]
    if (filters.eventType !== 'ALL') {
      const typeLabel = EVENT_TYPES.find((t) => t.name === filters.eventType)?.displayName
      if (typeLabel) parts.push(`ประเภท ${typeLabel}`)
    }
    return parts.join(' · ')
  }, [filters])

  // Export scope = EVERY event matching the current filters (date window +
  // type), not just the visible page — the on-screen pagination is only a
  // viewport (user request 2026-07-21: picking a wide date range must not cap
  // the report at the 10-row page). Same two-step full-fetch pattern as the
  // tracking weight-log exports: page 1 @100, then refetch at the reported
  // total when it exceeds the first batch.
  const fetchAllEvents = async (): Promise<IncidentTransactionItem[]> => {
    const { getIncidentTransactionsAPI } = await import('@/services/routes/AnalyticService')
    const baseParams = {
      // useParams can be undefined pre-hydration, but the export button only
      // exists once the page (and its solution-scoped query) has rendered.
      solution_id: solutionId ?? '',
      start_date: filters.date ? filters.date[0].format('YYYY-MM-DD') : undefined,
      end_date: filters.date ? filters.date[1].format('YYYY-MM-DD') : undefined,
      analytic_type_id: typeNameToId(filters.eventType),
    }
    const first = await getIncidentTransactionsAPI({ ...baseParams, page: 1, limit: 100 })
    const count = first.data?.meta_data?.count ?? 0
    if (count <= 100) return first.data?.res_data ?? []
    const full = await getIncidentTransactionsAPI({ ...baseParams, page: 1, limit: count })
    return full.data?.res_data ?? []
  }

  // PDF = photo cards mirroring the on-screen event cards (snapshot + ประเภท
  // + วันเวลา + camera fields). Snapshots are pre-fetched and re-encoded
  // (utils/export/image.ts); any image that fails just renders its card
  // photo-less. `scope` comes from the modal's ทั้งหมด/หน้าปัจจุบัน toggle.
  const handleExportPdf = async (scope?: 'all' | 'page') => {
    const [{ exportReportPdf }, { fetchImageAsDataUrl }] = await Promise.all([
      import('@/utils/export/pdf'),
      import('@/utils/export/image'),
    ])
    const rows = scope === 'page' ? events : await fetchAllEvents()
    const images = await Promise.all(rows.map((ev) => fetchImageAsDataUrl(ev.image_path)))
    await exportReportPdf({
      filenameBase: 'Incident_Detection_Events_Report',
      title: 'รายงานเหตุการณ์ที่ตรวจจับได้ (Incident Detection Events)',
      subtitleNote: exportNote,
      blocks: [
        {
          type: 'entries',
          title: 'ตารางแสดงเหตุการณ์',
          items: rows.map((ev, i) => ({
            image: images[i],
            heading: getEventTypeLabel(ev.analytic_type_info.id, ev.analytic_type_info.analytic_type_name_th),
            subheading: `${fmtThaiDate(ev.date_time)} ${fmtTime(ev.date_time)}`,
            fields: [
              { label: 'ชื่อกล้อง', value: ev.camera.camera_name || '-' },
              { label: 'IP Address', value: ev.camera.ip_address || '-' },
            ],
          })),
        },
      ],
    })
  }

  return (
    <div>
      <section>
        <FormSearchEvent value={filters} onChange={handleFilterChange} allStartDate={allStartDate} />
      </section>
      <section className='mt-5'>
        <SearchBar
          mode='title'
          title='ตารางแสดงเหตุการณ์'
          defaultViewMode={displayType}
          onViewModeChange={setDisplayType}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* นำออกเอกสาร — PDF = photo cards (snapshot ต่อเหตุการณ์), Excel = flat
          table with the same columns as TableEventData. The modal's scope
          toggle picks between ทั้งหมด (every event matching the filters —
          fetched in full at export time) and หน้าปัจจุบัน (the visible page). */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        scope={{ totalCount: total, pageCount: events.length }}
        onExportPdf={handleExportPdf}
        onExportExcel={async (scope) => {
          const { exportExcel } = await import('@/utils/export/excel')
          const rows = scope === 'page' ? events : await fetchAllEvents()
          exportExcel({
            filenameBase: 'Incident_Detection_Events_Report',
            sheetName: 'Incident Events',
            title: 'รายงานเหตุการณ์ที่ตรวจจับได้ (Incident Detection Events)',
            filterNote: exportNote,
            columns: EVENT_EXPORT_COLUMNS,
            rows,
          })
        }}
      />
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
