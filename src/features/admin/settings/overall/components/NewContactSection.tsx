"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ContentContactList,
  FormSearchContact,
  ModalContactInfo,
  ModalCreateContact,
  ModalConfirmDeleteContact,
} from '../components'
import { App, Empty, Skeleton } from 'antd'
import { getExportContractorAPI } from '@/services/routes/ManageService'
import ExportFileModal from '@/components/export/ExportFileModal'
import {
  useContractorListInfinite,
  useDeleteContractor,
} from '@/hooks/queries/manage'
import { useAppDispatch } from '@/stores/hooks'
import { resetContactModalData } from '@/stores/reducers/modal/customModalSlice'
import type {
  APIResponseContractorList,
  ContractorData,
} from '@/types/manage/contractor-api'
import type { Contractor } from '../types/contractor'
import { AxiosError } from 'axios'
import dayjs from 'dayjs'

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

  const [exportOpen, setExportOpen] = useState(false)

  const dispatch = useAppDispatch()
  const { mutate: deleteContractor, isPending: isDeletePending } = useDeleteContractor()

  // onScroll pagination — a search-term change swaps the query key (search
  // is part of manageKeys.contractors.listInfinite) so TanStack starts a
  // fresh page-1 fetch under the hood; no page/limit state to reset by hand.
  const {
    data: infiniteData,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useContractorListInfinite({ limit: 10, search })

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
  }, [])

  // Flatten every fetched page into one list — the render tree below still
  // only ever sees a single APIResponseContractorList, same shape useQuery
  // used to hand it.
  const pages = useMemo(() => infiniteData?.pages ?? [], [infiniteData])
  const allRows = useMemo(() => pages.flatMap((p) => p.res_data), [pages])
  const metaData = pages[0]?.meta_data
  const total = metaData?.count ?? 0
  const data: APIResponseContractorList | undefined = useMemo(
    () =>
      infiniteData
        ? { res_data: allRows, meta_data: metaData ?? { count: 0, page: 1, limit: 10, total_pages: 0 } }
        : undefined,
    [infiniteData, allRows, metaData],
  )

  // Sentinel at the bottom of the list — scrolling it into view loads the
  // next page, replacing the old page-number AppPagination control.
  const loadMoreRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !hasNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // ── Export ──────────────────────────────────────────────────────────────
  // Every row loaded so far (i.e. scrolled into view) mapped to the shared UI
  // shape — feeds the 'page' export scope and the ExportFileModal's pageCount.
  const contractors = useMemo<Contractor[]>(() => allRows.map(toContractor), [allRows])

  // ── Delete ──────────────────────────────────────────────────────────────
  const onDeleteContactData = useCallback((id: string) => {
    deleteContractor(id, {
      onSuccess: () => {
        message.success('ลบผู้รับจ้างสำเร็จ')
        dispatch(resetContactModalData())
      },
      onError: (error) => {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการลบผู้รับจ้าง'))
      },
    })
  }, [deleteContractor, dispatch, message])

  const onExportXlsx = useCallback(async () => {
    try {
      const response = await getExportContractorAPI({ format: 'xlsx' }, 'blob')
      // 1. Create a local URL for the binary platform object (Blob)
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // 2. Create a temporary hidden anchor element
      const link = document.createElement('a');
      link.href = url;

      // 3. Define the filename the user will see
      link.setAttribute('download', `Settings_Contractors_Report_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);

      // 4. Append to the DOM, trigger the click, and clean up
      document.body.appendChild(link);
      link.click();
      link.remove();

      // 5. Clean up the memory allocated to the Object URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (error instanceof AxiosError) {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการส่งออกไฟล์'))
      } else {
        console.log(readErrorMessage(error, 'เกิดข้อผิดพลาดในการส่งออกไฟล์'))
      }
    }
  }, [message])

  // The backend only renders a report as HTML — there is no native PDF
  // output — so "export PDF" opens that HTML in a new tab and lets the user
  // print it themselves (Ctrl/Cmd+P → Save as PDF) instead of auto-opening
  // the print preview. This keeps the report as real, selectable, Thai-safe
  // text (the browser's own print engine renders it) instead of trying to
  // smuggle raw HTML bytes into a mislabeled .pdf download, which would not
  // open in any PDF viewer.
  const onExportPDF = useCallback(async () => {
    try {
      const response = await getExportContractorAPI({ format: 'html' }, 'blob')
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: 'text/html;charset=utf-8' }),
      )

      const reportWindow = window.open(url, '_blank')
      if (!reportWindow) {
        message.error('เบราว์เซอร์บล็อกการเปิดแท็บใหม่ กรุณาอนุญาต pop-up สำหรับเว็บไซต์นี้')
        window.URL.revokeObjectURL(url)
        return
      }

      // Wait for the report to actually finish loading before alerting —
      // alerting immediately blocks the new tab's own rendering, so the user
      // would see the alert pop up over a still-blank page. The alert also
      // runs on reportWindow itself so it appears attached to that tab, not
      // the settings page underneath.
      reportWindow.onload = () => {
        reportWindow.alert('กด Print (Ctrl/Cmd+P) แล้วเลือก "Save as PDF" เพื่อบันทึกเป็น PDF')
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการส่งออกไฟล์'))
      } else {
        console.log(readErrorMessage(error, 'เกิดข้อผิดพลาดในการส่งออกไฟล์'))
      }
    }
  }, [message])

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={true} active />
    if (isError) {
      return (
        <div className="block m-auto py-18">
          <Empty description="เกิดข้อผิดพลาด" />
        </div>
      )
    }
    if (!data?.res_data || data.res_data.length === 0) return (
      <div className="block m-auto py-18">
        <Empty description="ไม่มีข้อมูลผู้ติดต่อ" />
      </div>
    )
    return (
      <ContentContactList
        type={type}
        data={data}
        isLoading={isLoading}
        isError={isError}
      />
    )
  }, [isLoading, isError, data, type])

  return (
    <div>
      <section>
        <FormSearchContact
          data={data}
          type={type}
          setType={setType}
          search={search}
          setSearch={handleSearchChange}
          onExport={() => setExportOpen(true)}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
      {/* onScroll pagination — this sentinel is the last thing in the list;
          IntersectionObserver above fires fetchNextPage() once it scrolls
          into view. Replaces the old page-number AppPagination control. */}
      {hasNextPage && (
        <div ref={loadMoreRef} className='flex justify-center items-center py-5'>
          <Skeleton.Button active={isFetchingNextPage} size='small' style={{ width: 120 }} />
        </div>
      )}

      <ModalContactInfo />

      <ModalCreateContact />
      <ModalConfirmDeleteContact onDelete={onDeleteContactData} isPending={isDeletePending} />

      {/* นำออกเอกสาร — same scope toggle + column set as ContactSection:
          ทั้งหมด = every contractor matching the current search (fetched in
          full at export time), หน้าปัจจุบัน = the page this screen shows. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        // scope={{ totalCount: total, pageCount: contractors.length }}
        onExportPdf={() => onExportPDF()}
        onExportExcel={() => onExportXlsx()}
      />
    </div>
  )
}

export default React.memo<Props>(NewContactSection)
