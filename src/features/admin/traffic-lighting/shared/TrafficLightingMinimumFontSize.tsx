import React from 'react'

/** Typography floor for every Traffic Lighting screen. Larger headings and
 * metrics keep their declared size; only body text below 14px is raised. */
const TrafficLightingMinimumFontSize: React.FC = () => (
  <style>{`
    .traffic-lighting-font-min-14 .fs-10,
    .traffic-lighting-font-min-14 .fs-11,
    .traffic-lighting-font-min-14 .fs-12,
    .traffic-lighting-font-min-14 .fs-13,
    .traffic-lighting-font-min-14 .text-xs,
    .traffic-lighting-font-min-14 [class*="text-[8px]"],
    .traffic-lighting-font-min-14 [class*="text-[9px]"],
    .traffic-lighting-font-min-14 [class*="text-[10px]"],
    .traffic-lighting-font-min-14 [class*="text-[11px]"],
    .traffic-lighting-font-min-14 [class*="text-[12px]"],
    .traffic-lighting-font-min-14 [class*="text-[13px]"] {
      font-size: 14px !important;
    }

    .traffic-lighting-font-min-14 [style*="font-size: 8px"],
    .traffic-lighting-font-min-14 [style*="font-size: 9px"],
    .traffic-lighting-font-min-14 [style*="font-size: 10px"],
    .traffic-lighting-font-min-14 [style*="font-size: 11px"],
    .traffic-lighting-font-min-14 [style*="font-size: 12px"],
    .traffic-lighting-font-min-14 [style*="font-size: 13px"] {
      font-size: 14px !important;
    }

    .traffic-lighting-font-min-14 .ant-table,
    .traffic-lighting-font-min-14 .ant-table-cell,
    .traffic-lighting-font-min-14 .ant-btn,
    .traffic-lighting-font-min-14 .ant-picker-input > input,
    .traffic-lighting-font-min-14 .ant-input,
    .traffic-lighting-font-min-14 .ant-select-selection-item,
    .traffic-lighting-font-min-14 .ant-segmented-item-label,
    .traffic-lighting-font-min-14 .ant-pagination,
    .traffic-lighting-font-min-14 .ant-pagination-item a {
      font-size: 14px !important;
    }
  `}</style>
)

export default React.memo(TrafficLightingMinimumFontSize)
