import { CloudUploadOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Col, ConfigProvider, Divider, Image, Input, Radio, Row, Select, TimePicker, Upload, UploadFile } from 'antd'
import thTH from 'antd/locale/th_TH'
import { AxiosError } from 'axios'
import dayjs, { Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import th from 'dayjs/locale/th'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { TbTrash } from 'react-icons/tb'
import BuddhistDatePicker from '@/components/date-picker/BuddhistDatePicker'
import { DayList } from '@/components/list'
import { APIRequestPostVMSMedia, APIRequestPutVMSMedia, VMSMediaSchedule } from '@/types/control-vms/vms-api'
import { postUploadVMSAPI } from '@/services/routes/SharedService'
import { usePostVMSMedia } from '../../../hooks/usePostVMSMedia'
import { usePutVMSMedia } from '../../../hooks/usePutVMSMedia'
import { useVMSSettingTypes } from '../../../hooks/useVMSSettingTypes'
import { useVMSSettingListInfinite } from '../../../hooks/useVMSSettingListInfinite'
import { INIT_UPDATE_SCHEDULE, useControlVMSContext } from '../../../context'
import { APIResponseVMSMediaById, VMSScheduleByDate } from '@/types/control-vms/display-api'
import { isVideoUrl } from '../../../data/media'

dayjs.extend(buddhistEra)
dayjs.locale(th)

interface Props {
  id?: string | number
  type?: 'CREATE' | 'EDIT' | 'DELETE'
  data?: APIResponseVMSMediaById
  vmsOption?: VMSScheduleByDate
}

interface ScheduleRow {
  schedule_name: string
  days: number[]
  start_time: string
  end_time: string
  media_type: 'IMAGE_VIDEO' | 'TEXT'
  file: UploadFile[]
  file_url: string
  text: string
}

const INIT_SCHEDULE: ScheduleRow = {
  schedule_name: '',
  days: [],
  start_time: '',
  end_time: '',
  media_type: 'IMAGE_VIDEO',
  file: [],
  file_url: '',
  text: '',
}

interface FormValues {
  vms_ids: number[]
  name: string
  category: number | null
  start_date: Dayjs | null
  end_date: Dayjs | null
  display_type: 'ALL_DAY' | 'SCHEDULE'
  schedules: ScheduleRow[]
}

const FormUpdateSchedule: React.FC<Props> = (props) => {
  const { id, type, data, vmsOption } = props
  const { message } = App.useApp()
  const { setUpdateScheduleState } = useControlVMSContext()
  const { data: settingTypesData } = useVMSSettingTypes()

  const [settingSearch, setSettingSearch] = useState('')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const {
    data: settingListPages,
    isLoading: isSettingListLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useVMSSettingListInfinite(settingSearch)

  const settingOptions = useMemo(() => {
    const pages = settingListPages?.pages.flatMap(p => p.data.res_data ?? []) ?? []
    if (!vmsOption || type !== 'EDIT') return pages
    const alreadyLoaded = pages.some(o => o.vms_id === vmsOption.setting_id)
    if (alreadyLoaded) return pages
    const seed = { vms_id: vmsOption.setting_id, solution_name: vmsOption.solution_name } as (typeof pages)[number]
    return [seed, ...pages]
  }, [settingListPages?.pages, vmsOption, type])

  const handleSettingSearch = useCallback((value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setSettingSearch(value), 400)
  }, [])

  const handleSettingPopupScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const postMedia = usePostVMSMedia()
  const putMedia = usePutVMSMedia()

  const form = useForm<FormValues>({
    defaultValues: {
      vms_ids: vmsOption?.setting_id ? [vmsOption.setting_id] : [],
      name: data?.type_name || '',
      category: data?.setting_type_id || null,
      start_date: data?.date_since ? dayjs(data.date_since) : null,
      end_date: data?.date_to ? dayjs(data.date_to) : null,
      display_type: data ? (data.is_all_day ? 'ALL_DAY' : 'SCHEDULE') : 'ALL_DAY',
      schedules: data?.schedules?.length
        ? data.schedules.map(s => ({
          schedule_name: s.schedule_name || '',
          days: s.days_of_week ?? [],
          start_time: s.time_since || '',
          end_time: s.time_to || '',
          media_type: s.media_url ? 'IMAGE_VIDEO' : 'TEXT',
          file: s.media_url
            ? [{ uid: '-1', name: s.media_url.split('/').pop() || 'file', status: 'done' as const, url: s.media_url, thumbUrl: s.media_url }]
            : [],
          file_url: s.media_url || '',
          text: s.message || '',
        }))
        : [INIT_SCHEDULE],
    },
  })

  const { control, setValue, getValues, handleSubmit, formState: { errors } } = form

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'schedules',
  })

  const displayType = useWatch({ control, name: 'display_type' })
  const schedulesWatch = useWatch({ control, name: 'schedules' })
  const watchStartDate = useWatch({ control, name: 'start_date' })
  const watchEndDate = useWatch({ control, name: 'end_date' })
  const isPending = postMedia.isPending || putMedia.isPending

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

  const isFirstDaysSync = useRef(true)
  useEffect(() => {
    if (isFirstDaysSync.current) {
      // Skip the initial mount so seeded `days_of_week` from EDIT data isn't clobbered.
      isFirstDaysSync.current = false
      return
    }
    for (let i = 0; i < fields.length; i++) {
      const current = getValues(`schedules.${i}.days`) ?? []
      setValue(`schedules.${i}.days`, current.filter(d => availableDays.includes(d)), { shouldValidate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableDays])

  const onSubmit = useCallback((formData: FormValues) => {
    if (type === 'CREATE' && !formData.vms_ids.length) {
      message.warning('กรุณาเลือกป้าย VMS อย่างน้อย 1 ป้าย')
      return
    }
    if (formData.schedules.some(s => s.media_type === 'IMAGE_VIDEO' && !s.file_url)) {
      message.warning('กรุณารอการอัปโหลดให้เสร็จก่อนบันทึก')
      return
    }

    const schedules: VMSMediaSchedule[] = formData.schedules.map(item => ({
      days_of_week: item.days,
      media_url: item.media_type === 'IMAGE_VIDEO' ? item.file_url : '',
      message: item.media_type === 'TEXT' ? item.text : '',
      schedule_name: item.schedule_name,
      time_since: formData.display_type === 'ALL_DAY' ? '00:00' : dayjs(item.start_time, 'HH:mm').format('HH:mm'),
      time_to: formData.display_type === 'ALL_DAY' ? '23:59' : dayjs(item.end_time, 'HH:mm').format('HH:mm'),
    }))

    const basePayload = {
      date_since: dayjs(formData.start_date).format('YYYY-MM-DD'),
      date_to: dayjs(formData.end_date).format('YYYY-MM-DD'),
      is_all_day: formData.display_type === 'ALL_DAY',
      schedules,
      setting_type_id: Number(formData.category),
      type_name: formData.name,
      vms_ids: formData.vms_ids,
    }

    if (id && type === 'EDIT') {
      const body: APIRequestPutVMSMedia = basePayload
      putMedia.mutate({ id, data: body }, {
        onSuccess: () => setUpdateScheduleState(INIT_UPDATE_SCHEDULE),
      })
    } else {
      const body: APIRequestPostVMSMedia = basePayload
      postMedia.mutate(body, {
        onSuccess: () => setUpdateScheduleState(INIT_UPDATE_SCHEDULE),
      })
    }
  }, [setUpdateScheduleState, postMedia, putMedia, id, type, message])

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
        <Col xs={24}>
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
          <Col xs={24}>
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
          <Col xs={24}>
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
    <form onSubmit={handleSubmit(onSubmit)} className='lg:px-8'>
      <section>
        <h4 className='mb-3'>ข้อมูลจุดติดตั้ง</h4>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Controller
              disabled={type === 'EDIT' ? true : false}
              control={control}
              name="vms_ids"
              rules={{ required: 'กรุณาเลือกจุดติดตั้ง' }}
              render={({ field }) => (
                <fieldset>
                  <label className='text-(--yellow)'>จุดติดตั้ง <span className='text-red-500'>*</span></label>
                  <Select
                    {...field}
                    placeholder='กรุณาเลือกจุดติดตั้ง...'
                    size='large'
                    options={settingOptions}
                    fieldNames={{ label: 'solution_name', value: 'vms_id' }}
                    className='w-full'
                    showSearch={{ filterOption: false, onSearch: handleSettingSearch }}
                    onPopupScroll={handleSettingPopupScroll}
                    allowClear
                    mode='multiple'
                    maxTagCount={3}
                    loading={isSettingListLoading || isFetchingNextPage}
                    notFoundContent={isSettingListLoading ? 'กำลังโหลด...' : 'ไม่พบข้อมูล'}
                  />
                  {!!errors.vms_ids && <p className='text-red-500'>{errors.vms_ids.message}</p>}
                </fieldset>
              )}
            />
          </Col>
        </Row>
      </section>

      <section className='mt-5'>
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
                rules={{ required: 'กรุณาเลือกวันที่เริ่มต้น' }}
                render={({ field }) => (
                  <fieldset>
                    <label className='text-(--yellow)'>เริ่มต้นการแสดงผล <span className='text-red-500'>*</span></label>
                    <BuddhistDatePicker
                      {...field}
                      placeholder='กรุณาเลือกวันที่เริ่มต้น...'
                      className='w-full'
                      format='DD MMMM BBBB'
                      size='large'
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
                  required: 'กรุณาเลือกวันที่สิ้นสุด',
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
                      placeholder='กรุณาเลือกวันที่สิ้นสุด...'
                      className='w-full'
                      format='DD MMMM BBBB'
                      size='large'
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
                  <div className='flex items-center gap-3 mb-3'>
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
                          rules={{
                            required: 'กรุณาเลือกเวลาเริ่มต้น',
                            validate: (v, form) => {
                              if (!v) return true
                              const current = dayjs(v, 'HH:mm')
                              for (const prev of (form.schedules ?? []).slice(0, index)) {
                                if (!prev.start_time || !prev.end_time) continue
                                const prevStart = dayjs(prev.start_time, 'HH:mm')
                                const prevEnd = dayjs(prev.end_time, 'HH:mm')
                                if (!current.isBefore(prevStart) && !current.isAfter(prevEnd)) {
                                  return 'เวลาเริ่มต้นซ้ำซ้อนกับตารางเวลาก่อนหน้า'
                                }
                              }
                              return true
                            },
                          }}
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
                            validate: (v, form) => {
                              if (!v) return true
                              const current = dayjs(v, 'HH:mm')
                              const currentStart = form.schedules?.[index]?.start_time
                              if (currentStart && !current.isAfter(dayjs(currentStart, 'HH:mm'))) {
                                return 'เวลาสิ้นสุดต้องมาหลังเวลาเริ่มต้น'
                              }
                              for (const prev of (form.schedules ?? []).slice(0, index)) {
                                if (!prev.start_time || !prev.end_time) continue
                                const prevStart = dayjs(prev.start_time, 'HH:mm')
                                const prevEnd = dayjs(prev.end_time, 'HH:mm')
                                if (!current.isBefore(prevStart) && !current.isAfter(prevEnd)) {
                                  return 'เวลาสิ้นสุดซ้ำซ้อนกับตารางเวลาก่อนหน้า'
                                }
                              }
                              return true
                            },
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
              onClick={() => setUpdateScheduleState(INIT_UPDATE_SCHEDULE)}
              disabled={isPending}
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

export default React.memo<Props>(FormUpdateSchedule)
