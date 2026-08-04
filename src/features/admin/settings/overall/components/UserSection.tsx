"use client"
import { Alert, Button, message } from 'antd'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import React, { useCallback, useMemo, useState } from 'react'
import { TbPlus, TbPrinter } from 'react-icons/tb'
import ExportFileModal from '@/components/export/ExportFileModal'
import SwapButton from '@/components/swap-button/SwapButton'
import { useContainerHeight } from '@/hooks/useContainerHeight'
import {
  useCreateUser,
  useDeleteUser,
  useDepartments,
  useUpdateUser,
  useUpdateUserPassword,
  useUsersList,
} from '@/hooks/queries/manage'
import type { APIResponseGeneralUser } from '@/types/manage/general-user-api'
import type { APIResponseDepartment } from '@/types/manage/department-api'
import type { APIResponseSSOUser } from '@/types/manage/sso-search-api'
import { calcTableScrollY } from '../hooks/useTableScrollY'
import type { User, UserFilters, UserFormValues } from '../types/user'
import { DEFAULT_PAGE_SIZE } from '../utils/paginationConfig'
import ChangePasswordModal from './user/ChangePasswordModal'
import DeleteUserModal from './user/DeleteUserModal'
import FormSearchUser from './user/FormSearchUser'
import LDAPSearchModal from './user/LDAPSearchModal'
import TableUser from './user/TableUser'
import UserModal from './user/UserModal'

dayjs.extend(buddhistEra)

const initialFilters: UserFilters = {
  role: null,
  status: null,
  search: '',
}

// Text labels mirrored from RoleBadge / StatusPill so the export reads
// exactly like the on-screen pills (unknown role slugs fall through raw).
const ROLE_LABELS: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ',
  user: 'ผู้ใช้งาน',
  // Legacy slugs — no longer selectable, but still labelled so old rows
  // don't export as raw text. Mirrors RoleBadge's KNOWN_ROLES.
  operator: 'ผู้ปฏิบัติงาน',
  viewer: 'ผู้ดูข้อมูล',
}
const STATUS_LABELS: Record<User['status'], string> = {
  active: 'ใช้งาน',
  inactive: 'ปิดใช้งาน',
}

/** "5 ก.ค. 2569" — same Thai short-month + Buddhist-year format TableUser renders. */
const fmtThaiDate = (iso: string | null): string => {
  if (!iso) return '-'
  const d = dayjs(iso)
  return d.isValid() ? d.locale('th').format('D MMM BBBB') : iso
}

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as TableUser (minus the จัดการ action column), plus ลำดับ (mirrors
// CCTV_EXPORT_COLUMNS). `width` = Excel chars, `widthPct` = PDF table percent
// (sums to 100). The UI User row carries no password/sensitive fields.
const USER_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: User, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  { header: 'Username', width: 20, widthPct: 14, value: (r) => r.username || '-' },
  { header: 'ชื่อ-นามสกุล', width: 26, widthPct: 17, align: 'left', value: (r) => r.fullName },
  { header: 'บทบาท', width: 14, widthPct: 11, value: (r) => ROLE_LABELS[r.role] ?? (r.role || '-') },
  { header: 'ประเภท', width: 10, widthPct: 8, value: (r) => (r.isLdap ? 'LDAP' : 'Local') },
  { header: 'หน่วยงาน', width: 26, widthPct: 18, align: 'left', value: (r) => r.department },
  { header: 'สถานะ', width: 12, widthPct: 10, value: (r) => STATUS_LABELS[r.status] },
  { header: 'สร้างเมื่อ', width: 16, widthPct: 17, value: (r) => fmtThaiDate(r.createdAt) },
]

// Sub-tab options rendered inside the User tab. Kept module-scope so the
// SwapButton's `options` reference is stable across renders (matches the
// pattern used by TitleSection for the top-level tabs).
const SUB_TABS = [
  { label: 'Local', value: 'local' },
  { label: 'LDAP', value: 'ldap' },
]

/** Maps the raw /general_user row to the flat UI User type.
 *  Kept as a plain function (not a hook) so the memoized list projection
 *  in UserSection only recomputes when its inputs change. */
