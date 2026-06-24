"use client"
import React from 'react'

export interface InfoListRow {
  label: string
  value: React.ReactNode
  /** When true, value renders in the box's title color (the "featured" row). */
  highlight?: boolean
}

interface Props {
  icon: React.ReactNode
  title: string
  /** Title + highlighted-row tint (default red — matches the design). */
  titleColor?: string
  rows: InfoListRow[]
}

/** Mini info panel with a colored header + a list of label : value rows.
 *  Used twice per analysis panel (e.g. "สถิติความเร็ว" / "คุณภาพข้อมูล"). */
const InfoListBox: React.FC<Props> = ({
  icon,
  title,
  titleColor = '#EF4444',
  rows,
}) => (
  <div
    className='py-3 px-4 rounded-lg h-full flex flex-col'
    style={{
      background: '#191919',
      // Min-height sized to comfortably fit the 5-row variant (สถิติความเร็ว /
      // คุณภาพข้อมูล) so the 4-row cards on the right panel match the height
      // visually. Combined with `flex-1 justify-between` on the rows wrapper,
      // 4-row cards simply have more breathing room.
      minHeight: 200,
    }}
  >
    <div className='flex items-center gap-2 mb-2'>
      <span style={{ color: titleColor }} className='flex items-center text-[18px]'>
        {icon}
      </span>
      <span
        className='fs-13 font-semibold'
        style={{ color: titleColor }}
      >
        {title}
      </span>
    </div>
    {/* Rows take all remaining vertical space and distribute evenly via
      * `justify-between`, so a 4-row card sized inside a tall grid cell
      * matches a 5-row card next to it. */}
    <div className='flex flex-col gap-1.5 flex-1 justify-between'>
      {rows.map((row, i) => (
        <div key={i} className='flex items-center justify-between gap-3'>
          <span className='fs-12 text-white/55'>{row.label} :</span>
          <span
            className='fs-12 font-semibold tabular-nums whitespace-nowrap'
            style={{ color: row.highlight ? titleColor : '#ffffff' }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  </div>
)

export default React.memo<Props>(InfoListBox)
