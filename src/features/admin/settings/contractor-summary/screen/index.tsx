"use client"
import React, { useCallback, useMemo, useState } from 'react'
import { App, Empty } from 'antd'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'
import ExportFileModal from '@/components/export/ExportFileModal'
import { SHOW_ALL_CONTRACTORS_EXPORT } from '@/constants/featureFlags'
import { ContactInfoDialog } from '@/features/admin/settings/overall/components/new-contact/ModalContactInfo'
import { useContractorById } from '@/hooks/queries/manage'
import { useUserRole } from '@/hooks/useUserRole'
import {
  getOutOfWarrantyProjectsAPI,
  getProjectDeviceSolutionsListAPI,
  getProjectDeviceSummaryListAPI,
  getProjectListAPI,
} from '@/services/routes/ManageService'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import type { ProjectDeviceStatusBase, ProjectDeviceStatusRow } from '@/types/manage/device-status-api'
import DeviceStatusRings from '../components/DeviceStatusRings'
import OutOfWarrantyModal from '../components/OutOfWarrantyModal'
import ProjectLiveModal from '../components/ProjectLiveModal'
import ProjectStatusTable from '../components/ProjectStatusTable'
import SummaryHeader from '../components/SummaryHeader'
import { allContractorsReport } from '../data/allContractors'
import { WARRANTY_FILTER_OPTIONS, warrantyParam, type WarrantyFilter } from '../data/deviceStatus'
import { exportOutOfWarrantyExcel, exportOutOfWarrantyPdf, type OutOfWarrantyExportInput } from '../data/exportOutOfWarranty'
import { exportSummaryExcel, exportSummaryPdf, summaryForProjects, type SummaryExportInput } from '../data/exportSummary'
import { OUT_OF_WARRANTY_TYPES } from '../data/outOfWarranty'
import { useAllContractorsProjects } from '../hooks/useAllContractorsProjects'
import { useContractorDeviceRings } from '../hooks/useContractorDeviceRings'
import { useContractorStatusRows } from '../hooks/useContractorStatusRows'
import { useOutOfWarrantyProjectIds, useOutOfWarrantyProjects } from '../hooks/useOutOfWarranty'

interface Props {
  /** The contractor's user_id. */
  id: string
}

const EXPORT_PAGE_LIMIT = 100

/** Every page of a project listing under the current filter, for
 *  นำออกเอกสาร (the listings cap `limit` at 100). */
const fetchAllPages = async <Row, Query extends { page?: number; limit?: number }>(
  fetchPage: (query: Query) => Promise<{ data: { res_data: Row[] | null; meta_data?: { total_pages?: number } } }>,
  query: Query,
) => {
  const rows: Row[] = []
  for (let page = 1; ; page++) {
    const { data } = await fetchPage({ ...query, page, limit: EXPORT_PAGE_LIMIT })
    const pageRows = data.res_data ?? []
    rows.push(...pageRows)
    if (pageRows.length < EXPORT_PAGE_LIMIT || page >= (data.meta_data?.total_pages ?? page)) return rows
  }
}

const warrantyLabelOf = (filter: WarrantyFilter) =>
  WARRANTY_FILTER_OPTIONS.find((option) => option.value === filter)?.label ?? 'ทั้งหมด'

/** The รวมผู้รับจ้าง export's name, in its title and file name. */
const ALL_CONTRACTORS = 'รวมผู้รับจ้าง'
/** รวมผู้รับจ้าง is always the expired-warranty projects (is_warranty=false),
 *  whatever the page's own filter (user 2026-10-29). */
const ALL_CONTRACTORS_WARRANTY: WarrantyFilter = 'out'

const NO_IDS: ReadonlySet<number> = new Set()

/** นอกเหนือการรับประกัน's export button (user 2026-11-16) — a report of its own. */
const EXCLUDED_EXPORT_LABEL = 'นำออกเอกสารนอกเหนือการรับประกัน'

/** สรุปข้อมูลผู้รับจ้าง — reached from the ผู้รับจ้าง tab (user 2026-09-30):
 *  the contractor's device status across every project (one ring per system),
 *  then the projects one by one, each opening its cameras live. */
