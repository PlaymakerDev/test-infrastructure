"use client"
import { Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import React, { useMemo, useState } from "react"
import { TbDownload, TbSearch } from "react-icons/tb"
import type { Cell, ResultPayload } from "@/types/chat"

interface Props {
  result: ResultPayload
  // From `provenance.truncated` (§6) — the result hit the ~200-row cap, so
  // there may be more. Authoritative flag from the backend (replaces the old
  // row_count>=200 guess). Absent for re-rendered history turns.
  truncated?: boolean
}

const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

interface RowRecord {
  key: number
  cells: Cell[]
}

// Status-like string values get a colored pill so status reads at a glance
// (#12). Conservative: only short values, matched against a known whitelist of
// status terms — purely FE, derived from the cell value.
const STATUS_STYLES: { test: RegExp; className: string }[] = [
  { test: /(ออฟไลน์|offline|ไม่เชื่อมต่อ|หมดค้ำ|ชำรุด|เสีย|ผิดปกติ)/i, className: "bg-red-500/15 text-red-400" },
  { test: /(ใกล้หมด|รอ|กำลัง|ปานกลาง|warning)/i, className: "bg-orange-500/15 text-orange-400" },
  { test: /(ออนไลน์|online|ปกติ|อยู่ในค้ำ|เชื่อมต่อ|ใช้งาน)/i, className: "bg-emerald-500/15 text-emerald-400" },
]

const statusStyle = (text: string): string | null =>
  STATUS_STYLES.find((s) => s.test.test(text))?.className ?? null

const formatCell = (value: Cell): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-white/30">—</span>
  }
  if (typeof value === "number") {
    return value.toLocaleString("en-US")
  }
  if (typeof value === "boolean") {
    return value ? "ใช่" : "ไม่ใช่"
  }
  if (RFC3339.test(value)) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    }
  }
  // Short status values → colored pill (offline=red, warning=orange, ok=green).
  const status = value.length <= 20 ? statusStyle(value) : null
  if (status) {
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full fs-12 ${status}`}>
        {value}
      </span>
    )
  }
  return value
}

// Plain-text form of a cell — what the user sees — used for search + sort.
const cellText = (value: Cell): string => {
  if (value === null || value === undefined) return ""
  if (typeof value === "number") return value.toLocaleString("en-US")
  if (typeof value === "boolean") return value ? "ใช่" : "ไม่ใช่"
  return String(value)
}

const compareCells = (a: Cell, b: Cell, numeric: boolean): number => {
  // Nulls sort last regardless of direction's base order.
  const an = a === null || a === undefined
  const bn = b === null || b === undefined
  if (an && bn) return 0
  if (an) return 1
  if (bn) return -1
  if (numeric) return Number(a) - Number(b)
  return cellText(a).localeCompare(cellText(b), "th")
}

// CSV cell — raw values (no thousands separators), quoted when needed.
const csvCell = (value: Cell): string => {
  if (value === null || value === undefined) return ""
  const s = typeof value === "boolean" ? (value ? "ใช่" : "ไม่ใช่") : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const ResultTable: React.FC<Props> = ({ result, truncated }) => {
  const { columns: columnNames, rows } = result
  const [query, setQuery] = useState("")

  // A column is numeric only if every present cell is a number → right-align +
  // sort numerically.
  const numericCols = useMemo(
    () =>
      columnNames.map(
        (_, colIdx) =>
          rows.some((r) => typeof r[colIdx] === "number") &&
          rows.every((r) => r[colIdx] === null || typeof r[colIdx] === "number"),
      ),
    [columnNames, rows],
  )

  const columns: ColumnsType<RowRecord> = useMemo(
    () =>
      columnNames.map((name, colIdx) => ({
        title: name,
        key: String(colIdx),
        align: numericCols[colIdx] ? "right" : "left",
        sorter: (a: RowRecord, b: RowRecord) =>
          compareCells(a.cells[colIdx], b.cells[colIdx], numericCols[colIdx]),
        sortDirections: ["ascend", "descend"] as const,
        render: (_: unknown, record: RowRecord) => formatCell(record.cells[colIdx]),
      })),
    [columnNames, numericCols],
  )

  const dataSource: RowRecord[] = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .map((cells, key) => ({ key, cells }))
      .filter(
        (r) =>
          !q || r.cells.some((c) => cellText(c).toLowerCase().includes(q)),
      )
  }, [rows, query])

  const downloadCsv = () => {
    const header = columnNames.map((n) => csvCell(n)).join(",")
    const lines = rows.map((r) => r.map(csvCell).join(","))
    // BOM so Excel reads Thai (UTF-8) correctly.
    const csv = "﻿" + [header, ...lines].join("\r\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "result.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="my-2">
      {rows.length > 0 && (
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 w-56 max-w-full">
            <TbSearch className="text-white/40 shrink-0" size={14} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาในตาราง..."
              className="bg-transparent outline-none border-none fs-12 text-white placeholder-white/40 w-full"
            />
          </div>
          <button
            type="button"
            onClick={downloadCsv}
            title="ดาวน์โหลดเป็น CSV"
            className="shrink-0 inline-flex items-center gap-1.5 fs-12 px-2.5 py-1 rounded-md text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <TbDownload size={14} /> CSV
          </button>
        </div>
      )}

      <Table<RowRecord>
        columns={columns}
        dataSource={dataSource}
        rowKey="key"
        size="small"
        pagination={false}
        scroll={{ x: "max-content", y: 360 }}
        sticky
      />
      {truncated && (
        <p className="fs-12 text-white/50 mt-2">
          แสดงเพียงบางส่วน — ผลลัพธ์จริงมีมากกว่านี้
          ใช้ปุ่มดาวน์โหลดเพื่อดูข้อมูลทั้งหมด
        </p>
      )}
    </div>
  )
}

export default React.memo(ResultTable)
