"use client"
import React, { useCallback, useState } from 'react'
import { App, Empty } from 'antd'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'
import ExportFileModal from '@/components/export/ExportFileModal'
import { ContactInfoDialog } from '@/features/admin/settings/overall/components/new-contact/ModalContactInfo'
import { useContractorById, useProjectDeviceStatusList } from '@/hooks/queries/manage'
import { getProjectDeviceStatusListAPI } from '@/services/routes/ManageService'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import type { ProjectDeviceStatusRow } from '@/types/manage/device-status-api'
import DeviceStatusRings from '../components/DeviceStatusRings'
import ProjectLiveModal from '../components/ProjectLiveModal'
import ProjectStatusTable from '../components/ProjectStatusTable'
import SummaryHeader from '../components/SummaryHeader'
import { WARRANTY_FILTER_OPTIONS, warrantyParam, type WarrantyFilter } from '../data/deviceStatus'
import { exportSummaryExcel, exportSummaryPdf, type SummaryExportInput } from '../data/exportSummary'
import { useContractorDeviceRings } from '../hooks/useContractorDeviceRings'

interface Props {
  /** The contractor's user_id. */
  id: string
}

const EXPORT_PAGE_LIMIT = 100

/** Every project under the current filter, for นำออกเอกสาร's ทั้งหมด. */
const fetchAllProjects = async (contractorUserId: string, isWarranty: boolean | undefined) => {
  const rows: ProjectDeviceStatusRow[] = []
  for (let page = 1; ; page++) {
    const { data } = await getProjectDeviceStatusListAPI({
      contractor_id: contractorUserId,
      is_warranty: isWarranty,
      page,
      limit: EXPORT_PAGE_LIMIT,
    })
    const pageRows = data.res_data ?? []
    rows.push(...pageRows)
    if (pageRows.length < EXPORT_PAGE_LIMIT || page >= (data.meta_data?.total_pages ?? page)) return rows
  }
}

/** สรุปข้อมูลผู้รับจ้าง — reached from the ผู้รับจ้าง tab (user 2026-09-30):
 *  the contractor's device status across every project (one ring per system),
 *  then the projects one by one, each opening its cameras live. */
const ContractorSummaryScreen: React.FC<Props> = ({ id }) => {
  const dispatch = useAppDispatch()
  const { message } = App.useApp()

  const contractorQuery = useContractorById(id)
  const contractor = contractorQuery.data ?? null
  const { rings, isLoading: isRingsLoading, isError: isRingsError } = useContractorDeviceRings(contractor)

  const [warranty, setWarranty] = useState<WarrantyFilter>('all')
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
    const warrantyLabel = WARRANTY_FILTER_OPTIONS.find((option) => option.value === warranty)?.label ?? 'ทั้งหมด'
    const projects = scope === 'page' ? rows : await fetchAllProjects(id, warrantyParam(warranty))
    return { companyName: contractor.company_name, shortName: contractor.short_name, warrantyLabel, rings, projects }
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
        <DeviceStatusRings rings={rings} isLoading={isRingsLoading} isError={isRingsError} />
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
          time; หน้าปัจจุบัน = the page on screen. The rings go in either way. */}
      <ExportFileModal
        open={isExportOpen}
        onClose={() => setExportOpen(false)}
        scope={{ totalCount: total, pageCount: rows.length }}
        onExportPdf={runExport(exportSummaryPdf)}
        onExportExcel={runExport(exportSummaryExcel)}
      />
      <ProjectLiveModal project={liveProject} onClose={() => setLiveProject(null)} />
      <ProjectInfoModal />
      {/* Last, so a camera opened from the Live Stream modal sits above it. */}
      <CCTVModal />
    </div>
  )
}

export default React.memo<Props>(ContractorSummaryScreen)
