"use client"
import React, { useCallback, useMemo, useState } from 'react'
import { FormSearchProject, ProjectGridView, ProjectListView } from '../components'
import type { ProjectSearchFormValues } from './new-project/FormSearchProject'
import { App } from 'antd'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getProjectListAPI } from '@/services/routes/ManageService'
import {
  manageKeys,
  useCreateProject,
  useDeleteProject,
  useDepartments,
  useProjectContractors,
  useUpdateProject,
} from '@/hooks/queries/manage'
import type { APIRequestProjectList, ProjectListData } from '@/types/manage/project-api'
import type { TableProps } from 'antd'
import { mapProject } from '../context'
import type { Project, ProjectFormValues } from '../types/project'
import { PROJECT_EXPORT_COLUMNS } from '../data/projectExportColumns'
import { fetchAllPages } from '../utils/fetchAllPages'
import ExportFileModal from '@/components/export/ExportFileModal'
import ProjectModal from './project/ProjectModal'
import DeleteProjectModal from './project/DeleteProjectModal'

interface Props {

}

/** Best-effort extractor for the backend's Thai error message — same shape
 *  the project Context's own `errText` helper reads (`res_data.details` /
 *  `details`), since that's what's proven correct for /manage/project. */
const readErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const withResponse = error as {
      response?: { data?: { details?: unknown; res_data?: { details?: unknown } } }
      message?: string
    }
    const details =
      withResponse.response?.data?.res_data?.details ??
      withResponse.response?.data?.details
    if (typeof details === 'string') return details
    if (details && typeof details === 'object') return JSON.stringify(details)
    return withResponse.message ?? fallback
  }
  return fallback
}

