import React from 'react'

/** Keeps every body-sized label in Maintenance readable while preserving
 * intentionally larger headings and metric values. */
const MaintenanceMinimumFontSize: React.FC = () => (
  <style>{`
    .maintenance-font-min-14 .fs-10,
    .maintenance-font-min-14 .fs-11,
    .maintenance-font-min-14 .fs-12,
    .maintenance-font-min-14 .fs-13,
    .maintenance-font-min-14 .text-xs,
    .maintenance-font-min-14 [class*="text-[8px]"],
    .maintenance-font-min-14 [class*="text-[9px]"],
    .maintenance-font-min-14 [class*="text-[10px]"],
    .maintenance-font-min-14 [class*="text-[11px]"],
    .maintenance-font-min-14 [class*="text-[12px]"],
    .maintenance-font-min-14 [class*="text-[13px]"] {
      font-size: 14px !important;
    }

    .maintenance-font-min-14 [style*="font-size: 8px"],
    .maintenance-font-min-14 [style*="font-size: 9px"],
    .maintenance-font-min-14 [style*="font-size: 10px"],
    .maintenance-font-min-14 [style*="font-size: 11px"],
    .maintenance-font-min-14 [style*="font-size: 12px"],
    .maintenance-font-min-14 [style*="font-size: 13px"] {
      font-size: 14px !important;
    }

    .maintenance-font-min-14 .ant-table,
    .maintenance-font-min-14 .ant-table-cell,
    .maintenance-font-min-14 .ant-btn,
    .maintenance-font-min-14 .ant-picker-input > input,
    .maintenance-font-min-14 .ant-input,
    .maintenance-font-min-14 .ant-select-selection-item,
    .maintenance-font-min-14 .ant-segmented-item-label,
    .maintenance-font-min-14 .ant-pagination,
    .maintenance-font-min-14 .ant-pagination-item a {
      font-size: 14px !important;
    }
  `}</style>
)

export default React.memo(MaintenanceMinimumFontSize)
