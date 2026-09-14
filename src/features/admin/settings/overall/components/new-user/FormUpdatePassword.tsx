import { useUpdateUserPassword } from '@/hooks/queries/manage'
import type { APIRequestUpdateGeneralUserPassword, APIResponseGeneralUser } from '@/types/manage/general-user-api'
import { Col, Input, message, Row } from 'antd'
import React, { RefObject, useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'

/** Best-effort extractor for the backend's Thai error message — mirrors
 *  FormCreateITSUser's/FormCreateLDAPUser's own helper. */
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
  data?: APIResponseGeneralUser | null
  submitRef: RefObject<HTMLButtonElement | null>
  onSuccess?: () => void
}

interface FormUpdatePasswordValues {
  password: string
  confirm_password: string
}

const FormUpdatePassword: React.FC<Props> = (props) => {
  const { data, submitRef, onSuccess } = props

  const { mutate: updateUserPassword, isPending } = useUpdateUserPassword()

  const form = useForm<FormUpdatePasswordValues>({
    defaultValues: {
      password: '',
      confirm_password: ''
    }
  })

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors }
  } = form

  const onSubmit = useCallback((formValues: FormUpdatePasswordValues) => {
    if (!data?.user_id) return

    // EX BODY
    // {
    //   "password": "PASSWORD"
    // }
    const body: APIRequestUpdateGeneralUserPassword = {
      password: formValues.password,
    }

    updateUserPassword({ id: data.user_id, data: body }, {
      onSuccess: () => {
        message.success('เปลี่ยนรหัสผ่านสำเร็จ')
        onSuccess?.()
      },
      onError: (error) => {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน'))
      },
    })
  }, [data, updateUserPassword, onSuccess])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
          <Controller
            control={control}
            name="password"
            rules={{
              required: 'กรุณาระบุรหัสผ่าน'
            }}
            render={({ field }) => {
              return (
                <fieldset>
                  <label className='text-(--yellow)'>รหัสผ่าน <span className="text-red-500">*</span></label>
                  <Input.Password
                    {...field}
                    value={field.value ?? undefined}
                    name={field.name}
                    placeholder='กรุณาระบุรหัสผ่าน...'
                    size='large'
                  />
                  {errors.password && <p className="fs-12 text-red-500">{errors.password.message}</p>}
                </fieldset>
              )
            }}
          />
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
          <Controller
            control={control}
            name="confirm_password"
            rules={{
              required: 'กรุณายืนยันรหัสผ่าน',
              validate: (value) => value === getValues('password') || 'รหัสผ่านไม่ถูกต้อง'
            }}
            render={({ field }) => {
              return (
                <fieldset>
                  <label className='text-(--yellow)'>ยืนยันรหัสผ่าน <span className="text-red-500">*</span></label>
                  <Input.Password
                    {...field}
                    value={field.value ?? undefined}
                    name={field.name}
                    placeholder='กรุณายืนยันรหัสผ่าน...'
                    size='large'
                  />
                  {errors.confirm_password && <p className="fs-12 text-red-500">{errors.confirm_password.message}</p>}
                </fieldset>
              )
            }}
          />
        </Col>
      </Row>
      <button ref={submitRef} type='submit' hidden disabled={isPending} />
    </form>
  )
}

export default React.memo<Props>(FormUpdatePassword)
