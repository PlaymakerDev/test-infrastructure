"use client"
import React from 'react'
import { TbCamera } from 'react-icons/tb'
import { useLPRDetailContext } from '../../../context'

/** Cameras that make up this LPR install-point. Rendered as a compact list
 *  (name only). HLS live view is available on the CCTV detail page — a
 *  future iteration can lift the camera IDs from cctv.tbl_camera to embed
 *  the players here. */
const CameraListSection: React.FC = () => {
  const { point } = useLPRDetailContext()
  const cams = point?.camera_names ?? []

  return (
    <div className='bg-(--mid-gray) rounded-2xl p-4 flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2 text-(--default-blue)'>
          <TbCamera size={18} />
          <h4 className='mb-0'>กล้อง LPR ในจุดนี้</h4>
        </div>
        <span className='fs-11 text-gray-500'>{cams.length} ตัว</span>
      </div>
      {cams.length === 0 ? (
        <div className='py-6 text-center text-gray-500 fs-12'>ไม่พบกล้อง</div>
      ) : (
        <ul className='flex flex-col gap-1.5 max-h-64 overflow-y-auto'>
          {cams.map((name) => (
            <li
              key={name}
              className='fs-12 text-gray-300 bg-(--light-black) rounded-lg px-3 py-1.5 truncate'
              title={name}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default React.memo(CameraListSection)
