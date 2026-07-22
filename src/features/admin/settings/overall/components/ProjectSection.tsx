"use client"
import { Button } from 'antd'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import React, { useMemo, useState } from 'react'
import { TbLayoutGrid, TbList, TbPlus, TbPrinter } from 'react-icons/tb'
import ExportFileModal from '@/components/export/ExportFileModal'
import { useContainerHeight } from '@/hooks/useContainerHeight'
import { useDepartments } from '@/hooks/queries/manage'
import { mapProject, useOverallContext } from '../context'
import { calcTableScrollY } from '../hooks/useTableScrollY'
import type { Project, WarrantyStatus } from '../types/project'
import DeleteProjectModal from './project/DeleteProjectModal'
import FormSearchProject from './project/FormSearchProject'
import ProjectModal from './project/ProjectModal'
import TableProject from './project/TableProject'

dayjs.extend(buddhistEra)

// Text labels mirrored from project/StatusBadge so the export reads exactly
// like the on-screen pills.
const WARRANTY_LABELS: Record<WarrantyStatus, string> = {
  'in-warranty': 'ในค้ำ',
  expired: 'หมดค้ำ',
  delivering: 'ระหว่างส่งมอบ',
}

/** "5 ก.ค. 2569" — same Thai short-month + Buddhist-year format TableProject renders. */
const fmtThaiDate = (iso: string): string => {
  if (!iso) return '-'
  const d = dayjs(iso)
  return d.isValid() ? d.locale('th').format('D MMM BBBB') : iso
}

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as TableProject (minus the จัดการ action column), plus ลำดับ (mirrors
// CCTV_EXPORT_COLUMNS). `width` = Excel chars, `widthPct` = PDF table percent
// (sums to 100).
const PROJECT_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: Project, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 4, value: (_r, i) => i + 1 },
  { header: 'ผู้รับจ้าง', width: 28, widthPct: 13, align: 'left', value: (r) => r.contractor || '-' },
  { header: 'รหัสโครงการ', width: 14, widthPct: 8, value: (r) => r.code || '-' },
  { header: 'ชื่อโครงการ', width: 40, widthPct: 20, align: 'left', value: (r) => r.name || '-' },
  { header: 'ผู้ว่าจ้าง', width: 12, widthPct: 8, value: (r) => r.owner || '-' },
  { header: 'เลขที่สัญญา', width: 18, widthPct: 10, value: (r) => r.contractNo || '-' },
  { header: 'วันที่เริ่มต้นค้ำประกัน', width: 15, widthPct: 13, value: (r) => fmtThaiDate(r.warrantyStart) },
  { header: 'วันที่สิ้นสุดค้ำประกัน', width: 15, widthPct: 13, value: (r) => fmtThaiDate(r.warrantyEnd) },
  { header: 'สถานะการค้ำประกัน', width: 15, widthPct: 11, value: (r) => WARRANTY_LABELS[r.warrantyStatus] },
]

const ProjectSection: React.FC = () => {
  const { viewMode, setViewMode, filtered, filters, total } = useOverallContext()
  // Same cached /departments list the context uses — needed to resolve the
  // owner (ผู้ว่าจ้าง) label when mapping the export-'ทั้งหมด' full fetch.
  const { data: departments } = useDepartments()
  const [projectModal, setProjectModal] = useState<{ open: boolean; editing: Project | null }>({
    open: false,
    editing: null,
  })
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [attachContainer, containerH] = useContainerHeight<HTMLDivElement>()

  // Human-readable note of the active filters/search — printed in the PDF
  // header so a reader knows what subset they're looking at. `search` is
  // applied server-side but still narrows the displayed rows, so it's noted.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    if (filters.budgetYear) parts.push(`ปีงบประมาณ ${filters.budgetYear}`)
    if (filters.owner) parts.push(`ผู้ว่าจ้าง ${filters.owner}`)
    if (filters.contractor) parts.push(`ผู้รับจ้าง ${filters.contractor}`)
    if (filters.search.trim()) parts.push(`ค้นหา "${filters.search.trim()}"`)
    return parts.length ? parts.join(' · ') : undefined
  }, [filters])

  // Export scope 'ทั้งหมด' — fetch EVERY page of the current server-side
  // search at export time (two-step like incident-detection's EventSection:
  // page 1 @100, then refetch at the reported total when it exceeds 100),
  // then apply the same client-side dropdown narrowing the context's
  // `filtered` memo applies to the on-screen page.
  const fetchAllProjects = async (): Promise<Project[]> => {
    const { getProjectsAPI } = await import('@/services/routes/ManageService')
    const search = filters.search.trim() || undefined
    const first = await getProjectsAPI({ page: 1, limit: 100, search })
    const count = first.data?.meta_data?.count ?? 0
    const rows =
      count <= 100
        ? first.data?.res_data ?? []
        : (await getProjectsAPI({ page: 1, limit: count, search })).data?.res_data ?? []
    // Mirrors the dropdown-filter predicate in context's `filtered` memo.
    return rows
      .map((r) => mapProject(r, departments))
      .filter((p) => {
        if (filters.budgetYear && p.budgetYear !== filters.budgetYear) return false
        if (filters.owner && p.owner !== filters.owner) return false
        if (filters.contractor && p.contractor !== filters.contractor) return false
        return true
      })
  }

  const openCreate = () => setProjectModal({ open: true, editing: null })
  const openEdit = (project: Project) => setProjectModal({ open: true, editing: project })
  const closeProject = () => setProjectModal({ open: false, editing: null })

  return (
    <div
      ref={attachContainer}
      className='rounded-2xl p-5 flex flex-col h-full'
      style={{ background: '#191919', border: '1px solid var(--light-gray-2)' }}
    >
      <div className='shrink-0 flex flex-col lg:flex-row lg:items-end gap-4'>
        <div className='flex-1 min-w-0'>
          <FormSearchProject />
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
            เพิ่มโครงการ
          </Button>
          <Button
            size='large'
            shape='circle'
            icon={<TbList size={18} />}
            onClick={() => setViewMode('list')}
            type={viewMode === 'list' ? 'primary' : 'default'}
            ghost={viewMode !== 'list'}
            title='ตาราง'
          />
          <Button
            size='large'
            shape='circle'
            icon={<TbLayoutGrid size={18} />}
            onClick={() => setViewMode('grid')}
            type={viewMode === 'grid' ? 'primary' : 'default'}
            ghost={viewMode !== 'grid'}
            title='กริด'
          />
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
        <TableProject
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          scrollY={calcTableScrollY(containerH)}
        />
      </div>

      {/* นำออกเอกสาร — scope toggle: ทั้งหมด = every project matching the
          current server-side search + client dropdown filters (fetched in
          full at export time), หน้าปัจจุบัน = the rows the table shows. NOTE:
          totalCount is the server total of the current search BEFORE the
          client dropdown filters — the filtered size of the full set isn't
          knowable until the export-time fetch, so the label is an approximate
          upper bound; the exported rows themselves are exact. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        scope={{ totalCount: total, pageCount: filtered.length }}
        onExportPdf={async (scope) => {
          const rows = scope === 'page' ? filtered : await fetchAllProjects()
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
          const rows = scope === 'page' ? filtered : await fetchAllProjects()
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Settings_Projects_Report',
            sheetName: 'Projects',
            columns: PROJECT_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows,
          })
        }}
      />

      <ProjectModal open={projectModal.open} editing={projectModal.editing} onClose={closeProject} />
      <DeleteProjectModal
        open={!!deleteTarget}
        project={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default React.memo(ProjectSection)
