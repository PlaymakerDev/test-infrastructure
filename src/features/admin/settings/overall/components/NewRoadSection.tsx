import React, { useCallback, useMemo, useState } from 'react'
import { FormSearchRoad, ModalCreateRoad, ModalConfirmDeleteRoad, TableRoadData } from '../components'
import { RoadSearchFormValues } from './new-road/FormSearchRoad'
import { message } from 'antd'
import { usePaginateRoadList, useDeleteRoad, useRegions } from '@/hooks/queries/manage'
import { useAppDispatch } from '@/stores/hooks'
import { resetRoadModalData } from '@/stores/reducers/modal/customModalSlice'
import { getPaginateRoadListAPI } from '@/services/routes/ManageService'
import { fetchAllPages } from '../utils/fetchAllPages'
import { ROAD_EXPORT_COLUMNS, toRoadExportRow } from '../data/roadExportColumns'
import ExportFileModal from '@/components/export/ExportFileModal'

interface Props {

}

/** Best-effort extractor for the backend's Thai error message — mirrors
 *  FormCreateRoad's own helper. */
const readErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const withResponse = error as {
      response?: { data?: { message?: string } }
      message?: string
    }
    return withResponse.response?.data?.message ?? withResponse.message ?? fallback
  }
  return fallback
}

const NewRoadSection: React.FC<Props> = (props) => {
  const { } = props

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [regionId, setRegionId] = useState<number | undefined>(undefined)
  const [exportOpen, setExportOpen] = useState(false)

  const dispatch = useAppDispatch()

  // POST/PUT/DELETE all invalidate `manageKeys.roads.all` (see useCreateRoad/
  // useUpdateRoad/useDeleteRoad) — `listFiltered` is nested under that same
  // prefix, so any create/update/delete here automatically refetches this
  // list. No manual refetch() needed.
  const { data, isLoading, isError } = usePaginateRoadList({
    page,
    limit,
    search: search || undefined,
    region_id: regionId,
  })

  const { mutate: deleteRoad, isPending: isDeletePending } = useDeleteRoad()

  // Needed only to resolve the selected region_id to a human-readable label
  // for the export filterNote — the form submits region_id, not a name.
  const { data: regions } = useRegions()

  // A new search submission starts over at page 1 — otherwise the user
  // could land on a page past the new, narrower result set.
  const onSearch = useCallback((values: RoadSearchFormValues) => {
    setSearch(values.search?.trim() ?? '')
    setRegionId(values.region_id != null ? Number(values.region_id) : undefined)
    setPage(1)
  }, [])

  const onTableChange = useCallback((newPage: number, newLimit: number) => {
    setPage(newPage)
    setLimit(newLimit)
  }, [])

  const onDeleteRoadData = useCallback((id: number) => {
    deleteRoad(id, {
      onSuccess: () => {
        message.success('ลบข้อมูลสายทางสำเร็จ')
        dispatch(resetRoadModalData())
      },
      onError: (error) => {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการลบข้อมูลสายทาง'))
      },
    })
  }, [deleteRoad, dispatch])

  // ── Export ──────────────────────────────────────────────────────────────
  // Current-page rows mapped to the shared export shape — feeds the 'page'
  // export scope and the ExportFileModal's pageCount.
  const roadExportRows = useMemo(
    () => (data?.res_data ?? []).map(toRoadExportRow),
    [data],
  )
  const total = data?.meta_data.count ?? 0

  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    if (regionId != null) {
      const region = regions?.find((r) => r.id === regionId)
      parts.push(`ภูมิภาค ${region?.name_th ?? `#${regionId}`}`)
    }
    if (search.trim()) parts.push(`ค้นหา "${search.trim()}"`)
    return parts.length ? parts.join(' · ') : undefined
  }, [regionId, regions, search])

  // Export scope 'ทั้งหมด' — walk EVERY page of the current server-side
  // filters at export time (the backend caps `?limit=` at 100 — see
  // fetchAllPages), then map to the shared export shape.
  const fetchAllRoads = useCallback(async () => {
    const rows = await fetchAllPages((p, pageLimit) =>
      getPaginateRoadListAPI({
        page: p,
        limit: pageLimit,
        search: search || undefined,
        region_id: regionId,
      }).then((r) => r.data),
    )
    return rows.map(toRoadExportRow)
  }, [search, regionId])

  return (
    <div>
      <section>
        <FormSearchRoad onSearch={onSearch} onExport={() => setExportOpen(true)} />
      </section>
      <section className='mt-5'>
        <TableRoadData
          data={data}
          isLoading={isLoading}
          isError={isError}
          onPageChange={onTableChange}
        />
      </section>

      <ModalCreateRoad />
      <ModalConfirmDeleteRoad onDelete={onDeleteRoadData} isPending={isDeletePending} />

      {/* นำออกเอกสาร — ทั้งหมด = every road matching the current search/
          filters (fetched in full at export time), หน้าปัจจุบัน = the page
          the table shows. Same shared kit + scope toggle as NewUserSection/
          NewProjectSection. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        scope={{ totalCount: total, pageCount: roadExportRows.length }}
        onExportPdf={async (scope) => {
          const rows = scope === 'page' ? roadExportRows : await fetchAllRoads()
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Settings_Roads_Report',
            title: 'รายงานรายชื่อสายทาง (Route Management)',
            filterNote: exportFilterNote,
            columns: ROAD_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows,
          })
        }}
        onExportExcel={async (scope) => {
          const rows = scope === 'page' ? roadExportRows : await fetchAllRoads()
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Settings_Roads_Report',
            sheetName: 'Roads',
            title: 'รายงานรายชื่อสายทาง (Route Management)',
            filterNote: exportFilterNote,
            columns: ROAD_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows,
          })
        }}
      />
    </div>
  )
}

export default React.memo<Props>(NewRoadSection)
