import { getRegionsAPI } from '@/services/routes/ManageService'
import { PlusOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button, Col, ConfigProvider, Input, Row, Select } from 'antd'
import React, { useCallback, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbPrinter, TbSearch } from 'react-icons/tb'

export interface RoadSearchFormValues {
  region_id?: string | null
  search?: string
}

interface Props {
  onSearch: (values: RoadSearchFormValues) => void
  onAdd?: () => void
  onExport?: () => void
}

const FormSearchRoad: React.FC<Props> = (props) => {
  const { onSearch, onAdd, onExport } = props
  const submitRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['region'],
    queryFn: () => getRegionsAPI()
  })

  const form = useForm<RoadSearchFormValues>({
    defaultValues: {
      region_id: null,
      search: '',
    }
  })

  const { control, handleSubmit } = form

  const onSubmit = useCallback((data: RoadSearchFormValues) => {
    onSearch(data)
  }, [onSearch])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Row gutter={[16, 16]} align={'bottom'}>
        <Col xs={24} sm={24} md={12} lg={8} xl={8} xxl={4} xxxl={3}>
          <Controller
            control={control}
            name='region_id'
            render={({ field }) => {
              return (
                <fieldset>
                  <label className='text-(--yellow)'>ภูมิภาค</label>
                  <Select
                    {...field}
                    placeholder='ภูมิภาคทั้งหมด...'
                    size="large"
                    className='w-full'
                    allowClear
                    showSearch={{ optionFilterProp: 'name_th' }}
                    loading={isLoading}
                    options={data?.data}
                    fieldNames={{
                      label: 'name_th',
                      value: 'id'
                    }}
                    onChange={(e) => {
                      field.onChange(e ?? null)
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
        <Col xs={24} sm={24} md={12} lg={13} xl={16} xxl={6} xxxl={6}>
          <Controller
            name="search"
            control={control}
            render={({ field }) => {
              return (
                <fieldset>
                  <label className='text-(--yellow)'>รหัสสายทาง</label>
                  <Input
                    {...field}
                    name={field.name}
                    placeholder='ค้นหารหัสสายทาง...'
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
            onClick={onAdd}
          >
            <p className='fs-12 whitespace-nowrap'>เพิ่มสายทาง</p>
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

export default React.memo<Props>(FormSearchRoad)
