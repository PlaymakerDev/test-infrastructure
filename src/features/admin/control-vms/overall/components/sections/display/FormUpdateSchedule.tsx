import { CloudUploadOutlined } from '@ant-design/icons'
import { App, Button, Col, ConfigProvider, Image, Input, Radio, Row, Select, Upload, UploadFile } from 'antd'
import thTH from 'antd/locale/th_TH'
import { AxiosError } from 'axios'
import dayjs, { Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import th from 'dayjs/locale/th'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import BuddhistDatePicker from '@/components/date-picker/BuddhistDatePicker'
import { APIRequestPostVMSMedia, APIRequestPutVMSMedia } from '@/types/control-vms/vms-api'
import { postUploadVMSAPI } from '@/services/routes/SharedService'
import { usePostVMSMedia } from '../../../hooks/usePostVMSMedia'
import { usePutVMSMedia } from '../../../hooks/usePutVMSMedia'
import { useVMSSettingTypes } from '../../../hooks/useVMSSettingTypes'
import { useVMSSettingListInfinite } from '../../../hooks/useVMSSettingListInfinite'
import { INIT_UPDATE_SCHEDULE, useControlVMSContext } from '../../../context'
import { APIResponseVMSMediaById, VMSSettingSchedule } from '@/types/control-vms/display-api'
import { isVideoUrl } from '../../../data/media'

dayjs.extend(buddhistEra)
dayjs.locale(th)

interface Props {
  id?: string | number
  type?: 'CREATE' | 'EDIT' | 'DELETE'
  data?: APIResponseVMSMediaById
  vmsOption?: VMSSettingSchedule
}

interface FormValues {
  vms_ids: number[]
  name: string
  category: number | null
  start_date: Dayjs | null
  end_date: Dayjs | null
  display_type: string
  file: UploadFile[]
  file_url: string
  text: string
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
      start_date: data?.since ? dayjs(data.since) : null,
      end_date: data?.to ? dayjs(data.to) : null,
      display_type: id ? (!!data?.media_url ? 'IMAGE_VIDEO' : 'TEXT') : 'IMAGE_VIDEO',
      file: data?.media_url
        ? [{ uid: '-1', name: data.media_url.split('/').pop() || 'file', status: 'done' as const, url: data.media_url, thumbUrl: data.media_url }] as UploadFile[]
        : [],
      file_url: data?.media_url || '',
      text: data?.message || '',
    },
  })

  const { control, setValue, handleSubmit, formState: { errors } } = form

  const displayType = useWatch({ control, name: 'display_type' })
  const fileUrl = useWatch({ control, name: 'file_url' })
  const isPending = postMedia.isPending || putMedia.isPending
  // const previewSrc = fileUrl.startsWith('http')
  //   ? fileUrl
  //   : fileUrl.startsWith('/upload')
  //     ? `${process.env.NEXT_PUBLIC_HOST_BACKEND}${fileUrl}`
  //     : `${process.env.NEXT_PUBLIC_HOST_BACKEND}/upload${fileUrl}`
  const previewSrc = fileUrl

  const onSubmit = useCallback((formData: FormValues) => {
    if (type === 'CREATE' && !formData.vms_ids.length) {
      message.warning('กรุณาเลือกป้าย VMS อย่างน้อย 1 ป้าย')
      return
    }
    if (formData.display_type === 'IMAGE_VIDEO' && !formData.file_url) {
      message.warning('กรุณารอการอัปโหลดให้เสร็จก่อนบันทึก')
      return
    }

    if (id && type === 'EDIT') {
      const body: APIRequestPutVMSMedia = {
        media_url: formData.display_type === 'IMAGE_VIDEO' ? formData.file_url : '',
        message: formData.display_type === 'TEXT' ? formData.text : '',
        setting_type_id: Number(formData.category),
        since: dayjs(formData.start_date).format(),
        to: dayjs(formData.end_date).format(),
        type_name: formData.name,
      }
      putMedia.mutate({ id, data: body }, {
        onSuccess: () => setUpdateScheduleState(INIT_UPDATE_SCHEDULE),
      })
    } else {
      const body: APIRequestPostVMSMedia = {
        media_url: formData.display_type === 'IMAGE_VIDEO' ? formData.file_url : '',
        message: formData.display_type === 'TEXT' ? formData.text : '',
        setting_type_id: Number(formData.category),
        since: dayjs(formData.start_date).format(),
        to: dayjs(formData.end_date).format(),
        type_name: formData.name,
        vms_ids: formData.vms_ids,
      }
      postMedia.mutate(body, {
        onSuccess: () => setUpdateScheduleState(INIT_UPDATE_SCHEDULE),
      })
    }
  }, [setUpdateScheduleState, postMedia, putMedia, id, type, message])

  const uploadFile = useCallback(async (file: UploadFile[]) => {
    setValue('file', [{ ...file[0], status: 'uploading' }])
    try {
      const fd = new FormData()
      fd.append('upload', file[0].originFileObj as File)
      const response = await postUploadVMSAPI(fd, true)
      const path = response.data?.path || ''
      // const fullUrl = `${process.env.NEXT_PUBLIC_HOST_BACKEND}/upload${path}`
      const fullUrl = path
      setValue('file_url', path)
      setValue('file', [{ ...file[0], status: 'done', url: fullUrl, thumbUrl: fullUrl }])
    } catch (error) {
      setValue('file', [{ ...file[0], status: 'error' }])
      message.error(error instanceof AxiosError ? (error.response?.data?.message ?? 'อัปโหลดไม่สำเร็จ') : 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์')
    }
  }, [setValue, message])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='lg:px-8'>
      <section>
        <h4 className='mb-3'>ข้อมูลจุดติดตั้ง</h4>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
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
                    onChange={(e) => {
                      field.onChange(e.target.value as string)
                      setValue('text', '')
                      setValue('file_url', '')
                      setValue('file', [])
                    }}
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
                        {value[0]?.type?.startsWith('video/') || isVideoUrl(fileUrl) ? (
                          <video
                            src={previewSrc}
                            controls
                            className='w-full h-full object-contain'
                          />
                        ) : (
                          <Image
                            src={previewSrc}
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
