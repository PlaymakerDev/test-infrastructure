import React, { RefObject, useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { App, Col, Input, Row } from 'antd'
import { useCreateCamera } from '@/hooks/queries/manage'
import type { SolutionList, SolutionLocation } from '@/types/manage/project-detail-api'
import { errText, useProjectContext } from '../context'
import { IP_PATTERN, LAT_LNG_PATTERN, sanitizeIP, sanitizeLatLng, toGeometryPoint } from '../data/formHelpers'

interface Props {
  /** Install point the camera is being added under. */
  item?: SolutionLocation | null
  /** The CCTV solution (tbl_solution.id) the new camera attaches to. */
  record?: SolutionList | null
  submitRef: RefObject<HTMLButtonElement | null>
  onSuccess?: () => void
}

interface FormCreateCameraValues {
  camera_name: string
  sta: string
  ip_address: string
  hls_url: string
  latitude: string
  longitude: string
  remark: string
}

/** Add a physical CCTV camera under an existing CCTV solution. Backend:
 *  `POST /api-v2/cctv/cameras`. Rendered by ModalCreateDevice (type
 *  CREATE_CAMERA) — the modal's ยืนยัน button clicks `submitRef`. */
const FormCreateCamera: React.FC<Props> = (props) => {
  const { item, record, submitRef, onSuccess } = props
  const { roadSolution } = useProjectContext()
  const { message } = App.useApp()
  const { mutate: createCamera, isPending } = useCreateCamera()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormCreateCameraValues>({
    defaultValues: {
      camera_name: '',
      sta: '',
      ip_address: '',
      hls_url: '',
      latitude: '',
      longitude: '',
      remark: '',
    },
  })

  const onSubmit = useCallback((values: FormCreateCameraValues) => {
    if (!record?.id) return
    createCamera(
      {
        solution_id: record.id,
        camera_name: values.camera_name.trim(),
        sta: values.sta.trim(),
        hls_url: values.hls_url.trim(),
        geometry_point: toGeometryPoint(values.longitude, values.latitude),
        // Both optional on the wire — omit / null rather than send "".
        ip_address: values.ip_address.trim() || undefined,
        remark: values.remark.trim() || null,
      },
      {
        onSuccess: () => {
          message.success('เพิ่มอุปกรณ์สำเร็จ')
          onSuccess?.()
        },
        onError: (error) => {
          message.error(errText(error, 'เพิ่มอุปกรณ์ไม่สำเร็จ'))
        },
      },
    )
  }, [record, createCamera, onSuccess, message])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <section>
        <div className='rounded-lg p-3 bg-(--light-gray-2)'>
          <div className='flex justify-between items-center flex-wrap gap-3'>
            <h4>{item?.location_name || '-'}</h4>
            <div className='rounded-2xl px-3 border border-(--yellow)'>
              <p className='fs-12'>{roadSolution?.road?.road_code || '-'}</p>
            </div>
          </div>
        </div>
      </section>
      <section className='mt-5'>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Controller
              control={control}
              name='camera_name'
              rules={{ required: 'กรุณาระบุชื่อกล้อง' }}
              render={({ field }) => (
                <fieldset>
                  <label className='text-(--yellow)'>ชื่อกล้อง <span className='text-red-500'>*</span></label>
                  <Input
                    {...field}
                    placeholder='กรุณาระบุชื่อกล้อง(รายละเอียดการติดตั้ง)...'
                    size='large'
                  />
                  {errors.camera_name && <p className='fs-12 text-red-500'>{errors.camera_name.message}</p>}
                </fieldset>
              )}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Controller
              control={control}
              name='sta'
              rules={{ required: 'กรุณาระบุเลขที่ กม.' }}
              render={({ field }) => (
                <fieldset>
                  <label className='text-(--yellow)'>กม.ที่ / STA <span className='text-red-500'>*</span></label>
                  <Input {...field} placeholder='เช่น 10+500' size='large' />
                  {errors.sta && <p className='fs-12 text-red-500'>{errors.sta.message}</p>}
                </fieldset>
              )}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Controller
              control={control}
              name='ip_address'
              // Optional — only validate the format when something was typed.
              rules={{ validate: (v) => !v || IP_PATTERN.test(v) || 'รูปแบบ IP Address ไม่ถูกต้อง' }}
              render={({ field }) => (
                <fieldset>
                  <label className='text-(--yellow)'>IP Address</label>
                  <Input
                    {...field}
                    placeholder='กรุณาระบุ IP Address...'
                    size='large'
                    onChange={(e) => field.onChange(sanitizeIP(e.target.value))}
                  />
                  {errors.ip_address && <p className='fs-12 text-red-500'>{errors.ip_address.message}</p>}
                </fieldset>
              )}
            />
          </Col>
          <Col span={24}>
            <Controller
              control={control}
              name='hls_url'
              rules={{ required: 'กรุณาระบุ URL HLS' }}
              render={({ field }) => (
                <fieldset>
                  <label className='text-(--yellow)'>URL HLS (.m3u8) <span className='text-red-500'>*</span></label>
                  <Input {...field} placeholder='กรุณาระบุ URL HLS (.m3u8)...' size='large' />
                  {errors.hls_url && <p className='fs-12 text-red-500'>{errors.hls_url.message}</p>}
                </fieldset>
              )}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Controller
              control={control}
              name='latitude'
              rules={{
                required: 'กรุณาระบุ Latitude',
                pattern: { value: LAT_LNG_PATTERN, message: 'รูปแบบ Latitude ไม่ถูกต้อง' },
              }}
              render={({ field }) => (
                <fieldset>
                  <label className='text-(--yellow)'>Latitude <span className='text-red-500'>*</span></label>
                  <Input
                    {...field}
                    placeholder='กรุณาระบุ Latitude...'
                    size='large'
                    onChange={(e) => field.onChange(sanitizeLatLng(e.target.value))}
                  />
                  {errors.latitude && <p className='fs-12 text-red-500'>{errors.latitude.message}</p>}
                </fieldset>
              )}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Controller
              control={control}
              name='longitude'
              rules={{
                required: 'กรุณาระบุ Longitude',
                pattern: { value: LAT_LNG_PATTERN, message: 'รูปแบบ Longitude ไม่ถูกต้อง' },
              }}
              render={({ field }) => (
                <fieldset>
                  <label className='text-(--yellow)'>Longitude <span className='text-red-500'>*</span></label>
                  <Input
                    {...field}
                    placeholder='กรุณาระบุ Longitude...'
                    size='large'
                    onChange={(e) => field.onChange(sanitizeLatLng(e.target.value))}
                  />
                  {errors.longitude && <p className='fs-12 text-red-500'>{errors.longitude.message}</p>}
                </fieldset>
              )}
            />
          </Col>
          <Col span={24}>
            <Controller
              control={control}
              name='remark'
              render={({ field }) => (
                <fieldset>
                  <label className='text-(--yellow)'>หมายเหตุ</label>
                  <Input.TextArea {...field} placeholder='กรุณาระบุหมายเหตุ...' rows={2} />
                </fieldset>
              )}
            />
          </Col>
        </Row>
      </section>
      <button ref={submitRef} type='submit' hidden disabled={isPending} />
    </form>
  )
}

export default React.memo<Props>(FormCreateCamera)
