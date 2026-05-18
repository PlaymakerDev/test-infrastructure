"use client"
import React from 'react'
import type { BridgeProject } from '@/features/admin/bridge-lighting/overall/data/bridgeProjects'

interface Props {
  /** Real bridge to display. Falls back to placeholder values if omitted. */
  bridge?: BridgeProject
}

/** Custom sparkle icon — pixel-exact from Figma (40×40 viewBox, central
 *  4-cusp star + 4 short corner rays). Defined inline since it's only used
 *  on this card and matches Figma exactly. */
const SparkleIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 24,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 40 40'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    className={className}
  >
    <path
      d='M24.1738 14.2033L21.2438 7.48327C21.1381 7.24137 20.9643 7.03554 20.7434 6.89098C20.5226 6.74643 20.2644 6.66943 20.0004 6.66943C19.7365 6.66943 19.4783 6.74643 19.2574 6.89098C19.0366 7.03554 18.8627 7.24137 18.7571 7.48327L15.8254 14.2033C15.5088 14.9299 14.9304 15.5099 14.2038 15.8249L7.48376 18.7566C7.24186 18.8622 7.03602 19.0361 6.89147 19.2569C6.74692 19.4778 6.66992 19.736 6.66992 19.9999C6.66992 20.2639 6.74692 20.5221 6.89147 20.7429C7.03602 20.9638 7.24186 21.1377 7.48376 21.2433L14.2054 24.1733C14.9321 24.4899 15.5121 25.0699 15.8271 25.7966L18.7588 32.5183C18.8644 32.7602 19.0382 32.966 19.2591 33.1106C19.4799 33.2551 19.7381 33.3321 20.0021 33.3321C20.266 33.3321 20.5242 33.2551 20.7451 33.1106C20.9659 32.966 21.1398 32.7602 21.2454 32.5183L24.1754 25.7966C24.4921 25.0699 25.0721 24.4899 25.7988 24.1733L32.5204 21.2433C32.7623 21.1377 32.9682 20.9638 33.1127 20.7429C33.2573 20.5221 33.3343 20.2639 33.3343 19.9999C33.3343 19.736 33.2573 19.4778 33.1127 19.2569C32.9682 19.0361 32.7623 18.8622 32.5204 18.7566L25.7988 15.8249C25.0721 15.5091 24.492 14.9296 24.1754 14.2033'
      stroke='currentColor'
      strokeWidth={3}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path d='M5 5L8.33333 8.33333' stroke='currentColor' strokeWidth={3} strokeLinecap='round' strokeLinejoin='round' />
    <path d='M34.9993 5L31.666 8.33333' stroke='currentColor' strokeWidth={3} strokeLinecap='round' strokeLinejoin='round' />
    <path d='M5 34.9998L8.33333 31.6665' stroke='currentColor' strokeWidth={3} strokeLinecap='round' strokeLinejoin='round' />
    <path d='M34.9993 34.9998L31.666 31.6665' stroke='currentColor' strokeWidth={3} strokeLinecap='round' strokeLinejoin='round' />
  </svg>
)

const LatestBridgeCard: React.FC<Props> = ({ bridge }) => {
  // Derive display values from the bridge if provided, else fall back to a
  // sensible placeholder. The bridge name is the install point with the
  // leading "ไฟประดับ : " prefix stripped, matching the Figma layout.
  const installPoint =
    bridge?.installPoint ?? 'ไฟประดับ : สะพานกรุงเทพ ฝั่งพระนคร'
  const bridgeName = installPoint.replace(/^ไฟประดับ\s*:\s*/, '')
  const lastUpdate = bridge?.lastUpdate ?? '—'

  return (
    <div
      className='p-3 sm:p-4 flex flex-col gap-1 w-full h-36 sm:h-40 xl:h-42.5'
      style={{
        borderRadius: 20,
        border: '2px solid rgba(255,255,255,0.7)',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 50%, rgba(33,33,33,0.92) 90%)',
        backdropFilter: 'blur(5px)',
      }}
    >
      <SparkleIcon size={32} className='text-white sm:hidden' />
      <SparkleIcon size={40} className='text-white hidden sm:block' />
      {/* Use <div> (not <p>) so we avoid globals.css's p clamp rule;
        * Tailwind `text-xs sm:text-sm` then controls the size cleanly. */}
      <div className='text-white text-xs sm:text-sm font-semibold leading-tight'>
        ไฟประดับสะพานแสดงผลล่าสุด
      </div>
      {/* <h2> with `!` suffix on the text classes so they win against
        * globals.css's `h2 { font-size: clamp(...) }` rule. */}
      <h2 className='text-white font-bold text-2xl! sm:text-3xl! leading-tight'>
        {bridgeName}
      </h2>
      <div className='text-white/70 text-[11px] sm:text-xs leading-tight'>
        ไฟประดับ : {installPoint.replace(/^ไฟประดับ\s*:\s*/, '')} (อัพเดต {lastUpdate})
      </div>
    </div>
  )
}

export default React.memo<Props>(LatestBridgeCard)