const toUser = (
  row: APIResponseGeneralUser,
  departmentsById: Map<number, APIResponseDepartment>,
): User => {
  const firstName = row.first_name ?? ''
  const lastName = row.lastname ?? ''
  const dept = row.department_id != null ? departmentsById.get(row.department_id) : undefined
  return {
    id: row.user_id,
    username: row.user?.username ?? '',
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim() || '-',
    role: row.role ?? '',
    departmentId: row.department_id,
    department: dept?.department_short_name || dept?.department_name || '-',
    // Real API has no `status` field — infer from `user.is_active`. Rows
    // without a nested `user` (defensive) default to inactive.
    status: row.user?.is_active ? 'active' : 'inactive',
    createdAt: row.created_at,
    // `is_ldap` is verified present on the live payload; default to false
    // just in case an older row is missing the field.
    isLdap: row.is_ldap ?? false,
  }
}

/** Client-side narrowing (sub-tab / role / status / search) shared by the
 *  table's `filtered` memo and the export-'ทั้งหมด' path — see the
 *  SERVER-SEARCH BUG WORKAROUND block in UserSection for why every one of
 *  these filters must be applied client-side. */
const applyUserFilters = (
  rows: User[],
  filters: UserFilters,
  subTab: 'local' | 'ldap',
): User[] => {
  const q = filters.search.trim().toLowerCase()
  const wantLdap = subTab === 'ldap'
  return rows.filter((u) => {
    if (u.isLdap !== wantLdap) return false
    if (filters.role && u.role !== filters.role) return false
    if (filters.status && u.status !== filters.status) return false
    if (q) {
      const haystack = `${u.username} ${u.fullName}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

const UserSection: React.FC = () => {
  const [filters, setFiltersState] = useState<UserFilters>(initialFilters)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)
  // Local vs LDAP split — the endpoint has no `is_ldap` query param so the
  // filter is applied client-side over the fetched rows. Phase 2 will wire
  // this to the sub-tab UI; today it just gates the table via `filtered`.
  const [subTab, setSubTab] = useState<'local' | 'ldap'>('local')

  // Container height drives the AntD table's internal scroll — we measure the
  // outer card and feed a numeric px value to `scroll.y` so the body scrolls
  // inside the card instead of the whole viewport.
  const [attachContainer, containerH] = useContainerHeight<HTMLDivElement>()

  // ── SERVER-SEARCH BUG WORKAROUND (task #12) ─────────────────────────────
  // /api-v2/manage/general_user?search=… returns malformed JSON on the
  // backend, so we DO NOT forward `filters.search` to the API. The
  // foundation hook (useUsersList) also strips `search` before hitting the
  // wire as a belt-and-braces safeguard. Instead, search is applied
  // client-side over `data.res_data` in the `filtered` memo below. The
  // role + status dropdowns are also client-only (the endpoint has no
  // server-side filter for them). Pagination stays server-side for
  // consistency with the other Section tabs — the dataset is only ~6 rows
  // today so it's effectively a single page, but the mechanism is here
  // when the row count grows.
  const { data, isLoading, isError, error, refetch } = useUsersList({
    page,
    limit: pageSize,
  })
  const { data: departments } = useDepartments()

  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()
  const passwordMutation = useUpdateUserPassword()

  const [userModal, setUserModal] = useState<{ open: boolean; editing: User | null }>({
    open: false,
    editing: null,
  })
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null)
  // LDAP create is a two-step flow: search modal first, then UserModal
  // seeded from the picked AD row. `ldapSearchOpen` gates the search dialog,
  // `ldapPrefill` survives the transition so UserModal can seed its form.
  const [ldapSearchOpen, setLdapSearchOpen] = useState(false)
  const [ldapPrefill, setLdapPrefill] = useState<APIResponseSSOUser | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const departmentsById = useMemo(() => {
    const m = new Map<number, APIResponseDepartment>()
    for (const d of departments ?? []) m.set(d.id, d)
    return m
  }, [departments])

  const users: User[] = useMemo(
    () => (data?.res_data ?? []).map((r) => toUser(r, departmentsById)),
    [data, departmentsById],
  )

  const total = data?.meta_data?.count ?? 0

  const setFilters = useCallback((patch: Partial<UserFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }, [])

  // Client-side filter over the current page's rows — see workaround
  // block above for why search is not sent to the server. The subTab
  // gate narrows to Local (`!isLdap`) or LDAP (`isLdap`) users; the
  // backend has no `is_ldap` query param so this must stay client-side.
  const filtered = useMemo(
    () => applyUserFilters(users, filters, subTab),
    [users, filters, subTab],
  )

  // Human-readable note of the active sub-tab/filters/search — printed in
  // the PDF header so a reader knows what subset they're looking at. The
  // sub-tab always narrows the rows (Local vs LDAP) so it's always noted.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = [`ประเภท ${subTab === 'ldap' ? 'LDAP' : 'Local'}`]
    if (filters.role) parts.push(`บทบาท ${ROLE_LABELS[filters.role] ?? filters.role}`)
    if (filters.status) parts.push(`สถานะ ${STATUS_LABELS[filters.status]}`)
    if (filters.search.trim()) parts.push(`ค้นหา "${filters.search.trim()}"`)
    return parts.join(' · ')
  }, [subTab, filters])

  // Export scope 'ทั้งหมด' — fetch EVERY user at export time (pagination is
  // server-side; `?search` is broken server-side so it is NOT forwarded — see
  // workaround block above) then run the exact client filter the table uses.
  // Same two-step full-fetch pattern as incident-detection's EventSection:
  // page 1 @100, then refetch at the reported total when it exceeds 100.
  const fetchAllUsers = async (): Promise<User[]> => {
    const { getGeneralUsersAPI } = await import('@/services/routes/ManageService')
    const first = await getGeneralUsersAPI({ page: 1, limit: 100 })
    const count = first.data?.meta_data?.count ?? 0
    const rows =
      count <= 100
        ? first.data?.res_data ?? []
        : (await getGeneralUsersAPI({ page: 1, limit: count })).data?.res_data ?? []
    return applyUserFilters(rows.map((r) => toUser(r, departmentsById)), filters, subTab)
  }

  // Local create opens UserModal directly. LDAP create opens the search
  // modal first — the picked row triggers the UserModal transition via
  // `handleLdapPick` below.
  const openCreate = useCallback(() => {
    if (subTab === 'ldap') setLdapSearchOpen(true)
    else setUserModal({ open: true, editing: null })
  }, [subTab])
  const openEdit = useCallback((user: User) => setUserModal({ open: true, editing: user }), [])
  const closeUser = useCallback(() => {
    setUserModal({ open: false, editing: null })
    // Clear the AD prefill so a subsequent create doesn't accidentally
    // reuse the previous pick (e.g. Local create after LDAP create).
    setLdapPrefill(null)
  }, [])
  const handleLdapPick = useCallback((u: APIResponseSSOUser) => {
    setLdapPrefill(u)
    setLdapSearchOpen(false)
    setUserModal({ open: true, editing: null })
  }, [])

  // Reset to page 1 whenever the page size changes so we don't land on an
  // orphaned deep page (e.g. page 8 of a now-recomputed 3-page dataset).
  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }, [])

  const handleSubmit = useCallback(
    async (values: UserFormValues, editing: User | null) => {
      try {
        if (editing) {
          await updateMutation.mutateAsync({
            id: editing.id,
            data: {
              first_name: values.firstName,
              last_name: values.lastName,
              department_id: values.departmentId,
              role: values.role,
            },
          })
          message.success('บันทึกข้อมูลผู้ใช้งานแล้ว')
        } else {
          await createMutation.mutateAsync({
            username: values.username,
            first_name: values.firstName,
            last_name: values.lastName,
            department_id: values.departmentId,
            role: values.role,
            password: values.password,
            // Must be forwarded — the LDAP/Local sub-tab split is driven by
            // this flag, and LDAP accounts carry no local password.
            is_ldap: values.isLdap,
          })
          message.success('เพิ่มผู้ใช้งานแล้ว')
        }
        closeUser()
      } catch (err) {
        // Server errors bubble via message; the modal stays open so the user
        // can retry without re-entering the form.
        const detail = err instanceof Error ? err.message : 'ไม่สามารถบันทึกข้อมูลได้'
        message.error(detail)
      }
    },
    [createMutation, updateMutation, closeUser],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id)
        message.success('ลบผู้ใช้งานแล้ว')
        setDeleteTarget(null)
      } catch (err) {
        const detail = err instanceof Error ? err.message : 'ไม่สามารถลบผู้ใช้งานได้'
        message.error(detail)
      }
    },
    [deleteMutation],
  )

  const handleChangePassword = useCallback(
    async (id: string, password: string) => {
      try {
        await passwordMutation.mutateAsync({ id, data: { password } })
        message.success('เปลี่ยนรหัสผ่านแล้ว')
        setPasswordTarget(null)
      } catch (err) {
        const detail = err instanceof Error ? err.message : 'ไม่สามารถเปลี่ยนรหัสผ่านได้'
        message.error(detail)
      }
    },
    [passwordMutation],
  )

  return (
    <div
      ref={attachContainer}
      className='rounded-2xl p-5 flex flex-col h-full'
      style={{ background: '#191919', border: '1px solid var(--light-gray-2)' }}
    >
      <div className='shrink-0'>
        {/* Sub-tab switch (Local vs LDAP). Rendered above the filters row —
         *  same SwapButton component the top-level tabs use, but sized `middle`
         *  so it reads as a nested control instead of a peer. `activeValue`
         *  keeps it controlled off `subTab` so state stays canonical here. */}
        <div className='mb-4'>
          <SwapButton
            options={SUB_TABS}
            activeValue={subTab}
            size='middle'
            setLabelValue={(value) => setSubTab(value as 'local' | 'ldap')}
          />
        </div>
        <div className='flex flex-col lg:flex-row lg:items-end gap-4'>
          <div className='flex-1 min-w-0'>
            <FormSearchUser filters={filters} onChange={setFilters} />
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
              {subTab === 'ldap' ? 'เพิ่มผู้ใช้งาน LDAP' : 'เพิ่มผู้ใช้งาน'}
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

        {isError && (
          <div className='mt-4'>
            <Alert
              type='error'
              showIcon
              message='ไม่สามารถโหลดข้อมูลผู้ใช้งานได้'
              description={error instanceof Error ? error.message : undefined}
              action={
                <Button size='small' onClick={() => refetch()}>
                  ลองอีกครั้ง
                </Button>
              }
            />
          </div>
        )}
      </div>

      <div className='flex-1 min-h-0 mt-5'>
        <TableUser
          data={filtered}
          page={page}
          pageSize={pageSize}
          total={total}
          loading={isLoading}
          scrollY={calcTableScrollY(containerH)}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onChangePassword={setPasswordTarget}
        />
      </div>

      {/* นำออกเอกสาร — scope toggle: ทั้งหมด = every user matching the current
          sub-tab/filters (fetched in full at export time), หน้าปัจจุบัน = the
          filtered rows the table shows. NOTE: totalCount is the server's
          pre-filter total (meta_data.count) — the filtered size of the full
          set isn't knowable until the export-time fetch, so the label is an
          approximate upper bound; the exported rows themselves are exact. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        scope={{ totalCount: total, pageCount: filtered.length }}
        onExportPdf={async (scope) => {
          const rows = scope === 'page' ? filtered : await fetchAllUsers()
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
          const rows = scope === 'page' ? filtered : await fetchAllUsers()
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

      <LDAPSearchModal
        open={ldapSearchOpen}
        onCancel={() => setLdapSearchOpen(false)}
        onSelect={handleLdapPick}
      />
      <UserModal
        open={userModal.open}
        editing={userModal.editing}
        submitting={createMutation.isPending || updateMutation.isPending}
        onClose={closeUser}
        onSubmit={handleSubmit}
        onChangePassword={setPasswordTarget}
        // Edit: trust the row's own `isLdap` (the sub-tab could theoretically
        // desync from the target row). Create: use the active sub-tab.
        mode={userModal.editing ? (userModal.editing.isLdap ? 'ldap' : 'local') : subTab}
        prefill={ldapPrefill}
      />
      <DeleteUserModal
        open={!!deleteTarget}
        user={deleteTarget}
        submitting={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
      <ChangePasswordModal
        open={!!passwordTarget}
        user={passwordTarget}
        submitting={passwordMutation.isPending}
        onClose={() => setPasswordTarget(null)}
        onConfirm={handleChangePassword}
      />
    </div>
  )
}

export default React.memo(UserSection)
