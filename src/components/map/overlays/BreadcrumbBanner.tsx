"use client"
import type { Province } from '@/features/admin/dashboard/data/provinces'
import { STCH_UNITS } from '@/features/admin/dashboard/data/units'

export interface BreadcrumbBannerProps {
  province: Province | null
  /** Called when user clicks "← ทั่วประเทศ" */
  onReset?: () => void
  /** Vertical position from top (default 116) */
  top?: number
}

const BreadcrumbBanner: React.FC<BreadcrumbBannerProps> = ({
  province,
  onReset,
  top = 116,
}) => {
  if (!province) return null
  const stchInfo = STCH_UNITS.find((u) => u.stch === province.stch)
  if (!stchInfo) return null

  return (
    <div
      // Mobile: near-full-width cap so the usual "กำลังดู สทช.x › ขทช.x
      // ← ทั่วประเทศ" fits WITHOUT horizontal sliding (the old 160px side
      // clearance forced a scroll, 2026-07-20); overflow-x stays as a
      // fallback for extra-long province names only.
      className="absolute z-20 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-2 pointer-events-auto max-w-[calc(100vw-24px)] sm:max-w-[calc(100vw-80px)] overflow-x-auto scrollbar-none"
      style={{
        top,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(10,14,26,0.88)',
        border: '1px solid rgba(252,209,22,0.4)',
        borderRadius: 999,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      }}
    >
      <span className="fs-12 text-[#6b7f9a] whitespace-nowrap shrink-0">
        กำลังดู
      </span>
      {province.central ? (
        <>
          <span className="fs-12 font-semibold text-(--yellow) whitespace-nowrap shrink-0">
            ทช. ส่วนกลาง
          </span>
          <span className="text-[#6b7f9a] shrink-0">›</span>
          <span className="fs-12 font-semibold text-white whitespace-nowrap shrink-0">
            {province.name}
          </span>
        </>
      ) : (
        <>
          <span className="fs-12 font-semibold text-(--yellow) whitespace-nowrap shrink-0">
            สทช.{stchInfo.stch} ({stchInfo.hqProvinceName})
          </span>
          <span className="text-[#6b7f9a] shrink-0">›</span>
          <span className="fs-12 font-semibold text-white whitespace-nowrap shrink-0">
            ขทช.{province.name}
          </span>
        </>
      )}
      {onReset && (
        <button
          onClick={onReset}
          className="ml-0.5 sm:ml-1 fs-12 text-[#6b7f9a] hover:text-(--yellow) transition-colors px-1.5 sm:px-2 py-0.5 rounded-full border border-[#6b7f9a]/30 hover:border-[#FCD116]/60 whitespace-nowrap shrink-0"
          title="กลับไปดูทั่วประเทศ"
        >
          ← ทั่วประเทศ
        </button>
      )}
    </div>
  )
}

export default BreadcrumbBanner
