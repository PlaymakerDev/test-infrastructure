import { useAppDispatch } from '@/stores/hooks'
import { setUserModalOpen } from '@/stores/reducers/modal/customModalSlice'
import { PlusOutlined } from '@ant-design/icons'
import { Button, Col, ConfigProvider, Input, Row } from 'antd'
import React, { useCallback, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbPrinter, TbSearch } from 'react-icons/tb'

export interface UserSearchFormValues {
  search?: string
}

interface Props {
  onSearch: (values: UserSearchFormValues) => void
  onExport?: () => void
}

const FormSearchUser: React.FC<Props> = (props) => {
  const { onSearch, onExport } = props
  const dispatch = useAppDispatch()
  const submitRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const form = useForm<UserSearchFormValues>({
    defaultValues: {
      search: '',
    }
  })

  const { control, handleSubmit } = form

  const onSubmit = useCallback((data: UserSearchFormValues) => {
    onSearch(data)
  }, [onSearch])

  const onOpenCreateUserModal = useCallback(() => {
    dispatch(setUserModalOpen({ open: true, type: 'CREATE' }))
  }, [dispatch])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Row gutter={[16, 16]} align={'bottom'}>
        <Col xs={24} sm={24} md={12} lg={13} xl={16} xxl={6} xxxl={6}>
          <Controller
            name="search"
            control={control}
            render={({ field }) => {
              return (
                <fieldset>
                  <label className='text-(--yellow)'>ชื่อผู้ใช้งาน</label>
                  <Input
                    {...field}
                    name={field.name}
                    placeholder='ค้นหาชื่อผู้ใช้งาน...'
                    size="large"
                    className='w-full'
                    suffix={<TbSearch className='text-(--yellow)' />}
                    onChange={(e) => {
                      field.onChange(e)
                      if (timeoutRef.current) clearTimeout(timeoutRef.current)
                      timeoutRef.current = setTimeout(() => {
                        submitRef.current?.click()
                      }, 700)
                    }}
                  />
                </fieldset>
              )
            }}
          />
        </Col>
        <Col xs={24} sm={24} md={5} lg={4} xl={3} xxl={2} xxxl={2}>
          <Button
            block
            htmlType="button"
            type='primary'
            size="large"
            icon={<PlusOutlined />}
            shape='round'
            onClick={onOpenCreateUserModal}
          >
            <p className='fs-12 whitespace-nowrap'>เพิ่มผู้ใช้งาน</p>
          </Button>
        </Col>
        <Col xs={24} sm={24} md={5} lg={4} xl={3} xxl={2} xxxl={2}>
          <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
            <Button
              block
              type="primary"
              size="large"
              shape="round"
              icon={<TbPrinter />}
              onClick={onExport}
            >
              <p className='fs-12 whitespace-nowrap'>นำออกเอกสาร</p>
            </Button>
          </ConfigProvider>
        </Col>
      </Row>
      <button ref={submitRef} hidden type="submit" />
    </form>
  )
}

export default React.memo<Props>(FormSearchUser)
