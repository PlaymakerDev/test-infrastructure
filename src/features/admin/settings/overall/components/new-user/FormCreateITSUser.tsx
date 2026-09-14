import React, { useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { RefObject } from 'react'
import { Col, Input, message, Row, Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getDepartmentsAPI, getProvincesAPI } from '@/services/routes/ManageService'
import { useCreateUser, useUpdateUser } from '@/hooks/queries/manage'
import type { APIRequestRegisterGeneralUser, APIRequestUpdateGeneralUser, APIResponseGeneralUser } from '@/types/manage/general-user-api'

/** Best-effort extractor for the backend's Thai error message — mirrors
 *  ContactSection's/NewContactSection's own helper. */
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

interface FormValues {
  department_id?: number | null
  first_name?: string | null
  is_ldap?: boolean
  last_name?: string | null
  password?: string | null
  province_code?: number | null
  role?: 'user' | 'admin' | ''
  username?: string | null
  // ADDED
  confirm_password?: string | null
}

const FormCreateITSUser: React.FC<Props> = (props) => {
  const { data, submitRef, onSuccess } = props

  const { mutate: createUser, isPending: isCreatePending } = useCreateUser()
  const { mutate: updateUser, isPending: isUpdatePending } = useUpdateUser()

  const {
    data: provinces,
    isLoading: isProvincesLoading,
    isError: isProvincesError
  } = useQuery({
    queryKey: ['provinces'],
    queryFn: () => getProvincesAPI()
  })

  const {
    data: departments,
    isLoading: isDepartmentsLoading,
    isError: isDepartmentsError
  } = useQuery({
    queryKey: ['departments'],
    queryFn: () => getDepartmentsAPI()
  })

  const form = useForm<FormValues>({
    defaultValues: {
      department_id: data?.department_id || null,
      first_name: data?.first_name || "",
      is_ldap: false,
      last_name: data?.lastname || "",
      password: "",
      province_code: data?.province_id || null,
      role: data?.role as 'user' | 'admin' | '' || "user",
      username: data?.user?.username || "",
      confirm_password: ""
    }
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues
  } = form

  const onCreate = useCallback((values: FormValues) => {
    const body: APIRequestRegisterGeneralUser = {
      username: values.username ?? '',
      first_name: values.first_name ?? '',
      last_name: values.last_name ?? '',
      department_id: values.department_id ?? 0,
      role: values.role ?? '',
      password: values.password ?? undefined,
      province_code: values.province_code ?? undefined,
      is_ldap: values.is_ldap,
    }

    createUser(body, {
      onSuccess: () => {
        message.success('เพิ่มผู้ใช้งานสำเร็จ')
        onSuccess?.()
      },
      onError: (error) => {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน'))
      },
    })
  }, [createUser, onSuccess])

  const onUpdate = useCallback((values: FormValues) => {
    if (!data?.user_id) return

    // EX BODY
    // {
    //   "department_id": 0,
    //   "first_name": "string",
    //   "last_name": "string",
    //   "province_code": 0,
    //   "role": "user"
    // }
    const body: APIRequestUpdateGeneralUser = {
      first_name: values.first_name ?? '',
      last_name: values.last_name ?? '',
      department_id: values.department_id ?? 0,
      role: values.role ?? '',
      province_code: values.province_code ?? undefined,
    }

    updateUser({ id: data.user_id, data: body }, {
      onSuccess: () => {
        message.success('แก้ไขข้อมูลผู้ใช้งานสำเร็จ')
        onSuccess?.()
      },
      onError: (error) => {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้งาน'))
      },
    })
  }, [updateUser, onSuccess, data])

  const onSubmit = useCallback((values: FormValues) => {
    if (data?.user_id) {
      onUpdate(values)
    } else {
      onCreate(values)
    }
  }, [data, onCreate, onUpdate])

  const renderCreatePassword = useMemo(() => {
    if (data?.user_id) return
    return (
      <>
        <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
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
        <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
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
      </>
    )
  }, [control, errors, getValues, data?.user_id])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <section>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
            <Controller
              disabled={!!data?.user_id}
              control={control}
              name="username"
              rules={{
                required: 'กรุณาระบุชื่อผู้ใช้งาน'
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>ชื่อผู้ใช้งาน <span className="text-red-500">*</span></label>
                    <Input
                      {...field}
                      value={field.value ?? undefined}
                      name={field.name}
                      placeholder='กรุณาระบุชื่อผู้ใช้งาน...'
                      size='large'
                    />
                    {errors.username && <p className="fs-12 text-red-500">{errors.username.message}</p>}
                  </fieldset>
                )
              }}
            />
          </Col>
        </Row>
      </section>
      <section className='mt-5'>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
            <Controller
              control={control}
              name="first_name"
              rules={{
                required: 'กรุณาระบุชื่อ'
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>ชื่อ <span className="text-red-500">*</span></label>
                    <Input
                      {...field}
                      value={field.value ?? undefined}
                      name={field.name}
                      placeholder='กรุณาระบุชื่อ...'
                      size='large'
                    />
                    {errors.first_name && <p className="fs-12 text-red-500">{errors.first_name.message}</p>}
                  </fieldset>
                )
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
            <Controller
              control={control}
              name="last_name"
              rules={{
                required: 'กรุณาระบุนามสกุล'
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>นามสกุล <span className="text-red-500">*</span></label>
                    <Input
                      {...field}
                      value={field.value ?? undefined}
                      name={field.name}
                      placeholder='กรุณาระบุนามสกุล...'
                      size='large'
                    />
                    {errors.last_name && <p className="fs-12 text-red-500">{errors.last_name.message}</p>}
                  </fieldset>
                )
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
            <Controller
              control={control}
              name="province_code"
              rules={{
                required: 'กรุณาเลือกจังหวัด'
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>จังหวัด <span className="text-red-500">*</span></label>
                    <Select
                      {...field}
                      placeholder='กรุณาเลือกจังหวัด...'
                      size='large'
                      className='w-full!'
                      loading={isProvincesLoading}
                      options={isProvincesError ? [] : provinces?.data}
                      showSearch={{ optionFilterProp: 'name_th' }}
                      allowClear
                      fieldNames={{
                        label: 'name_th',
                        value: 'id'
                      }}
                    />
                    {errors.province_code && <p className="fs-12 text-red-500">{errors.province_code.message}</p>}
                  </fieldset>
                )
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
            <Controller
              control={control}
              name="department_id"
              rules={{
                required: 'กรุณาเลือกหน่วยงาน'
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>หน่วยงาน <span className="text-red-500">*</span></label>
                    <Select
                      {...field}
                      placeholder='กรุณาเลือกหน่วยงาน...'
                      size='large'
                      className='w-full!'
                      loading={isDepartmentsLoading}
                      options={isDepartmentsError ? [] : departments?.data}
                      showSearch={{ optionFilterProp: 'department_short_name' }}
                      allowClear
                      fieldNames={{
                        label: 'department_short_name',
                        value: 'id'
                      }}
                    />
                    {errors.department_id && <p className="fs-12 text-red-500">{errors.department_id.message}</p>}
                  </fieldset>
                )
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
            <Controller
              control={control}
              name="role"
              rules={{
                required: 'กรุณาเลือกสิทธิ์การเข้าถึงข้อมูล'
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label className='text-(--yellow)'>สิทธิ์การเข้าถึงข้อมูล <span className="text-red-500">*</span></label>
                    <Select
                      {...field}
                      placeholder='กรุณาเลือกสิทธิ์การเข้าถึงข้อมูล...'
                      size='large'
                      className='w-full!'
                      options={[
                        {
                          label: 'ผู้ใช้งาน',
                          value: 'user'
                        },
                        {
                          label: 'ผู้ดูแลระบบ',
                          value: 'admin'
                        }
                      ]}
                      allowClear
                      showSearch
                    />
                    {errors.role && <p className="fs-12 text-red-500">{errors.role.message}</p>}
                  </fieldset>
                )
              }}
            />
          </Col>
          {renderCreatePassword}
        </Row>
      </section>
      <button ref={submitRef} type='submit' hidden disabled={isCreatePending || isUpdatePending} />
    </form>
  )
}

export default React.memo<Props>(FormCreateITSUser)
