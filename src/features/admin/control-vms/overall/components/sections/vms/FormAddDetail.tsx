import { CloudUploadOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Col, ConfigProvider, Divider, Image, Input, Radio, Row, Select, TimePicker, Upload, UploadFile } from 'antd'
import thTH from 'antd/locale/th_TH'
import { AxiosError } from 'axios'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import th from 'dayjs/locale/th'
import React, { useCallback, useEffect, useMemo } from 'react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { TbCopyPlus, TbTrash } from 'react-icons/tb'
import BuddhistDatePicker from '@/components/date-picker/BuddhistDatePicker'
import { APIRequestPostVMSMedia } from '@/types/control-vms/vms-api'
import { postUploadVMSAPI } from '@/services/routes/SharedService'
import { usePostVMSMedia } from '../../../hooks/usePostVMSMedia'
import { useVMSSettingTypes } from '../../../hooks/useVMSSettingTypes'
import { useControlVMSContext } from '../../../context'
import { isVideoUrl } from '../../../data/media'
import { DayList } from '@/components/list'

dayjs.extend(buddhistEra)
dayjs.locale(th)

interface Props { }

interface FormValues {
  // DISPLAY PROPERTIES
  name: string
  category: number | null
  start_date: string
  end_date: string
  display_type: 'ALL_DAY' | 'SCHEDULE'
  // SCHEDULE
  schedules: ScheduleList[]
}

interface ScheduleList {
  schedule_name: string
  days: number[]
  start_time: string
  end_time: string
  media_type: 'IMAGE_VIDEO' | 'TEXT'
  file: UploadFile[]
  file_url: string
  text: string
}

const INIT_SCHEDULE: ScheduleList = {
  schedule_name: '',
  days: [],
  start_time: '',
  end_time: '',
  media_type: 'IMAGE_VIDEO',
  file: [],
  file_url: '',
  text: '',
}

