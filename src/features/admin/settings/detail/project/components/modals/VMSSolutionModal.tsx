"use client"
import { Button, ConfigProvider, Form, Input, Modal } from 'antd'
import React, { useEffect } from 'react'
import { TbDeviceDesktop, TbPlus, TbTrash } from 'react-icons/tb'
import { useProjectDetailContext } from '../../context'
import type { TaskType } from '../../types'

interface Props {
  open: boolean
  /** The VMS Solution row (tbl_solution.id) whose cameras we're
   *  provisioning together with the desktop-screen URL. */
  task: TaskType | null
  onClose: () => void
}

interface CameraRow {
  camera_name: string
  sta: string
  ip_address?: string
  hls_url: string
  latitude: string
  longitude: string
  remark?: string
}

interface FormShape {
  desktop_screen_url: string
  cameras: CameraRow[]
}

const RequiredLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: '#1F1F1F', fontSize: "var(--fs-12)", fontWeight: 500 }}>
    {children}
    <span style={{ color: '#FF3B3B', marginLeft: 2 }}>*</span>
  </span>
)

const PlainLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: '#1F1F1F', fontSize: "var(--fs-12)", fontWeight: 500 }}>{children}</span>
)

/** VMS provisioning modal — creates the full VMS solution + all its
 *  cameras + desktop-screen URL in a single backend call via
 *  `POST /solution/vms/solution`. Reuses the useFieldArray-style
 *  repeater pattern from control-vms's FormAddDetail.tsx. */
