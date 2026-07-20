import { usePostOpenBridgeLighting } from '@/features/admin/bridge-lighting/detail/hooks';
import { APIResponseBridgeLightingWID, ShellyStatusData } from '@/types/bridge-lighting/overall-api';
import { Button, Col, ConfigProvider, Modal, Radio, Row } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'

interface Props {
  widData?: APIResponseBridgeLightingWID
  shellyStatus?: ShellyStatusData
  editMode: boolean
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>
  /** Called with the target on/off after a successful send so the parent can
   *  show a pending overlay until the shelly-status poll flips to that state. */
  onSubmitted?: (nextIsOn: boolean) => void
}

// Upstream its-api-go/dashvue/openBridgeLighting accepts send="1" (ON) and
// send="2" (OFF) — NOT "0". The old dashvue front-end has always sent "2"
// for the off path; the new UI was sending "0" silently, which the upstream
// legacy service ignored → users saw "ON works, OFF does nothing".
interface FormUpdateStatus {
  send: '1' | '2'
  wid: string
}

// const TYPE = [
//   { label: "ดำเนินการทันที", value: "INSTANT" },
//   { label: "ตั้งเวลา", value: "SCHEDULED" },
// ]

const STATUS = [
  { label: 'เปิดไฟประดับสะพาน', value: '1' },
  { label: 'ปิดไฟประดับสะพาน', value: '2' },
]

const FormUpdateBridgeLightingStatus: React.FC<Props> = (props) => {
  const { widData, shellyStatus, setEditMode, onSubmitted } = props

  const form = useForm<FormUpdateStatus>({
    defaultValues: {
      send: shellyStatus?.output ? '1' : '2',
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
    // Confirm before touching the device — same guard dashvue used
    // (SweetAlert "ต้องการเปิด/ปิดไฟหรือไม่"). ON/OFF affects live wiring
    // and users in the area, so a stray click shouldn't fire the command.
    const isOn = data.send === '1'
    // Modal.confirm / .success are STATIC methods → they do NOT read the
    // ConfigProvider theme, so they fall back to antd's default font (not the
    // app's IBM Plex Sans Thai) and antd Buttons set their own font-family
    // (don't inherit body). Force the app font token via inline style (beats
    // antd's CSS) on the text spans, the confirm body, and each button so the
    // whole popup matches the rest of the app. Body 3 / 14px Regular per the
    // design's Typography — use exact `text-[14px]` (NOT `fs-14`, which clamps
    // up to 16px on desktop) + `font-normal` (antd's confirm title is 600-bold).
    const FONT = 'var(--font-ibm-plex-sans-thai)'
    Modal.confirm({
      title: (
        <span className='text-[14px]! font-normal! block' style={{ fontFamily: FONT }}>
          {isOn ? 'ยืนยันเปิดไฟประดับสะพาน?' : 'ยืนยันปิดไฟประดับสะพาน?'}
        </span>
      ),
      icon: <ExclamationCircleFilled style={{ color: isOn ? '#66AEFF' : '#FCD116' }} />,
      content: (
        <span className='text-[14px]! block' style={{ fontFamily: FONT }}>
          การสั่งงานนี้จะส่งคำสั่งไปยังอุปกรณ์จริงในพื้นที่ กรุณายืนยันก่อนดำเนินการ
        </span>
      ),
      styles: { body: { fontFamily: FONT } },
      okText: isOn ? 'เปิดไฟ' : 'ปิดไฟ',
      cancelText: 'ยกเลิก',
      okButtonProps: {
        style: {
          background: isOn ? '#66AEFF' : '#FCD116',
          borderColor: isOn ? '#66AEFF' : '#FCD116',
          color: isOn ? '#fff' : '#212121',
          fontFamily: FONT,
        },
      },
      cancelButtonProps: {
        style: { fontFamily: FONT },
      },
      centered: true,
      onOk: () =>
        new Promise<void>((resolve, reject) => {
          postOpenBridgeLighting(data, {
            onSuccess: () => {
              // Success popup is shown by the mutation hook (usePostOpenBridgeLighting)
              // — do NOT add another here or it stacks two identical modals.
              setEditMode(false)
              onSubmitted?.(isOn)
              resolve()
            },
            onError: () => reject(),
          })
        }),
    })
  }, [postOpenBridgeLighting, setEditMode, onSubmitted])

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
