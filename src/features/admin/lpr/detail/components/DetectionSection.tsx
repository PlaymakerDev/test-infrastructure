"use client"
import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { Table, Button, ConfigProvider, Empty, Input, DatePicker } from 'antd'
import thTH from 'antd/locale/th_TH'
import type { ColumnsType } from 'antd/es/table'
import { TbSearch, TbCamera, TbCalendar } from 'react-icons/tb'
import SearchBar from '@/components/searchable/SearchBar'
import ExportFileModal from '@/components/export/ExportFileModal'
import { useLPRPointPlates } from '@/hooks/queries/lpr'
import type { LPRPointPlate, LPRSource } from '@/types/lpr/lpr-api'
import { useLPRDetailContext } from '../context'
import PlateDetailModal from './PlateDetailModal'

dayjs.extend(relativeTime)
dayjs.extend(buddhistEra)

const { RangePicker } = DatePicker

const SOURCE_LABEL: Record<LPRSource, string> = { anpr: 'ANPR', wim: 'WIM' }
const SOURCE_COLOR: Record<LPRSource, string> = {
  anpr: '#66AEFF',
  wim: '#B57BFF',
}

// ── นำออกเอกสาร ──────────────────────────────────────────────────────────────
// Export columns — SAME data, SAME order as the on-screen table, shared by
// Excel and PDF (app-wide convention). The on-screen composite cells are
// flattened: ทะเบียน splits into ทะเบียน/จังหวัด, ประเภทรถ into ประเภทรถ/
// ยี่ห้อ·สี. ภาพป้ายทะเบียน: Excel exports the image URL (xlsx can't embed);
// the PDF overrides this column per-export to embed the actual crop
// (PdfColumn.image — same pattern as crosswalk's ViolationSection). `width` =
// Excel chars; `widthPct` = PDF column % (sums to 100, date-time ≥13).
// The ความเร็ว column mirrors the on-screen rule (hidden when no exported row
// has a real reading — ANPR-only sites), so the set is built per-export.
const buildExportColumns = (hasSpeed: boolean): {
  header: string
  width: number
  widthPct: number
  value: (row: LPRPointPlate, index: number) => string | number
}[] => [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  {
    header: 'วันที่และเวลา',
    width: 20,
    widthPct: 13,
    value: (r) => {
      const d = dayjs(r.captured_at)
      return d.isValid() ? d.format('DD/MM/BBBB HH:mm:ss') : r.captured_at
    },
  },
  { header: 'ทะเบียน', width: 14, widthPct: 9, value: (r) => r.plate_number || '-' },
  { header: 'จังหวัด', width: 16, widthPct: 10, value: (r) => r.plate_province || '-' },
  { header: 'ประเภทรถ', width: 18, widthPct: 12, value: (r) => r.vehicle_type_name || '-' },
  {
    header: 'ยี่ห้อ/สี',
    width: 18,
    widthPct: 10,
    value: (r) =>
      [r.vehicle_brand, r.vehicle_color !== '-' ? r.vehicle_color : null].filter(Boolean).join(' · ') || '-',
  },
  ...(hasSpeed
    ? [
        {
          header: 'ความเร็ว (กม./ชม.)',
          width: 16,
          widthPct: 8,
          value: (r: LPRPointPlate) => (r.speed != null && r.speed > 0 ? r.speed : '-'),
        },
      ]
    : []),
  { header: 'กล้อง', width: 34, widthPct: hasSpeed ? 13 : 17, value: (r) => r.camera_name || '-' },
  { header: 'ที่มา', width: 8, widthPct: 6, value: (r) => SOURCE_LABEL[r.source] },
  { header: 'ภาพป้ายทะเบียน', width: 50, widthPct: hasSpeed ? 14 : 18, value: (r) => r.plate_image || '-' },
]

// ทั้งหมด-scope fetch policy: the plates feed is CURSOR-paginated (no total,
// backend caps limit at 100/request, pages must be walked serially — each
// cursor comes from the previous response, so the crosswalk-style parallel
// page fan-out is impossible here). A busy point logs thousands of rows per
// week (จุด 3911 measured >6,000/7 days), so ทั้งหมด stops at an explicit
// ceiling and the report notes the truncation; narrowing the date range is
// the intended way to get a complete document.
/** Excel row ceiling for ทั้งหมด scope (≈50 serial requests worst case). */
const EXPORT_MAX_ROWS = 5_000
/** PDF row ceiling — react-pdf lays the whole document out in memory and the
 *  plate crops are embedded per row, so the PDF cap stays far lower. */
const PDF_MAX_ROWS = 1_000
/** Parallel image prefetches for the PDF's plate-crop column. */
const IMAGE_FETCH_CONCURRENCY = 8

