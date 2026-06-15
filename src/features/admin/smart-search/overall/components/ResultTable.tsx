"use client"
import { Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import React, { useMemo } from "react"
import type { Cell, ResultPayload } from "@/types/chat"

interface Props {
  result: ResultPayload
}

// `/ask` caps results at ~200 rows (LLM_MAX_ROWS) with no truncation flag, so
// hitting the cap means there may be more — nudge the user toward export.
const LLM_MAX_ROWS = 200

const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

interface RowRecord {
  key: number
  cells: Cell[]
}

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
  return value
}

const ResultTable: React.FC<Props> = ({ result }) => {
  const { columns: columnNames, rows, row_count } = result

  // A column is numeric only if every present cell is a number → right-align it.
  const numericCols = useMemo(
    () =>
      columnNames.map((_, colIdx) =>
        rows.some((r) => typeof r[colIdx] === "number") &&
        rows.every(
          (r) => r[colIdx] === null || typeof r[colIdx] === "number",
        ),
      ),
    [columnNames, rows],
  )

  const columns: ColumnsType<RowRecord> = useMemo(
    () =>
      columnNames.map((name, colIdx) => ({
        title: name,
        key: String(colIdx),
        align: numericCols[colIdx] ? "right" : "left",
        render: (_: unknown, record: RowRecord) => formatCell(record.cells[colIdx]),
      })),
    [columnNames, numericCols],
  )

  const dataSource: RowRecord[] = useMemo(
    () => rows.map((cells, key) => ({ key, cells })),
    [rows],
  )

  return (
    <div className="my-2">
      <Table<RowRecord>
        columns={columns}
        dataSource={dataSource}
        rowKey="key"
        size="small"
        pagination={false}
        scroll={{ x: "max-content", y: 360 }}
        sticky
      />
      {row_count >= LLM_MAX_ROWS && (
        <p className="fs-12 text-white/50 mt-2">
          แสดงผลสูงสุด ~{LLM_MAX_ROWS} แถวแรก — ผลลัพธ์จริงอาจมีมากกว่านี้
          ใช้ปุ่มดาวน์โหลดเพื่อดูข้อมูลทั้งหมด
        </p>
      )}
    </div>
  )
}

export default React.memo(ResultTable)
