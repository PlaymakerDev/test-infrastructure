"use client"
import { Button } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'
import { TbPlus, TbPrinter } from 'react-icons/tb'
import { MOCK_USERS } from '../data/mockUsers'
import type { User, UserFilters, UserFormValues } from '../types/user'
import DeleteUserModal from './user/DeleteUserModal'
import FormSearchUser from './user/FormSearchUser'
import TableUser from './user/TableUser'
import UserModal from './user/UserModal'

const PAGE_SIZE = 10

const initialFilters: UserFilters = {
  role: null,
  status: null,
  search: '',
}

// Local ID generator — swap for API-provided id once backend CRUD lands.
const genId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const UserSection: React.FC = () => {
  // Local state — a future team member replaces this block with useUsersAPI().
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [filters, setFiltersState] = useState<UserFilters>(initialFilters)
  const [page, setPage] = useState(1)

  const [userModal, setUserModal] = useState<{ open: boolean; editing: User | null }>({
    open: false,
    editing: null,
  })
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const setFilters = useCallback((patch: Partial<UserFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }, [])

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return users.filter((u) => {
      if (filters.role && u.role !== filters.role) return false
      if (filters.status && u.status !== filters.status) return false
      if (q) {
        const haystack = `${u.username} ${u.fullName} ${u.email}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [users, filters])

  const openCreate = useCallback(() => setUserModal({ open: true, editing: null }), [])
  const openEdit = useCallback((user: User) => setUserModal({ open: true, editing: user }), [])
  const closeUser = useCallback(() => setUserModal({ open: false, editing: null }), [])

  const handleSubmit = useCallback((values: UserFormValues, editingId: string | null) => {
    setUsers((prev) => {
      if (editingId) {
        return prev.map((u) => (u.id === editingId ? { ...u, ...values } : u))
      }
      const now = new Date().toISOString()
      const created: User = {
        id: genId(),
        ...values,
        lastLoginAt: null,
        createdAt: now,
      }
      return [created, ...prev]
    })
  }, [])

  const handleDelete = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }, [])

  return (
    <div
      className='rounded-2xl p-5'
      style={{ background: '#191919', border: '1px solid var(--light-gray-2)' }}
    >
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
            เพิ่มผู้ใช้งาน
          </Button>
          <Button
            size='large'
            shape='round'
            icon={<TbPrinter />}
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

      <div className='mt-5'>
        <TableUser
          data={filtered}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      </div>

      <UserModal
        open={userModal.open}
        editing={userModal.editing}
        onClose={closeUser}
        onSubmit={handleSubmit}
      />
      <DeleteUserModal
        open={!!deleteTarget}
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default React.memo(UserSection)
