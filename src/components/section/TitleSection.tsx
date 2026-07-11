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
  /** Controlled active tab — lets a parent programmatically switch tabs (e.g.
   *  after a save completes). Omit for the uncontrolled `defaultTab`-only behaviour. */
  activeTab?: string
  onTabChange?: (value: string) => void
  className?: string
}

const TitleSection: React.FC<TitleSectionProps> = ({ title, subtitle, tabOptions, defaultTab, activeTab, onTabChange, className }) => (
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
          activeValue={activeTab}
          setLabelValue={onTabChange ?? (() => {})}
        />
      </section>
    )}
  </div>
)

export default React.memo(TitleSection)
