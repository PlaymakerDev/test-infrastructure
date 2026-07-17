import { usePostOpenBridgeLighting } from '@/features/admin/bridge-lighting/detail/hooks';
import { APIResponseBridgeLightingWID, ShellyStatusData } from '@/types/bridge-lighting/overall-api';
import { Button, Col, ConfigProvider, Radio, Row } from 'antd';
import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'

interface Props {
  widData?: APIResponseBridgeLightingWID
  shellyStatus?: ShellyStatusData
  editMode: boolean
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>
}

interface FormUpdateStatus {
  send: '0' | '1'
  wid: string
}

// const TYPE = [
//   { label: "ดำเนินการทันที", value: "INSTANT" },
//   { label: "ตั้งเวลา", value: "SCHEDULED" },
// ]

const STATUS = [
  { label: 'เปิดไฟระดับสะพาน', value: '1', },
  { label: 'ปิดไฟระดับสะพาน', value: '0', },
]

const FormUpdateBridgeLightingStatus: React.FC<Props> = (props) => {
  const { widData, shellyStatus, setEditMode } = props

  const form = useForm<FormUpdateStatus>({
    defaultValues: {
      send: shellyStatus?.output ? '1' : '0',
      wid: String(widData?.wid) || '',
    }
  })

  const {
    handleSubmit,
    control,
    // watch,
    formState: { errors }
  } = form

  const { mutate: postOpenBridgeLighting, isPending } = usePostOpenBridgeLighting()

  const onSubmit = useCallback((data: FormUpdateStatus) => {
    postOpenBridgeLighting(data, {
      onSuccess: () => setEditMode(false),
    })
  }, [postOpenBridgeLighting, setEditMode])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <section>
        <Row gutter={[16, 16]}>
          {/* <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
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
          </Col> */}
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
            <Controller
              control={control}
              name="send"
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
                    {!!errors.send &&
                      <p className='text-red-500'>{errors.send.message}</p>
                    }
                  </fieldset>
                )
              }}
            />
          </Col>
          {/* {watch('type') === 'SCHEDULED' && (
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
          )} */}
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
            loading={isPending}
            disabled={isPending}
          >
            <p className='fs-12'>บันทึก</p>
          </Button>
        </div>
      </section>
    </form>
  )
}

export default React.memo<Props>(FormUpdateBridgeLightingStatus)
