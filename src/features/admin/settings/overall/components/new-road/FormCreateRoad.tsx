import React, { useCallback } from 'react'
import type { RefObject } from 'react'
import { Col, Input, message, Row, Select } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { useCreateRoad, useDepartments, useUpdateRoad } from '@/hooks/queries/manage'
import type { APIRequestRoad, RoadData } from '@/types/manage/road-api'

/** Best-effort extractor for the backend's Thai error message — mirrors
 *  FormCreateITSUser's/FormCreateLDAPUser's own helper. */
const readErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const withResponse = error as {
      response?: { data?: { message?: string } }
      message?: string
    }
    return withResponse.response?.data?.message ?? withResponse.message ?? fallback
  }
  return fallback
}

// ตัวเลข (จำนวนเต็มหรือทศนิยม) เท่านั้น — เว้นว่างได้ เพราะ distance เป็น optional
const NUMBER_PATTERN = /^\d*\.?\d*$/

interface Props {
  data?: RoadData | null
  submitRef: RefObject<HTMLButtonElement | null>
  onSuccess?: () => void
}

interface FormValues {
  road_code?: string | null
  road_name?: string | null
  province?: string | null
  district?: string | null
  subdistrict?: string | null
  start_sta?: string | null
  end_sta?: string | null
  distance?: string | null
  department_id?: number | null
}

