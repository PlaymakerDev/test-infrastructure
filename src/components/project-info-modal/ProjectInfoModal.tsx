"use client"
import React from 'react'
import { Modal } from 'antd'
import { TbClipboardText, TbX } from 'react-icons/tb'

// ── Types ─────────────────────────────────────────────────────────────────────

/** Single info field — icon at top, gray label, white value below.
 *  `value` accepts `ReactNode` so callers can color a value (e.g., cyan for a
 *  countdown) or render multi-line content (e.g. company name + branch). */
export interface ProjectInfoField {
  icon: React.ReactNode
  label: string
  value: string | React.ReactNode
}

/** Small outlined pill rendered next to the title (e.g. warranty status). */
export interface ProjectInfoBadge {
  text: string
  /** Border + text color (background stays transparent). */
  color: string
}

export interface ProjectInfoModalProps {
  open: boolean
  onClose: () => void
  /** Header title (default "ข้อมูลโครงการ") */
  title?: string
  /** Optional pill rendered to the right of the title. */
  badge?: ProjectInfoBadge
  /** Description paragraph rendered between header and field rows. */
  description?: string
  /** Field rows. Each inner array is one row laid out as space-between. */
  rows: ProjectInfoField[][]
  /** Override modal width (default 800). */
  width?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Reusable project-info modal — matches the Figma "ข้อมูลโครงการ" dialog.
 *
 * Designed to be generic enough for any "project details" popup across the
 * app: caller supplies `rows` of `ProjectInfoField` and optional `badge` +
 * `description`. The Figma layout is 2 rows × 4 fields, but the component
 * accepts any number of rows/fields per row.
 */
const ProjectInfoModal: React.FC<ProjectInfoModalProps> = ({
  open,
  onClose,
  title = 'ข้อมูลโครงการ',
  badge,
  description,
  rows,
  width = 800,
}) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered
      width={width}
      destroyOnHidden
      // Make the Antd modal content invisible (transparent bg / no border /
      // no padding) so the visible "modal" is the inner div below — it gets
      // its styling via inline `style`, which always wins over Antd's
      // runtime CSS-in-JS injection.
      rootClassName='project-info-modal'
      styles={{
        body: { padding: 0, background: 'transparent' },
        mask: { background: 'rgba(0, 0, 0, 0.55)' },
      }}
    >
      <div
        style={{
          width: '100%',
          background: '#191919',
          border: '2px solid #66AEFF',
          borderRadius: 20,
          boxShadow: '0px 8px 10px rgba(0, 0, 0, 0.25)',
          padding: 30,
          boxSizing: 'border-box',
        }}
      >
        {/* Header — clipboard icon + title + optional pill + close */}
        <div className='flex items-start justify-between mb-5'>
          <div className='flex items-center gap-3'>
            <TbClipboardText size={40} color='#66AEFF' />
            <h2
              className='leading-none m-0'
              style={{ color: '#66AEFF', fontSize: 24, fontWeight: 700 }}
            >
              {title}
            </h2>
            {badge && (
              <span
                className='inline-flex items-center justify-center px-3 py-1 rounded-full text-sm whitespace-nowrap'
                style={{ border: `1px solid ${badge.color}`, color: badge.color }}
              >
                {badge.text}
              </span>
            )}
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='ปิด'
            className='text-white cursor-pointer hover:opacity-70 transition-opacity bg-transparent border-0 p-0 outline-none focus:outline-none'
          >
            <TbX size={24} />
          </button>
        </div>

        {/* Description paragraph (optional) */}
        {description && (
          <p
            className='mb-8'
            style={{
              color: '#B2D6F0',
              fontSize: 16,
              lineHeight: '22px',
              margin: 0,
              marginBottom: 32,
            }}
          >
            {description}
          </p>
        )}

        {/* Field rows */}
        <div className='flex flex-col gap-7'>
          {rows.map((row, i) => (
            <div key={i} className='flex justify-between gap-6 flex-wrap'>
              {row.map((field, j) => (
                <div key={j} className='flex flex-col items-center gap-1.5 flex-1 min-w-30'>
                  <div className='text-white flex items-center justify-center h-7.5'>
                    {field.icon}
                  </div>
                  <span style={{ color: '#979797', fontSize: 12, lineHeight: '15px' }}>
                    {field.label}
                  </span>
                  <span
                    className='text-center'
                    style={{ color: '#fff', fontSize: 14, lineHeight: '17px' }}
                  >
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default React.memo(ProjectInfoModal)
