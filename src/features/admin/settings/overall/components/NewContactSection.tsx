"use client"
import React, { useCallback, useMemo, useState } from 'react'
import {
  ContentContactList,
  FormSearchContact,
} from '../components'
import { App, Empty, Skeleton } from 'antd'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getContractorListAPI } from '@/services/routes/ManageService'
import AppPagination from '@/components/pagination/AppPagination'
import ExportFileModal from '@/components/export/ExportFileModal'
import {
  manageKeys,
  useCreateContractor,
  useDeleteContractor,
  useUpdateContractor,
} from '@/hooks/queries/manage'
import type {
  APIRequestRegisterContractor,
  APIRequestUpdateContractor,
  ContractorData,
} from '@/types/manage/contractor-api'
import type { Contractor, ContractorFormValues } from '../types/contractor'
import { CONTACT_EXPORT_COLUMNS } from '../data/contactExportColumns'
import { fetchAllPages } from '../utils/fetchAllPages'
import ContactModal from './contact/ContactModal'
import DeleteContactModal from './contact/DeleteContactModal'

interface Props {

}

/** Maps a /manage/contractor row (this list's richer, project-nested flavor)
 *  → the shared UI Contractor shape ContactModal/DeleteContactModal already
 *  speak — same projection as ContactSection's own toContractor, adjusted
 *  for ContractorData's field set. */
const toContractor = (c: ContractorData): Contractor => ({
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
  projectCount: c.project_count ?? 0,
})

/** Best-effort extractor for the backend's Thai error message — mirrors
 *  ContactSection's own helper. */
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

const NewContactSection: React.FC<Props> = (props) => {
  const { } = props
  const { message } = App.useApp()
  const [type, setType] = useState<'TABLE' | 'GRID'>('TABLE')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(3)

  const [modalState, setModalState] = useState<{ open: boolean; editing: ContractorData | null }>({
    open: false,
    editing: null,
  })
  const [deleteTarget, setDeleteTarget] = useState<ContractorData | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const createMutation = useCreateContractor()
  const updateMutation = useUpdateContractor()
  const deleteMutation = useDeleteContractor()

  // Factory key (not an ad-hoc ['contacts', ...] tuple) so the shared
  // create/update/delete mutation hooks — which invalidate
  // `manageKeys.contractors.all` — actually refresh this list too.
  const { data, isLoading, isError } = useQuery({
    queryKey: manageKeys.contractors.list({ page, limit, search }),
    queryFn: () => getContractorListAPI({
      page: page,
      limit: limit,
      search: search,
    }),
    placeholderData: keepPreviousData,
  })

  // A new search term invalidates whatever page the user was on — start over
  // at page 1 instead of possibly landing on a page past the new result set.
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const total = data?.data.meta_data.count ?? 0

  // ── Export ──────────────────────────────────────────────────────────────
  // Current-page rows mapped to the shared UI shape — feeds the 'page' export
  // scope and the ExportFileModal's pageCount.
  const contractors = useMemo<Contractor[]>(() => {
    const rows = data?.data?.res_data ?? []
    return rows.map(toContractor)
  }, [data])

  // Human-readable note of the active search — printed in the PDF header so
  // a reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const q = search.trim()
    return q ? `ค้นหา "${q}"` : undefined
  }, [search])

  // Export scope 'ทั้งหมด' — walk EVERY page of the current server-side
  // search at export time (mirrors ContactSection's own fetchAllContractors;
  // the backend caps `?limit=` at 100).
  const fetchAllContractors = async (): Promise<Contractor[]> => {
    const rows = await fetchAllPages((p, pageLimit) =>
      getContractorListAPI({ page: p, limit: pageLimit, search }).then((r) => r.data),
    )
    return rows.map(toContractor)
  }

  // ── Modal open/close ────────────────────────────────────────────────────
  const openCreate = useCallback(() => setModalState({ open: true, editing: null }), [])
  const openEdit = useCallback(
    (row: ContractorData) => setModalState({ open: true, editing: row }),
    [],
  )
  const closeModal = useCallback(() => setModalState({ open: false, editing: null }), [])

  // ── Create / update ─────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (values: ContractorFormValues, editingId: string | null) => {
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

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDeleteRequest = useCallback((row: ContractorData) => {
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

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={true} active />
    if (isError) {
      return (
        <div className="block m-auto py-18">
          <Empty description="เกิดข้อผิดพลาด" />
        </div>
      )
    }
    if (!data?.data?.res_data || data.data.res_data.length === 0) return (
      <div className="block m-auto py-18">
        <Empty description="ไม่มีข้อมูลผู้ติดต่อ" />
      </div>
    )
    return (
      <ContentContactList
        type={type}
        data={data?.data}
        isLoading={isLoading}
        isError={isError}
        onEdit={openEdit}
        onDelete={handleDeleteRequest}
      />
    )
  }, [isLoading, isError, data, type, openEdit, handleDeleteRequest])

  return (
    <div>
      <section>
        <FormSearchContact
          type={type}
          setType={setType}
          search={search}
          setSearch={handleSearchChange}
          onAdd={openCreate}
          onExport={() => setExportOpen(true)}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
      {total > 0 && (
        <section className='mt-5'>
          <AppPagination
            align='center'
            current={page}
            pageSize={limit}
            total={total}
            showSizeChanger={false}
            // TODO: enable page-size changing once ready — uncomment below
            // and remove the `showSizeChanger={false}` line above.
            // showSizeChanger={true}
            // pageSizeOptions={[3, 10, 20, 50]}
            onChange={(newPage, newLimit) => {
              setPage(newPage)
              setLimit(newLimit)
            }}
          />
        </section>
      )}

      <ContactModal
        open={modalState.open}
        editing={modalState.editing ? toContractor(modalState.editing) : null}
        submitting={createMutation.isPending || updateMutation.isPending}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
      <DeleteContactModal
        open={!!deleteTarget}
        contractor={deleteTarget ? toContractor(deleteTarget) : null}
        deleting={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* นำออกเอกสาร — same scope toggle + column set as ContactSection:
          ทั้งหมด = every contractor matching the current search (fetched in
          full at export time), หน้าปัจจุบัน = the page this screen shows. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        scope={{ totalCount: total, pageCount: contractors.length }}
        onExportPdf={async (scope) => {
          const rows = scope === 'page' ? contractors : await fetchAllContractors()
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Settings_Contractors_Report',
            title: 'รายงานรายชื่อผู้รับจ้าง (Contractor Management)',
            filterNote: exportFilterNote,
            columns: CONTACT_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows,
          })
        }}
        onExportExcel={async (scope) => {
          const rows = scope === 'page' ? contractors : await fetchAllContractors()
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Settings_Contractors_Report',
            sheetName: 'Contractors',
            title: 'รายงานรายชื่อผู้รับจ้าง (Contractor Management)',
            filterNote: exportFilterNote,
            columns: CONTACT_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows,
          })
        }}
      />
    </div>
  )
}

export default React.memo<Props>(NewContactSection)
