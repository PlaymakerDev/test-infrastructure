import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useAppDispatch } from '@/stores/hooks'
import { APIResponseVMSDetail, Solution } from '@/types/vms/detail-api'
import { Image } from 'antd'
import React, { useMemo } from 'react'
import { useDetailContext } from '../../../context'

const DEFAULT_ICON = '/images/icon-marker/Default.svg'

interface Props {
  data?: APIResponseVMSDetail
  isWarranty?: boolean
  isOnline?: boolean
}

interface SolutionPopupProps {
  data?: APIResponseVMSDetail;
  isWarranty?: boolean;
  isOnline?: boolean
  setOpenVMSScreen?: (value: { open: boolean; data?: APIResponseVMSDetail }) => void;
}

const SolutionPopup: React.FC<SolutionPopupProps> = (props) => {
  const { data, isWarranty, isOnline, setOpenVMSScreen } = props

  return (
    <div className={`min-w-50 rounded-lg border px-3 py-2.5 bg-(--dark-black) border-green-400`}>
      <section>
        <p className='fs-12'>ชื่อจุดติดตั้ง: <strong>{data?.solution?.solution_name || '-'}</strong></p>
        <p className='fs-12'>รหัสสายทาง: <strong>{data?.solution?.solution_location?.project_roads?.road?.road_code || '-'}</strong></p>
      </section>
      <section className='mt-1.5'>
        <HLSLivePlayer
          cameraId={String(data?.desktop_screen.id)}
          hlsUrl={data?.desktop_screen.desktop_screen}
          enableViewportPause
          figureClassName="h-40 min-h-0 max-h-none w-full mb-2 rounded-lg overflow-hidden cursor-pointer"
          onClick={() => setOpenVMSScreen?.({ open: true, data })}
        />
      </section>
    </div>
  )
}

const MapSection: React.FC<Props> = (props) => {
  const { data, isWarranty, isOnline } = props
  const { setOpenVMSScreen } = useDetailContext()

  const point = data?.solution?.geometry_point

  const lngLat = useMemo<[number, number] | null>(() => {
    if (!point || point.length < 2) return null
    if (point[0] === 0 && point[1] === 0) return null
    return [point[0], point[1]]
  }, [point])

  return (
    <>
      <BaseMap
        initialCenter={lngLat ?? undefined}
        initialZoom={lngLat ? 17 : 5.2}
        initialPitch={lngLat ? 45 : 0}
        initialBearing={lngLat ? -10 : 0}
        edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}
      >
        {lngLat && (
          <HTMLMarker
            key={data?.solution?.id}
            lngLat={lngLat}
            anchor="bottom"
            offset={[0, 19]}
            title={data?.solution?.solution_name}
            popup={() => (
              <SolutionPopup
                data={data}
                isWarranty={isWarranty}
                isOnline={isOnline}
                setOpenVMSScreen={setOpenVMSScreen}
              />
            )}
            popupOptions={{ offset: 10, closeButton: false }}
          >
            <Image
              src={DEFAULT_ICON}
              alt="station-pin"
              width={52}
              height={55}
              preview={false}
            />
          </HTMLMarker>
        )}
      </BaseMap>
    </>
  )
}

export default React.memo<Props>(MapSection)
