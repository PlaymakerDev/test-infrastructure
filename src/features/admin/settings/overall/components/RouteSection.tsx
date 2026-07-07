"use client"
import { Button, Empty, Spin, message } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'
import { TbPlus } from 'react-icons/tb'
import {
  useCreateRoad,
  useDeleteRoad,
  useDepartments,
  useRoadsList,
  useUpdateRoad,
} from '@/hooks/queries/manage'
import { useContainerHeight } from '@/hooks/useContainerHeight'
import type { APIResponseDepartment } from '@/types/manage/department-api'
import type { APIResponseRoad } from '@/types/manage/road-api'
import type { APIRequestRoad } from '@/types/manage/road-api'
import { calcTableScrollY } from '../hooks/useTableScrollY'
import type { Route, RouteFilters, RouteFormValues } from '../types/route'
import { DEFAULT_PAGE_SIZE } from '../utils/paginationConfig'
import DeleteRouteModal from './route/DeleteRouteModal'
import FormSearchRoute from './route/FormSearchRoute'
import RouteModal from './route/RouteModal'
import TableRoute from './route/TableRoute'

const DEFAULT_FILTERS: RouteFilters = {
  province: null,
  departmentId: null,
  search: '',
}

/** Map an API road row into the UI Route shape, joining the department
 *  short-name label from a lookup Map built once per render. */
const toRoute = (
  row: APIResponseRoad,
  deptById: Map<number, APIResponseDepartment>,
): Route => {
  const dept = row.department_id != null ? deptById.get(row.department_id) : undefined
  return {
    id: row.id,
    code: row.road_code ?? '',
    name: row.road_name ?? '',
    province: row.province ?? '',
    district: row.district ?? '',
    subdistrict: row.subdistrict ?? '',
    startSta: row.start_sta ?? '',
    endSta: row.end_sta ?? '',
    lengthKm: typeof row.distance === 'number' ? row.distance : 0,
    departmentId: row.department_id ?? null,
    responsibleOffice: dept?.department_short_name ?? '',
    createdAt: row.created_at ?? '',
  }
}

