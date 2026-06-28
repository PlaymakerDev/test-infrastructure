"use client"
import SwapButton from '@/components/swap-button/SwapButton'
import React from 'react'

export interface TabOption {
  label: string
  value: string
}

export interface TitleSectionProps {
  title: string
  subtitle: string
  tabOptions?: TabOption[]
  defaultTab?: string
  onTabChange?: (value: string) => void
  className?: string
}

const TitleSection: React.FC<TitleSectionProps> = ({ title, subtitle, tabOptions, defaultTab, onTabChange, className }) => (
  <div className={className}>
    <section>
      <h1 className='text-(--yellow)'>{title}</h1>
      <p className='text-(--yellow)'>{subtitle}</p>
    </section>
    {!!tabOptions?.length && (
      <section className='mt-5'>
        <SwapButton
          options={tabOptions}
          defaultActive={defaultTab ?? tabOptions[0]?.value}
          setLabelValue={onTabChange ?? (() => {})}
        />
      </section>
    )}
  </div>
)

export default React.memo(TitleSection)