const VMSSolutionModal: React.FC<Props> = ({ open, task, onClose }) => {
  const { createVMSSolution, isSubmitting } = useProjectDetailContext()
  const [form] = Form.useForm<FormShape>()

  useEffect(() => {
    if (!open) return
    form.setFieldsValue({
      desktop_screen_url: '',
      cameras: [
        {
          camera_name: '',
          sta: '',
          ip_address: '',
          hls_url: '',
          latitude: '',
          longitude: '',
          remark: '',
        },
      ],
    })
  }, [open, form])

  const handleFinish = async (v: FormShape) => {
    if (!task) return
    try {
      await createVMSSolution({
        solution_id: task.id,
        desktop_screen_url: v.desktop_screen_url.trim(),
        cameras: v.cameras.map((c) => ({
          camera_name: c.camera_name.trim(),
          sta: c.sta.trim(),
          ip_address: c.ip_address?.trim() || undefined,
          hls_url: c.hls_url.trim(),
          geometry_point: {
            type: 'Point' as const,
            coordinates: [Number(c.longitude), Number(c.latitude)] as [number, number],
          },
          remark: c.remark?.trim() || undefined,
        })),
      })
      onClose()
    } catch {
      // toast handled inside the context wrapper
    }
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            contentBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            footerBg: '#FFFFFF',
            colorIcon: '#000',
            titleColor: '#1F1F1F',
            borderRadiusLG: 16,
          },
          Form: { labelColor: '#1F1F1F', labelfontSize: "var(--fs-12)" },
          Input: {
            colorBorder: '#E5E5E5',
            activeBorderColor: '#FCD116',
            hoverBorderColor: '#FCD116',
            colorTextPlaceholder: '#B8B8B8',
            borderRadius: 8,
            controlHeight: 44,
            paddingInline: 14,
          },
        },
      }}
    >
      <Modal
        wrapClassName='light-modal'
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnHidden
        width={860}
        closable={{ 'aria-label': 'Custom Close Button' }}
        styles={{
          container: { padding: '32px 40px', borderRadius: 16 },
          mask: { background: 'rgba(0,0,0,0.55)' },
        }}
        title={
          <div className='flex items-center gap-3' style={{ color: '#111' }}>
            <TbDeviceDesktop size={22} style={{ color: 'var(--yellow)' }} />
            <span style={{ fontSize: 20, fontWeight: 600, color: '#111' }}>
              เพิ่มอุปกรณ์ VMS
            </span>
          </div>
        }
      >
        <Form<FormShape>
          form={form}
          layout='vertical'
          onFinish={handleFinish}
          requiredMark={false}
          disabled={isSubmitting}
        >
          <Form.Item
            label={<RequiredLabel>Desktop Screen URL</RequiredLabel>}
            name='desktop_screen_url'
            rules={[
              { required: true, message: 'กรุณาระบุ Desktop Screen URL' },
              { type: 'url', message: 'URL ไม่ถูกต้อง' },
            ]}
          >
            <Input placeholder='https://...' />
          </Form.Item>

          <div
            style={{
              background: '#F5F5F5',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 12,
              fontSize: "var(--fs-12)",
              color: '#4A4A4A',
            }}
          >
            รายการกล้องที่เพิ่มเข้ากับอุปกรณ์ VMS นี้
          </div>

          <Form.List
            name='cameras'
            rules={[
              {
                validator: async (_, value) =>
                  Array.isArray(value) && value.length > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error('ต้องมีกล้องอย่างน้อย 1 ตัว')),
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <div className='flex flex-col gap-4'>
                {fields.map((field, idx) => (
                  <div
                    key={field.key}
                    style={{ border: '1px solid #E5E5E5', borderRadius: 12, padding: 16 }}
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <span style={{ color: '#1F1F1F', fontWeight: 600 }}>กล้องที่ {idx + 1}</span>
                      {fields.length > 1 && (
                        <button
                          type='button'
                          onClick={() => remove(field.name)}
                          className='text-(--red) cursor-pointer hover:opacity-80'
                          title='ลบกล้องแถวนี้'
                        >
                          <TbTrash size={18} />
                        </button>
                      )}
                    </div>
                    <Form.Item
                      label={<RequiredLabel>ชื่อกล้อง</RequiredLabel>}
                      name={[field.name, 'camera_name']}
                      rules={[{ required: true, message: 'กรุณาระบุชื่อกล้อง' }]}
                    >
                      <Input placeholder='กรุณาระบุชื่อกล้อง...' />
                    </Form.Item>
                    <div className='grid grid-cols-2 gap-4'>
                      <Form.Item
                        label={<RequiredLabel>กม.ที่ / STA</RequiredLabel>}
                        name={[field.name, 'sta']}
                        rules={[{ required: true, message: 'กรุณาระบุ STA' }]}
                      >
                        <Input placeholder='เช่น 10+500' />
                      </Form.Item>
                      <Form.Item
                        label={<PlainLabel>IP Address</PlainLabel>}
                        name={[field.name, 'ip_address']}
                      >
                        <Input placeholder='กรุณาระบุ IP Address...' />
                      </Form.Item>
                    </div>
                    <Form.Item
                      label={<RequiredLabel>URL HLS (.m3u8)</RequiredLabel>}
                      name={[field.name, 'hls_url']}
                      rules={[{ required: true, message: 'กรุณาระบุ URL HLS' }]}
                    >
                      <Input placeholder='กรุณาระบุ URL HLS...' />
                    </Form.Item>
                    <div className='grid grid-cols-2 gap-4'>
                      <Form.Item
                        label={<RequiredLabel>Latitude</RequiredLabel>}
                        name={[field.name, 'latitude']}
                        rules={[
                          { required: true, message: 'กรุณาระบุ Latitude' },
                          {
                            validator: async (_, v) =>
                              v && Number.isFinite(Number(v))
                                ? Promise.resolve()
                                : Promise.reject(new Error('Latitude ต้องเป็นตัวเลข')),
                          },
                        ]}
                      >
                        <Input placeholder='กรุณาระบุ Latitude...' />
                      </Form.Item>
                      <Form.Item
                        label={<RequiredLabel>Longitude</RequiredLabel>}
                        name={[field.name, 'longitude']}
                        rules={[
                          { required: true, message: 'กรุณาระบุ Longitude' },
                          {
                            validator: async (_, v) =>
                              v && Number.isFinite(Number(v))
                                ? Promise.resolve()
                                : Promise.reject(new Error('Longitude ต้องเป็นตัวเลข')),
                          },
                        ]}
                      >
                        <Input placeholder='กรุณาระบุ Longitude...' />
                      </Form.Item>
                    </div>
                    <Form.Item label={<PlainLabel>หมายเหตุ</PlainLabel>} name={[field.name, 'remark']}>
                      <Input placeholder='กรุณาระบุหมายเหตุ...' />
                    </Form.Item>
                  </div>
                ))}
                <Form.ErrorList errors={errors} />
                <Button
                  block
                  onClick={() =>
                    add({
                      camera_name: '',
                      sta: '',
                      ip_address: '',
                      hls_url: '',
                      latitude: '',
                      longitude: '',
                      remark: '',
                    })
                  }
                  icon={<TbPlus />}
                  disabled={isSubmitting}
                  style={{
                    background: '#FCD116',
                    color: '#1A1A1A',
                    borderColor: '#FCD116',
                    fontWeight: 500,
                    borderRadius: 8,
                    height: 40,
                  }}
                >
                  เพิ่มกล้อง
                </Button>
              </div>
            )}
          </Form.List>

          <div className='flex justify-end gap-3 mt-6'>
            <Button
              shape='round'
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                background: '#E5E5E5',
                color: '#4A4A4A',
                borderColor: '#E5E5E5',
                padding: '10px 28px',
                height: 'auto',
                fontWeight: 500,
              }}
            >
              ยกเลิก
            </Button>
            <Button
              shape='round'
              htmlType='submit'
              loading={isSubmitting}
              disabled={false}
              style={{
                background: '#FCD116',
                color: '#1A1A1A',
                borderColor: '#FCD116',
                padding: '10px 32px',
                height: 'auto',
                fontWeight: 600,
              }}
            >
              ยืนยัน
            </Button>
          </div>
        </Form>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(VMSSolutionModal)
