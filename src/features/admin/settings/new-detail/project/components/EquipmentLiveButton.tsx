import React from 'react'
import { TbPlayerPlay } from 'react-icons/tb'

interface Props {
  onClick: () => void
}

/** Double-chevron "Live" button used in every equipment table's Live Stream column. */
const EquipmentLiveButton: React.FC<Props> = ({ onClick }) => (
  <button
    type='button'
    onClick={onClick}
    className='inline-flex items-center gap-1 text-(--yellow) hover:opacity-80 cursor-pointer'
    title='Live'
  >
    <TbPlayerPlay size={20} />
    <TbPlayerPlay size={20} style={{ marginLeft: -6 }} />
  </button>
)

export default React.memo<Props>(EquipmentLiveButton)