const FormAddDetail: React.FC<Props> = () => {
  const { message } = App.useApp()
  const { setAddMode, vmsIdList } = useControlVMSContext()
  const { data: settingTypesData } = useVMSSettingTypes()
  const postMedia = usePostVMSMedia()

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      category: null,
      start_date: '',
      end_date: '',
      display_type: 'ALL_DAY',
      schedules: [INIT_SCHEDULE],
    },
  })

  // FORM CONTROL
  const { control, setValue, handleSubmit, formState: { errors } } = form

  // USE FIELD ARRAY
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'schedules',
  })

  const displayType = useWatch({ control, name: 'display_type' })
  const schedulesWatch = useWatch({ control, name: 'schedules' })
  const watchStartDate = useWatch({ control, name: 'start_date' })
  const watchEndDate = useWatch({ control, name: 'end_date' })

  const availableDays = useMemo(() => {
    if (!watchStartDate || !watchEndDate) return [1, 2, 3, 4, 5, 6, 7]
    const start = dayjs(watchStartDate)
    const end = dayjs(watchEndDate)
    if (!start.isValid() || !end.isValid() || !end.isAfter(start)) return [1, 2, 3, 4, 5, 6, 7]
    if (end.diff(start, 'day') >= 6) return [1, 2, 3, 4, 5, 6, 7]
    const days = new Set<number>()
    for (let i = 0; i <= end.diff(start, 'day'); i++) {
      const d = start.add(i, 'day').day()
      days.add(d === 0 ? 7 : d)
    }
    return Array.from(days).sort((a, b) => a - b)
  }, [watchStartDate, watchEndDate])

  useEffect(() => {
    for (let i = 0; i < fields.length; i++) {
      setValue(`schedules.${i}.days`, availableDays, { shouldValidate: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableDays])

  const onSubmit = useCallback((data: FormValues) => {
    if (!vmsIdList.length) {
      message.warning('กรุณาเลือกป้าย VMS อย่างน้อย 1 ป้าย')
      return
    }
    if (data.schedules.some(s => s.media_type === 'IMAGE_VIDEO' && !s.file_url)) {
      message.warning('กรุณารอการอัปโหลดให้เสร็จก่อนบันทึก')
      return
    }

    const body: APIRequestPostVMSMedia = {
      "date_since": dayjs(data.start_date).format('YYYY-MM-DD'),
      "date_to": dayjs(data.end_date).format('YYYY-MM-DD'),
      "is_all_day": data.display_type === 'ALL_DAY' ? true : false,
      "schedules": schedulesWatch.map(item => ({
        "days_of_week": item.days,
        "media_url": item.media_type === 'IMAGE_VIDEO' ? item.file_url : '',
        "message": item.media_type === 'TEXT' ? item.text : '',
        "schedule_name": item.schedule_name,
        "time_since": dayjs(item.start_time, 'HH:mm').format('HH:mm'),
        "time_to": dayjs(item.end_time, 'HH:mm').format('HH:mm')
      })),
      "setting_type_id": Number(data.category),
      "type_name": data.name,
      "vms_ids": vmsIdList
    }

    postMedia.mutate(body, { onSuccess: () => setAddMode(false) })
  }, [vmsIdList, setAddMode, postMedia, message, schedulesWatch])

  const uploadFile = useCallback(async (file: UploadFile[], index: number) => {
    setValue(`schedules.${index}.file`, [{ ...file[0], status: 'uploading' }])
    try {
      const fd = new FormData()
      fd.append('upload', file[0].originFileObj as File)
      const response = await postUploadVMSAPI(fd, true)
      const path = response.data?.path || ''
      setValue(`schedules.${index}.file_url`, path)
      setValue(`schedules.${index}.file`, [{ ...file[0], status: 'done', url: path, thumbUrl: path }])
    } catch (error) {
      setValue(`schedules.${index}.file`, [{ ...file[0], status: 'error' }])
      message.error(error instanceof AxiosError ? (error.response?.data?.message ?? 'อัปโหลดไม่สำเร็จ') : 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์')
    }
  }, [setValue, message])

  const renderMediaSection = useCallback((index: number) => {
    const mediaType = schedulesWatch?.[index]?.media_type
    const fileUrl = schedulesWatch?.[index]?.file_url ?? ''
    return (
      <>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
          <Controller
            control={control}
            name={`schedules.${index}.media_type`}
            rules={{ required: 'กรุณาเลือกประเภทการแสดงผล' }}
            render={({ field }) => (
              <fieldset>
                <Radio.Group
                  {...field}
                  options={[
                    { label: 'รูปภาพหรือวิดิโอ', value: 'IMAGE_VIDEO' },
                    { label: 'ข้อความ', value: 'TEXT' },
                  ]}
                  onChange={(e) => {
                    field.onChange(e.target.value as string)
                    setValue(`schedules.${index}.text`, '')
                    setValue(`schedules.${index}.file_url`, '')
                    setValue(`schedules.${index}.file`, [])
                  }}
                />
              </fieldset>
            )}
          />
        </Col>
        {mediaType === 'IMAGE_VIDEO' ? (
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
            <Controller
              name={`schedules.${index}.file`}
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
                        setValue(`schedules.${index}.file_url`, '')
                        return
                      }
                      const withStatus = fileList.map(f => ({ ...f, status: 'uploading' as const }))
                      onChange(withStatus)
                      uploadFile(fileList, index)
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
                      {value[0]?.type?.startsWith('video/') || isVideoUrl(fileUrl) ? (
                        <video
                          src={fileUrl}
                          controls
                          className='w-full h-full object-contain'
                        />
                      ) : (
                        <Image
                          src={fileUrl}
                          alt="preview"
                          width={'100%'}
                          height={'100%'}
                          className='object-center object-contain'
                        />
                      )}
                    </figure>
                  )}
                  {!!errors.schedules?.[index]?.file && <p className='text-red-500'>{errors.schedules[index].file?.message}</p>}
                </fieldset>
              )}
            />
          </Col>
        ) : (
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
            <Controller
              control={control}
              name={`schedules.${index}.text`}
              rules={{ required: 'กรุณากรอกข้อความ' }}
              render={({ field }) => (
                <fieldset>
                  <label className='text-(--yellow)'>ข้อความ <span className='text-red-500'>*</span></label>
                  <Input.TextArea {...field} placeholder='กรุณากรอกข้อความ...' size='large' rows={4} />
                  {!!errors.schedules?.[index]?.text && <p className='text-red-500'>{errors.schedules[index].text?.message}</p>}
                </fieldset>
              )}
            />
          </Col>
        )}
      </>
    )
  }, [control, schedulesWatch, setValue, message, uploadFile, errors])

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
                      <label className='text-(--yellow)'>เริ่มต้นการแสดงผล <span className='text-red-500'>*</span></label>
                      <BuddhistDatePicker
                        {...field}
                        placeholder='กรุณาเลือกวันที่และเวลาเริ่มต้น...'
                        className='w-full'
                        format='DD MMMM BBBB'
                        size='large'
                      // showTime
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
                      <label className='text-(--yellow)'>สิ้นสุดการแสดงผล <span className='text-red-500'>*</span></label>
                      <BuddhistDatePicker
                        {...field}
                        placeholder='กรุณาเลือกวันที่และเวลาสิ้นสุด...'
                        className='w-full'
                        format='DD MMMM BBBB'
                        size='large'
                      // showTime
                      />
                      {!!errors.end_date && <p className='text-red-500'>{errors.end_date.message}</p>}
                    </fieldset>
                  )}
                />
              </Col>
              <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
                <Controller
                  control={control}
                  name="display_type"
                  rules={{ required: 'กรุณาเลือกเงื่อนไขการทำงาน' }}
                  render={({ field }) => (
                    <fieldset>
                      <label className='text-(--yellow)'>เงื่อนไขการทำงาน <span className='text-red-500'>*</span></label>
                      <Select
                        {...field}
                        onChange={(value) => {
                          field.onChange(value)
                          if (value === 'ALL_DAY' && fields.length > 1) {
                            remove(Array.from({ length: fields.length - 1 }, (_, i) => i + 1))
                          }
                        }}
                        placeholder='กรุณาเลือกเงื่อนไขการทำงาน...'
                        size='large'
                        options={[
                          { label: 'แสดงผลตลอดเวลา', value: 'ALL_DAY' },
                          { label: 'เลือกวันและเวลาที่ต้องการแสดงผล', value: 'SCHEDULE' },
                        ]}
                        className='w-full'
                        showSearch
                        allowClear
                      />
                      {!!errors.display_type && <p className='text-red-500'>{errors.display_type.message}</p>}
                    </fieldset>
                  )}
                />
              </Col>
            </Row>
          </ConfigProvider>
        </section>

        <Divider
          dashed
          classNames={{
            root: 'border-(--light-gray-3)!'
          }}
        />

        <section className='mt-5'>
          {fields.map((field, index) => {
            return (
              <React.Fragment key={field.id}>
                {displayType === 'SCHEDULE' && index > 0 && (
                  <Divider
                    dashed
                    classNames={{
                      root: 'border-(--light-gray-3)!'
                    }}
                  />
                )}
                <section>
                  {displayType === 'SCHEDULE' && (
                    <div className={`${displayType === 'SCHEDULE' ? 'flex items-center gap-3 mb-3' : 'block mb-3'}`}>
                      <h4>ตารางเวลาลำดับที่ {index + 1}</h4>
                      {index > 0 && (
                        <TbTrash
                          className='fs-22 text-red-500 cursor-pointer shrink-0'
                          onClick={() => remove(index)}
                        />
                      )}
                    </div>
                  )}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
                      <Controller
                        control={control}
                        name={`schedules.${index}.schedule_name`}
                        rules={{ required: 'กรุณากรอกชื่อรูปแบบ' }}
                        render={({ field }) => (
                          <fieldset>
                            <label className='text-(--yellow)'>ชื่อตารางเวลา <span className='text-red-500'>*</span></label>
                            <Input {...field} placeholder='กรุณากรอกชื่อตารางเวลา...' size='large' />
                            {!!errors.schedules?.[index]?.schedule_name && <p className='text-red-500'>{errors.schedules[index].schedule_name.message}</p>}
                          </fieldset>
                        )}
                      />
                    </Col>
                    {displayType === 'SCHEDULE' && (
                      <>
                        <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
                          <Controller
                            control={control}
                            name={`schedules.${index}.days`}
                            rules={{ required: 'กรุณาเลือกเงื่อนไขการทำงานรายวัน' }}
                            render={({ field }) => (
                              <fieldset>
                                <label className='text-(--yellow)'>เงื่อนไขการทำงานรายวัน <span className='text-red-500'>*</span></label>
                                <DayList
                                  value={field.value}
                                  onChange={(value) => field.onChange(value)}
                                  disabledDate={(day) => !availableDays.includes(day)}
                                />
                                {!!errors.schedules?.[index]?.days && <p className='text-red-500'>{errors.schedules[index].days?.message}</p>}
                              </fieldset>
                            )}
                          />
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
                          <Controller
                            name={`schedules.${index}.start_time`}
                            control={control}
                            rules={{ required: 'กรุณาเลือกเวลาเริ่มต้น' }}
                            render={({ field }) => (
                              <fieldset>
                                <label className='text-(--yellow)'>เวลาเริ่มต้น <span className='text-red-500'>*</span></label>
                                <TimePicker
                                  name={field.name}
                                  onBlur={field.onBlur}
                                  value={field.value ? dayjs(field.value, 'HH:mm') : null}
                                  onChange={(time) => field.onChange(time ? time.format('HH:mm') : '')}
                                  placeholder='กรุณาเลือกเวลาเริ่มต้น...'
                                  className='w-full'
                                  size='large'
                                  format='HH:mm'
                                />
                                {!!errors.schedules?.[index]?.start_time && <p className='text-red-500'>{errors.schedules[index].start_time?.message}</p>}
                              </fieldset>
                            )}
                          />
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
                          <Controller
                            name={`schedules.${index}.end_time`}
                            control={control}
                            rules={{
                              required: 'กรุณาเลือกเวลาสิ้นสุด',
                              validate: (v, form) =>
                                !form.schedules?.[index]?.start_time || !v || dayjs(v, 'HH:mm').isAfter(dayjs(form.schedules[index].start_time, 'HH:mm'))
                                  ? true
                                  : 'เวลาสิ้นสุดต้องมาหลังเวลาเริ่มต้น',
                            }}
                            render={({ field }) => (
                              <fieldset>
                                <label className='text-(--yellow)'>เวลาสิ้นสุด <span className='text-red-500'>*</span></label>
                                <TimePicker
                                  name={field.name}
                                  onBlur={field.onBlur}
                                  value={field.value ? dayjs(field.value, 'HH:mm') : null}
                                  onChange={(time) => field.onChange(time ? time.format('HH:mm') : '')}
                                  placeholder='กรุณาเลือกเวลาสิ้นสุด...'
                                  className='w-full'
                                  size='large'
                                  format='HH:mm'
                                />
                                {!!errors.schedules?.[index]?.end_time && <p className='text-red-500'>{errors.schedules[index].end_time?.message}</p>}
                              </fieldset>
                            )}
                          />
                        </Col>
                      </>
                    )}
                  </Row>
                </section>
                <section className='my-5'>
                  <h4 className='mb-3'>เนื้อหาและรายละเอียด</h4>
                  <Row gutter={[16, 16]}>
                    {renderMediaSection(index)}
                  </Row>
                </section>
              </React.Fragment>
            )
          })}
          {displayType === 'SCHEDULE' && (
            <Button
              block
              htmlType='button'
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => append({ ...INIT_SCHEDULE, days: availableDays })}
            >
              เพิ่มคำสั่ง
            </Button>
          )}
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
