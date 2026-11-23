import React, { useCallback, useState } from 'react'
import { RefObject } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { App, Button, Col, Divider, Input, Row, Select } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useCreateCamera, useUpdateCamera } from '@/hooks/queries/manage'
import { ProjectRoadCamera, SolutionLocation } from '@/types/manage/project-detail-api'
import { toHttpUrl } from '@/utils/httpUrl'
import { useProjectContext } from '../context'
import {
  IP_PATTERN,
  LAT_LNG_PATTERN,
  STA_FORMAT_MESSAGE,
  STA_PATTERN,
  readErrorMessage,
  sanitizeIP,
  sanitizeLatLng,
  sanitizeSta,
  toGeometryPoint,
} from '../utils/form'

interface Props {
  /** null → create. */
  data?: ProjectRoadCamera | null
  /** The camera's current Public URL (edit only). Read from the camera's own
   *  record by ModalCreateCamera — `data` comes from the road list, which
   *  doesn't carry it. */
  accessUrl?: string | null
  /** The road's install points — the จุดติดตั้ง this camera stands at. */
  locations: SolutionLocation[]
  /** Preselected point when the road has exactly one, or the last one used. */
  defaultLocationId?: number | null
  submitRef: RefObject<HTMLButtonElement | null>
  onSuccess?: () => void
}

interface FormCreateCameraValues {
  camera_name: string
  solution_location_id: number | null
  sta: string
  hls_url: string
  access_url: string
  ip_address: string
  latitude: string
  longitude: string
  remark: string
}

/** Public URL field state: tucked away behind its "+ Public URL" text button
 *  until needed (user spec — optional, rarely filled). 'added' = opened by
 *  that click, so the new box takes focus; 'seeded' = the camera already
 *  has one, shown as-is. */
type PublicUrlField = 'hidden' | 'seeded' | 'added'

const PUBLIC_URL_FORMAT_MESSAGE = 'รูปแบบ Public URL ไม่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)'

/**
 * Add/edit one CCTV camera on a สายทาง.
 *
 * The form asks for the จุดติดตั้ง rather than a solution: CCTV is one
 * solution per (โครงการ + สายทาง) and the backend resolves — or creates —
 * it from the point. That is also why editing can move a camera between
 * points without touching anything else.
 */