const FormCreateRoad: React.FC<Props> = (props) => {
  const { data, submitRef, onSuccess } = props

  const { mutate: createRoad, isPending: isCreatePending } = useCreateRoad()
  const { mutate: updateRoad, isPending: isUpdatePending } = useUpdateRoad()

  const {
    data: departments,
    isLoading: isDepartmentsLoading,
    isError: isDepartmentsError,
  } = useDepartments()

  const form = useForm<FormValues>({
    defaultValues: {
      road_code: data?.road_code || '',
      road_name: data?.road_name || '',
      province: data?.province || '',
      district: data?.district || '',
      subdistrict: data?.subdistrict || '',
      start_sta: data?.start_sta || '',
      end_sta: data?.end_sta || '',
      distance: data?.distance != null ? String(data.distance) : '',
      department_id: data?.department_id ?? null,
    },
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form

  const onCreate = useCallback((values: FormValues) => {
    const body: APIRequestRoad = {
      road_code: values.road_code ?? '',
      road_name: values.road_name ?? '',
      province: values.province ?? '',
      district: values.district ?? '',
      subdistrict: values.subdistrict ?? '',
      start_sta: values.start_sta ?? '',
      end_sta: values.end_sta ?? '',
      department_id: values.department_id ?? 0,
      ...(values.distance ? { distance: Number(values.distance) } : {}),
    }

    createRoad(body, {
      onSuccess: () => {
        message.success('เพิ่มข้อมูลสายทางสำเร็จ')
        onSuccess?.()
      },
      onError: (error) => {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลสายทาง'))
      },
    })
  }, [createRoad, onSuccess])

  const onUpdate = useCallback((values: FormValues) => {
    if (!data?.id) return

    const body: APIRequestRoad = {
      road_code: values.road_code ?? '',
      road_name: values.road_name ?? '',
      province: values.province ?? '',
      district: values.district ?? '',
      subdistrict: values.subdistrict ?? '',
      start_sta: values.start_sta ?? '',
      end_sta: values.end_sta ?? '',
      department_id: values.department_id ?? 0,
      ...(values.distance ? { distance: Number(values.distance) } : {}),
    }

    updateRoad({ id: data.id, data: body }, {
      onSuccess: () => {
        message.success('แก้ไขข้อมูลสายทางสำเร็จ')
        onSuccess?.()
      },
      onError: (error) => {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลสายทาง'))
      },
    })
  }, [updateRoad, onSuccess, data])

  const onSubmit = useCallback((values: FormValues) => {
    if (data?.id) {
      onUpdate(values)
    } else {
      onCreate(values)
    }
  }, [data, onCreate, onUpdate])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Controller
            control={control}
            name='road_code'
            rules={{ required: 'กรุณาระบุรหัสสายทาง' }}
            render={({ field }) => (
              <fieldset>
                <label className='text-(--yellow)'>รหัสสายทาง <span className='text-red-500'>*</span></label>
                <Input
                  {...field}
                  value={field.value ?? undefined}
                  name={field.name}
                  placeholder='เช่น ขก.1027'
                  size='large'
                />
                {errors.road_code && <p className='fs-12 text-red-500'>{errors.road_code.message}</p>}
              </fieldset>
            )}
          />
        </Col>
        <Col xs={24} sm={12}>
          <Controller
            control={control}
            name='province'
            rules={{ required: 'กรุณาระบุจังหวัด' }}
            render={({ field }) => (
              <fieldset>
                <label className='text-(--yellow)'>จังหวัด <span className='text-red-500'>*</span></label>
                <Input
                  {...field}
                  value={field.value ?? undefined}
                  name={field.name}
                  placeholder='กรุณาระบุจังหวัด...'
                  size='large'
                />
                {errors.province && <p className='fs-12 text-red-500'>{errors.province.message}</p>}
              </fieldset>
            )}
          />
        </Col>
        <Col span={24}>
          <Controller
            control={control}
            name='road_name'
            rules={{ required: 'กรุณาระบุชื่อสายทาง' }}
            render={({ field }) => (
              <fieldset>
                <label className='text-(--yellow)'>ชื่อสายทาง <span className='text-red-500'>*</span></label>
                <Input
                  {...field}
                  value={field.value ?? undefined}
                  name={field.name}
                  placeholder='กรุณาระบุชื่อสายทาง...'
                  size='large'
                />
                {errors.road_name && <p className='fs-12 text-red-500'>{errors.road_name.message}</p>}
              </fieldset>
            )}
          />
        </Col>
        <Col xs={24} sm={12}>
          <Controller
            control={control}
            name='district'
            rules={{ required: 'กรุณาระบุอำเภอ' }}
            render={({ field }) => (
              <fieldset>
                <label className='text-(--yellow)'>อำเภอ <span className='text-red-500'>*</span></label>
                <Input
                  {...field}
                  value={field.value ?? undefined}
                  name={field.name}
                  placeholder='กรุณาระบุอำเภอ...'
                  size='large'
                />
                {errors.district && <p className='fs-12 text-red-500'>{errors.district.message}</p>}
              </fieldset>
            )}
          />
        </Col>
        <Col xs={24} sm={12}>
          <Controller
            control={control}
            name='subdistrict'
            rules={{ required: 'กรุณาระบุตำบล' }}
            render={({ field }) => (
              <fieldset>
                <label className='text-(--yellow)'>ตำบล <span className='text-red-500'>*</span></label>
                <Input
                  {...field}
                  value={field.value ?? undefined}
                  name={field.name}
                  placeholder='กรุณาระบุตำบล...'
                  size='large'
                />
                {errors.subdistrict && <p className='fs-12 text-red-500'>{errors.subdistrict.message}</p>}
              </fieldset>
            )}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Controller
            control={control}
            name='start_sta'
            rules={{ required: 'กรุณาระบุ กม.เริ่มต้น' }}
            render={({ field }) => (
              <fieldset>
                <label className='text-(--yellow)'>กม.เริ่มต้น <span className='text-red-500'>*</span></label>
                <Input
                  {...field}
                  value={field.value ?? undefined}
                  name={field.name}
                  placeholder='เช่น 0+000'
                  size='large'
                />
                {errors.start_sta && <p className='fs-12 text-red-500'>{errors.start_sta.message}</p>}
              </fieldset>
            )}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Controller
            control={control}
            name='end_sta'
            rules={{ required: 'กรุณาระบุ กม.สิ้นสุด' }}
            render={({ field }) => (
              <fieldset>
                <label className='text-(--yellow)'>กม.สิ้นสุด <span className='text-red-500'>*</span></label>
                <Input
                  {...field}
                  value={field.value ?? undefined}
                  name={field.name}
                  placeholder='เช่น 12+450'
                  size='large'
                />
                {errors.end_sta && <p className='fs-12 text-red-500'>{errors.end_sta.message}</p>}
              </fieldset>
            )}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Controller
            control={control}
            name='distance'
            rules={{
              pattern: { value: NUMBER_PATTERN, message: 'กรุณาระบุตัวเลขเท่านั้น' },
            }}
            render={({ field }) => (
              <fieldset>
                <label className='text-(--yellow)'>ระยะทาง (กม.)</label>
                <Input
                  {...field}
                  value={field.value ?? undefined}
                  name={field.name}
                  placeholder='กรุณาระบุระยะทาง...'
                  size='large'
                  inputMode='decimal'
                  onChange={(e) => {
                    // ดักให้พิมพ์ได้เฉพาะตัวเลข/จุดทศนิยม แทนการใช้ InputNumber
                    if (NUMBER_PATTERN.test(e.target.value)) field.onChange(e)
                  }}
                />
                {errors.distance && <p className='fs-12 text-red-500'>{errors.distance.message}</p>}
              </fieldset>
            )}
          />
        </Col>
        <Col span={24}>
          <Controller
            control={control}
            name='department_id'
            rules={{ required: 'กรุณาเลือกหน่วยงานรับผิดชอบ' }}
            render={({ field }) => (
              <fieldset>
                <label className='text-(--yellow)'>หน่วยงานรับผิดชอบ <span className='text-red-500'>*</span></label>
                <Select
                  {...field}
                  value={field.value ?? undefined}
                  placeholder='กรุณาเลือกหน่วยงานรับผิดชอบ...'
                  size='large'
                  className='w-full!'
                  loading={isDepartmentsLoading}
                  options={isDepartmentsError ? [] : departments}
                  showSearch={{ optionFilterProp: 'department_short_name' }}
                  allowClear
                  fieldNames={{ label: 'department_short_name', value: 'id' }}
                />
                {errors.department_id && <p className='fs-12 text-red-500'>{errors.department_id.message}</p>}
              </fieldset>
            )}
          />
        </Col>
      </Row>
      <button
        ref={submitRef}
        type='submit'
        hidden
        disabled={isCreatePending || isUpdatePending}
      />
    </form>
  )
}

export default React.memo<Props>(FormCreateRoad)