const ContractorSummaryScreen: React.FC<Props> = ({ id }) => {
  const dispatch = useAppDispatch()
  const { message } = App.useApp()
  const { isAdmin, isContractor } = useUserRole()
  const canRecord = isAdmin || isContractor

  const contractorQuery = useContractorById(id)
  const contractor = contractorQuery.data ?? null

  // ทั้งหมด / นอกเหนือการรับประกัน / ในค้ำ / หมดค้ำ governs both the rings and the table.
  const [warranty, setWarranty] = useState<WarrantyFilter>('all')
  const excluded = warranty === 'excluded'
  const { rings, isLoading: isRingsLoading, isError: isRingsError } = useContractorDeviceRings(contractor, warranty)
  // ค้นหาโครงการ (user 2026-11-04) — the table only: project_name /
  // contract_no on the backend; the rings stay the contractor's every project.
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const listParams = { contractor_id: id, search: search || undefined, page, limit: pageSize }
  const status = useContractorStatusRows({ ...listParams, is_warranty: warrantyParam(warranty) }, !excluded)
  // นอกเหนือการรับประกัน: the projects with records, as the backend filters them.
  const excludedQuery = useOutOfWarrantyProjects(listParams, excluded)
  const rows = status.rows
  const excludedRows = excludedQuery.data?.res_data ?? []
  const total = excluded ? excludedQuery.data?.meta_data?.count ?? 0 : status.total
  const pageRowCount = excluded ? excludedRows.length : rows.length
  const isTableLoading = excluded ? excludedQuery.isLoading || excludedQuery.isPlaceholderData : status.isLoading || status.isPlaceholderData
  const isTableError = excluded ? excludedQuery.isError : status.isError
  // Every project with a record — blue whatever the tab.
  const recordedIds = useOutOfWarrantyProjectIds(id).data ?? NO_IDS
  // Both tables' columns (user 2026-11-17): CCTV, VMS and Street Light always,
  // Traffic Signal, Bridge Lighting, Crosswalk and Tunnel when the contractor
  // has them — the seven types นอกเหนือการรับประกัน records.
  const tableTypes = useMemo(
    () => OUT_OF_WARRANTY_TYPES.filter((type) =>
      ['cctv', 'vms', 'lighting'].includes(type.key) || rings.some((ring) => ring.system.key === type.key)),
    [rings],
  )

  const [liveProject, setLiveProject] = useState<ProjectDeviceStatusRow | null>(null)
  const [outOfWarrantyProject, setOutOfWarrantyProject] = useState<ProjectDeviceStatusBase | null>(null)
  const [isInfoOpen, setInfoOpen] = useState(false)
  const [isExportOpen, setExportOpen] = useState(false)
  // รวมผู้รับจ้าง's projects, for its count — read once the dialog opens.
  const allContractorsProjects = useAllContractorsProjects(
    warrantyParam(ALL_CONTRACTORS_WARRANTY),
    SHOW_ALL_CONTRACTORS_EXPORT && isExportOpen,
  )

  const onWarrantyChange = useCallback((value: WarrantyFilter) => {
    setWarranty(value)
    setPage(1)
  }, [])

  const onSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const onPageChange = useCallback((nextPage: number, nextPageSize: number) => {
    setPage(nextPageSize === pageSize ? nextPage : 1)
    setPageSize(nextPageSize)
  }, [pageSize])

  const onOpenProjectInfo = useCallback((project: ProjectDeviceStatusBase) => {
    dispatch(setProjectInfoModalOpen({ open: true, project_id: project.project_id, road_id: null }))
  }, [dispatch])

  const exportInput = async (scope?: 'all' | 'page'): Promise<SummaryExportInput | null> => {
    if (!contractor) return null
    // The table's filters, its search included (the rings follow the warranty only).
    const query = { contractor_id: id, is_warranty: warrantyParam(warranty), search: search || undefined }
    const [summary, solutions, projectSolutions] = await Promise.all([
      // All of it either way: the summary can list a project the page's table
      // doesn't, so its pages don't line up with the table's.
      fetchAllPages(getProjectDeviceSummaryListAPI, query),
      // The same projects' devices, system by system — the โครงการ sheet.
      fetchAllPages(getProjectDeviceSolutionsListAPI, query),
      // The Solutions each project is set up with — the โครงการ sheet's boxes.
      fetchAllPages(getProjectListAPI, { contractor_id: id }),
    ])
    return {
      companyName: contractor.company_name,
      shortName: contractor.short_name,
      warrantyLabel: warrantyLabelOf(warranty),
      search: search || undefined,
      rings,
      summary: scope === 'page' ? summaryForProjects(summary, rows) : summary,
      solutions,
      projectSolutions,
    }
  }

  /** รวมผู้รับจ้าง (user 2026-10-29): the same report over every contractor's
   *  projects the account can see — the same endpoints, without contractor_id —
   *  their expired-warranty ones only (ALL_CONTRACTORS_WARRANTY), less the
   *  projects with no warranty end date; its rings counted from the rest. */
  const allContractorsInput = async (): Promise<SummaryExportInput> => {
    const query = { is_warranty: warrantyParam(ALL_CONTRACTORS_WARRANTY) }
    const [summary, solutions, projectSolutions] = await Promise.all([
      fetchAllPages(getProjectDeviceSummaryListAPI, query),
      fetchAllPages(getProjectDeviceSolutionsListAPI, query),
      fetchAllPages(getProjectListAPI, {}),
    ])
    return {
      companyName: ALL_CONTRACTORS,
      shortName: ALL_CONTRACTORS,
      warrantyLabel: warrantyLabelOf(ALL_CONTRACTORS_WARRANTY),
      ...allContractorsReport(summary, solutions),
      projectSolutions,
      allContractors: true,
    }
  }

  /** นอกเหนือการรับประกัน's report: the tab's rings, and the projects with
   *  records — every page under the search, or the page on screen — from
   *  GET /out-of-warranty, each with its recorded devices. */
  const excludedExportInput = async (scope?: 'all' | 'page'): Promise<OutOfWarrantyExportInput | null> => {
    if (!contractor) return null
    const projects = scope === 'page'
      ? excludedRows
      : await fetchAllPages(getOutOfWarrantyProjectsAPI, { contractor_id: id, search: search || undefined })
    return {
      companyName: contractor.company_name,
      shortName: contractor.short_name,
      search: search || undefined,
      rings,
      projects,
      types: tableTypes,
    }
  }

  const runExcludedExport = (exporter: (input: OutOfWarrantyExportInput) => Promise<void>) => async (scope?: 'all' | 'page') => {
    try {
      const input = await excludedExportInput(scope)
      if (input) await exporter(input)
    } catch (error) {
      message.error('นำออกเอกสารไม่สำเร็จ กรุณาลองอีกครั้ง')
      throw error
    }
  }

  const runExport = (exporter: (input: SummaryExportInput) => Promise<void>) => async (scope?: 'all' | 'page') => {
    try {
      const input = await exportInput(scope)
      if (input) await exporter(input)
    } catch (error) {
      message.error('นำออกเอกสารไม่สำเร็จ กรุณาลองอีกครั้ง')
      throw error
    }
  }

  const runAllContractors = (exporter: (input: SummaryExportInput) => Promise<void>) => async () => {
    try {
      await exporter(await allContractorsInput())
    } catch (error) {
      message.error('นำออกเอกสารไม่สำเร็จ กรุณาลองอีกครั้ง')
      throw error
    }
  }

  if (contractorQuery.isSuccess && !contractor) {
    return (
      <div className='main-screen py-20'>
        <Empty description={<span className='fs-12'>ไม่พบข้อมูลผู้รับจ้าง</span>} />
      </div>
    )
  }

  return (
    <div className='main-screen'>
      <div className='px-4 sm:px-8'>
        <SummaryHeader
          contractor={contractor}
          isLoading={contractorQuery.isLoading}
          onOpenInfo={() => setInfoOpen(true)}
          onExport={() => setExportOpen(true)}
          exportLabel={excluded ? EXCLUDED_EXPORT_LABEL : undefined}
        />
      </div>
      <div className='mt-10 px-4 sm:px-8 lg:px-18'>
        <DeviceStatusRings rings={rings} isLoading={isRingsLoading} isError={isRingsError} warranty={warranty} />
      </div>
      <div className='mt-14 px-4 sm:px-8 lg:px-18 pb-10'>
        <ProjectStatusTable
          rows={rows}
          excludedRows={excludedRows}
          types={tableTypes}
          total={total}
          page={page}
          pageSize={pageSize}
          isLoading={isTableLoading}
          isError={isTableError}
          warranty={warranty}
          onWarrantyChange={onWarrantyChange}
          search={search}
          onSearchChange={onSearchChange}
          onPageChange={onPageChange}
          onOpenLive={setLiveProject}
          onOpenProjectInfo={onOpenProjectInfo}
          recordedIds={recordedIds}
          canRecord={canRecord}
          onOpenOutOfWarranty={setOutOfWarrantyProject}
        />
      </div>

      <ContactInfoDialog open={isInfoOpen} data={contractor} onClose={() => setInfoOpen(false)} />
      {/* ทั้งหมด = every project under the current filter, fetched at export
          time; หน้าปัจจุบัน = the page on screen. The rings (under the same
          filter) go in either way. รวมผู้รับจ้าง (SHOW_ALL_CONTRACTORS_EXPORT)
          = every contractor's expired-warranty projects, whatever the filter,
          less those with no warranty end date — not offered under
          นอกเหนือการรับประกัน, whose report is its own. */}
      <ExportFileModal
        open={isExportOpen}
        onClose={() => setExportOpen(false)}
        scope={{ totalCount: total, pageCount: pageRowCount }}
        onExportPdf={excluded ? runExcludedExport(exportOutOfWarrantyPdf) : runExport(exportSummaryPdf)}
        onExportExcel={excluded ? runExcludedExport(exportOutOfWarrantyExcel) : runExport(exportSummaryExcel)}
        extraScope={
          SHOW_ALL_CONTRACTORS_EXPORT && !excluded
            ? {
                label: ALL_CONTRACTORS,
                count: allContractorsProjects.data?.length,
                note: `ผู้รับจ้างทุกราย · เฉพาะโครงการ${warrantyLabelOf(ALL_CONTRACTORS_WARRANTY)} ไม่รวมโครงการที่ไม่มีวันค้ำประกัน`,
                onExportPdf: runAllContractors(exportSummaryPdf),
                onExportExcel: runAllContractors(exportSummaryExcel),
              }
            : undefined
        }
      />
      <ProjectLiveModal project={liveProject} onClose={() => setLiveProject(null)} />
      <OutOfWarrantyModal
        project={outOfWarrantyProject}
        onClose={() => setOutOfWarrantyProject(null)}
        onOpenProjectInfo={onOpenProjectInfo}
      />
      {/* After the two modals above, so its ⓘ opens on top of them. */}
      <ProjectInfoModal />
      {/* Last, so a camera opened from the Live Stream modal sits above it. */}
      <CCTVModal />
    </div>
  )
}

export default React.memo<Props>(ContractorSummaryScreen)
