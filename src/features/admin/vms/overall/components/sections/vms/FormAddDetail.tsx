import { CloudUploadOutlined } from '@ant-design/icons'
import { Button, Col, ConfigProvider, DatePicker, Input, Radio, Row, Select, Upload, UploadFile } from 'antd'
import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbCopyPlus } from 'react-icons/tb'
import { useVMSContext } from '../../../context'

interface Props {

}

interface FormValues {
  name: string
  category: string
  display_range: string
  start_date: string
  end_date: string
  display_type: string
  file: UploadFile[]
}

const FormAddDetail: React.FC<Props> = (props) => {
  const { } = props
  const { setAddMode } = useVMSContext()

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      category: '',
      display_range: '',
      start_date: '',
      end_date: '',
      display_type: '',
      file: []
    }
  })

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = form

  const onSubmit = useCallback((data: FormValues) => {
    console.log(data)
    setAddMode(false)
  }, [setAddMode])

  return (
    <div className="h-full bg-(--dark-black) rounded-lg p-5">
      <div className='flex items-start gap-2 mb-5'>
        <TbCopyPlus className='fs-22 text-(--yellow) shrink-0' />
        <div>
          <h4 className='mb-0 text-(--yellow)'>เพิ่มรูปแบบการแสดงผล</h4>
          <p className='fs-12 text-gray-400 mb-0'>เพิ่มรูปภาพ วิดีโอ และข้อความ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='lg:px-8'>
        <section>
          <h4 className='mb-3'>ข้อมูลการแสดงผล</h4>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: 'กรุณากรอกชื่อรูปแบบ'
                }}
                render={({ field }) => {
                  return (
                    <fieldset>
                      <label className='text-(--yellow)'>ชื่อรูปแบบ <span className='text-red-500'>*</span></label>
                      <Input
                        {...field}
                        name={field.name}
                        placeholder='กรุณากรอกชื่อรูปแบบ...'
                        size='large'
                      />
                      {!!errors.name &&
                        <p className='text-red-500'>{errors.name.message}</p>
                      }
                    </fieldset>
                  )
                }}
              />
            </Col>
            <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
              <Controller
                control={control}
                name="category"
                rules={{
                  required: 'กรุณาเลือกหมวดหมู่'
                }}
                render={({ field }) => {
                  return (
                    <fieldset>
                      <label className='text-(--yellow)'>หมวดหมู่ <span className='text-red-500'>*</span></label>
                      <Select
                        {...field}
                        placeholder='กรุณาเลือกหมวดหมู่...'
                        size='large'
                        options={[
                          { label: 'หมวดหมู่ที่ 1', value: 'category1' },
                          { label: 'หมวดหมู่ที่ 2', value: 'category2' },
                          { label: 'หมวดหมู่ที่ 3', value: 'category3' },
                        ]}
                        className='w-full'
                      />
                      {!!errors.category &&
                        <p className='text-red-500'>{errors.category.message}</p>
                      }
                    </fieldset>
                  )
                }}
              />
            </Col>
          </Row>
        </section>

        <section className='mt-5'>
          <h4 className='mb-3'>ระยะเวลา</h4>
          <Row gutter={[16, 16]} className='mb-5!'>
            <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
              <Controller
                control={control}
                name="display_range"
                rules={{
                  required: 'กรุณาเลือกระยะเวลาเริ่มต้นแสดงผล'
                }}
                render={({ field }) => {
                  return (
                    <fieldset>
                      <label className='text-(--yellow)'>ระยะเวลาเริ่มต้นแสดงผล <span className='text-red-500'>*</span></label>
                      <Select
                        {...field}
                        placeholder='กรุณาเลือกระยะเวลาเริ่มต้นแสดงผล...'
                        size='large'
                        options={[
                          { label: 'ระยะเวลาเริ่มต้นที่ 1', value: 'range1' },
                          { label: 'ระยะเวลาเริ่มต้นที่ 2', value: 'range2' },
                          { label: 'ระยะเวลาเริ่มต้นที่ 3', value: 'range3' },
                        ]}
                        className='w-full'
                      />
                      {!!errors.display_range &&
                        <p className='text-red-500'>{errors.display_range.message}</p>
                      }
                    </fieldset>
                  )
                }}
              />
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
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
            <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
              <Controller
                name="end_date"
                control={control}
                rules={{
                  required: 'กรุณาเลือกวันที่และเวลาสิ้นสุด'
                }}
                render={({ field }) => {
                  return (
                    <fieldset>
                      <label>สิ้นสุดการแสดงผล* <span className='text-red-500'>*</span></label>
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
          </Row>
        </section>

        <section className='mt-5'>
          <h4 className='mb-3'>เนื้อหาและรายละเอียด</h4>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
              <Controller
                control={control}
                name="display_type"
                rules={{
                  required: 'กรุณาเลือกประเภทการแสดงผล'
                }}
                render={({ field }) => {
                  return (
                    <fieldset>
                      <Radio.Group
                        {...field}
                        options={[
                          { label: 'รูปภาพหรือวิดิโอ', value: 'IMAGE_VIDEO', },
                          { label: 'ข้อความ', value: 'TEXT' },
                        ]}
                      />
                    </fieldset>
                  )
                }}
              />
            </Col>
            <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
              <Controller
                name="file"
                control={control}
                rules={{
                  required: 'กรุณาอัปโหลดไฟล์'
                }}
                render={({ field: { value, onChange, name: fieldName } }) => {
                  return (
                    <fieldset>
                      <label>อัปโหลดไฟล์ <span className='text-red-500'>*</span></label>
                      <p className='fs-12 text-gray-400 mb-2'>ลากและวางไฟล์ที่นี่เพื่อดำเนินการต่อ</p>
                      <Upload.Dragger
                        name={fieldName}
                        fileList={value}
                        onChange={({ fileList }) => onChange(fileList)}
                        beforeUpload={() => false}
                      >
                        <p className="ant-upload-drag-icon">
                          <CloudUploadOutlined />
                        </p>
                        <h3>ลากหรือวางไฟล์</h3>
                        <p className="fs-12 text-gray-400">
                          ไฟล์วิดีโอรูปแบบ MP4, AVI, MOV หรือไฟล์รูปภาพรูปแบบ JPG, PNG, GIF
                        </p>
                      </Upload.Dragger>
                      {!!errors.file &&
                        <p className='text-red-500'>{errors.file.message}</p>
                      }
                    </fieldset>
                  )
                }}
              />
            </Col>
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
                onClick={() => setAddMode(false)}
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
    </div>
  )
}

export default React.memo<Props>(FormAddDetail)
