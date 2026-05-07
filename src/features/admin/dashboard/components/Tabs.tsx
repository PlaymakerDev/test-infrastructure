"use client"
import React from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  options: string[]
}

const Tabs: React.FC<Props> = (props) => {
  const { value, onChange, options } = props

  return (
    <div
      className="flex items-center gap-1 rounded-full p-0.5 sm:p-1 text-[11px] sm:text-sm"
      style={{ background: "rgba(255,255,255,0.07)" }}
    >
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-2 py-0.5 sm:px-4 sm:py-1.5 rounded-full transition-all font-medium ${
            value === o
              ? "bg-[#0f1e30] text-(--yellow)"
              : "text-[#6b7f9a] hover:text-white"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export default React.memo<Props>(Tabs)
