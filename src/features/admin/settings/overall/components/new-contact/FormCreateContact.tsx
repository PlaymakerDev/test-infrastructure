import React, { useCallback } from 'react'
import type { RefObject } from 'react'
import { Input, message } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { useCreateContractor, useUpdateContractor } from '@/hooks/queries/manage'
import type {
  APIRequestRegisterContractor,
  APIRequestUpdateContractor,
  ContractorData,
} from '@/types/manage/contractor-api'

/** Best-effort extractor for the backend's Thai error message — mirrors
 *  NewContactSection's own helper. */
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

// รูปแบบอีเมลอย่างง่าย — เว้นว่างได้ เพราะ email เป็น optional
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Props {
  data?: ContractorData | null
  submitRef: RefObject<HTMLButtonElement | null>
  onSuccess?: () => void
}

interface FormValues {
  companyName?: string | null
  shortName?: string | null
  role?: string | null
  contactPerson?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  password?: string | null
}

/** Fields mirror the real /manage/contractor request bodies:
 *   - create requires: company_name, short_name, password
 *   - update requires: company_name, short_name (password optional; sent
 *     only when the operator explicitly types a new one). */
const FormCreateContact: React.FC<Props> = (props) => {
  const { data, submitRef, onSuccess } = props

  const { mutate: createContractor, isPending: isCreatePending } = useCreateContractor()
  const { mutate: updateContractor, isPending: isUpdatePending } = useUpdateContractor()
  const isSubmitting = isCreatePending || isUpdatePending

  const isEdit = !!data?.user_id

  const form = useForm<FormValues>({
    defaultValues: {
      companyName: data?.company_name || '',
      shortName: data?.short_name || '',
      role: data?.role || '',
      contactPerson: data?.name || '',
      phone: data?.phone || '',
      email: data?.email || '',
      address: data?.address || '',
      // Password intentionally blank on edit — the API keeps the existing
      // password when this field is omitted.
      password: '',
    },
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form

  const optional = (v?: string | null): string | undefined => {
    const t = (v ?? '').trim()
    return t.length ? t : undefined
  }

  const onCreate = useCallback((values: FormValues) => {
    const body: APIRequestRegisterContractor = {
      company_name: (values.companyName ?? '').trim(),
      short_name: (values.shortName ?? '').trim(),
      password: (values.password ?? '').trim(),
      name: optional(values.contactPerson),
      phone: optional(values.phone),
      email: optional(values.email),
      address: optional(values.address),
      role: optional(values.role),
    }

    createContractor(body, {
      onSuccess: () => {
        message.success('เพิ่มผู้รับจ้างสำเร็จ')
        onSuccess?.()
      },
      onError: (error) => {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการเพิ่มผู้รับจ้าง'))
      },
    })
  }, [createContractor, onSuccess])

  const onUpdate = useCallback((values: FormValues) => {
    if (!data?.user_id) return

    const body: APIRequestUpdateContractor = {
      company_name: (values.companyName ?? '').trim(),
      short_name: (values.shortName ?? '').trim(),
      name: optional(values.contactPerson),
      phone: optional(values.phone),
      email: optional(values.email),
      address: optional(values.address),
      role: optional(values.role),
      password: optional(values.password),
    }

    updateContractor({ id: data.user_id, data: body }, {
      onSuccess: () => {
        message.success('แก้ไขข้อมูลผู้รับจ้างสำเร็จ')
        onSuccess?.()
      },
      onError: (error) => {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้รับจ้าง'))
      },
    })
  }, [updateContractor, onSuccess, data])

  const onSubmit = useCallback((values: FormValues) => {
    if (data?.user_id) {
      onUpdate(values)
    } else {
      onCreate(values)
    }
  }, [data, onCreate, onUpdate])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {isEdit && data?.user?.username ? (
        <div className='mb-4 rounded-lg px-3 py-2 fs-12 bg-white/10'>
          บัญชีผู้ใช้ (username): <span className='font-semibold text-white'>{data.user.username}</span>
        </div>
      ) : null}

      <fieldset className='mb-4'>
        <Controller
          control={control}
          name='companyName'
          rules={{ required: 'กรุณาระบุชื่อบริษัท' }}
          render={({ field }) => (
            <fieldset>
              <label className='text-(--yellow)'>ชื่อบริษัท <span className='text-red-500'>*</span></label>
              <Input
                {...field}
                value={field.value ?? undefined}
                name={field.name}
                placeholder='กรุณาระบุชื่อบริษัท...'
                size='large'
              />
              {errors.companyName && <p className='fs-12 text-red-500'>{errors.companyName.message}</p>}
            </fieldset>
          )}
        />
      </fieldset>

      <div className='grid grid-cols-2 gap-4 mb-4'>
        <Controller
          control={control}
          name='shortName'
          rules={{ required: 'กรุณาระบุชื่อย่อ' }}
          render={({ field }) => (
            <fieldset>
              <label className='text-(--yellow)'>ชื่อย่อ <span className='text-red-500'>*</span></label>
              <Input
                {...field}
                value={field.value ?? undefined}
                name={field.name}
                placeholder='เช่น TPS'
                size='large'
              />
              {errors.shortName && <p className='fs-12 text-red-500'>{errors.shortName.message}</p>}
            </fieldset>
          )}
        />
        <Controller
          control={control}
          name='role'
          render={({ field }) => (
            <fieldset>
              <label className='text-(--yellow)'>ตำแหน่ง / บทบาท</label>
              <Input
                {...field}
                value={field.value ?? undefined}
                name={field.name}
                placeholder='เช่น ผู้จัดการโครงการ'
                size='large'
              />
            </fieldset>
          )}
        />
      </div>

      <div className='grid grid-cols-2 gap-4 mb-4'>
        <Controller
          control={control}
          name='contactPerson'
          render={({ field }) => (
            <fieldset>
              <label className='text-(--yellow)'>ผู้ติดต่อ</label>
              <Input
                {...field}
                value={field.value ?? undefined}
                name={field.name}
                placeholder='กรุณาระบุชื่อผู้ติดต่อ...'
                size='large'
              />
            </fieldset>
          )}
        />
        <Controller
          control={control}
          name='phone'
          render={({ field }) => (
            <fieldset>
              <label className='text-(--yellow)'>เบอร์โทรศัพท์</label>
              <Input
                {...field}
                value={field.value ?? undefined}
                name={field.name}
                placeholder='เช่น 02-123-4567'
                size='large'
              />
            </fieldset>
          )}
        />
      </div>

      <fieldset className='mb-4'>
        <Controller
          control={control}
          name='email'
          rules={{
            pattern: { value: EMAIL_PATTERN, message: 'รูปแบบอีเมลไม่ถูกต้อง' },
          }}
          render={({ field }) => (
            <fieldset>
              <label className='text-(--yellow)'>อีเมล (สำหรับแจ้งเตือน case)</label>
              <Input
                {...field}
                value={field.value ?? undefined}
                name={field.name}
                placeholder='เช่น support@example.co.th'
                size='large'
              />
              {errors.email && <p className='fs-12 text-red-500'>{errors.email.message}</p>}
            </fieldset>
          )}
        />
      </fieldset>

      <fieldset className='mb-4'>
        <Controller
          control={control}
          name='address'
          render={({ field }) => (
            <fieldset>
              <label className='text-(--yellow)'>ที่อยู่</label>
              <Input.TextArea
                {...field}
                value={field.value ?? undefined}
                name={field.name}
                rows={3}
                placeholder='กรุณาระบุที่อยู่...'
              />
            </fieldset>
          )}
        />
      </fieldset>

      <fieldset>
        <Controller
          control={control}
          name='password'
          rules={isEdit ? {} : { required: 'กรุณาระบุรหัสผ่านสำหรับเข้าใช้งาน' }}
          render={({ field }) => (
            <fieldset>
              <label className='text-(--yellow)'>
                รหัสผ่าน
                {isEdit ? (
                  <span className='text-white/50 fs-12 ml-1.5'>(เว้นว่างหากไม่ต้องการเปลี่ยน)</span>
                ) : (
                  <span className='text-red-500'> *</span>
                )}
              </label>
              <Input.Password
                {...field}
                value={field.value ?? undefined}
                name={field.name}
                placeholder={isEdit ? 'ปล่อยว่างเพื่อคงรหัสผ่านเดิม' : 'กรุณาระบุรหัสผ่าน...'}
                size='large'
                autoComplete='new-password'
              />
              {errors.password && <p className='fs-12 text-red-500'>{errors.password.message}</p>}
            </fieldset>
          )}
        />
      </fieldset>

      <button
        ref={submitRef}
        type='submit'
        hidden
        disabled={isSubmitting}
      />
    </form>
  )
}

export default React.memo<Props>(FormCreateContact)
