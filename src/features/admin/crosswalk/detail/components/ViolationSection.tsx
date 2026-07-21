"use client"
import React, { useMemo, useState, useCallback } from 'react'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import {
  FormSearchViolation,
  ViolationStatCard,
  TableViolationData,
  CCTVViolationData,
} from '../components'
import SearchBar, { ViewMode } from '@/components/searchable/SearchBar'
import ExportFileModal from '@/components/export/ExportFileModal'
import { defaultViolationFilter, type ViolationFilter } from './sections/violation/filter'
import { STATUS_OPTIONS } from './sections/violation/FormSearchViolation'
import { parseViolationTimestamp, useViolationRows } from './sections/violation/useViolationRows'
import { useCrosswalkCameras } from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../context'
import type { CrosswalkViolationRow } from '@/types/crosswalk/detail-api'

// `BBBB` (Buddhist-Era year) in the export's date-range filter note.
dayjs.extend(buddhistEra)

interface Props { }

/** Violation row + its resolved IP — the export mirrors the on-screen IP
 *  fallback chain (cameras-list ip_address → camera.sta → '-'). */
type ExportViolationRow = CrosswalkViolationRow & { ip: string }

// Excel export columns — SAME columns, SAME order as the on-screen
// TableViolationData; the ภาพเหตุการณ์ column exports its image URL (Excel
// can't embed images). Backend pre-formats `timestamp` as "DD/MM/BBBB HH:mm"
// (Thai BE year) — exported as-is. `width` = Excel chars. The PDF export is
// card-based (`entries` block), not a table, so no widthPct here.
const VIOLATION_EXPORT_COLUMNS: {
  header: string
  width: number
  value: (row: ExportViolationRow, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, value: (_r, i) => i + 1 },
  { header: 'วันที่และเวลา', width: 18, value: (r) => r.crosswalk.timestamp || '-' },
  { header: 'ประเภทเหตุการณ์', width: 22, value: (r) => r.crosswalk.name_th || '-' },
  { header: 'กล้อง', width: 42, value: (r) => r.camera.name || '-' },
  { header: 'IP Address', width: 16, value: (r) => r.ip },
  { header: 'ภาพเหตุการณ์', width: 50, value: (r) => r.image_path || '-' },
]

const ViolationSection: React.FC<Props> = () => {
  const deptId = useDeptId()
  const { id } = useDetailContext()
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [filter, setFilter] = useState<ViolationFilter>(() => defaultViolationFilter())
  const [exportOpen, setExportOpen] = useState(false)

  const handleFilterChange = useCallback(
    (patch: Partial<ViolationFilter>) => {
      setFilter((prev) => ({ ...prev, ...patch }))
    },
    [],
  )

  // Full filtered violation set (all pages). The table/grid children own
  // their pagination locally (and independently per view), so the export
  // prints the WHOLE set matching the active filter — the same set the stat
  // cards count. Shares the children's infinite-query cache; the pageSize
  // arg only shapes the unused pageRows slice.
  const { allRows } = useViolationRows(filter, 10)

  // Same IP fallback the table/grid render: cameras-list ip_address (single
  // cached request shared with the OVERALL tab) → camera.sta → '-'.
  const { data: camerasData } = useCrosswalkCameras(deptId, { solution_id: id })
  const exportRows = useMemo<ExportViolationRow[]>(() => {
    const ipByCameraId = new Map<string, string | undefined>()
    for (const c of camerasData?.cameras ?? []) ipByCameraId.set(c.id, c.ip_address)
    return allRows.map((r) => ({ ...r, ip: ipByCameraId.get(r.camera.id) || r.camera.sta || '-' }))
  }, [allRows, camerasData])

  // Human-readable note of the active filters — printed in the export header
  // so a reader knows the date window / violation type of this set.
  const exportNote = useMemo(() => {
    const parts: string[] = [
      filter.startDate && filter.endDate
        ? `ช่วงวันที่ ${dayjs(filter.startDate).format('DD/MM/BBBB')} - ${dayjs(filter.endDate).format('DD/MM/BBBB')}`
        : 'ช่วงเวลา ทั้งหมด',
    ]
    if (filter.status !== 'ALL') {
      const statusLabel = STATUS_OPTIONS.find((s) => s.value === filter.status)?.label
      if (statusLabel) parts.push(`สถานะ ${statusLabel}`)
    }
    return parts.join(' · ')
  }, [filter])

  // PDF = photo cards mirroring the on-screen violation cards (snapshot +
  // ประเภทเหตุการณ์ + วันเวลา + camera fields). Snapshots are pre-fetched and
  // re-encoded (utils/export/image.ts); any image that fails just renders its
  // card photo-less.
  const handleExportPdf = async () => {
    const [{ exportReportPdf }, { fetchImageAsDataUrl }] = await Promise.all([
      import('@/utils/export/pdf'),
      import('@/utils/export/image'),
    ])
    const images = await Promise.all(exportRows.map((r) => fetchImageAsDataUrl(r.image_path)))
    await exportReportPdf({
      filenameBase: 'Crosswalk_Violations_Report',
      title: 'รายงานการฝ่าฝืนสัญญาณไฟทางข้าม (Crosswalk Violations)',
      subtitleNote: exportNote,
      blocks: [
        {
          type: 'entries',
          title: 'ตารางข้อมูลการฝ่าฝืนสัญญาณไฟทางข้าม',
          items: exportRows.map((r, i) => {
            const { date, time } = parseViolationTimestamp(r.crosswalk.timestamp)
            return {
              image: images[i],
              heading: r.crosswalk.name_th,
              subheading: time ? `${date} ${time} น.` : date,
              fields: [
                { label: 'กล้อง', value: r.camera.name || '-' },
                { label: 'IP Address', value: r.ip },
              ],
            }
          }),
        },
      ],
    })
  }

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableViolationData filter={filter} />
      case 'GRID':
        return <CCTVViolationData filter={filter} />
      default:
        return null
    }
  }, [displayType, filter])

  return (
    <div>
      <section>
        <FormSearchViolation value={filter} onChange={handleFilterChange} />
      </section>
      <section className='mt-5'>
        <ViolationStatCard filter={filter} />
      </section>
      <section className='mt-5'>
        <SearchBar
          mode='title'
          title='ตารางข้อมูลการฝ่าฝืนสัญญาณไฟทางข้าม'
          onViewModeChange={setDisplayType}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* นำออกเอกสาร — PDF = photo cards (snapshot ต่อเหตุการณ์), Excel = flat
          table with the same columns as TableViolationData. Both export the
          FULL set matching the active filter (every page). */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportRows.length}
        onExportPdf={handleExportPdf}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Crosswalk_Violations_Report',
            sheetName: 'Crosswalk Violations',
            columns: VIOLATION_EXPORT_COLUMNS,
            rows: exportRows,
          })
        }}
      />

      <section className='mt-5'>{renderContent}</section>
    </div>
  )
}

export default React.memo<Props>(ViolationSection)