const RouteSection: React.FC = () => {
  const [filters, setFiltersState] = useState<RouteFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)

  // Server-paginated + server-searched. The hook returns the raw envelope
  // `{ res_data, meta_data }` — rows come from `res_data`, total from
  // `meta_data.count`.
  const roadsQuery = useRoadsList({ page, limit: pageSize, search: filters.search })
  const departmentsQuery = useDepartments()
  const createRoad = useCreateRoad()
  const updateRoad = useUpdateRoad()
  const deleteRoad = useDeleteRoad()

  const [routeModal, setRouteModal] = useState<{ open: boolean; editing: Route | null }>({
    open: false,
    editing: null,
  })
  const [deleteTarget, setDeleteTarget] = useState<Route | null>(null)

  // Measure the card so the AntD Table body can scroll INSIDE the section
  // instead of pushing the page footer/pagination off-screen. Yields a
  // numeric `scroll.y` that fits the viewport at any breakpoint.
  const [attachContainer, containerH] = useContainerHeight<HTMLDivElement>()

  const departments = departmentsQuery.data ?? []

  // Lookup Map for O(1) department_id → department object joins.
  const deptById = useMemo(() => {
    const m = new Map<number, APIResponseDepartment>()
    departments.forEach((d) => m.set(d.id, d))
    return m
  }, [departments])

  const rows = roadsQuery.data?.res_data ?? []
  const total = roadsQuery.data?.meta_data?.count ?? 0

  const routes = useMemo<Route[]>(
    () => rows.map((r) => toRoute(r, deptById)),
    [rows, deptById],
  )

  // Province options are derived from the CURRENT page only — the server
  // doesn't expose a distinct-province endpoint, so the dropdown widens as
  // the user paginates. Acceptable trade-off given the 3k-row dataset.
  const provinceOptions = useMemo(() => {
    const set = new Set<string>()
    routes.forEach((r) => {
      if (r.province) set.add(r.province)
    })
    return Array.from(set).sort()
  }, [routes])

  const setFilters = useCallback((patch: Partial<RouteFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }))
    // Any filter change (search, province, or department) resets to page 1
    // so the user isn't stranded on a page that no longer exists after the
    // server refilters the dataset.
    setPage(1)
  }, [])

  // Search is handled server-side (verified for /manage/roads). Province +
  // departmentId are NOT supported by the API, so they filter client-side
  // over the current page only.
  const filtered = useMemo(() => {
    return routes.filter((r) => {
      if (filters.province && r.province !== filters.province) return false
      if (filters.departmentId != null && r.departmentId !== filters.departmentId) return false
      return true
    })
  }, [routes, filters.province, filters.departmentId])

  const openCreate = useCallback(() => setRouteModal({ open: true, editing: null }), [])
  const openEdit = useCallback((route: Route) => setRouteModal({ open: true, editing: route }), [])
  const closeRouteModal = useCallback(() => setRouteModal({ open: false, editing: null }), [])

  const handleSubmit = useCallback(
    async (values: RouteFormValues, editingId: number | null) => {
      const body: APIRequestRoad = {
        road_code: values.code,
        road_name: values.name,
        province: values.province,
        district: values.district,
        subdistrict: values.subdistrict,
        start_sta: values.startSta,
        end_sta: values.endSta,
        department_id: values.departmentId,
        ...(values.lengthKm != null ? { distance: values.lengthKm } : {}),
      }
      try {
        if (editingId != null) {
          await updateRoad.mutateAsync({ id: editingId, data: body })
          message.success('อัปเดตสายทางเรียบร้อย')
        } else {
          await createRoad.mutateAsync(body)
          message.success('เพิ่มสายทางเรียบร้อย')
        }
        closeRouteModal()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'บันทึกสายทางไม่สำเร็จ'
        message.error(msg)
      }
    },
    [createRoad, updateRoad, closeRouteModal],
  )

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteRoad.mutateAsync(id)
        message.success('ลบสายทางเรียบร้อย')
        setDeleteTarget(null)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'ลบสายทางไม่สำเร็จ'
        message.error(msg)
      }
    },
    [deleteRoad],
  )

  // AntD `Pagination.onChange` fires with (page, pageSize) whenever either
  // changes. We funnel through here so the query refetches with the right
  // slice — pageSize changes are also captured because AntD invokes onChange
  // right after onShowSizeChange.
  const handlePageChange = useCallback((nextPage: number, _nextPageSize: number) => {
    setPage(nextPage)
  }, [])

  // Reset to page 1 on page-size change so we don't land on a page that no
  // longer exists after the total-pages math shrinks.
  const handlePageSizeChange = useCallback((nextSize: number) => {
    setPageSize(nextSize)
    setPage(1)
  }, [])

  const isInitialLoading = roadsQuery.isLoading || departmentsQuery.isLoading
  const listError = roadsQuery.error ?? departmentsQuery.error
  const submitting = createRoad.isPending || updateRoad.isPending

  return (
    <div
      ref={attachContainer}
      className='rounded-2xl p-5 flex flex-col h-full'
      style={{ background: '#191919', border: '1px solid var(--light-gray-2)' }}
    >
      <div className='shrink-0 flex flex-col lg:flex-row lg:items-end gap-4'>
        <div className='flex-1 min-w-0'>
          <FormSearchRoute
            filters={filters}
            onChange={setFilters}
            provinceOptions={provinceOptions}
            departments={departments}
          />
        </div>
        <div className='flex items-center gap-2 flex-wrap'>
          <Button
            size='large'
            shape='round'
            icon={<TbPlus />}
            onClick={openCreate}
            style={{
              background: 'var(--yellow)',
              color: '#000',
              borderColor: 'var(--yellow)',
              fontWeight: 700,
            }}
          >
            เพิ่มสายทาง
          </Button>
        </div>
      </div>

      <div className='flex-1 min-h-0 mt-5'>
        {isInitialLoading ? (
          <div className='flex justify-center items-center py-16'>
            <Spin size='large' />
          </div>
        ) : listError ? (
          <div className='py-10'>
            <Empty
              description={
                <span className='text-white/70'>
                  โหลดข้อมูลสายทางไม่สำเร็จ
                  {listError instanceof Error ? ` (${listError.message})` : ''}
                </span>
              }
            />
          </div>
        ) : (
          <TableRoute
            data={filtered}
            page={page}
            pageSize={pageSize}
            total={total}
            loading={roadsQuery.isLoading || roadsQuery.isFetching}
            scrollY={calcTableScrollY(containerH)}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      <RouteModal
        open={routeModal.open}
        editing={routeModal.editing}
        departments={departments}
        submitting={submitting}
        onClose={closeRouteModal}
        onSubmit={handleSubmit}
      />
      <DeleteRouteModal
        open={!!deleteTarget}
        route={deleteTarget}
        deleting={deleteRoad.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default React.memo(RouteSection)
