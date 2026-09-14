import React, { useCallback, useMemo, useState } from 'react'
import { TableUserData, FormSearchUser, ModalCreateUser, ModalConfirmDelete } from '../components'
import { useDepartments, useDeleteUser, useUsersList, matchesUserSearch } from '@/hooks/queries/manage'
import type { UserSearchFormValues } from './new-user/FormSearchUser'
import { useAppDispatch } from '@/stores/hooks'
import { resetUserModalData } from '@/stores/reducers/modal/customModalSlice'
import { message } from 'antd'
import { getGeneralUsersAPI } from '@/services/routes/ManageService'
import { fetchAllPages } from '../utils/fetchAllPages'
import { toUserExportRow, USER_EXPORT_COLUMNS } from '../data/userExportColumns'
import ExportFileModal from '@/components/export/ExportFileModal'

interface Props {

}

/** Best-effort extractor for the backend's Thai error message — mirrors
 *  FormCreateITSUser's/FormCreateLDAPUser's own helper. */
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

const NewUserSection: React.FC<Props> = (props) => {
  const { } = props

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [exportOpen, setExportOpen] = useState(false)

  const dispatch = useAppDispatch()

  const { data: departments, isLoading: isDepartmentsLoading, isError: isDepartmentsError } = useDepartments()

  const { mutate: deleteUser, isPending: isDeletePending } = useDeleteUser()

  // useUsersList works around GET /manage/general_user?search=… returning
  // malformed JSON (backend bug) by stripping `search` from the network call
  // and filtering client-side instead — see the hook's own docstring.
  const { data: generalUsersData, isLoading: isGeneralUsersLoading, isError: isGeneralUsersError } = useUsersList({
    page,
    limit,
    search: search || undefined,
  })

  // A new search submission starts over at page 1 — otherwise the user
  // could land on a page past the new, narrower result set.
  const handleSearch = useCallback((values: UserSearchFormValues) => {
    setSearch(values.search?.trim() ?? '')
    setPage(1)
  }, [])

  const handlePageChange = useCallback((newPage: number, newLimit: number) => {
    setPage(newPage)
    setLimit(newLimit)
  }, [])

  // ── Export ──────────────────────────────────────────────────────────────
  // Current-page rows mapped to the shared export shape — feeds the 'page'
  // export scope and the ExportFileModal's pageCount.
  const userExportRows = useMemo(
    () => (generalUsersData?.res_data ?? []).map((row) => toUserExportRow(row, departments)),
    [generalUsersData, departments],
  )
  const total = generalUsersData?.meta_data.count ?? 0

  const exportFilterNote = useMemo(
    () => (search.trim() ? `ค้นหา "${search.trim()}"` : undefined),
    [search],
  )

  // Export scope 'ทั้งหมด' — walk EVERY page of the general_user list (the
  // endpoint doesn't support server-side search — see useUsersList's own
  // docstring), then apply the SAME client-side filter useUsersList uses so
  // the exported set matches what's on screen.
  const fetchAllUsers = useCallback(async () => {
    const rows = await fetchAllPages((p, pageLimit) =>
      getGeneralUsersAPI({ page: p, limit: pageLimit }).then((r) => r.data),
    )
    const needle = search.trim().toLowerCase()
    const filtered = needle ? rows.filter((row) => matchesUserSearch(row, needle)) : rows
    return filtered.map((row) => toUserExportRow(row, departments))
  }, [search, departments])

  const onDeleteUserData = useCallback((userId: string) => {
    deleteUser(userId, {
      onSuccess: () => {
        message.success('ลบข้อมูลสำเร็จ')
        dispatch(resetUserModalData())
      },
      onError: (error) => {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการลบข้อมูล'))
      },
    })
  }, [deleteUser, dispatch])

  return (
    <div>
      <section>
        <FormSearchUser onSearch={handleSearch} onExport={() => setExportOpen(true)} />
      </section>
      <section className='mt-5'>
        <TableUserData
          // GENERAL USERS
          data={generalUsersData}
          isLoading={isGeneralUsersLoading}
          isError={isGeneralUsersError}
          // DEPARTMENTS
          departmentsData={departments}
          isDepartmentsLoading={isDepartmentsLoading}
          isDepartmentsError={isDepartmentsError}
          onPageChange={handlePageChange}
        />
      </section>
      <ModalCreateUser />
      <ModalConfirmDelete onDelete={onDeleteUserData} isPending={isDeletePending} />

      {/* นำออกเอกสาร — ทั้งหมด = every user matching the current search
          (fetched in full at export time), หน้าปัจจุบัน = the page the table
          shows. Same shared kit + scope toggle as NewProjectSection. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        scope={{ totalCount: total, pageCount: userExportRows.length }}
        onExportPdf={async (scope) => {
          const rows = scope === 'page' ? userExportRows : await fetchAllUsers()
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Settings_Users_Report',
            title: 'รายงานรายชื่อผู้ใช้งาน (User Management)',
            filterNote: exportFilterNote,
            columns: USER_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows,
          })
        }}
        onExportExcel={async (scope) => {
          const rows = scope === 'page' ? userExportRows : await fetchAllUsers()
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Settings_Users_Report',
            sheetName: 'Users',
            title: 'รายงานรายชื่อผู้ใช้งาน (User Management)',
            filterNote: exportFilterNote,
            columns: USER_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows,
          })
        }}
      />
    </div>
  )
}

export default React.memo<Props>(NewUserSection)
