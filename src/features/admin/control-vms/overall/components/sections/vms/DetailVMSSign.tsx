import React, { useState } from 'react'
import { TbLayoutGrid } from 'react-icons/tb'
import { useControlVMSContext } from '../../../context'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { ModalVMSScreen } from '../../../components'
import type { BureauSign } from '@/types/control-vms/bureau'

const DetailVMSSign: React.FC = () => {
  const { bureauSign } = useControlVMSContext()
  const [modalData, setModalData] = useState<BureauSign | null>(null)

  return (
    <div className="h-full bg-(--gray) rounded-lg p-5">
      <div className='flex items-start gap-2 mb-5'>
        <TbLayoutGrid className='fs-22 text-(--yellow) shrink-0' />
        <div>
          <h4 className='mb-0 text-(--yellow)'>รูปแบบการทำงานของป้าย VMS</h4>
          <p className='fs-12 text-gray-400 mb-0'>การทำงานของโปรแกรม</p>
        </div>
      </div>

      {bureauSign?.desktop_screen ? (
        <figure className='figure-large rounded-lg overflow-hidden'>
          <HLSLivePlayer
            hlsUrl={bureauSign.desktop_screen}
            figureClassName='w-full h-full cursor-pointer'
            showLiveBadge={true}
            enableViewportPause={true}
            cameraId={String(bureauSign.solution_id)}
            onClick={() => setModalData(bureauSign)}
          />
        </figure>
      ) : (
        <div className='figure-large rounded-lg bg-(--mid-gray) flex items-center justify-center'>
          <p className='text-gray-500 fs-12'>ไม่มีสตรีม</p>
        </div>
      )}
      <ModalVMSScreen
        open={modalData !== null}
        data={modalData}
        onClose={() => setModalData(null)}
      />
    </div>
  )
}

export default React.memo(DetailVMSSign)
