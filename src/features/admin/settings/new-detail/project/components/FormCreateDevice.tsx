import React, { useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { RefObject } from 'react'
import { APIRequestCreateSolution, APIRequestUpdateSolution, APIResponseSolutionByID, SolutionLocation } from '@/types/manage/project-detail-api'
import { App, Col, Input, Row, Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getSolutionTypesAPI } from '@/services/routes/SolutionService'
import { SOLUTION_TYPE } from '@/constants'
import { useCreateProjectSolution, useUpdateProjectSolution } from '@/hooks/queries/manage'
import { useLightingDiagramTemplates } from '@/hooks/queries/lighting'
import { SOLUTION_TYPE_CCTV } from '../data/solutionType'
import {
  IMEI_PATTERN,
  LIGHTING_CONNECTION_TYPE_OPTIONS,
  LIGHTING_PHASE_OPTIONS,
  LIGHTING_SEM_TYPE_OPTIONS,
  LIGHTING_SEND_FREQUENCY_OPTIONS,
  LIGHTING_TYPE_IOT,
  LIGHTING_TYPE_OPTIONS,
  SOLUTION_TYPE_LIGHTING,
} from '../data/lighting'
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
import { useProjectContext } from '../context'

interface Props {
  data?: APIResponseSolutionByID | null
  item?: SolutionLocation | null
  submitRef: RefObject<HTMLButtonElement | null>
  onSuccess?: () => void
}

interface FormCreateDeviceValues {
  anydesk_id: string
  latitude: string
  longitude: string
  ip_address: string
  remarks: string
  solution_location_id: number | string | null
  solution_name: string
  solution_type_id: number | string | null
  sta: string
  zt_ip_address: string
  // Lighting (solution_type_id = 6) only — sent as the nested `lighting`
  // block. Flat here because RHF handles flat fields more simply and the
  // shape is assembled once at submit.
  lighting_type: 1 | 2 | null
  lighting_imei: string
  lighting_phase_type: string
  lighting_sem_type: string
  lighting_diagram_type: string
  lighting_connection_type: string
  lighting_send_frequency: string
}

const FormCreateDevice: React.FC<Props> = (props) => {
  const { data, item, submitRef, onSuccess } = props
  const { roadSolution } = useProjectContext()
  const { message } = App.useApp()
  const isUpdate = !!data?.id

  const { mutate: createSolution, isPending: isCreatePending } = useCreateProjectSolution()
  const { mutate: updateSolution, isPending: isUpdatePending } = useUpdateProjectSolution()

  const {
    data: solutionType,
    isLoading: isSolutionTypeLoading,
  } = useQuery({
    queryKey: ['solution-type'],
    queryFn: () => getSolutionTypesAPI()
  })

  // CCTV is managed at the สายทาง level (see SOLUTION_TYPE_CCTV) — the
  // backend rejects POST /manage/solution for it, so offering it here would
  // only produce an error.
  //
  // Labels are resolved here rather than via `fieldNames`, because
  // tbl_solution_type.solution_name_atlas is EMPTY for all 9 rows in
  // production: pointing the label at it made every option render as its
  // own id ("1", "2", …) and left the input blank after picking one. Fall
  // back to the same SOLUTION_TYPE map TableSolution displays, so the
  // dropdown and the table agree, then to the raw backend name.
  const solutionTypeOptions = useMemo(
    () => (solutionType?.data ?? [])
      .filter((type) => type.id !== SOLUTION_TYPE_CCTV)
      .map((type) => ({
        label:
          type.solution_name_atlas?.trim() ||
          SOLUTION_TYPE[String(type.id) as keyof typeof SOLUTION_TYPE] ||
          type.solution_name,
        value: type.id,
      })),
    [solutionType],
  )

  const form = useForm<FormCreateDeviceValues>({
    defaultValues: {
      anydesk_id: data?.anydesk ?? '',
      // geometry_point ships as a bare [lng, lat] array on this endpoint —
      // longitude is FIRST. Guard the index so a solution saved without a
      // point doesn't seed the literal string "undefined".
      latitude: data?.geometry_point?.[1] != null ? String(data.geometry_point[1]) : '',
      longitude: data?.geometry_point?.[0] != null ? String(data.geometry_point[0]) : '',
      ip_address: data?.ip_address ?? '',
      remarks: data?.remarks ?? '',
      solution_location_id: data?.solution_location_id ?? null,
      solution_type_id: data?.solution_type_id ?? null,
      solution_name: data?.solution_name ?? '',
      sta: data?.sta ?? '',
      zt_ip_address: data?.zt_ip_address ?? '',
      // Lighting config is create-only — PUT /manage/solution/{id} has no
      // `lighting` block, so an EDIT never seeds or sends these.
      lighting_type: null,
      lighting_imei: '',
      lighting_phase_type: '',
      lighting_sem_type: '',
      lighting_diagram_type: '',
      lighting_connection_type: '',
      lighting_send_frequency: '',
    }
  })

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = form

  // The Lighting block only exists on create, and only for the IMEI-bearing
  // device — a Lora gateway gets just a status row, so the IoT fields below
  // would be written nowhere.
  const isLighting = !isUpdate && Number(watch('solution_type_id')) === SOLUTION_TYPE_LIGHTING
  const isLightingIoT = isLighting && Number(watch('lighting_type')) === LIGHTING_TYPE_IOT

  const {
    data: diagramTemplates,
    isLoading: isTemplatesLoading,
  } = useLightingDiagramTemplates(isLightingIoT)

  const onCreate = useCallback((values: FormCreateDeviceValues) => {
    if (!item?.solution_location_id) return

    const body: APIRequestCreateSolution = {
      anydesk_id: values.anydesk_id,
      geometry_point: toGeometryPoint(values.longitude, values.latitude),
      ip_address: values.ip_address,
      remarks: values.remarks,
      solution_location_id: item.solution_location_id,
      solution_name: values.solution_name,
      solution_type_id: Number(values.solution_type_id),
      sta: values.sta,
      zt_ip_address: values.zt_ip_address,
    }

    // Without this block the backend creates a bare tbl_lighting row with no
    // IoT device — no IMEI, so no diagram, no logs, no electricity data.
    if (Number(values.solution_type_id) === SOLUTION_TYPE_LIGHTING && values.lighting_type) {
      body.lighting =
        Number(values.lighting_type) === LIGHTING_TYPE_IOT
          ? {
            lighting_type: LIGHTING_TYPE_IOT,
            imei: values.lighting_imei.trim(),
            phase_type: values.lighting_phase_type,
            sem_type: values.lighting_sem_type,
            // The template name — the backend copies that template into this
            // device's diagram, which is what makes the circuit drawing exist.
            diagram_type: values.lighting_diagram_type,
            connection_type: values.lighting_connection_type || undefined,
            send_frequency: values.lighting_send_frequency || undefined,
          }
          : { lighting_type: 1 }
    }

    createSolution(body, {
      onSuccess: () => {
        message.success('สร้างอุปกรณ์สำเร็จ')
        onSuccess?.()
      },
      onError: (error) => {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการสร้างอุปกรณ์'))
      },
    })
  }, [item, createSolution, onSuccess, message])

  const onUpdate = useCallback((values: FormCreateDeviceValues) => {
    if (!data?.id) return

    // EX BODY — no solution_type_id / solution_location_id: both are fixed
    // once the solution exists (hence the ประเภทงาน field is hidden on edit).
    // {
    //   "anydesk_id": "string",
    //   "geometry_point": { "type": "Point", "coordinates": [lng, lat] },
    //   "ip_address": "string",
    //   "remarks": "string",
    //   "solution_name": "string",
    //   "sta": "string",
    //   "zt_ip_address": "string"
    // }
    const body: APIRequestUpdateSolution = {
      anydesk_id: values.anydesk_id,
      geometry_point: toGeometryPoint(values.longitude, values.latitude),
      ip_address: values.ip_address,
      remarks: values.remarks,
      solution_name: values.solution_name,
      sta: values.sta,
      zt_ip_address: values.zt_ip_address,
    }

    updateSolution({ id: data.id, data: body }, {
      onSuccess: () => {
        message.success('แก้ไขอุปกรณ์สำเร็จ')
        onSuccess?.()
      },
      onError: (error) => {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการแก้ไขอุปกรณ์'))
      },
    })
  }, [updateSolution, onSuccess, data, message])

  const onSubmit = useCallback((values: FormCreateDeviceValues) => {
    if (data?.id) {
      onUpdate(values)
    } else {
      onCreate(values)
    }
  }, [data, onCreate, onUpdate])

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
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
            <Controller
              control={control}
              name='solution_name'
              rules={{ required: 'กรุณาระบุชื่อจุดติดตั้ง' }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>ชื่อจุดติดตั้ง <span className='text-red-500'>*</span></label>
                    <Input
                      {...field}
                      name={field.name}
                      placeholder="กรุณาระบุชื่อจุดติดตั้ง..."
                      size='large'
                    />
                    {errors.solution_name && <p className='fs-12 text-red-500'>{errors.solution_name.message}</p>}
                  </fieldset>
                )
              }}
            />
          </Col>
          {!isUpdate && (
            <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
              <Controller
                control={control}
                name='solution_type_id'
                rules={{ required: 'กรุณาเลือกประเภทงาน' }}
                render={({ field }) => {
                  return (
                    <fieldset>
                      <label className='text-(--yellow)'>ประเภทงาน <span className='text-red-500'>*</span></label>
                      <Select
                        {...field}
                        placeholder="กรุณาเลือกประเภทงาน..."
                        size='large'
                        allowClear
                        showSearch={{ optionFilterProp: 'label' }}
                        loading={isSolutionTypeLoading}
                        options={solutionTypeOptions}
                        className="w-full!"
                      />
                      {errors.solution_type_id && <p className='fs-12 text-red-500'>{errors.solution_type_id.message}</p>}
                    </fieldset>
                  )
                }}
              />
            </Col>
          )}
          {isLighting && (
            <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
              <Controller
                control={control}
                name='lighting_type'
                rules={{ required: 'กรุณาเลือกชนิดอุปกรณ์' }}
                render={({ field }) => (
                  <fieldset>
                    <label className='text-(--yellow)'>ชนิดอุปกรณ์ <span className='text-red-500'>*</span></label>
                    <Select
                      {...field}
                      placeholder='เลือกชนิดอุปกรณ์...'
                      size='large'
                      options={LIGHTING_TYPE_OPTIONS}
                      className='w-full!'
                    />
                    {errors.lighting_type && <p className='fs-12 text-red-500'>{errors.lighting_type.message}</p>}
                  </fieldset>
                )}
              />
            </Col>
          )}
          {isLightingIoT && (
            <>
              <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={12}>
                <Controller
                  control={control}
                  name='lighting_imei'
                  rules={{
                    required: 'กรุณาระบุ IMEI',
                    pattern: { value: IMEI_PATTERN, message: 'IMEI ควรเป็นตัวเลข 14-20 หลัก' },
                  }}
                  render={({ field }) => (
                    <fieldset>
                      <label className='text-(--yellow)'>IMEI <span className='text-red-500'>*</span></label>
                      <Input
                        {...field}
                        name={field.name}
                        placeholder='กรุณาระบุ IMEI...'
                        size='large'
                        inputMode='numeric'
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                      />
                      {errors.lighting_imei && <p className='fs-12 text-red-500'>{errors.lighting_imei.message}</p>}
                    </fieldset>
                  )}
                />
              </Col>
              <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={12}>
                <Controller
                  control={control}
                  name='lighting_phase_type'
                  rules={{ required: 'กรุณาเลือก Phase' }}
                  render={({ field }) => (
                    <fieldset>
                      <label className='text-(--yellow)'>Phase <span className='text-red-500'>*</span></label>
                      <Select
                        {...field}
                        placeholder='เลือก Phase...'
                        size='large'
                        options={LIGHTING_PHASE_OPTIONS}
                        className='w-full!'
                      />
                      {errors.lighting_phase_type && <p className='fs-12 text-red-500'>{errors.lighting_phase_type.message}</p>}
                    </fieldset>
                  )}
                />
              </Col>
              <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={12}>
                <Controller
                  control={control}
                  name='lighting_sem_type'
                  rules={{ required: 'กรุณาเลือกประเภท Datalog' }}
                  render={({ field }) => (
                    <fieldset>
                      <label className='text-(--yellow)'>ประเภท Datalog <span className='text-red-500'>*</span></label>
                      <Select
                        {...field}
                        placeholder='เลือกประเภท Datalog...'
                        size='large'
                        showSearch={{ optionFilterProp: 'label' }}
                        options={LIGHTING_SEM_TYPE_OPTIONS}
                        className='w-full!'
                      />
                      {errors.lighting_sem_type && <p className='fs-12 text-red-500'>{errors.lighting_sem_type.message}</p>}
                    </fieldset>
                  )}
                />
              </Col>
              <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={12}>
                <Controller
                  control={control}
                  name='lighting_diagram_type'
                  rules={{ required: 'กรุณาเลือกแบบผังวงจร' }}
                  render={({ field }) => (
                    <fieldset>
                      {/* The value IS a template name — the backend copies
                          that template into this device's diagram on create,
                          so the circuit drawing exists without anyone
                          opening the editor. */}
                      <label className='text-(--yellow)'>แบบผังวงจร (Diagram) <span className='text-red-500'>*</span></label>
                      <Select
                        {...field}
                        placeholder='เลือกแบบผังวงจร...'
                        size='large'
                        showSearch={{ optionFilterProp: 'label' }}
                        loading={isTemplatesLoading}
                        options={(diagramTemplates ?? []).map((t) => ({ label: t.name, value: t.name }))}
                        notFoundContent={isTemplatesLoading ? 'กำลังโหลด...' : 'ยังไม่มีแบบผังวงจรในระบบ'}
                        className='w-full!'
                      />
                      {errors.lighting_diagram_type && <p className='fs-12 text-red-500'>{errors.lighting_diagram_type.message}</p>}
                    </fieldset>
                  )}
                />
              </Col>
              <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={12}>
                <Controller
                  control={control}
                  name='lighting_connection_type'
                  render={({ field }) => (
                    <fieldset>
                      <label className='text-(--yellow)'>ประเภทการเชื่อมต่อ</label>
                      <Select
                        {...field}
                        placeholder='เลือกประเภทการเชื่อมต่อ...'
                        size='large'
                        allowClear
                        options={LIGHTING_CONNECTION_TYPE_OPTIONS}
                        className='w-full!'
                      />
                    </fieldset>
                  )}
                />
              </Col>
              <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={12}>
                <Controller
                  control={control}
                  name='lighting_send_frequency'
                  render={({ field }) => (
                    <fieldset>
                      <label className='text-(--yellow)'>ความถี่การส่งข้อมูล</label>
                      <Select
                        {...field}
                        placeholder='เลือกความถี่การส่งข้อมูล...'
                        size='large'
                        allowClear
                        options={LIGHTING_SEND_FREQUENCY_OPTIONS}
                        className='w-full!'
                      />
                    </fieldset>
                  )}
                />
              </Col>
            </>
          )}
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={12}>
            <Controller
              control={control}
              name='latitude'
              rules={{
                required: 'กรุณาระบุ Latitude',
                pattern: { value: LAT_LNG_PATTERN, message: 'รูปแบบ Latitude ไม่ถูกต้อง' },
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>Latitude <span className='text-red-500'>*</span></label>
                    <Input
                      {...field}
                      name={field.name}
                      placeholder="กรุณาระบุ Latitude..."
                      size='large'
                      onChange={(e) => {
                        field.onChange(sanitizeLatLng(e.target.value))
                      }}
                    />
                    {errors.latitude && <p className='fs-12 text-red-500'>{errors.latitude.message}</p>}
                  </fieldset>
                )
              }}
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
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>Longitude <span className='text-red-500'>*</span></label>
                    <Input
                      {...field}
                      name={field.name}
                      placeholder="กรุณาระบุ Longitude..."
                      size='large'
                      onChange={(e) => {
                        field.onChange(sanitizeLatLng(e.target.value))
                      }}
                    />
                    {errors.longitude && <p className='fs-12 text-red-500'>{errors.longitude.message}</p>}
                  </fieldset>
                )
              }}
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
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>กม.ที่ <span className='text-red-500'>*</span></label>
                    <Input
                      {...field}
                      name={field.name}
                      placeholder="เช่น 0+500"
                      size='large'
                      onChange={(e) => field.onChange(sanitizeSta(e.target.value))}
                    />
                    {errors.sta && <p className='fs-12 text-red-500'>{errors.sta.message}</p>}
                  </fieldset>
                )
              }}
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
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>Local IP Adress</label>
                    <Input
                      {...field}
                      name={field.name}
                      placeholder="กรุณาระบุ Local IP Adress..."
                      size='large'
                      onChange={(e) => {
                        field.onChange(sanitizeIP(e.target.value))
                      }}
                    />
                    {errors.ip_address && <p className='fs-12 text-red-500'>{errors.ip_address.message}</p>}
                  </fieldset>
                )
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={12}>
            <Controller
              control={control}
              name='anydesk_id'
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>Anydesk</label>
                    <Input
                      {...field}
                      name={field.name}
                      placeholder="กรุณาระบุ Anydesk..."
                      size='large'
                    />
                    {errors.anydesk_id && <p className='fs-12 text-red-500'>{errors.anydesk_id.message}</p>}
                  </fieldset>
                )
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={12}>
            <Controller
              control={control}
              name='zt_ip_address'
              rules={{
                validate: (value) =>
                  !value || IP_PATTERN.test(value) || 'รูปแบบ ZT IP Adress ไม่ถูกต้อง',
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>ZT IP Adress</label>
                    <Input
                      {...field}
                      name={field.name}
                      placeholder="กรุณาระบุ ZT IP Adress..."
                      size='large'
                      onChange={(e) => {
                        field.onChange(sanitizeIP(e.target.value))
                      }}
                    />
                    {errors.zt_ip_address && <p className='fs-12 text-red-500'>{errors.zt_ip_address.message}</p>}
                  </fieldset>
                )
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
            <Controller
              control={control}
              name='remarks'
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>หมายเหตุ</label>
                    <Input
                      {...field}
                      name={field.name}
                      placeholder="กรุณาระบุหมายเหตุ..."
                      size='large'
                    />
                    {errors.remarks && <p className='fs-12 text-red-500'>{errors.remarks.message}</p>}
                  </fieldset>
                )
              }}
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

export default React.memo<Props>(FormCreateDevice)
