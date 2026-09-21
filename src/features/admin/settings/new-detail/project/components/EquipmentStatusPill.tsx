import React from 'react'
import { TbWifi, TbWifiOff } from 'react-icons/tb'

interface Props {
  online: boolean
}

/** ออนไลน์ / ออฟไลน์ pill for a camera row. "Online" = the HLS stream serves
 *  (`curl_status`), not ICMP `ping_status` — same rule as settings/detail. */
const EquipmentStatusPill: React.FC<Props> = ({ online }) => (
  <span
    className='inline-flex items-center gap-1 px-3 py-1 rounded-full fs-12'
    style={{
      border: `1px solid ${online ? '#66AEFF' : '#FF6666'}`,
      color: online ? '#66AEFF' : '#FF6666',
    }}
  >
    {online ? <TbWifi size={14} /> : <TbWifiOff size={14} />}
    {online ? 'ออนไลน์' : 'ออฟไลน์'}
  </span>
)

export default React.memo<Props>(EquipmentStatusPill)
