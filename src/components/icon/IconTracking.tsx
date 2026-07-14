import React from 'react'
import type { IconBaseProps, IconType } from 'react-icons'

// Shared tracking glyph used by the top navbar menu AND every map's device
// markers/legend/pills for the WIM (Tracking) system, so the on-map icon
// matches the menu icon 1:1. Accepts the same props as any react-icon (size /
// color / strokeWidth) so it can be dropped into iconToImage() alongside them.
const IconTracking: IconType = (props: IconBaseProps) => {
  const { size = 24, color, strokeWidth = 2, style, ...rest } = props
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={color ? { color, ...style } : style}
      {...rest}
    >
      <path d="M3.75 13.75C3.75 13.4185 3.8817 13.1005 4.11612 12.8661C4.35054 12.6317 4.66848 12.5 5 12.5H7.5C7.83152 12.5 8.14946 12.6317 8.38388 12.8661C8.6183 13.1005 8.75 13.4185 8.75 13.75V16.25C8.75 16.5815 8.6183 16.8995 8.38388 17.1339C8.14946 17.3683 7.83152 17.5 7.5 17.5H5C4.66848 17.5 4.35054 17.3683 4.11612 17.1339C3.8817 16.8995 3.75 16.5815 3.75 16.25V13.75Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.25 13.75C21.25 13.4185 21.3817 13.1005 21.6161 12.8661C21.8505 12.6317 22.1685 12.5 22.5 12.5H25C25.3315 12.5 25.6495 12.6317 25.8839 12.8661C26.1183 13.1005 26.25 13.4185 26.25 13.75V16.25C26.25 16.5815 26.1183 16.8995 25.8839 17.1339C25.6495 17.3683 25.3315 17.5 25 17.5H22.5C22.1685 17.5 21.8505 17.3683 21.6161 17.1339C21.3817 16.8995 21.25 16.5815 21.25 16.25V13.75Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 5C12.5 4.66848 12.6317 4.35054 12.8661 4.11612C13.1005 3.8817 13.4185 3.75 13.75 3.75H16.25C16.5815 3.75 16.8995 3.8817 17.1339 4.11612C17.3683 4.35054 17.5 4.66848 17.5 5V7.5C17.5 7.83152 17.3683 8.14946 17.1339 8.38388C16.8995 8.6183 16.5815 8.75 16.25 8.75H13.75C13.4185 8.75 13.1005 8.6183 12.8661 8.38388C12.6317 8.14946 12.5 7.83152 12.5 7.5V5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 22.5C12.5 22.1685 12.6317 21.8505 12.8661 21.6161C13.1005 21.3817 13.4185 21.25 13.75 21.25H16.25C16.5815 21.25 16.8995 21.3817 17.1339 21.6161C17.3683 21.8505 17.5 22.1685 17.5 22.5V25C17.5 25.3315 17.3683 25.6495 17.1339 25.8839C16.8995 26.1183 16.5815 26.25 16.25 26.25H13.75C13.4185 26.25 13.1005 26.1183 12.8661 25.8839C12.6317 25.6495 12.5 25.3315 12.5 25V22.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23.75 12.5C23.75 10.8424 23.0915 9.25269 21.9194 8.08058C20.7473 6.90848 19.1576 6.25 17.5 6.25" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.25 17.5C6.25 19.1576 6.90848 20.7473 8.08058 21.9194C9.25269 23.0915 10.8424 23.75 12.5 23.75" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.25 12.5C6.25 10.8424 6.90848 9.25269 8.08058 8.08058C9.25269 6.90848 10.8424 6.25 12.5 6.25" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default IconTracking
