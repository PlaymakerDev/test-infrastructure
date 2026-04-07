import { Button, Col, Input, Modal, Row, Select } from 'antd';
import React, { useCallback, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

interface Props {

}

interface SearchFieldType {
  name: string;
  is_active: "ACTIVE" | "INACTIVE" | null
}

let timeout: NodeJS.Timeout

const FormSearch: React.FC<Props> = (props) => {
  const { } = props
  const [hasButton, setHasButton] = useState<boolean>(false)
  const submitRef = useRef<HTMLButtonElement>(null)
  const [modal, contextHolder] = Modal.useModal()

  const form = useForm<SearchFieldType>({
    defaultValues: {
      name: "",
      is_active: null,
    }
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form

  const onSubmit = useCallback((value: SearchFieldType) => {
    modal.success({
      title: "Form Submitted",
      content: JSON.stringify(value, null, 2),
      onOk: () => Modal.destroyAll()
    })
  }, [modal])

  return (
    <div>
      <Button
        type={hasButton ? 'primary' : 'default'}
        onClick={() => setHasButton(true)}
      >
        Submit with Button
      </Button>
      <Button
        type={!hasButton ? 'primary' : 'default'}
        onClick={() => setHasButton(false)}
      >
        Submit Without Button
      </Button>
      <p>{hasButton ? "Form will be submit after clicking the button" : "Form will be submit automatically"}</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <Controller
              name="name"
              control={control}
              rules={{
                required: "Name is required"
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label>Name</label>
                    <Input
                      {...field}
                      name={field.name}
                      placeholder='Enter Name...'
                      className='w-full'
                      onChange={(e) => {
                        field.onChange(e)

                        if (!hasButton) {
                          if (timeout) clearTimeout(timeout)
                          timeout = setTimeout(() => {
                            submitRef.current?.click()
                          }, 700)
                        }
                      }}
                    />
                    {!!errors.name &&
                      <p className='text-red-500'>{errors.name.message}</p>
                    }
                  </fieldset>
                )
              }}
            />

          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <Controller
              name="is_active"
              control={control}
              rules={{
                required: "Status is required"
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <label>Status</label>
                    <Select
                      {...field}
                      placeholder='Select Status'
                      options={[
                        {
                          label: "Active",
                          value: "ACTIVE"
                        },
                        {
                          label: "Inactive",
                          value: "INACTIVE"
                        },
                      ]}
                      className='w-full'
                      onChange={(e) => {
                        field.onChange(e)

                        if (!hasButton) {
                          if (timeout) clearTimeout(timeout)
                          timeout = setTimeout(() => {
                            submitRef.current?.click()
                          }, 700)
                        }
                      }}
                    />
                    {!!errors.is_active &&
                      <p className='text-red-500'>{errors.is_active.message}</p>
                    }
                  </fieldset>
                )
              }}
            />
          </Col>
        </Row>
        {hasButton ? (
          <Button
            type='primary'
            htmlType='submit'
          >
            Submit
          </Button>
        ) : (
          <button ref={submitRef} type='submit' hidden />
        )}
      </form>
      {contextHolder}
    </div>
  )
}

export default React.memo<Props>(FormSearch)
