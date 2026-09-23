import React, { useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { RefObject } from 'react'
import { AutoComplete, Col, Input, message, Radio, Row, Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getDepartmentsAPI } from '@/services/routes/ManageService'
import { useCreateUser, useUpdateUser, useSsoSearch } from '@/hooks/queries/manage'
import type { APIResponseSSOUser } from '@/types/manage/sso-search-api'
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

// Thai honorific titles seen in LDAP Description strings — longest first so
// "นางสาว" matches before the shorter "นาง" prefix it contains.
const LDAP_DESCRIPTION_TITLES = ['นางสาว', 'นาย', 'นาง']

/** Splits an LDAP Description like "นายสมชาย ทดสอบ" / "นางสาวสมหญิง ทดสอบ" /
 *  "สมชาย ทดสอบ" (no title) into (first, last) name, stripping the honorific
 *  when present. Falls back to the record's own FirstName/LastName when
 *  Description is null/empty. */
const parseLdapDescriptionName = (user: APIResponseSSOUser) => {
  const description = user.Description?.trim()
  if (!description) {
    return { firstName: user.FirstName, lastName: user.LastName }
  }

  const title = LDAP_DESCRIPTION_TITLES.find((t) => description.startsWith(t))
  const rest = (title ? description.slice(title.length) : description).trim()
  const [firstName = '', ...lastParts] = rest.split(/\s+/)

  return { firstName, lastName: lastParts.join(' ') }
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
  search?: string | null
}

let timeout: NodeJS.Timeout

const FormCreateLDAPUser: React.FC<Props> = (props) => {
  const { data, submitRef, onSuccess } = props

  const { mutate: createUser, isPending: isCreatePending } = useCreateUser()
  const { mutate: updateUser, isPending: isUpdatePending } = useUpdateUser()

  // Debounced keyword actually sent to useSsoSearch — updated 700ms after
  // typing stops (or immediately via the ค้นหา button), mirroring
  // FormSearchRoute's pattern in the sidebar.
  const [search, setSearch] = React.useState('')
  const { data: ssoResults, isFetching: isSsoFetching } = useSsoSearch(search)

  const ssoOptions = useMemo(
    () => (ssoResults ?? []).map((user) => ({
      // AutoComplete's combobox mode requires option `value` to be a string.
      value: user.Username,
      label: user.Description || `${user.FirstName} ${user.LastName}`.trim() || user.Username,
      user,
    })),
    [ssoResults],
  )

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
      department_id: null,
      first_name: data?.first_name || "",
      is_ldap: true,
      last_name: data?.lastname || "",
      password: "",
      province_code: null,
      role: data?.role as 'user' | 'admin' | '' || "user",
      username: data?.user?.username || "",
      confirm_password: "",
      search: "",
    }
  })

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form

  const onCreate = useCallback((values: FormValues) => {
    // LDAP users authenticate against AD — no password/province_code sent,
    // matching the LDAP EXAMPLE POST BODY (department_id, first_name,
    // is_ldap, last_name, role, username).
    const body: APIRequestRegisterGeneralUser = {
      username: values.username ?? '',
      first_name: values.first_name ?? '',
      last_name: values.last_name ?? '',
      department_id: values.department_id ?? 0,
      role: values.role ?? '',
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

  const renderCreateLDAPUser = useMemo(() => {
    if (data?.user_id) return
    return (
      <section>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
            <Controller
              control={control}
              name='search'
              render={({ field }) => (
                <fieldset>
                  <label className='text-(--yellow)'>ค้นหาชื่อจากระบบ LDAP</label>
                  <AutoComplete
                    {...field}
                    value={field.value ?? undefined}
                    options={ssoOptions}
                    optionRender={(option) => (
                      <div className='min-w-0'>
                        <div className='truncate'>{option.data.label}</div>
                        <div className='truncate text-white/50 fs-12'>@{option.data.user.Username}</div>
                      </div>
                    )}
                    notFoundContent={
                      search.trim().length >= 2
                        ? (isSsoFetching ? 'กำลังค้นหา…' : 'ไม่พบผู้ใช้ใน LDAP')
                        : 'พิมพ์อย่างน้อย 2 ตัวอักษร'
                    }
                    placeholder='กรุณาระบุชื่อผู้ใช้งาน หรือ Username จากระบบ LDAP...'
                    size='large'
                    className='w-full!'
                    // allowClear
                    onSelect={(_, option) => {
                      const { user } = option
                      // Autofill the fields below from the picked LDAP record
                      // instead of leaving the operator to retype them.
                      const { firstName, lastName } = parseLdapDescriptionName(user)
                      field.onChange(option.label)
                      setValue('username', user.Username, { shouldValidate: true })
                      setValue('first_name', firstName, { shouldValidate: true })
                      setValue('last_name', lastName, { shouldValidate: true })
                      // setValue('is_ldap', true)
                    }}
                    onClear={() => {
                      if (timeout) clearTimeout(timeout)
                      setSearch('')
                    }}
                    onChange={(value) => {
                      field.onChange(value)

                      if (timeout) clearTimeout(timeout)

                      if (!value) {
                        setSearch('')
                        return
                      }

                      timeout = setTimeout(() => {
                        setSearch(value.trim())
                      }, 700)
                    }}
                  />
                </fieldset>
              )}
            />
          </Col>
        </Row>
      </section>
    )
  }, [control, setValue, data?.user_id, isSsoFetching, ssoOptions, search])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {renderCreateLDAPUser}
      <section className={data?.user_id ? '' : 'mt-5'}>
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
          <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
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
                    <Radio.Group
                      {...field}
                      size='large'
                      className='w-full! mt-2!'
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
                    />
                    {errors.role && <p className="fs-12 text-red-500">{errors.role.message}</p>}
                  </fieldset>
                )
              }}
            />
          </Col>
        </Row>
      </section>
      <button ref={submitRef} type='submit' hidden disabled={isCreatePending || isUpdatePending} />
    </form>
  )
}

export default React.memo<Props>(FormCreateLDAPUser)
