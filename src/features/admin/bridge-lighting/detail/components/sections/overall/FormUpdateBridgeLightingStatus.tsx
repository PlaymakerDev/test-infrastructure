import { Button, Col, ConfigProvider, DatePicker, Radio, Row, Segmented } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'

interface Props {
  editMode: boolean
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>
}

interface FormUpdateStatus {
  type: 'INSTANT' | 'SCHEDULED'
  status: 'ON' | 'OFF'
  start_date?: string;
  end_date?: string;
}

const TYPE = [
  { label: "ดำเนินการทันที", value: "INSTANT" },
  { label: "ตั้งเวลา", value: "SCHEDULED" },
]

const STATUS = [
  { label: 'เปิดไฟระดับสะพาน', value: 'ON', },
  { label: 'ปิดไฟระดับสะพาน', value: 'OFF', },
]

const FormUpdateBridgeLightingStatus: React.FC<Props> = (props) => {
  const { setEditMode } = props

  const form = useForm<FormUpdateStatus>({
    defaultValues: {
      type: 'INSTANT',
      status: 'ON',
      start_date: '',
      end_date: '',
    }
  })

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors }
  } = form

  const onSubmit = useCallback((data: FormUpdateStatus) => {
    const body = {
      type: data.type,
      status: data.status,
      start_date: data.type === 'SCHEDULED' ? dayjs(data.start_date).format('YYYY-MM-DD HH:mm:ss') : undefined,
      end_date: data.type === 'SCHEDULED' ? dayjs(data.end_date).format('YYYY-MM-DD HH:mm:ss') : undefined,
    }
    console.log(body)
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <section>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
            <Controller
              control={control}
              name='type'
              rules={{
                required: 'กรุณาเลือกประเภทการแสดงผล'
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <div className='overflow-x-auto'>
                      <Segmented
                        block
                        {...field}
                        options={TYPE}
                        size='large'
                        classNames={{
                          root: 'min-w-max border! border-(--yellow)!',
                        }}
                      />
                      {!!errors.type &&
                        <p className='text-red-500'>{errors.type.message}</p>
                      }
                    </div>
                  </fieldset>
                )
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
            <Controller
              control={control}
              name="status"
              rules={{
                required: 'กรุณาเลือกสถานะ'
              }}
              render={({ field }) => {
                return (
                  <fieldset>
                    <Radio.Group
                      vertical
                      {...field}
                      options={STATUS}
                    />
                    {!!errors.status &&
                      <p className='text-red-500'>{errors.status.message}</p>
                    }
                  </fieldset>
                )
              }}
            />
          </Col>
          {watch('type') === 'SCHEDULED' && (
            <>
              <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
                <Controller
                  name="start_date"
                  control={control}
                  rules={{
                    required: 'กรุณาเลือกวันที่และเวลาเริ่มต้น'
                  }}
                  render={({ field }) => {
                    return (
                      <fieldset>
                        <label>เริ่มต้นการแสดงผล <span className='text-red-500'>*</span></label>
                        <DatePicker
                          {...field}
                          placeholder='กรุณาเลือกวันที่และเวลาเริ่มต้น...'
                          className='w-full'
                          format='DD/MM/YYYY'
                          size='large'
                        />
                        {!!errors.start_date &&
                          <p className='text-red-500'>{errors.start_date.message}</p>
                        }
                      </fieldset>
                    )
                  }}
                />
              </Col>
              <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
                <Controller
                  name="end_date"
                  control={control}
                  rules={{
                    required: 'กรุณาเลือกวันที่และเวลาสิ้นสุด'
                  }}
                  render={({ field }) => {
                    return (
                      <fieldset>
                        <label>สิ้นสุดการแสดงผล <span className='text-red-500'>*</span></label>
                        <DatePicker
                          {...field}
                          placeholder='กรุณาเลือกวันที่และเวลาสิ้นสุด...'
                          className='w-full'
                          format='DD/MM/YYYY'
                          size='large'
                        />
                        {!!errors.end_date &&
                          <p className='text-red-500'>{errors.end_date.message}</p>
                        }
                      </fieldset>
                    )
                  }}
                />
              </Col>
            </>
          )}
        </Row>
      </section>
      <section className='mt-3'>
        <div className='flex flex-col sm:flex-row sm:justify-end gap-3'>
          <ConfigProvider theme={{ token: { colorPrimary: '#6B6B6B', colorTextLightSolid: '#FFFFFF' } }}>
            <Button
              type='primary'
              htmlType='button'
              shape='round'
              className='w-full! sm:w-auto!'
              onClick={() => setEditMode(false)}
            >
              <p className='fs-12'>ยกเลิก</p>
            </Button>
          </ConfigProvider>
          <Button
            type='primary'
            htmlType='submit'
            shape='round'
            className='w-full! sm:w-auto!'
          >
            <p className='fs-12'>บันทึก</p>
          </Button>
        </div>
      </section>
    </form>
  )
}

export default React.memo<Props>(FormUpdateBridgeLightingStatus)
