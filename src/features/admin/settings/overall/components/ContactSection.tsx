"use client"
import { Button } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'
import { TbPlus, TbPrinter } from 'react-icons/tb'
import { MOCK_CONTRACTORS_DATA } from '../data/mockContractors'
import type {
  Contractor,
  ContractorFilters,
  ContractorFormValues,
} from '../types/contractor'
import ContactModal from './contact/ContactModal'
import DeleteContactModal from './contact/DeleteContactModal'
import FormSearchContact from './contact/FormSearchContact'
import TableContact from './contact/TableContact'

const DEFAULT_FILTERS: ContractorFilters = {
  province: null,
  search: '',
}

const PAGE_SIZE = 20

// Interface designed so a future teammate can swap `useMockContractors()` for
// `useContractorsAPI()` in one place without touching the UI.
const useMockContractors = () => {
  const [contractors, setContractors] = useState<Contractor[]>(MOCK_CONTRACTORS_DATA)

  const createContractor = useCallback((values: ContractorFormValues) => {
    const created: Contractor = {
      id: `c-${Math.floor(Math.random() * 1_000_000).toString(36)}`,
      companyName: values.companyName,
      taxId: values.taxId,
      contactPerson: values.contactPerson,
      phone: values.phone,
      email: values.email,
      address: values.address,
      province: values.province,
      registeredAt: new Date().toISOString(),
      projectCount: 0,
    }
    setContractors((prev) => [created, ...prev])
    return created
  }, [])

  const updateContractor = useCallback((id: string, values: ContractorFormValues) => {
    setContractors((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              companyName: values.companyName,
              taxId: values.taxId,
              contactPerson: values.contactPerson,
              phone: values.phone,
              email: values.email,
              address: values.address,
              province: values.province,
            }
          : c,
      ),
    )
  }, [])

  const deleteContractor = useCallback((id: string) => {
    setContractors((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return { contractors, createContractor, updateContractor, deleteContractor }
}

const ContactSection: React.FC = () => {
  const { contractors, createContractor, updateContractor, deleteContractor } = useMockContractors()

  const [filters, setFiltersState] = useState<ContractorFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [modalState, setModalState] = useState<{ open: boolean; editing: Contractor | null }>({
    open: false,
    editing: null,
  })
  const [deleteTarget, setDeleteTarget] = useState<Contractor | null>(null)

  const setFilters = useCallback((patch: Partial<ContractorFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }, [])

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return contractors.filter((c) => {
      if (filters.province && c.province !== filters.province) return false
      if (q) {
        const hay = `${c.companyName} ${c.taxId} ${c.contactPerson}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [contractors, filters])

  const openCreate = useCallback(() => setModalState({ open: true, editing: null }), [])
  const openEdit = useCallback(
    (row: Contractor) => setModalState({ open: true, editing: row }),
    [],
  )
  const closeModal = useCallback(() => setModalState({ open: false, editing: null }), [])

  const handleSubmit = useCallback(
    (values: ContractorFormValues, editingId: string | null) => {
      if (editingId) updateContractor(editingId, values)
      else createContractor(values)
    },
    [createContractor, updateContractor],
  )

  const handleDeleteRequest = useCallback((row: Contractor) => {
    setDeleteTarget(row)
  }, [])

  const handleDeleteConfirm = useCallback(
    (id: string) => {
      deleteContractor(id)
    },
    [deleteContractor],
  )

  return (
    <div
      className='rounded-2xl p-5'
      style={{ background: '#191919', border: '1px solid var(--light-gray-2)' }}
    >
      <div className='flex flex-col lg:flex-row lg:items-end gap-4'>
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
        <TableContact
          data={filtered}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onEdit={openEdit}
          onDelete={handleDeleteRequest}
        />
      </div>

      <ContactModal
        open={modalState.open}
        editing={modalState.editing}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
      <DeleteContactModal
        open={!!deleteTarget}
        contractor={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}

export default React.memo(ContactSection)
