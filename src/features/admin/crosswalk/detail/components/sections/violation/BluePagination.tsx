"use client"
import React from 'react'
import { TbArrowLeft, TbArrowRight } from 'react-icons/tb'

/** Visible page list with ellipses around the current page — mirrors the
 *  traffic-volume report tab's design (`buildPageList` in that feature's
 *  shared utils). */
const buildPageList = (
  current: number,
  total: number,
): Array<number | '...'> => {
  if (total <= 6) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const start = Math.max(1, Math.min(current - 2, total - 4))
  const end = Math.min(total, start + 4)
  const pages: Array<number | '...'> = []
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total) pages.push('...')
  return pages
}

interface Props {
  current: number
  total: number
  onChange: (page: number) => void
}

/** Round blue active pill + "ก่อนหน้า / ถัดไป" labels — same visual language
 *  as the traffic-volume report tab. Local to the violation section (used
 *  by both TableViolationData and CCTVViolationData). Promote to `@/components/`
 *  if a third feature ever needs it. */
const BluePagination: React.FC<Props> = ({ current, total, onChange }) => {
  const pages = buildPageList(current, total)
  const prevDisabled = current === 1
  const nextDisabled = current >= total
  const BLUE = '#66AEFF'
  return (
    <nav className='flex items-center justify-end gap-2 mt-2 select-none'>
      <button
        type='button'
        disabled={prevDisabled}
        onClick={() => onChange(Math.max(1, current - 1))}
        className={`inline-flex items-center gap-2 px-2 py-1 fs-14 ${
          prevDisabled
            ? 'text-white/35 cursor-not-allowed'
            : 'cursor-pointer hover:opacity-80'
        }`}
        style={{ color: prevDisabled ? undefined : BLUE }}
      >
        <TbArrowLeft size={18} />
        <span>ก่อนหน้า</span>
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`ellipsis-${i}`}
            className='inline-flex items-center justify-center w-8 h-8 fs-14'
            style={{ color: BLUE }}
          >
            ...
          </span>
        ) : p === current ? (
          <span
            key={p}
            className='inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-semibold fs-14'
            style={{ background: BLUE }}
          >
            {p}
          </span>
        ) : (
          <button
            key={p}
            type='button'
            onClick={() => onChange(p)}
            className='inline-flex items-center justify-center w-8 h-8 rounded-full fs-14 hover:bg-white/5 cursor-pointer'
            style={{ color: BLUE }}
          >
            {p}
          </button>
        ),
      )}
      <button
        type='button'
        disabled={nextDisabled}
        onClick={() => onChange(Math.min(total, current + 1))}
        className={`inline-flex items-center gap-2 px-2 py-1 fs-14 ${
          nextDisabled
            ? 'text-white/35 cursor-not-allowed'
            : 'cursor-pointer hover:opacity-80'
        }`}
        style={{ color: nextDisabled ? undefined : BLUE }}
      >
        <span>ถัดไป</span>
        <TbArrowRight size={18} />
      </button>
    </nav>
  )
}

export default React.memo<Props>(BluePagination)
