import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { RefObject } from 'react'
import { APIRequestCreateSolution, APIRequestUpdateSolution, APIResponseSolutionByID, SolutionLocation } from '@/types/manage/project-detail-api'
import { App, Col, Input, Row, Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getSolutionTypesAPI } from '@/services/routes/SolutionService'
import { useCreateProjectSolution, useUpdateProjectSolution } from '@/hooks/queries/manage'
import { useProjectContext } from '../context'
import { IP_PATTERN, LAT_LNG_PATTERN, sanitizeIP, sanitizeLatLng, toGeometryPoint } from '../data/formHelpers'

/** Best-effort extractor for the backend's Thai error message — mirrors
 *  FormCreateITSUser's own helper. */
const readErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const withResponse = error as {
      response?: { data?: { message?: string } }
      message?: string
    }
    return (
      withResponse.response?.data?.message ??
      withResponse.message ??
      fallback
    )
  }
  return fallback
}

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
      zt_ip_address: data?.zt_ip_address ?? ''
    }
  })

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = form

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
                        showSearch={{ optionFilterProp: 'solution_name_atlas' }}
                        fieldNames={{
                          label: 'solution_name_atlas',
                          value: 'id'
                        }}
                        loading={isSolutionTypeLoading}
                        options={solutionType?.data}
                        className="w-full!"
                      />
                      {errors.solution_type_id && <p className='fs-12 text-red-500'>{errors.solution_type_id.message}</p>}
                    </fieldset>
                  )
                }}
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
              rules={{ required: 'กรุณาระบุเลขที่ กม.' }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>กม.ที่ <span className='text-red-500'>*</span></label>
                    <Input
                      {...field}
                      name={field.name}
                      placeholder="กรุณาระบุเลขที่ กม...."
                      size='large'
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
                required: 'กรุณาระบุ Local IP Adress',
                pattern: { value: IP_PATTERN, message: 'รูปแบบ Local IP Adress ไม่ถูกต้อง' },
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>Local IP Adress <span className='text-red-500'>*</span></label>
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
              rules={{ required: 'กรุณาระบุ Anydesk' }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>Anydesk <span className='text-red-500'>*</span></label>
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
                required: 'กรุณาระบุ ZT IP Adress',
                pattern: { value: IP_PATTERN, message: 'รูปแบบ ZT IP Adress ไม่ถูกต้อง' },
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>ZT IP Adress <span className='text-red-500'>*</span></label>
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
              rules={{ required: 'กรุณาระบุหมายเหตุ' }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>หมายเหตุ <span className='text-red-500'>*</span></label>
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
