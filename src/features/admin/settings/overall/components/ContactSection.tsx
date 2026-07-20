"use client"
import { App, Button } from 'antd'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import React, { useCallback, useMemo, useState } from 'react'
import { TbPlus, TbPrinter } from 'react-icons/tb'
import ExportFileModal from '@/components/export/ExportFileModal'
import { useContainerHeight } from '@/hooks/useContainerHeight'
import {
  useContractorsList,
  useCreateContractor,
  useDeleteContractor,
  useProjectsList,
  useUpdateContractor,
} from '@/hooks/queries/manage'
import type {
  APIRequestRegisterContractor,
  APIRequestUpdateContractor,
} from '@/types/manage/contractor-api'
import type {
  Contractor,
  ContractorFilters,
  ContractorFormValues,
} from '../types/contractor'
import { calcTableScrollY } from '../hooks/useTableScrollY'
import { DEFAULT_PAGE_SIZE } from '../utils/paginationConfig'
import ContactModal from './contact/ContactModal'
import DeleteContactModal from './contact/DeleteContactModal'
import FormSearchContact from './contact/FormSearchContact'
import TableContact from './contact/TableContact'

dayjs.extend(buddhistEra)

const DEFAULT_FILTERS: ContractorFilters = { search: '' }
// The /manage/project endpoint offers no `?contractor_id=` filter, so to
// compute a per-contractor project count we pull a wide slice on page 1 and
// tally on the client. Real total is ~348; 1000 leaves ample headroom.
const PROJECTS_FOR_COUNT_LIMIT = 1000

/** "06/07/2569" — same dd/MM/พ.ศ. format TableContact renders. */
const fmtThaiDate = (iso: string): string => {
  if (!iso) return '-'
  const d = dayjs(iso)
  return d.isValid() ? d.format('DD/MM/BBBB') : iso
}

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as TableContact (minus the จัดการ action column), plus ลำดับ (mirrors
// CCTV_EXPORT_COLUMNS). `width` = Excel chars, `widthPct` = PDF table percent
// (sums to 100). Email/address/username are NOT on the on-screen table so
// they're not exported; no password field exists on the UI Contractor row.
const CONTACT_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: Contractor, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  { header: 'ชื่อบริษัท', width: 36, widthPct: 24, align: 'left', value: (r) => r.companyName || '-' },
  { header: 'ชื่อย่อ', width: 12, widthPct: 10, value: (r) => r.shortName || '-' },
  { header: 'ผู้ติดต่อ', width: 20, widthPct: 14, value: (r) => r.contactPerson || '-' },
  { header: 'เบอร์โทรศัพท์', width: 16, widthPct: 12, value: (r) => r.phone || '-' },
  { header: 'ตำแหน่ง / บทบาท', width: 18, widthPct: 12, value: (r) => r.role || '-' },
  { header: 'วันที่ลงทะเบียน', width: 15, widthPct: 13, value: (r) => fmtThaiDate(r.registeredAt) },
  { header: 'จำนวนโครงการ', width: 14, widthPct: 10, value: (r) => r.projectCount },
]

/** Best-effort extractor for the backend's Thai error message, which sits at
 *  `error.response.data.message` when the request is enveloped by the shared
 *  BaseService interceptor. Falls back to `error.message` for network errors. */
const readErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const withResponse = error as {
      response?: { data?: { message?: string } }
      message?: string
    }
    return (
      withResponse.response?.data?.message ??
      withResponse.message ??
      fallback
    )
  }
  return fallback
}

