"use client"
import { Button, ConfigProvider, Form, Input, message, Modal } from 'antd'
import React, { useEffect } from 'react'
import { TbDeviceCctv } from 'react-icons/tb'
import { useCreateCamera } from '@/hooks/queries/manage'
import { useProjectDetailContext } from '../../context'

interface Props {
  open: boolean
  /** tbl_solution.id — the CCTV solution to attach the new camera to. */
  taskId: number | null
  onClose: () => void
}

interface FormShape {
  camera_name: string
  sta: string
  ip_address?: string
  hls_url: string
  latitude: string
  longitude: string
  remark?: string
}

const labelReq = (t: string) => (
  <span style={{ color: '#1F1F1F', fontSize: 14, fontWeight: 500 }}>
    {t}
    <span style={{ color: '#FF3B3B', marginLeft: 2 }}>*</span>
  </span>
)
const labelOpt = (t: string) => (
  <span style={{ color: '#1F1F1F', fontSize: 14, fontWeight: 500 }}>{t}</span>
)

const toGeometry = (lat: string, lng: string) => ({
  type: 'Point' as const,
  coordinates: [Number(lng), Number(lat)] as [number, number],
})

/** Add a physical CCTV camera under an existing CCTV Solution at the
 *  active installation point. Backend: `POST /api-v2/cctv/cameras`. */
const AddCCTVEquipmentModal: React.FC<Props> = ({ open, taskId, onClose }) => {
  const { activeRoute, activePoint } = useProjectDetailContext()
  const createCamera = useCreateCamera()
  const [form] = Form.useForm<FormShape>()

  useEffect(() => {
    if (open) form.resetFields()
  }, [open, form])

  const handleFinish = async (v: FormShape) => {
    if (taskId == null) return
    try {
      await createCamera.mutateAsync({
        solution_id: taskId,
        camera_name: v.camera_name.trim(),
        sta: v.sta.trim(),
        hls_url: v.hls_url.trim(),
        geometry_point: toGeometry(v.latitude, v.longitude),
        ip_address: v.ip_address?.trim() || undefined,
        remark: v.remark?.trim() || null,
      })
      message.success('เพิ่มอุปกรณ์สำเร็จ')
      onClose()
    } catch (err) {
      const anyErr = err as {
        response?: { data?: { res_data?: { message?: string; details?: unknown } } }
        message?: string
      }
      message.error(
        anyErr?.response?.data?.res_data?.message ??
          anyErr?.message ??
          'เพิ่มอุปกรณ์ไม่สำเร็จ',
      )
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
          Form: { labelColor: '#1F1F1F', labelFontSize: 14 },
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
        width={720}
        closable={{ 'aria-label': 'Custom Close Button' }}
        styles={{
          container: { padding: '32px 40px', borderRadius: 16 },
          mask: { background: 'rgba(0,0,0,0.55)' },
        }}
        title={
          <div className='flex items-center gap-3' style={{ color: '#111' }}>
            <TbDeviceCctv size={22} style={{ color: '#66AEFF' }} />
            <span style={{ fontSize: 20, fontWeight: 600, color: '#111' }}>เพิ่มข้อมูลอุปกรณ์</span>
          </div>
        }
      >
        <div
          className='mb-5 flex items-center justify-between'
          style={{ background: '#111111', borderRadius: 10, padding: '14px 20px' }}
        >
          <span style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 600 }}>
            {activePoint?.name ?? ''}
          </span>
          <span
            className='inline-flex items-center'
            style={{
              border: '1px solid #FCD116',
              color: '#FCD116',
              background: 'transparent',
              borderRadius: 999,
              padding: '4px 14px',
              fontSize: 13,
            }}
          >
            {activeRoute?.code}
          </span>
        </div>

        <Form<FormShape>
          form={form}
          layout='vertical'
          onFinish={handleFinish}
          requiredMark={false}
          disabled={createCamera.isPending}
        >
          <Form.Item
            label={labelReq('ชื่อกล้อง')}
            name='camera_name'
            rules={[{ required: true, message: 'กรุณาระบุชื่อกล้อง' }]}
          >
            <Input placeholder='กรุณาระบุชื่อกล้อง(รายละเอียดการติดตั้ง)...' />
          </Form.Item>
          <div className='grid grid-cols-2 gap-5'>
            <Form.Item
              label={labelReq('กม.ที่ / STA')}
              name='sta'
              rules={[{ required: true, message: 'กรุณาระบุ กม.ที่' }]}
            >
              <Input placeholder='เช่น 10+500' />
            </Form.Item>
            <Form.Item label={labelOpt('IP Address')} name='ip_address'>
              <Input placeholder='กรุณาระบุ IP Address...' />
            </Form.Item>
          </div>
          <Form.Item
            label={labelReq('URL HLS (.m3u8)')}
            name='hls_url'
            rules={[{ required: true, message: 'กรุณาระบุ URL HLS' }]}
          >
            <Input placeholder='กรุณาระบุ URL HLS (.m3u8)...' />
          </Form.Item>
          <div className='grid grid-cols-2 gap-5'>
            <Form.Item
              label={labelReq('Latitude')}
              name='latitude'
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
              label={labelReq('Longitude')}
              name='longitude'
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
          <Form.Item label={labelOpt('หมายเหตุ')} name='remark'>
            <Input.TextArea placeholder='กรุณาระบุหมายเหตุ...' rows={2} />
          </Form.Item>
          <div className='flex justify-end gap-3 mt-2'>
            <Button
              shape='round'
              onClick={onClose}
              disabled={createCamera.isPending}
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
              loading={createCamera.isPending}
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

export default React.memo<Props>(AddCCTVEquipmentModal)
