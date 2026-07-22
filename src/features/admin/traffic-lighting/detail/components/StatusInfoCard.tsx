"use client"
import React from 'react'

export interface StatusInfoCardProps {
  borderColor: string
  titleColor: string
  title: string
  status: string
  icon?: string
  /** Optional icon element (overrides `icon` img when provided). */
  iconNode?: React.ReactNode
  subtitle?: string
  /** Override the card background (default #66AEFF1A). */
  background?: string
  /** When true, suppress the border (borderColor ignored). */
  noBorder?: boolean
  /** Optional unit shown after the big status value (e.g. "จุด", "A"). */
  valueUnit?: string
  /** When true, valueUnit uses the same size/color as the value (default: small #979797). */
  valueUnitLarge?: boolean
  /** Optional "Active : X (Y%)" line shown under the subtitle. */
  active?: string
  /** Font size (px) of the big status value. Default 18. */
  valueFontSize?: number
  /** Compact horizontal layout for narrow side columns. */
  compact?: boolean
}

/** Single bordered status card — connection, circuit, or wire status. */
const StatusInfoCard: React.FC<StatusInfoCardProps> = ({
  borderColor,
  titleColor,
  title,
  status,
  icon,
  iconNode,
  subtitle,
  background,
  noBorder,
  valueUnit,
  valueUnitLarge,
  active,
  valueFontSize = 18,
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        className='w-full shrink-0 rounded-[20px] pl-[27px] pr-3 py-3 flex flex-col justify-center min-h-[120px]'
        style={{
          background: background ?? '#66AEFF1A',
          border: noBorder ? 'none' : `2px solid ${borderColor}`,
        }}
      >
        <div className='flex items-center gap-3 min-w-0'>
          {iconNode ?? (icon ? <img src={icon} alt='' width={30} height={30} className='shrink-0 w-8 h-8' /> : null)}
          <p className='text-[13px] font-bold m-0 leading-normal truncate' style={{ color: titleColor }}>
            {title}
          </p>
        </div>
        <div className='flex flex-row items-baseline gap-2 mt-1'>
          <p className='font-bold m-0 text-white leading-none' style={{ fontSize: valueFontSize }}>
            {status}
          </p>
          {valueUnit && (
            <span
              className='font-bold'
              style={
                valueUnitLarge
                  ? { color: titleColor, fontSize: valueFontSize }
                  : { color: '#979797', fontSize: 12 }
              }
            >
              {valueUnit}
            </span>
          )}
        </div>
        {subtitle && (
          <p className='font-normal m-0 mt-1 truncate' style={{ color: '#979797', fontSize: 11 }}>
            {subtitle}
          </p>
        )}
        {active && (
          <p className='font-normal m-0 mt-1' style={{ color: '#979797', fontSize: 11 }}>
            Active : {active}
          </p>
        )}
      </div>
    )
  }

  const statusIndent = icon || iconNode ? 'pl-[38px]' : 'pl-2'

  return (
    <div
      className='w-full h-full rounded-2xl px-3 pb-3 pt-4 flex flex-col min-h-[96px]'
      style={{
        background: background ?? '#66AEFF1A',
        border: noBorder ? 'none' : `2px solid ${borderColor}`,
      }}
    >
      <div className='pl-2 flex flex-col min-w-0'>
        <div className='flex flex-row items-center gap-2 min-w-0'>
          {iconNode ?? (icon ? <img src={icon} alt='' width={30} height={30} className='shrink-0' /> : null)}
          <p className='text-[16px] font-bold m-0 leading-tight' style={{ color: titleColor }}>
            {title}
          </p>
        </div>
        <div className={`flex flex-row items-baseline gap-2 mt-1 ${statusIndent}`}>
          <p className='font-bold m-0 text-white leading-none' style={{ fontSize: valueFontSize }}>
            {status}
          </p>
          {valueUnit && (
            <span
              className='font-bold'
              style={
                valueUnitLarge
                  ? { color: titleColor, fontSize: valueFontSize }
                  : { color: '#979797', fontSize: 12 }
              }
            >
              {valueUnit}
            </span>
          )}
        </div>
        {subtitle && (
          <p className={`font-normal m-0 mt-1 ${statusIndent}`} style={{ color: '#979797', fontSize: 12 }}>
            {subtitle}
          </p>
        )}
        {active && (
          <p className={`font-normal m-0 mt-1 ${statusIndent}`} style={{ color: '#979797', fontSize: 12 }}>
            Active : {active}
          </p>
        )}
      </div>
    </div>
  )
}

export default React.memo(StatusInfoCard)