const ContactSection: React.FC = () => {
  const { message } = App.useApp()

  // ── Local UI state ────────────────────────────────────────────────────────
  const [filters, setFiltersState] = useState<ContractorFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [modalState, setModalState] = useState<{ open: boolean; editing: Contractor | null }>({
    open: false,
    editing: null,
  })
  const [deleteTarget, setDeleteTarget] = useState<Contractor | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  // Observed height of the outer card — drives the AntD `scroll.y` so the
  // table body always fits the viewport slot allocated by the parent flex
  // layout (screen shell → section slot → this card).
  const [attachContainer, containerH] = useContainerHeight<HTMLDivElement>()

  const setFilters = useCallback((patch: Partial<ContractorFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }, [])

  // ── Server state ──────────────────────────────────────────────────────────
  // /manage/contractor is server-paginated AND server-searched (verified). The
  // hook cache-slots by (page, limit, search) so switching pages or typing a
  // new query keeps prior results warm and avoids empty-state flashes.
  const contractorsQuery = useContractorsList({
    page,
    limit: pageSize,
    search: filters.search.trim(),
  })
  // Only used to derive `projectCount` per contractor — the API has no such
  // field, so we count matching projects on the client. Pull a wide, unpaged
  // slice so the tallies are complete (the section itself never displays
  // this list — the value is only fed into the badge column).
  const projectsQuery = useProjectsList({ page: 1, limit: PROJECTS_FOR_COUNT_LIMIT })
  const createMutation = useCreateContractor()
  const updateMutation = useUpdateContractor()
  const deleteMutation = useDeleteContractor()

  // ── Derive project counts per contractor uuid ────────────────────────────
  const projectCountByContractorId = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of projectsQuery.data?.res_data ?? []) {
      map.set(p.contractor_id, (map.get(p.contractor_id) ?? 0) + 1)
    }
    return map
  }, [projectsQuery.data])

  // ── Map API rows → UI Contractor shape ───────────────────────────────────
  // No client-side text filtering — the server already applied `?search=`.
  // (The /contractor endpoint offers no other filter fields — no province,
  //  region, active-flag, etc. — so there is nothing to narrow further on
  //  the client.)
  const contractors = useMemo<Contractor[]>(() => {
    const rows = contractorsQuery.data?.res_data ?? []
    return rows.map<Contractor>((c) => ({
      id: c.user_id,
      companyName: c.company_name,
      shortName: c.short_name,
      contactPerson: c.name ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      address: c.address ?? '',
      role: c.role ?? '',
      registeredAt: c.created_at,
      username: c.user?.username ?? '',
      isActive: c.user?.is_active ?? true,
      projectCount: projectCountByContractorId.get(c.user_id) ?? 0,
    }))
  }, [contractorsQuery.data, projectCountByContractorId])

  // Server-reported total row count for the pagination footer. Falls back
  // to the current page's length so the "1-N จาก N" label is still sensible
  // during the initial load before meta_data arrives.
  const total = contractorsQuery.data?.meta_data?.count ?? contractors.length

  // Human-readable note of the active search — printed in the PDF header so
  // a reader knows what subset they're looking at (the /contractor endpoint
  // has no other filter fields).
  const exportFilterNote = useMemo(() => {
    const q = filters.search.trim()
    return q ? `ค้นหา "${q}"` : undefined
  }, [filters.search])

  // ── Modal open/close ─────────────────────────────────────────────────────
  const openCreate = useCallback(() => setModalState({ open: true, editing: null }), [])
  const openEdit = useCallback(
    (row: Contractor) => setModalState({ open: true, editing: row }),
    [],
  )
  const closeModal = useCallback(() => setModalState({ open: false, editing: null }), [])

  // ── Create / update ──────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (values: ContractorFormValues, editingId: string | null) => {
      // Trim + normalise. Empty optional strings are dropped so the server
      // sees `undefined` (schema treats those keys as omitted) rather than "".
      const optional = <T extends string | undefined>(v: T): string | undefined => {
        if (typeof v !== 'string') return undefined
        const t = v.trim()
        return t.length ? t : undefined
      }

      const companyName = values.companyName.trim()
      const shortName = values.shortName.trim()

      try {
        if (editingId) {
          const body: APIRequestUpdateContractor = {
            company_name: companyName,
            short_name: shortName,
            name: optional(values.contactPerson),
            phone: optional(values.phone),
            email: optional(values.email),
            address: optional(values.address),
            role: optional(values.role),
            password: optional(values.password),
          }
          await updateMutation.mutateAsync({ id: editingId, data: body })
          message.success('แก้ไขข้อมูลผู้รับจ้างสำเร็จ')
        } else {
          // Backend requires password on create — the modal enforces this too.
          const body: APIRequestRegisterContractor = {
            company_name: companyName,
            short_name: shortName,
            password: (values.password ?? '').trim(),
            name: optional(values.contactPerson),
            phone: optional(values.phone),
            email: optional(values.email),
            address: optional(values.address),
            role: optional(values.role),
          }
          await createMutation.mutateAsync(body)
          message.success('เพิ่มผู้รับจ้างสำเร็จ')
        }
        closeModal()
      } catch (error) {
        message.error(
          readErrorMessage(
            error,
            editingId
              ? 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้รับจ้าง'
              : 'เกิดข้อผิดพลาดในการเพิ่มผู้รับจ้าง',
          ),
        )
      }
    },
    [createMutation, updateMutation, closeModal, message],
  )

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDeleteRequest = useCallback((row: Contractor) => {
    setDeleteTarget(row)
  }, [])

  const handleDeleteConfirm = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id)
        message.success('ลบผู้รับจ้างสำเร็จ')
        setDeleteTarget(null)
      } catch (error) {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการลบผู้รับจ้าง'))
      }
    },
    [deleteMutation, message],
  )

  // AntD `Pagination.onShowSizeChange` fires with `(current, size)`. Reset to
  // page 1 so the user isn't stranded on a page index that may no longer
  // exist under the wider window.
  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }, [])

  return (
    <div
      ref={attachContainer}
      className='rounded-2xl p-5 flex flex-col h-full'
      style={{ background: '#191919', border: '1px solid var(--light-gray-2)' }}
    >
      <div className='shrink-0 flex flex-col lg:flex-row lg:items-end gap-4'>
        <div className='flex-1 min-w-0'>
          <FormSearchContact filters={filters} onFiltersChange={setFilters} />
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
            เพิ่มผู้รับจ้าง
          </Button>
          <Button
            size='large'
            shape='round'
            icon={<TbPrinter />}
            onClick={() => setExportOpen(true)}
            style={{
              background: '#66AEFF',
              color: '#000',
              borderColor: '#66AEFF',
              fontWeight: 600,
            }}
          >
            นำออกเอกสาร
          </Button>
        </div>
      </div>

      <div className='flex-1 min-h-0 mt-5'>
        <TableContact
          data={contractors}
          loading={contractorsQuery.isLoading || projectsQuery.isLoading}
          page={page}
          pageSize={pageSize}
          total={total}
          scrollY={calcTableScrollY(containerH)}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          onEdit={openEdit}
          onDelete={handleDeleteRequest}
        />
      </div>

      {/* นำออกเอกสาร — exports the CURRENTLY DISPLAYED rows (server-searched
          current page), through the shared pdf/excel utils like cctv overall. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={contractors.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Settings_Contractors_Report',
            title: 'รายงานรายชื่อผู้รับจ้าง (Contractor Management)',
            filterNote: exportFilterNote,
            columns: CONTACT_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: contractors,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Settings_Contractors_Report',
            sheetName: 'Contractors',
            columns: CONTACT_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: contractors,
          })
        }}
      />

      <ContactModal
        open={modalState.open}
        editing={modalState.editing}
        submitting={createMutation.isPending || updateMutation.isPending}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
      <DeleteContactModal
        open={!!deleteTarget}
        contractor={deleteTarget}
        deleting={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}

export default React.memo(ContactSection)