const FormCreateCamera: React.FC<Props> = (props) => {
  const { data, accessUrl, locations, defaultLocationId, submitRef, onSuccess } = props
  const { message } = App.useApp()
  const { roadSolution, createLocation, nextLocationName, isCreating: isCreatingLocation } = useProjectContext()

  // Inline "create a จุดติดตั้ง" field inside the dropdown — a road often
  // gains its point and its first camera in the same sitting, and bouncing
  // out to the tab strip to add one would throw away the half-filled form.
  const [newLocationName, setNewLocationName] = useState('')

  // Once shown it stays shown (an emptied box just saves no Public URL), so
  // hiding can never leave a value behind that the user can't see.
  const [publicUrlField, setPublicUrlField] = useState<PublicUrlField>(
    accessUrl?.trim() ? 'seeded' : 'hidden',
  )

  const { mutate: createCamera, isPending: isCreatePending } = useCreateCamera()
  const { mutate: updateCamera, isPending: isUpdatePending } = useUpdateCamera()

  const form = useForm<FormCreateCameraValues>({
    defaultValues: {
      camera_name: data?.camera_name ?? '',
      solution_location_id:
        data?.solution_location_id ??
        defaultLocationId ??
        (locations.length === 1 ? locations[0].solution_location_id : null),
      sta: data?.sta ?? '',
      hls_url: data?.hls_url ?? '',
      access_url: accessUrl ?? '',
      ip_address: data?.ip_address ?? '',
      // point_geometry ships as a bare [lng, lat] array — longitude is FIRST.
      // Guard the index so a camera saved without a point doesn't seed the
      // literal string "undefined".
      latitude: data?.point_geometry?.[1] != null ? String(data.point_geometry[1]) : '',
      longitude: data?.point_geometry?.[0] != null ? String(data.point_geometry[0]) : '',
      remark: data?.remark ?? '',
    },
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form

  /** Creates the point and selects it, so the user lands back on a complete
   *  form. An empty box means "just use the suggested name". */
  const handleAddLocation = useCallback(async (
    selectLocation: (solutionLocationId: number) => void,
  ) => {
    const name = newLocationName.trim() || nextLocationName
    const created = await createLocation(name)
    if (!created) return
    selectLocation(created.solution_location_id)
    setNewLocationName('')
  }, [newLocationName, nextLocationName, createLocation])

  const onSubmit = useCallback((values: FormCreateCameraValues) => {
    if (!values.solution_location_id) return

    const body = {
      solution_location_id: Number(values.solution_location_id),
      camera_name: values.camera_name,
      sta: values.sta,
      hls_url: values.hls_url,
      // Always sent, null when empty: PUT replaces the whole camera, so
      // leaving it out would clear a Public URL the user never touched.
      access_url: values.access_url.trim() || null,
      geometry_point: toGeometryPoint(values.longitude, values.latitude),
      ip_address: values.ip_address,
      remark: values.remark || null,
    }

    if (data?.id) {
      updateCamera({ id: data.id, data: body }, {
        onSuccess: () => {
          message.success('แก้ไขกล้องสำเร็จ')
          onSuccess?.()
        },
        onError: (error) => {
          message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการแก้ไขกล้อง'))
        },
      })
      return
    }

    createCamera(body, {
      onSuccess: () => {
        message.success('เพิ่มกล้องสำเร็จ')
        onSuccess?.()
      },
      onError: (error) => {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการเพิ่มกล้อง'))
      },
    })
  }, [data, createCamera, updateCamera, message, onSuccess])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Same header block as FormCreateDevice, so the two modals on this
          page read alike. It names the สายทาง rather than a จุดติดตั้ง:
          CCTV covers the whole road, and which point the camera stands at
          is a field below, not fixed context. */}
      <section>
        <div className='rounded-lg p-3 bg-(--light-gray-2)'>
          <div className='flex justify-between items-center flex-wrap gap-3'>
            <h4>อุปกรณ์ CCTV</h4>
            <div className='rounded-2xl px-3 border border-(--yellow)'>
              <p className='fs-12'>{roadSolution?.road?.road_code || '-'}</p>
            </div>
          </div>
        </div>
      </section>
      <section className='mt-5'>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={12}>
            <Controller
              control={control}
              name='camera_name'
              rules={{ required: 'กรุณาระบุชื่อกล้อง' }}
              render={({ field }) => (
                <fieldset>
                  <label className='text-(--yellow)'>ชื่ออุปกรณ์ <span className='text-red-500'>*</span></label>
                  <Input
                    {...field}
                    name={field.name}
                    placeholder='กรุณาระบุชื่อกล้อง...'
                    size='large'
                  />
                  {errors.camera_name && <p className='fs-12 text-red-500'>{errors.camera_name.message}</p>}
                </fieldset>
              )}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={12}>
            <Controller
              control={control}
              name='solution_location_id'
              rules={{ required: 'กรุณาเลือกจุดติดตั้ง' }}
              render={({ field }) => (
                <fieldset>
                  <label className='text-(--yellow)'>จุดติดตั้ง <span className='text-red-500'>*</span></label>
                  <Select
                    {...field}
                    placeholder='กรุณาเลือกจุดติดตั้ง...'
                    size='large'
                    showSearch={{ optionFilterProp: 'label' }}
                    options={locations.map((location) => ({
                      label: location.location_name,
                      value: location.solution_location_id,
                    }))}
                    className='w-full!'
                    popupRender={(menu) => (
                      <>
                        {menu}
                        <Divider style={{ margin: '8px 0' }} />
                        <div className='flex items-center gap-2 px-2 pb-1'>
                          <Input
                            placeholder={nextLocationName}
                            value={newLocationName}
                            onChange={(e) => setNewLocationName(e.target.value)}
                            // Without this the Select swallows the keystrokes
                            // for its own type-ahead and the box stays empty.
                            onKeyDown={(e) => e.stopPropagation()}
                            onPressEnter={(e) => {
                              e.preventDefault()
                              handleAddLocation(field.onChange)
                            }}
                          />
                          <Button
                            type='text'
                            htmlType='button'
                            icon={<PlusOutlined />}
                            loading={isCreatingLocation}
                            onClick={() => handleAddLocation(field.onChange)}
                          >
                            เพิ่มจุดติดตั้ง
                          </Button>
                        </div>
                      </>
                    )}
                  />
                  {errors.solution_location_id && <p className='fs-12 text-red-500'>{errors.solution_location_id.message}</p>}
                </fieldset>
              )}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={12}>
            <Controller
              control={control}
              name='sta'
              rules={{
                required: 'กรุณาระบุเลขที่ กม.',
                pattern: { value: STA_PATTERN, message: STA_FORMAT_MESSAGE },
              }}
              render={({ field }) => (
                <fieldset>
                  {/* The road's CCTV solution is named after the span of its
                      cameras' กม. values, so this field is what produces
                      e.g. "ชม.2025 กม.0+100 - 6+000" — a malformed value
                      here would silently drop out of that span. */}
                  <label className='text-(--yellow)'>กม.ที่ <span className='text-red-500'>*</span></label>
                  <Input
                    {...field}
                    name={field.name}
                    placeholder='เช่น 0+500'
                    size='large'
                    onChange={(e) => field.onChange(sanitizeSta(e.target.value))}
                  />
                  {errors.sta && <p className='fs-12 text-red-500'>{errors.sta.message}</p>}
                </fieldset>
              )}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={12}>
            <Controller
              control={control}
              name='ip_address'
              rules={{
                validate: (value) =>
                  !value || IP_PATTERN.test(value) || 'รูปแบบ Local IP Adress ไม่ถูกต้อง',
              }}
              render={({ field }) => (
                <fieldset>
                  <label className='text-(--yellow)'>Local IP Adress</label>
                  <Input
                    {...field}
                    name={field.name}
                    placeholder='กรุณาระบุ Local IP Adress...'
                    size='large'
                    onChange={(e) => field.onChange(sanitizeIP(e.target.value))}
                  />
                  {errors.ip_address && <p className='fs-12 text-red-500'>{errors.ip_address.message}</p>}
                </fieldset>
              )}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
            <Controller
              control={control}
              name='hls_url'
              rules={{ required: 'กรุณาระบุ Live Stream URL' }}
              render={({ field }) => (
                <fieldset>
                  <div className='flex items-center justify-between gap-3'>
                    <label className='text-(--yellow)'>Live Stream (HLS) <span className='text-red-500'>*</span></label>
                    {/* Public URL rides on this field's label row as a text
                        button — optional and rarely filled, so it stays out
                        of the way until asked for. Link-style text button in
                        the same blue as TableSolution's on this page. */}
                    {publicUrlField === 'hidden' && (
                      <Button
                        type='link'
                        htmlType='button'
                        size='small'
                        icon={<PlusOutlined />}
                        onClick={() => setPublicUrlField('added')}
                        className='text-(--default-blue)! px-0! h-auto! fs-12'
                      >
                        Public URL
                      </Button>
                    )}
                  </div>
                  <Input
                    {...field}
                    name={field.name}
                    placeholder='https://.../index.m3u8'
                    size='large'
                  />
                  {errors.hls_url && <p className='fs-12 text-red-500'>{errors.hls_url.message}</p>}
                </fieldset>
              )}
            />
          </Col>
          {publicUrlField !== 'hidden' && (
            <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
              <Controller
                control={control}
                name='access_url'
                rules={{
                  validate: (value) =>
                    !value.trim() || toHttpUrl(value) !== null || PUBLIC_URL_FORMAT_MESSAGE,
                }}
                render={({ field }) => (
                  <fieldset>
                    {/* Opened by the Live Stream modal's camera button
                        (CCTVModal) — not required. */}
                    <label className='text-(--yellow)'>Public URL</label>
                    <Input
                      {...field}
                      name={field.name}
                      placeholder='https://...'
                      size='large'
                      allowClear
                      autoFocus={publicUrlField === 'added'}
                    />
                    {errors.access_url && <p className='fs-12 text-red-500'>{errors.access_url.message}</p>}
                  </fieldset>
                )}
              />
            </Col>
          )}
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={12}>
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
                    name={field.name}
                    placeholder='กรุณาระบุ Latitude...'
                    size='large'
                    onChange={(e) => field.onChange(sanitizeLatLng(e.target.value))}
                  />
                  {errors.latitude && <p className='fs-12 text-red-500'>{errors.latitude.message}</p>}
                </fieldset>
              )}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={12}>
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
                    name={field.name}
                    placeholder='กรุณาระบุ Longitude...'
                    size='large'
                    onChange={(e) => field.onChange(sanitizeLatLng(e.target.value))}
                  />
                  {errors.longitude && <p className='fs-12 text-red-500'>{errors.longitude.message}</p>}
                </fieldset>
              )}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
            <Controller
              control={control}
              name='remark'
              render={({ field }) => (
                <fieldset>
                  <label className='text-(--yellow)'>หมายเหตุ</label>
                  <Input
                    {...field}
                    name={field.name}
                    placeholder='กรุณาระบุหมายเหตุ...'
                    size='large'
                  />
                </fieldset>
              )}
            />
          </Col>
        </Row>
      </section>
      <button
        ref={submitRef}
        type='submit'
        hidden
        disabled={isCreatePending || isUpdatePending}
      />
    </form>
  )
}

export default React.memo<Props>(FormCreateCamera)
