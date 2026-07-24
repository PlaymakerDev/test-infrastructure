import React from 'react'

interface Props extends React.SVGProps<SVGSVGElement> {
  width?: string,
  height?: string,
  fill?: string
}

const FlexArrowIcon: React.FC<Props> = (props) => {
  const {
    width = 30,
    height = 30,
    fill = "none",
    ...propsSVG
  } = props

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 30 30"
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
      {...propsSVG}
    >
      <g clipPath="url(#clip0_556_13564)">
        <path
          d="M16.25 26.25V18.75M16.25 11.25V10C16.25 9.0111 16.5432 8.0444 17.0927 7.22215C17.6421 6.39991 18.423 5.75904 19.3366 5.3806C20.2502 5.00217 21.2555 4.90315 22.2255 5.09608C23.1954 5.289 24.0863 5.76521 24.7855 6.46447C25.4848 7.16373 25.961 8.05465 26.1539 9.02455C26.3469 9.99446 26.2478 10.9998 25.8694 11.9134C25.491 12.8271 24.8501 13.6079 24.0279 14.1574C23.2056 14.7068 22.2389 15 21.25 15H5"
          stroke="#66AEFF"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 20L5 15L10 10"
          stroke="#66AEFF"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_556_13564">
          <rect
            width={30}
            height={30}
            fill="white"
          />
        </clipPath>
      </defs>
    </svg>
  )
}

export default React.memo<Props>(FlexArrowIcon)
