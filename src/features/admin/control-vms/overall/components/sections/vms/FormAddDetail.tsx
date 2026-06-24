import { CloudUploadOutlined } from '@ant-design/icons'
import { Button, Col, ConfigProvider, Image, Input, message, Radio, Row, Select, Upload, UploadFile } from 'antd'
import thTH from 'antd/locale/th_TH'
import { AxiosError } from 'axios'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import th from 'dayjs/locale/th'
import React, { useCallback } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { TbCopyPlus } from 'react-icons/tb'
import BuddhistDatePicker from '@/components/date-picker/BuddhistDatePicker'
import { APIRequestPostVMSMedia } from '@/types/control-vms/vms-api'
import { postUploadVMSAPI } from '@/services/routes/SharedService'
import { usePostVMSMedia } from '../../../hooks/usePostVMSMedia'
import { useVMSSettingTypes } from '../../../hooks/useVMSSettingTypes'
import { useControlVMSContext } from '../../../context'

dayjs.extend(buddhistEra)
dayjs.locale(th)

interface Props { }

interface FormValues {
  name: string
  category: number | null
  start_date: string
  end_date: string
  display_type: string
  file: UploadFile[]
  file_url: string
  text: string
}

const FormAddDetail: React.FC<Props> = () => {
  const { setAddMode, vmsIdList } = useControlVMSContext()
  const { data: settingTypesData } = useVMSSettingTypes()
  const postMedia = usePostVMSMedia()

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      category: null,
      start_date: '',
      end_date: '',
      display_type: 'IMAGE_VIDEO',
      file: [],
      file_url: '',
      text: '',
    },
  })

  const { control, setValue, handleSubmit, formState: { errors } } = form

  const displayType = useWatch({ control, name: 'display_type' })
  const fileUrl = useWatch({ control, name: 'file_url' })

  const onSubmit = useCallback((data: FormValues) => {
    if (!vmsIdList.length) {
      message.warning('กรุณาเลือกป้าย VMS อย่างน้อย 1 ป้าย')
      return
    }
    const body: APIRequestPostVMSMedia = {
      media_url: data.display_type === 'IMAGE_VIDEO' ? data.file_url : '',
      message: data.display_type === 'TEXT' ? data.text : '',
      setting_type_id: Number(data.category),
      since: dayjs(data.start_date).format(),
      to: dayjs(data.end_date).format(),
      type_name: data.name,
      vms_ids: vmsIdList,
    }
    postMedia.mutate(body, { onSuccess: () => setAddMode(false) })
  }, [vmsIdList, setAddMode, postMedia])

  const uploadFile = useCallback(async (file: UploadFile[]) => {
    setValue('file', [{ ...file[0], status: 'uploading' }])
    try {
      const fd = new FormData()
      fd.append('upload', file[0].originFileObj as File)
      const response = await postUploadVMSAPI(fd)
      const path = response.data?.path || ''
      const fullUrl = `${process.env.NEXT_PUBLIC_HOST_BACKEND}/upload${path}`
      setValue('file_url', path)
      setValue('file', [{ ...file[0], status: 'done', url: fullUrl, thumbUrl: fullUrl }])
    } catch (error) {
      setValue('file', [{ ...file[0], status: 'error' }])
      message.error(error instanceof AxiosError ? (error.response?.data?.message ?? 'อัปโหลดไม่สำเร็จ') : 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์')
    }
  }, [setValue])

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
                rules={{ required: 'กรุณากรอกชื่อรูปแบบ' }}
                render={({ field }) => (
                  <fieldset>
                    <label className='text-(--yellow)'>ชื่อรูปแบบ <span className='text-red-500'>*</span></label>
                    <Input {...field} placeholder='กรุณากรอกชื่อรูปแบบ...' size='large' />
                    {!!errors.name && <p className='text-red-500'>{errors.name.message}</p>}
                  </fieldset>
                )}
              />
            </Col>
            <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
              <Controller
                control={control}
                name="category"
                rules={{ required: 'กรุณาเลือกหมวดหมู่' }}
                render={({ field }) => (
                  <fieldset>
                    <label className='text-(--yellow)'>หมวดหมู่ <span className='text-red-500'>*</span></label>
                    <Select
                      {...field}
                      placeholder='กรุณาเลือกหมวดหมู่...'
                      size='large'
                      options={settingTypesData?.data ?? []}
                      fieldNames={{ label: 'name', value: 'id' }}
                      className='w-full'
                      showSearch
                      allowClear
                    />
                    {!!errors.category && <p className='text-red-500'>{errors.category.message}</p>}
                  </fieldset>
                )}
              />
            </Col>
          </Row>
        </section>

        <section className='mt-5'>
          <h4 className='mb-3'>ระยะเวลา</h4>
          <ConfigProvider locale={thTH}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
                <Controller
                  name="start_date"
                  control={control}
                  rules={{ required: 'กรุณาเลือกวันที่และเวลาเริ่มต้น' }}
                  render={({ field }) => (
                    <fieldset>
                      <label>เริ่มต้นการแสดงผล <span className='text-red-500'>*</span></label>
                      <BuddhistDatePicker
                        {...field}
                        placeholder='กรุณาเลือกวันที่และเวลาเริ่มต้น...'
                        className='w-full'
                        format='DD MMMM BBBB HH:mm:ss'
                        size='large'
                        showTime
                      />
                      {!!errors.start_date && <p className='text-red-500'>{errors.start_date.message}</p>}
                    </fieldset>
                  )}
                />
              </Col>
              <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
                <Controller
                  name="end_date"
                  control={control}
                  rules={{
                    required: 'กรุณาเลือกวันที่และเวลาสิ้นสุด',
                    validate: (v, form) =>
                      !form.start_date || !v || dayjs(v).isAfter(dayjs(form.start_date))
                        ? true
                        : 'วันที่สิ้นสุดต้องมาหลังวันที่เริ่มต้น',
                  }}
                  render={({ field }) => (
                    <fieldset>
                      <label>สิ้นสุดการแสดงผล <span className='text-red-500'>*</span></label>
                      <BuddhistDatePicker
                        {...field}
                        placeholder='กรุณาเลือกวันที่และเวลาสิ้นสุด...'
                        className='w-full'
                        format='DD MMMM BBBB HH:mm:ss'
                        size='large'
                        showTime
                      />
                      {!!errors.end_date && <p className='text-red-500'>{errors.end_date.message}</p>}
                    </fieldset>
                  )}
                />
              </Col>
            </Row>
          </ConfigProvider>
        </section>

        <section className='mt-5'>
          <h4 className='mb-3'>เนื้อหาและรายละเอียด</h4>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Controller
                control={control}
                name="display_type"
                rules={{ required: 'กรุณาเลือกประเภทการแสดงผล' }}
                render={({ field }) => (
                  <fieldset>
                    <Radio.Group
                      {...field}
                      options={[
                        { label: 'รูปภาพหรือวิดิโอ', value: 'IMAGE_VIDEO' },
                        { label: 'ข้อความ', value: 'TEXT' },
                      ]}
                    />
                  </fieldset>
                )}
              />
            </Col>
            {displayType === 'IMAGE_VIDEO' ? (
              <Col xs={24}>
                <Controller
                  name="file"
                  control={control}
                  rules={{ required: 'กรุณาอัปโหลดไฟล์' }}
                  render={({ field: { value, onChange, name: fieldName } }) => (
                    <fieldset>
                      <label>อัปโหลดไฟล์ <span className='text-red-500'>*</span></label>
                      <p className='fs-12 text-gray-400 mb-2'>ลากและวางไฟล์ที่นี่เพื่อดำเนินการต่อ</p>
                      <Upload.Dragger
                        name={fieldName}
                        fileList={value}
                        listType='picture'
                        className={value.length ? '[&_.ant-upload]:hidden! [&_.ant-upload]:p-0!' : ''}
                        maxCount={1}
                        accept='image/jpeg,image/jpg,image/png,image/gif,video/mp4,video/avi,video/x-msvideo,video/quicktime'
                        beforeUpload={(file) => {
                          const allowList = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/x-msvideo', 'video/quicktime']
                          const isVideo = file.type.startsWith('video/')
                          const maxFileSize = isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024
                          if (!allowList.includes(file.type)) {
                            message.error('ประเภทไฟล์ไม่ถูกต้อง')
                            return Upload.LIST_IGNORE
                          }
                          if (file.size > maxFileSize) {
                            message.error(`ไม่สามารถอัปโหลดไฟล์ได้ ไฟล์ที่อัปโหลดมีขนาดเกิน ${isVideo ? '200 MB' : '10 MB'}`)
                            return Upload.LIST_IGNORE
                          }
                          return false
                        }}
                        onChange={({ fileList }) => {
                          if (!fileList.length) {
                            onChange([])
                            setValue('file_url', '')
                            return
                          }
                          const withStatus = fileList.map(f => ({ ...f, status: 'uploading' as const }))
                          onChange(withStatus)
                          uploadFile(fileList)
                        }}
                      >
                        {value.length ? null : (
                          <>
                            <p className="ant-upload-drag-icon">
                              <CloudUploadOutlined />
                            </p>
                            <h3>ลากหรือวางไฟล์</h3>
                            <p className="fs-12 text-gray-400">
                              ไฟล์วิดีโอรูปแบบ MP4, AVI, MOV หรือไฟล์รูปภาพรูปแบบ JPG, PNG, GIF
                            </p>
                          </>
                        )}
                      </Upload.Dragger>
                      {!!fileUrl && (
                        <figure className='figure-extra-large overflow-hidden rounded-lg mt-1.5'>
                          {value[0]?.type?.startsWith('video/') ? (
                            <video
                              src={`${process.env.NEXT_PUBLIC_HOST_BACKEND}/upload${fileUrl}`}
                              controls
                              className='w-full h-full object-contain'
                            />
                          ) : (
                            <Image
                              src={`${process.env.NEXT_PUBLIC_HOST_BACKEND}/upload${fileUrl}`}
                              alt="preview"
                              width={'100%'}
                              height={'100%'}
                              className='object-center object-contain'
                            />
                          )}
                        </figure>
                      )}
                      {!!errors.file && <p className='text-red-500'>{errors.file.message}</p>}
                    </fieldset>
                  )}
                />
              </Col>
            ) : (
              <Col xs={24}>
                <Controller
                  control={control}
                  name="text"
                  rules={{ required: 'กรุณากรอกข้อความ' }}
                  render={({ field }) => (
                    <fieldset>
                      <label className='text-(--yellow)'>ข้อความ <span className='text-red-500'>*</span></label>
                      <Input.TextArea {...field} placeholder='กรุณากรอกข้อความ...' size='large' rows={4} />
                      {!!errors.text && <p className='text-red-500'>{errors.text.message}</p>}
                    </fieldset>
                  )}
                />
              </Col>
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
                onClick={() => setAddMode(false)}
                disabled={postMedia.isPending}
              >
                <p className='fs-12'>ยกเลิก</p>
              </Button>
            </ConfigProvider>
            <Button
              type='primary'
              htmlType='submit'
              shape='round'
              className='w-full! sm:w-auto!'
              loading={postMedia.isPending}
              disabled={postMedia.isPending}
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
