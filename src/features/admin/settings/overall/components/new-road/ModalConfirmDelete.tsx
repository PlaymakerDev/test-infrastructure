import { useDepartments } from '@/hooks/queries/manage/useDepartments'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetRoadModalData } from '@/stores/reducers/modal/customModalSlice'
import { APIResponsePMMSRoad, APIResponseProjectCount, RoadData } from '@/types/manage/road-api'
import { fmtNumber } from '@/utils/formatNumber'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { ConfigProvider, Modal } from 'antd'
import React, { useCallback, useMemo } from 'react'
import { toRouteCoords } from '../../data/roadGeom'
import RoadRouteMap from './RoadRouteMap'

interface Props {
  onDelete?: (id: number) => void
  isPending?: boolean
}

interface ContentProps {
  data?: RoadData | null
  pmms?: APIResponsePMMSRoad | null
  count?: APIResponseProjectCount | null
  canDelete?: boolean
}

const fmtLatLng = ([lng, lat]: [number, number]) => `${lat.toFixed(6)} , ${lng.toFixed(6)}`

const Content: React.FC<ContentProps> = (props) => {
  const { data, pmms, count, canDelete } = props
  const coords = useMemo(() => toRouteCoords(pmms?.res_data?.[0]?.geom), [pmms])

  const { data: departments, isLoading: isDepartmentsLoading, isError: isDepartmentsError } = useDepartments()

  const renderDpt = useCallback((departmentId?: number | null) => {
    if (data?.department?.department_short_name) return data.department.department_short_name
    if (isDepartmentsLoading) return 'กำลังโหลด...'
    if (isDepartmentsError) return 'เกิดข้อผิดพลาด'
    const department = departments?.find((dpt) => Number(dpt.id) === Number(departmentId))
    if (department?.department_short_name) return department.department_short_name
    return '-'
  }, [data, departments, isDepartmentsLoading, isDepartmentsError])

  const checkSta = useCallback((startSta?: string | null, endSta?: string | null) => {
    const res = [startSta, endSta].map((item) => item?.trim())
    if (res.some((item) => !item)) return '-'
    return res.join(' - ')
  }, [])

  return (
    <div className='mt-5'>
      <section>
        <div className='flex flex-col items-center justify-center gap-5'>
          <ExclamationCircleOutlined
            style={{
              fontSize: '7rem',
              color: canDelete ? 'var(--default-orange)' : 'var(--default-red)'
            }}
          />
          <div className='text-center'>
            <h2>{canDelete ? 'ยืนยันลบสายทางหรือไม่? ' : 'ไม่สามารถลบสายทางได้'}</h2>
            {canDelete ?
              <p>ระบบจะลบคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้</p>
              :
              <p>เนื่องจากระบบตรวจพบสายทางเกี่ยวข้อง <span className='text-(--default-red) font-bold'>{fmtNumber(Number(count?.project_count)) || 0} โครงการ</span></p>
            }
          </div>
        </div>
      </section>
      <section className='mt-5'>
        <div className={`rounded-lg border ${canDelete ? 'border-(--default-orange) bg-(--default-orange)/20' : 'border-(--default-red) bg-(--default-red)/20'} p-5`}>
          <p>รหัสสายทาง : {data?.road_code || '-'}</p>
          <p>ชื่อสายทาง : {data?.road_name || '-'}</p>
          <p>ตำบล : {data?.subdistrict || '-'}</p>
          <p>เขต : {data?.district || '-'}</p>
          <p>จังหวัด : {data?.province || '-'}</p>
          <p>ผู้ดูแลสายทาง : {renderDpt(data?.department_id)}</p>
          <p>กม.เริ่มต้น - กม.สิ้นสุด : {checkSta(data?.start_sta, data?.end_sta)}</p>
          <p>ระยะทาง : {data?.distance ? `${data?.distance} กิโลเมตร` : '-'}</p>
          {coords.length > 0 ? (
            <>
              <p>Latitude , Longitude :</p>
              {/* `!` — globals.css resets `ul { list-style: none }` unlayered, which beats the utility */}
              <ul className='list-disc! pl-5'>
                <li>{fmtLatLng(coords[0])} (เริ่มต้น)</li>
                <li>{fmtLatLng(coords[coords.length - 1])} (สิ้นสุด)</li>
              </ul>
            </>
          ) : (
            <p>Latitude , Longitude : -</p>
          )}
          <div className='mt-3'>
            <figure className='rounded-lg overflow-hidden'>
              <RoadRouteMap coords={coords} />
            </figure>
          </div>
        </div>
      </section>
    </div>
  )
}

const ModalConfirmDelete: React.FC<Props> = (props) => {
  const { onDelete, isPending } = props
  const { open, type, data, count, pmms } = useAppSelector((state) => state.custom_modal.road_modal)
  const dispatch = useAppDispatch()
  const canDelete = count?.project_count === 0

  const handleClose = useCallback(() => {
    dispatch(resetRoadModalData())
  }, [dispatch])

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#FFFFFF',
            borderRadiusLG: 20,
          }
        }
      }}
    >
      <Modal
        title={null}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={type === 'DELETE' ? open : false}
        okText={canDelete ? 'ยืนยัน' : 'รับทราบ'}
        cancelText={'ยกเลิก'}
        okButtonProps={{
          shape: 'round',
          loading: isPending,
        }}
        cancelButtonProps={{
          shape: 'round',
          disabled: isPending,
          className: canDelete ? '' : 'hidden!'
        }}
        onOk={() => canDelete ? data?.id != null && onDelete?.(data.id) : handleClose()}
        onCancel={handleClose}
        destroyOnHidden
        width={600}
        style={{ top: 10 }}
      >
        <Content
          data={data}
          count={count}
          pmms={pmms}
          canDelete={canDelete}
        />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalConfirmDelete)
