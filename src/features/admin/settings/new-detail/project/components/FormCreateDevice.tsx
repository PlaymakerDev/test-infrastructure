import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { RefObject } from 'react'
import { APIRequestCreateSolution, SolutionLocation } from '@/types/manage/project-detail-api'
import { Col, Input, message, Row, Select } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSolutionTypesAPI } from '@/services/routes/SolutionService'
import { useProjectContext } from '../context'
import { postSolutionAPI } from '@/services/routes/ProjectDetailService'

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
  item?: SolutionLocation | null
  type?: 'CREATE' | 'UPDATE' | 'EDIT_SOLUTION_NAME'
  submitRef: RefObject<HTMLButtonElement | null>
  onSuccess?: () => void
}

/** Latitude/longitude are entered as plain decimals (Thailand's coordinates
 *  are always positive) — strip anything that isn't a digit or dot, and
 *  collapse a second/third dot instead of leaving e.g. "12.34.56". */
const sanitizeLatLng = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, '')
  const [head, ...rest] = cleaned.split('.')
  return rest.length ? `${head}.${rest.join('')}` : head
}

/** Digits, optionally followed by a single "." and more digits — rejects a
 *  bare "." or "12." left over from mid-typing, still allowed while the
 *  field isn't submitted yet. */
const LAT_LNG_PATTERN = /^\d+(\.\d+)?$/

/** IPv4 (used for both Local IP and the ZeroTier IP) — allow digits and
 *  dots while typing (unlike lat/lng, multiple dots are valid here, so no
 *  collapsing to a single one). */
const sanitizeIP = (value: string) => value.replace(/[^0-9.]/g, '')

/** Strict IPv4: four 0–255 octets separated by dots. */
const IP_PATTERN = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/

interface FormCreateDeviceValues {
  anydesk_id: string
  latitude: string
  longitude: string
  ip_address: string
  remarks: string
  solution_location_id: string
  solution_name: string
  solution_type_id: string | null
  sta: string
  zt_ip_address: string
}

const FormCreateDevice: React.FC<Props> = (props) => {
  const { item, submitRef, onSuccess } = props
  const { roadSolution } = useProjectContext()
  const queryClient = useQueryClient()

  const {
    data: solutionType,
    isLoading: isSolutionTypeLoading,
  } = useQuery({
    queryKey: ['solution-type'],
    queryFn: () => getSolutionTypesAPI()
  })

  const form = useForm<FormCreateDeviceValues>({
    defaultValues: {
      anydesk_id: '',
      latitude: '',
      longitude: '',
      ip_address: '',
      remarks: '',
      solution_location_id: '',
      solution_name: '',
      solution_type_id: null,
      sta: '',
      zt_ip_address: ''
    }
  })

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = form

  const { mutate: createSolution, isPending } = useMutation({
    mutationFn: (body: APIRequestCreateSolution) => postSolutionAPI(body).then((r) => r.data),
  })

  const onSubmit = useCallback((data: FormCreateDeviceValues) => {
    if (!item?.solution_location_id) return

    const body: APIRequestCreateSolution = {
      anydesk_id: data.anydesk_id,
      geometry_point: {
        coordinates: [Number(data.longitude), Number(data.latitude)],
        type: 'Point',
      },
      ip_address: data.ip_address,
      remarks: data.remarks,
      solution_location_id: item.solution_location_id,
      solution_name: data.solution_name,
      solution_type_id: Number(data.solution_type_id),
      sta: data.sta,
      zt_ip_address: data.zt_ip_address,
    }

    createSolution(body, {
      onSuccess: async () => {
        message.success('สร้างอุปกรณ์สำเร็จ')
        // Refetches SolutionContent's own query for this point, switching
        // it from EmptySolutionContent to TableSolution — roadSolution
        // itself (the tabs list) is untouched by adding a solution.
        await queryClient.invalidateQueries({ queryKey: ['solution', item.solution_location_id] })
        onSuccess?.()
      },
      onError: (error) => {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการสร้างอุปกรณ์'))
      },
    })
  }, [item, createSolution, queryClient, onSuccess])

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
        disabled={isPending}
      />
    </form>
  )
}

export default React.memo<Props>(FormCreateDevice)