const NewProjectSection: React.FC<Props> = (props) => {
  const { } = props
  const { message } = App.useApp()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [budgetYear, setBudgetYear] = useState<number | undefined>(undefined)
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined)
  const [contractorId, setContractorId] = useState<string | undefined>(undefined)
  const [displayType, setDisplayType] = useState<'LIST' | 'GRID'>('LIST')

  const [modalState, setModalState] = useState<{ open: boolean; editing: ProjectListData | null }>({
    open: false,
    editing: null,
  })
  const [deleteTarget, setDeleteTarget] = useState<ProjectListData | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const { data: departments } = useDepartments()
  // Same cached /manage/project/contractor list FormSearchProject's dropdown
  // uses — needed here only to resolve a human-readable name for the export
  // filterNote (the form submits contractor_id, not a label).
  const { data: contractorOptions } = useProjectContractors()
  const createMutation = useCreateProject()
  const updateMutation = useUpdateProject()
  const deleteMutation = useDeleteProject()

  const params: APIRequestProjectList = {
    page,
    limit,
    search: search || undefined,
    budget_year: budgetYear,
    department_id: departmentId,
    contractor_id: contractorId,
    // field/sort aren't a focus for this list — always newest-first.
    sort: 'DESC',
  }

  // POST/PUT/DELETE all invalidate `manageKeys.projects.all` (see
  // useCreateProject/useUpdateProject/useDeleteProject) — `listFiltered` is
  // nested under that same prefix, so any create/update/delete here
  // automatically refetches this list. No manual refetch() needed.
  const { data, isLoading, isError } = useQuery({
    queryKey: manageKeys.projects.listFiltered(params),
    queryFn: () => getProjectListAPI(params),
    placeholderData: keepPreviousData,
  })

  // A new search/filter submission starts over at page 1 — otherwise the
  // user could land on a page past the new, narrower result set.
  const handleSearch = useCallback((values: ProjectSearchFormValues) => {
    setSearch(values.search?.trim() ?? '')
    setBudgetYear(values.budget_year ?? undefined)
    setDepartmentId(values.department_id ? Number(values.department_id) : undefined)
    setContractorId(values.contractor_id ?? undefined)
    setPage(1)
  }, [])

  const handleTableChange: NonNullable<TableProps<ProjectListData>['onChange']> = useCallback(
    (pagination) => {
      setPage(pagination.current ?? 1)
      setLimit(pagination.pageSize ?? 10)
    },
    [],
  )

  const tableData = useMemo(() => data?.data, [data])

  // ── Export ──────────────────────────────────────────────────────────────
  // Current-page rows mapped to the shared UI shape — feeds the 'page' export
  // scope and the ExportFileModal's pageCount. Same PROJECT_EXPORT_COLUMNS
  // ProjectSection (legacy) uses, so the two flavors export identically.
  const projectRows = useMemo<Project[]>(() => {
    const rows = tableData?.res_data ?? []
    return rows.map((r) => mapProject(r, departments))
  }, [tableData, departments])

  const total = tableData?.meta_data.count ?? 0

  // Human-readable note of the active filters/search — printed in the PDF
  // header so a reader knows what subset they're looking at. department_id /
  // contractor_id are ids on the wire — resolve them to the same labels the
  // dropdowns show.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    if (budgetYear) parts.push(`ปีงบประมาณ ${budgetYear}`)
    if (departmentId != null) {
      const dept = departments?.find((d) => d.id === departmentId)
      parts.push(`ผู้ว่าจ้าง ${dept?.department_short_name ?? `#${departmentId}`}`)
    }
    if (contractorId) {
      const c = contractorOptions?.find((c) => c.user_id === contractorId)
      parts.push(`ผู้รับจ้าง ${c?.company_name ?? `#${contractorId}`}`)
    }
    if (search.trim()) parts.push(`ค้นหา "${search.trim()}"`)
    return parts.length ? parts.join(' · ') : undefined
  }, [budgetYear, departmentId, contractorId, search, departments, contractorOptions])

  // GRID view's department list (GET /manage/project/department) has no
  // department_id filter — only free-text `search` — so resolve the
  // selected id to the same department_short_name label the "ผู้ว่าจ้าง"
  // dropdown shows, same lookup exportFilterNote uses above.
  const departmentSearchText = useMemo(() => {
    if (departmentId == null) return undefined
    return departments?.find((d) => d.id === departmentId)?.department_short_name
  }, [departmentId, departments])

  // Export scope 'ทั้งหมด' — walk EVERY page of the current server-side
  // filters at export time (the backend caps `?limit=` at 100 — see
  // fetchAllPages), then map to the shared UI shape.
  const fetchAllProjects = async (): Promise<Project[]> => {
    const rows = await fetchAllPages((p, pageLimit) =>
      getProjectListAPI({
        page: p,
        limit: pageLimit,
        search: search || undefined,
        budget_year: budgetYear,
        department_id: departmentId,
        contractor_id: contractorId,
        sort: 'DESC',
      }).then((r) => r.data),
    )
    return rows.map((r) => mapProject(r, departments))
  }

  // ── Modal open/close ────────────────────────────────────────────────────
  const openCreate = useCallback(() => setModalState({ open: true, editing: null }), [])
  const openEdit = useCallback(
    (row: ProjectListData) => setModalState({ open: true, editing: row }),
    [],
  )
  const closeModal = useCallback(() => setModalState({ open: false, editing: null }), [])

  // ProjectModal/DeleteProjectModal speak the mapped `Project` shape (they're
  // shared with the old ProjectSection) — map lazily at render time, same as
  // NewContactSection's toContractor.
  const editingProject: Project | null = modalState.editing
    ? mapProject(modalState.editing, departments)
    : null
  const deleteTargetProject: Project | null = deleteTarget
    ? mapProject(deleteTarget, departments)
    : null

  // ── Create / update ─────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (values: ProjectFormValues, editingId: string | null) => {
      try {
        if (editingId) {
          await updateMutation.mutateAsync({
            id: Number(editingId),
            budget_year: values.budgetYear as number,
            contract_no: values.contractNo,
            project_no: values.code || '',
            project_name: values.name,
            department_id: Number(values.owner),
            contractor_id: values.contractor,
            warranty_start_date: values.warrantyStart,
            warranty_end_date: values.warrantyEnd,
            // Echo project_road_id for existing rows so the backend updates
            // in place instead of inserting duplicates.
            project_road: values.roads.map((r) => ({
              road_id: Number(r.roadId),
              ...(r.projectRoadId ? { project_road_id: r.projectRoadId } : {}),
            })),
          })
          message.success('แก้ไขโครงการสำเร็จ')
        } else {
          await createMutation.mutateAsync({
            budget_year: values.budgetYear as number,
            contract_no: values.contractNo,
            project_no: values.code || '',
            project_name: values.name,
            department_id: Number(values.owner),
            contractor_id: values.contractor,
            warranty_start_date: values.warrantyStart,
            warranty_end_date: values.warrantyEnd,
            project_road: values.roads.map((r) => ({ road_id: Number(r.roadId) })),
          })
          message.success('เพิ่มโครงการสำเร็จ')
        }
        closeModal()
      } catch (error) {
        message.error(
          readErrorMessage(
            error,
            editingId ? 'แก้ไขโครงการไม่สำเร็จ' : 'เพิ่มโครงการไม่สำเร็จ',
          ),
        )
      }
    },
    [createMutation, updateMutation, closeModal, message],
  )

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDeleteRequest = useCallback((row: ProjectListData) => {
    setDeleteTarget(row)
  }, [])

  const handleDeleteConfirm = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(Number(id))
        message.success('ลบโครงการสำเร็จ')
        setDeleteTarget(null)
      } catch (error) {
        message.error(readErrorMessage(error, 'ลบโครงการไม่สำเร็จ'))
      }
    },
    [deleteMutation, message],
  )

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'LIST':
        return (
          <ProjectListView
            data={tableData}
            isLoading={isLoading}
            isError={isError}
            onTableChange={handleTableChange}
            onEdit={openEdit}
            onDelete={handleDeleteRequest}
          />
        )
      case 'GRID':
        return (
          <ProjectGridView
            data={tableData}
            isLoading={isLoading}
            isError={isError}
            onTableChange={handleTableChange}
            onEdit={openEdit}
            onDelete={handleDeleteRequest}
            search={search}
            departmentSearchText={departmentSearchText}
            budgetYear={budgetYear}
            contractorId={contractorId}
          />
        )
      default:
        return null
    }
  }, [displayType, tableData, isLoading, isError, handleTableChange, openEdit, handleDeleteRequest, search, departmentSearchText, budgetYear, contractorId])

  return (
    <div>
      <section>
        <FormSearchProject
          onSearch={handleSearch}
          onAdd={openCreate}
          onExport={() => setExportOpen(true)}
          displayType={displayType}
          setDisplayType={setDisplayType}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>

      <ProjectModal
        open={modalState.open}
        editing={editingProject}
        submitting={createMutation.isPending || updateMutation.isPending}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
      <DeleteProjectModal
        open={!!deleteTarget}
        project={deleteTargetProject}
        deleting={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* นำออกเอกสาร — same scope toggle + column set as ProjectSection:
          ทั้งหมด = every project matching the current search/filters (fetched
          in full at export time), หน้าปัจจุบัน = the page the table shows. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        scope={{ totalCount: total, pageCount: projectRows.length }}
        onExportPdf={async (scope) => {
          const rows = scope === 'page' ? projectRows : await fetchAllProjects()
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Settings_Projects_Report',
            title: 'รายงานรายชื่อโครงการ (Project Management)',
            filterNote: exportFilterNote,
            columns: PROJECT_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows,
          })
        }}
        onExportExcel={async (scope) => {
          const rows = scope === 'page' ? projectRows : await fetchAllProjects()
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Settings_Projects_Report',
            sheetName: 'Projects',
            title: 'รายงานรายชื่อโครงการ (Project Management)',
            filterNote: exportFilterNote,
            columns: PROJECT_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows,
          })
        }}
      />
    </div>
  )
}

export default React.memo<Props>(NewProjectSection)
