import React from 'react'

/** Applies the Statistics typography baseline without changing headings that
 * already use a larger size. The selectors cover utility classes, inline
 * styles, and Ant Design's body text used throughout the Statistics screens. */
const StatisticsMinimumFontSize: React.FC = () => (
  <style>{`
    .statistics-font-min-14 .fs-10,
    .statistics-font-min-14 .fs-11,
    .statistics-font-min-14 .fs-12,
    .statistics-font-min-14 .fs-13,
    .statistics-font-min-14 .text-xs,
    .statistics-font-min-14 [class*="text-[8px]"],
    .statistics-font-min-14 [class*="text-[9px]"],
    .statistics-font-min-14 [class*="text-[10px]"],
    .statistics-font-min-14 [class*="text-[11px]"],
    .statistics-font-min-14 [class*="text-[12px]"],
    .statistics-font-min-14 [class*="text-[13px]"] {
      font-size: 14px !important;
    }

    .statistics-font-min-14 [style*="font-size: 8px"],
    .statistics-font-min-14 [style*="font-size: 9px"],
    .statistics-font-min-14 [style*="font-size: 10px"],
    .statistics-font-min-14 [style*="font-size: 11px"],
    .statistics-font-min-14 [style*="font-size: 12px"],
    .statistics-font-min-14 [style*="font-size: 13px"] {
      font-size: 14px !important;
    }

    .statistics-font-min-14 .ant-table,
    .statistics-font-min-14 .ant-table-cell,
    .statistics-font-min-14 .ant-btn,
    .statistics-font-min-14 .ant-picker-input > input,
    .statistics-font-min-14 .ant-segmented-item-label,
    .statistics-font-min-14 .ant-pagination,
    .statistics-font-min-14 .ant-pagination-item a {
      font-size: 14px !important;
    }
  `}</style>
)

export default React.memo(StatisticsMinimumFontSize)
