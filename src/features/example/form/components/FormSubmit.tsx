import { Button, Col, DatePicker, Input, Modal, Row, Select } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form';

interface Props {

}

interface GridFieldType {
  first_name: string;
  last_name: string;
  recent_school: string;
  is_adult: "YES" | "NO" | null;
  joined_date: Dayjs;
  leaved_date: Dayjs;
}

interface APIPostData {
  first_name: string;
  last_name: string;
  recent_school: string;
  is_adult: boolean;
  joined_date: string;
  leaved_date: string;
}

const FormSubmit: React.FC<Props> = (props) => {
  const { } = props
  const [modal, contextHolder] = Modal.useModal()
  const form = useForm<GridFieldType>({
    defaultValues: {
      first_name: "",
      last_name: "",
      recent_school: "",
      is_adult: null,
      joined_date: dayjs(),
      leaved_date: dayjs(),
    }
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form

  const onSubmit = useCallback((value: GridFieldType) => {
    const body: APIPostData = {
      first_name: value.first_name,
      last_name: value.last_name,
      recent_school: value.recent_school,
      is_adult: value.is_adult === "YES" ? true : false,
      joined_date: value.joined_date.format("DD/MM/YYYY"),
      leaved_date: value.leaved_date.format("DD/MM/YYYY"),
    }
    try {
      modal.success({
        title: "Form Submitted",
        content: JSON.stringify(body, null, 2),
        onOk: () => Modal.destroyAll()
      })
    } catch (error) {
      console.error(error)
    }
  }, [modal])

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <Controller
              name="first_name"
              control={control}
              rules={{
                required: "First Name is required"
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label>First Name</label>
                    <Input
                      {...field}
                      name={field.name}
                      placeholder='Enter First Name...'
                      className='w-full'
                    />
                    {!!errors.first_name &&
                      <p className='text-red-500'>{errors.first_name.message}</p>
                    }
                  </fieldset>
                )
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <Controller
              name="last_name"
              control={control}
              rules={{
                required: "Last Name is required"
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label>Last Name</label>
                    <Input
                      {...field}
                      name={field.name}
                      placeholder='Enter Last Name...'
                      className='w-full'
                    />
                    {!!errors.last_name &&
                      <p className='text-red-500'>{errors.last_name.message}</p>
                    }
                  </fieldset>
                )
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <Controller
              name="recent_school"
              control={control}
              rules={{
                required: "Recent School is required"
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label>Recent School</label>
                    <Input
                      {...field}
                      name={field.name}
                      placeholder='Enter Recent School...'
                      className='w-full'
                    />
                    {!!errors.recent_school &&
                      <p className='text-red-500'>{errors.recent_school.message}</p>
                    }
                  </fieldset>
                )
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <Controller
              name="is_adult"
              control={control}
              rules={{
                required: "Please verify if you are adult or not"
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label>Are you an adult?</label>
                    <Select
                      {...field}
                      placeholder='Are you an adult?'
                      options={[
                        {
                          label: "Yes",
                          value: "YES"
                        },
                        {
                          label: "No",
                          value: "NO"
                        },
                      ]}
                      className='w-full'
                    />
                    {!!errors.is_adult &&
                      <p className='text-red-500'>{errors.is_adult.message}</p>
                    }
                  </fieldset>
                )
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <Controller
              name="joined_date"
              control={control}
              rules={{
                required: "Joined Date is required"
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label>Joined Date</label>
                    <DatePicker
                      {...field}
                      placeholder='Select Joined Date...'
                      className='w-full'
                      format='DD/MM/YYYY'
                    />
                    {!!errors.joined_date &&
                      <p className='text-red-500'>{errors.joined_date.message}</p>
                    }
                  </fieldset>
                )
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <Controller
              name="leaved_date"
              control={control}
              rules={{
                required: "Leaved Date is required"
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label>Leaved Date</label>
                    <DatePicker
                      {...field}
                      placeholder='Select Leaved Date...'
                      className='w-full'
                      format='DD/MM/YYYY'
                    />
                    {!!errors.leaved_date &&
                      <p className='text-red-500'>{errors.leaved_date.message}</p>
                    }
                  </fieldset>
                )
              }}
            />
          </Col>
        </Row>
        <Button
          type='primary'
          htmlType='submit'
        >
          Submit
        </Button>
      </form>
      {contextHolder}
    </div>
  )
}

export default React.memo<Props>(FormSubmit)