/** Run `fn` over `items` keeping at most `limit` promises in flight,
 *  preserving order. */
const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> => {
  const out = new Array<R>(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return out
}

/** Detail Tab 2 — full detection list with real filters wired to backend.
 *  Backend handles: source narrow (`source=anpr|wim`), plate substring
 *  search (`q=`), inclusive date range (`from=YYYY-MM-DD&to=YYYY-MM-DD`).
 *  Frontend batches cursor pages via useLPRPointPlates + shows a click-to-
 *  view Modal with full-size vehicle + plate images. */
const DetectionSection: React.FC = () => {
  const { solutionId } = useLPRDetailContext()

  const [sourceFilter, setSourceFilter] = useState<'all' | LPRSource>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    null,
    null,
  ])
  const [modalItem, setModalItem] = useState<LPRPointPlate | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  // Debounce plate search so we don't re-issue the query on every keystroke.
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  const from = dateRange[0]?.format('YYYY-MM-DD')
  const to = dateRange[1]?.format('YYYY-MM-DD')

  const { data, isLoading, isFetching, hasNextPage, fetchNextPage } = useLPRPointPlates(
    solutionId,
    {
      limit: 25,
      from,
      to,
      q: debouncedSearch || undefined,
      source: sourceFilter,
    },
  )

  const rows = useMemo(() => (data?.pages ?? []).flatMap((p) => p.res_data), [data])

  // Hide the ความเร็ว column entirely when every loaded row lacks a real speed
  // reading — ANPR-only sites always come through as speed=0/null (WIM is the
  // source that populates it), so showing a full column of "-" is just noise.
  const hasSpeed = useMemo(
    () => rows.some((r) => r.speed != null && r.speed > 0),
    [rows],
  )

  const columns: ColumnsType<LPRPointPlate> = useMemo(
    () => [
      {
        title: 'เวลา',
        key: 'captured_at',
        width: 170,
        render: (_, r) => (
          <div>
            <div className='fs-13 text-white tabular-nums'>
              {dayjs(r.captured_at).format('DD MMM · HH:mm:ss')}
            </div>
            <div className='fs-12 text-gray-500'>
              {dayjs(r.captured_at).locale('th').fromNow()}
            </div>
          </div>
        ),
      },
      {
        title: 'ทะเบียน',
        key: 'plate',
        render: (_, r) => (
          <div className='flex items-center gap-2'>
            {r.plate_image ? (
              <Image
                src={r.plate_image}
                alt={r.plate_number}
                width={70}
                height={30}
                unoptimized
                className='rounded object-cover shrink-0 w-[70px] h-[30px] bg-black'
              />
            ) : (
              <div className='w-[70px] h-[30px] rounded bg-black/40 shrink-0' />
            )}
            <div>
              <div className='fs-14 font-bold text-white tabular-nums'>
                {r.plate_number || '-'}
              </div>
              <div className='fs-12 text-gray-400'>{r.plate_province || ''}</div>
            </div>
          </div>
        ),
      },
      {
        title: 'ประเภทรถ',
        key: 'vehicle',
        render: (_, r) => (
          <div>
            <div className='fs-13 text-white'>{r.vehicle_type_name || '-'}</div>
            <div className='fs-12 text-gray-400'>
              {[r.vehicle_brand, r.vehicle_color !== '-' ? r.vehicle_color : null]
                .filter(Boolean)
                .join(' · ') || '-'}
            </div>
          </div>
        ),
      },
      ...(hasSpeed
        ? [
          {
            title: 'ความเร็ว',
            key: 'speed',
            width: 100,
            align: 'right' as const,
            render: (_: unknown, r: LPRPointPlate) =>
              r.speed != null && r.speed > 0 ? (
                <span className='tabular-nums text-white'>
                  {r.speed.toLocaleString('th-TH')}{' '}
                  <span className='fs-12 text-gray-500'>กม./ชม.</span>
                </span>
              ) : (
                <span className='text-gray-500'>-</span>
              ),
          },
        ]
        : []),
      {
        title: 'กล้อง',
        key: 'camera',
        ellipsis: true,
        render: (_, r) => (
          <div className='flex items-center gap-1.5 text-gray-300 min-w-0'>
            <TbCamera size={14} className='shrink-0' />
            <span className='fs-12 truncate' title={r.camera_name || ''}>
              {r.camera_name || '-'}
            </span>
          </div>
        ),
      },
      {
        title: 'ที่มา',
        dataIndex: 'source',
        key: 'source',
        width: 90,
        align: 'center',
        render: (v: LPRSource) => (
          <span
            className='fs-12 font-semibold px-2 py-0.5 rounded-full'
            style={{
              background: `${SOURCE_COLOR[v]}22`,
              color: SOURCE_COLOR[v],
              border: `1px solid ${SOURCE_COLOR[v]}55`,
            }}
          >
            {SOURCE_LABEL[v]}
          </span>
        ),
      },
    ],
    [hasSpeed],
  )

  // Human-readable note of the active filters — printed in the export header
  // so a reader knows the date window / source / plate search of this set.
  const exportNote = useMemo(() => {
    const parts: string[] = [
      from && to
        ? `ช่วงวันที่ ${dayjs(from).format('DD/MM/BBBB')} - ${dayjs(to).format('DD/MM/BBBB')}`
        : 'ช่วงเวลา ทั้งหมด',
    ]
    if (sourceFilter !== 'all') parts.push(`ที่มา ${SOURCE_LABEL[sourceFilter]}`)
    if (debouncedSearch) parts.push(`ค้นหา "${debouncedSearch}"`)
    return parts.join(' · ')
  }, [from, to, sourceFilter, debouncedSearch])

  // ทั้งหมด scope — walk the cursor with the ACTIVE filters at the backend's
  // 100/request cap until exhausted or `cap` rows (see the fetch-policy note
  // above). Serial by necessity: each cursor comes from the prior response.
  const fetchAllDetections = async (
    cap: number,
  ): Promise<{ rows: LPRPointPlate[]; truncated: boolean }> => {
    const { getLPRPointPlatesAPI } = await import('@/services/routes/LPRService')
    const out: LPRPointPlate[] = []
    let cursor: string | undefined
    while (out.length < cap) {
      const r = await getLPRPointPlatesAPI(solutionId, {
        cursor,
        limit: 100,
        from,
        to,
        q: debouncedSearch || undefined,
        source: sourceFilter,
      })
      const page = r.data.res_data ?? []
      out.push(...page)
      // Empty page guards against a misbehaving has_more=true loop.
      if (!r.data.has_more || !r.data.next_cursor || page.length === 0) {
        return { rows: out.slice(0, cap), truncated: out.length > cap }
      }
      cursor = r.data.next_cursor
    }
    return { rows: out.slice(0, cap), truncated: true }
  }

  // PDF = table mirroring the on-screen columns; the ภาพป้ายทะเบียน column
  // embeds the REAL plate crop (pre-fetched + re-encoded via
  // utils/export/image.ts — react-pdf can't fetch cross-origin itself); a
  // failed/absent image just renders '-'. `scope` comes from the modal's
  // ทั้งหมด/หน้าปัจจุบัน toggle (หน้าปัจจุบัน = the rows loaded on screen).
  const handleExportPdf = async (scope?: 'all' | 'page') => {
    const [{ exportTablePdf }, { fetchImageAsDataUrl }] = await Promise.all([
      import('@/utils/export/pdf'),
      import('@/utils/export/image'),
    ])
    const all = scope === 'page' ? null : await fetchAllDetections(PDF_MAX_ROWS)
    const exportRows = scope === 'page' ? rows : all!.rows
    const truncNote = all?.truncated
      ? ` · แสดง ${exportRows.length.toLocaleString()} รายการล่าสุด (เกินจำนวนสูงสุดต่อรายงาน — แคบช่วงวันที่เพื่อออกรายงานให้ครบ)`
      : ''
    const images = await mapWithConcurrency(exportRows, IMAGE_FETCH_CONCURRENCY, (r) =>
      fetchImageAsDataUrl(r.plate_image ?? ''),
    )
    const columns = buildExportColumns(exportRows.some((r) => r.speed != null && r.speed > 0)).map(
      (c) =>
        c.header === 'ภาพป้ายทะเบียน'
          ? {
              ...c,
              image: (_r: LPRPointPlate, i: number) => images[i]?.dataUrl ?? null,
              value: () => '-',
            }
          : c,
    )
    await exportTablePdf({
      filenameBase: 'LPR_Detections_Report',
      title: 'รายงานรายการตรวจจับป้ายทะเบียน (LPR Detections)',
      filterNote: exportNote + truncNote,
      columns,
      rows: exportRows,
    })
  }

  const handleExportExcel = async (scope?: 'all' | 'page') => {
    const { exportExcel } = await import('@/utils/export/excel')
    const all = scope === 'page' ? null : await fetchAllDetections(EXPORT_MAX_ROWS)
    const exportRows = scope === 'page' ? rows : all!.rows
    const truncNote = all?.truncated
      ? ` · แสดง ${exportRows.length.toLocaleString()} รายการล่าสุด (เกินจำนวนสูงสุดต่อรายงาน — แคบช่วงวันที่เพื่อออกรายงานให้ครบ)`
      : ''
    exportExcel({
      filenameBase: 'LPR_Detections_Report',
      sheetName: 'LPR Detections',
      title: 'รายงานรายการตรวจจับป้ายทะเบียน (LPR Detections)',
      filterNote: exportNote + truncNote,
      columns: buildExportColumns(exportRows.some((r) => r.speed != null && r.speed > 0)),
      rows: exportRows,
    })
  }

  const applyPreset = (days: number) => {
    const end = dayjs()
    const start = end.subtract(days, 'day')
    setDateRange([start, end])
  }

  const clearAll = () => {
    setSourceFilter('all')
    setSearch('')
    setDateRange([null, null])
  }

  return (
    <div className='flex flex-col gap-4'>
      <section className='bg-(--mid-gray) rounded-2xl p-4 flex flex-col gap-3'>
        <div className='flex items-center gap-2 text-(--yellow)'>
          <TbCalendar size={16} />
          <h4 className='mb-0 fs-13'>ตัวกรอง</h4>
          <div className='ms-auto flex items-center gap-1'>
            {[
              { label: 'วันนี้', d: 0 },
              { label: '7 วัน', d: 7 },
              { label: '30 วัน', d: 30 },
            ].map((p) => (
              <button
                key={p.label}
                type='button'
                onClick={() => applyPreset(p.d)}
                className='fs-12 px-2 py-1 rounded-md bg-(--light-black) text-gray-300 hover:text-white hover:bg-black/40 transition-colors'
              >
                {p.label}
              </button>
            ))}
            <button
              type='button'
              onClick={clearAll}
              className='fs-12 px-2 py-1 rounded-md text-gray-500 hover:text-(--yellow) transition-colors'
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>
        <div className='flex flex-col md:flex-row md:items-end gap-3'>
          {/* Date range — Thai BE year + yellow calendar icon, same pattern as
            * Traffic Volume's FilterBarReport (design 2026-07-20). */}
          <div className='flex flex-col gap-1'>
            <span className='fs-12 text-(--yellow)'>วันที่เริ่มต้นและสิ้นสุดแสดงข้อมูล</span>
            <ConfigProvider locale={thTH}>
              <RangePicker
                value={dateRange}
                onChange={(dates) =>
                  setDateRange(
                    (dates ?? [null, null]) as [dayjs.Dayjs | null, dayjs.Dayjs | null],
                  )
                }
                format='D MMM BBBB'
                placeholder={['วันเริ่ม', 'วันสิ้นสุด']}
                className='w-full! lg:w-72!'
                size='large'
                separator={<span className='text-white'>-</span>}
                suffixIcon={<TbCalendar className='text-(--yellow)' size={18} />}
                allowClear
              />
            </ConfigProvider>
          </div>
          <div className='flex items-center gap-1 bg-(--light-black) rounded-lg p-1'>
            {(['all', 'anpr', 'wim'] as const).map((s) => (
              <button
                key={s}
                type='button'
                onClick={() => setSourceFilter(s)}
                className={`px-3 py-1.5 rounded-md fs-12 transition-colors ${sourceFilter === s
                    ? 'bg-(--yellow) text-black font-semibold'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                {s === 'all' ? 'ทั้งหมด' : SOURCE_LABEL[s]}
              </button>
            ))}
          </div>
          <Input
            allowClear
            size='middle'
            prefix={<TbSearch className='text-gray-400' />}
            placeholder='ค้นหาป้ายทะเบียน'
            className='md:max-w-xs'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className='md:ms-auto fs-12 text-gray-400'>
            แสดง {rows.length.toLocaleString('th-TH')} รายการ
            {isFetching && ' · กำลังโหลด…'}
          </div>
        </div>
      </section>

      <section>
        <SearchBar
          mode='title'
          title='ตารางรายการตรวจจับ'
          showViewToggle={false}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* นำออกเอกสาร — PDF + Excel are flat tables with the same columns as
          the on-screen table (PDF embeds the plate crop). The scope toggle
          picks between ทั้งหมด (every detection matching the filters — the
          cursor is walked in full at export time, so no upfront count) and
          หน้าปัจจุบัน (the rows currently loaded on screen). */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        scope={{ pageCount: rows.length }}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
      />

      <Table
        rowKey='id'
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        pagination={false}
        size='middle'
        scroll={{ x: 1000 }}
        locale={{ emptyText: <Empty description='ไม่มีข้อมูลตรวจจับตามตัวกรอง' /> }}
        onRow={(row) => ({ onClick: () => setModalItem(row), className: 'cursor-pointer' })}
      />

      {hasNextPage && (
        <div className='flex justify-center'>
          <Button type='primary' loading={isFetching} onClick={() => fetchNextPage()}>
            โหลดเพิ่ม
          </Button>
        </div>
      )}

      <PlateDetailModal item={modalItem} onClose={() => setModalItem(null)} />
    </div>
  )
}

export default React.memo(DetectionSection)
