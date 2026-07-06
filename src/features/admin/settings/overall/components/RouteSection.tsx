"use client"
import { Button } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'
import { TbPlus } from 'react-icons/tb'
import { MOCK_ROUTES } from '../data/mockRoutes'
import type { Route, RouteFilters, RouteFormValues } from '../types/route'
import DeleteRouteModal from './route/DeleteRouteModal'
import FormSearchRoute from './route/FormSearchRoute'
import RouteModal from './route/RouteModal'
import TableRoute from './route/TableRoute'

const PAGE_SIZE = 10

const DEFAULT_FILTERS: RouteFilters = {
  province: null,
  responsibleOffice: null,
  search: '',
}

// Local mock-backed hook. To swap in the real API later, replace this hook
// with a version that fetches/mutates via the routes endpoint — the section
// component stays the same.
const useMockRoutes = () => {
  const [routes, setRoutes] = useState<Route[]>(MOCK_ROUTES)

  const create = useCallback((values: RouteFormValues) => {
    setRoutes((prev) => [
      {
        id: `rt-${Date.now()}`,
        code: values.code,
        name: values.name,
        province: values.province,
        district: values.district,
        lengthKm: values.lengthKm ?? 0,
        responsibleOffice: values.responsibleOffice,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])
  }, [])

  const update = useCallback((id: string, values: RouteFormValues) => {
    setRoutes((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              code: values.code,
              name: values.name,
              province: values.province,
              district: values.district,
              lengthKm: values.lengthKm ?? 0,
              responsibleOffice: values.responsibleOffice,
            }
          : r,
      ),
    )
  }, [])

  const remove = useCallback((id: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return { routes, create, update, remove }
}

const RouteSection: React.FC = () => {
  const { routes, create, update, remove } = useMockRoutes()
  const [filters, setFiltersState] = useState<RouteFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [routeModal, setRouteModal] = useState<{ open: boolean; editing: Route | null }>({
    open: false,
    editing: null,
  })
  const [deleteTarget, setDeleteTarget] = useState<Route | null>(null)

  const setFilters = useCallback((patch: Partial<RouteFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }, [])

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return routes.filter((r) => {
      if (filters.province && r.province !== filters.province) return false
      if (filters.responsibleOffice && r.responsibleOffice !== filters.responsibleOffice) return false
      if (q) {
        const hay = `${r.code} ${r.name}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [routes, filters])

  const openCreate = useCallback(() => setRouteModal({ open: true, editing: null }), [])
  const openEdit = useCallback((route: Route) => setRouteModal({ open: true, editing: route }), [])
  const closeRouteModal = useCallback(() => setRouteModal({ open: false, editing: null }), [])

  const handleSubmit = useCallback(
    (values: RouteFormValues, editingId: string | null) => {
      if (editingId) update(editingId, values)
      else create(values)
    },
    [create, update],
  )

  return (
    <div
      className='rounded-2xl p-5'
      style={{ background: '#191919', border: '1px solid var(--light-gray-2)' }}
    >
      <div className='flex flex-col lg:flex-row lg:items-end gap-4'>
        <div className='flex-1 min-w-0'>
          <FormSearchRoute filters={filters} onChange={setFilters} />
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

      <div className='mt-5'>
        <TableRoute
          data={filtered}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      </div>

      <RouteModal
        open={routeModal.open}
        editing={routeModal.editing}
        onClose={closeRouteModal}
        onSubmit={handleSubmit}
      />
      <DeleteRouteModal
        open={!!deleteTarget}
        route={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </div>
  )
}

export default React.memo(RouteSection)
