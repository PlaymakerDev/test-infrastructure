"use client"
import React, { useCallback, useState } from 'react'
import { App, Empty } from 'antd'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'
import ExportFileModal from '@/components/export/ExportFileModal'
import { SHOW_ALL_CONTRACTORS_EXPORT } from '@/constants/featureFlags'
import { ContactInfoDialog } from '@/features/admin/settings/overall/components/new-contact/ModalContactInfo'
import { useContractorById, useProjectDeviceStatusList } from '@/hooks/queries/manage'
import {
  getProjectDeviceSolutionsListAPI,
  getProjectDeviceSummaryListAPI,
  getProjectListAPI,
} from '@/services/routes/ManageService'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import type { ProjectDeviceStatusRow } from '@/types/manage/device-status-api'
import DeviceStatusRings from '../components/DeviceStatusRings'
import ProjectLiveModal from '../components/ProjectLiveModal'
import ProjectStatusTable from '../components/ProjectStatusTable'
import SummaryHeader from '../components/SummaryHeader'
import { allContractorsReport } from '../data/allContractors'
import { WARRANTY_FILTER_OPTIONS, warrantyParam, type WarrantyFilter } from '../data/deviceStatus'
import { exportSummaryExcel, exportSummaryPdf, summaryForProjects, type SummaryExportInput } from '../data/exportSummary'
import { useAllContractorsProjects } from '../hooks/useAllContractorsProjects'
import { useContractorDeviceRings } from '../hooks/useContractorDeviceRings'

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

/** สรุปข้อมูลผู้รับจ้าง — reached from the ผู้รับจ้าง tab (user 2026-09-30):
 *  the contractor's device status across every project (one ring per system),
 *  then the projects one by one, each opening its cameras live. */
const ContractorSummaryScreen: React.FC<Props> = ({ id }) => {
  const dispatch = useAppDispatch()
  const { message } = App.useApp()

  const contractorQuery = useContractorById(id)
  const contractor = contractorQuery.data ?? null

  // ทั้งหมด / ในค้ำ / หมดค้ำ governs both the rings and the table.
  const [warranty, setWarranty] = useState<WarrantyFilter>('all')
  const { rings, isLoading: isRingsLoading, isError: isRingsError } = useContractorDeviceRings(contractor, warranty)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const listQuery = useProjectDeviceStatusList({
    contractor_id: id,
    is_warranty: warrantyParam(warranty),
    page,
    limit: pageSize,
  })
  const rows = listQuery.data?.res_data ?? []
  const total = listQuery.data?.meta_data?.count ?? 0

  const [liveProject, setLiveProject] = useState<ProjectDeviceStatusRow | null>(null)
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

  const onPageChange = useCallback((nextPage: number, nextPageSize: number) => {
    setPage(nextPageSize === pageSize ? nextPage : 1)
    setPageSize(nextPageSize)
  }, [pageSize])

  const onOpenProjectInfo = useCallback((row: ProjectDeviceStatusRow) => {
    dispatch(setProjectInfoModalOpen({ open: true, project_id: row.project_id, road_id: null }))
  }, [dispatch])

  const exportInput = async (scope?: 'all' | 'page'): Promise<SummaryExportInput | null> => {
    if (!contractor) return null
    const query = { contractor_id: id, is_warranty: warrantyParam(warranty) }
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
        />
      </div>
      <div className='mt-10 px-4 sm:px-8 lg:px-18'>
        <DeviceStatusRings rings={rings} isLoading={isRingsLoading} isError={isRingsError} warranty={warranty} />
      </div>
      <div className='mt-14 px-4 sm:px-8 lg:px-18 pb-10'>
        <ProjectStatusTable
          rows={rows}
          total={total}
          page={page}
          pageSize={pageSize}
          isLoading={listQuery.isLoading || listQuery.isPlaceholderData}
          isError={listQuery.isError}
          warranty={warranty}
          onWarrantyChange={onWarrantyChange}
          onPageChange={onPageChange}
          onOpenLive={setLiveProject}
          onOpenProjectInfo={onOpenProjectInfo}
        />
      </div>

      <ContactInfoDialog open={isInfoOpen} data={contractor} onClose={() => setInfoOpen(false)} />
      {/* ทั้งหมด = every project under the current filter, fetched at export
          time; หน้าปัจจุบัน = the page on screen. The rings (under the same
          filter) go in either way. รวมผู้รับจ้าง (SHOW_ALL_CONTRACTORS_EXPORT)
          = every contractor's expired-warranty projects, whatever the filter,
          less those with no warranty end date. */}
      <ExportFileModal
        open={isExportOpen}
        onClose={() => setExportOpen(false)}
        scope={{ totalCount: total, pageCount: rows.length }}
        onExportPdf={runExport(exportSummaryPdf)}
        onExportExcel={runExport(exportSummaryExcel)}
        extraScope={
          SHOW_ALL_CONTRACTORS_EXPORT
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
      <ProjectInfoModal />
      {/* Last, so a camera opened from the Live Stream modal sits above it. */}
      <CCTVModal />
    </div>
  )
}

export default React.memo<Props>(ContractorSummaryScreen)
