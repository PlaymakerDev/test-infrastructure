"use client"
import React from 'react'

export interface StatusInfoCardProps {
  borderColor: string
  titleColor: string
  title: string
  status: string
  icon?: string
  subtitle?: string
}

/** Single bordered status card — connection, circuit, or wire status. */
const StatusInfoCard: React.FC<StatusInfoCardProps> = ({
  borderColor,
  titleColor,
  title,
  status,
  icon,
  subtitle,
}) => {
  const statusIndent = icon ? 'pl-[38px]' : 'pl-2'

  return (
    <div
      className='w-full rounded-[20px] px-3 pb-3 pt-4 flex flex-col min-h-[96px]'
      style={{
        background: '#66AEFF1A',
        border: `2px solid ${borderColor}`,
      }}
    >
      <div className='pl-2 flex flex-col min-w-0'>
        <div className='flex flex-row items-center gap-2 min-w-0'>
          {icon && <img src={icon} alt='' width={30} height={30} className='shrink-0' />}
          <p className='text-[14px] font-bold m-0 leading-tight' style={{ color: titleColor }}>
            {title}
          </p>
        </div>
        <div className={`flex flex-row items-center gap-2 mt-1 ${statusIndent}`}>
          <p className='text-[18px] font-bold m-0 text-white leading-none'>{status}</p>
        </div>
        {subtitle && (
          <p className={`text-[11px] font-normal m-0 mt-1 ${statusIndent}`} style={{ color: '#979797' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

export default React.memo(StatusInfoCard)
